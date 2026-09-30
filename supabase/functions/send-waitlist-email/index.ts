// send-waitlist-email: confirmation email for a waitlist application.
// Public (verify_jwt = false) because visitors are not signed in, so it is deliberately strict:
//   * only sends to an address that is actually on the waitlist for that role,
//   * at most 5 sends per address+role and at least 2 minutes apart,
//   * never sends to a suppressed (unsubscribed / bounced / complained) address,
//   * does nothing until RESEND_API_KEY and RESEND_FROM_EMAIL are configured.
// Public responses are deliberately opaque so callers cannot enumerate waitlist,
// suppression, provider, or send-limit state.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "";
const PUBLIC_URL = (Deno.env.get("FAITHBID_PUBLIC_URL") || "").replace(/\/$/, "");
const SUPPORT_EMAIL = Deno.env.get("FAITHBID_SUPPORT_EMAIL") || "support@faithbid.com";
const ALLOWED_ORIGINS = new Set(
  (Deno.env.get("FAITHBID_ALLOWED_ORIGINS") || "")
    .split(",").map((value) => value.trim()).filter(Boolean),
);
try { if (PUBLIC_URL) ALLOWED_ORIGINS.add(new URL(PUBLIC_URL).origin); } catch { /* invalid deployment URL remains denied */ }

const MAX_SENDS = 5;
const MIN_GAP_MS = 2 * 60 * 1000;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

function requestOrigin(req: Request): string {
  return req.headers.get("origin") || "";
}
function originAllowed(req: Request): boolean {
  return ALLOWED_ORIGINS.has(requestOrigin(req));
}
function cors(req: Request): HeadersInit {
  const origin = requestOrigin(req);
  return {
    ...(ALLOWED_ORIGINS.has(origin) ? { "access-control-allow-origin": origin } : {}),
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    vary: "Origin",
  };
}
function json(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(req), "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
const esc = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const clean = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const accepted = (req: Request) => json(req, { accepted: true }, 202);

function buildHtml(opts: { role: "church" | "vendor"; name: string; org: string; launchLabel: string; referralUrl: string }) {
  const audience = opts.role === "vendor" ? "vendor" : "church";
  const referral = opts.referralUrl
    ? `<p style="font-size:15px;line-height:1.65;color:#5d5548;margin:0 0 16px">Know another ${audience === "vendor" ? "vendor or church" : "church or vendor"} who should join? Share your personal link: <a href="${esc(opts.referralUrl)}" style="color:#74551f">${esc(opts.referralUrl)}</a></p>`
    : "";
  const launch = opts.launchLabel
    ? `Our first Dallas pilot is planned for ${esc(opts.launchLabel)}, and access opens in measured stages. Being on the waitlist holds your place; it does not guarantee admission or a specific date.`
    : "Access opens in measured stages. Being on the waitlist holds your place; it does not guarantee admission or a specific date.";
  return `<!doctype html><html><body style="margin:0;background:#faf8f4;font-family:Arial,sans-serif;color:#1C2814"><div style="max-width:600px;margin:0 auto;padding:32px 20px"><div style="background:#fffdf8;border:1px solid #dfd5c2;border-radius:18px;padding:28px"><div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8a6729;margin-bottom:10px">FaithBid early access</div><h1 style="font-size:24px;line-height:1.2;margin:0 0 14px">You are on the list${opts.name ? `, ${esc(opts.name)}` : ""}.</h1><p style="font-size:15px;line-height:1.65;color:#5d5548;margin:0 0 16px">Thank you for applying${opts.org ? ` on behalf of ${esc(opts.org)}` : ""}. ${launch}</p><p style="font-size:15px;line-height:1.65;color:#5d5548;margin:0 0 16px">We will email you when there is something for you to do. You do not need to take any other step right now.</p>${referral}</div><p style="font-size:12px;line-height:1.6;color:#7d7363;margin:14px 0 0">This is a service-related message about your FaithBid signup. FaithBid provides marketplace technology only. Questions? <a href="mailto:${esc(SUPPORT_EMAIL)}" style="color:#74551f">${esc(SUPPORT_EMAIL)}</a></p></div></body></html>`;
}

serve(async (req: Request) => {
  if (!originAllowed(req)) return json(req, { accepted: false }, 403);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, { accepted: false }, 405);
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("send-waitlist-email server not configured");
    return accepted(req);
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const email = clean((body as Record<string, unknown>).email, 254).toLowerCase();
  const role = (body as Record<string, unknown>).role === "vendor" ? "vendor" : "church";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return accepted(req);

  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    console.warn("send-waitlist-email provider not configured");
    return accepted(req);
  }

  // Relay guard: the address must be an actual waitlist application for this role.
  const { data: entry } = await admin.from("waitlist").select("email,role,full_name,org_name,referral_code")
    .ilike("email", email).eq("role", role).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!entry) return accepted(req);

  const { data: suppressed } = await admin.from("email_suppressions").select("email").eq("email", email).maybeSingle();
  if (suppressed) return accepted(req);

  const { data: log } = await admin.from("waitlist_email_log").select("send_count,last_sent_at").eq("email", email).eq("role", role).maybeSingle();
  if (log) {
    if (log.send_count >= MAX_SENDS) return accepted(req);
    const elapsed = log.last_sent_at ? Date.now() - new Date(log.last_sent_at).getTime() : Infinity;
    if (elapsed < MIN_GAP_MS) return accepted(req);
  }

  // Claim the send before calling the provider so parallel requests cannot double-send.
  const claimedAt = new Date().toISOString();
  if (!log) {
    const { error } = await admin.from("waitlist_email_log").insert({ email, role, send_count: 1, last_sent_at: claimedAt });
    if (error) return accepted(req);
  } else {
    let claim = admin.from("waitlist_email_log").update({ send_count: log.send_count + 1, last_sent_at: claimedAt }).eq("email", email).eq("role", role).eq("send_count", log.send_count);
    const { data: claimed } = await claim.select("email").maybeSingle();
    if (!claimed) return accepted(req);
  }
  const restore = async () => {
    if (!log) await admin.from("waitlist_email_log").delete().eq("email", email).eq("role", role).eq("last_sent_at", claimedAt);
    else await admin.from("waitlist_email_log").update({ send_count: log.send_count, last_sent_at: log.last_sent_at }).eq("email", email).eq("role", role).eq("last_sent_at", claimedAt);
  };

  const referralUrl = entry.referral_code && PUBLIC_URL ? `${PUBLIC_URL}/?ref=${encodeURIComponent(entry.referral_code)}` : "";
  const html = buildHtml({
    role,
    name: clean(entry.full_name, 80).split(" ")[0] || "",
    org: clean(entry.org_name, 120),
    launchLabel: clean((body as Record<string, unknown>).launchLabel, 40),
    referralUrl,
  });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: RESEND_FROM_EMAIL, to: [email], subject: "You are on the FaithBid early access list", html }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("send-waitlist-email provider failure", response.status, JSON.stringify(data).slice(0, 200));
      await restore();
      return accepted(req);
    }
    await admin.from("waitlist_email_log").update({ last_message_id: String(data?.id || "") || null }).eq("email", email).eq("role", role);
    return accepted(req);
  } catch (error) {
    console.error("send-waitlist-email request failed", error instanceof Error ? error.message : "unknown");
    await restore();
    return accepted(req);
  }
});
