import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";
import FaithBidCard11A from "./FaithBidCard11A";

let __KB_STORAGE_SYNC_EVENT, __kbCanonicalizeToCategories, __kbDeriveProjectCategories, __kbReadWorkspaceMap, activateOnKey, BadgeRow, BidAcceptedModal, BidDetailContent, buildBidAcceptedModalState, buildCanonicalReferralLink, buildInteropAttentionSignals, buildOptimisticProjectRecord, buildProjectPostInsertPayload, buildVendorPairSignals, buildVendorProfileSeed, cachedQuery, canManageProjectWithRole, ChurchProjectsMarketplaceHero, clearPendingProjectTarget, clearPendingVendorTarget, clearReturnContext, computePlatformFee, computeProjectMatchForVendor, computeRecommendedVendorFit, ConfirmModal, createTrustedNotificationSafe, CustomEvent, deriveCanonicalDealState, deriveProjectOperationalAlerts, deriveSharedProjectStatus, detailBudgetParts, detailCategory, detailGallery, detailPostedLabel, detailScopeItems, ensureInboxConversation, ExecutionActionStack, fetchLatestProjectOpsSnapshot, fetchLatestProjectWorkspaceSync, fetchUnreadConversationCountsSafe, fetchVendorPairSignalMaps, firstNonEmpty, fmtMoney, formatFileSize, formatMarketplaceCategoryLabel, formatMoney, getActiveGroupAttribution, getBiddingEnabledOncePerSession, getCompareWorkspaceCount, getCompareWorkspaceLimitMessage, getConversationStatusBadgeLocal, getCurrentUserSafe, getDealStateBucket, getDealStateSummary, getDefaultProjectWorkspace, getInitialsSafe, getMarketplaceModeMeta, getMarketplaceSummaryCards, getMarketplaceTabs, getMarketplaceVendorDataset, getPendingProjectTarget, getPendingVendorTarget, getProjectCardBriefLine, getProjectCardCategoryLabel, getProjectCardTimelineLabel, getProjectHeroImage, getProjectInteropEntry, getProjectPosterStats, getProjectWorkflowSummary, getRecommendedFitPresentation, getReturnNavigationTarget, getSignedChatFileUrl, getValidMediaUrl, getVendorIdentityBadges, getVendorPairSignalMapEntry, getVendorTrustSnapshot, handleKbImageError, injectMarketplaceDetailFonts, invalidateCache, isKbTimeoutError, isMissingColumnError, isRecoverableSupabaseAuthStorageError, isSupabaseAuthLockAbort, KB_BP_MOBILE, KB_BP_WORKSPACE, KB_LIVE_MARKETPLACE_IMAGES, KB_MARKETPLACE_RUNTIME_CSS, KB_PROJECT_INTEROP_KEY, KB_PROJECT_OPS_KEY, KB_PROJECT_WORKSPACE_KEY, KB_RENDER_MATCH_CARD_IMAGES, KB_STORAGE_KEYS, KB_WORKSPACE_CLAY_BACKGROUND, KBEmptyState, KBIntentionalState, kbIsDevRuntime, kbMatchInlineText, kbMaybeRepairSupabaseAuthStorage, kbPerfAfterPaint, kbPerfMark, kbScheduleAfterPaint, KBSkeleton, kbTrackChannel, KcProjectCard, listProjectInteropEntries, loadCompareWorkspaceState, loadProjectOpsState, loadProjectWorkspace, logError, makeEmptyVendorPairSignalMaps, mergeProjectOpsSnapshots, mergeProjectWorkspaceSnapshots, normalizeProjectEntity, normalizeProjectInteropEntry, normalizeProjectOpsSnapshot, normalizeProjectWorkspaceSnapshot, normalizeRefCode, normalizeVendorEntity, normalizeVendorPairInviteRow, openInboxThread, OperationalAlertList, parseProjectWorkspaceSync, persistProjectOpsSnapshot, persistProjectWorkspaceSync, persistSavedProjectRecord, pickMarketplacePresetImage, PLATFORM_FEE_CAP, PLATFORM_FEE_LABEL, PLATFORM_FEE_RATE, PLATFORM_PAYMENTS_STATUS, PostProject, PROJECT_PHASES, PROJECT_POST_SCHEMA_FLEX_KEYS, PROJECT_VENDOR_PIPELINE, PROJECT_VENDOR_STAGE_META, projectHasPostHireWorkflow, projectOpsFingerprint, ProjectPrimaryEmptyState, projectWorkspaceFingerprint, pushProjectInteropSignal, queueActivityNavigation, queueDealRoomsHubNavigation, queueInboxNavigation, queueVendorNavigation, readLocalJson, readReturnContext, rememberProjectForVendorMatching, rememberReturnContext, removeCompareWorkspaceItem, runSupabaseWithFallback, runSupabaseWithTimeout, safeArray, SAMPLE_PROJECTS, saveCompareWorkspaceState, saveProjectOpsState, saveProjectWorkspace, scoreProjectForVendorLane, scoreVendorAgainstProject, selectConversationsSafe, selectProfilesSafe, selectUserConversationsSafe, selectVendorDirectorySafe, selectVendorMatchesSafe, setAuthDefaultRole, setPageMeta, setPendingProjectTarget, setPendingReviewTarget, setProjectVendorStage, StripePlatformFeeModal, stripProjectPostSchemaFlexFields, SuccessMomentModal, summarizeVendorPipeline, transitionProjectLifecycleSafe, updateConversationSafe, updateProjectInteropEntry, upsertCompareWorkspaceItem, upsertProjectVendorLink, useDealState, useDebounce, useFocusTrap, useViewportWidth, KB_CHURCH_MARKETPLACE_VIDEO_POSTER, KB_CHURCH_VIDEO_STEM_EDGE_MASK, KB_MATCHMAKER_INPUT_VERSION, KB_NAV_SCREENS, clampVendorNarrative, createRecommendedVendorInviteRecord, getVendorDeliveryBadge, getVendorPrimaryImage, getVendorProfilePresentation, isHirerRole, normalizeDeliveryModel, normalizeSelectedVendorProjectMeta, openProjectContextBack, persistMatchmakerOutcomeEvent, persistRecommendedVendorMatchSnapshot, queueCompareNavigation, queueProjectNavigation, readSelectedVendorProject, starFill, startConversation, writeSelectedVendorProject, ChurchMarketplaceHero, AvailabilityCalendar, VendorReferencesTrustBadge, listProjectVendorLinks;

function applyProjectsScreenDependencies(dependencies = {}) {
  ({ __KB_STORAGE_SYNC_EVENT, __kbCanonicalizeToCategories, __kbDeriveProjectCategories, __kbReadWorkspaceMap, activateOnKey, BadgeRow, BidAcceptedModal, BidDetailContent, buildBidAcceptedModalState, buildCanonicalReferralLink, buildInteropAttentionSignals, buildOptimisticProjectRecord, buildProjectPostInsertPayload, buildVendorPairSignals, buildVendorProfileSeed, cachedQuery, canManageProjectWithRole, ChurchProjectsMarketplaceHero, clearPendingProjectTarget, clearPendingVendorTarget, clearReturnContext, computePlatformFee, computeProjectMatchForVendor, computeRecommendedVendorFit, ConfirmModal, createTrustedNotificationSafe, CustomEvent, deriveCanonicalDealState, deriveProjectOperationalAlerts, deriveSharedProjectStatus, detailBudgetParts, detailCategory, detailGallery, detailPostedLabel, detailScopeItems, ensureInboxConversation, ExecutionActionStack, fetchLatestProjectOpsSnapshot, fetchLatestProjectWorkspaceSync, fetchUnreadConversationCountsSafe, fetchVendorPairSignalMaps, firstNonEmpty, fmtMoney, formatFileSize, formatMarketplaceCategoryLabel, formatMoney, getActiveGroupAttribution, getBiddingEnabledOncePerSession, getCompareWorkspaceCount, getCompareWorkspaceLimitMessage, getConversationStatusBadgeLocal, getCurrentUserSafe, getDealStateBucket, getDealStateSummary, getDefaultProjectWorkspace, getInitialsSafe, getMarketplaceModeMeta, getMarketplaceSummaryCards, getMarketplaceTabs, getMarketplaceVendorDataset, getPendingProjectTarget, getPendingVendorTarget, getProjectCardBriefLine, getProjectCardCategoryLabel, getProjectCardTimelineLabel, getProjectHeroImage, getProjectInteropEntry, getProjectPosterStats, getProjectWorkflowSummary, getRecommendedFitPresentation, getReturnNavigationTarget, getSignedChatFileUrl, getValidMediaUrl, getVendorIdentityBadges, getVendorPairSignalMapEntry, getVendorTrustSnapshot, handleKbImageError, injectMarketplaceDetailFonts, invalidateCache, isKbTimeoutError, isMissingColumnError, isRecoverableSupabaseAuthStorageError, isSupabaseAuthLockAbort, KB_BP_MOBILE, KB_BP_WORKSPACE, KB_LIVE_MARKETPLACE_IMAGES, KB_MARKETPLACE_RUNTIME_CSS, KB_PROJECT_INTEROP_KEY, KB_PROJECT_OPS_KEY, KB_PROJECT_WORKSPACE_KEY, KB_RENDER_MATCH_CARD_IMAGES, KB_STORAGE_KEYS, KB_WORKSPACE_CLAY_BACKGROUND, KBEmptyState, KBIntentionalState, kbIsDevRuntime, kbMatchInlineText, kbMaybeRepairSupabaseAuthStorage, kbPerfAfterPaint, kbPerfMark, kbScheduleAfterPaint, KBSkeleton, kbTrackChannel, KcProjectCard, listProjectInteropEntries, loadCompareWorkspaceState, loadProjectOpsState, loadProjectWorkspace, logError, makeEmptyVendorPairSignalMaps, mergeProjectOpsSnapshots, mergeProjectWorkspaceSnapshots, normalizeProjectEntity, normalizeProjectInteropEntry, normalizeProjectOpsSnapshot, normalizeProjectWorkspaceSnapshot, normalizeRefCode, normalizeVendorEntity, normalizeVendorPairInviteRow, openInboxThread, OperationalAlertList, parseProjectWorkspaceSync, persistProjectOpsSnapshot, persistProjectWorkspaceSync, persistSavedProjectRecord, pickMarketplacePresetImage, PLATFORM_FEE_CAP, PLATFORM_FEE_LABEL, PLATFORM_FEE_RATE, PLATFORM_PAYMENTS_STATUS, PostProject, PROJECT_PHASES, PROJECT_POST_SCHEMA_FLEX_KEYS, PROJECT_VENDOR_PIPELINE, PROJECT_VENDOR_STAGE_META, projectHasPostHireWorkflow, projectOpsFingerprint, ProjectPrimaryEmptyState, projectWorkspaceFingerprint, pushProjectInteropSignal, queueActivityNavigation, queueDealRoomsHubNavigation, queueInboxNavigation, queueVendorNavigation, readLocalJson, readReturnContext, rememberProjectForVendorMatching, rememberReturnContext, removeCompareWorkspaceItem, runSupabaseWithFallback, runSupabaseWithTimeout, safeArray, SAMPLE_PROJECTS, saveCompareWorkspaceState, saveProjectOpsState, saveProjectWorkspace, scoreProjectForVendorLane, scoreVendorAgainstProject, selectConversationsSafe, selectProfilesSafe, selectUserConversationsSafe, selectVendorDirectorySafe, selectVendorMatchesSafe, setAuthDefaultRole, setPageMeta, setPendingProjectTarget, setPendingReviewTarget, setProjectVendorStage, StripePlatformFeeModal, stripProjectPostSchemaFlexFields, SuccessMomentModal, summarizeVendorPipeline, transitionProjectLifecycleSafe, updateConversationSafe, updateProjectInteropEntry, upsertCompareWorkspaceItem, upsertProjectVendorLink, useDealState, useDebounce, useFocusTrap, useViewportWidth, KB_CHURCH_MARKETPLACE_VIDEO_POSTER, KB_CHURCH_VIDEO_STEM_EDGE_MASK, KB_MATCHMAKER_INPUT_VERSION, KB_NAV_SCREENS, clampVendorNarrative, createRecommendedVendorInviteRecord, getVendorDeliveryBadge, getVendorPrimaryImage, getVendorProfilePresentation, isHirerRole, normalizeDeliveryModel, normalizeSelectedVendorProjectMeta, openProjectContextBack, persistMatchmakerOutcomeEvent, persistRecommendedVendorMatchSnapshot, queueCompareNavigation, queueProjectNavigation, readSelectedVendorProject, starFill, startConversation, writeSelectedVendorProject, ChurchMarketplaceHero, AvailabilityCalendar, VendorReferencesTrustBadge, listProjectVendorLinks } = dependencies || {});
}

function ProjectsScreen({role, currentUser, showToast, nav, initialView="board", onMounted, navSubTab, onSubTabChange, forceProjectTab=null, privateMarketplaceAccess=false, isAdmin=false}){
  const [view, setView] = useState(initialView);
  const [biddingEnabled, setBiddingEnabled] = useState(false);
  const [biddingSettingLoaded, setBiddingSettingLoaded] = useState(false);
  const [bidNotifyPendingId, setBidNotifyPendingId] = useState(null);
  const [confirmCompleteId, setConfirmCompleteId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  useEffect(()=>{ if(onMounted) onMounted(); },[]);
  useEffect(() => {
    let active = true;
    getBiddingEnabledOncePerSession().then(enabled => {
      if (!active) return;
      setBiddingEnabled(enabled === true);
      setBiddingSettingLoaded(true);
    });
    return () => { active = false; };
  }, []);

  const requestBidOpeningNotification = async (project) => {
    const projectId = project?.id || selectedProjectId || selectedProjectFallback?.id || null;
    if (!currentUser?.id) {
      showToast('Sign in to be notified when bidding opens.', 'error');
      return;
    }
    if (!projectId || bidNotifyPendingId) return;
    setBidNotifyPendingId(projectId);
    try {
      const { data: existingSavedProjectIntent, error: existingIntentError } = await supabase
        .from('saved_projects')
        .select('is_saved')
        .eq('user_id', currentUser.id)
        .eq('project_id', projectId)
        .maybeSingle();
      if (existingIntentError) throw existingIntentError;
      const { error } = await supabase.from('saved_projects').upsert({
        user_id: currentUser.id,
        project_id: projectId,
        is_saved: existingSavedProjectIntent?.is_saved === true,
        notify_on_bidding_open: true,
      }, { onConflict:'user_id,project_id' });
      if (error) throw error;
      showToast("You're on the list. We'll notify you when bidding opens.");
    } catch (error) {
      logError('bid-opening-notify', error, { projectId });
      showToast('Could not save the notification request. Please try again.', 'error');
    } finally {
      setBidNotifyPendingId(null);
    }
  };

  const openBidWhenEnabled = (project) => {
    const prelaunchBidAccess = privateMarketplaceAccess || isAdmin;
    if (!prelaunchBidAccess && (!biddingSettingLoaded || !biddingEnabled)) return requestBidOpeningNotification(project);
    setView('bid');
  };

  // Listen for post-project trigger from the dashboard CTAs
  useEffect(() => {
    const handler = () => {
      clearSelectedProject();
      setSelectedVendorProfile(null);
      setSelectedSample(null);
      setPostSuccess(false);
      setBidSuccess(false);
      setView("post");
    };
    document.addEventListener("kb:post-project", handler);
    return () => document.removeEventListener("kb:post-project", handler);
  }, []);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProjectFallback, setSelectedProjectFallback] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  // V736: Marketplace header parity added a My Projects-style tools row.
  // Keep its search/sort state local to ProjectsScreen so the header cannot
  // throw at render time. This is intentionally header-only state; the legacy
  // marketplace feed/filter logic remains untouched.
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("best_match");
  // Keyset pagination state for the open-projects feed. We page by
  // posted_at desc, using the last loaded posted_at as the cursor for the
  // next request. Microsecond-precision timestamps are unique enough in
  // practice that a single-column cursor doesn't lose rows; if that
  // assumption ever fails the fix is a (posted_at, id) compound cursor via
  // an .or() filter. hasMoreProjects starts true so the very first sentinel
  // intersection can trigger a load before we've even returned from the
  // initial fetch — guarded by loadingMoreProjects to prevent dupes.
  const [projectsCursor, setProjectsCursor] = useState(null);
  const [hasMoreProjects, setHasMoreProjects] = useState(true);
  const [loadingMoreProjects, setLoadingMoreProjects] = useState(false);
  const [bids, setBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [bidFetchError, setBidFetchError] = useState(null);
  const [postSuccess, setPostSuccess] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false); // rate-limit: 60s cooldown after resend
  const [stripeModal, setStripeModal] = useState(null);
  const [myBids, setMyBids] = useState([]);
  const [loadingMyBids, setLoadingMyBids] = useState(false);
  const [vendorVerified, setVendorVerified] = useState(null);
  const [bidAcceptedModal, setBidAcceptedModal] = useState(null);
  const [successMoment, setSuccessMoment] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const hireInFlightRef = useRef(false);
  const [myActiveProjects, setMyActiveProjects] = useState([]);
  const [loadingMyProjects, setLoadingMyProjects] = useState(false);
  const [myProjectsFetchError, setMyProjectsFetchError] = useState(false);

  // V807 NAV PERFORMANCE PATCH — tab switches must not behave like reloads.
  // These refs keep Marketplace / My Projects / My Work warm after first load,
  // block duplicate in-flight requests, and let background refreshes reconcile
  // data without flashing skeleton states or blanking already-visible panels.
  const PROJECTS_NAV_CACHE_TTL_MS = 45000;
  const projectsFetchedAtRef = useRef(0);
  const projectsInFlightRef = useRef(false);
  const myProjectsFetchedAtRef = useRef(0);
  const myProjectsInFlightRef = useRef(false);
  const myBidsFetchedAtRef = useRef(0);
  const myBidsInFlightRef = useRef(false);
  const projectDataOwnerKey = `${role || "guest"}:${currentUser?.id || "anon"}`;
  useEffect(() => {
    projectsFetchedAtRef.current = 0;
    projectsInFlightRef.current = false;
    myProjectsFetchedAtRef.current = 0;
    myProjectsInFlightRef.current = false;
    myBidsFetchedAtRef.current = 0;
    myBidsInFlightRef.current = false;
    setMyProjectsFetchError(false);
    setMyBids([]);
    setMyActiveProjects([]);
  }, [projectDataOwnerKey]);
  const [selectedSample, setSelectedSample] = useState(null);
  const [selectedVendorProfile, setSelectedVendorProfile] = useState(null);
  const [founderCoverageContext, setFounderCoverageContext] = useState(null);
  const [selectedProjectInitialTab, setSelectedProjectInitialTab] = useState('overview');
  const reviewNavTimerRef = useRef(null);
  useEffect(() => () => { if (reviewNavTimerRef.current) clearTimeout(reviewNavTimerRef.current); }, []);
  const projectPools = useMemo(() => ([...(projects || []), ...(myActiveProjects || [])]), [projects, myActiveProjects]);
  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    // 0173 — My Projects carries the authoritative live bid count stitched
    // from public.bids. Prefer that owner/workspace copy over the broader
    // Marketplace feed, whose legacy projects.bids_count can be stale.
    const owned = (myActiveProjects || []).find(p => String(p?.id ?? "") === String(selectedProjectId));
    const found = owned || projectPools.find(p => String(p?.id ?? "") === String(selectedProjectId));
    return normalizeProjectEntity(found || selectedProjectFallback);
  }, [myActiveProjects, projectPools, selectedProjectId, selectedProjectFallback]);

  const openProject = (project, opts = {}) => {
    const normalizedRaw = normalizeProjectEntity(project) || project || {};
    const fallbackId = normalizedRaw?.id || project?.id || project?.num || (normalizedRaw?.title ? `local-${String(normalizedRaw.title).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64)}` : null);
    if (!fallbackId) return;
    const normalized = { ...normalizedRaw, id: fallbackId };
    setSelectedProjectInitialTab(opts?.tab || 'overview');
    setSelectedProjectId(fallbackId);
    setSelectedProjectFallback(normalized);
    setView("detail");
  };

  const openProjectBidReview = (project) => {
    const normalized = normalizeProjectEntity(project);
    if (!normalized?.id) return;
    if (!canManageProjectWithRole(role, currentUser, normalized)) {
      showToast && showToast("Only the posting church can review bids for this project.", "error");
      openProject(normalized);
      return;
    }
    setSelectedProjectId(normalized.id);
    setSelectedProjectFallback(normalized);
    fetchBids(normalized.id, normalized);
    setView("bids");
  };

  const clearSelectedProject = () => {
    setSelectedProjectId(null);
    setSelectedProjectFallback(null);
    setSelectedProjectInitialTab('overview');
  };

  useEffect(() => {
    const target = getPendingProjectTarget();
    const targetId = target?.projectId;
    const targetTitle = String(target?.projectTitle || '').trim().toLowerCase();
    if (!(targetId || targetId === 0) && !targetTitle) return;
    const targetWantsBidReview = String(target?.tab || '').toLowerCase() === 'bids';
    if ((targetId || targetId === 0) && selectedProjectId && String(selectedProjectId) === String(targetId)) {
      clearPendingProjectTarget();
      if (targetWantsBidReview && selectedProject) openProjectBidReview(selectedProject);
      return;
    }
    const found = projectPools.find(p => {
      const normalized = normalizeProjectEntity(p) || p || {};
      const idMatch = (targetId || targetId === 0) && String(normalized?.id ?? p?.id ?? p?.num ?? "") === String(targetId);
      const titleMatch = targetTitle && String(normalized?.title || p?.title || '').trim().toLowerCase() === targetTitle;
      return idMatch || titleMatch;
    });
    if (found) {
      clearPendingProjectTarget();
      if (targetWantsBidReview) openProjectBidReview(found);
      else openProject(found, { tab: target?.tab || 'overview' });
      return;
    }
    if (!(targetId || targetId === 0)) {
      clearPendingProjectTarget();
      setView('board');
      return;
    }
    let cancelled = false;
    (async()=>{
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("id,church_id,title,description,church_name,city,project_city,project_state,project_place_id,hired_at,work_started_at,work_started_by,completion_requested_at,completion_requested_by,completed_at,completed_by,category,primary_category,category_tags,budget,budget_min,budget_max,delivery_preference,timeline,status,posted_at,urgent,scope,hired_vendor_id,hired_vendor_name,hired_bid_id,amount")
          .eq("id", targetId)
          .maybeSingle();
        if (!cancelled && data) {
          clearPendingProjectTarget();
          if (targetWantsBidReview) openProjectBidReview(data);
          else openProject(data, { tab: target?.tab || 'overview' });
          return;
        }
        if (!cancelled) {
          if (error) logError('deep-link-project-fetch-empty', error, { projectId: targetId });
          clearPendingProjectTarget();
          if (targetWantsBidReview) {
            setView('board');
            if (typeof showToast === 'function') showToast("Couldn't load that bid review. Please try again.", 'error');
          } else {
            openProject({ id: targetId, title: target?.projectTitle || 'Project', status: 'draft' }, { tab:'overview' });
            if (typeof showToast === 'function') showToast(error ? "Couldn't load full project details." : 'Opening project…', error ? 'error' : undefined);
          }
        }
      } catch(err){
        if (!cancelled) {
          logError('deep-link-project-fetch', err, { projectId: targetId });
          clearPendingProjectTarget();
          if (targetWantsBidReview) {
            setView('board');
            if (typeof showToast === 'function') showToast("Couldn't load that bid review. Please try again.", 'error');
          } else {
            openProject({ id: targetId, title: target?.projectTitle || 'Project', status: 'draft' }, { tab:'overview' });
            if (typeof showToast === 'function') showToast("Couldn't load full project details.", 'error');
          }
        }
      }
    })();
    return () => { cancelled = true; };
  }, [projectPools, selectedProjectId]);

  useEffect(() => {
    const pendingVendor = getPendingVendorTarget();
    if (!pendingVendor?.id || selectedVendorProfile) return;
    clearPendingVendorTarget();
    openVendorProfile(pendingVendor);
  }, [selectedVendorProfile]);

  const patchProjectEverywhere = (projectId, patch) => {
    if (!projectId) return;
    const apply = (list = []) => list.map(item => {
      const normalized = normalizeProjectEntity(item);
      if (String(normalized?.id ?? "") !== String(projectId)) return item;
      return { ...item, ...patch };
    });
    setProjects(prev => apply(prev));
    setMyActiveProjects(prev => apply(prev));
    setSelectedProjectFallback(prev => prev && String(prev.id ?? "") === String(projectId) ? normalizeProjectEntity({ ...prev, ...patch }) : prev);
  };

  const handleVendorProfileBack = () => {
    const returnTarget = getReturnNavigationTarget(readReturnContext(), 'vendors');
    setSelectedVendorProfile(null);
    if (returnTarget?.screen === 'compare') {
      setView('board');
      nav('activity');
      return;
    }
    if (returnTarget?.screen === 'activity') {
      setView('board');
      nav('activity');
      return;
    }
    if (returnTarget?.screen === 'projects' && returnTarget?.projectId) {
      setView('board');
      setPendingProjectTarget({ projectId: returnTarget.projectId, screen:'projects', tab: returnTarget?.tab || 'overview' });
      nav('projects');
      return;
    }
    setView('board');
  };

  // Marketplace tab source of truth: church accounts default to the vendor floor,
  // vendor accounts default to the open-project floor. Parent nav state still wins
  // when a specific sub-tab is requested.
  const defaultMarketplaceProjectTab = (role === "church" || role === "individual") ? "vendors" : "browse";
  const [localProjectTab, setLocalProjectTab] = useState(forceProjectTab || navSubTab || defaultMarketplaceProjectTab);
  useEffect(() => {
    setLocalProjectTab(forceProjectTab || navSubTab || defaultMarketplaceProjectTab);
  }, [forceProjectTab, navSubTab, defaultMarketplaceProjectTab]);
  const rawProjectTab = forceProjectTab || navSubTab || localProjectTab || defaultMarketplaceProjectTab;
  const normalizedProjectTab = rawProjectTab === "shortlist" ? defaultMarketplaceProjectTab : rawProjectTab;
  const projectTab = role === "vendor" && normalizedProjectTab === "vendors" ? "browse" : normalizedProjectTab;
  // V808: keep previously visited marketplace panels warm instead of destroying
  // and rebuilding them on every tab click. First load stays lean; panels only
  // mount after the user visits them once.
  const [visitedProjectTabs, setVisitedProjectTabs] = useState(() => new Set([projectTab]));
  useEffect(() => {
    setVisitedProjectTabs(prev => {
      if (prev.has(projectTab)) return prev;
      const next = new Set(prev);
      next.add(projectTab);
      return next;
    });
  }, [projectTab]);
  const setProjectTab = (tab) => {
    const requestedTab = tab === "shortlist" ? defaultMarketplaceProjectTab : (tab || defaultMarketplaceProjectTab);
    const safeTab = role === "vendor" && requestedTab === "vendors" ? "browse" : requestedTab;
    setLocalProjectTab(safeTab);
    if (onSubTabChange) onSubTabChange(safeTab === defaultMarketplaceProjectTab ? null : safeTab);
  };

  useEffect(() => {
    const pendingVendor = getPendingVendorTarget();
    if (pendingVendor?.source !== "founder-coverage-action") return;
    clearPendingVendorTarget();
    setFounderCoverageContext(pendingVendor);
    setSelectedVendorProfile(null);
    setView("board");
    setProjectTab("vendors");
    setVisitedProjectTabs(prev => {
      if (prev.has("vendors")) return prev;
      const next = new Set(prev);
      next.add("vendors");
      return next;
    });
    if (typeof showToast === "function") {
      const label = pendingVendor?.category || pendingVendor?.projectTitle || "coverage gap";
      showToast(`Opening vendor directory for ${label}`);
    }
  }, [projectTab]);

  const resetMarketplaceSurface = () => {
    setView("board");
    clearSelectedProject();
    setSelectedVendorProfile(null);
    setSelectedSample(null);
    setPostSuccess(false);
    setBidSuccess(false);
    setStripeModal(null);
    setBidAcceptedModal(null);
    setConfirmModal(null);
  };

  // 852am: App-level CTA navigation can change only the parent tab state.
  // This internal event makes sure the already-mounted ProjectsScreen does not
  // stay visually stuck on a prior project detail, vendor profile, or bid review.
  useEffect(() => {
    const handler = () => resetMarketplaceSurface();
    document.addEventListener("kb:marketplace-reset-surface", handler);
    return () => document.removeEventListener("kb:marketplace-reset-surface", handler);
  }, []);

  // If parent nav clears back to browse, make sure the marketplace returns to
  // the board-level surface instead of staying stuck in a detail view.
  // 852bj: do not treat the Post Project form as a stale marketplace surface.
  // Inbox/command CTAs intentionally navigate to projects:post with navSubTab=null;
  // this guard prevents the mount-time navSubTab effect from flashing the form
  // and immediately resetting it back to the Marketplace board.
  useEffect(() => {
    if (navSubTab !== null || view === "board" || view === "post") return;
    resetMarketplaceSurface();
  }, [navSubTab]);

  useEffect(() => {
    fetchProjects();
    // Check vendor verification status
    if (role === "vendor") {
      Promise.resolve(currentUser ? { data: { user: currentUser } } : { data: { user: null } }).then(async ({data: authData}) => {
        const user = authData?.user;
        if (!user) return;
        const {data} = await supabase.from("vendors").select("verified").eq("user_id", user.id).maybeSingle();
        setVendorVerified(data?.verified === true);
      });
    }
    // Real-time: new projects inserted by anyone → debounced refresh (avoids one refresh per row in a bulk operation)
    let refreshTimer = null;
    const debouncedRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        fetchProjects({ force: true, background: true });
        fetchMyActiveProjects({ force: true, background: true });
        if (role === "vendor") fetchMyBids({ force: true, background: true });
      }, 3000);
    };
    const projectSub = kbTrackChannel(supabase
      .channel("projects-board"))
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "projects",
      }, debouncedRefresh)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "projects",
      }, debouncedRefresh)
      .subscribe();

    // Real-time: notify church when a new bid arrives on their projects
    const bidSub = supabase
      .channel("new-bids")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "bids",
      }, async payload => {
        const user = currentUser;
        if (!user) return;
        const { data: proj } = await supabase
          .from("projects").select("church_id, title").eq("id", payload.new.project_id).maybeSingle();
        if (proj?.church_id === user.id) {
          showToast(`New bid on "${proj.title}" from ${payload.new.vendor_name}`);
          debouncedRefresh();
        }
      })
      .subscribe();
    return () => { if (refreshTimer) clearTimeout(refreshTimer); projectSub.unsubscribe(); bidSub.unsubscribe(); };
  }, [currentUser?.id, role]);

  // Pre-load my work data on mount so tabs are warm, but never refetch
  // blindly. The guarded fetchers below keep cached data visible and only hit
  // Supabase when the data is missing, stale, or explicitly forced.
  useEffect(() => {
    if (!currentUser?.id) return;
    if (role === "vendor") {
      fetchMyBids({ background: true });
      fetchMyActiveProjects({ background: true });
    }
    if (role === "church" || role === "individual") {
      fetchMyActiveProjects({ background: true });
    }
  }, [role, currentUser?.id]);

  const fetchBids = async (projectId, projectContext = null) => {
    if (!projectId) return;
    const projectForAuth = normalizeProjectEntity(projectContext) || selectedProject || selectedProjectFallback || projectPools.find(p => String(p?.id ?? "") === String(projectId)) || { id: projectId };
    if (!canManageProjectWithRole(role, currentUser, projectForAuth)) {
      setBids([]);
      setBidFetchError(null);
      setLoadingBids(false);
      showToast && showToast("Only the posting church can review bids for this project.", "error");
      return;
    }
    setBidFetchError(null);
    setLoadingBids(true);
    try {
    // 0173 — Keep this select aligned to the live public.bids schema.
    // The legacy `message` column no longer exists; selecting it caused
    // PostgREST to reject the entire query and the UI to falsely show
    // "Waiting for bids" even when authoritative bid rows existed.
    const { data, error } = await supabase
      .from("bids")
      .select("id,project_id,vendor_id,vendor_user_id,vendor_name,vendor_emoji,category,amount,cover_letter,timeline,milestones,status,created_at,submitted_at,church_id")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) {
      logError("fetch-bids-response", error, { projectId });
      setBids([]);
      setBidFetchError(error);
      return;
    }
    if (data) {
      // Batch-fetch vendor ratings in a single query instead of one per bid
      const vendorIds = [...new Set(data.map(b => b.vendor_id).filter(Boolean))];
      let vendorMap = {};
      if (vendorIds.length) {
        const { data: vendors } = await supabase
          .from("vendors")
          .select("user_id,rating,reviews_count,verified")
          .in("user_id", vendorIds);
        if (vendors) {
          vendors.forEach(v => { vendorMap[v.user_id] = v; });
        }
      }
      const enriched = data.map(b => {
        const v = vendorMap[b.vendor_id] || {};
        return {
          id: b.id,
          vendor: b.vendor_name || "Unknown Vendor",
          emoji: b.vendor_emoji || "",
          category: b.category || "",
          amount: Number(b.amount) || 0,
          status: b.status || "pending",
          timeline: b.timeline || "",
          note: b.cover_letter || "",
          milestones: Array.isArray(b.milestones) ? b.milestones : [],
          submitted_at: b.submitted_at || b.created_at || null,
          rating: v.rating || 5.0,
          verified: !!v.verified,
          reviews: v.reviews_count || 0,
          hired: b.status === "hired",
          declined: b.status === "declined",
          vendor_id: b.vendor_id,
        };
      });
      setBids(enriched);
      setBidFetchError(null);
    } else {
      setBids([]);
      setBidFetchError(null);
    }
    } catch (err) {
      logError("fetch-bids", err, { projectId });
      setBids([]);
      setBidFetchError(err);
    } finally {
      setLoadingBids(false);
    }
  };

  const fetchMyBids = async ({ force = false, background = false } = {}) => {
    const user = currentUser;
    if (!user) return;

    const hasFetched = myBidsFetchedAtRef.current > 0;
    const isFresh = Date.now() - myBidsFetchedAtRef.current < PROJECTS_NAV_CACHE_TTL_MS;
    if (!force && hasFetched && isFresh) return;
    if (myBidsInFlightRef.current) return;

    myBidsInFlightRef.current = true;
    const canKeepVisible = hasFetched || (Array.isArray(myBids) && myBids.length > 0);
    if (!background || !canKeepVisible) setLoadingMyBids(true);
    try {
    const { data, error } = await supabase
      .from("bids")
      .select("*, projects(id, title, description, church_name, city, project_city, project_state, project_place_id, hired_at,work_started_at,work_started_by,completion_requested_at,completion_requested_by,completed_at,completed_by, budget, budget_min, budget_max, delivery_preference, status, skills, requirements, category, primary_category, category_tags)")
      .eq("vendor_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setMyBids(data);
      myBidsFetchedAtRef.current = Date.now();
    } else if (error) {
      logError("fetch-my-bids-response", error, { userId: user.id });
    }
    } catch (err) {
      logError("fetch-my-bids", err);
    } finally {
      myBidsInFlightRef.current = false;
      setLoadingMyBids(false);
    }
  };

  const mapProject = (p) => ({
    id: p.id,
    church_id: p.church_id || null,
    title: p.title || "",
    church: p.church_name || "Ministry",
    city: p.project_city || p.city || "",
    project_city: p.project_city || p.city || "",
    project_state: p.project_state || "",
    primary_category: p.primary_category || p.category || "",
    category: p.primary_category || p.category || "",
    category_tags: Array.isArray(p.category_tags) ? p.category_tags : [],
    icon: p.icon || "",
    budget: p.budget || "",
    budget_min: p.budget_min || null,
    budget_max: p.budget_max || null,
    delivery_preference: p.delivery_preference || "",
    timeline: p.timeline || "",
    bids: p.bids_count || 0,
    status: p.status || "draft",
    urgent: p.urgent || false,
    posted: p.posted_at ? new Date(p.posted_at).toLocaleDateString() : "//",
    desc: p.description || "",
    skills: p.skills || [],
    requirements: p.requirements || [],
    scope: p.scope || "",
    hired_vendor_id: p.hired_vendor_id || null,
    hired_vendor_name: p.hired_vendor_name || "",
    hired_bid_id: p.hired_bid_id || null,
    hired_at: p.hired_at || null,
    work_started_at: p.work_started_at || null,
    work_started_by: p.work_started_by || null,
    completion_requested_at: p.completion_requested_at || null,
    completion_requested_by: p.completion_requested_by || null,
    completed_at: p.completed_at || null,
    completed_by: p.completed_by || null,
    amount: p.amount || null,
  });

  const PROJECTS_PAGE_SIZE = 50;
  const PROJECTS_HARD_CEILING = 1000; // safety cap; past this, vendor needs filters, not more pages

  // Run a keyset-paginated fetch and return the rows + the next cursor.
  // Extracted from fetchProjects so the initial load and load-more share
  // exactly the same query construction. Pulling them apart was the bug
  // surface in the previous version of this code (an off-by-one in the
  // initial `.limit()` would silently truncate the marketplace).
  const fetchOpenProjectsPage = async (cursor = null) => {
    let query = supabase
      .from("projects")
      .select("id,title,description,category,primary_category,category_tags,budget,budget_min,budget_max,delivery_preference,timeline,status,church_id,church_name,city,project_city,project_state,project_place_id,hired_at,work_started_at,work_started_by,completion_requested_at,completion_requested_by,completed_at,completed_by,posted_at,urgent,bids_count,scope,skills,requirements")
      .eq("status", "open")
      .order("posted_at", { ascending: false })
      .limit(PROJECTS_PAGE_SIZE);
    if (cursor) query = query.lt("posted_at", cursor);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data || []).map(mapProject);
    // The last row's posted_at becomes the next cursor. Defensive: if a row
    // has no posted_at (legacy data), don't set a cursor — we'd loop.
    const nextCursor = rows.length > 0 ? (rows[rows.length - 1]?.posted_at || null) : null;
    return { rows, nextCursor, exhausted: rows.length < PROJECTS_PAGE_SIZE };
  };

  const fetchProjects = async ({ force = false, background = false } = {}) => {
    const hasFetched = projectsFetchedAtRef.current > 0;
    const isFresh = Date.now() - projectsFetchedAtRef.current < PROJECTS_NAV_CACHE_TTL_MS;
    if (!force && hasFetched && isFresh) return;
    if (projectsInFlightRef.current) return;

    projectsInFlightRef.current = true;
    const canKeepVisible = hasFetched || (Array.isArray(projects) && projects.length > 0);
    if (!background || !canKeepVisible) setLoading(true);
    setProjectsCursor(null);
    setHasMoreProjects(true);
    try {
      // Marketplace browse: only open projects are biddable, so filter at the
      // server. Keyset-paginated by posted_at desc (replaces the prior
      // hardcoded .limit(200) cap). Vendors who scroll past the first batch
      // get the next batch via loadMoreProjects, called from ProjectBoard's
      // IntersectionObserver. Stops at PROJECTS_HARD_CEILING.
      const { rows, nextCursor, exhausted } = await cachedQuery(
        'projects-board',
        () => fetchOpenProjectsPage(null),
        { ttl: 30000 }
      );
      setProjects(rows);
      setProjectsCursor(nextCursor);
      setHasMoreProjects(!exhausted);
      projectsFetchedAtRef.current = Date.now();
    } catch (error) {
      if (!isSupabaseAuthLockAbort(error)) {
        logError("fetch-projects", error);
        showToast("Couldn't load projects — please refresh.", "error");
      }
    } finally {
      projectsInFlightRef.current = false;
      setLoading(false);
    }
  };

  const loadMoreProjects = async () => {
    // Re-entry guard: the IntersectionObserver can fire rapidly as the
    // sentinel scrolls in/out of view during layout reflow. Without this
    // guard, a slow network would let 3-4 fetches stack up before the first
    // returns, then dedupe-or-not problems compound.
    if (loadingMoreProjects || !hasMoreProjects || !projectsCursor) return;
    if (projects.length >= PROJECTS_HARD_CEILING) {
      setHasMoreProjects(false);
      return;
    }
    setLoadingMoreProjects(true);
    try {
      const { rows, nextCursor, exhausted } = await fetchOpenProjectsPage(projectsCursor);
      // De-dupe by id. If two rows share posted_at across the cursor
      // boundary, the cursor strategy may re-fetch the boundary row.
      // Cheaper to filter than to use a compound (posted_at, id) cursor.
      setProjects(prev => {
        const seen = new Set(prev.map(p => String(p.id)));
        const fresh = rows.filter(r => !seen.has(String(r.id)));
        return [...prev, ...fresh];
      });
      setProjectsCursor(nextCursor);
      setHasMoreProjects(!exhausted);
    } catch (error) {
      if (!isSupabaseAuthLockAbort(error)) {
        logError("fetch-projects-more", error);
        showToast("Couldn't load more projects.", "error");
      }
    } finally {
      setLoadingMoreProjects(false);
    }
  };

  const fetchMyActiveProjects = async ({ force = false, background = false } = {}) => {
    const user = currentUser;
    if (!user) return;

    const hasFetched = myProjectsFetchedAtRef.current > 0;
    const isFresh = Date.now() - myProjectsFetchedAtRef.current < PROJECTS_NAV_CACHE_TTL_MS;
    if (!force && hasFetched && isFresh) return;
    if (myProjectsInFlightRef.current) return;

    myProjectsInFlightRef.current = true;
    const canKeepVisible = hasFetched || (Array.isArray(myActiveProjects) && myActiveProjects.length > 0);
    if (!background || !canKeepVisible) setLoadingMyProjects(true);
    setMyProjectsFetchError(false);
    try {
    if (role === "vendor") {
      // Vendor: fetch projects where they have a hired bid and normalize them
      // to project-shaped rows so selection/detail state stays stable.
      const { data: wonBids, error: wonBidsError } = await runSupabaseWithTimeout(
        supabase
          .from("bids")
          .select("id,vendor_id,vendor_name,timeline,amount,status,projects(id,church_id,title,description,church_name,city,project_city,project_state,project_place_id,hired_at,work_started_at,work_started_by,completion_requested_at,completion_requested_by,completed_at,completed_by,category,primary_category,category_tags,budget,budget_min,budget_max,delivery_preference,timeline,status,posted_at,urgent,scope,skills,requirements)")
          .eq("vendor_id", user.id)
          .eq("status", "hired"),
        "My vendor projects",
        4500
      );
      if (wonBidsError) throw wonBidsError;
      const normalizedWonProjects = (wonBids || []).map(b => {
        const proj = b.projects || {};
        return {
          id: proj.id || null,
          church_id: proj.church_id || null,
          title: proj.title || "",
          description: proj.description || "",
          church_name: proj.church_name || "Ministry",
          city: proj.project_city || proj.city || "",
          project_city: proj.project_city || proj.city || "",
          project_state: proj.project_state || "",
          primary_category: proj.primary_category || proj.category || "",
          category: proj.primary_category || proj.category || "",
          category_tags: Array.isArray(proj.category_tags) ? proj.category_tags : [],
          budget: proj.budget || "",
          budget_min: proj.budget_min || null,
          budget_max: proj.budget_max || null,
          delivery_preference: proj.delivery_preference || "",
          timeline: b.timeline || proj.timeline || "",
          status: proj.status || "hired",
          posted_at: proj.posted_at || null,
          urgent: !!proj.urgent,
          scope: proj.scope || "",
          skills: Array.isArray(proj.skills) ? proj.skills : [],
          requirements: Array.isArray(proj.requirements) ? proj.requirements : [],
          hired_bid_id: b.id,
          hired_vendor_id: b.vendor_id || null,
          hired_vendor_name: b.vendor_name || "",
          hired_at: proj.hired_at || null,
          work_started_at: proj.work_started_at || null,
          work_started_by: proj.work_started_by || null,
          completion_requested_at: proj.completion_requested_at || null,
          completion_requested_by: proj.completion_requested_by || null,
          completed_at: proj.completed_at || null,
          completed_by: proj.completed_by || null,
          amount: b.amount || null,
        };
      }).filter(p => p.id);
      setMyActiveProjects(normalizedWonProjects);
      myProjectsFetchedAtRef.current = Date.now();
      setMyProjectsFetchError(false);
    } else {
      // Church: fetch their own projects and stitch the hired vendor onto each row
      const [projectsRes, hiredRes, bidRowsRes] = await runSupabaseWithTimeout(
        Promise.all([
          supabase
            .from("projects")
            .select("id,title,description,category,primary_category,category_tags,budget,budget_min,budget_max,delivery_preference,timeline,status,church_id,church_name,city,project_city,project_state,project_place_id,hired_at,work_started_at,work_started_by,completion_requested_at,completion_requested_by,completed_at,completed_by,posted_at,urgent,bids_count,scope,skills,requirements")
            .eq("church_id", user.id)
            .order("posted_at", { ascending: false }),
          supabase
            .from("bids")
            .select("project_id,vendor_id,vendor_name")
            .eq("church_id", user.id)
            .eq("status", "hired"),
          // 0170 — projects.bids_count is legacy/cache data and is stale on
          // live church projects. Count the authoritative bids rows for the
          // church workspace so Review bid/Review bids affordances reflect
          // what actually exists.
          supabase
            .from("bids")
            .select("id,project_id,status")
            .eq("church_id", user.id),
        ]),
        "My church projects",
        4500
      );
      const data = projectsRes.data || [];
      const error = projectsRes.error || bidRowsRes.error;
      const hiredMap = {};
      (hiredRes.data || []).forEach(row => {
        if (!row?.project_id) return;
        hiredMap[row.project_id] = { hired_vendor_id: row.vendor_id || null, hired_vendor_name: row.vendor_name || "" };
      });
      const bidCountMap = {};
      (bidRowsRes.data || []).forEach(row => {
        if (!row?.project_id) return;
        const key = String(row.project_id);
        bidCountMap[key] = (bidCountMap[key] || 0) + 1;
      });
      if (error) {
        const quietTransient = isSupabaseAuthLockAbort(error) || isKbTimeoutError(error);
        if (!quietTransient) logError("my-active-projects-fetch-response", error, { userId: user.id });
        if (quietTransient) myProjectsFetchedAtRef.current = Date.now();
        setMyProjectsFetchError(!quietTransient);
      } else {
        setMyProjectsFetchError(false);
        setMyActiveProjects((data || []).map(project => {
          const exactBidCount = bidCountMap[String(project.id)] || 0;
          return { ...project, bids:exactBidCount, bids_count:exactBidCount, ...(hiredMap[project.id] || {}) };
        }));
        myProjectsFetchedAtRef.current = Date.now();
      }
    }
    } catch (err) {
      const quietTransient = isSupabaseAuthLockAbort(err) || isKbTimeoutError(err);
      if (!quietTransient) logError("my-active-projects-fetch", err);
      // Timed-out / auth-lock-contended My Projects should fail closed quietly and not retry-loop on tab clicks.
      if (quietTransient) myProjectsFetchedAtRef.current = Date.now();
      setMyProjectsFetchError(!quietTransient);
    } finally {
      myProjectsInFlightRef.current = false;
      setLoadingMyProjects(false);
    }
  };


  const handlePostProject = async (data) => {
    try {
      let user = currentUser || null;
      if (!user) user = await getCurrentUserSafe();
      if (!user) {
        showToast("You must be signed in to post a project.");
        return;
      }

      const { data: profile } = await selectProfilesSafe(
        "org_name, city",
        "id",
        query => query.eq("id", user.id).maybeSingle()
      );

      const insertPayload = buildProjectPostInsertPayload(data, { user, profile, role });
      // .select().single() gives us the real inserted row (id, created_at, defaults).
      // Without it, the optimistic record below uses a fake UUID and any user
      // who clicks it before fetchProjects() returns hits a 404.
      let { data: created, error } = await supabase
        .from("projects")
        .insert(insertPayload)
        .select()
        .single();
      // Graceful degrade: if this Supabase project's `projects` table is still
      // on the lean schema, drop non-core/flexible fields such as church_city,
      // attribution, scope, skills, remote, and timestamps, then retry once.
      // This fixes schema-cache errors like "Could not find the 'church_city'
      // column" without blocking the core project post.
      if (error && isMissingColumnError(error, PROJECT_POST_SCHEMA_FLEX_KEYS)) {
        const slim = stripProjectPostSchemaFlexFields(insertPayload);
        ({ data: created, error } = await supabase
          .from("projects")
          .insert(slim)
          .select()
          .single());
      }

      if (!error) {
        // Optimistically append using the REAL id, so the row is clickable
        // immediately. The `optimistic: true` flag is no longer set because
        // we have a real database row.
        const optimisticBase = buildOptimisticProjectRecord(data, { user, profile, role });
        const newProject = mapProject({ ...optimisticBase, ...created, optimistic: false });
        setSelectedProjectId(newProject.id);
        setSelectedProjectFallback(newProject);
        rememberProjectForVendorMatching(user.id, newProject, 'post_project_success');
        setProjects(prev => [newProject, ...prev]);
        rememberReturnContext({ source:'project-post-success', screen:'projects', subTab:'vendors', projectId:newProject.id, projectTitle:data.title, postedAt:new Date().toISOString() });
        updateProjectInteropEntry(newProject.id, prev => ({
          ...prev,
          saved: true,
          sourceContext: { ...(prev.sourceContext || {}), postedFrom:'post-project', highlighted:true, attribution: getActiveGroupAttribution('church') || prev.sourceContext?.attribution || null },
          attention: Array.from(new Set(['Waiting on first bids', ...(prev.attention || [])])).slice(0,8),
          notifications: [{ id:`post-${Date.now()}`, text:`${data.title} was saved as a draft and is ready for review`, tone:'success', createdAt:new Date().toISOString() }, ...(prev.notifications || [])].slice(0,12),
        }));

        // Trusted self-notification derived from the committed project row.
        const { error: notifError } = await createTrustedNotificationSafe("project_posted", created?.id);
        if (notifError) logError("project-post-notification", notifError);

        // Refresh in the background to pick up server-computed fields
        // (counters, joined data). The user can already see and click their
        // project — fetchProjects just reconciles.
        invalidateCache('projects-board');
        fetchProjects({ force: true, background: true }).catch(err => logError("project-post-refresh", err));
        fetchMyActiveProjects({ force: true, background: true }).catch(err => logError("project-post-my-projects-refresh", err));
        setPostSuccess(true);
        setSuccessMoment({
          type: "project-posted",
          key: `project-posted-${Date.now()}`,
          project: newProject,
          projectTitle: newProject?.title || data?.title,
          budget: newProject?.budget || data?.budget,
          timeline: newProject?.timeline || data?.timeline,
        });
      } else {
        logError("project-post-insert", error, { role, userId: user?.id || null, title: data?.title || null });
        const msg = String(error?.message || "");
        if (/row-level security|permission|not authorized|violates/i.test(msg)) {
          showToast("Couldn't post project — your church account may not have permission yet. Sign out/in and try again.", "error");
        } else {
          showToast("Couldn't post project — please try again.", "error");
        }
      }
    } catch (err) {
      showToast("Something went wrong. Please try again.", "error");
      // handlePostProject caught error
    }
  };

  const handleAcceptBid = (bidId) => {
    const bid = bids.find(b => b.id === bidId);
    if (!bid) return;
    if (!canManageProjectWithRole(role, currentUser, selectedProject || selectedProjectFallback || {})) {
      showToast("Only the posting church can accept bids on this project.", "error");
      return;
    }
    if (bids.some(b => (b.hired || b.status === "hired") && String(b.id) !== String(bidId))) {
      showToast("This project already has a hired vendor.");
      return;
    }
    // Integrated Stripe is not live yet, but every hire must still pass through
    // the payment/fee confirmation step. Do not call confirmHire directly here —
    // that silently marks a vendor hired without the church acknowledging the
    // manual payment-coordination state and FaithBid fee record.
    setStripeModal({ bid, project: selectedProject || selectedProjectFallback || {} });
  };

  const confirmHire = async (bidId) => {
    if (hireInFlightRef.current) return;
    const bid = bids.find(b => b.id === bidId);
    if (!bid) return;
    if (!selectedProject?.id) { showToast("Project context lost — reopen the project"); return; }
    if (!canManageProjectWithRole(role, currentUser, selectedProject || selectedProjectFallback || {})) {
      showToast("Only the posting church can accept bids on this project.", "error");
      return;
    }
    hireInFlightRef.current = true;
    setStripeModal(null);

    // Snapshot the pre-flip state so we can revert cleanly if the DB rejects us.
    const prevBids = bids;
    const prevModal = bidAcceptedModal;

    // Keep the card response optimistic, but do not show a success/Deal Room
    // destination until confirm_hire has actually committed. A pre-commit
    // success modal could race the server-created conversation.
    setBids(b=>b.map(x=>x.id===bidId?{...x,hired:true}:{...x,declined:!x.hired}));
    const acceptedMomentProject = selectedProject || selectedProjectFallback || {};

    try {
      // One atomic server-side operation. See confirm_hire() in 01_rls_policies.sql.
      // The RPC:
      //   * verifies caller owns the project
      //   * marks the bid hired, declines the rest, flips project status
      //   * creates/updates the conversation
      //   * writes notifications to winning + declined vendors
      // All in one transaction — any failure rolls everything back.
      const { data, error } = await supabase.rpc('confirm_hire', {
        p_bid_id: bidId,
        p_project_id: selectedProject.id,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Hire was not confirmed by the server.");

      // Sync local caches and only now surface the committed success moment.
      const confirmedProject = { ...acceptedMomentProject, ...(data?.project || {}), status:'hired' };
      const confirmedBid = { ...bid, hired:true, status:'hired' };
      patchProjectEverywhere(selectedProject.id, confirmedProject);
      setBidAcceptedModal(buildBidAcceptedModalState(confirmedBid, confirmedProject));
      setSuccessMoment({
        type: "bid-accepted",
        key: `bid-accepted-${Date.now()}`,
        project: confirmedProject,
        projectTitle: confirmedProject?.title || selectedProject?.title,
        conversationId: data?.conversation_id || null,
        bid: confirmedBid,
        amount: confirmedBid?.amount,
        vendorId: confirmedBid?.vendor_id,
        vendorName: confirmedBid?.vendor_name || confirmedBid?.name,
      });
      invalidateCache('projects-board');
      invalidateCache('vendors-all');
    } catch (err) {
      logError("confirm-hire", err, { bidId, projectId: selectedProject?.id });
      // Revert optimistic UI
      setBids(prevBids);
      setBidAcceptedModal(prevModal);
      setSuccessMoment(null);
      const msg = String(err?.message || "");
      if (msg.includes("already hired")) showToast("This project was already marked hired.");
      else if (msg.includes("not authorized")) showToast("Only the posting church can accept bids on this project.");
      else showToast("Couldn't complete hire. Please try again.", "error");
    } finally {
      hireInFlightRef.current = false;
    }
  };
  const handleDeclineBid = async (bidId) => {
    const bid = bids.find(b => b.id === bidId);
    if (!bid) return;
    if (!canManageProjectWithRole(role, currentUser, selectedProject || selectedProjectFallback || {})) {
      showToast("Only the posting church can decline bids on this project.", "error");
      return;
    }
    setBids(b=>b.map(x=>x.id===bidId?{...x,declined:true}:x));
    try {
      const { error } = await supabase.rpc("marketplace_service_mutate_bid", { p_bid_id: bidId, p_action: "decline" });
      if (error) throw error;
      showToast("Bid declined.");
      // Recipient and copy are derived from the committed declined bid.
      if (bid?.vendor_id) {
        try {
          const { error: notificationError } = await createTrustedNotificationSafe("bid_declined", bidId);
          if (notificationError) throw notificationError;
        } catch (notifErr) { logError("decline-notify", notifErr, { bidId }); }
      }
    } catch (err) {
      logError("decline-bid", err, { bidId });
      // Revert optimistic state so the UI matches reality.
      setBids(b=>b.map(x=>x.id===bidId?{...x,declined:false}:x));
      showToast("Couldn't decline bid. Please try again.", "error");
    }
  };
  const reset = () => {
    const returnTarget = getReturnNavigationTarget(readReturnContext(), 'projects');
    clearSelectedProject();
    setPostSuccess(false);
    setBidSuccess(false);
    if (view === "detail" && returnTarget?.screen === 'compare') {
      setView("board");
      nav('activity');
      return;
    }
    if (view === "detail" && returnTarget?.screen === 'activity') {
      setView("board");
      nav('activity');
      return;
    }
    setView("board");
    // Don't clear navSubTab // let the user stay on whatever tab they came from
  };

  const goToPostProject = () => {
    clearSelectedProject();
    setSelectedVendorProfile(null);
    setBidSuccess(false);
    setPostSuccess(false);
    setView("post");
  };

  const safeOpenProject = (project) => {
    const normalized = normalizeProjectEntity(project) || project;
    if (!normalized) return;
    openProject(normalized);
  };

  const handleProjectDetailNav = (target, ...args) => {
    const next = String(target || '').toLowerCase();
    const wantsMarketplace = next === 'marketplace' || next === 'projects' || next === 'browse' || next === 'project-marketplace';
    if (wantsMarketplace) {
      // Marketplace means the marketplace floor, not whatever return context
      // may have been stored by Activity, Compare, Inbox, or a project detail rail.
      // Keep this path functional-only so it cannot unexpectedly redesign cards/header UI.
      try { clearReturnContext(); } catch {}
      try { clearPendingProjectTarget(); } catch {}
      try { clearPendingVendorTarget(); } catch {}
      resetMarketplaceSurface();
      setProjectTab(defaultMarketplaceProjectTab);
      if (typeof nav === 'function') {
        try { nav('marketplace'); } catch (e) { if (kbIsDevRuntime()) console.warn('[kb] handleProjectDetailNav: marketplace fallback navigation failed', e); }
      }
      return;
    }
    if (typeof nav === 'function') return nav(target, ...args);
  };

  const openVendorProfile = (vendor) => {
    const seeded = buildVendorProfileSeed(vendor);
    setSelectedVendorProfile(seeded);
    setView('vendorProfile');
  };

  // V809 PERF: stable callback bridge for warm tab panels. Without this, hidden
  // but mounted panels still re-render on every tab switch because inline
  // handlers change identity. Keep the live implementation in refs and pass
  // stable wrappers to memoized panels.
  const fetchMyActiveProjectsLatestRef = useRef(null);
  const fetchMyBidsLatestRef = useRef(null);
  const loadMoreProjectsLatestRef = useRef(null);
  const setProjectTabLatestRef = useRef(null);
  const safeOpenProjectLatestRef = useRef(null);
  const goToPostProjectLatestRef = useRef(null);
  const openProjectBidReviewLatestRef = useRef(null);
  const openVendorProfileLatestRef = useRef(null);

  fetchMyActiveProjectsLatestRef.current = fetchMyActiveProjects;
  fetchMyBidsLatestRef.current = fetchMyBids;
  loadMoreProjectsLatestRef.current = loadMoreProjects;
  setProjectTabLatestRef.current = setProjectTab;
  safeOpenProjectLatestRef.current = safeOpenProject;
  goToPostProjectLatestRef.current = goToPostProject;
  openProjectBidReviewLatestRef.current = openProjectBidReview;
  openVendorProfileLatestRef.current = openVendorProfile;

  const handleTabSwitchStable = useCallback((tab) => {
    kbPerfMark("projects-tab-click", { from: projectTab, target: tab || "" });
    resetMarketplaceSurface();
    setProjectTabLatestRef.current?.(tab);
    if (tab === "mine") fetchMyActiveProjectsLatestRef.current?.({ background: true });
    if (tab === "work") {
      fetchMyBidsLatestRef.current?.({ background: true });
      fetchMyActiveProjectsLatestRef.current?.({ background: true });
    }
    kbPerfAfterPaint("projects-tab-painted", { target: tab || "" });
  }, [projectTab]);
  const goToPostProjectStable = useCallback((...args) => goToPostProjectLatestRef.current?.(...args), []);
  const safeOpenProjectStable = useCallback((...args) => safeOpenProjectLatestRef.current?.(...args), []);
  const openProjectBidReviewStable = useCallback((...args) => openProjectBidReviewLatestRef.current?.(...args), []);
  const openVendorProfileStable = useCallback((...args) => openVendorProfileLatestRef.current?.(...args), []);
  const retryMyProjectsStable = useCallback(() => fetchMyActiveProjectsLatestRef.current?.({ force: true }), []);
  const setSelectedSampleStable = useCallback((project) => setSelectedSample(project), []);
  const myBidsRouteStable = useCallback(() => handleTabSwitchStable(role === "vendor" ? "work" : "mine"), [handleTabSwitchStable, role]);
  const browseProjectsStable = useCallback(() => handleTabSwitchStable("browse"), [handleTabSwitchStable]);
  const ensureMyWorkDataStable = useCallback((opts = {}) => {
    fetchMyBidsLatestRef.current?.(opts);
    fetchMyActiveProjectsLatestRef.current?.(opts);
  }, []);
  const loadMoreProjectsStable = useCallback(() => loadMoreProjectsLatestRef.current?.(), []);

  // Suggested vendors panel shown on the post-success screen. Fetches verified
  // vendors, scores them against the just-posted project using the rewritten
  // scoring function, filters out rejects, and shows the top 5 with an
  // "Invite" button that starts a conversation thread.
  const SuggestedVendorsAfterPost = ({ project, onInvite }) => {
    const [vendors, setVendors] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [inviting, setInviting] = React.useState({});
    const [invited, setInvited] = React.useState({});

    React.useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          const { data, error } = await selectVendorMatchesSafe({ limit: 40, verifiedOnly: true, timeoutMs: 3500 });
          if (error) throw error;
          if (cancelled) return;
          const list = Array.isArray(data) ? data : [];
          const scored = list
            .map(v => ({ vendor: v, score: scoreVendorAgainstProject(v, project) }))
            .filter(x => !x.score.rejected)
            .sort((a, b) => b.score.percent - a.score.percent)
            .slice(0, 5);
          setVendors(scored);
        } catch (err) {
          logError("suggested-vendors-fetch", err);
          setVendors([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, [project?.id]);

    const invite = async (vendorRow) => {
      if (!vendorRow?.user_id || !project?.id) return;
      setInviting(prev => ({ ...prev, [vendorRow.id]: true }));
      try {
        const user = await getCurrentUserSafe();
        if (!user) { showToast("Please sign in"); return; }
        await supabase.from("conversations").upsert({
          church_id: user.id,
          vendor_id: vendorRow.user_id,
          church_name: project?.church_name || project?.org_name || "",
          vendor_name: vendorRow.name || "",
          project_id: project.id,
          project_title: project.title || "",
          last_message: `Hi — I just posted this project and thought you'd be a strong fit. Happy to answer questions if the scope is interesting.`,
          last_message_at: new Date().toISOString(),
        }, { onConflict: "church_id,vendor_id,project_id" });
        setInvited(prev => ({ ...prev, [vendorRow.id]: true }));
        showToast(`Invited ${vendorRow.name}`);
        onInvite && onInvite(vendorRow);
      } catch (err) {
        logError("suggested-vendor-invite", err, { vendorId: vendorRow.id });
        showToast("Couldn't send invite — please try again.", "error");
      } finally {
        setInviting(prev => ({ ...prev, [vendorRow.id]: false }));
      }
    };

    if (loading) {
      return (
        <div style={{background:"#fff",borderRadius:"var(--r-lg)",border:"1.5px solid var(--border)",overflow:"hidden",marginBottom:24,textAlign:"left"}}>
          <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)",fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--text-muted)"}}>Suggested vendors for this project</div>
          <div style={{padding:"16px"}}><KBSkeleton variant="list" count={3} /></div>
        </div>
      );
    }
    if (!vendors || vendors.length === 0) return null;

    return (
      <div style={{background:"#fff",borderRadius:"var(--r-lg)",border:"1.5px solid var(--border)",overflow:"hidden",marginBottom:24,textAlign:"left"}}>
        <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--text-muted)"}}>Suggested vendors for this project</div>
            <div style={{fontSize:12,color:"var(--text-mid)",marginTop:4,fontWeight:400}}>Skip the wait — invite a strong-fit vendor to review your project directly.</div>
          </div>
        </div>
        {vendors.map(({ vendor: v, score }, i) => {
          const isInviting = inviting[v.id];
          const isInvited = invited[v.id];
          const initials = getInitialsSafe(v.name, "VN");
          const topReason = score.detailed?.fit?.reason || score.reasons?.fit || "";
          const fitLabel = score.tier==='strong' ? 'Strong fit' : score.tier==='good' ? 'Good fit' : score.tier==='watch' ? 'Possible fit' : 'Needs review';
          return (
            <div key={v.id} style={{display:"grid",gridTemplateColumns:"40px 1fr auto",gap:14,alignItems:"center",padding:"14px 20px",borderBottom:i<vendors.length-1?"1px solid var(--border)":"none"}}>
              <div style={{width:40,height:40,borderRadius:10,background:"linear-gradient(135deg, var(--gold), var(--gold-light))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>{initials}</div>
              <div style={{minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--navy)"}}>{v.name}</div>
                  <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:999,background:score.tier==="strong"?"rgba(34,197,94,0.12)":"rgba(176,136,64,0.12)",color:score.tier==="strong"?"#16a34a":"var(--gold-text)"}}>{fitLabel}</span>
                </div>
                <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {topReason}{v.city ? ` · ${v.city}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => invite(v)}
                disabled={isInviting || isInvited}
                style={{
                  padding:"8px 14px",
                  borderRadius:8,
                  border:"none",
                  background: isInvited ? "rgba(34,197,94,0.12)" : "linear-gradient(180deg, var(--gold, #c9a45c), var(--gold-dark, #b08840))",
                  color: isInvited ? "#16a34a" : "#fff",
                  fontSize:12,
                  fontWeight:700,
                  cursor: (isInviting || isInvited) ? "default" : "pointer",
                  opacity: isInviting ? 0.6 : 1,
                  whiteSpace:"nowrap",
                }}
              >
                {isInvited ? "✓ Invited" : isInviting ? "Sending…" : "Invite"}
              </button>
            </div>
          );
        })}
      </div>
    );
  };


  const closeSuccessMoment = () => setSuccessMoment(null);

  const openVendorMatchesForProject = (project = selectedProject || selectedProjectFallback) => {
    const normalized = normalizeProjectEntity(project);
    if (!normalized?.id) {
      showToast && showToast("Project context lost — reopen the project before browsing matches.", "error");
      return;
    }
    const churchUserId = String(firstNonEmpty(normalized.church_id, currentUser?.id, '')).trim();
    rememberProjectForVendorMatching(churchUserId, normalized, 'browse_vendors_after_post');
    setSelectedProjectId(normalized.id);
    setSelectedProjectFallback(normalized);
    setSelectedVendorProfile(null);
    setSelectedSample(null);
    setPostSuccess(false);
    setView("board");
    setProjectTab("vendors");
    resetMarketplaceSurface();
    if (typeof nav === 'function') {
      try { nav('vendors'); } catch { try { nav('projects'); } catch {} }
    }
  };

  const successMomentModal = (
    <SuccessMomentModal
      moment={successMoment}
      onClose={closeSuccessMoment}
      onPrimary={(moment) => {
        const type = moment?.type;
        setSuccessMoment(null);
        if (type === "project-posted" && moment?.project) {
          openProject(moment.project);
          return;
        }
        if (type === "bid-submitted") {
          openInboxThread(nav, {
            projectId: moment?.project?.id || selectedProject?.id || null,
            projectTitle: moment?.projectTitle || selectedProject?.title || null,
            churchId: moment?.project?.church_id || selectedProject?.church_id || null,
            churchName: moment?.project?.church_name || selectedProject?.church_name || selectedProject?.church || null,
            viewerRole: "vendor",
            createIfMissing: Boolean(moment?.project?.church_id || selectedProject?.church_id),
          });
          return;
        }
        if (type === "bid-accepted" || type === "vendor-hired") {
          const vendorId = moment?.vendorId || bidAcceptedModal?.vendor?.vendor_id || null;
          openInboxThread(nav, {
            conversationId: moment?.conversationId || null,
            projectId: moment?.project?.id || bidAcceptedModal?.project?.id || selectedProject?.id || null,
            projectTitle: moment?.projectTitle || bidAcceptedModal?.project?.title || selectedProject?.title || null,
            vendorId,
            vendorName: moment?.vendorName || bidAcceptedModal?.vendor?.name || null,
            createIfMissing: Boolean(vendorId),
          });
        }
      }}
      onSecondary={(moment) => {
        const type = moment?.type;
        setSuccessMoment(null);
        if (type === "project-posted" && moment?.project) {
          openVendorMatchesForProject(moment.project);
          return;
        }
        if (type === "bid-submitted") {
          setView("mybids");
          return;
        }
        if (type === "bid-accepted" || type === "vendor-hired") {
          setBidAcceptedModal(null);
          setView("detail");
        }
      }}
    />
  );

  if(view==="post" && !postSuccess) return (<PostProject onSubmit={handlePostProject} onBack={()=>{setView("board");if(onMounted)onMounted();}} role={role}/>);
  if(view==="post" && postSuccess) return (
    <>
    <div className="page" style={{padding:'24px 20px 64px'}}>
      {/* Top bar */}
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:20, maxWidth:680, margin:'0 auto 20px'}}>
        <button
          type="button"
          onClick={reset}
          style={{display:'inline-flex',alignItems:'center',gap:6,height:36, padding:'0 14px', borderRadius:999, border:'1px solid rgba(28,40,20,0.12)', background:'#fffdf8', fontSize:13, fontWeight:600, color:'#1C2814', cursor:'pointer', boxShadow:'0 1px 2px rgba(0,0,0,0.04)'}}
        >
          ← Projects
        </button>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:10, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#b08840'}}>
          Project posted
        </div>
      </div>

      <div style={{maxWidth:680, margin:'0 auto', animation:'fadeUp 0.5s ease'}}>
        {/* Hero banner */}
        <div style={{background:'#fff', border:'1px solid #dfd5c2', borderRadius:22, padding:'32px 28px', textAlign:'center', boxShadow:'0 7px 20px rgba(28,40,20,0.06)', marginBottom:20}}>
          <div style={{width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,#c9a45c,#b08840)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,color:'#fff',margin:'0 auto 18px',boxShadow:'0 8px 24px rgba(176,136,64,0.30)'}}>✦</div>
          <h1 style={{fontFamily:"'Newsreader','Playfair Display',Georgia,serif", fontSize:'clamp(24px,3.6vw,32px)', fontWeight:600, lineHeight:1.1, letterSpacing:'-0.025em', color:'#1C2814', margin:'0 0 10px'}}>
            Your project is live.
          </h1>
          <div style={{fontSize:14, color:'#565862', lineHeight:1.65, maxWidth:480, margin:'0 auto'}}>
            Faith-aligned vendors have been notified. Most projects get their first proposal within a few hours.
          </div>
        </div>

        {/* Suggested vendors panel */}
        <SuggestedVendorsAfterPost project={selectedProject} />

        {/* What happens next */}
        <div style={{background:'#fff', border:'1px solid #dfd5c2', borderRadius:22, overflow:'hidden', marginBottom:20, boxShadow:'0 7px 20px rgba(28,40,20,0.06)'}}>
          <div style={{padding:'14px 22px', borderBottom:'1px solid #efe7d9', background:'#fffdf8'}}>
            <div style={{fontFamily:'DM Mono,monospace', fontSize:10, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#b08840'}}>What happens next</div>
          </div>
          {[
            {num:'01',title:'Vendors review your project',body:'Marketplace Approved vendors in your category can see your posting and prepare bids when bidding is open.'},
            {num:'02',title:'Bids arrive in your dashboard',body:"You'll get a notification for each new bid. Review amounts, timelines, and cover letters side by side."},
            {num:'03',title:'Hire the right fit',body:'Message vendors, ask questions, then hit Hire. FaithBid records the deal and milestones.'},
            {num:'04',title:'Leave a review',body:"When the project wraps, we'll remind you to review your vendor. It helps the whole community."},
          ].map((s,i,arr)=>(
            <div key={s.num} style={{display:'grid', gridTemplateColumns:'56px 1fr', borderBottom: i < arr.length-1 ? '1px solid #efe7d9' : 'none'}}>
              <div style={{padding:'16px', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:18}}>
                <span style={{fontFamily:'DM Mono,monospace', fontSize:11, color:'#b08840', letterSpacing:'0.10em', fontWeight:700}}>{s.num}</span>
              </div>
              <div style={{padding:'16px 22px 16px 0'}}>
                <div style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif", fontSize:15.5, fontWeight:700, color:'#1C2814', marginBottom:4, letterSpacing:'-0.015em'}}>{s.title}</div>
                <div style={{fontSize:13, color:'#565862', lineHeight:1.6}}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap'}}>
          <button type="button" onClick={reset} style={{height:48, padding:'0 22px', borderRadius:12, border:'none', background:'linear-gradient(180deg,#c9a45c,#b08840)', fontSize:13, fontWeight:700, color:'#fff', cursor:'pointer', boxShadow:'0 1px 3px rgba(176,136,64,0.35)'}}>
            View my projects →
          </button>
          <button type="button" onClick={()=>openVendorMatchesForProject(selectedProject || selectedProjectFallback)} style={{height:48, padding:'0 18px', borderRadius:12, border:'1px solid rgba(28,40,20,0.12)', background:'#fff', fontSize:13, fontWeight:700, color:'#1C2814', cursor:'pointer'}}>
            Browse vendors
          </button>
          <button type="button" onClick={()=>queueActivityNavigation(nav, { projectId:selectedProject?.id || null, returnContext:{ source:'project-post-success', screen:'activity', projectId:selectedProject?.id || null } })} style={{height:48, padding:'0 18px', borderRadius:12, border:'1px solid rgba(28,40,20,0.12)', background:'#fff', fontSize:13, fontWeight:700, color:'#1C2814', cursor:'pointer'}}>
            Open activity center
          </button>
        </div>
      </div>
    </div>
    {successMomentModal}
    </>
  );
  const handleSubmitBid = async (bidData) => {
    const user = await getCurrentUserSafe();
    if (!user) { showToast("Please sign in to submit a bid"); return; }
    if (role !== "vendor") { showToast("Only vendor accounts can submit proposals.", "error"); return; }
    if (!selectedProject?.id) { showToast("Project context lost — reopen the project and try again.", "error"); return; }
    if (String(selectedProject?.status || "draft").toLowerCase() !== "open") { showToast("This project is no longer accepting proposals."); return; }
    // Guard: email must be confirmed before bidding
    if (!user.email_confirmed_at) {
      showToast("Please confirm your email address before submitting a bid. Check your inbox for the confirmation link.");
      return;
    }

    // Defensive: BidForm validates amount, but anyone could call this from
    // devtools or via a stale form state. Reject obviously bad numbers.
    const safeAmount = Number(bidData?.amount);
    if (!Number.isFinite(safeAmount) || safeAmount <= 0 || safeAmount > 10_000_000) {
      showToast("Please enter a valid bid amount.", "error");
      return;
    }
    const safeTimeline = String(bidData?.timeline || "").trim();
    if (!safeTimeline) {
      showToast("Please share a timeline for your bid.", "error");
      return;
    }

    // Pre-flight duplicate check. NOTE: this is best-effort — two parallel
    // submissions can both pass this SELECT and then both INSERT. The real
    // protection is a UNIQUE (project_id, vendor_id) constraint on the bids
    // table, which surfaces below as a 23505 error.
    const { data: existing } = await supabase
      .from("bids")
      .select("id")
      .eq("project_id", selectedProject?.id)
      .eq("vendor_id", user.id)
      .maybeSingle();
    if (existing) { showToast("You've already submitted a proposal on this project"); return; }

    // Canonical beta cutover: the server derives vendor/church identity and
    // enforces launch state, eligibility, project status, validation, and
    // uniqueness. The browser no longer writes directly to public.bids.
    const { data: createdBid, error } = await supabase.rpc("marketplace_service_submit_bid", {
      p_project_id: selectedProject.id,
      p_amount: safeAmount,
      p_timeline: safeTimeline,
      p_cover_letter: String(bidData?.note || bidData?.cover || "").trim(),
      p_milestones: Array.isArray(bidData?.milestones) ? bidData.milestones : [],
    });
    if (!error) {
      // Recipient and copy are derived from the committed bid + project rows.
      if (selectedProject?.church_id && createdBid?.id) {
        try {
          const { error: notificationError } = await createTrustedNotificationSafe("new_bid", createdBid.id);
          if (notificationError) throw notificationError;
        } catch(err){ logError('new-bid-notify', err, { projectId: selectedProject?.id, bidId: createdBid.id }); }
      }
      // Always use direct count from bids table // never trust bids_count field.
      // head:true means we only get the count, not the rows.
      const { count: realBidCount } = await supabase
        .from("bids")
        .select("id", { count: "exact", head: true })
        .eq("project_id", selectedProject?.id);
      await supabase.from("projects").update({ bids_count: realBidCount || 1 }).eq("id", selectedProject?.id);
      setProjects(ps => ps.map(p => p.id === selectedProject?.id ? {...p, bids: realBidCount || 1} : p));
      // Bust the projects-board cache so returning to the marketplace within
      // the 30s TTL window shows the updated bid count, not stale data.
      invalidateCache('projects-board');
      // Optimistically add the new bid to myBids so the "Proposal sent" badge
      // appears immediately on the project card when the vendor navigates back
      // to the board — no refetch needed.
      setMyBids(prev => [...prev, {
        id: createdBid?.id || `optimistic-${Date.now()}`,
        project_id: selectedProject?.id,
        vendor_id: user.id,
        status: 'pending',
        amount: safeAmount,
      }]);
      setBidSuccess(true);
      setSuccessMoment({
        type: "bid-submitted",
        key: `bid-submitted-${Date.now()}`,
        project: selectedProject,
        projectTitle: selectedProject?.title,
        amount: safeAmount,
        timeline: safeTimeline,
        milestoneCount: Array.isArray(bidData?.milestones) ? bidData.milestones.length || 3 : 3,
      });
    } else {
      // 23505 = unique_violation. The pre-flight check missed a race; tell
      // the user clearly instead of with a generic error.
      if (error.code === "23505") {
        showToast("You've already submitted a proposal on this project");
      } else {
        logError("bid-insert", error, { projectId: selectedProject?.id });
        showToast("Couldn't submit bid — please try again.", "error");
      }
    }
  };

  if(view==="bid" && !bidSuccess) return (
    <>
      {currentUser && !currentUser.email_confirmed_at && (
        <div style={{maxWidth:720, margin:'0 auto', padding:'16px 20px 0'}}>
          <div style={{background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.18)', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap'}}>
            <div style={{fontSize:13, color:'#b1342a', lineHeight:1.4}}>
              <strong>Email not verified.</strong> Please confirm your email before submitting a bid.
            </div>
            <button type="button" disabled={resendCooldown} onClick={async()=>{
              if (resendCooldown) return;
              setResendCooldown(true);
              const {error} = await supabase.auth.resend({type:'signup', email:currentUser.email});
              if(error) { showToast('Could not resend — try again.','error'); setResendCooldown(false); }
              else {
                showToast('Confirmation email sent — check your inbox.');
                setTimeout(() => setResendCooldown(false), 60000);
              }
            }} style={{flexShrink:0, padding:'8px 14px', borderRadius:8, border:'1px solid rgba(220,38,38,0.3)', background:resendCooldown ? 'rgba(220,38,38,0.03)' : 'rgba(220,38,38,0.08)', color:resendCooldown ? 'rgba(177,52,42,0.45)' : '#b1342a', fontSize:12, fontWeight:700, cursor:resendCooldown ? 'not-allowed' : 'pointer', fontFamily:'DM Sans,sans-serif', whiteSpace:'nowrap', transition:'all 0.18s'}}>
              {resendCooldown ? 'Email sent — check your inbox' : 'Resend confirmation email →'}
            </button>
          </div>
        </div>
      )}
      <BidForm project={selectedProject} onBack={()=>setView("detail")} onSubmit={handleSubmitBid} showToast={showToast}/>
    </>
  );
  if(view==="bid" && bidSuccess) return (
    <>
    <div className="page" style={{padding:'24px 20px 64px'}}>
      {/* Top bar */}
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:20, maxWidth:560, margin:'0 auto 20px'}}>
        <button
          type="button"
          onClick={reset}
          style={{display:'inline-flex',alignItems:'center',gap:6,height:36, padding:'0 14px', borderRadius:999, border:'1px solid rgba(28,40,20,0.12)', background:'#fffdf8', fontSize:13, fontWeight:600, color:'#1C2814', cursor:'pointer', boxShadow:'0 1px 2px rgba(0,0,0,0.04)'}}
        >
          ← Projects
        </button>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:10, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#b08840'}}>
          Proposal submitted
        </div>
      </div>

      <div style={{maxWidth:560, margin:'0 auto', animation:'fadeUp 0.5s ease'}}>
        {/* Hero banner */}
        <div style={{background:'#fff', border:'1px solid #dfd5c2', borderRadius:22, padding:'32px 28px', textAlign:'center', boxShadow:'0 7px 20px rgba(28,40,20,0.06)', marginBottom:20}}>
          <div style={{width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,#1C2814,#2a3520)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',boxShadow:'0 8px 24px rgba(28,40,20,0.30)'}}>
            <div style={{width:22,height:22,border:'2.5px solid #c4973a',borderRadius:'50%',position:'relative'}}>
              <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:7,height:7,borderRadius:'50%',background:'#c4973a'}}/>
            </div>
          </div>
          <h1 style={{fontFamily:"'Newsreader','Playfair Display',Georgia,serif", fontSize:'clamp(24px,3.6vw,32px)', fontWeight:600, lineHeight:1.1, letterSpacing:'-0.025em', color:'#1C2814', margin:'0 0 10px'}}>
            Proposal submitted.
          </h1>
          <div style={{fontSize:14, color:'#565862', lineHeight:1.65, maxWidth:440, margin:'0 auto'}}>
            Your bid on <strong style={{color:'#1C2814',fontWeight:700}}>{selectedProject?.title}</strong> is in. The church will review all bids and reach out if you're the right fit.
          </div>
        </div>

        {/* Tips while you wait — retained dark navy card, refined */}
        <div style={{background:'linear-gradient(135deg,#1C2814,#2a3520)', borderRadius:22, padding:'24px 26px', marginBottom:20, textAlign:'left', color:'#fff', boxShadow:'0 7px 20px rgba(28,40,20,0.20)'}}>
          <div style={{fontFamily:'DM Mono,monospace', fontSize:10, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#c4973a', marginBottom:14}}>While you wait</div>
          {[
            'Complete your Faith Verification to stand out above unverified vendors.',
            'Add a bio and portfolio to your profile — churches review it before hiring.',
            'Respond to any church messages within the hour. Speed signals professionalism.',
          ].map((tip,i,arr)=>(
            <div key={tip.slice(0,30)} style={{display:'flex',gap:11,alignItems:'flex-start',marginBottom:i < arr.length-1 ? 11 : 0}}>
              <span style={{width:5,height:5,borderRadius:999,background:'#c4973a',flexShrink:0,marginTop:8}}/>
              <span style={{fontSize:12.5,color:'rgba(255,255,255,0.74)',lineHeight:1.6}}>{tip}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap'}}>
          <button type="button" onClick={reset} style={{height:48, padding:'0 22px', borderRadius:12, border:'none', background:'linear-gradient(180deg,#c9a45c,#b08840)', fontSize:13, fontWeight:700, color:'#fff', cursor:'pointer', boxShadow:'0 1px 3px rgba(176,136,64,0.35)'}}>
            Browse more projects →
          </button>
          <button type="button" onClick={()=>nav('profile')} style={{height:48, padding:'0 18px', borderRadius:12, border:'1px solid rgba(28,40,20,0.12)', background:'#fff', fontSize:13, fontWeight:700, color:'#1C2814', cursor:'pointer'}}>
            Complete my profile
          </button>
        </div>
      </div>
    </div>
    {successMomentModal}
    </>
  );
  if(view==="bids") return (
    <>
      <ManageBids project={selectedProject} bids={bids} loading={loadingBids} error={bidFetchError} onRetry={()=>fetchBids(selectedProject?.id, selectedProject)} onAccept={handleAcceptBid} onDecline={handleDeclineBid} onBack={()=>setView("detail")} showToast={showToast} onNav={nav}/>
      {stripeModal && (
        <StripePlatformFeeModal
          bid={stripeModal.bid}
          project={stripeModal.project}
          onClose={()=>setStripeModal(null)}
          onSuccess={()=>confirmHire(stripeModal?.bid?.id)}
          showToast={showToast}
        />
      )}
      {successMomentModal}
    </>
  );
  if(view==="detail" && selectedProject) return (<ProjectDetail project={selectedProject} initialTab={selectedProjectInitialTab} role={role} nav={handleProjectDetailNav} showToast={showToast} onBack={reset} onPost={goToPostProject} onBid={openBidWhenEnabled} biddingEnabled={biddingEnabled || privateMarketplaceAccess || isAdmin} biddingSettingLoaded={biddingSettingLoaded || privateMarketplaceAccess || isAdmin} onNotifyBidding={requestBidOpeningNotification} bidNotifyPendingId={bidNotifyPendingId} onManageBids={(p)=>openProjectBidReview(p || selectedProject)} onProjectUpdate={(updated)=>{const normalized = normalizeProjectEntity(updated); if (normalized?.id) { setSelectedProjectId(normalized.id); setSelectedProjectFallback(normalized); patchProjectEverywhere(normalized.id, updated); }}} onComplete={(projectId)=>setConfirmCompleteId(projectId)} onCancel={(projectId)=>setConfirmCancelId(projectId)} currentUser={currentUser}/>);
  if(view==="mybids") return (
    <MyBidsScreen bids={myBids} loading={loadingMyBids} currentUser={currentUser} showToast={showToast} onBack={()=>setView("board")} onEditSuccess={()=>fetchMyBids({ force: true })}/>
  );

  if(view==="vendorProfile" && selectedVendorProfile) return (
    <VendorProfile vendor={selectedVendorProfile} onBack={handleVendorProfileBack} nav={nav} role={role} showToast={showToast} contextProjects={myActiveProjects} currentUser={currentUser} />
  );

  // Sample project detail // read-only, no bid form
  if(selectedSample) return (
    <SampleProjectDetail
      project={selectedSample}
      role={role}
      nav={nav}
      onBack={()=>setSelectedSample(null)}
    />
  );

  // V807: tab switches are UI state changes, not reload events.
  // Data is ensured through TTL/in-flight guards and refreshed in the
  // background so visited panels come back instantly.
  const handleTabSwitch = handleTabSwitchStable;

  const hirerMarketplaceMode = role === "church" || role === "individual";
  const openCount = (projects || []).filter(p => p.status === "open").length;
  const urgentCount = (projects || []).filter(p => p.urgent).length;
  const vendorCompareCount = getCompareWorkspaceCount('vendors');
  const projectCompareCount = getCompareWorkspaceCount('projects');
  const activeMarketMode = getMarketplaceModeMeta({ role, projectTab, openCount, urgentCount });
  const resolveMarketplaceAction = (actionKey) => {
    switch (actionKey) {
      case 'postProject':
        return goToPostProject;
      case 'openMyProjects':
        return () => handleTabSwitch('mine');
      case 'openMyWork':
        return () => handleTabSwitch('work');
      case 'openVendors':
        return () => handleTabSwitch('vendors');
      case 'openBrowse':
      default:
        return () => handleTabSwitch('browse');
    }
  };
  const activeMarketModeBound = {
    ...activeMarketMode,
    cta: activeMarketMode?.cta ? { ...activeMarketMode.cta, onClick: resolveMarketplaceAction(activeMarketMode.cta.actionKey) } : null,
    secondary: activeMarketMode?.secondary ? { ...activeMarketMode.secondary, onClick: resolveMarketplaceAction(activeMarketMode.secondary.actionKey) } : null,
  };
  const marketplaceTabs = getMarketplaceTabs({ role, openCount, vendorCompareCount, myBidCount:(myBids || []).length });
  const marketplaceSummaryCards = getMarketplaceSummaryCards({ role, projectTab, openCount, urgentCount, vendorCompareCount, projectCompareCount, myActiveProjects, myBids });
  const marketplaceCategoryCount = new Set((projects || []).map(p => String(p?.category || '').trim()).filter(Boolean)).size;
  const marketplaceHeaderStats = role === 'vendor'
    ? [
        { value: openCount, label: 'live' },
        { value: urgentCount, label: 'urgent', tone: urgentCount > 0 ? 'warm' : '' },
        { value: (myBids || []).length, label: 'my bids' },
      ]
    : [
        { value: openCount, label: 'live' },
        { value: urgentCount, label: 'urgent', tone: urgentCount > 0 ? 'warm' : '' },
        { value: marketplaceCategoryCount, label: 'categories' },
      ];

  const marketplaceShell = null;

  const doMarkComplete = async (projectId) => {
    const user = await getCurrentUserSafe();
    if (!user || !canManageProjectWithRole(role, user, selectedProject || selectedProjectFallback || {})) {
      showToast("Only the posting church can confirm project completion.", "error");
      return;
    }
    let lifecycleProject = null;
    try {
      lifecycleProject = await transitionProjectLifecycleSafe(projectId, 'confirm_completion');
    } catch (completeError) {
      logError("project-complete", completeError, { projectId });
      showToast(completeError?.message || "Could not confirm project completion.", "error");
      return;
    }
    let hiredBid = bids.find(b=>b.hired);
    if (!hiredBid) {
      const { data: hiredBidRow } = await supabase.from("bids").select("vendor_id,vendor_name,status").eq("project_id", projectId).eq("status", "hired").maybeSingle();
      if (hiredBidRow) hiredBid = { ...hiredBidRow, hired: true };
    }
    const vendorName = hiredBid?.vendor_name || "your vendor";
    const vendorId   = hiredBid?.vendor_id   || lifecycleProject?.hired_vendor_id || null;
    try {
      const { error: notificationError } = await createTrustedNotificationSafe("review_prompt", projectId);
      if (notificationError) throw notificationError;
    } catch(err){ logError('review-prompt-notify', err, { userId: user.id, projectId }); }
    patchProjectEverywhere(projectId, lifecycleProject || { status:"completed" });
    invalidateCache('projects-board');
    saveProjectOpsState(projectId, prev => ({ ...prev, closeout: { ...(prev.closeout || {}), status:'completed', finalReview:'requested', reviewRequested:true } }), lifecycleProject || selectedProject || {});
    showToast("Project completion confirmed. Head to Reviews to rate your vendor.");
    if (reviewNavTimerRef.current) clearTimeout(reviewNavTimerRef.current);
    reviewNavTimerRef.current = setTimeout(()=>{
      setPendingReviewTarget({
        vendor_id:  vendorId,
        name:       vendorName,
        emoji:      hiredBid?.vendor_emoji || "",
        project:    selectedProject?.title || "",
        project_id: selectedProject?.id || projectId || null,
      });
      nav("reviews");
    }, 1800);
  };

  const doMarkCancelled = async (projectId) => {
    const user = await getCurrentUserSafe();
    if (!user) { showToast("Please sign in to close a project.", "error"); return; }
    const { error } = await supabase
      .from("projects")
      .update({ status: "cancelled" })
      .eq("id", projectId)
      .eq("church_id", user.id);
    if (error) {
      logError("project-cancel", error, { projectId });
      showToast("Couldn't close this project — please try again.", "error");
      return;
    }
    patchProjectEverywhere(projectId, { status: "cancelled" });
    invalidateCache('projects-board');
    // The trusted writer derives all pending bidder recipients from the project.
    try {
      const { error: notificationError } = await createTrustedNotificationSafe("project_cancelled", projectId);
      if (notificationError) throw notificationError;
    } catch (notifErr) {
      logError("project-cancel-vendor-notify", notifErr, { projectId });
    }
    showToast("Project closed. Vendors will no longer be able to bid.");
    reset();
  };

  return (
    <>
      {marketplaceShell}

      {visitedProjectTabs.has("browse") && (
        <div
          className={`workspace-body-shell marketplace-body-shell kb-warm-tab-panel ${projectTab === "browse" ? "is-active" : "is-hidden"}`}
          aria-hidden={projectTab !== "browse"}
        >
          <MemoProjectBoard projects={projects} loading={loading} role={role} currentUser={currentUser} onSelect={safeOpenProjectStable} onPost={goToPostProjectStable} onMyBids={myBidsRouteStable} showToast={showToast} nav={nav} vendorVerified={vendorVerified} myBids={myBids} myActiveProjects={myActiveProjects} loadingMyBids={loadingMyBids} loadingMyProjects={loadingMyProjects} myProjectsFetchError={myProjectsFetchError} onRetryMyProjects={retryMyProjectsStable} onSelectSample={setSelectedSampleStable} projectTab="browse" onTabSwitch={handleTabSwitchStable} loadMoreProjects={loadMoreProjectsStable} hasMoreServerProjects={hasMoreProjects} loadingMoreServerProjects={loadingMoreProjects} onSelectVendorProfile={openVendorProfileStable}/>
        </div>
      )}

      {role !== "vendor" && visitedProjectTabs.has("vendors") && (
        <div
          className={`workspace-body-shell marketplace-body-shell kb-warm-tab-panel ${projectTab === "vendors" ? "is-active" : "is-hidden"}`}
          aria-hidden={projectTab !== "vendors"}
        >
          <MemoVendorMarketplaceFastPanel role={role} currentUser={currentUser} showToast={showToast} nav={nav} onPost={goToPostProjectStable} onTabSwitch={handleTabSwitchStable} onSelectVendorProfile={openVendorProfileStable} contextProjects={myActiveProjects} founderCoverageContext={founderCoverageContext} onClearFounderCoverageContext={()=>setFounderCoverageContext(null)} isActive={projectTab === "vendors"}/>
        </div>
      )}

      {visitedProjectTabs.has("mine") && (role==="church"||role==="individual") && (
        <div className={`kb-warm-tab-panel ${projectTab === "mine" ? "is-active" : "is-hidden"}`} aria-hidden={projectTab !== "mine"}>
          <MemoMyProjectsCommand projects={myActiveProjects} loading={loadingMyProjects} onSelect={safeOpenProjectStable} onPost={goToPostProjectStable} onManageBids={openProjectBidReviewStable} nav={nav} role={role} showToast={showToast} currentUser={currentUser} myProjectsFetchError={myProjectsFetchError} onRetryMyProjects={retryMyProjectsStable}/>
        </div>
      )}

      {visitedProjectTabs.has("work") && role==="vendor" && (
        <div className={`kb-warm-tab-panel ${projectTab === "work" ? "is-active" : "is-hidden"}`} aria-hidden={projectTab !== "work"}>
          <MemoMyWorkPanel bids={myBids} loading={loadingMyBids} projects={myActiveProjects} loadingProjects={loadingMyProjects} onBrowse={browseProjectsStable} onSelectProject={safeOpenProjectStable} nav={nav} onFetchBids={ensureMyWorkDataStable} showToast={showToast}/>
        </div>
      )}

      {successMomentModal}

      {bidAcceptedModal && !successMoment && (
        <BidAcceptedModal
          vendor={bidAcceptedModal.vendor}
          project={bidAcceptedModal.project}
          onClose={()=>setBidAcceptedModal(null)}
          onMessage={()=>openInboxThread(nav, { projectId: bidAcceptedModal.project?.id || null, vendorId: bidAcceptedModal.vendor?.vendor_id || null, vendorName: bidAcceptedModal.vendor?.name || null, createIfMissing: Boolean(bidAcceptedModal.vendor?.vendor_id) })}
          onViewProject={()=>{ setBidAcceptedModal(null); setView("detail"); }}
        />
      )}
      {confirmCompleteId && (
        <ConfirmModal
          title="Confirm this project is complete?"
          body="The vendor has requested completion. Confirming records the project as completed and moves it into closeout and review. Payment coordination remains separate."
          confirmLabel="Confirm Completion"
          onConfirm={()=>{ doMarkComplete(confirmCompleteId); setConfirmCompleteId(null); }}
          onCancel={()=>setConfirmCompleteId(null)}
        />
      )}
      {confirmCancelId && (
        <ConfirmModal
          title="Close this project?"
          body="This removes the project from the marketplace. Vendors who submitted bids will be notified that the project is no longer available."
          confirmLabel="Yes, Close Project"
          danger
          onConfirm={()=>{ doMarkCancelled(confirmCancelId); setConfirmCancelId(null); }}
          onCancel={()=>setConfirmCancelId(null)}
        />
      )}
    </>
  );
}


// V808 NAV PERFORMANCE PATCH — vendor directory fast path.
// The old Vendors sub-tab entered ProjectBoard first, ran the full live-project
// browse hook stack, then returned AllVendorsLanding at the end to avoid a hook
// order crash. That made a simple Marketplace ↔ Vendors toggle pay for the
// entire project board. This panel owns only vendor-directory state/fetching.
function VendorMarketplaceFastPanel({ role, nav, onPost, onTabSwitch, showToast, onSelectVendorProfile, currentUser, contextProjects = [], founderCoverageContext = null, onClearFounderCoverageContext = null, isActive = true }) {
  const STORAGE_KEY = KB_STORAGE_KEYS.marketplaceBoardState;
  const readSavedState = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, [STORAGE_KEY]);

  const [marketplaceVendors, setMarketplaceVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [savedVendorIds, setSavedVendorIds] = useState(() => new Set(readSavedState().savedVendorIds || []));
  const vendorsFetchInFlightRef = useRef(false);
  const vendorsFetchedAtRef = useRef(0);
  const VENDOR_DIRECTORY_TTL_MS = 120000;

  const fetchMarketplaceVendorsFast = useCallback(async ({ force = false, background = false } = {}) => {
    const hasFetched = vendorsFetchedAtRef.current > 0;
    const isFresh = Date.now() - vendorsFetchedAtRef.current < VENDOR_DIRECTORY_TTL_MS;
    if (!force && hasFetched && isFresh) return;
    if (vendorsFetchInFlightRef.current) return;

    vendorsFetchInFlightRef.current = true;
    const canKeepVisible = hasFetched || marketplaceVendors.length > 0;
    if (!background || !canKeepVisible) setVendorsLoading(true);
    try {
      const { data, error, timedOut, cacheFallback, narrowFallback } = await selectVendorDirectorySafe({ limit: 120, timeoutMs: 7000 });
      if (error) throw error;
      const normalized = (data || []).map(v => normalizeVendorEntity(v)).filter(Boolean);
      if (normalized.length || !marketplaceVendors.length) setMarketplaceVendors(normalized);
      if ((cacheFallback || narrowFallback) && normalized.length && kbIsDevRuntime()) console.info('[kb] vendor directory protected by fallback', { timedOut: !!timedOut, cacheFallback: !!cacheFallback, narrowFallback: !!narrowFallback, count: normalized.length });
      vendorsFetchedAtRef.current = Date.now();
    } catch (err) {
      const quietTransient = isSupabaseAuthLockAbort(err) || isKbTimeoutError(err);
      if (isRecoverableSupabaseAuthStorageError(err)) {
        kbMaybeRepairSupabaseAuthStorage('vendor-fast-panel-auth', err, { reload: true });
      }
      if (!quietTransient) {
        logError('vendor-fast-panel-fetch', err);
        if (!marketplaceVendors.length) setMarketplaceVendors([]);
      }
      // Mark the attempt so a slow vendor directory does not retry/log on every
      // remount. Manual refresh/next visit still gets another attempt after TTL.
      vendorsFetchedAtRef.current = Date.now();
    } finally {
      vendorsFetchInFlightRef.current = false;
      setVendorsLoading(false);
    }
  }, [marketplaceVendors.length]);

  useEffect(() => {
    fetchMarketplaceVendorsFast({ background: true });
  }, [fetchMarketplaceVendorsFast]);


  useEffect(() => {
    const handleAuthProfileRestored = (event) => {
      const restoredUserId = String(event?.detail?.userId || '').trim();
      const activeUserId = String(currentUser?.id || '').trim();
      if (restoredUserId && activeUserId && restoredUserId !== activeUserId) return;
      fetchMarketplaceVendorsFast({ force: true, background: true });
    };
    window.addEventListener('kb:auth-profile-restored', handleAuthProfileRestored);
    return () => window.removeEventListener('kb:auth-profile-restored', handleAuthProfileRestored);
  }, [currentUser?.id, fetchMarketplaceVendorsFast]);

  useEffect(() => {
    try {
      const next = readSavedState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...next,
        savedVendorIds: Array.from(savedVendorIds),
      }));
    } catch (e) {
      logError('persist-fast-vendor-saves', e);
    }
  }, [STORAGE_KEY, readSavedState, savedVendorIds]);

  useEffect(() => {
    const syncVendorSaves = (event) => {
      if (event?.type === 'storage' && event.key && event.key !== STORAGE_KEY) return;
      if (event?.type === 'kb:storage-sync' && event?.detail?.key && event.detail.key !== STORAGE_KEY) return;
      const next = readSavedState();
      setSavedVendorIds(new Set(next.savedVendorIds || []));
    };
    window.addEventListener('storage', syncVendorSaves);
    window.addEventListener('kb:storage-sync', syncVendorSaves);
    return () => {
      window.removeEventListener('storage', syncVendorSaves);
      window.removeEventListener('kb:storage-sync', syncVendorSaves);
    };
  }, [STORAGE_KEY, readSavedState]);

  const openVendorProfile = useCallback((vendor) => {
    const seeded = buildVendorProfileSeed(vendor);
    const vendorId = seeded.id || seeded.user_id || seeded.vendorId || null;
    rememberReturnContext({ scope:'vendor-directory', screen:'vendors', vendorId });
    if (typeof onSelectVendorProfile === 'function') {
      onSelectVendorProfile(seeded);
      return;
    }
    queueVendorNavigation(nav, seeded, { returnContext:{ scope:'vendor-directory', screen:'vendors', vendorId } });
    showToast && showToast(`Opening ${seeded.name}`);
  }, [nav, onSelectVendorProfile, showToast]);

  const toggleVendorSave = useCallback((vendorId, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const key = String(vendorId || '');
    if (!key) return;
    setSavedVendorIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        showToast && showToast('Removed vendor from saved vendors');
      } else {
        next.add(key);
        showToast && showToast('Saved vendor');
      }
      return next;
    });
  }, [showToast]);

  return (
    <AllVendorsLanding
      role={role}
      nav={nav}
      onPost={onPost}
      onBack={() => typeof onTabSwitch === 'function' ? onTabSwitch('browse') : null}
      showToast={showToast}
      onSelectVendor={openVendorProfile}
      vendors={marketplaceVendors}
      vendorsLoading={vendorsLoading}
      savedVendorIds={savedVendorIds}
      onToggleSave={toggleVendorSave}
      currentUser={currentUser}
      contextProjects={contextProjects}
      founderCoverageContext={founderCoverageContext}
      onClearFounderCoverageContext={onClearFounderCoverageContext}
      surface="church-vendors"
      isActive={isActive}
    />
  );
}
const MemoVendorMarketplaceFastPanel = React.memo(VendorMarketplaceFastPanel);


function ProjectBoard({projects, loading, role, currentUser, onSelect, onPost, onMyBids, showToast, nav, vendorVerified, myBids, myActiveProjects, loadingMyBids, loadingMyProjects, myProjectsFetchError = false, onRetryMyProjects, onSelectSample, projectTab='browse', onTabSwitch, loadMoreProjects = null, hasMoreServerProjects = false, loadingMoreServerProjects = false, onSelectVendorProfile = null}){
  const STORAGE_KEY = KB_STORAGE_KEYS.marketplaceBoardState;
  const SCROLL_KEY = KB_STORAGE_KEYS.marketplaceBoardScroll;
  const readSavedState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };
  const savedState = readSavedState();
  // Start the marketplace on the full live-project floor every time. Stale
  // persisted filters were making the page open with only 1 visible project.
  // Keep saved IDs, but do not restore search/filter toggles by default.
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 180);
  const [catFilter, setCatFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [budgetFilter, setBudgetFilter] = useState("Budget: Any");
  const [sortBy, setSortBy] = useState("best_match");
  const [savedOnly, setSavedOnly] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [reviewingOnly, setReviewingOnly] = useState(false);
  // Featured theme starts unset (null). The resolver below auto-picks the
  // bucket with the most projects. The vendor's manual choice — once they
  // make one — overrides that auto-pick. Defaulting to 'urgent' was wrong:
  // a marketplace with 0 urgent and 30 just-posted projects opened on an
  // empty Urgent header, then fell back via activeThemeKeys[0] only because
  // urgent failed to be active at all. The "1 urgent + 30 just-posted" case
  // was the actual bug — vendors saw Urgent (with 1 project) when Just
  // Posted (with 30) was the better default.
  const [featuredTheme, setFeaturedTheme] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  // UX: collapse density. The marketplace was rendering 7 horizontal bands
  // before the project grid. We move category, location, budget, and the
  // saved/urgent/reviewing toggles behind a single "Filters" sheet, hide
  // the category chip row behind a "Browse by category" disclosure, and
  // make the featured carousel collapsible. The result is a default view
  // of: search + sort + Filters, then the grid. Density and saved searches live inside the sheet.
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [featuredCollapsed, setFeaturedCollapsed] = useState(() => savedState.featuredCollapsed !== false);
  const [saveSearchModal, setSaveSearchModal] = useState(null); // { suggested } | null

  // Scroll lock: prevent the page behind the filter sheet from scrolling
  // on iOS and Android. We apply/remove overflow:hidden on document.body.
  useEffect(() => {
    if (!filterSheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [filterSheetOpen]);
  const [savedIds, setSavedIds] = useState(()=>new Set(savedState.savedIds || []));
  // Map<projectId, ISO timestamp> — drives "Saved view sorts by date saved" so
  // returning vendors see the most-recently-saved project first, not the most
  // recently posted. Hydrated from localStorage; back-fills missing entries on
  // first read so legacy saves still order deterministically.
  const [savedAtMap, setSavedAtMap] = useState(() => {
    const raw = (savedState && typeof savedState.savedAtMap === 'object') ? savedState.savedAtMap : {};
    const seedTs = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(); // 30d ago
    const next = {};
    (savedState.savedIds || []).forEach(id => {
      next[String(id)] = raw[String(id)] || seedTs;
    });
    return next;
  });
  const [savedVendorIds, setSavedVendorIds] = useState(()=>new Set(savedState.savedVendorIds || []));
  const [showAllVendors, setShowAllVendors] = useState(false);
  const [interopVersion, setInteropVersion] = useState(0);
  const projectGridRef = useRef(null);
  const sheetTouchStartY = useRef(null);
  const filterSheetTrapRef = useFocusTrap(filterSheetOpen);
  const [marketplaceVendors, setMarketplaceVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const featuredTrackRef = useRef(null);
  const featuredDragRef = useRef({ active:false, pointerId:null, startX:0, scrollLeft:0, moved:false });
  const featuredClickSuppressRef = useRef(false);
  const [featuredCanScrollPrev, setFeaturedCanScrollPrev] = useState(false);
  const [featuredCanScrollNext, setFeaturedCanScrollNext] = useState(false);
  // Strip interaction state — press-and-lift on grab, momentum on release.
  // Reuses featuredTrackRef/featuredDragRef/featuredClickSuppressRef above so
  // the existing click-suppress contract with cards is preserved.
  const [stripPressedCardId, setStripPressedCardId] = useState(null);
  const [stripIsDragging, setStripIsDragging] = useState(false);
  const stripVelocityRef = useRef({ samples: [], lastX: 0, lastT: 0 });
  const stripMomentumRafRef = useRef(null);
  const [gridDensity, setGridDensity] = useState('comfortable');
  // V45 — controls mobile "Show all" pagination of the All Projects grid.
  // Default false → cap at 6 cards on mobile / 12 desktop. Toggle reveals all.
  const [showAllProjects, setShowAllProjects] = useState(false);
  // Saved searches. A vendor who returns daily and re-applies the same filter
  // combo ("Construction · Dallas · $50K+") shouldn't have to rebuild it. The
  // marketplace currently has no return-visit pattern beyond the URL; saved
  // searches give it one. Capped at 6 — past that, the chip row becomes
  // navigation rather than a shortcut, which defeats the purpose.
  const [savedSearches, setSavedSearches] = useState(() => {
    const list = Array.isArray(savedState.savedSearches) ? savedState.savedSearches : [];
    return list.slice(0, 6);
  });
  const [deletedSearch, setDeletedSearch] = useState(null); // { entry, timer } — enables undo

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        search,
        catFilter,
        locationFilter,
        budgetFilter,
        sortBy,
        savedOnly,
        urgentOnly,
        reviewingOnly,
        showAdvancedFilters,
        savedIds: Array.from(savedIds),
        savedAtMap,
        savedVendorIds: Array.from(savedVendorIds),
        savedSearches,
        featuredCollapsed,
      }));
    } catch(e) { logError("persist-marketplace-filters", e); }
  }, [search, catFilter, locationFilter, budgetFilter, sortBy, savedOnly, urgentOnly, reviewingOnly, showAdvancedFilters, savedIds, savedAtMap, savedVendorIds, savedSearches, featuredCollapsed]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SCROLL_KEY);
      const y = raw ? Number(raw) : 0;
      if (Number.isFinite(y) && y > 0) {
        requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
        sessionStorage.removeItem(SCROLL_KEY);
      }
    } catch {}
  }, []);

  // Tab-aware mode sync. Compare/shortlist is intentionally hidden for now.
  // Browse should reopen on the full project floor when the vendor *enters*
  // Browse from somewhere else — but not when the effect re-runs because
  // some unrelated dep changed, and not when projectTab simply re-confirms
  // its current value. The previous version nuked savedOnly/urgentOnly/
  // reviewingOnly on every run, which meant a vendor who toggled Urgent on
  // Browse, hopped to Vendors to look up a name, and came back found their
  // filter silently cleared. We now compare the previous projectTab to
  // detect a real transition.
  const prevProjectTabRef = useRef(projectTab);
  useEffect(() => {
    const prev = prevProjectTabRef.current;
    prevProjectTabRef.current = projectTab;
    if (projectTab === 'vendors') {
      setShowAllVendors(true);
      return;
    }
    setShowAllVendors(false);
    // Only reset when *coming from* the vendors tab — that's the actual
    // "fresh entry to Browse" signal. Re-confirmations (prev === current)
    // and Browse → Browse stays leave the vendor's toggles alone.
    if (prev === 'vendors') {
      setSavedOnly(false);
      setUrgentOnly(false);
      setReviewingOnly(false);
    }
  }, [projectTab]);

  const stashBoardScroll = () => {
    try { sessionStorage.setItem(SCROLL_KEY, String(window.scrollY || 0)); } catch {}
  };
  const scrollMarketplaceGridIntoView = () => {
    requestAnimationFrame(() => {
      if (projectGridRef.current && typeof projectGridRef.current.scrollIntoView === 'function') {
        projectGridRef.current.scrollIntoView({ behavior:'smooth', block:'start' });
      }
    });
  };
  const restoreBoardScroll = () => {
    try {
      const raw = sessionStorage.getItem(SCROLL_KEY);
      const y = raw ? Number(raw) : 0;
      if (Number.isFinite(y) && y > 0) {
        window.scrollTo({ top: y, behavior:'instant' });
        sessionStorage.removeItem(SCROLL_KEY);
      }
    } catch {}
  };

  const normalizedProjects = useMemo(() => (projects || []).map(normalizeProjectEntity).filter(Boolean), [projects]);
  const openProjects = useMemo(() => normalizedProjects.filter(p => p.status === 'open'), [normalizedProjects]);
  // Set of project IDs the vendor has already bid on — used to show a
  // "Proposal sent" badge on cards so vendors don't submit duplicates.
  const bidProjectIds = useMemo(() => new Set(
    (myBids || []).map(b => String(b.project_id || '')).filter(Boolean)
  ), [myBids]);

  // ── Vendor personalization profile ────────────────────────────────────────
  // Pulled from currentUser.user_metadata (the vendor profile fields land
  // there at signup; see buildProfileBootstrapRecord). Wrapped in a memo so
  // the "Best for you" strip and the lane-scoring helpers don't recompute on
  // every render, and so a vendor whose profile lacks both category AND city
  // gets `null` and skips the strip entirely instead of seeing a generic list.
  const viewerVendorProfile = useMemo(() => {
    if (role !== 'vendor') return null;
    const meta = (currentUser && currentUser.user_metadata) || {};
    const category = String(currentUser?.category || meta.category || '').trim();
    const city = String(currentUser?.city || meta.city || '').trim();
    if (!category && !city) return null;
    return {
      category,
      city,
      delivery_model: meta.delivery_model || meta.deliveryModel || meta.service_model || '',
      org_name: meta.org_name || meta.businessName || meta.name || '',
      verified: !!(meta.vendor_verified || meta.faith_verified),
    };
  }, [role, currentUser]);
  const viewerVendorMatchProfile = useMemo(() => {
    if (role !== 'vendor') return null;
    const uid = String(currentUser?.id || currentUser?.user_id || '');
    const dbVendor = uid ? safeArray(marketplaceVendors).find(v => String(v?.user_id || v?.id || '') === uid) : null;
    return dbVendor || viewerVendorProfile || currentUser || null;
  }, [role, currentUser, marketplaceVendors, viewerVendorProfile]);
  const myProjectPool = useMemo(() => (myActiveProjects || []).map(normalizeProjectEntity).filter(Boolean).filter(p => ['open','hired','active','bid_under_review','milestone_pending'].includes(deriveCanonicalDealState({ project:p, workspace: loadProjectWorkspace(p), role:'church' }) || 'open')), [myActiveProjects]);
  const interopState = useMemo(() => listProjectInteropEntries(), [interopVersion]);
  const getInteropEntry = (projectId) => normalizeProjectInteropEntry(interopState[String(projectId)] || {});

  useEffect(() => {
    const syncInterop = (event) => {
      if (event?.type === 'storage' && event.key && event.key !== KB_PROJECT_INTEROP_KEY) return;
      if (event?.type === 'kb:storage-sync' && event?.detail?.key && event.detail.key !== KB_PROJECT_INTEROP_KEY) return;
      setInteropVersion(v => v + 1);
    };
    window.addEventListener('storage', syncInterop);
    window.addEventListener('kb:storage-sync', syncInterop);
    return () => {
      window.removeEventListener('storage', syncInterop);
      window.removeEventListener('kb:storage-sync', syncInterop);
    };
  }, []);



  useEffect(() => {
    let cancelled = false;
    const fetchMarketplaceVendors = async () => {
      setVendorsLoading(true);
      try {
        const { data, error, timedOut, cacheFallback, narrowFallback } = await selectVendorDirectorySafe({ limit: 120, timeoutMs: 7000 });
        if (error) throw error;
        const normalized = (data || []).map(v => normalizeVendorEntity(v)).filter(Boolean);
        if (!cancelled && (normalized.length || !marketplaceVendors.length)) setMarketplaceVendors(normalized);
        if ((cacheFallback || narrowFallback) && normalized.length && kbIsDevRuntime()) console.info('[kb] marketplace vendor directory protected by fallback', { timedOut: !!timedOut, cacheFallback: !!cacheFallback, narrowFallback: !!narrowFallback, count: normalized.length });
      } catch (err) {
        // Supabase GoTrue can briefly break an auth-token lock during StrictMode/remounts,
        // and the public vendor directory can occasionally miss the timeout window.
        // Treat both as transient: keep the shell usable, avoid console spam, and let
        // the next mount/TTL try again instead of zeroing stable UI state.
        const quietTransient = isSupabaseAuthLockAbort(err) || isKbTimeoutError(err);
        if (isRecoverableSupabaseAuthStorageError(err)) {
          kbMaybeRepairSupabaseAuthStorage('marketplace-vendor-auth', err, { reload: true });
        }
        if (!quietTransient) {
          logError('marketplace-vendor-fetch', err);
          if (!cancelled) setMarketplaceVendors([]);
        }
      } finally {
        if (!cancelled) setVendorsLoading(false);
      }
    };
    fetchMarketplaceVendors();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const syncBoard = (event) => {
      if (event?.type === 'storage' && event.key && event.key !== STORAGE_KEY) return;
      if (event?.type === 'kb:storage-sync' && event?.detail?.key && event.detail.key !== STORAGE_KEY) return;
      const next = readSavedState();
      setLocationFilter(next.locationFilter || 'All Locations');
      setBudgetFilter(next.budgetFilter || 'Budget: Any');
      setShowAdvancedFilters(!!next.showAdvancedFilters);
      setSavedIds(new Set(next.savedIds || []));
      if (next.savedAtMap && typeof next.savedAtMap === 'object') {
        setSavedAtMap(next.savedAtMap);
      }
      setSavedVendorIds(new Set(next.savedVendorIds || []));
      if (Array.isArray(next.savedSearches)) {
        setSavedSearches(next.savedSearches.slice(0, 6));
      }
    };
    window.addEventListener('storage', syncBoard);
    window.addEventListener('kb:storage-sync', syncBoard);
    return () => {
      window.removeEventListener('storage', syncBoard);
      window.removeEventListener('kb:storage-sync', syncBoard);
    };
  }, []);

  const categories = useMemo(() => {
    const raw = Array.from(new Set(openProjects.map(p => String(p.category || '').trim()).filter(Boolean)));
    const ordered = [
      'Construction & Renovation',
      'Tech / AV / Production',
      'Creative Media',
      'Music & Worship',
      'Children & Youth Ministry',
      'Web & Technology',
      'Marketing & Communications',
      ...raw,
    ];
    return ['All', ...Array.from(new Set(ordered.filter(Boolean)))];
  }, [openProjects]);

  const budgetOptions = ['Budget: Any', 'Under $5K', '$5K-$15K', '$15K-$50K', '$50K+'];

  const parseBudgetNumber = (value) => {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    const nums = String(value).replace(/,/g, '').match(/\d+(?:\.\d+)?/g);
    if (!nums || !nums.length) return 0;
    const values = nums.map(Number).filter(n => Number.isFinite(n));
    if (!values.length) return 0;
    return Math.max(...values);
  };

  const formatMoneyCompact = (value) => {
    const n = Number(value || 0);
    if (!Number.isFinite(n) || n <= 0) return '—';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${Math.round(n / 1000)}K`;
    return `${Math.round(n)}`;
  };

  const formatProjectBudget = (value) => {
    const str = String(value || '').trim();
    if (!str) return 'Flexible';
    if (/\$/.test(str)) return str;
    const n = parseBudgetNumber(str);
    return n ? formatMoneyCompact(n) : str;
  };

  const matchesBudgetBand = (project, band) => {
    if (band === 'Budget: Any') return true;
    const amount = parseBudgetNumber(project?.budget);
    if (!amount) return band === 'Budget: Any';
    if (band === 'Under $5K') return amount < 5000;
    if (band === '$5K-$15K') return amount >= 5000 && amount < 15000;
    if (band === '$15K-$50K') return amount >= 15000 && amount < 50000;
    if (band === '$50K+') return amount >= 50000;
    return true;
  };

  const churchProjectCounts = useMemo(() => {
    const counts = {};
    openProjects.forEach(project => {
      const church = String(project.church || project.church_name || '').trim();
      if (!church) return;
      counts[church] = (counts[church] || 0) + 1;
    });
    return counts;
  }, [openProjects]);

  const getProjectFreshness = (project) => {
    const postedMs = new Date(project.posted_at || project.created_at || 0).getTime();
    if (!postedMs) return null;
    return (Date.now() - postedMs) / (1000 * 60 * 60 * 24);
  };

  const getProjectStatusMeta = (project) => {
    const ageDays = getProjectFreshness(project);
    if (project.urgent) return { label:'Urgent', tone:'urgent', helper:'Needs attention' };
    if (Number(project.bids || 0) >= 6) return { label:'Reviewing', tone:'reviewing', helper:'High bid activity' };
    if (ageDays != null && ageDays <= 4) return { label:'New', tone:'new', helper:'Freshly posted' };
    return { label:'Open', tone:'open', helper:'Accepting proposals' };
  };

  const getTrustMeta = (project) => {
    const church = String(project.church || project.church_name || '').trim();
    const count = churchProjectCounts[church] || 0;
    if (count >= 3) return { label:'Repeat poster', detail:`${count} active projects` };
    if (count === 2) return { label:'Returning church', detail:'Posted before' };
    return { label:'New listing', detail:'First active project' };
  };

  const getProjectLocationLabel = (project) => {
    const city = String(project?.city || '').trim();
    const state = String(project?.state || project?.region || '').trim();
    if (city && state && !city.toLowerCase().includes(state.toLowerCase())) return `${city}, ${state}`;
    return city || state || 'Remote';
  };

  const getProjectTimelineLabel = (project) => {
    const raw = String(project?.timeline || '').trim();
    if (!raw) return 'Flexible';
    return raw.length > 24 ? `${raw.slice(0, 24).trim()}…` : raw;
  };

  const locationOptions = useMemo(() => {
    const raw = Array.from(new Set(openProjects.map(project => String(getProjectLocationLabel(project) || '').trim()).filter(Boolean)));
    return ['All Locations', ...raw.slice(0, 24)];
  }, [openProjects]);

  const getProjectExcerpt = (project, fallback) => {
    const raw = String(project?.description || project?.desc || fallback || '').replace(/\s+/g, ' ').trim();
    if (!raw) return '';
    return raw.length > 150 ? `${raw.slice(0, 147).trim()}…` : raw;
  };

  const getCompactProjectExcerpt = (project, fallback, maxLen = 92) => {
    const raw = String(project?.description || project?.desc || fallback || '').replace(/\s+/g, ' ').trim();
    if (!raw) return '';
    return raw.length > maxLen ? `${raw.slice(0, Math.max(0, maxLen - 1)).trim()}…` : raw;
  };

  const getProjectActivityLabel = ({ project, relation, shared, pipeline }) => {
    if (pipeline?.summary && pipeline.summary !== 'No vendors attached yet') return pipeline.summary;
    if (relation?.attachedVendorIds?.length) return `${relation.attachedVendorIds.length} attached vendor${relation.attachedVendorIds.length === 1 ? '' : 's'}`;
    const bidCount = Number(project?.bids || project?.bids_count || 0);
    if (bidCount > 0) return `${bidCount} proposal${bidCount === 1 ? '' : 's'}`;
    return shared?.label || 'Open';
  };

  const scoreProject = (project) => {
    if (role === 'vendor') {
      const match = computeProjectMatchForVendor(project, viewerVendorMatchProfile || currentUser || {});
      const freshnessBoost = (() => {
        const d = getProjectFreshness(project);
        return d == null ? 0 : Math.max(0, 8 - Math.min(d, 8));
      })();
      return Number(match.score || 0) + freshnessBoost;
    }
    const ageDays = getProjectFreshness(project);
    const freshnessScore = ageDays == null ? 8 : Math.max(0, 18 - Math.min(ageDays, 18));
    const urgentScore = project.urgent ? 20 : 0;
    // Proposal count means opposite things to the two sides:
    //   Church/individual viewing the marketplace = "is this project getting
    //     traction?" → high bid count = healthy = rank higher.
    //   Vendor viewing the marketplace = "where's the open lane?" → low bid
    //     count = better opportunity = rank higher.
    // Without this flip, the default sort buried 0-bid projects under 8-bid
    // projects for vendors — exactly backwards for sourcing intent.
    const bidCount = Number(project.bids || 0);
    const proposalScore = role === 'vendor'
      ? Math.max(0, 18 - Math.min(bidCount * 3, 18))   // 0 bids → 18, 6+ bids → 0
      : Math.min(bidCount * 2.5, 18);                  // 0 bids → 0, 7+ bids → 18
    const budgetScore = Math.min(parseBudgetNumber(project.budget) / 25000, 12);
    const richDescScore = String(project.description || project.desc || '').trim().length > 120 ? 4 : 0;
    return urgentScore + freshnessScore + proposalScore + budgetScore + richDescScore;
  };

  const filteredProjects = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    // Map the search term through the canonical-category synonym table so a
    // vendor typing "AV" finds projects tagged "audio/visual setup for
    // sanctuary" and a vendor typing "streaming" finds projects categorized
    // "Tech / AV / Production". Only fires when there's a search term, and
    // only kicks in as a fallback — exact substring match still wins for
    // titles/churches/cities. Empty Set when the term doesn't match any
    // known synonym, in which case we keep the prior behavior.
    const termCanonicalCats = term ? __kbCanonicalizeToCategories(term) : new Set();
    let next = openProjects.filter(project => {
      const projectLocation = String(getProjectLocationLabel(project) || '').toLowerCase();
      const matchesSearch = !term || [
        project.title,
        project.church,
        project.church_name,
        project.city,
        project.category,
        project.description,
        projectLocation,
      ].some(val => String(val || '').toLowerCase().includes(term)) || (() => {
        if (!termCanonicalCats.size) return false;
        const projectCats = __kbDeriveProjectCategories(project);
        for (const c of termCanonicalCats) if (projectCats.has(c)) return true;
        return false;
      })();
      const matchesCat = catFilter === 'All' || String(project.category || '') === catFilter;
      const matchesLocation = locationFilter === 'All Locations' || String(getProjectLocationLabel(project) || '').trim() === locationFilter;
      const matchesBudget = matchesBudgetBand(project, budgetFilter);
      const matchesSaved = !savedOnly || savedIds.has(String(project.id || project.title));
      const matchesUrgent = !urgentOnly || !!project.urgent;
      const matchesReviewing = !reviewingOnly || Number(project.bids || 0) >= 4;
      return matchesSearch && matchesCat && matchesLocation && matchesBudget && matchesSaved && matchesUrgent && matchesReviewing;
    });

    const sorter = (a, b) => {
      // Saved view: order by when the vendor saved each project, not when it
      // was posted. Returning to "Saved" is a different intent than browsing
      // — they want to pick up where they left off.
      if (savedOnly) {
        const at = savedAtMap[String(a.id || a.title)] || '';
        const bt = savedAtMap[String(b.id || b.title)] || '';
        if (at || bt) return String(bt).localeCompare(String(at));
      }
      if (sortBy === 'newest') {
        const ad = new Date(a.posted_at || a.created_at || 0).getTime();
        const bd = new Date(b.posted_at || b.created_at || 0).getTime();
        return bd - ad;
      }
      if (sortBy === 'budget') return parseBudgetNumber(b.budget) - parseBudgetNumber(a.budget);
      if (sortBy === 'proposals') return Number(b.bids || 0) - Number(a.bids || 0);
      if (sortBy === 'urgent') return Number(!!b.urgent) - Number(!!a.urgent) || scoreProject(b) - scoreProject(a);
      if (sortBy === 'closing_soon') {
        // "Fast projects under $1,500" = most bids + oldest post (decision window imminent)
        // Score: high bid count + days since posted, capped to avoid penalising new projects
        const aScore = Math.min(Number(a.bids || 0), 10) * 10 + Math.min((Date.now() - new Date(a.posted_at || 0).getTime()) / 86400000, 14);
        const bScore = Math.min(Number(b.bids || 0), 10) * 10 + Math.min((Date.now() - new Date(b.posted_at || 0).getTime()) / 86400000, 14);
        return bScore - aScore;
      }
      return scoreProject(b) - scoreProject(a);
    };
    return [...next].sort(sorter);
  }, [openProjects, debouncedSearch, catFilter, locationFilter, budgetFilter, savedOnly, urgentOnly, reviewingOnly, savedIds, savedAtMap, sortBy]);

  const hasBrowseRefinements = !!debouncedSearch.trim() || catFilter !== 'All' || locationFilter !== 'All Locations' || budgetFilter !== 'Budget: Any' || (sortBy !== 'best_match') || savedOnly || urgentOnly || reviewingOnly;
  const featuredThemeBuckets = useMemo(() => {
    const now = Date.now();
    const msPerDay = 86400000;
    // Compute the full matching set first, then cap to 3 for display. The
    // pre-cap counts feed both the bucket ordering and the meta sub-line so
    // a bucket with 30 matches doesn't read "3 churches need a vendor."
    const urgentAll = openProjects.filter(p => !!p.urgent);
    const closingSoonAll = openProjects.filter(p => {
      const bids = Number(p?.bids || p?.bids_count || 0);
      const ageMs = p.posted_at ? now - new Date(p.posted_at).getTime() : 0;
      return bids >= 4 && ageMs >= 3 * msPerDay;
    });
    const justPostedAll = openProjects.filter(p => {
      const ageMs = p.posted_at ? now - new Date(p.posted_at).getTime() : 0;
      return ageMs <= msPerDay;
    });
    return {
      urgent: urgentAll.slice(0, 3),
      closingSoon: closingSoonAll.slice(0, 3),
      justPosted: justPostedAll.slice(0, 3),
      counts: {
        urgent: urgentAll.length,
        closingSoon: closingSoonAll.length,
        justPosted: justPostedAll.length,
      },
    };
  }, [openProjects]);
  const featuredThemesMeta = {
    urgent:      { label: 'Urgent before Sunday', sub: count => `${count} church${count !== 1 ? 'es' : ''} need${count === 1 ? 's' : ''} a vendor this week` },
    closingSoon: { label: 'Fast projects under $1,500',          sub: count => `${count} project${count !== 1 ? 's' : ''} reviewing bids now` },
    justPosted:  { label: 'Just posted',            sub: count => `${count} new project${count !== 1 ? 's' : ''} in the last 24 hours` },
  };
  const activeThemeKeys = ['urgent','closingSoon','justPosted'].filter(k => featuredThemeBuckets[k].length >= 1);
  // Default theme picks the biggest non-empty bucket. Tie-break order:
  // urgent > closingSoon > justPosted (urgent is the most actionable signal,
  // so when counts tie we prefer to surface it). The vendor's manual click
  // wins over the auto-pick — featuredTheme is only null until they touch
  // the switcher.
  const autoTheme = useMemo(() => {
    const ranked = [...activeThemeKeys].sort((a, b) => {
      const diff = featuredThemeBuckets.counts[b] - featuredThemeBuckets.counts[a];
      if (diff !== 0) return diff;
      const tiebreak = { urgent: 0, closingSoon: 1, justPosted: 2 };
      return tiebreak[a] - tiebreak[b];
    });
    return ranked[0] || 'urgent';
  }, [activeThemeKeys, featuredThemeBuckets]);
  const resolvedTheme = (featuredTheme && activeThemeKeys.includes(featuredTheme)) ? featuredTheme : autoTheme;
  const featuredBrowseProjects = featuredThemeBuckets[resolvedTheme] || [];
  const shouldShowFeaturedProjects = !hasBrowseRefinements && filteredProjects.length >= 5 && activeThemeKeys.length > 0;
  const browseGridSource = filteredProjects;

  const updateFeaturedCarouselState = () => {
    const el = featuredTrackRef.current;
    if (!el || !shouldShowFeaturedProjects) {
      setFeaturedCanScrollPrev(false);
      setFeaturedCanScrollNext(false);
      return;
    }
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth - 4);
    setFeaturedCanScrollPrev(el.scrollLeft > 4);
    setFeaturedCanScrollNext(el.scrollLeft < maxScroll);
  };

  useEffect(() => {
    const el = featuredTrackRef.current;
    updateFeaturedCarouselState();
    const handleScroll = () => updateFeaturedCarouselState();
    const handleResize = () => updateFeaturedCarouselState();
    if (el) el.addEventListener('scroll', handleScroll, { passive:true });
    window.addEventListener('resize', handleResize);
    return () => {
      if (el) el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [shouldShowFeaturedProjects, featuredBrowseProjects.length]);

  const scrollFeaturedCarousel = (direction = 1) => {
    const el = featuredTrackRef.current;
    if (!el) return;
    const step = Math.min(Math.max(el.clientWidth * 0.64, 220), 320);
    el.scrollBy({ left: direction * step, behavior:'smooth' });
  };

  const handleFeaturedPointerDown = (e) => {
    const el = featuredTrackRef.current;
    if (!el) return;
    // Cancel any in-flight momentum so a fresh grab feels responsive.
    if (stripMomentumRafRef.current) {
      cancelAnimationFrame(stripMomentumRafRef.current);
      stripMomentumRafRef.current = null;
    }
    // Identify which card is under the pointer — used for the lift effect.
    const cardEl = (e.target && e.target.closest) ? e.target.closest('[data-strip-card-id]') : null;
    const cardId = cardEl ? cardEl.getAttribute('data-strip-card-id') : null;
    featuredDragRef.current = {
      active:true,
      pointerId:e.pointerId,
      startX:e.clientX,
      scrollLeft:el.scrollLeft,
      moved:false,
    };
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    stripVelocityRef.current = { samples: [{ x: e.clientX, t: now }], lastX: e.clientX, lastT: now };
    featuredClickSuppressRef.current = false;
    if (cardId) setStripPressedCardId(cardId);
    try { el.setPointerCapture(e.pointerId); } catch {}
    el.style.scrollSnapType = 'none';
  };

  const handleFeaturedPointerMove = (e) => {
    const el = featuredTrackRef.current;
    const state = featuredDragRef.current;
    if (!el || !state.active) return;
    const dx = e.clientX - state.startX;
    if (!state.moved && Math.abs(dx) > 5) {
      state.moved = true;
      setStripIsDragging(true);
      featuredClickSuppressRef.current = true;
    }
    if (state.moved) {
      el.scrollLeft = state.scrollLeft - dx;
      // Track last few samples for release-velocity calculation.
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const samples = stripVelocityRef.current.samples;
      samples.push({ x: e.clientX, t: now });
      if (samples.length > 6) samples.shift();
      stripVelocityRef.current.lastX = e.clientX;
      stripVelocityRef.current.lastT = now;
    }
  };

  const finishFeaturedPointer = (e) => {
    const el = featuredTrackRef.current;
    const state = featuredDragRef.current;
    if (!el || !state.active) return;
    state.active = false;
    try { if (state.pointerId != null) el.releasePointerCapture(state.pointerId); } catch {}
    el.style.scrollSnapType = '';
    setStripPressedCardId(null);
    setStripIsDragging(false);
    // Compute release velocity from the most recent samples and start
    // momentum if the user flicked. Pure click-with-no-drag skips this
    // entirely so click-through stays snappy.
    if (state.moved) {
      const samples = stripVelocityRef.current.samples;
      if (samples.length >= 2) {
        const last = samples[samples.length - 1];
        const first = samples[Math.max(0, samples.length - 4)];
        const dt = last.t - first.t;
        const dx = last.x - first.x;
        const vel = dt > 0 ? (dx / dt) * 16 : 0; // px per ~60fps frame
        if (Math.abs(vel) > 2) {
          let v = vel;
          const decay = 0.93;
          const tick = () => {
            const node = featuredTrackRef.current;
            if (!node) { stripMomentumRafRef.current = null; return; }
            node.scrollLeft -= v;
            v *= decay;
            const atStart = node.scrollLeft <= 0;
            const atEnd = node.scrollLeft >= node.scrollWidth - node.clientWidth - 0.5;
            if (Math.abs(v) > 0.4 && !atStart && !atEnd) {
              stripMomentumRafRef.current = requestAnimationFrame(tick);
            } else {
              stripMomentumRafRef.current = null;
              try { updateFeaturedCarouselState(); } catch {}
            }
          };
          stripMomentumRafRef.current = requestAnimationFrame(tick);
        }
      }
    }
    try { updateFeaturedCarouselState(); } catch {}
    window.setTimeout(() => { featuredClickSuppressRef.current = false; }, 90);
  };

  // Cancel any pending momentum frame on unmount so we don't leak rAFs
  // or write to a detached scroll container after the screen unmounts.
  useEffect(() => {
    return () => {
      if (stripMomentumRafRef.current) {
        cancelAnimationFrame(stripMomentumRafRef.current);
        stripMomentumRafRef.current = null;
      }
    };
  }, []);

  // Infinite-scroll replaces page-based pagination. Vendors scan a project
  // marketplace; they don't navigate it. We render the first PROJECTS_PER_PAGE
  // up front, then load another batch each time the sentinel comes into view.
  // Resets to the initial batch whenever filters change, so a vendor doesn't
  // get stranded scrolling stale results after they refine.
  const PROJECTS_PER_PAGE = 24;
  const [visibleCount, setVisibleCount] = useState(PROJECTS_PER_PAGE);
  const loadMoreSentinelRef = useRef(null);
  const gridProjects = useMemo(
    () => browseGridSource.slice(0, visibleCount),
    [browseGridSource, visibleCount]
  );
  // Two reasons the sentinel could fire: the client window has more
  // already-loaded projects to reveal (cheap), or the client window is at
  // the end of what we've fetched and we need to ask the server for more
  // (network cost). hasMoreToLoad covers either: the load-more sentinel
  // stays in the DOM, the observer keeps watching, and the callback decides
  // which action to take.
  const hasMoreToLoad = visibleCount < browseGridSource.length || hasMoreServerProjects;
  useEffect(() => {
    setVisibleCount(PROJECTS_PER_PAGE);
  }, [search, catFilter, locationFilter, budgetFilter, sortBy, savedOnly, urgentOnly, reviewingOnly]);
  useEffect(() => {
    if (!hasMoreToLoad) return undefined;
    const node = loadMoreSentinelRef.current;
    if (!node || typeof IntersectionObserver !== 'function') return undefined;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry || !entry.isIntersecting) return;
      // First, advance the client-side window. If this exhausts what we have
      // and there's more on the server, also trigger the server fetch.
      // Doing both in one tick avoids a "scroll, wait, scroll, wait" feel —
      // the next batch starts loading before the vendor reaches the bottom.
      setVisibleCount(prev => {
        const next = Math.min(prev + PROJECTS_PER_PAGE, browseGridSource.length);
        const exhaustedClient = next >= browseGridSource.length;
        if (exhaustedClient && hasMoreServerProjects && !loadingMoreServerProjects && typeof loadMoreProjects === 'function') {
          // Defer to next tick so the setState above commits cleanly before
          // the parent's loadMoreProjects fires its own state updates.
          Promise.resolve().then(() => loadMoreProjects());
        }
        return next;
      });
    }, { rootMargin: '600px 0px' }); // start loading well before the user hits the bottom
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreToLoad, browseGridSource.length, hasMoreServerProjects, loadingMoreServerProjects, loadMoreProjects]);

  const totalOpen = openProjects.length;
  const urgentCount = openProjects.filter(p => !!p.urgent).length;
  const reviewingCount = openProjects.filter(p => Number(p.bids || 0) >= 4).length;
  const activePipeline = openProjects.reduce((sum, p) => sum + parseBudgetNumber(p.budget), 0);
  const savedCount = savedIds.size;
  const hasActiveFilters = hasBrowseRefinements;
  const activeFilterCount = (debouncedSearch.trim() ? 1 : 0) + (catFilter !== 'All' ? 1 : 0) + (locationFilter !== 'All Locations' ? 1 : 0) + (budgetFilter !== 'Budget: Any' ? 1 : 0) + (sortBy !== 'best_match' ? 1 : 0) + (savedOnly ? 1 : 0) + (urgentOnly ? 1 : 0) + (reviewingOnly ? 1 : 0);
  const openProjectsHeading = 'Live projects';

  // ── Posting velocity ──────────────────────────────────────────────────────
  // Computed once per openProjects change so the meta strip can show liveness
  // ("12 new this week", "3 posted today") without rescanning per render.
  // Tells vendors the platform is moving — the difference between "worth
  // checking back" and "stale".
  const postingVelocity = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    let today = 0, week = 0;
    openProjects.forEach(p => {
      const ts = new Date(p.posted_at || p.created_at || 0).getTime();
      if (!ts) return;
      const ageMs = now - ts;
      if (ageMs <= day) today += 1;
      if (ageMs <= 7 * day) week += 1;
    });
    return { today, week };
  }, [openProjects]);

  // ── "Best for you" (vendor personalization) ───────────────────────────────
  // Uses the existing scoreProjectForVendorLane helper. Hidden when the
  // vendor has no profile signal at all (we'd just rank by recency, which
  // duplicates the main grid), or when filters are active (the strip
  // confuses the result count). Cap at 2 — the strip is a hint, not a list;
  // the full grid is right below it.
  const bestForYouProjects = useMemo(() => {
    if (!viewerVendorProfile || hasBrowseRefinements) return [];
    const scored = openProjects
      .map(p => scoreProjectForVendorLane(p, viewerVendorProfile))
      .filter(p => (p.fitScore || 0) >= 70) // only surface real matches, not "anything available"
      .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0) || Number(!!b.urgent) - Number(!!a.urgent));
    return scored.slice(0, 2);
  }, [openProjects, viewerVendorProfile, hasBrowseRefinements]);

  // ── Empty-state alternatives ──────────────────────────────────────────────
  // When a filter combo returns 0, instead of dead-ending the vendor we
  // compute the strongest single-filter relaxation that would yield results.
  // Tried in order of how "nearby" the relaxation is — drop the city first
  // (geographic flex), then budget, then category — because that's the order
  // most vendors would mentally accept.
  const emptyStateAlternatives = useMemo(() => {
    if (!hasBrowseRefinements) return [];
    if (filteredProjects.length > 0) return [];
    const term = debouncedSearch.trim().toLowerCase();
    const termCanonicalCats = term ? __kbCanonicalizeToCategories(term) : new Set();
    const matchesSearch = (project) => {
      if (!term) return true;
      const projectLocation = String(getProjectLocationLabel(project) || '').toLowerCase();
      const direct = [project.title, project.church, project.church_name, project.city, project.category, project.description, projectLocation]
        .some(val => String(val || '').toLowerCase().includes(term));
      if (direct) return true;
      if (!termCanonicalCats.size) return false;
      const projectCats = __kbDeriveProjectCategories(project);
      for (const c of termCanonicalCats) if (projectCats.has(c)) return true;
      return false;
    };
    const candidates = [];
    // Drop location (most common acceptable relaxation).
    if (locationFilter !== 'All Locations') {
      const matches = openProjects.filter(p =>
        matchesSearch(p) &&
        (catFilter === 'All' || String(p.category || '') === catFilter) &&
        matchesBudgetBand(p, budgetFilter) &&
        (!urgentOnly || !!p.urgent) &&
        (!reviewingOnly || Number(p.bids || 0) >= 4)
      );
      if (matches.length > 0) {
        const cityLabel = catFilter !== 'All' ? `${formatMarketplaceCategoryLabel(catFilter, catFilter).toLowerCase()} projects` : 'projects';
        candidates.push({
          key: 'drop-location',
          label: `${matches.length} ${cityLabel} in other locations`,
          apply: () => setLocationFilter('All Locations'),
        });
      }
    }
    // Drop budget band.
    if (budgetFilter !== 'Budget: Any') {
      const matches = openProjects.filter(p =>
        matchesSearch(p) &&
        (catFilter === 'All' || String(p.category || '') === catFilter) &&
        (locationFilter === 'All Locations' || String(getProjectLocationLabel(p) || '').trim() === locationFilter) &&
        (!urgentOnly || !!p.urgent) &&
        (!reviewingOnly || Number(p.bids || 0) >= 4)
      );
      if (matches.length > 0) candidates.push({
        key: 'drop-budget',
        label: `${matches.length} match outside this budget band`,
        apply: () => setBudgetFilter('Budget: Any'),
      });
    }
    // Drop urgency / reviewing toggles.
    if (urgentOnly || reviewingOnly) {
      const matches = openProjects.filter(p =>
        matchesSearch(p) &&
        (catFilter === 'All' || String(p.category || '') === catFilter) &&
        (locationFilter === 'All Locations' || String(getProjectLocationLabel(p) || '').trim() === locationFilter) &&
        matchesBudgetBand(p, budgetFilter)
      );
      if (matches.length > 0) candidates.push({
        key: 'drop-state',
        label: `${matches.length} match without the ${urgentOnly ? 'Urgent' : 'Active bidding'} filter`,
        apply: () => { setUrgentOnly(false); setReviewingOnly(false); },
      });
    }
    // Drop category as last resort (biggest relaxation).
    if (catFilter !== 'All') {
      const matches = openProjects.filter(p =>
        matchesSearch(p) &&
        (locationFilter === 'All Locations' || String(getProjectLocationLabel(p) || '').trim() === locationFilter) &&
        matchesBudgetBand(p, budgetFilter) &&
        (!urgentOnly || !!p.urgent) &&
        (!reviewingOnly || Number(p.bids || 0) >= 4)
      );
      if (matches.length > 0) candidates.push({
        key: 'drop-category',
        label: `${matches.length} in other categories`,
        apply: () => setCatFilter('All'),
      });
    }
    return candidates.slice(0, 3);
  }, [hasBrowseRefinements, filteredProjects.length, openProjects, debouncedSearch, catFilter, locationFilter, budgetFilter, savedOnly, urgentOnly, reviewingOnly]);

  // ── Project freshness signal ──────────────────────────────────────────────
  // Surfaces the difference between "posted yesterday with 0 bids = opportunity"
  // and "posted 14 days ago with 0 bids = probably stale". Returns null for
  // projects where neither read applies, so the card stays clean.
  const getProjectFreshnessSignal = (project) => {
    const ageDays = getProjectFreshness(project);
    const bids = Number(project?.bids || project?.bids_count || 0);
    if (ageDays == null) return null;
    if (ageDays <= 1 && bids === 0) return { kind: 'fresh', label: 'Be first', tone: 'fresh' };
    if (ageDays >= 10 && bids === 0) return { kind: 'stale', label: 'Posted 10+ days ago', tone: 'stale' };
    if (ageDays >= 3 && bids <= 1) return { kind: 'low_competition', label: 'Low competition', tone: 'fresh' };
    return null;
  };

  const handleToggleSave = async (project, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const projectId = project?.id || null;
    if (!currentUser?.id) {
      showToast && showToast('Sign in to save projects.', 'error');
      return;
    }
    if (!projectId) {
      showToast && showToast("Couldn't save this project yet.", 'error');
      return;
    }

    const id = String(projectId);
    const willSave = !savedIds.has(id);
    try {
      // 0170 — commit durable state first. Do not show a successful bookmark
      // or Saved Projects membership until Supabase has actually accepted it.
      await persistSavedProjectRecord(projectId, willSave, currentUser.id);

      setSavedIds(prev => {
        const next = new Set(prev);
        if (willSave) next.add(id);
        else next.delete(id);
        return next;
      });

      if (willSave) {
        let compareLimitReached = false;
        setSavedAtMap(prevMap => ({ ...prevMap, [id]: new Date().toISOString() }));
        updateProjectInteropEntry(projectId, prevEntry => ({
          ...prevEntry,
          saved: true,
          priority: prevEntry.priority || 'watching',
          sourceContext: { ...(prevEntry.sourceContext || {}), lastTouchedScreen:'marketplace', lastTouchedAt:new Date().toISOString() },
          notifications:[{ id:`save-${Date.now()}`, text:`${project?.title || 'Project'} saved from Marketplace`, tone:'info', createdAt:new Date().toISOString() }, ...(prevEntry.notifications || [])].slice(0,12),
          attention:[`Saved from Marketplace`, ...((prevEntry.attention || []).filter(Boolean))].slice(0,8),
        }));
        try {
          const compareResult = upsertCompareWorkspaceItem('projects', {
            id: projectId,
            title: project?.title || 'Saved project',
            category: project?.category || null,
            church: project?.church || project?.church_name || null,
            city: project?.city || null,
            budget: project?.budget || null,
            urgent: !!project?.urgent,
            posted_at: project?.posted_at || null,
            source: 'marketplace-save',
          });
          compareLimitReached = !!compareResult?.compareLimitReached;
        } catch(err) { logError('marketplace-save-telemetry', err); }
        showToast && showToast(compareLimitReached
          ? `Project saved, but ${getCompareWorkspaceLimitMessage('projects').toLowerCase()}`
          : 'Project saved', compareLimitReached ? 'error' : undefined);
      } else {
        setSavedAtMap(prevMap => {
          if (!Object.prototype.hasOwnProperty.call(prevMap, id)) return prevMap;
          const copy = { ...prevMap };
          delete copy[id];
          return copy;
        });
        updateProjectInteropEntry(projectId, prevEntry => ({
          ...prevEntry,
          saved: false,
          attention:[`Removed from saved projects`, ...((prevEntry.attention || []).filter(Boolean))].slice(0,8),
        }));
        try { removeCompareWorkspaceItem('projects', projectId); } catch {}
        showToast && showToast('Removed from saved projects');
      }
      setInteropVersion(v => v + 1);
    } catch (err) {
      logError('marketplace-save-project', err, { projectId, userId:currentUser.id, willSave });
      showToast && showToast(willSave ? "Couldn't save project. Please try again." : "Couldn't remove saved project. Please try again.", 'error');
    }
  };

  const clearBoardFilters = (options = {}) => {
    setSearch('');
    setCatFilter('All');
    setLocationFilter('All Locations');
    setBudgetFilter('Budget: Any');
    setSortBy('best_match');
    setSavedOnly(false);
    setUrgentOnly(false);
    setReviewingOnly(false);
    setShowAdvancedFilters(false);
    if (options?.closeSheet) setFilterSheetOpen(false);
    if (options?.announce !== false) showToast && showToast('Marketplace filters reset');
  };

  // ── Saved-search handlers ─────────────────────────────────────────────────
  // Snapshot the current filter combo and restore it later. We derive a
  // default name from the most distinctive filters so the prompt comes
  // pre-filled with something sensible — saving a search shouldn't feel like
  // a bureaucratic step.
  const deriveSavedSearchName = () => {
    const parts = [];
    if (catFilter !== 'All') parts.push(formatMarketplaceCategoryLabel(catFilter, catFilter));
    if (locationFilter !== 'All Locations') parts.push(locationFilter);
    if (budgetFilter !== 'Budget: Any') parts.push(budgetFilter.replace('Budget: ',''));
    if (urgentOnly) parts.push('Urgent');
    if (reviewingOnly) parts.push('Active bidding');
    if (debouncedSearch.trim()) parts.push(`"${debouncedSearch.trim().slice(0, 24)}"`);
    return parts.length ? parts.slice(0, 3).join(' · ') : 'My search';
  };

  const handleSaveCurrentSearch = () => {
    if (!hasBrowseRefinements) {
      showToast && showToast('Apply at least one filter first');
      return;
    }
    setSaveSearchModal({ suggested: deriveSavedSearchName() });
  };

  const commitSaveSearch = (name) => {
    const trimmed = (name || '').trim().slice(0, 60);
    if (!trimmed) return;
    const entry = {
      id: `ss-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmed,
      search: debouncedSearch.trim(),
      catFilter,
      locationFilter,
      budgetFilter,
      sortBy,
      savedOnly,
      urgentOnly,
      reviewingOnly,
      createdAt: new Date().toISOString(),
    };
    setSavedSearches(prev => {
      const filtered = prev.filter(s => String(s.name || '').toLowerCase() !== trimmed.toLowerCase());
      return [entry, ...filtered].slice(0, 6);
    });
    showToast && showToast(`Saved "${trimmed}"`);
    setSaveSearchModal(null);
  };

  const applySavedSearch = (entry) => {
    if (!entry) return;
    setSearch(entry.search || '');
    setCatFilter(entry.catFilter || 'All');
    setLocationFilter(entry.locationFilter || 'All Locations');
    setBudgetFilter(entry.budgetFilter || 'Budget: Any');
    setSortBy(entry.sortBy || 'best_match');
    setSavedOnly(!!entry.savedOnly);
    setUrgentOnly(!!entry.urgentOnly);
    setReviewingOnly(!!entry.reviewingOnly);
    showToast && showToast(`Applied "${entry.name}"`);
  };

  const deleteSavedSearch = (id) => {
    const entry = savedSearches.find(s => s.id === id);
    if (!entry) return;
    // Clear any pending undo timer from a previous deletion
    if (deletedSearch?.timer) clearTimeout(deletedSearch.timer);
    setSavedSearches(prev => prev.filter(s => s.id !== id));
    const timer = setTimeout(() => setDeletedSearch(null), 4500);
    setDeletedSearch({ entry, timer });
    showToast && showToast(`Removed saved search "${entry.name}"`);
  };

  const undoDeleteSavedSearch = () => {
    if (!deletedSearch) return;
    clearTimeout(deletedSearch.timer);
    setSavedSearches(prev => {
      if (prev.find(s => s.id === deletedSearch.entry.id)) return prev;
      return [deletedSearch.entry, ...prev].slice(0, 6);
    });
    showToast && showToast(`Restored "${deletedSearch.entry.name}"`);
    setDeletedSearch(null);
  };

  const openProject = (project) => {
    stashBoardScroll();
    onSelect && onSelect(project);
  };

  const browseQuickFilters = [
    {
      key: 'all',
      label: 'All projects',
      active: !savedOnly && !urgentOnly && !reviewingOnly && catFilter === 'All' && locationFilter === 'All Locations' && budgetFilter === 'Budget: Any' && !debouncedSearch.trim(),
      count: totalOpen,
      onClick: clearBoardFilters,
    },
    {
      key: 'urgent',
      label: 'Urgent',
      active: urgentOnly,
      count: urgentCount,
      disabled: urgentCount === 0,
      onClick: () => { setUrgentOnly(true); setSavedOnly(false); setReviewingOnly(false); setSortBy('urgent'); },
    },
    {
      key: 'reviewing',
      label: 'Active bidding',
      active: reviewingOnly,
      count: reviewingCount,
      disabled: reviewingCount === 0,
      onClick: () => { setReviewingOnly(true); setUrgentOnly(false); setSavedOnly(false); setSortBy('proposals'); },
    },
    {
      key: 'saved',
      label: 'Saved',
      active: savedOnly,
      count: savedCount,
      disabled: savedCount === 0,
      onClick: () => { setSavedOnly(true); setUrgentOnly(false); setReviewingOnly(false); },
    },
  ];

  const activeFilterLabels = [
    debouncedSearch.trim() ? `Search: ${debouncedSearch.trim()}` : null,
    catFilter !== 'All' ? formatMarketplaceCategoryLabel(catFilter, catFilter) : null,
    locationFilter !== 'All Locations' ? locationFilter : null,
    budgetFilter !== 'Budget: Any' ? budgetFilter : null,
    sortBy !== 'best_match' ? ({ newest:'Newest', budget:'Highest budget', proposals:'Most proposals', urgent:'Urgent first' }[sortBy] || sortBy) : null,
    savedOnly ? 'Saved only' : null,
    urgentOnly ? 'Urgent only' : null,
    reviewingOnly ? 'Active bidding' : null,
  ].filter(Boolean);


  const openVendorProfile = (vendor) => {
    const seeded = buildVendorProfileSeed(vendor);
    const vendorId = seeded.id || seeded.user_id || seeded.vendorId || null;
    stashBoardScroll();
    rememberReturnContext({ scope:'vendor-directory', screen:'vendors', vendorId });
    if (typeof onSelectVendorProfile === 'function') {
      onSelectVendorProfile(seeded);
      return;
    }
    queueVendorNavigation(nav, seeded, { returnContext:{ scope:'vendor-directory', screen:'vendors', vendorId } });
    showToast && showToast(`Opening ${seeded.name}`);
  };

  const vendorDataset = useMemo(() => getMarketplaceVendorDataset(marketplaceVendors), [marketplaceVendors]);
  const vendorCards = vendorDataset.shelf;
  const vendorDirectory = vendorDataset.directory;
  const topVendorAvgRating = vendorCards.length ? (vendorCards.reduce((sum, v) => sum + Number(v.rating || 0), 0) / vendorCards.length).toFixed(1) : '—';
  const topVendorReviewCount = vendorCards.reduce((sum, v) => sum + Number(v.reviews || 0), 0);
  const topVendorProjectCount = vendorCards.reduce((sum, v) => sum + Number(v.projects || 0), 0);


  const toggleVendorSave = (vendorId, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const key = String(vendorId || '');
    if (!key) return;
    setSavedVendorIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        showToast && showToast('Removed vendor from saved vendors');
      } else {
        next.add(key);
        showToast && showToast('Saved vendor');
      }
      return next;
    });
  };

  const marketplaceVisualProjectTargets = useMemo(() => {
    const seen = new Set();
    const pool = [];
    const addProject = (project) => {
      if (!project) return;
      const key = String(project.id ?? project.title ?? pool.length);
      if (seen.has(key)) return;
      seen.add(key);
      pool.push(project);
    };
    (openProjects || []).forEach(addProject);
    return pool.slice(0, 12);
  }, [openProjects]);

  /* ╔══ V43 — CARD/PROJECT MAPPING HELPERS ════════════════════════════════════
     Cards in the Featured rail and themed rows currently render hardcoded
     title/budget/category strings while clicking opens marketplaceVisualProjectTargets[target].
     The two were never linked. These helpers let cards display the same project
     they open — one source of truth — without rewiring the click chain.
     Curated images stay; only text reads from live data. ═══════════════════════ */
  const liveCardData = (slot, fallback = {}) => {
    const project = marketplaceVisualProjectTargets?.[slot] || null;
    const fbBudget = fallback.budget || fallback.price || '';
    const fbMeta = fallback.meta || fallback.timeline || '';
    if (!project) {
      return {
        project: null,
        title: fallback.title,
        category: getProjectCardCategoryLabel(fallback, fallback.category || 'Project'),
        budget: fbBudget || '$—',
        proposals: fbMeta || 'New listing',
        image: getProjectHeroImage(fallback) || fallback.image || '',
        sub: fallback.sub,
        left: fallback.left,
        summary: getProjectCardBriefLine(fallback, fallback.summary || fallback.sub || 'Open ministry brief ready for aligned vendors.'),
        timeline: getProjectCardTimelineLabel(fallback, fbMeta || 'Open'),
      };
    }
    const bidN = Number(project.bids || project.bids_count || 0) || 0;
    const proposalLabel = bidN > 0 ? `${bidN} proposal${bidN === 1 ? '' : 's'}` : (fbMeta || 'New listing');
    const rawBudget = String(project.budget || '').trim();
    const budgetMatch = rawBudget.match(/\$[\d,]+(?:[kKmM])?(?:\s*[-–]\s*\$[\d,]+(?:[kKmM])?)?/);
    const budgetDisplay = budgetMatch ? budgetMatch[0] : (rawBudget && rawBudget.length <= 22 ? rawBudget : (fbBudget || '$—'));
    return {
      project,
      title: project.title || fallback.title,
      category: getProjectCardCategoryLabel(project, project.category || fallback.category),
      budget: budgetDisplay,
      proposals: proposalLabel,
      image: getProjectHeroImage(project) || getProjectHeroImage(fallback) || fallback.image || '',
      sub: fallback.sub,
      left: fallback.left,
      summary: getProjectCardBriefLine(project, fallback.summary || fallback.sub || 'Open ministry brief ready for aligned vendors.'),
      timeline: getProjectCardTimelineLabel(project, fbMeta || 'Open'),
    };
  };

  // Real-data pool for the All Projects grid: live filtered/open projects,
  // deduped by id/title, capped at 12 to preserve page rhythm.
  const liveAllProjects = useMemo(() => {
    const seen = new Set();
    const out = [];
    // The toolbar belongs only to All project briefs. Empty persisted data and
    // empty filtered results both remain truthful; neither is backfilled.
    const filtered = Array.isArray(filteredProjects) ? filteredProjects : [];
    const open = Array.isArray(openProjects) ? openProjects : [];
    const sources = hasBrowseRefinements
      ? [filtered]
      : [filtered.length ? filtered : open];
    for (const source of sources) {
      for (const p of source) {
        if (!p) continue;
        const key = String(p.id ?? p.title ?? out.length);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(p);
        if (out.length >= 12) return out;
      }
    }
    return out;
  }, [filteredProjects, openProjects, hasBrowseRefinements]);

  // Pick a curated cover image based on the project's category/title — keeps
  // the All Projects grid visually consistent with the curated rows above.
  const pickImageForProject = (project, index = 0) => {
    return pickMarketplacePresetImage(project, index);
  };

  // Click handler for All Projects cards: opens the actual project, not via the
  // target-index indirection. Honors the same drag-suppression contract.
  const handleAllProjectsCardClick = (project, event) => {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (liveVisualSuppressClickRef.current) return;
    if (!project) { showToast && showToast('Project unavailable.', 'error'); return; }
    openProject(project);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  };
  /* ╚════════════════════════════════════════════════════════════════════════ */

  const openMarketplaceVisualProject = (index) => {
    const numericIndex = Number.isFinite(Number(index)) ? Number(index) : 0;
    const project = marketplaceVisualProjectTargets[numericIndex] || marketplaceVisualProjectTargets[0];
    if (!project) {
      showToast && showToast('Project unavailable. Try the project grid below.', 'error');
      return;
    }
    openProject(project);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  };

  const applyMarketplaceVisualCategory = (terms = [], fallback = 'All') => {
    const needles = terms.map(t => String(t || '').toLowerCase()).filter(Boolean);
    const availableCategories = Array.from(new Set((openProjects || []).map(p => String(p?.category || '').trim()).filter(Boolean)));
    const found = availableCategories.find(category => {
      const hay = category.toLowerCase();
      return needles.some(term => hay.includes(term));
    });
    setSavedOnly(false);
    setUrgentOnly(false);
    setReviewingOnly(false);
    setLocationFilter('All Locations');
    setBudgetFilter('Budget: Any');
    setCatFilter(found || fallback || 'All');
  };

  const handleMarketplaceVisualControl = (action) => {
    switch (action) {
      case 'nav-logo':
      case 'nav-dashboard':
        nav && nav('landing');
        break;
      case 'nav-projects':
        nav && nav('my-projects');
        break;
      case 'nav-messages':
        nav && nav('messages');
        break;
      case 'nav-marketplace':
        nav && nav('marketplace');
        break;
      case 'nav-notifications':
        nav && nav('activity');
        break;
      case 'nav-profile':
        nav && nav('profile');
        break;
      case 'filter-all':
        clearBoardFilters({ announce: false });
        break;
      case 'filter-design':
        applyMarketplaceVisualCategory(['design', 'brand', 'creative', 'graphic'], 'All');
        break;
      case 'filter-technology':
        applyMarketplaceVisualCategory(['technology', 'web', 'app', 'software', 'systems'], 'All');
        break;
      case 'filter-video':
        applyMarketplaceVisualCategory(['video', 'livestream', 'audio', 'visual', 'production'], 'All');
        break;
      case 'filter-marketing':
        applyMarketplaceVisualCategory(['marketing', 'social', 'communications'], 'All');
        break;
      case 'filter-writing':
        applyMarketplaceVisualCategory(['writing', 'copy', 'newsletter', 'content'], 'All');
        break;
      case 'more-filters':
        setFilterSheetOpen(true);
        break;
      case 'sort-toggle':
        setSortBy(prev => prev === 'best_match' ? 'newest' : prev === 'newest' ? 'budget' : prev === 'budget' ? 'proposals' : 'best_match');
        break;
      case 'featured-prev':
      case 'featured-next':
      case 'mission-next':
      case 'popular-next':
        showToast && showToast('Drag rows to browse more projects');
        break;
      case 'view-mission':
      case 'view-popular':
        setSortBy('proposals');
        break;
      case 'view-closing':
        setUrgentOnly(true);
        setSavedOnly(false);
        setReviewingOnly(false);
        setSortBy('urgent');
        break;
      case 'grid-view':
        setGridDensity('comfortable');
        showToast && showToast('Grid view active');
        break;
      case 'list-view':
        setGridDensity('compact');
        showToast && showToast('Compact view active');
        break;
      default:
        break;
    }
  };

  const liveVisualDragRef = useRef({ active: false, x: 0, left: 0, moved: false });
  const liveVisualSuppressClickRef = useRef(false);
  const liveVisualOpenRef = useRef({ target: null, at: 0 });

  // V90 cleanup: removed the old v86 mousemove tilt/parallax effect.
  // The featured rail now relies on native horizontal scroll plus the pointer
  // drag handlers below, which keeps the current look but removes scroll jank.

  const liveFeaturedCards = marketplaceVisualProjectTargets.slice(1, 6).map((project, index) => ({
    project,
    target: index + 1,
  }));

  const marketplaceIntelligenceStats = useMemo(() => {
    const open = Array.isArray(openProjects) ? openProjects : [];
    const source = open;
    const budgets = source.map(p => {
      const raw = String(p?.budget || p?.price || p?.budgetRange || '');
      const nums = raw.match(/[\d,]+/g)?.map(n => Number(n.replace(/,/g, ''))).filter(n => Number.isFinite(n)) || [];
      if (!nums.length) return null;
      return Math.round(nums.reduce((sum, n) => sum + n, 0) / nums.length);
    }).filter(n => Number.isFinite(n));
    const avgBudget = budgets.length ? Math.round(budgets.reduce((sum, n) => sum + n, 0) / budgets.length / 100) * 100 : null;
    const closing = source.filter(p => p?.urgent || String(p?.timeline || p?.deadline || '').toLowerCase().includes('day')).length;
    return {
      open: source.length,
      closing,
      avgBudget,
    };
  }, [openProjects]);

  // V56 — vendor tab crash fix: keep this return AFTER every hook in ProjectBoard.
  // Previously the Vendors sub-tab returned before the later useMemo/useRef/useState calls below,
  // so switching Browse → Vendors could trigger React's "rendered fewer hooks" crash.
  if (showAllVendors && role !== 'vendor') {
    return (
      <AllVendorsLanding
        role={role}
        nav={nav}
        onPost={onPost}
        onBack={() => {
          if (projectTab === 'vendors' && typeof onTabSwitch === 'function') {
            onTabSwitch('browse');
            return;
          }
          setShowAllVendors(false);
          requestAnimationFrame(() => restoreBoardScroll());
        }}
        showToast={showToast}
        onSelectVendor={openVendorProfile}
        vendors={marketplaceVendors}
        vendorsLoading={vendorsLoading}
        savedVendorIds={savedVendorIds}
        onToggleSave={toggleVendorSave}
        currentUser={currentUser}
        contextProjects={myActiveProjects}
      />
    );
  }

  const openLiveVisualTarget = (target) => {
    const now = Date.now();
    const prev = liveVisualOpenRef.current || {};
    if (prev.target === target && now - Number(prev.at || 0) < 350) return;
    liveVisualOpenRef.current = { target, at: now };
    openMarketplaceVisualProject(target);
  };

  const handleLiveVisualCardClick = (target, event) => {
    event.preventDefault();
    event.stopPropagation();
    const row = event.currentTarget?.closest?.('.kb-live-featured-row');
    if (row?.dataset?.dragging === 'true') return;
    openLiveVisualTarget(target);
  };
  const handleLiveRailPointerDown = (event) => {
    const rail = event.currentTarget;
    if (liveVisualDragRef.current.raf) cancelAnimationFrame(liveVisualDragRef.current.raf);
    liveVisualDragRef.current = { active: true, x: event.clientX, left: rail.scrollLeft, moved: false, vx: 0, lastX: event.clientX, lastT: Date.now(), raf: null };
    rail.classList.add('is-dragging');
    try { rail.setPointerCapture(event.pointerId); } catch {}
  };
  const handleLiveRailPointerMove = (event) => {
    const state = liveVisualDragRef.current;
    if (!state.active) return;
    const rail = event.currentTarget;
    const dx = event.clientX - state.x;
    const now = Date.now();
    const dt = Math.max(1, now - state.lastT);
    state.vx = (event.clientX - state.lastX) / dt;
    state.lastX = event.clientX;
    state.lastT = now;
    if (Math.abs(dx) > 4) {
      state.moved = true;
      rail.dataset.dragging = 'true';
      liveVisualSuppressClickRef.current = true;
    }
    rail.scrollLeft = state.left - dx;
  };
  const handleLiveRailPointerUp = (event) => {
    const rail = event.currentTarget;
    const state = liveVisualDragRef.current;
    const moved = state.moved;
    let vx = state.vx * -1;
    state.active = false;
    rail.classList.remove('is-dragging');
    try { rail.releasePointerCapture(event.pointerId); } catch {}
    if (!moved) {
      liveVisualDragRef.current = { active: false, x: 0, left: 0, moved: false, vx: 0, lastX: 0, lastT: 0, raf: null };
      try {
        const hit = document.elementFromPoint(event.clientX, event.clientY);
        const card = hit?.closest?.('[data-live-project-target]');
        if (card && rail.contains(card)) {
          const target = Number(card.getAttribute('data-live-project-target'));
          if (Number.isFinite(target)) openLiveVisualTarget(target);
        }
      } catch {}
      return;
    }
    const decay = 0.94;
    const momentum = () => {
      vx *= decay;
      if (Math.abs(vx) < 0.3) {
        liveVisualDragRef.current.raf = null;
        window.setTimeout(() => { liveVisualSuppressClickRef.current = false; if (rail?.dataset) rail.dataset.dragging = 'false'; }, 40);
        return;
      }
      rail.scrollLeft += vx * 16;
      liveVisualDragRef.current.raf = requestAnimationFrame(momentum);
    };
    liveVisualDragRef.current.raf = requestAnimationFrame(momentum);
  };
  const scrollLiveRow = (selector, dir = 1) => {
    const row = document.querySelector(selector);
    if (!row) return;
    const cardW = row.querySelector('.kb-live-feature-card')?.offsetWidth || 260;
    row.scrollBy({ left: dir * (cardW + 12), behavior: 'smooth' });
  };

  useEffect(() => {
    kbPerfAfterPaint("project-board-painted", {
      role,
      projectCount: Array.isArray(projects) ? projects.length : 0,
      filteredCount: Array.isArray(filteredProjects) ? filteredProjects.length : 0,
    });
  }, [role, projects?.length, filteredProjects?.length]);

  return (
    <div className={`kb-live-marketplace-page${role === 'vendor' ? ' kb-vendor-open-projects-page' : ''} kb-church-projects-marketplace-page kb-mp-mobile-unified-page kb-mp-mobile-unified-churchprojects kb-mp-exact-marketplace-page kb-mp-exact-marketplace-churchprojects`}>
      <ChurchProjectsMarketplaceHero
        isVendor={role === 'vendor'}
        onPost={onPost}
        onFindVendors={() => typeof onTabSwitch === 'function' ? onTabSwitch('vendors') : null}
        onMyWork={() => typeof onTabSwitch === 'function' ? onTabSwitch('work') : null}
        onBrowseProjects={() => {
          const target = typeof document !== 'undefined' ? document.querySelector('.kb-live-handpicked-hero') : null;
          if (target && typeof target.scrollIntoView === 'function') target.scrollIntoView({ behavior:'smooth', block:'start' });
        }}
        onSavedProjects={() => typeof nav === 'function' && nav('saved-projects')}
      />


      



      


      <div className="kb-live-shell kb-mp-mobile-unified-shell kb-mp-exact-marketplace-shell">

        {/* Church Projects renders persisted inventory only; empty data remains explicit. */}
        <header className="kb-live-hero kb-live-handpicked-hero" aria-label="Open project briefs">
          <div className="kb-live-section-head kb-live-handpicked-masthead">
            <div className="kb-live-section-headline">
              <div className="kb-live-section-kicker">— Church Projects —</div>
              <h1 className="kb-live-section-title">{marketplaceIntelligenceStats.open ? 'Open project briefs' : 'No open project briefs yet'}</h1>
              {marketplaceIntelligenceStats.open ? (
                <div className="kb-live-feature-stats" aria-label="Open project snapshot">
                  <span>{marketplaceIntelligenceStats.open} open {marketplaceIntelligenceStats.open === 1 ? 'brief' : 'briefs'}</span>
                  {marketplaceIntelligenceStats.avgBudget !== null ? <span>${marketplaceIntelligenceStats.avgBudget.toLocaleString()} avg. budget</span> : null}
                  <span>{marketplaceIntelligenceStats.closing} closing soon</span>
                </div>
              ) : (
                <div className="kb-live-feature-stats" aria-label="Empty project marketplace">
                  <span>Real church projects will appear here as they are posted.</span>
                </div>
              )}
            </div>
            <button type="button" className="kb-marketplace-below-seam-action kb-marketplace-below-seam-action--church-projects" onClick={onPost}>
              <span>Post a Project</span>
              <span className="kb-marketplace-below-seam-action-arrow" aria-hidden="true">→</span>
            </button>
            {/* V71 — header is title/stats only; carousel controls live on the detached rail edges. */}
          </div>
        </header>

        {marketplaceVisualProjectTargets.length ? <section className="kb-live-featured is-bare kb-live-featured-detached" aria-label="Open projects">
          {/* V71 — barely-visible edge arrows replace the heavy header controls. */}
          <button type="button" className="kb-live-rail-edge-arrow kb-live-rail-edge-arrow-left" onClick={() => scrollLiveRow('.kb-live-featured-row', -1)} aria-label="Previous featured projects">←</button>
          <button type="button" className="kb-live-rail-edge-arrow kb-live-rail-edge-arrow-right" onClick={() => scrollLiveRow('.kb-live-featured-row', 1)} aria-label="Next featured projects">→</button>
          <div className="kb-live-featured-row" onPointerDown={handleLiveRailPointerDown} onPointerMove={handleLiveRailPointerMove} onPointerUp={handleLiveRailPointerUp} onPointerCancel={handleLiveRailPointerUp} onPointerLeave={handleLiveRailPointerUp}>
            {(() => {
              const leadFallback = { title: 'Project brief', category: 'Project', budget: '$—', meta: 'Open' };
              const lead = liveCardData(0, leadFallback);
              const leadProject = lead.project || leadFallback;
              const leadImage = getProjectHeroImage(leadProject) || lead.image || '';
              const leadTimelineLabel = lead.timeline || getProjectCardTimelineLabel(leadProject);
              return (
                <div className="faithbid-card-11a-rail-item">
                  <FaithBidCard11A
                    image={leadImage}
                    imageAlt=""
                    title={lead.title}
                    topLabel={lead.category}
                    avatarText={getInitialsSafe(leadProject?.church_name || leadProject?.church || 'FaithBid')}
                    meta={`${leadProject?.city || 'Remote'} · ${leadTimelineLabel} · ${lead.proposals || 'New listing'}`}
                    value={lead.budget}
                    actionLabel={role === 'vendor' ? 'Submit proposal' : 'Open project'}
                    onOpen={(event) => handleLiveVisualCardClick(0, event)}
                    onAction={(event) => handleLiveVisualCardClick(0, event)}
                    ariaLabel={`Open ${lead.title} brief`}
                  />
                </div>
              );
            })()}
            {liveFeaturedCards.map((card) => {
              const m = liveCardData(card.target, { title: 'Project brief', category: 'Project', budget: '$—', meta: 'Open' });
              const cardImage = getProjectHeroImage(m.project || {}) || m.image || '';
              const timelineLabel = m.timeline || getProjectCardTimelineLabel(m.project || {});
              return (
                <div key={m.project?.id || card.target} className="faithbid-card-11a-rail-item">
                  <FaithBidCard11A
                    image={cardImage}
                    imageAlt=""
                    title={m.title}
                    topLabel={m.category}
                    avatarText={getInitialsSafe(m.project?.church_name || m.project?.church || 'FaithBid')}
                    meta={`${m.project?.city || 'Remote'} · ${timelineLabel} · ${m.proposals || 'New listing'}`}
                    value={m.budget}
                    actionLabel={role === 'vendor' ? 'Submit proposal' : 'Open project'}
                    onOpen={(event) => handleLiveVisualCardClick(card.target, event)}
                    onAction={(event) => handleLiveVisualCardClick(card.target, event)}
                    ariaLabel={`Open ${m.title} brief`}
                  />
                </div>
              );
            })}
          </div>
        </section> : null}

        {/* V72 — compact Marketplace utility filter above All Project Briefs. Surgical: same state pipeline, smaller UI surface. */}
        <div className="kbm-mp-toolbar" role="search" aria-label="Filter open briefs">
          <div className="kbm-mp-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search briefs"
              aria-label="Search projects"
            />
            {search ? (
              <button type="button" className="kbm-mp-clear" onClick={() => setSearch('')} aria-label="Clear search">×</button>
            ) : null}
          </div>

          <div className="kbm-mp-filter-row" aria-label="Project brief filters">
            <label className="kbm-mp-control">
              <span>Category</span>
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filter by category">
                <option value="All">All categories</option>
                <option value="Web & Technology">Web & Tech</option>
                <option value="Creative Media">Creative</option>
                <option value="Marketing & Communications">Marketing</option>
                <option value="Tech / AV / Production">Tech / AV</option>
                <option value="Worship & Music">Worship</option>
                <option value="Construction & Renovation">Construction</option>
              </select>
            </label>

            <label className="kbm-mp-control kbm-mp-sort">
              <span>Sort</span>
              <select
                id="kbm-mp-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort project briefs"
              >
                <option value="best_match">Recommended</option>
                <option value="newest">Newest</option>
                <option value="closing_soon">Closing soon</option>
                <option value="budget">Highest budget</option>
                <option value="proposals">Most proposals</option>
                <option value="urgent">Urgent first</option>
              </select>
            </label>

            <button
              type="button"
              className={`kbm-mp-saved-toggle${savedOnly ? ' is-active' : ''}`}
              aria-pressed={savedOnly}
              onClick={() => setSavedOnly(v => !v)}
              title="Show only projects you saved"
            >
              Saved {savedIds.size > 0 ? `(${savedIds.size})` : ''}
            </button>

            <button
              type="button"
              className="kb-marketplace-saved-route-link"
              onClick={() => typeof nav === 'function' && nav('saved-projects')}
              title="Open your saved project list"
              style={{height:34,border:'none',background:'transparent',padding:'0 2px',fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'#8A6729',cursor:'pointer',whiteSpace:'nowrap',boxShadow:'none'}}
            >
              Saved Projects →
            </button>

            {hasBrowseRefinements ? (
              <button
                type="button"
                className="kbm-mp-reset"
                onClick={() => {
                  setSearch('');
                  setCatFilter('All');
                  setSortBy('best_match');
                  setSavedOnly(false);
                  setUrgentOnly(false);
                  setReviewingOnly(false);
                  setLocationFilter('All Locations');
                  setBudgetFilter('Budget: Any');
                }}
              >Reset</button>
            ) : null}
          </div>
        </div>

        {/* ╔══ V43 — ALL PROJECTS (real live data, moved up under Featured) ══════════
            Uses existing CSS classes (.kb-live-all-head, .kb-live-all-grid,
            .kb-live-grid-card, .kb-live-card-*) so visual treatment matches the
            previous 4-card stub exactly. Cards open the project they display via
            handleAllProjectsCardClick → openProject. Curated cover image picked
            by category. Capped at 12 cards to preserve page rhythm. ═════════════ */}
        <section>
          {/* V45 — head shows live filter count; cards show saved-bookmark badge; mobile caps at 6 with Show all */}
          <div className="kb-live-all-head">
            <h2>All project briefs {hasBrowseRefinements ? <span className="kb-live-all-count">· {liveAllProjects.length} match{liveAllProjects.length === 1 ? '' : 'es'}</span> : null}</h2>
          </div>
          <div className="kb-live-all-grid">
            {liveAllProjects.length === 0 ? (
              <div className="kb-live-all-empty" style={{gridColumn:'1/-1',padding:'28px 18px',textAlign:'center',fontSize:13,color:'rgba(28,40,20,0.62)'}}>
                {hasBrowseRefinements
                  ? <>No projects match those filters. <button type="button" className="kb-live-all-empty-link" onClick={() => { setSearch(''); setCatFilter('All'); setSavedOnly(false); setUrgentOnly(false); }}>Clear filters →</button></>
                  : 'No projects to show right now. Check back soon.'}
              </div>
            ) : liveAllProjects.map((project, index) => {
              const bidN = Number(project?.bids || project?.bids_count || 0) || 0;
              const proposalLabel = bidN > 0 ? `${bidN} proposal${bidN === 1 ? '' : 's'}` : 'New listing';
              const rawBudget = String(project?.budget || '').trim();
              const budgetMatch = rawBudget.match(/\$[\d,]+(?:[kKmM])?(?:\s*[-–]\s*\$[\d,]+(?:[kKmM])?)?/);
              const budgetDisplay = budgetMatch ? budgetMatch[0] : (rawBudget && rawBudget.length <= 22 ? rawBudget : '$—');
              const image = pickImageForProject(project, index);
              const categoryLabel = getProjectCardCategoryLabel(project, project?.category || 'Project');
              const timelineLabel = getProjectCardTimelineLabel(project);
              const cardKey = String(project?.id ?? project?.title ?? `project-${index}`);
              const cardLabel = project?.title || 'Untitled project';
              const persistedProjectId = project?.id == null ? '' : String(project.id);
              const isSaved = Boolean(persistedProjectId) && savedIds.has(persistedProjectId);
              return (
                <div key={cardKey} className={`kb-live-card-wrap${showAllProjects ? '' : ' kb-live-card-wrap-cap'}`}>
                  <FaithBidCard11A
                    image={image}
                    imageAlt=""
                    title={cardLabel}
                    topLabel={categoryLabel}
                    avatarText={getInitialsSafe(project?.church_name || project?.church || 'FaithBid')}
                    meta={`${project?.city || 'Remote'} · ${timelineLabel} · ${proposalLabel}`}
                    value={budgetDisplay}
                    actionLabel={role === 'vendor' ? 'Submit proposal' : 'Open project'}
                    onOpen={(event) => handleAllProjectsCardClick(project, event)}
                    onAction={(event) => handleAllProjectsCardClick(project, event)}
                    saved={isSaved}
                    onToggleSave={(event) => handleToggleSave(project, event)}
                    ariaLabel={`Open ${cardLabel} brief`}
                  />
                </div>
              );
            })}
          </div>
          {liveAllProjects.length > 6 && !showAllProjects ? (
            <div className="kb-live-all-more">
              <button type="button" className="kb-live-all-more-btn" onClick={() => setShowAllProjects(true)}>
                Show all {liveAllProjects.length} projects
              </button>
            </div>
          ) : null}
        </section>
        {/* ╚════════════════════════════════════════════════════════════════════════ */}

      </div>
      {filterSheetOpen && (
        <>
          <div
            className="kbm2-filter-sheet-backdrop"
            onClick={() => setFilterSheetOpen(false)}
            aria-hidden="true"
          />
          <div
            className="kbm2-filter-sheet"
            ref={filterSheetTrapRef}
            role="dialog"
            aria-modal="true"
            aria-label="More filters"
          >
            <div className="kbm2-filter-sheet-head">
              <span style={{fontFamily:'DM Mono,monospace',fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:'#b08840'}}>Filters</span>
              <button type="button" onClick={() => setFilterSheetOpen(false)} aria-label="Close filters" style={{marginLeft:'auto',width:32,height:32,borderRadius:999,border:'1px solid rgba(28,40,20,0.12)',background:'#fff',fontSize:16,cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',color:'#1C2814'}}>×</button>
            </div>

            <div className="kbm2-filter-sheet-body">

              {/* Budget */}
              <div style={{display:'grid',gap:8}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',color:'#5a5246'}}>Budget</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {budgetOptions.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setBudgetFilter(opt)}
                      style={{height:34,padding:'0 14px',borderRadius:999,border:`1px solid ${budgetFilter === opt ? '#1C2814' : 'rgba(28,40,20,0.14)'}`,background:budgetFilter === opt ? '#1C2814' : '#fff',color:budgetFilter === opt ? '#fffdf8' : '#2e3038',fontSize:12,fontWeight:700,cursor:'pointer'}}
                    >
                      {opt === 'Budget: Any' ? 'Any budget' : opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div style={{display:'grid',gap:8}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',color:'#5a5246'}}>Location</div>
                <select
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                  style={{height:42,padding:'0 14px',borderRadius:10,border:'1px solid rgba(28,40,20,0.14)',background:'#fff',fontSize:13,fontFamily:'DM Sans,sans-serif',color:'#1C2814',cursor:'pointer',outline:'none'}}
                >
                  <option value="All Locations">All locations</option>
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              {/* Toggles */}
              <div style={{display:'grid',gap:8}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',color:'#5a5246'}}>Show only</div>
                <div style={{display:'grid',gap:8}}>
                  {[
                    { label:'Urgent projects', sublabel:'Needed within 1 week', active:urgentOnly, toggle:() => setUrgentOnly(v => !v) },
                    { label:'Saved projects', sublabel:'Projects you bookmarked', active:savedOnly, toggle:() => setSavedOnly(v => !v) },
                    { label:'Reviewing', sublabel:'Projects you are tracking', active:reviewingOnly, toggle:() => setReviewingOnly(v => !v) },
                  ].map(row => (
                    <button
                      key={row.label}
                      type="button"
                      onClick={row.toggle}
                      style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'12px 14px',borderRadius:12,border:`1px solid ${row.active ? 'rgba(176,136,64,0.30)' : 'rgba(28,40,20,0.10)'}`,background:row.active ? 'rgba(176,136,64,0.08)' : '#fff',cursor:'pointer',textAlign:'left'}}
                    >
                      <span>
                        <span style={{display:'block',fontSize:13,fontWeight:700,color:'#1C2814'}}>{row.label}</span>
                        <span style={{display:'block',fontSize:11,color:'#858792',marginTop:2}}>{row.sublabel}</span>
                      </span>
                      <span style={{width:20,height:20,borderRadius:999,border:`2px solid ${row.active ? '#b08840' : 'rgba(28,40,20,0.18)'}`,background:row.active ? '#b08840' : 'transparent',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {row.active ? <span style={{width:8,height:8,borderRadius:999,background:'#fff',display:'block'}} /> : null}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="kbm2-filter-sheet-foot">
              <button
                type="button"
                className="kbm2-filter-sheet-reset"
                onClick={() => {
                  setBudgetFilter('Budget: Any');
                  setLocationFilter('All Locations');
                  setUrgentOnly(false);
                  setSavedOnly(false);
                  setReviewingOnly(false);
                }}
              >
                Reset
              </button>
              <button
                type="button"
                className="kbm2-filter-sheet-apply"
                onClick={() => setFilterSheetOpen(false)}
              >
                Show results
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

}


function ProjectWorkspacePanel({ project:p, role, nav, onComplete, onLifecycleAction = null }) {
  const [workspace, setWorkspace] = useState(() => loadProjectWorkspace(p));
  const [opsState, setOpsState] = useState(() => loadProjectOpsState(p));
  const [updateText, setUpdateText] = useState("");
  const [deliverableInput, setDeliverableInput] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [syncMeta, setSyncMeta] = useState({ saving:false, savedAt:null });
  const [lifecyclePendingAction, setLifecyclePendingAction] = useState(null);
  const workspaceHydratedRef = useRef(false);
  const opsHydratedRef = useRef(false);
  const workspaceSyncTimerRef = useRef(null);
  const opsSyncTimerRef = useRef(null);
  const lastSyncedFingerprintRef = useRef("");
  const lastSyncedOpsFingerprintRef = useRef("");
  const toastTimerRef = useRef(null);

  useEffect(() => {
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, []);

  const isChurch = role === "church" || role === "individual";
  const isVendor = role === "vendor";
  const lifecycleStatus = String(p?.status || '').toLowerCase();
  const completionRequested = !!p?.completion_requested_at;
  const runLifecycleAction = async (action, note = null, successMessage = '') => {
    if (typeof onLifecycleAction !== 'function' || lifecyclePendingAction) return null;
    setLifecyclePendingAction(action);
    try {
      const updated = await onLifecycleAction(action, note);
      if (successMessage) showLocalToast(successMessage);
      return updated;
    } catch (error) {
      logError('project-lifecycle-action', error, { projectId:p?.id || null, action });
      showLocalToast(error?.message || 'Could not update the project lifecycle right now.');
      return null;
    } finally {
      setLifecyclePendingAction(null);
    }
  };

  useEffect(() => {
    setWorkspace(loadProjectWorkspace(p));
    setOpsState(loadProjectOpsState(p));
    workspaceHydratedRef.current = false;
    opsHydratedRef.current = false;
    let cancelled = false;
    const hydrateWorkspace = async () => {
      const localWorkspace = loadProjectWorkspace(p);
      const localOps = loadProjectOpsState(p);
      const [remoteBundle, remoteOpsBundle] = await Promise.all([
        fetchLatestProjectWorkspaceSync(p?.id),
        fetchLatestProjectOpsSnapshot(p?.id, p),
      ]);
      const merged = mergeProjectWorkspaceSnapshots(localWorkspace, remoteBundle?.workspace || {}, p);
      const mergedOps = mergeProjectOpsSnapshots(localOps, remoteOpsBundle?.opsState || {}, p);
      if (cancelled) return;
      setWorkspace(merged);
      setOpsState(mergedOps);
      if (p?.id) {
        saveProjectWorkspace(p.id, merged);
        saveProjectOpsState(p.id, mergedOps, p);
      }
      lastSyncedFingerprintRef.current = projectWorkspaceFingerprint(remoteBundle?.workspace || merged);
      lastSyncedOpsFingerprintRef.current = projectOpsFingerprint(remoteOpsBundle?.opsState || mergedOps, p);
      workspaceHydratedRef.current = true;
      opsHydratedRef.current = true;
      setSyncMeta({ saving:false, savedAt: remoteBundle?.createdAt || remoteOpsBundle?.createdAt || merged?.updatedAt || mergedOps?.updatedAt || null });
    };
    hydrateWorkspace();
    return () => {
      cancelled = true;
      if (workspaceSyncTimerRef.current) clearTimeout(workspaceSyncTimerRef.current);
      if (opsSyncTimerRef.current) clearTimeout(opsSyncTimerRef.current);
    };
  }, [p?.id, p?.status]);

  useEffect(() => {
    if (!p?.id || !workspaceHydratedRef.current) return;
    saveProjectWorkspace(p.id, workspace);
    const fingerprint = projectWorkspaceFingerprint(workspace);
    if (fingerprint === lastSyncedFingerprintRef.current) return;
    if (workspaceSyncTimerRef.current) clearTimeout(workspaceSyncTimerRef.current);
    workspaceSyncTimerRef.current = setTimeout(async () => {
      setSyncMeta(prev => ({ ...prev, saving:true }));
      const synced = await persistProjectWorkspaceSync(p, workspace, isVendor ? "vendor" : "church");
      lastSyncedFingerprintRef.current = fingerprint;
      setSyncMeta(prev => ({ ...prev, saving:false, savedAt: synced?.savedAt || prev.savedAt || null }));
    }, 1200);
    return () => { if (workspaceSyncTimerRef.current) clearTimeout(workspaceSyncTimerRef.current); };
  }, [workspace, p?.id, isVendor]);

  useEffect(() => {
    if (!p?.id || !opsHydratedRef.current) return;
    saveProjectOpsState(p.id, opsState, p);
    const fingerprint = projectOpsFingerprint(opsState, p);
    if (fingerprint === lastSyncedOpsFingerprintRef.current) return;
    if (opsSyncTimerRef.current) clearTimeout(opsSyncTimerRef.current);
    opsSyncTimerRef.current = setTimeout(async () => {
      setSyncMeta(prev => ({ ...prev, saving:true }));
      const synced = await persistProjectOpsSnapshot(p, opsState);
      lastSyncedOpsFingerprintRef.current = fingerprint;
      setSyncMeta(prev => ({ ...prev, saving:false, savedAt: synced?.savedAt || prev.savedAt || null }));
    }, 1200);
    return () => { if (opsSyncTimerRef.current) clearTimeout(opsSyncTimerRef.current); };
  }, [opsState, p?.id, p?.status]);

  useEffect(() => {
    if (!p?.id) return;
    const handleStorageSync = (event) => {
      const detail = event?.detail || {};
      if (detail?.key === KB_PROJECT_WORKSPACE_KEY) {
        const nextMap = detail?.value && typeof detail.value === 'object' ? detail.value : readLocalJson(KB_PROJECT_WORKSPACE_KEY, {});
        const nextWorkspace = nextMap?.[String(p.id)];
        if (!nextWorkspace) return;
        setWorkspace(prev => mergeProjectWorkspaceSnapshots(prev, nextWorkspace, p));
      }
      if (detail?.key === KB_PROJECT_OPS_KEY) {
        const nextMap = detail?.value && typeof detail.value === 'object' ? detail.value : readLocalJson(KB_PROJECT_OPS_KEY, {});
        const nextOps = nextMap?.[String(p.id)];
        if (!nextOps) return;
        setOpsState(prev => mergeProjectOpsSnapshots(prev, nextOps, p));
      }
    };
    window.addEventListener(__KB_STORAGE_SYNC_EVENT, handleStorageSync);
    return () => window.removeEventListener(__KB_STORAGE_SYNC_EVENT, handleStorageSync);
  }, [p?.id, p?.status]);

  useEffect(() => {
    let cancelled = false;
    const loadAttachments = async () => {
      if (!p?.id) return;
      try {
        const convoRes = await selectConversationsSafe(query => query.eq("project_id", p.id).order("last_message_at", { ascending: false }).limit(1), { lookupOnly:true });
        const convo = Array.isArray(convoRes?.data) ? convoRes.data[0] : convoRes?.data;
        if (!convo?.id) { if (!cancelled) setAttachments([]); return; }
        const { data: files } = await supabase
          .from("messages")
          .select("id,file_name,file_size,file_url,file_path,created_at")
          .eq("conversation_id", convo.id)
          .or("file_url.not.is.null,file_path.not.is.null")
          .order("created_at", { ascending: false })
          .limit(6);
        if (!cancelled) setAttachments(files || []);
      } catch (err) {
        logError("workspace-attachments", err, { projectId: p?.id });
        if (!cancelled) setAttachments([]);
      }
    };
    loadAttachments();
    return () => { cancelled = true; };
  }, [p?.id]);

  useEffect(() => {
    let cancelled = false;
    let channel = null;
    let opsChannel = null;
    let opsTableChannel = null;
    const bindRealtime = async () => {
      if (!p?.id) return;
      try {
        const convoRes = await selectConversationsSafe(query => query.eq("project_id", p.id).order("last_message_at", { ascending: false }).limit(1), { lookupOnly:true });
        const convo = Array.isArray(convoRes?.data) ? convoRes.data[0] : convoRes?.data;
        if (!convo?.id || cancelled) return;
        channel = supabase.channel(`workspace:${p.id}:${convo.id}`)
          .on("postgres_changes", { event:"INSERT", schema:"public", table:"messages", filter:`conversation_id=eq.${convo.id}` }, payload => {
            const row = payload.new || {};
            const remoteWorkspace = parseProjectWorkspaceSync(row?.text || "");
            if (remoteWorkspace) {
              setWorkspace(prev => mergeProjectWorkspaceSnapshots(prev, remoteWorkspace, p));
              lastSyncedFingerprintRef.current = projectWorkspaceFingerprint(remoteWorkspace);
              setSyncMeta(prev => ({ ...prev, saving:false, savedAt: row?.created_at || new Date().toISOString() }));
            }
            if (row?.file_url || row?.file_path) {
              setAttachments(prev => {
                const next = [{ id: row.id, file_name: row.file_name, file_size: row.file_size, file_url: row.file_url || null, file_path: row.file_path || null, created_at: row.created_at }, ...prev.filter(item => String(item.id) !== String(row.id))];
                return next.slice(0, 6);
              });
            }
          })
          .subscribe();
        opsChannel = supabase.channel(`workspace-ops:${p.id}`)
          .on("postgres_changes", { event:"INSERT", schema:"public", table:"project_activity_feed", filter:`project_id=eq.${p.id}` }, payload => {
            const row = payload.new || {};
            const remoteOps = row?.meta?.opsState;
            if ((row?.kind === 'closeout_ready' || row?.kind === 'approval_requested') && remoteOps && typeof remoteOps === 'object') {
              setOpsState(prev => mergeProjectOpsSnapshots(prev, remoteOps, p));
              lastSyncedOpsFingerprintRef.current = projectOpsFingerprint(remoteOps, p);
              setSyncMeta(prev => ({ ...prev, saving:false, savedAt: row?.created_at || new Date().toISOString() }));
            }
          })
          .subscribe();
        opsTableChannel = supabase.channel(`project-ops:${p.id}`)
          .on("postgres_changes", { event:"*", schema:"public", table:"project_ops", filter:`project_id=eq.${p.id}` }, payload => {
            const row = payload.new || {};
            const remoteOps = row?.ops_state;
            if (remoteOps && typeof remoteOps === 'object') {
              setOpsState(prev => mergeProjectOpsSnapshots(prev, remoteOps, p));
              lastSyncedOpsFingerprintRef.current = projectOpsFingerprint(remoteOps, p);
              setSyncMeta(prev => ({ ...prev, saving:false, savedAt: row?.updated_at || new Date().toISOString() }));
            }
          })
          .subscribe();
      } catch (err) { logError("workspace-realtime", err, { projectId: p?.id }); }
    };
    bindRealtime();
    return () => {
      cancelled = true;
      if (channel) channel.unsubscribe();
      if (opsChannel) opsChannel.unsubscribe();
      if (opsTableChannel) opsTableChannel.unsubscribe();
    };
  }, [p?.id, p?.status]);

  const showLocalToast = (msg) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  const updateWorkspace = (patchOrFn) => {
    setWorkspace(prev => normalizeProjectWorkspaceSnapshot(p, typeof patchOrFn === "function" ? patchOrFn(prev) : { ...prev, ...patchOrFn }));
  };

  const updateOpsState = (patchOrFn) => {
    setOpsState(prev => normalizeProjectOpsSnapshot(p, typeof patchOrFn === 'function' ? patchOrFn(prev) : { ...prev, ...patchOrFn }));
  };

  const updateCloseout = (field, value) => {
    updateOpsState(prev => ({
      ...prev,
      closeout: { ...(prev.closeout || {}), [field]: value },
    }));
  };

  const updatePaymentCoordination = (field, value) => {
    updateOpsState(prev => ({
      ...prev,
      paymentCoordination: {
        ...(prev.paymentCoordination || {}),
        [field]: value,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const requestReview = () => {
    updateOpsState(prev => ({
      ...prev,
      closeout: {
        ...(prev.closeout || {}),
        reviewRequested: true,
        finalReview: 'requested',
      },
    }));
    pushProjectInteropSignal(p?.id, { text:'Review requested for closeout', tone:'gold', attention:'Closeout review is waiting on a response' });
    showLocalToast('Review request queued for project closeout');
  };

  const workflowSummary = getProjectWorkflowSummary(p, opsState, workspace);
  const milestones = Array.isArray(opsState?.milestones) ? opsState.milestones : [];
  const approvals = Array.isArray(opsState?.approvals) ? opsState.approvals : [];
  const paymentCoordination = opsState?.paymentCoordination || {};
  const approvedMilestones = milestones.filter(item => item?.status === 'done').length;
  const milestoneProgressPct = milestones.length ? Math.round((approvedMilestones / milestones.length) * 100) : 0;
  const moneyLabel = (value) => {
    const n = Number(value || 0);
    return Number.isFinite(n) && n > 0 ? formatMoney(n) : '—';
  };
  const getPaymentStatusMeta = (status = 'pending') => {
    const key = String(status || 'pending').toLowerCase();
    if (key === 'released' || key === 'done') return { label:'Released', color:'var(--success)', bg:'var(--success-bg)', border:'var(--success-border)' };
    if (key === 'coordinated') return { label:'Coordinated', color:'var(--info)', bg:'var(--info-bg)', border:'rgba(37,99,235,0.18)' };
    if (key === 'requested') return { label:'Requested', color:'var(--warn)', bg:'var(--warn-bg)', border:'var(--warn-border)' };
    return { label:'Pending', color:'#7d7363', bg:'rgba(15,23,42,0.04)', border:'rgba(15,23,42,0.08)' };
  };
  const paymentStepDefinitions = [
    { key:'kickoffDeposit', label:'Kickoff deposit', amount: milestones[0]?.amount ?? null, help:'Confirm the opening payment is coordinated directly between both sides.' },
    { key:'milestonePayout', label:'Milestone payout', amount: workflowSummary.currentMilestone?.amount ?? milestones[1]?.amount ?? null, help:'Track the current in-flight payment checkpoint while work is under way.' },
    { key:'finalPayment', label:'Final settlement', amount: milestones[milestones.length - 1]?.amount ?? null, help:'Close the final payment and fee coordination with a documented record.' },
  ];
  const paymentSteps = paymentStepDefinitions.filter(step => Object.prototype.hasOwnProperty.call(paymentCoordination, step.key) && !!paymentCoordination[step.key]);
  const coordinatedCount = paymentSteps.filter(step => ['coordinated','released','done'].includes(String(paymentCoordination?.[step.key] || '').toLowerCase())).length;
  const closeoutStatus = String(opsState?.closeout?.status || 'not_started').toLowerCase();
  const closeoutComplete = closeoutStatus === 'completed' || closeoutStatus === 'ready';
  const closeoutChecklistFields = [
    ['contractSigned','Contract'],
    ['handoffFiles','Handoff files'],
    ['finalInvoice','Final invoice'],
    ['finalPayout','Final payout'],
    ['archivePacket','Archive packet'],
    ['finalReview','Review'],
  ].filter(([field]) => Object.prototype.hasOwnProperty.call(opsState?.closeout || {}, field) && !!opsState?.closeout?.[field]);
  const operationalAlerts = deriveProjectOperationalAlerts(p, opsState, workspace, isVendor ? 'vendor' : 'church');
  const workflowCards = [
    { label:'Milestones', value:milestones.length ? `${approvedMilestones}/${milestones.length}` : '—', sub:milestones.length ? `${milestoneProgressPct}% approved` : 'No milestones documented', tone:'navy' },
    { label:'Approvals', value:approvals.length ? String(workflowSummary.pendingApprovals.length) : '—', sub:approvals.length ? (workflowSummary.pendingApprovals.length ? 'Need action' : 'No approvals pending') : 'No approvals documented', tone:workflowSummary.pendingApprovals.length ? 'amber' : 'navy' },
    { label:'Payment coordination', value:paymentSteps.length ? `${coordinatedCount}/${paymentSteps.length}` : '—', sub:paymentSteps.length ? 'Manual today' : 'No checkpoints documented', tone:paymentSteps.length && coordinatedCount === paymentSteps.length ? 'green' : 'navy' },
    { label:'Closeout', value:closeoutComplete ? 'Ready' : closeoutChecklistFields.length ? `${workflowSummary.closeoutOpen.length || 0} open` : 'Not started', sub:closeoutComplete ? 'Final handoff queued' : closeoutChecklistFields.length ? 'Finish the documented checklist' : 'No checklist documented', tone:closeoutComplete ? 'green' : 'navy' },
  ];
  const toneMap = {
    navy: { color:'#1C2814', bg:'rgba(15,23,42,0.04)', border:'rgba(15,23,42,0.08)' },
    amber: { color:'var(--warn)', bg:'var(--warn-bg)', border:'var(--warn-border)' },
    green: { color:'var(--success)', bg:'var(--success-bg)', border:'var(--success-border)' },
  };


  const approveCurrentMilestone = () => {
    if (!isChurch) {
      showLocalToast('Only the church can approve a milestone.');
      return;
    }
    const currentId = workflowSummary.currentMilestone?.id;
    const currentTitle = workflowSummary.currentMilestone?.title || '';
    if (!currentId) {
      showLocalToast('No active milestone to approve right now.');
      return;
    }
    updateOpsState(prev => ({
      ...prev,
      milestones: (prev.milestones || []).map((item, idx, arr) => {
        if (item.id === currentId) return { ...item, status:'done' };
        const currentIndex = arr.findIndex(row => row.id === currentId);
        if (idx === currentIndex + 1 && item.status === 'pending') return { ...item, status:'current' };
        return item;
      }),
      approvals: (prev.approvals || []).map(item => {
        const linkedToCurrent = String(item?.milestone_id || '') === String(currentId) || (!item?.milestone_id && currentTitle && String(item?.title || '') === `Approve ${currentTitle}`);
        return linkedToCurrent && item.status === 'pending' ? { ...item, status:'done' } : item;
      }),
    }));
    pushProjectInteropSignal(p?.id, { text:'Current milestone approved', tone:'success', attention:'A milestone moved forward in project operations' });
    showLocalToast('Milestone approved and workflow moved forward');
  };

  const toggleApprovalStatus = (approvalId) => {
    if (!isChurch) {
      showLocalToast('Only the church can change approval status.');
      return;
    }
    const target = approvals.find(item => item.id === approvalId);
    if (!target) return;
    const done = target.status === 'done';
    const nextStatus = done ? 'pending' : 'done';
    updateOpsState(prev => ({
      ...prev,
      approvals: (prev.approvals || []).map(row => row.id === approvalId ? { ...row, status: nextStatus } : row),
    }));
    pushProjectInteropSignal(p?.id, {
      text: nextStatus === 'done' ? `${target.title} approved` : `${target.title} moved back to pending`,
      tone: nextStatus === 'done' ? 'success' : 'info',
      attention: nextStatus === 'done' ? 'A project approval was completed' : 'A project approval needs review',
    });
  };

  const requestMilestoneReview = () => {
    const currentId = workflowSummary.currentMilestone?.id;
    if (!currentId) {
      showLocalToast('No active milestone is ready for review yet.');
      return;
    }
    const currentTitle = workflowSummary.currentMilestone?.title || 'Current milestone';
    updateOpsState(prev => {
      const approvalId = `milestone-${currentId}`;
      const existingApproval = (prev.approvals || []).find(item => String(item?.milestone_id || '') === String(currentId) || String(item?.id || '') === approvalId || (!item?.milestone_id && String(item?.title || '') === `Approve ${currentTitle}`));
      return {
        ...prev,
        approvals: existingApproval
          ? (prev.approvals || []).map(item => item.id === existingApproval.id ? { ...item, title:`Approve ${currentTitle}`, status:'pending', owner:'church', milestone_id:currentId } : item)
          : [...(prev.approvals || []), { id:approvalId, title:`Approve ${currentTitle}`, status:'pending', owner:'church', milestone_id:currentId }],
      };
    });
    pushProjectInteropSignal(p?.id, { text:'Milestone ready for review', tone:'gold', attention:`${currentTitle} is ready for review` });
    setUpdateText(prev => prev || `${currentTitle} is ready for review. I documented the milestone and deliverables in the workspace.`);
    showLocalToast('Milestone review request recorded in the workspace');
  };

  const markCloseoutReady = () => {
    updateOpsState(prev => ({
      ...prev,
      closeout: {
        ...(prev.closeout || {}),
        status:'ready',
      },
    }));
    pushProjectInteropSignal(p?.id, { text:'Closeout ready', tone:'gold', attention:'Project closeout is ready for final review and archive' });
    showLocalToast('Closeout marked ready for final review');
  };

  const advancePaymentStep = (key) => {
    const current = String(paymentCoordination?.[key] || 'pending').toLowerCase();
    const next = current === 'pending' ? 'requested' : current === 'requested' ? 'coordinated' : current === 'coordinated' ? (key === 'finalPayment' ? 'released' : 'released') : 'pending';
    const step = paymentSteps.find(item => item.key === key);
    updateOpsState(prev => ({
      ...prev,
      paymentCoordination: {
        ...(prev.paymentCoordination || {}),
        [key]: next,
        lastRequestedAmount: next === 'requested' ? (step?.amount ?? prev.paymentCoordination?.lastRequestedAmount ?? null) : (prev.paymentCoordination?.lastRequestedAmount ?? null),
        lastCoordinatedAmount: ['coordinated','released'].includes(next) ? (step?.amount ?? prev.paymentCoordination?.lastCoordinatedAmount ?? null) : (prev.paymentCoordination?.lastCoordinatedAmount ?? null),
        updatedAt: new Date().toISOString(),
      },
    }));
    pushProjectInteropSignal(p?.id, {
      text: `${step?.label || 'Payment checkpoint'} ${next}`,
      tone: ['coordinated','released'].includes(next) ? 'success' : 'info',
      attention: `${step?.label || 'Payment checkpoint'} is now ${next}`,
    });
    showLocalToast(`${step?.label || 'Payment checkpoint'} marked ${next}`);
  };

  const workspaceNextActionCards = [
    {
      key:'workspace-review',
      eyebrow:'Approval lane',
      title: workflowSummary.currentMilestone?.title || 'No milestone plan documented',
      body: workflowSummary.pendingApprovals.length
        ? `${workflowSummary.pendingApprovals.length} approval${workflowSummary.pendingApprovals.length === 1 ? '' : 's'} still need a documented decision before delivery moves cleanly.`
        : workflowSummary.currentMilestone
          ? 'Use the workspace to request review when the documented milestone is ready for a decision.'
          : 'No milestone or approval plan has been documented for this project yet.',
      tone: workflowSummary.pendingApprovals.length ? 'amber' : 'navy',
      chips:[workflowSummary.currentMilestone?.amount ? fmtMoney(workflowSummary.currentMilestone.amount) : null, workflowSummary.pendingApprovals.length ? `${workflowSummary.pendingApprovals.length} pending` : approvals.length ? 'No approvals pending' : null].filter(Boolean),
      actions:[
        workflowSummary.pendingApprovals.length && isChurch ? { label:'Approve current milestone', onClick:()=>approveCurrentMilestone(), tone:'success' } : null,
        workflowSummary.currentMilestone && (!workflowSummary.pendingApprovals.length || isVendor) ? { label:'Request review', onClick:()=>requestMilestoneReview(), tone:'default' } : null,
      ].filter(Boolean),
    },
    {
      key:'workspace-payment',
      eyebrow:'Payment coordination',
      title: paymentSteps.length ? `${coordinatedCount}/${paymentSteps.length} checkpoints documented` : 'No payment checkpoints documented',
      body: paymentSteps.length
        ? (coordinatedCount === paymentSteps.length
          ? 'All documented payment checkpoints are coordinated in the project record.'
          : 'Keep documented payment coordination visible in the workspace so the next checkpoint is clear to both sides.')
        : 'No payment schedule or coordination checkpoints have been documented for this project yet.',
      tone: paymentSteps.length && coordinatedCount === paymentSteps.length ? 'success' : 'navy',
      chips: paymentSteps.map(step => `${step.label} · ${getPaymentStatusMeta(paymentCoordination?.[step.key]).label}`),
      actions: paymentSteps.length ? [
        paymentSteps.find(step => !['coordinated','released','done'].includes(String(paymentCoordination?.[step.key] || '').toLowerCase()))
          ? { label:'Advance next checkpoint', onClick:()=>advancePaymentStep(paymentSteps.find(step => !['coordinated','released','done'].includes(String(paymentCoordination?.[step.key] || '').toLowerCase())).key), tone:'default' }
          : { label:'Reopen payment loop', onClick:()=>advancePaymentStep(paymentSteps[paymentSteps.length - 1]?.key), tone:'muted' },
      ] : [],
    },
    {
      key:'workspace-closeout',
      eyebrow:'Closeout',
      title: closeoutComplete ? 'Ready for final handoff' : 'Finish the handoff loop',
      body: closeoutComplete
        ? 'The closeout record is ready to archive with the final payment, files, and review trail attached.'
        : 'Bring handoff files, final invoice, and contract sign-off into one visible closeout loop before the project disappears into memory.',
      tone: closeoutComplete ? 'success' : (workflowSummary.closeoutOpen.length ? 'amber' : 'navy'),
      chips:[workflowSummary.closeoutOpen.length ? `${workflowSummary.closeoutOpen.length} open item${workflowSummary.closeoutOpen.length === 1 ? '' : 's'}` : 'No open closeout items', closeoutStatus === 'ready' ? 'Ready now' : 'Still open'].filter(Boolean),
      actions:[
        { label:'Mark closeout ready', onClick:()=>markCloseoutReady(), tone: closeoutComplete ? 'successOutline' : 'success' },
        { label:'Queue closeout note', onClick:()=>setUpdateText(prev => prev || 'Closeout is ready for final review. The handoff files, approvals, and payment checkpoint are documented in the workspace.'), tone:'muted' },
      ],
    },
  ];
  const addDeliverable = () => {
    const label = deliverableInput.trim();
    if (!label) return;
    updateWorkspace(prev => ({
      ...prev,
      deliverables: [
        ...(prev.deliverables || []),
        { id: Date.now(), label, state: "planned" }
      ]
    }));
    setDeliverableInput("");
  };

  const cycleDeliverable = (id) => {
    updateWorkspace(prev => ({
      ...prev,
      deliverables: (prev.deliverables || []).map(item => {
        if (item.id !== id) return item;
        const nextState = item.state === "planned" ? "shared" : item.state === "shared" ? "approved" : "planned";
        return { ...item, state: nextState };
      })
    }));
  };

  const removeDeliverable = (id) => {
    updateWorkspace(prev => ({
      ...prev,
      deliverables: (prev.deliverables || []).filter(item => item.id !== id)
    }));
  };

  const sendProjectUpdate = async () => {
    const message = updateText.trim();
    if (!message || !p?.id) return;
    setSending(true);
    try {
      const user = await getCurrentUserSafe();
      if (!user) { setAuthDefaultRole("login"); nav("auth"); setSending(false); return; }
      const target = isVendor
        ? {
            projectId: p.id,
            projectTitle: p.title || null,
            churchId: p.church_id || null,
            churchName: p.church || p.church_name || "Church",
            viewerRole: "vendor",
            initialMessage: `Project update · ${message}`,
            createIfMissing: Boolean(p.church_id || p.church_name || p.church),
          }
        : {
            projectId: p.id,
            projectTitle: p.title || null,
            vendorId: p.hired_vendor_id || null,
            vendorName: p.hired_vendor_name || "Vendor",
            churchId: p.church_id || user.id,
            churchName: p.church || p.church_name || "Church",
            viewerRole: "church",
            initialMessage: `Project update · ${message}`,
            createIfMissing: Boolean(p.hired_vendor_id || p.hiredVendorId),
          };
      if (!isVendor && !target.vendorId && String(p?.status || '').toLowerCase() === 'open') {
        showLocalToast('Hire or shortlist a vendor first so this update has a real project thread.');
        setSending(false);
        return;
      }
      const convo = await ensureInboxConversation(user, target);
      if (convo?.id) {
        const { data: createdMessage, error: messageError } = await runSupabaseWithFallback(
          () => supabase.from("messages").insert({
            conversation_id: convo.id,
            sender_id: user.id,
            text: `Project update · ${message}`,
          }).select("id").maybeSingle(),
          () => supabase.from("messages").insert({
            conversation_id: convo.id,
            sender_id: user.id,
            body: `Project update · ${message}`,
          }).select("id").maybeSingle()
        );
        if (messageError) throw messageError;
        await updateConversationSafe(convo.id, {
          last_message: `Project update · ${message}`,
          last_message_at: new Date().toISOString(),
          status: p.status === "completed" ? "completed" : "hired",
        });
        if (createdMessage?.id) {
          try {
            const { error: notificationError } = await createTrustedNotificationSafe("project_update", createdMessage.id);
            if (notificationError) throw notificationError;
          } catch (err) { logError("workspace-update-notification", err, { messageId: createdMessage.id }); }
        }
      }
      await persistProjectWorkspaceSync(p, workspace, isVendor ? "vendor" : "church");
      setUpdateText("");
      showLocalToast("✓ Update sent to the project thread");
    } catch (err) {
      logError("workspace-update-send", err);
      showLocalToast("Could not send update right now.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{marginTop:8,border:"1px solid #dfd5c2",borderRadius:22,background:"#fffdf8",boxShadow:"0 18px 54px rgba(28,40,20,0.07)",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",padding:"16px 20px",borderBottom:"1px solid #dfd5c2",background:"linear-gradient(135deg,#fffdf8 0%,#f7f0e3 100%)"}}>
        <div>
          <div style={{fontSize:11,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:"#8a6a2e"}}>Execution workspace</div>
          <div style={{fontSize:11,color:"var(--text-muted)",marginTop:4}}>Run milestones, approvals, payment coordination, and closeout from one operating layer after the hire.</div>
          <div style={{fontSize:10,color:"var(--text-muted)",marginTop:6}}>{syncMeta.saving ? "Saving workspace to the deal room…" : syncMeta.savedAt ? `Saved to the deal room · ${new Date(syncMeta.savedAt).toLocaleString([], { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" })}` : "Workspace sync is ready once the deal thread exists."}</div>
        </div>
        <BadgeRow badges={[
          getConversationStatusBadgeLocal(p.status === "completed" ? "completed" : p.status === "in_progress" ? "active" : "hired"),
          { label:milestones.length ? `${approvedMilestones}/${milestones.length} milestones approved` : 'No milestones documented', cls: approvedMilestones === milestones.length && milestones.length ? 'badge-green' : 'badge-blue' },
          { label:'Manual payment coordination', cls:'badge-amber' },
        ]} limit={3} />
      </div>
      <div style={{padding:20,display:"flex",flexDirection:"column",gap:18}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
          {workflowCards.map(card => {
            const tone = toneMap[card.tone] || toneMap.navy;
            return (
              <div key={card.label} style={{padding:'14px 16px',borderRadius:14,background:tone.bg,border:`1px solid ${tone.border}`,display:'grid',gap:5}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:1.3,textTransform:'uppercase',color:'#7d7363'}}>{card.label}</div>
                <div style={{fontSize:24,fontWeight:800,color:tone.color,lineHeight:1}}>{card.value}</div>
                <div style={{fontSize:12,color:'var(--text-mid)',lineHeight:1.55}}>{card.sub}</div>
              </div>
            );
          })}
        </div>

        <div style={{background:'var(--cream)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'16px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:12}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'#7d7363',marginBottom:4}}>Operational alerts & next actions</div>
              <div style={{fontSize:12,color:'#7d7363',lineHeight:1.6}}>Keep the approvals, payment checkpoints, and closeout handoff visible in one operating layer.</div>
            </div>
            <BadgeRow badges={[
              { label:`${operationalAlerts.length} live alert${operationalAlerts.length===1?'':'s'}`, cls: operationalAlerts.length ? 'badge-amber' : 'badge-green' },
              ...(workflowSummary.pendingApprovals.length ? [{ label:`${workflowSummary.pendingApprovals.length} approvals waiting`, cls:'badge-blue' }] : []),
            ]} limit={2} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.05fr) minmax(280px,0.95fr)',gap:14,alignItems:'start'}}>
            <div>
              <OperationalAlertList alerts={operationalAlerts} max={4} compact emptyLabel='No operational alerts are documented for this project right now.' />
            </div>
            <div style={{background:'#fff',border:'1px solid rgba(20,21,24,0.06)',borderRadius:16,padding:'14px'}}>
              <ExecutionActionStack
                title='Execution center'
                subtitle='Turn the current workflow state into the clearest next move for the team.'
                cards={workspaceNextActionCards}
                compact
              />
            </div>
          </div>
        </div>

        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:10}}>Project phase</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {PROJECT_PHASES.map(phase => {
              const active = workspace.phase === phase.key;
              return (
                <button
                  key={phase.key}
                  type="button"
                  onClick={() => updateWorkspace({ phase: phase.key })}
                  style={{
                    padding:"8px 12px",
                    borderRadius:999,
                    border: active ? "1px solid var(--navy)" : "1px solid var(--border)",
                    background: active ? "var(--navy)" : "#fff",
                    color: active ? "#fff" : "var(--text-mid)",
                    fontSize:11,
                    fontWeight:700,
                    cursor:"pointer",
                    fontFamily:"DM Sans,sans-serif",
                  }}
                >
                  {phase.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1.15fr 0.85fr',gap:18,alignItems:'start'}}>
          <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'16px',display:'grid',gap:14}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'#7d7363',marginBottom:4}}>Milestone workspace</div>
                <div style={{fontSize:12,color:'#7d7363',lineHeight:1.6}}>Use this as the operational backbone for approvals, deliverables, and payment coordination.</div>
              </div>
              <BadgeRow badges={[
                { label: workflowSummary.currentMilestone?.title || 'No milestone documented', cls:'badge-blue' },
                ...(workflowSummary.pendingApprovals.length ? [{ label:`${workflowSummary.pendingApprovals.length} approval${workflowSummary.pendingApprovals.length===1?'':'s'} pending`, cls:'badge-amber' }] : approvals.length ? [{ label:'No approvals pending', cls:'badge-green' }] : [{ label:'No approvals documented', cls:'badge-blue' }]),
              ]} limit={2} />
            </div>
            <div style={{height:6,borderRadius:999,background:'var(--cream-dark)',overflow:'hidden'}}>
              <div style={{width:`${milestoneProgressPct}%`,height:'100%',background:'linear-gradient(90deg,var(--navy),#4F46E5)',transition:'width .35s ease'}} />
            </div>
            <div style={{display:'grid',gap:10}}>
              {milestones.length ? milestones.map((item, idx) => {
                const isCurrent = item.status === 'current';
                const isDone = item.status === 'done';
                const tone = isDone ? { bg:'var(--success-bg)', border:'var(--success-border)', color:'var(--success)' } : isCurrent ? { bg:'rgba(37,99,235,0.06)', border:'rgba(37,99,235,0.16)', color:'var(--info)' } : { bg:'var(--cream)', border:'var(--border)', color:'#7d7363' };
                return (
                  <div key={item.id || idx} style={{padding:'14px 15px',borderRadius:14,background:tone.bg,border:`1px solid ${tone.border}`,display:'grid',gap:8}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:'#1C2814',marginBottom:3}}>{item.title || `Milestone ${idx + 1}`}</div>
                        <div style={{fontSize:12,color:'#7d7363'}}>{item.amount ? `${moneyLabel(item.amount)} checkpoint` : 'Budget checkpoint not set yet'}</div>
                      </div>
                      <span style={{padding:'5px 10px',borderRadius:999,background:isDone ? 'var(--success-bg)' : isCurrent ? 'var(--info-bg)' : 'rgba(15,23,42,0.04)',color:isDone ? 'var(--success)' : isCurrent ? 'var(--info)' : 'var(--text-muted)',fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:0.4}}>{isDone ? 'Approved' : isCurrent ? 'In motion' : 'Queued'}</span>
                    </div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      {isCurrent && isChurch && <button type='button' className='btn-secondary' style={{padding:'10px 13px'}} onClick={approveCurrentMilestone}>Approve milestone</button>}
                      {isCurrent && isVendor && <button type='button' className='btn-secondary' style={{padding:'10px 13px'}} onClick={requestMilestoneReview}>Request review</button>}
                      {!isDone && item.amount ? <button type='button' className='btn-secondary' style={{padding:'10px 13px'}} onClick={()=>{ updatePaymentCoordination('lastRequestedAmount', item.amount); showLocalToast(`Payment checkpoint set to ${moneyLabel(item.amount)}`); }}>Set payment checkpoint</button> : null}
                    </div>
                  </div>
                );
              }) : (
                <div style={{padding:'14px 15px',borderRadius:14,background:'var(--cream)',border:'1px solid var(--border)',fontSize:12,color:'#7d7363',lineHeight:1.65}}>No milestone plan has been documented for this project yet.</div>
              )}
            </div>
          </div>

          <div style={{display:'grid',gap:14}}>
            <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'16px',display:'grid',gap:12}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'#7d7363'}}>Approvals in motion</div>
              {(approvals || []).length ? (
                <div style={{display:'grid',gap:10}}>
                  {approvals.map(item => {
                    const done = item.status === 'done';
                    return (
                      <button key={item.id} type='button' onClick={isChurch ? ()=>toggleApprovalStatus(item.id) : undefined} disabled={!isChurch} style={{padding:'12px 14px',borderRadius:12,border:'1px solid var(--border)',background: done ? 'var(--success-bg)' : 'var(--cream)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,cursor:isChurch?'pointer':'default',opacity:isChurch?1:0.9}}>
                        <span style={{fontSize:13,color:'#1C2814',fontWeight:600,textAlign:'left'}}>{item.title}</span>
                        <span style={{fontSize:11,fontWeight:700,color:done ? 'var(--success)' : 'var(--warn)',textTransform:'uppercase'}}>{done ? 'Approved' : 'Pending'}</span>
                      </button>
                    );
                  })}
                </div>
              ) : <div style={{fontSize:12,color:'#7d7363',lineHeight:1.6}}>No approval requests are open right now.</div>}
            </div>

            <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'16px',display:'grid',gap:12}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'#7d7363',marginBottom:4}}>Execution actions</div>
                <div style={{fontSize:12,color:'#7d7363',lineHeight:1.6}}>Keep delivery moving without losing the deal-room record.</div>
              </div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                {workflowSummary.currentMilestone && isChurch ? <button type='button' className='btn-secondary' style={{padding:'10px 14px'}} onClick={approveCurrentMilestone}>Approve current milestone</button> : null}
                {workflowSummary.currentMilestone && isVendor ? <button type='button' className='btn-secondary' style={{padding:'10px 14px'}} onClick={requestMilestoneReview}>Request milestone review</button> : null}
                <button type='button' className='btn-secondary' style={{padding:'10px 14px'}} onClick={markCloseoutReady}>Mark closeout ready</button>
                <button type='button' className='btn-primary' style={{padding:'10px 16px'}} onClick={()=>queueInboxNavigation(nav, { target:{ projectId:p?.id || null, projectTitle:p?.title || null, vendorId:p?.hired_vendor_id || null, churchId:p?.church_id || null, vendorName:p?.hired_vendor_name || null, churchName:p?.church_name || p?.church || null, createIfMissing:Boolean(isVendor ? p?.church_id : (p?.hired_vendor_id || p?.hiredVendorId)) } })}>Open deal room →</button>
              </div>
            </div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1.1fr 0.9fr",gap:18}}>
          <div style={{background:"var(--cream)",border:"1px solid var(--border)",borderRadius:"var(--r-md)",padding:"16px 16px 14px"}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:10}}>Next step</div>
            <input
              aria-label={isVendor ? "Next step for vendor, e.g. Send homepage mockups by Friday" : "Next step for church, e.g. Review revised scope and approve milestone 2"}
              value={workspace.nextAction || ""}
              onChange={e => updateWorkspace({ nextAction: e.target.value })}
              placeholder={isVendor ? "Example: Send homepage mockups by Friday" : "Example: Review revised scope and approve milestone 2"}
              style={{width:"100%",padding:"12px 12px",borderRadius:10,border:"1px solid var(--border)",fontFamily:"DM Sans,sans-serif",fontSize:13,outline:"none",background:"#fff",marginBottom:10}}
            />
            <div style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.6}}>
              Use this as the single source of truth for what needs to happen next on the project.
            </div>
            <div style={{marginTop:10,padding:"10px 12px",borderRadius:10,background:"rgba(37,99,235,0.06)",border:"1px solid rgba(37,99,235,0.16)",fontSize:11,color:"var(--info)",lineHeight:1.6}}>{PLATFORM_PAYMENTS_STATUS}</div>
          </div>

          <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'16px',display:'grid',gap:12}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'#7d7363'}}>Files in the record</div>
            {attachments.length ? (
              <div style={{display:'grid',gap:8}}>
                {attachments.map(file => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={async ()=>{
                      if (file.file_path) {
                        const signed = await getSignedChatFileUrl(file.file_path, 300);
                        if (signed) { window.open(signed, '_blank', 'noopener,noreferrer'); return; }
                      }
                      if (file.file_url) { window.open(file.file_url, '_blank', 'noopener,noreferrer'); return; }
                    }}
                    style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,padding:'10px 12px',borderRadius:12,border:'1px solid var(--border)',background:'var(--cream)',textDecoration:'none',width:'100%',textAlign:'left',cursor:'pointer',font:'inherit'}}
                  >
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#1C2814',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{file.file_name || 'File'}</div>
                      <div style={{fontSize:10,color:'#7d7363'}}>{formatFileSize(file.file_size)} · {new Date(file.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{fontSize:11,fontWeight:700,color:'var(--info)'}}>Open ↗</div>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{fontSize:12,color:'#7d7363',lineHeight:1.6}}>Files shared in the project thread will appear here automatically.</div>
            )}
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1.05fr 0.95fr',gap:18}}>
          <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'16px',display:'grid',gap:12}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'#7d7363',marginBottom:4}}>Payment coordination</div>
                <div style={{fontSize:12,color:'#7d7363',lineHeight:1.6}}>Integrated payments are still coming. Coordinate directly today, but keep the record and fee trail here.</div>
              </div>
              <span style={{padding:'6px 10px',borderRadius:999,background:'var(--warn-bg)',border:'1px solid var(--warn-border)',fontSize:11,fontWeight:800,color:'var(--warn)',textTransform:'uppercase'}}>Manual today</span>
            </div>
            <div style={{display:'grid',gap:10}}>
              {paymentSteps.length ? paymentSteps.map(step => {
                const meta = getPaymentStatusMeta(paymentCoordination?.[step.key] || 'pending');
                return (
                  <div key={step.key} style={{padding:'13px 14px',borderRadius:14,background:'var(--cream)',border:'1px solid var(--border)',display:'grid',gap:8}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'#1C2814',marginBottom:3}}>{step.label}</div>
                        <div style={{fontSize:12,color:'#7d7363'}}>{step.amount ? `${moneyLabel(step.amount)} · ` : ''}{step.help}</div>
                      </div>
                      <span style={{padding:'5px 9px',borderRadius:999,background:meta.bg,border:`1px solid ${meta.border}`,fontSize:11,fontWeight:800,color:meta.color,textTransform:'uppercase'}}>{meta.label}</span>
                    </div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      <button type='button' className='btn-secondary' style={{padding:'10px 13px'}} onClick={()=>advancePaymentStep(step.key)}>{meta.label === 'Pending' ? 'Request coordination' : meta.label === 'Requested' ? 'Mark coordinated' : meta.label === 'Coordinated' ? 'Mark released' : 'Reset checkpoint'}</button>
                      {step.amount ? <button type='button' className='btn-secondary' style={{padding:'10px 13px'}} onClick={()=>updatePaymentCoordination('lastRequestedAmount', step.amount)}>Use {moneyLabel(step.amount)}</button> : null}
                    </div>
                  </div>
                );
              }) : (
                <div style={{padding:'13px 14px',borderRadius:14,background:'var(--cream)',border:'1px solid var(--border)',fontSize:12,color:'#7d7363',lineHeight:1.65}}>No payment schedule or coordination checkpoints have been documented for this project yet.</div>
              )}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10}}>
              <div style={{padding:'12px 13px',borderRadius:12,background:'rgba(15,23,42,0.04)',border:'1px solid rgba(15,23,42,0.08)'}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'#7d7363',marginBottom:4}}>Latest request</div>
                <div style={{fontSize:18,fontWeight:800,color:'#1C2814'}}>{moneyLabel(paymentCoordination?.lastRequestedAmount)}</div>
              </div>
              <div style={{padding:'12px 13px',borderRadius:12,background:'rgba(15,23,42,0.04)',border:'1px solid rgba(15,23,42,0.08)'}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'#7d7363',marginBottom:4}}>Latest coordinated</div>
                <div style={{fontSize:18,fontWeight:800,color:'#1C2814'}}>{moneyLabel(paymentCoordination?.lastCoordinatedAmount)}</div>
              </div>
            </div>
            <textarea rows={2} value={paymentCoordination?.note || ''} onChange={e=>updatePaymentCoordination('note', e.target.value)} placeholder='Payment coordination note, invoice reminder, or payout detail…' style={{width:'100%',padding:'12px 12px',borderRadius:10,border:'1px solid var(--border)',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',resize:'vertical'}} />
            <div style={{fontSize:11,color:'#7d7363',lineHeight:1.7}}>FaithBid documents the operating record. The church and vendor handle invoices and project payments directly; any separate FaithBid placement fee is agreed before an introduction and invoiced manually.</div>
          </div>

          <div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:"var(--r-md)",padding:"16px"}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:10}}>Deliverables tracker</div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <input aria-label="Add a deliverable or handoff item"
                value={deliverableInput}
                onChange={e=>setDeliverableInput(e.target.value)}
                onKeyDown={e=>{ if (e.key === "Enter") { e.preventDefault(); addDeliverable(); } }}
                placeholder="Add a deliverable or handoff item"
                style={{flex:1,padding:"12px 12px",borderRadius:10,border:"1px solid var(--border)",fontFamily:"DM Sans,sans-serif",fontSize:13,outline:"none"}}
              />
              <button type="button" onClick={addDeliverable} className="btn-secondary" style={{padding:"0 14px"}}>Add</button>
            </div>
            {(workspace.deliverables || []).length > 0 ? (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {(workspace.deliverables || []).map(item => {
                  const stateMeta = item.state === "approved"
                    ? { label:"Approved", color:"var(--success)", bg:"var(--success-bg)" }
                    : item.state === "shared"
                    ? { label:"Shared", color:"var(--info)", bg:"var(--info-bg)" }
                    : { label:"Planned", color:"var(--warn)", bg:"var(--warn-bg)" };
                  return (
                    <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"var(--cream)",borderRadius:10,border:"1px solid var(--border)"}}>
                      <button type="button" aria-label={`Cycle deliverable state for ${item.label}, currently ${item.state || 'planned'}`} onClick={()=>cycleDeliverable(item.id)} style={{width:22,height:22,borderRadius:"50%",border:"1px solid var(--border)",background:"#fff",cursor:"pointer",fontSize:11,fontWeight:700,color:"var(--navy)"}}>
                        {item.state === "approved" ? "✓" : item.state === "shared" ? "↑" : "•"}
                      </button>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:"var(--text-mid)"}}>{item.label}</div>
                      </div>
                      <span style={{padding:"4px 8px",borderRadius:999,background:stateMeta.bg,color:stateMeta.color,fontSize:10,fontWeight:700}}>{stateMeta.label}</span>
                      <button type="button" aria-label="Remove deliverable" onClick={()=>removeDeliverable(item.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:16,lineHeight:1}}>×</button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.6}}>Track what has been promised, what has been shared, and what has already been approved.</div>
            )}
          </div>
        </div>

        <div style={{background:"var(--cream)",border:"1px solid var(--border)",borderRadius:"var(--r-md)",padding:"16px"}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:10}}>Send a project update</div>
          <textarea
            rows={3}
            aria-label={isVendor ? "Send a project update as vendor" : "Send a project update as church"}
            value={updateText}
            onChange={e=>setUpdateText(e.target.value)}
            placeholder={isVendor ? "Example: Mockups are ready for your review and I uploaded the PDF in the thread." : "Example: We reviewed the latest draft and are ready to approve milestone two."}
            style={{width:"100%",padding:"12px 12px",borderRadius:10,border:"1px solid var(--border)",fontFamily:"DM Sans,sans-serif",fontSize:13,outline:"none",resize:"vertical",marginBottom:10}}
          />
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button type="button" onClick={sendProjectUpdate} disabled={!updateText.trim() || sending} className="btn-primary" style={{padding:"10px 16px"}}>
              {sending ? "Sending…" : "Send Update"}
            </button>
            <button type="button" onClick={()=>openInboxThread(nav, { projectId: p.id, projectTitle: p.title || null, churchId: p.church_id || null, churchName: p.church || p.church_name || "Church", vendorId: p.hired_vendor_id || null, vendorName: p.hired_vendor_name || null, viewerRole: isVendor ? "vendor" : "church", createIfMissing: Boolean(isVendor ? p.church_id : (p.hired_vendor_id || p.hiredVendorId)) })} disabled={!Boolean(isVendor ? p?.church_id : (p?.hired_vendor_id || p?.hiredVendorId))} className="btn-secondary" style={{padding:"10px 16px",opacity:Boolean(isVendor ? p?.church_id : (p?.hired_vendor_id || p?.hiredVendorId))?1:0.5,cursor:Boolean(isVendor ? p?.church_id : (p?.hired_vendor_id || p?.hiredVendorId))?'pointer':'not-allowed'}}>
              {Boolean(isVendor ? p?.church_id : (p?.hired_vendor_id || p?.hiredVendorId)) ? 'Open deal thread' : 'Deal thread unavailable'}
            </button>
            {lifecycleStatus === 'hired' && (
              <button type="button" disabled={!!lifecyclePendingAction} onClick={()=>runLifecycleAction('start', null, isVendor ? 'Work started. The project is now in progress.' : 'Project moved into progress.')} className="btn-secondary" style={{padding:"10px 16px",borderColor:"rgba(176,136,64,0.35)",color:"#8a6a2e",opacity:lifecyclePendingAction?0.6:1}}>
                {lifecyclePendingAction === 'start' ? 'Starting…' : isVendor ? 'Start work' : 'Confirm work started'}
              </button>
            )}
            {isVendor && lifecycleStatus === 'in_progress' && !completionRequested && (
              <button type="button" disabled={!!lifecyclePendingAction} onClick={()=>runLifecycleAction('request_completion', updateText.trim() || null, 'Completion request sent to the church.')} className="btn-secondary" style={{padding:"10px 16px",borderColor:"var(--success-border)",color:"var(--success)",opacity:lifecyclePendingAction?0.6:1}}>
                {lifecyclePendingAction === 'request_completion' ? 'Requesting…' : 'Request completion'}
              </button>
            )}
            {isVendor && lifecycleStatus === 'in_progress' && completionRequested && (
              <button type="button" disabled={!!lifecyclePendingAction} onClick={()=>runLifecycleAction('cancel_completion_request', null, 'Completion request withdrawn.')} className="btn-secondary" style={{padding:"10px 16px",opacity:lifecyclePendingAction?0.6:1}}>
                {lifecyclePendingAction === 'cancel_completion_request' ? 'Withdrawing…' : 'Withdraw completion request'}
              </button>
            )}
            {isChurch && lifecycleStatus === 'in_progress' && completionRequested && (
              <>
                <button type="button" onClick={()=>onComplete && onComplete(p.id)} className="btn-secondary" style={{padding:"10px 16px",borderColor:"var(--success-border)",color:"var(--success)"}}>
                  Review & confirm completion
                </button>
                <button type="button" disabled={!!lifecyclePendingAction} onClick={()=>runLifecycleAction('request_changes', updateText.trim() || 'Additional work is required before completion.', 'Completion request returned to the vendor with changes requested.')} className="btn-secondary" style={{padding:"10px 16px",opacity:lifecyclePendingAction?0.6:1}}>
                  {lifecyclePendingAction === 'request_changes' ? 'Sending…' : 'Request changes'}
                </button>
              </>
            )}
            {isChurch && lifecycleStatus === 'in_progress' && !completionRequested && (
              <span style={{display:'inline-flex',alignItems:'center',padding:'9px 12px',borderRadius:10,background:'rgba(15,23,42,0.04)',color:'#7d7363',fontSize:11.5,fontWeight:700}}>Waiting for vendor completion request</span>
            )}
            {lifecycleStatus === 'completed' && (
              <span style={{display:'inline-flex',alignItems:'center',padding:'9px 12px',borderRadius:10,background:'var(--success-bg)',color:'var(--success)',fontSize:11.5,fontWeight:800}}>Completion confirmed</span>
            )}
          </div>
        </div>

        <div style={{background:"var(--cream)",border:"1px solid var(--border)",borderRadius:"var(--r-md)",padding:"16px",display:'grid',gap:12}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:4}}>Closeout & handoff</div>
              <div style={{fontSize:12,color:'#7d7363',lineHeight:1.6}}>Finish the work cleanly, request the review, and archive a crisp handoff record.</div>
            </div>
            <span style={{padding:'6px 10px',borderRadius:999,background:closeoutComplete ? 'var(--success-bg)' : 'rgba(15,23,42,0.04)',border:`1px solid ${closeoutComplete ? 'var(--success-border)' : 'rgba(15,23,42,0.08)'}`,fontSize:11,fontWeight:800,color:closeoutComplete ? 'var(--success)' : 'var(--text-muted)',textTransform:'uppercase'}}>{closeoutComplete ? 'Ready for archive' : closeoutChecklistFields.length ? 'Closeout in progress' : 'Closeout not started'}</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
            {closeoutChecklistFields.length ? closeoutChecklistFields.map(([field,label]) => {
              const value = opsState?.closeout?.[field];
              const complete = value === 'done' || value === 'released' || value === 'ready';
              return <button key={field} type='button' onClick={()=>updateCloseout(field, complete ? 'pending' : (field === 'finalPayout' ? 'released' : 'done'))} style={{padding:'12px 14px',borderRadius:12,border:'1px solid var(--border)',background:'#fff',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,cursor:'pointer'}}><span style={{fontSize:13,color:'#1C2814',fontWeight:600}}>{label}</span><span style={{fontSize:11,fontWeight:700,color:complete?'var(--success)':'var(--warn)',textTransform:'uppercase'}}>{String(value || 'pending').replace('_',' ')}</span></button>;
            }) : <div style={{gridColumn:'1 / -1',padding:'13px 14px',borderRadius:12,background:'#fff',border:'1px solid var(--border)',fontSize:12,color:'#7d7363',lineHeight:1.65}}>No closeout checklist has been documented for this project yet.</div>}
          </div>
          <textarea rows={2} value={opsState?.closeout?.closeoutNote || ''} onChange={e=>updateCloseout('closeoutNote', e.target.value)} placeholder='Handoff summary, archive notes, or any final coordination details…' style={{width:'100%',padding:'12px 12px',borderRadius:10,border:'1px solid var(--border)',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',resize:'vertical'}} />
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button type='button' className='btn-secondary' style={{padding:'10px 14px'}} onClick={requestReview}>Request review</button>
            <button type='button' className='btn-secondary' style={{padding:'10px 14px'}} onClick={()=>{
              if (closeoutStatus === 'ready' || closeoutStatus === 'completed') {
                const nextStatus = closeoutChecklistFields.length ? 'open' : 'not_started';
                updateCloseout('status', nextStatus);
                pushProjectInteropSignal(p?.id, { text:'Project closeout reopened', tone:'info', attention:'Closeout was reopened for more work' });
              } else {
                markCloseoutReady();
              }
            }}>{closeoutStatus === 'ready' || closeoutStatus === 'completed' ? 'Reopen closeout' : 'Mark closeout ready'}</button>
          </div>
        </div>

        {toast && <div style={{padding:"10px 12px",borderRadius:"var(--r-sm)",background:"var(--success-bg)",border:"1px solid var(--success-border)",fontSize:12,color:"var(--success)",fontWeight:600}}>{toast}</div>}
      </div>
    </div>
  );
}
const MemoProjectBoard = React.memo(ProjectBoard);


function BidForm({ project, onBack, onSubmit, showToast }) {
  const [amount, setAmount] = useState("");
  const [timeline, setTimeline] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [coachingOpen, setCoachingOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);

  const projectTitle = project?.title || "this project";
  const churchName = project?.church_name || project?.church || "the church";
  const budgetLabel = project?.budget ? String(project.budget) : "Budget shared after intake";
  const timelineDisplay = project?.timeline ? String(project.timeline) : null;
  const categoryDisplay = project?.category ? String(project.category) : null;
  const contextMeta = [categoryDisplay, project?.budget ? budgetLabel : null, timelineDisplay].filter(Boolean).join(' · ');
  const projectBriefDescription = String(project?.desc || project?.description || '').trim();
  const projectBriefScope = String(project?.scope || '').trim();
  const projectBriefRequirements = Array.isArray(project?.requirements) ? project.requirements.filter(Boolean) : [];
  const projectBriefSkills = Array.isArray(project?.skills) ? project.skills.filter(Boolean) : [];
  const projectBriefDelivery = String(project?.delivery_preference || '').trim();

  const normalizedAmount = (() => {
    const n = Number(String(amount).replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : 0;
  })();
  const amountTooHigh = normalizedAmount > 10_000_000;

  const canSubmit = normalizedAmount > 0 && !amountTooHigh && timeline.trim().length > 0 && !submitting;
  const safeBack = () => {
    if (submitting) return;
    if (typeof onBack === 'function') return onBack();
    try { if (typeof window !== 'undefined' && window.history?.length > 1) window.history.back(); } catch {}
  };
  const appendProposalSnippet = (snippet) => {
    const clean = String(snippet || '').trim();
    if (!clean) return;
    setNote(prev => {
      const base = String(prev || '').trim();
      const next = base ? `${base}\n\n${clean}` : clean;
      return next.slice(0, 1500);
    });
  };
  const proposalHelpers = [
    { label:'Add approach', snippet:`My approach for ${projectTitle || 'this project'}: I would begin by understanding your specific goals${projectBriefScope ? ` for ${projectBriefScope}` : ''}, then develop a clear plan tailored to your ministry context and ${categoryDisplay || 'project'} needs.` },
    { label:'Add process', snippet:`My process: I work in clear phases — discovery, planning, execution, and handoff. For a ${categoryDisplay || 'project'} like this${budgetLabel ? ` in the ${budgetLabel} range` : ''}, I typically deliver on schedule with regular check-ins so your team is never left guessing.` },
    { label:'Add needs', snippet:`To get started on ${projectTitle || 'this project'}, I would need: a kickoff call to align on priorities${projectBriefDelivery ? `, confirmation of delivery preference (${projectBriefDelivery})` : ''}, and access to any existing materials or brand guidelines relevant to this ${categoryDisplay || 'project'}.` },
  ];

  const handleSubmit = async (e) => {
    try { e?.preventDefault?.(); } catch {}
    setErr("");
    if (normalizedAmount <= 0) { setErr("Please enter a proposed amount greater than zero."); return; }
    if (!timeline.trim()) { setErr("Please share a timeline so the church knows when to expect delivery."); return; }
    setSubmitting(true);
    try {
      await onSubmit({
        amount: normalizedAmount,
        timeline: timeline.trim(),
        note: note.trim(),
        milestones: [],
      });
    } catch (submitErr) {
      setErr("Something went wrong submitting that proposal. Please try again.");
      if (typeof showToast === "function") {
        try { showToast("Couldn't submit bid — please try again.", "error"); } catch {}
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page bid-form-page" style={{padding:'24px 20px 48px', maxWidth: 720, margin: '0 auto'}}>
      <div className="bid-form-topbar" style={{display:'flex', alignItems:'center', gap:12, marginBottom:18}}>
        <button
          type="button"
          onClick={safeBack}
          disabled={submitting}
          style={{display:'inline-flex',alignItems:'center',gap:6,height:36, padding:'0 14px', borderRadius:999, border:'1px solid rgba(28,40,20,0.12)', background:'#fffdf8', fontSize:13, fontWeight:600, color:'#1C2814', cursor:submitting?'not-allowed':'pointer', opacity:submitting?0.55:1, boxShadow:'0 1px 2px rgba(0,0,0,0.04)'}}
        >
          ← Back
        </button>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:10, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#b08840'}}>
          Submit Proposal
        </div>
      </div>

      <div className="bid-form-card" style={{background:'#fff', border:'1px solid rgba(0,0,0,0.06)', borderRadius:22, padding:'28px 26px', boxShadow:'0 1px 2px rgba(0,0,0,0.04)'}}>
        <div style={{fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#b08840', marginBottom:8}}>
          {churchName}
        </div>
        <h1 style={{fontFamily:"'Newsreader','Playfair Display',Georgia,serif", fontSize:'clamp(24px,3.6vw,34px)', fontWeight:500, lineHeight:1.15, color:'#1C2814', margin:'0 0 6px'}}>
          {projectTitle}
        </h1>
        <div style={{fontSize:13, color:'#565862', marginBottom:20}}>{contextMeta || budgetLabel}</div>

        <div style={{marginBottom:20}}>
          <button
            type="button"
            onClick={() => setBriefOpen(o => !o)}
            style={{display:'inline-flex',alignItems:'center',gap:5,height:28,padding:'0 10px',borderRadius:999,border:'1px solid rgba(176,136,64,0.22)',background:'#fffdf8',color:'#8a6729',fontSize:11,fontWeight:700,cursor:'pointer'}}
          >
            {briefOpen ? '▾ Hide brief' : '▸ View full brief'}
          </button>
          {briefOpen && (
            <div style={{padding:'14px 16px',borderRadius:12,background:'#fffdf8',border:'1px solid #efe7d9',marginTop:8,display:'grid',gap:12}}>
              {projectBriefDescription ? (
                <p style={{fontSize:13,color:'#565862',lineHeight:1.75,margin:0}}>{projectBriefDescription}</p>
              ) : null}
              {projectBriefScope ? (
                <div>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#8a6729',marginBottom:5}}>Scope</div>
                  <div style={{fontSize:13,color:'#565862',lineHeight:1.65}}>{projectBriefScope}</div>
                </div>
              ) : null}
              {projectBriefRequirements.length ? (
                <div>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#8a6729',marginBottom:7}}>Requirements</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {projectBriefRequirements.map((req, idx) => (
                      <span key={`${String(req)}-${idx}`} style={{padding:'3px 10px',borderRadius:999,background:'#fff',border:'1px solid #dfd5c2',fontSize:11,fontWeight:600,color:'#2e3038'}}>{String(req)}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {projectBriefSkills.length ? (
                <div>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#8a6729',marginBottom:7}}>Skills</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {projectBriefSkills.map((skill, idx) => (
                      <span key={`${String(skill)}-${idx}`} style={{padding:'3px 10px',borderRadius:999,background:'#fff',border:'1px solid #dfd5c2',fontSize:11,fontWeight:600,color:'#2e3038'}}>{String(skill)}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {projectBriefDelivery ? (
                <div style={{fontSize:13,color:'#565862',lineHeight:1.6}}>
                  <span style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#8a6729',marginRight:8}}>Delivery</span>
                  {projectBriefDelivery}
                </div>
              ) : null}
              {project?.urgent ? (
                <div>
                  <span style={{display:'inline-flex',alignItems:'center',height:24,padding:'0 10px',borderRadius:999,background:'rgba(220,38,38,0.07)',color:'#b1342a',border:'1px solid rgba(220,38,38,0.18)',fontSize:11,fontWeight:700}}>Urgent</span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <form className="bid-form-grid" onSubmit={handleSubmit} style={{display:'grid', gap:18}}>
          <label style={{display:'grid', gap:6}}>
            <span style={{fontSize:12, fontWeight:700, color:'#2e3038', letterSpacing:0.2}}>Your proposed amount (USD)</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 12500"
              style={{height:48, padding:'0 14px', borderRadius:12, border:'1px solid rgba(0,0,0,0.12)', background:'#fff', fontSize:14, fontFamily:'DM Sans, sans-serif'}}
            />
            {amountTooHigh ? (
              <div style={{marginTop:6, padding:'8px 12px', borderRadius:10, background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.18)', fontSize:12, color:'#b1342a'}}>
                Bids are capped at $10,000,000. Please enter a lower amount.
              </div>
            ) : normalizedAmount > 0 ? (
              <div style={{marginTop:6, padding:'10px 14px', borderRadius:10, background:'#fbfaf6', border:'1px solid #efe7d9', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap'}}>
                <div style={{fontSize:12, color:'#6a6f7a'}}>
                  FaithBid does not calculate or collect a standard platform fee in this preview.
                </div>
                <div style={{fontSize:12, fontWeight:700, color:'#2f855a'}}>
                  Proposal amount: ${normalizedAmount.toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:2})}
                </div>
              </div>
            ) : null}
          </label>

          <label style={{display:'grid', gap:6}}>
            <span style={{fontSize:12, fontWeight:700, color:'#2e3038', letterSpacing:0.2}}>Timeline</span>
            <input
              type="text"
              value={timeline}
              onChange={e => setTimeline(e.target.value)}
              placeholder="e.g. 4 weeks from kickoff"
              style={{height:48, padding:'0 14px', borderRadius:12, border:'1px solid rgba(0,0,0,0.12)', background:'#fff', fontSize:14, fontFamily:'DM Sans, sans-serif'}}
            />
          </label>

          <label style={{display:'grid', gap:6}}>
            <span style={{fontSize:12, fontWeight:700, color:'#2e3038', letterSpacing:0.2}}>Cover note to the church (optional)</span>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value.slice(0, 1500))}
              rows={5}
              maxLength={1500}
              placeholder="How would you approach this project? What makes you a strong fit? Anything you'd need from the church to get started."
              style={{padding:'12px 14px', borderRadius:12, border:`1px solid ${note.length > 1350 ? 'rgba(220,38,38,0.35)' : 'rgba(0,0,0,0.12)'}`, background:'#fff', fontSize:14, lineHeight:1.55, fontFamily:'DM Sans, sans-serif', resize:'vertical', transition:'border-color 0.15s'}}
            />
            <div style={{display:'flex', justifyContent:'space-between', gap:10, alignItems:'center', marginTop:2, flexWrap:'wrap'}}>
              <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                {proposalHelpers.map(helper => (
                  <button
                    key={helper.label}
                    type="button"
                    onClick={() => appendProposalSnippet(helper.snippet)}
                    disabled={submitting || note.length >= 1480}
                    style={{height:28,padding:'0 10px',borderRadius:999,border:'1px solid rgba(176,136,64,0.22)',background:'#fffdf8',color:'#8a6729',fontSize:11,fontWeight:800,cursor:(submitting || note.length >= 1480)?'not-allowed':'pointer',opacity:(submitting || note.length >= 1480)?0.5:1}}
                  >
                    {helper.label}
                  </button>
                ))}
              </div>
              <span style={{fontSize:11, fontFamily:'DM Mono,monospace', color: note.length > 1350 ? '#b1342a' : note.length > 1100 ? '#8a6729' : 'rgba(28,40,20,0.28)', letterSpacing:'0.04em'}}>
                {note.length}/1500
              </span>
            </div>
            {/* Coaching tip — collapsible */}
            <div style={{marginTop:8}}>
              <button
                type="button"
                onClick={() => setCoachingOpen(o => !o)}
                style={{display:'inline-flex',alignItems:'center',gap:5,height:28,padding:'0 10px',borderRadius:999,border:'1px solid rgba(176,136,64,0.22)',background:'#fffdf8',color:'#8a6729',fontSize:11,fontWeight:700,cursor:'pointer'}}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{transition:'transform 0.18s',transform:coachingOpen?'rotate(180deg)':'rotate(0deg)'}}><polyline points="6 9 12 15 18 9"/></svg>
                {coachingOpen ? 'Hide tips' : 'What churches look for'}
              </button>
              {coachingOpen && (
                <div style={{marginTop:8, padding:'12px 14px', borderRadius:12, background:'#fffdf8', border:'1px solid #efe7d9'}}>
                  <div style={{fontFamily:'DM Mono,monospace', fontSize:9.5, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#b08840', marginBottom:8}}>What churches look for</div>
                  <ul style={{margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:6}}>
                    <li style={{display:'flex', gap:8, alignItems:'flex-start', fontSize:12.5, color:'#565862', lineHeight:1.5}}>
                      <span style={{width:5, height:5, borderRadius:999, background:'#b08840', flexShrink:0, marginTop:7}}/>
                      <span><strong style={{color:'#1C2814', fontWeight:700}}>One sentence on why this project, not just any project.</strong> Churches can tell when a bid is templated. Mention something specific from the brief.</span>
                    </li>
                    <li style={{display:'flex', gap:8, alignItems:'flex-start', fontSize:12.5, color:'#565862', lineHeight:1.5}}>
                      <span style={{width:5, height:5, borderRadius:999, background:'#b08840', flexShrink:0, marginTop:7}}/>
                      <span><strong style={{color:'#1C2814', fontWeight:700}}>How you'd start.</strong> "First two weeks I'd…" beats "I have 10 years of experience" every time. Churches want a plan, not a résumé.</span>
                    </li>
                    <li style={{display:'flex', gap:8, alignItems:'flex-start', fontSize:12.5, color:'#565862', lineHeight:1.5}}>
                      <span style={{width:5, height:5, borderRadius:999, background:'#b08840', flexShrink:0, marginTop:7}}/>
                      <span><strong style={{color:'#1C2814', fontWeight:700}}>Anything you need from them.</strong> Access, decisions, info. Churches respect vendors who set expectations early.</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </label>

          {err ? (
            <div style={{padding:'10px 12px', borderRadius:10, background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.18)', fontSize:13, color:'#b1342a'}}>
              {err}
            </div>
          ) : null}

          <div className="bid-form-actions" style={{display:'flex', gap:10, flexWrap:'wrap', marginTop:4}}>
            <button
              type="button"
              onClick={safeBack}
              disabled={submitting}
              style={{height:48, padding:'0 18px', borderRadius:12, border:'1px solid rgba(0,0,0,0.1)', background:'#fff', fontSize:13, fontWeight:700, color:'#2e3038', cursor:submitting?'not-allowed':'pointer', opacity:submitting?0.55:1}}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              aria-busy={submitting}
              style={{height:48, padding:'0 22px', borderRadius:12, border:'none', background: canSubmit && !submitting ? 'linear-gradient(180deg,#c9a45c,#b08840)' : '#e5e7eb', fontSize:13, fontWeight:700, color: canSubmit && !submitting ? '#fff' : '#9ca3af', cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed', flex:1, minWidth:140, transition:'background 0.15s, color 0.15s', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8}}
            >
              {submitting ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{animation:'spin 0.7s linear infinite',flexShrink:0}} aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Submitting…
                </>
              ) : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MyProjectsCommand({projects, loading, onSelect, onPost, onManageBids, nav, role, showToast, currentUser, myProjectsFetchError = false, onRetryMyProjects}){
  const [lane, setLane] = useState("active");
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 180);
  const [sortBy, setSortBy] = useState("priority");
  const [showAll, setShowAll] = useState(false);
  const [conversationMeta, setConversationMeta] = useState({});
  const [smartHydrationReady, setSmartHydrationReady] = useState(false);
  const [interopHydrated, setInteropHydrated] = useState(false);
  const conversationMetaCacheRef = useRef({ key: "", fetchedAt: 0, meta: {} });
  const conversationMetaInFlightRef = useRef(false);
  const MY_PROJECTS_SMART_META_TTL_MS = 60000;

  // V809 PERF: paint the command shell first, then hydrate expensive smart
  // metadata. This keeps tab entry from waiting on localStorage normalization
  // or conversation/unread lookups.
  useEffect(() => kbScheduleAfterPaint(() => {
    setSmartHydrationReady(true);
    setInteropHydrated(true);
  }, { timeout: 1000 }), []);

  // Needs-attention panel collapse state, persisted across sessions.
  // Starts expanded (false) so first-time users see it; respects user's last choice afterward.
  const [attentionCollapsed, setAttentionCollapsed] = useState(() => {
    try { return localStorage.getItem('kb-myproj-attention-collapsed') === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('kb-myproj-attention-collapsed', attentionCollapsed ? '1' : '0'); } catch {}
  }, [attentionCollapsed]);
  const hasFetchedOnce = useRef(false);
  // Only mark as fetched when loading transitions from true→false with a
  // non-undefined projects array. This prevents the empty-state flash when
  // the parent passes [] as the initial value before the real fetch resolves.
  useEffect(() => {
    if (!loading && Array.isArray(projects) && projects !== undefined) {
      hasFetchedOnce.current = true;
    }
  }, [loading, projects]);
  const [interopVersion, setInteropVersion] = useState(0);
  const [vendorPickModal, setVendorPickModal] = useState(null); // { project, links }
  const [stagePickModal, setStagePickModal] = useState(null);   // { project, vendor }
  const viewportWidth = useViewportWidth(1440);
  const isMobile = viewportWidth < KB_BP_MOBILE;
  const interopEntries = useMemo(() => (interopHydrated ? listProjectInteropEntries() : {}), [interopHydrated, interopVersion]);
  const workspaceMap = useMemo(() => (smartHydrationReady ? __kbReadWorkspaceMap() : {}), [smartHydrationReady, interopVersion]);
  const getWorkspaceFast = useCallback((project = {}) => {
    if (!project?.id) return getDefaultProjectWorkspace(project);
    return { ...getDefaultProjectWorkspace(project), ...(workspaceMap[String(project.id)] || {}) };
  }, [workspaceMap]);
  useEffect(() => {
    const onInteropSync = (event) => {
      if (event?.type === 'storage' && event.key && event.key !== KB_PROJECT_INTEROP_KEY) return;
      if (event?.type === 'kb:storage-sync' && event?.detail?.key && event.detail.key !== KB_PROJECT_INTEROP_KEY) return;
      setInteropVersion(v => v + 1);
    };
    window.addEventListener('storage', onInteropSync);
    window.addEventListener('kb:storage-sync', onInteropSync);
    return () => {
      window.removeEventListener('storage', onInteropSync);
      window.removeEventListener('kb:storage-sync', onInteropSync);
    };
  }, []);

  const moneyCompact = (value)=>{
    const n = Number(value || 0);
    if (!Number.isFinite(n) || n <= 0) return null;
    if (n >= 1000000) return `${(n/1000000).toFixed(n>=10000000?0:1)}M`;
    if (n >= 1000) return `${Math.round(n/1000)}k`;
    return formatMoney(n);
  };

  const parseBudgetValue = (value)=>{
    if (typeof value === "number") return value;
    if (!value) return 0;
    const str = String(value);
    const matches = [...str.matchAll(/(\d+(?:\.\d+)?)\s*([kKmM]?)/g)];
    if (!matches.length) return 0;
    const nums = matches.map(m=>{
      const base = Number(m[1] || 0);
      const suffix = (m[2] || '').toLowerCase();
      if (suffix === 'm') return base * 1000000;
      if (suffix === 'k') return base * 1000;
      return base;
    }).filter(Boolean);
    if (!nums.length) return 0;
    return Math.round(nums.reduce((a,b)=>a+b,0) / nums.length);
  };

  const normalizedProjects = useMemo(() => (projects || []).map(project => {
    const normalized = normalizeProjectEntity(project) || project || {};
    const workspace = getWorkspaceFast(normalized || {});
    const dealState = deriveCanonicalDealState({ project: normalized, workspace, role });
    const bidsCount = Number(normalized?.bids || normalized?.bids_count || 0) || 0;
    const laneKey = (()=>{
      if (String(normalized?.status || '').toLowerCase() === 'cancelled') return 'cancelled';
      if (String(normalized?.status || '').toLowerCase() === 'draft') return 'draft';
      if (dealState === 'completed') return 'completed';
      if (['active','milestone_pending','disputed'].includes(dealState)) return 'active';
      if (dealState === 'hired') return 'hired';
      if (dealState === 'bid_under_review' || (bidsCount > 0 && getDealStateBucket(dealState) === 'open')) return 'comparing';
      return 'open';
    })();
    const nextAction = (()=>{
      if (laneKey === 'completed') return 'Leave a review and archive the project';
      if (dealState === 'milestone_pending') return 'Approve the next milestone in the deal room';
      if (dealState === 'disputed') return 'Resolve the active issue in the deal room';
      if (laneKey === 'active') return workspace?.nextAction || 'Open the deal room and move the next deliverable forward';
      if (laneKey === 'hired') return 'Confirm kickoff details and open the deal room';
      if (laneKey === 'comparing') return bidsCount === 1 ? 'Review the latest proposal' : `Review ${bidsCount} active proposals`;
      if (laneKey === 'draft') return 'Finish the draft and publish the project';
      return bidsCount > 0 ? `Review ${bidsCount} proposal${bidsCount===1?'':'s'}` : 'Share the project and monitor incoming bids';
    })();
    const health = (()=>{
      if (dealState === 'disputed') return { label:'Needs attention', color:'#C53030', bg:'rgba(197,48,48,0.08)', border:'rgba(197,48,48,0.16)' };
      if (dealState === 'milestone_pending') return { label:'Awaiting approval', color:'#B7791F', bg:'rgba(183,121,31,0.08)', border:'rgba(183,121,31,0.16)' };
      if (laneKey === 'active') return { label:'Moving', color:'#2F855A', bg:'rgba(47,133,90,0.08)', border:'rgba(47,133,90,0.16)' };
      if (laneKey === 'hired') return { label:'Kickoff ready', color:'#B08840', bg:'rgba(176,136,64,0.10)', border:'rgba(176,136,64,0.18)' };
      if (laneKey === 'comparing') return { label:'Decision window', color:'#2B6CB0', bg:'rgba(43,108,176,0.08)', border:'rgba(43,108,176,0.16)' };
      return { label:'Open', color:'#4B5563', bg:'rgba(17,24,39,0.04)', border:'rgba(17,24,39,0.08)' };
    })();
    const relation = normalizeProjectInteropEntry(interopEntries[String(normalized?.id)] || {});
    const vendorLinks = Object.values(relation.vendorsById || {});
    const attachedVendorCount = vendorLinks.length;
    const vendorPipeline = summarizeVendorPipeline(vendorLinks);
    const sharedStatus = deriveSharedProjectStatus({ project: normalized, relation, role, workspace });
    const attention = buildInteropAttentionSignals({ project: normalized, relation, role });
    return {
      ...normalized,
      workspace,
      bidsCount,
      deal_state: dealState,
      laneKey,
      nextAction: sharedStatus.nextAction || (attachedVendorCount > 0 && laneKey === 'open' ? 'Review attached vendors and invite bids' : nextAction),
      health,
      relation,
      vendorLinks,
      vendorPipeline,
      attachedVendorCount,
      attention,
      sharedStatusLabel: relation.priority === 'priority' ? 'Priority' : sharedStatus.label,
      sharedStatusTone: sharedStatus.tone,
      sharedStatusKey: sharedStatus.key,
      priorityFlag: relation.priority || null,
      budgetValue: parseBudgetValue(normalized?.budget || normalized?.amount || 0),
      workspacePhaseLabel: PROJECT_PHASES.find(phase => phase.key === workspace?.phase)?.label || 'Kickoff',
      deliverableCount: Array.isArray(workspace?.deliverables) ? workspace.deliverables.length : 0,
    };
  }), [projects, role, interopEntries, getWorkspaceFast]);

  const normalizedProjectIdsSignature = useMemo(
    () => normalizedProjects.map(p => p.id).filter(Boolean).join('|'),
    [normalizedProjects]
  );

  useEffect(()=>{
    const ids = normalizedProjectIdsSignature ? normalizedProjectIdsSignature.split('|').filter(Boolean) : [];
    if (!smartHydrationReady) return;
    if (!currentUser?.id || ids.length === 0) { setConversationMeta({}); return; }

    const cacheKey = `${currentUser.id}:${normalizedProjectIdsSignature}`;
    const cached = conversationMetaCacheRef.current;
    if (cached?.key === cacheKey && Date.now() - cached.fetchedAt < MY_PROJECTS_SMART_META_TTL_MS) {
      setConversationMeta(cached.meta || {});
      return;
    }
    if (conversationMetaInFlightRef.current) return;

    let cancelled = false;
    conversationMetaInFlightRef.current = true;
    const cancelSchedule = kbScheduleAfterPaint(() => {
      (async()=>{
        try {
          const { data: convos } = await selectUserConversationsSafe(
            currentUser.id,
            query => query.in('project_id', ids).order('last_message_at', { ascending:false }),
            { lookupOnly:true }
          );
          const convoList = Array.isArray(convos) ? convos : [];
          const convoIds = convoList.map(c=>c.id).filter(Boolean);
          const unreadMap = await fetchUnreadConversationCountsSafe(convoIds, currentUser.id);
          if (cancelled) return;
          const meta = {};
          convoList.forEach(convo=>{
            if (!convo?.project_id) return;
            const existing = meta[String(convo.project_id)] || null;
            if (!existing || (existing.lastMessageAt || '') < (convo.last_message_at || '')) {
              meta[String(convo.project_id)] = {
                convoId: convo.id,
                unread: unreadMap[convo.id] || 0,
                lastMessageAt: convo.last_message_at || '',
                archived: !!convo.archived,
                status: convo.status || 'open',
              };
            }
          });
          conversationMetaCacheRef.current = { key: cacheKey, fetchedAt: Date.now(), meta };
          setConversationMeta(meta);
        } catch (err) {
          if (!cancelled) logError('my-projects-conversation-meta', err);
        } finally {
          conversationMetaInFlightRef.current = false;
        }
      })();
    }, { timeout: 1200 });

    return ()=>{
      cancelled = true;
      cancelSchedule && cancelSchedule();
      conversationMetaInFlightRef.current = false;
    };
  }, [currentUser?.id, normalizedProjectIdsSignature, smartHydrationReady]);

  const counts = useMemo(() => ({
    active: normalizedProjects.filter(p=>['draft','open','comparing','hired','active'].includes(p.laneKey)).length,
    completed: normalizedProjects.filter(p=>p.laneKey==='completed').length,
    declined: normalizedProjects.filter(p=>p.laneKey==='cancelled').length,
  }), [normalizedProjects]);

  const summaryStats = useMemo(() => ({
    needsDecision: normalizedProjects.filter(p => ['open','comparing'].includes(p.laneKey)).length,
    active: normalizedProjects.filter(p => p.laneKey === 'active').length,
    closeout: normalizedProjects.filter(p => p.laneKey === 'completed').length,
    priority: normalizedProjects.filter(p => p.priorityFlag === 'priority').length,
    activeBudget: moneyCompact(normalizedProjects.filter(p=>['hired','active'].includes(p.laneKey)).reduce((sum,p)=>sum + (p.budgetValue || 0),0)) || '—',
  }), [normalizedProjects]);

  const activityItems = useMemo(() => normalizedProjects.map(project => {
    const convo = conversationMeta[String(project.id)] || {};
    const signals = buildInteropAttentionSignals({ project, relation: project.relation, convoMeta: convo, role });
    if (signals.length) return { id:`${project.id}-signal`, project, tone: project.sharedStatusTone || '#35513a', label:signals[0], action: project.attachedVendorCount > 0 ? 'Review vendors' : (convo.unread > 0 ? 'Open deal room' : 'Review project') };
    if (project.laneKey === 'comparing') return { id:`${project.id}-review`, project, tone:'#8a6729', label:`${project.bidsCount} proposal${project.bidsCount===1?'':'s'} ready to review`, action:'Review bids' };
    return null;
  }).filter(Boolean), [normalizedProjects, conversationMeta, role]);
  const activityItemsTotal = activityItems.length;
  const activityItemsVisible = activityItems.slice(0, 8);
  const attentionProjectIds = useMemo(() => new Set(activityItems.map(item => String(item?.project?.id || '')).filter(Boolean)), [activityItems]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = normalizedProjects.filter(p => {
      if (lane === 'completed') {
        if (p.laneKey !== 'completed') return false;
      } else if (lane === 'declined') {
        if (p.laneKey !== 'cancelled') return false;
      } else if (lane === 'active') {
        if (!['draft','open','comparing','hired','active'].includes(p.laneKey)) return false;
      } else if (lane === 'attention') {
        if (p.laneKey === 'completed' || p.laneKey === 'cancelled' || !attentionProjectIds.has(String(p.id))) return false;
      }
      if (!q) return true;
      const hay = [p.title, p.church, p.city, p.category, p.nextAction, p.workspace?.nextAction].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
    const priorityScore = (p)=>{
      const unread = conversationMeta[String(p.id)]?.unread || 0;
      const base = p.deal_state === 'disputed' ? 1000 : p.deal_state === 'milestone_pending' ? 850 : p.laneKey === 'active' ? 700 : p.laneKey === 'hired' ? 560 : p.laneKey === 'comparing' ? 420 : p.laneKey === 'open' ? 300 : 120;
      return base + unread * 30 + (p.bidsCount || 0) * 5 + (p.urgent ? 40 : 0);
    };
    list = [...list].sort((a,b)=>{
      if (sortBy === 'budget') return (b.budgetValue || 0) - (a.budgetValue || 0);
      if (sortBy === 'bids') return (b.bidsCount || 0) - (a.bidsCount || 0);
      if (sortBy === 'newest') return new Date(b.raw?.posted_at || b.posted || 0) - new Date(a.raw?.posted_at || a.posted || 0);
      return priorityScore(b) - priorityScore(a);
    });
    return list;
  }, [normalizedProjects, lane, debouncedSearch, sortBy, conversationMeta, attentionProjectIds]);

  const preferredInboxProject = useMemo(() => {
    const pool = Array.isArray(filtered) && filtered.length ? filtered : normalizedProjects;
    const ranked = [...pool].sort((a,b)=>{
      const aMeta = conversationMeta[String(a.id)] || {};
      const bMeta = conversationMeta[String(b.id)] || {};
      const score = (p, meta) => ((meta.unread || 0) * 100) + (meta.convoId ? 40 : 0) + ((p.hired_vendor_id || p.hiredVendorId) ? 20 : 0) + (p.laneKey === 'active' ? 10 : 0);
      return score(b, bMeta) - score(a, aMeta);
    });
    return ranked.find(p => p?.id) || null;
  }, [filtered, normalizedProjects, conversationMeta]);

  const openDealRoom = (project)=>{
    openInboxThread(nav, {
      projectId: project.id,
      churchId: project.church_id || null,
      churchName: project.church || project.church_name || null,
      vendorId: project.hired_vendor_id || null,
      vendorName: project.hired_vendor_name || null,
      createIfMissing: Boolean(project?.hired_vendor_id || project?.hiredVendorId),
    });
  };

  const hasDealRoomAccess = (project) => {
    const convo = conversationMeta[String(project?.id)] || {};
    return Boolean(project?.hired_vendor_id || project?.hiredVendorId || convo?.convoId);
  };

  const getDealRoomLabel = (project) => {
    const convo = conversationMeta[String(project?.id)] || {};
    const unread = convo?.unread || 0;
    if (unread > 0) return `${unread} new`;
    if (convo?.convoId) return 'Open';
    if (project?.hired_vendor_id || project?.hiredVendorId) return 'Start thread';
    if ((Number(project?.attachedVendorCount || 0) || 0) > 0) return 'Awaiting hire';
    return 'No thread yet';
  };

  const getProjectQuickAction = (project) => {
    if (['hired','active'].includes(project?.laneKey) || ['milestone_pending','disputed'].includes(project?.deal_state) || hasDealRoomAccess(project)) {
      return { key:'deal-room', label:'Open deal room', run:() => openDealRoom(project) };
    }
    if ((Number(project?.bidsCount || 0) || 0) > 0) {
      return { key:'review-bids', label:'Review Bids', run:() => onManageBids(project) };
    }
    if ((Number(project?.attachedVendorCount || 0) || 0) > 0) {
      return { key:'manage-vendors', label:'Manage Vendors', run:() => manageProjectVendors(project) };
    }
    return { key:'workspace', label:'Open project', run:() => onSelect(project) };
  };

  const operatingSnapshot = useMemo(() => {
    const unreadProjects = normalizedProjects.filter(project => (conversationMeta[String(project.id)]?.unread || 0) > 0).length;
    const pairedProjects = normalizedProjects.filter(project => hasDealRoomAccess(project)).length;
    const attachedVendorProjects = normalizedProjects.filter(project => (Number(project?.attachedVendorCount || 0) || 0) > 0).length;
    return [
      { label:'Active budget', value: summaryStats.activeBudget, sub:'Live work + hired pipeline' },
      { label:'Unread threads', value: unreadProjects, sub: unreadProjects > 0 ? 'Projects with fresh inbox activity' : 'Inbox is caught up' },
      { label:'Deal rooms live', value: pairedProjects, sub:'Projects that can move inside the deal room' },
      { label:'Vendor coverage', value: attachedVendorProjects, sub: attachedVendorProjects > 0 ? 'Projects with attached vendors in motion' : 'No vendor coverage yet' },
    ];
  }, [normalizedProjects, conversationMeta, summaryStats.activeBudget]);

  const headerSecondaryAction = {
    label:'View Deal Rooms',
    run:() => queueDealRoomsHubNavigation(nav, { returnContext:{ scope:'my-projects', tab:'mine' } }),
  };

  const markComplete = async(project)=>{
    if (!canManageProjectWithRole(role, currentUser, project || {})) {
      showToast && showToast('Only the posting church can mark this project complete.', 'error');
      return;
    }
    try {
      await transitionProjectLifecycleSafe(project.id, 'confirm_completion');
      updateProjectInteropEntry(project.id, prev => ({
        ...prev,
        notifications:[{ id:`close-${Date.now()}`, text:`${project.title || 'Project'} marked ready to close`, tone:'success', createdAt:new Date().toISOString() }, ...(prev.notifications || [])].slice(0,12),
        attention:[`Closeout ready for ${project.title || 'this project'}`, ...((prev.attention || []).filter(Boolean))].slice(0,8),
      }));
      showToast && showToast('✓ Project marked complete.');
    } catch (err) {
      logError('mark-complete', err, { projectId: project?.id });
      showToast && showToast('Could not mark this project complete.', 'error');
    }
  };

  const manageProjectVendors = (project) => {
    const links = listProjectVendorLinks(project.id);
    if (!links.length) {
      showToast && showToast('No attached vendors yet. Save or attach a vendor from Marketplace first.');
      return;
    }
    setVendorPickModal({ project, links });
  };

  const confirmVendorPick = (vendor) => {
    const { project } = vendorPickModal;
    setVendorPickModal(null);
    setStagePickModal({ project, vendor });
  };

  const confirmStagePick = (stage) => {
    const { project, vendor } = stagePickModal;
    setStagePickModal(null);
    if (!stage) return;
    setProjectVendorStage(project.id, vendor.id, stage, {
      attentionText:`${vendor.name} is now ${PROJECT_VENDOR_STAGE_META[stage]?.label?.toLowerCase()}`,
      notificationText:`${vendor.name} moved to ${PROJECT_VENDOR_STAGE_META[stage]?.label?.toLowerCase()} on ${project.title || 'this project'}`,
    });
    setInteropVersion(v => v + 1);
    showToast && showToast(`${vendor.name} marked ${PROJECT_VENDOR_STAGE_META[stage]?.label?.toLowerCase()}`);
  };

  const laneButtons = [
    {key:'active', label:'Active', count:counts.active},
    {key:'attention', label:'Needs attention', count:activityItemsTotal},
    {key:'completed', label:'Completed / Past', count:counts.completed},
    {key:'declined', label:'Declined / Archived', count:counts.declined},
  ];

  return (
    <div className="page myproj-command-shell kb-no-green-header kb-mp-mobile-unified-page kb-mp-mobile-unified-myprojects kb-mp-exact-marketplace-page kb-mp-exact-marketplace-myprojects">
      <div className="kb-market-ivory-command-basin kb-market-ivory-command-basin--my-projects kb-audit-vine-seam kb-mp-mobile-unified-basin kb-mp-exact-marketplace-basin">
      <div className="kb-lite-page-head kb-lite-page-head--myprojects kb-unified-workspace-head kb-mp-mobile-unified-head kb-mp-exact-marketplace-head">
        <div>
          <div className="kb-lite-page-kicker">— Project workspace —</div>
          <h1>My Projects</h1>
          <p>Manage posted briefs, vendor activity, and next decisions.</p>
        </div>
        <div className="kb-lite-page-actions kb-mp-mobile-unified-actions kb-mp-exact-marketplace-actions">
          <button type="button" className="kb-lite-action is-secondary" onClick={headerSecondaryAction.run}>
            {headerSecondaryAction.label}
          </button>
          <button type="button" className="kb-lite-action is-primary" onClick={onPost}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Post a project
          </button>
        </div>
      </div>

      <div className="kb-mp-mobile-unified-snapshot kb-mp-exact-marketplace-snapshot" style={{display:'grid',gridTemplateColumns:isMobile ? 'repeat(2,minmax(0,1fr))' : 'repeat(4,minmax(0,1fr))',gap:12,marginBottom:14}}>
        {operatingSnapshot.map((item, idx) => {
          const accentColor = '#b08840';
          const accentBg = 'rgba(176,136,64,0.10)';
          return (
            <div key={item.label} style={{position:'relative',background:'#fff',borderRadius:12,padding:'8px 12px',border:'1px solid #e8dfcb',boxShadow:'0 1px 2px rgba(28,40,20,0.03)',overflow:'hidden',display:'flex',alignItems:'center',gap:10,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:7,flexShrink:1,minWidth:0}}>
                <div style={{width:14,height:14,borderRadius:4,background:accentBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <div style={{width:5,height:5,borderRadius:'50%',background:accentColor}}/>
                </div>
                <div className="kb-snapshot-label" style={{fontSize:12,fontWeight:700,letterSpacing:0,textTransform:'none',color:'#1C2814',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.label}</div>
              </div>
              <div style={{fontFamily:"'Newsreader','Playfair Display',serif",fontSize:17,fontWeight:600,letterSpacing:'-0.025em',color:'#1C2814',lineHeight:1,marginLeft:'auto',flexShrink:0,whiteSpace:'nowrap'}}>{item.value}</div>
            </div>
          );
        })}
      </div>

      <div className="kb-content-command-strip kb-myproj-filter-strip kb-mp-mobile-unified-toolbar kb-mp-exact-marketplace-toolbar" aria-label="Project filters">
        <div className="kb-content-command-tabs">
          {laneButtons.map(f => (
            <button
              key={f.key}
              type="button"
              className={`kb-content-command-tab${lane===f.key?' active':''}`}
              onClick={()=>{ setLane(f.key); setShowAll(false); }}
            >
              {f.label}
              <span>{f.count}</span>
            </button>
          ))}
        </div>
        <div className="kb-content-command-tools">
          <div className="kb-content-command-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input aria-label="Search projects, churches, or next steps" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search projects…" />
            {search ? <button type="button" aria-label="Clear search" onClick={()=>setSearch('')} className="kb737-search-clear">×</button> : null}
          </div>
          <select aria-label="Sort projects" value={sortBy} onChange={e=>setSortBy(e.target.value)} className="kb-content-command-sort">
            <option value="priority">Priority</option>
            <option value="newest">Newest</option>
            <option value="bids">Most bids</option>
            <option value="budget">Largest budget</option>
          </select>
        </div>
      </div>
      </div>

      {activityItemsVisible.length > 0 ? (() => {
        // Dedupe: if two items have the exact same signal label + church, fold them.
        const seen = new Map();
        const deduped = [];
        activityItemsVisible.forEach((item) => {
          const churchName = item.project.church || item.project.church_name || '';
          const key = `${item.label}::${churchName}`;
          if (seen.has(key)) {
            const existing = seen.get(key);
            existing.duplicates = (existing.duplicates || 1) + 1;
            existing.relatedTitles = [...(existing.relatedTitles || [existing.project.title]), item.project.title];
          } else {
            const copy = { ...item, duplicates: 1, relatedTitles: [item.project.title] };
            seen.set(key, copy);
            deduped.push(copy);
          }
        });

        // Keep severity semantic for ordering, but render one calm chip style.
        const severityFor = (item) => {
          const tone = String(item.tone || '').toLowerCase();
          if (tone.includes('b84') || tone.includes('red') || tone.includes('urgent') || /^#[a-f0-9]*[bcd][0-9a-f]/.test(tone)) return { tier:'Urgent' };
          if (tone.includes('a67') || tone.includes('a87') || tone.includes('8a6') || tone.includes('amber') || tone.includes('gold')) return { tier:'Action' };
          return { tier:'Update' };
        };

        return (
          <div className="myproj-attention-shell" style={{marginBottom:16}}>
            {/* Single panel — looks like a list, not a grid of cards */}
            <div style={{background:'#fff',border:'1px solid #e8dfcb',borderRadius:14,boxShadow:'0 1px 2px rgba(28,40,20,0.03)',overflow:'hidden'}}>
              {/* Panel header */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'12px 16px',borderBottom:'1px solid #f4ecdc',background:'#fdfbf6'}}>
                <div style={{display:'inline-flex',alignItems:'center',gap:10}}>
                  <div style={{fontSize:14,fontWeight:700,color:'#1C2814'}}>Needs attention</div>
                  <div style={{padding:'3px 9px',borderRadius:999,background:'#eff2ed',border:'1px solid #d9dfd5',fontSize:12,fontWeight:700,color:'#586257'}}>{deduped.length}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setAttentionCollapsed(v => !v); }}
                    aria-expanded={!attentionCollapsed}
                    aria-label={attentionCollapsed ? 'Expand needs attention' : 'Collapse needs attention'}
                    title={attentionCollapsed ? 'Show items needing attention' : 'Hide items needing attention'}
                    style={{width:26,height:26,borderRadius:999,border:'1px solid rgba(28,40,20,0.14)',background:'rgba(28,40,20,0.04)',color:'#1C2814',cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0,padding:0}}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{transform: attentionCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s ease'}}>
                      <polyline points="18 15 12 9 6 15"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Stacked rows */}
              {!attentionCollapsed ? (<>
              <div style={{display:'flex',flexDirection:'column'}}>
                {deduped.map((item, idx) => {
                  const quickAction = getProjectQuickAction(item.project);
                  const sev = severityFor(item);
                  const churchName = item.project.church || item.project.church_name || 'Church';
                  const isLast = idx === deduped.length - 1;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => quickAction?.run?.()}
                      className="myproj-attention-row"
                      style={{
                        textAlign:'left',
                        background:'transparent',
                        border:'none',
                        borderBottom: isLast ? 'none' : '1px solid #f4ecdc',
                        padding:'12px 16px',
                        cursor:'pointer',
                        display:'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr auto',
                        gap: isMobile ? 10 : 14,
                        alignItems:'center',
                        transition:'background-color .15s ease',
                      }}
                    >
                      <span className="kb-status-chip is-neutral" style={{justifySelf:'start'}}>{sev.tier}</span>

                      {/* Signal text + meta — main content */}
                      <div style={{minWidth:0,display:'flex',flexDirection: isMobile ? 'column' : 'row',alignItems: isMobile ? 'stretch' : 'baseline',gap: isMobile ? 3 : 10,flexWrap:'wrap'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                          <div style={{fontSize:14,fontWeight:700,color:'#1C2814',lineHeight:1.35,letterSpacing:'-0.003em'}}>
                            {quickAction?.label || 'Review'}: {item.label}
                          </div>
                          {item.duplicates > 1 && (
                            <div style={{padding:'1px 7px',borderRadius:999,background:'rgba(176,136,64,0.10)',border:'1px solid rgba(176,136,64,0.22)',fontSize:10,fontWeight:700,color:'#8a6a2e',letterSpacing:'0.04em',whiteSpace:'nowrap'}}>×{item.duplicates}</div>
                          )}
                        </div>
                        <div style={{fontSize:12,color:'#7a7d85',lineHeight:1.4,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                          <span style={{fontWeight:600,color:'#5b6472',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:isMobile ? '60%' : 220}}>
                            {item.duplicates > 1 ? `${item.duplicates} projects` : item.project.title}
                          </span>
                          <span style={{width:2,height:2,borderRadius:'50%',background:'#c9c5be',flexShrink:0}}/>
                          <span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{churchName}</span>
                          {item.project.sharedStatusLabel && !isMobile && (
                            <>
                              <span style={{width:2,height:2,borderRadius:'50%',background:'#c9c5be',flexShrink:0}}/>
                              <span>{item.project.sharedStatusLabel}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action button */}
                      <div style={{display:'inline-flex',alignItems:'center',gap:5,minHeight:36,padding:'8px 14px',borderRadius:999,background:'#1C2814',color:'#fff',fontSize:13,fontWeight:700,whiteSpace:'nowrap',flexShrink:0,gridColumn: isMobile ? '1 / -1' : 'auto',justifySelf: isMobile ? 'flex-start' : 'auto',marginTop: isMobile ? 4 : 0}}>
                        {quickAction?.label || 'Open'} <span aria-hidden="true">→</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {activityItemsTotal > activityItemsVisible.length ? (
                <div style={{padding:'10px 18px',borderTop:'1px solid #f4ecdc',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <button type="button" onClick={()=>{setLane('all');setSearch('');}} style={{fontSize:12,fontWeight:700,color:'#8a6729',background:'none',border:'none',cursor:'pointer',padding:'4px 12px',fontFamily:"'DM Sans',sans-serif"}}>
                    {activityItemsTotal - activityItemsVisible.length} more item{activityItemsTotal - activityItemsVisible.length === 1 ? '' : 's'} — view all projects →
                  </button>
                </div>
              ) : null}
              </>) : null}
            </div>
          </div>
        );
      })() : null}

      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:16}}>
          {[1,2,3,4].map(i=>(
            <div key={i} style={{background:'#fff',borderRadius:22,border:'0.5px solid rgba(42,53,32,0.09)',overflow:'hidden',height:334}}>
              <div style={{height:132,background:'var(--cream-dark)',animation:'skeleton 1.5s ease infinite'}}/>
              <div style={{padding:'18px 20px',display:'flex',flexDirection:'column',gap:12}}>
                <div style={{height:16,width:'62%',background:'var(--cream-dark)',borderRadius:8,animation:'skeleton 1.5s ease infinite'}}/>
                <div style={{height:10,width:'38%',background:'var(--cream-dark)',borderRadius:999,animation:'skeleton 1.5s ease infinite'}}/>
                <div style={{height:10,width:'88%',background:'var(--cream-dark)',borderRadius:6,animation:'skeleton 1.5s ease infinite'}}/>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:8}}>
                  {[1,2,3].map(k=><div key={k} style={{height:48,background:'var(--cream-dark)',borderRadius:12,animation:'skeleton 1.5s ease infinite'}}/>) }
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (loading || !hasFetchedOnce.current) ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:16}}>
          {[1,2].map(i=>(
            <div key={i} style={{background:'#fff',borderRadius:22,border:'0.5px solid rgba(42,53,32,0.09)',overflow:'hidden',height:200}}>
              <div style={{padding:'28px 20px',display:'flex',flexDirection:'column',gap:12}}>
                <div style={{height:16,width:'62%',background:'var(--cream-dark)',borderRadius:8,animation:'skeleton 1.5s ease infinite'}}/>
                <div style={{height:10,width:'38%',background:'var(--cream-dark)',borderRadius:999,animation:'skeleton 1.5s ease infinite'}}/>
              </div>
            </div>
          ))}
        </div>
      ) : myProjectsFetchError ? (
        <div style={{padding:'48px 24px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
          <div style={{width:52,height:52,borderRadius:'50%',background:'rgba(220,38,38,0.07)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>⚠</div>
          <div style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:22,fontWeight:700,color:'#1C2814',letterSpacing:'-0.02em'}}>Couldn't load your projects</div>
          <div style={{fontSize:13,color:'#858792',maxWidth:340,lineHeight:1.6}}>There was a problem fetching your projects. Check your connection and try again.</div>
          <button
            type="button"
            onClick={typeof onRetryMyProjects === 'function' ? onRetryMyProjects : undefined}
            style={{height:42,padding:'0 22px',borderRadius:11,border:'none',background:'linear-gradient(180deg,#1C2814,#0e1808)',color:'#fffdf8',fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",letterSpacing:'0.02em',boxShadow:'0 4px 14px rgba(28,40,20,0.20)'}}
          >
            Try again
          </button>
        </div>
      ) : normalizedProjects.length === 0 ? (
        <ProjectPrimaryEmptyState
          title="No projects yet"
          sub="Post your first project. Aligned vendors propose, you compare, and the work moves into the deal room — all in one place."
          onAction={onPost}
          onSecondaryAction={()=>nav('vendors')}
          secondaryActionLabel="Browse vendors"
          compact
        />
      ) : filtered.length === 0 ? (
        <KBIntentionalState
          eyebrow="No matches"
          title="Nothing matches this view"
          body="Try a different lane, clear your search, or post another project to keep this workspace moving."
          icon="⌕"
          actionLabel="Reset view"
          onAction={()=>{setLane('active'); setSearch('');}}
          secondaryLabel="Post a project"
          onSecondary={onPost}
          compact
        />
      ) : (
        <div className="kbm-grid kb-audit-project-grid" style={{display:'grid',gridTemplateColumns:isMobile ? '1fr' : 'repeat(auto-fill,minmax(280px,1fr))',gap:16,alignItems:'start'}}>
          {filtered.slice(0, showAll ? filtered.length : 24).map(project => {
            const convo = conversationMeta[String(project.id)] || {};
            const unread = convo.unread || 0;
            const primaryAction = (()=>{
              if (project.laneKey === 'comparing') return { key:'review-bids', label: project.bidsCount > 0 ? `Review ${project.bidsCount} bid${project.bidsCount===1?'':'s'} →` : 'Review bids →', onClick: (e)=>{ e.stopPropagation(); onManageBids(project); } };
              if (['hired','active'].includes(project.laneKey) || ['milestone_pending','disputed'].includes(project.deal_state) || hasDealRoomAccess(project)) return { key:'deal-room', label:'Open deal room →', onClick:(e)=>{ e.stopPropagation(); openDealRoom(project); } };
              if (project.laneKey === 'completed') return { key:'leave-review', label:'Leave a review →', onClick:(e)=>{ e.stopPropagation(); setPendingReviewTarget({ vendor_id: project.hired_vendor_id || null, name: project.hired_vendor_name || '', emoji: '', project: project.title || '', project_id: project.id || null }); nav('reviews'); } };
              if ((Number(project?.attachedVendorCount || 0) || 0) > 0) return { key:'manage-vendors', label:'Manage vendors →', onClick:(e)=>{ e.stopPropagation(); manageProjectVendors(project); } };
              return { key:'workspace', label:'Open project →', onClick:(e)=>{ e.stopPropagation(); onSelect(project); } };
            })();
            return (
              <FaithBidCard11A
                key={project.id}
                image={getProjectHeroImage(project, 'grid')}
                imageAlt=""
                title={project.title}
                topLabel={`${project.health.label}${project.priorityFlag === 'priority' ? ' · Priority' : ''}`}
                avatarText={getInitialsSafe(project.church || 'FaithBid')}
                meta={`${project.city || project.church || 'Remote'} · ${project.timeline || 'Flexible'}${unread > 0 ? ` · ${unread} unread` : ''}`}
                value={moneyCompact(project.budgetValue) || project.budget || '$—'}
                actionLabel={String(primaryAction.label || 'Open project').replace(/\s*→\s*$/, '')}
                onOpen={() => onSelect(project)}
                onAction={primaryAction.onClick}
                ariaLabel={`Open ${project.title}`}
              />
            );
          })}
          {!showAll && filtered.length > 24 && (
            <button type="button" className="btn-secondary" style={{padding:'12px',borderRadius:12,gridColumn:'1/-1'}} onClick={()=>setShowAll(true)}>
              Show {filtered.length - 24} more projects ↓
            </button>
          )}
        </div>
      )}
      {vendorPickModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(28,40,20,0.50)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:16,backdropFilter:'blur(4px)'}} role="dialog" aria-modal="true">
          <div style={{background:'#fff',borderRadius:22,padding:'24px 26px',maxWidth:440,width:'100%',boxShadow:'0 20px 60px rgba(28,40,20,0.30)',border:'1px solid #dfd5c2'}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:10,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:'#b08840',marginBottom:6}}>Vendor selection</div>
            <h3 style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:20,fontWeight:700,color:'#1C2814',letterSpacing:'-0.02em',margin:'0 0 4px'}}>Update which vendor?</h3>
            <p style={{margin:'0 0 18px',fontSize:13,color:'#565862'}}>{vendorPickModal.project?.title}</p>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:18}}>
              {vendorPickModal.links.map((v) => (
                <button key={v.id} type="button" onClick={() => confirmVendorPick(v)}
                  style={{textAlign:'left',padding:'12px 14px',borderRadius:12,border:'1px solid #dfd5c2',background:'#fffdf8',cursor:'pointer',fontSize:14,fontWeight:600,color:'#1C2814',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,transition:'border-color .2s ease, background .2s ease'}}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#b08840'; e.currentTarget.style.background = '#fffaf0'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#dfd5c2'; e.currentTarget.style.background = '#fffdf8'; }}>
                  <span>{v.name}</span>
                  <span style={{fontSize:10.5,fontWeight:800,letterSpacing:'0.06em',textTransform:'uppercase',color:'#8a6729',padding:'3px 8px',borderRadius:999,background:'rgba(176,136,64,0.10)',border:'1px solid rgba(176,136,64,0.20)'}}>{PROJECT_VENDOR_STAGE_META[v.stage]?.label || 'Watching'}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setVendorPickModal(null)}
              style={{width:'100%',padding:'12px 0',borderRadius:12,border:'1px solid rgba(28,40,20,0.12)',background:'#fff',cursor:'pointer',fontSize:13,fontWeight:700,color:'#1C2814'}}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Closed projects — shown below main list as a quiet summary */}
      {normalizedProjects.filter(p => p.laneKey === 'cancelled').length > 0 && (
        <div style={{maxWidth:1400,margin:'32px auto 0',padding:'0 24px'}}>
          <details style={{borderRadius:14,border:'1px solid #ece4d2',background:'#fffdf8',overflow:'hidden'}}>
            <summary style={{padding:'13px 20px',cursor:'pointer',fontSize:12,fontWeight:700,color:'#8a8579',letterSpacing:'0.08em',textTransform:'uppercase',fontFamily:"'DM Mono',monospace",userSelect:'none',listStyle:'none',display:'flex',alignItems:'center',gap:8}}>
              <span style={{flex:1}}>Closed projects · {normalizedProjects.filter(p=>p.laneKey==='cancelled').length}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            </summary>
            <div style={{borderTop:'1px solid #ece4d2',padding:'4px 0 8px'}}>
              {normalizedProjects.filter(p=>p.laneKey==='cancelled').map(p=>(
                <div key={p.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 20px',gap:12}}>
                  <span style={{fontSize:13,color:'#7d7363',lineHeight:1.4}}>{p.title}</span>
                  <span style={{fontSize:10.5,fontFamily:"'DM Mono',monospace",color:'#c4bdb4',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',flexShrink:0}}>Closed</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {stagePickModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(28,40,20,0.50)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:16,backdropFilter:'blur(4px)'}} role="dialog" aria-modal="true">
          <div style={{background:'#fff',borderRadius:22,padding:'24px 26px',maxWidth:440,width:'100%',boxShadow:'0 20px 60px rgba(28,40,20,0.30)',border:'1px solid #dfd5c2'}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:10,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:'#b08840',marginBottom:6}}>Vendor stage</div>
            <h3 style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:20,fontWeight:700,color:'#1C2814',letterSpacing:'-0.02em',margin:'0 0 4px'}}>Set stage for {stagePickModal.vendor?.name}</h3>
            <p style={{margin:'0 0 18px',fontSize:13,color:'#565862'}}>Current: <strong style={{color:'#1C2814',fontWeight:700}}>{PROJECT_VENDOR_STAGE_META[stagePickModal.vendor?.stage]?.label || 'Watching'}</strong></p>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:18}}>
              {PROJECT_VENDOR_PIPELINE.map((item) => {
                const isCurrent = item.key === stagePickModal.vendor?.stage;
                return (
                  <button key={item.key} type="button" onClick={() => confirmStagePick(item.key)}
                    style={{textAlign:'left',padding:'12px 14px',borderRadius:12,border:`1px solid ${isCurrent ? item.border : '#dfd5c2'}`,background: isCurrent ? item.bg : '#fffdf8',cursor:'pointer',fontSize:14,fontWeight:600,color: isCurrent ? item.color : '#1C2814',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,transition:'border-color .2s ease, background .2s ease'}}>
                    <span>{item.label}</span>
                    {isCurrent && <span style={{fontSize:10,fontWeight:800,letterSpacing:'0.06em',textTransform:'uppercase',padding:'3px 8px',borderRadius:999,background:'rgba(255,255,255,0.7)',color:item.color}}>Current</span>}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => setStagePickModal(null)}
              style={{width:'100%',padding:'12px 0',borderRadius:12,border:'1px solid rgba(28,40,20,0.12)',background:'#fff',cursor:'pointer',fontSize:13,fontWeight:700,color:'#1C2814'}}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
const MemoMyProjectsCommand = React.memo(MyProjectsCommand);

function MyWorkPanel({bids, loading, projects, loadingProjects, onBrowse, nav, onFetchBids, onSelectProject, showToast}){
  const [bucket, setBucket] = useState("active");
  const [withdrawingBid, setWithdrawingBid] = useState(null);
  const [withdrawWorkPanelConfirm, setWithdrawWorkPanelConfirm] = useState(null);
  const [expandedBidId, setExpandedBidId] = useState(null);
  const [editingBid, setEditingBid] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(()=>{
    if (typeof onFetchBids === 'function') onFetchBids({ background: true });
  },[]);

  const doWithdrawFromWorkPanel = async (bidId) => {
    setWithdrawWorkPanelConfirm(null);
    const user = await getCurrentUserSafe();
    if (!user) {
      showToast && showToast("Please sign in again to withdraw this proposal.", "error");
      return;
    }
    setWithdrawingBid(bidId);
    try {
      const { error } = await supabase.rpc("marketplace_service_mutate_bid", {
        p_bid_id: bidId,
        p_action: "withdraw",
      });
      if (error) throw error;
      // Refresh bids so MyWorkPanel reflects the withdrawal. Force bypasses
      // the nav cache because this is a user mutation, not a passive tab visit.
      if (typeof onFetchBids === 'function') onFetchBids({ force: true, background: true });
      showToast && showToast("Proposal withdrawn.");
    } catch (err) {
      logError("bid-withdraw-workpanel", err, { bidId });
      const missingWithdrawnAt = isMissingColumnError(err, ["withdrawn_at"]);
      showToast && showToast(
        missingWithdrawnAt
          ? "Withdrawing proposals isn't available right now. We've been notified."
          : "Couldn't withdraw this proposal. Please try again.",
        "error"
      );
    } finally {
      setWithdrawingBid(null);
    }
  };

  const doEditBid = async () => {
    if (!editingBid || editSaving) return;
    const safeAmount = Number(String(editingBid.amount || '').replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(safeAmount) || safeAmount <= 0 || safeAmount > 10_000_000) {
      showToast && showToast('Please enter a valid amount (up to $10M).', 'error');
      return;
    }
    setEditSaving(true);
    try {
      const user = await getCurrentUserSafe();
      if (!user) throw new Error('not authenticated');
      const { error } = await supabase.rpc('marketplace_service_mutate_bid', {
        p_bid_id: editingBid.id,
        p_action: 'edit',
        p_amount: safeAmount,
        p_cover_letter: String(editingBid.note || '').trim().slice(0, 1500),
      });
      if (error) throw error;
      if (typeof onFetchBids === 'function') onFetchBids({ force: true, background: true });
      showToast && showToast('Proposal updated.');
      setEditingBid(null);
    } catch (err) {
      logError('bid-edit-workpanel', err, { bidId: editingBid?.id });
      showToast && showToast('Could not update proposal — please try again.', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const { won, pending, lost, totalEarned, winRate } = useMemo(() => {
    const list = Array.isArray(bids) ? bids : [];
    const wonRows = list.filter(b=>b.status==="hired");
    const pendingRows = list.filter(b=>b.status==="pending");
    const lostRows = list.filter(b=>b.status==="declined");
    const earned = wonRows.reduce((s,b)=>s+(Number(b.amount)||0),0);
    const rate = list.length > 0 ? Math.round(wonRows.length/list.length*100) : 0;
    return { won: wonRows, pending: pendingRows, lost: lostRows, totalEarned: earned, winRate: rate };
  }, [bids]);

  const openBidProject = (proj) => {
    if (!proj?.id) return;
    if (typeof onSelectProject === 'function') {
      onSelectProject(proj);
      return;
    }
    setPendingProjectTarget({ projectId: proj.id, projectTitle: proj.title || null, tab: 'overview' });
    nav && nav('projects');
  };

  const BUCKETS = [
    {key:"active",  label:"Active",       count:won.length},
    {key:"pending", label:"Pending bids", count:pending.length},
    {key:"lost",    label:"Not selected", count:lost.length},
  ];

  return (
    <>
    <div className="page marketplace-command-shell kb-vendor-work-shell kb-no-green-header">
      <div className="kb-market-ivory-command-basin kb-market-ivory-command-basin--vendor-work">
      <div className="kb-lite-page-head kb-lite-page-head--mywork kb-unified-workspace-head">
        <div>
          <div className="kb-lite-page-kicker">— Vendor workspace —</div>
          <h1>My Work</h1>
          <p>Track active projects, pending bids, and awarded work.</p>
        </div>
        <div className="kb-lite-page-actions">
          <button type="button" className="kb-lite-action is-secondary" onClick={()=>queueDealRoomsHubNavigation(nav, { returnContext:{ scope:'my-work', tab:'work' } })}>View Deal Rooms</button>
          <button type="button" className="kb-lite-action is-primary" onClick={onBrowse}>Browse projects</button>
        </div>
      </div>

      <div className="kb-content-command-strip kb-vendor-work-filter-strip" aria-label="Work filters">
        <div className="kb-content-command-tabs">
          {BUCKETS.map(b=>(
            <button type="button" key={b.key} onClick={()=>setBucket(b.key)} className={`kb-content-command-tab${bucket===b.key?" active":""}`}>
              {b.label}
              <span>{b.count}</span>
            </button>
          ))}
        </div>
        <div className="kb-content-command-tools kb-vendor-work-stats">
          {totalEarned > 0 ? <div className="kb-vendor-stat-chip"><span>Earned</span><strong>{formatMoney(totalEarned)}</strong></div> : null}
          {bids.length > 0 ? <div className="kb-vendor-stat-chip"><span>Win rate</span><strong>{winRate}%</strong></div> : null}
        </div>
      </div>
      </div>

      {/* ── ACTIVE PROJECTS ── */}
      {bucket==="active" && (
        loading||loadingProjects ? (
          <div className="project-grid">
            {[1,2].map(i=>(
              <div key={i} style={{background:"#fff",borderRadius:20,border:"0.5px solid rgba(42,53,32,0.09)",overflow:"hidden",height:280}}>
                <div style={{height:130,background:"var(--cream-dark)",animation:"skeleton 1.5s ease infinite"}}/>
                <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:10}}>
                  <div style={{height:14,width:"70%",background:"var(--cream-dark)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/>
                  <div style={{height:10,width:"40%",background:"var(--cream-dark)",borderRadius:100,animation:"skeleton 1.5s ease infinite"}}/>
                </div>
              </div>
            ))}
          </div>
        ) : won.length===0 ? (
          <div style={{background:'linear-gradient(135deg,#1C2814,#2a3520)',borderRadius:22,padding:'64px 40px',textAlign:'center',color:'#fff',boxShadow:'0 7px 20px rgba(28,40,20,0.20)'}}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:10,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:'#c4973a',marginBottom:14}}>Your work</div>
            <div style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:'clamp(24px,3.4vw,30px)',fontWeight:700,marginBottom:10,letterSpacing:'-0.025em',color:'#fff',lineHeight:1.05}}>No active projects yet.</div>
            <div style={{fontSize:14,color:'rgba(255,255,255,0.72)',marginBottom:28,lineHeight:1.65,maxWidth:420,margin:'0 auto 28px'}}>
              Submit bids on open projects and win your first ministry client.
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
              <button type="button" onClick={onBrowse} style={{height:48,padding:'0 22px',borderRadius:12,border:'none',background:'linear-gradient(180deg,#c9a45c,#b08840)',fontSize:13,fontWeight:700,color:'#fff',cursor:'pointer',boxShadow:'0 1px 3px rgba(176,136,64,0.35)'}}>Browse open projects →</button>
              <button type="button" onClick={()=>nav('profile')} style={{height:48,padding:'0 18px',borderRadius:12,border:'1px solid rgba(255,255,255,0.20)',background:'rgba(255,255,255,0.06)',fontSize:13,fontWeight:700,color:'#fff',cursor:'pointer'}}>Complete profile</button>
            </div>
          </div>
        ) : (
          <div className="project-grid">
            {won.map(b=>{
              const proj = b.projects || {};
              const p = {
                title: proj.title || "Project",
                church: proj.church_name, church_name: proj.church_name,
                city: proj.city, category: proj.category || b.category,
                budget: proj.budget, status: "hired",
                timeline: b.timeline, urgent: false, bids: 0,
                desc: proj.description || "",
                skills: proj.skills || [], requirements: proj.requirements || [],
              };
              return (
                <KcProjectCard key={b.id} project={p} onSelect={()=>openBidProject(proj)}
                  bidAmount={b.amount}
                  statusOverride={{label:"In Progress", color:"rgba(255,255,255,0.65)", dot:"#D97706"}}
                  actions={[{ label:"Open Deal Room →", onClick:()=>openInboxThread(nav, { projectId: proj.id, projectTitle: proj.title || null, churchId: proj.church_id || null, churchName: proj.church_name || null, vendorId: b.vendor_id || null, vendorName: b.vendor_name || null, viewerRole:'vendor', createIfMissing: Boolean(b.vendor_id) }) }]}
                />
              );
            })}
          </div>
        )
      )}

      {/* ── PENDING BIDS ── */}
      {bucket==="pending" && (
        pending.length===0 ? (
          <KBIntentionalState
            eyebrow="Bid pipeline"
            title="No pending bids yet"
            body="When you submit proposals on open projects, they will collect here so you can track which churches are still deciding."
            icon="↗"
            actionLabel="Browse open projects"
            onAction={onBrowse}
            secondaryLabel="Complete profile"
            onSecondary={()=>nav('profile')}
            compact
          />
        ) : (
          <div className="project-grid">
            {pending.map(b=>{
              const proj=b.projects||{};
              const days=Math.floor((Date.now()-new Date(b.created_at))/86400000);
              const submittedLabel = days===0?"Today":days===1?"Yesterday":`${days}d ago`;
              const p = {
                title: proj.title || "Project",
                church: proj.church_name, church_name: proj.church_name,
                city: proj.city, category: proj.category || b.category,
                budget: proj.budget, status: "open",
                timeline: b.timeline || submittedLabel, urgent: false, bids: 0,
                desc: proj.description || "",
                skills: proj.skills || [], requirements: proj.requirements || [],
              };
              return (
                <div key={b.id} style={{display:'flex',flexDirection:'column',gap:6}}>
                  <div onClick={() => setExpandedBidId(prev => prev === b.id ? null : b.id)} style={{cursor:'pointer'}}>
                    <KcProjectCard project={p}
                      bidAmount={b.amount}
                      statusOverride={{label:"Awaiting Decision", color:"rgba(255,255,255,0.5)", dot:"#C4BDB4"}}
                    />
                  </div>
                  <div style={{display:'flex',justifyContent:'flex-end',paddingRight:4}}>
                    <button
                      type="button"
                      onClick={()=>setWithdrawWorkPanelConfirm(b.id)}
                      disabled={withdrawingBid===b.id}
                      aria-label={`Withdraw bid on ${proj.title||'project'}`}
                      style={{padding:'5px 12px',borderRadius:999,border:'1px solid rgba(220,38,38,0.22)',background:'rgba(220,38,38,0.06)',color:'#b1342a',fontSize:10.5,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",letterSpacing:'0.04em',opacity:withdrawingBid===b.id?0.5:1}}
                    >
                      {withdrawingBid===b.id ? 'Withdrawing…' : 'Withdraw bid'}
                    </button>
                  </div>
                  {expandedBidId === b.id && (
                    <div style={{marginTop:4, padding:'16px 18px', borderRadius:14, background:'#fffdf8', border:'1px solid #efe7d9', display:'flex', flexDirection:'column', gap:14}}>
                      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                        <div style={{padding:'10px 12px',borderRadius:12,background:'#fff',border:'1px solid #e5dcc8',minWidth:110}}>
                          <div style={{fontFamily:'DM Mono,monospace',fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'#8a8579',fontWeight:700,marginBottom:3}}>Your bid</div>
                          <div style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:17,fontWeight:700,color:'#1C2814'}}>{formatMoney(Number(b.amount))}</div>
                        </div>
                        <div style={{padding:'10px 12px',borderRadius:12,background:'#fff',border:'1px solid #e5dcc8',minWidth:110}}>
                          <div style={{fontFamily:'DM Mono,monospace',fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'#8a8579',fontWeight:700,marginBottom:3}}>Timeline</div>
                          <div style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:17,fontWeight:700,color:'#1C2814'}}>{b.timeline || '—'}</div>
                        </div>
                        <div style={{padding:'10px 12px',borderRadius:12,background:'#fff',border:'1px solid #e5dcc8',minWidth:110}}>
                          <div style={{fontFamily:'DM Mono,monospace',fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'#8a8579',fontWeight:700,marginBottom:3}}>Submitted</div>
                          <div style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:17,fontWeight:700,color:'#1C2814'}}>{days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days}d ago`}</div>
                        </div>
                      </div>
                      {(b.cover_letter || b.note) && (
                        <div>
                          <div style={{fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#8a8579', marginBottom:6}}>Your cover note</div>
                          <div style={{fontSize:13, color:'#565862', lineHeight:1.7, padding:'12px 14px', background:'#fff', borderRadius:10, border:'1px solid #e5dcc8'}}>{b.cover_letter || b.note}</div>
                        </div>
                      )}
                      {editingBid?.id === b.id && (
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'12px 14px', borderRadius:10, background:'#fff', border:'1px solid #e5dcc8'}}>
                          <label style={{display:'grid', gap:4}}>
                            <span style={{fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'#5a5246'}}>Amount (USD)</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editingBid.amount}
                              onChange={e => setEditingBid(prev => ({...prev, amount: e.target.value}))}
                              style={{height:38, padding:'0 12px', borderRadius:8, border:'1.5px solid #dfd5c2', background:'#fff', fontSize:14, fontFamily:'DM Sans,sans-serif', outline:'none'}}
                            />
                          </label>
                          <div style={{display:'flex', alignItems:'flex-end', gap:8}}>
                            <button type="button" onClick={doEditBid} disabled={editSaving} style={{height:38, padding:'0 14px', borderRadius:8, border:'none', background:editSaving?'#e5e7eb':'linear-gradient(180deg,#c9a45c,#b08840)', color:editSaving?'#9ca3af':'#fff', fontSize:12, fontWeight:700, cursor:editSaving?'not-allowed':'pointer'}}>
                              {editSaving ? 'Saving…' : 'Save'}
                            </button>
                            <button type="button" onClick={() => setEditingBid(null)} style={{height:38, padding:'0 12px', borderRadius:8, border:'1px solid #dfd5c2', background:'#fff', color:'#5a5246', fontSize:12, fontWeight:600, cursor:'pointer'}}>Cancel</button>
                          </div>
                        </div>
                      )}
                      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                        <button type="button" onClick={() => setEditingBid({id:b.id, amount:String(b.amount||''), note:b.cover_letter||b.note||''})} style={{height:34, padding:'0 14px', borderRadius:999, border:'1px solid rgba(176,136,64,0.22)', background:'rgba(176,136,64,0.08)', color:'#8a6a2e', fontSize:12, fontWeight:700, cursor:'pointer'}}>Edit proposal</button>
                        <button type="button" onClick={() => setExpandedBidId(null)} style={{height:34, padding:'0 14px', borderRadius:999, border:'1px solid #dfd5c2', background:'#fff', color:'#5a5246', fontSize:12, fontWeight:600, cursor:'pointer'}}>Close</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── NOT SELECTED ── */}
      {bucket==="lost" && (
        lost.length===0 ? (
          <KBIntentionalState
            eyebrow="Decision history"
            title="No declined bids"
            body="Clean record so far. Keep bidding with focused proposals and this section will only show opportunities that were not selected."
            icon="✓"
            actionLabel="Browse projects"
            onAction={onBrowse}
            compact
          />
        ) : (
          <div className="project-grid">
            {lost.map(b=>{
              const proj=b.projects||{};
              const p = {
                title: proj.title || "Project",
                church: proj.church_name, church_name: proj.church_name,
                city: proj.city, category: proj.category || b.category,
                budget: proj.budget, status: "completed",
                timeline: b.timeline, urgent: false, bids: 0,
                desc: proj.description || "",
                skills: proj.skills || [], requirements: proj.requirements || [],
              };
              return (
                <KcProjectCard key={b.id} project={p} onSelect={()=>openBidProject(proj)}
                  bidAmount={b.amount}
                  statusOverride={{label:"Not selected", color:"rgba(255,255,255,0.4)", dot:"#C4BDB4"}}
                />
              );
            })}
          </div>
        )
      )}
    </div>
    {withdrawWorkPanelConfirm && (
      <ConfirmModal
        title="Withdraw this bid?"
        body="This cannot be undone. The church will no longer see your proposal."
        confirmLabel="Yes, Withdraw"
        danger
        onConfirm={()=>doWithdrawFromWorkPanel(withdrawWorkPanelConfirm)}
        onCancel={()=>setWithdrawWorkPanelConfirm(null)}
      />
    )}
  </>
  );
}
const MemoMyWorkPanel = React.memo(MyWorkPanel);

function SampleProjectDetail({ project: p = {}, onBack, role, nav }) {
  const isVendor = role === "vendor";
  const goBack = onBack || (() => { if (typeof nav === "function") nav("projects"); });
  const goPrimary = () => {
    if (typeof nav === "function") {
      nav(isVendor ? "projects" : "projects:post");
      return;
    }
    if (!isVendor && typeof document !== "undefined") {
      document.dispatchEvent(new CustomEvent("kb:post-project"));
    }
  };
  const skills = Array.isArray(p.skills) ? p.skills.filter(Boolean) : [];
  const metaItems = [
    { label: "Budget", value: p.budget || "Flexible" },
    { label: "Timeline", value: p.timeline || "Timeline TBD" },
    { label: "Project type", value: p.scope || p.type || "One-time project" },
  ];
  const churchLine = [p.church || p.church_name, p.city].filter(Boolean).join(" · ") || "Community example";
  const description = p.desc || p.description || "This representative project shows how a complete ministry brief can look once a church posts work to the marketplace.";

  return (
    <div style={{ minHeight: "100vh", backgroundImage: KB_WORKSPACE_CLAY_BACKGROUND, backgroundSize: "cover", backgroundPosition: "center top", backgroundRepeat: "no-repeat", backgroundAttachment: "fixed", backgroundColor: "#f6efe4", padding: "22px 24px 52px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={goBack}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 38, padding: "0 16px", borderRadius: 999, border: "1px solid #dfd5c2", background: "rgba(255,255,255,0.72)", color: "#1C2814", fontSize: 12, fontWeight: 800, letterSpacing: "0.02em", cursor: "pointer", boxShadow: "0 6px 18px rgba(28,40,20,0.045)" }}
          >
            <span aria-hidden="true">←</span> Back to projects
          </button>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 34, padding: "0 13px", borderRadius: 999, border: "1px solid rgba(176,136,64,0.28)", background: "rgba(176,136,64,0.09)", color: "#8a6729", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            <span aria-hidden="true">✦</span> Community example
          </div>
        </div>

        <section style={{ position: "relative", overflow: "hidden", border: "1px solid #dfd5c2", borderRadius: 28, background: "linear-gradient(135deg,#fffaf0 0%,#fffdf8 50%,#f7efe0 100%)", boxShadow: "0 18px 54px rgba(28,40,20,0.08)", marginBottom: 16 }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 82% 16%, rgba(176,136,64,0.16), transparent 34%), radial-gradient(circle at 8% 88%, rgba(28,40,20,0.07), transparent 32%)" }} />
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0,1.55fr) minmax(280px,0.9fr)", gap: 24, padding: "34px clamp(22px,4vw,42px)" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#b08840", marginBottom: 10 }}>
                {p.category || "Sample project"}
              </div>
              <h1 style={{ margin: 0, fontFamily: "'Playfair Display','Newsreader',Georgia,serif", fontSize: "clamp(31px,5vw,54px)", lineHeight: 0.98, letterSpacing: "-0.045em", fontWeight: 800, color: "#1C2814", maxWidth: 760 }}>
                {p.title || "Sample ministry project"}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 16, color: "#6b6d75", fontSize: 13.5, fontWeight: 600 }}>
                <span>{churchLine}</span>
                {p.urgent && <span style={{ display: "inline-flex", alignItems: "center", height: 25, padding: "0 10px", borderRadius: 999, background: "rgba(197,48,48,0.1)", color: "#a43b28", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase" }}>Urgent</span>}
                <span style={{ display: "inline-flex", alignItems: "center", height: 25, padding: "0 10px", borderRadius: 999, background: "rgba(28,40,20,0.06)", color: "#556044", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase" }}>Read-only preview</span>
              </div>
              <p style={{ margin: "22px 0 0", maxWidth: 720, fontSize: 15, lineHeight: 1.78, color: "#565a50", fontWeight: 400 }}>
                {description}
              </p>
            </div>

            <aside style={{ alignSelf: "stretch", border: "1px solid rgba(223,213,194,0.94)", borderRadius: 22, background: "rgba(255,255,255,0.72)", padding: 18, boxShadow: "0 10px 28px rgba(28,40,20,0.06)", backdropFilter: "blur(8px)" }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9c8a6a", marginBottom: 12 }}>
                Project snapshot
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {metaItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={goPrimary}
                    title={isVendor ? "Browse open projects" : "Post a similar project"}
                    style={{ width: "100%", textAlign: "left", padding: "13px 14px", borderRadius: 16, border: "1px solid #eadfca", background: "#fffdf8", cursor: "pointer" }}
                  >
                    <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#a09a85", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontFamily: "'Playfair Display','Newsreader',Georgia,serif", fontSize: 19, lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.02em", color: "#1C2814" }}>{item.value}</div>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: skills.length ? "minmax(0,1.25fr) minmax(280px,0.75fr)" : "1fr", gap: 16, alignItems: "stretch" }}>
          <section style={{ border: "1px solid #dfd5c2", borderRadius: 22, background: "#fff", padding: 24, boxShadow: "0 10px 30px rgba(28,40,20,0.055)" }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#b08840", marginBottom: 10 }}>Project description</div>
            <div style={{ fontSize: 14.5, color: "#565a50", lineHeight: 1.82, fontWeight: 400 }}>{description}</div>
            <div style={{ marginTop: 18, padding: "13px 15px", borderRadius: 16, border: "1px solid #eadfca", background: "#fffaf0", color: "#6a604f", fontSize: 12.5, lineHeight: 1.62, fontWeight: 600 }}>
              This sample brief is intentionally read-only. Real projects use the same detail structure, but include live bidding, messaging, and vendor proposal workflows.
            </div>
          </section>

          {skills.length > 0 && (
            <section style={{ border: "1px solid #dfd5c2", borderRadius: 22, background: "#fff", padding: 24, boxShadow: "0 10px 30px rgba(28,40,20,0.055)" }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#b08840", marginBottom: 13 }}>Skills needed</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {skills.map((s, i) => (
                  <span key={`${s}-${i}`} style={{ display: "inline-flex", alignItems: "center", minHeight: 30, padding: "6px 12px", borderRadius: 999, border: "1px solid #e5dbc8", background: "#fffdf8", color: "#6a604f", fontSize: 11, fontWeight: 800, letterSpacing: "0.045em", textTransform: "uppercase" }}>{s}</span>
                ))}
              </div>
            </section>
          )}
        </div>

        <section style={{ marginTop: 16, borderRadius: 24, overflow: "hidden", background: "linear-gradient(135deg,#1C2814,#28371d)", border: "1px solid rgba(28,40,20,0.22)", boxShadow: "0 18px 42px rgba(28,40,20,0.16)" }}>
          <div style={{ padding: "28px clamp(22px,4vw,38px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 22, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0, maxWidth: 660 }}>
              <div style={{ fontFamily: "'Playfair Display','Newsreader',Georgia,serif", fontSize: "clamp(22px,3vw,32px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.035em", color: "#fff", marginBottom: 8 }}>
                {isVendor ? "Projects like this are waiting for you." : "Ready to post a project like this?"}
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.7, color: "rgba(255,255,255,0.68)", maxWidth: 600 }}>
                {isVendor
                  ? "Create your vendor profile to browse and bid on real open projects from churches across the country."
                  : "It takes about 3 minutes and it is free to begin. Faith-aligned vendors can review the brief and submit bids when the project is live."}
              </div>
            </div>
            <button
              type="button"
              onClick={goPrimary}
              style={{ height: 46, padding: "0 22px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)", background: "linear-gradient(135deg,#c59a46,#a87b2a)", color: "#fff", fontSize: 13, fontWeight: 800, letterSpacing: "0.02em", cursor: "pointer", boxShadow: "0 14px 32px rgba(0,0,0,0.18)", whiteSpace: "nowrap" }}
            >
              {isVendor ? "Browse open projects" : "Post a similar project"} <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ManageBids({project:p, bids, loading, error, onRetry, onAccept, onDecline, onBack, onNav, showToast}){
  const [selectedId, setSelectedId] = useState(null);
  const [sortBy, setSortBy] = useState("amount");
  const [stageFilter, setStageFilter] = useState("all");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'compare'
  const [confirmDecline, setConfirmDecline] = useState(null); // bidId to confirm
  const [confirmDeclineAll, setConfirmDeclineAll] = useState(false);
  const safeBids = Array.isArray(bids) ? bids : [];
  const safeNav = typeof onNav === 'function' ? onNav : () => {};
  const safeAccept = async (bidId) => {
    if (typeof onAccept !== 'function') { showToast && showToast('Hire action is unavailable right now.'); return; }
    return onAccept(bidId);
  };
  const safeDecline = async (bidId) => {
    if (typeof onDecline !== 'function') { showToast && showToast('Decline action is unavailable right now.'); return; }
    return onDecline(bidId);
  };

  const hired  = safeBids.find(b=>b.hired||b.status==="hired");
  const active = safeBids.filter(b=>!b.declined&&b.status!=="declined"&&!b.hired&&b.status!=="hired");
  const lowest = active.length>0 ? Math.min(...active.map(b=>Number(b.amount)||0)) : 0;
  const highestRated = active.length>0 ? active.reduce((best,b)=>(b.rating||0)>(best.rating||0)?b:best, active[0]) : null;
  const avgBid = safeBids.length>0 ? Math.round(safeBids.reduce((a,b)=>a+(Number(b.amount)||0),0)/safeBids.length) : 0;
  const seedCompareForBid = (bid) => {
    if (!p?.id) return;
    const projectCompareResult = upsertCompareWorkspaceItem('projects', {
      id: p.id,
      title: p.title,
      church_name: p.church_name || p.church,
      city: p.city,
      category: p.category,
      budget: p.budget,
      image: getProjectHeroImage(p),
    });
    if (projectCompareResult?.compareLimitReached) {
      showToast && showToast(getCompareWorkspaceLimitMessage('projects'), 'error');
      return;
    }
    const vendorCompareResult = upsertCompareWorkspaceItem('vendors', {
      id: bid.vendor_id || bid.id,
      initials: (bid.vendor||bid.vendor_name||'V').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
      name: bid.vendor || bid.vendor_name || 'Vendor',
      role: bid.category || 'Vendor',
      city: bid.city || p.city || 'Remote',
      rating: Number(bid.rating || 0),
      reviews: Number(bid.reviews || 0),
      badge: (getVendorIdentityBadges(bid)?.[0]?.label) || ((bid.verified || bid.faith_verified) ? 'Faith Verified' : 'Member'),
      gradient: 'linear-gradient(145deg,#5b7a5e,#3d5940)',
      price: bid.amount ? formatMoney(Number(bid.amount)) : 'Custom proposal',
    });
    if (vendorCompareResult?.compareLimitReached) {
      showToast && showToast(getCompareWorkspaceLimitMessage('vendors'), 'error');
      return;
    }
    saveCompareWorkspaceState({ ...loadCompareWorkspaceState(), linkedProjectId: p.id });
    rememberReturnContext({ scope:'bid-review', projectId: p.id, vendorId: bid.vendor_id || null });
    safeNav('compare');
  };
  const shortlistBid = async (bid) => {
    if (!p?.id || !bid?.id) { showToast && showToast("Project or bid context is missing.", "error"); return false; }
    try {
      const { data, error } = await supabase.rpc("marketplace_service_mutate_bid", { p_bid_id: bid.id, p_action: "review" });
      if (error) throw error;
      upsertProjectVendorLink(p.id, { id:bid.vendor_id || bid.id, user_id:bid.vendor_id || bid.id, name:bid.vendor || bid.vendor_name, category:bid.category, rating:bid.rating, reviews:bid.reviews, verified:bid.verified || bid.faith_verified }, 'shortlisted', {
        source:'bid-review',
        attentionText:`${bid.vendor || bid.vendor_name || 'Vendor'} shortlisted from bid review`,
        notificationText:`${bid.vendor || bid.vendor_name || 'Vendor'} moved to shortlisted from bid review`,
      });
      showToast && showToast("Bid marked for review.");
      return data || true;
    } catch(err){
      logError('bids-shortlist', err, { bidId: bid.id, projectId: p.id });
      showToast && showToast("Could not move this bid into review. Nothing was changed.", "error");
      return false;
    }
  };

  const [decliningAll, setDecliningAll] = React.useState(false);
  const handleDeclineAll = async () => {
    const pending = safeBids.filter(b=>!b.hired&&b.status!=="hired"&&!b.declined&&b.status!=="declined");
    if (!pending.length) return;
    setDecliningAll(true);
    for (const b of pending) { try { await safeDecline(b.id); } catch(err){ logError('decline-all', err, { bidId: b.id }); } }
    setDecliningAll(false);
    setConfirmDeclineAll(false);
  };

  const sorted = [...safeBids].sort((a,b)=>{
    if(sortBy==="amount") return (Number(a.amount)||0)-(Number(b.amount)||0);
    if(sortBy==="rating") return (b.rating||0)-(a.rating||0);
    if(sortBy==="recent") return new Date(b.created_at||0)-new Date(a.created_at||0);
    return 0;
  });
  const stageFiltered = sorted.filter(b => {
    if (stageFilter === "all") return true;
    if (stageFilter === "shortlisted") return b.status === "under_review";
    if (stageFilter === "pending") return !b.hired && b.status !== "hired" && !b.declined && b.status !== "declined" && b.status !== "under_review";
    if (stageFilter === "declined") return b.declined || b.status === "declined";
    if (stageFilter === "hired") return b.hired || b.status === "hired";
    return true;
  });

  const pendingCount = safeBids.filter(b=>!b.hired&&b.status!=="hired"&&!b.declined&&b.status!=="declined").length;
  const shortlistedCount = safeBids.filter(b=>b.status==="under_review").length;
  const selected = stageFiltered.find(b=>b.id===selectedId) || (stageFiltered.length>0?stageFiltered[0]:null);

  const selectBid = (b) => {
    setSelectedId(b.id);
    setMobileOpen(true);
  };

  const CAT_COLORS = {
    "AV & Media Production":    "#185FA5",
    "Construction & Renovation":"#D97706",
    "Marketing & Consulting":   "#7C3AED",
    "Music & Worship":          "#059669",
    "Photography & Video":      "#DB2777",
    "Web & Technology":         "#0369A1",
    "Legal Services":           "#B45309",
    "Financial Services":       "#0F766E",
  };
  const railColor = CAT_COLORS[p.category] || "#2A3520";
  const liveBidPool = safeBids.filter(b=>!b.declined&&b.status!=="declined");

  const buildBidDecisionProfile = (bid) => {
    const amount = Number(bid?.amount || 0) || 0;
    const pool = liveBidPool.length ? liveBidPool : safeBids;
    const amounts = pool.map(item => Number(item?.amount || 0)).filter(Boolean);
    const minAmount = amounts.length ? Math.min(...amounts) : amount || 0;
    const maxAmount = amounts.length ? Math.max(...amounts) : amount || 0;
    const priceScore = maxAmount > minAmount
      ? Math.max(4, Math.round(10 - (((amount - minAmount) / (maxAmount - minAmount || 1)) * 6)))
      : (amount ? 8 : 6);
    const rating = Number(bid?.rating || 0) || 0;
    const reviews = Number(bid?.reviews || 0) || 0;
    const verified = !!(bid?.verified || bid?.faith_verified);
    const trustSnapshot = getVendorTrustSnapshot(bid);
    const milestonesCount = Array.isArray(bid?.milestones) ? bid.milestones.length : 0;
    const noteLength = String(bid?.note || bid?.cover_letter || '').trim().length;
    const shortlistBoost = bid?.status === 'under_review' ? 1 : 0;
    const trustScore = Math.min(10, Math.round((rating ? rating * 1.6 : 4) + Math.min(reviews, 18) / 6 + (verified ? 1 : 0)));
    const clarityScore = Math.min(10, (noteLength >= 180 ? 5 : noteLength >= 80 ? 4 : noteLength ? 3 : 1) + Math.min(milestonesCount, 4) + (bid?.timeline ? 1 : 0));
    const weighted = Math.round((priceScore * 0.34 + trustScore * 0.38 + clarityScore * 0.28) * 10 + shortlistBoost * 2);
    const reasons = [];
    if (amount && amount === minAmount) reasons.push('Best value in the field');
    if (verified) reasons.push('Faith / trust signals verified');
    if (rating >= 4.8) reasons.push('Top review profile');
    if (milestonesCount > 0) reasons.push('Milestone plan included');
    if (noteLength >= 120) reasons.push('Detailed cover letter');
    if (bid?.status === 'under_review') reasons.push('Already shortlisted');
    if (!reasons.length) reasons.push('Solid overall fit for this brief');
    const tone = weighted >= 86 ? 'clear' : weighted >= 76 ? 'strong' : weighted >= 66 ? 'viable' : 'open';
    return {
      percent: Math.max(52, Math.min(97, weighted)),
      priceScore,
      trustScore,
      clarityScore,
      reasons: reasons.slice(0, 3),
      tone,
      trustTierLabel: trustSnapshot.badgeLabel,
      trustTitle: trustSnapshot.title,
      trustBody: verified
        ? `${trustSnapshot.badgeLabel} plus this review profile make the hire decision feel safer when scope and price are close.`
        : 'This vendor can stay in the mix, but stronger trust proof would make the hire easier to justify to leadership.',
      trustChips: trustSnapshot.chips.slice(0, 3),
      trustBadgeStyle: trustSnapshot.badgeStyle,
      headline: tone === 'clear' ? 'Clear leader right now' : tone === 'strong' ? 'Strong option to move forward' : tone === 'viable' ? 'Viable option worth comparing' : 'Needs closer review',
      body: tone === 'clear'
        ? 'This bid leads the field on the combined signal of price, trust, and proposal clarity.'
        : tone === 'strong'
          ? 'This vendor is checking the most important decision boxes and is worth moving forward quickly.'
          : tone === 'viable'
            ? 'There is enough here to keep the vendor in the decision set, but review the full field before hiring.'
            : 'Keep this bid in the mix only if the cover letter, trust signals, or conversations improve.'
    };
  };

  const rankedBids = liveBidPool
    .map(bid => ({ bid, profile: buildBidDecisionProfile(bid) }))
    .sort((a,b) => (b.profile.percent || 0) - (a.profile.percent || 0) || ((Number(a.bid.amount)||0) - (Number(b.bid.amount)||0)));
  const decisionLeader = rankedBids[0] || null;
  const decisionRunnerUp = rankedBids[1] || null;
  const decisionSpread = decisionLeader && decisionRunnerUp ? Math.max(0, (decisionLeader.profile.percent || 0) - (decisionRunnerUp.profile.percent || 0)) : 0;
  const decisionConfidenceLabel = decisionLeader ? (decisionSpread >= 8 ? 'Clear leader' : decisionSpread >= 4 ? 'Close call' : 'Tight field') : 'Open field';
  const decisionConfidenceTone = decisionSpread >= 8 ? { bg:'var(--success-bg)', color:'var(--success)', border:'var(--success-border)' } : decisionSpread >= 4 ? { bg:'rgba(176,136,64,0.08)', color:'#b08840', border:'rgba(176,136,64,0.18)' } : { bg:'rgba(43,108,176,0.08)', color:'#2b6cb0', border:'rgba(43,108,176,0.14)' };
  const decisionSnapshot = [
    { label:'Recommended now', value: decisionLeader?.bid?.vendor || decisionLeader?.bid?.vendor_name || 'Open field' },
    { label:'Confidence', value: decisionLeader ? decisionConfidenceLabel : 'No bids yet' },
    { label:'Best value', value: lowest ? formatMoney(Number(lowest || 0)) : '—' },
    { label:'Top rated', value: highestRated ? `${highestRated.vendor || highestRated.vendor_name || 'Vendor'}${highestRated.rating ? ` · ${Number(highestRated.rating).toFixed(1)}★` : ''}` : '—' },
  ];

  const canMessageBidVendor = (bid) => Boolean(bid?.vendor_id);

  const openConversationWithBid = async (bid) => {
    if (!bid?.vendor_id) { showToast && showToast("Vendor messaging is unavailable for this bid."); return; }
    if (!p?.id || !p?.church_id) { showToast && showToast("Project or church context is missing for this thread.", "error"); return; }
    try {
      await openInboxThread(safeNav, {
        projectId: p.id,
        churchId: p.church_id,
        churchName: p?.church_name || p?.church || null,
        vendorId: bid.vendor_id,
        vendorName: bid?.vendor || bid?.vendor_name || null,
        createIfMissing: true,
      });
    } catch(err){ logError("open-conversation-bid", err, { projectId: p?.id, vendorId: bid?.vendor_id }); }
  };

  return (
    <>

      


    <div className="page kb755-bid-review-page">
      {/* Top bar — Project Detail style */}
      <div className="kb755-bid-review-topbar" style={{padding:'10px 16px',background:'#f4f0e7',borderBottom:'1px solid #e7dfd1',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0,flex:'1 1 auto'}}>
          <button type="button" onClick={onBack} style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:13,fontWeight:600,color:'#1C2814',padding:'7px 14px',borderRadius:999,border:'1px solid rgba(28,40,20,0.12)',background:'#fffdf8',cursor:'pointer',boxShadow:'0 1px 2px rgba(0,0,0,0.04)',flexShrink:0}}>← Project</button>
          <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12.5,color:'#a8aab4',minWidth:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
            <span>Projects</span>
            <span style={{color:'#c9c5be'}}>·</span>
            <span style={{color:'#1C2814',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis'}}>{p.title}</span>
            <span style={{color:'#c9c5be'}}>·</span>
            <span style={{color:'#1C2814',fontWeight:600}}>Bid review</span>
          </div>
        </div>
      </div>

      {/* Cream headline section */}
      <div className="kb755-bid-review-hero" style={{padding:'22px 24px 20px',background:'#fffdf8',borderBottom:'1px solid #efe7d9'}}>
        <div style={{maxWidth:1400,margin:'0 auto'}}>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:10,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:'#b08840',marginBottom:7}}>Bid review · {error ? 'Unable to load proposals' : `${bids.length} ${bids.length===1?'proposal':'proposals'}`}</div>
          <h1 style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:'clamp(26px,3.6vw,34px)',fontWeight:700,lineHeight:1.04,letterSpacing:'-0.025em',color:'#1C2814',margin:'0 0 6px',overflow:'hidden',textOverflow:'ellipsis'}}>{p.title}</h1>
          <div style={{fontSize:13,color:'#565862'}}>{p.church_name||p.church}{p.city?` · ${p.city}`:""}{p.budget?` · ${p.budget}`:''}</div>

          {/* Stat strip */}
          <div className="kb755-bid-review-stat-strip" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',border:'1px solid #dfd5c2',borderRadius:14,background:'#fff',overflow:'hidden',marginTop:16,boxShadow:'0 4px 14px rgba(28,40,20,0.04)'}}>
            {[
              {label:'Total bids', val:error?'—':bids.length},
              {label:'Best value', val:error?'—':(active.length>0?formatMoney(lowest):'—')},
              {label:'Avg bid',    val:error?'—':(bids.length>0?formatMoney(avgBid):'—')},
            ].map((s,i)=>(
              <div key={s.label} style={{padding:'14px 18px',borderRight:i<2?'1px solid #efe7d9':'none'}}>
                <div style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:22,fontWeight:700,color:'#1C2814',letterSpacing:'-0.02em',lineHeight:1}}>{s.val}</div>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:9.5,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',color:'#8a8579',marginTop:5}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="kb755-bid-review-spacer" style={{height:14}}/>

      {/* Hired banner */}
      {hired && (
        <div className="kb755-bid-review-hired" style={{background:"linear-gradient(135deg,#0f2010,#16320e)",borderRadius:"var(--r-md)",padding:"16px 20px",marginBottom:16,border:"1px solid rgba(34,197,94,0.15)",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:2}}>Hired: {hired.vendor||hired.vendor_name}</div>
            <div style={{fontSize:11,color:"var(--atext-2)"}}>A conversation was started automatically. Track milestones in the project view.</div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[1,2,3].map(i=><div key={i} style={{height:80,borderRadius:"var(--r-md)",background:"var(--cream-dark)",animation:"skeleton 1.5s ease infinite"}}/>)}
        </div>
      )}

      {!loading && error && (
        <div style={{background:"#fff",borderRadius:"var(--r-lg)",border:"1.5px solid var(--border)",padding:"48px 40px",textAlign:"center"}}>
          <div style={{fontFamily:"Playfair Display,serif",fontSize:20,fontWeight:700,color:"var(--navy)",marginBottom:8}}>We couldn't load the bids</div>
          <div style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.7,maxWidth:420,margin:"0 auto 18px"}}>The project may still have proposals. Nothing has been changed. Try loading the bid review again.</div>
          <button type="button" onClick={()=>{ if (typeof onRetry === 'function') onRetry(); }} className="btn-secondary" style={{padding:"10px 16px",fontSize:12}}>Try again</button>
        </div>
      )}

      {!loading && !error && bids.length===0 && (
        <div style={{background:"#fff",borderRadius:"var(--r-lg)",border:"1.5px solid var(--border)",padding:"56px 40px",textAlign:"center"}}>
          <div style={{width:48,height:48,borderRadius:"var(--r-md)",background:"var(--cream-dark)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div style={{fontFamily:"Playfair Display,serif",fontSize:20,fontWeight:700,color:"var(--navy)",marginBottom:8}}>Waiting for bids</div>
          <div style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.7,maxWidth:360,margin:"0 auto"}}>Most projects receive their first bid within a few hours. Make sure your description is clear and your budget is realistic.</div>
        </div>
      )}

      {!loading && !error && bids.length>0 && (
        <>
          {decisionLeader && !hired && (
            <div className="kb755-bid-review-recommendation" style={{background:'linear-gradient(135deg,#fffdf8,#f7f1e4)',borderRadius:'var(--r-lg)',border:'1.5px solid rgba(176,136,64,0.16)',padding:'18px 20px',marginBottom:14,boxShadow:'0 12px 36px rgba(20,21,24,0.05)'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
                <div style={{maxWidth:660}}>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:2,textTransform:'uppercase',color:'#8a6a2e',marginBottom:8,fontFamily:'DM Mono,monospace'}}>Recommended now</div>
                  <div style={{fontFamily:'Playfair Display,serif',fontSize:28,fontWeight:700,color:'#1C2814',letterSpacing:-0.5,lineHeight:1.05,marginBottom:6}}>{decisionLeader.bid.vendor || decisionLeader.bid.vendor_name || 'Vendor'}</div>
                  <div style={{fontSize:13,color:'var(--text-mid)',lineHeight:1.75,marginBottom:10,maxWidth:600}}>{decisionLeader.profile.body}</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
                    {decisionLeader.profile.reasons.map(reason => <span key={reason} style={{padding:'6px 10px',borderRadius:999,border:'1px solid rgba(20,21,24,0.08)',background:'#fff',fontSize:11,fontWeight:700,color:'var(--text-mid)'}}>{reason}</span>)}
                    <span style={{padding:'6px 10px',borderRadius:999,...decisionLeader.profile.trustBadgeStyle,fontSize:11,fontWeight:800}}>{decisionLeader.profile.trustTierLabel}</span>
                    <span style={{padding:'6px 10px',borderRadius:999,border:`1px solid ${decisionConfidenceTone.border}`,background:decisionConfidenceTone.bg,fontSize:11,fontWeight:800,color:decisionConfidenceTone.color}}>{decisionConfidenceLabel}</span>
                  </div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    <button type='button' onClick={()=>setSelectedId(decisionLeader.bid.id)} className='btn-secondary' style={{padding:'10px 14px',fontSize:12}}>Review recommendation</button>
                    <button type='button' onClick={()=>shortlistBid(decisionLeader.bid)} style={{padding:'10px 14px',borderRadius:10,border:'1px solid rgba(176,136,64,0.18)',background:'rgba(176,136,64,0.08)',fontSize:12,fontWeight:700,color:'#8a6a2e',cursor:'pointer'}}>Save</button>
                    <button type='button' onClick={()=>openConversationWithBid(decisionLeader.bid)} disabled={!decisionLeader?.bid?.vendor_id} style={{padding:'10px 14px',borderRadius:10,border:'1px solid rgba(43,108,176,0.14)',background:'rgba(43,108,176,0.08)',fontSize:12,fontWeight:700,color:'#2b6cb0',cursor:decisionLeader?.bid?.vendor_id?'pointer':'not-allowed',opacity:decisionLeader?.bid?.vendor_id?1:0.5}}>{decisionLeader?.bid?.vendor_id ? 'Message vendor' : 'Vendor unavailable'}</button>
                    <button type='button' onClick={()=>safeAccept(decisionLeader.bid.id)} className='btn-primary' style={{padding:'10px 14px',fontSize:12}}>Hire recommended</button>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10,minWidth:280,flex:'1 1 320px',maxWidth:360}}>
                  {decisionSnapshot.map(item => <div key={item.label} style={{padding:'12px 13px',borderRadius:14,background:'#fff',border:'1px solid rgba(20,21,24,0.06)'}}><div style={{fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'#7d7363',marginBottom:5,fontFamily:'DM Mono,monospace'}}>{item.label}</div><div style={{fontSize:13,fontWeight:700,color:'#1C2814',lineHeight:1.45}}>{item.value}</div></div>)}
                </div>
              </div>
            </div>
          )}
          <div className="kb755-bid-review-workspace-card" style={{background:"#fff",borderRadius:"var(--r-lg)",border:"1.5px solid var(--border)",padding:"18px 18px 16px",marginBottom:14,boxShadow:"0 8px 28px rgba(15,23,42,0.04)"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:14,flexWrap:"wrap",marginBottom:14}}>
              <div>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:6}}>Decision workspace</div>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:24,fontWeight:700,color:"var(--navy)",letterSpacing:-0.5,marginBottom:5}}>Review every bid in one place</div>
                <div style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.7,maxWidth:560}}>Review price, trust signals, cover letters, and bid status before you hire. Use the filters to quickly narrow the field.</div>
              </div>
              <div style={{display:"flex",gap:0,background:"var(--cream)",borderRadius:"var(--r-md)",border:"1px solid var(--border)",overflow:"hidden"}}>
                {[
                  {label:"Total", val:bids.length},
                  {label:"Open", val:pendingCount},
                  {label:"Under review", val:shortlistedCount},
                  {label:"Hired", val:hired?1:0},
                ].map((s,i)=>(
                  <div key={s.label} style={{padding:"10px 14px",borderRight:i<3?"1px solid var(--border)":"none",minWidth:86,textAlign:"center"}}>
                    <div style={{fontFamily:"Playfair Display,serif",fontSize:20,fontWeight:700,color:"var(--navy)",lineHeight:1}}>{s.val}</div>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:1.3,textTransform:"uppercase",color:"var(--text-muted)",marginTop:4}}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                {[
                  {key:"all",label:"All",count:bids.length},
                  {key:"pending",label:"Pending",count:bids.filter(b=>!b.hired&&b.status!=="hired"&&!b.declined&&b.status!=="declined"&&b.status!=="under_review").length},
                  {key:"shortlisted",label:"Under review",count:shortlistedCount},
                  {key:"hired",label:"Hired",count:bids.filter(b=>b.hired||b.status==="hired").length},
                  {key:"declined",label:"Declined",count:bids.filter(b=>b.declined||b.status==="declined").length},
                ].map(filter => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={()=>setStageFilter(filter.key)}
                    style={{padding:"7px 12px",borderRadius:999,border:stageFilter===filter.key?"1px solid var(--navy)":"1px solid var(--border)",background:stageFilter===filter.key?"var(--navy)":"#fff",color:stageFilter===filter.key?"#fff":"var(--text-mid)",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",letterSpacing:0.2,display:"inline-flex",alignItems:"center",gap:6,transition:"all 0.15s"}}
                  >
                    <span>{filter.label}</span>
                    <span style={{padding:"2px 6px",borderRadius:999,background:stageFilter===filter.key?"rgba(255,255,255,0.14)":"var(--cream)",color:"inherit",fontSize:10}}>{filter.count}</span>
                  </button>
                ))}
                {pendingCount > 1 && !hired && (
                  <button
                    type="button"
                    onClick={()=>setConfirmDeclineAll(true)}
                    disabled={decliningAll}
                    style={{padding:"7px 12px",background:"var(--danger-bg)",color:"var(--danger)",border:"1px solid var(--danger-border)",borderRadius:999,fontSize:11,fontWeight:700,cursor:decliningAll?"not-allowed":"pointer",fontFamily:"DM Sans,sans-serif",opacity:decliningAll?0.6:1,letterSpacing:0.2}}
                  >
                    {decliningAll ? "Declining…" : `Decline remaining (${pendingCount})`}
                  </button>
                )}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <div style={{display:"flex",gap:0,background:"#fff",borderRadius:"var(--r-sm)",border:"1.5px solid var(--border)",overflow:"hidden"}}>
                  {[{key:"amount",label:"Price"},{key:"rating",label:"Rating"},{key:"recent",label:"Recent"}].map((s,i)=>(
                    <button key={s.key} type="button" onClick={()=>setSortBy(s.key)}
                      style={{padding:"7px 12px",background:sortBy===s.key?"var(--navy)":"#fff",color:sortBy===s.key?"#fff":"var(--text-mid)",border:"none",borderRight:i<2?"1.5px solid var(--border)":"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif",transition:"all 0.15s"}}>
                      {s.label}
                    </button>
                  ))}
                </div>
                {safeBids.length >= 2 && (
                  <div style={{display:"flex",gap:0,background:"#fff",borderRadius:"var(--r-sm)",border:"1.5px solid var(--border)",overflow:"hidden"}}>
                    {[{key:"list",label:"List"},{key:"compare",label:"Side-by-side"}].map((m,i)=>(
                      <button key={m.key} type="button" onClick={()=>setViewMode(m.key)}
                        style={{padding:"7px 12px",background:viewMode===m.key?"#1C2814":"#fff",color:viewMode===m.key?"#fff":"#1C2814",border:"none",borderRight:i<1?"1.5px solid var(--border)":"none",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",transition:"all 0.15s",display:"inline-flex",alignItems:"center",gap:6}}>
                        {m.key==="compare" && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>}
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {viewMode === "compare" && stageFiltered.length >= 2 ? (
            /* Side-by-side comparison view */
            <div style={{background:'#fff',border:'1px solid #dfd5c2',borderRadius:18,boxShadow:'0 7px 20px rgba(28,40,20,0.06)',overflow:'hidden'}}>
              <div style={{padding:'14px 18px',background:'#fffdf8',borderBottom:'1px solid #efe7d9',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
                <div>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:10,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:'#b08840',marginBottom:3}}>Side-by-side</div>
                  <div style={{fontSize:13,color:'#565862'}}>Comparing {stageFiltered.length} {stageFiltered.length===1?'bid':'bids'} · sorted by {sortBy === 'amount' ? 'price' : sortBy === 'rating' ? 'rating' : 'most recent'}</div>
                </div>
                <button type="button" onClick={()=>setViewMode('list')} style={{height:32,padding:'0 12px',borderRadius:999,border:'1px solid rgba(28,40,20,0.12)',background:'#fff',fontSize:12,fontWeight:700,color:'#1C2814',cursor:'pointer'}}>Back to list</button>
              </div>
              <div style={{overflowX:'auto'}}>
                <div style={{display:'grid',gridTemplateColumns:`180px repeat(${stageFiltered.length}, minmax(220px, 1fr))`,minWidth: 180 + stageFiltered.length * 220}}>
                  {/* Header row — vendor names */}
                  <div style={{padding:'14px 16px',borderBottom:'1px solid #efe7d9',background:'#fbfaf6',position:'sticky',left:0,zIndex:2}}/>
                  {stageFiltered.map((b)=>{
                    const isLowest = Number(b.amount)===lowest && !b.declined && b.status!=="declined" && !b.hired && b.status!=="hired";
                    const isTopRated = highestRated && b.id===highestRated.id && !b.declined && b.status!=="declined" && !b.hired && b.status!=="hired";
                    const isHiredCard = b.hired||b.status==="hired";
                    const isDeclined = b.declined||b.status==="declined";
                    const initials = (b.vendor||b.vendor_name||"V").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
                    return (
                      <div key={b.id} style={{padding:'14px 16px',borderBottom:'1px solid #efe7d9',borderLeft:'1px solid #efe7d9',background:'#fff',opacity: isDeclined ? 0.55 : 1}}>
                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#5b7a5e,#3d5940)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0,letterSpacing:0.5}}>{initials}</div>
                          <div style={{minWidth:0,flex:1}}>
                            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:13,fontWeight:800,color:'#1C2814',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.vendor||b.vendor_name||'Vendor'}</div>
                            <div style={{fontSize:11,color:'#74756d'}}>{b.city || 'Location'}</div>
                          </div>
                        </div>
                        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                          {isLowest && <span style={{fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:999,background:'rgba(176,136,64,0.10)',color:'#8a6a2e',border:'1px solid rgba(176,136,64,0.22)',letterSpacing:0.04,textTransform:'uppercase'}}>Best value</span>}
                          {isTopRated && <span style={{fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:999,background:'rgba(47,133,90,0.08)',color:'#2F855A',border:'1px solid rgba(47,133,90,0.18)',letterSpacing:0.04,textTransform:'uppercase'}}>Top rated</span>}
                          {isHiredCard && <span style={{fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:999,background:'#1C2814',color:'#fff',letterSpacing:0.04,textTransform:'uppercase'}}>Hired</span>}
                          {isDeclined && <span style={{fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:999,background:'rgba(220,38,38,0.06)',color:'#b1342a',border:'1px solid rgba(220,38,38,0.18)',letterSpacing:0.04,textTransform:'uppercase'}}>Declined</span>}
                          {b.response_time && !isDeclined && !isHiredCard && (
                            <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:999,background:'rgba(28,40,20,0.05)',color:'#5d5548',border:'1px solid rgba(28,40,20,0.10)',letterSpacing:0.04,textTransform:'uppercase'}}>⚡ {b.response_time}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Amount row */}
                  <div style={{padding:'14px 16px',borderBottom:'1px solid #efe7d9',background:'#fbfaf6',fontFamily:'DM Mono,monospace',fontSize:10.5,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',color:'#8a8579',position:'sticky',left:0,zIndex:1}}>Bid amount</div>
                  {stageFiltered.map(b => (
                    <div key={`amt-${b.id}`} style={{padding:'14px 16px',borderBottom:'1px solid #efe7d9',borderLeft:'1px solid #efe7d9',background:'#fff'}}>
                      <div style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:22,fontWeight:700,color:'#1C2814',letterSpacing:'-0.02em',lineHeight:1}}>{b.amount ? formatMoney(Number(b.amount)) : '—'}</div>
                      {Number(b.amount) > 0 && avgBid > 0 && (
                        <div style={{fontSize:10.5,color: Number(b.amount) < avgBid ? '#2F855A' : '#74756d',marginTop:4,fontWeight:600}}>{Number(b.amount) < avgBid ? `${formatMoney(avgBid - Number(b.amount))} below avg` : Number(b.amount) > avgBid ? `${formatMoney(Number(b.amount) - avgBid)} above avg` : 'At average'}</div>
                      )}
                    </div>
                  ))}

                  {/* Timeline row */}
                  <div style={{padding:'14px 16px',borderBottom:'1px solid #efe7d9',background:'#fbfaf6',fontFamily:'DM Mono,monospace',fontSize:10.5,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',color:'#8a8579',position:'sticky',left:0,zIndex:1}}>Timeline</div>
                  {stageFiltered.map(b => (
                    <div key={`tl-${b.id}`} style={{padding:'14px 16px',borderBottom:'1px solid #efe7d9',borderLeft:'1px solid #efe7d9',background:'#fff',fontSize:13,color:'#1C2814',fontWeight:600}}>{b.timeline || b.delivery_window || '—'}</div>
                  ))}

                  {/* Rating row */}
                  <div style={{padding:'14px 16px',borderBottom:'1px solid #efe7d9',background:'#fbfaf6',fontFamily:'DM Mono,monospace',fontSize:10.5,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',color:'#8a8579',position:'sticky',left:0,zIndex:1}}>Rating</div>
                  {stageFiltered.map(b => (
                    <div key={`rt-${b.id}`} style={{padding:'14px 16px',borderBottom:'1px solid #efe7d9',borderLeft:'1px solid #efe7d9',background:'#fff'}}>
                      {Number(b.rating) > 0 ? (
                        <div style={{display:'flex',alignItems:'center',gap:5}}>
                          <span style={{color:'#c4973a',fontSize:13,letterSpacing:1}}>{'★'.repeat(Math.round(Number(b.rating)))}</span>
                          <span style={{fontSize:13,fontWeight:800,color:'#1C2814'}}>{Number(b.rating).toFixed(1)}</span>
                          {Number(b.reviews) > 0 && <span style={{fontSize:11,color:'#74756d'}}>({b.reviews})</span>}
                        </div>
                      ) : <span style={{fontSize:12,color:'#a8aab4'}}>No ratings yet</span>}
                    </div>
                  ))}

                  {/* Cover letter row */}
                  <div style={{padding:'14px 16px',borderBottom:'1px solid #efe7d9',background:'#fbfaf6',fontFamily:'DM Mono,monospace',fontSize:10.5,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',color:'#8a8579',position:'sticky',left:0,zIndex:1}}>Cover letter</div>
                  {stageFiltered.map(b => (
                    <div key={`cl-${b.id}`} style={{padding:'14px 16px',borderBottom:'1px solid #efe7d9',borderLeft:'1px solid #efe7d9',background:'#fff',fontSize:12.5,color:'#565862',lineHeight:1.5,maxHeight:140,overflowY:'auto'}}>
                      {b.cover_letter || b.note || b.message || <span style={{color:'#a8aab4',fontStyle:'italic'}}>No cover letter provided</span>}
                    </div>
                  ))}

                  {/* Action row */}
                  <div style={{padding:'14px 16px',background:'#fbfaf6',position:'sticky',left:0,zIndex:1}}/>
                  {stageFiltered.map(b => {
                    const isHiredCard = b.hired||b.status==="hired";
                    const isDeclined = b.declined||b.status==="declined";
                    const isDisabled = isHiredCard || isDeclined || hired;
                    return (
                      <div key={`act-${b.id}`} style={{padding:'14px 16px',borderLeft:'1px solid #efe7d9',background:'#fff',display:'flex',flexDirection:'column',gap:7}}>
                        <button type="button" onClick={()=>{ setSelectedId(b.id); setViewMode('list'); setMobileOpen(true); }} style={{height:32,padding:'0 12px',borderRadius:999,border:'1px solid #1C2814',background:'#fff',fontSize:11.5,fontWeight:800,color:'#1C2814',cursor:'pointer',width:'100%'}}>Open full bid</button>
                        {!isDisabled && (
                          <button type="button" onClick={(e)=>{ e.stopPropagation(); safeAccept(b.id); }} style={{height:32,padding:'0 12px',borderRadius:999,border:'none',background:'linear-gradient(180deg,#c9a45c,#b08840)',fontSize:11.5,fontWeight:800,color:'#fff',cursor:'pointer',width:'100%',boxShadow:'0 1px 3px rgba(176,136,64,0.35)'}}>Hire →</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
          /* Two column layout */
          <div className="bid-review-layout">

            {/* Left // bid list */}
            <div className="bid-review-list">
              {stageFiltered.length===0 ? (
                <div style={{background:"#fff",borderRadius:"var(--r-lg)",border:"1.5px dashed var(--border)"}}>
                  <KBEmptyState
                    icon="◇"
                    title="No bids in this view"
                    body="There are no bids that match the current filter. Switch filters to review the rest of the field."
                    actionLabel="Show all bids"
                    onAction={()=>setStageFilter("all")}
                  />
                </div>
              ) : stageFiltered.map(b=>{
                const isLowest = Number(b.amount)===lowest && !b.declined && b.status!=="declined" && !b.hired && b.status!=="hired";
                const isTopRated = highestRated && b.id===highestRated.id && !b.declined && b.status!=="declined" && !b.hired && b.status!=="hired";
                const isHiredCard = b.hired||b.status==="hired";
                const isDeclined = b.declined||b.status==="declined";
                const initials = (b.vendor||b.vendor_name||"V").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
                const isSelected = selected?.id===b.id;
                const decisionProfile = buildBidDecisionProfile(b);
                const bidFitLabel = decisionProfile.tone==='clear' ? 'Clear fit' : decisionProfile.tone==='strong' ? 'Strong fit' : decisionProfile.tone==='viable' ? 'Viable fit' : 'Needs review';
                return (
                  <div key={b.id}
                    className={`bid-list-card${isSelected?" selected":""}${isHiredCard?" hired-card":""}${isDeclined?" declined-card":""}`}
                    onClick={()=>selectBid(b)} role="button" tabIndex={0} onKeyDown={activateOnKey(()=>selectBid(b))}>
                    {/* Rail */}
                    <div className="bid-list-rail" style={{background:isHiredCard?"#16A34A":isDeclined?"rgba(0,0,0,0.1)":railColor}}/>
                    <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                      <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${railColor},${railColor}cc)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{initials}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}>
                          <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",letterSpacing:-0.2}}>{b.vendor||b.vendor_name||"Vendor"}</div>
                          {isLowest && <span style={{fontSize:"8px",fontWeight:700,padding:"1px 6px",borderRadius:3,background:"var(--success-bg)",color:"var(--success)",border:"1px solid var(--success-border)",letterSpacing:0.5,textTransform:"uppercase"}}>Best Value</span>}
                          {isTopRated && !isLowest && <span style={{fontSize:"8px",fontWeight:700,padding:"1px 6px",borderRadius:3,background:"#FFFBEB",color:"#D97706",border:"1px solid #FDE68A",letterSpacing:0.5,textTransform:"uppercase"}}>Top Rated</span>}
                          {isHiredCard && <span style={{fontSize:"8px",fontWeight:700,padding:"1px 6px",borderRadius:3,background:"var(--success-bg)",color:"var(--success)",border:"1px solid var(--success-border)",letterSpacing:0.5,textTransform:"uppercase"}}>Hired</span>}
                          {b.status==="under_review" && !isHiredCard && <span style={{fontSize:"8px",fontWeight:700,padding:"1px 6px",borderRadius:3,background:"#FFFBEB",color:"#D97706",border:"1px solid #FDE68A",letterSpacing:0.5,textTransform:"uppercase"}}>Under review</span>}
                        </div>
                        <div style={{fontSize:10,color:"var(--text-muted)",fontFamily:"DM Mono,monospace",marginBottom:6}}>{b.category||"//"}{b.rating?" · "+Number(b.rating).toFixed(1)+"★":""}</div>
                        {/* One-line cover letter preview */}
                        {(b.note||b.cover_letter) && (
                          <div style={{fontSize:11,color:"var(--text-muted)",fontStyle:"italic",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                            "{(b.note||b.cover_letter).slice(0,100)}{(b.note||b.cover_letter).length>100?"…":""}"
                          </div>
                        )}
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontFamily:"Playfair Display,serif",fontSize:17,fontWeight:700,color:"var(--navy)",letterSpacing:-0.5,lineHeight:1}}>{formatMoney(Number(b.amount||0))}</div>
                        <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",marginTop:5,padding:"3px 8px",borderRadius:999,background:decisionProfile.tone==='clear'?'rgba(22,163,74,0.1)':decisionProfile.tone==='strong'?'rgba(176,136,64,0.1)':'rgba(43,108,176,0.1)',color:decisionProfile.tone==='clear'?'#15803d':decisionProfile.tone==='strong'?'#8a6a2e':'#2b6cb0',fontSize:10,fontWeight:700,letterSpacing:0.4}}>{bidFitLabel}</div>
                        {b.timeline && <div style={{fontSize:9,color:"var(--text-muted)",marginTop:4,fontFamily:"DM Mono,monospace"}}>{b.timeline}</div>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
                      {decisionProfile.reasons.slice(0,2).map(reason => <span key={reason} style={{padding:"4px 8px",borderRadius:999,background:"#fff",border:"1px solid rgba(20,21,24,0.06)",fontSize:10,fontWeight:700,color:"var(--text-muted)"}}>{reason}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right // detail panel (desktop only) */}
            <div className="bid-detail-panel">
              {selected ? (
                <BidDetailContent b={selected} onHire={safeAccept} onDecline={(id)=>setConfirmDecline(id)} onMessage={openConversationWithBid} onShortlist={shortlistBid} projectHired={!!hired}/>
              ) : (
                <div className="bid-detail-empty">
                  <div style={{fontSize:32,marginBottom:12,opacity:0.3}}>←</div>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--navy)",marginBottom:6}}>Select a bid</div>
                  <div style={{fontSize:12,color:"var(--text-muted)"}}>Click any bid on the left to review it here.</div>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Mobile slide-up sheet */}
          {mobileOpen && selected && (
            <div className="bid-mobile-overlay" role="button" tabIndex={0} onClick={()=>setMobileOpen(false)}
              onKeyDown={(e)=>{if(e.key==='Escape'){e.preventDefault();setMobileOpen(false);}}}>
              <div className="bid-mobile-sheet" onClick={e=>e.stopPropagation()}>
                <BidDetailContent b={selected} onClose={()=>setMobileOpen(false)} onHire={safeAccept} onDecline={(id)=>setConfirmDecline(id)} onMessage={openConversationWithBid} onShortlist={shortlistBid} projectHired={!!hired}/>
              </div>
            </div>
          )}
        </>
      )}
    </div>
      {confirmDecline && <ConfirmModal
        title="Decline this bid?"
        body="The vendor will be notified. This cannot be undone."
        confirmLabel="Yes, Decline"
        danger
        onConfirm={async()=>{ await safeDecline(confirmDecline); setConfirmDecline(null); }}
        onCancel={()=>setConfirmDecline(null)}
      />}
      {confirmDeclineAll && <ConfirmModal
        title={`Decline all ${safeBids.filter(b=>!b.hired&&b.status!=="hired"&&!b.declined&&b.status!=="declined").length} remaining bids?`}
        body="All vendors will be notified. This cannot be undone."
        confirmLabel="Yes, Decline All"
        danger
        onConfirm={handleDeclineAll}
        onCancel={()=>setConfirmDeclineAll(false)}
      />}
    </>
  );
}

function MyBidsScreen({bids, loading, currentUser, showToast, onBack, onEditSuccess}){
  const [localBids, setLocalBids] = useState(bids);
  const [withdrawing, setWithdrawing] = useState(null);
  const [withdrawConfirm, setWithdrawConfirm] = useState(null);
  const [editingBid, setEditingBid] = useState(null); // { id, amount, note }
  const [editSaving, setEditSaving] = useState(false);

  useEffect(()=>{ setLocalBids(bids); },[bids]);

  const handleWithdraw = (bidId) => {
    setWithdrawConfirm(bidId);
  };
  const doWithdraw = async (bidId) => {
    setWithdrawConfirm(null);
    const targetBid = localBids.find(b => String(b.id) === String(bidId));
    if (!currentUser?.id || !targetBid || String(targetBid.vendor_id || "") !== String(currentUser.id)) {
      showToast && showToast("You can only withdraw your own proposal.", "error");
      return;
    }
    if (targetBid.status === "hired" || targetBid.hired) {
      showToast && showToast("A hired proposal cannot be withdrawn here.", "error");
      return;
    }
    setWithdrawing(bidId);
    try {
      const { error } = await supabase.rpc("marketplace_service_mutate_bid", {
        p_bid_id: bidId,
        p_action: "withdraw",
      });
      if (error) throw error;
      setLocalBids(prev => prev.map(b => b.id === bidId ? { ...b, status: "withdrawn", withdrawn_at: new Date().toISOString() } : b));
      showToast && showToast("Proposal withdrawn.");
    } catch (err) {
      logError("bid-withdraw", err, { bidId, userId: currentUser.id });
      const missingWithdrawnAt = isMissingColumnError(err, ["withdrawn_at"]);
      showToast && showToast(
        missingWithdrawnAt
          ? "Withdrawing proposals isn't available right now. We've been notified."
          : "Couldn't withdraw this proposal. Please try again.",
        "error"
      );
    } finally {
      setWithdrawing(null);
    }
  };

  const doEditBid = async () => {
    if (!editingBid || editSaving) return;
    const safeAmount = Number(String(editingBid.amount || '').replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(safeAmount) || safeAmount <= 0 || safeAmount > 10_000_000) {
      showToast && showToast("Please enter a valid amount (up to $10M).", "error");
      return;
    }
    setEditSaving(true);
    try {
      const { error } = await supabase
        .from("bids")
        .update({
          amount: safeAmount,
          cover_letter: String(editingBid.note || '').trim().slice(0, 1500),
        })
        .eq("id", editingBid.id)
        .eq("vendor_id", currentUser.id)
        .eq("status", "pending"); // only pending bids can be edited
      if (error) throw error;
      setLocalBids(prev => prev.map(b => b.id === editingBid.id
        ? { ...b, amount: safeAmount, cover_letter: String(editingBid.note || '').trim().slice(0, 1500) }
        : b
      ));
      showToast && showToast("Proposal updated.");
      if (typeof onEditSuccess === 'function') onEditSuccess();
      setEditingBid(null);
    } catch (err) {
      logError("bid-edit", err, { bidId: editingBid.id });
      showToast && showToast("Couldn't update this proposal — please try again.", "error");
    } finally {
      setEditSaving(false);
    }
  };

  const STATUS_COLORS = {
    pending:      {bg:"var(--warn-bg)",    color:"var(--warn)",    border:"var(--warn-border)",    label:"Pending"},
    under_review: {bg:"#EFF6FF",           color:"#2563EB",        border:"#BFDBFE",               label:"Under review"},
    hired:        {bg:"var(--success-bg)", color:"var(--success)", border:"var(--success-border)", label:"Hired"},
    declined:     {bg:"var(--danger-bg)",  color:"var(--danger)",  border:"var(--danger-border)",  label:"Declined"},
    withdrawn:    {bg:"var(--cream-dark)", color:"var(--text-muted)",border:"var(--border)",        label:"Withdrawn"},
  };
  const active  = localBids.filter(b => b.status === "pending" || b.status === "under_review");
  const won     = localBids.filter(b => b.status === "hired");
  const lost    = localBids.filter(b => b.status === "declined");

  return (
    <>
    <div className="page kb756-mybids-page">
      {/* Top bar — Project Detail style */}
      <div style={{padding:'10px 16px',background:'#f4f0e7',borderBottom:'1px solid #e7dfd1',display:'flex',alignItems:'center',gap:12}}>
        <button type="button" onClick={onBack} style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:13,fontWeight:600,color:'#1C2814',padding:'7px 14px',borderRadius:999,border:'1px solid rgba(28,40,20,0.12)',background:'#fffdf8',cursor:'pointer',boxShadow:'0 1px 2px rgba(0,0,0,0.04)',flexShrink:0}}>← Projects</button>
        <div style={{fontSize:12.5,color:'#a8aab4'}}>Your activity <span style={{color:'#c9c5be'}}>·</span> <span style={{color:'#1C2814',fontWeight:600}}>My bids</span></div>
      </div>

      {/* Cream headline section */}
      <div style={{padding:'22px 24px 18px',background:'#fffdf8',borderBottom:'1px solid #efe7d9'}}>
        <div style={{maxWidth:1400,margin:'0 auto'}}>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:10,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:'#b08840',marginBottom:7}}>Your activity</div>
          <h1 style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:'clamp(26px,3.6vw,34px)',fontWeight:700,lineHeight:1.04,letterSpacing:'-0.025em',color:'#1C2814',margin:'0 0 6px'}}>My bids</h1>
          <div style={{fontSize:13,color:'#565862'}}>Every proposal submitted and your win rate.</div>

          {/* Stat strip */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',border:'1px solid #dfd5c2',borderRadius:14,background:'#fff',overflow:'hidden',marginTop:16,boxShadow:'0 4px 14px rgba(28,40,20,0.04)'}}>
            {[
              {label:'Total',    val:localBids.length},
              {label:'Won',      val:won.length},
              {label:'Lost',     val:lost.length},
              {label:'Win rate', val:bids.length>0?Math.round(won.length/bids.length*100)+'%':'—'},
            ].map((s,i)=>(
              <div key={s.label} style={{padding:'14px 18px',borderRight:i<3?'1px solid #efe7d9':'none'}}>
                <div style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:22,fontWeight:700,color:'#1C2814',letterSpacing:'-0.02em',lineHeight:1}}>{s.val}</div>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:9.5,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',color:'#8a8579',marginTop:5}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{height:14}}/>



      {/* Earnings summary */}
      {won.length > 0 && (
        <div style={{background:"linear-gradient(135deg,var(--navy),var(--navy-light))",borderRadius:"var(--r-md)",padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--atext-2)",marginBottom:6}}>Revenue via FaithBid</div>
            <div style={{fontFamily:"Playfair Display,serif",fontSize:28,fontWeight:700,color:"#fff",lineHeight:1}}>
              {formatMoney(won.reduce((sum,b)=>sum+(Number(b.amount)||0),0))}
            </div>
            <div style={{fontSize:11,color:"var(--atext-2)",marginTop:4}}>Across {won.length} won project{won.length!==1?"s":""}</div>
            <div style={{fontSize:10,color:"var(--atext-muted)",marginTop:2,fontStyle:"italic"}}>Total of accepted bid amounts</div>
          </div>
          {/* Win streak */}
          {(()=>{
            const sorted = [...bids].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
            let streak = 0;
            for(const b of sorted){ if(b.status==="hired") streak++; else break; }
            return streak > 1 ? (
              <div style={{textAlign:"center",padding:"12px 20px",background:"rgba(245,240,232,0.08)",borderRadius:10,border:"1px solid rgba(245,240,232,0.15)"}}>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:32,fontWeight:700,color:"var(--gold-light)",lineHeight:1}}>{streak}</div>
                <div style={{fontSize:10,color:"var(--atext-2)",marginTop:4,fontWeight:600,letterSpacing:0.5}}>WIN STREAK</div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Founding Connector referral nudge */}
      <div style={{background:"linear-gradient(135deg,var(--navy),#1a2e12)",borderRadius:"var(--r-md)",border:"none",padding:"16px 20px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:"#fff",marginBottom:2}}>Help build FaithBid's founding community</div>
          <div style={{fontSize:11,color:"var(--atext-mid)"}}>Invite a church or Christian business. One qualified activation before public launch earns permanent Founding Connector recognition.</div>
        </div>
        <button type="button" style={{background:"var(--gold-light)",color:"var(--navy)",border:"none",borderRadius:"var(--r-sm)",padding:"7px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",whiteSpace:"nowrap"}} onClick={async(e)=>{
          const btn = e.currentTarget;
          try {
            const userId = currentUser?.id || (await getCurrentUserSafe())?.id;
            if(!userId) throw new Error("Referral user unavailable");
            const { data: profileRow, error: profileError } = await selectProfilesSafe("id,referral_code", "id", q => q.eq("id", userId).maybeSingle());
            if(profileError) throw profileError;
            const code = normalizeRefCode(profileRow?.referral_code) || profileRow?.referral_code;
            if(!code){
              showToast?.("Your referral link isn't available yet.", "error");
              return;
            }
            await navigator.clipboard.writeText(buildCanonicalReferralLink(code));
            const orig = btn.textContent;
            btn.textContent = "Copied!";
            setTimeout(()=>{ btn.textContent = orig; }, 2000);
          } catch(err) {
            try { logError("my-bids-referral-copy", err, { userId:currentUser?.id || null }); } catch {}
            showToast?.("Couldn't copy your referral link.", "error");
          }
        }}>Copy Referral Link</button>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:"40px",color:"var(--text-muted)"}}>Loading your bids...</div>
      ) : localBids.length === 0 ? (
        <div style={{background:"linear-gradient(135deg,var(--navy),var(--navy-light))",borderRadius:"var(--r-lg)",padding:"48px 40px",textAlign:"center",color:"#fff"}}>
          <div style={{width:52,height:2,background:"rgba(255,255,255,0.15)",borderRadius:2,margin:"0 auto 18px"}}></div>
          <div style={{fontFamily:"Playfair Display,serif",fontSize:24,fontWeight:700,marginBottom:10}}>Your first bid is the hardest one</div>
          <div style={{fontSize:14,color:"var(--atext-mid)",marginBottom:28,lineHeight:1.8,maxWidth:440,margin:"0 auto 28px"}}>
            Browse open projects, find one that fits your skills, and write a personal cover letter. Churches here are actively looking to hire Christian vendors // they're rooting for you.
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:32}}>
            <button type="button" className="btn-cta" onClick={onBack} style={{padding:"12px 24px",fontSize:13}}>Browse Open Projects</button>
          </div>
          <div style={{display:"flex",gap:0,background:"rgba(245,240,232,0.07)",borderRadius:"var(--r-md)",border:"1px solid rgba(255,255,255,0.08)",overflow:"hidden",maxWidth:480,margin:"0 auto"}}>
            {[["Complete your profile","Stand out instantly"],["Write a faith statement","Win more bids"],["Get Faith Verified","Top trust signal on the platform"]].map(([title,sub],i)=>(
              <div key={title} style={{flex:1,padding:"16px 12px",borderRight:i<2?"1px solid rgba(255,255,255,0.08)":"none",textAlign:"center"}}>
                <div style={{fontSize:12,fontWeight:700,color:"var(--gold-light)",marginBottom:4}}>{title}</div>
                <div style={{fontSize:11,color:"var(--atext-muted)",lineHeight:1.4}}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="vendor-profile-sidebar" style={{display:"flex",flexDirection:"column",gap:12}}>
          {localBids.map(b=>{
            const proj = b.projects || {};
            const sc = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
            return (
              <React.Fragment key={b.id}>
              <div style={{background:"#fff",borderRadius:"var(--r-md)",border:"1px solid rgba(42,53,32,0.09)",padding:"18px 20px",boxShadow:"0 1px 3px rgba(42,53,32,0.04)",display:"flex",gap:16,alignItems:"flex-start",flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontFamily:"Playfair Display,serif",fontSize:15,fontWeight:700,color:"var(--navy)",marginBottom:4}}>{proj.title || "Project"}</div>
                  <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:8}}>{proj.church_name || "//"} ·  {proj.city || "//"}</div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    <div style={{fontSize:12,color:"var(--text-mid)"}}>Your bid: <strong style={{color:"var(--navy)"}}>{formatMoney(Number(b.amount))}</strong></div>
                    <div style={{fontSize:12,color:"var(--text-mid)"}}> {b.timeline}</div>
                    <div style={{fontSize:12,color:"var(--text-muted)"}}>{new Date(b.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  <span style={{padding:"5px 12px",borderRadius:100,fontSize:11,fontWeight:600,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>{sc.label}</span>
                  {b.status==="pending" && (
                    <>
                      <button type="button" onClick={()=>setEditingBid({id:b.id, amount:String(b.amount||''), note:b.cover_letter||''})} style={{padding:"5px 11px",borderRadius:"var(--r-sm)",border:"1px solid var(--border)",background:"#fff",color:"var(--navy)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>
                        Edit
                      </button>
                      <button type="button" onClick={()=>handleWithdraw(b.id)} disabled={withdrawing===b.id} style={{padding:"5px 11px",borderRadius:"var(--r-sm)",border:"1px solid var(--border)",background:"#fff",color:"var(--text-muted)",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"DM Sans,sans-serif",opacity:withdrawing===b.id?0.5:1}}>
                        {withdrawing===b.id?"…":"Withdraw"}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {editingBid?.id === b.id && (
                <div style={{marginTop:14,padding:"16px 18px",borderRadius:12,background:"#f9f7f3",border:"1px solid #e5dcc8"}}>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.10em",textTransform:"uppercase",color:"#7d7363",marginBottom:12}}>Edit proposal</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                    <label style={{display:"grid",gap:5}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#5a5246",letterSpacing:"0.06em",textTransform:"uppercase"}}>Amount (USD)</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editingBid.amount}
                        onChange={e=>setEditingBid(prev=>({...prev,amount:e.target.value}))}
                        style={{height:40,padding:"0 12px",borderRadius:10,border:"1.5px solid #dfd5c2",background:"#fff",fontSize:14,fontFamily:"DM Sans,sans-serif",outline:"none"}}
                      />
                    </label>
                    <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
                      <button type="button" onClick={doEditBid} disabled={editSaving} aria-busy={editSaving} style={{height:40,padding:"0 16px",borderRadius:10,border:"none",background:editSaving?"#e5e7eb":"linear-gradient(180deg,#c9a45c,#b08840)",color:editSaving?"#9ca3af":"#fff",fontSize:12,fontWeight:700,cursor:editSaving?"not-allowed":"pointer",fontFamily:"DM Sans,sans-serif",display:"inline-flex",alignItems:"center",gap:6}}>
                        {editSaving ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{animation:"spin 0.7s linear infinite"}} aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Saving…</> : "Save changes"}
                      </button>
                      <button type="button" onClick={()=>setEditingBid(null)} style={{height:40,padding:"0 14px",borderRadius:10,border:"1px solid #dfd5c2",background:"#fff",color:"#5a5246",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Cancel</button>
                    </div>
                  </div>
                  <label style={{display:"grid",gap:5}}>
                    <span style={{fontSize:11,fontWeight:700,color:"#5a5246",letterSpacing:"0.06em",textTransform:"uppercase"}}>Cover note <span style={{fontWeight:400,color:"rgba(28,40,20,0.35)",textTransform:"none",letterSpacing:0}}>{(editingBid.note||'').length}/1500</span></span>
                    <textarea
                      value={editingBid.note||''}
                      onChange={e=>setEditingBid(prev=>({...prev,note:e.target.value.slice(0,1500)}))}
                      rows={3}
                      maxLength={1500}
                      style={{padding:"10px 12px",borderRadius:10,border:"1.5px solid #dfd5c2",background:"#fff",fontSize:13,fontFamily:"DM Sans,sans-serif",outline:"none",resize:"vertical",lineHeight:1.5}}
                    />
                  </label>
                </div>
              )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
    {withdrawConfirm && <ConfirmModal title="Withdraw this bid?" body="This cannot be undone. The church will no longer see your proposal." confirmLabel="Yes, Withdraw" danger={true} onConfirm={()=>doWithdraw(withdrawConfirm)} onCancel={()=>setWithdrawConfirm(null)}/>}
    </>
  );
}

function ProjectDetail({ project: rawProject, initialTab = 'overview', role, nav, onBack, onPost, onBid, biddingEnabled = false, biddingSettingLoaded = false, onNotifyBidding = null, bidNotifyPendingId = null, onManageBids, onProjectUpdate = null, onComplete, onCancel, showToast = () => {}, currentUser = null }) {
  const baseProject = normalizeProjectEntity(rawProject) || rawProject || {};
  const [projectOverride, setProjectOverride] = useState(null);
  const [projectPublishPending, setProjectPublishPending] = useState(false);
  const project = projectOverride ? { ...baseProject, ...projectOverride } : baseProject;
  const hasPostHireWorkflow = projectHasPostHireWorkflow(project);
  const [tab, setTab] = useState('overview');
  const [activeFilePreview, setActiveFilePreview] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [savedVendorCount, setSavedVendorCount] = useState(() => getCompareWorkspaceCount('vendors'));
  const [projectDetailVendorMatches, setProjectDetailVendorMatches] = useState([]);
  const [projectDetailVendorMatchesLoading, setProjectDetailVendorMatchesLoading] = useState(false);
  const [projectDetailVendorMatchesError, setProjectDetailVendorMatchesError] = useState(null);
  const projectDetailPanelRef = useRef(null);
  const projectDetailTabbarRef = useRef(null);
  const viewportWidth = useViewportWidth(1440);
  const { workspace: opsWorkspace } = useDealState(project, { status: project?.status || 'draft', archived: !!project?.archived }, role);
  const gallery = detailGallery(project);
  const [heroImage, setHeroImage] = useState(gallery[0]);
  const isTablet = viewportWidth < KB_BP_WORKSPACE;
  const isMobile = viewportWidth < 700;
  const isCompactMobile = viewportWidth < 390;

  useEffect(() => { injectMarketplaceDetailFonts(); }, []);
  useEffect(() => { setTab(initialTab || 'overview'); }, [project?.id, initialTab]);
  useEffect(() => {
    const title = project.title || 'Project';
    const church = project.church_name || project.church || '';
    const city = project.city ? ` · ${project.city}` : '';
    const desc = project.description
      ? String(project.description).slice(0, 155)
      : `${church ? `${church} is looking` : 'A church is looking'} for help with ${title}${city} on FaithBid.`;
    const restore = setPageMeta({
      title: church ? `${title} · ${church} — FaithBid` : `${title} — FaithBid`,
      description: desc,
    });
    return restore;
  }, [project.title, project.church_name, project.church, project.city, project.description]);
  useEffect(() => {
    if (role === 'vendor' && tab === 'vendors') {
      setTab('overview');
    } else if (tab === 'ops' && !hasPostHireWorkflow) {
      setTab('overview');
    }
  }, [role, tab, hasPostHireWorkflow]);
  useEffect(() => { setHeroImage(gallery[0]); }, [project?.id, gallery[0]]);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const syncSavedVendors = () => setSavedVendorCount(getCompareWorkspaceCount('vendors'));
    syncSavedVendors();
    window.addEventListener('storage', syncSavedVendors);
    window.addEventListener('kb:storage-sync', syncSavedVendors);
    return () => {
      window.removeEventListener('storage', syncSavedVendors);
      window.removeEventListener('kb:storage-sync', syncSavedVendors);
    };
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const budget = detailBudgetParts(project?.budget);
  const bidCount = Number(project?.bids || project?.bids_count || 0) || 0;
  const churchName = firstNonEmpty(project?.church, project?.church_name, 'Church');
  const city = firstNonEmpty(project?.city, 'Location shared after intake');
  const category = firstNonEmpty(detailCategory(project), 'Church project');
  const headline = firstNonEmpty(project?.title, 'Untitled Church Project');
  const desc = firstNonEmpty(project?.description, project?.desc, 'No project description has been added yet.');
  const timeline = firstNonEmpty(project?.timeline, 'Timeline shared after intake');
  const scope = firstNonEmpty(project?.scope, 'Not specified');
  const postedLabel = detailPostedLabel(project);
  const scopeItems = detailScopeItems(project);
  const vendorMatches = projectDetailVendorMatches;
  const opsSummary = {
    phase: PROJECT_PHASES.find(p => p.key === opsWorkspace?.phase)?.label || 'Kickoff',
    deliverables: Array.isArray(opsWorkspace?.deliverables) ? opsWorkspace.deliverables.length : 0,
    nextAction: String(opsWorkspace?.nextAction || '').trim(),
  };
  const opsState = loadProjectOpsState(project);
  const workflowSummary = getProjectWorkflowSummary(project, opsState, opsWorkspace);
  const projectDetailId = project?.id || project?.project_id || project?.slug || headline || null;
  const projectDetailTitle = headline || project?.title || project?.name || null;
  const projectRelation = useMemo(() => getProjectInteropEntry(project?.id || null), [project?.id]);
  const getVendorMatchLink = (vendorMatch) => {
    const vendorKeys = [vendorMatch?.user_id, vendorMatch?.id, vendorMatch?.vendor_id, vendorMatch?.name]
      .map(value => String(value || '').trim())
      .filter(Boolean);
    for (const vendorKey of vendorKeys) {
      const linkedVendor = projectRelation?.vendorsById?.[vendorKey];
      if (linkedVendor) return linkedVendor;
    }
    return null;
  };
  const applyVendorMatchStage = (vendorMatch, stage, extras = {}) => {
    if (!(projectDetailId || projectDetailTitle)) return;
    const seeded = buildVendorProfileSeed({ ...vendorMatch, category, city: vendorMatch?.city || city, verified:!!vendorMatch?.verified });
    const vendorUserId = String(seeded?.user_id || vendorMatch?.user_id || '').trim();
    if (!vendorUserId) {
      showToast && showToast('This vendor is missing a live account identity, so it cannot be saved yet.');
      return;
    }
    const stageMeta = PROJECT_VENDOR_STAGE_META?.[stage] || { label:'Watching' };
    upsertProjectVendorLink(projectDetailId, { ...seeded, id: vendorUserId, user_id: vendorUserId, vendor_id: vendorMatch?.vendor_id || vendorMatch?.id || seeded?.vendor_id || null }, stage, {
      source:'project-detail',
      attentionText: extras.attentionText || `${seeded.name} is now ${stageMeta.label.toLowerCase()} for this project`,
      notificationText: extras.notificationText || `${seeded.name} moved to ${stageMeta.label.toLowerCase()} from project detail`,
    });
  };
  const savedProjectReferences = [];
  const rawProjectFileCandidates = [
    ...safeArray(rawProject?.attachments),
    ...safeArray(rawProject?.files),
    ...safeArray(rawProject?.reference_files),
    ...safeArray(rawProject?.raw?.attachments),
    ...safeArray(rawProject?.raw?.files),
    ...safeArray(rawProject?.raw?.reference_files),
  ];
  const fileItems = rawProjectFileCandidates.map((file, idx) => {
    if (typeof file === 'string') {
      const cleanUrl = getValidMediaUrl(file);
      const name = String(file).split('/').pop() || `Project file ${idx + 1}`;
      return { name, meta:'Project file', kind:'File', blurb:'', url:cleanUrl };
    }
    const size = Number(file?.file_size || file?.size_bytes || file?.size || 0) || 0;
    return {
      name: firstNonEmpty(file?.name, file?.file_name, `Project file ${idx + 1}`),
      meta: firstNonEmpty(file?.meta, size ? formatFileSize(size) : '', 'Project file'),
      kind: firstNonEmpty(file?.kind, file?.type, file?.mime_type, 'File'),
      blurb: firstNonEmpty(file?.blurb, file?.description, ''),
      url: getValidMediaUrl(firstNonEmpty(file?.url, file?.file_url, file?.href, '')),
    };
  }).filter(file => file?.name);

  const isVendor = role === 'vendor';
  const focusProjectDetailTab = useCallback((requestedTab = 'overview') => {
    const requested = String(requestedTab || 'overview').trim() || 'overview';
    const allowedTabs = isVendor
      ? ['overview', 'scope', ...(hasPostHireWorkflow ? ['ops'] : []), 'files']
      : ['overview', 'scope', ...(hasPostHireWorkflow ? ['ops'] : []), 'vendors', 'files'];
    const nextTab = allowedTabs.includes(requested) ? requested : 'overview';
    setTab(nextTab);
    if (typeof window !== 'undefined') {
      const focusTabbar = () => {
        const tabbar = projectDetailTabbarRef.current;
        if (!tabbar) return;
        try {
          const top = tabbar.getBoundingClientRect().top + window.scrollY - 126;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        } catch {}
      };
      try {
        if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(focusTabbar);
        else window.setTimeout(focusTabbar, 0);
      } catch {}
    }
    return nextTab;
  }, [isVendor, hasPostHireWorkflow]);
  const [projectDetailVendorPairSignalMaps, setProjectDetailVendorPairSignalMaps] = useState(() => makeEmptyVendorPairSignalMaps());
  const [projectDetailChurchSignalMaps, setProjectDetailChurchSignalMaps] = useState(() => makeEmptyVendorPairSignalMaps());
  const projectDetailVendorId = isVendor && currentUser?.id && projectDetailId ? String(currentUser.id).trim() : '';
  const projectDetailVendorUserId = projectDetailVendorId;
  const projectDetailVendorMatchKey = JSON.stringify({
    id: projectDetailId || null,
    category: project?.category || project?.primary_category || '',
    categoryTags: safeArray(project?.category_tags),
    skills: safeArray(project?.skills),
    budget: project?.budget || '',
    budgetMin: project?.budget_min || null,
    budgetMax: project?.budget_max || null,
    city: project?.city || project?.project_city || '',
    state: project?.project_state || '',
    delivery: project?.delivery_preference || '',
  });

  useEffect(() => {
    setProjectDetailVendorMatches([]);
    setProjectDetailVendorMatchesError(null);
    setProjectDetailVendorMatchesLoading(false);
  }, [projectDetailVendorMatchKey]);

  useEffect(() => {
    let cancelled = false;
    if (isVendor || tab !== 'vendors') return () => { cancelled = true; };
    setProjectDetailVendorMatchesLoading(true);
    setProjectDetailVendorMatchesError(null);
    (async () => {
      const { data, error } = await selectVendorDirectorySafe({ limit:120, timeoutMs:7000 });
      if (cancelled) return;
      if (error) {
        setProjectDetailVendorMatches([]);
        setProjectDetailVendorMatchesError(error);
        setProjectDetailVendorMatchesLoading(false);
        return;
      }
      const { directory } = getMarketplaceVendorDataset(data || []);
      const rankedMatches = directory
        .filter(vendor => String(vendor?.id || '').trim() && String(vendor?.user_id || '').trim())
        .map(vendor => ({
          ...vendor,
          recommendedFit: computeRecommendedVendorFit(vendor, project, city || ''),
          avatar: vendor?.gradient,
          tag: vendor?.badge,
        }))
        .sort((a, b) =>
          (Number(b?.recommendedFit?.rankingScore || 0) - Number(a?.recommendedFit?.rankingScore || 0)) ||
          (Number(b?.recommendedFit?.rank || 0) - Number(a?.recommendedFit?.rank || 0)) ||
          (Number(!!b?.verified) - Number(!!a?.verified)) ||
          String(a?.name || '').localeCompare(String(b?.name || ''))
        )
        .slice(0, 3);
      setProjectDetailVendorMatches(rankedMatches);
      setProjectDetailVendorMatchesLoading(false);
    })().catch((err) => {
      if (cancelled) return;
      logError('project-detail-vendor-matches-fetch', err, { projectId: projectDetailId || null });
      setProjectDetailVendorMatches([]);
      setProjectDetailVendorMatchesError(err);
      setProjectDetailVendorMatchesLoading(false);
    });
    return () => { cancelled = true; };
  }, [isVendor, tab, projectDetailVendorMatchKey]);

  useEffect(() => {
    let cancelled = false;
    if (!isVendor || !projectDetailId || !currentUser?.id) {
      setProjectDetailVendorPairSignalMaps(makeEmptyVendorPairSignalMaps());
      return () => { cancelled = true; };
    }
    fetchVendorPairSignalMaps({ projectId: projectDetailId, churchId: null })
      .then((maps) => {
        if (cancelled) return;
        setProjectDetailVendorPairSignalMaps(maps || makeEmptyVendorPairSignalMaps());
      })
      .catch(() => {
        if (!cancelled) setProjectDetailVendorPairSignalMaps(makeEmptyVendorPairSignalMaps());
      });
    return () => { cancelled = true; };
  }, [projectDetailId, currentUser?.id]);

  useEffect(() => {
    let cancelled = false;
    if (isVendor || !projectDetailId || !currentUser?.id) {
      setProjectDetailChurchSignalMaps(makeEmptyVendorPairSignalMaps());
      return () => { cancelled = true; };
    }
    fetchVendorPairSignalMaps({ projectId: projectDetailId, churchId: currentUser.id })
      .then((maps) => {
        if (cancelled) return;
        setProjectDetailChurchSignalMaps(maps || makeEmptyVendorPairSignalMaps());
      })
      .catch(() => {
        if (!cancelled) setProjectDetailChurchSignalMaps(makeEmptyVendorPairSignalMaps());
      });
    return () => { cancelled = true; };
  }, [projectDetailId, currentUser?.id, isVendor]);

  const projectDetailVendorEngineBucket = useMemo(() => {
    if (!isVendor || !projectDetailVendorId || !projectDetailVendorUserId || !projectDetailId) return null;
    const now = new Date().toISOString();
    return buildVendorPairSignals({
      vendorId: projectDetailVendorId,
      vendorUserId: projectDetailVendorUserId,
      project,
      maps: projectDetailVendorPairSignalMaps,
      role: 'vendor',
      now,
    });
  }, [isVendor, projectDetailVendorId, projectDetailVendorUserId, projectDetailId, project, projectDetailVendorPairSignalMaps]);
  const projectDetailVendorDealState = projectDetailVendorEngineBucket ? deriveCanonicalDealState(projectDetailVendorEngineBucket) : null;
  const projectDetailVendorDealSummary = projectDetailVendorDealState ? getDealStateSummary(projectDetailVendorDealState, { role:'vendor', linkedBid: projectDetailVendorEngineBucket?.linkedBid || null }) : null;
  const projectDetailInvitedVendorTrackerRows = useMemo(() => {
    if (isVendor || !projectDetailId || !currentUser?.id) return [];
    const inviteRows = projectDetailChurchSignalMaps?.invitesByVendor instanceof Map ? Array.from(projectDetailChurchSignalMaps.invitesByVendor.values()) : [];
    const seen = new Set();
    const now = new Date().toISOString();
    return inviteRows.map(normalizeVendorPairInviteRow).filter(Boolean).map((invite) => {
      const vendorId = String(firstNonEmpty(invite?.vendor_id, invite?.vendorId, invite?.vendor_user_id, invite?.vendorUserId, '')).trim();
      const vendorUserId = String(firstNonEmpty(invite?.vendor_user_id, invite?.vendorUserId, invite?.vendor_id, invite?.vendorId, '')).trim();
      const rowKey = String(firstNonEmpty(invite?.id, `${vendorId}:${vendorUserId}`, '')).trim();
      if (!vendorId && !vendorUserId) return null;
      if (rowKey && seen.has(rowKey)) return null;
      if (rowKey) seen.add(rowKey);
      const linkRow = getVendorPairSignalMapEntry(projectDetailChurchSignalMaps?.linksByVendor, vendorUserId, vendorId);
      const bidRow = getVendorPairSignalMapEntry(projectDetailChurchSignalMaps?.bidsByVendor, vendorUserId, vendorId);
      const displayName = firstNonEmpty(linkRow?.vendor_name, linkRow?.name, bidRow?.vendor_name, `Vendor ${String(firstNonEmpty(vendorId, vendorUserId, '')).slice(0, 6)}`);
      const engineBucket = buildVendorPairSignals({
        vendorId,
        vendorUserId,
        project,
        maps: projectDetailChurchSignalMaps,
        role: 'church',
        now,
      });
      const engineDealState = deriveCanonicalDealState(engineBucket);
      const dealSummary = getDealStateSummary(engineDealState, { role:'church', linkedBid: engineBucket?.linkedBid || null });
      const invitedAt = firstNonEmpty(invite?.invited_at, invite?.invitedAt, invite?.created_at, invite?.createdAt, '');
      let invitedAtLabel = '';
      try { invitedAtLabel = invitedAt ? new Date(invitedAt).toLocaleDateString(undefined, { month:'short', day:'numeric' }) : ''; } catch { invitedAtLabel = ''; }
      return { vendorId, vendorUserId, displayName, engineDealState, dealSummary, invitedAtLabel };
    }).filter(Boolean);
  }, [isVendor, projectDetailId, currentUser?.id, project, projectDetailChurchSignalMaps]);
  const utilitySecondaryLabel = isVendor ? 'Message Church' : 'Share Project';
  const openDealRoomFromDetail = async () => {
    rememberReturnContext({ scope:'project-detail', projectId: projectDetailId || null, linkedProjectId: projectDetailId || null, tab:'ops' });
    const canCreateDealThread = Boolean(isVendor ? project?.church_id : project?.hired_vendor_id);
    if (!canCreateDealThread && !project?.conversation_id && !project?.conversationId) {
      showToast && showToast(isVendor ? 'This project needs a church contact before a thread can be opened.' : 'Hire or attach a vendor before opening a deal room.');
      if (isVendor) { try { focusProjectDetailTab('scope'); } catch {} }
      else handleVendorMatches();
      return;
    }
    await openInboxThread(nav, {
      projectId: projectDetailId || null,
      projectTitle: projectDetailTitle || headline,
      churchId: project?.church_id || null,
      churchName,
      vendorId: project?.hired_vendor_id || null,
      vendorName: project?.hired_vendor_name || null,
      viewerRole: isVendor ? 'vendor' : 'church',
      createIfMissing: canCreateDealThread,
    });
  };
  const handleReviewBids = () => {
    if (isVendor) { focusProjectDetailTab('vendors'); return; }
    if (typeof onManageBids === 'function') {
      try { return onManageBids(project); } catch (err) { logError('project-detail-review-bids', err, { projectId: project?.id || null }); }
    }
    try { focusProjectDetailTab('vendors'); } catch (err) {
      logError('project-detail-review-bids-fallback', err, { projectId: project?.id || null });
      setTab('vendors');
    }
  };
  const handleVendorMatches = () => {
    try { focusProjectDetailTab('vendors'); } catch (err) { logError('project-detail-focus-vendors', err, { projectId: project?.id || null }); try { setTab('vendors'); } catch {} }
  };
  const handlePrepWorkflow = () => {
    try { rememberReturnContext({ scope:'project-detail', projectId: projectDetailId || null, linkedProjectId: projectDetailId || null, tab:'ops' }); } catch (e) { if (kbIsDevRuntime()) console.warn('[kb] handlePrepWorkflow: remember return context failed', e); }
    try { focusProjectDetailTab('ops'); } catch (e) { if (kbIsDevRuntime()) console.warn('[kb] handlePrepWorkflow: focus ops tab failed', e); logError('project-detail-focus-ops', e, { projectId: project?.id || null }); try { setTab('ops'); } catch {} }
  };
  const openProjectEditor = () => {
    if (typeof onPost === 'function') {
      try { return onPost(project); } catch (err) { logError('project-detail-edit-project', err, { projectId: project?.id || null }); }
    }
    if (typeof nav === 'function') { try { nav('projects:post'); return; } catch (err) { logError('project-detail-nav-post', err, { projectId: project?.id || null }); } }
    try { focusProjectDetailTab('scope'); } catch {}
  };
  const openVendorProfileFromDetail = (vendorMatch) => {
    const seeded = buildVendorProfileSeed({ ...vendorMatch, category, city: vendorMatch?.city || city, verified:!!vendorMatch?.verified });
    const vendorUserId = String(seeded?.user_id || vendorMatch?.user_id || '').trim();
    if (!vendorUserId) {
      showToast && showToast('This vendor profile is missing a live account identity.');
      return;
    }
    queueVendorNavigation(nav, seeded, { returnContext:{ scope:'project-detail', projectId: projectDetailId || null, vendorId: vendorUserId, linkedProjectId: project?.id || null, tab:'vendors' } });
  };
  const saveVendorFromDetail = (vendorMatch) => {
    const seeded = buildVendorProfileSeed({ ...vendorMatch, category, city: vendorMatch?.city || city, verified:!!vendorMatch?.verified });
    const vendorUserId = String(seeded?.user_id || vendorMatch?.user_id || '').trim();
    if (!vendorUserId) {
      showToast && showToast('This vendor is missing a live account identity, so it cannot be saved yet.');
      return;
    }
    try {
      applyVendorMatchStage(vendorMatch, 'shortlisted');
      rememberReturnContext({ scope:'project-detail', projectId: projectDetailId || null, vendorId: vendorUserId, linkedProjectId: project?.id || null, tab:'vendors' });
      showToast && showToast(`${seeded.name || 'Vendor'} saved for review`);
      setTab('vendors');
    } catch (err) {
      logError('project-detail-save-vendor', err, { projectId: project?.id || null, vendorId: vendorUserId || null });
    }
  };
  const messageVendorFromDetail = async (vendorMatch) => {
    const seeded = buildVendorProfileSeed({ ...vendorMatch, category, city: vendorMatch?.city || city, verified:!!vendorMatch?.verified });
    const vendorContactId = String(seeded?.user_id || vendorMatch?.user_id || '').trim();
    if (!vendorContactId) {
      showToast && showToast('This vendor profile is missing a contact id, so a thread cannot be opened yet.');
      return;
    }
    rememberReturnContext({ scope:'project-detail', projectId: projectDetailId || null, vendorId: vendorContactId, linkedProjectId: project?.id || null, tab:'vendors' });
    await openInboxThread(nav, {
      projectId: projectDetailId || null,
      projectTitle: projectDetailTitle || headline,
      churchId: project?.church_id || null,
      churchName,
      vendorId: vendorContactId,
      vendorName: seeded.name,
      viewerRole: isVendor ? 'vendor' : 'church',
      createIfMissing: true,
    });
  };
  const openFilePreviewFromDetail = (file) => {
    if (!file) {
      showToast && showToast('No file is attached to preview yet.');
      return;
    }
    setActiveFilePreview(file);
  };
  const openSavedProjectItem = (item) => {
    if (!item) return;
    if (item.current) {
      setTab('overview');
      rememberReturnContext({ scope:'project-detail', projectId: projectDetailId || null, linkedProjectId: projectDetailId || null, tab:'overview' });
      return;
    }
    queueActivityNavigation(nav, { returnContext:{ scope:'project-detail', projectId: projectDetailId || null, linkedProjectId: projectDetailId || null, tab:'overview' } });
  };
  const handleUtilitySecondary = async () => {
    if (isVendor) {
      rememberReturnContext({ scope:'project-detail', projectId: projectDetailId || null, linkedProjectId: projectDetailId || null, tab });
      await openInboxThread(nav, {
        projectId: project?.id || null,
        projectTitle: headline,
        churchId: project?.church_id || null,
        churchName,
        viewerRole: 'vendor',
        createIfMissing: Boolean(project?.church_id),
      });
      return;
    }
    // Church: share or copy link to this project
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#projects`
      : '';
    const shareText = `${headline} · ${churchName}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: headline, text: shareText, url: shareUrl });
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return; // user cancelled native share sheet
    }
    if (typeof window !== 'undefined' && window.navigator?.clipboard?.writeText) {
      try {
        await window.navigator.clipboard.writeText(shareUrl || shareText);
        showToast && showToast('Link copied to clipboard');
        return;
      } catch {}
    }
    showToast && showToast('Copy the URL from your browser bar to share this project');
  };
  const posterStats = getProjectPosterStats(project);
  const detailStatusLabel = project?.status === 'open' ? 'Accepting proposals' : String(project?.status || 'Project').replace(/_/g,' ');
  const submitVendorProposalAction = () => { if (typeof onBid === 'function') return onBid(project); if (typeof nav === 'function') return nav('projects'); };
  const browseVendorProjectsAction = () => { if (typeof nav === 'function') return nav('projects'); };
  const projectDetailReadinessItems = [
    ['Brief clarity', scopeItems.length >= 3 ? 'Strong' : 'Needs detail'],
    ['Scope detail', scopeItems.length >= 3 ? 'Ready to quote' : 'Needs detail'],
    ['Communication cue', isVendor ? 'Ask before pricing' : 'Keep vendors aligned'],
    ['Next step', hasPostHireWorkflow ? 'Run delivery' : isVendor ? 'Submit proposal' : 'Use the action rail'],
  ];
  const projectDetailScopeCards = [
    { label:'What they need', value: scopeItems[0] || desc },
    { label:'Deliverables', value: scopeItems.slice(1, 3).join(' · ') || scope },
    { label:'Location', value: city },
    { label:'Ideal partner', value: isVendor ? 'Clear scope, credible timeline, ministry-aware communication.' : 'Faith-aligned vendor with relevant work, clean communication, and realistic pricing.' },
  ];
  const projectDetailNextSteps = isVendor ? [
    'Review files and scope before pricing.',
    'Submit a tight proposal with milestones.',
    'Keep the church warm with one useful follow-up.',
  ] : [
    bidCount > 0 ? 'Review proposals side-by-side.' : 'Invite matched vendors to bid.',
    'Clarify the scope before awarding work.',
    hasPostHireWorkflow ? 'Run delivery from the operations plan.' : 'Move the best vendor into a deal room.',
  ];
  const reviewProjectScopeAction = () => setTab('scope');
  const publishProjectFromDetail = async () => {
    if (projectPublishPending || role === 'vendor' || !project?.id) return null;
    setProjectPublishPending(true);
    try {
      const { data, error } = await supabase.rpc('marketplace_publish_project', { p_project_id: project.id });
      if (error) throw error;
      setProjectOverride(prev => ({ ...(prev || {}), ...(data && typeof data === 'object' ? data : {}), status:'open' }));
      try { if (rawProject && typeof rawProject === 'object') rawProject.status = 'open'; } catch {}
      try { if (typeof onProjectUpdate === 'function' && data) onProjectUpdate(data); } catch {}
      showToast('Project published. Vendors can now discover the brief.');
      return data;
    } catch (error) {
      logError('marketplace-project-publish', error, { projectId: project?.id || null });
      showToast(error?.message || 'This draft is not ready to publish yet.');
      return null;
    } finally {
      setProjectPublishPending(false);
    }
  };
  const transitionLifecycleFromDetail = async (action, note = null) => {
    if (!project?.id) throw new Error('Project is missing its live identity.');
    const updated = await transitionProjectLifecycleSafe(project.id, action, note);
    setProjectOverride(prev => ({ ...(prev || {}), ...(updated || {}) }));
    try { if (rawProject && typeof rawProject === 'object' && updated?.status) rawProject.status = updated.status; } catch {}
    try { if (typeof onProjectUpdate === 'function') onProjectUpdate(updated); } catch {}
    return updated;
  };

  const actionModel = (() => {
    if (!isVendor && project?.status === 'draft') {
      return {
        eyebrow:'Draft project',
        title:'Publish when the brief is complete.',
        body:'Publishing runs FaithBid server-side completeness checks before any vendor can discover this project.',
        primaryLabel:projectPublishPending ? 'Publishing...' : 'Publish project',
        primaryAction:publishProjectFromDetail,
        secondaryLabel:'Refine project brief',
        secondaryAction:openProjectEditor,
        tertiaryLabel:'',
        tertiaryAction:null,
      };
    }
    if (isVendor && !biddingEnabled) {
      return {
        eyebrow:biddingSettingLoaded ? 'Prelaunch access' : 'Checking launch access',
        title:'Bidding opens at launch.',
        body:'You can review every open brief now. FaithBid will keep proposal submission locked until the founder enables the server launch switch.',
        primaryLabel:bidNotifyPendingId === project?.id ? 'Saving...' : 'Notify me',
        primaryAction:() => typeof onNotifyBidding === 'function' ? onNotifyBidding(project) : null,
        secondaryLabel:'Review scope',
        secondaryAction:reviewProjectScopeAction,
        tertiaryLabel:'',
        tertiaryAction:null,
      };
    }
    if (hasPostHireWorkflow) {
      if (isVendor) {
        return {
          eyebrow:'Active project',
          title:'Keep the work moving in one place.',
          body:'Use Operations for the canonical start/completion lifecycle, then use the deal room for updates, files, approvals, and handoff.',
          primaryLabel:'Open operations plan',
          primaryAction: handlePrepWorkflow,
          secondaryLabel:'Open deal room',
          secondaryAction: openDealRoomFromDetail,
          tertiaryLabel:'Review scope',
          tertiaryAction: reviewProjectScopeAction,
        };
      }
      return {
        eyebrow:'Post-hire control center',
        title:'Run delivery, approvals, and closeout from one place.',
        body:'Open operations for the working plan, then use the deal room when you need to message, align, or document decisions.',
        primaryLabel:'Open operations plan',
        primaryAction: handlePrepWorkflow,
        secondaryLabel:'Open deal room',
        secondaryAction: openDealRoomFromDetail,
        tertiaryLabel:'Open vendor matches',
        tertiaryAction: handleVendorMatches,
      };
    }
    if (isVendor) {
      if (projectDetailVendorDealState === 'invited') {
        return {
          eyebrow:'Invite received',
          title:'The church asked you to take a look.',
          body:'You were invited to consider this project. Review the scope, then either send a proposal or ask one focused question before pricing.',
          primaryLabel:'Submit proposal',
          primaryAction: submitVendorProposalAction,
          secondaryLabel:'Ask a question',
          secondaryAction: handleUtilitySecondary,
          tertiaryLabel:'',
          tertiaryAction: null,
        };
      }
      if (projectDetailVendorDealState === 'no_response') {
        return {
          eyebrow:'Waiting on you',
          title:'You still have an open invite.',
          body:'The church is waiting on your response. If the project fits, send a proposal. If something is unclear, ask before you price it.',
          primaryLabel:'Submit proposal',
          primaryAction: submitVendorProposalAction,
          secondaryLabel:'Ask a question',
          secondaryAction: handleUtilitySecondary,
          tertiaryLabel:'',
          tertiaryAction: null,
        };
      }
      if (projectDetailVendorDealState === 'inquiry') {
        return {
          eyebrow:'In conversation',
          title:'Keep the conversation moving.',
          body:'You have an active thread with the church. Answer what is open, then submit a proposal when you have enough detail.',
          primaryLabel:'Submit proposal',
          primaryAction: submitVendorProposalAction,
          secondaryLabel:'Open thread',
          secondaryAction: handleUtilitySecondary,
          tertiaryLabel:'',
          tertiaryAction: null,
        };
      }
      if (projectDetailVendorDealState === 'bid_placed') {
        return {
          eyebrow:'Proposal sent',
          title:'Your proposal is with the church.',
          body:'The church has your proposal. Sit tight unless you have a useful update or a clear question.',
          primaryLabel:'',
          primaryAction: null,
          secondaryLabel:'Review scope',
          secondaryAction: reviewProjectScopeAction,
          tertiaryLabel:'',
          tertiaryAction: null,
        };
      }
      if (projectDetailVendorDealState === 'bid_under_review') {
        return {
          eyebrow:'Under review',
          title:'The church is reviewing your proposal.',
          body:'Stay available, but do not over-message. Use the thread for scope answers, timing updates, or next-step questions.',
          primaryLabel:'Open thread',
          primaryAction: handleUtilitySecondary,
          secondaryLabel:'Review scope',
          secondaryAction: reviewProjectScopeAction,
          tertiaryLabel:'',
          tertiaryAction: null,
        };
      }
      if (['hired','active','milestone_pending'].includes(projectDetailVendorDealState)) {
        return {
          eyebrow:'Active project',
          title:'Keep the work moving in one place.',
          body:'Use the deal room for updates, files, approvals, and handoff so the church always knows what changed and what is next.',
          primaryLabel:'Open deal room',
          primaryAction: openDealRoomFromDetail,
          secondaryLabel:'Review scope',
          secondaryAction: reviewProjectScopeAction,
          tertiaryLabel:'',
          tertiaryAction: null,
        };
      }
      if (projectDetailVendorDealState === 'declined') {
        return {
          eyebrow:'Not moving forward',
          title:'This one is not active anymore.',
          body:'This project is no longer a fit or has been declined. Keep your pipeline moving with other open church projects.',
          primaryLabel:'Browse other projects',
          primaryAction: browseVendorProjectsAction,
          secondaryLabel:'',
          secondaryAction: null,
          tertiaryLabel:'',
          tertiaryAction: null,
        };
      }
      return {
        eyebrow:'Open opportunity',
        title:'See if this is a fit.',
        body:'Review the brief, budget, and timing. If it fits, send a focused proposal with clear deliverables and assumptions.',
        primaryLabel:'Submit proposal',
        primaryAction: submitVendorProposalAction,
        secondaryLabel:'Review scope',
        secondaryAction: reviewProjectScopeAction,
        tertiaryLabel:'',
        tertiaryAction: null,
      };
    }
    if (bidCount > 0) {
      return {
        eyebrow:'Decision workspace',
        title:`${bidCount} proposal${bidCount === 1 ? '' : 's'} ready for review.`,
        body:'Start with bid review, compare vendor fit, and refine the brief only if something is missing before you make the hire.',
        primaryLabel:`Review bids${bidCount ? ` (${bidCount})` : ''}`,
        primaryAction: handleReviewBids,
        secondaryLabel:'Open vendor matches',
        secondaryAction: handleVendorMatches,
        tertiaryLabel:'Refine project brief',
        tertiaryAction: openProjectEditor,
      };
    }
    return {
      eyebrow:'Get responses moving',
      title:'Find matching vendors, then invite the right ones to bid.',
      body:'Before there are proposals to review, the most useful move is to surface strong vendors and make sure the brief is clear enough to attract quality bids.',
      primaryLabel:'Find matching vendors',
      primaryAction: handleVendorMatches,
      secondaryLabel:'Refine project brief',
      secondaryAction: openProjectEditor,
      tertiaryLabel:'',
      tertiaryAction: null,
    };
  })();

  const runDetailAction = (action, fallback = null, where = 'project-detail-action') => async (event) => {
    try { event?.preventDefault?.(); event?.stopPropagation?.(); } catch {}
    try {
      if (typeof action === 'function') return await action(project);
      if (typeof fallback === 'function') return await fallback(project);
    } catch (err) {
      logError(where, err, { projectId: project?.id || null, tab });
      if (typeof fallback === 'function' && fallback !== action) {
        try { return await fallback(project); } catch (fallbackErr) { logError(`${where}-fallback`, fallbackErr, { projectId: project?.id || null, tab }); }
      }
    }
    showToast && showToast('That action is not available yet for this project.');
    return null;
  };
  const projectDetailPrimaryFallback = isVendor
    ? (() => { if (typeof onBid === 'function') return onBid(project); if (typeof nav === 'function') return nav('projects'); })
    : (bidCount > 0 ? handleReviewBids : handleVendorMatches);
  const projectDetailSecondaryFallback = isVendor ? handleUtilitySecondary : handleVendorMatches;
  const projectDetailTertiaryFallback = isVendor ? reviewProjectScopeAction : handlePrepWorkflow;
  const runProjectDetailDirectAction = (kind) => (event) => {
    try { event?.preventDefault?.(); event?.stopPropagation?.(); } catch {}
    try {
      if (kind === 'bids') { handleReviewBids(); return; }
      if (kind === 'ops') { handlePrepWorkflow(); return; }
      if (kind === 'edit') { openProjectEditor(); return; }
      if (kind === 'deal') { openDealRoomFromDetail(); return; }
      handleVendorMatches();
    } catch (err) {
      logError(`project-detail-direct-${kind || 'vendors'}`, err, { projectId: project?.id || null, tab });
      try { focusProjectDetailTab(kind === 'ops' ? 'ops' : 'vendors'); } catch {}
    }
  };
  const projectDetailRoleParityRail = [
    { label:'Shared brief', value:'Project overview, budget, timeline, and category stay identical for every role.' },
    { label:'Shared workspace', value:hasPostHireWorkflow ? 'Scope, files, operations, and activity stay connected to one project record.' : 'Scope and files stay in one project record before any role-specific action.' },
    { label:isVendor ? 'Vendor next action' : 'Church next action', value:actionModel?.primaryLabel || actionModel?.secondaryLabel || 'Review project details' },
  ];
  const returnToMarketplaceFloor = () => {
    // This top-left Marketplace pill is an absolute route back to the browse floor.
    // It should never be hijacked by a stale Activity/Compare/Inbox return context.
    try { clearReturnContext(); } catch {}
    try { clearPendingProjectTarget(); } catch {}
    try { clearPendingVendorTarget(); } catch {}
    if (typeof nav === 'function') {
      try { nav('marketplace'); return; } catch (err) { logError('project-detail-return-marketplace', err, { projectId: project?.id || null }); }
    }
    if (typeof onBack === 'function') onBack();
  };

  const overviewBrief = useMemo(() => {
    const normalized = String(desc || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    if (normalized.length <= 220) return normalized;
    const stop = normalized.lastIndexOf('.', 220);
    return `${normalized.slice(0, stop > 120 ? stop + 1 : 220).trim()}${stop > 120 ? '' : '…'}`;
  }, [desc]);

  return (
    <div className="project-detail-shell" style={{backgroundImage:KB_WORKSPACE_CLAY_BACKGROUND, backgroundSize:'cover', backgroundPosition:'center top', backgroundRepeat:'no-repeat', backgroundAttachment:'fixed', backgroundColor:'#f6efe4', minHeight:'100vh', color:'#1C2814', fontFamily:"'General Sans','DM Sans',-apple-system,BlinkMacSystemFont,sans-serif"}}>
      <div style={{position:'sticky', top:58, left:0, right:0, zIndex:300, background:scrolled ? 'rgba(255,253,248,0.92)' : 'rgba(255,253,248,0.72)', backdropFilter:'blur(28px) saturate(1.6)', WebkitBackdropFilter:'blur(28px) saturate(1.6)', borderBottom:'1px solid rgba(28,40,20,0.08)', boxShadow:scrolled ? '0 14px 34px rgba(28,40,20,0.08)' : 'none', transition:'all 0.3s cubic-bezier(0.23,1,0.32,1)'}}>
        <div className="project-detail-topbar" style={{display:'flex',alignItems:'center',justifyContent:'space-between',minHeight:isMobile ? 62 : 54,maxWidth:1400,margin:'0 auto',padding:isMobile ? '8px 18px' : '0 48px',gap:16,flexWrap:isMobile ? 'wrap' : 'nowrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:14,minWidth:0,flex:isMobile ? '1 1 100%' : '0 1 auto'}}>
            <button type="button" onClick={returnToMarketplaceFloor} style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:13,fontWeight:600,color:'#1C2814',padding:'7px 14px',borderRadius:999,border:'1px solid rgba(28,40,20,0.12)',background:'#fffdf8',cursor:'pointer',textDecoration:'none',boxShadow:'0 1px 2px rgba(0,0,0,0.04)',flexShrink:0}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Marketplace
            </button>
            <div className="project-detail-breadcrumb" style={{display:isMobile ? 'none' : 'flex',alignItems:'center',gap:6,fontSize:13,color:'#a8aab4',minWidth:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
              <span style={{overflow:'hidden',textOverflow:'ellipsis'}}>Projects</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              <span style={{color:'#2e3038',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis'}}>{headline}</span>
            </div>
          </div>
          <div className="project-detail-top-actions" style={{display:'flex',alignItems:'center',gap:8,flexShrink:0,flexWrap:isMobile ? 'wrap' : 'nowrap',width:isMobile ? '100%' : 'auto',justifyContent:isMobile ? 'space-between' : 'flex-end'}}>
            {!isCompactMobile && !isVendor && <button type="button" onClick={handleUtilitySecondary} style={{fontSize:12,fontWeight:600,padding:'8px 14px',borderRadius:10,border:'none',background:'#fff',color:'#2e3038',boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.04)',cursor:'pointer'}}>{utilitySecondaryLabel}</button>}
            {!isVendor && <button type="button" onClick={()=>queueActivityNavigation(nav, { returnContext:{ scope:'project-detail', projectId: projectDetailId || null } })} style={{fontSize:12,fontWeight:600,padding:'8px 14px',borderRadius:10,border:'none',background:'#1C2814',color:'#fff',boxShadow:'0 1px 3px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',cursor:'pointer'}}>Project Activity</button>}
            {!isMobile && <div style={{width:30,height:30,borderRadius:999,background:'linear-gradient(145deg,#c5b394,#8d7756)',border:'2px solid #fff',boxShadow:'0 0 0 1px rgba(0,0,0,0.06)'}}/>}
          </div>
        </div>
      </div>

      <section className="project-detail-hero" style={{position:'relative',height:isMobile ? '44vh' : isTablet ? '42vh' : '44vh',minHeight:isMobile ? 320 : 360,maxHeight:isMobile ? 460 : 480,overflow:'hidden',marginTop:0,boxShadow:'inset 0 -1px 0 rgba(255,255,255,0.18)'}}>
        <div style={{position:'absolute',inset:0,backgroundImage: heroImage ? `url(${heroImage})` : 'none',backgroundSize:'cover',backgroundPosition:'center 40%',transform:'scale(1.01)',transition:'transform 8s linear'}} />
        <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,rgba(13,20,10,0.84) 0%,rgba(20,30,15,0.58) 44%,rgba(28,40,20,0.18) 100%), linear-gradient(180deg,rgba(28,40,20,0.08) 0%,rgba(28,40,20,0.18) 42%,rgba(28,40,20,0.92) 100%)'}} />
        <div style={{position:'absolute',inset:'auto 0 0 0',height:150,background:'linear-gradient(180deg,transparent,rgba(247,241,230,0.92))',pointerEvents:'none'}} />
        <div style={{position:'relative',zIndex:2,height:'100%',maxWidth:1400,margin:'0 auto',padding:isMobile ? '0 18px 34px' : '0 48px 46px',display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 14px',borderRadius:999,background:'rgba(255,255,255,0.14)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,0.15)',fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.9)',letterSpacing:'0.04em',marginBottom:18,width:'fit-content'}}>
            <span style={{width:6,height:6,borderRadius:999,background:'#4ade80',boxShadow:'0 0 6px rgba(74,222,128,0.4)'}} />
            {project?.status === 'open' ? 'Actively Hiring' : String(project?.status || 'Project').replace(/_/g,' ')}
          </div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'#c9a45c',marginBottom:12}}>{category}</div>
          <h1 className="project-detail-hero-title" style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:'clamp(30px,3.6vw,46px)',fontWeight:700,lineHeight:1.02,letterSpacing:'-0.04em',color:'#fff',maxWidth:860,margin:'0 0 14px',overflowWrap:'anywhere',textShadow:'0 18px 42px rgba(0,0,0,0.36)'}}>{headline}</h1>
          <div style={{display:'flex',alignItems:'center',gap:8,fontSize:14,color:'rgba(255,255,255,0.65)',marginBottom:6}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {city}
          </div>
          <div style={{fontSize:14,fontWeight:500,color:'rgba(255,255,255,0.55)',marginBottom:0}}>Posted by {churchName} · {postedLabel}</div>
          {/* Mobile inline gallery thumbs — replaces the absolute-positioned strip
              that was overlapping wrapped hero CTA buttons on phones. Sits in
              normal flow so it can never overlap the CTA. Hidden on very narrow
              phones (<390px) where the hero is already tall enough. */}
          {isMobile && !isCompactMobile && gallery.length > 1 ? (
            <div className="project-detail-hero-thumbs-mobile" style={{display:'flex',gap:6,marginTop:14,overflowX:'auto',paddingBottom:2,scrollbarWidth:'none',WebkitOverflowScrolling:'touch'}} aria-label="Project gallery">
              {gallery.slice(0,4).map((img, idx)=>(
                <button key={`m-thumb-${img}-${idx}`} type="button" aria-label={`View project image ${idx + 1}`} aria-pressed={heroImage===img} onClick={()=>setHeroImage(img)} style={{flex:'0 0 auto',width:44,height:44,borderRadius:8,overflow:'hidden',border:`1.5px solid ${heroImage===img?'rgba(255,255,255,0.82)':'rgba(255,255,255,0.32)'}`,cursor:'pointer',boxShadow:'0 2px 6px rgba(0,0,0,0.2)',padding:0,background:'transparent'}}>
                  <img src={img} alt="" loading="lazy" onError={handleKbImageError} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="project-detail-hero-actions" style={{position:'absolute',bottom:isMobile ? 20 : 28,right:isMobile ? 18 : 48,zIndex:3,display:isMobile ? 'none' : 'flex',gap:8}}>
          {gallery.slice(1,4).map((img, idx)=>(
            <button key={img+idx} type="button" aria-label={`View project image ${idx + 2}`} aria-pressed={heroImage===img} onClick={()=>setHeroImage(img)} style={{width:64,height:64,borderRadius:10,overflow:'hidden',border:`2px solid ${heroImage===img?'rgba(255,255,255,0.82)':'rgba(255,255,255,0.35)'}`,cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.2)',padding:0,background:'transparent'}}>
              <img src={img} alt="" loading="lazy" onError={handleKbImageError} style={{width:'100%',height:'100%',objectFit:'cover'}} />
            </button>
          ))}
          {gallery.length > 4 && <div style={{width:64,height:64,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.4)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.85)',border:'2px solid rgba(255,255,255,0.25)'}}>+{gallery.length - 4}</div>}
        </div>
      </section>

      <div className="project-detail-content" style={{maxWidth:1400,margin:'0 auto',padding:isMobile ? '0 18px' : '0 48px'}}>
        <div className="project-detail-main-grid" style={{display:'grid',gridTemplateColumns:isTablet ? '1fr' : 'minmax(0,1fr) 336px',gap:isTablet ? 24 : 28,alignItems:'start',padding:isMobile ? '22px 0 56px' : '30px 0 72px'}}>
          <div style={{order:isTablet ? 2 : 0}}>
            <div className="project-detail-stat-grid" style={{display:'grid',gridTemplateColumns:isCompactMobile ? '1fr' : isMobile ? '1fr 1fr' : 'repeat(5,1fr)',border:'1px solid #dfd5c2',borderRadius:20,background:'#fffdf8',overflow:'hidden',marginBottom:24,boxShadow:'0 7px 20px rgba(28,40,20,0.055)'}}>
              {[
                {value:budget.headline,label:'Budget'},
                {value:timeline,label:'Timeline'},
                {value:String(bidCount || 0),label:'Proposals'},
                {value:vendorMatches.length ? String(vendorMatches.length) : '—',label:'Vendor Matches'},
                {value:opsSummary.phase || detailStatusLabel,label:'Phase'},
              ].map((item, idx)=>(
                <div key={item.label} style={{padding:isMobile ? '16px 14px' : '18px 18px',position:'relative',background:'#fff',minWidth:0}}>
                  {idx>0 && !isCompactMobile && <div style={{position:'absolute',left:0,top:'16%',height:'68%',width:1,background:'rgba(0,0,0,0.06)'}} />}
                  <div style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:isMobile ? 21 : 23,fontWeight:700,color:'#1C2814',letterSpacing:'-0.02em',lineHeight:1,marginBottom:5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.value}</div>
                  <div style={{fontSize:10.5,fontWeight:700,color:'#a8aab4',letterSpacing:'0.06em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{item.label}</div>
                </div>
              ))}
            </div>

            <div ref={projectDetailTabbarRef} className="project-detail-tabbar" style={{display:'flex',gap:4,border:'1px solid #dfd5c2',borderRadius:999,background:'rgba(255,253,248,0.82)',padding:4,marginBottom:18,overflowX:'auto',boxShadow:'0 8px 22px rgba(28,40,20,0.045)'}}>
              {(isVendor ? [
                ['overview','Overview'],
                ['scope','Scope & Details'],
                ...(hasPostHireWorkflow ? [['ops','Operations']] : []),
                ['files','Files'],
              ] : [
                ['overview','Overview'],
                ['scope','Scope & Details'],
                ...(hasPostHireWorkflow ? [['ops','Operations']] : []),
                ['vendors','Vendor Matches'],
                ['files','Files'],
              ]).map(([key,label])=>(
                <button key={key} type="button" onClick={()=>setTab(key)} style={{fontSize:13,fontWeight:800,color:tab===key?'#1C2814':'#8a8579',padding:'11px 18px',border:'none',borderRadius:999,background:tab===key?'#fff':'transparent',cursor:'pointer',position:'relative',whiteSpace:'nowrap',boxShadow:tab===key?'0 8px 18px rgba(28,40,20,0.07)':'none'}}>
                  {label}
                  {tab===key && <span style={{position:'absolute',bottom:5,left:'50%',width:20,height:2,borderRadius:2,background:'linear-gradient(90deg,#C4973A,#A87B2A)',transform:'translateX(-50%)'}} />}
                </button>
              ))}
            </div>
            <div className="project-detail-role-parity-rail" style={{display:'grid',gridTemplateColumns:isMobile ? '1fr' : 'repeat(3,minmax(0,1fr))',gap:10,marginBottom:18}} aria-label="Project detail shared role architecture">
              {projectDetailRoleParityRail.map(item => (
                <div key={item.label} style={{padding:'13px 14px',borderRadius:16,background:'rgba(255,253,248,0.82)',border:'1px solid rgba(28,40,20,0.09)',boxShadow:'0 8px 20px rgba(28,40,20,0.04)'}}>
                  <div style={{fontSize:9.5,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:'#B08840',marginBottom:5}}>{item.label}</div>
                  <div style={{fontSize:12.5,lineHeight:1.5,fontWeight:700,color:'#4f5a49'}}>{item.value}</div>
                </div>
              ))}
            </div>
            {hasPostHireWorkflow && (
              <div className="project-detail-workflow-grid" style={{display:'grid',gridTemplateColumns:isMobile ? '1fr' : 'repeat(3,minmax(0,1fr))',gap:12,marginBottom:24}}>
                <div style={{padding:'16px 16px 14px',borderRadius:18,background:'#fff',border:'1px solid rgba(0,0,0,0.06)',boxShadow:'0 1px 2px rgba(0,0,0,0.04)'}}>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:'#a8aab4',marginBottom:6}}>Current milestone</div>
                  <div style={{fontSize:15,fontWeight:700,color:'#1C2814',marginBottom:4}}>{workflowSummary.currentMilestone?.title || 'No milestone documented'}</div>
                  <div style={{fontSize:12,color:'#858792',lineHeight:1.65}}>{workflowSummary.currentMilestone ? `Status: ${String(workflowSummary.currentMilestone.status || 'current').replace('_',' ')}` : 'No active milestone yet. Move into operations to lock the first step.'}</div>
                </div>
                <div style={{padding:'16px 16px 14px',borderRadius:18,background:'#fff',border:'1px solid rgba(0,0,0,0.06)',boxShadow:'0 1px 2px rgba(0,0,0,0.04)'}}>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:'#a8aab4',marginBottom:6}}>Approvals</div>
                  <div style={{fontSize:24,fontFamily:"'Newsreader', Georgia, serif",fontWeight:500,color:'#1C2814',letterSpacing:'-0.03em',lineHeight:1,marginBottom:6}}>{workflowSummary.pendingApprovals.length}</div>
                  <div style={{fontSize:12,color:'#858792',lineHeight:1.65}}>{workflowSummary.pendingApprovals.length ? 'Pending approvals need a response before work can move cleanly.' : 'No approval requests are documented right now.'}</div>
                </div>
                <div style={{padding:'16px 16px 14px',borderRadius:18,background:'#fff',border:'1px solid rgba(0,0,0,0.06)',boxShadow:'0 1px 2px rgba(0,0,0,0.04)'}}>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:'#a8aab4',marginBottom:6}}>Closeout</div>
                  <div style={{fontSize:15,fontWeight:700,color:'#1C2814',marginBottom:4}}>{workflowSummary.closeoutStatus === 'completed' || workflowSummary.closeoutStatus === 'ready' ? 'Ready to close' : workflowSummary.closeoutHasChecklist ? `${workflowSummary.closeoutOpen.length} items left` : 'Not started'}</div>
                  <div style={{fontSize:12,color:'#858792',lineHeight:1.65}}>{workflowSummary.closeoutStatus === 'completed' || workflowSummary.closeoutStatus === 'ready' ? 'Final paperwork, review, and archive are ready for handoff.' : workflowSummary.closeoutHasChecklist ? 'Use operations to finish the documented closeout items.' : 'No closeout checklist has been documented yet.'}</div>
                </div>
              </div>
            )}

            {tab === 'overview' && (
              <>
                <div style={{background:'#fff',border:'1px solid #dfd5c2',borderRadius:20,overflow:'hidden',boxShadow:'0 7px 20px rgba(28,40,20,0.055)',marginBottom:24}}>
                  <div style={{padding:isMobile ? '20px 18px 18px' : '28px 28px 24px'}}>
                    <div ref={projectDetailPanelRef} style={{display:'grid',gridTemplateColumns:isTablet ? '1fr' : 'minmax(0,1.25fr) minmax(280px,360px)',gap: isTablet ? 20 : 24,alignItems:'start'}}>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#a8aab4',marginBottom:10}}>Project Brief</div>
                        <p style={{fontSize:14,lineHeight:1.7,color:'#4a4d57',margin:'0 0 16px',fontWeight:400,overflowWrap:'anywhere'}}>{overviewBrief}</p>
                        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                          {[category, scope, city].filter(Boolean).slice(0,3).map(item => (
                            <span key={item} style={{padding:'6px 10px',borderRadius:999,border:'1px solid rgba(0,0,0,0.08)',background:'#fbfaf7',fontSize:11,fontWeight:700,color:'#565862'}}>{item}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{display:'grid',gap:12}}>
                        <div style={{padding:18,borderRadius:18,background:'linear-gradient(180deg,#fffdf8,#fbf5e8)',border:'1px solid #eadfce'}}>
                          <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:'#b08840',marginBottom:10}}>Decision readiness</div>
                          <div style={{display:'grid',gap:8}}>
                            {projectDetailReadinessItems.map(([label,val]) => (
                              <div key={label} style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:12}}>
                                <span style={{fontSize:12,color:'#7d7363'}}>{label}</span>
                                <span style={{fontSize:13,fontWeight:800,color:'#1C2814',textAlign:'right'}}>{val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {isVendor && (
                          <div style={{padding:18,borderRadius:18,background:'#fbfaf6',border:'1px solid #efe7d9'}}>
                            <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:'#b08840',marginBottom:8}}>{projectDetailVendorDealState && projectDetailVendorDealState !== 'not_contacted' && projectDetailVendorDealSummary ? 'Current status' : 'How to win this'}</div>
                            <div style={{fontSize:13,fontWeight:700,color:'#1C2814',marginBottom:6}}>{projectDetailVendorDealState && projectDetailVendorDealState !== 'not_contacted' && projectDetailVendorDealSummary ? projectDetailVendorDealSummary.statusLabel : 'Send a tight proposal early.'}</div>
                            <div style={{fontSize:13,lineHeight:1.62,color:'#858792'}}>{projectDetailVendorDealState && projectDetailVendorDealState !== 'not_contacted' && projectDetailVendorDealSummary ? projectDetailVendorDealSummary.body : "The church reads scope, timeline, and faith-aligned fit first. Lead with how you'll execute cleanly, not just price."}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{background:'#fff',border:'1px solid #dfd5c2',borderRadius:20,overflow:'hidden',boxShadow:'0 7px 20px rgba(28,40,20,0.055)',marginBottom:24}}>
                  <div style={{padding:isMobile ? '20px 18px 18px' : '28px 28px 24px'}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#a8aab4',marginBottom:10}}>Quick Details</div>
                    <div style={{display:'grid',gridTemplateColumns:isMobile ? '1fr' : '1fr 1fr',gap:14,marginTop:14}}>
                      {[
                        ['Timeline', timeline],
                        ['Budget Range', budget.range],
                        ['Category', category],
                        ['Project Scope', scope],
                      ].map(([label,val])=>(
                        <div key={label} style={{padding:18,borderRadius:14,background:'#fbfaf6',border:'1px solid #efe7d9'}}>
                          <div style={{fontSize:11,fontWeight:600,color:'#a8aab4',letterSpacing:'0.04em',textTransform:'uppercase',marginBottom:4}}>{label}</div>
                          <div style={{fontSize:16,fontWeight:700,color:'#1C2814',letterSpacing:'-0.01em'}}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === 'scope' && (
              <div style={{background:'#fff',border:'1px solid #dfd5c2',borderRadius:20,overflow:'hidden',boxShadow:'0 7px 20px rgba(28,40,20,0.055)',marginBottom:24}}>
                <div style={{padding:isMobile ? '20px 18px 18px' : '28px 28px 24px'}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#a8aab4',marginBottom:10}}>Scope of Work</div>
                  <div style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:isMobile ? 24 : 30,fontWeight:700,color:'#1C2814',letterSpacing:'-0.03em',lineHeight:1.05,marginBottom:10}}>What this project needs</div>
                  <div style={{fontSize:14,lineHeight:1.7,color:'#565862',maxWidth:760,marginBottom:18}}>A cleaner brief view for vendors and churches: scope, deliverables, timing, and fit are separated so the next action is easier to understand.</div>
                  <div style={{display:'grid',gridTemplateColumns:isMobile ? '1fr' : 'repeat(3,minmax(0,1fr))',gap:10,marginBottom:20}}>
                    {projectDetailNextSteps.map((item, idx) => (
                      <div key={item+idx} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'13px 14px',borderRadius:16,background:idx===0?'rgba(176,136,64,0.09)':'#fbfaf6',border:idx===0?'1px solid rgba(176,136,64,0.20)':'1px solid #efe7d9'}}>
                        <div style={{width:22,height:22,borderRadius:999,background:idx===0?'#1C2814':'#fff',border:'1px solid rgba(28,40,20,0.10)',color:idx===0?'#fffdf8':'#8a6729',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{idx + 1}</div>
                        <div style={{fontSize:12.5,lineHeight:1.5,color:'#4f4a40',fontWeight:700}}>{item}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:isMobile ? '1fr' : 'repeat(2,minmax(0,1fr))',gap:12,marginBottom:20}}>
                    {projectDetailScopeCards.map(item => (
                      <div key={item.label} style={{padding:16,borderRadius:16,background:'#fbfaf6',border:'1px solid #efe7d9'}}>
                        <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',color:'#b08840',marginBottom:7}}>{item.label}</div>
                        <div style={{fontSize:13.5,lineHeight:1.58,color:'#3f4038',fontWeight:500}}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:0,marginTop:20}}>
                    {scopeItems.map((item, idx)=>(
                      <div key={item+idx} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'14px 0',borderBottom:idx===scopeItems.length-1?'none':'1px solid rgba(0,0,0,0.06)'}}>
                        <div style={{width:20,height:20,borderRadius:999,flexShrink:0,marginTop:1,background:'rgba(47,133,90,0.07)',border:'1px solid rgba(47,133,90,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2f855a" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div style={{fontSize:14,color:'#565862',lineHeight:1.55}}>{item}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:isMobile ? '1fr' : '1fr 1fr',gap:14,marginTop:20}}>
                    {[
                      ['Status', detailStatusLabel],
                      ['Location', city],
                    ].map(([label,val])=>(
                      <div key={label} style={{padding:18,borderRadius:14,background:'#fbfaf6',border:'1px solid #efe7d9'}}>
                        <div style={{fontSize:11,fontWeight:600,color:'#a8aab4',letterSpacing:'0.04em',textTransform:'uppercase',marginBottom:4}}>{label}</div>
                        <div style={{fontSize:16,fontWeight:700,color:label==='Status' ? '#2f855a' : '#141518',letterSpacing:'-0.01em'}}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'ops' && (
              <div style={{display:'grid',gap:24,marginBottom:24}}><ProjectWorkspacePanel project={project} role={role} nav={nav} onComplete={onComplete} onLifecycleAction={transitionLifecycleFromDetail} /></div>
            )}

            {tab === 'vendors' && (
              <>
                {!isVendor && projectDetailInvitedVendorTrackerRows.length > 0 && (
                  <div style={{background:'#fff',border:'1px solid #dfd5c2',borderRadius:20,overflow:'hidden',boxShadow:'0 7px 20px rgba(28,40,20,0.055)',marginBottom:24}}>
                    <div style={{padding:isMobile ? '20px 18px 18px' : '24px 28px'}}>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#a8aab4',marginBottom:10}}>Invited Vendors</div>
                      <div style={{display:'grid',gap:10}}>
                        {projectDetailInvitedVendorTrackerRows.map((row) => (
                          <div key={row.vendorId || row.vendorUserId || row.displayName} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,padding:'13px 14px',borderRadius:14,background:'#fbfaf6',border:'1px solid #efe7d9'}}>
                            <div style={{minWidth:0}}>
                              <div style={{fontSize:13,fontWeight:800,color:'#1C2814',letterSpacing:'-0.01em',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{row.displayName}</div>
                              <div style={{fontSize:11,color:'#858792',marginTop:3}}>{row.invitedAtLabel ? `Invited ${row.invitedAtLabel}` : 'Invited'}</div>
                            </div>
                            <span style={{fontSize:10,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',padding:'5px 9px',borderRadius:999,background:'rgba(176,136,64,0.08)',color:'#8a6a2e',border:'1px solid rgba(176,136,64,0.16)',whiteSpace:'nowrap'}}>{row.dealSummary?.statusLabel || 'Invited'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              <div style={{background:'#fff',border:'1px solid #dfd5c2',borderRadius:20,overflow:'hidden',boxShadow:'0 7px 20px rgba(28,40,20,0.055)',marginBottom:24}}>
                <div style={{padding:isMobile ? '20px 18px 18px' : '28px 28px 24px'}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#a8aab4',marginBottom:10}}>Curated Vendor Matches</div>
                  <p style={{fontSize:14,lineHeight:1.75,color:'#565862',marginBottom:20}}>Real vendors ranked from the directory using this project's category, service area, budget, and available trust signals.</p>
                  <div style={{display:'grid',gridTemplateColumns:'1fr',gap:12}}>
                    {projectDetailVendorMatchesLoading && (
                      <div style={{padding:'18px 16px',borderRadius:14,background:'#fbfaf6',border:'1px solid #efe7d9',fontSize:13,color:'#6b6d75'}}>Finding real vendor matches…</div>
                    )}
                    {!projectDetailVendorMatchesLoading && projectDetailVendorMatchesError && (
                      <div style={{padding:'18px 16px',borderRadius:14,background:'#fbfaf6',border:'1px solid #efe7d9',fontSize:13,color:'#6b6d75'}}>Vendor matches could not be loaded right now. Try opening this tab again in a moment.</div>
                    )}
                    {!projectDetailVendorMatchesLoading && !projectDetailVendorMatchesError && vendorMatches.length === 0 && (
                      <div style={{padding:'18px 16px',borderRadius:14,background:'#fbfaf6',border:'1px solid #efe7d9',fontSize:13,color:'#6b6d75'}}>No live vendor accounts are available for this project yet.</div>
                    )}
                    {!projectDetailVendorMatchesLoading && !projectDetailVendorMatchesError && vendorMatches.map(v => {
                      const hasRealVendorIdentity = !!String(v?.user_id || '').trim();
                      const linkedVendor = getVendorMatchLink(v);
                      const linkedStage = linkedVendor?.stage || null;
                      const linkedStageMeta = linkedStage ? (PROJECT_VENDOR_STAGE_META?.[linkedStage] || null) : null;
                      const recommendedFit = v?.recommendedFit || computeRecommendedVendorFit(v, project, city || '');
                      const recommendedPresentation = getRecommendedFitPresentation(recommendedFit);
                      const matchExplanation = {
                        title: `${recommendedPresentation.scoreLabel} fit - ${recommendedPresentation.headline}`,
                        detail: safeArray(recommendedFit?.reasons).length
                          ? safeArray(recommendedFit.reasons).join(' · ')
                          : (recommendedFit?.watchout || 'Review this vendor profile before inviting them.'),
                      };
                      return (
                        <div key={v.user_id || v.id || v.name} role="button" tabIndex={0} onClick={()=>{ if (!hasRealVendorIdentity) return; openVendorProfileFromDetail(v); }} onKeyDown={activateOnKey(()=>{ if (!hasRealVendorIdentity) return; openVendorProfileFromDetail(v); })} className="project-detail-vendor-card" style={{display:'grid',gridTemplateColumns:isMobile ? '48px 1fr' : '48px 1fr auto',gap:14,alignItems:'center',padding:'16px 18px',border:'1px solid rgba(0,0,0,0.06)',borderRadius:18,background:'#fff',cursor:hasRealVendorIdentity?'pointer':'default',transition:'all 0.2s cubic-bezier(0.23,1,0.32,1)',textAlign:'left'}}>
                          <div style={{width:48,height:48,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:'#fff',background:v.avatar}}>{v.initials}</div>
                          <div>
                            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:2}}>
                              <div style={{fontSize:14,fontWeight:700,color:'#1C2814',letterSpacing:'-0.01em'}}>{v.name}</div>
                              {linkedStageMeta && <span style={{fontSize:9,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',padding:'3px 8px',borderRadius:999,background:linkedStageMeta.bg || 'rgba(176,136,64,0.08)',color:linkedStageMeta.color || '#b08840',border:'1px solid rgba(176,136,64,0.16)'}}>{linkedStageMeta.label}</span>}
                            </div>
                            <div style={{fontSize:12,color:'#858792',marginBottom:8}}>{v.role}</div>
                            <div style={{padding:'10px 11px',borderRadius:12,background:'rgba(176,136,64,0.06)',border:'1px solid rgba(176,136,64,0.14)',marginBottom:10}}>
                              <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'#8a6a2e',marginBottom:3}}>Why this vendor surfaced</div>
                              <div style={{fontSize:12,fontWeight:700,color:'#1C2814',lineHeight:1.4,marginBottom:3}}>{matchExplanation.title}</div>
                              <div style={{fontSize:11,color:'#6b6d75',lineHeight:1.55}}>{matchExplanation.detail}</div>
                              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
                                {safeArray(matchExplanation.chips).slice(0, 4).map(chip => <span key={chip} style={{fontSize:9,fontWeight:800,letterSpacing:'0.055em',textTransform:'uppercase',padding:'3px 7px',borderRadius:999,background:'#fff',border:'1px solid rgba(176,136,64,0.16)',color:'#8a6a2e'}}>{chip}</span>)}
                              </div>
                            </div>
                            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                              <button type="button" disabled={!hasRealVendorIdentity} onClick={(e)=>{ e.stopPropagation(); if (!hasRealVendorIdentity) return; openVendorProfileFromDetail(v); }} style={{height:32,padding:'0 12px',borderRadius:999,border:'1px solid rgba(0,0,0,0.08)',background:'#fff',fontSize:12,fontWeight:700,color:'#2e3038',cursor:hasRealVendorIdentity?'pointer':'not-allowed'}}>Open profile</button>
                              {!isVendor && <button type="button" disabled={!hasRealVendorIdentity} onClick={(e)=>{ e.stopPropagation(); if (!hasRealVendorIdentity) return; messageVendorFromDetail(v); }} style={{height:32,padding:'0 12px',borderRadius:999,border:'1px solid rgba(20,21,24,0.08)',background:'#fff',fontSize:12,fontWeight:700,color:'#1C2814',cursor:hasRealVendorIdentity?'pointer':'not-allowed'}}>Message</button>}
                              {!isVendor && <button type="button" disabled={!hasRealVendorIdentity} onClick={(e)=>{ e.stopPropagation(); if (!hasRealVendorIdentity) return; saveVendorFromDetail(v); }} style={{height:32,padding:'0 12px',borderRadius:999,border:'1px solid rgba(176,136,64,0.16)',background:'rgba(176,136,64,0.08)',fontSize:12,fontWeight:700,color:'#b08840',cursor:hasRealVendorIdentity?'pointer':'not-allowed'}}>{linkedStage === 'shortlisted' ? 'Saved' : 'Save vendor'}</button>}
                            </div>
                          </div>
                          <div style={{display:'flex',flexDirection:'column',alignItems:isMobile?'flex-start':'flex-end',gap:4,gridColumn:isMobile?'1 / -1':'auto',paddingLeft:isMobile?62:0}}>
                            <span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,fontWeight:600,color:'#b08840'}}>
                              {Number(v.rating || 0) > 0 ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg>{Number(v.rating).toFixed(1)}</> : 'Not rated'}
                            </span>
                            <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',padding:'3px 8px',borderRadius:999,background:'rgba(176,136,64,0.08)',color:'#b08840',border:'1px solid rgba(176,136,64,0.16)'}}>{v.tag}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              </>
            )}

            {tab === 'files' && (
              <div style={{background:'#fff',border:'1px solid #dfd5c2',borderRadius:20,overflow:'hidden',boxShadow:'0 7px 20px rgba(28,40,20,0.055)',marginBottom:24}}>
                <div style={{padding:isMobile ? '20px 18px 18px' : '28px 28px 24px'}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#a8aab4',marginBottom:10}}>Project Files</div>
                  <div style={{display:'grid',gap:12}}>
                    {fileItems.length === 0 && (
                      <div style={{padding:'18px 16px',borderRadius:14,background:'#fbfaf6',border:'1px solid #efe7d9',fontSize:13,color:'#6b6d75'}}>No project files have been attached yet.</div>
                    )}
                    {fileItems.map(file => (
                      <div key={`${file.name}-${file.url || file.meta}`} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'16px 18px',border:'1px solid rgba(0,0,0,0.06)',borderRadius:18,background:'#fdfcfa'}}>
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          <div style={{width:40,height:40,borderRadius:10,background:'#1e2028',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:10,fontWeight:800,letterSpacing:'0.04em'}}>{String(file.kind || 'File').slice(0,3).toUpperCase()}</div>
                          <div>
                            <div style={{fontSize:14,fontWeight:700,color:'#1C2814'}}>{file.name}</div>
                            <div style={{fontSize:12,color:'#858792'}}>{file.meta}</div>
                          </div>
                        </div>
                        <button type="button" onClick={()=>openFilePreviewFromDetail(file)} style={{height:40,padding:'0 14px',borderRadius:10,border:'1px solid rgba(0,0,0,0.1)',background:'#fff',fontSize:12,fontWeight:700,color:'#2e3038',cursor:'pointer'}}>Preview</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="project-detail-sidebar" style={{position:isTablet ? 'static' : 'sticky',top:82,alignSelf:'start',order:isTablet ? 1 : 0}}>
            <div style={{background:'linear-gradient(160deg,#fffdf8 0%,#f7f0e2 100%)',border:'1px solid #dfd5c2',borderRadius:26,overflow:'hidden',marginBottom:18,position:'relative',boxShadow:'0 14px 40px rgba(28,40,20,0.10)'}}>
              <div style={{position:'absolute',top:-70,right:-52,width:230,height:230,borderRadius:999,background:'radial-gradient(circle,rgba(176,136,64,0.10),transparent 62%)',pointerEvents:'none'}} />
              <div style={{position:'absolute',bottom:-80,left:-70,width:220,height:220,borderRadius:999,background:'radial-gradient(circle,rgba(28,40,20,0.04),transparent 64%)',pointerEvents:'none'}} />
              <div style={{position:'relative',padding:'26px 24px 24px'}}>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:'#b08840',marginBottom:10}}>{actionModel.eyebrow || 'Action panel'}</div>
                <div style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:28,fontWeight:800,color:'#1C2814',letterSpacing:'-0.04em',marginBottom:8,lineHeight:1.05}}>{actionModel.title}</div>
                <div style={{fontSize:13,color:'#565862',lineHeight:1.62,marginBottom:20}}>{actionModel.body}</div>
                {!!actionModel.primaryLabel && <button type="button" onClick={runDetailAction(actionModel.primaryAction, projectDetailPrimaryFallback, 'project-detail-primary-action')} style={{width:'100%',height:48,borderRadius:14,border:'none',fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:'linear-gradient(135deg,#C4973A,#A87B2A)',color:'#fff',boxShadow:'0 2px 8px rgba(176,136,64,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',marginBottom:10}}>{actionModel.primaryLabel}</button>}
                {!!actionModel.secondaryLabel && (
                  <button type="button" onClick={runDetailAction(actionModel.secondaryAction, projectDetailSecondaryFallback, 'project-detail-secondary-action')} style={{width:'100%',height:46,borderRadius:14,border:'1px solid #dfd5c2',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:'#fff',color:'#1C2814',marginBottom:10}}>{actionModel.secondaryLabel}</button>
                )}
                {!!actionModel.tertiaryLabel && (
                  <button type="button" onClick={runDetailAction(actionModel.tertiaryAction, projectDetailTertiaryFallback, 'project-detail-tertiary-action')} style={{width:'100%',height:40,borderRadius:12,border:'1px solid rgba(28,40,20,0.09)',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',marginTop:actionModel.secondaryLabel ? 0 : 10,background:'transparent',color:'#565862'}}>{actionModel.tertiaryLabel}</button>
                )}
                {!isVendor && project?.status === 'in_progress' && !!project?.completion_requested_at && typeof onComplete === 'function' && project?.id && (
                  <button type="button" onClick={()=>onComplete(projectDetailId)} style={{width:'100%',height:42,borderRadius:12,border:'1px solid rgba(47,133,90,0.22)',fontSize:12,fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',marginTop:10,background:'rgba(47,133,90,0.05)',color:'#2f855a'}}>Review & confirm completion</button>
                )}
                {!isVendor && typeof onCancel === 'function' && project?.id && project?.status === 'open' && (
                  <button
                    type="button"
                    onClick={() => onCancel(projectDetailId)}
                    style={{width:'100%',height:38,borderRadius:12,border:'1px solid rgba(28,40,20,0.07)',fontSize:11.5,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',marginTop:12,background:'transparent',color:'rgba(28,40,20,0.35)',letterSpacing:'0.02em'}}
                  >
                    Close project
                  </button>
                )}
              </div>
            </div>

            <div style={{background:'#fff',border:'1px solid rgba(0,0,0,0.06)',borderRadius:22,padding:22,marginBottom:18,boxShadow:'0 1px 2px rgba(0,0,0,0.04)'}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#a8aab4',marginBottom:14}}>Posted By</div>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                <div style={{width:44,height:44,borderRadius:10,background:'linear-gradient(145deg,#f4efe4,#d9c69d)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C2814" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:'#1C2814',letterSpacing:'-0.01em'}}>{churchName}</div>
                  <div style={{fontSize:12,color:'#858792',marginTop:2}}>{city}</div>
                </div>
              </div>
              {posterStats.length > 0 && (
                <div style={{display:'grid',gridTemplateColumns:isMobile ? '1fr' : '1fr 1fr',gap:10}}>
                  {posterStats.map(([val,label])=>(
                    <div key={label} style={{padding:12,borderRadius:10,background:'#fbfaf6',border:'1px solid #efe7d9',textAlign:'center'}}>
                      <div style={{fontFamily:"'Newsreader','Playfair Display',Georgia,serif",fontSize:18,fontWeight:500,color:'#1C2814',lineHeight:1}}>{val}</div>
                      <div style={{fontSize:10,fontWeight:600,color:'#a8aab4',letterSpacing:'0.04em',textTransform:'uppercase',marginTop:3}}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isVendor && savedProjectReferences.length > 0 && (
              <div style={{background:'#fff',border:'1px solid #dfd5c2',borderRadius:20,overflow:'hidden',boxShadow:'0 7px 20px rgba(28,40,20,0.055)'}}>
                <div style={{padding:'18px 22px',borderBottom:'1px solid rgba(0,0,0,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{fontSize:13,fontWeight:700,color:'#1C2814',letterSpacing:'-0.01em'}}>Saved Projects</div>
                  <span style={{fontFamily:"'JetBrains Mono','DM Mono',monospace",fontSize:10,fontWeight:600,color:'#a8aab4',padding:'3px 8px',borderRadius:999,background:'rgba(20,21,24,0.04)'}}>{savedProjectReferences.length}</span>
                </div>
                <div style={{padding:'10px 14px'}}>
                  {savedProjectReferences.map(item => (
                    <button type="button" key={item.title} onClick={()=>openSavedProjectItem(item)} className="project-detail-saved-row" style={{display:'grid',gridTemplateColumns:'40px minmax(0,1fr) auto',gap:10,alignItems:'center',padding:'10px 8px',borderRadius:10,background:item.current?'rgba(176,136,64,0.08)':'transparent',border:'none',width:'100%',textAlign:'left',cursor:'pointer'}}>
                      <div style={{width:40,height:40,borderRadius:6,overflow:'hidden',border:'1px solid rgba(0,0,0,0.06)'}}><img src={item.image} alt="" loading="lazy" onError={handleKbImageError} style={{width:'100%',height:'100%',objectFit:'cover'}} /></div>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:'#1C2814',lineHeight:1.3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.title}</div>
                        <div style={{fontSize:11,color:'#a8aab4',marginTop:2}}>{item.city} · {item.budget}</div>
                        {!!item.summary && <div style={{fontSize:11,color:'#8f919b',marginTop:4,lineHeight:1.45}}>{item.summary}</div>}
                      </div>
                      {item.current ? (
                        <div style={{width:20,height:20,borderRadius:999,background:'rgba(176,136,64,0.08)',border:'1px solid rgba(176,136,64,0.16)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#b08840" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      ) : <div style={{fontSize:14,color:'#a8aab4'}}>›</div>}
                    </button>
                  ))}
                </div>
                <div style={{padding:'12px 14px',borderTop:'1px solid rgba(0,0,0,0.06)'}}>
                  <button type="button" onClick={()=>queueActivityNavigation(nav, { returnContext:{ scope:'project-detail', projectId: projectDetailId || null } })} style={{width:'100%',height:40,borderRadius:10,border:'1px solid rgba(0,0,0,0.1)',background:'#fff',fontSize:12,fontWeight:700,color:'#2e3038',cursor:'pointer'}}>Open Activity →</button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
      {activeFilePreview && (
        <div className="modal-bg" role="button" tabIndex={0} onClick={()=>setActiveFilePreview(null)}
          onKeyDown={(e)=>{if(e.key==='Escape'){e.preventDefault();setActiveFilePreview(null);}}}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="File preview" onClick={e=>e.stopPropagation()} style={{maxWidth:560}}>
            <div className="modal-hd">
              <div className="modal-title">File preview</div>
              <button type="button" className="modal-close" aria-label="Close" onClick={()=>setActiveFilePreview(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <div style={{width:44,height:44,borderRadius:12,background:'#1e2028',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:10,fontWeight:800,letterSpacing:'0.04em'}}>{String(activeFilePreview.kind || 'File').slice(0,3).toUpperCase()}</div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:'#1C2814'}}>{activeFilePreview.name}</div>
                  <div style={{fontSize:12,color:'#858792',marginTop:2}}>{activeFilePreview.meta}</div>
                </div>
              </div>
              <div style={{padding:'14px 16px',borderRadius:14,background:'#fbfaf6',border:'1px solid #efe7d9',marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'#a8aab4',marginBottom:6}}>{activeFilePreview.kind || 'Supporting file'}</div>
                <div style={{fontSize:13,lineHeight:1.7,color:'#565862'}}>{activeFilePreview.blurb || 'Supporting material tied to this project.'}</div>
              </div>
              <div style={{fontSize:12,color:'#858792',lineHeight:1.7}}>This gives the files tab a real secondary state now so it feels intentional before the full file delivery system is wired deeper into the project room.</div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel-modal" onClick={()=>setActiveFilePreview(null)}>Close</button>
              <button type="button" className="btn-approve-modal" onClick={()=>{ setActiveFilePreview(null); setTab(hasPostHireWorkflow && !isVendor ? 'ops' : 'files'); }}>Open files tab</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SavedProjectsScreen({ nav = () => {}, role = '', currentUser = null, showToast = () => {} }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const loadSavedProjects = useCallback(async () => {
    if (!currentUser?.id) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: savedRows, error: savedError } = await supabase
        .from('saved_projects')
        .select('project_id,created_at,updated_at,is_saved,notify_on_bidding_open')
        .eq('user_id', currentUser.id)
        .eq('is_saved', true)
        .order('updated_at', { ascending:false })
        .limit(60);
      if (savedError) throw savedError;
      const orderedSavedRows = Array.isArray(savedRows) ? savedRows.filter(row => row?.project_id) : [];
      const ids = orderedSavedRows.map(row => row.project_id);
      if (ids.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }
      const { data: projectRows, error: projectError } = await supabase
        .from('projects')
        .select('id,title,description,category,primary_category,category_tags,budget,budget_min,budget_max,delivery_preference,timeline,status,church_id,church_name,city,project_city,project_state,project_place_id,hired_at,work_started_at,work_started_by,completion_requested_at,completion_requested_by,completed_at,completed_by,posted_at,urgent,bids_count,scope,skills,requirements')
        .in('id', ids);
      if (projectError) throw projectError;
      const projectsById = new Map((projectRows || []).map(project => [String(project.id), normalizeProjectEntity(project) || project]));
      setRows(orderedSavedRows.map(row => {
        const project = projectsById.get(String(row.project_id));
        return project ? { ...project, saved_at: row.updated_at || row.created_at || null, notify_on_bidding_open: !!row.notify_on_bidding_open } : null;
      }).filter(Boolean));
    } catch (err) {
      logError('saved-projects-list-load', err, { userId: currentUser?.id || null });
      setError(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => { loadSavedProjects(); }, [loadSavedProjects]);

  useEffect(() => {
    if (!currentUser?.id) return undefined;
    const userId = String(currentUser.id);
    const channel = supabase.channel(`kb-saved-projects-screen-${userId}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'saved_projects', filter:`user_id=eq.${userId}` }, () => {
        loadSavedProjects();
      })
      .subscribe();
    return () => { try { channel.unsubscribe(); } catch {} };
  }, [currentUser?.id, loadSavedProjects]);

  const openProject = (project) => {
    const projectId = project?.id || null;
    if (projectId) setPendingProjectTarget({ projectId, projectTitle:project?.title || null, screen:'projects', tab:'overview' });
    nav('projects');
  };

  const unsaveProject = async (project, event) => {
    event?.stopPropagation?.();
    const projectId = project?.id || null;
    if (!currentUser?.id || !projectId || removingId) return;
    const previousRows = rows;
    setRemovingId(projectId);
    setRows(prev => prev.filter(row => String(row?.id || '') !== String(projectId)));
    try {
      await persistSavedProjectRecord(projectId, false, currentUser.id);
      showToast && showToast('Removed from saved projects');
    } catch (err) {
      setRows(previousRows);
      logError('saved-projects-list-unsave', err, { projectId, userId: currentUser.id });
      showToast && showToast('Could not remove saved project. Please try again.', 'error');
    } finally {
      setRemovingId(null);
      loadSavedProjects();
    }
  };

  return (
    <main className="kb-saved-projects-fullbleed-page" style={{minHeight:'100vh',width:'100%',maxWidth:'none',margin:0,backgroundImage:KB_WORKSPACE_CLAY_BACKGROUND,backgroundSize:'cover',backgroundPosition:'center top',padding:'34px clamp(18px,4vw,52px) 86px',fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{width:'100%',maxWidth:'none',margin:0}}>
        <button type="button" onClick={() => nav('projects')} style={{border:'1px solid rgba(28,40,20,0.12)',background:'#fffdf8',borderRadius:999,padding:'9px 14px',fontSize:12,fontWeight:800,color:'#1C2814',cursor:'pointer',marginBottom:20}}>Back to Marketplace</button>
        <section style={{display:'grid',gap:12,marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:800,letterSpacing:'0.18em',textTransform:'uppercase',color:'#B08840'}}>Workspace / Saved projects</div>
          <h1 style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:'clamp(38px,6vw,76px)',lineHeight:0.95,letterSpacing:'-0.055em',color:'#1C2814',margin:0}}>Saved Projects.</h1>
          <p style={{maxWidth:720,fontSize:16,lineHeight:1.65,color:'#56614f',fontWeight:600,margin:0}}>A clean bookmark list for projects you want to revisit. Notification-only bidding requests stay separate and do not appear here unless you also saved the project.</p>
        </section>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap',marginBottom:18,padding:'14px 16px',border:'1px solid rgba(28,40,20,0.10)',borderRadius:18,background:'rgba(255,253,248,0.76)',boxShadow:'0 12px 34px rgba(28,40,20,0.07)'}}>
          <div style={{fontSize:13,fontWeight:800,color:'#1C2814'}}>{loading ? 'Loading saved projects...' : `${rows.length} saved project${rows.length === 1 ? '' : 's'}`}</div>
          <button type="button" onClick={loadSavedProjects} disabled={loading} style={{height:38,borderRadius:12,border:'1px solid rgba(28,40,20,0.14)',background:'#fff',padding:'0 14px',fontSize:12,fontWeight:800,color:'#1C2814',cursor:loading?'wait':'pointer'}}>Refresh</button>
        </div>
        {error ? (
          <div style={{padding:24,borderRadius:22,border:'1px solid rgba(185,28,28,0.18)',background:'rgba(254,242,242,0.84)',color:'#7f1d1d',fontWeight:700}}>Saved projects could not load. Retry, then inspect the saved_projects read path if it continues.</div>
        ) : loading ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:18}}>{[0,1,2].map(i => <div key={i} style={{height:430,borderRadius:18,background:'linear-gradient(90deg,rgba(255,255,255,0.52),rgba(255,255,255,0.86),rgba(255,255,255,0.52))',border:'1px solid rgba(28,40,20,0.08)'}} />)}</div>
        ) : rows.length === 0 ? (
          <div style={{padding:'42px 28px',borderRadius:26,border:'1px solid rgba(28,40,20,0.10)',background:'rgba(255,253,248,0.82)',textAlign:'center',boxShadow:'0 18px 48px rgba(28,40,20,0.08)'}}>
            <div style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:34,fontWeight:800,color:'#1C2814',marginBottom:8}}>No saved projects yet.</div>
            <p style={{fontSize:14,lineHeight:1.6,color:'#6f7569',margin:'0 auto 20px',maxWidth:520}}>Save a project from the marketplace to track it here. Bidding-open notifications are managed separately so a reminder never pretends to be a bookmark.</p>
            <button type="button" onClick={() => nav('projects')} style={{height:44,borderRadius:14,border:'1px solid rgba(212,185,120,0.55)',background:'linear-gradient(135deg,#1C2814,#304225)',color:'#fffdf8',padding:'0 18px',fontSize:13,fontWeight:800,cursor:'pointer'}}>Browse Projects</button>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:20}}>
            {rows.map(project => (
              <div key={project.id} style={{display:'grid',gap:10}}>
                <KcProjectCard project={project} role={role} onSelect={openProject} onBid={openProject} actions={[{label:'Open project',onClick:()=>openProject(project)}]} />
                <button type="button" onClick={(event) => unsaveProject(project, event)} disabled={removingId === project.id} style={{height:40,borderRadius:12,border:'1px solid rgba(28,40,20,0.12)',background:'#fffdf8',color:'#6f5d40',fontSize:12,fontWeight:800,cursor:removingId === project.id ? 'wait' : 'pointer'}}>Remove from saved projects</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function AllVendorsLanding({ role, nav, onPost, onBack, showToast, onSelectVendor, vendors: vendorInput = [], vendorsLoading = false, savedVendorIds: savedVendorIdsProp = new Set(), onToggleSave = null, currentUser = null, contextProjects = [], founderCoverageContext = null, onClearFounderCoverageContext = null, surface = 'default', isActive = true }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 180);
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Best overall");
  const [page, setPage] = useState(1);
  const [localSavedVendorIds, setLocalSavedVendorIds] = useState(() => new Set());
  const [invitedVendorKeys, setInvitedVendorKeys] = useState(() => new Set());
  const [invitingVendorKeys, setInvitingVendorKeys] = useState(() => new Set());
  const [vendorPairSignalMaps, setVendorPairSignalMaps] = useState(() => makeEmptyVendorPairSignalMaps());
  const [vendorPairSignalRefreshKey, setVendorPairSignalRefreshKey] = useState(0);
  const [geoFitByVendorId, setGeoFitByVendorId] = useState(() => new Map());
  const refreshVendorPairSignalMaps = useCallback(() => {
    setVendorPairSignalRefreshKey(prev => prev + 1);
  }, []);
  const directoryRef = useRef(null);
  const isHirerMarketplace = role === 'church' || role === 'individual';
  const isChurchMarketplace = role === 'church' && surface === 'church-vendors';
  const viewerCity = firstNonEmpty(currentUser?.city, currentUser?.profile?.city, currentUser?.user_metadata?.city, currentUser?.user_metadata?.location, '');
  const inviteChurchId = String(currentUser?.id || '').trim();
  const [selectedVendorProjectMirror, setSelectedVendorProjectMirror] = useState(null);
  const normalizedContextProjects = useMemo(() => safeArray(contextProjects).map(p => normalizeProjectEntity(p)).filter(Boolean), [contextProjects]);
  const selectedVendorProjectMirrorId = String(selectedVendorProjectMirror?.projectId || '').trim();
  const storedVendorProjectSelection = useMemo(
    () => selectedVendorProjectMirrorId ? selectedVendorProjectMirror : readSelectedVendorProject(inviteChurchId),
    [inviteChurchId, selectedVendorProjectMirrorId, selectedVendorProjectMirror]
  );
  const projectSelectionOptions = useMemo(() => {
    const seen = new Set();
    const add = (project, list) => {
      const normalized = normalizeProjectEntity(project);
      const id = String(normalized?.id || '').trim();
      if (!id || seen.has(id)) return;
      seen.add(id);
      list.push(normalized);
    };
    const list = [];
    safeArray(normalizedContextProjects).forEach(project => add(project, list));
    return list;
  }, [normalizedContextProjects]);
  const matchContextProject = useMemo(() => {
    const storedProjectId = String(firstNonEmpty(storedVendorProjectSelection?.projectId, storedVendorProjectSelection?.id, '')).trim();
    if (storedProjectId) {
      const validatedProject = projectSelectionOptions.find(p => String(p?.id || '').trim() === storedProjectId);
      if (validatedProject) return validatedProject;
    }
    return projectSelectionOptions.find(p => ['open','review','draft'].includes(String(p.status || 'draft'))) || null;
  }, [projectSelectionOptions, storedVendorProjectSelection]);
  const inviteProjectId = String(matchContextProject?.id || '').trim();
  const hasProjectContext = !!inviteProjectId;
  const handleProjectContextRecovery = useCallback((event) => {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    if (typeof onPost === 'function') {
      try { onPost(); return; } catch (err) { logError('ai-matching-project-context-recovery', err); }
    }
    if (typeof nav === 'function') {
      try { nav('projects:post'); return; } catch (err) { logError('ai-matching-project-context-nav', err); }
    }
    showToast && showToast('Post a project first so FaithBid can score vendors against real scope.');
  }, [nav, onPost, showToast]);

  useEffect(() => {
    let cancelled = false;
    if (!inviteProjectId || !inviteChurchId) {
      setGeoFitByVendorId(new Map());
      return () => { cancelled = true; };
    }
    supabase
      .rpc('kb_marketplace_geo_fit_for_project', { p_project_id: inviteProjectId })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          logError('marketplace-geo-fit-batch', error, { projectId: inviteProjectId });
          setGeoFitByVendorId(new Map());
          return;
        }
        const next = new Map();
        safeArray(data).forEach(row => {
          const vendorId = String(row?.vendor_id || '').trim();
          if (vendorId) next.set(vendorId, row?.geo_fit || null);
        });
        setGeoFitByVendorId(next);
      })
      .catch(error => {
        if (!cancelled) {
          logError('marketplace-geo-fit-batch', error, { projectId: inviteProjectId });
          setGeoFitByVendorId(new Map());
        }
      });
    return () => { cancelled = true; };
  }, [inviteProjectId, inviteChurchId]);

  const { directory: rawVendors } = useMemo(() => getMarketplaceVendorDataset(vendorInput), [vendorInput]);
  const vendors = useMemo(() => rawVendors.map(vendor => {
    const geoFit = geoFitByVendorId.get(String(vendor?.id || '').trim()) || null;
    const withGeo = { ...vendor, geo_fit: geoFit };
    return {
      ...withGeo,
      recommendedFit: computeRecommendedVendorFit(withGeo, matchContextProject, viewerCity)
    };
  }), [rawVendors, matchContextProject, viewerCity, geoFitByVendorId]);
  const effectiveSavedVendorIds = onToggleSave ? savedVendorIdsProp : localSavedVendorIds;

  const chips = useMemo(() => {
    const cats = ["All", ...Array.from(new Set(vendors.map(v => v.specialty).filter(Boolean)))];
    return cats.map(cat => [cat, cat === "All" ? vendors.length : vendors.filter(v => v.specialty === cat || (v.tags || []).includes(cat)).length]).filter(([, n]) => n > 0);
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    let list = vendors.filter(v => {
      const matchesSearch = !term || [v.name, v.role, v.city, v.result, v.why, ...(v.tags || []), ...(v.specialties || []), v.specialty].some(val => String(val || '').toLowerCase().includes(term));
      const matchesCategory = category === 'All' || v.specialty === category || (v.tags || []).includes(category) || (v.specialties || []).includes(category);
      return matchesSearch && matchesCategory;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === 'Most projects') return (b.projects || 0) - (a.projects || 0) || (b.recommendedFit?.rank || 0) - (a.recommendedFit?.rank || 0);
      if (sortBy === 'Top rated') return (b.rating || 0) - (a.rating || 0) || (b.reviews || 0) - (a.reviews || 0);
      if (sortBy === 'Recently added') return Number(b.verified) - Number(a.verified) || a.name.localeCompare(b.name);
      return (b.recommendedFit?.rankingScore || 0) - (a.recommendedFit?.rankingScore || 0) || (b.recommendedFit?.rank || 0) - (a.recommendedFit?.rank || 0) || Number(b.verified) - Number(a.verified) || a.name.localeCompare(b.name);
    });
    return list;
  }, [vendors, debouncedSearch, category, sortBy]);

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedVendors = filteredVendors.slice((safePage - 1) * pageSize, safePage * pageSize);
  const verifiedCount = vendors.filter(v => v.verified).length;
  const specialtyCount = new Set(vendors.map(v => v.specialty).filter(Boolean)).size;

  const vendorProjectShape = (vendor = {}) => ({
    title: vendor.name,
    category: vendor.specialty || vendor.category || vendor.role || 'Vendor',
    tags: [...(vendor.specialties || []), ...(vendor.tags || [])],
    skills: vendor.tags || vendor.specialties || [],
    description: vendor.result || vendor.why || vendor.bio || vendor.headline || vendor.tagline || 'Faith-aligned vendor ready for church projects.',
    scope: vendor.role || vendor.headline || vendor.tagline,
  });

  const vendorImageFor = (vendor, idx = 0) => {
    const pseudo = vendorProjectShape(vendor);
    return getProjectHeroImage(pseudo, idx) || getProjectHeroImage({ category:'consulting', title:'Trusted vendor partner' }, idx) || '';
  };

  const handleSelectedVendorProjectChange = (event) => {
    const nextProjectId = String(event?.target?.value || '').trim();
    const selectedProject = projectSelectionOptions.find(p => String(p?.id || '').trim() === nextProjectId) || null;
    if (!selectedProject) return;
    const projectMeta = {
      projectId: selectedProject.id,
      projectTitle: selectedProject.title || selectedProject.name || '',
      churchId: firstNonEmpty(selectedProject.church_id, selectedProject.client_id, currentUser?.id, ''),
      status: selectedProject.status || '',
      selectedAt: new Date().toISOString(),
      source: 'recommended_vendors_selector',
      projectSnapshot: selectedProject,
    };
    const savedSelection = writeSelectedVendorProject(inviteChurchId, projectMeta);
    setSelectedVendorProjectMirror(savedSelection || normalizeSelectedVendorProjectMeta(projectMeta));
  };

  useEffect(() => { setPage(1); }, [search, category, sortBy]);

  useEffect(() => {
    if (!inviteProjectId || !inviteChurchId) return;
    let cancelled = false;
    supabase
      .from('vendor_invites')
      .select('vendor_id')
      .eq('project_id', inviteProjectId)
      .eq('church_id', inviteChurchId)
      .then(({ data, error }) => {
        if (cancelled || error) return;
        const next = new Set(safeArray(data).map(row => String(row?.vendor_id || '').trim()).filter(Boolean).map(vendorId => `${inviteProjectId}:${vendorId}`));
        setInvitedVendorKeys(next);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [inviteProjectId, inviteChurchId]);

  useEffect(() => {
    let cancelled = false;
    if (!inviteProjectId || !inviteChurchId) {
      setVendorPairSignalMaps(makeEmptyVendorPairSignalMaps());
      return () => { cancelled = true; };
    }
    fetchVendorPairSignalMaps({ projectId: inviteProjectId, churchId: inviteChurchId })
      .then((maps) => {
        if (cancelled) return;
        setVendorPairSignalMaps(maps || makeEmptyVendorPairSignalMaps());
      })
      .catch(() => {
        if (!cancelled) setVendorPairSignalMaps(makeEmptyVendorPairSignalMaps());
      });
    return () => { cancelled = true; };
  }, [inviteProjectId, inviteChurchId, vendorPairSignalRefreshKey]);

  const toggleSave = (vendor, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const key = String(vendor?.id || vendor?.user_id || vendor?.name);
    if (typeof onToggleSave === 'function') {
      onToggleSave(key, e);
      return;
    }
    setLocalSavedVendorIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        showToast && showToast('Removed from saved vendors');
      } else {
        next.add(key);
        showToast && showToast('Saved vendor');
      }
      return next;
    });
  };

  const getInviteKey = (vendor = {}) => {
    const projectId = String(matchContextProject?.id || 'no-project');
    const vendorId = String(firstNonEmpty(vendor?.id, vendor?.vendor_id, vendor?.user_id, vendor?.name, 'vendor'));
    return `${projectId}:${vendorId}`;
  };

  const getInviteButtonLabelForDealState = (dealState, { isInviting = false, hasProject = true, hasUser = true } = {}) => {
    if (isInviting) return 'Sending…';
    if (!hasProject) return 'Post project to invite';
    if (!hasUser) return 'Sign in to invite';
    if (dealState === 'invited') return 'Invited';
    if (dealState === 'no_response') return 'No response yet';
    if (dealState === 'declined') return 'Declined';
    if (dealState === 'inquiry') return 'In conversation';
    if (dealState === 'bid_under_review' || dealState === 'bid_placed') return 'Bid received';
    if (dealState === 'hired') return 'Hired';
    if (dealState === 'active') return 'Active';
    if (dealState === 'milestone_pending') return 'In progress';
    if (dealState === 'completed') return 'Completed';
    if (dealState === 'disputed') return 'Issue open';
    if (dealState === 'archived') return 'Archived';
    return 'Invite to bid';
  };

  const vendorDealStateByKey = useMemo(() => {
    const next = new Map();
    const now = new Date().toISOString();
    safeArray(pagedVendors).forEach((vendor, index) => {
      const vendorKey = String(vendor?.id || vendor?.user_id || vendor?.name || index);
      const vendorId = String(firstNonEmpty(vendor?.id, vendor?.vendor_id, vendor?.user_id, '')).trim();
      const vendorUserId = String(firstNonEmpty(vendor?.user_id, vendor?.vendor_user_id, vendor?.vendor_id, vendor?.id, '')).trim();
      const engineBucket = buildVendorPairSignals({
        vendorId,
        vendorUserId,
        project: matchContextProject,
        maps: vendorPairSignalMaps,
        role: 'church',
        now,
      });
      const engineDealState = deriveCanonicalDealState(engineBucket);
      const inviteKey = getInviteKey(vendor);
      const optimisticInvited = invitedVendorKeys.has(inviteKey);
      const displayDealState = engineDealState === 'not_contacted' && optimisticInvited ? 'invited' : engineDealState;
      const dealSummary = getDealStateSummary(displayDealState, { role: 'church', linkedBid: engineBucket?.linkedBid || null });
      next.set(vendorKey, {
        engineBucket,
        engineDealState,
        displayDealState,
        dealSummary,
        optimisticInvited,
      });
    });
    return next;
  }, [pagedVendors, matchContextProject, vendorPairSignalMaps, invitedVendorKeys]);

  const handleInviteVendor = async (vendor, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const clean = (value = '') => String(value || '').trim();
    const projectId = clean(matchContextProject?.id);
    const churchId = clean(currentUser?.id);
    const vendorId = clean(firstNonEmpty(vendor?.id, vendor?.vendor_id, vendor?.user_id));
    if (!projectId || !churchId || !vendorId) {
      if (!projectId) showToast && showToast('Select a project before inviting vendors');
      else if (!churchId) showToast && showToast('Sign in to invite vendors');
      else showToast && showToast('Could not identify this vendor for an invite');
      return;
    }
    const inviteKey = getInviteKey(vendor);
    if (invitedVendorKeys.has(inviteKey) || invitingVendorKeys.has(inviteKey)) return;
    setInvitingVendorKeys(prev => new Set(prev).add(inviteKey));
    const result = await createRecommendedVendorInviteRecord({ vendor, project: matchContextProject, currentUser, lens: sortBy });
    setInvitingVendorKeys(prev => {
      const next = new Set(prev);
      next.delete(inviteKey);
      return next;
    });
    if (result?.alreadyInvited) {
      setInvitedVendorKeys(prev => new Set(prev).add(inviteKey));
      refreshVendorPairSignalMaps();
      showToast && showToast('Already invited to this project.');
    } else if (result?.ok) {
      setInvitedVendorKeys(prev => new Set(prev).add(inviteKey));
      refreshVendorPairSignalMaps();
      showToast && showToast(`Invite sent to ${vendor?.name || 'vendor'}`);
    } else {
      showToast && showToast('Invite could not be sent. Please try again.');
    }
  };

  const handleOpenVendor = (vendor) => {
    const seeded = {
      ...buildVendorProfileSeed(vendor),
      recommendedFit: vendor?.recommendedFit || null,
      match_context_project: matchContextProject || null,
      match_context_label: matchContextProject?.title || '',
    };
    void persistMatchmakerOutcomeEvent({
      eventType: 'viewed',
      vendor,
      project: matchContextProject,
      currentUser,
      lens: sortBy,
      sourceAction: 'profile_open',
      actorRole: 'church',
    });
    if (onSelectVendor) {
      onSelectVendor(seeded);
      return;
    }
    queueVendorNavigation(nav, seeded);
    showToast && showToast(`Opening ${seeded.name}`);
  };

  const handleCompareVendor = (vendor, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const seeded = {
      ...buildVendorProfileSeed(vendor),
      recommendedFit: vendor?.recommendedFit || null,
      match_context_project: matchContextProject || null,
      match_context_label: matchContextProject?.title || '',
    };
    const fit = vendor?.recommendedFit || {};
    const compareItemId = seeded.id || seeded.user_id || seeded.name;
    const snapshotClean = (value = '') => String(value || '').trim();
    const snapshotCreatedAt = new Date().toISOString();
    const snapshotDisplayDate = new Date(snapshotCreatedAt).toLocaleDateString('en-US', { month:'short', day:'numeric' });
    const compareResult = upsertCompareWorkspaceItem('vendors', {
      id: compareItemId,
      initials: seeded.initials || vendor.initials,
      name: seeded.name,
      role: seeded.headline || seeded.role || seeded.category || vendor.role,
      city: seeded.city || vendor.city,
      rating: Number(seeded.rating || vendor.rating || 0),
      reviews: Number(seeded.reviews_count || seeded.reviews || vendor.reviews || 0),
      badge: seeded.verified ? 'Faith Verified' : 'Member',
      gradient: vendor.gradient || 'linear-gradient(145deg,#5b7a5e,#3d5940)',
      price: seeded.price_range || vendor.price || 'Custom proposal',
      recommendation_snapshot: {
        source: 'recommended_vendors_app_only',
        created_at: snapshotCreatedAt,
        display_date: snapshotDisplayDate,
        lens: sortBy || 'Best overall',
        fit_label: fit.label || '',
        label_key: fit.labelKey || '',
        reasons: safeArray(fit.reasons).map(snapshotClean).filter(Boolean),
        reason_keys: safeArray(fit.reasonKeys).map(snapshotClean).filter(Boolean),
        watchout: snapshotClean(fit.watchout || ''),
        watchout_key: snapshotClean(fit.watchoutKey || ''),
        confidence_level: fit.confidenceLevel || '',
        ranking_score: Number(fit.rankingScore || 0) || 0,
        distribution_tier: fit.distributionTier || '',
        needs_human_review: !!fit.needsHumanReview,
        hard_eligibility_passed: !!fit.hardEligibilityPassed,
        rail: fit.rail || null,
        input_version: fit.inputVersion || KB_MATCHMAKER_INPUT_VERSION,
        project_id: matchContextProject?.id || null,
        project_title: matchContextProject?.title || null,
        project_category: matchContextProject?.category || matchContextProject?.primary_category || null,
        project_budget: matchContextProject?.budget || null,
      },
      match_context_project: matchContextProject || null,
    });
    if (compareResult?.compareLimitReached) {
      showToast && showToast(getCompareWorkspaceLimitMessage('vendors'), 'error');
      return;
    }
    void (async () => {
      const matchSnapshotId = await persistRecommendedVendorMatchSnapshot({ compareItemId, vendor, project: matchContextProject, currentUser, lens: sortBy });
      await persistMatchmakerOutcomeEvent({
        eventType: 'compared',
        vendor,
        project: matchContextProject,
        currentUser,
        lens: sortBy,
        sourceAction: 'compare',
        matchSnapshotId,
        actorRole: 'church',
      });
    })();
    queueCompareNavigation(nav, { returnContext:{ scope:'vendor-directory', vendorId: seeded.id || seeded.user_id || null } });
    showToast && showToast(`${seeded.name} added to compare`);
  };

  const clearVendorFilters = () => {
    setSearch('');
    setCategory('All');
    setSortBy('Best overall');
    setPage(1);
  };

  const changePage = (nextPage) => {
    const target = Math.max(1, Math.min(totalPages, Number(nextPage) || 1));
    if (target === safePage) return;
    setPage(target);
    requestAnimationFrame(() => {
      if (directoryRef.current && typeof directoryRef.current.scrollIntoView === 'function') {
        directoryRef.current.scrollIntoView({ behavior:'smooth', block:'start' });
      }
    });
  };

  const founderCoverageSearchTerm = String(founderCoverageContext?.category || founderCoverageContext?.projectTitle || "").trim();
  const founderCoverageContextKey = [
    founderCoverageContext?.source,
    founderCoverageContext?.projectId,
    founderCoverageContext?.projectTitle,
    founderCoverageContext?.category,
    founderCoverageContext?.geography,
    founderCoverageContext?.openedAt,
  ].filter(Boolean).join(":");

  useEffect(() => {
    if (!founderCoverageContextKey) return;
    if (founderCoverageSearchTerm) setSearch(founderCoverageSearchTerm);
    setCategory("All");
    setSortBy("Best overall");
    setPage(1);
    requestAnimationFrame(() => {
      if (directoryRef.current && typeof directoryRef.current.scrollIntoView === "function") {
        directoryRef.current.scrollIntoView({ behavior:"smooth", block:"start" });
      }
    });
  }, [founderCoverageContextKey, founderCoverageSearchTerm]);

  const clearFounderCoverageContext = () => {
    if (typeof onClearFounderCoverageContext === "function") onClearFounderCoverageContext();
    setSearch("");
    setCategory("All");
    setSortBy("Best overall");
    setPage(1);
  };

  const activeFilterCount = (debouncedSearch.trim() ? 1 : 0) + (category !== 'All' ? 1 : 0) + (sortBy !== 'Best overall' ? 1 : 0);

  return (
    <div className={`kb-live-marketplace-page kb-vendor-marketplace-page${isHirerMarketplace ? ' kb-hirer-vendor-directory-page' : ' kb-vendor-directory-standalone-page'}${isChurchMarketplace ? ' kb-church-marketplace-page' : ''}`}>
      <style>{`
        .kb-vendor-marketplace-page{background:transparent!important;min-height:auto!important;color:#171814;font-family:'DM Sans',Inter,system-ui,-apple-system,BlinkMacSystemFont,sans-serif;}
        .kb-vendor-marketplace-page *{box-sizing:border-box;}
        .kb-vendor-marketplace-page.kb-church-marketplace-page{overflow-x:clip!important;}

        /* 853u — Church Marketplace only. The shared navbar and all other POV surfaces remain untouched. */
        .kb-church-marketplace-page > .kb-church-marketplace-hero{
          position:relative;
          width:100%;
          height:405px;
          min-height:405px;
          margin:0;
          padding:0;
          isolation:isolate;
          overflow:hidden;
          background:transparent;
        }
        .kb-church-marketplace-hero-media{
          position:absolute;
          inset:0 0 30px 0;
          z-index:0;
          overflow:hidden;
          background:#0b1710;
          -webkit-mask-image:linear-gradient(#000 0 0),url(${KB_CHURCH_VIDEO_STEM_EDGE_MASK});
          -webkit-mask-size:100% calc(100% - var(--kb852-vine-height,95px) + 2px),100vw var(--kb852-vine-height,95px);
          -webkit-mask-position:center top,center bottom;
          -webkit-mask-repeat:no-repeat,no-repeat;
          mask-image:linear-gradient(#000 0 0),url(${KB_CHURCH_VIDEO_STEM_EDGE_MASK});
          mask-size:100% calc(100% - var(--kb852-vine-height,95px) + 2px),100vw var(--kb852-vine-height,95px);
          mask-position:center top,center bottom;
          mask-repeat:no-repeat,no-repeat;
        }
        .kb-church-marketplace-hero-video,
        .kb-church-marketplace-hero-poster{
          position:absolute;
          inset:0;
          display:block;
          width:100%;
          height:100%;
          margin:0;
          object-fit:cover;
          object-position:58% 50%;
          background-color:#0b1710;
          background-image:url(${KB_CHURCH_MARKETPLACE_VIDEO_POSTER});
          background-size:cover;
          background-position:58% 50%;
          background-repeat:no-repeat;
          filter:saturate(.94) contrast(1.035) brightness(.91);
        }
        .kb-church-marketplace-hero-scrim{
          position:absolute;
          inset:0;
          pointer-events:none;
          background:
            linear-gradient(90deg,rgba(5,17,11,.96) 0%,rgba(7,20,13,.88) 18%,rgba(8,20,14,.67) 36%,rgba(8,18,13,.28) 58%,rgba(7,15,11,.08) 80%,rgba(5,12,8,.08) 100%),
            rgba(5,13,9,.06);
        }
        .kb-church-marketplace-hero-content{
          position:relative;
          z-index:2;
          display:grid!important;
          grid-template-columns:minmax(0,1fr) clamp(500px,38vw,520px)!important;
          align-items:flex-start!important;
          justify-content:flex-start!important;
          column-gap:clamp(32px,3.5vw,54px)!important;
          width:min(100%,1368px)!important;
          height:100%!important;
          margin:0 auto!important;
          padding:70px 54px 125px!important;
          transform:none!important;
          text-align:left!important;
        }
        .kb-church-marketplace-hero-copy{
          display:flex;
          flex-direction:column;
          align-items:flex-start;
          width:100%;
          margin:0!important;
          color:#fffdf8;
          transform:none!important;
          text-align:left!important;
        }
        .kb-church-marketplace-hero-kicker{
          grid-area:kicker;
          margin:0 0 10px!important;
          color:#d7a74d;
          font-size:12px;
          line-height:1;
          font-weight:800;
          letter-spacing:.24em;
          text-transform:uppercase;
          text-align:left!important;
          text-shadow:0 2px 12px rgba(0,0,0,.34);
        }
        .kb-church-marketplace-hero h1{
          grid-area:title;
          width:auto!important;
          max-width:none;
          margin:0!important;
          padding:0!important;
          color:#fffdf8!important;
          font-family:'Playfair Display','Newsreader',Georgia,serif!important;
          font-size:clamp(48px,4vw,60px)!important;
          font-weight:500!important;
          line-height:1.02!important;
          letter-spacing:-.045em!important;
          text-align:left!important;
          white-space:nowrap;
          transform:none!important;
          text-shadow:0 3px 22px rgba(0,0,0,.30);
        }
        .kb-church-marketplace-hero-copy > p{
          grid-area:intro;
          width:auto!important;
          max-width:570px;
          margin:10px 0 0!important;
          padding:0!important;
          color:rgba(255,253,248,.94)!important;
          font-size:15.5px!important;
          font-weight:500!important;
          line-height:1.4!important;
          text-align:left!important;
          transform:none!important;
          text-shadow:0 2px 13px rgba(0,0,0,.32);
        }
        .kb-church-marketplace-control-rail{
          align-self:start;
          display:grid;
          grid-template-rows:34px minmax(0,1fr) 44px 22px;
          row-gap:10px;
          width:100%;
          min-width:0;
          height:170px;
          margin:0;
        }
        .kb-church-marketplace-hero-actions{
          grid-row:3;
          display:grid!important;
          grid-template-columns:repeat(2,minmax(0,1fr));
          align-items:center!important;
          justify-content:stretch!important;
          gap:12px;
          width:100%!important;
          margin:0!important;
          transform:none!important;
          text-align:left!important;
        }
        .kb-church-marketplace-hero-actions button{
          flex:0 0 auto!important;
          width:100%!important;
          height:44px!important;
          min-width:0!important;
          margin:0!important;
          padding:0 20px!important;
          border-radius:14px!important;
          font:inherit;
          font-size:13px!important;
          font-weight:800!important;
          cursor:pointer;
          transform:none;
          transition:transform .16s ease,background .16s ease,border-color .16s ease,box-shadow .16s ease;
        }
        .kb-church-marketplace-hero-primary{
          border:1px solid rgba(67,112,68,.46)!important;
          background:linear-gradient(180deg,rgba(42,83,46,.98),rgba(27,62,34,.98))!important;
          color:#fffdf8!important;
          box-shadow:0 12px 28px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.11)!important;
        }
        .kb-church-marketplace-hero-secondary{
          border:1.5px solid #c99b3e!important;
          background:rgba(7,18,12,.42)!important;
          color:#fffdf8!important;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 24px rgba(0,0,0,.15)!important;
          backdrop-filter:blur(4px);
        }
        .kb-church-marketplace-hero-actions button:hover{transform:translateY(-1px)!important;}
        .kb-church-marketplace-hero-primary:hover{background:linear-gradient(180deg,#34613a,#21492a)!important;}
        .kb-church-marketplace-hero-secondary:hover{background:rgba(19,39,25,.62)!important;border-color:#e0b357!important;}
        .kb-church-marketplace-hero-actions button:focus-visible{outline:2px solid #f1c86f!important;outline-offset:3px;}
        .kb-church-marketplace-trust{
          grid-row:4;
          display:flex!important;
          align-items:center!important;
          justify-content:space-between!important;
          gap:10px;
          width:100%!important;
          margin:0!important;
          color:#fffdf8;
          transform:none!important;
          text-align:left!important;
        }
        .kb-church-marketplace-trust-item{display:flex;align-items:center;gap:8px;white-space:nowrap;font-size:11.5px;font-weight:700;text-shadow:0 2px 9px rgba(0,0,0,.34);}
        .kb-church-marketplace-trust-item svg{width:22px;height:22px;fill:none;stroke:#d2a445;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 2px 5px rgba(0,0,0,.28));}
        .kb-church-marketplace-trust-rule{display:block;width:1px;height:20px;background:rgba(255,253,248,.42);}

        /* Identical approved divider to Church Projects on the same dedicated
           light seam band and full-width desktop/tablet geometry as My Projects. */
        .kb-church-marketplace-hero-vine{
          position:absolute;
          z-index:12;
          left:50%;
          right:auto;
          bottom:30px;
          width:100vw;
          height:var(--kb852-vine-height,95px);
          transform:translateX(-50%);
          pointer-events:none;
          background-color:transparent;
          background-image:var(--kb852-vine-art);
          background-repeat:no-repeat;
          background-size:100% var(--kb852-vine-height,95px);
          background-position:center center;
          background-blend-mode:normal;
          -webkit-mask-image:none;
          mask-image:none;
          opacity:1;
          filter:none;
          border:0;
          box-shadow:none;
        }
        .kb-church-marketplace-mode-switch{
          position:static;
          z-index:20;
          grid-row:1;
          justify-self:center;
          top:auto;
          right:auto;
          background:rgba(255,253,248,.91)!important;
          border-color:rgba(255,253,248,.52)!important;
          box-shadow:0 9px 24px rgba(5,17,11,.18),inset 0 1px 0 rgba(255,255,255,.74)!important;
          backdrop-filter:blur(10px);
        }
        .kb-church-marketplace-directory-panel{position:relative;z-index:6;margin:-32px 0 0;padding:0 2px;background:transparent;}
        .kb-church-marketplace-context-line{
          position:relative;
          display:flex;
          align-items:center;
          justify-content:flex-start;
          gap:7px;
          min-height:30px;
          margin:0 2px 12px;
          color:#454d42;
          font-size:13.5px;
          font-weight:600;
          line-height:1.4;
        }
        .kb-church-marketplace-context-copy{
          display:flex;
          align-items:center;
          justify-content:flex-start;
          gap:7px;
          min-width:0;
          flex-wrap:wrap;
        }
        .kb-church-marketplace-context-line > span,
        .kb-church-marketplace-context-copy > span{white-space:nowrap;}
        .kb-marketplace-below-seam-action--find-vendors{display:none!important;}
        .kb-church-marketplace-project-select{
          width:auto;
          max-width:320px;
          height:30px;
          margin:0;
          padding:0 30px 0 11px;
          border:1px solid rgba(28,40,20,.14);
          border-radius:999px;
          background:rgba(255,253,248,.76);
          color:#1C2814;
          font:inherit;
          font-size:12.5px;
          font-weight:800;
          outline:none;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.62),0 2px 6px rgba(28,40,20,.035);
        }
        .kb-church-marketplace-project-select:focus{border-color:rgba(176,136,64,.56);box-shadow:0 0 0 3px rgba(176,136,64,.11);}
        .kb-church-marketplace-match-info{position:relative;margin:0;}
        .kb-church-marketplace-match-info summary{
          display:grid;
          place-items:center;
          width:20px;
          height:20px;
          margin:0;
          padding:0;
          border:1px solid rgba(28,40,20,.17);
          border-radius:999px;
          background:rgba(255,253,248,.66);
          color:#6a7166;
          font-size:11px;
          font-weight:800;
          line-height:1;
          list-style:none;
          cursor:pointer;
        }
        .kb-church-marketplace-match-info summary::-webkit-details-marker{display:none;}
        .kb-church-marketplace-match-info summary:hover,
        .kb-church-marketplace-match-info[open] summary{border-color:rgba(176,136,64,.42);color:#1C2814;background:#fffdf8;}
        .kb-church-marketplace-match-note{
          position:absolute;
          z-index:30;
          top:calc(100% + 8px);
          right:0;
          width:min(370px,calc(100vw - 64px));
          padding:11px 12px;
          border:1px solid rgba(176,136,64,.20);
          border-radius:12px;
          background:#fffdf8;
          color:#4f594c;
          font-size:11.5px;
          font-weight:600;
          line-height:1.5;
          box-shadow:0 14px 32px rgba(28,40,20,.13);
        }
        .kb-church-marketplace-directory-panel .kb-vendor-toolbar{
          grid-template-columns:minmax(260px,1fr) 160px 170px;
          gap:8px;
          margin:0 0 18px!important;
          padding:5px 6px!important;
          border-radius:14px!important;
          box-shadow:0 7px 18px rgba(28,40,20,.045)!important;
        }
        .kb-church-marketplace-directory-panel .kb-vendor-toolbar.has-clear{grid-template-columns:minmax(260px,1fr) 160px 170px auto;}
        .kb-church-marketplace-directory-panel .kb-vendor-search,
        .kb-church-marketplace-directory-panel .kb-vendor-select,
        .kb-church-marketplace-directory-panel .kb-vendor-clear{height:36px!important;min-height:36px!important;border-radius:10px!important;}
        html body .workspace-body-shell.marketplace-body-shell .kb-church-marketplace-page > .kb-live-shell,
        html body .kb-church-marketplace-page > .kb-live-shell{
          width:min(100%,1368px)!important;
          max-width:1368px!important;
          min-width:0!important;
          margin:0 auto!important;
          padding:0 30px 58px!important;
          overflow:visible!important;
          background:transparent!important;
        }
        @media(max-width:1100px){
          .kb-church-marketplace-page > .kb-church-marketplace-hero{height:455px;min-height:455px;}
          .kb-church-marketplace-hero-content{display:block!important;padding:78px 36px 125px!important;}
          .kb-church-marketplace-hero-copy{display:block;width:min(100%,720px);}
          .kb-church-marketplace-hero-kicker{margin:0 0 9px!important;}
          .kb-church-marketplace-mode-switch{position:absolute;top:64px;right:36px;}
          .kb-church-marketplace-hero h1{font-size:clamp(44px,6vw,52px)!important;white-space:normal;}
          .kb-church-marketplace-hero-copy > p{max-width:620px;margin-top:10px!important;}
          .kb-church-marketplace-control-rail{display:block;width:min(100%,720px);height:auto;margin-top:14px;}
          .kb-church-marketplace-hero-actions{display:flex!important;width:auto!important;justify-content:flex-start!important;margin:0!important;}
          .kb-church-marketplace-hero-actions button{width:auto!important;min-width:170px!important;flex:0 0 auto!important;}
          .kb-church-marketplace-trust{width:auto!important;justify-content:flex-start!important;gap:12px;margin-top:14px!important;flex-wrap:wrap;}
          html body .workspace-body-shell.marketplace-body-shell .kb-church-marketplace-page > .kb-live-shell,
          html body .kb-church-marketplace-page > .kb-live-shell{padding:0 20px 48px!important;}
        }
        @media(max-width:760px){
          /* Intermediate step: scale the tablet composition down before the
             405px/95px mobile vine system takes over at 680px, so 681-759px
             is not served by the full 125px tablet padding unmodified. */
          .kb-church-marketplace-page > .kb-church-marketplace-hero{height:374px!important;min-height:374px!important;}
          .kb-church-marketplace-hero-content{padding:80px 26px 64px!important;}
          /* CTA visibility fix: the base rule (unscoped, specificity 0,1,0) hides
             this button by default, normally overridden only at >=1101px or
             <=680px, leaving it invisible in 681-760px without this override. */
          html body .kb-church-marketplace-page .kb-marketplace-below-seam-action--find-vendors{
            display:inline-flex!important;
            align-items:center!important;
            justify-content:space-between!important;
            gap:11px!important;
            min-width:159px!important;
            height:38px!important;
            padding:0 13px 0 16px!important;
            border-radius:12px!important;
            border:1px solid rgba(214,170,72,.74)!important;
            background:linear-gradient(180deg,rgba(40,71,37,.98),rgba(24,48,27,.98))!important;
            color:#fffdf8!important;
            box-shadow:0 10px 22px rgba(0,0,0,.12),inset 0 1px 0 rgba(255,255,255,.08)!important;
            font-family:'DM Sans',system-ui,sans-serif!important;
            font-size:11.25px!important;
            font-weight:800!important;
            letter-spacing:.01em!important;
            white-space:nowrap!important;
            cursor:pointer!important;
          }
        }
        @media(max-width:680px){
          /* V882 mobile-only: same true video-mask seam contract as Church Projects. */
          html body .kb-church-marketplace-page > .kb-church-marketplace-hero{
            height:340px!important;
            min-height:340px!important;
            z-index:8!important;
            overflow:visible!important;
            --kb852-vine-height:95px!important;
            --kb852-vine-anchor-y:31px!important;
            --kb852-vine-drop:64px!important;
            --kb852-mobile-desktop-pov-vine-width:1440px!important;
            --kb852-mobile-desktop-pov-vine-height:95px!important;
          }
          html body .kb-church-marketplace-hero .kb-church-marketplace-hero-media{
            inset:0 0 -64px 0!important;
            -webkit-mask-image:linear-gradient(#000 0 0),url(${KB_CHURCH_VIDEO_STEM_EDGE_MASK})!important;
            -webkit-mask-size:100% calc(100% - var(--kb852-mobile-desktop-pov-vine-height) + 2px),var(--kb852-mobile-desktop-pov-vine-width) var(--kb852-mobile-desktop-pov-vine-height)!important;
            -webkit-mask-position:center top,center bottom!important;
            -webkit-mask-repeat:no-repeat,no-repeat!important;
            mask-image:linear-gradient(#000 0 0),url(${KB_CHURCH_VIDEO_STEM_EDGE_MASK})!important;
            mask-size:100% calc(100% - var(--kb852-mobile-desktop-pov-vine-height) + 2px),var(--kb852-mobile-desktop-pov-vine-width) var(--kb852-mobile-desktop-pov-vine-height)!important;
            mask-position:center top,center bottom!important;
            mask-repeat:no-repeat,no-repeat!important;
          }
          html body .kb-church-marketplace-hero .kb-church-marketplace-hero-vine{
            bottom:-64px!important;
            left:50%!important;
            right:auto!important;
            width:var(--kb852-mobile-desktop-pov-vine-width)!important;
            min-width:var(--kb852-mobile-desktop-pov-vine-width)!important;
            max-width:var(--kb852-mobile-desktop-pov-vine-width)!important;
            height:95px!important;
            min-height:95px!important;
            transform:translateX(-50%)!important;
            z-index:20!important;
            background-image:var(--kb852-vine-art)!important;
            background-repeat:no-repeat!important;
            background-size:var(--kb852-mobile-desktop-pov-vine-width) 95px!important;
            background-position:center center!important;
            overflow:visible!important;
          }
          html body .kb-church-marketplace-hero .kb-church-marketplace-mode-switch{position:absolute!important;top:14px!important;right:14px!important;left:auto!important;bottom:auto!important;transform:none!important;display:inline-flex!important;align-items:center!important;gap:2px!important;width:auto!important;max-width:calc(100vw - 28px)!important;height:30px!important;min-height:30px!important;padding:3px!important;}
          html body .kb-church-marketplace-hero .kb-church-marketplace-mode-switch button{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;width:auto!important;height:24px!important;min-height:24px!important;padding:0 9px!important;font-size:9px!important;line-height:1!important;letter-spacing:.075em!important;white-space:nowrap!important;}
          .kb-church-marketplace-hero-video,.kb-church-marketplace-hero-poster{object-position:66% 50%;background-position:66% 50%;}
          .kb-church-marketplace-hero-scrim{background:linear-gradient(90deg,rgba(5,17,11,.96) 0%,rgba(6,18,12,.86) 58%,rgba(6,16,11,.42) 100%),rgba(5,13,9,.10);}
          .kb-church-marketplace-hero-content{padding:84px 18px 67px!important;}
          .kb-church-marketplace-hero-copy{width:100%;}
          .kb-church-marketplace-hero-kicker{font-size:10.5px;letter-spacing:.19em;margin-bottom:8px!important;}
          .kb-church-marketplace-hero h1{font-size:clamp(34px,10vw,44px)!important;line-height:1.01!important;}
          .kb-church-marketplace-hero-copy > p{font-size:14.5px!important;line-height:1.4!important;margin-top:10px!important;max-width:430px;}
          .kb-church-marketplace-hero-actions{gap:10px;margin:0!important;flex-wrap:nowrap;}
          .kb-church-marketplace-hero-actions button{height:44px!important;min-width:0!important;flex:1 1 0!important;padding:0 10px!important;border-radius:13px!important;font-size:12px!important;}
          .kb-church-marketplace-trust{align-items:center!important;gap:9px 13px;margin-top:14px!important;flex-wrap:wrap;}
          .kb-church-marketplace-trust-item{font-size:11.5px;}
          .kb-church-marketplace-trust-item svg{width:20px;height:20px;}
          .kb-church-marketplace-trust-rule{display:none;}
          .kb-church-marketplace-directory-panel{margin-top:0!important;padding-top:34px!important;z-index:1!important;}
          .kb-church-marketplace-context-line{align-items:center;gap:6px;margin-bottom:11px;flex-wrap:wrap;font-size:13px;}
          .kb-church-marketplace-context-line > span{white-space:normal;}
          .kb-church-marketplace-project-select{max-width:min(100%,270px);}
          .kb-church-marketplace-directory-panel .kb-vendor-toolbar,
          .kb-church-marketplace-directory-panel .kb-vendor-toolbar.has-clear{grid-template-columns:minmax(0,1fr) minmax(0,1fr);}
          .kb-church-marketplace-directory-panel .kb-vendor-search{grid-column:1/-1;}
          .kb-church-marketplace-directory-panel .kb-vendor-clear{grid-column:1/-1;}
          html body .workspace-body-shell.marketplace-body-shell .kb-church-marketplace-page > .kb-live-shell,
          html body .kb-church-marketplace-page > .kb-live-shell{position:relative!important;z-index:1!important;padding:0 16px 42px!important;}
        }
        @media(prefers-reduced-motion:reduce){.kb-church-marketplace-hero-actions button{transition:none!important;}}
        .kb-vendor-marketplace-page .kb-live-shell{width:min(100%,1368px);margin:0 auto;padding:0 30px 54px;}
        .kb-vendor-marketplace-page .kb-live-vendor-kicker{font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#9B7A35;margin:0 0 6px;}
        .kb-vendor-marketplace-page .kb-live-all-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:0 0 12px;padding:0 2px;}
        .kb-vendor-marketplace-page .kb-live-all-head h2{margin:0;font-family:'Playfair Display','Newsreader',Georgia,serif;font-size:clamp(27px,3.1vw,38px);line-height:1;letter-spacing:-.04em;color:#10110f;font-weight:800;}
        .kb-vendor-head-right{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap;}
        .kb-vendor-head-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .kb-vendor-head-action{height:34px;border-radius:999px;border:1px solid rgba(28,40,20,.12);background:rgba(255,253,248,.78);color:#1C2814;padding:0 13px;font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;font-family:inherit;box-shadow:0 1px 2px rgba(28,40,20,.035);}
        .kb-vendor-head-action:hover{border-color:rgba(176,136,64,.32);background:#fffdf8;transform:translateY(-1px);}
        .kb-vendor-head-action.is-gold{background:linear-gradient(180deg,#d9b965,#caa247);border-color:rgba(109,82,29,.16);color:#1C2814;box-shadow:0 8px 18px rgba(176,136,64,.18);}
        .kb-market-mode-switch{display:inline-flex;align-items:center;gap:3px;height:34px;padding:3px;border-radius:999px;border:1px solid rgba(28,40,20,.10);background:rgba(255,253,248,.58);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 1px 2px rgba(28,40,20,.025);}
        .kb-market-mode-switch button{height:26px;border:0;border-radius:999px;background:transparent;color:#5d6258;padding:0 11px;font:inherit;font-size:9.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;white-space:nowrap;}
        .kb-market-mode-switch button.is-active{background:#1C2814;color:#fffdf8;box-shadow:0 6px 14px rgba(28,40,20,.12);}
        .kb-market-mode-switch button:not(.is-active):hover{background:rgba(28,40,20,.055);color:#1C2814;}
        .kb-vendor-marketplace-page .kb-live-all-count{font-family:'DM Sans',Inter,sans-serif;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#9B7A35;}
        .kb-vendor-toolbar{display:grid;grid-template-columns:minmax(240px,1fr) 180px auto;gap:10px;align-items:center;margin:0 0 12px;padding:10px;border:1px solid rgba(176,136,64,.18);border-radius:18px;background:rgba(255,253,248,.78);box-shadow:0 10px 24px rgba(28,40,20,.055);}
        .kb-vendor-search{height:42px;border:1px solid rgba(28,40,20,.12);border-radius:13px;background:#fffdf8;padding:0 13px;font:inherit;font-size:13px;font-weight:600;color:#1C2814;outline:none;}
        .kb-vendor-search:focus{border-color:rgba(176,136,64,.55);box-shadow:0 0 0 3px rgba(176,136,64,.12);}
        .kb-vendor-select{height:42px;border:1px solid rgba(28,40,20,.12);border-radius:13px;background:#fffdf8;padding:0 12px;font:inherit;font-size:12px;font-weight:800;color:#1C2814;outline:none;}
        .kb-vendor-clear{height:42px;border:1px solid rgba(28,40,20,.12);border-radius:13px;background:#fffdf8;color:#4b5246;font:inherit;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:0 13px;cursor:pointer;}
        .kb-vendor-clear:hover{border-color:rgba(176,136,64,.38);color:#1C2814;}
        .kb-vendor-chips{display:flex;align-items:center;gap:7px;overflow-x:auto;padding:0 2px 10px;margin:0 0 4px;scrollbar-width:none;}
        .kb-vendor-chips::-webkit-scrollbar{display:none;}
        .kb-vendor-chip{height:32px;border:1px solid rgba(28,40,20,.11);background:rgba(255,253,248,.72);border-radius:999px;padding:0 12px;font:inherit;font-size:11px;font-weight:800;color:#4f594c;white-space:nowrap;cursor:pointer;}
        .kb-vendor-chip.is-on{background:#1C2814;color:#fffdf8;border-color:#1C2814;box-shadow:0 8px 18px rgba(28,40,20,.12);}
        .kb-vendor-marketplace-page .kb-live-all-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;align-items:stretch;}
        .kb-vendor-marketplace-page .kb-live-card-wrap{position:relative;min-width:0;}
        .kb-vendor-marketplace-page .kb-live-card{position:relative;display:block;width:100%;border:1px solid rgba(28,40,20,.08);border-radius:19px;overflow:hidden;background:#172116;box-shadow:0 14px 32px rgba(28,40,20,.13);cursor:pointer;text-align:left;min-height:0;}
        .kb-vendor-marketplace-page .kb-live-grid-card{aspect-ratio:1/1;padding:0;}
        .kb-vendor-marketplace-page .kb-live-card-img{position:absolute;inset:-1px;background-size:cover;background-position:center;background-repeat:no-repeat;transform:scale(1.01);filter:saturate(1.04) contrast(1.04);}
        .kb-vendor-marketplace-page .kb-live-card-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.03) 28%,rgba(0,0,0,.31) 58%,rgba(0,0,0,.73) 100%);z-index:1;}
        .kb-vendor-marketplace-page .kb-live-card-content{position:absolute;left:0;right:0;bottom:0;z-index:3;padding:0 12px 12px;background:none;border:0;border-radius:0;box-shadow:none;backdrop-filter:none;display:flex;flex-direction:column;gap:4px;align-items:stretch;}
        .kb-vendor-marketplace-page .kb-live-all-category{display:inline-flex;align-self:flex-start;margin:0;padding:0;border:0;background:none;font-size:7.5px;font-weight:800;letter-spacing:.17em;text-transform:uppercase;color:rgba(214,163,62,.94);text-shadow:0 1px 5px rgba(0,0,0,.52);line-height:1;}
        .kb-vendor-marketplace-page .kb-live-card-content h3{margin:0;padding:0;font-family:'DM Sans',Inter,system-ui,sans-serif;font-size:13.5px;font-weight:800;line-height:1.2;letter-spacing:-.028em;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.55);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:normal;text-align:left;}
        .kb-vendor-marketplace-page .kb-live-all-summary{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;font-size:9.5px;line-height:1.24;font-weight:600;color:rgba(255,253,248,.82);text-shadow:0 1px 5px rgba(0,0,0,.52);}
        .kb-vendor-marketplace-page .kb-vendor-match-summary strong{color:#fffdf8;font-weight:800;}
        .kb-vendor-marketplace-page .kb-vendor-match-summary{color:rgba(255,253,248,.88)!important;}
        .kb-vendor-marketplace-page .kb-live-brief-facts{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:2px;}
        .kb-vendor-marketplace-page .kb-live-brief-fact{display:flex;flex-direction:column;gap:1px;min-width:0;padding:6px 7px;border:1px solid rgba(255,255,255,.14);border-radius:10px;background:rgba(255,255,255,.105);box-shadow:inset 0 1px 0 rgba(255,255,255,.08);}
        .kb-vendor-marketplace-page .kb-live-brief-fact-label{font-size:7px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:rgba(255,253,248,.56);line-height:1;}
        .kb-vendor-marketplace-page .kb-live-brief-fact-value{font-size:10.5px;font-weight:800;line-height:1.08;color:#fffdf8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .kb-vendor-marketplace-page .kb-live-save-badge,.kb-vendor-compare-badge{position:absolute;z-index:5;top:9px;width:30px;height:30px;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:rgba(15,20,13,.42);color:#fffdf8;display:grid;place-items:center;cursor:pointer;backdrop-filter:blur(9px);box-shadow:0 7px 16px rgba(0,0,0,.18);}
        .kb-vendor-marketplace-page .kb-live-save-badge{right:9px;}
        .kb-vendor-compare-badge{right:45px;font-size:12px;font-weight:800;}
        .kb-vendor-marketplace-page .kb-live-save-badge.is-on{background:rgba(201,164,92,.92);border-color:rgba(255,255,255,.42);color:#1C2814;}
        .kb-vendor-marketplace-page .kb-live-card:hover{transform:translateY(-2px);box-shadow:0 18px 40px rgba(28,40,20,.18);border-color:rgba(201,164,92,.26);}
        .kb-vendor-empty{grid-column:1/-1;border:1px solid rgba(28,40,20,.10);border-radius:20px;background:rgba(255,253,248,.76);padding:28px;text-align:center;color:rgba(28,40,20,.62);font-size:13px;}
        .kb-vendor-pager{display:flex;justify-content:center;gap:8px;margin-top:18px;}
        .kb-vendor-pager button{height:34px;border-radius:999px;border:1px solid rgba(28,40,20,.12);background:#fffdf8;color:#1C2814;font:inherit;font-size:11px;font-weight:800;padding:0 12px;cursor:pointer;}
        .kb-vendor-pager button.on{background:#1C2814;color:#fffdf8;border-color:#1C2814;}
        .kb-vendor-pager button:disabled{opacity:.42;cursor:not-allowed;}
        @media(max-width:1180px){.kb-vendor-marketplace-page .kb-live-all-grid{grid-template-columns:repeat(3,minmax(0,1fr));}}
        /* Mobile rules for this component consolidated into a single block —
           see FIND-VENDORS-MOBILE-CONSOLIDATED below (search that string). */
        /* 853v — exact desktop parity with the Church Projects right rail.
           No left-side copy, hero, video, vine, mask, clay, or directory rules. */
        @media(min-width:1101px){
          html body .kb-church-marketplace-hero .kb-church-marketplace-control-rail{
            justify-self:end!important;
            align-self:start!important;
            width:min(100%,438px)!important;
            height:auto!important;
            grid-template-rows:34px 84px auto!important;
            row-gap:0!important;
            margin:0!important;
          }
          html body .kb-church-marketplace-hero .kb-church-marketplace-mode-switch{
            position:static!important;
            grid-row:1!important;
            justify-self:end!important;
            align-self:start!important;
            margin:0!important;
          }
          html body .kb-church-marketplace-hero .kb-church-marketplace-hero-actions{display:none!important;}
          html body .kb-church-marketplace-hero .kb-church-marketplace-trust{
            grid-row:3!important;
            align-items:center!important;
            justify-content:center!important;
            gap:14px!important;
            width:100%!important;
            margin:0!important;
            flex-wrap:nowrap!important;
          }
          html body .kb-church-marketplace-hero .kb-church-marketplace-trust-item{
            gap:6px!important;
            font-size:11px!important;
            line-height:1!important;
          }
          html body .kb-church-marketplace-hero .kb-church-marketplace-trust-item svg{
            width:18px!important;
            height:18px!important;
          }
          html body .kb-church-marketplace-hero .kb-church-marketplace-trust-rule{
            display:block!important;
            width:4px!important;
            height:4px!important;
            border-radius:999px!important;
            background:rgba(214,170,72,.72)!important;
          }
          html body .kb-church-marketplace-page .kb-church-marketplace-context-line{
            display:grid!important;
            grid-template-columns:minmax(0,1fr) auto!important;
            align-items:center!important;
            gap:18px!important;
          }
          html body .kb-church-marketplace-page .kb-church-marketplace-context-copy{
            display:flex!important;
            align-items:center!important;
            gap:7px!important;
            min-width:0!important;
            flex-wrap:wrap!important;
          }
          html body .kb-church-marketplace-page .kb-marketplace-below-seam-action--find-vendors{
            display:inline-flex!important;
            align-items:center!important;
            justify-content:space-between!important;
            gap:14px!important;
            min-width:168px!important;
            height:40px!important;
            padding:0 16px 0 18px!important;
            border-radius:12px!important;
            border:1px solid rgba(214,170,72,.74)!important;
            background:linear-gradient(180deg,rgba(40,71,37,.98),rgba(24,48,27,.98))!important;
            color:#fffdf8!important;
            box-shadow:0 10px 22px rgba(0,0,0,.12),inset 0 1px 0 rgba(255,255,255,.08)!important;
            font-family:'DM Sans',system-ui,sans-serif!important;
            font-size:12px!important;
            font-weight:800!important;
            letter-spacing:.01em!important;
            white-space:nowrap!important;
            cursor:pointer!important;
          }
          html body .kb-church-marketplace-page .kb-marketplace-below-seam-action--find-vendors .kb-marketplace-below-seam-action-arrow{
            color:#d6aa48!important;
            font-size:16px!important;
            line-height:1!important;
            transition:transform .16s ease,color .16s ease!important;
          }
          html body .kb-church-marketplace-page .kb-marketplace-below-seam-action--find-vendors:hover{
            transform:translateY(-1px)!important;
            border-color:rgba(224,184,88,.94)!important;
            box-shadow:0 12px 24px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.10)!important;
          }
          html body .kb-church-marketplace-page .kb-marketplace-below-seam-action--find-vendors:hover .kb-marketplace-below-seam-action-arrow{
            transform:translateX(3px)!important;
            color:#e1b957!important;
          }
        }
      `}</style>

      {isChurchMarketplace ? (
        <ChurchMarketplaceHero
          isActive={isActive}
          onPost={onPost}
          onChurchProjects={onBack}
          onBrowse={() => {
            if (directoryRef.current && typeof directoryRef.current.scrollIntoView === 'function') {
              directoryRef.current.scrollIntoView({ behavior:'smooth', block:'start' });
            }
          }}
        />
      ) : null}

      <div className="kb-live-shell" ref={isChurchMarketplace ? null : directoryRef}>
        <div ref={isChurchMarketplace ? directoryRef : null} className={isChurchMarketplace ? 'kb-church-marketplace-directory-panel' : 'kb-market-ivory-command-basin kb-market-ivory-command-basin--find-vendors kb-audit-vine-seam'}>
          {isChurchMarketplace ? (
            <>
              {founderCoverageContext && (
                <div style={{marginBottom:14,padding:"14px 16px",border:"1px solid rgba(176,136,64,0.24)",borderRadius:18,background:"linear-gradient(135deg,rgba(255,247,234,0.94),rgba(255,253,248,0.96))",boxShadow:"0 12px 30px rgba(28,40,20,0.08)"}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:10,fontWeight:800,letterSpacing:".14em",textTransform:"uppercase",color:"#9a7434",marginBottom:5}}>Founder coverage context</div>
                      <div style={{display:"inline-flex",alignItems:"center",gap:6,marginBottom:7,padding:"4px 7px",borderRadius:999,background:"rgba(154,116,52,0.08)",border:"1px solid rgba(154,116,52,0.15)",fontSize:9,fontWeight:800,color:"#9a7434"}}>Opened from Founder Brief</div>
                      <div style={{fontSize:16,fontWeight:800,color:"#1C2814",lineHeight:1.2,marginBottom:5}}>{founderCoverageContext.projectTitle || founderCoverageContext.title || "Find qualified vendors"}</div>
                      <div style={{fontSize:12,color:"rgba(28,40,20,0.64)",lineHeight:1.55,maxWidth:680}}>{founderCoverageContext.reason || "Use this focused vendor directory pass to find qualified coverage for the marketplace gap."}</div>
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
                      <button type="button" className="kb-live-all-empty-link" style={{fontSize:12,fontWeight:800,whiteSpace:"nowrap"}} onClick={()=>typeof nav === "function" && nav("admin")}>Back to Founder Brief</button>
                      <button type="button" className="kb-live-all-empty-link" style={{fontSize:12,fontWeight:800,whiteSpace:"nowrap"}} onClick={clearFounderCoverageContext}>Clear context</button>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:10}}>
                    {founderCoverageContext.category && <span className="kb-live-chip active">Service: {founderCoverageContext.category}</span>}
                    {founderCoverageContext.geography && <span className="kb-live-chip">Area: {founderCoverageContext.geography}</span>}
                    {founderCoverageContext.projectId && <span className="kb-live-chip">Project linked</span>}
                  </div>
                </div>
              )}
              <div className="kb-church-marketplace-context-line">
                <div className="kb-church-marketplace-context-copy">
                  {projectSelectionOptions.length ? (
                    <>
                      <span>Vendors recommended for your</span>
                      <select
                        className="kb-church-marketplace-project-select"
                        aria-label="Project used for vendor recommendations"
                        value={inviteProjectId}
                        onChange={handleSelectedVendorProjectChange}
                      >
                        {projectSelectionOptions.map(project => (
                          <option key={project.id} value={project.id}>{project.title || project.name || 'Untitled project'}</option>
                        ))}
                      </select>
                      <span>project.</span>
                    </>
                  ) : (
                    <span>Browse trusted vendors for your ministry. Post a project to unlock project-scored invites.</span>
                  )}
                  <details className="kb-church-marketplace-match-info">
                    <summary aria-label="How FaithBid recommendations work" title="How recommendations work">i</summary>
                    <div className="kb-church-marketplace-match-note" role="note">
                      FaithBid is still building platform history. Early recommendations rely on verified profile data, service fit, budget fit, and self-reported church experience. We only show proof points when they are real.
                    </div>
                  </details>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',justifyContent:'flex-end'}}>
                  <button type="button" className="kb-marketplace-below-seam-action kb-marketplace-below-seam-action--find-vendors" onClick={handleProjectContextRecovery}>
                    <span>{hasProjectContext ? 'Post a Project' : 'Add Project Context'}</span>
                    <span className="kb-marketplace-below-seam-action-arrow" aria-hidden="true">→</span>
                  </button>
                  <button type="button" className="kb-marketplace-saved-route-link" onClick={() => typeof nav === 'function' && nav('saved-projects')} title="Open your saved project list" style={{height:34,border:'none',background:'transparent',padding:'0 2px',fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'#8A6729',cursor:'pointer',whiteSpace:'nowrap',boxShadow:'none'}}>
                    Saved Projects →
                  </button>
                </div>
              </div>

              <div className={`kb-vendor-toolbar${activeFilterCount > 0 ? ' has-clear' : ''}`}>
                <input
                  className="kb-vendor-search"
                  aria-label="Search vendors"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search vendors or services…"
                />
                <select className="kb-vendor-select" aria-label="Filter by service" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="All">All services</option>
                  {chips.filter(([label]) => label !== 'All').map(([label]) => <option key={label} value={label}>{label}</option>)}
                </select>
                <select className="kb-vendor-select" aria-label="Sort vendors" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="Best overall">Best match</option>
                  <option value="Top rated">Top rated</option>
                  <option value="Most projects">Most projects</option>
                  <option value="Recently added">Recently added</option>
                </select>
                {activeFilterCount > 0 ? <button type="button" className="kb-vendor-clear" onClick={clearVendorFilters}>Clear</button> : null}
              </div>
            </>
          ) : (
            <>
              <div className="kb-lite-page-head kb-lite-page-head--myprojects kb-unified-workspace-head">
                <div>
                  <div className="kb-lite-page-kicker">— Marketplace —</div>
                  <h1>Recommended Vendors</h1>
                  <p>Build your shortlist from explainable, church-focused vendor recommendations across FaithBid.</p>
                </div>
                <div className="kb-lite-page-actions kb-vendor-lite-actions">
                  {isHirerMarketplace ? (
                    <>
                      <div className="kb-market-mode-switch" aria-label="Church marketplace views">
                        <button type="button" className="is-active" aria-label="Recommended Vendors" aria-pressed="true">Vendors</button>
                        <button type="button" aria-label="Church Projects" onClick={onBack}>Projects</button>
                      </div>
                      <button type="button" className="kb-lite-action is-primary" onClick={onPost}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Post a project
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              <div
                aria-label="Recommended Vendors honesty note"
                style={{
                  margin: '0 0 12px',
                  padding: '12px 14px',
                  borderRadius: 16,
                  border: '1px solid rgba(176,136,64,.20)',
                  background: 'rgba(255,253,248,.76)',
                  color: '#4f594c',
                  fontSize: 12,
                  fontWeight: 600,
                  lineHeight: 1.55,
                }}
              >
                FaithBid is still building platform history. Early recommendations rely on verified profile data, service fit, budget fit, and self-reported church experience. We only show proof points when they are real.
              </div>

              {isHirerMarketplace && !projectSelectionOptions.length ? (
                <div
                  aria-label="Project context needed for vendor recommendations"
                  style={{
                    margin: '0 0 12px',
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: '1px solid rgba(176,136,64,.22)',
                    background: 'linear-gradient(135deg,rgba(255,247,234,.86),rgba(255,253,248,.92))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ minWidth: 210 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9a7a35' }}>Project context needed</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1C2814', marginTop: 2 }}>Post or select a project to score vendors against real scope, budget, service area, and invite readiness.</div>
                  </div>
                  <button type="button" onClick={handleProjectContextRecovery} style={{height:36,padding:'0 14px',borderRadius:999,border:'1px solid rgba(176,136,64,.32)',background:'#1C2814',color:'#fffdf8',fontSize:12,fontWeight:800,cursor:'pointer'}}>Post a project</button>
                </div>
              ) : null}

              {isHirerMarketplace && projectSelectionOptions.length ? (
                <div
                  aria-label="Selected project for vendor recommendations"
                  style={{
                    margin: '0 0 12px',
                    padding: '10px 12px',
                    borderRadius: 14,
                    border: '1px solid rgba(28,40,20,.10)',
                    background: 'rgba(255,253,248,.62)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ minWidth: 190 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9a7a35' }}>Project context</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1C2814', marginTop: 2 }}>Recommendations and invites are scoped to this project.</div>
                  </div>
                  <select
                    value={inviteProjectId}
                    onChange={handleSelectedVendorProjectChange}
                    style={{
                      minWidth: 240,
                      height: 36,
                      borderRadius: 999,
                      border: '1px solid rgba(28,40,20,.16)',
                      background: '#fffdf8',
                      color: '#1C2814',
                      fontSize: 12,
                      fontWeight: 800,
                      padding: '0 12px',
                      outline: 'none',
                    }}
                  >
                    {projectSelectionOptions.map(project => (
                      <option key={project.id} value={project.id}>{project.title || project.name || 'Untitled project'}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="kb-vendor-toolbar">
                <input className="kb-vendor-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors, categories, service area..." />
                <select className="kb-vendor-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option>Best overall</option>
                  <option>Top rated</option>
                  <option>Most projects</option>
                  <option>Recently added</option>
                </select>
                <button type="button" className="kb-vendor-clear" onClick={clearVendorFilters}>Clear</button>
              </div>

              <div className="kb-vendor-chips" aria-label="Vendor categories">
                {chips.map(([label, count]) => (
                  <button key={label} type="button" className={`kb-vendor-chip${category === label ? ' is-on' : ''}`} onClick={() => setCategory(label)}>
                    {label}{label === 'All' ? ` ${count}` : ''}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {vendorsLoading ? (
          <KBSkeleton variant="list" count={4} style={{maxWidth:920,margin:'20px auto'}} />
        ) : (
          <div className="kb-live-all-grid">
            {pagedVendors.length === 0 ? (
              <div className="kb-vendor-empty">No vendors match those filters. <button type="button" className="kb-live-all-empty-link" onClick={clearVendorFilters}>Clear filters →</button></div>
            ) : pagedVendors.map((vendor, index) => {
              const vendorKey = String(vendor?.id || vendor?.user_id || vendor?.name || index);
              const isSaved = effectiveSavedVendorIds.has(vendorKey);
              const categoryLabel = getProjectCardCategoryLabel(vendorProjectShape(vendor), vendor.specialty || vendor.category || 'Vendor');
              const image = vendorImageFor(vendor, index);
              const recommendedFit = vendor.recommendedFit || computeRecommendedVendorFit(vendor, matchContextProject, viewerCity);
              const recommendedPresentation = getRecommendedFitPresentation(recommendedFit);
              const ratingLabel = Number(vendor.rating || 0) > 0 ? `${Number(vendor.rating).toFixed(1)}★` : 'New';
              const inviteKey = getInviteKey(vendor);
              const vendorDeal = vendorDealStateByKey.get(vendorKey) || {};
              const displayDealState = vendorDeal.displayDealState || 'not_contacted';
              const dealStatusLabel = vendorDeal.dealSummary?.statusLabel || getDealStateSummary(displayDealState, { role: 'church' }).statusLabel;
              const hasInviteProject = !!String(matchContextProject?.id || '').trim();
              const hasInviteUser = !!String(currentUser?.id || '').trim();
              const isInviting = invitingVendorKeys.has(inviteKey);
              const inviteDisabled = !hasInviteProject ? false : (!hasInviteUser || isInviting || displayDealState !== 'not_contacted');
              const inviteLabel = getInviteButtonLabelForDealState(displayDealState, { isInviting, hasProject: hasInviteProject, hasUser: hasInviteUser });
              const matchPercent = Math.max(0, Math.min(100, Number(
                recommendedFit?.score
                ?? recommendedFit?.percent
                ?? String(recommendedPresentation.scoreLabel || '').match(/\d+/)?.[0]
                ?? 0
              ) || 0));
              return (
                <div key={vendorKey} className="kb-live-card-wrap">
                  <FaithBidCard11A
                    image={image}
                    imageAlt=""
                    title={vendor.name}
                    topLabel={String(dealStatusLabel || 'Available').toUpperCase()}
                    topTone="green"
                    avatarText={getInitialsSafe(vendor.name || 'Vendor')}
                    meta={`${vendor.city || vendor.service_city || 'Remote delivery'} · ${categoryLabel}`}
                    value={ratingLabel}
                    matchPercent={matchPercent}
                    actionLabel={hasInviteProject ? inviteLabel : 'View profile'}
                    actionDisabled={hasInviteProject && inviteDisabled}
                    onOpen={() => handleOpenVendor(vendor)}
                    onAction={(event) => hasInviteProject ? handleInviteVendor(vendor, event) : handleOpenVendor(vendor)}
                    saved={isSaved}
                    onToggleSave={(event) => toggleSave(vendor, event)}
                    ariaLabel={`Open ${vendor.name} vendor profile`}
                  />
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="kb-vendor-pager">
            <button type="button" onClick={() => changePage(safePage - 1)} disabled={safePage === 1}>Prev</button>
            {Array.from({ length: Math.min(totalPages, 6) }).map((_, idx) => {
              const pageNum = totalPages <= 6 ? idx + 1 : safePage <= 3 ? idx + 1 : safePage >= totalPages - 2 ? totalPages - 5 + idx : safePage - 2 + idx;
              if (pageNum < 1 || pageNum > totalPages) return null;
              return <button key={pageNum} type="button" className={pageNum === safePage ? 'on' : ''} onClick={() => changePage(pageNum)}>{pageNum}</button>;
            })}
            <button type="button" onClick={() => changePage(safePage + 1)} disabled={safePage === totalPages}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

function EditVendorProfile({ vendor = {}, onBack = () => {}, onSave = async () => {}, showToast = () => {} }) {
  const [form, setForm] = useState(() => ({
    name: firstNonEmpty(vendor?.name, ''),
    category: firstNonEmpty(vendor?.category, ''),
    city: firstNonEmpty(vendor?.city, ''),
    tagline: firstNonEmpty(vendor?.tagline, vendor?.headline, ''),
    bio: firstNonEmpty(vendor?.bio, ''),
    delivery_model: normalizeDeliveryModel(vendor?.delivery_model),
    service_radius_miles: String(vendor?.service_radius_miles || ''),
    response_time: firstNonEmpty(vendor?.response_time, vendor?.response_sla, ''),
    faith_statement: firstNonEmpty(vendor?.faith_statement, ''),
  }));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(vendor?.image_url || vendor?.thumb_url || null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = React.useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo must be under 5 MB.', 'error');
      return;
    }
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      showToast('Please choose a JPG, PNG, or WebP image.', 'error');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result || null);
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async () => {
    if (!photoFile || !vendor?.user_id) return null;
    setPhotoUploading(true);
    try {
      const ext = photoFile.type === 'image/png' ? 'png' : photoFile.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `vendor-photos/${vendor.user_id}/profile.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('vendor-assets')
        .upload(path, photoFile, { upsert: true, contentType: photoFile.type });
      if (upErr) { logError('vendor-photo-upload', upErr, { userId: vendor.user_id }); return null; }
      const { data: urlData } = supabase.storage.from('vendor-assets').getPublicUrl(path);
      // Append cache-buster so updated photo shows immediately
      return urlData?.publicUrl ? `${urlData.publicUrl}?v=${Date.now()}` : null;
    } catch (err) {
      logError('vendor-photo-upload-unexpected', err);
      return null;
    } finally {
      setPhotoUploading(false);
    }
  };

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError('');
    try {
      let imageUrl = null;
      if (photoFile) {
        imageUrl = await uploadPhoto();
        if (!imageUrl) {
          setSaveError('Photo upload failed — try a smaller image or different format.');
          return;
        }
      }
      const updates = {
        ...form,
        headline: form.tagline,
        service_radius_miles: form.service_radius_miles ? Number(form.service_radius_miles) || null : null,
        ...(imageUrl ? { image_url: imageUrl, thumb_url: imageUrl } : {}),
      };
      await Promise.resolve(onSave && onSave(updates));
    } catch (err) {
      logError('edit-vendor-profile-save', err);
      setSaveError('Couldn\'t save profile — please try again.');
    } finally {
      setSaving(false);
    }
  };
  const evx = {
    shell:{background:"#faf8f4",minHeight:"100vh",paddingBottom:60},
    topbar:{maxWidth:980,margin:"0 auto",padding:"22px 28px 0",display:"flex",alignItems:"center",gap:12},
    backPill:{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px 7px 11px",borderRadius:999,background:"#fffdf8",border:"1px solid #dfd5c2",color:"#1C2814",fontSize:12.5,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",transition:"all 0.15s",boxShadow:"0 4px 12px rgba(28,40,20,0.04)"},
    crumb:{fontSize:11.5,color:"#7d7363",fontFamily:"'DM Mono',monospace",letterSpacing:0.6,textTransform:"uppercase",fontWeight:600},
    headWrap:{maxWidth:980,margin:"0 auto",padding:"22px 28px 22px"},
    headPanel:{background:"#fffdf8",border:"1px solid #dfd5c2",borderRadius:22,padding:"28px 30px 26px",boxShadow:"0 7px 20px rgba(28,40,20,0.045)"},
    eyebrow:{fontFamily:"'DM Mono',monospace",fontSize:10.5,fontWeight:700,letterSpacing:2.4,textTransform:"uppercase",color:"#b08840",marginBottom:10},
    headline:{fontFamily:"'Playfair Display',Georgia,serif",fontSize:36,fontWeight:700,color:"#1C2814",letterSpacing:-0.7,lineHeight:1.05,margin:0},
    sub:{fontSize:14,color:"#5a5246",lineHeight:1.55,maxWidth:560,marginTop:8},
    panel:{background:"#fff",border:"1px solid #dfd5c2",borderRadius:18,boxShadow:"0 6px 18px rgba(28,40,20,0.04)",overflow:"hidden",marginBottom:18},
    panelHd:{padding:"16px 22px 14px",background:"#fffdf8",borderBottom:"1px solid #ece4d2"},
    panelEyebrow:{fontFamily:"'DM Mono',monospace",fontSize:9.5,fontWeight:700,letterSpacing:1.8,textTransform:"uppercase",color:"#b08840"},
    panelTitle:{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:700,color:"#1C2814",letterSpacing:-0.3,marginTop:2},
    panelBody:{padding:"22px"},
    label:{display:"block",fontSize:11.5,fontWeight:700,letterSpacing:0.6,textTransform:"uppercase",color:"#5a5246",marginBottom:8,fontFamily:"'DM Sans',sans-serif"},
    input:{width:"100%",height:46,padding:"0 14px",borderRadius:12,border:"1.5px solid #dfd5c2",background:"#fffdf8",fontSize:14,color:"#1C2814",fontFamily:"'DM Sans',sans-serif",outline:"none",transition:"border-color 0.15s,box-shadow 0.15s",boxSizing:"border-box"},
    textarea:{width:"100%",padding:"12px 14px",borderRadius:12,border:"1.5px solid #dfd5c2",background:"#fffdf8",fontSize:14,color:"#1C2814",fontFamily:"'DM Sans',sans-serif",outline:"none",transition:"border-color 0.15s,box-shadow 0.15s",boxSizing:"border-box",resize:"vertical",lineHeight:1.55},
    btnPrimary:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"11px 22px",borderRadius:999,background:"linear-gradient(180deg,#c9a45c,#b08840)",color:"#fff",fontSize:13,fontWeight:700,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",letterSpacing:0.2,boxShadow:"0 4px 12px rgba(176,136,64,0.25),inset 0 1px 0 rgba(255,255,255,0.18)",transition:"all 0.15s"},
    btnSecondary:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 20px",borderRadius:999,background:"#fffdf8",color:"#1C2814",fontSize:13,fontWeight:600,border:"1px solid #dfd5c2",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"},
    onFocus:(e)=>{e.currentTarget.style.borderColor="#b08840";e.currentTarget.style.boxShadow="0 0 0 3px rgba(176,136,64,0.12)";},
    onBlur:(e)=>{e.currentTarget.style.borderColor="#dfd5c2";e.currentTarget.style.boxShadow="none";},
  };
  return (
    <div style={evx.shell}>
      {/* Top bar */}
      <div style={evx.topbar}>
        <button type="button" onClick={onBack} style={evx.backPill} onMouseOver={e=>{e.currentTarget.style.background="#fffaf0";e.currentTarget.style.borderColor="#c9a45c";}} onMouseOut={e=>{e.currentTarget.style.background="#fffdf8";e.currentTarget.style.borderColor="#dfd5c2";}}>
          <span style={{fontSize:14,lineHeight:1}}>←</span> Back to profile
        </button>
        <span style={{color:"#c8bfa9"}}>·</span>
        <span style={evx.crumb}>Edit vendor profile</span>
      </div>

      {/* Cream headline section */}
      <div style={evx.headWrap}>
        <div style={evx.headPanel}>
          <div style={evx.eyebrow}>Vendor profile</div>
          <h1 style={evx.headline}>Edit your public profile</h1>
          <div style={evx.sub}>Update the information churches see in the directory without leaving the marketplace flow.</div>
        </div>
      </div>

      {/* Form */}
      <div style={{maxWidth:980,margin:"0 auto",padding:"0 28px 60px"}}>

        {/* Profile photo panel */}
        <div style={evx.panel}>
          <div style={evx.panelHd}>
            <div style={evx.panelEyebrow}>Profile photo</div>
            <div style={evx.panelTitle}>Your photo</div>
          </div>
          <div style={{...evx.panelBody, display:'flex', alignItems:'center', gap:24, flexWrap:'wrap'}}>
            {/* Avatar preview */}
            <div style={{position:'relative',flexShrink:0}}>
              <div style={{width:88,height:88,borderRadius:20,overflow:'hidden',border:'2px solid #dfd5c2',background:'linear-gradient(135deg,#5b7a5e,#3d5940)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:800,color:'#fff',letterSpacing:0.5}}>
                {photoPreview
                  ? <img src={photoPreview} alt="Profile preview" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  : <span>{String(form.name || vendor?.name || 'V').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</span>
                }
              </div>
              {photoUploading && (
                <div style={{position:'absolute',inset:0,borderRadius:20,background:'rgba(28,40,20,0.55)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" style={{animation:'spin 0.7s linear infinite'}} aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                </div>
              )}
            </div>
            {/* Upload controls */}
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:13,color:'#5a5246',lineHeight:1.6,marginBottom:14}}>
                Upload a professional headshot or logo. JPG, PNG, or WebP — max 5 MB.
                {photoPreview && photoPreview !== (vendor?.image_url || vendor?.thumb_url) && (
                  <span style={{display:'block',marginTop:4,fontSize:11.5,color:'#2F855A',fontWeight:600}}>✓ New photo ready — save profile to apply</span>
                )}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                style={{display:'none'}}
                aria-label="Upload profile photo"
              />
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                <button
                  type="button"
                  onClick={()=>photoInputRef.current?.click()}
                  disabled={photoUploading}
                  style={{height:38,padding:'0 16px',borderRadius:11,border:'1.5px solid #dfd5c2',background:'#fffdf8',color:'#1C2814',fontSize:12.5,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",display:'inline-flex',alignItems:'center',gap:7}}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  {photoPreview ? 'Change photo' : 'Upload photo'}
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={()=>{ setPhotoPreview(null); setPhotoFile(null); if(photoInputRef.current) photoInputRef.current.value=''; }}
                    style={{height:38,padding:'0 14px',borderRadius:11,border:'1px solid rgba(220,38,38,0.22)',background:'rgba(220,38,38,0.04)',color:'#b1342a',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={evx.panel}>
          <div style={evx.panelHd}>
            <div style={evx.panelEyebrow}>Listing</div>
            <div style={evx.panelTitle}>Directory listing</div>
          </div>
          <div style={evx.panelBody}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:16,marginBottom:16}}>
              <div>
                <label style={evx.label} htmlFor="evp-name">Name</label>
                <input id="evp-name" value={form.name} onChange={e=>update('name', e.target.value)} style={evx.input} onFocus={evx.onFocus} onBlur={evx.onBlur}/>
              </div>
              <div>
                <label style={evx.label} htmlFor="evp-cat">Category</label>
                <input id="evp-cat" value={form.category} onChange={e=>update('category', e.target.value)} style={evx.input} onFocus={evx.onFocus} onBlur={evx.onBlur}/>
              </div>
              <div>
                <label style={evx.label} htmlFor="evp-city">City</label>
                <input id="evp-city" value={form.city} onChange={e=>update('city', e.target.value)} style={evx.input} onFocus={evx.onFocus} onBlur={evx.onBlur}/>
              </div>
              <div>
                <label style={evx.label} htmlFor="evp-tag">Tagline <span style={{fontWeight:400,color:'rgba(28,40,20,0.35)',textTransform:'none',letterSpacing:0,fontSize:10}}>{form.tagline.length}/120</span></label>
                <input id="evp-tag" value={form.tagline} onChange={e=>update('tagline', e.target.value.slice(0,120))} maxLength={120} style={{...evx.input, borderColor: form.tagline.length > 108 ? 'rgba(220,38,38,0.4)' : undefined}} onFocus={evx.onFocus} onBlur={evx.onBlur}/>
              </div>
              <div>
                <label style={evx.label} htmlFor="evp-del">Delivery model</label>
                <select id="evp-del" value={form.delivery_model} onChange={e=>update('delivery_model', e.target.value)} style={evx.input} onFocus={evx.onFocus} onBlur={evx.onBlur}>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>
              <div>
                <label style={evx.label} htmlFor="evp-rad">Service radius (miles)</label>
                <input id="evp-rad" value={form.service_radius_miles} onChange={e=>update('service_radius_miles', e.target.value)} style={evx.input} onFocus={evx.onFocus} onBlur={evx.onBlur}/>
              </div>
            </div>
            <div style={{display:"grid",gap:16}}>
              <div>
                <label style={evx.label} htmlFor="evp-resp">Response time</label>
                <input id="evp-resp" value={form.response_time} onChange={e=>update('response_time', e.target.value)} placeholder="e.g. Within 24 hours" style={evx.input} onFocus={evx.onFocus} onBlur={evx.onBlur}/>
              </div>
              <div>
                <label style={evx.label} htmlFor="evp-bio">Bio <span style={{fontWeight:400,color: form.bio.length > 450 ? '#b1342a' : 'rgba(28,40,20,0.35)',textTransform:'none',letterSpacing:0,fontSize:10}}>{form.bio.length}/500</span></label>
                <textarea id="evp-bio" value={form.bio} onChange={e=>update('bio', e.target.value.slice(0,500))} rows={5} maxLength={500} style={{...evx.textarea, borderColor: form.bio.length > 450 ? 'rgba(220,38,38,0.40)' : undefined}} onFocus={evx.onFocus} onBlur={evx.onBlur}/>
              </div>
              <div>
                <label style={evx.label} htmlFor="evp-faith">Faith statement <span style={{fontWeight:400,color: form.faith_statement.length > 720 ? '#b1342a' : 'rgba(28,40,20,0.35)',textTransform:'none',letterSpacing:0,fontSize:10}}>{form.faith_statement.length}/800</span></label>
                <textarea id="evp-faith" value={form.faith_statement} onChange={e=>update('faith_statement', e.target.value.slice(0,800))} rows={4} maxLength={800} style={{...evx.textarea, borderColor: form.faith_statement.length > 720 ? 'rgba(220,38,38,0.40)' : undefined}} onFocus={evx.onFocus} onBlur={evx.onBlur}/>
              </div>
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8,flexWrap:'wrap',alignItems:'center'}}>
          {saveError && <div role="alert" style={{flex:1,fontSize:12.5,color:'#a23b3b',fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>{saveError}</div>}
          <button type="button" style={evx.btnSecondary} onClick={onBack}>Cancel</button>
          <button type="button" style={{...evx.btnPrimary,opacity:(saving || !String(form.name || '').trim())?0.5:1,cursor:(saving || !String(form.name || '').trim())?"not-allowed":"pointer",display:'inline-flex',alignItems:'center',gap:6}} onClick={submit} disabled={saving || !String(form.name || '').trim()} aria-busy={saving}>
            {saving ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{animation:'spin 0.7s linear infinite',flexShrink:0}} aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Saving…
              </>
            ) : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

const VENDOR_PROFILE_BRAND = {
  ink: "#1C2814",
  muted: "#7d7363",
  mid: "#565862",
  cream: "#fffdf8",
  cream2: "#faf6ed",
  border: "#dfd5c2",
  borderSoft: "#efe7d9",
  gold: "#b08840",
  goldDark: "#8a6a2e",
};

const VENDOR_PROFILE_PANEL_STYLE = {
  background: "#fff",
  border: "1px solid #dfd5c2",
  borderRadius: 16,
  overflow: "hidden",
  boxShadow: "0 1px 2px rgba(28,40,20,0.035)",
};

const VENDOR_PROFILE_PANEL_HD_STYLE = {
  padding: "12px 16px",
  background: "#fffdf8",
  borderBottom: "1px solid #efe7d9",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const VENDOR_PROFILE_PANEL_TITLE_STYLE = {
  fontFamily: "'Playfair Display','Newsreader',Georgia,serif",
  fontSize: 16,
  fontWeight: 700,
  color: "#1C2814",
  letterSpacing: "-0.01em",
};

const VENDOR_PROFILE_PANEL_BODY_STYLE = { padding: 16 };

const VENDOR_PROFILE_KICKER_STYLE = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  color: "#b08840",
};

const VENDOR_PROFILE_PRIMARY_BUTTON_STYLE = {
  height: 38,
  padding: "0 16px",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(180deg,#203018,#142110)",
  color: "#fffdf8",
  fontSize: 12.5,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(28,40,20,0.14)",
};

const VENDOR_PROFILE_SECONDARY_BUTTON_STYLE = {
  height: 38,
  padding: "0 14px",
  borderRadius: 999,
  border: "1px solid rgba(28,40,20,0.14)",
  background: "#fffdf8",
  color: "#1C2814",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
};

function VendorProfilePanel({ title, children, style = {}, headerStyle = {}, bodyStyle = {}, right = null }) {
  return (
    <div style={{ ...VENDOR_PROFILE_PANEL_STYLE, ...style }}>
      {title && (
        <div style={{ ...VENDOR_PROFILE_PANEL_HD_STYLE, ...headerStyle }}>
          <div style={VENDOR_PROFILE_PANEL_TITLE_STYLE}>{title}</div>
          {right}
        </div>
      )}
      <div style={{ ...VENDOR_PROFILE_PANEL_BODY_STYLE, ...bodyStyle }}>{children}</div>
    </div>
  );
}

function VendorProfileStatTile({ label, value, hint = null, accent = false }) {
  return (
    <div style={{ padding: "14px 15px", borderRadius: 14, border: "1px solid #dfd5c2", background: accent ? "linear-gradient(135deg,#fffdf8,#faf6ed)" : "#fffdf8" }}>
      <div style={{ ...VENDOR_PROFILE_KICKER_STYLE, color: accent ? "#8a6a2e" : "#7d7363", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Playfair Display','Newsreader',Georgia,serif", fontSize: 24, fontWeight: 700, color: "#1C2814", lineHeight: 1.05 }}>{value}</div>
      {hint && <div style={{ marginTop: 6, fontSize: 12, color: "#565862", lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

function VendorPortfolioTab({ vendor = {}, isOwner = false }) {
  const gallery = Array.isArray(vendor?.gallery) ? vendor.gallery.filter(Boolean) : [];
  const items = Array.isArray(vendor?.portfolio_items) ? vendor.portfolio_items.filter(Boolean) : [];

  if (!gallery.length && !items.length) {
    return (
      <VendorProfilePanel title="Portfolio notes">
        <div style={{ fontSize: 13.5, color: "#565862", lineHeight: 1.75, fontWeight: 400 }}>
          {isOwner ? "Add a few portfolio images or case-study notes to make your public profile feel more credible." : "This vendor has not added portfolio notes yet."}
        </div>
      </VendorProfilePanel>
    );
  }

  return (
    <VendorProfilePanel title="Portfolio notes" bodyStyle={{ display: "grid", gap: 12 }}>
      {items.slice(0, 6).map((item, idx) => (
        <div key={`portfolio-item-${idx}`} style={{ border: "1px solid #dfd5c2", borderRadius: 16, padding: "15px 16px", background: "linear-gradient(135deg,#fffdf8,#faf6ed)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1C2814", marginBottom: 6 }}>{firstNonEmpty(item.title, `Portfolio item ${idx + 1}`)}</div>
          <div style={{ fontSize: 13, color: "#565862", lineHeight: 1.7 }}>{firstNonEmpty(item.note, item.description, "Representative work relevant to church teams.")}</div>
          {item?.url ? <a href={item.url} target="_blank" rel="noreferrer" onClick={event=>event.stopPropagation()} style={{display:"inline-flex",marginTop:9,fontSize:12,fontWeight:800,color:"#8a6729",textDecoration:"none"}}>View work ↗</a> : null}
        </div>
      ))}
      {!items.length && gallery.length ? (
        <div style={{ fontSize: 13.5, color: "#565862", lineHeight: 1.7 }}>Gallery images are live on this profile. Add case-study notes to strengthen the story behind the work.</div>
      ) : null}
    </VendorProfilePanel>
  );
}

function VendorProfile({vendor:v = {}, onBack = () => {}, nav = () => {}, onEdit = null, role = '', showToast = () => {}, contextProjects = [], currentUser: currentUserProp = null}){
  const [tab, setTab] = useState("about");
  const [currentUserSelf, setCurrentUserSelf] = useState(null);
  const [portfolioItems, setPortfolioItems] = useState(() => Array.isArray(v?.portfolio_items) ? v.portfolio_items.filter(Boolean) : []);
  const currentUser = currentUserProp ?? currentUserSelf;
  const [elderApplying, setElderApplying] = useState(false);
  const [elderForm, setElderForm] = useState({elderName:"", elderTitle:"", elderEmail:"", church:"", statement:""});
  const [elderSubmitted, setElderSubmitted] = useState(false);
  const [elderLoading, setElderLoading] = useState(false);
  const [profileToast, setProfileToast] = useState("");
  const viewportWidth = useViewportWidth(1440);
  const isMobile = viewportWidth < KB_BP_MOBILE;
  const [profileVendorPairSignalMaps, setProfileVendorPairSignalMaps] = useState(() => makeEmptyVendorPairSignalMaps());
  const [profileVendorPairSignalRefreshKey, setProfileVendorPairSignalRefreshKey] = useState(0);
  const profileVendorPairSignalRefreshTimerRef = useRef(null);

  useEffect(() => {
    const name = v.name || v.business_name || 'Vendor';
    const cat = v.category ? ` · ${v.category}` : '';
    const city = v.city ? ` in ${v.city}` : '';
    const desc = v.tagline || v.bio
      ? String(v.tagline || v.bio).slice(0, 155)
      : `${v.category || 'Vendor'} profile${city} on FaithBid.`;
    const restore = setPageMeta({
      title: `${name}${cat} — FaithBid`,
      description: desc,
    });
    return restore;
  }, [v.name, v.business_name, v.category, v.city, v.tagline, v.bio]);

  useEffect(() => {
    let alive = true;
    getCurrentUserSafe().then(user => { if (alive) setCurrentUserSelf(user || null); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const vendorUserId = String(v?.user_id || '').trim();
    if (!vendorUserId) {
      setPortfolioItems(Array.isArray(v?.portfolio_items) ? v.portfolio_items.filter(Boolean) : []);
      return () => { cancelled = true; };
    }
    (async () => {
      try {
        const { data, error } = await supabase.from('vendor_portfolio_items')
          .select('id,vendor_id,type,title,description,url,source,display_order,created_at')
          .eq('vendor_id', vendorUserId)
          .order('display_order', { ascending:true })
          .order('created_at', { ascending:true });
        if (error) throw error;
        if (!cancelled) setPortfolioItems(Array.isArray(data) ? data : []);
      } catch (error) {
        // Owner/public read access is governed by RLS. Preserve any hydrated seed items if this viewer cannot read.
        if (kbIsDevRuntime()) console.warn('[kb:vendor-portfolio-public-read]', error);
      }
    })();
    return () => { cancelled = true; };
  }, [v?.user_id]);

  const isOwner = currentUser && v.user_id === currentUser.id;
  const isVendorViewingPeer = role === 'vendor' && !isOwner;
  const isElderEndorsed = false; // P0-A: Elder Endorsed quarantined from active UI.
  const elderPending = false;
  const initials = getInitialsSafe(v.name, 'VN');
  const vendorHeroImage = getVendorPrimaryImage(v);
  const vendorPresentation = getVendorProfilePresentation(v);
  const deliveryBadge = getVendorDeliveryBadge(v);
  const profileTags = vendorPresentation.tags;
  const stars = "★".repeat(Math.round(v.rating||5));
  const identityBadges = vendorPresentation.identityBadges;
  const bestFitItems = vendorPresentation.bestFitItems;
  const proofPoints = vendorPresentation.proofPoints;
  const caseStudies = vendorPresentation.caseStudies;
  const profileSnapshot = vendorPresentation.profileSnapshot;
  const reviewCount = Number(v.reviews_count || v.reviews || 0);
  const projectCount = Number(v.projects_count || v.projects || 0);
  const ratingValue = Number(v.rating || 0) || 0;
  const ratingLabel = ratingValue > 0 ? `${ratingValue.toFixed(1)} ★` : 'Not rated';
  const responseSignal = firstNonEmpty(v.response_sla, v.response_time, '');
  const primaryResponseLabel = responseSignal || 'Not specified';
  const serviceAreaSignal = firstNonEmpty(v.service_area, Array.isArray(v.service_regions) ? v.service_regions.join(', ') : null, v.city, '');
  const serviceAreaLabel = serviceAreaSignal || 'Not specified';
  const churchSizeSignal = Array.isArray(v.church_sizes_served) && v.church_sizes_served.length > 0 ? v.church_sizes_served.join(', ') : (Array.isArray(v.church_size_fit) && v.church_size_fit.length > 0 ? v.church_size_fit.slice(0,3).join(', ') : '');
  const churchSizeLabel = churchSizeSignal || 'Not specified';
  const hasDeliverySignal = Boolean(firstNonEmpty(v.delivery_model, v.service_model, ''));
  const returnContext = readReturnContext();
  const profileChurchId = String(currentUser?.id || '').trim();
  const normalizedContextProjects = useMemo(() => safeArray(contextProjects).map(p => normalizeProjectEntity(p)).filter(Boolean), [contextProjects]);
  const profileStoredProjectSelection = useMemo(() => profileChurchId ? readSelectedVendorProject(profileChurchId) : null, [profileChurchId]);
  const profileStoredProjectSnapshot = useMemo(() => normalizeProjectEntity(profileStoredProjectSelection?.projectSnapshot || null), [profileStoredProjectSelection]);
  const profileProjectOptions = useMemo(() => {
    const seen = new Set();
    const list = [];
    const add = (project) => {
      const normalized = normalizeProjectEntity(project);
      const id = String(normalized?.id || '').trim();
      if (!id || seen.has(id)) return;
      seen.add(id);
      list.push(normalized);
    };
    safeArray(normalizedContextProjects).forEach(add);
    if (profileStoredProjectSnapshot) add(profileStoredProjectSnapshot);
    return list;
  }, [normalizedContextProjects, profileStoredProjectSnapshot]);
  const profileProjectForDeal = useMemo(() => {
    const storedProjectId = String(firstNonEmpty(profileStoredProjectSelection?.projectId, profileStoredProjectSelection?.id, '')).trim();
    if (storedProjectId) {
      const validatedProject = profileProjectOptions.find(p => String(p?.id || '').trim() === storedProjectId);
      if (validatedProject) return validatedProject;
      if (profileStoredProjectSnapshot && String(profileStoredProjectSnapshot?.id || '').trim() === storedProjectId) return profileStoredProjectSnapshot;
    }
    return profileProjectOptions.find(p => ['open','review','draft'].includes(String(p.status || 'draft'))) || null;
  }, [profileProjectOptions, profileStoredProjectSelection, profileStoredProjectSnapshot]);
  const profileProjectId = String(firstNonEmpty(profileProjectForDeal?.id, returnContext?.projectId, returnContext?.linkedProjectId, '')).trim();
  const projectContextLabel = profileProjectForDeal || returnContext?.projectId || returnContext?.linkedProjectId ? 'Best for the project you were just reviewing' : null;
  const profileInteropEntry = profileProjectId ? getProjectInteropEntry(profileProjectId) : null;
  const profileProjectTitle = firstNonEmpty(
    returnContext?.projectTitle,
    returnContext?.linkedProjectTitle,
    profileProjectForDeal?.title,
    null,
  );
  const profileLinkState = profileProjectId ? (profileInteropEntry?.vendorsById?.[String(v.id)] || profileInteropEntry?.vendorsById?.[String(v.user_id || '')] || null) : null;
  const canProjectContextActions = !!profileProjectId && !!currentUser && !isOwner && isHirerRole(role);
  const profileBackLabel = returnContext?.scope === 'compare' ? '← Back to Compare' : profileProjectId ? '← Back to Project' : '← Back to Vendors';
  const profileStageMeta = profileLinkState ? (PROJECT_VENDOR_STAGE_META?.[profileLinkState.stage] || null) : null;
  const profileStageLabel = profileStageMeta?.label || (profileLinkState?.stageLabel || 'Watching');
  const profileVendorId = String(firstNonEmpty(v?.id, v?.vendor_id, v?.user_id, '')).trim();
  const profileVendorUserId = String(firstNonEmpty(v?.user_id, v?.vendor_user_id, v?.vendor_id, v?.id, '')).trim();
  useEffect(() => {
    let cancelled = false;
    if (!profileProjectId || !currentUser?.id) {
      setProfileVendorPairSignalMaps(makeEmptyVendorPairSignalMaps());
      return () => { cancelled = true; };
    }
    fetchVendorPairSignalMaps({ projectId: profileProjectId, churchId: currentUser?.id })
      .then((maps) => {
        if (cancelled) return;
        setProfileVendorPairSignalMaps(maps || makeEmptyVendorPairSignalMaps());
      })
      .catch(() => {
        if (!cancelled) setProfileVendorPairSignalMaps(makeEmptyVendorPairSignalMaps());
      });
    return () => { cancelled = true; };
  }, [profileProjectId, currentUser?.id, profileVendorPairSignalRefreshKey]);

  useEffect(() => {
    return () => {
      if (profileVendorPairSignalRefreshTimerRef.current) {
        clearTimeout(profileVendorPairSignalRefreshTimerRef.current);
        profileVendorPairSignalRefreshTimerRef.current = null;
      }
    };
  }, []);

  const scheduleProfileVendorPairSignalRefresh = () => {
    if (profileVendorPairSignalRefreshTimerRef.current) {
      clearTimeout(profileVendorPairSignalRefreshTimerRef.current);
    }
    profileVendorPairSignalRefreshTimerRef.current = setTimeout(() => {
      profileVendorPairSignalRefreshTimerRef.current = null;
      setProfileVendorPairSignalRefreshKey(prev => prev + 1);
    }, 700);
  };

  const profileEngineBucket = useMemo(() => {
    if (!profileProjectForDeal || !profileProjectId || !currentUser?.id || !isHirerRole(role)) return null;
    const now = new Date().toISOString();
    return buildVendorPairSignals({
      vendorId: profileVendorId,
      vendorUserId: profileVendorUserId,
      project: profileProjectForDeal,
      maps: profileVendorPairSignalMaps,
      role: 'church',
      now,
    });
  }, [profileVendorId, profileVendorUserId, profileProjectForDeal, profileProjectId, profileVendorPairSignalMaps, role, currentUser?.id]);
  const profileEngineDealState = profileEngineBucket ? deriveCanonicalDealState(profileEngineBucket) : null;
  const profileDealSummary = profileEngineDealState ? getDealStateSummary(profileEngineDealState, { role:'church', linkedBid: profileEngineBucket?.linkedBid || null }) : null;
  const profileRecommendedFit = useMemo(() => {
    if (v?.recommendedFit) return v.recommendedFit;
    if (profileProjectForDeal && isHirerRole(role)) return computeRecommendedVendorFit(v, profileProjectForDeal, currentUser?.city || currentUser?.profile?.city || '');
    return null;
  }, [v, profileProjectForDeal, role, currentUser?.city, currentUser?.profile?.city]);
  const profileRecommendedPresentation = profileRecommendedFit ? getRecommendedFitPresentation(profileRecommendedFit) : null;
  const saveVendorToCompare = () => {
    const compareResult = upsertCompareWorkspaceItem('vendors', {
      id: v.id || v.user_id || v.name,
      initials,
      name: v.name,
      role: v.headline || v.category || 'Vendor',
      city: v.city || 'Location not provided',
      rating: Number(v.rating || 0),
      reviews: Number(v.reviews_count || v.reviews || 0),
      badge: vendorPresentation.compareBadge,
      gradient: 'linear-gradient(145deg,#5b7a5e,#3d5940)',
      price: v.price_range || 'Custom proposal',
      recommendation_snapshot: profileRecommendedFit ? {
        source: 'vendor_profile_ai_matching',
        created_at: new Date().toISOString(),
        lens: 'Vendor profile',
        fit_label: profileRecommendedFit.label || '',
        reasons: safeArray(profileRecommendedFit.reasons).filter(Boolean),
        watchout: profileRecommendedFit.watchout || '',
        ranking_score: Number(profileRecommendedFit.rankingScore || profileRecommendedFit?.rail?.rankingScore || 0) || 0,
        distribution_tier: profileRecommendedFit.distributionTier || profileRecommendedFit?.rail?.distributionTier || '',
        needs_human_review: !!profileRecommendedFit.needsHumanReview,
        hard_eligibility_passed: profileRecommendedFit.hardEligibilityPassed !== false,
        project_id: profileProjectId || null,
        project_title: profileProjectTitle || null,
      } : null,
      match_context_project: profileProjectForDeal || v.match_context_project || null,
    });
    if (compareResult?.compareLimitReached) {
      setProfileToast(getCompareWorkspaceLimitMessage('vendors'));
      return;
    }
    queueCompareNavigation(nav, { returnContext:{ scope:'vendor-profile', projectId: profileProjectId || null, linkedProjectId: profileProjectId || null, projectTitle: profileProjectTitle || null, linkedProjectTitle: profileProjectTitle || null, vendorId: v.id || v.user_id || null, tab } });
    setProfileToast('Saved to activity workspace');
  };
  const applyProfileStage = (stage) => {
    if (!canProjectContextActions) return;
    if (!profileProjectId) return;
    const stageMeta = PROJECT_VENDOR_STAGE_META?.[stage] || { label:'Watching' };
    upsertProjectVendorLink(profileProjectId, { ...v, id:v.id || v.user_id, user_id:v.user_id || v.id }, stage, {
      source:'profile',
      attentionText:`${v.name} is now ${stageMeta.label.toLowerCase()} for this project`,
      notificationText:`${v.name} moved to ${stageMeta.label.toLowerCase()} from vendor profile`,
    });
    rememberReturnContext({ scope:'vendor-profile', projectId: profileProjectId, projectTitle: profileProjectTitle || null, vendorId: v.id || v.user_id, stage });
    if (['invited','shortlisted','hired'].includes(stage)) scheduleProfileVendorPairSignalRefresh();
    // When the church explicitly invites this vendor to bid, also start a
    // conversation thread so the vendor sees the invitation in their inbox.
    // Mirrors SuggestedVendorsAfterPost.invite's conversations.upsert pattern.
    // Fire-and-forget: local stage flag still updates above even if this fails.
    if (stage === "invited" && v?.user_id && currentUser?.id && profileProjectId) {
      supabase.from("conversations").upsert({
        church_id: currentUser.id,
        vendor_id: v.user_id,
        church_name: currentUser?.user_metadata?.org_name || profileInteropEntry?.projectSnapshot?.church || "",
        vendor_name: v.name || "",
        project_id: profileProjectId,
        project_title: profileProjectTitle || "",
        last_message: `Hi — I'd like to invite you to bid on this project. Happy to answer questions if the scope is a fit.`,
        last_message_at: new Date().toISOString(),
      }, { onConflict: "church_id,vendor_id,project_id" }).select("id").single().then(async ({ data: conversation, error }) => {
        if (error) {
          logError("vendor-profile-invite-conversation", error, { projectId: profileProjectId, vendorUserId: v.user_id });
          return;
        }
        if (typeof showToast === "function") {
          showToast(`Invited ${v.name}`);
        }
        let createdMessage = null;
        try {
          const { data, error: messageError } = await supabase.from("messages").insert({
            conversation_id: conversation.id,
            sender_id: currentUser.id,
            text: `Hi — I'd like to invite you to bid on this project. Happy to answer questions if the scope is a fit.`,
          }).select("id").maybeSingle();
          createdMessage = data || null;
          if (messageError) {
            logError("vendor-profile-invite-message", messageError, { projectId: profileProjectId, vendorUserId: v.user_id, conversationId: conversation?.id });
          }
        } catch (messageErr) {
          logError("vendor-profile-invite-message", messageErr, { projectId: profileProjectId, vendorUserId: v.user_id, conversationId: conversation?.id });
        }
        try {
          if (createdMessage?.id) {
            const { error: notificationError } = await createTrustedNotificationSafe("bid_invitation", createdMessage.id);
            if (notificationError) throw notificationError;
          }
        } catch (notificationErr) {
          logError("vendor-profile-invite-notification", notificationErr, { projectId: profileProjectId, conversationId: conversation?.id, messageId: createdMessage?.id || null });
        }
      });
    }
  };


  const submitElderEndorsement = async () => {
    if (!elderForm.elderName || !elderForm.elderEmail || !elderForm.church) return;
    setElderLoading(true);
    try {
      await supabase.from("vendor_endorsements").insert({
        vendor_id: v.id,
        vendor_name: v.name,
        elder_name: elderForm.elderName,
        elder_title: elderForm.elderTitle,
        elder_email: elderForm.elderEmail,
        church: elderForm.church,
        statement: elderForm.statement,
        status: "pending",
        created_at: new Date().toISOString(),
      });
      await supabase.from("vendors").update({ elder_endorsement_status: "pending" }).eq("id", v.id);
      setElderSubmitted(true);
    } catch(e) { logError('elder-endorsement-insert', e, { vendorId: v?.id }); }
    setElderLoading(false);
  };

  useEffect(() => {
    if (!profileToast) return;
    const timer = setTimeout(() => setProfileToast(''), 3500);
    return () => clearTimeout(timer);
  }, [profileToast]);

  const canStartVendorConversation = Boolean(v?.user_id || v?.vendor_id || v?.id);
  const vendorContactLabel = canProjectContextActions ? 'Message about this project →' : `Contact ${v.name?.split(" ")[0] || 'vendor'} →`;
  const vendorAvailabilityLabel = canProjectContextActions ? 'Check availability for this project →' : 'Check availability & contact →';
  const openVendorConversationFromProfile = async (source = 'vendor-profile-cta') => {
    try {
      await startConversation(v, nav, profileProjectId || null, profileProjectTitle || null);
      if (canProjectContextActions) rememberReturnContext({ scope:'vendor-profile', projectId: profileProjectId || null, projectTitle: profileProjectTitle || null, vendorId: v.id || v.user_id || null, tab, source });
    } catch(e){
      logError(source, e, { vendorId: v?.id, projectId: profileProjectId || null });
    }
  };

  const profileDealPrimary = (() => {
    if (!canProjectContextActions) {
      const firstName = (v.name || 'Vendor').split(' ')[0];
      return {
        label: `Message ${firstName}`,
        action: () => openVendorConversationFromProfile('vendor-profile-no-project-message'),
        disabled: !canStartVendorConversation,
      };
    }
    const s = profileEngineDealState || 'not_contacted';
    if (s === 'invited' || s === 'no_response') return {
      label: 'Message about this project',
      action: () => openVendorConversationFromProfile('vendor-profile-message-invited'),
      disabled: !canStartVendorConversation,
    };
    if (s === 'bid_placed' || s === 'bid_under_review') return {
      label: 'Review bid & decide',
      action: () => queueProjectNavigation(nav, { projectId: profileProjectId, projectTitle: profileProjectTitle, screen: KB_NAV_SCREENS.projects, tab: 'bids', returnContext: { scope:'vendor-profile', projectId:profileProjectId, vendorId:v.id||v.user_id, tab } }),
      disabled: false,
    };
    if (s === 'hired' || s === 'active' || s === 'milestone_pending') return {
      label: 'Open workspace',
      action: () => queueProjectNavigation(nav, { projectId: profileProjectId, projectTitle: profileProjectTitle, screen: KB_NAV_SCREENS.projects, tab: 'overview', returnContext: { scope:'vendor-profile', projectId:profileProjectId, vendorId:v.id||v.user_id, tab } }),
      disabled: false,
    };
    if (s === 'completed' || s === 'disputed') return {
      label: 'View history',
      action: () => openVendorConversationFromProfile('vendor-profile-view-history'),
      disabled: !canStartVendorConversation,
    };
    return {
      label: 'Invite to bid',
      action: () => applyProfileStage('invited'),
      disabled: !canProjectContextActions || !canStartVendorConversation,
    };
  })();

  const profileDealShowMessageSecondary =
    canProjectContextActions &&
    canStartVendorConversation &&
    profileDealPrimary.label !== 'Message about this project';

  const vendorTabLabels = { about:'Summary', portfolio:'Proof', availability:'Availability', reviews:'Reviews' };

  return (
    <div className="page-shell-cream vendor-profile-premium">
      {/* Top bar — Project Detail style */}
      <div style={{padding:'10px 16px',background:'#f4f0e7',borderBottom:'1px solid #e7dfd1',display:'flex',alignItems:'center',gap:12}}>
        <button type="button" onClick={onBack} style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:13,fontWeight:600,color:'#1C2814',padding:'7px 14px',borderRadius:999,border:'1px solid rgba(28,40,20,0.12)',background:'#fffdf8',cursor:'pointer',boxShadow:'0 1px 2px rgba(0,0,0,0.04)',flexShrink:0}}>{profileBackLabel}</button>
        <div style={{fontSize:12.5,color:'#a8aab4',minWidth:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>Vendors <span style={{color:'#c9c5be'}}>·</span> <span style={{color:'#1C2814',fontWeight:600}}>{firstNonEmpty(v.name, 'Vendor profile')}</span></div>
      </div>

      {/* Premium vendor trust header */}
      <div style={{padding:isMobile?'14px 14px 12px':'18px 24px 16px',background:'linear-gradient(180deg,#fffdf8 0%,#fbf6ea 100%)',borderBottom:'1px solid #efe7d9'}}>
        <div style={{maxWidth:1120,margin:'0 auto'}}>
          <div className="vendor-profile-hero-shell" style={{padding:isMobile?'16px':'18px 22px 16px',borderRadius:22,border:'1px solid #e8dfcb',background:'linear-gradient(135deg,#ffffff 0%,#fffdf8 58%,#faf4e7 100%)',boxShadow:'0 10px 28px rgba(28,40,20,0.055)'}}>
            <div className="vendor-header-row" style={{display:"flex",alignItems:"flex-start",gap:18,paddingBottom:0}}>
              {/* Avatar */}
              <div style={{
                width:58,height:58,borderRadius:16,flexShrink:0,
                background:"linear-gradient(135deg,#1C2814,#34432b)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:20,fontWeight:800,color:"#d5b873",letterSpacing:0.5,
                border:"3px solid #fff",boxShadow:"0 8px 22px rgba(28,40,20,0.13)",
                overflow:"hidden",
              }}>
                {vendorHeroImage
                  ? <img src={vendorHeroImage} alt={v.name || 'Vendor'} loading="lazy" onError={handleKbImageError} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                  : initials}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:8}}>
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:10,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:'#b08840'}}>Vendor diligence profile</span>
                  <span style={{width:4,height:4,borderRadius:999,background:'#d6c08a'}} />
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:'#7d7363'}}>{v.category || 'Church vendor'}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:7}}>
                  <h1 style={{fontFamily:"'Playfair Display','Newsreader',Georgia,serif",fontSize:'clamp(25px,3.2vw,34px)',fontWeight:700,color:'#1C2814',letterSpacing:'-0.035em',lineHeight:1.02,wordBreak:'break-word',margin:0}}>{firstNonEmpty(v.name, 'Unnamed Vendor')}</h1>
                  {identityBadges.length > 0 && <BadgeRow badges={identityBadges} />}
                </div>
                <div style={{fontSize:13.5,color:'#565862',lineHeight:1.55,maxWidth:660,marginBottom:10}}>
                  {firstNonEmpty(v.headline, v.bio ? String(v.bio).slice(0, 130) : null, v.category || 'Vendor profile')}{v.city ? ` · ${v.city}` : ''}
                </div>
                <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
                  {hasDeliverySignal && <span style={{padding:'6px 11px',borderRadius:999,background:'rgba(28,40,20,0.045)',border:'1px solid rgba(28,40,20,0.10)',fontSize:10.5,fontWeight:800,color:'#1C2814',letterSpacing:0.04}}>{deliveryBadge.label}</span>}
                  {hasDeliverySignal && deliveryBadge.radius > 0 && normalizeDeliveryModel(v.delivery_model) !== 'remote' && <span style={{padding:'6px 11px',borderRadius:999,background:'rgba(176,136,64,0.10)',border:'1px solid rgba(176,136,64,0.18)',fontSize:10.5,fontWeight:800,color:'#8a6a2e',letterSpacing:0.04}}>{deliveryBadge.radius} mile radius</span>}
                  {profileTags.slice(0,3).map(tag => <span key={tag} style={{padding:'6px 11px',borderRadius:999,background:'#fff',border:'1px solid #e8dfcb',fontSize:10.5,fontWeight:800,color:'#565862'}}>{tag}</span>)}
                </div>
              </div>
              {/* Action buttons */}
              <div className="vendor-header-actions vendor-profile-hero-actions" style={{display:"flex",gap:8,flexShrink:0,flexWrap:'wrap',justifyContent:'flex-end'}}>
                {onEdit && <button type="button" onClick={onEdit} style={{...VENDOR_PROFILE_SECONDARY_BUTTON_STYLE,height:40,background:'#fff'}}>Edit profile</button>}
              </div>
            </div>

            <div className="vendor-profile-signal-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:8,marginTop:14}}>
              {[
                {label:'Rating', value:ratingLabel, detail:reviewCount > 0 ? `${reviewCount} review${reviewCount===1?'':'s'}` : 'No reviews yet'},
                {label:'Response', value:primaryResponseLabel, detail:responseSignal ? 'Vendor-reported response time' : 'Not provided'},
                {label:'Delivery', value:hasDeliverySignal ? deliveryBadge.marketing : 'Not specified', detail:serviceAreaLabel},
                {label:'Ministry work', value:projectCount ? `${projectCount} project${projectCount===1?'':'s'}` : 'No projects reported', detail:churchSizeLabel},
              ].map((item) => (
                <div key={item.label} style={{padding:'10px 12px',borderRadius:13,background:'rgba(255,255,255,0.72)',border:'1px solid #e8dfcb',boxShadow:'none',minWidth:0}}>
                  <div style={{...VENDOR_PROFILE_KICKER_STYLE,color:'#8a6a2e',marginBottom:5}}>{item.label}</div>
                  <div style={{fontSize:13.5,fontWeight:800,color:'#1C2814',lineHeight:1.25,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.value}</div>
                  <div style={{fontSize:11.5,color:'#7d7363',lineHeight:1.45,marginTop:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.detail}</div>
                </div>
              ))}
            </div>

            {/* Tab bar */}
            <div className="vendor-profile-tabbar" style={{display:'flex',gap:6,borderTop:'1px solid #efe7d9',marginTop:18,paddingTop:12,overflowX:'auto'}}>
              {["about","portfolio","availability","reviews"].map(t=>{
                const active = tab === t;
                return (
                  <button key={t} type="button" onClick={()=>setTab(t)} style={{fontSize:12.5,fontWeight:800,color:active?'#fffdf8':'#565862',padding:'9px 14px',border:active?'1px solid #1C2814':'1px solid #e8dfcb',background:active?'#1C2814':'rgba(255,255,255,0.76)',cursor:'pointer',position:'relative',whiteSpace:'nowrap',textTransform:'capitalize',borderRadius:999,boxShadow:active?'0 8px 18px rgba(28,40,20,0.12)':'none'}}>
                    {vendorTabLabels[t] || t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="vendor-profile-content" style={{maxWidth:1120,margin:"0 auto",padding:isMobile?"16px 16px 96px":"22px 28px 58px"}}>
        {profileToast && (
          <div style={{position:'sticky',top:74,zIndex:20,marginBottom:14,display:'flex',justifyContent:'flex-end'}}>
            <div style={{padding:'10px 14px',borderRadius:12,background:'rgba(20,21,24,0.92)',color:'#fff',fontSize:12,fontWeight:700,boxShadow:'0 8px 24px rgba(0,0,0,0.18)'}}>{profileToast}</div>
          </div>
        )}

        {/* ABOUT TAB */}
        {tab==="about" && (
          <div className="vendor-about-grid" style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 300px",gap:18,alignItems:"start"}}>
            {canProjectContextActions && (
              <div style={{gridColumn:'1 / -1',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap',padding:'14px 16px',borderRadius:14,background:'linear-gradient(135deg,rgba(176,136,64,0.10),rgba(176,136,64,0.04))',border:'1px solid rgba(176,136,64,0.16)'}}>
                <div>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:'uppercase',color:'#8a6a2e',marginBottom:4}}>Project context active</div>
                  <div style={{fontSize:14,fontWeight:700,color:'#1C2814',marginBottom:4}}>{profileProjectTitle || projectContextLabel}</div>
                  <div style={{fontSize:12,color:'#565862',lineHeight:1.6,maxWidth:620}}>Messages, compare saves, and vendor-stage actions from this profile now stay tied to the current project instead of opening a generic vendor conversation.</div>
                </div>
                <button type="button" className="btn-secondary" style={{padding:'10px 14px',fontSize:12,whiteSpace:'nowrap'}} onClick={openProjectContextBack}>{projectContextLabel}</button>
              </div>
            )}
            {profileRecommendedPresentation && (
              <div style={{gridColumn:'1 / -1',display:'grid',gridTemplateColumns:isMobile?'1fr':'96px minmax(0,1fr) auto',alignItems:'center',gap:14,padding:'15px 16px',borderRadius:16,background:'linear-gradient(135deg,#172116,#2f4327)',color:'#fffdf8',boxShadow:'0 12px 30px rgba(23,33,22,0.16)'}}>
                <div style={{width:76,height:76,borderRadius:20,display:'grid',placeItems:'center',background:'rgba(255,253,248,0.10)',border:'1px solid rgba(255,253,248,0.18)',fontSize:22,fontWeight:800,letterSpacing:'-0.04em'}}>{profileRecommendedPresentation.scoreLabel}</div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:'#d7b76e',marginBottom:5}}>AI Match for this project</div>
                  <div style={{fontSize:17,fontWeight:800,lineHeight:1.2,marginBottom:5}}>{profileRecommendedPresentation.headline}</div>
                  <div style={{fontSize:12.5,lineHeight:1.55,color:'rgba(255,253,248,0.78)',maxWidth:680}}>{profileRecommendedPresentation.summary}</div>
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:isMobile?'flex-start':'flex-end'}}>
                  {profileRecommendedPresentation.chips.slice(0,4).map(chip => <span key={chip} style={{height:28,display:'inline-flex',alignItems:'center',padding:'0 9px',borderRadius:999,background:'rgba(255,253,248,0.10)',border:'1px solid rgba(255,253,248,0.16)',fontSize:10,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'#fffdf8'}}>{chip}</span>)}
                </div>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <VendorProfilePanel title="Executive summary" right={<span style={{fontSize:11,fontWeight:800,color:'#8a6a2e',background:'rgba(176,136,64,0.10)',border:'1px solid rgba(176,136,64,0.16)',borderRadius:999,padding:'5px 9px'}}>Diligence memo</span>} bodyStyle={{display:'grid',gap:12}}>
                <div style={{fontSize:14,color:'#343833',lineHeight:1.75,fontWeight:400}}>
                  {firstNonEmpty(v.bio ? String(v.bio).slice(0, 220) : null, 'No vendor bio has been provided yet. Review the available profile fields and verified signals before making a decision.')}
                </div>
                <div className="vendor-profile-signal-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
                  {[
                    ['Best fit', bestFitItems[0] || 'Not specified yet'],
                    ['Proof signal', proofPoints[0] || 'No proof points added yet'],
                    ['Recommended action', canProjectContextActions ? 'Message or invite from this project' : 'Contact vendor or compare'],
                  ].map(([label,val]) => (
                    <div key={label} style={{padding:'13px 14px',borderRadius:14,background:'#fffdf8',border:'1px solid #e8dfcb'}}>
                      <div style={{fontSize:10,fontWeight:800,letterSpacing:1,textTransform:'uppercase',color:'#8a6a2e',marginBottom:5}}>{label}</div>
                      <div style={{fontSize:13,fontWeight:700,color:'#1C2814',lineHeight:1.45}}>{val}</div>
                    </div>
                  ))}
                </div>
              </VendorProfilePanel>
              {/* Profile narrative */}
              <div className="card">
                <div className="card-hd"><div className="card-hd-title">Profile narrative</div></div>
                <div className="card-body" style={{display:'grid',gap:14}}>
                  <div style={{fontSize:14,color:"#565862",lineHeight:1.8,fontWeight:400}}>{v.bio || "No bio provided."}</div>
                  {v.faith_statement && (
                    <div style={{padding:'13px 14px',borderRadius:13,background:'#fffdf8',border:'1px solid #e8dfcb'}}>
                      <div style={{fontSize:10,fontWeight:800,letterSpacing:1,textTransform:'uppercase',color:'#8a6a2e',marginBottom:6}}>Faith statement</div>
                      <div style={{fontSize:13.5,color:"#565862",lineHeight:1.75,fontStyle:"italic",fontWeight:400}}>"{v.faith_statement}"</div>
                    </div>
                  )}
                </div>
              </div>
              {/* References trust signal */}
              <VendorReferencesTrustBadge vendorUserId={v.user_id} />
              <div className="card">
                <div className="card-hd"><div className="card-hd-title">Best-fit churches</div></div>
                <div className="card-body">
                  <div style={{display:"grid",gap:10}}>
                    {bestFitItems.length > 0 ? bestFitItems.map((item, idx)=>(
                      <div key={idx} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"11px 13px",borderRadius:12,background:"#fffdf8",border:"1px solid #dfd5c2"}}>
                        <span style={{fontSize:12,color:"var(--gold-text)",marginTop:2}}>✦</span>
                        <span style={{fontSize:12.8,color:"#565862",lineHeight:1.6}}>{item}</span>
                      </div>
                    )) : <div style={{fontSize:12.8,color:'#7d7363',lineHeight:1.65}}>This vendor has not added best-fit guidance yet.</div>}
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-hd"><div className="card-hd-title">Operating proof</div></div>
                <div className="card-body">
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                    {[
                      ['Response', firstNonEmpty(v.response_sla, v.response_time, '')],
                      ['Service Area', firstNonEmpty(v.service_area, Array.isArray(v.service_regions) ? v.service_regions.join(', ') : '', v.city, '')],
                      ['Denominations', Array.isArray(v.denomination_experience) && v.denomination_experience.length ? v.denomination_experience.slice(0,3).join(', ') : ''],
                      ['Church Sizes', Array.isArray(v.church_size_fit) && v.church_size_fit.length ? v.church_size_fit.slice(0,3).join(', ') : ''],
                    ].filter(([, val]) => Boolean(String(val || '').trim())).map(([label,val])=>(
                      <div key={label} style={{padding:"11px 12px",borderRadius:12,background:"#fffdf8",border:"1px solid #dfd5c2"}}>
                        <div style={{fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#7d7363",marginBottom:4}}>{label}</div>
                        <div style={{fontSize:13,fontWeight:600,color:"#1C2814",lineHeight:1.55}}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"grid",gap:8}}>
                    {proofPoints.length > 0 ? proofPoints.map((item, idx)=>(
                      <div key={idx} style={{fontSize:12,color:"#565862",lineHeight:1.65,display:"flex",alignItems:"center",gap:8}}>
                        <span style={{color:"var(--success)",fontSize:12}}>✓</span>
                        <span>{item}</span>
                      </div>
                    )) : <div style={{fontSize:12,color:'#7d7363',lineHeight:1.65}}>No proof points have been added yet.</div>}
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-hd"><div className="card-hd-title">Representative work</div></div>
                <div className="card-body">
                  <div style={{display:"grid",gap:10}}>
                    {caseStudies.length > 0 ? caseStudies.map((item, idx)=>(
                      <div key={idx} style={{padding:"12px 14px",borderRadius:13,background:"#fffdf8",border:"1px solid #dfd5c2"}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#1C2814",marginBottom:4}}>{item.title}</div>
                        <div style={{fontSize:12,color:"#565862",lineHeight:1.7}}>{item.body}</div>
                      </div>
                    )) : <div style={{fontSize:12.8,color:'#7d7363',lineHeight:1.65}}>No case studies have been added yet.</div>}
                  </div>
                </div>
              </div>
              {/* Elder endorsement display */}
              {isElderEndorsed && v.elder_endorsement && (
                <div className="card" style={{borderColor:"rgba(168,85,247,0.2)"}}>
                  <div className="card-hd" style={{background:"linear-gradient(135deg,rgba(168,85,247,0.04),rgba(139,92,246,0.02))"}}>
                    <div className="card-hd-title" style={{color:"#7C3AED"}}>✝ Elder endorsement</div>
                  </div>
                  <div className="card-body">
                    <div style={{fontSize:13,color:"#565862",lineHeight:1.7,fontStyle:"italic",marginBottom:12}}>"{v.elder_endorsement.statement}"</div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:32,height:32,borderRadius:"var(--r-sm)",background:"rgba(168,85,247,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#7C3AED",flexShrink:0}}>
                        {v.elder_endorsement.elderName?.charAt(0)||"E"}
                      </div>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:"#1C2814"}}>{v.elder_endorsement.elderName}</div>
                        <div style={{fontSize:11,color:"#7d7363"}}>{v.elder_endorsement.elderTitle}{v.elder_endorsement.church?` · ${v.elder_endorsement.church}`:""}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Tags */}
              {(v.tags&&v.tags.length>0) && (
                <div className="card">
                  <div className="card-hd"><div className="card-hd-title">Specialties</div></div>
                  <div className="card-body">
                    <div className="skill-tags">{v.tags.map(t=><span key={t} className="skill-tag">{t}</span>)}</div>
                  </div>
                </div>
              )}
              {/* Video intro */}
              {v.video_intro && (
                <div className="card">
                  <div className="card-hd"><div className="card-hd-title">▶ Video introduction</div></div>
                  <div className="card-body">
                    <div style={{fontSize:12,color:"#7d7363",marginBottom:12,lineHeight:1.5}}>Meet {v.name?.split(" ")[0]} before you reach out // watch their 60-second intro.</div>
                    <a href={v.video_intro} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{textDecoration:"none"}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Watch video intro →
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="vendor-profile-sidebar" style={{display:"flex",flexDirection:"column",gap:12,position:isMobile?'static':'sticky',top:88}}>
              {!isOwner && !isVendorViewingPeer && (
                <div className="vendor-profile-deal-rail" style={{background:'#fff',borderRadius:18,border:'1px solid rgba(42,53,32,0.08)',padding:'20px',marginBottom:16}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16,gap:12}}>
                    <div style={{minWidth:0}}>
                      <div style={{...VENDOR_PROFILE_KICKER_STYLE,marginBottom:6}}>
                        {canProjectContextActions ? 'Active deal' : 'Contact vendor'}
                      </div>
                      <div style={{display:'inline-block',padding:'3px 10px',borderRadius:100,fontSize:12,fontWeight:600,background:canProjectContextActions?'#f0f7f0':'#f5f5f5',color:canProjectContextActions?'#2a5a2a':'#666'}}>
                        {canProjectContextActions ? (profileDealSummary?.statusLabel || 'No conversation yet') : 'No active project'}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Save to compare workspace"
                      title="Compare"
                      onClick={saveVendorToCompare}
                      style={{width:36,height:36,borderRadius:8,border:'1px solid rgba(42,53,32,0.12)',background:'#fafaf8',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 2.5A1.5 1.5 0 014.5 1h7A1.5 1.5 0 0113 2.5v12l-5-3-5 3v-12z" stroke="#2a3520" strokeWidth="1.4" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={profileDealPrimary.disabled}
                    onClick={profileDealPrimary.action}
                    style={{...VENDOR_PROFILE_PRIMARY_BUTTON_STYLE,width:'100%',marginBottom:profileDealShowMessageSecondary?10:0,opacity:profileDealPrimary.disabled?0.55:1,cursor:profileDealPrimary.disabled?'not-allowed':'pointer'}}
                  >
                    {profileDealPrimary.label}
                  </button>
                  {profileDealShowMessageSecondary && (
                    <button
                      type="button"
                      onClick={() => openVendorConversationFromProfile('vendor-profile-secondary-message')}
                      style={{...VENDOR_PROFILE_SECONDARY_BUTTON_STYLE,width:'100%'}}
                    >
                      Message about this project
                    </button>
                  )}
                </div>
              )}

              <VendorProfilePanel title="Trust & verification">
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {v.verified ? (
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:30,height:30,borderRadius:10,background:"rgba(176,136,64,0.10)",border:"1px solid rgba(176,136,64,0.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="#8a6a2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <div>
                        <div style={{fontSize:12.5,fontWeight:800,color:"#1C2814"}}>Faith Verified</div>
                        <div style={{fontSize:11,color:"#7d7363",lineHeight:1.45}}>Values reviewed by the platform team</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:30,height:30,borderRadius:10,background:"#fffdf8",border:"1px solid #e8dfcb",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:'#8a6a2e',fontWeight:800}}>◇</div>
                      <div>
                        <div style={{fontSize:12.5,fontWeight:800,color:"#1C2814"}}>Directory profile</div>
                        <div style={{fontSize:11,color:"#7d7363",lineHeight:1.45}}>Trust signals continue to build over time</div>
                      </div>
                    </div>
                  )}
                  {isElderEndorsed && (
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:30,height:30,borderRadius:10,background:"rgba(168,85,247,0.1)",border:"1px solid rgba(168,85,247,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>✝</div>
                      <div>
                        <div style={{fontSize:12.5,fontWeight:800,color:"#1C2814"}}>Elder Endorsed</div>
                        <div style={{fontSize:11,color:"#7d7363",lineHeight:1.45}}>Endorsed by a church elder</div>
                      </div>
                    </div>
                  )}
                  {elderPending && !isElderEndorsed && (
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:30,height:30,borderRadius:10,background:"var(--warn-bg)",border:"1px solid var(--warn-border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0}}>⏳</div>
                      <div>
                        <div style={{fontSize:12.5,fontWeight:800,color:"#1C2814"}}>Endorsement Pending</div>
                        <div style={{fontSize:11,color:"#7d7363",lineHeight:1.45}}>Under review · 48 hrs</div>
                      </div>
                    </div>
                  )}
                </div>
              </VendorProfilePanel>
            </div>
          </div>
        )}

        {/* AVAILABILITY TAB */}
        {tab==="availability" && (
          <div style={{maxWidth:540}}>
            <div style={{marginBottom:14,padding:"12px 16px",background:"#fff",borderRadius:10,border:"1px solid #dfd5c2",fontSize:13,color:"#565862"}}>
              {isOwner
                ? "Your public availability calendar. Click any future date to toggle open / unavailable."
                : `${v.name?.split(" ")[0]}'s availability. Green dates mean they're open to new work.`}
            </div>
            <AvailabilityCalendar vendorId={v.id} editable={!!isOwner} showToast={showToast} />
            {!isOwner && (
              <div style={{marginTop:16}}>
                <button type="button" className="btn-primary" style={{opacity:canStartVendorConversation?1:0.5,cursor:canStartVendorConversation?'pointer':'not-allowed'}} disabled={!canStartVendorConversation} onClick={()=>openVendorConversationFromProfile('start-conversation-availability')}>{canStartVendorConversation ? vendorAvailabilityLabel : 'Contact unavailable'}</button>
              </div>
            )}
          </div>
        )}

        {/* PORTFOLIO TAB */}
        {tab==="portfolio" && (
          <div style={{display:"grid",gap:16}}>
            {(v.gallery || []).filter(Boolean).length > 0 && (
              <div className="card">
                <div className="card-hd"><div className="card-hd-title">Project Gallery</div></div>
                <div className="card-body">
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
                    {(v.gallery || []).filter(Boolean).slice(0,3).map((img, idx)=>(
                      <div key={img+idx} style={{borderRadius:16,overflow:"hidden",border:"1px solid #dfd5c2",background:"#fffdf8"}}>
                        <img src={img} alt={`${v.name} gallery ${idx+1}`} loading="lazy" onError={handleKbImageError} style={{width:"100%",height:148,objectFit:"cover",display:"block"}}/>
                        <div style={{padding:"12px 12px",fontSize:12,color:"#565862",lineHeight:1.55}}>{(v.portfolio_items || [])[idx]?.note || 'Gallery image'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <VendorPortfolioTab vendor={{...v, portfolio_items:portfolioItems}} isOwner={isOwner}/>
          </div>
        )}

        {/* REVIEWS TAB */}
        {tab==="reviews" && <VendorReviews vendorId={v.id} vendor={v}/>}

        {/* ENDORSEMENT TAB — owner only */}
        {tab==="endorsement" && isOwner && (
          <div style={{maxWidth:600}}>
            {/* What is Elder Endorsed */}
            <div className="card" style={{marginBottom:16,borderColor:isElderEndorsed?"rgba(168,85,247,0.25)":"rgba(42,53,32,0.08)"}}>
              <div className="card-hd" style={{background:isElderEndorsed?"linear-gradient(135deg,rgba(168,85,247,0.06),rgba(139,92,246,0.03))":"#fff"}}>
                <div className="card-hd-title">✝ Elder Endorsed</div>
                {isElderEndorsed && <span className="elder-badge">Active</span>}
                {elderPending && <span style={{padding:"3px 9px",borderRadius:100,background:"var(--warn-bg)",border:"1px solid var(--warn-border)",fontSize:10,fontWeight:700,color:"var(--warn)"}}>Pending Review</span>}
              </div>
              <div className="card-body">
                {isElderEndorsed ? (
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:40,height:40,borderRadius:10,background:"rgba(168,85,247,0.1)",border:"1px solid rgba(168,85,247,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>✝</div>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"#1C2814",marginBottom:2}}>Your profile is Elder Endorsed</div>
                      <div style={{fontSize:12,color:"#7d7363"}}>This badge is live on your public profile and helps you stand out to churches.</div>
                    </div>
                  </div>
                ) : elderPending ? (
                  <div>
                    <div style={{fontSize:13,color:"#565862",lineHeight:1.7,marginBottom:8}}>Your endorsement request is under review. We'll notify you within 48 hours once it's approved.</div>
                    <div style={{padding:"10px 14px",background:"var(--warn-bg)",borderRadius:"var(--r-sm)",border:"1px solid var(--warn-border)",fontSize:12,color:"var(--warn)"}}>⏳ Under review // check back shortly.</div>
                  </div>
                ) : (
                  <div>
                    <div style={{fontSize:13,color:"#565862",lineHeight:1.75,marginBottom:16}}>
                      The <strong>Elder Endorsed</strong> badge signals to churches that a credible church elder has personally vouched for your faith and professionalism. It's the highest trust signal on FaithBid // above Faith Verified.
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                      {[["✝","Elder vouches for your faith"],["✦","Appears on your public profile"],["↑","Higher placement in search"],["★","Increases bid acceptance rate"]].map(([icon,txt],i)=>(
                        <div key={txt || i} style={{padding:"12px 13px",background:"#fffdf8",borderRadius:"var(--r-sm)",border:"1px solid #dfd5c2",display:"flex",alignItems:"center",gap:9}}>
                          <span style={{fontSize:14,flexShrink:0}}>{icon}</span>
                          <span style={{fontSize:11,color:"#565862",fontWeight:500}}>{txt}</span>
                        </div>
                      ))}
                    </div>
                    {!elderApplying && !elderSubmitted && (
                      <button type="button" className="btn-primary" style={{background:"linear-gradient(135deg,#6D28D9,#7C3AED)"}} onClick={()=>setElderApplying(true)}>
                        Request Elder endorsement →
                      </button>
                    )}
                    {elderSubmitted && (
                      <div style={{padding:"16px",background:"rgba(168,85,247,0.08)",border:"1px solid rgba(168,85,247,0.2)",borderRadius:10,fontSize:13,color:"#6D28D9",fontWeight:500}}>
                        ✓ Request submitted // we'll contact the elder to confirm and notify you within 48 hours.
                      </div>
                    )}
                    {elderApplying && !elderSubmitted && (
                      <div style={{background:"#fffdf8",borderRadius:"var(--r-md)",border:"1px solid #dfd5c2",padding:"20px",marginTop:4}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#1C2814",marginBottom:16,letterSpacing:0.3}}>Elder's Details</div>
                        {[
                          {label:"Elder's Full Name *", key:"elderName", placeholder:"e.g. Pastor James Wilson"},
                          {label:"Title / Role", key:"elderTitle", placeholder:"e.g. Senior Pastor, Elder, Deacon"},
                          {label:"Elder's Email *", key:"elderEmail", type:"email", placeholder:"elder@churchname.org"},
                          {label:"Church Name *", key:"church", placeholder:"e.g. Grace Fellowship Church"},
                        ].map(f=>(
                          <div key={f.key} className="field" style={{marginBottom:14}}>
                            <label style={{fontSize:11}}>{f.label}</label>
                            <input type={f.type||"text"} aria-label={f.label.replace(' *','')} value={elderForm[f.key]} placeholder={f.placeholder} onChange={e=>setElderForm(ef=>({...ef,[f.key]:e.target.value}))}/>
                          </div>
                        ))}
                        <div className="field" style={{marginBottom:18}}>
                          <label style={{fontSize:11}}>Endorsement Statement (optional)</label>
                          <textarea rows={3} value={elderForm.statement} placeholder="A brief word from the elder about working with you..." onChange={e=>setElderForm(ef=>({...ef,statement:e.target.value}))} style={{resize:"none"}}/>
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <button type="button" className="btn-secondary" onClick={()=>setElderApplying(false)}>Cancel</button>
                          <button type="button"
                            className="btn-primary" style={{flex:1,justifyContent:"center",background:"linear-gradient(135deg,#6D28D9,#7C3AED)"}}
                            disabled={elderLoading||!elderForm.elderName||!elderForm.elderEmail||!elderForm.church}
                            onClick={submitElderEndorsement}
                          >{elderLoading?"Submitting…":"Submit request →"}</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function buildFallbackVendorReviews(){
  return [];
}

function VendorReviews({vendorId, vendor}){
  const [helpfulIds, setHelpfulIds] = useState(() => new Set());
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('all');
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setReviewError('');
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("id,vendor_id,church_id,author,rating,body,created_at,city,project,featured,verified,helpful,cats,tags,recommend,reply")
          .eq("vendor_id", vendorId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        const mapped = (data || []).map(r => ({
          id: r.id,
          author: r.author || "Anonymous Church",
          avatar: String(r.author || 'CH').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'CH',
          city: r.city || vendor?.city || "",
          project: r.project || vendor?.category || "Project",
          rating: Number(r.rating || 0) || 0,
          date: r.created_at ? new Date(r.created_at).toLocaleDateString("en-US", {month:"short",year:"numeric"}) : 'Recent',
          featured: r.featured || false,
          verified: r.verified === true,
          helpful: r.helpful || 0,
          body: r.body || "",
          cats: Array.isArray(r.cats) ? r.cats : [],
          tags: Array.isArray(r.tags) ? r.tags : [],
          recommend: r.recommend === true,
          reply: r.reply || null,
        }));
        setReviews(mapped);
      } catch (err) {
        setReviewError(err?.message || 'Unable to load live reviews right now.');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [vendorId, vendor?.id]);

  const filtered = mode === 'featured' ? reviews.filter(r => r.featured) : mode === 'recent' ? reviews.slice(0,3) : reviews;
  const handleHelpful = (reviewId) => {
    if (!reviewId || helpfulIds.has(String(reviewId))) return;
    setHelpfulIds(prev => {
      const next = new Set(Array.from(prev));
      next.add(String(reviewId));
      return next;
    });
    setReviews(prev => prev.map(r => String(r.id) === String(reviewId) ? { ...r, helpful: Number(r.helpful || 0) + 1 } : r));
  };
  const vendorRating = Number(vendor?.rating || 0) || 0;
  const avgRating = reviews.length ? (reviews.reduce((sum,r)=>sum + Number(r.rating || 0), 0) / reviews.length).toFixed(1) : (vendorRating > 0 ? vendorRating.toFixed(1) : null);
  const wouldRehire = reviews.length ? Math.round((reviews.filter(r => r.recommend === true).length / reviews.length) * 100) : null;
  const reviewCount = reviews.length || Number(vendor?.reviews_count || vendor?.reviews || 0) || 0;

  if (loading) {
    return (
      <VendorProfilePanel title="Reviews">
        <KBSkeleton variant="card" />
      </VendorProfilePanel>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <VendorProfilePanel title="Review summary" bodyStyle={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
        {[
          { label:'Average rating', value:avgRating ? `${avgRating} ★` : 'Not rated', hint:reviewCount > 0 ? `${reviewCount} review${reviewCount===1?'':'s'}` : 'No reviews yet', accent:true },
          { label:'Would rehire', value:wouldRehire == null ? '—' : `${wouldRehire}%`, hint:reviews.length ? 'Churches saying yes again' : 'No review data yet', accent:false },
          { label:'Featured stories', value:String(reviews.filter(r => r.featured).length), hint:reviews.length ? 'Standout proof points' : 'No stories yet', accent:false },
        ].map(item => <VendorProfileStatTile key={item.label} {...item} />)}
      </VendorProfilePanel>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[['all','All reviews'],['featured','Featured'],['recent','Recent']].map(([key,label]) => {
            const active = mode === key;
            return (
              <button key={key} type='button' onClick={()=>setMode(key)} style={{ height:34, padding:'0 14px', borderRadius:999, border:`1px solid ${active ? '#1C2814' : '#dfd5c2'}`, background:active ? '#1C2814' : '#fffdf8', color:active ? '#fff' : '#565862', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                {label}
              </button>
            );
          })}
        </div>
        {!!reviewError && <div style={{ fontSize:12, color:'#8a6a2e', background:'rgba(176,136,64,0.08)', border:'1px solid rgba(176,136,64,0.16)', borderRadius:999, padding:'7px 11px' }}>Live reviews could not be loaded right now.</div>}
      </div>

      {!filtered.length ? (
        <VendorProfilePanel title="No reviews yet">
          <KBEmptyState
            icon="★"
            title="No reviews yet"
            body="Reviews will appear here once churches complete projects with this vendor."
            compact
          />
        </VendorProfilePanel>
      ) : filtered.map(r=>(
        <div key={r.id} style={{ ...VENDOR_PROFILE_PANEL_STYLE, padding:18, borderColor:r.featured ? 'rgba(176,136,64,0.38)' : '#dfd5c2', background:r.featured ? 'linear-gradient(135deg,#fffdf8,#faf6ed)' : '#fff' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14, flexWrap:'wrap', marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:11, minWidth:0 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#1C2814,#34432b)', color:'#fffdf8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, letterSpacing:0.4, flexShrink:0 }}>{r.avatar}</div>
              <div style={{ minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', fontSize:14, fontWeight:800, color:'#1C2814' }}>
                  {r.author}
                  {r.verified && <span style={{ padding:'3px 8px', borderRadius:999, background:'rgba(176,136,64,0.10)', border:'1px solid rgba(176,136,64,0.18)', color:'#8a6a2e', fontSize:10, fontWeight:800 }}>✓ Verified</span>}
                </div>
                <div style={{ fontSize:12, color:'#7d7363', marginTop:2 }}>{r.city || 'Church client'}</div>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ color:'#c4973a', fontSize:13, letterSpacing:1 }}>{starFill(r.rating)}</div>
              <div style={{ fontSize:11.5, color:'#7d7363', marginTop:2 }}>{r.date}</div>
            </div>
          </div>

          <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:999, background:'#fffdf8', border:'1px solid #dfd5c2', color:'#565862', fontSize:11.5, fontWeight:700, marginBottom:10 }}>{r.project}</div>
          <div style={{ fontSize:14, color:'#343833', lineHeight:1.8, fontWeight:400 }}>{r.body}</div>

          {(r.cats||[]).length>0 && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:12 }}>
              {r.cats.map((c,i)=>(
                <div key={c.label||i} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 10px', borderRadius:999, background:'rgba(176,136,64,0.08)', border:'1px solid rgba(176,136,64,0.16)', fontSize:11.5, color:'#565862', fontWeight:600 }}>
                  <span style={{ color:'#b08840', fontSize:10 }}>{starFill(c.stars)}</span>{c.label}
                </div>
              ))}
            </div>
          )}

          {(r.tags||[]).length>0 && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10 }}>
              {r.tags.map((t,i)=><span key={t||i} style={{ padding:'4px 9px', background:'rgba(28,40,20,0.04)', border:'1px solid rgba(28,40,20,0.10)', borderRadius:999, fontSize:10.5, fontWeight:700, color:'#1C2814' }}>{t}</span>)}
            </div>
          )}

          <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginTop:12 }}>
            {r.verified && <span style={{ padding:'5px 9px', borderRadius:999, background:'#fffdf8', border:'1px solid #dfd5c2', fontSize:11, color:'#565862', fontWeight:600 }}>✓ Verified work</span>}
            <span style={{ padding:'5px 9px', borderRadius:999, background:'#fffdf8', border:'1px solid #dfd5c2', fontSize:11, color:'#565862', fontWeight:600 }}>Church client</span>
            {r.recommend && <span style={{ padding:'5px 9px', borderRadius:999, background:'rgba(39,117,75,0.08)', border:'1px solid rgba(39,117,75,0.16)', fontSize:11, color:'#27754b', fontWeight:700 }}>Would rehire</span>}
            {r.reply && <span style={{ padding:'5px 9px', borderRadius:999, background:'rgba(176,136,64,0.08)', border:'1px solid rgba(176,136,64,0.16)', fontSize:11, color:'#8a6a2e', fontWeight:700 }}>Vendor response on record</span>}
          </div>

          {r.reply && (
            <div style={{ marginTop:13, padding:'13px 14px', borderRadius:14, background:'#fffdf8', border:'1px solid #dfd5c2' }}>
              <div style={{ ...VENDOR_PROFILE_KICKER_STYLE, color:'#8a6a2e', marginBottom:5 }}>Response</div>
              <div style={{ fontSize:13, color:'#565862', lineHeight:1.65 }}>{r.reply}</div>
            </div>
          )}

          <div style={{ fontSize:12, color:'#7d7363', marginTop:12, paddingTop:12, borderTop:'1px solid #efe7d9', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
            <div>{r.helpful} found helpful {r.recommend && <span style={{ marginLeft:12, color:'#27754b', fontWeight:700 }}>✓ Would rehire</span>}</div>
            <button type='button' onClick={()=>handleHelpful(r.id)} disabled={helpfulIds.has(String(r.id))} style={{ border:'none', background:'transparent', fontSize:12, fontWeight:800, color:helpfulIds.has(String(r.id)) ? '#9a9183' : '#1C2814', cursor:helpfulIds.has(String(r.id)) ? 'default' : 'pointer' }}>Helpful</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SavedProjectsScreenRoute({ dependencies, ...props }) {
  applyProjectsScreenDependencies(dependencies);
  return <SavedProjectsScreen {...props} />;
}

export default function ProjectsScreenRoute({ dependencies, ...props }) {
  applyProjectsScreenDependencies(dependencies);
  return <ProjectsScreen {...props} />;
}
