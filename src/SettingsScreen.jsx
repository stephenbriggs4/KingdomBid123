import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";

let BRAND, KB_SETTINGS_NOTIFICATION_OPTIONS, KB_SETTINGS_TABS, LegalProtectionPanel, PAYMENT_STATUS_COPY, PLATFORM_RELEASE, buildSettingsAccountInfoRows, getPlatformCapabilityTone, getPlatformStatusSummary, getReturnNavigationTarget, getTrustSignalSummary, goToLandingFAQ, isValidEmail, logError, passwordStrengthError, readReturnContext;

function applySettingsScreenDependencies(values = {}) {
  ({ BRAND, KB_SETTINGS_NOTIFICATION_OPTIONS, KB_SETTINGS_TABS, LegalProtectionPanel, PAYMENT_STATUS_COPY, PLATFORM_RELEASE, buildSettingsAccountInfoRows, getPlatformCapabilityTone, getPlatformStatusSummary, getReturnNavigationTarget, getTrustSignalSummary, goToLandingFAQ, isValidEmail, logError, passwordStrengthError, readReturnContext } = values || {});
}

function isNotificationPrefsBackendUnavailable(error) {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();
  return ["42P01", "42501", "PGRST205"].includes(code)
    || (message.includes("notification_prefs") && (message.includes("schema cache") || message.includes("does not exist")));
}

