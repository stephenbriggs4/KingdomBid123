/**
 * FaithBid â€” Stage 6A1 corrected authentication handling
 * Trusted waitlist-invitation Edge Function
 *
 * Intended location:
 *   supabase/functions/waitlist-invitation/index.ts
 *
 * Deployment requirement:
 *   This endpoint must allow an invitation to be inspected before sign-in.
 *   Deploy it with gateway JWT verification disabled / auth mode "none".
 *   The function manually validates any supplied user JWT and requires a valid,
 *   non-anonymous user for the "finalize" action.
 *
 * Security boundaries:
 *   - Never stores, logs, or returns the raw invitation token.
 *   - Hashes the raw token with SHA-256 inside the server function.
 *   - Calls only service-role-only database RPCs.
 *   - Never accepts an auth user UUID from the browser.
 *   - Returns one generic "unavailable" response for invalid, expired, revoked,
 *     malformed, or unknown invitations.
 *   - Does not send email and does not depend on FaithBid DNS or Resend.
 */

import { createClient } from "npm:@supabase/supabase-js@^2.95.0";
import { corsHeaders } from "npm:@supabase/supabase-js@^2.95.0/cors";

type Action = "inspect" | "finalize";

type RequestBody = {
  action?: unknown;
  selector_id?: unknown;
  token?: unknown;
};

type InspectRpcRow = {
  invitation_available: boolean | null;
  status_code: string | null;
  role: string | null;
  account_exists: boolean | null;
  auth_user_present: boolean | null;
  auth_email_matches: boolean | null;
  auth_email_confirmed: boolean | null;
  can_finalize: boolean | null;
  already_completed: boolean | null;
};

type FinalizeRpcRow = {
  status_code: string | null;
  role: string | null;
  profile_created: boolean | null;
  vendor_created: boolean | null;
  conversion_completed: boolean | null;
  onboarding_required: boolean | null;
};

const MAX_BODY_BYTES = 4_096;
const MIN_TOKEN_LENGTH = 16;
const MAX_TOKEN_LENGTH = 1_024;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

const INSPECT_STATUS_CODES = new Set([
  "unavailable",
  "authentication_required",
  "authenticated_email_mismatch",
  "email_confirmation_required",
  "ready_to_finalize",
  "completed",
]);

const FINALIZE_STATUS_CODES = new Set([
  "unavailable",
  "authentication_required",
  "authenticated_email_mismatch",
  "email_confirmation_required",
  "attention_required",
  "completed",
]);

const responseHeaders: Record<string, string> = {
  ...corsHeaders,
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

function jsonResponse(
  payload: Record<string, unknown>,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...responseHeaders,
      ...extraHeaders,
    },
  });
}

function unavailableResponse(requestId: string): Response {
  return jsonResponse({
    ok: true,
    request_id: requestId,
    invitation_available: false,
    status_code: "unavailable",
    can_finalize: false,
    already_completed: false,
  });
}

function authenticationRequiredResponse(requestId: string): Response {
  return jsonResponse(
    {
      ok: false,
      request_id: requestId,
      status_code: "authentication_required",
    },
    401,
  );
}

function temporaryFailureResponse(requestId: string): Response {
  return jsonResponse(
    {
      ok: false,
      request_id: requestId,
      status_code: "temporarily_unavailable",
    },
    503,
  );
}

function getBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer[ \t]+(.+)$/i);
  if (!match) {
    return "";
  }

  const token = match[1];
  return token.length > 0 ? token : "";
}

function isValidRawInvitationToken(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= MIN_TOKEN_LENGTH &&
    value.length <= MAX_TOKEN_LENGTH &&
    value === value.trim() &&
    !CONTROL_CHARACTER_PATTERN.test(value)
  );
}

function normalizeRole(value: unknown): "church" | "vendor" | null {
  return value === "church" || value === "vendor" ? value : null;
}

async function sha256AsPostgresBytea(rawToken: string): Promise<string> {
  const bytes = new TextEncoder().encode(rawToken);
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", bytes),
  );

  const hex = Array.from(digest, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");

  // PostgREST accepts PostgreSQL bytea's standard hexadecimal string form.
  return `\\x${hex}`;
}

