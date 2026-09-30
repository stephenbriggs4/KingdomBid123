export const DEFAULT_READ_DEADLINE_MS = 15_000;

export class FaithBidRequestTimeoutError extends Error {
  constructor(label, timeoutMs) {
    super(`${label || "FaithBid request"} did not finish within ${timeoutMs}ms.`);
    this.name = "FaithBidRequestTimeoutError";
    this.code = "FAITHBID_REQUEST_TIMEOUT";
    this.timeoutMs = timeoutMs;
  }
}

// The callback receives an AbortSignal so Supabase/PostgREST builders can opt
// into transport cancellation with `.abortSignal(signal)`. Promise.race alone
// would unblock the UI but leave the request consuming a browser and server
// connection after the caller had already given up.
export async function withRequestDeadline(operation, {
  timeoutMs = DEFAULT_READ_DEADLINE_MS,
  label = "FaithBid request",
} = {}) {
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new FaithBidRequestTimeoutError(label, timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      deadline,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export function isRequestTimeout(error) {
  return error?.code === "FAITHBID_REQUEST_TIMEOUT"
    || error?.name === "FaithBidRequestTimeoutError"
    || (error?.name === "AbortError" && /timeout|deadline/i.test(String(error?.message || "")));
}
