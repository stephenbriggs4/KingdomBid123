import assert from "node:assert/strict";
import test from "node:test";

import { ApiError, parseNoticeRequest } from "./validation.ts";

const RELATIONSHIP_ID = "bdc13873-4560-4e13-b0e8-2cc6586f849f";

test("defaults to all caller-owned notices and a limit of 20", () => {
  assert.deepEqual(parseNoticeRequest({}), { relationship_id: null, limit: 20 });
});

test("accepts a relationship filter and bounded limit", () => {
  assert.deepEqual(parseNoticeRequest({ relationship_id: RELATIONSHIP_ID, limit: 50 }), {
    relationship_id: RELATIONSHIP_ID,
    limit: 50,
  });
});

test("rejects malformed relationship IDs", () => {
  assert.throws(
    () => parseNoticeRequest({ relationship_id: "not-a-uuid" }),
    (error: unknown) => error instanceof ApiError && error.code === "INVALID_REQUEST",
  );
});

test("rejects limits outside the database contract", () => {
  for (const limit of [0, 51, 1.5, "20"]) {
    assert.throws(() => parseNoticeRequest({ limit }));
  }
});

test("rejects unsupported fields such as profile or email", () => {
  assert.throws(
    () => parseNoticeRequest({ profile_id: RELATIONSHIP_ID, email: "not-allowed" }),
    (error: unknown) => error instanceof ApiError && error.code === "INVALID_REQUEST",
  );
});
