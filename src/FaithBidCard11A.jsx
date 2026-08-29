import React, { useEffect } from "react";

const FONT_LINK_ID = "faithbid-card-11a-fraunces";
function ensureCardFont() {
  if (typeof document === "undefined") return;
  if (!document.getElementById(FONT_LINK_ID)) {
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
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
  const normalizedTopLabel = String(topLabel || "").trim();
  const isReviewStatus = /^bid under review$/i.test(normalizedTopLabel);
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

      <div className={isReviewStatus ? "kb-card-review-status" : "kb-card-top-label"} style={{ position: "absolute", top: 16, left: 18, right: safeMatch == null ? 58 : 92, minHeight: isReviewStatus ? 28 : undefined, padding: isReviewStatus ? "5px 10px" : 0, borderRadius: isReviewStatus ? 999 : 0, background: isReviewStatus ? "rgba(20,14,8,.78)" : "transparent", border: isReviewStatus ? "1px solid rgba(255,255,255,.22)" : 0, font: isReviewStatus ? "700 13px Inter, sans-serif" : "700 12px Inter, sans-serif", letterSpacing: isReviewStatus ? 0 : ".08em", color: isReviewStatus ? "#fff" : topColor, textTransform: isReviewStatus ? "none" : "uppercase", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", display: "inline-flex", alignItems: "center", width: "fit-content", maxWidth: "calc(100% - 110px)" }}>
        {normalizedTopLabel}
      </div>

      {safeMatch != null ? (
        <div className="kb-match-chip" aria-label={`${safeMatch}% match`} style={{ position: "absolute", top: 14, right: 14, minHeight: 30, padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,.25)", background: "rgba(20,14,8,.82)", color: "#fff", font: "700 13px Inter, sans-serif", display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "oklch(0.85 0.13 85)" }} />
          {safeMatch}% match
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
