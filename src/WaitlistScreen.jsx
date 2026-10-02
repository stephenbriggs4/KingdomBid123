import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { LegalConsentCheckbox } from "./LegalConsent";

let CATEGORIES, CHARTER_VENDOR_PRO_FREE_MONTHS, CHARTER_VENDOR_PRO_VALUE_LABEL, KB_US_STATE_CODES, LAUNCH_LABEL, PLATFORM_FEE_CAP, VENDOR_PRO_FEE_CAP, buildWaitlistAttributionFields, buildWaitlistSnapshot, getAppUrl, getWaitlistSourceForMode, isValidEmail, isWaitlistDuplicateEmailError, kbSafeLocalGet, kbSafeLocalRemove, kbSafeLocalSet, logError, normalizeRefCode, recordPublicFunnelEvent, runSupabaseWithTimeout, sendWaitlistEmail;

function applyWaitlistScreenDependencies(values = {}) {
  ({ CATEGORIES, CHARTER_VENDOR_PRO_FREE_MONTHS, CHARTER_VENDOR_PRO_VALUE_LABEL, KB_US_STATE_CODES, LAUNCH_LABEL, PLATFORM_FEE_CAP, VENDOR_PRO_FEE_CAP, buildWaitlistAttributionFields, buildWaitlistSnapshot, getAppUrl, getWaitlistSourceForMode, isValidEmail, isWaitlistDuplicateEmailError, kbSafeLocalGet, kbSafeLocalRemove, kbSafeLocalSet, logError, normalizeRefCode, recordPublicFunnelEvent, runSupabaseWithTimeout, sendWaitlistEmail } = values || {});
}

function getWaitlistRoleMeta() {
  return Object.freeze({
  church: {
    eyebrow: "Dallas pilot · Limited early access",
    headline: "Request access for your church.",
    subhead: "We’re welcoming a small group of Dallas-area churches to our pilot. Tell us about your church and we’ll follow up. This isn’t a project post or a commitment, and it doesn’t create an account yet.",
    benefits: [
      { title: "No project posted yet", body: "Your church is only requesting access. You can create a project later, when the need, budget, and timing are clear." },
      { title: "Built for church hiring", body: "Compare vendors who understand ministry work instead of chasing referrals across texts, spreadsheets, and inboxes." },
      { title: "Free during early access", body: "Founding churches can join before public launch and help shape the marketplace before it opens broadly." },
    ],
    bullets: [
      "Request access now; publish your first project later.",
      "Founding churches receive early vendor access as launch waves open.",
      "Your church is not committing to hire anyone by joining early access.",
    ],
    steps: [
      "Request access for your church with a short form.",
      "We invite churches in focused launch waves by geography and project demand.",
      "When your wave opens, you can post your first project inside a guided workspace.",
    ],
    primaryLabel: "Request access →",
    secondaryLabel: "Back to FaithBid",
    requiredSummary: "5 required fields",
    microcopy: "No live project is posted. No vendor will contact you from this form.",
    doneTitle: "Your access request is received.",
    doneBody: "Your first project can be created once your launch invite arrives — we'll email you the moment your wave opens.",
    positionLabel: "Church access spot",
    shareTitle: "Invite another church",
    shareBody: "Know another church that could use a cleaner vendor-hiring process? Share your referral link with them.",
    nextSteps: [
      "We invite churches in focused launch waves by geography and project demand.",
      "We'll email you the moment your church's wave opens.",
    ],
  },
  vendor: {
    eyebrow: "Charter Vendor application",
    headline: "Apply for Charter Vendor status.",
    subhead: `Opening ${LAUNCH_LABEL}. Charter Vendors are the first curated providers invited before public launch. Accepted vendors receive permanent Charter status, launch priority, and early profile access.`,
    benefits: [
      { title: "Permanent Charter badge", body: "A visible credential on your profile that stays after launch and signals you were part of the first accepted cohort." },
      { title: "Priority placement", body: "Accepted Charter Vendors receive launch priority ahead of vendors who join after the marketplace opens publicly." },
      { title: "Early network access", body: "Accepted Charter Vendors receive early profile access and priority consideration when their services fit a church need." },
      { title: "Short application first", body: "Apply with the essentials now. Portfolio, references, and Faith Verified steps come after acceptance." },
    ],
    bullets: [
      "Charter Vendor status is selective and reviewed before launch.",
      "Accepted vendors receive permanent launch-era credibility.",
      "Accepted Charter Vendors receive early profile access and priority consideration for relevant opportunities.",
      "Full profile, proof, and verification are completed after acceptance.",
    ],
    steps: [
      "Submit the short Charter application.",
      "We review fit by category, service area, and church experience.",
      "Accepted vendors receive the next profile setup step by email.",
    ],
    primaryLabel: "Submit Charter application →",
    secondaryLabel: "Back to FaithBid",
    requiredSummary: "7 required inputs",
    microcopy: "Apply for Charter Vendor consideration. No paid plan is being offered through this application.",
    doneTitle: "Charter application received.",
    doneBody: "You do not need to create another FaithBid account now. FaithBid reviews each Charter Vendor application first; if accepted, your activation link continues this same onboarding journey.",
    positionLabel: "Charter application spot",
    shareTitle: "Invite another vendor",
    shareBody: "Know a serious vendor who serves churches well? Share your referral link with them.",
    nextSteps: [
      "FaithBid reviews vendor fit by category, city, service area, and church experience.",
      "If accepted, you receive one Charter Vendor activation link — no second signup form and no duplicate business entry.",
      "After activation, complete your profile and then choose whether to pursue Faith Verification; your Charter status stays tied to the accepted account.",
    ],
  },
  });
}

const WAITLIST_RECEIPT_KEY = (mode) => `kb-waitlist-receipt-${mode === "vendor" ? "vendor" : "church"}`;

function saveWaitlistReceipt(mode, result) {
  if (!result || !result.email) return;
  try {
    kbSafeLocalSet(WAITLIST_RECEIPT_KEY(mode), JSON.stringify({
      code: result.code || null,
      email: result.email || null,
      city: result.city || null,
      category: result.category || null,
      first_project: result.first_project || null,
      alreadyJoined: !!result.alreadyJoined,
      referralValidated: result.referralValidated === true,
      savedAt: Date.now(),
    }));
  } catch { /* localStorage unavailable (quota, private mode) -- receipt save is best-effort */ }
}

function loadWaitlistReceipt(mode) {
  try {
    const raw = kbSafeLocalGet(WAITLIST_RECEIPT_KEY(mode));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.email) return null;
    // A returning visit is a resumed receipt, not a fresh submission: never
    // replay the celebratory success modal, and mark it so copy stays calm.
    return { ...parsed, position: null, resumed: true };
  } catch { return null; }
}

