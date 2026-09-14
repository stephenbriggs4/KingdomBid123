import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";
import KBWorkspaceEmptyState from "./KBWorkspaceEmptyState";

let HIGHLIGHT_TAGS, KB_NAV_SCREENS, KB_REVIEW_FILTER_OPTIONS, KB_REVIEW_SORT_OPTIONS, KB_WORKSPACE_CLAY_BACKGROUND, STAR_LABELS, activateOnKey, clearPendingReviewTarget, filterAndSortReviewRecords, getCurrentUserSafe, getPendingReviewTarget, getReturnNavigationTarget, getReviewDashboardStats, getReviewFooterChips, getReviewResultSummary, getReviewSidebarGuidance, getReviewStrongestSignal, logError, queueProjectNavigation, readReturnContext, runSupabaseWithFallback, starFill;

function applyReviewsScreenDependencies(values = {}) {
  ({ HIGHLIGHT_TAGS, KB_NAV_SCREENS, KB_REVIEW_FILTER_OPTIONS, KB_REVIEW_SORT_OPTIONS, KB_WORKSPACE_CLAY_BACKGROUND, STAR_LABELS, activateOnKey, clearPendingReviewTarget, filterAndSortReviewRecords, getCurrentUserSafe, getPendingReviewTarget, getReturnNavigationTarget, getReviewDashboardStats, getReviewFooterChips, getReviewResultSummary, getReviewSidebarGuidance, getReviewStrongestSignal, logError, queueProjectNavigation, readReturnContext, runSupabaseWithFallback, starFill } = values || {});
}

