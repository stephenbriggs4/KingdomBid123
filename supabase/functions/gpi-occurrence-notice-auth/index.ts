import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ApiError, parseNoticeRequest } from "./validation.ts";

type JsonObject = Record<string, unknown>;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
const ALLOWED_ORIGINS = new Set(
  (Deno.env.get("GPI_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
const MAX_BODY_BYTES = 4 * 1024;
let adminClient: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || ALLOWED_ORIGINS.size === 0) {
    throw new ApiError(500, "CONFIGURATION_ERROR", "Gathering-change service is not configured.");
  }
  adminClient ??= createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

function allowedOrigin(req: Request): string | null {
  const origin = req.headers.get("origin");
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : null;
}

function responseHeaders(req: Request, requestId: string): HeadersInit {
  const origin = allowedOrigin(req);
  return {
    ...(origin ? { "access-control-allow-origin": origin, vary: "Origin" } : {}),
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
    "access-control-max-age": "86400",
    "cache-control": "no-store, private",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
    "x-request-id": requestId,
  };
}

function reply(req: Request, requestId: string, status: number, body: JsonObject): Response {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders(req, requestId) });
}

function bearerToken(req: Request): string {
  const match = (req.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]?.trim()) throw new ApiError(401, "AUTH_REQUIRED", "Sign in to view gathering changes.");
  return match[1].trim();
}

async function jsonBody(req: Request): Promise<unknown> {
  if (!(req.headers.get("content-type")?.toLowerCase() ?? "").startsWith("application/json")) {
    throw new ApiError(415, "CONTENT_TYPE_REQUIRED", "Send a JSON request.");
  }
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
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

Deno.serve(async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  if (req.headers.get("origin") && !allowedOrigin(req)) {
    return reply(req, requestId, 403, { ok: false, code: "ORIGIN_NOT_ALLOWED", error: "Request origin is not allowed.", request_id: requestId });
  }
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: responseHeaders(req, requestId) });
  if (req.method !== "POST") {
    return reply(req, requestId, 405, { ok: false, code: "METHOD_NOT_ALLOWED", error: "Method not allowed.", request_id: requestId });
  }

  try {
    const client = admin();
    const { data: { user }, error: userError } = await client.auth.getUser(bearerToken(req));
    if (userError || !user?.id || !user.email || !user.email_confirmed_at) {
      throw new ApiError(401, "AUTH_INVALID", "Your FaithBid session is not valid.");
    }
    const input = parseNoticeRequest(await jsonBody(req));
    const { data, error } = await client.rpc("gpi_service_get_my_occurrence_change_notices", {
      p_profile_id: user.id,
      p_relationship_id: input.relationship_id,
      p_limit: input.limit,
    });
    if (error) {
      const code = error.code === "42501" ? "NOT_AUTHORIZED" : error.code === "PGRST202" ? "CONTRACT_MISMATCH" : "DATABASE_ERROR";
      const status = error.code === "42501" ? 403 : 500;
      throw new ApiError(status, code, "Gathering-change service is temporarily unavailable.");
    }
    return reply(req, requestId, 200, { ok: true, data, request_id: requestId });
  } catch (error) {
    const apiError = error instanceof ApiError ? error : new ApiError(500, "INTERNAL_ERROR", "Gathering-change service is temporarily unavailable.");
    console.error(JSON.stringify({ event: "gpi_occurrence_notice_auth_error", request_id: requestId, code: apiError.code, status: apiError.status }));
    return reply(req, requestId, apiError.status, { ok: false, code: apiError.code, error: apiError.message, request_id: requestId });
  }
});
