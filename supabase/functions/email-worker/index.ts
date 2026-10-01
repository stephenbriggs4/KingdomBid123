// email-worker: drains public.email_outbox through Resend, and serves the JSON
// unsubscribe endpoint (page lives in the app) and the Resend bounce/complaint webhook.
//
// Routes (last path segment):
//   POST /process       header x-worker-secret: EMAIL_WORKER_SECRET   body {"mode":"instant"|"digest"}
//   GET|POST /unsubscribe?u=<userId>&s=<signature>                      public, HMAC-protected
//   POST /webhook       Resend (Svix-signed)                             secret RESEND_WEBHOOK_SECRET
//
// The function is inert until RESEND_API_KEY and RESEND_FROM_EMAIL are set: /process then
// reports configured:false and leaves every queued email untouched.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "";
const PUBLIC_URL = (Deno.env.get("FAITHBID_PUBLIC_URL") || "").replace(/\/$/, "");
const WORKER_SECRET = Deno.env.get("EMAIL_WORKER_SECRET") || "";
const UNSUB_SECRET = Deno.env.get("EMAIL_UNSUB_SECRET") || "";
const WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET") || "";
const SUPPORT_EMAIL = Deno.env.get("FAITHBID_SUPPORT_EMAIL") || "support@faithbid.com";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const encoder = new TextEncoder();

const esc = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};
function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function unsubscribeParams(userId: string): Promise<string> {
  const sig = await hmacHex(UNSUB_SECRET, `unsub:${userId}`);
  return `u=${encodeURIComponent(userId)}&s=${sig}`;
}
// One-click endpoint used in the List-Unsubscribe header (mail clients POST here).
async function unsubscribeUrl(userId: string): Promise<string> {
  if (!UNSUB_SECRET || !SUPABASE_URL) return "";
  return `${SUPABASE_URL}/functions/v1/email-worker/unsubscribe?${await unsubscribeParams(userId)}`;
}
// Human-facing page inside the app (edge functions cannot serve HTML on the default domain).
async function unsubscribePageUrl(userId: string): Promise<string> {
  if (!UNSUB_SECRET || !PUBLIC_URL) return "";
  return `${PUBLIC_URL}/#unsubscribe?${await unsubscribeParams(userId)}`;
}

// ── Templates ───────────────────────────────────────────────────────────────
type Template = { heading: string; cta: string; path: string };
const TEMPLATES: Record<string, Template> = {
  new_bid: { heading: "You have a new proposal", cta: "Review proposal", path: "#my-projects" },
  invitation: { heading: "You have been invited to bid", cta: "View invitation", path: "#inbox" },
  new_message: { heading: "You have a new message", cta: "Open messages", path: "#inbox" },
  project_update: { heading: "A project you are on has an update", cta: "View update", path: "#inbox" },
  bid_declined: { heading: "An update on your proposal", cta: "See your proposals", path: "#my-work" },
  bid_accepted: { heading: "Your proposal was accepted", cta: "Open your project", path: "#my-work" },
  project_cancelled: { heading: "A project was closed", cta: "See your projects", path: "#my-work" },
  completion_requested: { heading: "Work is ready for your review", cta: "Review the work", path: "#my-projects" },
  completion_changes_requested: { heading: "Changes were requested on your work", cta: "See what changed", path: "#my-work" },
  project_completed: { heading: "A project was completed", cta: "View the project", path: "#my-projects" },
  review_prompt: { heading: "Leave a review", cta: "Write a review", path: "#reviews" },
};