function WaitlistFlow({ mode = "church", nav, showToast, setAuthDefaultRole = null, telemetryEnabled = false }) {
  const isVendor = mode === "vendor";
  const roleMeta = getWaitlistRoleMeta();
  const meta = roleMeta[mode] || roleMeta.church;
  const [form, setForm] = useState({
    full_name: "", org_name: "", email: "", title_role: "", category: "", city: "", state_code: "",
    delivery_model: "", congregation_size: "", first_project: "", past_church_client: "", referred_by: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [result, setResult] = useState(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  // 853o — Autofill-safe honeypot. The 853m/853n honeypot used a text input
  // named "kb_company_url" with an associated <label> and autoComplete="off".
  // That combination is exactly what aggressive browser password managers and
  // autofill engines target: autoComplete="off" is widely ignored for text
  // fields, and a guessable name like "company_url" invites autofill, which
  // produced a confirmed false-positive rejection of a legitimate vendor.
  //
  // The fix makes the trap field genuinely unattractive to autofill: a neutral
  // name with no autofill-semantic tokens (no "url"/"email"/"name"/"company"/
  // "phone"/"address"), no associated <label>, autoComplete="new-password", and
  // it stays readOnly until a real pointer/key interaction arms it — password
  // managers do not type into readOnly inputs, so ordinary autofill can no
  // longer populate it. The block decision depends ONLY on the trap value, so a
  // fast legitimate user is never blocked. A filled trap still hard-stops
  // before every insert/mirror/referral/email.
  const [kbTrap, setKbTrap] = useState("");
  const [kbTrapArmed, setKbTrapArmed] = useState(false);
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!telemetryEnabled) return;
    recordPublicFunnelEvent("waitlist_view", { role: mode, surface: "early_access" });
  }, [mode, telemetryEnabled]);

  useEffect(() => {
    mountedRef.current = true;
    const t = setTimeout(() => { if (mountedRef.current) setMounted(true); }, 20);
    return () => { mountedRef.current = false; clearTimeout(t); };
  }, []);

  useEffect(() => {
    let task;
    try {
      const h = String(window.location.hash || "");
      const q = String(window.location.search || "");
      const m = h.match(/[?&]ref=([^&#]+)/i) || q.match(/[?&]ref=([^&#]+)/i);
      let rawRef = m?.[1] || "";
      try { rawRef = decodeURIComponent(rawRef); } catch { /* malformed encoding -- fall back to the raw value */ }
      const code = normalizeRefCode(rawRef);
      if (code) task = setTimeout(() => setForm(f => ({ ...f, referred_by: code })), 0);
    } catch { /* no ref param present or URL parsing failed -- not fatal */ }
    return () => clearTimeout(task);
  }, []);

  // Returnable receipt: if this browser already completed a signup for this
  // role, resume the confirmation state instead of showing a blank form. The
  // resumed flag keeps copy calm and suppresses the celebratory modal replay.
  useEffect(() => {
    const saved = loadWaitlistReceipt(mode);
    if (!saved) return undefined;
    const task = setTimeout(() => setResult(saved), 0);
    return () => clearTimeout(task);
  }, [mode]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: typeof e === "string" ? e : e.target.value }));

  // A genuine interaction anywhere in the visible form arms the trap. Clear
  // any pre-interaction value first so browser/password-manager autofill can
  // never create a false positive. Once armed, scripted field-fillers that
  // populate every input are still caught by the normal trap short-circuit.
  const armKbTrap = () => {
    if (kbTrapArmed) return;
    setKbTrap("");
    setKbTrapArmed(true);
  };

  const canSubmit = agreedToTerms && (isVendor
    ? !!(form.full_name.trim() && form.org_name.trim() && isValidEmail(form.email) && form.category && form.city.trim() && form.state_code && form.delivery_model)
    : !!(form.full_name.trim() && form.org_name.trim() && isValidEmail(form.email) && form.city.trim() && form.state_code));

  const submit = async () => {
    if (submitting) return;
    // 853o — Autofill-safe honeypot short-circuit. Only a filled trap field
    // (which readOnly-gating + neutral naming keep autofill and humans out of)
    // triggers this. If tripped, stop BEFORE any side effect: no waitlist
    // insert, no early_signups mirror, no referral record, no
    // send-waitlist-email invocation. We show a neutral, non-technical
    // acknowledgement so an automated client gets no signal it was detected.
    // The trap value is never placed into any payload, mirror, referral,
    // email body, log, or analytics event.
    if (String(kbTrap || "").trim().length > 0) {
      setErr("");
      setSubmitting(false);
      showToast && showToast("Thanks — you're all set.");
      return;
    }
    if (!canSubmit) { setErr("Please fill in the required fields."); return; }
    if (telemetryEnabled) recordPublicFunnelEvent("waitlist_submit_attempt", { role: mode, surface: "early_access" });
    setSubmitting(true);
    setErr("");
    try {
      // Fixed structured payload for the Stage 6B receipt RPC. The server
      // accepts only the canonical fields it knows and ignores optional
      // attribution metadata that may still be used by the best-effort mirror.
      const payload = {
        role: mode,
        email: form.email.trim().toLowerCase(),
        full_name: form.full_name.trim(),
        org_name: (form.org_name || "").trim() || null,
        title_role: (form.title_role || "").trim() || null,
        category: isVendor ? (form.category || null) : null,
        city: (form.city || "").trim() || null,
        state_code: (form.state_code || "").trim().toUpperCase() || null,
        delivery_model: isVendor ? (form.delivery_model || null) : null,
        congregation_size: !isVendor ? (form.congregation_size || null) : null,
        first_project: !isVendor ? ((form.first_project || "").trim() || null) : null,
        past_church_client: isVendor ? ((form.past_church_client || "").trim() || null) : null,
        referral_code: null,
        referred_by: normalizeRefCode(form.referred_by) || null,
        source: getWaitlistSourceForMode(mode),
        legal_consent: { accepted: true, marketing_opt_in: false },
      };
      // 853ar (brief #3/#4/#6): dedicated waitlist attribution helper.
      // These fields are added to the RPC payload as browser CLAIMS. They do
      // NOT get stored or trusted until kb_submit_waitlist_application is
      // extended server-side to (a) read them from p_payload, (b) look up the
      // drop_id, (c) re-derive canonical group/audience from the drop, and
      // (d) ignore mismatched browser group_id. See the migration file's
      // "BLOCKED PENDING CURRENT RPC DEFINITION" section. Until then, sending
      // them is harmless (extra JSON keys the current RPC ignores) but confers
      // NO tracked credit - which is why the Growth Engine metric is gated on
      // the server aggregate, not on these claims.
      const kbgeAttrFields = buildWaitlistAttributionFields(mode);
      if (Object.prototype.hasOwnProperty.call(kbgeAttrFields, "source_group_name")) {
        payload.source_group_name = kbgeAttrFields.source_group_name;
      }
      if (Object.prototype.hasOwnProperty.call(kbgeAttrFields, "group_id")) {
        payload.group_id = kbgeAttrFields.group_id;
      }
      if (Object.prototype.hasOwnProperty.call(kbgeAttrFields, "drop_id")) {
        payload.drop_id = kbgeAttrFields.drop_id;
      }
      if (Object.prototype.hasOwnProperty.call(kbgeAttrFields, "campaign_key")) {
        payload.campaign_key = kbgeAttrFields.campaign_key;
      }
      // 853q — privacy-safe receipt RPC. Anonymous applicants never receive
      // SELECT access to the private waitlist table. The database validates and
      // inserts the fixed application shape, resolves referral-code collisions,
      // and returns only this applicant's receipt + role-specific queue position.
      // Direct anonymous table INSERT is revoked by the Stage 6B migration.
      // 0167: the v2 wrapper preserves the canonical submit RPC and returns one
      // additional server-derived boolean: whether THIS inserted application
      // produced the same validated waitlist referral relationship used by the
      // Admin priority queue. Raw ?ref= text never earns priority by itself.
      const receiptRequest = supabase.rpc("kb_submit_waitlist_application_v2", { p_payload: payload }).single();
      const { data: receipt, error: receiptError } = isVendor
        ? await runSupabaseWithTimeout(receiptRequest, "Charter Vendor application", 12000)
        : await receiptRequest;

      if (receiptError) {
        if (isWaitlistDuplicateEmailError(receiptError)) {
          // The unique email + role constraint is enough to confirm this email
          // is already queued; never perform a private-table lookup here.
          const snapshot = buildWaitlistSnapshot({}, {
            role: mode,
            email: payload.email,
            full_name: payload.full_name,
            org_name: payload.org_name,
            category: payload.category,
            city: payload.city,
            source: payload.source,
          });
          if (!mountedRef.current) return;
          setForm(f => ({
            ...f,
            email: snapshot.email || f.email,
            full_name: snapshot.full_name || f.full_name,
            org_name: snapshot.org_name || f.org_name,
            category: snapshot.category || f.category,
            city: snapshot.city || f.city,
          }));
          setResult({
            code: null,
            position: null,
            email: snapshot.email || payload.email,
            city: snapshot.city || payload.city,
            category: snapshot.category || payload.category,
            first_project: snapshot.first_project || payload.first_project,
            emailDelivered: false,
            emailReason: "already_joined_private",
            alreadyJoined: true,
            snapshot,
          });
          saveWaitlistReceipt(mode, {
            code: null,
            email: snapshot.email || payload.email,
            city: snapshot.city || payload.city,
            category: snapshot.category || payload.category,
            first_project: snapshot.first_project || payload.first_project,
            alreadyJoined: true,
          });
          if (telemetryEnabled) recordPublicFunnelEvent("waitlist_submit_result", {
            role: mode,
            outcome: "already_joined",
            surface: "early_access",
          });
          showToast && showToast(isVendor
            ? "That email is already in the Charter Vendor queue."
            : "That email is already in church early access.");
          setSubmitting(false);
          return;
        }
        throw receiptError;
      }

      payload.referral_code = receipt?.referral_code || payload.referral_code;
      const referralValidated = receipt?.referral_validated === true;
      const receiptPosition = Number(receipt?.queue_position);
      const inserted = {
        ...payload,
        id: receipt?.id || null,
        created_at: receipt?.created_at || null,
        referral_code: payload.referral_code,
        queue_position: Number.isFinite(receiptPosition) && receiptPosition > 0 ? receiptPosition : null,
      };

      const snapshot = buildWaitlistSnapshot(inserted, payload);
      setForm(f => ({
        ...f,
        full_name: snapshot.full_name || f.full_name,
        org_name: snapshot.org_name || f.org_name,
        email: snapshot.email || f.email,
        title_role: snapshot.title_role || f.title_role,
        category: snapshot.category || f.category,
        city: snapshot.city || f.city,
        delivery_model: snapshot.delivery_model || f.delivery_model,
        congregation_size: snapshot.congregation_size || f.congregation_size,
        first_project: snapshot.first_project || f.first_project,
        past_church_client: snapshot.past_church_client || f.past_church_client,
        referred_by: snapshot.referred_by || f.referred_by,
      }));

      const position = inserted.queue_position;

      if (!isVendor) {
        // Preserve the existing church early-access sequencing exactly.
        const emailSend = await sendWaitlistEmail({
          applicationId: inserted.id,
          role: mode,
          email: snapshot.email,
          fullName: snapshot.full_name,
          orgName: snapshot.org_name,
          titleRole: snapshot.title_role,
          category: snapshot.category,
          city: snapshot.city,
          deliveryModel: snapshot.delivery_model,
          congregationSize: snapshot.congregation_size,
          firstProject: snapshot.first_project,
          pastChurchClient: snapshot.past_church_client,
          referralCode: snapshot.referral_code || payload.referral_code,
          referredBy: snapshot.referred_by,
          source: snapshot.source || payload.source,
        });
        if (!mountedRef.current) return;
        const nextResult = {
          code: snapshot.referral_code || payload.referral_code,
          position,
          email: snapshot.email,
          city: snapshot.city,
          category: snapshot.category,
          first_project: snapshot.first_project,
          emailDelivered: !!emailSend?.delivered,
          emailReason: emailSend?.reason || null,
          alreadyJoined: false,
          referralValidated,
          snapshot,
        };
        setResult(nextResult);
        saveWaitlistReceipt(mode, nextResult);
        if (telemetryEnabled) recordPublicFunnelEvent("waitlist_submit_result", {
          role: mode,
          outcome: "success",
          referral_validated: referralValidated,
          surface: "early_access",
        });
      } else {
        // 0162 Charter path: the committed RPC receipt is authoritative. Show +
        // persist it BEFORE best-effort confirmation email work so email can never
        // turn a successful application into a failed-looking submission.
        if (!mountedRef.current) return;
        const nextResult = {
          code: snapshot.referral_code || payload.referral_code,
          position,
          email: snapshot.email,
          city: snapshot.city,
          category: snapshot.category,
          first_project: snapshot.first_project,
          emailDelivered: false,
          emailReason: "confirmation_pending",
          alreadyJoined: false,
          referralValidated,
          snapshot,
        };
        setResult(nextResult);
        saveWaitlistReceipt(mode, nextResult);
        if (telemetryEnabled) recordPublicFunnelEvent("waitlist_submit_result", {
          role: mode,
          outcome: "success",
          referral_validated: referralValidated,
          surface: "early_access",
        });

        try {
          const emailSend = await runSupabaseWithTimeout(sendWaitlistEmail({
            applicationId: inserted.id,
            role: mode,
            email: snapshot.email,
            fullName: snapshot.full_name,
            orgName: snapshot.org_name,
            titleRole: snapshot.title_role,
            category: snapshot.category,
            city: snapshot.city,
            deliveryModel: snapshot.delivery_model,
            congregationSize: snapshot.congregation_size,
            firstProject: snapshot.first_project,
            pastChurchClient: snapshot.past_church_client,
            referralCode: snapshot.referral_code || payload.referral_code,
            referredBy: snapshot.referred_by,
            source: snapshot.source || payload.source,
          }), "Charter Vendor confirmation email", 8000);
          if (!mountedRef.current) return;
          const emailResult = {
            ...nextResult,
            emailDelivered: !!emailSend?.delivered,
            emailReason: emailSend?.reason || null,
          };
          setResult(emailResult);
          saveWaitlistReceipt(mode, emailResult);
        } catch (emailError) {
          logError("waitlist-email-after-receipt", emailError, { mode });
          if (!mountedRef.current) return;
          const emailResult = {
            ...nextResult,
            emailDelivered: false,
            emailReason: emailError?.code === "KB_SUPABASE_TIMEOUT" ? "confirmation_timeout" : "confirmation_unavailable",
          };
          setResult(emailResult);
          saveWaitlistReceipt(mode, emailResult);
        }
      }
      // 853aq-fix: the modal previously fired here in addition to the full-page
      // receipt below, producing two stacked confirmation surfaces for one
      // signup. There is now exactly one canonical confirmation: this
      // full-page receipt (redesigned below to carry the same visual language
      // the modal used - centered mark, gold rule, flat checklist, vine).

    } catch (error) {
      if (telemetryEnabled) recordPublicFunnelEvent("waitlist_submit_result", {
        role: mode,
        outcome: error?.code === "KB_SUPABASE_TIMEOUT" ? "timeout" : "error",
        surface: "early_access",
      });
      logError("waitlist-submit", error, { mode });
      if (mountedRef.current) {
        setErr(isVendor && error?.code === "KB_SUPABASE_TIMEOUT"
          ? "We couldn't confirm whether your Charter application finished. Your information is still here, and it is safe to try again."
          : "Something went wrong. Please try again.");
      }
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };

  // 853k — Church/vendor signup clay parity lock. Both reviewed-application
  // routes now use the exact same FaithBid beige clay canvas, overlay palette,
  // outer typography, controls, and card shadows. Role-specific content and
  // gold Charter Vendor accents remain intact.
  const shellBg = "var(--kb852bf-beige-texture-color,#eee6d9)";
  const shellImage = "var(--kb852bf-beige-texture-image)";
  const text = "#1A2510";
  const muted = "#5C6358";
  const border = "rgba(34,48,27,0.10)";
  const accent = "#A87B2A";
  const accentSoft = "rgba(168,123,42,0.10)";
  const primaryBg = "linear-gradient(135deg,#C4973A,#A87B2A)";
  const primaryText = "#FFFFFF";
  const formText = "#1A2510";
  const formMuted = "#5C6358";
  const formBorder = "rgba(34,48,27,0.12)";
  const formAccent = "#A87B2A";
  const formAccentSoft = "rgba(168,123,42,0.11)";
  const cardBg = "rgba(255,255,255,0.96)";
  const softBg = "#FBF8F2";
  const inputBg = "#FFFFFF";
  const inputBorder = "rgba(34,48,27,0.14)";

  const fieldStyle = { width: "100%", padding: "13px 14px", borderRadius: 10, border: `1px solid ${inputBorder}`, fontSize: 14, fontFamily: "var(--font-sans), sans-serif", boxSizing: "border-box", outline: "none", background: inputBg, color: formText, transition: "border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: formText, display: "block", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" };
  const requiredMark = <span style={{ color: "#B45309", marginLeft: 2 }}>*</span>;

  const resendWaitlistConfirmation = async () => {
    if (!result?.email || resendingEmail) return;
    const canonicalEmail = String(result.email || "").trim().toLowerCase();
    const cooldownKey = `kb-waitlist-email-${mode}-${canonicalEmail}`;
    const lastSentAt = Number(kbSafeLocalGet(cooldownKey) || 0);
    const cooldownRemainingMs = lastSentAt ? Math.max(0, 60000 - (Date.now() - lastSentAt)) : 0;
    if (cooldownRemainingMs > 0) {
      const seconds = Math.max(1, Math.ceil(cooldownRemainingMs / 1000));
      showToast && showToast(`Please wait ${seconds}s before resending.`, "error");
      return;
    }
    kbSafeLocalSet(cooldownKey, String(Date.now()));
    setResendingEmail(true);
    const snapshot = buildWaitlistSnapshot(result?.snapshot || {}, {
      role: mode,
      email: result.email,
      full_name: form.full_name,
      org_name: form.org_name,
      title_role: form.title_role,
      category: form.category,
      city: form.city,
      delivery_model: form.delivery_model,
      congregation_size: form.congregation_size,
      first_project: form.first_project,
      past_church_client: form.past_church_client,
      referred_by: form.referred_by,
      referral_code: result.code,
      source: getWaitlistSourceForMode(mode),
    });
    try {
      const resendRequest = sendWaitlistEmail({
        role: mode,
        email: snapshot.email || canonicalEmail,
        fullName: snapshot.full_name,
        orgName: snapshot.org_name,
        titleRole: snapshot.title_role,
        category: snapshot.category,
        city: snapshot.city,
        deliveryModel: snapshot.delivery_model,
        congregationSize: snapshot.congregation_size,
        firstProject: snapshot.first_project,
        pastChurchClient: snapshot.past_church_client,
        referralCode: snapshot.referral_code || result.code,
        referredBy: snapshot.referred_by,
        source: snapshot.source || getWaitlistSourceForMode(mode),
      });
      const emailSend = isVendor
        ? await runSupabaseWithTimeout(resendRequest, "Charter Vendor confirmation resend", 8000)
        : await resendRequest;
      if (!mountedRef.current) return;
      setResult(prev => prev ? ({ ...prev, emailAccepted: !!emailSend?.accepted, emailDelivered: !!emailSend?.delivered, emailReason: emailSend?.reason || null, snapshot }) : prev);
      if (emailSend?.accepted) showToast && showToast("Confirmation request accepted");
      else if (emailSend?.delivered) showToast && showToast("Confirmation email sent");
      else showToast && showToast("Confirmation email isn't live yet — your spot is still saved.", "error");
    } catch (error) {
      logError("waitlist-email-resend", error, { mode, email: result?.email });
      kbSafeLocalRemove(cooldownKey);
      showToast && showToast("Couldn't resend confirmation email right now.", "error");
    } finally {
      if (mountedRef.current) setResendingEmail(false);
    }
  };

  const shellStyle = {
    minHeight: "100vh",
    backgroundColor: shellBg,
    backgroundImage: shellImage,
    backgroundSize: "cover",
    backgroundPosition: "center top",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
    color: text,
    fontFamily: "var(--font-sans), sans-serif",
  };
  const pageWrapStyle = { maxWidth: 760, margin: "0 auto", padding: "22px 24px 64px" };
  const sectionCardStyle = { background: cardBg, borderRadius: 18, border: `1px solid ${formBorder}`, boxShadow: "0 18px 48px rgba(21,28,24,0.075), inset 0 1px 0 rgba(255,255,255,0.78)" };

  if (result) {
    const canShareReferral = !!result.code;
    const shareUrl = canShareReferral ? `${getAppUrl().replace(/\/$/, "")}/?ref=${encodeURIComponent(result.code)}` : "";
    const summaryBits = [
      !isVendor && result.city ? result.city : null,
      isVendor && result.category ? result.category : null,
      !isVendor && result.first_project ? "First project noted" : null,
    ].filter(Boolean);

    return (
      <div style={shellStyle}>
        <div style={{ ...pageWrapStyle, maxWidth: 760, paddingTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", marginBottom: 18 }}>
            <button
              type="button"
              onClick={() => nav("landing")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 38,
                padding: "0 14px",
                borderRadius: 999,
                border: `1px solid ${border}`,
                background: "rgba(255,255,255,0.74)",
                color: text,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-sans), sans-serif",
                boxShadow: "0 10px 24px rgba(21,28,24,0.055)",
              }}
            >
              <span aria-hidden="true">←</span> Back to home
            </button>
          </div>

          <div style={{ ...sectionCardStyle, padding: "34px 28px 26px", position: "relative", overflow: "hidden" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 999, background: "#172116", color: "#f5efe2", fontSize: 24, fontWeight: 800, marginBottom: 18, boxShadow: "0 0 0 1px rgba(213,184,115,0.45)" }}>✓</div>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: 32, fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", marginBottom: 0 }}>{meta.doneTitle}</div>
              <div style={{ width: 40, height: 1, background: "#d5b873", margin: "16px auto 16px" }} />
              <div style={{ fontSize: 15, lineHeight: 1.75, color: muted, maxWidth: 520, margin: "0 auto 10px" }}>{meta.doneBody}</div>
              <div style={{ fontSize: 13, color: text, fontWeight: 700 }}>{result.email}</div>
            </div>

            {result.referralValidated ? (
              <div style={{padding:"16px 18px",borderRadius:16,background:"linear-gradient(135deg, rgba(34,48,27,0.075), rgba(168,123,42,0.065))",border:"1px solid rgba(168,123,42,0.24)",marginBottom:16}}>
                <div style={{fontSize:10.5,fontWeight:800,letterSpacing:"0.14em",textTransform:"uppercase",color:accent,marginBottom:6}}>Founding Invite confirmed</div>
                <div style={{fontFamily:"var(--font-display), serif",fontSize:19,fontWeight:700,lineHeight:1.25,color:text,marginBottom:7}}>Your {isVendor ? "business" : "church"} application came through a validated FaithBid invite.</div>
                <div style={{fontSize:12.5,lineHeight:1.65,color:muted}}>It is placed in the referred-applicant priority review group. Priority changes review order only; it does not change FaithBid's admission standards, guarantee approval, or guarantee a review time.</div>
              </div>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginBottom: 16 }} className="waitlist-summary-grid">
              {canShareReferral ? (
                <div style={{ padding: "16px 18px", borderRadius: 16, background: softBg, border: `1px solid ${border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, marginBottom: 8 }}>{meta.shareTitle}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.65, color: muted }}>{meta.shareBody}</div>
                </div>
              ) : (
                <div style={{ padding: "16px 18px", borderRadius: 16, background: softBg, border: `1px solid ${border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, marginBottom: 8 }}>Already saved</div>
                  <div style={{ fontSize: 13, lineHeight: 1.65, color: muted }}>For privacy, we don't expose the original referral link from this browser. Use resend confirmation to receive the details by email.</div>
                </div>
              )}
            </div>

            {isVendor ? (
              <div style={{padding:"15px 17px",borderRadius:16,background:"linear-gradient(135deg, rgba(168,123,42,0.12), rgba(168,123,42,0.055))",border:`1px solid ${isVendor ? "rgba(215,181,109,0.34)" : "rgba(168,123,42,0.20)"}`,marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:accent,marginBottom:6}}>Charter Vendor value</div>
                <div style={{fontSize:14,lineHeight:1.65,color:text,fontWeight:700}}>Accepted Charter Vendors receive permanent Charter status, early profile access, and priority consideration for relevant opportunities.</div>
                <div style={{fontSize:12.5,lineHeight:1.6,color:muted,marginTop:5}}>FaithBid is not currently offering a paid Vendor Pro plan. Any future commercial terms will be published before they apply.</div>
              </div>
            ) : null}

            {summaryBits.length > 0 ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 18 }}>
                {summaryBits.map((bit, idx) => (
                  <div key={idx} style={{ padding: "7px 11px", borderRadius: 999, background: softBg, border: `1px solid ${border}`, fontSize: 12, color: text, fontWeight: 600 }}>{bit}</div>
                ))}
              </div>
            ) : null}

            {isVendor ? (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:8, marginBottom:20 }} className="charter-vendor-journey">
                {["Application received","FaithBid review","Activate account","Complete profile"].map((label, idx) => (
                  <div key={label} style={{ padding:"11px 9px", borderRadius:12, background:idx===0 ? "rgba(168,123,42,0.11)" : softBg, border:`1px solid ${idx===0 ? "rgba(168,123,42,0.24)" : border}`, textAlign:"center" }}>
                    <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.08em", textTransform:"uppercase", color:idx===0 ? accent : muted, marginBottom:4 }}>Step {idx + 1}</div>
                    <div style={{ fontSize:12.5, lineHeight:1.35, fontWeight:700, color:text }}>{label}</div>
                  </div>
                ))}
              </div>
            ) : null}

            <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
              {meta.nextSteps.map((line, idx) => (
                <div key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: accent, fontSize: 15, fontWeight: 800, lineHeight: 1.5, flexShrink: 0 }}>✓</span>
                  <div style={{ fontSize: 14, lineHeight: 1.65, color: muted }}>{line}</div>
                </div>
              ))}
            </div>

            {canShareReferral ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20 }} className="waitlist-share-row">
                <div style={{ flex: 1, padding: "12px 12px", borderRadius: 12, background: softBg, border: `1px solid ${border}`, fontFamily: "var(--font-sans), monospace", fontSize: 12, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareUrl}</div>
                <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(shareUrl); showToast && showToast("Link copied"); } catch { showToast && showToast("Couldn't copy — long-press to copy.", "error"); } }} style={{ padding: "12px 14px", borderRadius: 12, border: "none", background: primaryBg, color: primaryText, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Copy</button>
              </div>
            ) : null}

            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={resendWaitlistConfirmation} disabled={resendingEmail} style={{ padding: "12px 18px", borderRadius: 12, border: `1px solid ${border}`, background: "transparent", color: text, fontSize: 13, fontWeight: 700, cursor: resendingEmail ? "not-allowed" : "pointer" }}>
                {resendingEmail ? "Sending…" : "Resend confirmation"}
              </button>
              <button type="button" onClick={() => nav("landing")} style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: primaryBg, color: primaryText, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Back to home</button>
            </div>
            {result.resumed ? (
              <div style={{ textAlign: "center", marginTop: 14 }}>
                <button type="button" onClick={() => { kbSafeLocalRemove(WAITLIST_RECEIPT_KEY(mode)); setResult(null); setErr(""); }} style={{ background: "none", border: "none", color: muted, fontSize: 12.5, fontWeight: 700, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3, fontFamily: "var(--font-sans), sans-serif" }}>
                  Use a different email
                </button>
              </div>
            ) : null}
          </div>
        </div>
        {/* 853aq-fix: SuccessMomentModal deliberately removed from this page.
            It is no longer just untriggered - it does not exist here at all.
            The full-page receipt above is the sole confirmation surface for
            waitlist signups (church and vendor). This guarantees the old
            boxed popup cannot render here under any circumstance, including
            any leftover/stale state from a prior session. */}
        <style>{`@media (max-width: 760px){ .waitlist-summary-grid, .waitlist-share-row { display:block !important; } .waitlist-share-row > * + * { margin-top:8px; } .charter-vendor-journey { grid-template-columns:repeat(2,minmax(0,1fr)) !important; } }`} </style>
      </div>
    );
  }

  const completedRequired = isVendor
    ? [form.full_name.trim(), form.org_name.trim(), isValidEmail(form.email), form.category, form.city.trim(), form.state_code, form.delivery_model].filter(Boolean).length
    : [form.full_name.trim(), form.org_name.trim(), isValidEmail(form.email), form.city.trim(), form.state_code].filter(Boolean).length;
  const totalRequired = isVendor ? 7 : 5;

  const fieldWrap = (name, children) => (
    <div
      onFocusCapture={() => setFocusedField(name)}
      onBlurCapture={() => setFocusedField(f => f === name ? null : f)}
      style={{
        borderRadius: 10,
        transition: "box-shadow 0.2s ease",
        boxShadow: focusedField === name ? `0 0 0 3px ${formAccentSoft}` : "0 0 0 0 transparent",
      }}
    >
      {children}
    </div>
  );
  const inputBorderFor = (name) => focusedField === name ? formAccent : inputBorder;

  return (
    <div className={`kb-waitlist-page ${isVendor ? "kb-waitlist-page-vendor" : "kb-waitlist-page-church"}`} style={shellStyle}>
      <style>{`
        @keyframes kbWaitlistRise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes kbWaitlistPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.35); opacity: 0.55; } }
        @keyframes kbWaitlistOrb { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.06); } }
        .kb-waitlist-rise { animation: kbWaitlistRise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .kb-waitlist-dot { animation: kbWaitlistPulse 2.4s ease-in-out infinite; }
        .kb-waitlist-input { min-height: 52px; font-size: 15px; }
        .kb-waitlist-input::placeholder { color: rgba(34,48,27,0.34); }
        .kb-waitlist-page { position: relative; overflow: hidden; }
        .kb-waitlist-page::before { content:""; position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .kb-waitlist-page-church::before,
        .kb-waitlist-page-vendor::before { background: radial-gradient(circle at 48% -8%, rgba(255,255,255,0.56), transparent 34%), radial-gradient(circle at 14% 8%, rgba(168,123,42,0.08), transparent 28%); }
        .kb-waitlist-page > .kb-waitlist-shell { position: relative; z-index: 1; }
        .kb-waitlist-chip { transition: transform 0.15s ease, border-color 0.2s ease, background 0.2s ease; }
        .kb-waitlist-chip:hover { transform: translateY(-1px); }
        .kb-waitlist-primary { transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease; }
        .kb-waitlist-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 32px rgba(196,151,58,0.45); }
        .kb-waitlist-back { transition: transform 0.16s ease, border-color 0.2s ease, background 0.2s ease; }
        .kb-waitlist-back:hover { transform: translateY(-1px); border-color: rgba(168,123,42,0.28); }
        .kb-waitlist-learnmore { transition: max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease; overflow: hidden; }
        /* 852ax — Signup landing hero cleanup only. Scope: WaitlistFlow church/vendor pages. */
        .kb-waitlist-shell.kb-waitlist-landing-clean { max-width: 820px !important; padding: 10px 28px 64px !important; }
        .kb-waitlist-topline { margin-bottom: 14px !important; }
        .kb-waitlist-hero-clean { margin-bottom: 18px !important; }
        .kb-waitlist-hero-title { max-width: 820px; margin-left: auto !important; margin-right: auto !important; white-space: nowrap; }
        .kb-waitlist-hero-sub { max-width: 620px !important; margin-bottom: 12px !important; }
        .kb-waitlist-hero-meta-clean { margin: 0 auto !important; }
        .kb-waitlist-form-card-clean { max-width: 700px; margin-left: auto; margin-right: auto; }
        .kb-waitlist-form-card-clean { color:#1A2510 !important; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
        .kb-waitlist-form-card-clean input,
        .kb-waitlist-form-card-clean select,
        .kb-waitlist-form-card-clean textarea { background:#fff !important; color:#1A2510 !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.78); }
        .kb-waitlist-form-card-clean select option { color:#1A2510; background:#fff; }
        .kb-waitlist-page-vendor .kb-waitlist-form-card-clean,
        .kb-waitlist-page-church .kb-waitlist-form-card-clean { background:rgba(255,255,255,.965) !important; border-color:rgba(34,48,27,.12) !important; }
        .kb-waitlist-page-vendor .kb-waitlist-form-card-clean label,
        .kb-waitlist-page-church .kb-waitlist-form-card-clean label { color:#1A2510 !important; }
        .kb-waitlist-page-vendor .kb-waitlist-form-card-clean .kb-waitlist-chip,
        .kb-waitlist-page-church .kb-waitlist-form-card-clean .kb-waitlist-chip { color:#1A2510; }
        
        @media (max-width: 860px) {
          .kb-waitlist-hero-title { white-space: normal; max-width: 680px; }
          .kb-waitlist-shell.kb-waitlist-landing-clean { max-width: 760px !important; }
        }
        @media (max-width: 760px) {
          .kb-waitlist-form-row, .kb-waitlist-benefits { grid-template-columns: 1fr !important; }
          .kb-waitlist-delivery-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 7px !important; }
          .kb-waitlist-delivery-grid .kb-waitlist-chip { min-width: 0 !important; min-height: 44px !important; padding: 10px 6px !important; }
          .kb-waitlist-shell.kb-waitlist-landing-clean { padding: 22px 20px 64px !important; }
          .kb-waitlist-hero-title { white-space: normal; }
          .kb-waitlist-hero-meta-clean { border-radius: 16px !important; padding: 9px 12px !important; }
          .kb-waitlist-primary { width: 100% !important; min-height: 48px !important; }
        }
        @media (max-width: 430px) {
          .kb-waitlist-shell.kb-waitlist-landing-clean { padding: 18px 16px 54px !important; }
          .kb-waitlist-topline { gap: 10px !important; margin-bottom: 12px !important; }
          .kb-waitlist-hero-meta-clean { width: 100% !important; max-width: 100% !important; gap: 7px !important; }
        }
      `}</style>
      <div className="kb-waitlist-shell kb-waitlist-landing-clean" style={{ maxWidth: 780, margin: "0 auto", padding: "18px 28px 64px" }}>

        <div className="kb-waitlist-topline" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26, width: "100vw", maxWidth: "100vw", marginLeft: "calc(50% - 50vw)", padding: "0 clamp(18px, 3vw, 48px)", boxSizing: "border-box" }}>
          <button
            type="button"
            className="kb-waitlist-back"
            onClick={() => nav("landing")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 38,
              padding: "0 14px",
              borderRadius: 999,
              border: `1px solid ${border}`,
              background: "rgba(255,255,255,0.74)",
              color: text,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-sans), sans-serif",
              boxShadow: "0 10px 24px rgba(21,28,24,0.055)",
            }}
          >
            <span aria-hidden="true">←</span> Back to home
          </button>
          <button
            type="button"
            onClick={() => { if (typeof setAuthDefaultRole === "function") setAuthDefaultRole("login"); nav("auth"); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0 24px", borderRadius: 999, border: "1px solid rgba(23,63,51,0.4)", background: "rgba(255,252,244,0.92)", color: "#173f33", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans), sans-serif", boxShadow: "0 10px 24px rgba(21,28,24,0.07)" }}
          >
            Sign in <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        <div className={mounted ? "kb-waitlist-rise kb-waitlist-hero-clean" : "kb-waitlist-hero-clean"} style={{ position: "relative", textAlign: "center", marginBottom: 24, opacity: mounted ? 1 : 0 }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Eyebrow — flat tracked letters, no chip, no pulsing dot */}
            <div style={{ display: "inline-block", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#A87B2A", marginBottom: 14 }}>
              {meta.eyebrow}
            </div>

            {/* Headline — Playfair, with the final phrase as a gold italic climax */}
            {(() => {
              const raw = String(meta.headline || "");
              // Split off the last meaningful phrase (everything after the last meaningful word break)
              // For "Hire vendors your church can trust." → lead: "Hire vendors", climax: "your church can trust."
              // For "Get in front of churches before everyone else." → lead: "Get in front of churches", climax: "before everyone else."
              const splitIdx = isVendor ? raw.lastIndexOf(" before") : raw.lastIndexOf(" your");
              const lead = splitIdx > 0 ? raw.slice(0, splitIdx) : raw;
              const climax = splitIdx > 0 ? raw.slice(splitIdx + 1) : "";
              return (
                <h1 className="kb-waitlist-hero-title" style={{ fontFamily: "var(--font-display), serif", fontSize: "clamp(32px, 4.35vw, 48px)", lineHeight: 1.02, letterSpacing: "-0.026em", margin: "0 0 12px", fontWeight: 700, color: text, overflowWrap: "normal" }}>
                  {lead}
                  {climax ? (
                    <>
                      {" "}
                      <span style={{ fontFamily: "var(--font-display),serif", fontStyle: "italic", fontWeight: 400, background: "linear-gradient(135deg,#C4973A 0%,#A87B2A 50%,#8C6420 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-0.012em" }}>
                        {climax}
                      </span>
                    </>
                  ) : null}
                </h1>
              );
            })()}

            {/* Sub */}
            <p className="kb-waitlist-hero-sub" style={{ fontSize: 14.5, lineHeight: 1.52, color: muted, margin: "0 auto 16px", maxWidth: 540, overflowWrap: "anywhere", fontWeight: 400 }}>
              {meta.subhead}
            </p>

            <div className="kb-waitlist-hero-meta-clean" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap", maxWidth: 680, margin: "0 auto", padding: "9px 14px", borderRadius: 999, border: `1px solid ${border}`, background: "rgba(255,255,255,0.68)", color: muted, fontSize: 11.8, lineHeight: 1.45, fontWeight: 600, letterSpacing: "0.01em", boxShadow: "0 12px 28px rgba(21,28,24,0.045)" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: accent, boxShadow: `0 0 0 3px ${accentSoft}`, flex: "0 0 auto" }} />
              <span style={{ color: accent, fontWeight: 800 }}>{isVendor ? "Charter review" : "Access request"}</span>
              <span style={{ width: 3, height: 3, borderRadius: 999, background: "rgba(34,48,27,0.22)", flex: "0 0 auto" }} />
              <span>{isVendor ? "Free to apply · profile after acceptance" : "No project posted · free to reserve"}</span>
              <span style={{ width: 3, height: 3, borderRadius: 999, background: "rgba(34,48,27,0.22)", flex: "0 0 auto" }} />
              <span>{meta.requiredSummary}</span>
            </div>
          </div>
        </div>

        <div
          className={mounted ? "kb-waitlist-rise kb-waitlist-form-card-clean" : "kb-waitlist-form-card-clean"}
          style={{
            background: cardBg,
            borderRadius: 20,
            border: `1px solid ${formBorder}`,
            padding: "34px 34px 30px",
            boxShadow: "0 24px 64px rgba(21,28,24,0.11), 0 0 0 1px rgba(255,255,255,0.75) inset",
            animationDelay: "0.08s",
            opacity: mounted ? 1 : 0,
          }}
        >
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,marginBottom:16,paddingBottom:14,borderBottom:`1px solid ${formBorder}`}}>
            <div>
              <div style={{fontSize:10.5,fontWeight:800,letterSpacing:"0.14em",textTransform:"uppercase",color:formAccent,marginBottom:5}}>{isVendor ? "Charter review" : "Access reservation"}</div>
              <div style={{fontFamily:"var(--font-display), serif",fontSize:20,fontWeight:700,lineHeight:1.08,letterSpacing:"-0.02em",color:formText}}>{isVendor ? "Submit the essentials." : "Tell us about your church."}</div>
            </div>
            <div style={{padding:"7px 10px",borderRadius:999,background:softBg,border:`1px solid ${formBorder}`,color:formMuted,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{meta.requiredSummary}</div>
          </div>

          {err ? (
            <div style={{ padding: "10px 12px", borderRadius: 10, background: isVendor ? "rgba(232,167,92,0.1)" : "rgba(220,38,38,0.08)", border: `1px solid ${isVendor ? "rgba(232,167,92,0.28)" : "rgba(220,38,38,0.25)"}`, fontSize: 13, color: isVendor ? "#E8A75C" : "#DC2626", lineHeight: 1.5, marginBottom: 18 }}>
              {err}
            </div>
          ) : null}

          <div
            style={{ display: "grid", gap: 14 }}
            onPointerDownCapture={armKbTrap}
            onKeyDownCapture={armKbTrap}
            onClickCapture={armKbTrap}
          >
            {/* 853o — Autofill-safe honeypot trap. Off-screen (never
                display:none, so scripted field-fillers still populate it),
                hidden from assistive tech, and unreachable by keyboard. The
                field is readOnly until a genuine pointer/key interaction arms
                it, which keeps password managers and browser autofill out (they
                do not type into readOnly inputs), fixing the 853n false
                positive. Neutral name with no autofill-semantic tokens and no
                associated <label>. Not part of `form`; never sent in any
                payload. Shared by church and vendor modes. */}
            <div aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", clipPath: "inset(50%)", whiteSpace: "nowrap", border: 0, padding: 0, margin: -1 }}>
              <input
                id="kb-wl-secondary-detail"
                type="text"
                name="kb_secondary_detail"
                value={kbTrap}
                readOnly={!kbTrapArmed}
                onChange={e => { if (kbTrapArmed) setKbTrap(e.target.value); }}
                maxLength={200}
                tabIndex={-1}
                autoComplete="new-password"
                aria-hidden="true"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                data-form-type="other"
              />
            </div>
            <div>
              <label htmlFor="kb-wl-full-name" style={labelStyle}>Your name {requiredMark}</label>
              {fieldWrap("full_name",
                <input
                  id="kb-wl-full-name"
                  className="kb-waitlist-input"
                  value={form.full_name}
                  onChange={set("full_name")}
                  placeholder={isVendor ? "Alex Martinez" : "Pastor Sarah Chen"}
                  maxLength={120}
                  style={{ ...fieldStyle, borderColor: inputBorderFor("full_name") }}
                />
              )}
            </div>

            {!isVendor ? (
              <>
                <div>
                  <label htmlFor="kb-wl-org-name" style={labelStyle}>Church name {requiredMark}</label>
                  {fieldWrap("org_name",
                    <input
                      id="kb-wl-org-name"
                      className="kb-waitlist-input"
                      value={form.org_name}
                      onChange={set("org_name")}
                      placeholder="Grace Community Church"
                      maxLength={160}
                      style={{ ...fieldStyle, borderColor: inputBorderFor("org_name") }}
                    />
                  )}
                </div>
                <div>
                  <label htmlFor="kb-wl-email" style={labelStyle}>Email {requiredMark}</label>
                  {fieldWrap("email",
                    <input
                      id="kb-wl-email"
                      className="kb-waitlist-input"
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      placeholder="sarah@gracechurch.org"
                      maxLength={254}
                      style={{ ...fieldStyle, borderColor: inputBorderFor("email") }}
                    />
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(92px,0.8fr)", gap: 12 }} className="kb-waitlist-form-row">
                  <div>
                    <label htmlFor="kb-wl-city" style={labelStyle}>Church city {requiredMark}</label>
                    {fieldWrap("city",
                      <input
                        id="kb-wl-city"
                        className="kb-waitlist-input"
                        value={form.city}
                        onChange={set("city")}
                        placeholder="Dallas"
                        maxLength={120}
                        autoComplete="address-level2"
                        style={{ ...fieldStyle, borderColor: inputBorderFor("city") }}
                      />
                    )}
                  </div>
                  <div>
                    <label htmlFor="kb-wl-state" style={labelStyle}>State {requiredMark}</label>
                    {fieldWrap("state_code",
                      <select
                        id="kb-wl-state"
                        className="kb-waitlist-input"
                        value={form.state_code}
                        onChange={set("state_code")}
                        autoComplete="address-level1"
                        style={{ ...fieldStyle, borderColor: inputBorderFor("state_code"), appearance:"none", cursor:"pointer" }}
                      >
                        <option value="">Select…</option>
                        {KB_US_STATE_CODES.map(code => <option key={code} value={code}>{code}</option>)}
                      </select>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="kb-wl-first-project" style={labelStyle}>First project <span style={{ color: muted, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                  {fieldWrap("first_project",
                    <input
                      id="kb-wl-first-project"
                      className="kb-waitlist-input"
                      value={form.first_project}
                      onChange={set("first_project")}
                      placeholder="Website redesign"
                      maxLength={200}
                      style={{ ...fieldStyle, borderColor: inputBorderFor("first_project") }}
                    />
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="kb-waitlist-form-row">
                  <div>
                    <label htmlFor="kb-wl-email" style={labelStyle}>Email {requiredMark}</label>
                    {fieldWrap("email",
                      <input
                        id="kb-wl-email"
                        className="kb-waitlist-input"
                        type="email"
                        value={form.email}
                        onChange={set("email")}
                        placeholder="you@studio.com"
                        maxLength={254}
                        style={{ ...fieldStyle, borderColor: inputBorderFor("email") }}
                      />
                    )}
                  </div>
                  <div>
                    <label htmlFor="kb-wl-org-name" style={labelStyle}>Business {requiredMark}</label>
                    {fieldWrap("org_name",
                      <input
                        id="kb-wl-org-name"
                        className="kb-waitlist-input"
                        value={form.org_name}
                        onChange={set("org_name")}
                        placeholder="Legacy Creative Co."
                        maxLength={160}
                        style={{ ...fieldStyle, borderColor: inputBorderFor("org_name") }}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="kb-wl-category" style={labelStyle}>Category {requiredMark}</label>
                  {fieldWrap("category",
                    <select
                      id="kb-wl-category"
                      value={form.category}
                      onChange={set("category")}
                      style={{ ...fieldStyle, appearance: "none", WebkitAppearance: "none", MozAppearance: "none", borderColor: inputBorderFor("category"), cursor: "pointer", paddingRight: 40, backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' fill='none' stroke='%235C6358' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
                    >
                      <option value="">Select your category&hellip;</option>
                      {CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.icon} {c.label}</option>)}
                    </select>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(92px,0.8fr)", gap: 12 }} className="kb-waitlist-form-row">
                  <div>
                    <label htmlFor="kb-wl-city" style={labelStyle}>Business base city {requiredMark}</label>
                    {fieldWrap("city",
                      <input
                        id="kb-wl-city"
                        className="kb-waitlist-input"
                        value={form.city}
                        onChange={set("city")}
                        placeholder="Dallas"
                        maxLength={120}
                        autoComplete="address-level2"
                        style={{ ...fieldStyle, borderColor: inputBorderFor("city") }}
                      />
                    )}
                  </div>
                  <div>
                    <label htmlFor="kb-wl-state" style={labelStyle}>State {requiredMark}</label>
                    {fieldWrap("state_code",
                      <select
                        id="kb-wl-state"
                        className="kb-waitlist-input"
                        value={form.state_code}
                        onChange={set("state_code")}
                        autoComplete="address-level1"
                        style={{ ...fieldStyle, borderColor: inputBorderFor("state_code"), appearance:"none", cursor:"pointer" }}
                      >
                        <option value="">Select…</option>
                        {KB_US_STATE_CODES.map(code => <option key={code} value={code}>{code}</option>)}
                      </select>
                    )}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>How you deliver {requiredMark}</label>
                  <div role="group" aria-label="How you deliver" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }} className="kb-waitlist-delivery-grid">
                    {[{ id: "remote", label: "Remote" }, { id: "onsite", label: "On-site" }, { id: "both", label: "Both" }].map(opt => {
                      const active = form.delivery_model === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className="kb-waitlist-chip"
                          aria-pressed={active}
                          onClick={() => set("delivery_model")(opt.id)}
                          style={{
                            padding: "12px",
                            borderRadius: 10,
                            border: `1px solid ${active ? formAccent : inputBorder}`,
                            background: active ? formAccentSoft : inputBg,
                            color: active ? formAccent : formText,
                            fontSize: 13,
                            fontWeight: active ? 600 : 500,
                            cursor: "pointer",
                            fontFamily: "var(--font-sans), sans-serif",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label htmlFor="kb-wl-past-client" style={labelStyle}>Past church client <span style={{ color: muted, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                  {fieldWrap("past_church_client",
                    <input
                      id="kb-wl-past-client"
                      className="kb-waitlist-input"
                      value={form.past_church_client}
                      onChange={set("past_church_client")}
                      placeholder="Grace Community — sound install"
                      maxLength={200}
                      style={{ ...fieldStyle, borderColor: inputBorderFor("past_church_client") }}
                    />
                  )}
                </div>
              </>
            )}

            {form.referred_by ? (
              <div style={{ padding: "11px 12px", borderRadius: 10, background: softBg, border: `1px solid ${formBorder}`, color: formMuted }}>
                <div style={{fontSize:12.5,lineHeight:1.45}}><strong style={{ color: formText }}>Invite code received:</strong> {form.referred_by}</div>
                <div style={{fontSize:11.5,lineHeight:1.5,marginTop:3}}>FaithBid validates the invite when you submit. Priority review is shown only after a valid referral is confirmed.</div>
              </div>
            ) : null}

            <LegalConsentCheckbox id="kb-waitlist-consent" checked={agreedToTerms} onChange={setAgreedToTerms} />

            <button
              type="button"
              className="kb-waitlist-primary"
              onClick={submit}
              disabled={!canSubmit || submitting}
              style={{
                padding: "16px 22px",
                borderRadius: 999,
                border: (canSubmit && !submitting) ? "1px solid rgba(212,185,120,0.5)" : "1px solid transparent",
                background: (canSubmit && !submitting) ? primaryBg : "rgba(34,48,27,0.10)",
                color: (canSubmit && !submitting) ? primaryText : formMuted,
                fontSize: 14.5,
                fontWeight: 700,
                cursor: (canSubmit && !submitting) ? "pointer" : "not-allowed",
                fontFamily: "var(--font-sans), sans-serif",
                marginTop: 10,
                letterSpacing: 0.2,
                boxShadow: (canSubmit && !submitting) ? "0 4px 20px rgba(196,151,58,0.35)" : "none",
                transition: "transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease",
              }}
            >
              {submitting
                ? (isVendor ? "Submitting application\u2026" : "Reserving access\u2026")
                : canSubmit
                  ? meta.primaryLabel
                  : `${completedRequired} of ${totalRequired} complete`}
            </button>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, fontSize: 11, color: formMuted, marginTop: 4, flexWrap: "wrap" }}>
              <span>No credit card</span>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(34,48,27,0.22)" }} />
              <span>Unsubscribe anytime</span>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(34,48,27,0.22)" }} />
              <span>{isVendor ? "Reviewed in 5 days" : "We’ll follow up by email"}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, textAlign: "center" }}>
          <button
            type="button"
            onClick={() => setLearnMoreOpen(v => !v)}
            style={{
              background: "none",
              border: "none",
              color: muted,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "var(--font-sans), sans-serif",
              padding: "6px 10px",
              borderRadius: 6,
            }}
          >
            {learnMoreOpen ? "Less detail" : (isVendor ? "What we look for" : "How it works")} <span style={{ display: "inline-block", transform: learnMoreOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease", marginLeft: 4 }} aria-hidden="true">&#9662;</span>
          </button>

          <div
            className="kb-waitlist-learnmore"
            aria-hidden={!learnMoreOpen}
            style={{
              maxHeight: learnMoreOpen ? 520 : 0,
              opacity: learnMoreOpen ? 1 : 0,
              marginTop: learnMoreOpen ? 16 : 0,
              textAlign: "left",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="kb-waitlist-form-row">
              <div style={{ padding: "18px 18px", background: softBg, borderRadius: 12, border: `1px solid ${border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accent, marginBottom: 10 }}>
                  {isVendor ? "What we look for" : "Why now"}
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {meta.bullets.map((item, idx) => (
                    <div key={idx} style={{ fontSize: 13, lineHeight: 1.6, color: muted, overflowWrap: "anywhere" }}>
                      &mdash; {item}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: "18px 18px", background: softBg, borderRadius: 12, border: `1px solid ${border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accent, marginBottom: 10 }}>
                  What happens next
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {meta.steps.map((step, idx) => (
                    <div key={idx} style={{ fontSize: 13, lineHeight: 1.6, color: muted, overflowWrap: "anywhere" }}>
                      &mdash; {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, textAlign: "center", fontSize: 12, color: muted, lineHeight: 1.6, overflowWrap: "anywhere" }}>
              {meta.microcopy}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function WaitlistScreenRoute({ dependencies, ...props }) {
  applyWaitlistScreenDependencies(dependencies);
  return <WaitlistFlow {...props} />;
}