Deno.serve(async (request: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();

  if (request.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        ...corsHeaders,
        "Cache-Control": "no-store",
      },
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        ok: false,
        request_id: requestId,
        status_code: "method_not_allowed",
      },
      405,
      { Allow: "POST, OPTIONS" },
    );
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const parsedLength = Number.parseInt(declaredLength, 10);
    if (
      Number.isFinite(parsedLength) &&
      parsedLength > MAX_BODY_BYTES
    ) {
      return jsonResponse(
        {
          ok: false,
          request_id: requestId,
          status_code: "invalid_request",
        },
        413,
      );
    }
  }

  let body: RequestBody;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return jsonResponse(
        {
          ok: false,
          request_id: requestId,
          status_code: "invalid_request",
        },
        413,
      );
    }

    const parsed = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return jsonResponse(
        {
          ok: false,
          request_id: requestId,
          status_code: "invalid_request",
        },
        400,
      );
    }

    body = parsed as RequestBody;
  } catch {
    return jsonResponse(
      {
        ok: false,
        request_id: requestId,
        status_code: "invalid_request",
      },
      400,
    );
  }

  const action = body.action;
  const selectorId = body.selector_id;
  const rawToken = body.token;

  if (
    (action !== "inspect" && action !== "finalize") ||
    typeof selectorId !== "string" ||
    !UUID_PATTERN.test(selectorId) ||
    !isValidRawInvitationToken(rawToken)
  ) {
    // Invalid invitation-shaped input receives the same unavailable result as
    // an unknown, expired, or revoked invitation.
    return unavailableResponse(requestId);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publicApiKey =
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !publicApiKey || !serviceRoleKey) {
    console.error("waitlist-invitation configuration missing", {
      request_id: requestId,
    });
    return temporaryFailureResponse(requestId);
  }

  const bearerToken = getBearerToken(
    request.headers.get("authorization"),
  );

  let authenticatedUserId: string | null = null;

  // Supabase Functions may send the project's public API key in the
  // Authorization header even when no user is signed in. That key is not a
  // user JWT, so treat it as an anonymous inspection request rather than an
  // authentication failure.
  if (bearerToken && bearerToken !== publicApiKey) {
    const authClient = createClient(supabaseUrl, publicApiKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(bearerToken);

    if (!userError && user && user.is_anonymous !== true) {
      authenticatedUserId = user.id;
    }
  }

  if (action === "finalize" && !authenticatedUserId) {
    return authenticationRequiredResponse(requestId);
  }

  let tokenHash: string;
  try {
    tokenHash = await sha256AsPostgresBytea(rawToken);
  } catch {
    console.error("waitlist-invitation token hashing failed", {
      request_id: requestId,
    });
    return temporaryFailureResponse(requestId);
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  if (action === "inspect") {
    const { data, error } = await serviceClient
      .rpc("kb_service_inspect_waitlist_invitation", {
        p_selector_id: selectorId,
        p_token_hash: tokenHash,
        p_auth_user_id: authenticatedUserId,
      })
      .single<InspectRpcRow>();

    if (error || !data) {
      console.error("waitlist invitation inspection RPC failed", {
        request_id: requestId,
        code: error?.code ?? null,
      });
      return temporaryFailureResponse(requestId);
    }

    const statusCode = INSPECT_STATUS_CODES.has(
      data.status_code ?? "",
    )
      ? data.status_code!
      : "unavailable";

    if (
      statusCode === "unavailable" ||
      data.invitation_available !== true
    ) {
      return unavailableResponse(requestId);
    }

    return jsonResponse({
      ok: true,
      request_id: requestId,
      invitation_available: true,
      status_code: statusCode,
      role: normalizeRole(data.role),
      account_exists: data.account_exists === true,
      authenticated: data.auth_user_present === true,
      auth_email_matches: data.auth_email_matches === true,
      auth_email_confirmed: data.auth_email_confirmed === true,
      can_finalize: data.can_finalize === true,
      already_completed: data.already_completed === true,
    });
  }

  const { data, error } = await serviceClient
    .rpc("kb_service_finalize_waitlist_conversion", {
      p_selector_id: selectorId,
      p_token_hash: tokenHash,
      p_auth_user_id: authenticatedUserId!,
    })
    .single<FinalizeRpcRow>();

  if (error || !data) {
    console.error("waitlist invitation finalization RPC failed", {
      request_id: requestId,
      code: error?.code ?? null,
    });
    return temporaryFailureResponse(requestId);
  }

  const statusCode = FINALIZE_STATUS_CODES.has(
    data.status_code ?? "",
  )
    ? data.status_code!
    : "unavailable";

  if (statusCode === "unavailable") {
    return unavailableResponse(requestId);
  }

  return jsonResponse({
    ok: true,
    request_id: requestId,
    status_code: statusCode,
    role: normalizeRole(data.role),
    profile_created: data.profile_created === true,
    vendor_created: data.vendor_created === true,
    conversion_completed: data.conversion_completed === true,
    onboarding_required: data.onboarding_required !== false,
  });
});
