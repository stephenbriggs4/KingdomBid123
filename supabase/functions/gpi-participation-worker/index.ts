import { createClient } from "npm:@supabase/supabase-js@2.100.0";

type JsonRecord = Record<string, unknown>;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || Deno.env.get("REFERENCE_FROM_EMAIL") || "";
const PUBLIC_URL = (Deno.env.get("FAITHBID_PUBLIC_URL") || "").replace(/\/$/, "");
const WORKER_TOKEN_HASH = Deno.env.get("GPI_PARTICIPATION_WORKER_TOKEN_HASH") || "";
const MAX_BODY_BYTES = 2_048;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

function response(status: number, body: JsonRecord): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff",
    },
  });
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

function integer(value: unknown, fallback: number, minimum: number, maximum: number): number {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || Number(value) < minimum || Number(value) > maximum) {
    throw new Error("invalid_integer");
  }
  return Number(value);
}

async function rpc(name: string, args: JsonRecord): Promise<unknown> {
  const { data, error } = await admin.rpc(name, args);
  if (error) throw new Error(`${name}:${error.code || "rpc_failed"}`);
  return data;
}

async function mark(
  deliveryId: string,
  workerId: string,
  result: "sent" | "failed" | "canceled",
  providerMessageId: string | null,
  errorCode: string | null,
): Promise<void> {
  await rpc("gpi_service_mark_participation_notification", {
    p_delivery_id: deliveryId,
    p_worker_id: workerId,
    p_result: result,
    p_provider_message_id: providerMessageId,
    p_error_code: errorCode,
  });
}

function emailHtml(title: string, organization: string, startsAt: string): string {
  const when = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
    timeZoneName: "short",
  }).format(new Date(startsAt));
  const manageUrl = `${PUBLIC_URL}/#/get-plugged-in`;
  return `<!doctype html><html><body style="margin:0;background:#f7f3ea;font-family:Arial,sans-serif;color:#1c2814"><div style="max-width:620px;margin:0 auto;padding:32px 20px"><div style="background:#fffdf8;border:1px solid #ddd3c1;border-radius:18px;padding:28px"><div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#87672f;margin-bottom:10px">FaithBid recurring update</div><h1 style="font-size:26px;line-height:1.2;margin:0 0 14px">The next gathering is coming up.</h1><p style="font-size:15px;line-height:1.65;color:#5d6659;margin:0 0 14px"><strong>${escapeHtml(title)}</strong><br>${escapeHtml(organization)}</p><p style="font-size:18px;line-height:1.5;color:#294228;margin:0 0 20px"><strong>${escapeHtml(when)}</strong></p><a href="${escapeHtml(manageUrl)}" style="display:inline-block;background:#20331f;color:#fffdf8;text-decoration:none;border-radius:999px;padding:12px 18px;font-weight:700">Open My Requests</a><p style="font-size:12px;line-height:1.6;color:#7d8178;margin:20px 0 0">You chose recurring updates after confirming this connection. This email does not record attendance or create membership. Pause or stop updates any time in My Requests.</p></div></div></body></html>`;
}

