import React from "react";

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
