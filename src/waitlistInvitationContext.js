const KB_WAITLIST_INVITATION_SESSION_KEY = "kb_pending_waitlist_invitation_v1";
const KB_WAITLIST_INVITATION_TTL_MS = 1000 * 60 * 60 * 6;
const KB_WAITLIST_INVITATION_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const hasSessionStorage = () => {
  try {
    return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
  } catch {
    return false;
  }
};

const safeSessionGet = (key) => {
  if (!hasSessionStorage()) return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSessionSet = (key, value) => {
  if (!hasSessionStorage()) return false;
  try {
    window.sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const safeSessionRemove = (key) => {
  if (!hasSessionStorage()) return false;
  try {
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export function normalizeWaitlistInvitationRole(value) {
  const role = String(value || "").trim().toLowerCase();
  return role === "church" || role === "vendor" ? role : null;
}

function isValidWaitlistInvitationToken(value) {
  const token = typeof value === "string" ? value : "";
  return token.length >= 16
    && token.length <= 1024
    && token === token.trim()
    && !/[\u0000-\u001f\u007f]/.test(token);
}

export function parseWaitlistInvitationHash(hashValue = "") {
  try {
    const hash = String(hashValue || (typeof window !== "undefined" ? window.location.hash : ""));
    const match = hash.match(/^#\/?invite(?:\?([^#]*))?$/i);
    if (!match) return null;
    const params = new URLSearchParams(match[1] || "");
    const selectorId = String(params.get("selector_id") || params.get("selector") || "").trim();
    const token = params.get("token") || "";
    if (!KB_WAITLIST_INVITATION_UUID_RE.test(selectorId) || !isValidWaitlistInvitationToken(token)) return null;
    return { selectorId, token };
  } catch {
    return null;
  }
}

export function buildWaitlistInvitationHash(context = {}) {
  const selectorId = String(context?.selectorId || "").trim();
  const token = String(context?.token || "");
  if (!KB_WAITLIST_INVITATION_UUID_RE.test(selectorId) || !isValidWaitlistInvitationToken(token)) return "invite";
  return `invite?selector_id=${encodeURIComponent(selectorId)}&token=${encodeURIComponent(token)}`;
}

export function savePendingWaitlistInvitationContext(context = {}) {
  try {
    const selectorId = String(context?.selectorId || "").trim();
    const token = String(context?.token || "");
    const role = normalizeWaitlistInvitationRole(context?.role);
    if (!KB_WAITLIST_INVITATION_UUID_RE.test(selectorId) || !isValidWaitlistInvitationToken(token)) return false;
    return safeSessionSet(KB_WAITLIST_INVITATION_SESSION_KEY, JSON.stringify({
      selectorId,
      token,
      role,
      savedAt: Date.now(),
    }));
  } catch {
    return false;
  }
}

export function loadPendingWaitlistInvitationContext() {
  try {
    const raw = safeSessionGet(KB_WAITLIST_INVITATION_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const savedAt = Number(parsed?.savedAt || 0);
    if (!savedAt || Date.now() - savedAt > KB_WAITLIST_INVITATION_TTL_MS) {
      safeSessionRemove(KB_WAITLIST_INVITATION_SESSION_KEY);
      return null;
    }
    const selectorId = String(parsed?.selectorId || "").trim();
    const token = String(parsed?.token || "");
    if (!KB_WAITLIST_INVITATION_UUID_RE.test(selectorId) || !isValidWaitlistInvitationToken(token)) {
      safeSessionRemove(KB_WAITLIST_INVITATION_SESSION_KEY);
      return null;
    }
    return {
      selectorId,
      token,
      role: normalizeWaitlistInvitationRole(parsed?.role),
      savedAt,
    };
  } catch {
    return null;
  }
}

export function clearPendingWaitlistInvitationContext() {
  safeSessionRemove(KB_WAITLIST_INVITATION_SESSION_KEY);
}

export function restorePendingWaitlistInvitationRoute(context = loadPendingWaitlistInvitationContext()) {
  if (!context || typeof window === "undefined") return false;
  try {
    window.location.hash = buildWaitlistInvitationHash(context);
    return true;
  } catch {
    return false;
  }
}
