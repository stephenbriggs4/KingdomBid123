import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  clearPendingWaitlistInvitationContext,
  loadPendingWaitlistInvitationContext,
  normalizeWaitlistInvitationRole,
  parseWaitlistInvitationHash,
  restorePendingWaitlistInvitationRoute,
  savePendingWaitlistInvitationContext,
} from "./waitlistInvitationContext";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const defaultIsValidEmail = (value) => typeof value === "string" && EMAIL_RE.test(value.trim());

const PASSWORD_MIN_LEN = 8;
const defaultPasswordStrengthError = (value) => {
  const s = String(value || "");
  if (s.length < PASSWORD_MIN_LEN) return `Password must be at least ${PASSWORD_MIN_LEN} characters.`;
  if (!/[A-Za-z]/.test(s)) return "Password must include at least one letter.";
  if (!/\d/.test(s)) return "Password must include at least one number.";
  return null;
};

function defaultRunSupabaseWithTimeout(promise, label = "Supabase request", ms = 8000) {
  let timer = null;
  return Promise.race([
    Promise.resolve(promise).finally(() => { if (timer) clearTimeout(timer); }),
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error(`${label} timed out`);
        err.code = "KB_SUPABASE_TIMEOUT";
        reject(err);
      }, ms);
    }),
  ]);
}
export default function WaitlistInvitationScreen({
  currentUser,
  authReady,
  nav,
  setRole,
  showToast,
  onFinalized,
  dependencies = {},
}) {
  const {
    isValidEmail = defaultIsValidEmail,
    passwordStrengthError = defaultPasswordStrengthError,
    runSupabaseWithTimeout = defaultRunSupabaseWithTimeout,
  } = dependencies || {};
  const invitation = React.useMemo(() => (
    parseWaitlistInvitationHash()
    || loadPendingWaitlistInvitationContext()
  ), []);

  const [state, setState] = useState({
    loading: true,
    statusCode: "loading",
    invitationAvailable: false,
    role: null,
    accountExists: false,
    canFinalize: false,
    alreadyCompleted: false,
  });
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [finalizeBusy, setFinalizeBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const inspectSeq = React.useRef(0);

  const role = normalizeWaitlistInvitationRole(state.role || invitation?.role);
  const isVendorInvitation = role === "vendor";

  useEffect(() => {
    if (!invitation) return;
    savePendingWaitlistInvitationContext({
      ...invitation,
      role,
    });
  }, [invitation?.selectorId, invitation?.token, role]);

  const inspectInvitation = React.useCallback(async () => {
    const seq = ++inspectSeq.current;
    if (!invitation?.selectorId || !invitation?.token) {
      setState({
        loading: false,
        statusCode: "unavailable",
        invitationAvailable: false,
        role: null,
        accountExists: false,
        canFinalize: false,
        alreadyCompleted: false,
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, statusCode: "loading" }));
    try {
      const { data, error } = await runSupabaseWithTimeout(supabase.functions.invoke("waitlist-invitation", {
        body: {
          action: "inspect",
          selector_id: invitation.selectorId,
          token: invitation.token,
        },
      }), "Invitation inspection", 10000);
      if (seq !== inspectSeq.current) return;
      if (error || !data) {
        setState(prev => ({
          ...prev,
          loading: false,
          statusCode: "endpoint_not_ready",
          invitationAvailable: false,
          canFinalize: false,
        }));
        return;
      }

      const nextRole = normalizeWaitlistInvitationRole(data?.role);
      const statusCode = String(data?.status_code || "unavailable");
      if (nextRole) {
        setRole?.(nextRole);
        savePendingWaitlistInvitationContext({ ...invitation, role: nextRole });
      }
      setAuthMode(data?.account_exists ? "login" : "signup");
      setState({
        loading: false,
        statusCode,
        invitationAvailable: data?.invitation_available === true,
        role: nextRole,
        accountExists: data?.account_exists === true,
        canFinalize: data?.can_finalize === true,
        alreadyCompleted: data?.already_completed === true,
      });
    } catch {
      if (seq !== inspectSeq.current) return;
      setState(prev => ({
        ...prev,
        loading: false,
        statusCode: "endpoint_not_ready",
        invitationAvailable: false,
        canFinalize: false,
      }));
    }
  }, [invitation?.selectorId, invitation?.token, currentUser?.id, setRole]);

  useEffect(() => {
    if (!authReady) return;
    inspectInvitation();
  }, [authReady, currentUser?.id, inspectInvitation]);

  const submitAuth = async () => {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthError("");
    setAuthMessage("");

    try {
      const normalizedEmail = String(email || "").trim().toLowerCase();
      if (!isValidEmail(normalizedEmail)) throw new Error("Enter a valid email address.");
      if (!password) throw new Error("Enter your password.");

      savePendingWaitlistInvitationContext({ ...invitation, role });

      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        setAuthMessage("Signed in. Checking your invitation…");
        return;
      }

      const passwordError = passwordStrengthError(password);
      if (passwordError) throw new Error(passwordError);

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            role: role || "church",
            signup_source: "waitlist_invitation",
          },
        },
      });
      if (error) throw error;

      if (data?.session) {
        setAuthMessage("Account created. Checking your invitation…");
      } else {
        setAuthMessage("Check your email to confirm the account, then reopen the original FaithBid invitation link.");
      }
    } catch (error) {
      const message = String(error?.message || "");
      if (/invalid login credentials/i.test(message)) setAuthError("Wrong email or password.");
      else if (/already registered|already exists|duplicate/i.test(message)) setAuthError("That account already exists. Switch to Sign in.");
      else if (/rate limit|too many/i.test(message)) setAuthError("Too many attempts. Wait a moment and try again.");
      else setAuthError(message || "That did not work. Try again.");
    } finally {
      setAuthBusy(false);
    }
  };

  const finalizeInvitation = async () => {
    if (finalizeBusy || !currentUser?.id || !invitation) return;
    setFinalizeBusy(true);
    setAuthError("");
    try {
      const { data, error } = await runSupabaseWithTimeout(supabase.functions.invoke("waitlist-invitation", {
        body: {
          action: "finalize",
          selector_id: invitation.selectorId,
          token: invitation.token,
        },
      }), "Invitation finalization", 12000);
      if (error || !data) throw new Error("FaithBid could not complete the invitation right now.");

      const statusCode = String(data?.status_code || "unavailable");
      if (statusCode === "completed" && data?.conversion_completed === true) {
        await onFinalized?.({
          role: normalizeWaitlistInvitationRole(data?.role) || role,
          onboarding_required: data?.onboarding_required !== false,
        });
        showToast?.("Your FaithBid access is ready.", "success");
        return;
      }

      if (statusCode === "authenticated_email_mismatch") {
        setState(prev => ({ ...prev, loading: false, statusCode, canFinalize: false }));
        return;
      }
      if (statusCode === "email_confirmation_required") {
        setState(prev => ({ ...prev, loading: false, statusCode, canFinalize: false }));
        return;
      }
      if (statusCode === "attention_required") {
        setState(prev => ({ ...prev, loading: false, statusCode, canFinalize: false }));
        return;
      }
      setState(prev => ({ ...prev, loading: false, statusCode: "unavailable", canFinalize: false }));
    } catch (error) {
      setAuthError(String(error?.message || "FaithBid could not complete the invitation right now."));
    } finally {
      setFinalizeBusy(false);
    }
  };

  const signOutForDifferentAccount = async () => {
    savePendingWaitlistInvitationContext({ ...invitation, role });
    try { await supabase.auth.signOut({ scope: "local" }); } catch {}
    try {
      restorePendingWaitlistInvitationRoute({ ...invitation, role });
      window.location.reload();
    } catch {}
  };

  const shellStyle = {
    minHeight: "100vh",
    background: "radial-gradient(circle at 14% 12%, rgba(198,146,45,.16), transparent 34%), linear-gradient(145deg,#10180f 0%,#1c2814 55%,#0e1710 100%)",
    padding: "clamp(24px,5vw,72px) 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const cardStyle = {
    width: "min(660px,100%)",
    borderRadius: 24,
    background: "rgba(255,253,248,.98)",
    border: "1px solid rgba(198,146,45,.28)",
    boxShadow: "0 34px 90px rgba(0,0,0,.38)",
    padding: "clamp(28px,5vw,54px)",
    color: "#182116",
  };
  const buttonStyle = {
    width: "100%",
    minHeight: 50,
    border: 0,
    borderRadius: 12,
    padding: "0 18px",
    background: "#1C2814",
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  };
  const secondaryButtonStyle = {
    ...buttonStyle,
    background: "#fff",
    color: "#1C2814",
    border: "1px solid rgba(28,40,20,.16)",
  };
  const inputStyle = {
    width: "100%",
    height: 50,
    borderRadius: 11,
    border: "1px solid rgba(28,40,20,.16)",
    background: "#fff",
    padding: "0 14px",
    fontSize: 14,
    color: "#182116",
    outline: "none",
  };

  const Header = ({ eyebrow = (isVendorInvitation ? "Charter Vendor activation" : "FaithBid invitation"), title, body }) => (
    <>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".16em", textTransform: "uppercase", color: "#9C7130", marginBottom: 14 }}>{eyebrow}</div>
      <h1 style={{ margin: 0, fontFamily: "Playfair Display,serif", fontSize: "clamp(34px,6vw,52px)", lineHeight: 1.02, letterSpacing: "-.035em", color: "#182116" }}>{title}</h1>
      <p style={{ margin: "18px 0 0", fontSize: 15, lineHeight: 1.75, color: "#5E695B" }}>{body}</p>
    </>
  );

  if (state.loading || !authReady) {
    return (
      <main id="kb-main-content" style={shellStyle}>
        <section style={cardStyle}>
          <Header title="Checking your invitation…" body="FaithBid is securely validating this link." />
          <div style={{ marginTop: 30, height: 4, borderRadius: 999, background: "rgba(28,40,20,.08)", overflow: "hidden" }}>
            <div style={{ width: "42%", height: "100%", background: "#C6922D", animation: "kbInviteLoad 1.1s ease-in-out infinite alternate" }} />
          </div>
          <style>{`@keyframes kbInviteLoad{from{transform:translateX(-20%)}to{transform:translateX(160%)}}`}</style>
        </section>
      </main>
    );
  }

  if (state.statusCode === "endpoint_not_ready") {
    return (
      <main id="kb-main-content" style={shellStyle}>
        <section style={cardStyle}>
          <Header title="Invitation access is being prepared." body="No action is required yet. Your invitation has not been used or changed." />
          <button type="button" style={{ ...secondaryButtonStyle, marginTop: 28 }} onClick={() => nav?.("landing")}>Return to FaithBid</button>
        </section>
      </main>
    );
  }

  if (!invitation || state.statusCode === "unavailable" || !state.invitationAvailable) {
    return (
      <main id="kb-main-content" style={shellStyle}>
        <section style={cardStyle}>
          <Header title="This invitation is unavailable." body="The link may be expired, revoked, already replaced, or incomplete. For privacy, FaithBid does not disclose which condition applies." />
          <button type="button" style={{ ...secondaryButtonStyle, marginTop: 28 }} onClick={() => nav?.("landing")}>Return to FaithBid</button>
        </section>
      </main>
    );
  }

  if (state.statusCode === "authenticated_email_mismatch") {
    return (
      <main id="kb-main-content" style={shellStyle}>
        <section style={cardStyle}>
          <Header title="Use the invited email address." body="You are signed in with a different email. Sign out, then use the same email address that received this invitation." />
          <button type="button" style={{ ...buttonStyle, marginTop: 28 }} onClick={signOutForDifferentAccount}>Sign out and try again</button>
        </section>
      </main>
    );
  }

  if (state.statusCode === "email_confirmation_required") {
    return (
      <main id="kb-main-content" style={shellStyle}>
        <section style={cardStyle}>
          <Header title="Confirm your email first." body="Open the confirmation message from Supabase, confirm this account, then return to the original FaithBid invitation link." />
          <button type="button" style={{ ...secondaryButtonStyle, marginTop: 28 }} onClick={inspectInvitation}>I've confirmed — check again</button>
        </section>
      </main>
    );
  }

  if (state.statusCode === "attention_required") {
    return (
      <main id="kb-main-content" style={shellStyle}>
        <section style={cardStyle}>
          <Header title="FaithBid needs to review this account." body="The account already has a conflicting role or profile state. Nothing was overwritten. FaithBid will need to resolve it before access can continue." />
          <button type="button" style={{ ...secondaryButtonStyle, marginTop: 28 }} onClick={() => nav?.("landing")}>Return to FaithBid</button>
        </section>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main id="kb-main-content" style={shellStyle}>
        <section style={cardStyle}>
          <Header
            title={isVendorInvitation
              ? (state.accountExists ? "Sign in to activate your Charter Vendor access." : "Activate your Charter Vendor account.")
              : (state.accountExists ? "Sign in to accept your invitation." : "Create your invited account.")}
            body={isVendorInvitation
              ? "Your Charter Vendor application has already been accepted. Use the same invited email address; FaithBid will carry your approved business, category, and location details into the account after secure finalization."
              : "This invitation is for a church account. Use the same email address that received the invitation."}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "28px 0 22px", padding: 5, borderRadius: 12, background: "rgba(28,40,20,.06)" }}>
            <button type="button" onClick={() => { setAuthMode("login"); setAuthError(""); setAuthMessage(""); }} style={{ border: 0, borderRadius: 9, minHeight: 42, background: authMode === "login" ? "#fff" : "transparent", color: "#1C2814", fontWeight: 800, cursor: "pointer", boxShadow: authMode === "login" ? "0 4px 16px rgba(28,40,20,.08)" : "none" }}>Sign in</button>
            <button type="button" onClick={() => { setAuthMode("signup"); setAuthError(""); setAuthMessage(""); }} style={{ border: 0, borderRadius: 9, minHeight: 42, background: authMode === "signup" ? "#fff" : "transparent", color: "#1C2814", fontWeight: 800, cursor: "pointer", boxShadow: authMode === "signup" ? "0 4px 16px rgba(28,40,20,.08)" : "none" }}>Create account</button>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <input aria-label="Email address" type="email" autoComplete="email" placeholder="Email address" value={email} onChange={event => setEmail(event.target.value)} style={inputStyle} />
            <input aria-label="Password" type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} placeholder="Password" value={password} onChange={event => setPassword(event.target.value)} onKeyDown={event => { if (event.key === "Enter") submitAuth(); }} style={inputStyle} />
          </div>
          {authError ? <div style={{ marginTop: 14, borderRadius: 10, padding: "11px 13px", background: "#FFF0EE", color: "#9B2C22", fontSize: 13, lineHeight: 1.5 }}>{authError}</div> : null}
          {authMessage ? <div style={{ marginTop: 14, borderRadius: 10, padding: "11px 13px", background: "#EEF7EC", color: "#285D2B", fontSize: 13, lineHeight: 1.5 }}>{authMessage}</div> : null}
          <button type="button" disabled={authBusy} onClick={submitAuth} style={{ ...buttonStyle, marginTop: 18, opacity: authBusy ? .6 : 1 }}>
            {authBusy ? "Please wait…" : authMode === "login" ? "Sign in and continue" : isVendorInvitation ? "Activate Charter Vendor account" : "Create invited account"}
          </button>
          <p style={{ margin: "16px 0 0", fontSize: 12, color: "#7A8376", lineHeight: 1.65 }}>FaithBid will not create a church or vendor profile until the invitation token, authenticated email, and email-confirmation state all pass server validation.</p>
        </section>
      </main>
    );
  }

  return (
    <main id="kb-main-content" style={shellStyle}>
      <section style={cardStyle}>
        <Header
          eyebrow={state.alreadyCompleted ? (isVendorInvitation ? "Charter Vendor activated" : "Invitation already accepted") : "Identity confirmed"}
          title={state.alreadyCompleted ? "Continue to FaithBid." : isVendorInvitation ? "Finish your Charter Vendor activation." : "Finish your FaithBid access."}
          body={state.alreadyCompleted
            ? "This invitation has already completed for your account. Continue to your workspace."
            : isVendorInvitation
              ? "Your authenticated email matches the accepted Charter Vendor invitation. FaithBid can now create or safely complete the approved account records without asking you to re-enter your application details."
              : "Your authenticated email matches this church invitation. FaithBid can now create or safely complete the correct account records."}
        />
        {authError ? <div style={{ marginTop: 18, borderRadius: 10, padding: "11px 13px", background: "#FFF0EE", color: "#9B2C22", fontSize: 13, lineHeight: 1.5 }}>{authError}</div> : null}
        <button type="button" disabled={finalizeBusy || !state.canFinalize} onClick={finalizeInvitation} style={{ ...buttonStyle, marginTop: 28, opacity: finalizeBusy || !state.canFinalize ? .6 : 1 }}>
          {finalizeBusy ? "Finishing setup…" : state.alreadyCompleted ? "Continue to FaithBid" : isVendorInvitation ? "Activate my Charter Vendor access" : "Complete my access"}
        </button>
      </section>
    </main>
  );
}


