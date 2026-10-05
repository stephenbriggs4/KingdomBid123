import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { VendorBusinessDetailsPanel, VendorCredentialsPanel } from "./VendorCredentialsPanel";
import { calcVendorCompletion } from "./vendorCompletion";

let CATEGORIES, CrossLogo, KBSkeleton, KB_BP_MOBILE, KB_US_STATE_CODES, ProfileStats, ReferralDashboard, TrustedVendorRoster, VendorCompletionMeter, VendorPortfolioEditor, VendorReferencesTab, VendorVerificationFlow, buildVendorProfilePreviewSeed, getDeliveryModelMeta, getReturnNavigationTarget, isKbTimeoutError, kbIsDevRuntime, logError, normalizeDeliveryModel, queueVendorNavigation, readReturnContext, runSupabaseWithFallback, runSupabaseWithTimeout, selectProfilesBestEffort, serializeVendorServiceModel, syncProfileVendorMirror, useViewportWidth;

function applyProfileScreenDependencies(dependencies = {}) {
  ({ CATEGORIES, CrossLogo, KBSkeleton, KB_BP_MOBILE, KB_US_STATE_CODES, ProfileStats, ReferralDashboard, TrustedVendorRoster, VendorCompletionMeter, VendorPortfolioEditor, VendorReferencesTab, VendorVerificationFlow, buildVendorProfilePreviewSeed, getDeliveryModelMeta, getReturnNavigationTarget, isKbTimeoutError, kbIsDevRuntime, logError, normalizeDeliveryModel, queueVendorNavigation, readReturnContext, runSupabaseWithFallback, runSupabaseWithTimeout, selectProfilesBestEffort, serializeVendorServiceModel, syncProfileVendorMirror, useViewportWidth } = dependencies || {});
}