function layout(opts: { heading: string; bodyHtml: string; ctaLabel?: string; ctaUrl?: string; unsubUrl?: string }) {
  const cta = opts.ctaLabel && opts.ctaUrl
    ? `<p style="margin:22px 0 0"><a href="${esc(opts.ctaUrl)}" style="display:inline-block;background:#1C2814;color:#fffdf8;text-decoration:none;border-radius:999px;padding:12px 20px;font-weight:700">${esc(opts.ctaLabel)}</a></p>`
    : "";
  const unsub = opts.unsubUrl
    ? `<p style="font-size:12px;line-height:1.6;color:#7d7363;margin:14px 0 0">You are receiving this because of activity on your FaithBid account. <a href="${esc(opts.unsubUrl)}" style="color:#74551f">Unsubscribe from these emails</a> or change what you receive in Settings.</p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#faf8f4;font-family:Arial,sans-serif;color:#1C2814"><div style="max-width:600px;margin:0 auto;padding:32px 20px"><div style="background:#fffdf8;border:1px solid #dfd5c2;border-radius:18px;padding:28px"><div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8a6729;margin-bottom:10px">FaithBid</div><h1 style="font-size:22px;line-height:1.25;margin:0 0 14px">${esc(opts.heading)}</h1>${opts.bodyHtml}${cta}</div>${unsub}<p style="font-size:12px;color:#7d7363;margin:10px 0 0">FaithBid provides marketplace technology only. Questions? <a href="mailto:${esc(SUPPORT_EMAIL)}" style="color:#74551f">${esc(SUPPORT_EMAIL)}</a></p></div></body></html>`;
}

