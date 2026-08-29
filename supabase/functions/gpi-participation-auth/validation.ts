export type ActionName = "get_state" | "opt_in" | "pause" | "resume" | "stop";

export type ParsedAction =
  | { action: "get_state"; payload: { relationship_id: string | null } }
  | {
      action: "opt_in";
      payload: {
        opportunity_id: string;
        source_connection_request_id: string;
        consent_policy_version: string;
        consent_accepted: true;
        operation_id: string;
      };
    }
  | {
      action: "pause" | "resume" | "stop";
      payload: { relationship_id: string; operation_id: string };
    };

type JsonObject = Record<string, unknown>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = new Set<ActionName>([
  "get_state",
  "opt_in",
  "pause",
  "resume",
  "stop",
]);

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function invalid(message: string): never {
  throw new ApiError(400, "INVALID_REQUEST", message);
}

function asObject(value: unknown, name: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    invalid(`${name} must be an object.`);
  }
  return value as JsonObject;
}

function exactKeys(value: JsonObject, allowed: readonly string[], name: string): void {
  const permitted = new Set(allowed);
  const unknown = Object.keys(value).filter((key) => !permitted.has(key));
  if (unknown.length > 0) invalid(`${name} contains unsupported fields.`);
}

function requiredString(value: unknown, name: string, maxLength: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`${name} is required.`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) invalid(`${name} is too long.`);
  return normalized;
}

function uuid(value: unknown, name: string): string {
  const normalized = requiredString(value, name, 36);
  if (!UUID_RE.test(normalized)) invalid(`${name} must be a valid UUID.`);
  return normalized.toLowerCase();
}

function optionalUuid(value: unknown, name: string): string | null {
  if (value === null || value === undefined) return null;
  return uuid(value, name);
}

export function parseActionBody(input: unknown): ParsedAction {
  const body = asObject(input, "request body");
  exactKeys(body, ["action", "payload"], "request body");

  const actionText = requiredString(body.action, "action", 32).toLowerCase();
  if (!ACTIONS.has(actionText as ActionName)) {
    throw new ApiError(400, "ACTION_NOT_SUPPORTED", "Unknown participation action.");
  }
  const action = actionText as ActionName;
  const payload = asObject(body.payload, "payload");

  if (action === "get_state") {
    exactKeys(payload, ["relationship_id"], "payload");
    return {
      action,
      payload: {
        relationship_id: optionalUuid(payload.relationship_id, "relationship_id"),
      },
    };
  }

  if (action === "opt_in") {
    exactKeys(
      payload,
      [
        "opportunity_id",
        "source_connection_request_id",
        "consent_policy_version",
        "consent_accepted",
        "operation_id",
      ],
      "payload",
    );
    if (payload.consent_accepted !== true) {
      invalid("consent_accepted must be true.");
    }
    return {
      action,
      payload: {
        opportunity_id: uuid(payload.opportunity_id, "opportunity_id"),
        source_connection_request_id: uuid(
          payload.source_connection_request_id,
          "source_connection_request_id",
        ),
        consent_policy_version: requiredString(
          payload.consent_policy_version,
          "consent_policy_version",
          100,
        ),
        consent_accepted: true,
        operation_id: uuid(payload.operation_id, "operation_id"),
      },
    };
  }

  exactKeys(payload, ["relationship_id", "operation_id"], "payload");
  return {
    action,
    payload: {
      relationship_id: uuid(payload.relationship_id, "relationship_id"),
      operation_id: uuid(payload.operation_id, "operation_id"),
    },
  };
}


