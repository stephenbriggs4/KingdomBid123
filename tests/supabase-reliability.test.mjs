import assert from "node:assert/strict";
import test from "node:test";

import {
  FaithBidRequestTimeoutError,
  withRequestDeadline,
} from "../src/supabaseReliability.js";

test("request deadlines return successful work and clear their timer", async () => {
  const result = await withRequestDeadline(async signal => {
    assert.equal(signal.aborted, false);
    return "ok";
  }, { timeoutMs: 100, label: "fast read" });
  assert.equal(result, "ok");
});

test("request deadlines abort the transport and return a typed timeout", async () => {
  let signal;
  await assert.rejects(
    withRequestDeadline(currentSignal => {
      signal = currentSignal;
      return new Promise(() => {});
    }, { timeoutMs: 10, label: "slow read" }),
    error => error instanceof FaithBidRequestTimeoutError
      && error.code === "FAITHBID_REQUEST_TIMEOUT"
      && error.timeoutMs === 10,
  );
  assert.equal(signal.aborted, true);
});
