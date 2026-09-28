import React from "react";
import { supabase } from "./supabaseClient";

// Bump a version string whenever the published text of that document changes.
// Consent rows store these strings so we can prove which text a person saw.
// "draft-" versions mean the document is still awaiting counsel review.
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

// Best effort: consent capture must never block a signup, but a failure is
// reported so it is not silently lost.
export async function recordLegalConsent({ email, kind, marketingOptIn = false }) {
  try {
    const { error } = await supabase.rpc("kb_record_legal_consent", {
      p_email: String(email || "").trim().toLowerCase(),
      p_kind: kind,
      p_documents: { ...LEGAL_DOC_VERSIONS },
      p_marketing_opt_in: !!marketingOptIn,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    try { console.error("[legal-consent] could not record consent", err?.message || err); } catch { /* console unavailable */ }
    return false;
  }
}

// Same-tab-safe links: open in a new tab so a half-filled form is never lost.
const linkStyle = { color: "inherit", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 2 };

export function LegalConsentCheckbox({ checked, onChange, id = "kb-legal-consent", style, tone = "light", children }) {
  const color = tone === "dark" ? "var(--atext-muted)" : "#4a5043";
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", ...style }}>
      <input
        id={id}
        type="checkbox"
        checked={!!checked}
        onChange={(event) => onChange(event.target.checked)}
        required
        aria-required="true"
        style={{ marginTop: 3, accentColor: "#9b7129", flexShrink: 0, width: 16, height: 16, cursor: "pointer" }}
      />
      <label htmlFor={id} style={{ fontSize: 13, lineHeight: 1.65, color, cursor: "pointer" }}>
        I agree to FaithBid&rsquo;s{" "}
        <a href="#terms" target="_blank" rel="noopener noreferrer" style={linkStyle}>Terms</a>{" "}
        and acknowledge the{" "}
        <a href="#privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>Privacy Policy</a>.
        {children}
      </label>
    </div>
  );
}
