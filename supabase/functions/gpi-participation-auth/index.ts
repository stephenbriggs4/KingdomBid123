import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ApiError, parseActionBody, type ParsedAction } from "./validation.ts";

type JsonObject = Record<string, unknown>;
type RpcError = { code?: string; message?: string; details?: string; hint?: string };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
const ALLOWED_ORIGINS = new Set(
  (Deno.env.get("GPI_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
const MAX_BODY_BYTES = 16 * 1024;

let adminClient: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || ALLOWED_ORIGINS.size === 0) {
    throw new ApiError(
      500,
      "CONFIGURATION_ERROR",
      "Participation service is not configured.",
    );
  }
  if (!adminClient) {
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

function allowedOrigin(req: Request): string | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  return ALLOWED_ORIGINS.has(origin) ? origin : null;
}

function headers(req: Request, requestId: string): HeadersInit {
  const origin = allowedOrigin(req);
  return {
    ...(origin ? { "access-control-allow-origin": origin, vary: "Origin" } : {}),
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers":
      "authorization, apikey, content-type, x-client-info",
    "access-control-max-age": "86400",
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
    "x-request-id": requestId,
  };
}

function reply(
  req: Request,
  requestId: string,
  status: number,
  body: JsonObject,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: headers(req, requestId),
  });
}

function bearerToken(req: Request): string {
  const auth = req.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]?.trim()) {
    throw new ApiError(401, "AUTH_REQUIRED", "Sign in to manage recurring updates.");
  }
  return match[1].trim();
}

async function jsonBody(req: Request): Promise<unknown> {
  const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    throw new ApiError(415, "CONTENT_TYPE_REQUIRED", "Send a JSON request.");
  }

  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new ApiError(413, "REQUEST_TOO_LARGE", "Request body is too large.");
  }

  const text = await req.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw new ApiError(413, "REQUEST_TOO_LARGE", "Request body is too large.");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must contain valid JSON.");
  }
}

function mapRpcError(error: RpcError): ApiError {
  switch (error.code) {
    case "23505":
      return new ApiError(
        409,
        "CURRENT_PREFERENCE_EXISTS",
        "A current recurring-update preference already exists.",
      );
    case "42501":
      return new ApiError(403, "NOT_AUTHORIZED", "This action is not authorized.");
    case "22023":
      return new ApiError(
        422,
        "INVALID_PARTICIPATION_STATE",
        "This recurring-update action is not currently available.",
      );
    case "PGRST202":
      return new ApiError(
        500,
        "CONTRACT_MISMATCH",
        "Participation service is temporarily unavailable.",
      );
    default:
      return new ApiError(
        500,
        "DATABASE_ERROR",
        "Participation service is temporarily unavailable.",
      );
  }
}

async function rpc(name: string, args: JsonObject): Promise<unknown> {
  const { data, error } = await admin().rpc(name, args);
  if (error) throw mapRpcError(error);
  return data;
}

async function perform(action: ParsedAction, profileId: string): Promise<unknown> {
  if (action.action === "get_state") {
    return await rpc("gpi_service_get_my_participation", {
      p_profile_id: profileId,
      p_relationship_id: action.payload.relationship_id,
    });
  }

  if (action.action === "opt_in") {
    return await rpc("gpi_service_opt_in_recurring_updates", {
      p_profile_id: profileId,
      p_opportunity_id: action.payload.opportunity_id,
      p_source_connection_request_id:
        action.payload.source_connection_request_id,
      p_consent_policy_version: action.payload.consent_policy_version,
      p_operation_id: action.payload.operation_id,
    });
  }

  return await rpc("gpi_service_change_recurring_updates", {
    p_profile_id: profileId,
    p_relationship_id: action.payload.relationship_id,
    p_action: action.action,
    p_operation_id: action.payload.operation_id,
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();

  if (req.headers.get("origin") && !allowedOrigin(req)) {
    return reply(req, requestId, 403, {
      ok: false,
      code: "ORIGIN_NOT_ALLOWED",
      error: "Request origin is not allowed.",
      request_id: requestId,
    });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: headers(req, requestId) });
  }

  if (req.method !== "POST") {
    return reply(req, requestId, 405, {
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      error: "Method not allowed.",
      request_id: requestId,
    });
  }

  try {
    const client = admin();
    const token = bearerToken(req);
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser(token);

    if (userError || !user?.id || !user.email) {
      throw new ApiError(401, "AUTH_INVALID", "Your FaithBid session is not valid.");
    }
    if (!user.email_confirmed_at) {
      throw new ApiError(
        403,
        "EMAIL_UNCONFIRMED",
        "Confirm your FaithBid email before managing recurring updates.",
      );
    }

    const action = parseActionBody(await jsonBody(req));
    const data = await perform(action, user.id);

    return reply(req, requestId, 200, {
      ok: true,
      data,
      request_id: requestId,
    });
  } catch (error) {
    const apiError =
      error instanceof ApiError
        ? error
        : new ApiError(
            500,
            "INTERNAL_ERROR",
            "Participation service is temporarily unavailable.",
          );

    console.error(
      JSON.stringify({
        event: "gpi_participation_auth_error",
        request_id: requestId,
        code: apiError.code,
        status: apiError.status,
      }),
    );

    return reply(req, requestId, apiError.status, {
      ok: false,
      code: apiError.code,
      error: apiError.message,
      request_id: requestId,
    });
  }
});