function CharterStepHeader({ eyebrow, title, body, step }) {
  return (
    <div style={{padding:"30px 34px 24px",background:"linear-gradient(180deg,#fffaf0 0%,#f5efe2 100%)",borderBottom:"1px solid #e9dfca"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap",marginBottom:18}}>
        <CrossLogo size={32} color="#22301B" wordmarkColor="#22301B"/>
        <div style={{display:"flex",gap:6}}>{[1,2,3].map(n=><span key={n} style={{width:n===step?30:18,height:4,borderRadius:999,background:n<=step?"#b08840":"#ddd4c3",transition:"all .2s ease"}}/>)}</div>
      </div>
      <div style={{fontFamily:"var(--font-sans),monospace",fontSize:10,fontWeight:800,letterSpacing:2,textTransform:"uppercase",color:"#9b7331",marginBottom:10}}>{eyebrow}</div>
      <h1 style={{fontFamily:"var(--font-display),serif",fontSize:"clamp(32px,5vw,46px)",lineHeight:1.02,letterSpacing:"-.035em",margin:0,color:"#1C2814"}}>{title}</h1>
      <p style={{fontSize:14.5,lineHeight:1.7,color:"#625a4e",margin:"14px 0 0",maxWidth:690}}>{body}</p>
    </div>
  );
}

function ProfileScreen({role, currentUser, userProfile, setUserProfile, showToast, nav, initialTab, charterFirstRun = false}){
  const profileReturnTarget = getReturnNavigationTarget(readReturnContext(), "projects");
  const [profileScrollTarget] = useState(() => {
    try { return window.sessionStorage.getItem("kb_profile_scroll_to"); }
    catch { return null; }
  });
  // A pending scroll target (for example "Manage specialties" from My Work) must open the tab that holds it,
  // even though App always passes initialTab="overview" for this route.
  const [tab, setTab] = useState(profileScrollTarget ? "vendor" : (initialTab || "profile"));
  const [loading, setLoading] = useState(true);
  const [charterFirstRunActive, setCharterFirstRunActive] = useState(Boolean(charterFirstRun));
  const [charterStep, setCharterStep] = useState(1);
  const [charterOptionalOpen, setCharterOptionalOpen] = useState(false);
  const [charterCompletionBusy, setCharterCompletionBusy] = useState(false);
  const [charterCompletionError, setCharterCompletionError] = useState("");
  const charterCompact = useViewportWidth(1440) < KB_BP_MOBILE;

  useEffect(() => {
    if (!profileScrollTarget) return;
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(profileScrollTarget);
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        try { window.sessionStorage.removeItem('kb_profile_scroll_to'); } catch { /* non-fatal */ }
        return;
      }
      attempts += 1;
      if (attempts < 20) setTimeout(tryScroll, 100);
    };
    const t = setTimeout(tryScroll, 100);
    return () => clearTimeout(t);
  }, [profileScrollTarget]);

  useEffect(() => {
    const PROFILE_TAB_TITLES = {
      overview: 'My Profile — FaithBid',
      profile: 'Edit Profile — FaithBid',
      bids: 'My Proposals — FaithBid',
      verify: 'Faith Verification — FaithBid',
      settings: 'Account Settings — FaithBid',
    };
    const prev = document.title;
    document.title = PROFILE_TAB_TITLES[tab] || 'My Profile — FaithBid';
    return () => { document.title = prev; };
  }, [tab]);
  const [saving, setSaving] = useState(false);
  const [fullProfile, setFullProfile] = useState(null);
  const [vendorRow, setVendorRow] = useState(null);
  const [verificationApplicationStatus, setVerificationApplicationStatus] = useState(null);
  const [overviewStats, setOverviewStats] = useState({projects:0, hired:0, messages:0, reviews:0, bids:0});
  const [form, setForm] = useState({
    org_name:"", city:"", state_code:"", place_id:null, denomination:"", category:"", faith_statement:"", congregation_size:"",
  });
  const [vendorForm, setVendorForm] = useState({
    name:"", category:"", city:"", service_state:"", bio:"", faith_statement:"", tags:[], delivery_model:"remote", service_radius_miles:"50",
    tagline:"", min_project_budget:"", max_project_budget:"", response_time:"",
  });
  const [tagInput, setTagInput] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const setV = (k,v) => setVendorForm(f=>({...f,[k]:v}));

  const addTag = (e) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().replace(/\s+/g, " ").slice(0, 32);
      const currentTags = Array.isArray(vendorForm.tags) ? vendorForm.tags : [];
      const exists = currentTags.some(existing => String(existing).toLowerCase() === t.toLowerCase());
      if (t && !exists && currentTags.length < 12) setV("tags", [...currentTags, t]);
      if (currentTags.length >= 12 && showToast) showToast("You can add up to 12 tags.", "error");
      setTagInput("");
    }
  };
  const removeTag = (t) => setV("tags", (Array.isArray(vendorForm.tags) ? vendorForm.tags : []).filter(x => x !== t));


  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const { data: profile } = await runSupabaseWithTimeout(
          selectProfilesBestEffort([
            "id,role,org_name,city,state_code,place_id,denomination,category,faith_statement,congregation_size,founding_vendor,vendor_type,created_at,onboarding_complete",
            "id,role,org_name,city,state_code,place_id,category,faith_statement",
            "id,role,org_name,city,state_code,place_id",
            "id,role",
            "id",
          ], query => query.eq("id", currentUser.id).maybeSingle()),
          "Profile page profile read",
          5500
        ).catch(err => {
          if (!isKbTimeoutError(err)) {
            logError("profile-screen-profile-read", err, { userId: currentUser.id });
          } else if (kbIsDevRuntime()) {
            console.warn("[kb:profile-screen-profile-read] transient timeout; using hydrated profile fallback", { userId: currentUser.id });
          }
          return { data: null, error: err };
        });
        if (cancelled) return;
        const safeProfile = profile || userProfile || {};
        setFullProfile(safeProfile || null);
        setForm({
          org_name: safeProfile.org_name || userProfile?.org_name || "",
          city: safeProfile.city || userProfile?.city || "",
          state_code: safeProfile.state_code || userProfile?.state_code || "",
          place_id: safeProfile.place_id || userProfile?.place_id || null,
          denomination: safeProfile.denomination || "",
          category: safeProfile.category || userProfile?.category || "",
          faith_statement: safeProfile.faith_statement || userProfile?.faith_statement || "",
          congregation_size: safeProfile.congregation_size || userProfile?.congregation_size || "",
        });
        // The freshly read profile role is authoritative. Fall back to hydrated role state only when that read is unavailable.
        const resolvedProfileRole = String(safeProfile?.role || role || "").trim().toLowerCase();
        const shouldFetchVendorRow = resolvedProfileRole === "vendor";
        let vendor = null;
        if (shouldFetchVendorRow) {
          const vendorMinColumns = "id,name,category,city,verified,user_id,created_at";
          const vendorBaseColumns = "id,name,category,city,verified,tier,founding_vendor,rating,reviews_count,projects_count,response_time,bio,tagline,min_project_budget,max_project_budget,user_id,image_url,created_at";
          const vendorRichColumns = vendorBaseColumns + ",faith_statement,tags,service_model,service_city,service_state,base_place_id,service_radius_miles,vendor_type,verification_status,website,social_links,contact_preference,church_sizes_served";
          const vendorResult = await runSupabaseWithTimeout(
            runSupabaseWithFallback(
              () => supabase.from("vendors").select(vendorRichColumns).eq("user_id", currentUser.id).maybeSingle(),
              () => runSupabaseWithFallback(
                () => supabase.from("vendors").select(vendorBaseColumns).eq("user_id", currentUser.id).maybeSingle(),
                () => supabase.from("vendors").select(vendorMinColumns).eq("user_id", currentUser.id).maybeSingle()
              )
            ),
            "Profile page vendor row read",
            3200
          ).catch(err => {
            logError("profile-screen-vendor-read", err, { userId: currentUser.id });
            return { data: null, error: err };
          });
          vendor = vendorResult?.data || null;
        }
        if (cancelled) return;
        if (vendor) {
          setVendorRow(vendor);
          setVendorForm({
            name: vendor.name || "",
            category: vendor.category || "",
            city: vendor.service_city || vendor.city || "",
            service_state: vendor.service_state || "",
            bio: vendor.bio || "",
            faith_statement: vendor.faith_statement || "",
            tags: Array.isArray(vendor.tags) ? vendor.tags : [],
            delivery_model: normalizeDeliveryModel(vendor.service_model || "remote"),
            service_radius_miles: vendor.service_radius_miles == null ? "50" : String(vendor.service_radius_miles),
            tagline: vendor.tagline || "",
            min_project_budget: vendor.min_project_budget != null ? String(vendor.min_project_budget) : "",
            max_project_budget: vendor.max_project_budget != null ? String(vendor.max_project_budget) : "",
            response_time: vendor.response_time || "",
          });
          const verificationRes = await runSupabaseWithTimeout(
            supabase.rpc("kb_get_my_faith_verification_status"),
            "Profile page verification status read",
            2800
          ).catch(err => {
            logError("profile-screen-verification-status-read", err, { vendorId:vendor.id });
            return { data:null, error:err };
          });
          if (cancelled) return;
          if (verificationRes?.error) {
            logError("profile-screen-verification-status-read", verificationRes.error, { vendorId:vendor.id });
            setVerificationApplicationStatus(null);
          } else {
            const verificationRows = Array.isArray(verificationRes?.data) ? verificationRes.data : (verificationRes?.data ? [verificationRes.data] : []);
            setVerificationApplicationStatus(String(verificationRows[0]?.application_status || "").toLowerCase() || null);
          }
        } else {
          setVendorRow(null);
          setVerificationApplicationStatus(null);
        }
        // Profile page shell is now safe to show. Overview stats hydrate below; they should never keep the profile page in skeleton state.
        if (!cancelled) setLoading(false);
        // Fetch overview stats for church users
        if (!vendor) {
          // head:true → don't pull row IDs back, only the exact count.
          // Without this, each query fetches every matching id; on a busy
          // church account that's hundreds of unnecessary rows on every load.
          const [projRes, hiredRes, convRes, reviewRes] = await runSupabaseWithTimeout(Promise.all([
            supabase.from("projects").select("id", {count:"exact",head:true}).eq("church_id", currentUser.id),
            supabase.from("projects").select("id", {count:"exact",head:true}).eq("church_id", currentUser.id).not("hired_vendor_id", "is", null),
            supabase.from("conversations").select("id", {count:"exact",head:true}).eq("church_id", currentUser.id),
            supabase.from("reviews").select("id", {count:"exact",head:true}).eq("church_id", currentUser.id),
          ]), "Profile page church stats", 3200).catch(err => {
            logError("profile-screen-church-stats", err, { userId: currentUser.id });
            return [{ count:0 }, { count:0 }, { count:0 }, { count:0 }];
          });
          if (cancelled) return;
          setOverviewStats({
            projects: projRes.count || 0,
            hired: hiredRes.count || 0,
            messages: convRes.count || 0,
            reviews: reviewRes.count || 0,
            bids: 0,
          });
        } else {
          // Vendor: fetch bid + portfolio counts. Both are lightweight head-only reads.
          const [bidCountRes, portfolioCountRes] = await runSupabaseWithTimeout(Promise.all([
            supabase.from("bids").select("id", {count:"exact",head:true}).eq("vendor_id", currentUser.id),
            supabase.from("vendor_portfolio_items").select("id", {count:"exact",head:true}).eq("vendor_id", currentUser.id),
          ]), "Profile page vendor stats", 3200).catch(err => {
            logError("profile-screen-vendor-stats", err, { userId: currentUser.id });
            return [{ count: 0 }, { count: 0 }];
          });
          if (cancelled) return;
          setOverviewStats(s => ({...s, bids: bidCountRes?.count || 0, portfolioCount: portfolioCountRes?.count || 0}));
        }
      } catch (err) {
        logError("profile-screen-fetch", err);
        if (!cancelled && showToast) showToast("Couldn't load your profile. Refresh to retry.", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
    // showToast is intentionally excluded from deps: it's recreated every
    // parent render, and including it caused the entire profile + vendor +
    // stats fetch (5+ Supabase queries) to re-run on any App-level re-render.
    // The ref captured at mount is stable enough — showToast just dispatches
    // to setToastQueue which is itself stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);


  const saveProfile = async () => {
    if (!currentUser?.id) {
      showToast && showToast("Please sign in again before saving.", "error");
      return;
    }
    const cleanProfile = {
      org_name: String(form.org_name || "").trim(),
      city: String(form.city || "").trim(),
      state_code: String(form.state_code || "").trim().toUpperCase(),
      denomination: String(form.denomination || "").trim(),
      category: String(form.category || "").trim(),
      faith_statement: String(form.faith_statement || "").trim(),
      congregation_size: String(form.congregation_size || "").trim(),
    };
    if (!cleanProfile.org_name) {
      showToast && showToast((vendorRow ? "Business" : "Church") + " name is required.", "error");
      return;
    }
    if (!vendorRow && (!cleanProfile.city || !cleanProfile.state_code)) {
      showToast && showToast("Church city and state are required.", "error");
      return;
    }
    setSaving(true);
    try {
      const { profileError, vendorError } = await syncProfileVendorMirror({
        userId: currentUser.id,
        profilePatch: {
          org_name: cleanProfile.org_name,
          city: cleanProfile.city,
          state_code: cleanProfile.state_code || null,
          denomination: role === "church" ? cleanProfile.denomination : "",
          category: role === "vendor" ? cleanProfile.category : "",
          faith_statement: cleanProfile.faith_statement,
          congregation_size: role === "church" ? (cleanProfile.congregation_size || null) : undefined,
        },
        vendorPatch: vendorRow ? {
          name: cleanProfile.org_name,
          city: cleanProfile.city,
          service_city: cleanProfile.city,
          service_state: cleanProfile.state_code || vendorRow.service_state || null,
          category: cleanProfile.category || vendorRow.category || "",
          faith_statement: cleanProfile.faith_statement,
        } : null,
      });
      if (!profileError && !vendorError) {
        if (vendorRow) setVendorRow(v => v ? ({ ...v, name: cleanProfile.org_name, city: cleanProfile.city, service_city: cleanProfile.city, service_state: cleanProfile.state_code || v.service_state || null, category: cleanProfile.category || v.category, faith_statement: cleanProfile.faith_statement }) : v);
        setForm(f => ({ ...f, ...cleanProfile }));
        setUserProfile(p => ({...p, org_name: cleanProfile.org_name, city: cleanProfile.city, state_code: cleanProfile.state_code || null, category: cleanProfile.category, faith_statement: cleanProfile.faith_statement}));
        showToast("Profile saved");
      } else {
        showToast("Couldn't save profile — please try again.", "error");
      }
    } catch (err) {
      logError("saveProfile", err);
      showToast("Couldn't save profile — please try again.", "error");
    } finally {
      setSaving(false);
    }
  };


  const saveVendorProfile = async () => {
    if (!currentUser?.id) {
      showToast && showToast("Please sign in again before saving.", "error");
      return false;
    }
    const normalizedDelivery = normalizeDeliveryModel(vendorForm.delivery_model || "remote");
    const cleanVendor = {
      ...vendorForm,
      name: String(vendorForm.name || "").trim(),
      category: String(vendorForm.category || "").trim(),
      city: String(vendorForm.city || "").trim(),
      service_city: String(vendorForm.city || "").trim(),
      service_state: String(vendorForm.service_state || "").trim().toUpperCase(),
      bio: String(vendorForm.bio || "").trim(),
      faith_statement: String(vendorForm.faith_statement || "").trim(),
      tags: (Array.isArray(vendorForm.tags) ? vendorForm.tags : []).map(t => String(t).trim()).filter(Boolean).slice(0, 12),
      delivery_model: undefined,
      service_model: serializeVendorServiceModel(normalizedDelivery),
      service_radius_miles: normalizedDelivery === "remote" ? null : (Number(vendorForm.service_radius_miles || 0) || 50),
      tagline: String(vendorForm.tagline || "").trim().slice(0, 100),
      min_project_budget: vendorForm.min_project_budget ? (Number(vendorForm.min_project_budget) || null) : null,
      max_project_budget: vendorForm.max_project_budget ? (Number(vendorForm.max_project_budget) || null) : null,
      response_time: String(vendorForm.response_time || "").trim().slice(0, 60),
    };
    if (!cleanVendor.name || !cleanVendor.category) {
      showToast && showToast("Add a display name and service category before saving.", "error");
      return false;
    }
    if (normalizedDelivery !== "remote" && (!cleanVendor.service_city || !cleanVendor.service_state)) {
      showToast && showToast("Add the city and state at the center of your on-site service area.", "error");
      return false;
    }
    setSaving(true);
    try {
      const { profileError, vendorError } = await syncProfileVendorMirror({
        userId: currentUser.id,
        vendorPatch: cleanVendor,
        profilePatch: {
          org_name: cleanVendor.name,
          city: cleanVendor.city,
          state_code: cleanVendor.service_state || null,
          category: cleanVendor.category,
          faith_statement: cleanVendor.faith_statement,
        },
      });
      if (!profileError && !vendorError) {
        let geoSyncStatus = null;
        try {
          const { data: geoSync, error: geoSyncError } = await supabase.rpc('kb_vendor_sync_primary_service_radius', {
            p_radius_miles: cleanVendor.service_radius_miles,
          });
          if (geoSyncError) throw geoSyncError;
          geoSyncStatus = geoSync?.status || null;
        } catch (geoError) {
          logError('vendor-primary-radius-sync', geoError, { userId: currentUser.id });
        }
        setVendorForm(v => ({ ...v, ...cleanVendor, delivery_model: normalizedDelivery, service_radius_miles: cleanVendor.service_radius_miles == null ? "" : String(cleanVendor.service_radius_miles) }));
        setVendorRow(v => v ? {...v, ...cleanVendor, service_model: serializeVendorServiceModel(normalizedDelivery)} : v);
        setUserProfile(p => ({...p, org_name: cleanVendor.name, city: cleanVendor.city, state_code: cleanVendor.service_state || p?.state_code || null, category: cleanVendor.category, faith_statement: cleanVendor.faith_statement}));
        if (geoSyncStatus === 'location_unresolved' && normalizedDelivery !== 'remote') {
          showToast("Vendor profile saved. Your city is captured; precise radius matching will activate when this market is mapped.");
        } else {
          showToast("Vendor profile saved");
        }
        return true;
      }
      showToast("Couldn't save vendor profile — please try again.", "error");
      return false;
    } catch (err) {
      logError("vendor-profile-save", err);
      showToast("Couldn't save vendor profile — please try again.", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const charterIdentityReady = Boolean(
    String(vendorForm.name || "").trim().length > 1
    && String(vendorForm.category || "").trim().length > 1
    && String(vendorForm.city || "").trim().length > 1
    && String(vendorForm.service_state || "").trim().length === 2
    && ["onsite", "remote", "both"].includes(normalizeDeliveryModel(vendorForm.delivery_model || "remote"))
  );
  const charterEssentialsReady = Boolean(
    charterIdentityReady
    && String(vendorForm.tagline || "").trim().length >= 6
    && String(vendorForm.bio || "").trim().length >= 100
    && (Array.isArray(vendorForm.tags) ? vendorForm.tags : []).filter(Boolean).length >= 1
  );

  const completeCharterVendorFirstRun = async () => {
    if (charterCompletionBusy) return;
    if (!charterEssentialsReady) {
      setCharterCompletionError("Add a tagline, a bio of at least 100 characters, and at least one skill or specialty before continuing.");
      return;
    }
    setCharterCompletionBusy(true);
    setCharterCompletionError("");
    try {
      const saved = await saveVendorProfile();
      if (!saved) return;
      const { data, error } = await runSupabaseWithTimeout(
        supabase.from("profiles")
          .update({ onboarding_complete: true })
          .eq("id", currentUser.id)
          .select("id,onboarding_complete")
          .single(),
        "Charter Vendor onboarding completion",
        6000
      );
      if (error || data?.onboarding_complete !== true) throw error || new Error("FaithBid could not confirm onboarding completion.");
      setUserProfile(p => ({ ...(p || {}), onboarding_complete:true, founding_vendor:true, role:"vendor" }));
      setCharterStep(3);
    } catch (err) {
      logError("charter-vendor-onboarding-complete", err, { userId: currentUser?.id });
      setCharterCompletionError("Your profile was saved, but FaithBid could not confirm the final setup step. Try again — your profile changes are safe.");
    } finally {
      setCharterCompletionBusy(false);
    }
  };

  const exitCharterFirstRunToTab = (nextTab) => {
    setCharterFirstRunActive(false);
    setTab(nextTab);
  };

  const isVerified = vendorRow?.verified;
  const isPending = verificationApplicationStatus === "pending" && !isVerified;
  const initials = (userProfile?.org_name || form.org_name || "?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  // Brand-system tokens used throughout this screen
  const psx = {
    shell:{background:"#faf8f4",minHeight:"100vh",paddingBottom:60},
    topbar:{maxWidth:1100,margin:"0 auto",padding:"22px 28px 0",display:"flex",alignItems:"center",gap:12},
    backPill:{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px 7px 11px",borderRadius:999,background:"#fffdf8",border:"1px solid #dfd5c2",color:"#1C2814",fontSize:12.5,fontWeight:600,fontFamily:"var(--font-sans),sans-serif",cursor:"pointer",transition:"all 0.15s",boxShadow:"0 4px 12px rgba(28,40,20,0.04)"},
    crumb:{fontSize:11.5,color:"#7d7363",fontFamily:"var(--font-sans),monospace",letterSpacing:0.6,textTransform:"uppercase",fontWeight:600},
    headWrap:{maxWidth:1100,margin:"0 auto",padding:"22px 28px 22px"},
    headPanel:{background:"#fffdf8",border:"1px solid #dfd5c2",borderRadius:22,padding:"26px 30px 24px",boxShadow:"0 7px 20px rgba(28,40,20,0.045)"},
    headRow:{display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"},
    avatar:{width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,#fffaf0,#f0e6d0)",border:"1px solid #dfd5c2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#1C2814",flexShrink:0,letterSpacing:0.3,fontFamily:"var(--font-display),serif"},
    eyebrow:{fontFamily:"var(--font-sans),monospace",fontSize:10.5,fontWeight:700,letterSpacing:2.4,textTransform:"uppercase",color:"#b08840",marginBottom:8},
    headline:{fontFamily:"var(--font-display),serif",fontSize:30,fontWeight:700,color:"#1C2814",letterSpacing:-0.6,lineHeight:1.06,margin:0},
    sub:{fontSize:13.5,color:"#5a5246",lineHeight:1.5,marginTop:6},
    badgeRow:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginTop:10},
    badge:(tone)=>{
      const palette = tone==="verified"
        ? {bg:"#eef5e9",border:"#cfe1c4",color:"#2f5a31"}
        : tone==="pending"
          ? {bg:"#fcf2dd",border:"#e9d5a5",color:"#8a6a1f"}
          : {bg:"#fffaf0",border:"#e9d5a5",color:"#8a6a1f"};
      return {padding:"3px 10px",borderRadius:999,background:palette.bg,border:`1px solid ${palette.border}`,fontSize:9.5,fontWeight:800,color:palette.color,letterSpacing:0.6,fontFamily:"var(--font-sans),monospace"};
    },
    tabsWrap:{maxWidth:1100,margin:"0 auto",padding:"0 28px",borderBottom:"1px solid #ece4d2",display:"flex",gap:24,overflowX:"auto"},
    // flexShrink:0 keeps each label at full width so the tab strip scrolls instead of squeezing labels together on phones.
    tab:(active)=>({padding:"12px 0 14px",fontSize:13,fontWeight:active?700:600,color:active?"#1C2814":"#7d7363",position:"relative",background:"none",border:"none",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif",transition:"color 0.15s",whiteSpace:"nowrap",flexShrink:0}),
    tabBar:{position:"absolute",left:0,right:0,bottom:-1,height:2.5,background:"linear-gradient(90deg,#c9a45c,#b08840)",borderRadius:2},
    tabDot:{position:"absolute",top:9,right:-9,width:6,height:6,borderRadius:"50%",background:"#b08840"},
    panel:{background:"#fff",border:"1px solid #dfd5c2",borderRadius:18,marginBottom:18,boxShadow:"0 6px 18px rgba(28,40,20,0.04)",overflow:"hidden"},
    panelHd:{padding:"16px 22px 14px",background:"#fffdf8",borderBottom:"1px solid #ece4d2",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"},
    panelEyebrow:{fontFamily:"var(--font-sans),monospace",fontSize:9.5,fontWeight:700,letterSpacing:1.8,textTransform:"uppercase",color:"#b08840"},
    panelTitle:{fontFamily:"var(--font-display),serif",fontSize:18,fontWeight:700,color:"#1C2814",letterSpacing:-0.3,marginTop:2},
    panelIco:{flex:"none",width:34,height:34,borderRadius:"50%",background:"rgba(176,136,64,.12)",color:"#8a6729",display:"grid",placeItems:"center"},
    panelBody:{padding:"22px"},
    label:{display:"block",fontSize:11.5,fontWeight:700,letterSpacing:0.6,textTransform:"uppercase",color:"#5a5246",marginBottom:8,fontFamily:"var(--font-sans),sans-serif"},
    labelHelper:{fontSize:11,fontWeight:500,color:"#9c917f",letterSpacing:0,textTransform:"none",marginLeft:6},
    input:{width:"100%",height:46,padding:"0 14px",borderRadius:12,border:"1.5px solid #dfd5c2",background:"#fffdf8",fontSize:14,color:"#1C2814",fontFamily:"var(--font-sans),sans-serif",outline:"none",transition:"border-color 0.15s,box-shadow 0.15s",boxSizing:"border-box"},
    textarea:{width:"100%",padding:"12px 14px",borderRadius:12,border:"1.5px solid #dfd5c2",background:"#fffdf8",fontSize:14,color:"#1C2814",fontFamily:"var(--font-sans),sans-serif",outline:"none",transition:"border-color 0.15s,box-shadow 0.15s",boxSizing:"border-box",resize:"vertical",lineHeight:1.55},
    field:{marginBottom:18},
    btnPrimary:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"11px 22px",borderRadius:999,background:"linear-gradient(180deg,#c9a45c,#b08840)",color:"#fff",fontSize:13,fontWeight:700,border:"none",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif",letterSpacing:0.2,boxShadow:"0 4px 12px rgba(176,136,64,0.25),inset 0 1px 0 rgba(255,255,255,0.18)",transition:"all 0.15s"},
    btnSecondary:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 20px",borderRadius:999,background:"#fffdf8",color:"#1C2814",fontSize:13,fontWeight:600,border:"1px solid #dfd5c2",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif",transition:"all 0.15s"},
    inputFocus:(e)=>{e.currentTarget.style.borderColor="#b08840";e.currentTarget.style.boxShadow="0 0 0 3px rgba(176,136,64,0.12)";},
    inputBlur:(e)=>{e.currentTarget.style.borderColor="#dfd5c2";e.currentTarget.style.boxShadow="none";},
  };

  if (charterFirstRunActive && role === "vendor") {
    const delivery = normalizeDeliveryModel(vendorForm.delivery_model || "remote");
    const deliveryMeta = getDeliveryModelMeta(delivery);
    const missingEssentials = [
      String(vendorForm.tagline || "").trim().length < 6 ? "Add a marketplace tagline (6+ characters)." : null,
      String(vendorForm.bio || "").trim().length < 100 ? "Tell churches about your business in at least 100 characters." : null,
      (Array.isArray(vendorForm.tags) ? vendorForm.tags : []).filter(Boolean).length < 1 ? "Add at least one skill or specialty." : null,
    ].filter(Boolean);
    const firstRunShell = {minHeight:"100vh",background:"#f7f3ec",color:"#1C2814",padding:"22px 20px 52px"};
    const firstRunCard = {width:"min(860px,100%)",margin:"0 auto",background:"#fffdf8",border:"1px solid #dfd5c2",borderRadius:26,boxShadow:"0 24px 70px rgba(28,40,20,0.10)",overflow:"hidden"};
    const firstRunInput = {...psx.input,background:"#fff"};
    const firstRunTextarea = {...psx.textarea,background:"#fff"};
    if (loading) {
      return (
        <div style={firstRunShell}>
          <div style={firstRunCard}>
            <CharterStepHeader step={charterStep} eyebrow="Charter Vendor setup" title="Preparing your approved profile…" body="FaithBid is loading the details carried forward from your accepted Charter Vendor application."/>
            <div style={{padding:"34px"}}><KBSkeleton variant="card"/><div style={{height:12}}/><KBSkeleton variant="card"/></div>
          </div>
        </div>
      );
    }

    if (!vendorRow) {
      return (
        <div style={firstRunShell}>
          <div style={firstRunCard}>
            <CharterStepHeader step={charterStep} eyebrow="Charter Vendor setup" title="We couldn't load your vendor profile." body="Your approved account has not been changed. Reload this page to retry the profile read before continuing setup."/>
            <div style={{padding:"28px 34px 34px"}}><button type="button" onClick={()=>{try{window.location.reload();}catch{ /* reload unavailable -- nothing more to do */ }}} style={{...psx.btnPrimary,width:"100%",minHeight:50,borderRadius:12}}>Reload profile</button></div>
          </div>
        </div>
      );
    }

    if (charterStep === 1) {
      return (
        <div style={firstRunShell}>
          <div style={firstRunCard}>
            <CharterStepHeader step={charterStep} eyebrow="Step 1 of 3 · Approved" title="Your Charter Vendor account is active." body="We carried your approved application forward. Review these details — you only need to change something if it is no longer accurate."/>
            <div style={{padding:"28px 34px 34px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24,flexWrap:"wrap"}}>
                <span style={psx.badge("charter")}>✦ CHARTER VENDOR</span>
                <span style={{...psx.badge("verified"),background:"#eef5e9",borderColor:"#cfe1c4",color:"#2f5a31"}}>MARKETPLACE APPROVED</span>
                <span style={{fontSize:12,color:"#7d7363"}}>Faith Verification remains optional.</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:charterCompact?"1fr":"repeat(2,minmax(0,1fr))",gap:16}}>
                <div style={psx.field}><label style={psx.label}>Business name</label><input value={vendorForm.name} onChange={e=>setV("name",e.target.value)} style={firstRunInput} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/></div>
                <div style={psx.field}><label style={psx.label}>Service category</label><select value={vendorForm.category} onChange={e=>setV("category",e.target.value)} style={firstRunInput} onFocus={psx.inputFocus} onBlur={psx.inputBlur}><option value="">Select…</option>{CATEGORIES.map(c=><option key={c.label} value={c.label}>{c.label}</option>)}</select></div>
                <div style={{...psx.field,gridColumn:"1 / -1"}}>
                  <label style={psx.label}>How you work with churches</label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:10}}>
                    {["onsite","remote","both"].map(key=>{const active=delivery===key;const meta=getDeliveryModelMeta(key);return <button key={key} type="button" onClick={()=>setV("delivery_model",key)} style={{minHeight:46,padding:"10px 12px",borderRadius:12,border:`1.5px solid ${active?"#b08840":"#dfd5c2"}`,background:active?"#fffaf0":"#fff",fontSize:12.5,fontWeight:700,color:active?"#8a6a2e":"#1C2814",cursor:"pointer"}}>{meta.label}</button>;})}
                  </div>
                </div>
                <div style={psx.field}><label style={psx.label}>Business / service city</label><input value={vendorForm.city} onChange={e=>setV("city",e.target.value)} placeholder="Dallas" style={firstRunInput} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/></div>
                <div style={psx.field}><label style={psx.label}>State</label><select value={vendorForm.service_state||""} onChange={e=>setV("service_state",e.target.value)} style={firstRunInput} onFocus={psx.inputFocus} onBlur={psx.inputBlur}><option value="">State…</option>{KB_US_STATE_CODES.map(code=><option key={code} value={code}>{code}</option>)}</select></div>
                {delivery!=="remote" && <div style={{...psx.field,gridColumn:"1 / -1",maxWidth:320}}><label style={psx.label}>Service radius <span style={psx.labelHelper}>· editable</span></label><input value={vendorForm.service_radius_miles||""} onChange={e=>setV("service_radius_miles",e.target.value.replace(/[^0-9]/g,""))} placeholder="50" style={firstRunInput} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/></div>}
              </div>
              {!charterIdentityReady && <div role="alert" style={{padding:"11px 13px",borderRadius:10,background:"#fff0ee",color:"#9b2c22",fontSize:13,marginBottom:16}}>Business name, category, city, state, and work style are needed before continuing.</div>}
              <button type="button" disabled={!charterIdentityReady} onClick={()=>{setCharterCompletionError("");setCharterStep(2);}} style={{...psx.btnPrimary,width:"100%",minHeight:50,borderRadius:12,opacity:charterIdentityReady?1:.55,cursor:charterIdentityReady?"pointer":"not-allowed"}}>Looks right — continue</button>
            </div>
          </div>
        </div>
      );
    }

    if (charterStep === 2) {
      return (
        <div style={firstRunShell}>
          <div style={firstRunCard}>
            <CharterStepHeader step={charterStep} eyebrow="Step 2 of 3 · Profile essentials" title="Make your profile useful to churches." body="Your approved business details are already in place. Add the few things churches need to understand what you do and whether you are a fit."/>
            <div style={{padding:"28px 34px 34px"}}>
              <div style={psx.field}>
                <label style={psx.label}>Marketplace tagline <span style={psx.labelHelper}>· required</span></label>
                <input value={vendorForm.tagline} onChange={e=>setV("tagline",e.target.value)} maxLength={100} placeholder="e.g. Audio and lighting for growing ministries" style={firstRunInput} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/>
                <div style={{fontSize:11,color:String(vendorForm.tagline||"").trim().length>=6?"#6f7b68":"#9c917f",marginTop:5}}>At least 6 characters · {String(vendorForm.tagline||"").length}/100</div>
              </div>
              <div style={psx.field}>
                <label style={psx.label}>About your business <span style={psx.labelHelper}>· required, 100+ characters</span></label>
                <textarea rows={5} value={vendorForm.bio} onChange={e=>setV("bio",e.target.value)} maxLength={500} placeholder="Tell churches what you do, who you serve, and what makes your work a strong fit for ministry teams." style={firstRunTextarea} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/>
                <div style={{fontSize:11,color:String(vendorForm.bio||"").trim().length>=100?"#6f7b68":"#9c917f",marginTop:5,textAlign:"right"}}>{String(vendorForm.bio||"").trim().length}/500</div>
              </div>
              <div style={psx.field}>
                <label style={psx.label}>Skills & specialties <span style={psx.labelHelper}>· at least one</span></label>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"10px 12px",borderRadius:12,border:"1.5px solid #dfd5c2",background:"#fff",minHeight:48,alignItems:"center"}}>
                  {(vendorForm.tags||[]).map(t=><div key={t} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 7px 5px 10px",borderRadius:999,background:"#fffaf0",border:"1px solid #e9d5a5",fontSize:12,color:"#1C2814",fontWeight:600}}>{t}<button type="button" aria-label={`Remove ${t}`} onClick={()=>removeTag(t)} style={{width:18,height:18,borderRadius:99,border:0,background:"rgba(176,136,64,.16)",cursor:"pointer"}}>×</button></div>)}
                  <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={addTag} placeholder={(vendorForm.tags||[]).length?"Add another…":"Type a skill and press Enter"} style={{flex:1,minWidth:170,border:0,outline:0,background:"transparent",padding:"6px 0",fontSize:13}}/>
                </div>
              </div>
              <button type="button" onClick={()=>setCharterOptionalOpen(v=>!v)} style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"1px solid #e2d8c5",background:"#fbf8f1",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,fontWeight:700,color:"#1C2814",cursor:"pointer",marginBottom:charterOptionalOpen?14:22}}>
                <span>Improve your matches <span style={{fontWeight:500,color:"#7d7363"}}>· optional</span></span><span>{charterOptionalOpen?"−":"+"}</span>
              </button>
              {charterOptionalOpen && <div style={{padding:"18px",border:"1px solid #e8dfcb",borderRadius:16,background:"#fffaf5",marginBottom:22}}>
                <div style={{display:"grid",gridTemplateColumns:charterCompact?"1fr":"1fr 1fr",gap:12}}>
                  <div><label style={psx.label}>Minimum project budget</label><input value={vendorForm.min_project_budget} onChange={e=>setV("min_project_budget",e.target.value.replace(/[^0-9]/g,""))} placeholder="e.g. 2500" style={firstRunInput}/></div>
                  <div><label style={psx.label}>Maximum project budget</label><input value={vendorForm.max_project_budget} onChange={e=>setV("max_project_budget",e.target.value.replace(/[^0-9]/g,""))} placeholder="e.g. 25000" style={firstRunInput}/></div>
                  <div style={{gridColumn:"1 / -1"}}><label style={psx.label}>Typical response time</label><input value={vendorForm.response_time} onChange={e=>setV("response_time",e.target.value)} maxLength={60} placeholder="e.g. Usually responds within 24 hours" style={firstRunInput}/></div>
                </div>
              </div>}
              {missingEssentials.length>0 && <div style={{padding:"12px 14px",borderRadius:12,background:"#fffaf0",border:"1px solid #e9d5a5",marginBottom:16}}><div style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:1.1,color:"#8a6a2e",marginBottom:6}}>Before you enter FaithBid</div>{missingEssentials.map(item=><div key={item} style={{fontSize:12.5,color:"#5a5246",lineHeight:1.6}}>• {item}</div>)}</div>}
              {charterCompletionError && <div role="alert" style={{padding:"11px 13px",borderRadius:10,background:"#fff0ee",color:"#9b2c22",fontSize:13,marginBottom:16}}>{charterCompletionError}</div>}
              <div style={{display:"flex",gap:10,alignItems:"center"}}><button type="button" onClick={()=>{setCharterCompletionError("");setCharterStep(1);}} style={{...psx.btnSecondary,minHeight:48,borderRadius:12}}>← Back</button><button type="button" disabled={!charterEssentialsReady||charterCompletionBusy||saving} onClick={completeCharterVendorFirstRun} style={{...psx.btnPrimary,flex:1,minHeight:50,borderRadius:12,opacity:(!charterEssentialsReady||charterCompletionBusy||saving)?0.55:1,cursor:(!charterEssentialsReady||charterCompletionBusy||saving)?"not-allowed":"pointer"}}>{charterCompletionBusy||saving?"Saving your profile…":"Save my Charter profile"}</button></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={firstRunShell}>
        <div style={firstRunCard}>
          <CharterStepHeader step={charterStep} eyebrow="Step 3 of 3 · Ready" title="Your Charter Vendor profile is ready." body="Your profile is saved, your Charter Vendor status is active, and your Marketplace Approval carried forward from the application FaithBid already reviewed."/>
          <div style={{padding:"32px 34px 36px"}}>
            <div style={{padding:"22px",borderRadius:18,background:"linear-gradient(135deg,#1C2814,#304329)",color:"#fffdf8",marginBottom:24,boxShadow:"0 16px 34px rgba(28,40,20,.18)"}}>
              <div style={{fontFamily:"var(--font-sans),monospace",fontSize:10,fontWeight:800,letterSpacing:2,textTransform:"uppercase",color:"#d9bd77",marginBottom:8}}>✦ Charter Vendor</div>
              <div style={{fontFamily:"var(--font-display),serif",fontSize:28,fontWeight:700,lineHeight:1.08,marginBottom:8}}>{vendorForm.name}</div>
              <div style={{fontSize:13.5,color:"rgba(255,253,248,.76)",lineHeight:1.6}}>{vendorForm.tagline} · {deliveryMeta.label}{vendorForm.city?` · ${vendorForm.city}, ${vendorForm.service_state}`:""}</div>
            </div>
            <button type="button" onClick={()=>nav("projects")} style={{...psx.btnPrimary,width:"100%",minHeight:52,borderRadius:12,marginBottom:10}}>Enter FaithBid</button>
            <div style={{display:"grid",gridTemplateColumns:charterCompact?"1fr":"1fr 1fr",gap:10}}>
              <button type="button" onClick={()=>exitCharterFirstRunToTab("portfolio")} style={{...psx.btnSecondary,minHeight:48,borderRadius:12}}>Add portfolio work</button>
              <button type="button" onClick={()=>exitCharterFirstRunToTab("verify")} style={{...psx.btnSecondary,minHeight:48,borderRadius:12}}>Get Faith Verified</button>
            </div>
            <div style={{fontSize:12,color:"#7d7363",lineHeight:1.65,textAlign:"center",marginTop:16}}>Portfolio work strengthens your profile. Faith Verification is an optional additional trust signal and is not required to enter FaithBid.</div>
          </div>
        </div>
      </div>
    );
  }

  const profileTabs = vendorRow
    ? [{id:"overview",label:"Overview"},{id:"vendor",label:"Public profile"},{id:"portfolio",label:"Portfolio"},{id:"verify",label:"Verification"},{id:"references",label:"References"},{id:"account",label:"Account"},{id:"stats",label:"Stats"},{id:"referrals",label:"✦ Referrals"}]
    : [{id:"overview",label:"Overview"},{id:"account",label:"Account"},{id:"verify",label:"Verification"},{id:"roster",label:"Trusted vendors"},{id:"stats",label:"Stats"},{id:"referrals",label:"✦ Referrals"}];

  const profileSubtitle = vendorRow
    ? (vendorRow.vendor_type==="company"?"Christian business":"Independent freelancer")
    : role==="individual"?"Community member":"Church / ministry";

  return (
    <div className="kb-profile-screen-root" style={psx.shell}>
      {/* Top bar */}
      <div style={psx.topbar}>
        <button type="button" onClick={()=>nav(profileReturnTarget?.screen || "projects")} style={psx.backPill} onMouseOver={e=>{e.currentTarget.style.background="#fffaf0";e.currentTarget.style.borderColor="#c9a45c";}} onMouseOut={e=>{e.currentTarget.style.background="#fffdf8";e.currentTarget.style.borderColor="#dfd5c2";}}>
          <span style={{fontSize:14,lineHeight:1}}>←</span> {(profileReturnTarget?.screen === "projects" && profileReturnTarget?.label === "Back to Marketplace") ? "Back to My Projects" : (profileReturnTarget?.label || "Back")}
        </button>
        <span style={{color:"#c8bfa9"}}>·</span>
        <span style={psx.crumb}>Profile</span>
      </div>

      {/* Cream headline section */}
      <div style={psx.headWrap}>
        <div style={psx.headPanel}>
          <div style={psx.headRow}>
            <div style={psx.avatar}>{initials}</div>
            <div style={{flex:1,minWidth:240}}>
              <div style={psx.eyebrow}>{vendorRow ? "Vendor profile" : "Member profile"}</div>
              <h1 style={psx.headline}>{userProfile?.org_name || form.org_name || <KBSkeleton variant="line" width="55%" height={28} style={{borderRadius:8,marginTop:4}} />}</h1>
              <div style={psx.sub}>{profileSubtitle}{form.city ? ` · ${form.city}${form.state_code ? `, ${form.state_code}` : ""}` : ""}</div>
              <div style={psx.badgeRow}>
                {isVerified && <span style={psx.badge("verified")}>FAITH VERIFIED</span>}
                {isPending && <span style={psx.badge("pending")}>PENDING REVIEW</span>}
                {vendorRow?.founding_vendor && <span style={psx.badge("charter")}>✦ CHARTER VENDOR</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={psx.tabsWrap}>
        {profileTabs.map(t=>(
          <button key={t.id} type="button" onClick={()=>setTab(t.id)} style={psx.tab(tab===t.id)}>
            {t.label}
            {t.id==="verify"&&!isVerified&&!isPending&&<span style={psx.tabDot}/>}
            {tab===t.id && <span style={psx.tabBar}/>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 28px 48px"}}>
        {loading ? (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <KBSkeleton variant="card" />
            <KBSkeleton variant="card" />
            <KBSkeleton variant="card" />
            <KBSkeleton variant="card" />
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {tab==="overview" && (
              <div className="profile-overview-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                {/* Profile completeness banner — brand cream + gold */}
                {(() => {
                  const firstFilled = (...values) => values.map(value => String(value ?? "").trim()).find(Boolean) || "";
                  const hasCityAndState = (cityValue, stateValue) => {
                    if (!firstFilled(cityValue)) return false;
                    if (firstFilled(stateValue)) return true;
                    // Older profiles stored the full location in `city`
                    // (for example "Houston, Texas") before state_code was
                    // captured separately. Treat that canonical display value
                    // as complete instead of asking the user for it again.
                    return String(cityValue).split(",").map(part => part.trim()).filter(Boolean).length >= 2;
                  };
                  const vendorCity = firstFilled(vendorForm.city, vendorRow?.service_city, vendorRow?.city, userProfile?.city, form.city);
                  const vendorState = firstFilled(vendorForm.service_state, vendorRow?.service_state, userProfile?.state_code, form.state_code);
                  const checks = vendorRow ? [
                    {label:"Business name",    done:!!firstFilled(vendorForm.name, vendorRow?.name, userProfile?.org_name), action:()=>setTab("vendor")},
                    {label:"City & state",     done:hasCityAndState(vendorCity, vendorState), action:()=>setTab("vendor")},
                    {label:"Service category", done:!!firstFilled(vendorForm.category, vendorRow?.category, userProfile?.category), action:()=>setTab("vendor")},
                    {label:"Bio written",      done:firstFilled(vendorForm.bio, vendorRow?.bio).length>30, action:()=>setTab("vendor")},
                    {label:"Tagline",          done:firstFilled(vendorForm.tagline, vendorRow?.tagline).length>5, action:()=>setTab("vendor")},
                    {label:"Budget range",     done:!!firstFilled(vendorForm.min_project_budget, vendorRow?.min_project_budget), action:()=>setTab("vendor")},
                    {label:"Faith statement",  done:!!firstFilled(vendorForm.faith_statement, vendorRow?.faith_statement, userProfile?.faith_statement), action:()=>setTab("vendor")},
                    {label:"Faith Verified",   done:isVerified,                       action:()=>setTab("verify")},
                  ] : [
                    {label:"Church name",      done:!!form.org_name,             action:()=>setTab("account")},
                    {label:"City & state",     done:hasCityAndState(form.city, form.state_code), action:()=>setTab("account")},
                    {label:"Denomination",     done:!!form.denomination,         action:()=>setTab("account")},
                    {label:"Faith statement",  done:!!form.faith_statement,      action:()=>setTab("account")},
                  ];
                  // Vendors read percentage, remaining count, and next step from the same canonical helper
                  // that My Work uses, so no second checklist can drift from the score.
                  const completion = vendorRow
                    ? calcVendorCompletion({ ...vendorRow, _hasPortfolio: (overviewStats.portfolioCount || 0) > 0 })
                    : null;
                  const pct = completion ? completion.pct : Math.round(checks.filter(c=>c.done).length / checks.length * 100);
                  const remainingCount = completion ? completion.remaining : checks.filter(c=>!c.done).length;
                  const next = completion
                    ? (completion.next ? { label: completion.next.label, action: () => setTab(completion.next.key === "portfolio" ? "portfolio" : "vendor") } : null)
                    : checks.find(c=>!c.done);
                  if (pct === 100) return null;
                  return (
                    <div style={{gridColumn:"1 / -1",background:"linear-gradient(135deg,#fffaf0,#f7ecd5)",border:"1px solid #e9d5a5",borderRadius:18,padding:"20px 22px",marginBottom:2,boxShadow:"0 6px 18px rgba(176,136,64,0.08)",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,bottom:0,width:4,background:"linear-gradient(180deg,#c9a45c,#b08840)"}}/>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:18,flexWrap:"wrap",paddingLeft:8}}>
                        <div style={{flex:1,minWidth:220}}>
                          <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:10}}>
                            <div style={{fontFamily:"var(--font-display),serif",fontSize:22,fontWeight:700,color:"#1C2814",letterSpacing:-0.4}}>{pct}% complete</div>
                            <div style={{fontSize:12,color:"#7a6c4f"}}>· {remainingCount} step{remainingCount!==1?"s":""} remaining</div>
                          </div>
                          <div style={{height:5,background:"rgba(176,136,64,0.18)",borderRadius:3,overflow:"hidden",marginBottom:10}}>
                            <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#c9a45c,#b08840)",borderRadius:3,transition:"width 0.6s ease"}}/>
                          </div>
                          {next && <div style={{fontSize:12.5,color:"#5a5246"}}>Next up: <strong style={{color:"#1C2814",fontWeight:700}}>{next.label}</strong></div>}
                        </div>
                        {next && <button type="button" onClick={next.action} style={psx.btnPrimary}>Complete profile →</button>}
                      </div>
                    </div>
                  );
                })()}

                {/* Left column */}
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {/* Verification card */}
                  {vendorRow && (
                    <div style={psx.panel}>
                      <div style={psx.panelHd}>
                        <div>
                          <div style={psx.panelEyebrow}>Verification</div>
                          <div style={psx.panelTitle}>Faith verification</div>
                        </div>
                        <button type="button" onClick={()=>setTab("verify")} style={{fontSize:12,color:"#b08840",fontWeight:700,background:"none",border:"none",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif"}}>Manage →</button>
                      </div>
                      <div style={psx.panelBody}>
                        {isVerified ? (
                          <div style={{display:"flex",alignItems:"center",gap:14}}>
                            <div style={{width:44,height:44,borderRadius:12,background:"#eef5e9",border:"1px solid #cfe1c4",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="#2f5a31" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                            <div><div style={{fontSize:14,fontWeight:700,color:"#1C2814",fontFamily:"var(--font-sans),sans-serif"}}>Faith Verified</div><div style={{fontSize:12,color:"#7d7363",marginTop:3}}>Badge live on your public profile</div></div>
                          </div>
                        ) : isPending ? (
                          <div style={{display:"flex",alignItems:"center",gap:14}}>
                            <div style={{width:44,height:44,borderRadius:12,background:"#fcf2dd",border:"1px solid #e9d5a5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a6a1f" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
                            <div><div style={{fontSize:14,fontWeight:700,color:"#1C2814",fontFamily:"var(--font-sans),sans-serif"}}>Under review</div><div style={{fontSize:12,color:"#7d7363",marginTop:3}}>We'll notify you within 48 hours</div></div>
                          </div>
                        ) : (
                          <div>
                            <div style={{fontSize:13,color:"#5a5246",marginBottom:14,lineHeight:1.55}}>Get your Faith Verified badge to build trust with churches.</div>
                            <button type="button" onClick={()=>setTab("verify")} style={psx.btnPrimary}>Apply now</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Profile info */}
                  <div style={psx.panel}>
                    <div style={psx.panelHd}>
                      <div>
                        <div style={psx.panelEyebrow}>Identity</div>
                        <div style={psx.panelTitle}>Profile info</div>
                      </div>
                      <button type="button" onClick={()=>setTab("account")} style={{fontSize:12,color:"#b08840",fontWeight:700,background:"none",border:"none",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif"}}>Edit →</button>
                    </div>
                    <div style={psx.panelBody}>
                      {[
                        {label:"Organization", val:form.org_name||"—"},
                        {label:"Location", val:form.city ? `${form.city}${form.state_code ? `, ${form.state_code}` : ""}` : "—"},
                        {label:vendorRow?"Category":"Denomination", val:(vendorRow?vendorForm.category:form.denomination)||"—"},
                        {label:"Member since", val:fullProfile?.created_at?new Date(fullProfile.created_at).toLocaleDateString("en-US",{month:"long",year:"numeric"}):"—"},
                      ].map((item,i,arr)=>(
                        <div key={item.label} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:i<arr.length-1?"1px solid #f0e9d9":"none",gap:12}}>
                          <span style={{fontSize:12.5,color:"#7d7363",fontFamily:"var(--font-sans),sans-serif"}}>{item.label}</span>
                          <span style={{fontSize:12.5,fontWeight:700,color:"#1C2814",textAlign:"right",fontFamily:"var(--font-sans),monospace"}}>{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  {/* Activity */}
                  <div style={psx.panel}>
                    <div style={psx.panelHd}>
                      <div>
                        <div style={psx.panelEyebrow}>Activity</div>
                        <div style={psx.panelTitle}>{vendorRow?"Vendor activity":"Account activity"}</div>
                      </div>
                      <button type="button" onClick={()=>setTab("stats")} style={{fontSize:12,color:"#b08840",fontWeight:700,background:"none",border:"none",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif"}}>Full stats →</button>
                    </div>
                    <div style={psx.panelBody}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                        {(vendorRow
                          ? [
                              {label:"Projects Won",   val: vendorRow.projects_count ?? 0},
                              {label:"Bids Submitted",  val: overviewStats.bids},
                              {label:"Avg rating",      val: vendorRow.rating ? Number(vendorRow.rating).toFixed(1)+"★" : "—"},
                              {label:"Reviews",         val: vendorRow.reviews_count ?? 0},
                            ]
                          : [
                              {label:"Projects Posted", val: overviewStats.projects},
                              {label:"Projects With Vendor", val: overviewStats.hired},
                              {label:"Deal Rooms",      val: overviewStats.messages},
                              {label:"Reviews Left",    val: overviewStats.reviews},
                            ]
                        ).map((s)=>(
                          <div key={s.label} style={{padding:"14px 14px",background:"#fffdf8",border:"1px solid #ece4d2",borderRadius:14,textAlign:"left",position:"relative",overflow:"hidden"}}>
                            <div style={{position:"absolute",top:0,left:0,bottom:0,width:3,background:"linear-gradient(180deg,#c9a45c,#b08840)"}}/>
                            <div style={{paddingLeft:8}}>
                              <div style={{fontFamily:"var(--font-display),serif",fontSize:24,fontWeight:700,color:"#1C2814",marginBottom:4,letterSpacing:-0.4,lineHeight:1}}>{s.val}</div>
                              <div style={{fontSize:9.5,color:"#7d7363",fontWeight:700,letterSpacing:0.6,textTransform:"uppercase",fontFamily:"var(--font-sans),monospace"}}>{s.label}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Faith statement card — gold-on-cream instead of dark clay */}
                  {(vendorForm.faith_statement||form.faith_statement) && (
                    <div style={{background:"linear-gradient(135deg,#fffdf8,#f9f1de)",border:"1px solid #e9d5a5",borderRadius:18,padding:"20px 22px",boxShadow:"0 6px 18px rgba(176,136,64,0.06)",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,bottom:0,width:3,background:"linear-gradient(180deg,#c9a45c,#b08840)"}}/>
                      <div style={{paddingLeft:8}}>
                        <div style={{fontFamily:"var(--font-sans),monospace",fontSize:9.5,fontWeight:700,letterSpacing:1.6,textTransform:"uppercase",color:"#b08840",marginBottom:10}}>Faith statement</div>
                        <div style={{fontFamily:"var(--font-display),serif",fontSize:14.5,color:"#1C2814",fontStyle:"italic",lineHeight:1.7,fontWeight:400}}>"{(vendorForm.faith_statement||form.faith_statement).slice(0,180)}{(vendorForm.faith_statement||form.faith_statement).length>180?"…":""}"</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ACCOUNT */}
            {tab==="account" && (
              <div style={{maxWidth:680,margin:"0 auto"}}>
                <div style={psx.panel}>
                  <div style={psx.panelHd}>
                    <div>
                      <div style={psx.panelEyebrow}>{vendorRow?"Business":"Church"} info</div>
                      <div style={psx.panelTitle}>{vendorRow?"Business information":"Church information"}</div>
                    </div>
                  </div>
                  <div style={psx.panelBody}>
                    <div style={psx.field}>
                      <label style={psx.label} htmlFor="ob-org-name">{vendorRow?"Business name":"Church / ministry name"}</label>
                      <input id="ob-org-name" aria-label={vendorRow?"Business name":"Church or ministry name"} value={form.org_name} onChange={e=>set("org_name",e.target.value)} placeholder={vendorRow?"Your business name":"Grace Fellowship Church"} style={psx.input} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/>
                    </div>
                    <div style={psx.field}>
                      <label style={psx.label}>{vendorRow ? "Business location" : "Church location"}{!vendorRow ? <span style={{color:'#b1342a',marginLeft:4}}>*</span> : null}</label>
                      <div style={{display:'grid',gridTemplateColumns:'minmax(0,2fr) minmax(92px,0.8fr)',gap:10}} className="profile-location-grid">
                        <input id="ob-city" aria-label={vendorRow ? "Business city" : "Church city"} value={form.city} onChange={e=>set("city",e.target.value)} placeholder="Dallas" autoComplete="address-level2" style={psx.input} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/>
                        <select aria-label={vendorRow ? "Business state" : "Church state"} value={form.state_code || ''} onChange={e=>set('state_code',e.target.value)} autoComplete="address-level1" style={{...psx.input,cursor:'pointer'}} onFocus={psx.inputFocus} onBlur={psx.inputBlur}>
                          <option value="">State…</option>
                          {KB_US_STATE_CODES.map(code => <option key={code} value={code}>{code}</option>)}
                        </select>
                      </div>
                      {!vendorRow && <div style={{fontSize:11,color:'#8b8171',marginTop:7,lineHeight:1.45}}>Used as the default location for local vendor matching and future project locations. Exact project location can still be changed per project.</div>}
                    </div>
                    <div style={psx.field}>
                      <label style={psx.label}>{vendorRow?"Service category":"Denomination"}</label>
                      {vendorRow
                        ? <select value={form.category} onChange={e=>set("category",e.target.value)} style={psx.input} onFocus={psx.inputFocus} onBlur={psx.inputBlur}><option value="">Select…</option>{CATEGORIES.map(c=><option key={c.label} value={c.label}>{c.label}</option>)}</select>
                        : <input aria-label="e.g. Non-denominational" value={form.denomination} onChange={e=>set("denomination",e.target.value)} placeholder="e.g. Non-denominational" style={psx.input} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/>}
                    </div>
                    {!vendorRow && (
                      <div style={psx.field}>
                        <label style={psx.label} htmlFor="ob-size">Congregation size<span style={psx.labelHelper}>· helps match vendors who serve churches like yours</span></label>
                        <select id="ob-size" value={form.congregation_size} onChange={e=>set("congregation_size",e.target.value)} style={psx.input} onFocus={psx.inputFocus} onBlur={psx.inputBlur}>
                          <option value="">Select…</option>
                          <option value="under_100">Under 100</option>
                          <option value="100_300">100 – 300</option>
                          <option value="300_1000">300 – 1,000</option>
                          <option value="over_1000">Over 1,000</option>
                        </select>
                      </div>
                    )}
                    <div style={{...psx.field,marginBottom:0}}>
                      <label style={psx.label} htmlFor="ob-faith">Faith statement</label>
                      <textarea id="ob-faith" rows={3} value={form.faith_statement} onChange={e=>set("faith_statement",e.target.value)} placeholder="How does your faith shape your work or ministry?" style={psx.textarea} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/>
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <button type="button" style={{...psx.btnPrimary,opacity:saving?0.6:1,cursor:saving?"wait":"pointer"}} onClick={saveProfile} disabled={saving}>{saving?"Saving…":"Save changes"}</button>
                  <button type="button" style={psx.btnSecondary} onClick={()=>nav("settings")}>Password & security</button>
                </div>
              </div>
            )}

            {/* VENDOR PUBLIC PROFILE */}
            {tab==="vendor" && (
              <div style={{maxWidth:720,margin:"0 auto"}}>
                {vendorRow && <VendorCompletionMeter vendorRow={vendorRow} portfolioCount={overviewStats.portfolioCount||0} showToast={showToast} nav={()=>setTab("portfolio")}/>}
                {/* Faith Verified status banner removed — badge appears on profile itself */}
                {!isVerified && !isPending && (
                  <button type="button" onClick={()=>setTab("verify")} style={{width:"100%",background:"linear-gradient(135deg,#fffaf0,#f7ecd5)",border:"1px solid #e9d5a5",borderRadius:18,padding:"18px 22px",marginBottom:18,cursor:"pointer",display:"flex",alignItems:"center",gap:16,textAlign:"left",boxShadow:"0 6px 18px rgba(176,136,64,0.06)",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,bottom:0,width:3,background:"linear-gradient(180deg,#c9a45c,#b08840)"}}/>
                    <div style={{flex:1,paddingLeft:6}}>
                      <div style={{fontFamily:"var(--font-sans),monospace",fontSize:9.5,fontWeight:700,letterSpacing:1.6,textTransform:"uppercase",color:"#b08840",marginBottom:5}}>Build trust</div>
                      <div style={{fontFamily:"var(--font-display),serif",fontSize:18,fontWeight:700,color:"#1C2814",marginBottom:4,letterSpacing:-0.3}}>Get Faith Verified</div>
                      <div style={{fontSize:12.5,color:"#5a5246",lineHeight:1.5}}>Shows churches your faith statement and ministry reference have been reviewed. Takes about 3 minutes.</div>
                    </div>
                    <div style={{...psx.btnPrimary,flexShrink:0,padding:"9px 18px"}}>Apply →</div>
                  </button>
                )}
                <div style={psx.panel}>
                  <div style={psx.panelHd}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={psx.panelIco}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1"/></svg></span>
                      <div>
                        <div style={psx.panelEyebrow}>Public listing</div>
                        <div style={psx.panelTitle}>Business identity</div>
                      </div>
                    </div>
                  </div>
                  <div style={psx.panelBody}>
                    <div style={psx.field}>
                      <label style={psx.label} htmlFor="vf-name">Display name</label>
                      <input id="vf-name" value={vendorForm.name} onChange={e=>setV("name",e.target.value)} placeholder="Your business display name" style={psx.input} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/>
                    </div>
                    <div style={psx.field}>
                      <label style={psx.label} htmlFor="vf-category">Service category</label>
                      <select id="vf-category" value={vendorForm.category} onChange={e=>setV("category",e.target.value)} style={psx.input} onFocus={psx.inputFocus} onBlur={psx.inputBlur}><option value="">Select…</option>{CATEGORIES.map(c=><option key={c.label} value={c.label}>{c.label}</option>)}</select>
                    </div>
                    <div style={psx.field}>
                      <label style={psx.label}>How do you work with churches?</label>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:10}}>
                        {['onsite','remote','both'].map(key=>{
                          const active = normalizeDeliveryModel(vendorForm.delivery_model)===key;
                          const meta=getDeliveryModelMeta(key);
                          return (
                            <button key={key} type="button" onClick={()=>setV('delivery_model', key)} style={{minHeight:46,padding:'10px 12px',borderRadius:12,border:`1.5px solid ${active ? '#b08840' : '#dfd5c2'}`,background:active?'#fffaf0':'#fffdf8',fontSize:12.5,fontWeight:700,color:active?'#b08840':'#1C2814',cursor:'pointer',fontFamily:"var(--font-sans),sans-serif",transition:"all 0.15s",boxShadow:active?"0 0 0 3px rgba(176,136,64,0.12)":"none"}}>{meta.label}</button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={psx.panel}>
                  <div style={psx.panelHd}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={psx.panelIco}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 4 6 4 9s-1.5 6.4-4 9c-2.5-2.6-4-6-4-9s1.5-6.4 4-9Z"/></svg></span>
                      <div>
                        <div style={psx.panelEyebrow}>Where you work</div>
                        <div style={psx.panelTitle}>Service area</div>
                      </div>
                    </div>
                  </div>
                  <div style={psx.panelBody}>
                    <div style={psx.field}>
                      <label style={psx.label}>{normalizeDeliveryModel(vendorForm.delivery_model)==='remote' ? 'Business base (optional)' : 'Center of your on-site service area'}</label>
                      <div style={{display:'grid',gridTemplateColumns:'minmax(0,2fr) minmax(92px,0.8fr)',gap:10}} className="profile-location-grid">
                        <input aria-label="Business base city" value={vendorForm.city} onChange={e=>setV("city",e.target.value)} placeholder="Dallas" autoComplete="address-level2" style={psx.input} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/>
                        <select aria-label="Business base state" value={vendorForm.service_state || ''} onChange={e=>setV('service_state',e.target.value)} autoComplete="address-level1" style={{...psx.input,cursor:'pointer'}} onFocus={psx.inputFocus} onBlur={psx.inputBlur}>
                          <option value="">State…</option>
                          {KB_US_STATE_CODES.map(code => <option key={code} value={code}>{code}</option>)}
                        </select>
                      </div>
                    </div>
                    {normalizeDeliveryModel(vendorForm.delivery_model) !== 'remote' && (
                      <div style={{...psx.field,marginBottom:0}}>
                        <label style={psx.label}>Service radius (miles)</label>
                        <input aria-label="50" value={vendorForm.service_radius_miles || ''} onChange={e=>setV('service_radius_miles', e.target.value.replace(/[^0-9]/g,''))} placeholder="50" style={psx.input} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/>
                      </div>
                    )}
                  </div>
                </div>

                <div style={psx.panel}>
                  <div style={psx.panelHd}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={psx.panelIco}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 3a2.83 2.83 0 0 1 4 4L7 21l-4 1 1-4Z"/></svg></span>
                      <div>
                        <div style={psx.panelEyebrow}>Tell your story</div>
                        <div style={psx.panelTitle}>About</div>
                      </div>
                    </div>
                  </div>
                  <div style={psx.panelBody}>
                    <div style={psx.field}>
                      <label style={psx.label} htmlFor="vf-tagline">Tagline<span style={psx.labelHelper}>· one line shown on your marketplace card</span></label>
                      <input id="vf-tagline" value={vendorForm.tagline} onChange={e=>setV("tagline", e.target.value)} maxLength={100} placeholder="e.g. Audio and lighting for growing ministries" style={psx.input} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/>
                    </div>
                    <div style={psx.field}>
                      <label style={psx.label} htmlFor="vf-bio">Bio<span style={psx.labelHelper}>· public profile</span></label>
                      <textarea id="vf-bio" rows={4} value={vendorForm.bio} onChange={e=>setV("bio",e.target.value)} maxLength={500} placeholder="Describe your services and how you serve ministries…" style={psx.textarea} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/>
                      <div style={{fontSize:11,color:"#9c917f",marginTop:4,textAlign:"right",fontFamily:"var(--font-sans),monospace"}}>{vendorForm.bio.length}/500</div>
                    </div>
                    <div style={psx.field}>
                      <label style={psx.label}>Project budget range<span style={psx.labelHelper}>· helps churches know if you're the right fit</span></label>
                      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
                        <input aria-label="Minimum project budget" value={vendorForm.min_project_budget} onChange={e=>setV("min_project_budget", e.target.value.replace(/[^0-9]/g,""))} placeholder="Min (e.g. 5000)" style={psx.input} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/>
                        <input aria-label="Maximum project budget" value={vendorForm.max_project_budget} onChange={e=>setV("max_project_budget", e.target.value.replace(/[^0-9]/g,""))} placeholder="Max (e.g. 50000)" style={psx.input} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/>
                      </div>
                    </div>
                    <div style={psx.field}>
                      <label style={psx.label} htmlFor="vf-response">Typical response time<span style={psx.labelHelper}>· shown to churches on your profile</span></label>
                      <input id="vf-response" value={vendorForm.response_time} onChange={e=>setV("response_time", e.target.value)} maxLength={60} placeholder="e.g. Usually responds within 24 hours" style={psx.input} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/>
                    </div>
                    <div style={{...psx.field,marginBottom:0}}>
                      <label style={psx.label} htmlFor="vf-faith">Faith statement<span style={psx.labelHelper}>· public</span></label>
                      <textarea id="vf-faith" rows={3} value={vendorForm.faith_statement} onChange={e=>setV("faith_statement",e.target.value)} maxLength={300} placeholder="How does your faith shape your work?" style={psx.textarea} onFocus={psx.inputFocus} onBlur={psx.inputBlur}/>
                      <div style={{fontSize:11,color:"#9c917f",marginTop:4,textAlign:"right",fontFamily:"var(--font-sans),monospace"}}>{vendorForm.faith_statement.length}/300</div>
                    </div>
                  </div>
                </div>

                <div id="profile-specialties-panel" style={{...psx.panel,scrollMarginTop:80}}>
                  <div style={psx.panelHd}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={psx.panelIco}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m20.6 11.1-8.5-8.5H3v9.1l8.5 8.5a2 2 0 0 0 2.8 0l6.3-6.3a2 2 0 0 0 0-2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg></span>
                      <div>
                        <div style={psx.panelEyebrow}>Get matched right</div>
                        <div style={psx.panelTitle}>Specialties</div>
                      </div>
                    </div>
                  </div>
                  <div style={psx.panelBody}>
                    <div style={{...psx.field,marginBottom:0}}>
                      <label style={psx.label} htmlFor="vf-tags">Skills / tags<span style={psx.labelHelper}>· press Enter to add</span></label>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"10px 12px",borderRadius:12,border:"1.5px solid #dfd5c2",background:"#fffdf8",minHeight:46,alignItems:"center"}}>
                        {(vendorForm.tags||[]).map(t=>(
                          <div key={t} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 6px 4px 10px",borderRadius:999,background:"#fffaf0",border:"1px solid #e9d5a5",fontSize:12,color:"#1C2814",fontWeight:600,fontFamily:"var(--font-sans),sans-serif"}}>
                            {t}
                            <button type="button" aria-label={`Remove tag ${t}`} onClick={()=>removeTag(t)} style={{width:18,height:18,borderRadius:"50%",background:"rgba(176,136,64,0.18)",color:"#7a5a25",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>×</button>
                          </div>
                        ))}
                        <input aria-label="Add a skill or tag, press Enter to confirm" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={addTag} placeholder={(vendorForm.tags||[]).length?"":"e.g. Audio engineering, Live sound…"} style={{flex:1,minWidth:120,border:"none",outline:"none",background:"transparent",fontSize:13,color:"#1C2814",fontFamily:"var(--font-sans),sans-serif",padding:"4px 0"}}/>
                      </div>
                    </div>
                  </div>
                </div>
                {vendorRow?.id && <VendorBusinessDetailsPanel vendorRow={vendorRow} currentUser={currentUser} showToast={showToast} onSaved={(patch)=>setVendorRow(row=>row?{...row,...patch}:row)}/>}
                {vendorRow?.id && <VendorCredentialsPanel vendorRow={vendorRow} currentUser={currentUser} showToast={showToast}/>}
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <button type="button" style={{...psx.btnPrimary,opacity:saving?0.6:1,cursor:saving?"wait":"pointer"}} onClick={saveVendorProfile} disabled={saving}>{saving?"Saving…":"Save profile"}</button>
                  <button type="button" style={psx.btnSecondary} onClick={()=>queueVendorNavigation(nav, buildVendorProfilePreviewSeed(vendorRow, vendorForm, currentUser))}>View in directory →</button>
                </div>
              </div>
            )}

            {/* PORTFOLIO */}
            {tab==="portfolio" && vendorRow && (
              <div style={{maxWidth:820,margin:"0 auto"}}>
                <VendorPortfolioEditor currentUser={currentUser} showToast={showToast} onCountChange={(count)=>setOverviewStats(stats=>({...stats,portfolioCount:Number(count)||0}))}/>
              </div>
            )}

            {/* VERIFICATION */}
            {tab==="verify" && (
              <div style={{maxWidth:760,margin:"0 auto"}}>
                <div style={psx.panel}>
                  <div style={psx.panelHd}>
                    <div>
                      <div style={psx.panelEyebrow}>Trust</div>
                      <div style={psx.panelTitle}>Faith verification</div>
                    </div>
                    {isVerified && (
                      <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:999,background:"#eef5e9",border:"1px solid #cfe1c4",flexShrink:0}}>
                        <svg width="11" height="11" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="#2f5a31" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span style={{fontSize:11,fontWeight:800,color:"#2f5a31",letterSpacing:0.4,fontFamily:"var(--font-sans),monospace"}}>FAITH VERIFIED</span>
                      </div>
                    )}
                  </div>
                  <div style={psx.panelBody}>
                    <div style={{fontSize:13.5,color:"#5a5246",lineHeight:1.6,marginBottom:18}}>Build trust with churches. Submit your faith statement and ministry reference for review — we'll respond within 48 hours.</div>
                    <VendorVerificationFlow currentUser={currentUser} vendorRow={vendorRow} applicationStatus={verificationApplicationStatus} showToast={showToast} onVerified={()=>setVerificationApplicationStatus("pending")}/>
                  </div>
                </div>
              </div>
            )}

            {/* TRUSTED VENDORS */}
            {tab==="roster" && <TrustedVendorRoster currentUser={currentUser} nav={nav} showToast={showToast}/>}

            {/* STATS */}
            {tab==="stats" && <ProfileStats currentUser={currentUser} role={vendorRow?"vendor":role} showToast={showToast} nav={nav}/>}
            {tab==="referrals" && <ReferralDashboard currentUser={currentUser} showToast={showToast}/>}
            {tab==="references" && vendorRow && <VendorReferencesTab currentUser={currentUser} vendorProfile={vendorRow} showToast={showToast} />}
          </>
        )}
      </div>
    </div>
  );
}

export default function ProfileScreenRoute({ dependencies, ...props }) {
  applyProfileScreenDependencies(dependencies);
  return <ProfileScreen {...props} />;
}