Deno.serve(async (request: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  if (request.method !== "POST") return response(405, { ok: false, code: "METHOD_NOT_ALLOWED", request_id: requestId });

  const suppliedToken = request.headers.get("x-faithbid-worker-token") || "";
  const suppliedHash = suppliedToken ? await sha256Hex(suppliedToken) : "";
  if (!suppliedToken || !constantTimeEqual(suppliedHash, WORKER_TOKEN_HASH)) {
    return response(401, { ok: false, code: "UNAUTHORIZED", request_id: requestId });
  }

  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return response(413, { ok: false, code: "BODY_TOO_LARGE", request_id: requestId });
    }
    const body = JSON.parse(raw || "{}") as JsonRecord;
    const allowedKeys = new Set(["action", "dry_run", "batch_limit", "horizon_hours"]);
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !allowedKeys.has(key))) {
      return response(400, { ok: false, code: "INVALID_REQUEST", request_id: requestId });
    }
    if (body.action !== "run" || (body.dry_run !== undefined && typeof body.dry_run !== "boolean")) {
      return response(400, { ok: false, code: "INVALID_REQUEST", request_id: requestId });
    }

    const configured = Boolean(SUPABASE_URL && SERVICE_ROLE_KEY && RESEND_API_KEY && RESEND_FROM_EMAIL && PUBLIC_URL && WORKER_TOKEN_HASH);
    if (body.dry_run === true) {
      return response(configured ? 200 : 503, {
        ok: configured,
        dry_run: true,
        provider_configured: Boolean(RESEND_API_KEY && RESEND_FROM_EMAIL),
        public_url_configured: Boolean(PUBLIC_URL),
        database_configured: Boolean(SUPABASE_URL && SERVICE_ROLE_KEY),
        worker_token_configured: Boolean(WORKER_TOKEN_HASH),
        request_id: requestId,
      });
    }
    if (!configured) return response(503, { ok: false, code: "WORKER_NOT_CONFIGURED", request_id: requestId });

    const batchLimit = integer(body.batch_limit, 25, 1, 100);
    const horizonHours = integer(body.horizon_hours, 168, 1, 744);
    const workerId = crypto.randomUUID();
    const reconciled = Number(await rpc("gpi_service_reconcile_participation_eligibility", { p_limit: 500 }) || 0);
    const queued = Number(await rpc("gpi_service_queue_participation_notifications", {
      p_now: new Date().toISOString(),
      p_horizon: `${horizonHours} hours`,
      p_limit: 500,
    }) || 0);
    const claims = await rpc("gpi_service_claim_participation_notifications", { p_worker_id: workerId, p_limit: batchLimit });
    const rows = Array.isArray(claims) ? claims as JsonRecord[] : [];
    const summary = { claimed: rows.length, sent: 0, failed: 0, canceled: 0 };

    for (const claim of rows) {
      const deliveryId = String(claim.delivery_id || "");
      try {
        const prepared = await rpc("gpi_service_prepare_participation_send", { p_delivery_id: deliveryId, p_worker_id: workerId }) as JsonRecord;
        if (prepared?.eligible !== true) {
          summary.canceled += 1;
          continue;
        }
        const profileId = String(prepared.seeker_profile_id || "");
        const opportunityId = String(prepared.opportunity_id || "");
        const startsAt = String(prepared.starts_at || "");
        const { data: userData, error: userError } = await admin.auth.admin.getUserById(profileId);
        const email = userData?.user?.email || "";
        if (userError || !email || !userData?.user?.email_confirmed_at) {
          await mark(deliveryId, workerId, "canceled", null, "account_email_unavailable");
          summary.canceled += 1;
          continue;
        }
        const { data: opportunity, error: opportunityError } = await admin
          .from("gpi_opportunities").select("title,organization_id").eq("id", opportunityId).maybeSingle();
        if (opportunityError || !opportunity) throw new Error("opportunity_unavailable");
        const { data: organization } = await admin
          .from("gpi_organizations").select("name").eq("id", opportunity.organization_id).maybeSingle();
        const title = String(opportunity.title || "Recurring gathering").slice(0, 160);
        const organizationName = String(organization?.name || "FaithBid host").slice(0, 160);
        const provider = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { authorization: `Bearer ${RESEND_API_KEY}`, "content-type": "application/json" },
          body: JSON.stringify({
            from: RESEND_FROM_EMAIL,
            to: [email],
            subject: `Your next ${title} gathering is coming up`,
            html: emailHtml(title, organizationName, startsAt),
          }),
        });
        const providerBody = await provider.json().catch(() => ({} as JsonRecord));
        if (!provider.ok || typeof providerBody?.id !== "string") {
          await mark(deliveryId, workerId, "failed", null, `resend_${provider.status}`);
          summary.failed += 1;
          continue;
        }
        await mark(deliveryId, workerId, "sent", providerBody.id, null);
        summary.sent += 1;
      } catch (error) {
        console.error("gpi-participation-worker delivery failed", { request_id: requestId, delivery_id: deliveryId, code: String((error as Error)?.message || "worker_error").slice(0, 120) });
        try { await mark(deliveryId, workerId, "failed", null, "worker_error"); } catch { /* claim recovery occurs on a later reconciliation pass */ }
        summary.failed += 1;
      }
    }

    return response(200, { ok: true, request_id: requestId, reconciled, queued, ...summary });
  } catch (error) {
    const invalid = (error as Error)?.message === "invalid_integer";
    console.error("gpi-participation-worker run failed", { request_id: requestId, code: String((error as Error)?.message || "worker_failed").slice(0, 120) });
    return response(invalid ? 400 : 500, { ok: false, code: invalid ? "INVALID_REQUEST" : "WORKER_FAILED", request_id: requestId });
  }
});