function ReviewsScreen({role, showToast, nav}){
  const [view, setView] = useState("dashboard");
  const [reviews, setReviews] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentVendorId, setCurrentVendorId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    getCurrentUserSafe().then(user => {
      if (!mounted) return;
      const uid = user?.id;
      setCurrentUserId(uid);
      if (uid) fetchReviews(uid, controller.signal);
    });
    const pendingTarget = getPendingReviewTarget();
    if (pendingTarget?.vendor_id) {
      clearPendingReviewTarget();
      setSelectedVendor(pendingTarget);
      setView("write");
    }
    const handler = (e) => {
      const v = e.detail;
      if (v && v.vendor_id) {
        setSelectedVendor(v);
        setView("write");
      } else {
        setView("pending");
      }
    };
    document.addEventListener("kb:open-review", handler);
    return () => { mounted = false; controller.abort(); document.removeEventListener("kb:open-review", handler); };
  }, []);

  const fetchReviews = async (uid, signal) => {
    setLoading(true);
    try {
      if (role === "vendor") {
        const { data: vendorRow } = await supabase.from("vendors").select("id").eq("user_id", uid).maybeSingle();
        if (signal?.aborted) return;
        setCurrentVendorId(vendorRow?.id || null);
        if (vendorRow?.id) {
          const { data } = await supabase
            .from("reviews")
            .select("id,vendor_id,church_id,author,church_name,city,rating,body,title,created_at,project_title,vendor_reply,helpful_count,recommend,verified,featured,tags,sub_ratings")
            .eq("vendor_id", vendorRow.id)
            .order("created_at", { ascending: false })
            .limit(50);
          if (signal?.aborted) return;
          setReviews((data || []).map(mapReview));
        }
      } else {
        setCurrentVendorId(null);
        const { data } = await supabase
          .from("reviews")
          .select("id,vendor_id,church_id,author,church_name,city,rating,body,title,created_at,project_title,vendor_reply,helpful_count,recommend,verified,featured,tags,sub_ratings")
          .eq("church_id", uid)
          .order("created_at", { ascending: false })
          .limit(50);
        if (signal?.aborted) return;
        setReviews((data || []).map(mapReview));

        const { data: hiredBids } = await runSupabaseWithFallback(
          () => supabase.from("bids").select("id,vendor_id,vendor_name,vendor_emoji,created_at,projects(id,title,status,completed_at,hired_vendor_id)").eq("status", "hired").eq("church_id", uid).limit(100),
          () => supabase.from("bids").select("id,project_id,vendor_id,vendor_name,created_at").eq("status", "hired").eq("church_id", uid).limit(100)
        );
        if (signal?.aborted) return;
        if (hiredBids) {
          const pendingList = [];
          const vendorIds = [...new Set(hiredBids.map(b => b.vendor_id).filter(Boolean))];
          if (vendorIds.length) {
            const { data: existingReviews } = await supabase
              .from("reviews")
              .select("id,vendor_id,project_id")
              .eq("church_id", uid)
              .in("vendor_id", vendorIds);
            if (!signal?.aborted) {
              const reviewedProjectIds = new Set((existingReviews || []).map(r => r.project_id).filter(Boolean));
              for (const b of hiredBids) {
                const project = b.projects;
                if (!project?.id || String(project.status || "").toLowerCase() !== "completed" || !project.completed_at) continue;
                if (String(project.hired_vendor_id || "") !== String(b.vendor_id || "")) continue;
                if (reviewedProjectIds.has(project.id)) continue;
                pendingList.push({
                  id: b.id,
                  name: b.vendor_name || "Vendor",
                  emoji: b.vendor_emoji || "",
                  project: b.projects?.title || "Project",
                  completed: new Date(b.created_at).toLocaleDateString(),
                  vendor_id: b.vendor_id,
                  project_id: b.projects?.id,
                });
              }
            }
          }
          setPending(pendingList);
        }
      }
    } catch (e) {
      if (!signal?.aborted) logError("reviews-fetch", e);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const mapReview = (r) => ({
    id: r.id,
    vendor_id: r.vendor_id || null,
    project_id: r.project_id || null,
    author: r.church_name || "Church",
    avatar: (r.church_name || "C").slice(0,1).toUpperCase(),
    city: r.city || "",
    rating: r.rating || 5,
    body: r.body || "",
    title: r.title || "",
    date: r.created_at ? new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
    project: r.project_title || "",
    reply: r.vendor_reply || null,
    helpful: r.helpful_count || 0,
    recommend: r.recommend ?? true,
    verified: r.verified ?? true,
    featured: r.featured ?? false,
    tags: r.tags || [],
    cats: r.sub_ratings ? Object.entries(r.sub_ratings).map(([label, stars]) => ({ label, stars })) : [],
  });

  const handleReply = async (reviewId, text) => {
    if (role !== "vendor" || !currentVendorId) {
      showToast && showToast("Only the reviewed vendor can respond.", "error");
      throw new Error("not-vendor");
    }
    const clean = String(text || "").trim().slice(0, 1200);
    if (!clean) {
      showToast && showToast("Add a response before publishing.", "error");
      throw new Error("empty-reply");
    }
    const { error } = await supabase.from("reviews").update({ vendor_reply: clean }).eq("id", reviewId).eq("vendor_id", currentVendorId);
    if (error) {
      logError("review-reply-save", error, { reviewId, vendorId: currentVendorId });
      showToast && showToast("Couldn't publish this response — please try again.", "error");
      throw error; // keep reply box open with text preserved
    }
    setReviews(rs => rs.map(r => r.id === reviewId ? { ...r, reply: clean } : r));
    showToast("✓ Response published");
  };

  const helpfulInFlight = React.useRef(new Set());
  const handleHelpful = async (reviewId) => {
    if (helpfulInFlight.current.has(reviewId)) return;
    const rev = reviews.find(r => r.id === reviewId);
    if (!rev) return;
    helpfulInFlight.current.add(reviewId);
    // Optimistic update first so the UI feels instant
    setReviews(rs => rs.map(r => r.id === reviewId ? { ...r, helpful: (r.helpful || 0) + 1 } : r));
    try {
      const { data, error } = await supabase.rpc("kb_mark_review_helpful", { p_review_id: reviewId });
      if (error) throw error;
      const helpfulCount = Number(data?.helpful_count);
      if (Number.isFinite(helpfulCount)) {
        setReviews(rs => rs.map(r => r.id === reviewId ? { ...r, helpful: helpfulCount } : r));
      }
      showToast(data?.marked === false ? "Already marked helpful" : "Marked helpful");
    } catch (err) {
      logError("review-helpful", err, { reviewId });
      // Roll back optimistic update on failure
      setReviews(rs => rs.map(r => r.id === reviewId ? { ...r, helpful: Math.max(0, (r.helpful || 1) - 1) } : r));
      showToast("Couldn't mark this review helpful — please try again.", "error");
    } finally {
      helpfulInFlight.current.delete(reviewId);
    }
  };

  const reviewsReturnTarget = getReturnNavigationTarget(readReturnContext(), "projects");
  const beginReviewFlow = () => {
    if (pending.length === 1) {
      setSelectedVendor(pending[0]);
      setView("write");
      return;
    }
    if (pending.length > 1) {
      setView("pending");
      return;
    }
    showToast("No completed vendors are ready for review yet.");
  };

  const openReviewProject = (item) => {
    if (!item?.project_id) {
      nav('projects');
      return;
    }
    queueProjectNavigation(nav, { projectId:item.project_id, screen:KB_NAV_SCREENS.projects, tab:'overview', returnContext:{ scope:'reviews', projectId:item.project_id, vendorId:item.vendor_id || null, tab:'overview' } });
  };

  const handleSubmitReview = async (reviewData) => {
    if (reviewSubmitting) return; // double-submit guard
    if (!currentUserId) { showToast("Please sign in to submit a review.", "error"); return; }
    if (!selectedVendor) { showToast("Choose a vendor to review.", "error"); return; }

    // Defensive validation: form gates these, but a stale form state or
    // direct call from devtools could push bad values through.
    const rating = Number(reviewData?.rating);
    const body = String(reviewData?.body || "").trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      showToast("Please select a rating between 1 and 5 stars.", "error");
      return;
    }
    if (body.length < 30 || body.length > 5000) {
      showToast("Reviews need to be at least 30 characters and under 5000.", "error");
      return;
    }

    setReviewSubmitting(true);
    try {
      if (!selectedVendor?.project_id) {
        showToast("A completed FaithBid project is required before you can leave a review.", "error");
        return;
      }

      // The server derives the church, vendor, project labels, verification,
      // and hire evidence. Clients cannot manufacture review eligibility.
      const { error } = await supabase.rpc("marketplace_service_submit_review", {
        p_project_id: selectedVendor.project_id,
        p_rating: rating,
        p_body: body,
        p_title: String(reviewData?.title || "").slice(0, 120) || null,
        p_recommend: !!reviewData?.recommend,
        p_sub_ratings: reviewData?.subRatings && typeof reviewData.subRatings === "object" ? reviewData.subRatings : {},
        p_tags: Array.isArray(reviewData?.tags) ? reviewData.tags : [],
      });
      if (!error) {
        showToast("✓ Review published");
        setView("dashboard");
        fetchReviews(currentUserId, new AbortController().signal);
      } else if (error.code === "23505") {
        showToast("You've already reviewed this vendor for this project.", "error");
      } else if (error.code === "23514" || error.code === "42501") {
        showToast("Reviews unlock after the hired vendor requests completion and your church confirms it.", "error");
      } else {
        logError("review-insert", error, { vendorId: selectedVendor.vendor_id });
        showToast("Couldn't submit review — please try again.", "error");
      }
    } catch (err) {
      logError("review-submit-unexpected", err, { vendorId: selectedVendor?.vendor_id });
      showToast("Something went wrong — please try again.", "error");
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (view === "pending") return <PendingReviews pending={pending} role={role} onSelect={(v) => { setSelectedVendor(v); setView("write"); }} onBack={() => setView("dashboard")} onOpenProject={openReviewProject} />;
  if (view === "write") return <WriteReview vendor={selectedVendor} onBack={() => setView(pending.length > 0 ? "pending" : "dashboard")} onSubmit={handleSubmitReview} submitting={reviewSubmitting} onOpenProject={openReviewProject} />;

  const reviewStats = getReviewDashboardStats(reviews, { pendingCount: pending.length, role });
  const reviewGuidance = getReviewSidebarGuidance(role, reviewStats);

  const introTitle = role === "vendor" ? "A calm, credible record of delivered work." : "A clear record of who you would confidently hire again.";
  const introCopy = role === "vendor"
    ? "This tab should feel like earned reputation, not a dashboard. Strong work, thoughtful feedback, and visible follow-through should do the selling for you."
    : "Use reviews to leave honest proof after a completed project so the next church can hire with more confidence and less guesswork.";

  // Brand tokens for this screen
  const rsx = {
    shell:{backgroundColor:"#f6efe4",backgroundImage:KB_WORKSPACE_CLAY_BACKGROUND,backgroundSize:"cover",backgroundPosition:"center top",backgroundRepeat:"no-repeat",backgroundAttachment:"fixed",minHeight:"100vh",paddingBottom:60},
    topbar:{maxWidth:1240,margin:"0 auto",padding:"22px 28px 0",display:"flex",alignItems:"center",gap:12},
    backPill:{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px 7px 11px",borderRadius:999,background:"#fffdf8",border:"1px solid #dfd5c2",color:"#1C2814",fontSize:12.5,fontWeight:600,fontFamily:"var(--font-sans),sans-serif",cursor:"pointer",transition:"all 0.15s",boxShadow:"0 4px 12px rgba(28,40,20,0.04)"},
    crumb:{fontSize:11.5,color:"#7d7363",fontFamily:"var(--font-sans),monospace",letterSpacing:0.6,textTransform:"uppercase",fontWeight:600},
    btnPrimary:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"11px 22px",borderRadius:999,background:"linear-gradient(180deg,#c9a45c,#b08840)",color:"#fff",fontSize:13,fontWeight:700,border:"none",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif",letterSpacing:0.2,boxShadow:"0 4px 12px rgba(176,136,64,0.25),inset 0 1px 0 rgba(255,255,255,0.18)",transition:"all 0.15s"},
    btnSecondary:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 20px",borderRadius:999,background:"#fffdf8",color:"#1C2814",fontSize:13,fontWeight:600,border:"1px solid #dfd5c2",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif",transition:"all 0.15s"},
  };
  return (
    <div className="kb-reviews-screen-root" style={rsx.shell}>
      {/* Top bar */}
      <div style={rsx.topbar}>
        <button type="button" onClick={()=>nav(reviewsReturnTarget?.screen || "projects")} style={rsx.backPill} onMouseOver={e=>{e.currentTarget.style.background="#fffaf0";e.currentTarget.style.borderColor="#c9a45c";}} onMouseOut={e=>{e.currentTarget.style.background="#fffdf8";e.currentTarget.style.borderColor="#dfd5c2";}}>
          <span style={{fontSize:14,lineHeight:1}}>←</span> {reviewsReturnTarget?.label || "Back"}
        </button>
        <span style={{color:"#c8bfa9"}}>·</span>
        <span style={rsx.crumb}>Reviews</span>
      </div>

      {/* Hero — cream panel with stats strip + headline + sidebar */}
      <div style={{maxWidth:1240,margin:"0 auto",padding:"22px 28px 22px"}}>
        <div className="reviews-page-hero" style={{ background:"#fffdf8", borderRadius:22, border:"1px solid #dfd5c2", boxShadow:"0 7px 20px rgba(28,40,20,0.045)", padding:"26px 28px 22px" }}>
          {/* Stats strip */}
          <div className="reviews-stats-strip" style={{display:"flex",gap:0,marginBottom:22,border:"1px solid #ece4d2",borderRadius:16,overflow:"hidden",background:"#fff"}}>
            {reviewStats.heroStrip.map((item,i)=>(
              <div key={item.label} style={{flex:1,padding:"16px 18px",borderRight:i<3?"1px solid #ece4d2":"none"}}>
                <div style={{fontFamily:"var(--font-display),serif",fontSize:28,color:"#1C2814",letterSpacing:-0.7,marginBottom:5,lineHeight:1,fontWeight:700}}>{item.value}</div>
                <div style={{fontFamily:"var(--font-sans),monospace",fontSize:9.5,fontWeight:700,letterSpacing:1.6,textTransform:"uppercase",color:"#b08840",marginBottom:5}}>{item.label}</div>
                <div style={{fontSize:11.5,color:"#7d7363",lineHeight:1.5}}>{item.sub}</div>
              </div>
            ))}
          </div>
          {/* Headline + sidebar */}
          <div className="reviews-page-hero-grid" style={{ display:"grid", gridTemplateColumns:"minmax(0,1.25fr) 320px", gap:22, alignItems:"stretch" }}>
            <div>
              <div style={{ fontFamily:"var(--font-sans),monospace", fontSize:10.5, fontWeight:700, letterSpacing:2.4, textTransform:"uppercase", color:"#b08840", marginBottom:10 }}>Reputation</div>
              <div style={{ fontFamily:"var(--font-display),serif", fontSize:38, lineHeight:1.05, color:"#1C2814", letterSpacing:-0.9, marginBottom:12, fontWeight:700 }}>{introTitle}</div>
              <div style={{ fontSize:14.5, lineHeight:1.7, color:"#5a5246", maxWidth:680, marginBottom:18 }}>{introCopy}</div>

              <div className="reviews-page-hero-stats" style={{ display:"grid", gridTemplateColumns:"minmax(220px,360px)", gap:12 }}>
                <div style={{ background:"#fffaf0", border:"1px solid #e9d5a5", borderRadius:18, padding:"18px 18px 16px", position:"relative", overflow:"hidden" }}>
                  <div style={{position:"absolute",top:0,left:0,bottom:0,width:3,background:"linear-gradient(180deg,#c9a45c,#b08840)"}}/>
                  <div style={{paddingLeft:8}}>
                    <div style={{ fontFamily:"var(--font-sans),monospace", fontSize:9.5, fontWeight:700, letterSpacing:1.6, textTransform:"uppercase", color:"#b08840", marginBottom:8 }}>Overall rating</div>
                    <div style={{ display:"flex", alignItems:"flex-end", gap:10, marginBottom:8 }}>
                      <div style={{ fontFamily:"var(--font-display),serif", fontSize:38, lineHeight:1, color:"#1C2814", letterSpacing:-1, fontWeight:700 }}>{reviews.length ? reviewStats.avgRatingNum.toFixed(1) : "—"}</div>
                      <div style={{ fontSize:12, color:"#7d7363", paddingBottom:6 }}>{reviews.length ? `${reviews.length} total` : "No ratings yet"}</div>
                    </div>
                    <div style={{ fontSize:18, color:"#b08840", letterSpacing:1 }}>{starFill(Math.round(reviewStats.avgRatingNum || 0))}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar — next step / reputation note */}
            <div style={{ background:"linear-gradient(135deg,#fffaf0,#f7ecd5)", border:"1px solid #e9d5a5", borderRadius:18, padding:"20px 22px", display:"flex", flexDirection:"column", justifyContent:"space-between", gap:16, position:"relative", overflow:"hidden", boxShadow:"0 6px 18px rgba(176,136,64,0.06)" }}>
              <div style={{position:"absolute",top:0,left:0,bottom:0,width:3,background:"linear-gradient(180deg,#c9a45c,#b08840)"}}/>
              <div style={{paddingLeft:6}}>
                <div style={{ fontFamily:"var(--font-sans),monospace", fontSize:9.5, fontWeight:700, letterSpacing:1.6, textTransform:"uppercase", color:"#b08840", marginBottom:10 }}>{role === "church" ? "Next review step" : "Reputation note"}</div>
                <div style={{ fontFamily:"var(--font-display),serif", fontSize:22, lineHeight:1.15, color:"#1C2814", letterSpacing:-0.4, marginBottom:10, fontWeight:700 }}>
                  {role === "church" ? (pending.length ? `You still have ${pending.length} ${pending.length === 1 ? "review" : "reviews"} waiting.` : "Your review record is up to date.") : "Keep this page disciplined and proof-first."}
                </div>
                <div style={{ fontSize:13, lineHeight:1.65, color:"#5a5246" }}>
                  {role === "church"
                    ? "The best review tabs feel editorial and trustworthy. Use this space to leave concise, specific feedback after real work is complete."
                    : "A vendor reputation page should feel quiet, credible, and easy to scan. Let completed projects and thoughtful responses carry the weight."}
                </div>
              </div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", paddingLeft:6 }}>
                {role === "church" && pending.length > 0 && <button type="button" style={rsx.btnPrimary} onClick={() => setView("pending")}>Review pending work →</button>}
                {role === "church" && <button type="button" style={rsx.btnSecondary} onClick={beginReviewFlow}>{pending.length ? "Choose a vendor" : "Write a review"}</button>}
                {role === "vendor" && <span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:999,background:"#fff",border:"1px solid #e9d5a5",fontSize:11.5,fontWeight:700,color:"#b08840",fontFamily:"var(--font-sans),monospace",letterSpacing:0.4}}>Responses on record · {reviews.filter(r => r.reply).length}</span>}
              </div>
            </div>
          </div>
        </div>

        <ReviewsDashboard
          reviews={reviews}
          loading={loading}
          role={role}
          onReply={handleReply}
          onHelpful={handleHelpful}
          onWrite={beginReviewFlow}
          onBrowse={() => nav(role === 'vendor' ? 'projects' : 'vendors')}
          onOpenProject={openReviewProject}
          stats={reviewStats}
          reviewGuidance={reviewGuidance}
        />
      </div>
    </div>
  );
}


