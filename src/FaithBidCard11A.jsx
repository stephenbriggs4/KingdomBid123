import React, { useEffect } from "react";

const FONT_LINK_ID = "faithbid-card-11a-fraunces";
const CARD_LAYOUT_STYLE_ID = "faithbid-card-11a-layout";

function ensureCardFont() {
  if (typeof document === "undefined") return;
  if (!document.getElementById(FONT_LINK_ID)) {
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
  }
  if (!document.getElementById(CARD_LAYOUT_STYLE_ID)) {
    const style = document.createElement("style");
    style.id = CARD_LAYOUT_STYLE_ID;
    style.textContent = `
      html body #root .kb-live-all-grid,
      html body #root .kbm-grid.kb-audit-project-grid {
        grid-template-columns: repeat(auto-fill, 320px) !important;
        justify-content: start !important;
        align-items: start !important;
        gap: 18px !important;
      }
      .kb-live-featured-row > .faithbid-card-11a-rail-item {
        flex: 0 0 320px !important;
        width: 320px !important;
        height: auto !important;
        min-height: 0 !important;
      }
      .faithbid-card-11a { box-sizing: border-box; }
      @media (max-width: 680px) {
        html body #root .kb-live-all-grid,
        html body #root .kbm-grid.kb-audit-project-grid {
          grid-template-columns: minmax(0, 1fr) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

export default function FaithBidCard11A({
  image,
  imageAlt = "",
  title,
  topLabel,
  topTone = "gold",
  avatarText = "FB",
  meta,
  value,
  actionLabel,
  onOpen,
  onAction,
  actionDisabled = false,
  saved = false,
  onToggleSave,
  matchPercent = null,
  ariaLabel,
  className = "",
}) {
  useEffect(ensureCardFont, []);
  const safeMatch = matchPercent == null
    ? null
    : (Number.isFinite(Number(matchPercent)) ? Math.max(0, Math.min(100, Math.round(Number(matchPercent)))) : null);
  const topColor = topTone === "green" ? "oklch(0.85 0.13 145)" : "oklch(0.85 0.1 85)";
  const canOpen = typeof onOpen === "function";
  const activate = (event) => {
    if (!canOpen) return;
    if (event?.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
    if (event?.type === "keydown") event.preventDefault();
    onOpen(event);
  };

  return (
    <article
      className={`faithbid-card-11a ${className}`.trim()}
      role={canOpen ? "button" : undefined}
      tabIndex={canOpen ? 0 : undefined}
      aria-label={ariaLabel || (canOpen ? `Open ${title}` : undefined)}
      onClick={activate}
      onKeyDown={activate}
      style={{
        width: "100%",
        height: 420,
        minWidth: 0,
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
        background: "#241b13",
        cursor: canOpen ? "pointer" : "default",
        transition: "transform .18s ease, box-shadow .18s ease",
        boxShadow: "0 12px 30px rgba(20,14,8,.16)",
        isolation: "isolate",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-4px)";
        event.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,.25)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = "0 12px 30px rgba(20,14,8,.16)";
      }}
    >
      <div style={{ position: "absolute", inset: 0, filter: "sepia(.4) saturate(1.4) hue-rotate(-10deg) brightness(.75)" }}>
        {image ? <img src={image} alt={imageAlt || title || ""} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : null}
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,14,8,.88) 0%, rgba(20,14,8,.02) 50%)", pointerEvents: "none" }} />

      <div style={{ position: "absolute", top: 18, left: 18, right: safeMatch == null ? 58 : 78, font: "700 10px Inter, sans-serif", letterSpacing: ".14em", color: topColor, textTransform: "uppercase", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
        {topLabel}
      </div>

      {safeMatch != null ? (
        <div style={{ position: "absolute", top: 14, right: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: `conic-gradient(oklch(0.85 0.13 85) ${safeMatch}%, rgba(255,255,255,.2) 0)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(20,14,8,.85)", display: "flex", alignItems: "center", justifyContent: "center", font: "700 10px Inter, sans-serif", color: "#fff" }}>{safeMatch}%</div>
          </div>
          <div style={{ font: "700 8px Inter, sans-serif", letterSpacing: ".08em", color: "rgba(255,255,255,.75)" }}>MATCH</div>
        </div>
      ) : (
        <button
          type="button"
          aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`}
          aria-pressed={saved}
          onClick={(event) => {
            event.stopPropagation();
            if (typeof onToggleSave === "function") onToggleSave(event);
          }}
          style={{ position: "absolute", top: 16, right: 16, width: 30, height: 30, padding: 0, border: 0, borderRadius: "50%", background: saved ? "rgba(176,136,64,.88)" : "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", cursor: onToggleSave ? "pointer" : "default" }}
        >
          <span aria-hidden="true" style={{ width: 11, height: 13, background: "#fff", clipPath: "polygon(0 0,100% 0,100% 100%,50% 76%,0 100%)", opacity: onToggleSave ? 1 : .78 }} />
        </button>
      )}

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 28 }}>
        <div style={{ font: "600 19px/1.3 Fraunces, Georgia, serif", color: "#fff", marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 18, minWidth: 0 }}>
          <div style={{ width: 20, height: 20, flex: "0 0 20px", borderRadius: "50%", background: "oklch(0.85 0.1 85)", font: "700 9px Inter, sans-serif", color: "#1a1712", display: "flex", alignItems: "center", justifyContent: "center" }}>{String(avatarText || "FB").slice(0, 2).toUpperCase()}</div>
          <div style={{ minWidth: 0, font: "13px Inter, sans-serif", color: "rgba(255,255,255,.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta}</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0, font: "700 24px Fraunces, Georgia, serif", color: "oklch(0.85 0.13 85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
          <button
            type="button"
            disabled={actionDisabled}
            onClick={(event) => {
              event.stopPropagation();
              if (!actionDisabled && typeof onAction === "function") onAction(event);
            }}
            style={{ flexShrink: 0, border: 0, padding: 0, background: "transparent", color: actionDisabled ? "rgba(255,255,255,.42)" : "#fff", font: "600 13px Inter, sans-serif", cursor: actionDisabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}
          >
            {actionLabel} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </article>
  );
}
