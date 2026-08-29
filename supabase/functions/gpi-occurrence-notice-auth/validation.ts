type JsonObject = Record<string, unknown>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type NoticeRequest = {
  relationship_id: string | null;
  limit: number;
};

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

function asObject(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    invalid("Request body must be an object.");
  }
  return value as JsonObject;
}

export function parseNoticeRequest(input: unknown): NoticeRequest {
  const body = asObject(input);
  const allowed = new Set(["relationship_id", "limit"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) {
    invalid("Request body contains unsupported fields.");
  }

  let relationshipId: string | null = null;
  if (body.relationship_id !== null && body.relationship_id !== undefined) {
    if (typeof body.relationship_id !== "string" || !UUID_RE.test(body.relationship_id.trim())) {
      invalid("relationship_id must be a valid UUID.");
    }
    relationshipId = body.relationship_id.trim().toLowerCase();
  }

  const limit = body.limit === undefined ? 20 : body.limit;
  if (!Number.isInteger(limit) || (limit as number) < 1 || (limit as number) > 50) {
    invalid("limit must be an integer from 1 to 50.");
  }

  return { relationship_id: relationshipId, limit: limit as number };
}