function ReviewsDashboard({reviews, loading, role, onReply, onHelpful, onWrite, onBrowse, onOpenProject, stats, reviewGuidance}){
  const sidebarGuidance = reviewGuidance || getReviewSidebarGuidance(role, stats || {});
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Most Recent");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [helpfulVoted, setHelpfulVoted] = useState(() => new Set());
  const filterCountLabel = `${reviews.length} total`;

  // Brand tokens shared across this component
  const rdx = {
    panel:{background:"#fff",border:"1px solid #dfd5c2",borderRadius:18,boxShadow:"0 6px 18px rgba(28,40,20,0.04)"},
    btnPrimary:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"11px 22px",borderRadius:999,background:"linear-gradient(180deg,#c9a45c,#b08840)",color:"#fff",fontSize:13,fontWeight:700,border:"none",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif",letterSpacing:0.2,boxShadow:"0 4px 12px rgba(176,136,64,0.25),inset 0 1px 0 rgba(255,255,255,0.18)",transition:"all 0.15s"},
    btnSecondary:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 20px",borderRadius:999,background:"#fffdf8",color:"#1C2814",fontSize:13,fontWeight:600,border:"1px solid #dfd5c2",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif",transition:"all 0.15s"},
    btnGhost:{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:999,background:"transparent",color:"#5a5246",fontSize:12.5,fontWeight:600,border:"1px solid #ece4d2",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif",transition:"all 0.15s"},
    eyebrow:{fontFamily:"var(--font-sans),monospace",fontSize:9.5,fontWeight:700,letterSpacing:1.6,textTransform:"uppercase",color:"#b08840"},
    chipBase:{display:"inline-flex",alignItems:"center",padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:700,fontFamily:"var(--font-sans),monospace",letterSpacing:0.4},
  };
  const chipTone = (tone) => {
    if (tone === "green") return {...rdx.chipBase,background:"#eef5e9",border:"1px solid #cfe1c4",color:"#2f5a31"};
    if (tone === "gold")  return {...rdx.chipBase,background:"#fffaf0",border:"1px solid #e9d5a5",color:"#8a6a1f"};
    return {...rdx.chipBase,background:"#f5f1e6",border:"1px solid #ece4d2",color:"#5a5246"};
  };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"40px 0",color:"#7d7363",fontSize:13,justifyContent:"center"}}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7d7363" strokeWidth="2" style={{animation:"spin 1s linear infinite"}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
      Loading reviews…
    </div>
  );

  if (reviews.length === 0) return (
    <KBWorkspaceEmptyState
      className="kb-reviews-primary-empty"
      eyebrow="Review ledger"
      title={role === "vendor" ? "No published reviews yet" : "No reviews in your record yet"}
      body={role === "vendor"
        ? "Complete church work, request thoughtful feedback, and this tab becomes a calm record of earned credibility."
        : "Once projects are completed, publish honest reviews here so the next church can hire with more confidence."}
      actionLabel={role === "church" ? "Choose a vendor" : null}
      onAction={onWrite}
      secondaryLabel={onBrowse ? (role === 'vendor' ? 'Browse projects' : 'Open marketplace') : null}
      onSecondary={onBrowse}
      style={{marginTop:18}}
    />
  );

  const filtered = filterAndSortReviewRecords(reviews, filter, sort);

  const strongestSignal = getReviewStrongestSignal(stats?.recommendPct || 0);
  const resultSummary = getReviewResultSummary(filtered.length, reviews.length, filter);

  return (
    <div className="reviews-main-wrap" style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) 340px", gap:22, alignItems:"start", marginTop:18 }}>
      <div>
        {/* Results bar */}
        <div className="reviews-results-bar" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:14,flexWrap:"wrap"}}>
          <div>
            <div style={{...rdx.eyebrow,marginBottom:4}}>Review ledger</div>
            <div style={{ fontSize:13.5, fontWeight:700, color:"#1C2814", fontFamily:"var(--font-sans),sans-serif" }}>{resultSummary}</div>
          </div>
          <div className="reviews-results-meta" style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <span style={chipTone("muted")}>{filterCountLabel}</span>
            <span style={chipTone("muted")}>Sort · {sort}</span>
            {role === 'vendor' && <span style={chipTone("gold")}>Reply rate · {stats?.replyRate || 0}%</span>}
          </div>
        </div>

        {/* Rating breakdown card */}
        <div style={{ ...rdx.panel, padding:22, marginBottom:14 }}>
          <div className="reviews-rating-hero" style={{ display:"grid", gridTemplateColumns:"220px minmax(0,1fr)", gap:24, alignItems:"center" }}>
            <div style={{ textAlign:"center", padding:"8px 0" }}>
              <div style={{ fontFamily:"var(--font-display),serif", fontSize:62, color:"#1C2814", lineHeight:1, letterSpacing:-1.4, fontWeight:700 }}>{(stats?.avgRatingNum || 0).toFixed(1)}</div>
              <div style={{ fontSize:22, color:"#b08840", margin:"10px 0 6px", letterSpacing:1 }}>{starFill(Math.round(stats?.avgRatingNum || 0))}</div>
              <div style={{ fontSize:12, color:"#7d7363", lineHeight:1.5 }}>{strongestSignal}</div>
            </div>
            <div>
              <div style={{ ...rdx.eyebrow, marginBottom:14 }}>Rating breakdown</div>
              {(stats?.starBreakdown || []).map(row => (
                <div key={row.stars} style={{ display:"grid", gridTemplateColumns:"36px minmax(0,1fr) 70px", gap:12, alignItems:"center", marginBottom:10 }}>
                  <div style={{ fontSize:12.5, color:"#5a5246", fontWeight:600 }}>{row.stars}★</div>
                  <div style={{ height:8, background:"#f0e9d9", borderRadius:999, overflow:"hidden" }}>
                    <div style={{ width:`${row.pct}%`, height:"100%", background:"linear-gradient(90deg,#c9a45c,#b08840)", borderRadius:999 }} />
                  </div>
                  <div style={{ fontSize:11, color:"#7d7363", textAlign:"right", fontFamily:"var(--font-sans),monospace" }}>{row.count} · {row.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter + sort row */}
        <div className="reviews-filter-row" style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap", alignItems:"center", ...rdx.panel, padding:12 }}>
          {KB_REVIEW_FILTER_OPTIONS.map(f => {
            const active = filter === f;
            return (
              <button key={f} type="button" onClick={() => setFilter(f)} style={{padding:"7px 14px",borderRadius:999,background:active?"linear-gradient(180deg,#1C2814,#2a3520)":"#fffdf8",color:active?"#fff":"#1C2814",fontSize:12.5,fontWeight:active?700:600,border:active?"1px solid #1C2814":"1px solid #dfd5c2",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif",transition:"all 0.15s",boxShadow:active?"0 4px 12px rgba(28,40,20,0.18)":"none"}}>
                {f}
              </button>
            );
          })}
          <select
            style={{ padding:"8px 12px", borderRadius:999, border:"1px solid #dfd5c2", background:"#fffdf8", fontFamily:"var(--font-sans),sans-serif", fontSize:12.5, color:"#1C2814", outline:"none", marginLeft:"auto", cursor:"pointer", fontWeight:600 }}
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            {KB_REVIEW_SORT_OPTIONS.map(option => <option key={option}>{option}</option>)}
          </select>
        </div>

        {/* Review cards */}
        <div style={{ display:"grid", gap:16 }}>
          {filtered.map(r => (
            <div key={r.id} style={{ ...rdx.panel, overflow:"hidden" }}>
              <div style={{ height:4, background: r.featured ? "linear-gradient(90deg,#c9a45c,#b08840)" : "linear-gradient(90deg,rgba(28,40,20,0.10),rgba(28,40,20,0.02))" }} />
              <div style={{ padding:24 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, marginBottom:18, flexWrap:"wrap" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{width:46,height:46,borderRadius:14,background:"linear-gradient(135deg,#fffaf0,#f0e6d0)",border:"1px solid #e9d5a5",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display),serif",fontSize:18,fontWeight:700,color:"#1C2814",flexShrink:0}}>{r.avatar}</div>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                        <div style={{ fontSize:15, fontWeight:700, color:"#1C2814", fontFamily:"var(--font-sans),sans-serif" }}>{r.author}</div>
                        {r.verified && <span style={chipTone("green")}>Verified project</span>}
                        {r.recommend && <span style={chipTone("gold")}>Would rehire</span>}
                      </div>
                      <div style={{ fontSize:12, color:"#7d7363" }}>{r.city || "Church record"}{r.project ? ` · ${r.project}` : ""}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:18, color:"#b08840", lineHeight:1, letterSpacing:1 }}>{starFill(r.rating)}</div>
                    <div style={{ fontSize:11, color:"#7d7363", marginTop:6, fontFamily:"var(--font-sans),monospace" }}>{r.date}</div>
                  </div>
                </div>

                {r.title && <div style={{ fontFamily:"var(--font-display),serif", fontSize:22, lineHeight:1.2, color:"#1C2814", marginBottom:12, fontWeight:700, letterSpacing:-0.4 }}>{r.title}</div>}
                <div style={{ fontSize:14, color:"#3d3528", lineHeight:1.78, marginBottom:14, fontFamily:"var(--font-display),serif" }}>{r.body}</div>

                {!!r.cats?.length && (
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                    {r.cats.map((c, i) => <span key={c.label||i} style={chipTone("muted")}>{c.label} · {c.stars}/5</span>)}
                  </div>
                )}
                {!!r.tags?.length && (
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                    {r.tags.map((tag) => <span key={tag} style={chipTone("gold")}>{tag}</span>)}
                  </div>
                )}

                {r.reply && (
                  <div style={{ marginTop:12, padding:"15px 18px", borderRadius:14, background:"#fffdf8", border:"1px solid #ece4d2", marginBottom:14 }}>
                    <div style={{ ...rdx.eyebrow, marginBottom:8 }}>Vendor response</div>
                    <div style={{ fontSize:13.5, lineHeight:1.7, color:"#3d3528" }}>{r.reply}</div>
                  </div>
                )}

                {role === "vendor" && !r.reply && replyingTo === r.id && (
                  <div style={{ marginTop:12, padding:"16px 18px", borderRadius:14, background:"#fffdf8", border:"1px solid #ece4d2", marginBottom:14 }}>
                    <div style={{ ...rdx.eyebrow, marginBottom:10 }}>Write a response</div>
                    <textarea
                      value={replyText}
                      onChange={(e)=>setReplyText(e.target.value.slice(0, 1200))}
                      rows={4}
                      maxLength={1200}
                      style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${replyText.length > 1080 ? 'rgba(220,38,38,0.40)' : '#dfd5c2'}`, resize:"vertical", fontFamily:"var(--font-sans),sans-serif", fontSize:13.5, outline:"none", marginBottom:6, background:"#fff", color:"#1C2814", lineHeight:1.5, boxSizing:"border-box" }}
                      onFocus={e=>{e.currentTarget.style.borderColor="#b08840";e.currentTarget.style.boxShadow="0 0 0 3px rgba(176,136,64,0.12)";}}
                      onBlur={e=>{e.currentTarget.style.borderColor=replyText.length>1080?"rgba(220,38,38,0.40)":"#dfd5c2";e.currentTarget.style.boxShadow="none";}}
                      placeholder="Thank the church, add context if helpful, and keep the tone gracious and professional."
                    />
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
                      <span style={{fontSize:11, fontFamily:"var(--font-sans),monospace", color: replyText.length > 1080 ? '#b1342a' : 'rgba(28,40,20,0.30)', letterSpacing:'0.04em'}}>{replyText.length}/1200</span>
                    </div>
                    <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                      <button type="button" style={rdx.btnGhost} disabled={replySubmitting} onClick={() => { setReplyingTo(null); setReplyText(""); }}>Cancel</button>
                      <button
                        type="button"
                        style={{...rdx.btnPrimary, opacity:replyText.trim()&&!replySubmitting?1:0.5, cursor:replyText.trim()&&!replySubmitting?"pointer":"not-allowed", display:'inline-flex', alignItems:'center', gap:6}}
                        disabled={!replyText.trim() || replySubmitting}
                        aria-busy={replySubmitting}
                        onClick={async () => {
                          if (!replyText.trim() || replySubmitting) return;
                          setReplySubmitting(true);
                          try {
                            await onReply(r.id, replyText.trim());
                            // onReply resolves successfully — clear and close
                            setReplyingTo(null);
                            setReplyText("");
                          } catch {
                            // keep the box open so the vendor doesn't lose their text
                          } finally {
                            setReplySubmitting(false);
                          }
                        }}
                      >
                        {replySubmitting ? (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{animation:'spin 0.7s linear infinite',flexShrink:0}} aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                            Publishing…
                          </>
                        ) : 'Publish response'}
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap", paddingTop:14, borderTop:"1px solid #f0e9d9" }}>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {getReviewFooterChips(r).map((chip) => <span key={chip.label} style={chipTone(chip.tone)}>{chip.label}</span>)}
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                    <button
                      type="button"
                      style={{...rdx.btnGhost, opacity: helpfulVoted.has(r.id) ? 0.45 : 1, cursor: helpfulVoted.has(r.id) ? 'not-allowed' : 'pointer'}}
                      disabled={helpfulVoted.has(r.id)}
                      aria-pressed={helpfulVoted.has(r.id)}
                      onClick={() => {
                        if (helpfulVoted.has(r.id)) return;
                        setHelpfulVoted(prev => new Set([...prev, r.id]));
                        onHelpful(r.id);
                      }}
                    >
                      {helpfulVoted.has(r.id) ? '✓ Helpful' : 'Helpful'}
                    </button>
                    {onOpenProject && r.project_id && <button type="button" style={rdx.btnGhost} onClick={() => onOpenProject(r)}>Open project</button>}
                    {role === "vendor" && !r.reply && replyingTo !== r.id && (
                      <button type="button" style={{...rdx.btnGhost,color:"#b08840",borderColor:"#e9d5a5"}} onClick={() => { setReplyingTo(r.id); setReplyText(""); }}>
                        Reply
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="reviews-sidebar desktop-stress-rail" style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ ...rdx.panel, padding:20 }}>
          <div style={{ ...rdx.eyebrow, marginBottom:14 }}>Common themes</div>
          {(stats?.topTags || []).length > 0 ? (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {stats.topTags.map(([tag, count]) => (
                <span key={tag} style={chipTone("gold")}>{tag} · {count}</span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize:13, color:"#7d7363", lineHeight:1.65 }}>Themes will appear here once more reviews are published.</div>
          )}
        </div>

        <div style={{ background:"linear-gradient(135deg,#fffaf0,#f7ecd5)", border:"1px solid #e9d5a5", borderRadius:18, padding:20, boxShadow:"0 6px 18px rgba(176,136,64,0.06)", position:"relative", overflow:"hidden" }}>
          <div style={{position:"absolute",top:0,left:0,bottom:0,width:3,background:"linear-gradient(180deg,#c9a45c,#b08840)"}}/>
          <div style={{paddingLeft:6}}>
            <div style={{ ...rdx.eyebrow, marginBottom:12 }}>{sidebarGuidance.eyebrow}</div>
            <div style={{ fontSize:13, color:"#5a5246", lineHeight:1.7, marginBottom:16 }}>{sidebarGuidance.body}</div>
            {sidebarGuidance.actionLabel ? (
              <button type="button" style={rdx.btnPrimary} onClick={onWrite}>{sidebarGuidance.actionLabel}</button>
            ) : (
              <span style={chipTone("green")}>{sidebarGuidance.responseLabel}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PendingReviews({pending, role, onSelect, onBack, onOpenProject}){
  const prx = {
    shell:{background:"#faf8f4",minHeight:"100vh",paddingBottom:60},
    topbar:{maxWidth:980,margin:"0 auto",padding:"22px 28px 0",display:"flex",alignItems:"center",gap:12},
    backPill:{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px 7px 11px",borderRadius:999,background:"#fffdf8",border:"1px solid #dfd5c2",color:"#1C2814",fontSize:12.5,fontWeight:600,fontFamily:"var(--font-sans),sans-serif",cursor:"pointer",transition:"all 0.15s",boxShadow:"0 4px 12px rgba(28,40,20,0.04)"},
    crumb:{fontSize:11.5,color:"#7d7363",fontFamily:"var(--font-sans),monospace",letterSpacing:0.6,textTransform:"uppercase",fontWeight:600},
    headWrap:{maxWidth:980,margin:"0 auto",padding:"22px 28px 22px"},
    headPanel:{background:"#fffdf8",border:"1px solid #dfd5c2",borderRadius:22,padding:"26px 30px 24px",boxShadow:"0 7px 20px rgba(28,40,20,0.045)"},
    eyebrow:{fontFamily:"var(--font-sans),monospace",fontSize:10.5,fontWeight:700,letterSpacing:2.4,textTransform:"uppercase",color:"#b08840",marginBottom:10},
    headline:{fontFamily:"var(--font-display),serif",fontSize:34,fontWeight:700,color:"#1C2814",letterSpacing:-0.7,lineHeight:1.05,margin:0},
    sub:{fontSize:14,color:"#5a5246",lineHeight:1.55,maxWidth:580,marginTop:8},
    btnPrimary:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"8px 16px",borderRadius:999,background:"linear-gradient(180deg,#c9a45c,#b08840)",color:"#fff",fontSize:12.5,fontWeight:700,border:"none",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif",letterSpacing:0.2,boxShadow:"0 4px 12px rgba(176,136,64,0.25),inset 0 1px 0 rgba(255,255,255,0.18)",transition:"all 0.15s"},
    btnSecondary:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"7px 14px",borderRadius:999,background:"#fffdf8",color:"#1C2814",fontSize:12,fontWeight:600,border:"1px solid #dfd5c2",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif",transition:"all 0.15s"},
  };
  return (
    <div style={prx.shell}>
      {/* Top bar */}
      <div style={prx.topbar}>
        <button type="button" onClick={onBack} style={prx.backPill} onMouseOver={e=>{e.currentTarget.style.background="#fffaf0";e.currentTarget.style.borderColor="#c9a45c";}} onMouseOut={e=>{e.currentTarget.style.background="#fffdf8";e.currentTarget.style.borderColor="#dfd5c2";}}>
          <span style={{fontSize:14,lineHeight:1}}>←</span> Back to reviews
        </button>
        <span style={{color:"#c8bfa9"}}>·</span>
        <span style={prx.crumb}>Reviews due</span>
      </div>

      {/* Cream headline */}
      <div style={prx.headWrap}>
        <div style={prx.headPanel}>
          <div style={prx.eyebrow}>Reviews due</div>
          <h1 style={prx.headline}>Awaiting your review</h1>
          <div style={prx.sub}>These vendors completed work for you. Your review helps the whole community.</div>
        </div>
      </div>

      {/* List */}
      <div style={{maxWidth:980,margin:"0 auto",padding:"0 28px"}}>
        {pending.length === 0 ? (
          <div style={{background:"#fffdf8",border:"1px solid #dfd5c2",borderRadius:18,padding:"56px 32px",textAlign:"center",boxShadow:"0 6px 18px rgba(28,40,20,0.04)"}}>
            <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#eef5e9,#d8ead0)",border:"1px solid #cfe1c4",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="#2f5a31" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{...prx.eyebrow,marginBottom:8}}>All clear</div>
            <div style={{fontFamily:"var(--font-display),serif",fontSize:22,fontWeight:700,color:"#1C2814",letterSpacing:-0.4,marginBottom:6}}>All caught up!</div>
            <div style={{fontSize:13.5,color:"#5a5246",lineHeight:1.6,maxWidth:380,margin:"0 auto"}}>Every vendor you've hired has been reviewed. New ones will show up here when their work is done.</div>
          </div>
        ) : (
          <>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"linear-gradient(135deg,#fffaf0,#f7ecd5)",border:"1px solid #e9d5a5",borderRadius:14,fontSize:13,color:"#7a5a25",marginBottom:18,fontWeight:600,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,bottom:0,width:3,background:"linear-gradient(180deg,#c9a45c,#b08840)"}}/>
              <span style={{paddingLeft:6,fontFamily:"var(--font-sans),sans-serif"}}>Reviews help Christian vendors get more ministry clients. Takes about two minutes each.</span>
            </div>
            <div style={{display:"grid",gap:14}}>
              {pending.map(p=>(
                <div key={p.id} onClick={()=>onSelect(p)} role="button" tabIndex={0} onKeyDown={activateOnKey(()=>onSelect(p))} style={{display:"flex",alignItems:"center",gap:16,padding:"18px 20px",background:"#fff",border:"1px solid #dfd5c2",borderRadius:18,boxShadow:"0 6px 18px rgba(28,40,20,0.04)",cursor:"pointer",transition:"all 0.15s",flexWrap:"wrap"}} onMouseOver={e=>{e.currentTarget.style.borderColor="#c9a45c";e.currentTarget.style.boxShadow="0 8px 22px rgba(176,136,64,0.10)";}} onMouseOut={e=>{e.currentTarget.style.borderColor="#dfd5c2";e.currentTarget.style.boxShadow="0 6px 18px rgba(28,40,20,0.04)";}}>
                  <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#fffaf0,#f0e6d0)",border:"1px solid #e9d5a5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{p.emoji || "✦"}</div>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{fontSize:15,fontWeight:700,color:"#1C2814",marginBottom:4,fontFamily:"var(--font-sans),sans-serif"}}>{p.name}</div>
                    <div style={{fontSize:13,color:"#5a5246",marginBottom:3}}>{p.project}</div>
                    <div style={{fontSize:11.5,color:"#7d7363",fontFamily:"var(--font-sans),monospace"}}>Completed {p.completed}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
                    <span style={{padding:"3px 10px",background:"#fffaf0",border:"1px solid #e9d5a5",borderRadius:999,fontSize:10,fontWeight:800,color:"#8a6a1f",fontFamily:"var(--font-sans),monospace",letterSpacing:0.6}}>REVIEW DUE</span>
                    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end'}}>
                      {onOpenProject && p.project_id ? <button type="button" style={prx.btnSecondary} onClick={(e)=>{ e.stopPropagation(); onOpenProject(p); }}>Open project</button> : null}
                      <button type="button" style={prx.btnPrimary} onClick={(e)=>{ e.stopPropagation(); onSelect(p); }}>Write review →</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WriteReview({vendor, onSubmit, onBack, onOpenProject, submitting = false}){
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [subRatings, setSubRatings] = useState({Communication:0,"Quality of Work":0,Timeline:0,"Value for Money":0,"Faith Alignment":0});
  const [hoverSub, setHoverSub] = useState({});
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState([]);
  const [recommend, setRecommend] = useState(null);
  const display = hover||rating;
  const canSubmit = rating>0&&body.length>30&&recommend!==null&&!submitting;

  const wrx = {
    shell:{background:"#faf8f4",minHeight:"100vh",paddingBottom:60},
    topbar:{maxWidth:880,margin:"0 auto",padding:"22px 28px 0",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"},
    backPill:{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px 7px 11px",borderRadius:999,background:"#fffdf8",border:"1px solid #dfd5c2",color:"#1C2814",fontSize:12.5,fontWeight:600,fontFamily:"var(--font-sans),sans-serif",cursor:"pointer",transition:"all 0.15s",boxShadow:"0 4px 12px rgba(28,40,20,0.04)"},
    crumb:{fontSize:11.5,color:"#7d7363",fontFamily:"var(--font-sans),monospace",letterSpacing:0.6,textTransform:"uppercase",fontWeight:600},
    headWrap:{maxWidth:880,margin:"0 auto",padding:"22px 28px 22px"},
    headPanel:{background:"#fffdf8",border:"1px solid #dfd5c2",borderRadius:22,padding:"26px 30px 24px",boxShadow:"0 7px 20px rgba(28,40,20,0.045)"},
    eyebrow:{fontFamily:"var(--font-sans),monospace",fontSize:10.5,fontWeight:700,letterSpacing:2.4,textTransform:"uppercase",color:"#b08840",marginBottom:10},
    headline:{fontFamily:"var(--font-display),serif",fontSize:32,fontWeight:700,color:"#1C2814",letterSpacing:-0.6,lineHeight:1.05,margin:0},
    sub:{fontSize:14,color:"#5a5246",lineHeight:1.55,maxWidth:560,marginTop:8,fontFamily:"var(--font-display),serif",fontStyle:"italic"},
    panel:{background:"#fff",border:"1px solid #dfd5c2",borderRadius:18,marginBottom:16,boxShadow:"0 6px 18px rgba(28,40,20,0.04)",overflow:"hidden"},
    panelHd:{padding:"16px 22px 14px",background:"#fffdf8",borderBottom:"1px solid #ece4d2",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"},
    panelEyebrow:{fontFamily:"var(--font-sans),monospace",fontSize:9.5,fontWeight:700,letterSpacing:1.8,textTransform:"uppercase",color:"#b08840"},
    panelTitle:{fontFamily:"var(--font-display),serif",fontSize:18,fontWeight:700,color:"#1C2814",letterSpacing:-0.3,marginTop:2},
    panelMeta:{fontSize:11.5,color:"#7d7363",fontFamily:"var(--font-sans),monospace"},
    panelBody:{padding:"22px"},
    label:{display:"block",fontSize:11.5,fontWeight:700,letterSpacing:0.6,textTransform:"uppercase",color:"#5a5246",marginBottom:8,fontFamily:"var(--font-sans),sans-serif"},
    input:{width:"100%",height:46,padding:"0 14px",borderRadius:12,border:"1.5px solid #dfd5c2",background:"#fffdf8",fontSize:14,color:"#1C2814",fontFamily:"var(--font-sans),sans-serif",outline:"none",transition:"border-color 0.15s,box-shadow 0.15s",boxSizing:"border-box"},
    textarea:{width:"100%",padding:"12px 14px",borderRadius:12,border:"1.5px solid #dfd5c2",background:"#fffdf8",fontSize:14,color:"#1C2814",fontFamily:"var(--font-sans),sans-serif",outline:"none",transition:"border-color 0.15s,box-shadow 0.15s",boxSizing:"border-box",resize:"vertical",lineHeight:1.55},
    btnPrimary:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"11px 22px",borderRadius:999,background:"linear-gradient(180deg,#c9a45c,#b08840)",color:"#fff",fontSize:13,fontWeight:700,border:"none",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif",letterSpacing:0.2,boxShadow:"0 4px 12px rgba(176,136,64,0.25),inset 0 1px 0 rgba(255,255,255,0.18)",transition:"all 0.15s"},
    btnSecondary:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 20px",borderRadius:999,background:"#fffdf8",color:"#1C2814",fontSize:13,fontWeight:600,border:"1px solid #dfd5c2",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif",transition:"all 0.15s"},
    onFocus:(e)=>{e.currentTarget.style.borderColor="#b08840";e.currentTarget.style.boxShadow="0 0 0 3px rgba(176,136,64,0.12)";},
    onBlur:(e)=>{e.currentTarget.style.borderColor="#dfd5c2";e.currentTarget.style.boxShadow="none";},
  };

  return (
    <div style={wrx.shell}>
      {/* Top bar */}
      <div style={wrx.topbar}>
        <button type="button" onClick={onBack} style={wrx.backPill} onMouseOver={e=>{e.currentTarget.style.background="#fffaf0";e.currentTarget.style.borderColor="#c9a45c";}} onMouseOut={e=>{e.currentTarget.style.background="#fffdf8";e.currentTarget.style.borderColor="#dfd5c2";}}>
          <span style={{fontSize:14,lineHeight:1}}>←</span> Back
        </button>
        <span style={{color:"#c8bfa9"}}>·</span>
        <span style={wrx.crumb}>Write a review</span>
        {onOpenProject && vendor?.project_id ? <button type="button" style={{...wrx.btnSecondary,marginLeft:"auto"}} onClick={() => onOpenProject(vendor)}>Open project →</button> : null}
      </div>

      {/* Cream headline */}
      <div style={wrx.headWrap}>
        <div style={wrx.headPanel}>
          <div style={wrx.eyebrow}>Write a review</div>
          <h1 style={wrx.headline}>Review: {vendor?.name||"Vendor"}</h1>
          <div style={wrx.sub}>"{vendor?.project||"Completed project"}"</div>
        </div>
      </div>

      {/* Form */}
      <div style={{maxWidth:880,margin:"0 auto",padding:"0 28px"}}>
        {/* Overall rating */}
        <div style={wrx.panel}>
          <div style={wrx.panelHd}>
            <div>
              <div style={wrx.panelEyebrow}>Step 1</div>
              <div style={wrx.panelTitle}>Overall rating</div>
            </div>
          </div>
          <div style={wrx.panelBody}>
            <div className="star-picker" style={{display:"flex",gap:6,marginBottom:8}}>
              {[1,2,3,4,5].map(n=><button type="button" key={n} aria-label={`Rate ${n} star${n>1?"s":""}`} aria-pressed={rating===n} className={`star-btn${display>=n?" lit":""}`} onClick={()=>setRating(n)} onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)}>★</button>)}
            </div>
            <div style={{fontSize:13,color:"#7d7363",height:20,fontFamily:"var(--font-sans),sans-serif"}}>{display>0?STAR_LABELS[display]:"Tap a star to rate"}</div>
          </div>
        </div>

        {/* Sub-ratings */}
        <div style={wrx.panel}>
          <div style={wrx.panelHd}>
            <div>
              <div style={wrx.panelEyebrow}>Step 2</div>
              <div style={wrx.panelTitle}>Rate each category</div>
            </div>
            <span style={wrx.panelMeta}>Optional</span>
          </div>
          <div style={wrx.panelBody}>
            {Object.keys(subRatings).map((cat,i,arr)=>(
              <div key={cat} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,paddingBottom:12,marginBottom:i===arr.length-1?0:12,borderBottom:i===arr.length-1?"none":"1px solid #f0e9d9"}}>
                <div style={{fontSize:13.5,color:"#1C2814",fontWeight:600,fontFamily:"var(--font-sans),sans-serif"}}>{cat}</div>
                <div className="sub-stars" style={{display:"flex",gap:3}}>
                  {[1,2,3,4,5].map(n=><button type="button" key={n} aria-label={`Rate ${cat} ${n} star${n>1?"s":""}`} aria-pressed={subRatings[cat]===n} className={`sub-star${(hoverSub[cat]||subRatings[cat])>=n?" lit":""}`} onClick={()=>setSubRatings(s=>({...s,[cat]:n}))} onMouseEnter={()=>setHoverSub(h=>({...h,[cat]:n}))} onMouseLeave={()=>setHoverSub(h=>({...h,[cat]:0}))}>★</button>)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={wrx.panel}>
          <div style={wrx.panelHd}>
            <div>
              <div style={wrx.panelEyebrow}>Step 3</div>
              <div style={wrx.panelTitle}>Your review</div>
            </div>
          </div>
          <div style={wrx.panelBody}>
            <div style={{marginBottom:18}}>
              <label style={wrx.label} htmlFor="rv-title">Review title</label>
              <input id="rv-title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Summarize your experience in one line…" style={wrx.input} onFocus={wrx.onFocus} onBlur={wrx.onBlur}/>
            </div>
            <div>
              <label style={wrx.label} htmlFor="rv-body">Detailed review <span style={{color:"#a23b3b",fontWeight:700}}>·</span> required</label>
              <textarea id="rv-body" value={body} onChange={e=>setBody(e.target.value)} rows={6} placeholder="Share your honest experience. What did they do well? How did their faith show up in their work?" style={wrx.textarea} onFocus={wrx.onFocus} onBlur={wrx.onBlur}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:6,gap:10,flexWrap:"wrap"}}>
                <div style={{fontSize:11.5,color:body.length<30?"#a23b3b":"#3d8049",fontWeight:700,fontFamily:"var(--font-sans),sans-serif"}}>{body.length<30?`${30-body.length} more characters required`:"✓ Minimum length met"}</div>
                <div style={{fontSize:11,color:"#9c917f",fontFamily:"var(--font-sans),monospace"}}>{body.length}/1000</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div style={wrx.panel}>
          <div style={wrx.panelHd}>
            <div>
              <div style={wrx.panelEyebrow}>Step 4</div>
              <div style={wrx.panelTitle}>Highlight tags</div>
            </div>
            <span style={wrx.panelMeta}>Optional</span>
          </div>
          <div style={wrx.panelBody}>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {HIGHLIGHT_TAGS.map(t=>{
                const sel = tags.includes(t);
                return (
                  <button type="button" key={t} onClick={()=>setTags(ts=>ts.includes(t)?ts.filter(x=>x!==t):[...ts,t])} style={{padding:"6px 14px",borderRadius:999,border:sel?"1.5px solid #b08840":"1.5px solid #dfd5c2",background:sel?"#fffaf0":"#fffdf8",fontSize:12,fontWeight:sel?700:600,color:sel?"#7a5a25":"#5a5246",cursor:"pointer",fontFamily:"var(--font-sans),sans-serif",transition:"all 0.15s",boxShadow:sel?"0 0 0 3px rgba(176,136,64,0.12)":"none"}}>{sel?"✓ ":""}{t}</button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recommend */}
        <div style={wrx.panel}>
          <div style={wrx.panelHd}>
            <div>
              <div style={wrx.panelEyebrow}>Step 5</div>
              <div style={wrx.panelTitle}>Would you rehire this vendor? <span style={{color:"#a23b3b",fontWeight:800}}>·</span><span style={{...wrx.panelMeta,marginLeft:4}}>required</span></div>
            </div>
          </div>
          <div style={wrx.panelBody}>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {[
                {val:true,label:"Yes, I'd rehire them",toneBg:"#eef5e9",toneBorder:"#cfe1c4",toneColor:"#2f5a31"},
                {val:false,label:"No, I wouldn't",toneBg:"#fdf2f2",toneBorder:"#e6c4c4",toneColor:"#a23b3b"},
              ].map(opt=>{
                const sel = recommend===opt.val;
                return (
                  <button type="button" key={String(opt.val)} onClick={()=>setRecommend(opt.val)} style={{flex:1,minWidth:200,padding:"16px 18px",borderRadius:14,border:sel?`2px solid ${opt.toneColor}`:"1.5px solid #dfd5c2",background:sel?opt.toneBg:"#fffdf8",cursor:"pointer",transition:"all 0.15s",textAlign:"center",fontSize:13.5,fontWeight:700,color:sel?opt.toneColor:"#5a5246",fontFamily:"var(--font-sans),sans-serif",boxShadow:sel?`0 0 0 4px ${opt.toneBorder}`:"none"}}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{display:"flex",gap:10,alignItems:"center",marginTop:6,flexWrap:"wrap"}}>
          <button
            type="button"
            style={{...wrx.btnPrimary, opacity:canSubmit?1:0.5, cursor:canSubmit?"pointer":"not-allowed"}}
            disabled={!canSubmit}
            aria-busy={submitting}
            onClick={()=>{ if (!submitting) onSubmit({rating,body,title,tags,recommend,subRatings:Object.fromEntries(Object.entries(subRatings).filter(([,v])=>v>0))}); }}
          >
            {submitting ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{animation:'spin 0.7s linear infinite',flexShrink:0}} aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Publishing…
              </>
            ) : 'Publish review →'}
          </button>
          <button type="button" style={wrx.btnSecondary} onClick={onBack}>Cancel</button>
          {!canSubmit&&<span style={{fontSize:12,color:"#7d7363",fontFamily:"var(--font-sans),sans-serif"}}>{rating===0?"Add a star rating":body.length<30?"Write at least 30 characters":"Select rehire preference"}</span>}
        </div>
      </div>
    </div>
  );
}

export default function ReviewsScreenRoute({ dependencies, ...props }) {
  applyReviewsScreenDependencies(dependencies);
  return <ReviewsScreen {...props} />;
}
