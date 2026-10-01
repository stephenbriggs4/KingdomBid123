import React from "react";

// Same-tab-safe links: open in a new tab so a half-filled form is never lost.
const linkStyle = { color: "inherit", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 2 };

export function LegalConsentCheckbox({ checked, onChange, id = "kb-legal-consent", style, tone = "light", children }) {
  const color = tone === "dark" ? "var(--atext-muted)" : "#4a5043";
  return (
    <div className="kb-legal-consent-row" style={{ display: "flex", gap: 12, alignItems: "flex-start", width: "100%", minWidth: 0, ...style }}>
      <input
        className="kb-legal-consent-control"
        id={id}
        type="checkbox"
        checked={!!checked}
        onChange={(event) => onChange(event.target.checked)}
        required
        aria-required="true"
        style={{ marginTop: 3, accentColor: "#9b7129", flexShrink: 0, width: 16, height: 16, cursor: "pointer" }}
      />
      <label htmlFor={id} style={{ minWidth: 0, flex: "1 1 auto", fontSize: 13, lineHeight: 1.65, color, cursor: "pointer", overflowWrap: "anywhere", wordBreak: "normal" }}>
        I acknowledge FaithBid&rsquo;s current early-access{" "}
        <a href="#terms" target="_blank" rel="noopener noreferrer" style={linkStyle}>Terms</a>{" "}
        and{" "}
        <a href="#privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>Privacy Notice</a>. Final policies will be presented before general activation.
        {children}
      </label>
    </div>
  );
}
