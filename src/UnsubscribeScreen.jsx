import React, { useEffect, useState } from "react";
import { supabaseUrl, supabaseAnonKey } from "./supabaseClient";

// Reads ?u=<userId>&s=<signature> from the hash, checks the link with the email-worker
// function, and only changes anything when the person presses the button.
function readParams() {
  try {
    const hash = String(window.location.hash || "");
    const query = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "";
    const params = new URLSearchParams(query);
    return { u: params.get("u") || "", s: params.get("s") || "" };
  } catch {
    return { u: "", s: "" };
  }
}

function endpoint({ u, s }) {
  return `${supabaseUrl}/functions/v1/email-worker/unsubscribe?u=${encodeURIComponent(u)}&s=${encodeURIComponent(s)}`;
}

const headers = () => ({ apikey: supabaseAnonKey, authorization: `Bearer ${supabaseAnonKey}` });

export default function UnsubscribeScreen({ nav }) {
  const [params] = useState(readParams);
  const [state, setState] = useState("checking"); // checking | ready | invalid | done | error
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!params.u || !params.s) { setState("invalid"); return undefined; }
    let cancelled = false;
    fetch(endpoint(params), { headers: headers() })
      .then((response) => { if (!cancelled) setState(response.ok ? "ready" : "invalid"); })
      .catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, [params]);

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(endpoint(params), { method: "POST", headers: headers() });
      setState(response.ok ? "done" : "error");
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  };

  const card = { width: "min(560px,100%)", margin: "0 auto", padding: "clamp(24px,5vw,40px)", border: "1px solid rgba(28,40,20,.12)", borderRadius: 20, background: "rgba(255,255,255,.85)" };
  const copy = { fontSize: 15, lineHeight: 1.7, color: "#5f6659", margin: "0 0 18px" };
  return (
    <main id="kb-main-content" style={{ minHeight: "72vh", background: "#fffdf8", padding: "clamp(96px,12vw,140px) 20px 80px" }}>
      <section style={card} aria-live="polite">
        {state === "checking" ? <p style={copy}>Checking your link…</p> : null}
        {state === "ready" ? (
          <>
            <h1 style={{ fontFamily: "var(--font-display),Georgia,serif", fontSize: 30, margin: "0 0 12px", color: "#1C2814" }}>Unsubscribe from FaithBid emails?</h1>
            <p style={copy}>You will stop receiving notification emails. In-app notifications continue, and you can turn emails back on any time in Settings.</p>
            <button type="button" className="btn-primary" onClick={confirm} disabled={busy}>{busy ? "Working…" : "Unsubscribe"}</button>
          </>
        ) : null}
        {state === "done" ? (
          <>
            <h1 style={{ fontFamily: "var(--font-display),Georgia,serif", fontSize: 30, margin: "0 0 12px", color: "#1C2814" }}>You are unsubscribed.</h1>
            <p style={copy}>You will no longer receive notification emails from FaithBid. You can turn them back on in Settings whenever you like.</p>
            <button type="button" className="btn-secondary" onClick={() => nav?.("landing")}>Return to FaithBid</button>
          </>
        ) : null}
        {state === "invalid" ? (
          <>
            <h1 style={{ fontFamily: "var(--font-display),Georgia,serif", fontSize: 30, margin: "0 0 12px", color: "#1C2814" }}>This link is not valid.</h1>
            <p style={copy}>It may be incomplete or out of date. Sign in and change your email settings under Settings, or contact support.</p>
            <button type="button" className="btn-secondary" onClick={() => nav?.("settings")}>Open Settings</button>
          </>
        ) : null}
        {state === "error" ? (
          <>
            <h1 style={{ fontFamily: "var(--font-display),Georgia,serif", fontSize: 30, margin: "0 0 12px", color: "#1C2814" }}>We could not finish that.</h1>
            <p style={copy}>Please try the link again in a moment, or change your email settings under Settings.</p>
            <button type="button" className="btn-secondary" onClick={() => nav?.("settings")}>Open Settings</button>
          </>
        ) : null}
      </section>
    </main>
  );
}