function itemBody(payload: Record<string, unknown>) {
  const body = String(payload?.body ?? "").trim();
  return body ? `<p style="font-size:15px;line-height:1.65;color:#5d5548;margin:0">${esc(body)}</p>` : "";
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function send(to: string, subject: string, html: string, unsubUrl: string, idempotencyKey: string) {
  const headers: Record<string, string> = {};
  if (unsubUrl) {
    headers["List-Unsubscribe"] = `<${unsubUrl}>, <mailto:${SUPPORT_EMAIL}?subject=unsubscribe>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${RESEND_API_KEY}`,
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
    },
    body: JSON.stringify({ from: RESEND_FROM_EMAIL, to: [to], subject, html, headers }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`provider ${response.status}: ${JSON.stringify(data).slice(0, 200)}`);
  return String(data?.id || "");
}

async function recipient(userId: string): Promise<string | null> {
  const { data } = await admin.auth.admin.getUserById(userId);
  const email = data?.user?.email?.toLowerCase() || "";
  if (!email) return null;
  const { data: suppressed } = await admin.from("email_suppressions").select("email").eq("email", email).maybeSingle();
  return suppressed ? null : email;
}

type OutboxRow = {
  id: string;
  user_id: string;
  template: string;
  subject: string;
  payload: Record<string, unknown>;
  attempts: number;
  digest: boolean;
};

async function claimRows(digest: boolean, limit: number, workerId: string): Promise<OutboxRow[]> {
  const { data, error } = await admin.rpc("kb_claim_email_outbox_v1", {
    p_digest: digest,
    p_limit: limit,
    p_worker_id: workerId,
    p_lease_seconds: 300,
  });
  if (error) throw error;
  return (data || []) as OutboxRow[];
}

async function renewOwnedRows(rows: OutboxRow[], workerId: string): Promise<OutboxRow[]> {
  if (!rows.length) return [];
  const { data, error } = await admin.rpc("kb_renew_email_outbox_lease_v1", {
    p_ids: rows.map((row) => row.id),
    p_worker_id: workerId,
    p_lease_seconds: 300,
  });
  if (error) throw error;
  const owned = new Set((data || []).map((row: { id: string }) => row.id));
  return rows.filter((row) => owned.has(row.id));
}

async function markFailed(row: Pick<OutboxRow, "id" | "attempts">, workerId: string, error: unknown) {
  const exhausted = row.attempts >= 5;
  await admin.from("email_outbox").update({
    status: exhausted ? "failed" : "pending",
    last_error: String(error instanceof Error ? error.message : error).slice(0, 500),
    send_after: new Date(Date.now() + Math.min(row.attempts, 4) * 15 * 60 * 1000).toISOString(),
    worker_id: null,
    claimed_at: null,
    claim_expires_at: null,
  }).eq("id", row.id).eq("worker_id", workerId);
}

async function processInstant() {
  const workerId = crypto.randomUUID();
  const rows = await claimRows(false, 25, workerId);
  let sent = 0, skipped = 0, failed = 0;
  for (const claimedRow of rows) {
    const [row] = await renewOwnedRows([claimedRow], workerId);
    if (!row) continue;
    try {
      const to = await recipient(row.user_id);
      const template = TEMPLATES[row.template];
      if (!to || !template) {
        await admin.from("email_outbox").update({
          status: "skipped",
          last_error: !to ? "no deliverable recipient" : "unknown template",
          worker_id: null, claimed_at: null, claim_expires_at: null,
        }).eq("id", row.id).eq("worker_id", workerId);
        skipped++;
        continue;
      }
      const unsub = await unsubscribeUrl(row.user_id);
      const unsubPage = await unsubscribePageUrl(row.user_id);
      const html = layout({ heading: template.heading, bodyHtml: itemBody(row.payload), ctaLabel: template.cta, ctaUrl: PUBLIC_URL ? `${PUBLIC_URL}/${template.path}` : "", unsubUrl: unsubPage || unsub });
      const messageId = await send(to, row.subject, html, unsub, `faithbid-outbox/${row.id}`);
      await admin.from("email_outbox").update({
        status: "sent", sent_at: new Date().toISOString(), provider_message_id: messageId || null,
        last_error: null, worker_id: null, claimed_at: null, claim_expires_at: null,
      }).eq("id", row.id).eq("worker_id", workerId);
      sent++;
    } catch (error) {
      await markFailed(row, workerId, error);
      failed++;
    }
  }
  return { sent, skipped, failed };
}

async function processDigest() {
  const workerId = crypto.randomUUID();
  const claimedRows = await claimRows(true, 200, workerId);
  const userIds = Array.from(new Set(claimedRows.map((row) => row.user_id))).slice(0, 50);
  let sent = 0, skipped = 0, failed = 0;
  for (const userId of userIds) {
    const rows = await renewOwnedRows(claimedRows.filter((row) => row.user_id === userId), workerId);
    if (!rows.length) continue;
    const ids = rows.map((row) => row.id);
    try {
      const to = await recipient(userId);
      if (!to) {
        await admin.from("email_outbox").update({
          status: "skipped", last_error: "no deliverable recipient",
          worker_id: null, claimed_at: null, claim_expires_at: null,
        }).in("id", ids).eq("worker_id", workerId);
        skipped += ids.length;
        continue;
      }
      const unsub = await unsubscribeUrl(userId);
      const unsubPage = await unsubscribePageUrl(userId);
      const items = rows.map((row: { template: string; subject: string; payload: Record<string, unknown> }) =>
        `<li style="margin:0 0 10px"><strong>${esc(row.subject)}</strong>${row.payload?.body ? `<br><span style="color:#5d5548">${esc(String(row.payload.body))}</span>` : ""}</li>`).join("");
      const html = layout({
        heading: `Your FaithBid summary (${rows.length} update${rows.length === 1 ? "" : "s"})`,
        bodyHtml: `<ul style="padding-left:18px;margin:0;font-size:15px;line-height:1.55">${items}</ul>`,
        ctaLabel: "Open FaithBid", ctaUrl: PUBLIC_URL ? `${PUBLIC_URL}/#inbox` : "", unsubUrl: unsubPage || unsub,
      });
      const digestIdentity = await sha256Hex(ids.slice().sort().join(","));
      const messageId = await send(
        to,
        `Your FaithBid summary: ${rows.length} update${rows.length === 1 ? "" : "s"}`,
        html,
        unsub,
        `faithbid-digest/${digestIdentity}`,
      );
      await admin.from("email_outbox").update({
        status: "sent", sent_at: new Date().toISOString(), provider_message_id: messageId || null,
        last_error: null, worker_id: null, claimed_at: null, claim_expires_at: null,
      }).in("id", ids).eq("worker_id", workerId);
      sent += ids.length;
    } catch (error) {
      for (const row of rows) await markFailed(row, workerId, error);
      failed += ids.length;
    }
  }
  return { sent, skipped, failed };
}

// ── Unsubscribe ─────────────────────────────────────────────────────────────
// JSON only. GET validates the link; POST performs the unsubscribe (used both by the
// in-app page and by mail clients' one-click List-Unsubscribe-Post).
async function handleUnsubscribe(req: Request, url: URL) {
  const userId = url.searchParams.get("u") || "";
  const sig = url.searchParams.get("s") || "";
  if (!UNSUB_SECRET) return json(503, { ok: false, reason: "unsubscribe_not_configured" });
  const expected = await hmacHex(UNSUB_SECRET, `unsub:${userId}`);
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !safeEqual(sig, expected)) return json(400, { ok: false, reason: "invalid_link" });
  if (req.method === "GET") return json(200, { ok: true, valid: true }); // GET never changes anything
  if (req.method !== "POST") return json(405, { ok: false });
  const { error } = await admin.from("notification_prefs").upsert({ user_id: userId, email_enabled: false, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return json(500, { ok: false, reason: "update_failed" });
  return json(200, { ok: true, unsubscribed: true });
}

// ── Resend webhook (Svix signatures) ────────────────────────────────────────
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
async function verifySvix(req: Request, rawBody: string): Promise<boolean> {
  const id = req.headers.get("svix-id") || "";
  const timestamp = req.headers.get("svix-timestamp") || "";
  const signatures = req.headers.get("svix-signature") || "";
  if (!WEBHOOK_SECRET || !id || !timestamp || !signatures) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false;
  const secretBytes = base64ToBytes(WEBHOOK_SECRET.replace(/^whsec_/, ""));
  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(`${id}.${timestamp}.${rawBody}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(signed)));
  return signatures.split(" ").some((part) => safeEqual(part.replace(/^v1,/, ""), expected));
}
async function handleWebhook(req: Request) {
  const raw = await req.text();
  if (!WEBHOOK_SECRET) return json(503, { ok: false, reason: "webhook_not_configured" });
  if (!(await verifySvix(req, raw))) return json(401, { ok: false, reason: "bad_signature" });
  let event: { type?: string; data?: { to?: string[]; email_id?: string } } = {};
  try { event = JSON.parse(raw); } catch { return json(400, { ok: false }); }
  const reason = event.type === "email.bounced" ? "bounced" : event.type === "email.complained" ? "complaint" : null;
  if (reason) {
    for (const address of event.data?.to || []) {
      const email = String(address).trim().toLowerCase();
      if (email) await admin.from("email_suppressions").upsert({ email, reason, detail: event.type || null }, { onConflict: "email", ignoreDuplicates: true });
    }
  }
  return json(200, { ok: true });
}

serve(async (req: Request) => {
  if (!SUPABASE_URL || !SERVICE_KEY) return json(500, { ok: false, reason: "server_not_configured" });
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const url = new URL(req.url);
  const route = url.pathname.replace(/\/+$/, "").split("/").pop() || "";

  if (route === "unsubscribe") return handleUnsubscribe(req, url);
  if (route === "webhook") return req.method === "POST" ? handleWebhook(req) : json(405, { ok: false });

  if (route === "process") {
    if (req.method !== "POST") return json(405, { ok: false });
    if (!WORKER_SECRET || !safeEqual(req.headers.get("x-worker-secret") || "", WORKER_SECRET)) return json(401, { ok: false, reason: "unauthorized" });
    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) return json(200, { ok: true, configured: false, processed: 0 });
    const body = await req.json().catch(() => ({}));
    const result = body?.mode === "digest" ? await processDigest() : await processInstant();
    return json(200, { ok: true, configured: true, ...result });
  }
  return json(404, { ok: false, reason: "not_found" });
});
