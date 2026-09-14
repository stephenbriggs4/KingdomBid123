import React from "react";

export default function KBWorkspaceEmptyState({
  eyebrow = "Next step",
  title,
  body,
  icon = "✦",
  actionLabel = null,
  onAction = null,
  secondaryLabel = null,
  onSecondary = null,
  className = "",
  minHeight = "clamp(340px, 52vh, 480px)",
  style = {},
}) {
  return (
    <section
      className={`kb-workspace-empty-state ${className}`.trim()}
      data-kb-empty-state="workspace"
      style={{
        minHeight,
        display: "grid",
        placeItems: "center",
        padding: "28px 18px",
        ...style,
      }}
    >
      <div style={{
        width: "min(100%, 620px)",
        borderRadius: 24,
        padding: "clamp(36px, 5vw, 58px) clamp(24px, 5vw, 46px)",
        textAlign: "center",
        background: "linear-gradient(180deg,#fffdf8 0%,#fffaf1 100%)",
        border: "1px solid #dfd5c2",
        color: "#1c2814",
        boxShadow: "0 16px 42px rgba(28,40,20,0.065)",
      }}>
        <div aria-hidden="true" style={{
          width: 60,
          height: 60,
          borderRadius: 20,
          margin: "0 auto 16px",
          display: "grid",
          placeItems: "center",
          background: "rgba(176,136,64,0.08)",
          border: "1px solid rgba(176,136,64,0.22)",
          color: "#8a6729",
          fontSize: 24,
          fontWeight: 800,
        }}>{icon}</div>
        <div style={{
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#8a6729",
          marginBottom: 10,
        }}>{eyebrow}</div>
        <h2 style={{
          margin: "0 0 10px",
          fontFamily: "var(--font-display), serif",
          fontSize: "clamp(24px, 3.4vw, 30px)",
          fontWeight: 700,
          letterSpacing: "-0.025em",
          lineHeight: 1.08,
          color: "#1c2814",
        }}>{title}</h2>
        {body ? <p style={{
          maxWidth: 520,
          margin: (actionLabel || secondaryLabel) ? "0 auto 24px" : "0 auto",
          fontSize: 14,
          lineHeight: 1.7,
          color: "#5d5548",
        }}>{body}</p> : null}
        {(actionLabel || secondaryLabel) ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
            {actionLabel ? <button type="button" onClick={onAction} style={{height:48,padding:"0 22px",borderRadius:999,border:"none",background:"linear-gradient(135deg,#1C2814,#2b3a22)",color:"#fffdf8",fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:"0 14px 28px rgba(28,40,20,0.14)"}}>{actionLabel}</button> : null}
            {secondaryLabel ? <button type="button" onClick={onSecondary} style={{height:48,padding:"0 20px",borderRadius:999,border:"1px solid #dfd5c2",background:"#fff",color:"#1C2814",fontSize:13,fontWeight:700,cursor:"pointer"}}>{secondaryLabel}</button> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