function SettingsScreen({currentUser, role, showToast, nav, onSignOut}){
  const settingsReturnTarget = getReturnNavigationTarget(readReturnContext(), "projects");
  // The hydrated profile role is authoritative. Auth user_metadata can lag a
  // role correction and previously showed church-only notification options in
  // a vendor workspace.
  const userRole = role || currentUser?.user_metadata?.role || "church";
  const readSettingsTab = () => {
    if (typeof window === "undefined") return "account";
    try {
      const hash = String(window.location.hash || "");
      const query = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "";
      const candidate = new URLSearchParams(query).get("tab") || "account";
      return KB_SETTINGS_TABS.some(item => item.id === candidate) ? candidate : "account";
    } catch { return "account"; }
  };
  const [tab, setTab] = useState(readSettingsTab);
  const [fieldErrors, setFieldErrors] = useState({ email:"", password:"" });
  const [email, setEmail] = useState(currentUser?.email || "");
  // Keep email field in sync if currentUser changes
  useEffect(() => { setEmail(currentUser?.email || ""); }, [currentUser?.email]);
  // Settings tabs are deep-linkable without adding a second router. The main App parser
  // already ignores the query portion of #settings?... when resolving the screen.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncFromHash = () => {
      const next = readSettingsTab();
      setTab(current => current === next ? current : next);
    };
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined" || !KB_SETTINGS_TABS.some(item => item.id === tab)) return;
    const nextHash = `#settings?tab=${encodeURIComponent(tab)}`;
    if (window.location.hash !== nextHash) window.history.replaceState(window.history.state, "", nextHash);
  }, [tab]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [notifs, setNotifs] = useState({
    newBid: true, bidAccepted: true, newMessage: true, projectUpdate: false, newsletter: false,
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifPrefsAvailable, setNotifPrefsAvailable] = useState(true);
  const [notifPrefsChecked, setNotifPrefsChecked] = useState(false);

  // Load notification prefs from Supabase on mount. If this optional table/RLS is
  // not installed, Settings degrades cleanly instead of surfacing raw backend errors.
  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;
    setNotifPrefsChecked(false);
    supabase.from("notification_prefs").select("user_id,new_bid,bid_accepted,new_message,project_update,newsletter").eq("user_id", currentUser.id).maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setNotifPrefsChecked(true);
        if (error) {
          setNotifPrefsAvailable(!isNotificationPrefsBackendUnavailable(error));
          logError("settings-notification-prefs-load", error, { userId: currentUser.id, optionalBackend: true });
          return;
        }
        setNotifPrefsAvailable(true);
        if (data) setNotifs({
          newBid: data.new_bid ?? true,
          bidAccepted: data.bid_accepted ?? true,
          newMessage: data.new_message ?? true,
          projectUpdate: data.project_update ?? false,
          newsletter: data.newsletter ?? false,
        });
      })
      .catch(err => {
        if (!cancelled) {
          setNotifPrefsChecked(true);
          setNotifPrefsAvailable(!isNotificationPrefsBackendUnavailable(err));
          logError("settings-notification-prefs-load", err, { userId: currentUser.id, optionalBackend: true });
        }
      });
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  const saveNotifs = async () => {
    if (!currentUser?.id) { showToast("Sign in to update notification preferences", "error"); return; }
    if (!notifPrefsAvailable) { showToast("Notification preferences are not configured yet.", "error"); return; }
    setNotifSaving(true);
    try {
      const row = {
        user_id: currentUser.id,
        new_bid: notifs.newBid,
        bid_accepted: notifs.bidAccepted,
        new_message: notifs.newMessage,
        project_update: notifs.projectUpdate,
        newsletter: notifs.newsletter,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("notification_prefs").upsert(row, { onConflict: "user_id" });
      if (error) throw error;
      setNotifPrefsAvailable(true);
      showToast("✓ Notification preferences saved");
    } catch (err) {
      const backendUnavailable = isNotificationPrefsBackendUnavailable(err);
      setNotifPrefsAvailable(!backendUnavailable);
      logError("settings-notification-prefs-save", err, { userId: currentUser.id, optionalBackend: true });
      showToast(
        backendUnavailable
          ? "Notification preferences are not configured yet."
          : "Couldn't save notification preferences — please try again.",
        "error"
      );
    } finally {
      setNotifSaving(false);
    }
  };

  const updateEmail = async () => {
    const nextEmail = String(email || "").trim().toLowerCase();
    const currentEmailNorm = String(currentUser?.email || "").trim().toLowerCase();
    setFieldErrors(errors => ({ ...errors, email:"" }));
    if (!currentUser?.id) { setFieldErrors(errors => ({ ...errors, email:"Sign in again before changing your email." })); showToast("Sign in to update your email", "error"); return; }
    if (!nextEmail || nextEmail === currentEmailNorm) { showToast("No change to email"); return; }
    if (!isValidEmail(nextEmail)) { setFieldErrors(errors => ({ ...errors, email:"Enter a valid email address." })); showToast("Enter a valid email address", "error"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: nextEmail });
      if (error) throw error;
      setEmail(nextEmail);
      setFieldErrors(errors => ({ ...errors, email:"" }));
      showToast("Confirmation sent to new email — check your inbox");
    } catch (err) {
      logError("settings-email-update", err, { userId: currentUser.id });
      setFieldErrors(errors => ({ ...errors, email:String(err?.message || "Couldn't update email. Please try again.") }));
      showToast("Couldn't update email — please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async () => {
    setFieldErrors(errors => ({ ...errors, password:"" }));
    if (!currentPassword) { setFieldErrors(errors => ({ ...errors, password:"Enter your current password to continue." })); showToast("Enter your current password to continue"); return; }
    const strengthError = passwordStrengthError(newPassword);
    if (strengthError) { setFieldErrors(errors => ({ ...errors, password:strengthError })); showToast(strengthError); return; }
    if (newPassword !== confirmPassword) { setFieldErrors(errors => ({ ...errors, password:"Passwords don't match." })); showToast("Passwords don't match"); return; }
    if (newPassword === currentPassword) { setFieldErrors(errors => ({ ...errors, password:"New password must differ from your current password." })); showToast("New password must differ from current password"); return; }
    if (!currentUser?.email) { setFieldErrors(errors => ({ ...errors, password:"Account email is missing. Sign out and back in before retrying." })); showToast("Missing account email — sign out and back in"); return; }
    setSaving(true);
    try {
      // Re-auth: verify the current password before allowing the change.
      // Supabase updateUser() does not require re-entry, so anyone with a live
      // session (a stolen browser tab) could otherwise change the password.
      const { error: reauthErr } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword,
      });
      if (reauthErr) {
        logError("password-reauth", reauthErr);
        setFieldErrors(errors => ({ ...errors, password:"Current password is incorrect." }));
        showToast("Current password is incorrect");
        setSaving(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        logError("password-update", error);
        setFieldErrors(errors => ({ ...errors, password:String(error?.message || "Couldn't update password. Please try again.") }));
        showToast("Couldn't update password — please try again.", "error");
      } else {
        showToast("Password updated");
        setFieldErrors(errors => ({ ...errors, password:"" }));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      logError("password-update-exception", err);
      setFieldErrors(errors => ({ ...errors, password:String(err?.message || "Could not update password. Please try again.") }));
      showToast("Could not update password — please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const emailVerified = !!currentUser?.email_confirmed_at;
  const trustSignals = getTrustSignalSummary({ role: userRole, isVerified: !!currentUser?.user_metadata?.vendor_verified, emailVerified });
  const TABS = KB_SETTINGS_TABS;
  const visibleNotificationOptions = useMemo(() => (
    KB_SETTINGS_NOTIFICATION_OPTIONS.filter(item => {
      if (userRole === "vendor" && item.key === "newBid") return false;
      if (userRole !== "vendor" && item.key === "bidAccepted") return false;
      return true;
    })
  ), [userRole]);

  // Brand-system tokens used throughout this screen
  const sx = {
    shell:{background:"#faf8f4",minHeight:"100vh",paddingBottom:60},
    topbar:{maxWidth:1100,margin:"0 auto",padding:"22px 28px 0",display:"flex",alignItems:"center",gap:12},
    backPill:{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px 7px 11px",borderRadius:999,background:"#fffdf8",border:"1px solid #dfd5c2",color:"#1C2814",fontSize:12.5,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",transition:"all 0.15s",boxShadow:"0 4px 12px rgba(28,40,20,0.04)"},
    crumb:{fontSize:11.5,color:"#7d7363",fontFamily:"'DM Mono',monospace",letterSpacing:0.6,textTransform:"uppercase",fontWeight:600},
    headWrap:{maxWidth:1100,margin:"0 auto",padding:"22px 28px 28px"},
    headPanel:{background:"#fffdf8",border:"1px solid #dfd5c2",borderRadius:22,padding:"28px 30px 26px",boxShadow:"0 7px 20px rgba(28,40,20,0.045)"},
    eyebrow:{fontFamily:"'DM Mono',monospace",fontSize:10.5,fontWeight:700,letterSpacing:2.4,textTransform:"uppercase",color:"#b08840",marginBottom:10},
    headline:{fontFamily:"'Playfair Display',Georgia,serif",fontSize:36,fontWeight:700,color:"#1C2814",letterSpacing:-0.7,lineHeight:1.05,marginBottom:6},
    sub:{fontSize:14,color:"#5a5246",lineHeight:1.55,maxWidth:560},
    tabsWrap:{maxWidth:1100,margin:"0 auto",padding:"0 28px",borderBottom:"1px solid #ece4d2",display:"flex",gap:24,overflowX:"auto"},
    tab:(active)=>({padding:"12px 0 14px",fontSize:13,fontWeight:active?700:600,color:active?"#1C2814":"#7d7363",position:"relative",background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"color 0.15s",whiteSpace:"nowrap"}),
    tabBar:{position:"absolute",left:0,right:0,bottom:-1,height:2.5,background:"linear-gradient(90deg,#c9a45c,#b08840)",borderRadius:2},
    body:{maxWidth:760,margin:"0 auto",padding:"24px 28px 0"},
    panel:{background:"#fff",border:"1px solid #dfd5c2",borderRadius:18,marginBottom:18,boxShadow:"0 6px 18px rgba(28,40,20,0.04)",overflow:"hidden"},
    panelHd:{padding:"16px 22px 14px",background:"#fffdf8",borderBottom:"1px solid #ece4d2",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"},
    panelEyebrow:{fontFamily:"'DM Mono',monospace",fontSize:9.5,fontWeight:700,letterSpacing:1.8,textTransform:"uppercase",color:"#b08840"},
    panelTitle:{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:700,color:"#1C2814",letterSpacing:-0.3,marginTop:2},
    panelMeta:{fontSize:11.5,color:"#7d7363"},
    panelBody:{padding:"22px"},
    label:{display:"block",fontSize:11.5,fontWeight:700,letterSpacing:0.6,textTransform:"uppercase",color:"#5a5246",marginBottom:8,fontFamily:"'DM Sans',sans-serif"},
    input:{width:"100%",height:46,padding:"0 14px",borderRadius:12,border:"1.5px solid #dfd5c2",background:"#fffdf8",fontSize:14,color:"#1C2814",fontFamily:"'DM Sans',sans-serif",outline:"none",transition:"border-color 0.15s,box-shadow 0.15s"},
    field:{marginBottom:18},
    helperText:{fontSize:12,color:"#7d7363",marginBottom:14,lineHeight:1.5},
    btnPrimary:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"11px 22px",borderRadius:999,background:"linear-gradient(180deg,#c9a45c,#b08840)",color:"#fff",fontSize:13,fontWeight:700,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",letterSpacing:0.2,boxShadow:"0 4px 12px rgba(176,136,64,0.25),inset 0 1px 0 rgba(255,255,255,0.18)",transition:"all 0.15s"},
    btnSecondary:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 20px",borderRadius:999,background:"#fffdf8",color:"#1C2814",fontSize:13,fontWeight:600,border:"1px solid #dfd5c2",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"},
    btnDanger:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 20px",borderRadius:999,background:"#fffdf8",color:"#a23b3b",fontSize:13,fontWeight:600,border:"1px solid #e6c4c4",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"},
    infoBlock:{padding:"12px 14px",background:"#fffdf8",border:"1px solid #ece4d2",borderRadius:12,fontSize:12.5,color:"#5a5246",lineHeight:1.6,marginBottom:14},
    rowDivider:{padding:"12px 0",borderBottom:"1px solid #f0e9d9",display:"flex",alignItems:"center",justifyContent:"space-between",gap:14},
    rowLabel:{fontSize:13,color:"#5a5246",fontFamily:"'DM Sans',sans-serif"},
    rowVal:{fontSize:13,fontWeight:600,color:"#1C2814",fontFamily:"'DM Mono',monospace",textAlign:"right"},
  };

  return (
    <div className="kb-settings-screen" style={sx.shell}>
      {/* Top bar */}
      <div className="kb-settings-topbar" style={sx.topbar}>
        <button type="button" onClick={()=>nav(settingsReturnTarget?.screen || "projects")} style={sx.backPill} onMouseOver={e=>{e.currentTarget.style.background="#fffaf0";e.currentTarget.style.borderColor="#c9a45c";}} onMouseOut={e=>{e.currentTarget.style.background="#fffdf8";e.currentTarget.style.borderColor="#dfd5c2";}}>
          <span style={{fontSize:14,lineHeight:1}}>←</span> {settingsReturnTarget?.label || "Back"}
        </button>
        <span style={{color:"#c8bfa9"}}>·</span>
        <span style={sx.crumb}>Settings</span>
      </div>

      {/* Cream headline section */}
      <div className="kb-settings-head-wrap" style={sx.headWrap}>
        <div className="kb-settings-head-panel" style={sx.headPanel}>
          <div style={sx.eyebrow}>Account settings</div>
          <h1 style={sx.headline}>Manage your account</h1>
          <div style={sx.sub}>Update your email and password, set notification preferences, and review trust, platform, and legal information for your FaithBid account.</div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="kb-settings-tabs" style={sx.tabsWrap}>
        {TABS.map(t=>(
          <button key={t.id} type="button" onClick={()=>setTab(t.id)} style={sx.tab(tab===t.id)}>
            {t.label}
            {tab===t.id && <span style={sx.tabBar}/>}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="kb-settings-body" style={sx.body}>
        {/* ── ACCOUNT TAB ── */}
        {tab==="account" && (
          <>
            <div style={sx.panel}>
              <div style={sx.panelHd}>
                <div>
                  <div style={sx.panelEyebrow}>Email</div>
                  <div style={sx.panelTitle}>Email address</div>
                </div>
              </div>
              <div style={sx.panelBody}>
                <div style={sx.field}>
                  <label style={sx.label} htmlFor="email-input">Current email</label>
                  <input id="email-input" aria-label="you@ministry.org" aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "email-input-error" : undefined} type="email" value={email} onChange={e=>{setEmail(e.target.value);setFieldErrors(errors=>({...errors,email:""}));}} placeholder="you@ministry.org" autoComplete="email" style={{...sx.input,borderColor:fieldErrors.email?"#a23b3b":"#dfd5c2"}} onFocus={e=>{e.currentTarget.style.borderColor="#b08840";e.currentTarget.style.boxShadow="0 0 0 3px rgba(176,136,64,0.12)";}} onBlur={e=>{e.currentTarget.style.borderColor=fieldErrors.email?"#a23b3b":"#dfd5c2";e.currentTarget.style.boxShadow="none";}}/>
                  {fieldErrors.email && <div id="email-input-error" role="alert" style={{fontSize:12,color:"#a23b3b",marginTop:7,fontWeight:650}}>{fieldErrors.email}</div>}
                </div>
                <div style={sx.helperText}>Changing your email will require confirmation from the new address.</div>
                <button type="button" style={{...sx.btnPrimary,opacity:(saving||email===currentUser?.email)?0.5:1,cursor:(saving||email===currentUser?.email)?"not-allowed":"pointer"}} onClick={updateEmail} disabled={saving||email===currentUser?.email}>{saving ? "Updating…" : "Update email"}</button>
              </div>
            </div>

            <div style={sx.panel}>
              <div style={sx.panelHd}>
                <div>
                  <div style={sx.panelEyebrow}>Security</div>
                  <div style={sx.panelTitle}>Password</div>
                </div>
              </div>
              <div style={sx.panelBody}>
                <div style={sx.field}>
                  <label style={sx.label} htmlFor="pw-current">Current password</label>
                  <input id="pw-current" type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="Enter current password" autoComplete="current-password" style={sx.input} onFocus={e=>{e.currentTarget.style.borderColor="#b08840";e.currentTarget.style.boxShadow="0 0 0 3px rgba(176,136,64,0.12)";}} onBlur={e=>{e.currentTarget.style.borderColor="#dfd5c2";e.currentTarget.style.boxShadow="none";}}/>
                </div>
                <div style={sx.field}>
                  <label style={sx.label} htmlFor="pw-new">New password</label>
                  <input id="pw-new" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="At least 8 characters, letters and numbers" autoComplete="new-password" style={sx.input} onFocus={e=>{e.currentTarget.style.borderColor="#b08840";e.currentTarget.style.boxShadow="0 0 0 3px rgba(176,136,64,0.12)";}} onBlur={e=>{e.currentTarget.style.borderColor="#dfd5c2";e.currentTarget.style.boxShadow="none";}}/>
                  {newPassword && (()=>{
                    const hasLen = newPassword.length >= 8;
                    const hasLetter = /[A-Za-z]/.test(newPassword);
                    const hasNum = /\d/.test(newPassword);
                    const score = [hasLen, hasLetter, hasNum].filter(Boolean).length;
                    const label = score === 3 ? 'Strong' : score === 2 ? 'Fair' : 'Weak';
                    const color = score === 3 ? '#3d8049' : score === 2 ? '#b08840' : '#a23b3b';
                    const width = score === 3 ? '100%' : score === 2 ? '60%' : '25%';
                    return <div style={{marginTop:8}}>
                      <div style={{height:3,borderRadius:999,background:'#f0e9d9',overflow:'hidden'}}>
                        <div style={{height:'100%',width,background:color,transition:'width 0.3s,background 0.3s',borderRadius:999}}/>
                      </div>
                      <div style={{fontSize:11,color,marginTop:5,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>{label}</div>
                    </div>;
                  })()}
                </div>
                <div style={sx.field}>
                  <label style={sx.label} htmlFor="pw-confirm">Confirm new password</label>
                  <input id="pw-confirm" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Repeat new password" autoComplete="new-password" style={sx.input} onFocus={e=>{e.currentTarget.style.borderColor="#b08840";e.currentTarget.style.boxShadow="0 0 0 3px rgba(176,136,64,0.12)";}} onBlur={e=>{e.currentTarget.style.borderColor="#dfd5c2";e.currentTarget.style.boxShadow="none";}}/>
                </div>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <div style={{fontSize:12,color:"#a23b3b",marginBottom:14,fontWeight:600}}>Passwords don't match</div>
                )}
                {fieldErrors.password && <div role="alert" style={{fontSize:12,color:"#a23b3b",marginBottom:14,fontWeight:650}}>{fieldErrors.password}</div>}
                <button type="button" style={{...sx.btnPrimary,opacity:(saving||!currentPassword||!newPassword||!confirmPassword)?0.5:1,cursor:(saving||!currentPassword||!newPassword||!confirmPassword)?"not-allowed":"pointer"}} onClick={updatePassword} disabled={saving||!currentPassword||!newPassword||!confirmPassword}>{saving ? "Updating…" : "Update password"}</button>
              </div>
            </div>

            <div style={sx.panel}>
              <div style={sx.panelHd}>
                <div>
                  <div style={sx.panelEyebrow}>Account</div>
                  <div style={sx.panelTitle}>Account information</div>
                </div>
              </div>
              <div style={sx.panelBody}>
                {buildSettingsAccountInfoRows(currentUser).map((item,i,arr)=>(
                  <div key={item.label} style={{...sx.rowDivider,borderBottom:i===arr.length-1?"none":"1px solid #f0e9d9"}}>
                    <span style={sx.rowLabel}>{item.label}</span>
                    <span style={sx.rowVal}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {tab==="notifications" && (
          <div style={sx.panel}>
            <div style={sx.panelHd}>
              <div>
                <div style={sx.panelEyebrow}>Preferences</div>
                <div style={sx.panelTitle}>Notifications</div>
              </div>
              <span style={sx.panelMeta}>In-app live · email before launch</span>
            </div>
            <div style={sx.panelBody}>
              {!notifPrefsAvailable && notifPrefsChecked && (
                <div style={{...sx.infoBlock,marginBottom:16,background:"#fff8e8",border:"1px solid #ead8aa"}}>
                  <strong style={{color:"#1C2814",fontWeight:700}}>Notification preferences are not configured yet.</strong> Your core in-app notifications still work; this optional preference table can be enabled later without breaking Settings.
                </div>
              )}
              {visibleNotificationOptions.map((item,i,arr)=>(
                <div key={item.key} style={{...sx.rowDivider,padding:"14px 0",borderBottom:i===arr.length-1?"none":"1px solid #f0e9d9",opacity:notifPrefsAvailable?1:0.58}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13.5,fontWeight:600,color:"#1C2814",fontFamily:"'DM Sans',sans-serif"}}>{item.label}</div>
                    <div style={{fontSize:12,color:"#7d7363",marginTop:3,lineHeight:1.45}}>{item.sub}</div>
                  </div>
                  <button
                    type="button"
                    aria-pressed={!!notifs[item.key]}
                    aria-label={`Toggle ${item.label}`}
                    onClick={()=>notifPrefsAvailable && setNotifs(n=>({...n,[item.key]:!n[item.key]}))}
                    disabled={!notifPrefsAvailable}
                    style={{width:42,height:24,borderRadius:100,background:notifs[item.key]?"linear-gradient(180deg,#c9a45c,#b08840)":"#ece4d2",border:notifs[item.key]?"1px solid #b08840":"1px solid #dfd5c2",cursor:notifPrefsAvailable?"pointer":"not-allowed",position:"relative",transition:"all 0.18s",flexShrink:0,padding:0}}
                  >
                    <div style={{position:"absolute",top:1.5,left:notifs[item.key]?20:1.5,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(28,40,20,0.18)"}}/>
                  </button>
                </div>
              ))}
              <div style={{...sx.infoBlock,marginTop:18,marginBottom:0}}>
                <strong style={{color:"#1C2814",fontWeight:700}}>In-app notifications are live.</strong> Email alerts will be added before launch.
              </div>
              <div style={{marginTop:18}}>
                <button type="button" style={{...sx.btnPrimary,opacity:(notifSaving||!notifPrefsAvailable)?0.6:1,cursor:notifSaving?"wait":(!notifPrefsAvailable?"not-allowed":"pointer")}} onClick={saveNotifs} disabled={notifSaving||!notifPrefsAvailable}>
                  {notifSaving ? "Saving…" : notifPrefsAvailable ? "Save preferences" : "Preferences unavailable"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TRUST TAB ── */}
        {tab==="trust" && (
          <>
            <div style={sx.panel}>
              <div style={sx.panelHd}>
                <div>
                  <div style={sx.panelEyebrow}>Trust</div>
                  <div style={sx.panelTitle}>Trust summary</div>
                </div>
              </div>
              <div style={sx.panelBody}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:18}}>
                  {trustSignals.map((item)=>(
                    <div key={item.label} style={{padding:"16px 17px",borderRadius:14,border:"1px solid #dfd5c2",background:"#fffdf8",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,bottom:0,width:3,background:"linear-gradient(180deg,#c9a45c,#b08840)"}}/>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:9.5,fontWeight:700,letterSpacing:1.4,textTransform:"uppercase",color:"#b08840",marginBottom:8}}>{item.label}</div>
                      <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:24,fontWeight:700,color:item.tone || "#1C2814",lineHeight:1.05,letterSpacing:-0.4}}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div style={sx.infoBlock}>{PAYMENT_STATUS_COPY.trust}</div>
              </div>
            </div>
            <div style={sx.panel}>
              <div style={sx.panelHd}>
                <div>
                  <div style={sx.panelEyebrow}>Reputation</div>
                  <div style={sx.panelTitle}>Verification & reputation</div>
                </div>
              </div>
              <div style={sx.panelBody}>
                {userRole === "vendor" ? (
                  <>
                    <div style={{fontSize:13.5,color:"#5a5246",lineHeight:1.7,marginBottom:18}}>Churches trust profiles that show real proof: a complete profile, clear review history, and a visible verification path. Faith Verified reflects additional FaithBid review of your faith statement and ministry reference information.</div>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                      <button type="button" style={sx.btnPrimary} onClick={()=>nav("verify-profile")}>Open verification</button>
                      <button type="button" style={sx.btnSecondary} onClick={()=>nav("reviews")}>Review reputation</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{fontSize:13.5,color:"#5a5246",lineHeight:1.7,marginBottom:18}}>When you hire through FaithBid, trust should be visible. Review badges, read project-specific feedback, and keep milestone approvals and disputes documented in-platform so every decision is grounded in a real record.</div>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                      <button type="button" style={sx.btnPrimary} onClick={()=>nav("reviews")}>Review proof</button>
                      <button type="button" style={sx.btnSecondary} onClick={()=>nav("vendors")}>Browse verified vendors</button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div style={sx.panel}>
              <div style={sx.panelHd}>
                <div>
                  <div style={sx.panelEyebrow}>Support</div>
                  <div style={sx.panelTitle}>Disputes & support</div>
                </div>
              </div>
              <div style={sx.panelBody}>
                <div style={{fontSize:13.5,color:"#5a5246",lineHeight:1.7,marginBottom:18}}>If work goes off track, FaithBid keeps the conversation record, deliverables, approvals, and dispute history together. That makes mediation cleaner and protects both sides from "he said / she said" chaos.</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <button type="button" style={sx.btnPrimary} onClick={()=>setTab("legal")}>Open legal protections</button>
                  <button type="button" style={sx.btnSecondary} onClick={()=>goToLandingFAQ(nav)}>Read trust FAQ</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── PLATFORM STATUS TAB ── */}
        {tab==="platform" && (
          <>
            <div style={sx.panel}>
              <div style={sx.panelHd}>
                <div>
                  <div style={sx.panelEyebrow}>Status</div>
                  <div style={sx.panelTitle}>Platform status</div>
                </div>
              </div>
              <div style={sx.panelBody}>
                <div style={sx.infoBlock}>{getPlatformStatusSummary()}</div>
                <div style={{display:"grid",gap:10}}>
                  {PLATFORM_RELEASE.capabilityRows.map(item=>{
                    const tone = getPlatformCapabilityTone(item.status);
                    return (
                      <div key={item.key} style={{padding:"15px 16px",borderRadius:14,border:`1px solid ${tone.border}`,background:tone.bg}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:6,flexWrap:"wrap"}}>
                          <div style={{fontSize:13.5,fontWeight:700,color:"#1C2814",fontFamily:"'DM Sans',sans-serif"}}>{item.label}</div>
                          <span style={{padding:"4px 11px",borderRadius:999,fontSize:9.5,fontWeight:800,letterSpacing:0.8,textTransform:"uppercase",color:tone.color,background:"rgba(255,255,255,0.78)",border:`1px solid ${tone.border}`,fontFamily:"'DM Mono',monospace"}}>{tone.label}</span>
                        </div>
                        <div style={{fontSize:12.5,color:"#5a5246",lineHeight:1.65}}>{item.detail}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div style={sx.panel}>
              <div style={sx.panelHd}>
                <div>
                  <div style={sx.panelEyebrow}>Discipline</div>
                  <div style={sx.panelTitle}>Launch discipline</div>
                </div>
              </div>
              <div style={sx.panelBody}>
                {[
                  { label:'Current phase', value: PLATFORM_RELEASE.stage === 'beta' ? 'Private beta' : PLATFORM_RELEASE.stage },
                  { label:'Launch label', value: PLATFORM_RELEASE.launchLabel },
                  { label:'Verification review window', value: PLATFORM_RELEASE.verificationReviewWindow },
                  { label:'Fee policy', value: PLATFORM_RELEASE.feeLabel },
                ].map((item, i, arr)=>(
                  <div key={item.label} style={{...sx.rowDivider,borderBottom:i===arr.length-1?"none":"1px solid #f0e9d9"}}>
                    <span style={sx.rowLabel}>{item.label}</span>
                    <span style={sx.rowVal}>{item.value}</span>
                  </div>
                ))}
                <div style={{marginTop:16,fontSize:12,color:"#7d7363",lineHeight:1.7}}>This tab is the canonical platform-state reference so launch, beta, trust, and manual-vs-live capability copy stay aligned across marketing, settings, onboarding, and support surfaces.</div>
              </div>
            </div>
          </>
        )}

        {/* ── LEGAL TAB ── */}
        {tab==="legal" && (
          <LegalProtectionPanel role={userRole} showToast={showToast}/>
        )}

        {/* ── DANGER ZONE TAB ── */}
        {tab==="danger" && (
          <div style={{...sx.panel,border:"1px solid #e6c4c4"}}>
            <div style={{...sx.panelHd,background:"#fdf6f6",borderBottom:"1px solid #f0d8d8"}}>
              <div>
                <div style={{...sx.panelEyebrow,color:"#a23b3b"}}>Caution</div>
                <div style={{...sx.panelTitle,color:"#7a2d2d"}}>Danger zone</div>
              </div>
            </div>
            <div style={sx.panelBody}>
              <div style={{marginBottom:24}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1C2814",marginBottom:6,fontFamily:"'DM Sans',sans-serif"}}>Sign out</div>
                <div style={{fontSize:13,color:"#5a5246",marginBottom:14,lineHeight:1.55}}>Sign out of your account on this device.</div>
                <button type="button" style={sx.btnDanger} onClick={onSignOut}>Sign out</button>
              </div>
              <div style={{borderTop:"1px solid #f0e9d9",paddingTop:24}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1C2814",marginBottom:6,fontFamily:"'DM Sans',sans-serif"}}>Delete account</div>
                <div style={{fontSize:13,color:"#5a5246",marginBottom:14,lineHeight:1.55}}>Account deletion is handled by FaithBid support so ownership can be verified before any data is removed.</div>
                <button
                  type="button"
                  style={sx.btnDanger}
                  onClick={()=>showToast(`To delete your account, contact ${BRAND.supportEmail}`)}
                >Contact support to delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsScreenRoute({ dependencies, ...props }) {
  applySettingsScreenDependencies(dependencies);
  return <SettingsScreen {...props} />;
}
