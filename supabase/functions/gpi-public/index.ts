import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type JsonRecord = Record<string, unknown>;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ALLOWED_ORIGINS = (Deno.env.get("GPI_ALLOWED_ORIGINS") || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_GOALS = new Set(["serve", "connect"]);
const VALID_SCHEDULE_TYPES = new Set(["one_time", "recurring", "flexible"]);
const MAX_BODY_BYTES = 16 * 1024;
const MAX_ARRAY_ITEMS = 50;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function corsHeaders(req: Request): HeadersInit {
  const requestOrigin = req.headers.get("origin") || "";
  const allowOrigin = ALLOWED_ORIGINS.includes("*")
    ? "*"
    : ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : ALLOWED_ORIGINS[0] || "*";

  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-max-age": "86400",
    "vary": "Origin",
  };
}

function jsonResponse(req: Request, status: number, body: JsonRecord): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function asObject(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asUuid(value: unknown, fieldName: string, required = true): string | null {
  const text = asString(value);
  if (!text) {
    if (required) throw badRequest(`${fieldName} is required.`);
    return null;
  }
  if (!UUID_RE.test(text)) throw badRequest(`${fieldName} must be a valid UUID.`);
  return text;
}

function asUuidArray(value: unknown, fieldName: string): string[] {
  if (value == null) return [];
  if (!Array.isArray(value)) throw badRequest(`${fieldName} must be an array.`);
  if (value.length > MAX_ARRAY_ITEMS) throw badRequest(`${fieldName} contains too many items.`);
  return value.map((item, index) => asUuid(item, `${fieldName}[${index}]`, true) as string);
}

function asTextArray(value: unknown, fieldName: string, allowed?: Set<string>): string[] {
  if (value == null) return [];
  if (!Array.isArray(value)) throw badRequest(`${fieldName} must be an array.`);
  if (value.length > MAX_ARRAY_ITEMS) throw badRequest(`${fieldName} contains too many items.`);
  return value.map((item, index) => {
    const text = asString(item);
    if (!text) throw badRequest(`${fieldName}[${index}] must be a non-empty string.`);
    if (allowed && !allowed.has(text)) throw badRequest(`${fieldName}[${index}] is not supported.`);
    return text;
  });
}

function nullIfEmpty<T>(items: T[]): T[] | null {
  return items.length ? items : null;
}

function asLimit(value: unknown, fallback: number): number {
  if (value == null) return fallback;
  const num = Number(value);
  if (!Number.isInteger(num)) throw badRequest("limit must be an integer.");
  return Math.max(1, Math.min(num, 50));
}

function badRequest(message: string): Error {
  const error = new Error(message);
  error.name = "BadRequest";
  return error;
}

function requireServerReady(): void {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("GPI public bridge is not configured.");
  }
}

async function jsonBody(req: Request): Promise<unknown> {
  const contentType = req.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.startsWith("application/json")) {
    throw badRequest("Send a JSON request.");
  }
  const declaredLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw badRequest("Request body is too large.");
  }
  const text = await req.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw badRequest("Request body is too large.");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw badRequest("Request body must contain valid JSON.");
  }
}

async function callRpc(name: string, args: JsonRecord = {}): Promise<unknown> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    const err = new Error(error.message || "Database request failed.");
    err.name = "RpcError";
    (err as Error & { code?: string; details?: string; hint?: string }).code = error.code;
    (err as Error & { code?: string; details?: string; hint?: string }).details = error.details;
    (err as Error & { code?: string; details?: string; hint?: string }).hint = error.hint;
    throw err;
  }
  return data;
}

async function handleAction(body: JsonRecord): Promise<JsonRecord> {
  requireServerReady();

  const action = asString(body.action);
  const payload = asObject(body.payload);

  switch (action) {
    case "health":
      return { ok: true, service: "gpi-public" };

    case "list_taxonomy":
      return { ok: true, data: await callRpc("gpi_service_list_public_taxonomy") };

    case "list_city_areas":
      return { ok: true, data: await callRpc("gpi_service_list_public_city_areas") };

    case "search": {
      const goal = asString(payload.goal);
      if (goal && !VALID_GOALS.has(goal)) throw badRequest("goal must be serve or connect.");
      const scheduleTypes = asTextArray(payload.schedule_types, "schedule_types", VALID_SCHEDULE_TYPES);
      return {
        ok: true,
        data: await callRpc("gpi_service_search_public_opportunities", {
          p_goal: goal,
          p_city_area_id: asUuid(payload.city_area_id, "city_area_id", false),
          p_cause_tag_ids: nullIfEmpty(asUuidArray(payload.cause_tag_ids, "cause_tag_ids")),
          p_activity_tag_ids: nullIfEmpty(asUuidArray(payload.activity_tag_ids, "activity_tag_ids")),
          p_schedule_types: nullIfEmpty(scheduleTypes),
          p_limit: asLimit(payload.limit, 24),
        }),
      };
    }

    case "search_v2": {
      const discoveryInterestKeys = asTextArray(payload.discovery_interest_keys, "discovery_interest_keys");
      const scheduleTypes = asTextArray(payload.schedule_types, "schedule_types", VALID_SCHEDULE_TYPES);
      const marketSlug = asString(payload.market_slug) || "dallas_fort_worth";
      return {
        ok: true,
        data: await callRpc("gpi_service_search_public_opportunities_geo_v3", {
          p_discovery_interest_keys: discoveryInterestKeys,
          p_city_area_id: asUuid(payload.city_area_id, "city_area_id", false),
          p_city_query: asString(payload.city_query),
          p_market_slug: marketSlug,
          p_schedule_types: nullIfEmpty(scheduleTypes),
          p_limit: asLimit(payload.limit, 24),
        }),
      };
    }

    case "get_organization":
      return {
        ok: true,
        data: await callRpc("gpi_service_get_public_organization", {
          p_organization_id: asUuid(payload.organization_id, "organization_id"),
        }),
      };

    case "get_opportunity":
      return {
        ok: true,
        data: await callRpc("gpi_service_get_public_opportunity", {
          p_opportunity_id: asUuid(payload.opportunity_id, "opportunity_id"),
        }),
      };

    case "list_occurrences":
      return {
        ok: true,
        data: await callRpc("gpi_service_list_public_occurrences", {
          p_opportunity_id: asUuid(payload.opportunity_id, "opportunity_id"),
        }),
      };

    case "get_participant_requirements":
      return {
        ok: true,
        data: await callRpc("gpi_service_get_public_participant_requirements", {
          p_opportunity_id: asUuid(payload.opportunity_id, "opportunity_id"),
        }),
      };

    default:
      throw badRequest("Unknown GPI public action.");
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse(req, 405, { ok: false, error: "Method not allowed." });
  }

  try {
    const body = asObject(await jsonBody(req));
    const result = await handleAction(body);
    return jsonResponse(req, 200, result);
  } catch (error) {
    const err = error as Error & { code?: string; details?: string; hint?: string };
    const status = err.name === "BadRequest" ? 400 : err.name === "RpcError" ? 422 : 500;
    const message = status === 500 ? "GPI public bridge failed." : err.message;
    return jsonResponse(req, status, {
      ok: false,
      error: message,
      code: err.code || null,
      details: status === 500 ? null : err.details || null,
    });
  }
});
