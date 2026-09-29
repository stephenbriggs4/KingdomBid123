import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";

let CHARTER_VENDOR_PRO_FREE_MONTHS, CHARTER_VENDOR_PRO_VALUE_LABEL, CHURCH_REBATE_FINALITY_WINDOW_DAYS, CHURCH_REBATE_PAYOUT_FREQUENCY_LABEL, CHURCH_REBATE_PAYOUT_THRESHOLD_LABEL, CHURCH_REBATE_POLICY_SUMMARY, CHURCH_REBATE_RATE_LABEL, CLAY_BG, ChurchWorkspaceLaunchPanel, CrossLogo, FoundingVendorBadgeReveal, KB_ONBOARDING_CONTENT, KB_PROJECT_OPS_KEY, PLATFORM_FEE_CAP, VENDOR_PRO_FEE_CAP, VENDOR_PRO_PRICE_LABEL, VENDOR_PRO_PRICE_MONTHLY, VENDOR_PRO_PRICE_YEARLY, VENDOR_TIERS, VendorWorkspaceLaunchPanel, collectOperationalAlertsForProjects, computePlatformFee, computeProSavings, formatMoney, logError, normalizeProjectEntity, passwordStrengthError, readLocalJson, runSupabaseWithFallback, setAuthDefaultRole;

function applyAccountScreenDependencies(values = {}) {
  ({ CHARTER_VENDOR_PRO_FREE_MONTHS, CHARTER_VENDOR_PRO_VALUE_LABEL, CHURCH_REBATE_FINALITY_WINDOW_DAYS, CHURCH_REBATE_PAYOUT_FREQUENCY_LABEL, CHURCH_REBATE_PAYOUT_THRESHOLD_LABEL, CHURCH_REBATE_POLICY_SUMMARY, CHURCH_REBATE_RATE_LABEL, CLAY_BG, ChurchWorkspaceLaunchPanel, CrossLogo, FoundingVendorBadgeReveal, KB_ONBOARDING_CONTENT, KB_PROJECT_OPS_KEY, PLATFORM_FEE_CAP, VENDOR_PRO_FEE_CAP, VENDOR_PRO_PRICE_LABEL, VENDOR_PRO_PRICE_MONTHLY, VENDOR_PRO_PRICE_YEARLY, VENDOR_TIERS, VendorWorkspaceLaunchPanel, collectOperationalAlertsForProjects, computePlatformFee, computeProSavings, formatMoney, logError, normalizeProjectEntity, passwordStrengthError, readLocalJson, runSupabaseWithFallback, setAuthDefaultRole } = values || {});
}

