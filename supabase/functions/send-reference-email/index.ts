import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || Deno.env.get("REFERENCE_FROM_EMAIL") || "";
const REFERENCE_SURVEY_BASE_URL = (Deno.env.get("REFERENCE_SURVEY_BASE_URL") || Deno.env.get("FAITHBID_PUBLIC_URL") || "").replace(/\/$/, "");

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function cors(req: Request): HeadersInit {
  const origin = req.headers.get("origin") || "*";
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "vary": "Origin",
  };
}

function json(req: Request, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors(req),
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function text(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildSurveyUrl(token: string): string {
  if (!REFERENCE_SURVEY_BASE_URL) return "";
  return `${REFERENCE_SURVEY_BASE_URL}/#/ref/${encodeURIComponent(token)}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { delivered: false, reason: "method_not_allowed" });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(req, 500, { delivered: false, reason: "server_not_configured" });
  }

  const authHeader = req.headers.get("authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json(req, 401, { delivered: false, reason: "not_authenticated" });

  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  const user = userData?.user;
  if (userError || !user?.id) return json(req, 401, { delivered: false, reason: "not_authenticated" });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const token = text((body as Record<string, unknown>)?.token, 128);
  const referenceId = text((body as Record<string, unknown>)?.reference_id, 64);
  const lookupMode = referenceId ? "reference_id" : "token";

  if (!referenceId && !token) {
    return json(req, 400, { delivered: false, reason: "reference_locator_required" });
  }

  let refQuery = admin
    .from("vendor_references")
    .select("id,vendor_id,client_name,client_email,project_context,token,status,sent_at,completed_at,expires_at,purpose,verification_id");

  if (referenceId) {
    refQuery = refQuery.eq("id", referenceId);
  } else {
    // The legacy token locator is intentionally restricted to past-client
    // references. Faith-community bearer tokens are never accepted as a
    // caller-supplied locator by this endpoint.
    refQuery = refQuery.eq("token", token).eq("purpose", "past_client");
  }

  const { data: ref, error: refError } = await refQuery.maybeSingle();

  if (refError || !ref) return json(req, 404, { delivered: false, reason: "reference_not_found" });
  if (ref.vendor_id !== user.id) return json(req, 403, { delivered: false, reason: "not_reference_owner" });

  const purpose = String(ref.purpose || "past_client").toLowerCase();

  if (purpose === "faith_community" && lookupMode !== "reference_id") {
    return json(req, 400, { delivered: false, reason: "faith_reference_requires_reference_id" });
  }

  if (purpose === "faith_community" && !ref.verification_id) {
    return json(req, 409, { delivered: false, reason: "faith_reference_missing_verification" });
  }

  if (String(ref.status || "").toLowerCase() === "cancelled") {
    return json(req, 409, { delivered: false, reason: "reference_cancelled" });
  }

  if (ref.completed_at || String(ref.status || "").toLowerCase() === "completed") {
    return json(req, 409, { delivered: false, reason: "reference_already_completed" });
  }

  const expiresAtMs = new Date(ref.expires_at || "").getTime();
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    return json(req, 409, { delivered: false, reason: "reference_expired" });
  }

  const resendCooldownMs = purpose === "faith_community" ? 24 * 60 * 60 * 1000 : 30_000;

  if (ref.sent_at) {
    const elapsed = Date.now() - new Date(ref.sent_at).getTime();
    if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < resendCooldownMs) {
      return json(req, 429, {
        delivered: false,
        reason: "resend_too_soon",
        retry_after_seconds: Math.ceil((resendCooldownMs - elapsed) / 1000),
      });
    }
  }

  const { data: vendor } = await admin
    .from("vendors")
    .select("name")
    .eq("user_id", user.id)
    .maybeSingle();

  let verification: Record<string, unknown> | null = null;
  if (purpose === "faith_community") {
    const { data: verificationData, error: verificationError } = await admin
      .from("vendor_verifications")
      .select("id,user_id,vendor_id,ref_church_name,ref_relationship")
      .eq("id", ref.verification_id)
      .maybeSingle();

    if (verificationError || !verificationData) {
      return json(req, 409, { delivered: false, reason: "faith_verification_not_found" });
    }

    if (verificationData.user_id !== user.id) {
      return json(req, 403, { delivered: false, reason: "faith_verification_owner_mismatch" });
    }

    verification = verificationData as Record<string, unknown>;
  }

  const surveyUrl = buildSurveyUrl(ref.token);
  if (!surveyUrl) return json(req, 503, { delivered: false, reason: "public_url_not_configured" });
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    return json(req, 503, { delivered: false, reason: "email_provider_not_configured" });
  }

  const clientName = text(ref.client_name, 160) || "there";
  const vendorName = text(vendor?.name, 160) || "a FaithBid vendor";

  let subject = `${vendorName} requested a ministry reference`;
  let html = "";

  if (purpose === "faith_community") {
    const communityName = text(verification?.ref_church_name, 200);
    const relationship = text(verification?.ref_relationship, 500);
    const communityHtml = communityName
      ? `<p style="margin:0 0 10px;color:#5d5548"><strong>Christian community:</strong> ${esc(communityName)}</p>`
      : "";
    const relationshipHtml = relationship
      ? `<p style="margin:0 0 16px;color:#5d5548"><strong>Relationship provided by the applicant:</strong> ${esc(relationship)}</p>`
      : "";

    subject = `${vendorName} requested a FaithBid Christian-community reference`;
    html = `<!doctype html><html><body style="margin:0;background:#faf8f4;font-family:Arial,sans-serif;color:#1C2814"><div style="max-width:600px;margin:0 auto;padding:32px 20px"><div style="background:#fffdf8;border:1px solid #dfd5c2;border-radius:18px;padding:28px"><div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8a6729;margin-bottom:10px">FaithBid private reference request</div><h1 style="font-size:24px;line-height:1.2;margin:0 0 14px">Hi ${esc(clientName)},</h1><p style="font-size:15px;line-height:1.65;color:#5d5548;margin:0 0 16px">${esc(vendorName)} listed you as a Christian-community reference as part of an application for Faith Verified status on FaithBid.</p>${communityHtml}${relationshipHtml}<p style="font-size:15px;line-height:1.65;color:#5d5548;margin:0 0 16px">FaithBid will ask a few short questions about how you know the applicant, their Christian-community connection, their character and integrity, and whether you would feel comfortable recommending them to churches.</p><p style="font-size:14px;line-height:1.65;color:#5d5548;margin:0 0 20px"><strong>Your response is reviewed privately by FaithBid.</strong> It is not displayed publicly or shown verbatim to the applicant by default.</p><a href="${esc(surveyUrl)}" style="display:inline-block;background:#1C2814;color:#fffdf8;text-decoration:none;border-radius:999px;padding:12px 18px;font-weight:700">Complete private reference</a><p style="font-size:12px;line-height:1.6;color:#7d7363;margin:20px 0 0">This link is unique to this reference request. Please do not forward it.</p></div></div></body></html>`;
  } else {
    const projectContext = text(ref.project_context, 500);
    const contextHtml = projectContext
      ? `<p style="margin:0 0 16px;color:#5d5548"><strong>Work context:</strong> ${esc(projectContext)}</p>`
      : "";

    html = `<!doctype html><html><body style="margin:0;background:#faf8f4;font-family:Arial,sans-serif;color:#1C2814"><div style="max-width:600px;margin:0 auto;padding:32px 20px"><div style="background:#fffdf8;border:1px solid #dfd5c2;border-radius:18px;padding:28px"><div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8a6729;margin-bottom:10px">FaithBid reference request</div><h1 style="font-size:24px;line-height:1.2;margin:0 0 14px">Hi ${esc(clientName)},</h1><p style="font-size:15px;line-height:1.65;color:#5d5548;margin:0 0 16px">${esc(vendorName)} listed you as a ministry reference. FaithBid uses a short structured response to help churches understand a vendor's character, reliability, and faith alignment.</p>${contextHtml}<a href="${esc(surveyUrl)}" style="display:inline-block;background:#1C2814;color:#fffdf8;text-decoration:none;border-radius:999px;padding:12px 18px;font-weight:700">Complete the reference</a><p style="font-size:12px;line-height:1.6;color:#7d7363;margin:20px 0 0">This link is unique to this reference request. Please do not forward it.</p></div></div></body></html>`;
  }

  // Claim the send before calling the provider. The conditional UPDATE is
  // re-checked after PostgreSQL obtains the row lock, so only one of several
  // parallel requests can win. This prevents duplicate emails and provider cost.
  const previousStatus = String(ref.status || "pending");
  const previousSentAt = ref.sent_at || null;
  // A provider timeout can happen after Resend accepted the email. Derive the
  // idempotency key from durable pre-claim state so restoring and retrying the
  // same logical send cannot create a duplicate delivery.
  const idempotencyKey = `faithbid-reference/${ref.id}/${previousSentAt || "first"}`;
  const claimedAt = new Date().toISOString();
  let claimQuery = admin
    .from("vendor_references")
    .update({ status: "sent", sent_at: claimedAt })
    .eq("id", ref.id)
    .eq("vendor_id", user.id)
    .is("completed_at", null)
    .neq("status", "cancelled");

  claimQuery = previousSentAt
    ? claimQuery.eq("sent_at", previousSentAt)
    : claimQuery.is("sent_at", null);

  const { data: claimedReference, error: claimError } = await claimQuery
    .select("id")
    .maybeSingle();

  if (claimError) {
    console.error("send-reference-email claim failed", {
      reference_id: ref.id,
      purpose,
      error: claimError.message,
    });
    return json(req, 500, { delivered: false, reason: "send_claim_failed" });
  }

  if (!claimedReference) {
    return json(req, 429, {
      delivered: false,
      reason: "resend_too_soon",
      retry_after_seconds: Math.ceil(resendCooldownMs / 1000),
    });
  }

  const restoreClaim = async () => {
    const { error: restoreError } = await admin
      .from("vendor_references")
      .update({ status: previousStatus, sent_at: previousSentAt })
      .eq("id", ref.id)
      .eq("vendor_id", user.id)
      .eq("sent_at", claimedAt);

    if (restoreError) {
      console.error("send-reference-email claim restore failed", {
        reference_id: ref.id,
        purpose,
        error: restoreError.message,
      });
    }
  };

  let resendResponse: Response;
  try {
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${RESEND_API_KEY}`,
        "content-type": "application/json",
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [ref.client_email],
        subject,
        html,
      }),
    });
  } catch (providerError) {
    await restoreClaim();
    console.error("send-reference-email provider request failed", {
      reference_id: ref.id,
      purpose,
      error: providerError instanceof Error ? providerError.message : "unknown",
    });
    return json(req, 502, { delivered: false, reason: "provider_failed" });
  }

  const providerBody = await resendResponse.json().catch(() => ({}));
  if (!resendResponse.ok) {
    console.error("send-reference-email provider failure", {
      status: resendResponse.status,
      body: providerBody,
      reference_id: ref.id,
      purpose,
    });
    await restoreClaim();
    return json(req, 502, { delivered: false, reason: "provider_failed" });
  }

  // The atomic pre-send claim is now the durable delivery timestamp.
  const sentAt = claimedAt;

  return json(req, 200, {
    delivered: true,
    reason: null,
    sent_at: sentAt,
    provider_id: providerBody?.id || null,
    purpose,
  });
});
