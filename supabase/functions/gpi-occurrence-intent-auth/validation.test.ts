import assert from "node:assert/strict";
import test from "node:test";

import { ApiError, parseActionBody } from "./validation.ts";

const RELATIONSHIP_ID = "bdc13873-4560-4e13-b0e8-2cc6586f849f";
const OCCURRENCE_ID = "70cb17b6-4bf0-4402-ab9f-3b8fb1652fe2";
const OPERATION_ID = "fa0d40c6-5a8a-43a7-bb49-7a73e3dac012";

test("accepts the real Stage 3 relationship UUID", () => {
  assert.deepEqual(
    parseActionBody({
      action: "get_state",
      payload: { relationship_id: RELATIONSHIP_ID },
    }),
    {
      action: "get_state",
      payload: { relationship_id: RELATIONSHIP_ID },
    },
  );
});

test("accepts a null relationship for an unfiltered state read", () => {
  assert.deepEqual(
    parseActionBody({ action: "get_state", payload: { relationship_id: null } }),
    { action: "get_state", payload: { relationship_id: null } },
  );
});

test("accepts the complete plan contract", () => {
  assert.deepEqual(
    parseActionBody({
      action: "plan",
      payload: {
        relationship_id: RELATIONSHIP_ID,
        occurrence_id: OCCURRENCE_ID,
        operation_id: OPERATION_ID,
      },
    }),
    {
      action: "plan",
      payload: {
        relationship_id: RELATIONSHIP_ID,
        occurrence_id: OCCURRENCE_ID,
        operation_id: OPERATION_ID,
      },
    },
  );
});

test("accepts the complete remove contract", () => {
  assert.equal(
    parseActionBody({
      action: "remove",
      payload: {
        relationship_id: RELATIONSHIP_ID,
        occurrence_id: OCCURRENCE_ID,
        operation_id: OPERATION_ID,
      },
    }).action,
    "remove",
  );
});

test("rejects a UUID missing the final hyphen", () => {
  assert.throws(
    () => parseActionBody({
      action: "get_state",
      payload: { relationship_id: "bdc13873-4560-4e13-b0e82cc6586f849f" },
    }),
    (error: unknown) =>
      error instanceof ApiError &&
      error.code === "INVALID_REQUEST" &&
      error.message === "relationship_id must be a valid UUID.",
  );
});

test("rejects unsupported payload fields", () => {
  assert.throws(
    () => parseActionBody({
      action: "get_state",
      payload: { relationship_id: RELATIONSHIP_ID, email: "not-allowed" },
    }),
    (error: unknown) =>
      error instanceof ApiError &&
      error.code === "INVALID_REQUEST" &&
      error.message === "payload contains unsupported fields.",
  );
});

test("rejects unsupported actions", () => {
  assert.throws(
    () => parseActionBody({ action: "attend", payload: {} }),
    (error: unknown) =>
      error instanceof ApiError && error.code === "ACTION_NOT_SUPPORTED",
  );
});