function PricingScreen({ currentUser, userProfile, role, nav, showToast }) {
  const [billing, setBilling] = useState("monthly"); // "monthly" | "yearly"
  const [exampleBid, setExampleBid] = useState(2500);
  const isVendor = role === "vendor";
  const isFounding = !!userProfile?.founding_vendor;
  const pricingPreviewItems = [
    {
      id: "platform-preview",
      name: "Platform preview",
      tagline: "Explore the FaithBid product vision",
      priceMonthly: 0,
      featured: false,
      cta: "Back to projects",
      perks: ["Project and proposal workflow", "Vendor profiles and trust signals", "Deal Room and project records"],
    },
    {
      id: "future-terms",
      name: "Future access",
      tagline: "Commercial details are coming soon",
      priceMonthly: 0,
      featured: false,
      cta: "Back to projects",
      perks: ["No standard platform fee is currently advertised", "No paid vendor plan is currently offered", "Future terms will be published before they apply"],
    },
  ];

  const css = `
    .pricing-shell { background: var(--kb-paper); min-height: 100vh; padding: 60px 24px 80px; color: var(--kb-text-primary); }
    .pricing-inner { max-width: 1100px; margin: 0 auto; }
    .pricing-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: var(--kb-text-eyebrow); margin-bottom: 14px; text-align: center; }
    .pricing-headline { font-family: var(--font-display), serif; font-size: 52px; font-weight: 700; letter-spacing: -0.025em; line-height: 1.05; text-align: center; margin-bottom: 16px; max-width: 760px; margin-left: auto; margin-right: auto; color: var(--kb-text-primary); }
    .pricing-sub { font-size: 16px; color: var(--kb-text-body); line-height: 1.65; text-align: center; max-width: 580px; margin: 0 auto 40px; font-weight: 400; }
    .pricing-toggle-wrap { display: flex; justify-content: center; margin-bottom: 48px; }
    .pricing-toggle { display: inline-flex; padding: 4px; background: var(--kb-paper-alt); border: 1px solid var(--kb-border-light); border-radius: 999px; gap: 4px; }
    .pricing-toggle button { background: none; border: none; padding: 9px 22px; border-radius: 999px; font-size: 13px; font-weight: 600; color: var(--kb-text-muted); cursor: pointer; font-family: var(--font-sans), sans-serif; transition: all 0.18s; }
    .pricing-toggle button.on { background: var(--kb-gold-rich); color: #fff; }
    .pricing-toggle .save-pill { font-size: 10px; font-weight: 800; padding: 2px 7px; background: var(--success); color: #fff; border-radius: 999px; margin-left: 6px; letter-spacing: 0.06em; }
    .pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 56px; }
    @media (max-width: 800px) { .pricing-grid { grid-template-columns: 1fr; } .pricing-headline { font-size: 36px; } }
    .pricing-card { background: var(--kb-paper-alt); border: 1px solid var(--kb-border-light); border-radius: 22px; padding: 38px 32px 32px; position: relative; transition: all 0.2s; }
    .pricing-card.featured { background: linear-gradient(180deg, rgba(196,151,58,0.08), rgba(196,151,58,0.02) 60%, var(--kb-paper-alt)); border: 1px solid rgba(196,151,58,0.4); box-shadow: 0 24px 80px rgba(196,151,58,0.12); }
    .pricing-featured-tag { position: absolute; top: -12px; left: 32px; padding: 5px 12px; background: var(--kb-gold-rich); color: #fff; font-size: 10px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; border-radius: 999px; }
    .pricing-card-name { font-size: 13px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--kb-text-muted); margin-bottom: 10px; }
    .pricing-card.featured .pricing-card-name { color: var(--kb-gold-rich); }
    .pricing-card-tagline { font-family: var(--font-display), serif; font-size: 24px; font-weight: 600; line-height: 1.25; color: var(--kb-text-primary); margin-bottom: 22px; letter-spacing: -0.01em; }
    .pricing-price-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
    .pricing-price-amount { font-family: var(--font-display), serif; font-size: 60px; font-weight: 700; color: var(--kb-text-primary); letter-spacing: -0.03em; line-height: 1; }
    .pricing-price-suffix { font-size: 15px; color: var(--kb-text-muted); font-weight: 400; }
    .pricing-price-note { font-size: 12px; color: var(--kb-text-dim); margin-bottom: 28px; line-height: 1.6; min-height: 32px; }
    .pricing-cta { display: block; width: 100%; padding: 14px 24px; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; font-family: var(--font-sans), sans-serif; cursor: pointer; transition: all 0.18s; letter-spacing: 0.02em; margin-bottom: 28px; }
    .pricing-cta-free { background: var(--kb-paper); border: 1px solid var(--kb-border-mid); color: var(--kb-text-primary); }
    .pricing-cta-free:hover { background: var(--kb-parchment); }
    .pricing-cta-pro { background: linear-gradient(135deg, var(--kb-gold-rich), var(--kb-gold-deep)); color: #fff; box-shadow: 0 8px 24px rgba(196,151,58,0.28); }
    .pricing-cta-pro:hover { box-shadow: 0 12px 32px rgba(196,151,58,0.4); transform: translateY(-1px); }
    .pricing-cta:disabled { opacity: 0.55; cursor: not-allowed; }
    .pricing-perks-label { font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: var(--kb-text-dim); margin-bottom: 14px; }
    .pricing-perks { list-style: none; padding: 0; margin: 0; }
    .pricing-perks li { display: flex; gap: 11px; padding: 9px 0; font-size: 14px; color: var(--kb-text-body); line-height: 1.55; }
    .pricing-perks li::before { content: ''; flex-shrink: 0; margin-top: 8px; width: 6px; height: 6px; border-radius: 50%; background: var(--kb-gold-rich); }
    .pricing-card.free .pricing-perks li::before { background: var(--kb-text-dim); }
    .pricing-currentpill { display: inline-block; padding: 4px 10px; background: var(--success-bg); color: var(--success); border: 1px solid var(--success-border); border-radius: 999px; font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 14px; }

    /* Calculator */
    .pricing-calc { background: var(--kb-paper-alt); border: 1px solid var(--kb-border-light); border-radius: 22px; padding: 32px 36px; margin-bottom: 48px; }
    .pricing-calc-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 14px; }
    .pricing-calc-title { font-family: var(--font-display), serif; font-size: 24px; font-weight: 600; color: var(--kb-text-primary); letter-spacing: -0.01em; }
    .pricing-calc-input-wrap { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
    .pricing-calc-slider { flex: 1; -webkit-appearance: none; appearance: none; height: 4px; background: var(--kb-border-mid); border-radius: 999px; outline: none; }
    .pricing-calc-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 50%; background: var(--kb-gold-rich); cursor: pointer; box-shadow: 0 2px 8px rgba(196,151,58,0.4); }
    .pricing-calc-slider::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: var(--kb-gold-rich); cursor: pointer; border: none; box-shadow: 0 2px 8px rgba(196,151,58,0.4); }
    .pricing-calc-bidlabel { font-family: var(--font-display), serif; font-size: 32px; font-weight: 700; color: var(--kb-text-primary); min-width: 130px; text-align: right; letter-spacing: -0.01em; }
    .pricing-calc-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
    @media (max-width: 700px) { .pricing-calc-grid { grid-template-columns: 1fr; } }
    .pricing-calc-card { padding: 18px 20px; background: var(--kb-paper); border: 1px solid var(--kb-border-light); border-radius: 14px; }
    .pricing-calc-card.savings { background: var(--success-bg); border-color: var(--success-border); }
    .pricing-calc-label { font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--kb-text-muted); margin-bottom: 6px; }
    .pricing-calc-value { font-family: var(--font-display), serif; font-size: 28px; font-weight: 700; color: var(--kb-text-primary); letter-spacing: -0.01em; line-height: 1; margin-bottom: 4px; }
    .pricing-calc-card.savings .pricing-calc-value { color: var(--success); }
    .pricing-calc-sub { font-size: 11px; color: var(--kb-text-muted); }
    .pricing-giveback { background: linear-gradient(135deg, rgba(47,133,90,0.09), rgba(196,151,58,0.07)); border: 1px solid rgba(196,151,58,0.22); border-radius: 22px; padding: 26px 28px; margin: -24px 0 48px; box-shadow: var(--kb-shadow-lg); }
    .pricing-giveback-kicker { font-size: 10px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: var(--kb-gold-dark); margin-bottom: 8px; }
    .pricing-giveback-title { font-family: var(--font-display), serif; font-size: 28px; line-height: 1.15; color: var(--kb-text-primary); margin-bottom: 8px; }
    .pricing-giveback-copy { font-size: 14px; line-height: 1.7; color: var(--kb-text-body); max-width: 760px; margin-bottom: 18px; }
    .pricing-giveback-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    @media (max-width: 760px) { .pricing-giveback-grid { grid-template-columns: 1fr 1fr; } }
    .pricing-giveback-stat { background: var(--kb-paper); border: 1px solid var(--kb-border-light); border-radius: 14px; padding: 14px 15px; }
    .pricing-giveback-stat b { display: block; font-size: 18px; color: var(--kb-gold-dark); margin-bottom: 4px; }
    .pricing-giveback-stat span { display: block; font-size: 10px; line-height: 1.45; color: var(--kb-text-muted); text-transform: uppercase; letter-spacing: 0.08em; }

    /* FAQ */
    .pricing-faq { max-width: 720px; margin: 0 auto; }
    .pricing-faq-title { font-family: var(--font-display), serif; font-size: 32px; font-weight: 700; color: var(--kb-text-primary); text-align: center; margin-bottom: 32px; letter-spacing: -0.02em; }
    .pricing-faq-item { padding: 22px 0; border-bottom: 1px solid var(--kb-border-light); }
    .pricing-faq-item:last-child { border-bottom: none; }
    .pricing-faq-q { font-size: 16px; font-weight: 600; color: var(--kb-text-primary); margin-bottom: 8px; }
    .pricing-faq-a { font-size: 14px; color: var(--kb-text-body); line-height: 1.7; font-weight: 400; }

    .pricing-back { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: var(--kb-text-muted); font-size: 13px; cursor: pointer; font-family: var(--font-sans), sans-serif; padding: 0; margin-bottom: 28px; }
    .pricing-back:hover { color: var(--kb-text-primary); }

    .charter-banner { background: rgba(196,151,58,0.08); border: 1px solid rgba(196,151,58,0.3); border-radius: 16px; padding: 18px 22px; margin-bottom: 32px; display: flex; gap: 14px; align-items: center; }
    .charter-banner-icon { width: 42px; height: 42px; border-radius: 50%; background: rgba(196,151,58,0.18); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
    .charter-banner-text { flex: 1; font-size: 13px; color: var(--kb-text-body); line-height: 1.6; }
    .charter-banner-text strong { color: var(--kb-gold-dark); }
  `;

  const monthlyEquivProYearly = (VENDOR_PRO_PRICE_YEARLY / 12).toFixed(2);
  const proPrice = billing === "yearly" ? monthlyEquivProYearly : VENDOR_PRO_PRICE_MONTHLY;
  const proPriceSuffix = billing === "yearly" ? `/mo billed yearly` : `/month`;

  return (
    <>
      <style>{css}</style>
      <div className="pricing-shell">
        <div className="pricing-inner">
          <button className="pricing-back" onClick={() => nav("projects")}>← Back</button>

          {isFounding && isVendor && (
            <div className="charter-banner">
              <div className="charter-banner-icon">★</div>
              <div className="charter-banner-text">
                <strong>You're a Charter Vendor.</strong> Your permanent Charter status and early profile access remain attached to this account.
              </div>
            </div>
          )}

          <div className="pricing-eyebrow">Platform access</div>
          <h1 className="pricing-headline">Pricing information is coming soon.</h1>
          <p className="pricing-sub">
            FaithBid is not currently advertising a standard platform fee or offering a paid Vendor Pro plan. Any future pricing will be published before it applies.
          </p>

          {false && <div className="pricing-toggle-wrap">
            <div className="pricing-toggle">
              <button className={billing === "monthly" ? "on" : ""} onClick={() => setBilling("monthly")}>
                Monthly
              </button>
              <button className={billing === "yearly" ? "on" : ""} onClick={() => setBilling("yearly")}>
                Yearly
                <span className="save-pill">Save 17%</span>
              </button>
            </div>
          </div>}

          <div className="pricing-grid">
            {pricingPreviewItems.map(tier => (
              <div key={tier.id} className="pricing-card free">
                <div className="pricing-card-name">{tier.name}</div>
                <div className="pricing-card-tagline">{tier.tagline}</div>

                <button
                  className="pricing-cta pricing-cta-free"
                  onClick={() => nav("projects")}
                >
                  {tier.cta}
                </button>

                <div className="pricing-perks-label">What's included</div>
                <ul className="pricing-perks">
                  {tier.perks.map(perk => <li key={perk}>{perk}</li>)}
                </ul>
              </div>
            ))}
          </div>

          {/* Current commercial status */}
          <div className="pricing-calc">
            <div className="pricing-calc-head">
              <div className="pricing-calc-title">Current commercial status</div>
            </div>
            <div className="pricing-calc-grid">
              <div className="pricing-calc-card">
                <div className="pricing-calc-label">Standard platform fee</div>
                <div className="pricing-calc-value">Not advertised</div>
                <div className="pricing-calc-sub">No active percentage or cap</div>
              </div>
              <div className="pricing-calc-card">
                <div className="pricing-calc-label">Paid vendor plan</div>
                <div className="pricing-calc-value">Not active</div>
                <div className="pricing-calc-sub">Vendor Pro is not being offered</div>
              </div>
              <div className="pricing-calc-card savings">
                <div className="pricing-calc-label">Future terms</div>
                <div className="pricing-calc-value">Published first</div>
                <div className="pricing-calc-sub">Before they apply</div>
              </div>
            </div>
          </div>

          <div className="pricing-giveback">
            <div className="pricing-giveback-kicker">Product status</div>
            <div className="pricing-giveback-title">Payment and rebate programs are not active.</div>
            <div className="pricing-giveback-copy">
              This screen is part of the future marketplace preview. FaithBid is not collecting project payments, selling a paid vendor plan, or operating an automatic rebate program here.
            </div>
            <div className="pricing-giveback-grid">
              <div className="pricing-giveback-stat"><b>Not active</b><span>Platform payment rail</span></div>
              <div className="pricing-giveback-stat"><b>Not active</b><span>Standard platform fee</span></div>
              <div className="pricing-giveback-stat"><b>Not active</b><span>Paid vendor plan</span></div>
              <div className="pricing-giveback-stat"><b>Not active</b><span>Automatic rebates</span></div>
            </div>
          </div>
          {/* FAQ */}
          <div className="pricing-faq">
            <div className="pricing-faq-title">Pricing questions</div>

            <div className="pricing-faq-item">
              <div className="pricing-faq-q">Is a standard platform fee active?</div>
              <div className="pricing-faq-a">No standard platform fee is currently being advertised or collected through this preview.</div>
            </div>

            <div className="pricing-faq-item">
              <div className="pricing-faq-q">Is Vendor Pro active?</div>
              <div className="pricing-faq-a">No. FaithBid is not currently offering a paid Vendor Pro plan.</div>
            </div>

            <div className="pricing-faq-item">
              <div className="pricing-faq-q">What does Faith Verified mean?</div>
              <div className="pricing-faq-a">Faith Verified is a reviewed trust signal. It is not a paid plan or proof that a subscription was purchased.</div>
            </div>

            <div className="pricing-faq-item">
              <div className="pricing-faq-q">When will pricing be available?</div>
              <div className="pricing-faq-a">Any future pricing will be published clearly before it applies.</div>
            </div>

            <div className="pricing-faq-item">
              <div className="pricing-faq-q">Are there any hidden fees?</div>
              <div className="pricing-faq-a">FaithBid is not currently advertising a standard platform fee, paid vendor plan, or automatic rebate program.</div>
            </div>

            <div className="pricing-faq-item">
              <div className="pricing-faq-q">Are project payments processed here?</div>
              <div className="pricing-faq-a">No. FaithBid does not currently collect or process project payments through this preview.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function OnboardingScreen({role, currentUser, userProfile, nav, showToast}){
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const isFoundingVendor = !!(userProfile?.founding_vendor);
  const [launchProjects, setLaunchProjects] = useState([]);
  const [launchOpsState, setLaunchOpsState] = useState(() => readLocalJson(KB_PROJECT_OPS_KEY, {}));

  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;
    (async() => {
      try {
        const projectRes = role === 'vendor'
          ? await runSupabaseWithFallback(
              () => supabase.from('bids').select('project_id,vendor_id,status,projects(id,title,status,budget,church_name,city,posted_at,church_id,hired_vendor_id)').eq('vendor_id', currentUser.id).eq('status','hired').limit(12),
              () => supabase.from('bids').select('project_id,vendor_id,status').eq('vendor_id', currentUser.id).eq('status','hired').limit(12)
            )
          : await supabase.from('projects').select('id,title,status,budget,posted_at,church_name,city,church_id,hired_vendor_id').eq('church_id', currentUser.id).order('posted_at',{ascending:false}).limit(12);
        if (cancelled) return;
        const normalized = (projectRes?.data || []).map(row => row?.projects ? normalizeProjectEntity(row.projects) : normalizeProjectEntity(row)).filter(Boolean);
        setLaunchProjects(normalized);
      } catch(err) {
        logError('onboarding-projects-fetch', err);
        if (!cancelled) setLaunchProjects([]);
      }
    })();
    const syncLaunchOps = () => setLaunchOpsState(readLocalJson(KB_PROJECT_OPS_KEY, {}));
    window.addEventListener('storage', syncLaunchOps);
    window.addEventListener('kb:storage-sync', syncLaunchOps);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', syncLaunchOps);
      window.removeEventListener('kb:storage-sync', syncLaunchOps);
    };
  }, [currentUser?.id, role]);

  const launchOperationalAlerts = useMemo(() => collectOperationalAlertsForProjects(launchProjects, launchOpsState, role).slice(0, 4), [launchProjects, launchOpsState, role]);

  const markComplete = async () => {
    if (currentUser) {
      try { await supabase.from("profiles").update({onboarding_complete:true}).eq("id",currentUser.id); } catch(err){ logError('onboarding-complete', err, { userId: currentUser.id }); }
    }
  };

  const churchSteps = [
    {
      icon:"",
      title:"Welcome to FaithBid",
      sub:"The only marketplace built exclusively for churches and faith-based ministries.",
      content: (
        <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:32}}>
          {KB_ONBOARDING_CONTENT.churchIntro.map((c,i)=>(
            <div key={i} style={{display:"flex",gap:14,padding:"16px 18px",background:"rgba(245,240,232,0.08)",borderRadius:"var(--r-md)",border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{fontFamily:"var(--font-sans),monospace",fontSize:10,color:"var(--atext-muted)",paddingTop:3,flexShrink:0,letterSpacing:1}}>{c.num}</div>
              <div><div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:4}}>{c.title}</div><div style={{fontSize:13,color:"var(--atext-mid)",lineHeight:1.6}}>{c.body}</div></div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon:"",
      title:"Tell us about your church",
      sub:"This helps vendors understand who they'll be serving.",
      content:(
        <div style={{marginTop:28}}>
          <div style={{padding:"20px 24px",background:"rgba(245,240,232,0.08)",borderRadius:"var(--r-md)",border:"1px solid rgba(255,255,255,0.1)",marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"var(--atext-muted)",marginBottom:12}}>Your church profile is visible to vendors</div>
            <div style={{display:"flex",flexDirection:"column",gap:10,fontSize:13,color:"rgba(255,255,255,0.6)",lineHeight:1.7}}>
              {KB_ONBOARDING_CONTENT.churchProfilePoints.map((line)=><div key={line}>{line}</div>)}
            </div>
          </div>
          <div style={{padding:"14px 18px",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:10,fontSize:12,color:"rgba(34,197,94,0.8)"}}>
            ✓ Your profile was saved during signup. You can update it anytime in Profile → Settings.
          </div>
        </div>
      ),
    },
    {
      icon:"",
      title:"Post your first project",
      sub:"It's free, takes 3 minutes, and you'll have bids within 24 hours.",
      content:(
        <div style={{marginTop:28}}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {KB_ONBOARDING_CONTENT.churchProjectFlow.map((s,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"36px 1fr",gap:12,padding:"14px 16px",background:"rgba(245,240,232,0.07)",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)"}}>
                <div style={{fontFamily:"var(--font-sans),monospace",fontSize:10,color:"rgba(255,255,255,0.2)",paddingTop:3}}>{s.num}</div>
                <div><div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:3}}>{s.label}</div><div style={{fontSize:12,color:"var(--atext-2)",lineHeight:1.5}}>{s.body}</div></div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon:"",
      title:"Your ministry is connected.",
      sub:"Post your first project now — vendors are ready and waiting.",
      content:(
        <ChurchWorkspaceLaunchPanel
          alerts={launchOperationalAlerts}
          onPostProject={()=>{markComplete();nav("projects:post");}}
          onBrowseVendors={()=>{markComplete();nav("vendors");}}
          onOpenDashboard={()=>{markComplete();nav("projects");}}
        />
      ),
    },
  ];

  const individualSteps = [
    {
      icon:"",
      title:"Welcome to FaithBid",
      sub:"Find trusted Christian professionals for your home, family, or business.",
      content:(
        <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:32}}>
          {KB_ONBOARDING_CONTENT.individualIntro.map((c,i)=>(
            <div key={i} style={{display:"flex",gap:14,padding:"16px 18px",background:"rgba(245,240,232,0.08)",borderRadius:"var(--r-md)",border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{fontFamily:"var(--font-sans),monospace",fontSize:10,color:"var(--atext-muted)",paddingTop:3,flexShrink:0,letterSpacing:1}}>{c.num}</div>
              <div><div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:4}}>{c.title}</div><div style={{fontSize:13,color:"var(--atext-mid)",lineHeight:1.6}}>{c.body}</div></div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const vendorSteps = [
    ...(isFoundingVendor ? [{
      icon:"",
      title:"You are a Charter Vendor.",
      sub:"You joined during the charter phase. That means something here.",
      content:(
        <FoundingVendorBadgeReveal/>
      ),
    }] : []),
    {
      icon:"",
      title:"Welcome to FaithBid",
      sub:"The marketplace where faith-aligned professionals find ministry clients, community members, and families who need trusted Christian workers.",
      content:(
        <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:32}}>
          {KB_ONBOARDING_CONTENT.vendorIntro.map((c,i)=>(
            <div key={i} style={{display:"flex",gap:14,padding:"16px 18px",background:"rgba(245,240,232,0.08)",borderRadius:"var(--r-md)",border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{fontFamily:"var(--font-sans),monospace",fontSize:10,color:"var(--atext-muted)",paddingTop:3,flexShrink:0,letterSpacing:1}}>{c.num}</div>
              <div><div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:4}}>{c.title}</div><div style={{fontSize:13,color:"var(--atext-mid)",lineHeight:1.6}}>{c.body}</div></div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon:"",
      title:"Get Faith Verified",
      sub:"Verified vendors win significantly more projects. It's your most important trust signal.",
      content:(
        <div style={{marginTop:28}}>
          <div style={{background:"rgba(232,224,208,0.08)",border:"1px solid rgba(232,224,208,0.18)",borderRadius:"var(--r-md)",padding:"20px 22px",marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--gold-light)",letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Faith Verified badge unlocks</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {KB_ONBOARDING_CONTENT.vendorVerificationBenefits.map((f,i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",fontSize:13,color:"rgba(255,255,255,0.65)"}}>
                  <span style={{color:"var(--gold-light)",flexShrink:0}}>✓</span>{f}
                </div>
              ))}
            </div>
          </div>
          <button type="button" onClick={()=>{markComplete();nav("verify-profile");}} style={{width:"100%",padding:"14px",background:"var(--gold-light)",color:"var(--navy)",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"var(--font-sans),sans-serif"}}>
            Apply for Faith Verification →
          </button>
          <div style={{textAlign:"center",marginTop:10,fontSize:12,color:"var(--atext-muted)"}}>Takes about 5 minutes · Reviewed within 48 hours</div>
        </div>
      ),
    },
    {
      icon:"",
      title:"How winning bids work",
      sub:"Churches choose vendors based on these three things.",
      content:(
        <div style={{marginTop:28}}>
          {[
            {rank:"#1",label:"Personalization",body:"Reference specific details from the project. \"Your youth wing renovation on Phase 2...\" wins over \"I can do this job.\""},
            {rank:"#2",label:"Faith alignment",body:"Show how your values match theirs. Mention your church, your faith, why ministry work matters to you."},
            {rank:"#3",label:"Social proof",body:"Reviews, completed projects, and badges. The more you build up, the more bids you win."},
          ].map((t,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"44px 1fr",gap:12,padding:"16px 16px",background:"rgba(245,240,232,0.07)",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)",marginBottom:10}}>
              <div style={{fontFamily:"var(--font-display),serif",fontSize:22,fontWeight:700,color:"var(--gold-light)",lineHeight:1}}>{t.rank}</div>
              <div><div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:3}}>{t.label}</div><div style={{fontSize:12,color:"var(--atext-2)",lineHeight:1.6}}>{t.body}</div></div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon:"",
      title:"Your operating center is ready.",
      sub:"Work your best-fit projects, strengthen trust, and move from setup into real opportunities.",
      content:(
        <VendorWorkspaceLaunchPanel
          vendorProfile={userProfile}
          alerts={launchOperationalAlerts}
          isFoundingVendor={isFoundingVendor}
          onBrowseProjects={()=>{markComplete();nav("projects");}}
          onCompleteProfile={()=>{markComplete();nav("profile");}}
          onVerifyProfile={()=>{markComplete();nav("verify-profile");}}
          onOpenMatches={()=>{markComplete();nav("matches");}}
          onOpenInbox={()=>{markComplete();nav("messages");}}
          onOpenActivity={()=>{markComplete();nav("activity");}}
        />
      ),
    },
  ];

  const steps = role === "vendor" ? vendorSteps : role === "individual" ? individualSteps : churchSteps;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const goNext = async () => {
    if (isLast) {
      // Await the completion write before nav so the user doesn't see the
      // onboarding flow again on next session due to an in-flight promise
      // being abandoned mid-navigation.
      await markComplete();
      nav(role === "vendor" ? "projects" : "projects:post");
      return;
    }
    setStep(s => s + 1);
  };

  return (
    <div style={{minHeight:"100vh",backgroundImage:`url(${CLAY_BG})`,backgroundSize:"cover",backgroundPosition:"center",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      {/* Background glow */}
      <div style={{position:"absolute",top:"-20%",left:"50%",transform:"translateX(-50%)",width:900,height:700,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(245,240,232,0.06) 0%,transparent 65%)",pointerEvents:"none"}}/>

      {/* Top bar */}
      <div className="onboarding-topbar" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"24px 40px",flexShrink:0,position:"relative",zIndex:2}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <CrossLogo size={30}/>
        </div>
        {/* Progress dots */}
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {steps.map((_,i)=>(
            <div key={i} style={{height:3,width:i===step?32:i<step?24:16,borderRadius:2,background:i<step?"var(--gold-light)":i===step?"rgba(245,240,232,0.7)":"rgba(255,255,255,0.1)",transition:"all 0.4s ease"}}/>
          ))}
        </div>
        <button type="button" onClick={()=>{markComplete();nav(role === "vendor" ? "projects" : "projects:post");}} style={{background:"none",border:"none",fontSize:12,color:"var(--atext-muted)",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif"}}>{role === "vendor" ? "Skip to projects →" : "Skip to project post →"}</button>
      </div>

      {/* Content */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 24px 48px",position:"relative",zIndex:2}}>
        <div style={{width:"100%",maxWidth:500,animation:"fadeUp 0.45s ease"}}>
          {/* Step icon */}
          <div style={{width:48,height:3,background:"rgba(245,240,232,0.3)",borderRadius:2,margin:"0 auto 20px"}}></div>

          {/* Heading */}
          <div style={{fontFamily:"var(--font-display),serif",fontSize:36,fontWeight:700,color:"#fff",lineHeight:1.1,letterSpacing:-0.5,marginBottom:10,textAlign:"center"}}>{current.title}</div>
          <div style={{fontSize:15,color:"var(--atext-2)",fontWeight:400,textAlign:"center",lineHeight:1.6,marginBottom:8}}>{current.sub}</div>

          {/* Step content */}
          {current.content}

          {/* Navigation */}
          {!isLast && (
            <div style={{marginTop:32,display:"flex",gap:10,alignItems:"center"}}>
              {step > 0 && (
                <button type="button" onClick={()=>setStep(s=>s-1)} style={{padding:"12px 20px",background:"rgba(245,240,232,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"rgba(255,255,255,0.6)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"var(--font-sans),sans-serif"}}>← Back</button>
              )}
              <button type="button" onClick={goNext} style={{flex:1,padding:"14px",background:"var(--gold-light)",color:"var(--navy)",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"var(--font-sans),sans-serif",transition:"all 0.18s"}}>
                {step === steps.length - 2 ? "See what's next →" : "Continue"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResetPasswordScreen({nav, showToast}){
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const navTimerRef = useRef(null);

  useEffect(() => {
    return () => { if (navTimerRef.current) clearTimeout(navTimerRef.current); };
  }, []);

  const handleReset = async () => {
    const strengthError = passwordStrengthError(password);
    if (strengthError) { setError(strengthError); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true); setError("");
    try {
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { logError("password-reset", err); setError(err.message); return; }
    setDone(true);
    showToast("✓ Password updated successfully");
    // Clear hash and redirect after 2s
    window.history.replaceState(null, "", window.location.pathname);
    navTimerRef.current = setTimeout(() => { setAuthDefaultRole("login"); nav("auth"); }, 2000);
    } catch (err) {
      logError("password-reset-submit", err);
      setError("Could not update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",backgroundImage:`url(${CLAY_BG})`,backgroundSize:"cover",backgroundPosition:"center",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 20px"}}>
      <div style={{width:"100%",maxWidth:500,animation:"fadeUp 0.4s ease"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:0}}><CrossLogo size={44}/></div>
          <div style={{fontFamily:"var(--font-display),serif",fontSize:32,fontWeight:700,color:"#fff",marginTop:16,marginBottom:8}}>
            {done ? "Password updated." : "Set a new password."}
          </div>
          <div style={{fontSize:14,color:"var(--atext-2)"}}>
            {done ? "Redirecting you to sign in…" : "Choose a strong password for your account."}
          </div>
        </div>

        {!done && (
          <>
            {error && <div style={{padding:"12px 16px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"var(--r-sm)",fontSize:13,color:"#FCA5A5",marginBottom:20}}>Error: {error}</div>}
            <div style={{position:"relative",marginBottom:28}}>
              <label style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"var(--atext-muted)",display:"block",marginBottom:8}}>New Password</label>
              <input aria-label="At least 8 characters" type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" style={{width:"100%",padding:"14px 16px",background:"rgba(245,240,232,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,fontSize:15,color:"#fff",fontFamily:"var(--font-sans),sans-serif",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{position:"relative",marginBottom:28}}>
              <label style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"var(--atext-muted)",display:"block",marginBottom:8}}>Confirm Password</label>
              <input aria-label="Repeat new password" type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat new password" style={{width:"100%",padding:"14px 16px",background:"rgba(245,240,232,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,fontSize:15,color:"#fff",fontFamily:"var(--font-sans),sans-serif",outline:"none",boxSizing:"border-box"}}
                onKeyDown={e=>e.key==="Enter"&&handleReset()}/>
            </div>
            <button type="button" onClick={handleReset} disabled={loading||!password||!confirm} style={{width:"100%",padding:"16px",background:"var(--gold-light)",color:"var(--navy)",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"var(--font-sans),sans-serif",opacity:loading||!password||!confirm?0.6:1,transition:"all 0.18s"}}>
              {loading ? "Updating…" : "Update Password →"}
            </button>
            <div style={{textAlign:"center",marginTop:16}}>
              <button type="button" onClick={()=>{setAuthDefaultRole("login");nav("auth");}} style={{background:"none",border:"none",color:"var(--atext-muted)",fontSize:12,cursor:"pointer",fontFamily:"var(--font-sans),sans-serif"}}>← Back to Sign in</button>
            </div>
          </>
        )}

        {done && (
          <div style={{textAlign:"center",padding:"32px",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:"var(--r-md)"}}>
            <div style={{fontSize:36,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg></div>
            <div style={{fontSize:15,fontWeight:600,color:"#fff",marginBottom:6}}>All set!</div>
            <div style={{fontSize:13,color:"var(--atext-2)"}}>Taking you back to sign in…</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PricingScreenRoute({ dependencies, ...props }) {
  applyAccountScreenDependencies(dependencies);
  return <PricingScreen {...props} />;
}

export function OnboardingScreenRoute({ dependencies, ...props }) {
  applyAccountScreenDependencies(dependencies);
  return <OnboardingScreen {...props} />;
}

export function ResetPasswordScreenRoute({ dependencies, ...props }) {
  applyAccountScreenDependencies(dependencies);
  return <ResetPasswordScreen {...props} />;
}
