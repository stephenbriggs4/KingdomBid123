import { supabase } from "./supabaseClient";

// Bump a version string whenever the published text of that document changes.
// "draft-" versions remain explicit until counsel approves the text.
export const LEGAL_DOC_VERSIONS = Object.freeze({
  terms: "draft-2026-09-28",
  privacy: "draft-2026-09-28",
});

export const CONSENT_KINDS = Object.freeze({
  waitlist: "waitlist",
  church: "church_signup",
  vendor: "vendor_signup",
  individual: "individual_signup",
  guestPost: "guest_post_project",
});

export function buildLegalConsentMetadata(kind, marketingOptIn = false) {
  if (!Object.values(CONSENT_KINDS).includes(kind) || kind === CONSENT_KINDS.waitlist) {
    throw new Error("A valid account consent kind is required.");
  }
  return { accepted: true, kind, marketing_opt_in: !!marketingOptIn };
}

// Authenticated re-consent only. Signup consent is captured atomically from
// Auth metadata by the database trigger.
export async function recordLegalConsent({ kind, marketingOptIn = false }) {
  try {
    const { error } = await supabase.rpc("kb_record_legal_consent", {
      p_email: "",
      p_kind: kind,
      p_documents: {},
      p_marketing_opt_in: !!marketingOptIn,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    try { console.error("[legal-consent] could not record consent", err?.message || err); } catch { /* console unavailable */ }
    return false;
  }
}
