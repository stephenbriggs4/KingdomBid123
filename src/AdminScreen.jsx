import React, { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { supabase, supabaseQaMode } from "./supabaseClient";
import AdminPrivacyRequests from "./AdminPrivacyRequests";
import AdminVendorCredentials from "./AdminVendorCredentials";

const ADMIN_LIGHT_THEME_CSS = String.raw`
/* Admin light theme: ivory sidebar and hero, dark readable text, consistent alignment. */
.faithbid-admin-v853bl.admin-premium-shell{grid-template-columns:240px minmax(0,1fr)!important;}
.faithbid-admin-v853bl.admin-premium-shell > .admin-sidenav{
  background:#fffdf8!important;
  border-right:1px solid rgba(28,40,20,.10)!important;
  box-shadow:none!important;
}
.faithbid-admin-v853bl.admin-premium-shell .admin-nav-section{padding:22px 12px 14px!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-nav-label{color:#9b7432!important;margin:0 10px 12px!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-nav-item{color:#42503d!important;border-radius:12px!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-nav-item:hover{background:#f6efe1!important;border-color:rgba(28,40,20,.08)!important;color:#182313!important;transform:none!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-nav-item.active{background:#f3ead8!important;border-color:rgba(155,116,50,.26)!important;color:#182313!important;box-shadow:none!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-nav-glyph{background:#f6efe1!important;border:1px solid rgba(28,40,20,.08)!important;color:#7a5a24!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-nav-item.active .admin-nav-glyph{background:#fffdf8!important;border-color:rgba(155,116,50,.3)!important;color:#7a5a24!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-nav-note{color:#7d8579!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-sidebar-footer{border-top:1px solid rgba(28,40,20,.09)!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-sidebar-user-card{background:#f8f3e9!important;border:1px solid rgba(28,40,20,.09)!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-sidebar-user-name{color:#182313!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-sidebar-user-role{color:#7d8579!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-sidebar-avatar{background:#efe3c8!important;color:#6f5220!important;border-color:rgba(155,116,50,.25)!important;}

/* Hero */
.faithbid-admin-v853bl.admin-premium-shell .admin-command-hero{
  background:linear-gradient(135deg,#fffdf8 0%,#f7f0e2 100%)!important;
  border:1px solid rgba(28,40,20,.10)!important;
  box-shadow:0 12px 30px rgba(28,40,20,.06)!important;
  align-items:center!important;
}
.faithbid-admin-v853bl.admin-premium-shell .admin-command-hero::before,
.faithbid-admin-v853bl.admin-premium-shell .admin-command-hero::after{display:none!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-command-hero .admin-page-eyebrow{color:#9b7432!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-command-title{color:#182313!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-command-copy{color:#52604d!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-command-state{background:#fffdf8!important;border:1px solid rgba(28,40,20,.12)!important;color:#42503d!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-command-signal{background:#fffdf8!important;border:1px solid rgba(28,40,20,.10)!important;color:#182313!important;box-shadow:0 6px 16px rgba(28,40,20,.04)!important;}
.faithbid-admin-v853bl.admin-premium-shell button.admin-command-signal:hover{background:#fbf5e9!important;border-color:rgba(155,116,50,.30)!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-command-signal-label{color:#7b8376!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-command-signal strong{color:#182313!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-command-signal>span:last-child{color:#727b6e!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-command-signal.is-healthy strong{color:#247b42!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-command-signal.is-loading strong{color:#a96d12!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-command-signal.is-degraded strong{color:#bd403a!important;}

/* Buttons: replace the dark olive fills with the platform's ivory/gold treatment */
.faithbid-admin-v853bl.admin-premium-shell .admin-refresh-action{background:#fffdf8!important;border-color:rgba(155,116,50,.35)!important;color:#7a5a24!important;box-shadow:0 5px 12px rgba(28,40,20,.05)!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-refresh-action:hover{background:#fbf4e7!important;color:#5f4418!important;border-color:rgba(155,116,50,.5)!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-lane-btn.active{background:#f3ead8!important;color:#182313!important;border-color:rgba(155,116,50,.35)!important;box-shadow:none!important;}
.faithbid-admin-v853bl.admin-premium-shell .charter-admin-header button{background:#f3ead8!important;border-color:rgba(155,116,50,.35)!important;color:#182313!important;box-shadow:none!important;}

/* Alignment: one left edge and one rhythm for the top bar and page content */
.faithbid-admin-v853bl.admin-premium-shell .admin-topbar{padding:0 32px!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-content{padding:28px 32px 52px!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-content>*{max-width:1400px!important;margin-left:0!important;margin-right:0!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-topbar-right{align-items:center!important;}
.faithbid-admin-v853bl.admin-premium-shell .admin-page-heading{margin-bottom:20px!important;}
`;

const ADMIN_PROJECT_ORIGIN_LABEL = { real: 'Real', qa: 'Test', synthetic: 'Demo', unclassified: 'Unclassified' };

function createFounderFeedbackEventId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `founder-${new Date().getTime()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function AdminScreen({showToast, adminUser, adminProfile, nav, dependencies}){
  const {
    activateOnKey,
    ADMIN_FEE_SIGNAL_MONTHS,
    AdminActivityFeed,
    AdminMatchmakerFunnelCard,
    AdminReferralLeaderboard,
    AmbassadorAppsPanel,
    BadgeRow,
    buildFaithBidAiGatewayShell,
    buildFaithBidChurchProjectRescueRows,
    buildFaithBidDataQualityRepairRows,
    buildFaithBidGrowthPriorityUpgrade,
    buildFaithBidGrowthSignalQualityRows,
    buildFaithBidHumanActionQueueRows,
    buildFaithBidLaunchReadinessDrilldownRows,
    buildFaithBidLaunchReadinessSentinel,
    buildFaithBidLiquidityDetailRows,
    buildFaithBidMarketplaceLiquiditySnapshot,
    buildFaithBidOutcomeLearningLedgerRows,
    buildFaithBidShadowModeUseCase,
    buildFaithBidSignalActionContracts,
    buildFaithBidVendorSuccessCoachRows,
    buildFounderBriefEvidenceTrace,
    buildFounderCoverageVendorSeed,
    buildFounderGrowthAdminSeed,
    buildFounderWaitlistReviewSeed,
    buildSafeSparklineGeometry,
    CHURCH_REBATE_FINALITY_WINDOW_DAYS,
    CHURCH_REBATE_PAYOUT_THRESHOLD_LABEL,
    CHURCH_REBATE_POLICY_VERSION,
    CHURCH_REBATE_RATE,
    CHURCH_REBATE_RATE_LABEL,
    CrossLogo,
    FAITHBID_ADMIN_V853BK_CSS,
    fetchAdminDisputeSummarySafe,
    fetchAdminReviewSummarySafe,
    fetchDetailedDisputesSafe,
    formatAdminKpiValue,
    formatAdminQueueToast,
    formatDateLabelSafe,
    formatQueueAgeLabel,
    FoundingMembersAdmin,
    getAdminDisputeBadgeMeta,
    getAdminKpiNumber,
    getAdminOverviewPrimaryCards,
    getAdminOverviewSecondaryCards,
    getAdminTierBadgeClass,
    getAdminUserStatusPill,
    getAdminVerificationTierMeta,
    getAdminWaitAge,
    getDisputeDashboardStats,
    getFounderActionContextChips,
    getFounderActionDestinationMeta,
    getFounderActionFeedbackKey,
    getFounderActionFeedbackLabel,
    getFounderMetricNumber,
    getNextAdminQueueItem,
    GetPluggedInAdmin,
    getVendorIdentityBadges,
    isAdminUser,
    isFounderActionHiddenByFeedback,
    isKbTimeoutError,
    isSchemaMismatchError,
    isSupabaseAuthLockAbort,
    isTransientSupabaseNetworkError,
    KB_ADMIN_DISPUTE_SUMMARY_EMPTY,
    KB_ADMIN_KPI_EMPTY,
    KB_ADMIN_MATCHMAKER_FUNNEL_EMPTY,
    KB_ADMIN_REVIEW_SUMMARY_EMPTY,
    KB_FOUNDER_ACTION_FEEDBACK_KEY,
    KB_FOUNDER_ACTION_SNOOZE_MS,
    KB_VENDOR_ADMISSION_STATUS,
    kbAiNumber,
    kbIsDevRuntime,
    logError,
    normalizeAdminMatchmakerFunnelHealth,
    normalizeVendorAdmissionStatus,
    PartnerAppsPanel,
    persistProjectActivityRecord,
    PLATFORM_FEE_CAP,
    queueVendorNavigation,
    readLocalJson,
    runSupabaseWithTimeout,
    safeArray,
    selectHireConfirmationsSafe,
    updateDisputeSafe,
    updateProfileFlagsSafe,
    useDebounce,
    writeLocalJson,
  } = dependencies;
  const [adminView, setAdminView] = useState("overview");
  const [adminReviewLane, setAdminReviewLane] = useState("directory");
  const [adminInsightLane, setAdminInsightLane] = useState("marketplace");
  const [adminProjects, setAdminProjects] = useState([]);
  const [adminProjectsLoading, setAdminProjectsLoading] = useState(false);
  const [adminProjectsError, setAdminProjectsError] = useState(false);
  const [adminProjectPreviewId, setAdminProjectPreviewId] = useState(null);
  const [adminProjectBusyId, setAdminProjectBusyId] = useState(null);
  const adminContentRef = useRef(null);
  const adminNavScrollRef = useRef(null);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [vendorsError, setVendorsError] = useState(false);
  const [pendingVendorTotal, setPendingVendorTotal] = useState(0);
  const [vendorApprovalPage, setVendorApprovalPage] = useState(0);
  const [disputes, setDisputes] = useState([]);
  const [loadingDisputes, setLoadingDisputes] = useState(true);
  const [disputesError, setDisputesError] = useState(false);
  const [disputeSummary, setDisputeSummary] = useState({
    ...KB_ADMIN_DISPUTE_SUMMARY_EMPTY,
    loading:true,
    error:false,
  });
  const [modal, setModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // {type:"vendor"|"verification"|"dispute", id, extra, label}
  const [rejectReason, setRejectReason] = useState("");
  const adminDialogRef = useRef(null);
  const rejectReasonInputRef = useRef(null);
  const adminDialogReturnFocusRef = useRef(null);
  const adminDialogStateRef = useRef({rejectOpen:false, reviewOpen:false});
  const [verificationApps, setVerificationApps] = useState([]);
  const [loadingVerifications, setLoadingVerifications] = useState(true);
  const [verificationsError, setVerificationsError] = useState(false);
  const [verificationTotal, setVerificationTotal] = useState(0);
  const [verificationPage, setVerificationPage] = useState(0);
  const [expandedApp, setExpandedApp] = useState(null);
  // Tracks in-flight admin action IDs so double-clicks on approve/reject/resolve
  // don't fire the same mutation twice.
  const adminBusyRef = useRef(new Set());
  const reviewSummaryRequestRef = useRef(0);
  const disputeSummaryRequestRef = useRef(0);

  const [kpis, setKpis] = useState(KB_ADMIN_KPI_EMPTY);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [kpisError, setKpisError] = useState(false);
  const [founderBrief, setFounderBrief] = useState({data:null, loading:true, error:null});
  const [matchmakerFunnelHealth, setMatchmakerFunnelHealth] = useState(KB_ADMIN_MATCHMAKER_FUNNEL_EMPTY);
  const [founderActionFeedback, setFounderActionFeedback] = useState(() => readLocalJson(KB_FOUNDER_ACTION_FEEDBACK_KEY, {}) || {});
  const [founderActionFeedbackRemoteReady, setFounderActionFeedbackRemoteReady] = useState(false);
  const [founderFeedbackContractStatus, setFounderFeedbackContractStatus] = useState("checking");
  const [founderActionNoteDrafts, setFounderActionNoteDrafts] = useState({});
  const [activeFounderNoteKey, setActiveFounderNoteKey] = useState(null);
  const [founderQaLastCheckedAt, setFounderQaLastCheckedAt] = useState(null);
  const [showFounderHandledActions, setShowFounderHandledActions] = useState(false);
  const [showFounderActionHistory, setShowFounderActionHistory] = useState(false);
  const [founderActionAuditEvents, setFounderActionAuditEvents] = useState([]);
  const [founderActionAuditLoading, setFounderActionAuditLoading] = useState(false);
  const [founderActionAuditError, setFounderActionAuditError] = useState(false);
  const [reviewSummary, setReviewSummary] = useState({
    ...KB_ADMIN_REVIEW_SUMMARY_EMPTY,
    loading:true,
    error:false,
  });
  const [feeSignalData, setFeeSignalData] = useState([]);
  const [feeSignalSnapshot, setFeeSignalSnapshot] = useState({ hireSignals:0, modeledFees:0, modeledMinistryAllocation:0 });
  const [loadingFeeSignals, setLoadingFeeSignals] = useState(true);
  const [feeSignalError, setFeeSignalError] = useState(false);
  const [supplementalDataHealth, setSupplementalDataHealth] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const debouncedUserSearch = useDebounce(userSearch, 250);
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [userPage, setUserPage] = useState(0);
  const [userPageSize, setUserPageSize] = useState(50);
  const [userTotal, setUserTotal] = useState(0);
  const [userSort, setUserSort] = useState("newest");
  const [userTriageMode, setUserTriageMode] = useState("attention");
  const userTriageChosenRef = useRef(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActionId, setUserActionId] = useState(null);
  // Suspension state: DB is the source of truth (account_status field on profiles).
  // suspendedUserIds is a session-only optimistic cache for instant UI feedback — never persisted to localStorage.
  const [suspendedUserIds, setSuspendedUserIds] = useState([]);
  const [refreshingAdmin, setRefreshingAdmin] = useState(false);
  const [adminRefreshKey, setAdminRefreshKey] = useState(0);
  const [adminClockMs, setAdminClockMs] = useState(() => new Date().getTime());
  const recentDisputeStats = getDisputeDashboardStats(disputes);
  const adminReadLaneRef = useRef(Promise.resolve());

  useEffect(() => {
    const timer = setInterval(() => setAdminClockMs(new Date().getTime()), 60000);
    return () => clearInterval(timer);
  }, []);

  const runAdminReadLane = React.useCallback(async (label, task, settleMs = 160) => {
    const previous = adminReadLaneRef.current.catch(() => {});
    let releaseLane;
    const laneTurn = new Promise(resolve => { releaseLane = resolve; });
    adminReadLaneRef.current = previous.then(() => laneTurn);
    await previous;
    try {
      return await task();
    } catch (error) {
      if (isSupabaseAuthLockAbort(error)) {
        await new Promise(resolve => setTimeout(resolve, 900));
        return await task();
      }
      throw error;
    } finally {
      setTimeout(releaseLane, settleMs);
    }
  }, [isSupabaseAuthLockAbort]);

  useEffect(() => {
    const content = adminContentRef.current;
    if (!content) return;
    if (typeof content.scrollTo === "function") content.scrollTo({ top:0, left:0, behavior:"auto" });
    else { content.scrollTop = 0; content.scrollLeft = 0; }
  }, [adminView]);

  useEffect(() => {
    const navScroller = adminNavScrollRef.current;
    if (!navScroller || typeof window === "undefined" || !window.matchMedia?.("(max-width: 760px)")?.matches) return;
    const activeItem = navScroller.querySelector('[aria-current="page"]');
    if (!activeItem) return;
    const targetLeft = activeItem.offsetLeft - ((navScroller.clientWidth - activeItem.offsetWidth) / 2);
    if (typeof navScroller.scrollTo === "function") {
      navScroller.scrollTo({left:Math.max(0, targetLeft), behavior:"smooth"});
    } else {
      navScroller.scrollLeft = Math.max(0, targetLeft);
    }
  }, [adminView]);

  const [adminFocus, setAdminFocus] = useState({ approvalId:null, verificationId:null, disputeId:null, userId:null, reviewSection:null, financeSection:null });
  const [founderWaitlistReviewContext, setFounderWaitlistReviewContext] = useState(null);
  const [founderGrowthContext, setFounderGrowthContext] = useState(null);

  useEffect(() => {
    const sectionId = adminView === "approvals"
      ? adminFocus.reviewSection
      : adminView === "revenue"
        ? adminFocus.financeSection
        : null;
    if (!sectionId) return;
    const frame = requestAnimationFrame(() => {
      const target = adminContentRef.current?.querySelector(`#${sectionId}`);
      if (!target) return;
      target.scrollIntoView({behavior:"smooth", block:"start"});
      if (typeof target.focus === "function") target.focus({preventScroll:true});
    });
    return () => cancelAnimationFrame(frame);
  }, [adminView, adminFocus.reviewSection, adminFocus.financeSection, adminReviewLane]);

  const hasAdminAccess = isAdminUser(adminUser, adminProfile);

  const fetchAdminProjects = useCallback(async () => {
    if (!hasAdminAccess) return;
    setAdminProjectsLoading(true);
    setAdminProjectsError(false);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id,title,description,timeline,church_name,church_id,status,category,budget,city,project_city,posted_at,record_origin,proposal_response_window_ends_at,qualified_comparable_proposal_count,liquidity_status,liquidity_evaluated_at,thin_coverage_alerted_at')
        .order('posted_at', { ascending:false })
        .limit(250);
      if (error) throw error;
      setAdminProjects(data || []);
    } catch (error) {
      logError('admin-projects-fetch', error);
      setAdminProjectsError(true);
    } finally {
      setAdminProjectsLoading(false);
    }
  }, [hasAdminAccess, logError]);

  useEffect(() => {
    if (adminView !== 'projects' || !hasAdminAccess) return undefined;
    const timer = setTimeout(() => fetchAdminProjects(), 0);
    return () => clearTimeout(timer);
  }, [adminView, hasAdminAccess, fetchAdminProjects]);

  const moderateAdminProject = async (project, action) => {
    if (!project?.id || adminProjectBusyId) return;
    const verb = action === 'restore' ? 'restore' : 'remove';
    const reason = typeof window !== 'undefined'
      ? window.prompt(`Reason to ${verb} "${project.title || 'this project'}" (required):`, '')
      : '';
    if (reason == null) return;
    if (String(reason).trim().length < 5) {
      showToast('Enter a clear moderation reason (at least 5 characters).', 'error');
      return;
    }
    setAdminProjectBusyId(project.id);
    try {
      const { data, error } = await supabase.rpc('marketplace_admin_moderate_project', {
        p_project_id: project.id,
        p_action: action,
        p_reason: String(reason).trim(),
      });
      if (error) throw error;
      setAdminProjects(rows => rows.map(row => row.id === project.id ? { ...row, ...(data || {}) } : row));
      showToast(action === 'restore' ? 'Project restored to the marketplace.' : 'Project removed from the marketplace.');
    } catch (error) {
      logError('admin-project-moderation', error, { projectId:project.id, action });
      showToast(`Could not ${verb} this project.`, 'error');
    } finally {
      setAdminProjectBusyId(null);
    }
  };
  const classifyAdminProject = async (project, origin) => {
    if (!project?.id || adminProjectBusyId || origin === project.record_origin) return;
    const label = ADMIN_PROJECT_ORIGIN_LABEL[origin] || origin;
    const reason = typeof window !== 'undefined'
      ? window.prompt(`Reason to classify "${project.title || 'this project'}" as ${label} (required):`, '')
      : '';
    if (reason == null) return;
    if (String(reason).trim().length < 5) {
      showToast('Enter a clear reason (at least 5 characters).', 'error');
      return;
    }
    setAdminProjectBusyId(project.id);
    try {
      const { data, error } = await supabase.rpc('kb_admin_set_project_record_origin_v0', {
        p_project_id: project.id,
        p_record_origin: origin,
        p_reason: String(reason).trim(),
      });
      if (error) throw error;
      setAdminProjects(rows => rows.map(row => row.id === project.id ? { ...row, record_origin: data?.record_origin || origin } : row));
      showToast(`Project classified as ${label}.`);
    } catch (error) {
      logError('admin-project-classify', error, { projectId: project.id, origin });
      showToast('Could not classify this project.', 'error');
    } finally {
      setAdminProjectBusyId(null);
    }
  };
  const setAdminProjectResponseWindow = async (project) => {
    if (!project?.id || adminProjectBusyId || project.record_origin !== 'real') return;
    const currentValue = project.proposal_response_window_ends_at
      ? new Date(project.proposal_response_window_ends_at).toISOString()
      : '';
    const entered = typeof window !== 'undefined'
      ? window.prompt('Proposal response deadline (ISO date/time). Leave blank to clear:', currentValue)
      : null;
    if (entered == null) return;
    const trimmed = String(entered).trim();
    let deadline = null;
    if (trimmed) {
      const parsed = new Date(trimmed);
      if (Number.isNaN(parsed.getTime())) {
        showToast('Enter a valid date and time, including the time zone.', 'error');
        return;
      }
      deadline = parsed.toISOString();
    }
    setAdminProjectBusyId(project.id);
    try {
      const { data, error } = await supabase.rpc('kb_admin_set_project_response_window_v0', {
        p_project_id: project.id,
        p_window_ends_at: deadline,
      });
      if (error) throw error;
      setAdminProjects(rows => rows.map(row => row.id === project.id ? { ...row, ...(data || {}) } : row));
      showToast(deadline ? 'Proposal response window saved.' : 'Proposal response window cleared.');
    } catch (error) {
      logError('admin-project-response-window', error, { projectId:project.id });
      showToast('Could not save the proposal response window.', 'error');
    } finally {
      setAdminProjectBusyId(null);
    }
  };
  const reportAdminDatasetHealth = useCallback((key, status = {}) => {
    if (!key) return;
    const next = {loading:!!status.loading, error:!!status.error};
    setSupplementalDataHealth(previous => {
      const current = previous[key];
      if (current?.loading === next.loading && current?.error === next.error) return previous;
      return {...previous, [key]:next};
    });
  }, []);
  const adminDialogOpen = !!(rejectModal || modal);
  const adminDialogKind = rejectModal ? "reject" : modal ? "review" : "none";
  useEffect(() => {
    adminDialogStateRef.current = {rejectOpen:!!rejectModal, reviewOpen:!!modal};
  }, [rejectModal, modal]);

  const closeActiveAdminDialog = useCallback(() => {
    const state = adminDialogStateRef.current;
    if (state.rejectOpen) setRejectModal(null);
    else if (state.reviewOpen) setModal(null);
  }, []);

  // One shared keyboard contract for both Admin dialogs. Keeping the effect
  // keyed to "any dialog open" preserves the original trigger when the review
  // dialog transitions directly into the rejection-reason dialog.
  useEffect(() => {
    if (!adminDialogOpen || typeof document === "undefined") return undefined;
    const adminContent = adminContentRef.current;
    const activeElement = document.activeElement;
    adminDialogReturnFocusRef.current = (
      typeof HTMLElement !== "undefined" && activeElement instanceof HTMLElement
    ) ? activeElement : null;

    const getFocusable = () => {
      const dialog = adminDialogRef.current;
      if (!dialog) return [];
      return Array.from(dialog.querySelectorAll(
        'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
      )).filter(element => element.getAttribute("aria-hidden") !== "true");
    };

    const handleDialogKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeActiveAdminDialog();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = adminDialogRef.current;
      const focusable = getFocusable();
      if (!dialog || focusable.length === 0) {
        event.preventDefault();
        dialog?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !dialog.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !dialog.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      document.removeEventListener("keydown", handleDialogKeyDown);
      const returnTarget = adminDialogReturnFocusRef.current;
      adminDialogReturnFocusRef.current = null;
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => {
          if (returnTarget?.isConnected && typeof returnTarget.focus === "function") returnTarget.focus();
          else adminContent?.focus?.();
        });
      }
    };
  }, [adminDialogOpen, closeActiveAdminDialog]);

  useEffect(() => {
    if (!adminDialogOpen || adminDialogKind === "none" || typeof requestAnimationFrame !== "function") return undefined;
    const frame = requestAnimationFrame(() => {
      const target = adminDialogKind === "reject"
        ? rejectReasonInputRef.current
        : adminDialogRef.current?.querySelector("[data-admin-dialog-initial]");
      (target || adminDialogRef.current)?.focus?.();
    });
    return () => cancelAnimationFrame(frame);
  }, [adminDialogOpen, adminDialogKind]);

  const requireAdminAction = (label = "admin action") => {
    if (hasAdminAccess) return true;
    logError('admin-access-denied', new Error('Admin action blocked client-side'), { label, adminUserId: adminUser?.id || null });
    showToast("Admin access required.", "error");
    return false;
  };

  const openAdminView = (view, focusPatch = {}, toastMessage = "") => {
    const nextFocus = { approvalId:null, verificationId:null, disputeId:null, userId:null, reviewSection:null, financeSection:null, ...(focusPatch || {}) };
    const reviewLaneBySection = {
      "admin-review-directory":"directory",
      "admin-review-verification":"verification",
      "admin-review-charter":"charter",
      "admin-review-partnerships":"partnerships",
      "admin-review-ambassadors":"ambassadors",
    };
    if (view === "approvals" && nextFocus.reviewSection && reviewLaneBySection[nextFocus.reviewSection]) {
      setAdminReviewLane(reviewLaneBySection[nextFocus.reviewSection]);
    }
    setAdminFocus(nextFocus);
    setAdminView(view);
    if (toastMessage) showToast(toastMessage);
  };

  const writeAuditLog = async (action, targetTable, targetId, meta = {}) => {
    if (!hasAdminAccess) return;
    if (!action || !targetTable || !targetId || !adminUser?.id) {
      logError('admin-audit-log', new Error('Missing required audit-log field'), { action, targetTable, targetId });
      return;
    }
    try {
      const { error } = await supabase.from('admin_audit_log').insert({
        admin_id: adminUser.id,
        action,
        target_table: targetTable,
        target_id: String(targetId),
        meta,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch(err){ logError('admin-audit-log', err, { action, targetTable, targetId }); }
  };

  const openApprovalReview = (vendor) => {
    if (!vendor) return;
    setAdminReviewLane("directory");
    openAdminView("approvals", { approvalId: vendor.id }, `Opened ${vendor.name || "vendor"}`);
    setModal(vendor);
  };

  const openDisputeReview = (dispute) => {
    if (!dispute) return;
    openAdminView("disputes", { disputeId: dispute.id }, `Opened ${dispute.title || "dispute"}`);
  };

  const openUserManagement = (user = null) => {
    openAdminView("users", { userId: user?.id || null }, user?.name ? `Opened ${user.name}` : "Opened user management");
    if (user) setSelectedUser(user);
  };

  const isUserSuspended = (userId) => (suspendedUserIds || []).map(String).includes(String(userId || ''));

  const toggleUserSuspension = async (user) => {
    if (!requireAdminAction('toggle user suspension')) return;
    if (!user?.id) return;
    const nextSuspended = !isUserSuspended(user.id);
    const nextPlan = user.type === 'church'
      ? (nextSuspended ? 'Suspended' : 'Always free')
      : (nextSuspended ? 'Suspended' : (user.verified ? 'Faith-Verified' : 'Open access'));

    // Track which writes succeeded so we don't (a) update local state when the
    // database disagrees, (b) write an audit log for an action that didn't
    // actually happen, or (c) leave the admin thinking the toggle worked.
    let profileOk = false;
    let vendorOk = true; // default true for non-vendor users (no vendor row to update)
    try {
      const profileResult = await updateProfileFlagsSafe(user.id, nextSuspended
        ? { account_status:'suspended', access_status:'suspended', suspended_at:new Date().toISOString() }
        : { account_status:'active', access_status:'active', suspended_at:null });
      if (profileResult?.error) throw profileResult.error;
      profileOk = true;
    } catch(err){ logError('suspension-profile-update', err, { userId: user.id }); }
    if (user.type === 'vendor') {
      vendorOk = false;
      try {
        const { error } = await supabase.from('vendors').update({ suspended: nextSuspended }).eq('user_id', user.id);
        if (error) throw error;
        vendorOk = true;
      } catch(err){ logError('suspension-vendor-update', err, { userId: user.id }); }
    }

    if (!profileOk || !vendorOk) {
      // Inconsistent or failed state — DON'T update the UI, DON'T write to
      // audit log. Tell the admin so they can retry or escalate.
      const partialNote = profileOk !== vendorOk ? ' (partial — some fields updated)' : '';
      showToast(`Couldn't ${nextSuspended ? 'suspend' : 'restore'} ${user.name}${partialNote} — please try again.`, 'error');
      return;
    }

    setSuspendedUserIds(prev => nextSuspended
      ? Array.from(new Set([...(prev || []), user.id]))
      : (prev || []).filter(id => String(id) !== String(user.id)));
    setSelectedUser(prev => prev && String(prev.id) === String(user.id) ? { ...prev, suspended: nextSuspended, plan: nextPlan } : prev);
    setAllUsers(prev => prev.map(entry => String(entry.id) === String(user.id) ? { ...entry, suspended: nextSuspended, plan: entry.type === 'church' ? (nextSuspended ? 'Suspended' : 'Always free') : (nextSuspended ? 'Suspended' : (entry.verified ? 'Faith-Verified' : 'Open access')) } : entry));
    await writeAuditLog(nextSuspended ? 'suspend_user' : 'restore_user', 'profiles', user.id, { userName: user.name, userType: user.type });
    showToast(nextSuspended ? `${user.name} suspended` : `${user.name} restored`);
  };

  const hydrateFeeSignalSnapshot = async () => {
    setLoadingFeeSignals(true);
    setFeeSignalError(false);
    try {
      const { data: hires, error } = await selectHireConfirmationsSafe();
      if (error) throw error;
      if (hires && hires.length > 0) {
        const monthMap = {};
        let totalFees = 0;
        hires.forEach(h => {
          const d = new Date(h.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          const label = d.toLocaleString("default", { month: "short" });
          const fee = Number(h.platform_fee || 0) || 0;
          totalFees += fee;
          monthMap[key] = { label, v: (monthMap[key]?.v || 0) + fee };
        });
        const ordered = Object.keys(monthMap).sort().slice(-8).map(key => monthMap[key]);
        setFeeSignalData(ordered.length ? ordered : ADMIN_FEE_SIGNAL_MONTHS.map(b => ({ ...b, v: 0 })));
        setFeeSignalSnapshot({
          hireSignals: hires.length,
          modeledFees: totalFees,
          modeledMinistryAllocation: Math.round(totalFees * 0.01),
        });
      } else {
        setFeeSignalData(ADMIN_FEE_SIGNAL_MONTHS.map(b => ({ ...b, v: 0 })));
        setFeeSignalSnapshot({ hireSignals:0, modeledFees:0, modeledMinistryAllocation:0 });
      }
    } catch (e) {
      if (!(isKbTimeoutError(e) || isSupabaseAuthLockAbort(e) || isSchemaMismatchError(e)) && kbIsDevRuntime()) console.warn('[kb] hydrateFeeSignalSnapshot: hire-confirmation fee signals failed', e);
      setFeeSignalData(ADMIN_FEE_SIGNAL_MONTHS.map(b => ({ ...b, v: 0 })));
      setFeeSignalSnapshot({ hireSignals:0, modeledFees:0, modeledMinistryAllocation:0 });
      setFeeSignalError(true);
    } finally {
      setLoadingFeeSignals(false);
    }
  };

  const fetchAdminReviewSummary = async () => {
    const requestId = reviewSummaryRequestRef.current + 1;
    reviewSummaryRequestRef.current = requestId;
    setReviewSummary({
      ...KB_ADMIN_REVIEW_SUMMARY_EMPTY,
      loading:true,
      error:false,
    });
    const result = await fetchAdminReviewSummarySafe();
    if (reviewSummaryRequestRef.current !== requestId) return result;
    if (result?.error || !result?.data) {
      logError("admin-review-summary", result?.error || new Error("Review summary unavailable"));
      setReviewSummary({
        ...KB_ADMIN_REVIEW_SUMMARY_EMPTY,
        loading:false,
        error:true,
      });
      return result;
    }
    setReviewSummary({
      ...result.data,
      loading:false,
      error:false,
    });
    return result;
  };

  const fetchAdminDisputeSummary = async () => {
    const requestId = disputeSummaryRequestRef.current + 1;
    disputeSummaryRequestRef.current = requestId;
    setDisputeSummary({
      ...KB_ADMIN_DISPUTE_SUMMARY_EMPTY,
      loading:true,
      error:false,
    });
    const result = await fetchAdminDisputeSummarySafe();
    if (disputeSummaryRequestRef.current !== requestId) return result;
    if (result?.error || !result?.data) {
      logError("admin-dispute-summary", result?.error || new Error("Exact dispute summary unavailable"));
      setDisputeSummary({
        ...KB_ADMIN_DISPUTE_SUMMARY_EMPTY,
        loading:false,
        error:true,
      });
      return result;
    }
    setDisputeSummary({
      ...result.data,
      loading:false,
      error:false,
    });
    return result;
  };

  const fetchFounderBrief = async ({ retry = true } = {}) => {
    if (!hasAdminAccess) {
      setFounderBrief({data:null, loading:false, error:null});
      setMatchmakerFunnelHealth({...KB_ADMIN_MATCHMAKER_FUNNEL_EMPTY, loading:false});
      return {data:null, error:null, skipped:true};
    }
    setFounderBrief(previous => ({...previous, loading:true, error:null}));
    const runFounderBriefRead = async (timeoutMs) => {
      const result = await runAdminReadLane("founder-brief", async () => {
        const refreshResult = await runSupabaseWithTimeout(
          supabase.rpc("kb_admin_refresh_project_liquidity_v0"),
          "Project liquidity refresh",
          timeoutMs
        );
        if (refreshResult?.error) throw refreshResult.error;
        return runSupabaseWithTimeout(
          supabase.rpc("kb_admin_get_founder_brief_v0"),
          "Founder Brief",
          timeoutMs
        );
      });
      if (result?.error) throw result.error;
      const payload = result?.data;
      if (!payload || ![1,2].includes(Number(payload.contract_version)) || !payload.metrics || !Array.isArray(payload.actions)) {
        const contractError = new Error("Founder Brief returned an invalid contract");
        contractError.code = "KB_FOUNDER_BRIEF_CONTRACT";
        throw contractError;
      }
      return payload;
    };
    try {
      let payload;
      try {
        payload = await runFounderBriefRead(7000);
      } catch (firstError) {
        const shouldRetry = retry && (isKbTimeoutError(firstError) || isSupabaseAuthLockAbort(firstError));
        if (!shouldRetry) throw firstError;
        await new Promise(resolve => setTimeout(resolve, 1400));
        payload = await runFounderBriefRead(9000);
      }
      setFounderBrief({data:payload, loading:false, error:null});
      return {data:payload, error:null};
    } catch (error) {
      logError("admin-founder-brief", error);
      setFounderBrief({data:null, loading:false, error});
      return {data:null, error};
    }
  };

  const fetchMatchmakerFunnelHealth = async () => {
    if (!hasAdminAccess) {
      setMatchmakerFunnelHealth({...KB_ADMIN_MATCHMAKER_FUNNEL_EMPTY, loading:false});
      return;
    }
    setMatchmakerFunnelHealth(previous => ({...previous, loading:true, error:false}));
    try {
      const [eventsRes, funnelRes] = await runAdminReadLane("matchmaker-funnel-health", () => Promise.all([
        runSupabaseWithTimeout(
          supabase
            .from("match_outcome_events_derived")
            .select("event_type, occurred_at", { count:"exact" })
            .order("occurred_at", { ascending:false })
            .limit(250),
          "Matchmaker derived events",
          6500
        ),
        runSupabaseWithTimeout(
          supabase
            .from("match_outcome_funnel_by_pair")
            .select("last_outcome_at", { count:"exact" })
            .order("last_outcome_at", { ascending:false })
            .limit(120),
          "Matchmaker funnel pairs",
          6500
        ),
      ]), 220);
      if (eventsRes?.error) throw eventsRes.error;
      if (funnelRes?.error) throw funnelRes.error;
      setMatchmakerFunnelHealth(normalizeAdminMatchmakerFunnelHealth({eventsRes, funnelRes}));
    } catch (error) {
      logError("admin-matchmaker-funnel-health", error);
      setMatchmakerFunnelHealth(previous => ({...previous, loading:false, error:true}));
    }
  };

  const refreshAdminConsole = async () => {
    if (!hasAdminAccess || refreshingAdmin) return;
    setRefreshingAdmin(true);
    try {
      await fetchKpis();
      await fetchPendingVendors();
      await fetchAdminReviewSummary();
      await fetchDisputes();
      await fetchAdminDisputeSummary();
      await fetchVerificationApps();
      await fetchAllUsers();
      await hydrateFeeSignalSnapshot();
      await fetchFounderBrief({ retry:true });
      await fetchMatchmakerFunnelHealth();
      setAdminRefreshKey(key => key + 1);
      showToast("Admin data refreshed");
    } finally {
      setRefreshingAdmin(false);
    }
  };

  const fetchDisputes = async () => {
    setLoadingDisputes(true);
    setDisputesError(false);
    try {
    const { data, error } = await fetchDetailedDisputesSafe(100);
    if (error) throw error;
    if (data) {
      setDisputes(data.map(d => ({
        id: d.id,
        title: d.title,
        body: d.body || "",
        church: d.church_name || "Unknown Church",
        vendor: d.vendor_name || "Unknown Vendor",
        amount: d.amount || "—",
        opened: new Date(d.created_at).toLocaleDateString(),
        openedAt: d.created_at,
        urgent: d.urgent || false,
        status: d.status || "open",
        resolution: d.resolution || "",
        projectId: d.project_id || null,
      })));
    }
    } catch (err) {
      logError("admin-disputes-fetch", err);
      setDisputesError(true);
      setDisputes([]);
    } finally {
      setLoadingDisputes(false);
    }
  };

  const fetchKpis = async () => {
    setLoadingKpis(true);
    setKpisError(false);
    try {
      const [
        profilesRes,
        churchesRes,
        projectsRes,
        vendorsRes,
        verifiedRes,
        completedRes,
        bidsRes,
        waitlistRes,
      ] = await runAdminReadLane("admin-kpis", async () => {
        const reads = [
          () => supabase.from("profiles").select("id", { count: "exact", head:true }),
          () => supabase.from("profiles").select("id", { count: "exact", head:true }).eq("role", "church"),
          () => supabase.from("projects").select("id", { count: "exact", head:true }).eq("record_origin", "real").eq("status", "open"),
          () => supabase.from("vendors").select("id", { count: "exact", head:true }),
          () => supabase.from("vendors").select("id", { count: "exact", head:true }).eq("verified", true),
          () => supabase.from("projects").select("id", { count: "exact", head:true }).eq("record_origin", "real").eq("status", "completed").not("completed_at", "is", null),
          () => supabase.from("bids").select("id,projects!inner(record_origin)", { count: "exact", head:true }).eq("projects.record_origin", "real"),
          () => supabase.from("waitlist").select("id", { count: "exact", head:true }).eq("review_status", "pending"),
        ];
        const results = [];
        for (const read of reads) {
          results.push(await read());
          await new Promise(resolve => setTimeout(resolve, 80));
        }
        return results;
      }, 220);
      const failed = [profilesRes, churchesRes, projectsRes, vendorsRes, verifiedRes, completedRes, bidsRes, waitlistRes].filter(result => result?.error);
      if (failed.length) {
        setKpisError(true);
        failed.forEach((result, index) => logError("admin-kpi-query", result.error, { index }));
      }
      const safeCount = (result) => {
        if (result?.error || result?.count == null) return null;
        const numeric = Number(result.count);
        return Number.isFinite(numeric) ? numeric : null;
      };
      const vendorCount = safeCount(vendorsRes);
      setKpis({
        totalUsers: safeCount(profilesRes),
        churches: safeCount(churchesRes),
        vendors: vendorCount,
        activeProjects: safeCount(projectsRes),
        verifiedVendors: safeCount(verifiedRes),
        completedProjects: safeCount(completedRes),
        totalBids: safeCount(bidsRes),
        charterApplicants: safeCount(waitlistRes),
      });
    } catch (err) {
      logError("admin-kpi-fetch", err);
      setKpisError(true);
    } finally {
      setLoadingKpis(false);
    }
  };

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    setUsersError(false);
    try {
    const columnSets = [
        "id, role, org_name, city, created_at, category, denomination, account_status, access_status, church_verified",
        "id, role, org_name, city, created_at, category, denomination, church_verified",
        "id, role, church_verified",
        "id, role, org_name, city, created_at, category, denomination, account_status, access_status",
        "id, role, org_name, city, created_at, category, denomination",
        "id, role",
        "id"
      ];
    let profilesRes = { data:[], count:0, error:null };
    for (const columns of columnSets) {
      let q = supabase.from("profiles").select(columns, { count:"exact" });
      if (userTypeFilter === "church" || userTypeFilter === "vendor") q = q.eq("role", userTypeFilter);
      const term = String(debouncedUserSearch || "").replace(/[%,()\\:*?^$|{}[\]"]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
      if (term && columns.includes("org_name")) {
        q = q.or(["org_name","city","category","denomination"].map(col => `${col}.ilike.%${term}%`).join(","));
      }
      q = q
        .order(columns.includes("created_at") ? "created_at" : "id", { ascending:userSort === "oldest" })
        .order("id", { ascending:userSort === "oldest" })
        .range(userPage * userPageSize, userPage * userPageSize + userPageSize - 1);
      profilesRes = await q;
      if (!profilesRes?.error || !isSchemaMismatchError(profilesRes.error)) break;
    }
    if (profilesRes?.error) throw profilesRes.error;
    const profileList = profilesRes.data || [];
    setUserTotal(typeof profilesRes.count === "number" ? profilesRes.count : profileList.length);
    const profileIds = profileList.map(u => u.id).filter(Boolean);
    const vendorsRes = profileIds.length
      ? await supabase.from("vendors").select("id, user_id, name, category, city, verified, tier, created_at").in("user_id", profileIds)
      : { data:[], error:null };
    if (vendorsRes?.error && !isSchemaMismatchError(vendorsRes.error)) throw vendorsRes.error;
    const vendorList = vendorsRes.data || [];
    const vendorMap = {};
    vendorList.forEach(v => { vendorMap[v.user_id] = v; });
    const merged = profileList.map(u => {
        const vRow = vendorMap[u.id];
        const suspended = isUserSuspended(u.id) || ['suspended','disabled'].includes(String(u.account_status || u.access_status || '').toLowerCase());
        return {
          id: u.id,
          name: u.org_name || vRow?.name || "Unnamed",
          type: u.role || "church",
          city: u.city || vRow?.city || "//",
          plan: suspended ? "Suspended" : (u.role === "vendor" ? (vRow?.verified ? "Faith-Verified" : "Open access") : "Always free"),
          joined: formatDateLabelSafe(u.created_at),
          joinedAt: u.created_at || vRow?.created_at || null,
          emoji: u.role === "vendor" ? "" : "CH",
          category: u.role === "vendor" ? (u.category || vRow?.category || "//") : (u.denomination || "//"),
          verified: vRow?.verified || false,
          churchVerified: !!u.church_verified,
          suspended,
        };
      });

    setAllUsers(merged);
    // Seed suspension cache from DB so isUserSuspended reflects real state, not stale localStorage
    setSuspendedUserIds(merged.filter(u => u.suspended).map(u => String(u.id)));
    } catch (err) {
      logError("admin-users-fetch", err);
      setUsersError(true);
      setAllUsers([]);
      setUserTotal(0);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAllUsersForEffect = useEffectEvent(fetchAllUsers);

  useEffect(() => {
    if (!hasAdminAccess) return;
    const timer = setTimeout(() => fetchAllUsersForEffect(), 6600);
    return () => clearTimeout(timer);
  }, [hasAdminAccess, debouncedUserSearch, userTypeFilter, userPage, userPageSize, userSort]);

  useEffect(() => {
    const timer = setTimeout(() => setUserPage(0), 0);
    return () => clearTimeout(timer);
  }, [debouncedUserSearch, userTypeFilter, userPageSize, userSort, userTriageMode]);

  useEffect(() => {
    if (loadingUsers) return;
    const maxPage = Math.max(0, Math.ceil(userTotal / userPageSize) - 1);
    if (userPage <= maxPage) return undefined;
    const timer = setTimeout(() => setUserPage(maxPage), 0);
    return () => clearTimeout(timer);
  }, [loadingUsers, userTotal, userPageSize, userPage]);

  const fetchPendingVendors = async () => {
    setLoadingVendors(true);
    setVendorsError(false);
    try {
      const { data, error, count } = await supabase
        .from("vendors")
        .select("id,name,emoji,category,city,tier,created_at,faith_statement,verified,verification_status,founding_vendor", { count:"exact" })
        .or(`verification_status.is.null,verification_status.eq.${KB_VENDOR_ADMISSION_STATUS.PENDING}`)
        .order("created_at", { ascending: false })
        .order("id", { ascending:false })
        .range(vendorApprovalPage * 50, vendorApprovalPage * 50 + 49);
      if (error) throw error;
      setPendingVendorTotal(typeof count === "number" ? count : (data || []).length);
      if (data) {
        setPendingVendors(data.map(v => ({
          id: v.id,
          name: v.name,
          emoji: v.emoji || "",
          category: v.category || "",
          city: v.city || "",
          tier: v.verified ? "Faith-Verified" : "Open access",
          createdAt: v.created_at,
          joined: new Date(v.created_at).toLocaleDateString(),
          waiting: getAdminWaitAge(v.created_at),
          statement: v.faith_statement || "",
          verified: !!v.verified,
          admissionStatus: normalizeVendorAdmissionStatus(v.verification_status),
          founding_vendor: !!v.founding_vendor,
          checks: {
            faith: !!(v.faith_statement),
            email: true,
            license: false,
            insurance: false,
            portfolio: false,
          },
        })));
      }
    } catch (err) {
      logError('admin-fetch-pending-vendors', err);
      setVendorsError(true);
      setPendingVendors([]);
      setPendingVendorTotal(0);
    } finally {
      setLoadingVendors(false);
    }
  };

  const fetchPendingVendorsForEffect = useEffectEvent(fetchPendingVendors);

  useEffect(() => {
    if (!hasAdminAccess) return;
    const timer = setTimeout(() => fetchPendingVendorsForEffect(), 1800);
    return () => clearTimeout(timer);
  }, [hasAdminAccess, vendorApprovalPage]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(pendingVendorTotal / 50) - 1);
    if (loadingVendors || vendorApprovalPage <= maxPage) return undefined;
    const timer = setTimeout(() => setVendorApprovalPage(maxPage), 0);
    return () => clearTimeout(timer);
  }, [loadingVendors, pendingVendorTotal, vendorApprovalPage]);

  // Directory admission and Faith Verification are separate decisions.
  const approveVendor = async (id) => {
    if (!requireAdminAction('admit vendor to directory')) return;
    const vendor = pendingVendors.find(item => String(item.id) === String(id));
    if (typeof window !== "undefined" && !window.confirm(`Admit ${vendor?.name || "this vendor"} to the directory? This does not grant Faith Verification.`)) return;
    const key = `approve-vendor-${id}`;
    if (adminBusyRef.current.has(key)) return;
    adminBusyRef.current.add(key);
    try {
      const { data, error } = await supabase.rpc("kb_admin_review_vendor_admission", {
        p_vendor_id: id,
        p_decision: "approved",
        p_reason: null,
      });
      const reviewedVendor = Array.isArray(data) ? data[0] : data;
      if (!error && reviewedVendor?.vendor_id) {
        const nextPending = pendingVendors.filter(x => x.id !== id);
        const nextVendor = getNextAdminQueueItem(pendingVendors, id);
        setPendingVendors(nextPending);
        setPendingVendorTotal(total => Math.max(0, total - 1));
        setModal(nextVendor);
        setAdminFocus(prev => ({ ...prev, approvalId: nextVendor?.id || null }));
        fetchAdminReviewSummary();
        fetchKpis();
        fetchAllUsers();
        showToast(formatAdminQueueToast('Vendor admitted to the directory', nextVendor, item => item?.name || 'vendor'));
      } else {
        logError('admin-approve-vendor', error || new Error('Atomic vendor-admission review returned no vendor'), { vendorId: id });
        showToast("Couldn't admit vendor to the directory — please try again.", "error");
      }
    } catch (err) {
      logError('admin-approve-vendor', err, { vendorId: id });
      showToast("Couldn't admit vendor to the directory — please try again.", "error");
    } finally {
      adminBusyRef.current.delete(key);
    }
  };

  const fetchVerificationApps = async () => {
    setLoadingVerifications(true);
    setVerificationsError(false);
    try {
      const { data, error, count } = await supabase
        .from("vendor_verifications")
        .select("*, vendors(name, category, city, verified, verification_status, suspended, user_id)", { count:"exact" })
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .order("id", { ascending:false })
        .range(verificationPage * 50, verificationPage * 50 + 49);
      if (error) throw error;

      const appRows = Array.isArray(data) ? data : [];
      const appIds = appRows.map(a => a.id).filter(Boolean);
      let faithReferenceRows = [];
      let faithResponseRows = [];

      if (appIds.length) {
        const { data: refRows, error: refError } = await supabase
          .from("vendor_references")
          .select("id,verification_id,client_name,client_email,status,sent_at,completed_at,created_at,purpose")
          .in("verification_id", appIds)
          .eq("purpose", "faith_community")
          .order("created_at", { ascending:true });
        if (refError) throw refError;
        faithReferenceRows = Array.isArray(refRows) ? refRows : [];

        const refIds = faithReferenceRows.map(r => r.id).filter(Boolean);
        if (refIds.length) {
          const { data: responseRows, error: responseError } = await supabase
            .from("vendor_reference_responses")
            .select("reference_id,would_recommend,christian_identity_confirmed,relationship_context,faith_alignment,concerns,submitted_at")
            .in("reference_id", refIds);
          if (responseError) throw responseError;
          faithResponseRows = Array.isArray(responseRows) ? responseRows : [];
        }
      }

      const responseByReference = new Map(faithResponseRows.map(r => [String(r.reference_id), r]));
      const refsByVerification = new Map();
      faithReferenceRows.forEach(ref => {
        const key = String(ref.verification_id || "");
        if (!key) return;
        if (!refsByVerification.has(key)) refsByVerification.set(key, []);
        refsByVerification.get(key).push({ ...ref, response: responseByReference.get(String(ref.id)) || null });
      });

      setVerificationTotal(typeof count === "number" ? count : appRows.length);
      setVerificationApps(appRows.map(a => ({
        id: a.id,
        vendorId: a.vendor_id,
        vendorName: a.vendors?.name || "Unknown Vendor",
        vendorCategory: a.vendors?.category || "//",
        vendorCity: a.vendors?.city || "//",
        userId: a.vendors?.user_id || null,
        vendorVerified: a.vendors?.verified === true,
        vendorSuspended: a.vendors?.suspended === true,
        admissionStatus: normalizeVendorAdmissionStatus(a.vendors?.verification_status),
        tierGoal: a.tier_goal || "faith_verified",
        faithStatement: a.faith_statement || "",
        refChurch: a.ref_church_name || "",
        refPastor: a.ref_pastor_name || "",
        refEmail: a.ref_pastor_email || "",
        refPhone: a.ref_pastor_phone || "",
        refRelationship: a.ref_relationship || "",
        covenantSigned: a.covenant_signed || false,
        status: a.status || "pending",
        submitted: new Date(a.created_at).toLocaleDateString("en-US", {month:"short",day:"numeric",year:"numeric"}),
        submittedAt: a.created_at,
        faithReferences: refsByVerification.get(String(a.id)) || [],
      })));
    } catch (err) {
      logError("admin-verification-fetch", err);
      setVerificationsError(true);
      setVerificationApps([]);
      setVerificationTotal(0);
    } finally {
      setLoadingVerifications(false);
    }
  };

  const fetchVerificationAppsForEffect = useEffectEvent(fetchVerificationApps);

  useEffect(() => {
    if (!hasAdminAccess) return;
    const timer = setTimeout(() => fetchVerificationAppsForEffect(), 5000);
    return () => clearTimeout(timer);
  }, [hasAdminAccess, verificationPage]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(verificationTotal / 50) - 1);
    if (loadingVerifications || verificationPage <= maxPage) return undefined;
    const timer = setTimeout(() => setVerificationPage(maxPage), 0);
    return () => clearTimeout(timer);
  }, [loadingVerifications, verificationTotal, verificationPage]);

  const getFaithVerificationApprovalReadiness = (app) => {
    const marketplaceApproved = normalizeVendorAdmissionStatus(app?.admissionStatus) === KB_VENDOR_ADMISSION_STATUS.APPROVED;
    const activeVendor = app?.vendorSuspended !== true;
    const completeEvidence = safeArray(app?.faithReferences).some(ref => {
      const response = ref?.response || null;
      return ref?.purpose === "faith_community"
        && ref?.status === "completed"
        && !!ref?.completed_at
        && response?.christian_identity_confirmed !== null
        && response?.christian_identity_confirmed !== undefined
        && response?.would_recommend !== null
        && response?.would_recommend !== undefined
        && String(response?.relationship_context || "").trim().length >= 20
        && String(response?.faith_alignment || "").trim().length >= 10;
    });
    return { marketplaceApproved, activeVendor, completeEvidence, ready: marketplaceApproved && activeVendor && completeEvidence };
  };

  const approveVerification = async (app) => {
    if (!requireAdminAction('approve verification')) return;
    const key = `approve-verification-${app?.id}`;
    if (!app?.id || adminBusyRef.current.has(key)) return;
    const readiness = getFaithVerificationApprovalReadiness(app);
    if (!readiness.marketplaceApproved) {
      showToast(`Approve ${app.vendorName || "this vendor"} for the Marketplace before granting Faith Verification.`, "error");
      return;
    }
    if (!readiness.activeVendor) {
      showToast(`Unsuspend ${app.vendorName || "this vendor"} before granting Faith Verification.`, "error");
      return;
    }
    if (!readiness.completeEvidence) {
      showToast("A completed Christian-community reference response is required before Faith Verification approval.", "error");
      return;
    }
    if (typeof window !== "undefined" && !window.confirm(`Approve ${app.vendorName || "this vendor"} as Faith-Verified?`)) return;
    adminBusyRef.current.add(key);
    try {
      const { data, error } = await supabase.rpc("kb_admin_review_faith_verification", {
        p_verification_id: app.id,
        p_decision: "approved",
        p_reason: null,
      });
      const reviewedVerification = Array.isArray(data) ? data[0] : data;
      if (!error && reviewedVerification?.verification_id && reviewedVerification?.vendor_verified === true) {
        const nextApps = verificationApps.filter(x => x.id !== app.id);
        const nextApp = getNextAdminQueueItem(verificationApps, app.id);
        setVerificationApps(nextApps);
        setVerificationTotal(total => Math.max(0, total - 1));
        setExpandedApp(nextApp?.id || null);
        setAdminFocus(prev => ({ ...prev, verificationId: nextApp?.id || null }));
        const reviewedUserId = reviewedVerification.user_id || app.userId;
        setAllUsers(us => us.map(u => String(u.id) === String(reviewedUserId) ? { ...u, verified:true, plan:'Faith-Verified' } : u));
        fetchAdminReviewSummary();
        fetchKpis();
        fetchAllUsers();
        showToast(formatAdminQueueToast(`${app.vendorName} is now Faith-Verified`, nextApp, item => item?.vendorName || 'verification'));
      } else {
        logError("admin-verification-approve", error || new Error('Atomic Faith Verification review returned an incomplete result'), { appId:app.id, vendorId:app.vendorId });
        showToast(`Could not approve ${app.vendorName}`, "error");
      }
    } catch (err) {
      logError("admin-verification-approve", err, { appId:app?.id, vendorId:app?.vendorId });
      showToast(`Could not approve ${app.vendorName}`, "error");
    } finally {
      adminBusyRef.current.delete(key);
    }
  };

  const rejectVerification = (app) => {
    if (!requireAdminAction('reject verification')) return;
    setRejectModal({ type: "verification", id: app.id, extra: app, label: app.vendorName || "this vendor" });
    setRejectReason("");
  };

  const doRejectVerification = async (app, reason) => {
    if (!requireAdminAction('reject verification')) return;
    const cleanReason = String(reason || "").trim();
    if (cleanReason.length < 20) {
      showToast("Add a clear rejection summary of at least 20 characters.", "error");
      return;
    }
    const key = `reject-verification-${app?.id}`;
    if (!app?.id || adminBusyRef.current.has(key)) return;
    adminBusyRef.current.add(key);
    try {
      const { data, error } = await supabase.rpc("kb_admin_review_faith_verification", {
        p_verification_id: app.id,
        p_decision: "rejected",
        p_reason: cleanReason,
      });
      const reviewedVerification = Array.isArray(data) ? data[0] : data;
      if (error || !reviewedVerification?.verification_id) {
        logError('verification-reject-atomic-review', error || new Error('Atomic Faith Verification rejection returned no application'), { appId:app.id, vendorId:app.vendorId });
        showToast(`Couldn't reject ${app.vendorName} — please try again.`, "error");
        return;
      }
      const nextApps = verificationApps.filter(x => x.id !== app.id);
      const nextApp = getNextAdminQueueItem(verificationApps, app.id);
      setVerificationApps(nextApps);
      setVerificationTotal(total => Math.max(0, total - 1));
      setExpandedApp(nextApp?.id || null);
      setAdminFocus(prev => ({ ...prev, verificationId: nextApp?.id || null }));
      fetchAdminReviewSummary();
      fetchAllUsers();
      showToast(formatAdminQueueToast(`Verification rejected for ${app.vendorName}`, nextApp, item => item?.vendorName || 'verification'));
    } catch (err) {
      logError('verification-reject-atomic-review', err, { appId:app?.id, vendorId:app?.vendorId });
      showToast(`Couldn't reject ${app.vendorName} — please try again.`, "error");
    } finally {
      adminBusyRef.current.delete(key);
    }
  };

  const rejectVendor = (id) => {
    if (!requireAdminAction('reject vendor directory admission')) return;
    const v = pendingVendors.find(x => x.id === id);
    setRejectModal({ type: "vendor", id, label: v?.name || "this vendor" });
    setRejectReason("");
    setModal(null);
  };

  const doRejectVendor = async (id, reason) => {
    if (!requireAdminAction('reject vendor directory admission')) return;
    const cleanReason = String(reason || "").trim();
    if (!cleanReason) {
      showToast("Add a rejection reason before continuing.", "error");
      return;
    }
    const key = `reject-vendor-${id}`;
    if (!id || adminBusyRef.current.has(key)) return;
    adminBusyRef.current.add(key);
    try {
      const { data, error } = await supabase.rpc("kb_admin_review_vendor_admission", {
        p_vendor_id: id,
        p_decision: "rejected",
        p_reason: cleanReason,
      });
      const reviewedVendor = Array.isArray(data) ? data[0] : data;
      if (!error && reviewedVendor?.vendor_id) {
        const nextPending = pendingVendors.filter(x => x.id !== id);
        const nextVendor = getNextAdminQueueItem(pendingVendors, id);
        setPendingVendors(nextPending);
        setPendingVendorTotal(total => Math.max(0, total - 1));
        setAdminFocus(prev => ({ ...prev, approvalId: nextVendor?.id || null }));
        fetchAdminReviewSummary();
        fetchAllUsers();
        showToast(formatAdminQueueToast('Directory admission rejected', nextVendor, item => item?.name || 'vendor'));
      } else {
        logError('admin-reject-vendor', error || new Error('Atomic vendor-admission rejection returned no vendor'), { vendorId:id });
        showToast("Couldn't update vendor status — please try again.", "error");
      }
    } catch (err) {
      logError('admin-reject-vendor-exception', err, { vendorId:id });
      showToast("Couldn't update vendor status — please try again.", "error");
    } finally {
      adminBusyRef.current.delete(key);
    }
  };

  const resolveDispute = async (id, outcome) => {
    if (!requireAdminAction('resolve dispute')) return;
    const resolvedCase = disputes.find(item => item.id === id);
    if (!resolvedCase) return;
    if (!window.confirm(`Record "${outcome}" and close ${resolvedCase.title || 'this dispute'}? This records an admin decision; it does not move money.`)) return;
    const key = `resolve-dispute-${id}`;
    if (adminBusyRef.current.has(key)) return;
    adminBusyRef.current.add(key);
    try {
      const { error } = await updateDisputeSafe(id, {
        status: "resolved",
        resolution: outcome,
        resolved_at: new Date().toISOString(),
      });
      if (!error) {
        await writeAuditLog('resolve_dispute', 'disputes', id, { outcome, disputeId: id });
        const nextDisputes = disputes.map(x => x.id === id ? {...x, status:"resolved", resolution: outcome} : x);
        const nextOpen = getNextAdminQueueItem(nextDisputes, null, item => item?.status !== 'resolved');
        setDisputes(nextDisputes);
        setAdminFocus(prev => ({ ...prev, disputeId: nextOpen?.id || null }));
        if (resolvedCase.projectId) {
          persistProjectActivityRecord(resolvedCase.projectId, {
            kind:'dispute_resolved',
            title:'Dispute resolved',
            body:`${resolvedCase.title || 'A dispute'} was resolved by admin · ${outcome}`,
            meta:{ disputeId:id, resolution:outcome },
          });
        }
        await fetchAdminDisputeSummary();
        showToast(formatAdminQueueToast(`Dispute resolved // ${outcome}`, nextOpen, item => item?.title || 'review next case'));
      } else {
        showToast("Couldn't resolve dispute — please try again.", "error");
      }
    } finally {
      adminBusyRef.current.delete(key);
    }
  };

  const updateDisputeStatus = async (id, status) => {
    if (!requireAdminAction('update dispute status')) return;
    const { error } = await updateDisputeSafe(id, { status });
    if (!error) {
      setDisputes(d => d.map(x => x.id === id ? {...x, status} : x));
      await writeAuditLog('update_dispute_status','disputes',id,{status});
      await fetchAdminDisputeSummary();
      showToast(`Status updated to ${status}`);
    } else {
      logError('dispute-status-update', error, { disputeId: id, status });
      showToast("Couldn't update dispute status — please try again.", "error");
    }
  };
  const adminChecked = !!adminUser;

  const VIEWS = {overview:"Overview",approvals:"Review Queue",projects:"Projects","get-plugged-in":"Get Plugged In",users:"Users & Access",insights:"Insights",disputes:"Disputes",privacy:"Privacy Requests",credentials:"Vendor Credentials",revenue:"Finance & Fee Signals"};
  const feeSignalBars = feeSignalData.length > 0 ? feeSignalData : ADMIN_FEE_SIGNAL_MONTHS.map(b => ({ ...b, v: 0 }));
  // Show the real pending-vendor queue only; never fall back to mock data in the admin surface.
  const todayKey = new Date().toDateString();
  const queuedToday = pendingVendors.filter(v => v.createdAt && new Date(v.createdAt).toDateString() === todayKey).length
    + verificationApps.filter(app => app.submittedAt && new Date(app.submittedAt).toDateString() === todayKey).length;
  const itemsNeedingReview = reviewSummary.loading || reviewSummary.error ? null : reviewSummary.total;
  const itemsNeedingReviewDisplay = reviewSummary.loading ? "…" : itemsNeedingReview ?? "—";
  const visiblePendingAges = [
    ...pendingVendors.map(v => v.createdAt).filter(Boolean),
    ...verificationApps.map(v => v.submittedAt).filter(Boolean),
  ]
    .map(ts => adminClockMs - new Date(ts).getTime())
    .filter(age => Number.isFinite(age) && age >= 0);
  const avgPendingMs = visiblePendingAges.length
    ? Math.round(visiblePendingAges.reduce((sum, age) => sum + age, 0) / visiblePendingAges.length)
    : 0;
  const avgPendingLabel = visiblePendingAges.length ? formatQueueAgeLabel(avgPendingMs) : "—";
  const staleApprovalsCount = visiblePendingAges.filter(age => age >= 1000 * 60 * 60 * 24).length;
  const founderBriefData = founderBrief.data;
  const founderBriefRetryReason = (() => {
    const error = founderBrief.error;
    if (!error) return null;
    const message = String(error?.message || error?.details || error || "Founder Brief read failed.");
    if (isTransientSupabaseNetworkError(error)) {
      return { label:"Temporary Supabase/network issue", detail:"The app is running, but the trusted Founder Brief read could not reach Supabase.", next:"Check the connection or Supabase tab, then use Refresh or Recheck." };
    }
    if (isKbTimeoutError(error)) {
      return { label:"Founder Brief read timed out", detail:"Supabase did not answer the trusted Founder Brief request before the safety timeout.", next:"Retry once the Admin data lane is responsive." };
    }
    if (isSupabaseAuthLockAbort(error)) {
      return { label:"Auth session busy", detail:"Supabase auth was still settling, so the Founder Brief read was paused instead of forcing a bad result.", next:"Wait a moment, then Refresh Founder Brief." };
    }
    if (error?.code === "KB_FOUNDER_BRIEF_CONTRACT") {
      return { label:"Founder Brief contract mismatch", detail:"The trusted read responded, but the payload shape was not the expected Founder Brief contract.", next:"Re-run the Founder Brief SQL/RPC patch before trusting this panel." };
    }
    return { label:"Founder Brief read failed", detail:message, next:"Use Refresh. If it repeats, check the Supabase RPC and current admin session." };
  })();
  const founderBriefMetrics = founderBriefData?.metrics || {};
  const founderProjectProvenanceScoped = founderBriefData?.project_provenance_scope === "real_only";
  const trustedActiveProjects = getFounderMetricNumber(founderBriefMetrics, "open_projects") ?? getAdminKpiNumber(kpis, "activeProjects");
  const trustedCompletedProjects = getFounderMetricNumber(founderBriefMetrics, "completed_projects") ?? getAdminKpiNumber(kpis, "completedProjects");
  const trustedVerifiedVendors = getFounderMetricNumber(founderBriefMetrics, "verified_vendors") ?? getAdminKpiNumber(kpis, "verifiedVendors");
  const trustedCharterApplicants = getFounderMetricNumber(founderBriefMetrics, "waitlist_pending_review") ?? (reviewSummary.loading ? "..." : reviewSummary.charterApplications ?? getAdminKpiNumber(kpis, "charterApplicants"));
  const totalBidsValue = getAdminKpiNumber(kpis, "totalBids");
  const totalProjectsAllTime = trustedActiveProjects == null || trustedCompletedProjects == null ? null : trustedActiveProjects + trustedCompletedProjects;
  const avgBidsPerProject = totalProjectsAllTime > 0 && totalBidsValue != null ? (totalBidsValue / totalProjectsAllTime).toFixed(1) : "-";
  const adminUserNeedsReview = (user = {}) => {
    if (user?.suspended) return true;
    if (user?.type === "vendor" && !user?.verified) return true;
    if (user?.type === "church" && !user?.churchVerified) return true;
    return false;
  };
  const adminUserJoinedMs = (user = {}) => {
    const raw = user?.joinedAt || null;
    const ms = raw ? Date.parse(raw) : Number.NaN;
    return Number.isFinite(ms) ? ms : 0;
  };
  const adminUsersNewThisWeek = allUsers.filter(user => {
    const joinedMs = adminUserJoinedMs(user);
    return joinedMs > 0 && adminClockMs - joinedMs <= 7 * 24 * 60 * 60 * 1000;
  });
  const adminUsersNeedingReview = allUsers.filter(adminUserNeedsReview);
  const filteredUsers = userTriageMode === "attention" ? adminUsersNeedingReview : userTriageMode === "all" ? allUsers : adminUsersNewThisWeek;
  // Open on accounts that need review; if none, show everyone instead of an empty view.
  useEffect(() => {
    if (userTriageChosenRef.current || loadingUsers) return;
    const timer = setTimeout(() => setUserTriageMode(adminUsersNeedingReview.length > 0 ? "attention" : "all"), 0);
    return () => clearTimeout(timer);
  }, [loadingUsers, adminUsersNeedingReview.length]);
  const exactOpenDisputes = disputeSummary.loading || disputeSummary.error ? null : disputeSummary.unresolved;
  const founderMetricCards = [
    ["real_project_records", "Real cohort projects"],
    ["open_projects", "Open projects"],
    ["active_bids", "Active bids"],
    ["verified_vendors", "Verified vendors"],
    ["waitlist_pending_review", "Pending reviews"],
    ["thin_coverage_projects", "Thin coverage alerts"],
    ["projects_waiting_for_response_window", "Missing response windows"],
    ["overdue_follow_ups", "Overdue follow-ups"],
    ["scheduled_follow_ups", "Scheduled follow-ups"],
    ["unscheduled_relationship_records", "Missing review dates"],
    ["growth_groups", "Growth groups"],
  ].map(([key,label]) => ({key,label,metric:founderBriefMetrics[key]}));
  const rawFounderActions = Array.isArray(founderBriefData?.actions) ? founderBriefData.actions.slice(0, 10) : [];
  const founderActionRows = rawFounderActions.map((action,index) => {
    const feedbackKey = getFounderActionFeedbackKey(action, index);
    return {
      action,
      index,
      feedbackKey,
      feedback:getFounderActionFeedbackLabel(founderActionFeedback?.[feedbackKey]),
      hidden:isFounderActionHiddenByFeedback(founderActionFeedback?.[feedbackKey]),
    };
  });
  const founderActions = founderActionRows.filter(row => !row.hidden);
  const handledFounderActionRows = founderActionRows.filter(row => row.hidden);
  const hiddenFounderActionCount = handledFounderActionRows.length;
  const founderActionHistoryFallbackRows = Object.entries(founderActionFeedback || {}).map(([feedbackKey,entry]) => ({
    feedbackKey,
    eventType:"current_feedback",
    status:entry?.status || "",
    note:entry?.note || "",
    title:entry?.title || "Founder action",
    reason:entry?.reason || "",
    createdAt:entry?.updatedAt || "",
    source:"Current feedback",
  })).filter(row => row.status || row.note || row.title).sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 12);
  const founderActionHistoryRows = (Array.isArray(founderActionAuditEvents) && founderActionAuditEvents.length > 0
    ? founderActionAuditEvents.map(event => ({
        feedbackKey:event?.feedback_key || event?.feedbackKey || "",
        eventType:event?.event_type || event?.eventType || "feedback_recorded",
        clientEventId:event?.client_event_id || event?.clientEventId || "",
        status:event?.status || "",
        note:event?.note || "",
        title:event?.title || "Founder action",
        reason:event?.reason || "",
        createdAt:event?.created_at || event?.createdAt || "",
        source:"Audit event",
      }))
    : founderActionHistoryFallbackRows
  ).slice(0, 12);
  const founderActionHistoryCount = founderActionHistoryRows.length;
  const founderLocalFeedbackCount = Object.keys(founderActionFeedback || {}).length;
  const founderPendingFeedbackCount = Object.values(founderActionFeedback || {}).filter(entry => entry?.syncState === "pending").length;
  const founderFeedbackContractLabel = founderFeedbackContractStatus === "ready" ? "Contract ready" : founderFeedbackContractStatus === "missing" ? "Contract missing" : "Contract checking";
  const founderFeedbackContractBadgeClass = founderFeedbackContractStatus === "ready" ? "badge-green" : founderFeedbackContractStatus === "missing" ? "badge-red" : "badge-amber";
  const founderFeedbackPersistenceNote = founderActionFeedbackRemoteReady
    ? "Founder action decisions and notes are synced to Supabase."
    : founderFeedbackContractStatus === "missing"
      ? "Founder feedback database contract is missing. Run the latest Founder feedback SQL patch, then Retry sync."
    : founderPendingFeedbackCount > 0
      ? `${founderPendingFeedbackCount} Founder decision${founderPendingFeedbackCount===1?" is":"s are"} protected locally and will retry on Recheck.`
    : hasAdminAccess
      ? "Local fallback is protecting Founder decisions in this browser until Supabase sync responds."
      : "Local fallback is active until Admin access is confirmed.";
  const founderActionDestinationSet = new Set(rawFounderActions.map(action => action?.destination).filter(Boolean));
  const founderActionTypeSet = new Set(rawFounderActions.map(action => action?.action_type).filter(Boolean));
  const founderRoutingHealthy = founderActionDestinationSet.has("admin_waitlist") && founderActionDestinationSet.has("growth") && founderActionTypeSet.has("marketplace_coverage");
  const founderActionSmokeChecks = [
    {
      key:"coverage",
      label:"Coverage route",
      ok:founderActionTypeSet.has("marketplace_coverage"),
      note:founderActionTypeSet.has("marketplace_coverage") ? "Vendor coverage launcher present" : "Missing vendor coverage launcher",
    },
    {
      key:"charter",
      label:"Charter review",
      ok:founderActionDestinationSet.has("admin_waitlist"),
      note:founderActionDestinationSet.has("admin_waitlist") ? "Charter review launcher present" : "Missing Charter review launcher",
    },
    {
      key:"growth",
      label:"Get Plugged In",
      ok:founderActionDestinationSet.has("growth"),
      note:founderActionDestinationSet.has("growth") ? "Growth launcher present" : "Missing Get Plugged In launcher",
    },
  ];
  const founderActionSmokeReady = founderActionSmokeChecks.every(check => check.ok);
  const founderQaLastCheckedLabel = founderQaLastCheckedAt
    ? new Date(founderQaLastCheckedAt).toLocaleTimeString([], {hour:"numeric", minute:"2-digit"})
    : founderBriefData?.generated_at
      ? new Date(founderBriefData.generated_at).toLocaleTimeString([], {hour:"numeric", minute:"2-digit"})
      : "Not yet";
  const founderBriefGeneratedAtDate = founderBriefData?.generated_at ? new Date(founderBriefData.generated_at) : null;
  const founderBriefGeneratedAtValid = founderBriefGeneratedAtDate instanceof Date && !Number.isNaN(founderBriefGeneratedAtDate.getTime());
  const founderBriefAgeMinutes = founderBriefGeneratedAtValid ? Math.max(0, Math.round((adminClockMs - founderBriefGeneratedAtDate.getTime()) / 60000)) : null;
  const founderBriefFreshnessState = founderBrief.loading
    ? "Checking"
    : !founderBriefGeneratedAtValid
      ? "No timestamp"
      : founderBriefAgeMinutes <= 15
        ? "Fresh"
        : founderBriefAgeMinutes <= 60
          ? "Aging"
          : "Stale";
  const founderBriefFreshnessTone = founderBriefFreshnessState === "Fresh" ? "healthy" : founderBriefFreshnessState === "Aging" ? "checking" : "attention";
  const founderBriefFreshnessBadgeClass = founderBriefFreshnessTone === "healthy" ? "badge-green" : founderBriefFreshnessTone === "checking" ? "badge-amber" : "badge-red";
  const founderBriefFreshnessNote = founderBrief.loading
    ? "Waiting for the latest brief"
    : !founderBriefGeneratedAtValid
      ? "Generated timestamp missing"
      : founderBriefAgeMinutes <= 1
        ? "Generated just now"
        : `Generated ${founderBriefAgeMinutes} min ago`;
  const runFounderQaRecheck = () => {
    setFounderQaLastCheckedAt(new Date().toISOString());
    fetchFounderBrief({ retry:true });
    loadFounderActionFeedback();
    loadFounderActionAuditEvents();
  };
  const founderSourceHealthy = !!founderBriefData && !founderBrief.error && founderMetricCards.some(({metric}) => metric?.status === "available");
  const founderActionReadinessItems = [
    {
      label:"Source data",
      value:founderBrief.loading ? "Checking" : founderSourceHealthy ? "Live" : "Needs review",
      tone:founderBrief.loading ? "checking" : founderSourceHealthy ? "healthy" : "attention",
      note:founderSourceHealthy ? "Founder metrics are available" : "Brief source is unavailable",
    },
    {
      label:"Action routing",
      value:founderRoutingHealthy ? "Ready" : "Partial",
      tone:founderRoutingHealthy ? "healthy" : "attention",
      note:founderRoutingHealthy ? "Coverage, Charter, and Growth routes detected" : "One or more Founder routes is missing",
    },
    {
      label:"Feedback persistence",
      value:founderActionFeedbackRemoteReady ? "Supabase" : founderFeedbackContractStatus === "missing" ? "Needs SQL" : "Local",
      tone:founderActionFeedbackRemoteReady ? "healthy" : founderFeedbackContractStatus === "missing" ? "attention" : "checking",
      note:founderActionFeedbackRemoteReady ? "Founder decisions sync durably" : founderFeedbackContractStatus === "missing" ? "Database contract missing" : `${founderLocalFeedbackCount} protected locally`,
    },
    {
      label:"Brief freshness",
      value:founderBriefFreshnessState,
      tone:founderBriefFreshnessTone,
      note:founderBriefFreshnessNote,
    },
    {
      label:"Visible actions",
      value:`${founderActions.length}/${rawFounderActions.length || 0}`,
      tone:founderActions.length ? "healthy" : rawFounderActions.length ? "checking" : "attention",
      note:`${hiddenFounderActionCount} handled or snoozed`,
    },
  ];
  const founderMarketHealth = Array.isArray(founderBriefData?.market_health) ? founderBriefData.market_health.slice(0, 8) : [];
  const founderAvailableMetricCount = founderMetricCards.filter(({metric}) => metric?.status === "available").length;
  const founderBriefHasOperationalData = founderAvailableMetricCount > 0 || rawFounderActions.length > 0 || founderMarketHealth.length > 0;
  const founderBriefRawWarnings = Array.isArray(founderBriefData?.warnings) ? founderBriefData.warnings.filter(Boolean) : [];
  const founderBriefWarningRows = founderBriefRawWarnings.map(warning => {
    const issue = String(warning || "Founder data source unavailable.").trim();
    const normalized = issue.toLowerCase();
    if (normalized.includes("market") || normalized.includes("coverage") || normalized.includes("vendor")) {
      return { source:"Market coverage", issue, next:"Recheck after vendor directory, project, or coverage data changes." };
    }
    if (normalized.includes("waitlist") || normalized.includes("charter") || normalized.includes("applicant")) {
      return { source:"Charter review", issue, next:"Open Review Queue, then Recheck after applicant statuses update." };
    }
    if (normalized.includes("action") || normalized.includes("routing") || normalized.includes("destination")) {
      return { source:"Founder actions", issue, next:"Use Founder action smoke, then Recheck to rebuild routing." };
    }
    if (normalized.includes("metric") || normalized.includes("count") || normalized.includes("kpi")) {
      return { source:"Founder metrics", issue, next:"Refresh Admin data, then Recheck Founder data." };
    }
    return { source:"Founder Brief source", issue, next:"Refresh Admin data, then Recheck Founder data." };
  });
  const founderBriefEmptyStateReason = founderBrief.loading
    ? "Founder data is still loading."
    : founderBrief.error
      ? "Founder data could not be read right now."
      : !founderBriefHasOperationalData
        ? "Not enough Founder data is available yet."
        : "";
  const displayFounderMetric = metric => metric?.status === "available" && Number.isFinite(Number(metric?.value))
    ? Number(metric.value).toLocaleString()
    : "Unavailable";
  const openFounderBriefAction = action => {
    if (action?.destination === "admin_waitlist") {
      const seed = buildFounderWaitlistReviewSeed(action);
      setFounderWaitlistReviewContext(seed);
      openAdminView("approvals", {reviewSection:"admin-review-charter"}, seed?.applicantLabel ? `Opening Charter review for ${seed.applicantLabel}` : "Opening Charter review");
    }
    else if (action?.destination === "projects" && action?.action_type === "marketplace_coverage" && typeof nav === "function") {
      const seed = buildFounderCoverageVendorSeed(action);
      queueVendorNavigation(nav, seed, { returnContext:{ source:"founder-brief", screen:"vendors", projectId:seed.projectId || null, projectTitle:seed.projectTitle || null, category:seed.category || null } });
    }
    else if (action?.destination === "projects" && typeof nav === "function") nav("projects");
    else if (action?.destination === "growth") {
      const seed = buildFounderGrowthAdminSeed(action);
      setFounderGrowthContext(seed);
      openAdminView("get-plugged-in", {}, seed?.communityLabel ? `Opening Get Plugged In for ${seed.communityLabel}` : "Opening Get Plugged In");
    }
  };
  const loadFounderActionFeedback = async () => {
    if (!hasAdminAccess) {
      setFounderActionFeedbackRemoteReady(false);
      setFounderFeedbackContractStatus("checking");
      return;
    }
    try {
      const result = await runAdminReadLane("founder-feedback-read", () => runSupabaseWithTimeout(
        supabase.rpc("kb_admin_get_founder_action_feedback_v0"),
        "Founder action feedback",
        6500
      ));
      if (result?.error) throw result.error;
      const remoteFeedback = result?.data && typeof result.data === "object" && !Array.isArray(result.data) ? result.data : {};
      const localFeedback = readLocalJson(KB_FOUNDER_ACTION_FEEDBACK_KEY, {}) || {};
      const pendingLocalEntries = Object.entries(localFeedback).filter(([, entry]) => entry?.syncState === "pending");
      const next = {...remoteFeedback};
      let pendingFailureCount = 0;
      for (const [feedbackKey, entry] of pendingLocalEntries) {
        try {
          const saveResult = await runAdminReadLane("founder-feedback-pending-sync", () => runSupabaseWithTimeout(
            supabase.rpc("kb_admin_record_founder_action_feedback_v0", {
              p_feedback_key:feedbackKey,
              p_status:entry?.status || "done",
              p_title:entry?.title || "",
              p_reason:entry?.reason || "",
              p_action:entry?.action || {},
              p_snoozed_until:entry?.snoozedUntil ? new Date(entry.snoozedUntil).toISOString() : null,
              p_note:entry?.note || "",
              p_client_event_id:entry?.clientEventId || null,
            }),
            "Founder pending feedback sync",
            6500
          ));
          if (saveResult?.error) throw saveResult.error;
          next[feedbackKey] = {...entry, syncState:"synced"};
        } catch (pendingError) {
          pendingFailureCount += 1;
          next[feedbackKey] = entry;
          if (!isSchemaMismatchError(pendingError) && !isKbTimeoutError(pendingError) && !isSupabaseAuthLockAbort(pendingError) && !isTransientSupabaseNetworkError(pendingError)) {
            logError("admin-founder-feedback-pending-sync", pendingError, {feedbackKey});
          }
        }
      }
      setFounderActionFeedback(next);
      writeLocalJson(KB_FOUNDER_ACTION_FEEDBACK_KEY, next);
      setFounderActionFeedbackRemoteReady(pendingFailureCount === 0);
      setFounderFeedbackContractStatus(pendingFailureCount === 0 ? "ready" : "retrying");
    } catch (error) {
      setFounderActionFeedbackRemoteReady(false);
      setFounderFeedbackContractStatus(isSchemaMismatchError(error) ? "missing" : "retrying");
      if (!isSchemaMismatchError(error) && !isKbTimeoutError(error) && !isSupabaseAuthLockAbort(error)) {
        logError("admin-founder-feedback-read", error);
      }
    }
  };

  const loadFounderActionAuditEvents = async () => {
    if (!hasAdminAccess) {
      setFounderActionAuditEvents([]);
      setFounderActionAuditLoading(false);
      setFounderActionAuditError(false);
      return;
    }
    setFounderActionAuditLoading(true);
    setFounderActionAuditError(false);
    try {
      const result = await runAdminReadLane("founder-feedback-events-read", () => runSupabaseWithTimeout(
        supabase
          .from("kb_founder_action_feedback_events")
          .select("event_id,feedback_key,event_type,status,note,title,reason,client_event_id,created_at")
          .order("created_at", {ascending:false})
          .limit(12),
        "Founder action history",
        6500
      ));
      if (result?.error) throw result.error;
      setFounderActionAuditEvents(Array.isArray(result?.data) ? result.data : []);
      setFounderActionAuditError(false);
      setFounderFeedbackContractStatus(status => status === "missing" ? "missing" : "ready");
      const protectedFeedback = readLocalJson(KB_FOUNDER_ACTION_FEEDBACK_KEY, {}) || {};
      const pendingProtectedCount = Object.values(protectedFeedback).filter(entry => entry?.syncState === "pending").length;
      if (pendingProtectedCount === 0) setFounderActionFeedbackRemoteReady(true);
    } catch (error) {
      setFounderActionAuditEvents([]);
      setFounderActionAuditError(true);
      setFounderFeedbackContractStatus(isSchemaMismatchError(error) ? "missing" : "retrying");
      if (!isSchemaMismatchError(error) && !isKbTimeoutError(error) && !isSupabaseAuthLockAbort(error)) {
        logError("admin-founder-feedback-events-read", error);
      }
    } finally {
      setFounderActionAuditLoading(false);
    }
  };

  const loadFounderActionFeedbackForEffect = useEffectEvent(loadFounderActionFeedback);
  const loadFounderActionAuditEventsForEffect = useEffectEvent(loadFounderActionAuditEvents);
  const fetchKpisForEffect = useEffectEvent(fetchKpis);
  const fetchAdminReviewSummaryForEffect = useEffectEvent(fetchAdminReviewSummary);
  const fetchDisputesForEffect = useEffectEvent(fetchDisputes);
  const fetchAdminDisputeSummaryForEffect = useEffectEvent(fetchAdminDisputeSummary);
  const hydrateFeeSignalSnapshotForEffect = useEffectEvent(hydrateFeeSignalSnapshot);
  const fetchFounderBriefForEffect = useEffectEvent(fetchFounderBrief);
  const fetchMatchmakerFunnelHealthForEffect = useEffectEvent(fetchMatchmakerFunnelHealth);

  useEffect(() => {
    const timer = setTimeout(() => loadFounderActionFeedbackForEffect(), 0);
    return () => clearTimeout(timer);
  }, [hasAdminAccess]);

  useEffect(() => {
    const timer = setTimeout(() => loadFounderActionAuditEventsForEffect(), 0);
    return () => clearTimeout(timer);
  }, [hasAdminAccess]);

  useEffect(() => {
    if (!hasAdminAccess) {
      reviewSummaryRequestRef.current += 1;
      disputeSummaryRequestRef.current += 1;
      const resetTimer = setTimeout(() => {
        setLoadingVendors(false);
        setLoadingUsers(false);
        setLoadingDisputes(false);
        setLoadingVerifications(false);
        setLoadingKpis(false);
        setLoadingFeeSignals(false);
        setFounderBrief({data:null, loading:false, error:null});
        setMatchmakerFunnelHealth({...KB_ADMIN_MATCHMAKER_FUNNEL_EMPTY, loading:false});
        setReviewSummary({...KB_ADMIN_REVIEW_SUMMARY_EMPTY, loading:false, error:false});
        setDisputeSummary({...KB_ADMIN_DISPUTE_SUMMARY_EMPTY, loading:false, error:false});
      }, 0);
      return () => clearTimeout(resetTimer);
    }
    const timers = [
      setTimeout(() => fetchKpisForEffect(), 250),
      setTimeout(() => fetchAdminReviewSummaryForEffect(), 2600),
      setTimeout(() => fetchDisputesForEffect(), 4200),
      setTimeout(() => fetchAdminDisputeSummaryForEffect(), 5600),
      setTimeout(() => hydrateFeeSignalSnapshotForEffect(), 7200),
      setTimeout(() => fetchFounderBriefForEffect({ retry:true }), 8800),
      setTimeout(() => fetchMatchmakerFunnelHealthForEffect(), 10400),
    ];
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [hasAdminAccess, KB_ADMIN_DISPUTE_SUMMARY_EMPTY, KB_ADMIN_MATCHMAKER_FUNNEL_EMPTY, KB_ADMIN_REVIEW_SUMMARY_EMPTY]);

  const recordFounderActionFeedback = (feedbackKey, action, status, note = "") => {
    if (!feedbackKey || !status) return;
    const entry = {
      status,
      title:action?.title || "",
      reason:action?.reason || "",
      note:String(note || "").trim().slice(0, 1200),
      updatedAt:new Date().toISOString(),
      syncState:"pending",
      clientEventId:createFounderFeedbackEventId(),
      action:action || {},
      snoozedUntil:status === "snoozed" ? new Date().getTime() + KB_FOUNDER_ACTION_SNOOZE_MS : null,
    };
    const next = {
      ...(founderActionFeedback || {}),
      [feedbackKey]: entry,
    };
    setFounderActionFeedback(next);
    writeLocalJson(KB_FOUNDER_ACTION_FEEDBACK_KEY, next);
    setTimeout(() => showToast(status === "done" ? "Founder action marked done" : status === "snoozed" ? "Founder action snoozed until tomorrow" : "Founder action hidden"), 0);
    runAdminReadLane("founder-feedback-write", () => runSupabaseWithTimeout(
      supabase.rpc("kb_admin_record_founder_action_feedback_v0", {
        p_feedback_key:feedbackKey,
        p_status:status,
        p_title:entry.title,
        p_reason:entry.reason,
        p_action:action || {},
        p_snoozed_until:entry.snoozedUntil ? new Date(entry.snoozedUntil).toISOString() : null,
        p_note:entry.note,
        p_client_event_id:entry.clientEventId,
      }),
      "Founder action feedback save",
      6500
    )).then(result => {
      if (result?.error) throw result.error;
      setFounderActionFeedback(current => {
        const currentEntry = current?.[feedbackKey];
        if (!currentEntry || currentEntry.updatedAt !== entry.updatedAt) return current;
        const syncedEntry = {...currentEntry, syncState:"synced"};
        const synchronized = {...current, [feedbackKey]:syncedEntry};
        writeLocalJson(KB_FOUNDER_ACTION_FEEDBACK_KEY, synchronized);
        return synchronized;
      });
      setFounderActionFeedbackRemoteReady(true);
      setFounderFeedbackContractStatus("ready");
      loadFounderActionAuditEvents();
    }).catch(error => {
      setFounderActionFeedbackRemoteReady(false);
      if (!isSchemaMismatchError(error) && !isKbTimeoutError(error) && !isSupabaseAuthLockAbort(error)) {
        logError("admin-founder-feedback-write", error, {feedbackKey, status, hasNote:!!entry.note});
      }
    });
  };
  const recordFounderActionFeedbackWithNoteDraft = (feedbackKey, action, status) => {
    const note = String(founderActionNoteDrafts?.[feedbackKey] ?? founderActionFeedback?.[feedbackKey]?.note ?? "").trim();
    if (!note) {
      setActiveFounderNoteKey(feedbackKey);
      setTimeout(() => showToast("Add a note in the Founder card, then save it"), 0);
      return;
    }
    recordFounderActionFeedback(feedbackKey, action, status, note);
    setActiveFounderNoteKey(null);
    setFounderActionNoteDrafts(previous => {
      const next = {...(previous || {})};
      delete next[feedbackKey];
      return next;
    });
  };
  const restoreFounderActionFeedback = (feedbackKey, action = {}) => {
    if (!feedbackKey) return;
    const existing = founderActionFeedback?.[feedbackKey] || {};
    const restoreClientEventId = `restore-${String(feedbackKey).replace(/[^a-zA-Z0-9:_-]/g, "-").slice(0, 72)}-${String(existing?.updatedAt || "current").replace(/[^a-zA-Z0-9:_-]/g, "-").slice(0, 32)}`;
    const next = {...(founderActionFeedback || {})};
    delete next[feedbackKey];
    setFounderActionFeedback(next);
    writeLocalJson(KB_FOUNDER_ACTION_FEEDBACK_KEY, next);
    setFounderActionNoteDrafts(previous => {
      const drafts = {...(previous || {})};
      delete drafts[feedbackKey];
      return drafts;
    });
    if (activeFounderNoteKey === feedbackKey) setActiveFounderNoteKey(null);
    setTimeout(() => showToast("Founder action restored"), 0);
    runAdminReadLane("founder-feedback-restore", () => runSupabaseWithTimeout(
      supabase
        .from("kb_founder_action_feedback")
        .delete()
        .eq("feedback_key", feedbackKey),
      "Founder action feedback restore",
      6500
    )).then(result => {
      if (result?.error) throw result.error;
      setFounderActionFeedbackRemoteReady(true);
      setFounderFeedbackContractStatus("ready");
      return runAdminReadLane("founder-feedback-restore-event", () => runSupabaseWithTimeout(
        supabase
          .from("kb_founder_action_feedback_events")
          .insert({
            feedback_key:feedbackKey,
            event_type:"restore",
            status:existing?.status || null,
            note:existing?.note || "",
            title:existing?.title || action?.title || "",
            reason:existing?.reason || action?.reason || "",
            action:action || {},
            client_event_id:restoreClientEventId,
          }),
        "Founder action restore audit",
        6500
      ));
    }).then(() => {
      loadFounderActionAuditEvents();
    }).catch(error => {
      setFounderActionFeedbackRemoteReady(false);
      if (!isSchemaMismatchError(error) && !isKbTimeoutError(error) && !isSupabaseAuthLockAbort(error)) {
        logError("admin-founder-feedback-restore", error, {feedbackKey});
      }
    });
  };
  const resetFounderActionFeedback = () => {
    const resetClientEventId = createFounderFeedbackEventId();
    setFounderActionFeedback({});
    writeLocalJson(KB_FOUNDER_ACTION_FEEDBACK_KEY, {});
    setTimeout(() => showToast("Founder action feedback reset"), 0);
    runAdminReadLane("founder-feedback-reset", () => runSupabaseWithTimeout(
      supabase.rpc("kb_admin_reset_founder_action_feedback_v0", {
        p_client_event_id:resetClientEventId,
      }),
      "Founder action feedback reset",
      6500
    )).then(result => {
      if (result?.error) throw result.error;
      setFounderActionFeedbackRemoteReady(true);
      setFounderFeedbackContractStatus("ready");
      loadFounderActionAuditEvents();
    }).catch(error => {
      setFounderActionFeedbackRemoteReady(false);
      if (!isSchemaMismatchError(error) && !isKbTimeoutError(error) && !isSupabaseAuthLockAbort(error)) {
        logError("admin-founder-feedback-reset", error);
      }
    });
  };
  const adminAttentionCount = itemsNeedingReview == null || exactOpenDisputes == null
    ? null
    : itemsNeedingReview + exactOpenDisputes;
  const overviewPrimaryCards = getAdminOverviewPrimaryCards({
    kpis:{
      ...kpis,
      activeProjects:trustedActiveProjects,
      completedProjects:trustedCompletedProjects,
      verifiedVendors:trustedVerifiedVendors,
      charterApplicants:trustedCharterApplicants,
    },
    itemsNeedingReview,
    reviewSummaryLoading:reviewSummary.loading,
    openUserManagement,
    openAdminView,
  });
  const overviewSecondaryCards = getAdminOverviewSecondaryCards({ kpis:{...kpis, totalBids:totalBidsValue}, avgBidsPerProject, reviewSummary, disputeSummary, openAdminView });
  // The top-bar health claim covers eight core datasets loaded for every Admin
  // view plus any supplemental dataset required by the currently open view.
  // An unreported supplemental child starts as loading, never as implicitly
  // healthy. This prevents nested queue/feed failures from being hidden behind
  // a green global status.
  const activeSupplementalDatasetKeys = ({
    overview:["activityFeed"],
    approvals:["charterMembers","ambassadorApplications","partnershipApplications"],
    revenue:["referralLeaderboard"],
  })[adminView] || [];
  const requiredAdminDatasets = [
    {key:"directoryAdmissions", label:"directory admissions", loading:loadingVendors, error:vendorsError},
    {key:"users", label:"users", loading:loadingUsers, error:usersError},
    {key:"recentDisputes", label:"recent disputes", loading:loadingDisputes, error:disputesError},
    {key:"disputeSummary", label:"dispute summary", loading:disputeSummary.loading, error:disputeSummary.error},
    {key:"faithVerifications", label:"faith verifications", loading:loadingVerifications, error:verificationsError},
    {key:"platformKpis", label:"platform metrics", loading:loadingKpis, error:kpisError},
    {key:"feeSignals", label:"fee signals", loading:loadingFeeSignals, error:false},
    {key:"reviewSummary", label:"review summary", loading:reviewSummary.loading, error:reviewSummary.error},
    ...(adminView === "overview" ? [{key:"founderBrief", label:"founder brief", loading:founderBrief.loading, error:!!founderBrief.error}] : []),
    ...activeSupplementalDatasetKeys.map(key => ({
      key,
      label:({
        activityFeed:"activity feed",
        ambassadorApplications:"ambassador applications",
        partnershipApplications:"partnership inquiries",
        charterMembers:"charter members",
        referralLeaderboard:"referral leaderboard",
      })[key] || key,
      ...(supplementalDataHealth[key] || {loading:true,error:false}),
    })),
  ];
  const failedAdminDatasets = requiredAdminDatasets.filter(dataset => dataset.error);
  const adminDataIssues = failedAdminDatasets.length;
  const adminDataLoading = refreshingAdmin || requiredAdminDatasets.some(dataset => dataset.loading);
  const adminDataStatusText = adminDataIssues
    ? `Partially degraded (${adminDataIssues})`
    : adminDataLoading
      ? "Checking required data"
      : "Required data healthy";
  const adminDataStatusTitle = adminDataIssues
    ? `Unavailable: ${failedAdminDatasets.map(dataset => dataset.label).join(", ")}`
    : adminDataLoading
      ? "One or more required Admin datasets are still loading."
      : `All ${requiredAdminDatasets.length} required datasets for this Admin view loaded successfully.`;

  // Keep optional Founder/AI advisory panels from taking down the entire Admin console.
  // These builders are display-only: a malformed advisory payload must degrade its own panel,
  // while the authoritative Admin queues and controls remain available.
  const adminSafeDerive = (label, factory, fallback) => {
    try { return factory(); }
    catch (error) {
      logError("admin-derived-panel", error, { panel: label });
      return typeof fallback === "function" ? fallback() : fallback;
    }
  };
  const aiMarketplaceLiquidity = adminSafeDerive("marketplace-liquidity", () => buildFaithBidMarketplaceLiquiditySnapshot({ activeProjects:trustedActiveProjects, completedProjects:trustedCompletedProjects, verifiedVendors:trustedVerifiedVendors, totalBids:totalBidsValue, reviewSummary, disputeSummary }), { demand:0, supply:0, bids:0, avgBids:0, coverageRatio:0, reviewLoad:null, openCases:null, status:"unavailable", statusLabel:"Unavailable", headline:"Marketplace advisory unavailable.", nextActions:[] });
  const aiSignalActionContracts = adminSafeDerive("signal-action-contracts", () => buildFaithBidSignalActionContracts({ liquiditySnapshot:aiMarketplaceLiquidity, adminDataIssues, adminDataLoading, founderBriefReady:founderSourceHealthy }), []);
  const aiGrowthPriority = adminSafeDerive("growth-priority", () => buildFaithBidGrowthPriorityUpgrade({ liquiditySnapshot:aiMarketplaceLiquidity, founderActions, founderMarketHealth }), { primary:"Unavailable", route:"Admin Overview", reason:"Growth advisory unavailable." });
  const aiLaunchSentinelBase = adminSafeDerive("launch-sentinel", () => buildFaithBidLaunchReadinessSentinel({ requiredAdminDatasets, adminDataIssues, adminDataLoading, founderBriefReady:founderSourceHealthy, liquiditySnapshot:aiMarketplaceLiquidity }), { status:"attention", label:"Launch data unavailable", checkedCount:requiredAdminDatasets.length, blockers:["Launch advisory could not be derived."], bypassTests:[] });
  const aiLaunchSentinel = { ...(aiLaunchSentinelBase || {}), blockers:Array.isArray(aiLaunchSentinelBase?.blockers)?aiLaunchSentinelBase.blockers:[], bypassTests:Array.isArray(aiLaunchSentinelBase?.bypassTests)?aiLaunchSentinelBase.bypassTests:[] };
  const aiGatewayShellBase = adminSafeDerive("gateway-shell", () => buildFaithBidAiGatewayShell({ launchSentinel:aiLaunchSentinel, signalContracts:aiSignalActionContracts }), { status:"shell_guarded", label:"Gateway shell guarded", mode:"No client-side model call", contract:"Unavailable", guardrails:[] });
  const aiGatewayShell = { ...(aiGatewayShellBase || {}), guardrails:Array.isArray(aiGatewayShellBase?.guardrails)?aiGatewayShellBase.guardrails:[] };
  const aiShadowModeUseCaseBase = adminSafeDerive("shadow-mode", () => buildFaithBidShadowModeUseCase({ liquiditySnapshot:aiMarketplaceLiquidity, growthPriority:aiGrowthPriority, gatewayShell:aiGatewayShell }), { name:"Vendor coverage recommendation", status:"guarded-shadow", input:"Unavailable", output:"Unavailable", decision:"Review source data before action.", evidence:[], bypassTests:[], confidence:"Guarded" });
  const aiShadowModeUseCase = { ...(aiShadowModeUseCaseBase || {}), evidence:Array.isArray(aiShadowModeUseCaseBase?.evidence)?aiShadowModeUseCaseBase.evidence:[], bypassTests:Array.isArray(aiShadowModeUseCaseBase?.bypassTests)?aiShadowModeUseCaseBase.bypassTests:[] };
  const aiLiquidityDetailRows = adminSafeDerive("liquidity-detail", () => buildFaithBidLiquidityDetailRows(aiMarketplaceLiquidity), []);
  const founderBriefEvidenceTraceRows = adminSafeDerive("founder-evidence-trace", () => buildFounderBriefEvidenceTrace({ founderMetricCards, founderActions, founderMarketHealth, founderBriefWarningRows, founderBriefFreshnessState, founderActionHistoryCount, aiGrowthPriority }), []);
  const growthSignalQualityRows = adminSafeDerive("growth-signal-quality", () => buildFaithBidGrowthSignalQualityRows({ aiGrowthPriority, founderActions, founderMarketHealth, aiMarketplaceLiquidity }), []);
  const launchReadinessDrilldownRows = adminSafeDerive("launch-readiness-drilldown", () => buildFaithBidLaunchReadinessDrilldownRows({ aiLaunchSentinel, requiredAdminDatasets, aiMarketplaceLiquidity, founderSourceHealthy }), []);
  const dataQualityRepairRows = adminSafeDerive("data-quality-repair", () => buildFaithBidDataQualityRepairRows({ founderBriefWarningRows, requiredAdminDatasets, founderMarketHealth, aiMarketplaceLiquidity }), []);
  const vendorSuccessCoachRows = adminSafeDerive("vendor-success-coach", () => buildFaithBidVendorSuccessCoachRows({ aiMarketplaceLiquidity, reviewSummary, founderMarketHealth, founderBriefMetrics }), []);
  const churchProjectRescueRows = adminSafeDerive("church-project-rescue", () => buildFaithBidChurchProjectRescueRows({ founderBriefMetrics }), []);
  const outcomeLearningLedgerBase = adminSafeDerive("outcome-learning-ledger", () => buildFaithBidOutcomeLearningLedgerRows({ matchmakerFunnelHealth, aiMarketplaceLiquidity }), { stages:[], countedEvents:0, learningStatus:"Unavailable", summary:"Outcome learning advisory unavailable.", lastOutcomeAt:null, liquidityHeadline:aiMarketplaceLiquidity?.headline || "Unavailable" });
  const outcomeLearningLedger = { ...(outcomeLearningLedgerBase || {}), stages:Array.isArray(outcomeLearningLedgerBase?.stages)?outcomeLearningLedgerBase.stages:[] };
  const humanActionQueueRows = adminSafeDerive("human-action-queue", () => buildFaithBidHumanActionQueueRows({ aiShadowModeUseCase, aiMarketplaceLiquidity, dataQualityRepairRows, vendorSuccessCoachRows, churchProjectRescueRows, founderActions, aiLaunchSentinel, matchmakerFunnelHealth }), []);
  const runHumanActionQueueRoute = (route) => {
    if (route === "recheck") { runFounderQaRecheck(); return; }
    if (route === "refresh") { refreshAdminConsole(); return; }
    if (route === "growth") { if (typeof nav === "function") nav("growth"); return; }
    if (route === "projects") { openAdminView("projects"); return; }
    if (route === "approvals") { openAdminView("approvals"); return; }
    if (route === "founder") { if (founderActions[0]?.action) openFounderBriefAction(founderActions[0].action); return; }
  };
  if (!adminChecked) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--abg)",color:"var(--atext)",fontSize:13}}>Verifying access…</div>;
  if (!hasAdminAccess) return (
    <div className="page-shell-onboard">
      <div style={{textAlign:"center",padding:"48px 40px",background:"var(--abg2)",borderRadius:16,border:"1px solid var(--aborder)",maxWidth:380}}>
        <div style={{fontSize:32,marginBottom:16}}>🔒</div>
        <div style={{fontFamily:"var(--font-display),serif",fontSize:20,fontWeight:700,color:"var(--atext)",marginBottom:8}}>Access Denied</div>
        <div style={{fontSize:13,color:"var(--atext-mid)"}}>This area is restricted to platform administrators only.</div>
      </div>
    </div>
  );

  return (
    <div className="admin-app admin-app-stress admin-premium-shell faithbid-admin-v853bl">
      <style>{FAITHBID_ADMIN_V853BK_CSS}</style>
      <style>{ADMIN_LIGHT_THEME_CSS}</style>
      <aside className="admin-sidenav">
        {/* Nav */}
        <nav ref={adminNavScrollRef} className="admin-nav-section" aria-label="Admin sections">
          <div className="admin-nav-label">Platform</div>
          <div className="admin-dense-nav">
          {[
            {id:"overview",  label:"Overview", note:"Health & priorities", glyph:"⌂"},
            {id:"insights",  label:"Insights", note:"Signals & diagnostics", glyph:"◇"},
            {id:"approvals", label:"Review Queue", note:"Admissions & trust", glyph:"✓", badge:itemsNeedingReview||null, badgeColor:"amber"},
            {id:"projects",  label:"Projects", note:"Marketplace moderation", glyph:"P"},
            {id:"get-plugged-in", label:"Get Plugged In", note:"Connections & invitations", glyph:"+"},
            {id:"users",     label:"Users & Access", note:"Accounts & controls", glyph:"◎"},
            {id:"disputes",  label:"Disputes", note:"Cases & resolution", glyph:"!", badge:exactOpenDisputes||null, badgeColor:"red"},
            {id:"credentials", label:"Vendor Credentials", note:"Insurance & license review", glyph:"✓"},
            {id:"privacy",   label:"Privacy Requests", note:"Deletion & data export", glyph:"§"},
            {id:"revenue",   label:"Finance & Fee Signals", note:"Policy & modeled fees", glyph:"$"},
          ].map(n=>(
            <button key={n.id} type="button" className={`admin-nav-item admin-nav-btn${adminView===n.id?" active":""}`} aria-current={adminView===n.id ? "page" : undefined} onClick={()=>setAdminView(n.id)}>
              <span className="admin-nav-glyph" aria-hidden="true">{n.glyph}</span>
              <span className="admin-nav-copy">
                <span className="admin-nav-title">{n.label}</span>
                <span className="admin-nav-note">{n.note}</span>
              </span>
              {n.badge ? <span className={`anav-badge${n.badgeColor==="amber"?" amber":""}`}>{n.badge}</span> : null}
            </button>
          ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user-card">
            <div className="admin-sidebar-avatar">A</div>
            <div className="admin-sidebar-user-copy">
              <div className="admin-sidebar-user-name">{adminProfile?.org_name || "Platform Owner"}</div>
              <div className="admin-sidebar-user-role">{adminUser?.email || "Authenticated admin"}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-context">
            <div className="admin-topbar-kicker">FaithBid operations</div>
            <div className="admin-topbar-title">{VIEWS[adminView]}</div>
          </div>
          <div className="admin-topbar-right">
            {(reviewSummary.error || disputeSummary.error || (adminAttentionCount || 0) > 0) && (
              <div className="admin-topbar-attention">
                {reviewSummary.error || disputeSummary.error
                  ? [
                      reviewSummary.error ? "review count unavailable" : null,
                      disputeSummary.error ? "dispute count unavailable" : null,
                    ].filter(Boolean).join(" · ")
                  : `${adminAttentionCount} need attention`}
              </div>
            )}
            <div className="status-pill" title={adminDataStatusTitle} style={adminDataIssues ? {background:"var(--red-bg)",borderColor:"var(--red-border)",color:"var(--red)"} : adminDataLoading ? {background:"var(--amber-bg)",borderColor:"var(--amber-border)",color:"var(--amber)"} : undefined}>
              <span className="pulse" style={adminDataIssues ? {background:"var(--red)"} : adminDataLoading ? {background:"var(--amber)"} : undefined}/>
              {adminDataStatusText}
            </div>
            <button type="button" className="admin-topbar-action admin-refresh-action" disabled={refreshingAdmin} onClick={()=>refreshAdminConsole()} aria-label={`Refresh ${VIEWS[adminView] || "Admin"} data`}>
              <span aria-hidden="true">↻</span>{refreshingAdmin?"Refreshing":"Refresh"}
            </button>
            {/* R-71: test-only surface, never shown outside QA mode. */}
            {supabaseQaMode && typeof nav === "function" && <button type="button" className="admin-topbar-action" onClick={()=>nav("qa")}>QA Console</button>}
          </div>
        </div>

        <div className="admin-content" ref={adminContentRef} tabIndex={-1}>
          {/* ── OVERVIEW + INSIGHTS ── */}
          {["overview","insights"].includes(adminView) && (
            <>
              {adminView==="insights" && <>
                <header className="admin-page-heading">
                  <div className="admin-page-eyebrow">Operating intelligence</div>
                  <h1 className="admin-page-title">Insights</h1>
                  <p className="admin-page-copy">Inspect marketplace learning, system health, and growth readiness without burying today's decisions on Overview.</p>
                </header>
                <div className="admin-action-row" role="tablist" aria-label="Insight lanes" style={{marginBottom:18}}>
                  {[
                    {key:"marketplace",label:"Marketplace"},
                    {key:"operations",label:"System Health"},
                    {key:"growth",label:"Growth & Launch"},
                  ].map(lane=><button type="button" role="tab" aria-selected={adminInsightLane===lane.key} key={lane.key} className={`admin-btn admin-lane-btn${adminInsightLane===lane.key?" active":""}`} onClick={()=>setAdminInsightLane(lane.key)}>{lane.label}</button>)}
                </div>
                <div className="admin-inline-notice" style={{marginBottom:18}}>Insights are advisory and read-only. Every consequential approval, invitation, moderation action, and outreach step remains human-owned in its operational workspace.</div>
              </>}
              <section className="admin-command-hero" hidden={adminView!=="overview"} aria-labelledby="admin-command-title">
                <div className="admin-command-hero-copy">
                  <div className="admin-page-eyebrow">FaithBid operations</div>
                  <h1 id="admin-command-title" className="admin-command-title">Platform Command Center</h1>
                  <p className="admin-command-copy">A live operating view of marketplace health, trust decisions, user access, disputes, and pre-launch fee signals.</p>
                  <div className="admin-command-state-row">
                    <span className="admin-command-state"><span className="admin-command-state-dot"/>Pre-launch controls active</span>
                    <span className="admin-command-state">Directory and Faith Verification remain separate</span>
                  </div>
                </div>
                <div className="admin-command-signal-grid" aria-label="Current Admin priorities">
                  <button type="button" className="admin-command-signal" onClick={()=>openAdminView("approvals")}>
                    <span className="admin-command-signal-label">Review queue</span>
                    <strong>{itemsNeedingReviewDisplay}</strong>
                    <span>items needing review</span>
                  </button>
                  <button type="button" className="admin-command-signal" onClick={()=>openAdminView("disputes")}>
                    <span className="admin-command-signal-label">Open disputes</span>
                    <strong>{exactOpenDisputes == null ? "—" : exactOpenDisputes}</strong>
                    <span>exact unresolved count</span>
                  </button>
                  <div className={`admin-command-signal${adminDataIssues ? " is-degraded" : adminDataLoading ? " is-loading" : " is-healthy"}`}>
                    <span className="admin-command-signal-label">Required data</span>
                    <strong>{adminDataIssues ? `${adminDataIssues} issue${adminDataIssues===1?"":"s"}` : adminDataLoading ? "Checking" : "Healthy"}</strong>
                    <span>{requiredAdminDatasets.length} datasets in this view</span>
                  </div>
                </div>
              </section>

              {/* Quick Actions */}
              <div className="admin-command-actions" hidden={adminView!=="overview"} aria-label="Admin quick actions">
                {[
                  {icon:"✓", label:"Review queue", note:"Admissions, trust, and applications", action:()=>openAdminView("approvals"), badge:itemsNeedingReview},
                  {icon:"◎", label:"Users & access", note:"Search, verify, suspend, or restore", action:()=>openAdminView("users")},
                  {icon:"!", label:"Dispute center", note:"Open and resolve marketplace cases", action:()=>openAdminView("disputes"), badge:exactOpenDisputes},
                  {icon:"$", label:"Fee policy", note:"Review modeled signals and launch rules", action:()=>openAdminView("revenue", {financeSection:"admin-commercial-policy"})},
                  {icon:"↻", label:refreshingAdmin?"Refreshing data":"Refresh data", note:"Recheck every required Admin dataset", action:()=>refreshAdminConsole(), disabled:refreshingAdmin},
                ].map((a)=>(
                  <button type="button" key={a.label} onClick={a.action} disabled={a.disabled} className="admin-command-action">
                    <span className="admin-command-action-icon" aria-hidden="true">{a.icon}</span>
                    <span className="admin-command-action-copy"><strong>{a.label}</strong><span>{a.note}</span></span>
                    {a.badge>0 && <span className="admin-command-action-badge">{a.badge}</span>}
                    <span className="admin-command-action-arrow" aria-hidden="true">→</span>
                  </button>
                ))}
              </div>

              <section className="panel" hidden aria-labelledby="admin-operating-map-title" style={{marginBottom:18,overflow:"hidden"}}>
                <div className="panel-hd" style={{alignItems:"flex-start",gap:16}}>
                  <div>
                    <div id="admin-operating-map-title" className="panel-title">Admin Operating Map</div>
                    <div style={{fontSize:10,color:"var(--atext-muted)",marginTop:4,lineHeight:1.5}}>A complete owner-console map: each lane points to a proven Admin surface, not a placeholder.</div>
                  </div>
                  <span className="badge badge-green">Blueprint closeout</span>
                </div>
                <div className="panel-body">
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>
                    {[
                      {lane:"Trust", view:"approvals", body:"Directory admission, Faith Verification, charter access, ambassador and partner queues."},
                      {lane:"Access", view:"users", body:"Recent users, needs-review triage, suspension/restore controls, and account type review."},
                      {lane:"Marketplace", view:"projects", body:"Project moderation, marketplace status, and launch-safe project controls."},
                      {lane:"Community", view:"get-plugged-in", body:"GPI opportunities, host participation flow, and local discovery readiness."},
                      {lane:"Cases", view:"disputes", body:"Open dispute count, recent cases, and resolution state."},
                      {lane:"Money", view:"revenue", body:"Fee policy, modeled revenue signals, and prelaunch commercial rules."},
                    ].map(item => (
                      <button type="button" key={item.lane} onClick={()=>openAdminView(item.view)} style={{textAlign:"left",border:"1px solid rgba(239,225,195,0.14)",borderRadius:16,background:"linear-gradient(180deg,rgba(255,253,248,0.07),rgba(255,253,248,0.035))",padding:"14px 15px",cursor:"pointer",display:"grid",gap:7}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                          <span style={{fontSize:13,fontWeight:800,color:"var(--atext)"}}>{item.lane}</span>
                          <span style={{fontSize:10,color:"var(--gold-light)",fontWeight:800}}>Open →</span>
                        </div>
                        <div style={{fontSize:11,lineHeight:1.5,color:"var(--atext-muted)"}}>{item.body}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
              <section className="panel" hidden={adminView!=="insights" || adminInsightLane!=="operations"} aria-labelledby="admin-overview-contract-title" style={{marginBottom:18,overflow:"hidden"}}>
                <div className="panel-hd" style={{alignItems:"flex-start",gap:16}}>
                  <div>
                    <div id="admin-overview-contract-title" className="panel-title">Admin Overview Command Contracts</div>
                    <div style={{fontSize:10,color:"var(--atext-muted)",marginTop:4,lineHeight:1.5}}>Each tile below names the live source it depends on. Missing data stays degraded/loading, never silently zero.</div>
                  </div>
                  <span className={`badge ${adminDataIssues ? "badge-red" : adminDataLoading ? "badge-amber" : "badge-green"}`}>{adminDataStatusText}</span>
                </div>
                <div className="panel-body">
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:10}}>
                    {[
                      {label:"Users / Signups", source:"profiles + auth-linked admin read", state:usersError ? "Degraded" : loadingUsers ? "Loading" : "Ready", view:"users"},
                      {label:"Review Queue", source:"vendor admissions + Faith Verification + charter apps", state:reviewSummary.error || verificationsError ? "Degraded" : reviewSummary.loading || loadingVerifications ? "Loading" : "Ready", view:"approvals"},
                      {label:"Disputes", source:"recent disputes + unresolved summary", state:disputeSummary.error || disputesError ? "Degraded" : disputeSummary.loading || loadingDisputes ? "Loading" : "Ready", view:"disputes"},
                      {label:"Projects / Moderation", source:"project moderation queue + marketplace status", state:loadingKpis ? "Loading" : kpisError ? "Degraded" : "Ready", view:"projects"},
                      {label:"Finance", source:"fee policy constants + modeled fee signals", state:loadingFeeSignals ? "Loading" : "Ready", view:"revenue"},
                      {label:"Founder Brief", source:"deterministic founder brief RPC", state:founderBrief.error ? "Degraded" : founderBrief.loading ? "Loading" : founderBriefData ? "Ready" : "Waiting", view:"founder-brief"},
                    ].map(contract => {
                      const tone = contract.state === "Ready" ? {bg:"rgba(47,133,90,0.07)",border:"rgba(47,133,90,0.18)",color:"var(--green)"} : contract.state === "Loading" || contract.state === "Waiting" ? {bg:"var(--amber-bg)",border:"var(--amber-border)",color:"var(--amber)"} : {bg:"var(--red-bg)",border:"var(--red-border)",color:"var(--red)"};
                      return (
                        <button type="button" key={contract.label} onClick={() => contract.view === "founder-brief" ? fetchFounderBrief() : openAdminView(contract.view)} style={{textAlign:"left",border:"1px solid var(--aborder)",borderRadius:14,background:"rgba(255,253,248,0.68)",padding:"13px 14px",cursor:"pointer",display:"grid",gap:7}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                            <span style={{fontSize:12,fontWeight:800,color:"var(--atext)"}}>{contract.label}</span>
                            <span style={{fontSize:9,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",padding:"4px 7px",borderRadius:999,background:tone.bg,border:`1px solid ${tone.border}`,color:tone.color}}>{contract.state}</span>
                          </div>
                          <div style={{fontSize:10.5,lineHeight:1.45,color:"var(--atext-muted)"}}>{contract.source}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
              <section className="panel" hidden={adminView!=="insights" || adminInsightLane!=="operations"} aria-labelledby="ai-automation-command-title" style={{marginBottom:18,overflow:"hidden"}}>
                <div className="panel-hd" style={{alignItems:"flex-start",gap:16}}>
                  <div>
                    <div id="ai-automation-command-title" className="panel-title">AI Systems & Automation Command</div>
                    <div style={{fontSize:10,color:"var(--atext-muted)",marginTop:4,lineHeight:1.5}}>Blueprint lanes 1-7 are wired as deterministic operating intelligence first: visible signals, guarded recommendations, no automatic consequential writes.</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
                    <span className={`badge ${aiLaunchSentinel.status === "ready" ? "badge-green" : "badge-amber"}`}>{aiLaunchSentinel.label}</span>
                    <span className={`badge ${aiGatewayShell.status === "shell_ready" ? "badge-green" : "badge-amber"}`}>{aiGatewayShell.label}</span>
                  </div>
                </div>
                <div className="panel-body">
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:10,marginBottom:12}}>
                    <div style={{border:"1px solid var(--aborder)",borderRadius:14,background:"rgba(255,253,248,0.68)",padding:"13px 14px",display:"grid",gap:8}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                        <span style={{fontSize:10,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:"var(--gold-light)"}}>Lane 1</span>
                        <span className={`badge ${aiMarketplaceLiquidity.status === "balanced" ? "badge-green" : aiMarketplaceLiquidity.status === "supply_gap" ? "badge-red" : "badge-amber"}`}>{aiMarketplaceLiquidity.statusLabel}</span>
                      </div>
                      <strong style={{fontSize:13,color:"var(--atext)"}}>Marketplace liquidity snapshot</strong>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
                        {[["Demand",aiMarketplaceLiquidity.demand],["Supply",aiMarketplaceLiquidity.supply],["Bids",aiMarketplaceLiquidity.bids]].map(([label,value]) => <span key={label} style={{border:"1px solid rgba(239,225,195,0.14)",borderRadius:10,padding:"7px 8px",background:"var(--abg3)"}}><b style={{display:"block",fontFamily:"var(--font-sans),monospace",fontSize:15,color:"var(--atext)"}}>{Number(value || 0).toLocaleString()}</b><em style={{fontStyle:"normal",fontSize:8.5,color:"var(--atext-muted)",textTransform:"uppercase",letterSpacing:".6px"}}>{label}</em></span>)}
                      </div>
                      <div style={{fontSize:10.5,lineHeight:1.5,color:"var(--atext-mid)"}}>{aiMarketplaceLiquidity.headline}</div>
                    </div>
                    <div style={{border:"1px solid var(--aborder)",borderRadius:14,background:"rgba(255,253,248,0.68)",padding:"13px 14px",display:"grid",gap:8}}>
                      <span style={{fontSize:10,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:"var(--gold-light)"}}>Lanes 2 + 4</span>
                      <strong style={{fontSize:13,color:"var(--atext)"}}>{aiGrowthPriority.primary}</strong>
                      <div style={{fontSize:10.5,lineHeight:1.5,color:"var(--atext-mid)"}}>{aiGrowthPriority.reason}</div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
                        <span className="badge badge-muted">Route: {aiGrowthPriority.route}</span>
                        <button type="button" className="panel-action" onClick={()=>{ if (aiGrowthPriority.route === "Get Plugged In" && typeof nav === "function") nav("growth"); else openAdminView("overview"); }}>Open lane</button>
                      </div>
                    </div>
                    <div style={{border:"1px solid var(--aborder)",borderRadius:14,background:"rgba(255,253,248,0.68)",padding:"13px 14px",display:"grid",gap:8}}>
                      <span style={{fontSize:10,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:"var(--gold-light)"}}>Lanes 5-7</span>
                      <strong style={{fontSize:13,color:"var(--atext)"}}>Readiness, gateway, shadow mode</strong>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        <span className={`badge ${aiLaunchSentinel.status === "ready" ? "badge-green" : "badge-amber"}`}>{aiLaunchSentinel.checkedCount} datasets checked</span>
                        <span className="badge badge-muted">{aiGatewayShell.mode}</span>
                        <span className="badge badge-muted">{aiShadowModeUseCase.status}</span>
                      </div>
                      <div style={{fontSize:10.5,lineHeight:1.5,color:"var(--atext-mid)"}}><b>{aiShadowModeUseCase.name}:</b> {aiShadowModeUseCase.output}. {aiShadowModeUseCase.decision}</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.2fr) minmax(260px,.8fr)",gap:10}}>
                    <div style={{border:"1px solid var(--aborder)",borderRadius:14,background:"var(--abg2)",overflow:"hidden"}}>
                      <div style={{padding:"10px 12px",borderBottom:"1px solid var(--aborder)",fontSize:10,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:"var(--atext-muted)"}}>Lane 3 signal/action contract</div>
                      <div style={{display:"grid"}}>{aiSignalActionContracts.map(contract => <div key={contract.signal} style={{display:"grid",gridTemplateColumns:"minmax(130px,.32fr) minmax(0,1fr)",gap:10,padding:"10px 12px",borderBottom:"1px solid var(--aborder)"}}><div style={{fontSize:10,fontWeight:800,color:"var(--atext)"}}>{contract.signal}</div><div style={{minWidth:0}}><div style={{fontSize:10.5,color:"var(--atext-mid)",lineHeight:1.45}}>{contract.source}</div><div style={{fontSize:10.5,fontWeight:800,color:"var(--atext)",marginTop:3}}>{contract.action}</div><div style={{fontSize:9.5,color:"var(--atext-muted)",marginTop:3}}>Guardrail: {contract.guardrail}</div></div></div>)}</div>
                    </div>
                    <div style={{border:"1px solid var(--aborder)",borderRadius:14,background:"var(--abg2)",padding:"12px",display:"grid",gap:10}}>
                      <div><div style={{fontSize:10,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:"var(--atext-muted)",marginBottom:6}}>Bypass checks</div><div style={{display:"grid",gap:6}}>{aiLaunchSentinel.bypassTests.map(test => <div key={test} style={{fontSize:10.5,lineHeight:1.45,color:"var(--atext-mid)"}}>✓ {test}</div>)}</div></div>
                      {aiLaunchSentinel.blockers.length > 0 && <div style={{padding:10,border:"1px solid var(--amber-border)",borderRadius:10,background:"var(--amber-bg)",display:"grid",gap:5}}>{aiLaunchSentinel.blockers.map(blocker => <div key={blocker} style={{fontSize:10,color:"var(--amber)",fontWeight:800}}>Needs review: {blocker}</div>)}</div>}
                      <div style={{fontSize:9.5,lineHeight:1.45,color:"var(--atext-muted)"}}>Gateway contract: {aiGatewayShell.contract}. {aiGatewayShell.guardrails[0]}</div>
                    </div>
                  </div>
                </div>
              </section>
              <section className="panel" hidden={adminView!=="overview"} aria-labelledby="founder-brief-title" style={{marginBottom:18,overflow:"hidden"}}>
                <div className="panel-hd" style={{alignItems:"flex-start",gap:16}}>
                  <div>
                    <div id="founder-brief-title" className="panel-title">Founder Operating Brief</div>
                    <div style={{fontSize:10,color:"var(--atext-muted)",marginTop:4,lineHeight:1.5}}>Deterministic priorities from live marketplace, waitlist, and Growth data. Project metrics count only records explicitly classified as Real.</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
                    <span className={`badge ${founderBrief.error ? "badge-red" : founderBrief.loading ? "badge-amber" : founderBriefData?.overall_status === "partial" ? "badge-amber" : "badge-green"}`}>
                      {founderBrief.error ? "Unavailable" : founderBrief.loading ? "Loading" : founderBriefData?.overall_status === "partial" ? "Partial" : "Live"}
                    </span>
                    {founderBriefData && <span className={`badge ${founderBriefFreshnessBadgeClass}`}>{founderBriefFreshnessState}</span>}
                    {founderProjectProvenanceScoped && <span className="badge badge-muted">Real projects only</span>}
                    {founderBriefGeneratedAtValid && <span style={{fontSize:9,color:"var(--atext-muted)"}}>Updated {founderBriefGeneratedAtDate.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}</span>}
                    <button type="button" className="panel-action" onClick={()=>fetchFounderBrief()} disabled={founderBrief.loading}>{founderBrief.loading ? "Loading" : "Refresh"}</button>
                  </div>
                </div>
                <div className="panel-body">
                  {founderBrief.loading && !founderBriefData ? (
                    <div style={{padding:"24px 4px",fontSize:12,color:"var(--atext-muted)"}}>Building the founder brief from live operating data...</div>
                  ) : founderBrief.error ? (
                    <div style={{padding:16,border:"1px solid var(--red-border)",borderRadius:10,background:"var(--red-bg)"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"var(--red)",marginBottom:5}}>Founder Brief unavailable</div>
                      <div style={{fontSize:11,color:"var(--atext-mid)",lineHeight:1.55}}>Not enough Founder data could be read right now. No unavailable metric has been replaced with zero.</div>
                      {founderBriefRetryReason && (
                        <div aria-label="Founder Brief retry reason" style={{marginTop:10,padding:10,border:"1px solid rgba(197,48,48,0.18)",borderRadius:9,background:"rgba(255,255,255,0.36)",display:"grid",gap:5}}>
                          <div style={{fontSize:10.5,fontWeight:800,color:"var(--red)"}}>{founderBriefRetryReason.label}</div>
                          <div style={{fontSize:10,color:"var(--atext-mid)",lineHeight:1.5}}>{founderBriefRetryReason.detail}</div>
                          <div style={{fontSize:9.5,color:"var(--atext-muted)",lineHeight:1.45}}>Next: {founderBriefRetryReason.next}</div>
                        </div>
                      )}
                    </div>
                  ) : founderBriefData ? (
                    <>
                      {founderBriefWarningRows.length > 0 && (
                        <div aria-label="Founder Brief data quality" style={{padding:"11px 12px",marginBottom:12,border:"1px solid var(--amber-border)",borderRadius:10,background:"var(--amber-bg)",display:"grid",gap:8}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
                            <span style={{fontSize:10.5,fontWeight:800,color:"var(--amber)"}}>Some Founder Brief sources need review.</span>
                            <span className="badge badge-amber">{founderBriefWarningRows.length} source warning{founderBriefWarningRows.length === 1 ? "" : "s"}</span>
                          </div>
                          <div style={{display:"grid",gap:6}}>
                            {founderBriefWarningRows.map((warning,index) => (
                              <div key={`${warning.source}:${warning.issue}:${index}`} style={{display:"grid",gridTemplateColumns:"minmax(95px,0.35fr) minmax(0,1fr)",gap:8,padding:"7px 8px",border:"1px solid rgba(176,136,64,0.18)",borderRadius:8,background:"rgba(255,255,255,0.35)"}}>
                                <div style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:".7px",color:"var(--amber)"}}>{warning.source}</div>
                                <div style={{minWidth:0}}>
                                  <div style={{fontSize:10.5,fontWeight:700,color:"var(--atext)"}}>{warning.issue}</div>
                                  <div style={{fontSize:9.5,color:"var(--atext-mid)",marginTop:2}}>{warning.next}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {!founderBrief.loading && !founderBriefHasOperationalData && (
                        <div aria-label="Founder Brief empty state" style={{padding:14,marginBottom:14,border:"1px solid var(--amber-border)",borderRadius:12,background:"var(--amber-bg)",display:"grid",gap:8}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                            <span className="badge badge-amber">Not enough data yet</span>
                            <span className="badge badge-muted">{founderAvailableMetricCount} metrics available</span>
                          </div>
                          <div style={{fontSize:11,fontWeight:800,color:"var(--atext)"}}>Founder Brief is waiting for usable operating data.</div>
                          <div style={{fontSize:10,color:"var(--atext-mid)",lineHeight:1.55}}>{founderBriefEmptyStateReason} Metrics stay unavailable instead of being shown as zero.</div>
                          <button className="btn secondary small" type="button" onClick={runFounderQaRecheck} style={{width:"fit-content"}}>Recheck Founder data</button>
                        </div>
                      )}
                      <div className="admin-summary-strip" aria-label="Founder Brief readiness" style={{marginBottom:14}}>
                        {founderActionReadinessItems.map(item => (
                          <div key={item.label} className={`admin-command-signal ${item.tone === "healthy" ? "is-healthy" : item.tone === "attention" ? "is-degraded" : "is-loading"}`} style={{minHeight:86}}>
                            <span className="admin-command-signal-label">{item.label}</span>
                            <strong>{item.value}</strong>
                            <span>{item.note}</span>
                          </div>
                        ))}
                      </div>
                      <div className="admin-brief-card" aria-label="Founder action smoke" style={{marginBottom:14,padding:12,border:"1px solid var(--aborder)",borderRadius:14,background:founderActionSmokeReady?"rgba(34,197,94,0.055)":"var(--amber-bg)"}}>
                        <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:10,alignItems:"center"}}>
                          <div style={{minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6}}>
                              <span className={`badge ${founderActionSmokeReady ? "badge-green" : "badge-amber"}`}>Founder action smoke: {founderActionSmokeReady ? "All clear" : "Needs review"}</span>
                              <span className="badge badge-muted">{founderActionSmokeChecks.filter(check=>check.ok).length}/{founderActionSmokeChecks.length} routes ready</span>
                            </div>
                            <div style={{fontSize:10.5,fontWeight:800,color:"var(--atext)",marginBottom:6}}>
                              {founderActionSmokeReady ? "All Founder action launchers are present." : "One or more Founder action launcher types is missing."}
                            </div>
                            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                              {founderActionSmokeChecks.map(check => (
                                <span key={check.key} className={`badge ${check.ok ? "badge-green" : "badge-amber"}`} title={check.note}>{check.label}</span>
                              ))}
                            </div>
                          </div>
                          <button type="button" className="panel-action" style={{fontSize:9,padding:"4px 8px",whiteSpace:"nowrap"}} onClick={runFounderQaRecheck}>Recheck</button>
                        </div>
                      </div>
                      <div className="admin-brief-card" aria-label="Founder QA actions" style={{marginBottom:14,padding:"9px 10px",border:"1px solid var(--aborder)",borderRadius:12,background:"var(--abg2)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                          <span className="badge badge-muted">Founder QA actions</span>
                          <span style={{fontSize:9.5,color:"var(--atext-muted)"}}>{founderActions.length} active / {hiddenFounderActionCount} handled</span>
                          <span style={{fontSize:9.5,color:"var(--atext-muted)"}}>Last checked {founderQaLastCheckedLabel}</span>
                        </div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          <button type="button" className="panel-action" style={{fontSize:9,padding:"4px 8px"}} onClick={runFounderQaRecheck}>Recheck</button>
                          <button type="button" aria-label="Toggle Founder QA handled actions" className="panel-action" style={{fontSize:9,padding:"4px 8px"}} onClick={()=>setShowFounderHandledActions(value=>!value)} disabled={hiddenFounderActionCount===0}>{showFounderHandledActions ? "Hide handled" : "Show handled"}</button>
                          <button type="button" aria-label="Reset Founder handled actions" className="panel-action" style={{fontSize:9,padding:"4px 8px"}} onClick={resetFounderActionFeedback} disabled={hiddenFounderActionCount===0}>Reset handled</button>
                        </div>
                      </div>
                      <div className="admin-metric-grid" style={{marginBottom:18}}>
                        {founderMetricCards.map(({key,label,metric}) => (
                          <div key={key} style={{background:"var(--abg3)",border:"1px solid var(--aborder)",borderRadius:10,padding:"12px 14px"}}>
                            <div style={{fontSize:9,color:"var(--atext-muted)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:7,fontWeight:600}}>{label}</div>
                            <div style={{fontFamily:"var(--font-sans),monospace",fontSize:21,fontWeight:700,color:metric?.status === "available" ? "var(--atext)" : "var(--amber)",lineHeight:1}}>{displayFounderMetric(metric)}</div>
                          </div>
                        ))}
                      </div>
                      <div className="admin-two-col" style={{alignItems:"start"}}>
                        <div style={{border:"1px solid var(--aborder)",borderRadius:10,overflow:"hidden"}}>
                          <div style={{padding:"11px 13px",background:"var(--abg3)",borderBottom:"1px solid var(--aborder)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
                            <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".8px"}}>Next founder actions</span>
                            <span style={{fontSize:9,color:"var(--atext-muted)",fontWeight:700}}>{founderActions.length} active / {hiddenFounderActionCount} handled</span>
                          </div>
                          {founderActionRows.length === 0 ? <div style={{padding:16,fontSize:11,color:"var(--atext-muted)"}}>No Founder action was generated from the current data yet. Use Recheck after marketplace, waitlist, or Growth data changes.</div> : (
                            <>
                              {founderActions.length === 0 ? <div style={{padding:16,fontSize:11,color:"var(--atext-muted)"}}>All generated founder actions are handled or snoozed.</div> : founderActions.map(({action,feedbackKey,feedback},visibleIndex) => { const noteDraft = founderActionNoteDrafts?.[feedbackKey] ?? founderActionFeedback?.[feedbackKey]?.note ?? ""; const destinationMeta = getFounderActionDestinationMeta(action); const contextChips = getFounderActionContextChips(action); const noteComposerOpen = activeFounderNoteKey === feedbackKey || !!noteDraft || !!founderActionFeedback?.[feedbackKey]?.note; return (
                                <div key={feedbackKey} style={{display:"grid",gridTemplateColumns:"36px minmax(0,1fr) auto",gap:10,alignItems:"start",padding:"11px 12px",borderBottom:(visibleIndex===founderActions.length-1 && hiddenFounderActionCount===0)?0:"1px solid var(--aborder)"}}>
                                  <div style={{width:32,height:32,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",background:Number(action.priority)>=90?"var(--red-bg)":Number(action.priority)>=80?"var(--amber-bg)":"var(--abg4)",color:Number(action.priority)>=90?"var(--red)":Number(action.priority)>=80?"var(--amber)":"var(--atext-mid)",fontFamily:"var(--font-sans),monospace",fontSize:10,fontWeight:800}}>{action.priority}</div>
                                  <div style={{minWidth:0}}>
                                    <div style={{fontSize:11,fontWeight:700,color:"var(--atext)",marginBottom:3}}>{action.title}</div>
                                    <div style={{fontSize:10,color:"var(--atext-muted)",lineHeight:1.45,marginBottom:8}}>{action.reason}</div>                                    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:8}}>
                                      <span className={`badge ${destinationMeta.tone === "trust" ? "badge-gold" : destinationMeta.tone === "growth" ? "badge-green" : destinationMeta.tone === "market" ? "badge-amber" : "badge-muted"}`}>{destinationMeta.label}</span>
                                      {contextChips.map(chip => <span key={chip} className="badge badge-muted">{chip}</span>)}
                                      {feedback && <span className="badge badge-muted">Handled: {feedback}</span>}
                                      {founderActionFeedback?.[feedbackKey]?.note && <span className="badge badge-muted">Note saved</span>}
                                    </div>
                                    <div style={{display:"grid",gap:6}}>
                                      {noteComposerOpen && (
                                        <div style={{display:"grid",gap:4}}>
                                          <input
                                            aria-label={`Founder action note for ${action.title || "action"}`}
                                            value={noteDraft}
                                            onChange={event=>setFounderActionNoteDrafts(previous=>({...previous,[feedbackKey]:event.target.value.slice(0, 1200)}))}
                                            placeholder="Optional founder note..."
                                            autoFocus={activeFounderNoteKey === feedbackKey}
                                            style={{width:"100%",border:"1px solid var(--aborder)",borderRadius:8,background:"var(--abg2)",color:"var(--atext)",fontSize:10,padding:"6px 8px"}}
                                          />
                                          <span style={{fontSize:9,color:"var(--atext-muted)"}}>Notes stay with this Founder action and sync when Supabase is available.</span>
                                        </div>
                                      )}
                                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                                        <button type="button" className="panel-action" style={{fontSize:9,padding:"3px 7px"}} onClick={()=>recordFounderActionFeedback(feedbackKey, action, "done")}>Done</button>
                                        <button type="button" className="panel-action" style={{fontSize:9,padding:"3px 7px"}} onClick={()=>recordFounderActionFeedback(feedbackKey, action, "snoozed")}>Snooze</button>
                                        <button type="button" className="panel-action" style={{fontSize:9,padding:"3px 7px"}} onClick={()=>recordFounderActionFeedback(feedbackKey, action, "not_relevant")}>Not relevant</button>
                                        <button type="button" className="panel-action" style={{fontSize:9,padding:"3px 7px"}} onClick={()=>setActiveFounderNoteKey(value=>value===feedbackKey?null:feedbackKey)}>{noteComposerOpen ? "Hide note" : "Add note"}</button>
                                        <button type="button" className="panel-action" style={{fontSize:9,padding:"3px 7px"}} onClick={()=>recordFounderActionFeedbackWithNoteDraft(feedbackKey, action, "done")}>Done + note</button>
                                      </div>
                                    </div>
                                  </div>
                                  <button type="button" className="act-btn act-view" style={{fontSize:9,padding:"4px 8px"}} onClick={()=>openFounderBriefAction(action)}>Open</button>
                                </div>
                              );})}
                              <div style={{padding:"9px 12px 0"}}>
                                <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:10,alignItems:"center",padding:"9px 10px",border:"1px solid var(--aborder)",borderRadius:10,background:founderActionFeedbackRemoteReady?"rgba(34,197,94,0.06)":"var(--amber-bg)"}}>
                                  <div style={{minWidth:0}}>
                                    <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:4}}>
                                      <span className={`badge ${founderActionFeedbackRemoteReady ? "badge-green" : "badge-amber"}`}>Feedback persistence: {founderActionFeedbackRemoteReady ? "Supabase synced" : "Local fallback"}</span>
                                      <span className={`badge ${founderFeedbackContractBadgeClass}`}>{founderFeedbackContractLabel}</span>
                                      <span className="badge badge-muted">{founderLocalFeedbackCount} protected decision{founderLocalFeedbackCount===1?"":"s"}</span>
                                    </div>
                                    <div style={{fontSize:9.5,color:"var(--atext-muted)",lineHeight:1.45}}>{founderFeedbackPersistenceNote}</div>
                                  </div>
                                  <button type="button" className="panel-action" style={{fontSize:9,padding:"4px 8px",whiteSpace:"nowrap"}} onClick={()=>{ loadFounderActionFeedback(); loadFounderActionAuditEvents(); }}>Retry sync</button>
                                </div>
                              </div>
                              <div style={{padding:"8px 12px 0",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
                                <div style={{fontSize:9,color:"var(--atext-muted)"}}>Decision history: {founderActionAuditLoading ? "Loading" : `${founderActionHistoryCount} recent`}</div>
                                <button type="button" className="panel-action" style={{fontSize:9,padding:"3px 7px"}} onClick={()=>setShowFounderActionHistory(value=>!value)}>{showFounderActionHistory ? "Hide history" : `History (${founderActionHistoryCount})`}</button>
                              </div>
                              {showFounderActionHistory && (
                                <div style={{background:"var(--abg2)",borderTop:"1px solid var(--aborder)",padding:"10px 12px"}}>
                                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:8}}>
                                    <div style={{fontSize:10,fontWeight:800,color:"var(--atext)",textTransform:"uppercase",letterSpacing:".7px"}}>Founder action history</div>
                                    <button type="button" className="panel-action" style={{fontSize:9,padding:"3px 7px"}} onClick={()=>loadFounderActionAuditEvents()} disabled={founderActionAuditLoading}>{founderActionAuditLoading ? "Loading" : "Refresh"}</button>
                                  </div>
                                  <div style={{fontSize:9.5,color:"var(--atext-muted)",lineHeight:1.45,marginBottom:8}}>
                                    {founderActionAuditError ? "Showing current feedback fallback because the audit table was unavailable." : founderActionAuditEvents.length > 0 ? "Latest persisted Founder action events." : "Showing current feedback fallback until audit events are available."}
                                  </div>
                                  {founderActionHistoryRows.length === 0 ? (
                                    <div style={{fontSize:10,color:"var(--atext-muted)",padding:"6px 0"}}>No Founder action decisions have been recorded yet.</div>
                                  ) : (
                                    <div style={{display:"grid",gap:7}}>
                                      {founderActionHistoryRows.map((event,eventIndex) => (
                                        <div key={`${event.feedbackKey || "history"}-${event.createdAt || eventIndex}-${eventIndex}`} style={{border:"1px solid var(--aborder)",borderRadius:9,background:"var(--abg3)",padding:"8px 9px"}}>
                                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:4}}>
                                            <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                                              <span className="badge badge-muted">{event.eventType === "feedback_reset" ? "Reset" : getFounderActionFeedbackLabel(event) || "Handled"}</span>
                                              {event.note && <span className="badge badge-muted">Note saved</span>}
                                              {event.clientEventId && <span className="badge badge-green">Idempotent</span>}
                                            </div>
                                            <span style={{fontSize:8.5,color:"var(--atext-muted)",whiteSpace:"nowrap"}}>{event.createdAt ? new Date(event.createdAt).toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}) : event.source}</span>
                                          </div>
                                          <div style={{fontSize:10.5,fontWeight:700,color:"var(--atext)",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{event.title || "Founder action"}</div>
                                          {event.reason && <div style={{fontSize:9.5,color:"var(--atext-muted)",lineHeight:1.4}}>{event.reason}</div>}
                                          {event.note && <div style={{fontSize:9.5,color:"var(--atext-mid)",lineHeight:1.4,marginTop:4}}>Note: {event.note}</div>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              {hiddenFounderActionCount > 0 && (
                                <div style={{background:"var(--abg2)",borderTop:"1px solid var(--aborder)"}}>
                                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"10px 12px"}}>
                                    <div style={{fontSize:10,color:"var(--atext-muted)",lineHeight:1.45}}>{hiddenFounderActionCount} founder action{hiddenFounderActionCount===1?"":"s"} hidden by your feedback.</div>
                                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                                      <button type="button" aria-label="Toggle Founder handled drawer" className="panel-action" style={{fontSize:9,padding:"4px 8px"}} onClick={()=>setShowFounderHandledActions(value=>!value)}>{showFounderHandledActions ? "Hide handled" : "Show handled"}</button>
                                    </div>
                                  </div>
                                  {showFounderHandledActions && (
                                    <div style={{borderTop:"1px solid var(--aborder)"}}>
                                      {handledFounderActionRows.map(({action,feedbackKey},handledIndex) => {
                                        const handledFeedback = founderActionFeedback?.[feedbackKey] || {};
                                        const destinationMeta = getFounderActionDestinationMeta(action);
                                        const contextChips = getFounderActionContextChips(action);
                                        return (
                                          <div key={`handled-${feedbackKey}`} style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:10,padding:"10px 12px",borderBottom:handledIndex===handledFounderActionRows.length-1?0:"1px solid var(--aborder)"}}>
                                            <div style={{minWidth:0}}>
                                              <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                                                <span className="badge badge-muted">{getFounderActionFeedbackLabel(handledFeedback) || "Handled"}</span>
                                                <span className={`badge ${destinationMeta.tone === "trust" ? "badge-gold" : destinationMeta.tone === "growth" ? "badge-green" : destinationMeta.tone === "market" ? "badge-amber" : "badge-muted"}`}>{destinationMeta.label}</span>
                                                {contextChips.slice(0,2).map(chip => <span key={chip} className="badge badge-muted">{chip}</span>)}
                                                {handledFeedback?.note && <span className="badge badge-muted">Note saved</span>}
                                              </div>
                                              <div style={{fontSize:10.5,fontWeight:700,color:"var(--atext)",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{handledFeedback?.title || action?.title || "Founder action"}</div>
                                              <div style={{fontSize:9.5,color:"var(--atext-muted)",lineHeight:1.45}}>{handledFeedback?.reason || action?.reason || "No action reason captured."}</div>
                                              {handledFeedback?.note && <div style={{fontSize:9.5,color:"var(--atext-mid)",lineHeight:1.45,marginTop:5}}>Note: {handledFeedback.note}</div>}
                                            </div>                                             <div style={{display:"flex",gap:6,alignSelf:"start",flexWrap:"wrap",justifyContent:"flex-end"}}>
                                               <button type="button" aria-label={`Restore Founder action ${handledFeedback?.title || action?.title || "action"}`} className="panel-action" style={{fontSize:9,padding:"4px 8px"}} onClick={()=>restoreFounderActionFeedback(feedbackKey, action)}>Restore</button>
                                               <button type="button" className="act-btn act-view" style={{fontSize:9,padding:"4px 8px"}} onClick={()=>openFounderBriefAction(action)}>Open</button>
                                             </div>                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <div style={{border:"1px solid var(--aborder)",borderRadius:10,overflow:"hidden"}}>
                          <div style={{padding:"11px 13px",background:"var(--abg3)",borderBottom:"1px solid var(--aborder)",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".8px"}}>Market coverage</div>
                          {founderMarketHealth.length === 0 ? <div style={{padding:16,fontSize:11,color:"var(--atext-muted)"}}>No market-health segment is available yet. Coverage status will appear after readable project and vendor data exists.</div> : founderMarketHealth.map((segment,index) => (
                            <div key={`${segment.category}:${segment.geography}:${index}`} style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:10,padding:"11px 12px",borderBottom:index===founderMarketHealth.length-1?0:"1px solid var(--aborder)"}}>
                              <div style={{minWidth:0}}><div style={{fontSize:11,fontWeight:700,color:"var(--atext)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{segment.category}</div><div style={{fontSize:9.5,color:"var(--atext-muted)",marginTop:3}}>{segment.geography} / {segment.open_projects} open / {segment.available_vendors} verified vendors</div></div>
                              <span className={`badge ${segment.coverage_status === "critical" ? "badge-red" : segment.coverage_status === "thin" ? "badge-amber" : "badge-green"}`}>{segment.coverage_status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </section>

              {/* KPIs // 4 top + 4 secondary */}
              <div className="kpi-grid" hidden style={{display:"none"}}>
                {overviewPrimaryCards.map((k)=>(
                  <button type="button" key={k.label} className={`kpi-card ${k.color}`} onClick={k.action} style={{textAlign:"left",cursor:"pointer"}}>
                    <div className="kpi-label">{k.label}</div>
                    <div className="kpi-val">{k.val}</div>
                    <div className="kpi-sub">{k.sub}</div>
                    <div style={{marginTop:10,fontSize:10,fontWeight:700,color:"var(--atext-muted)",letterSpacing:1,textTransform:"uppercase"}}>{k.actionLabel} →</div>
                  </button>
                ))}
              </div>

              {/* Detailed KPI cards are available in their operational views. */}
              <div className="admin-metric-grid" hidden style={{display:"none",marginBottom:18}}>
                {overviewSecondaryCards.map((s)=>(
                  <button type="button" key={s.label} onClick={s.action} style={{background:"var(--abg3)",border:"1px solid var(--aborder)",borderRadius:10,padding:"12px 16px",cursor:"pointer",textAlign:"left"}}>
                    <div style={{fontSize:9,color:"var(--atext-muted)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:6,fontWeight:600}}>{s.label}</div>
                    <div style={{fontFamily:"var(--font-sans),monospace",fontSize:22,fontWeight:700,color:s.color,lineHeight:1}}>{s.val}</div>
                  </button>
                ))}
              </div>

              <div className="admin-two-col" hidden style={{display:"none"}}>
                <div className="panel">
                  <div className="panel-hd">
                    <div className="panel-title">Commercial model</div>
                    <div style={{fontFamily:"var(--font-sans),monospace",fontSize:11,color:"var(--green)",fontWeight:600}}>Placement terms // manual invoice</div>
                  </div>
                  <div className="panel-body">
                    <div style={{fontSize:11,color:"var(--atext-muted)",marginBottom:8,lineHeight:1.5}}>Project payments stay directly between church and vendor. Any separate FaithBid vendor placement fee is agreed before an introduction and invoiced manually.</div>
                    <div style={{fontSize:9,color:feeSignalError?"var(--red)":"var(--atext-muted)",letterSpacing:0.5,textTransform:"uppercase",marginBottom:10,fontWeight:700}}>{feeSignalError?"Fee-signal trend unavailable":"Monthly modeled fee signal · not processed revenue"}</div>
                    {/* Real SVG Sparkline */}
                    {(() => {
                      const sourceBars = Array.isArray(feeSignalBars) && feeSignalBars.length ? feeSignalBars : ADMIN_FEE_SIGNAL_MONTHS.map(b => ({ ...b, v: 0 }));
                      const W=260, H=56, pad=4;
                      const { points, areaPath, linePath } = buildSafeSparklineGeometry(sourceBars.map(b=>b?.v), { width: W, height: H, pad });
                      return (
                        <div style={{position:"relative"}}>
                          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block",marginBottom:6}}>
                            <path d={areaPath} fill="rgba(232,224,208,0.06)" stroke="none"/>
                            <path d={linePath} fill="none" stroke="var(--gold-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            {points.filter(point => Number.isFinite(point?.x) && Number.isFinite(point?.y)).map((point,i)=>{
                              return <circle key={i} cx={point.x} cy={point.y} r={i===points.length-1?3:1.5} fill={i===points.length-1?"var(--gold-light)":"rgba(232,224,208,0.4)"}/>;
                            })}
                          </svg>
                          <div style={{display:"flex",justifyContent:"space-between"}}>
                            {sourceBars.map((b)=><div key={b.label} style={{fontSize:8,color:"var(--atext-muted)",fontFamily:"var(--font-sans),monospace"}}>{b.label}</div>)}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="panel">
                  <div className="panel-hd"><div className="panel-title">Recent Activity Sample</div></div>
                  <div className="panel-body" style={{padding:"6px 16px"}}>
                    <AdminActivityFeed refreshSignal={adminRefreshKey} onHealthChange={reportAdminDatasetHealth} healthKey="activityFeed"/>
                  </div>
                </div>
              </div>

              <div className="admin-three-col" hidden style={{display:"none"}}>
                <div className="panel" style={{marginBottom:0}}>
                  <div className="panel-hd">
                    <div className="panel-title">Directory Admissions <span className="badge badge-amber" style={{marginLeft:4}}>{loadingVendors?"…":vendorsError?"—":pendingVendorTotal}</span></div>
                    <button type="button" className="panel-action" onClick={()=>openAdminView("approvals")}>Review all</button>
                  </div>
                  <div className="panel-body" style={{padding:"8px 12px"}}>
                    {vendorsError ? <div style={{padding:"16px 0",textAlign:"center",fontSize:11,color:"var(--red)"}}>Vendor queue unavailable</div> : pendingVendors.slice(0,3).map(v=>(
                      <div key={v.id} style={{display:"flex",alignItems:"center",gap:9,padding:"7px 0",borderBottom:"1px solid var(--aborder)"}}>
                        <div style={{width:28,height:28,borderRadius:"var(--r-sm)",background:"var(--abg4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"var(--atext-muted)",flexShrink:0}}>
                          {v.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:11,fontWeight:600,color:"var(--atext)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.name}</div>
                          <div style={{fontSize:10,color:"var(--atext-muted)"}}>{v.category||"//"}</div>
                        </div>
                        <span className={v.waiting?.badgeClass || "badge badge-muted"} title={`Waiting ${v.waiting?.label || "unknown"}`}>{v.waiting?.compact || "—"}</span>
                        <div style={{display:"flex",gap:4,alignItems:"center"}}><button type="button" className="act-btn act-view" style={{fontSize:9,padding:"3px 8px"}} onClick={()=>openApprovalReview(v)}>Review</button></div>
                      </div>
                    ))}
                    {!vendorsError && pendingVendors.length===0 && <div style={{padding:"16px 0",textAlign:"center",fontSize:11,color:"var(--atext-muted)"}}>All caught up ✓</div>}
                  </div>
                </div>
                <div className="panel" style={{marginBottom:0}}>
                  <div className="panel-hd"><div className="panel-title">Recent Open Disputes <span style={{fontSize:9,fontWeight:600,color:"var(--atext-muted)",marginLeft:5}}>latest 100 cases</span></div><button type="button" className="panel-action" onClick={()=>openAdminView("disputes")}>Manage</button></div>
                  <div className="panel-body" style={{padding:"8px 12px"}}>
                    {disputesError
                      ? <div style={{padding:"16px 0",textAlign:"center",fontSize:11,color:"var(--red)"}}>Recent dispute list unavailable</div>
                      : disputes.filter(d=>d.status!=="resolved").length===0
                      ? <div style={{padding:"16px 0",textAlign:"center",fontSize:11,color:"var(--atext-muted)"}}>No unresolved cases in the latest 100 ✓</div>
                      : disputes.filter(d=>d.status!=="resolved").map(d=>(
                          <div key={d.id} style={{padding:"7px 0",borderBottom:"1px solid var(--aborder)"}}>
                            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                              <div style={{minWidth:0}}>
                                <div style={{fontSize:11,fontWeight:600,color:d.urgent?"var(--red)":"var(--atext)",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.title}</div>
                                <div style={{display:"flex",justifyContent:"space-between",gap:8}}><span style={{fontSize:10,color:"var(--atext-muted)"}}>{d.church}</span><span style={{fontFamily:"var(--font-sans),monospace",fontSize:10,color:"var(--amber)"}}>{d.amount}</span></div>
                              </div>
                              <button type="button" className="act-btn act-view" style={{fontSize:9,padding:"3px 8px",flexShrink:0}} onClick={()=>openDisputeReview(d)}>Open</button>
                            </div>
                          </div>
                        ))
                    }
                  </div>
                </div>
                <div className="panel" style={{marginBottom:0}}>
                  <div className="panel-hd"><div className="panel-title">Platform Health</div></div>
                  <div className="panel-body">
                    <div style={{fontSize:12,color:"var(--atext-muted)",lineHeight:1.6,padding:"8px 0"}}>
                      Health signals will appear here once the monitoring integration is live. No fake data.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── INSIGHTS ── */}
          {adminView==="insights" && (
            <div className="admin-insights-workspace" style={{marginTop:14}}>
              <div hidden={adminInsightLane!=="marketplace"}><AdminMatchmakerFunnelCard health={matchmakerFunnelHealth} onRefresh={fetchMatchmakerFunnelHealth} /></div>
              <div className="panel" hidden={adminInsightLane!=="marketplace"}>
                <div className="panel-hd" style={{alignItems:"flex-start",gap:14}}>
                  <div>
                    <div className="panel-title">Outcome Learning Ledger</div>
                    <div style={{fontSize:10,color:"var(--atext-muted)",marginTop:4,lineHeight:1.5}}>{outcomeLearningLedger.summary}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
                    <span className={`badge ${matchmakerFunnelHealth.error ? "badge-red" : outcomeLearningLedger.countedEvents ? "badge-green" : "badge-amber"}`}>{outcomeLearningLedger.learningStatus}</span>
                    <span className="badge badge-muted">{outcomeLearningLedger.lastOutcomeAt ? new Date(outcomeLearningLedger.lastOutcomeAt).toLocaleDateString([], {month:"short", day:"numeric"}) : "No outcome yet"}</span>
                  </div>
                </div>
                <div className="panel-body">
                  <div style={{fontSize:10.5,color:"var(--atext-muted)",lineHeight:1.55,marginBottom:12}}>This ledger keeps AI matching honest: it shows what the live system can learn from now, and labels uncounted stages instead of faking confidence. Liquidity context: {outcomeLearningLedger.liquidityHeadline}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:8}}>
                    {outcomeLearningLedger.stages.map((stage,index) => {
                      const tone = !stage.instrumented ? "badge-muted" : Number(stage.count || 0) > 0 ? "badge-green" : "badge-amber";
                      return <div key={stage.key} style={{border:"1px solid var(--aborder)",borderRadius:12,background:"var(--abg2)",padding:"11px 12px",display:"grid",gap:6}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}><div style={{fontSize:10,fontWeight:800,color:"var(--atext)"}}>{String(index + 1).padStart(2,"0")} · {stage.label}</div><span className={`badge ${tone}`}>{stage.instrumented ? kbAiNumber(stage.count || 0) : "not counted"}</span></div>
                        <div style={{fontSize:9.5,color:"var(--atext-muted)",lineHeight:1.45}}>{stage.meaning}</div>
                        <div style={{fontSize:9.5,color:"var(--atext-mid)",lineHeight:1.45}}>Next: {stage.next}</div>
                      </div>;
                    })}
                  </div>
                </div>
              </div>

              <div className="panel" hidden={adminInsightLane!=="operations"}>
                <div className="panel-hd" style={{alignItems:"flex-start",gap:14}}>
                  <div>
                    <div className="panel-title">Human-in-the-loop Action Queue</div>
                    <div style={{fontSize:10,color:"var(--atext-muted)",marginTop:4,lineHeight:1.5}}>A founder/operator queue generated from the live signal panels. It routes humans to existing surfaces; it does not auto-approve, auto-invite, auto-rank, or auto-hire.</div>
                  </div>
                  <span className="badge badge-green">Human gate enforced</span>
                </div>
                <div className="panel-body" style={{display:"grid",gap:8}}>
                  {humanActionQueueRows.map(row => {
                    const tone = row.priority === "High" ? "badge-red" : row.priority === "Medium" ? "badge-amber" : "badge-green";
                    return <div key={row.label} style={{display:"grid",gridTemplateColumns:"190px 95px minmax(0,1fr) minmax(0,1fr) 112px",gap:10,alignItems:"center",border:"1px solid var(--aborder)",borderRadius:12,background:"var(--abg2)",padding:"10px 12px"}}>
                      <div><div style={{fontSize:10,fontWeight:800,color:"var(--atext)",marginBottom:3}}>{row.label}</div><div style={{fontSize:9,color:"var(--atext-muted)"}}>{row.source}</div></div>
                      <span className={`badge ${tone}`}>{row.priority}</span>
                      <div style={{fontSize:10,color:"var(--atext-muted)",lineHeight:1.45}}>{row.evidence}</div>
                      <div style={{fontSize:10,color:"var(--atext-mid)",lineHeight:1.45}}>Next: {row.next}</div>
                      <button type="button" className="panel-action" onClick={()=>runHumanActionQueueRoute(row.route)}>{row.action}</button>
                    </div>;
                  })}
                </div>
              </div>

              <div className="panel" hidden={adminInsightLane!=="operations"}>
                <div className="panel-hd">
                  <div className="panel-title">AI Gateway Shadow Evidence <span className={`badge ${aiShadowModeUseCase.confidence === "Advisory-ready" ? "badge-green" : "badge-amber"}`} style={{marginLeft:6}}>{aiShadowModeUseCase.confidence}</span></div>
                  
                </div>
                <div className="panel-body">
                  <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:12,marginBottom:12}}>
                    <div style={{border:"1px solid var(--aborder)",borderRadius:12,background:"var(--abg3)",padding:"12px 13px"}}><div style={{fontSize:9,fontWeight:800,letterSpacing:".8px",textTransform:"uppercase",color:"var(--atext-muted)",marginBottom:5}}>Shadow use case</div><div style={{fontSize:13,fontWeight:800,color:"var(--atext)",marginBottom:4}}>{aiShadowModeUseCase.name}</div><div style={{fontSize:10.5,color:"var(--atext-muted)",lineHeight:1.55}}>Input: {aiShadowModeUseCase.input}</div></div>
                    <div style={{border:"1px solid var(--aborder)",borderRadius:12,background:"var(--abg3)",padding:"12px 13px"}}><div style={{fontSize:9,fontWeight:800,letterSpacing:".8px",textTransform:"uppercase",color:"var(--atext-muted)",marginBottom:5}}>Recommended output</div><div style={{fontSize:13,fontWeight:800,color:"var(--atext)",marginBottom:4}}>{aiShadowModeUseCase.output}</div><div style={{fontSize:10.5,color:"var(--atext-muted)",lineHeight:1.55}}>{aiShadowModeUseCase.decision}</div></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(0,1fr))",gap:8,marginBottom:12}}>{aiShadowModeUseCase.evidence.map(item => <div key={item.label} style={{border:"1px solid var(--aborder)",borderRadius:10,background:"var(--abg2)",padding:"10px 10px"}}><div style={{fontSize:9,color:"var(--atext-muted)",textTransform:"uppercase",letterSpacing:".7px",fontWeight:800,marginBottom:5}}>{item.label}</div><div style={{fontFamily:"var(--font-sans),monospace",fontSize:18,fontWeight:800,color:"var(--atext)",marginBottom:3}}>{item.value}</div><div style={{fontSize:9.5,color:"var(--atext-muted)",lineHeight:1.4}}>{item.note}</div></div>)}</div>
                  <div style={{border:"1px solid var(--amber-border)",borderRadius:12,background:"var(--amber-bg)",padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:800,color:"var(--amber)",marginBottom:6}}>Bypass tests</div><div style={{display:"grid",gap:5}}>{aiShadowModeUseCase.bypassTests.map(test => <div key={test} style={{fontSize:10,color:"var(--atext-mid)",lineHeight:1.45}}>• {test}</div>)}</div></div>
                </div>
              </div>

              <div className="panel" hidden={adminInsightLane!=="marketplace"}>
                <div className="panel-hd"><div className="panel-title">Marketplace Liquidity Detail <span className={`badge ${aiMarketplaceLiquidity.status === "balanced" ? "badge-green" : aiMarketplaceLiquidity.status === "coverage_watch" ? "badge-amber" : "badge-red"}`} style={{marginLeft:6}}>{aiMarketplaceLiquidity.statusLabel}</span></div></div>
                <div className="panel-body"><div style={{fontSize:11,color:"var(--atext-muted)",lineHeight:1.55,marginBottom:12}}>{aiMarketplaceLiquidity.headline}</div><div style={{display:"grid",gap:8}}>{aiLiquidityDetailRows.map(row => <div key={row.label} style={{display:"grid",gridTemplateColumns:"150px 90px minmax(0,1fr) minmax(0,1fr)",gap:10,alignItems:"start",border:"1px solid var(--aborder)",borderRadius:11,background:"var(--abg2)",padding:"10px 12px"}}><div><div style={{fontSize:10,fontWeight:800,color:"var(--atext)",marginBottom:3}}>{row.label}</div><span className={`badge ${row.tone === "attention" ? "badge-red" : row.tone === "checking" ? "badge-amber" : "badge-green"}`}>{row.tone}</span></div><div style={{fontFamily:"var(--font-sans),monospace",fontSize:18,fontWeight:800,color:"var(--atext)"}}>{row.value}</div><div style={{fontSize:10,color:"var(--atext-muted)",lineHeight:1.45}}>{row.evidence}</div><div style={{fontSize:10,color:"var(--atext-mid)",lineHeight:1.45}}>Next: {row.next}</div></div>)}</div></div>
              </div>

              <div className="panel" hidden={adminInsightLane!=="operations"}>
                <div className="panel-hd"><div className="panel-title">Founder Brief Evidence Trace</div><button type="button" className="panel-action" onClick={runFounderQaRecheck}>Recheck trace</button></div>
                <div className="panel-body"><div style={{fontSize:11,color:"var(--atext-muted)",lineHeight:1.55,marginBottom:12}}>Every Founder Brief priority explains why it matters, which live data supports it, what changed or degraded, and what the next human action is.</div><div style={{display:"grid",gap:8}}>{founderBriefEvidenceTraceRows.map(row => <div key={row.label} style={{display:"grid",gridTemplateColumns:"150px 160px minmax(0,1fr) minmax(0,1fr)",gap:10,alignItems:"start",border:"1px solid var(--aborder)",borderRadius:11,background:"var(--abg2)",padding:"10px 12px"}}><div><div style={{fontSize:10,fontWeight:800,color:"var(--atext)",marginBottom:3}}>{row.label}</div><span className={`badge ${row.tone === "attention" ? "badge-red" : row.tone === "checking" ? "badge-amber" : "badge-green"}`}>{row.tone}</span></div><div style={{fontSize:11,fontWeight:800,color:"var(--atext)",lineHeight:1.35,overflow:"hidden",textOverflow:"ellipsis"}}>{row.value}</div><div style={{fontSize:10,color:"var(--atext-muted)",lineHeight:1.45}}>{row.evidence}</div><div style={{fontSize:10,color:"var(--atext-mid)",lineHeight:1.45}}>Next: {row.next}</div></div>)}</div></div>
              </div>

              <div className="panel" hidden={adminInsightLane!=="growth"}><div className="panel-hd"><div className="panel-title">Growth Engine Signal Quality</div><button type="button" className="panel-action" onClick={()=>typeof nav === "function" && nav("growth")}>Open Growth</button></div><div className="panel-body"><div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8}}>{growthSignalQualityRows.map(row => <div key={row.label} style={{border:"1px solid var(--aborder)",borderRadius:11,background:"var(--abg2)",padding:"11px 12px"}}><div style={{fontSize:10,fontWeight:800,color:"var(--atext)",marginBottom:5}}>{row.label}</div><div style={{fontFamily:"var(--font-sans),monospace",fontSize:20,fontWeight:800,color:row.score>=85?"var(--green)":row.score>=70?"var(--amber)":"var(--atext-mid)",marginBottom:5}}>{row.score}</div><div style={{fontSize:9.5,color:"var(--atext-muted)",lineHeight:1.45,marginBottom:5}}>{row.evidence}</div><div style={{fontSize:9.5,color:"var(--atext-mid)",lineHeight:1.45}}>Next: {row.next}</div></div>)}</div></div></div>

              <div className="panel" hidden={adminInsightLane!=="growth"}><div className="panel-hd"><div className="panel-title">Launch Readiness Drilldown</div><span className={`badge ${aiLaunchSentinel.status === "ready" ? "badge-green" : "badge-amber"}`}>{aiLaunchSentinel.label}</span></div><div className="panel-body"><div style={{display:"grid",gap:8}}>{launchReadinessDrilldownRows.map(row => <div key={row.label} style={{display:"grid",gridTemplateColumns:"150px 130px minmax(0,1fr) minmax(0,1fr)",gap:10,border:"1px solid var(--aborder)",borderRadius:11,background:"var(--abg2)",padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:800,color:"var(--atext)"}}>{row.label}</div><span className={`badge ${row.tone === "attention" ? "badge-red" : row.tone === "checking" ? "badge-amber" : "badge-green"}`}>{row.state}</span><div style={{fontSize:10,color:"var(--atext-muted)",lineHeight:1.45}}>{row.evidence}</div><div style={{fontSize:10,color:"var(--atext-mid)",lineHeight:1.45}}>Next: {row.next}</div></div>)}</div></div></div>

              <div className="panel" hidden={adminInsightLane!=="operations"}><div className="panel-hd"><div className="panel-title">Data Quality Repair Queue</div><button type="button" className="panel-action" onClick={refreshAdminConsole}>Refresh data</button></div><div className="panel-body"><div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8}}>{dataQualityRepairRows.map(row => <div key={row.label} style={{border:"1px solid var(--aborder)",borderRadius:11,background:"var(--abg2)",padding:"11px 12px"}}><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",marginBottom:6}}><div style={{fontSize:10,fontWeight:800,color:"var(--atext)"}}>{row.label}</div><span className={`badge ${row.tone === "attention" ? "badge-red" : row.tone === "checking" ? "badge-amber" : "badge-green"}`}>{row.count}</span></div><div style={{fontSize:9.5,color:"var(--atext-muted)",lineHeight:1.45,marginBottom:5}}>{row.evidence}</div><div style={{fontSize:9.5,color:"var(--atext-mid)",lineHeight:1.45}}>Next: {row.next}</div></div>)}</div></div></div>

              {adminInsightLane==="operations" && <div className="panel"><div className="panel-hd"><div className="panel-title">Recent Activity Sample</div></div><div className="panel-body" style={{padding:"6px 16px"}}><AdminActivityFeed refreshSignal={adminRefreshKey} onHealthChange={reportAdminDatasetHealth} healthKey="activityFeed"/></div></div>}
              {adminInsightLane==="growth" && <AdminReferralLeaderboard showToast={showToast} refreshSignal={adminRefreshKey} onHealthChange={reportAdminDatasetHealth} healthKey="referralLeaderboard"/>}
              <div className="admin-two-col" hidden={adminInsightLane!=="marketplace"}><div className="panel"><div className="panel-hd"><div className="panel-title">Vendor Success Coach</div></div><div className="panel-body" style={{display:"grid",gap:8}}>{vendorSuccessCoachRows.map(row => <div key={row.label} style={{border:"1px solid var(--aborder)",borderRadius:11,background:"var(--abg2)",padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:800,color:"var(--atext)",marginBottom:4}}>{row.label}</div><div style={{fontSize:10,color:"var(--atext-muted)",lineHeight:1.45,marginBottom:4}}>{row.issue}</div><div style={{fontSize:10,color:"var(--atext-mid)",lineHeight:1.45}}>Next: {row.next}</div></div>)}</div></div><div className="panel"><div className="panel-hd"><div className="panel-title">Church Project Rescue Signals</div></div><div className="panel-body" style={{display:"grid",gap:8}}>{churchProjectRescueRows.map(row => <div key={row.label} style={{border:"1px solid var(--aborder)",borderRadius:11,background:"var(--abg2)",padding:"10px 12px"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:4}}><div style={{fontSize:10,fontWeight:800,color:"var(--atext)"}}>{row.label}</div><span className="badge badge-amber">{row.state}</span></div><div style={{fontSize:10,color:"var(--atext-muted)",lineHeight:1.45,marginBottom:4}}>{row.evidence}</div><div style={{fontSize:10,color:"var(--atext-mid)",lineHeight:1.45}}>Next: {row.next}</div></div>)}</div></div></div>
            </div>
          )}

          {adminView==="projects" && (
            <>
              <header className="admin-page-heading">
                <div className="admin-page-eyebrow">Marketplace safety</div>
                <h1 className="admin-page-title">Project Moderation</h1>
                <p className="admin-page-copy">Remove an open project from public discovery or restore a previously removed project. Every action requires a reason and is recorded server-side.</p>
              </header>
              <div className="panel">
                <div className="panel-hd">
                  <div className="panel-title">Projects</div>
                  <button type="button" className="act-btn act-view" onClick={fetchAdminProjects} disabled={adminProjectsLoading}>Refresh</button>
                </div>
                <div className="panel-body" style={{display:'grid',gap:10}}>
                  {adminProjectsLoading ? <div className="admin-state-copy">Loading projects...</div> : adminProjectsError ? (
                    <div className="admin-state-card error"><div className="admin-state-title">Projects unavailable</div><button type="button" className="act-btn act-view" onClick={fetchAdminProjects}>Retry</button></div>
                  ) : adminProjects.length === 0 ? <div className="admin-state-copy">No projects found.</div> : adminProjects.map(project => {
                    const removed = String(project.status || '').toLowerCase() === 'removed';
                    const actionable = removed || String(project.status || '').toLowerCase() === 'open';
                    return <div key={project.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,padding:'14px 16px',border:'1px solid var(--aborder)',borderRadius:12,background:'var(--abg2)',flexWrap:'wrap'}}>
                      <div style={{minWidth:0,flex:'1 1 360px',overflowWrap:'anywhere'}}>
                        <div style={{fontSize:14,fontWeight:700,color:'var(--atext)',marginBottom:4}}>{project.title || 'Untitled project'}</div>
                        <div style={{fontSize:11,color:'var(--atext-muted)',marginBottom:6}}>{project.church_name || 'Church'} {'\u00b7'} {project.category || 'Uncategorized'} {'\u00b7'} <strong>{project.status || 'unknown'}</strong></div>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                          <span className="badge badge-muted">{ADMIN_PROJECT_ORIGIN_LABEL[project.record_origin] || 'Unclassified'}</span>
                          {project.record_origin === 'real' && <span className={`badge ${project.liquidity_status === 'thin' ? 'badge-red' : project.liquidity_status === 'collecting' || project.liquidity_status === 'waiting_for_window' ? 'badge-amber' : 'badge-green'}`}>{String(project.liquidity_status || 'not_applicable').replaceAll('_',' ')}</span>}
                          {project.record_origin === 'real' && <span style={{fontSize:10,color:'var(--atext-muted)'}}>{Number(project.qualified_comparable_proposal_count || 0)}/2 qualified comparable proposals</span>}
                          {project.record_origin === 'real' && <span style={{fontSize:10,color:'var(--atext-muted)'}}>Window: {project.proposal_response_window_ends_at ? new Date(project.proposal_response_window_ends_at).toLocaleString() : 'not set'}</span>}
                        </div>
                        {adminProjectPreviewId===project.id && (
                          <div style={{marginTop:10,padding:'10px 12px',border:'1px solid var(--aborder)',borderRadius:10,background:'var(--abg)',fontSize:12,lineHeight:1.6,color:'var(--atext-mid)',overflowWrap:'anywhere',minWidth:0}}>
                            <div><strong>Budget:</strong> {project.budget || 'Not provided'} {'·'} <strong>Location:</strong> {project.project_city || project.city || 'Not provided'} {'·'} <strong>Timeline:</strong> {project.timeline || 'Not provided'}</div>
                            <div><strong>Posted:</strong> {project.posted_at ? new Date(project.posted_at).toLocaleString() : 'unknown'}</div>
                            <div style={{marginTop:6,whiteSpace:'pre-wrap'}}>{String(project.description || 'No description.').slice(0, 900)}</div>
                          </div>
                        )}
                      </div>
                      <div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'center'}}>
                        <button type="button" className="act-btn act-view" aria-expanded={adminProjectPreviewId===project.id} onClick={()=>setAdminProjectPreviewId(id => id === project.id ? null : project.id)}>{adminProjectPreviewId===project.id ? 'Hide details' : 'Preview'}</button>
                        <select aria-label={`Classify ${project.title || 'project'}`} className="act-btn" disabled={adminProjectBusyId===project.id} value={project.record_origin || 'unclassified'} onChange={event=>classifyAdminProject(project, event.target.value)}>
                          {Object.entries(ADMIN_PROJECT_ORIGIN_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        {project.record_origin === 'real' && <button type="button" className="act-btn act-view" disabled={adminProjectBusyId===project.id} onClick={()=>setAdminProjectResponseWindow(project)}>{adminProjectBusyId===project.id ? 'Saving...' : project.proposal_response_window_ends_at ? 'Edit response window' : 'Set response window'}</button>}
                        {actionable ? <button type="button" className={`act-btn ${removed ? 'act-view' : 'act-reject'}`} disabled={adminProjectBusyId===project.id} onClick={()=>moderateAdminProject(project, removed ? 'restore' : 'remove')}>
                          {adminProjectBusyId===project.id ? 'Saving...' : removed ? 'Restore' : 'Remove'}
                        </button> : <span style={{fontSize:11,color:'var(--atext-muted)'}}>No moderation action</span>}
                      </div>
                    </div>;
                  })}
                </div>
              </div>
            </>
          )}

          {adminView==="approvals" && (
            <>
              <header className="admin-page-heading">
                <div className="admin-page-eyebrow">Review operations</div>
                <h1 className="admin-page-title">Review Queue</h1>
                <p className="admin-page-copy">One destination for directory admission, earned trust, Charter, Partnership, and Ambassador decisions.</p>
              </header>
              <div className="admin-action-row" role="tablist" aria-label="Review queue lanes" style={{marginBottom:18}}>
                {[
                  {key:"directory",label:"Directory",count:pendingVendorTotal},
                  {key:"verification",label:"Faith Verification",count:verificationTotal},
                  {key:"charter",label:"Charter",count:reviewSummary?.charterApplications},
                  {key:"partnerships",label:"Partnerships",count:reviewSummary?.partnershipApplications},
                  {key:"ambassadors",label:"Ambassadors",count:reviewSummary?.ambassadorApplications},
                ].map(lane=>(
                  <button type="button" role="tab" aria-selected={adminReviewLane===lane.key} key={lane.key} className={`admin-btn admin-lane-btn${adminReviewLane===lane.key?" active":""}`} onClick={()=>{setAdminReviewLane(lane.key);setAdminFocus(prev=>({...prev,reviewSection:`admin-review-${lane.key}`}));}}>
                    {lane.label}<span className="badge badge-muted" style={{marginLeft:7}}>{reviewSummary.loading || lane.count == null ? "…" : Number(lane.count || 0)}</span>
                  </button>
                ))}
              </div>
              <div className="admin-inline-notice" style={{marginBottom:18}}>
                Only the selected review workflow is shown. Queue data, pagination, dialogs, and double-submit guards remain independent and unchanged.
              </div>
              <div id="admin-review-directory" role="tabpanel" hidden={adminReviewLane!=="directory"} tabIndex={-1} style={{scrollMarginTop:16}}>
              <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
                {[
                  {label:"Items needing review",val:itemsNeedingReviewDisplay,color:reviewSummary.error?"var(--red)":"var(--amber)"},
                  {label:"Visible vendor items today",val:queuedToday,color:"var(--green)"},
                  {label:"Visible vendor items > 24h",val:staleApprovalsCount,color:staleApprovalsCount>0?"var(--red)":"var(--green)"},
                  {label:"Visible vendor avg age",val:avgPendingLabel,color:"var(--gold-light)"}
                ].map((s,i)=>(
                  <div key={s.label || i} style={{flex:1,minWidth:110,background:"var(--abg2)",border:"1px solid var(--aborder)",borderRadius:"var(--r-sm)",padding:"12px 14px"}}>
                    <div style={{fontSize:9,color:"var(--atext-muted)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:3}}>{s.label}</div>
                    <div style={{fontFamily:"var(--font-sans),monospace",fontSize:20,fontWeight:700,color:s.color}}>{s.val}</div>
                  </div>
                ))}
              </div>
              {reviewSummary.error ? (
                <div className="admin-state-card error" style={{marginBottom:18}}>
                  <div className="admin-state-title">Exact review summary unavailable</div>
                  <div className="admin-state-copy">No partial total is being presented as complete. Retry all application queues before relying on the headline count.</div>
                  <button type="button" className="act-btn act-view" onClick={fetchAdminReviewSummary}>Retry summary</button>
                </div>
              ) : !reviewSummary.loading ? (
                <div className="admin-inline-notice" style={{marginBottom:18,lineHeight:1.7}}>
                  Exact total: {reviewSummary.vendorReviews.toLocaleString()} unique vendor review{reviewSummary.vendorReviews===1?"":"s"} across {reviewSummary.directoryAdmissions.toLocaleString()} directory admission{reviewSummary.directoryAdmissions===1?"":"s"} and {reviewSummary.faithVerifications.toLocaleString()} Faith Verification application{reviewSummary.faithVerifications===1?"":"s"}
                  {reviewSummary.duplicateVendorReviews > 0 ? ` (${reviewSummary.duplicateVendorReviews.toLocaleString()} shared vendor${reviewSummary.duplicateVendorReviews===1?"":"s"} counted once)` : ""}; plus {reviewSummary.charterApplications.toLocaleString()} Charter, {reviewSummary.partnershipApplications.toLocaleString()} Partnership, and {reviewSummary.ambassadorApplications.toLocaleString()} Ambassador application{reviewSummary.ambassadorApplications===1?"":"s"}.
                </div>
              ) : null}
              {loadingVendors
                ? <div style={{display:"flex",flexDirection:"column",gap:10,padding:"8px 0"}}>
                    {[1,2,3].map(k=>(
                      <div key={k} style={{display:"grid",gridTemplateColumns:"36px 1fr 72px 80px 80px 160px 120px",gap:12,alignItems:"center",padding:"12px 14px",background:"var(--abg2)",border:"1px solid var(--aborder)",borderRadius:"var(--r-md)"}}>
                        <div style={{width:32,height:32,borderRadius:"var(--r-sm)",background:"var(--aborder)",animation:"skeleton 1.5s ease infinite"}}/>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}><div style={{height:11,width:"60%",background:"var(--aborder)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/><div style={{height:9,width:"40%",background:"var(--aborder)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/></div>
                        <div style={{height:20,background:"var(--aborder)",borderRadius:100,animation:"skeleton 1.5s ease infinite"}}/>
                        <div style={{height:20,background:"var(--aborder)",borderRadius:100,animation:"skeleton 1.5s ease infinite"}}/>
                        <div style={{height:20,background:"var(--aborder)",borderRadius:100,animation:"skeleton 1.5s ease infinite"}}/>
                        <div style={{height:10,width:"80%",background:"var(--aborder)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/>
                        <div style={{display:"flex",gap:4}}><div style={{height:26,width:64,background:"var(--aborder)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/><div style={{height:26,width:48,background:"var(--aborder)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/></div>
                      </div>
                    ))}
                  </div>
                : vendorsError
                  ? <div className="admin-state-card error"><div className="admin-state-title">Directory applications could not load</div><div className="admin-state-copy">Nothing is being reported as cleared. Retry the query before taking action.</div><button type="button" className="act-btn act-view" onClick={fetchPendingVendors}>Retry</button></div>
                : pendingVendors.length===0
                  ? <div className="admin-state-card" style={{padding:"24px 20px"}}><div className="admin-state-title">All directory admissions cleared</div><div className="admin-state-copy">New vendor signups will appear here.</div></div>
                  : <div className="panel">
                    <div className="panel-hd"><div className="panel-title">Directory Applications</div><div className="admin-table-meta">Showing {vendorApprovalPage*50+1}–{Math.min((vendorApprovalPage+1)*50,pendingVendorTotal)} of {pendingVendorTotal}</div></div>
                    <div style={{overflowX:"auto"}}>
                      <table className="data-table" style={{minWidth:760}}>
                        <thead><tr style={{background:"var(--abg3)"}}>{["","Vendor","Waiting","Category","Trust","Faith Statement","Actions"].map((h,i)=><th key={h||i} style={{padding:"10px 14px 8px"}}>{h}</th>)}</tr></thead>
                        <tbody>
                          {pendingVendors.map(v=>(
                            <tr key={v.id} style={adminFocus.approvalId===v.id ? {background:"rgba(216,193,143,0.08)"} : undefined}>
                              <td style={{padding:"10px 14px",width:36}}><div style={{width:32,height:32,borderRadius:"var(--r-sm)",background:"var(--abg4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{v.emoji}</div></td>
                              <td style={{padding:"10px 8px"}}><div style={{fontSize:12,fontWeight:600,color:"var(--atext)"}}>{v.name}</div><div style={{fontSize:10,color:"var(--atext-muted)"}}>{v.city} · applied {v.joined}</div></td>
                              <td style={{padding:"10px 8px"}}><span className={v.waiting?.badgeClass || "badge badge-muted"} title={`Waiting ${v.waiting?.label || "unknown"}`}>{v.waiting?.label || "—"}</span></td>
                              <td style={{padding:"10px 8px"}}><span className="badge badge-muted">{(v.category||"").split(" ")[0]||"//"}</span></td>
                              <td style={{padding:"10px 8px"}}>
                                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                                  <span className={`badge ${getAdminTierBadgeClass(v.tier)}`}>{v.tier}</span>
                                  <BadgeRow badges={getVendorIdentityBadges(v)} limit={2} />
                                </div>
                              </td>
                              <td style={{padding:"10px 8px",maxWidth:200}}>
                                <div style={{fontSize:10,color:"var(--atext-mid)",fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                  {v.statement ? `"${v.statement.slice(0,60)}${v.statement.length>60?"...":""}"` : <span style={{color:"var(--atext-muted)"}}>None provided</span>}
                                </div>
                              </td>
                              <td style={{padding:"10px 14px"}}>
                                <div style={{display:"flex",gap:4}}>
                                  <button type="button" className="act-btn act-view" onClick={()=>openApprovalReview(v)}>Review</button>
                                  <button type="button" className="act-btn act-reject" onClick={()=>rejectVendor(v.id)}>✕ Reject</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="admin-action-row" style={{justifyContent:"space-between",padding:"12px 14px",borderTop:"1px solid var(--aborder)"}}>
                      <button type="button" className="admin-btn" disabled={vendorApprovalPage===0} onClick={()=>setVendorApprovalPage(p=>Math.max(0,p-1))}>Previous</button>
                      <span className="admin-table-meta">Page {vendorApprovalPage+1} of {Math.max(1,Math.ceil(pendingVendorTotal/50))}</span>
                      <button type="button" className="admin-btn" disabled={(vendorApprovalPage+1)*50>=pendingVendorTotal} onClick={()=>setVendorApprovalPage(p=>p+1)}>Next</button>
                    </div>
                  </div>
              }
              </div>

              {/* ── FAITH VERIFICATION APPLICATIONS ── */}
              <div id="admin-review-verification" role="tabpanel" hidden={adminReviewLane!=="verification"} tabIndex={-1} style={{textAlign:"left",scrollMarginTop:16}}>
                <div style={{marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"var(--gold-light)",opacity:0.7,marginBottom:6}}>Faith Verification</div>
                    <div style={{fontFamily:"var(--font-display),serif",fontSize:20,fontWeight:700,color:"var(--atext)"}}>Verification Applications</div>
                    <div style={{fontSize:12,color:"var(--atext-muted)",marginTop:2}}>Vendors who have completed the 5-step faith verification flow.</div>
                  </div>
                  {verificationTotal > 0 && (
                    <div style={{padding:"5px 14px",background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:100,fontSize:12,fontWeight:700,color:"var(--amber)"}}>{verificationTotal} pending</div>
                  )}
                </div>

                {loadingVerifications ? (
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {[1,2].map(k=>(
                      <div key={k} style={{background:"var(--abg2)",border:"1px solid var(--aborder)",borderRadius:"var(--r-md)",padding:"16px 20px",display:"grid",gridTemplateColumns:"36px 1fr auto",gap:14,alignItems:"center"}}>
                        <div style={{width:36,height:36,borderRadius:"var(--r-sm)",background:"var(--aborder)",animation:"skeleton 1.5s ease infinite"}}/>
                        <div style={{display:"flex",flexDirection:"column",gap:7}}><div style={{height:12,width:"50%",background:"var(--aborder)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/><div style={{height:9,width:"70%",background:"var(--aborder)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/></div>
                        <div style={{height:24,width:60,background:"var(--aborder)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/>
                      </div>
                    ))}
                  </div>
                ) : verificationsError ? (
                  <div className="admin-state-card error"><div className="admin-state-title">Verification applications could not load</div><div className="admin-state-copy">The queue is unavailable; it has not been treated as empty.</div><button type="button" className="act-btn act-view" onClick={fetchVerificationApps}>Retry</button></div>
                ) : verificationApps.length === 0 ? (
                  <div style={{background:"var(--abg2)",border:"1px solid var(--aborder)",borderRadius:"var(--r-md)",padding:"24px 20px",textAlign:"center"}}>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--atext)",marginBottom:4}}>No pending verification applications</div>
                    <div style={{fontSize:11,color:"var(--atext-muted)"}}>When vendors complete the faith verification flow, applications appear here.</div>
                  </div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {verificationApps.map(app=>(
                      <div key={app.id} style={{background:"var(--abg2)",border:`1px solid ${expandedApp===app.id || adminFocus.verificationId===app.id?"var(--gold-border)":"var(--aborder)"}`,boxShadow:adminFocus.verificationId===app.id?"0 0 0 1px rgba(216,193,143,0.15) inset":"none",borderRadius:"var(--r-md)",overflow:"hidden",transition:"border-color 0.2s"}}>
                        {/* Row header */}
                        <div style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer"}} onClick={()=>setExpandedApp(expandedApp===app.id?null:app.id)} role="button" tabIndex={0} aria-expanded={expandedApp===app.id} onKeyDown={activateOnKey(()=>setExpandedApp(expandedApp===app.id?null:app.id))}>
                          <div style={{width:36,height:36,borderRadius:"var(--r-sm)",background:"var(--abg4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"var(--gold-light)",flexShrink:0}}>
                            {app.vendorName.slice(0,1)}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:700,color:"var(--atext)",marginBottom:2}}>{app.vendorName}</div>
                            <div style={{fontSize:11,color:"var(--atext-muted)"}}>{app.vendorCategory} · {app.vendorCity} · Submitted {app.submitted}</div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                            {(() => { const tierMeta = getAdminVerificationTierMeta(app.tierGoal); return <div style={{padding:"3px 10px",borderRadius:100,background:tierMeta.background,border:`1px solid ${tierMeta.border}`,fontSize:10,fontWeight:700,color:tierMeta.color,letterSpacing:0.5}}>{tierMeta.label}</div>; })()}
                            <div style={{fontSize:12,color:"var(--atext-muted)",transition:"transform 0.2s",transform:expandedApp===app.id?"rotate(180deg)":"rotate(0deg)"}}>▾</div>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {expandedApp===app.id && (
                          <div style={{borderTop:"1px solid var(--aborder)",padding:"20px"}}>
                            <div className="admin-verification-detail-grid" style={{marginBottom:20}}>
                              {/* Faith statement */}
                              <div style={{background:"var(--abg3)",borderRadius:10,padding:"14px 16px"}}>
                                <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--atext-muted)",marginBottom:8}}>Faith Statement</div>
                                <div style={{fontSize:12,color:"var(--atext-mid)",lineHeight:1.7,fontStyle:"italic"}}>
                                  {app.faithStatement ? `"${app.faithStatement}"` : <span style={{color:"var(--atext-muted)"}}>Not provided</span>}
                                </div>
                              </div>
                              {/* Ministry reference */}
                              <div style={{background:"var(--abg3)",borderRadius:10,padding:"14px 16px"}}>
                                <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--atext-muted)",marginBottom:8}}>Ministry Reference</div>
                                {[
                                  {label:"Church", val:app.refChurch},
                                  {label:"Pastor", val:app.refPastor},
                                  {label:"Email", val:app.refEmail},
                                  {label:"Phone", val:app.refPhone||"//"},
                                  {label:"Relationship", val:app.refRelationship||"//"},
                                ].map((item,i)=>(
                                  <div key={item.label || i} style={{display:"flex",gap:8,marginBottom:6}}>
                                    <span style={{fontSize:10,color:"var(--atext-muted)",width:70,flexShrink:0}}>{item.label}</span>
                                    <span style={{fontSize:11,color:"var(--atext)",fontWeight:500}}>{item.val||"//"}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Canonical private Faith evidence */}
                            <div style={{background:"var(--abg3)",border:"1px solid var(--aborder)",borderRadius:10,padding:"14px 16px",marginBottom:16}}>
                              <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--atext-muted)",marginBottom:10}}>Canonical Faith Evidence</div>
                              {!app.faithReferences?.length ? (
                                <div style={{fontSize:11,color:"var(--atext-muted)",lineHeight:1.6}}>No linked Christian-community reference exists for this application yet.</div>
                              ) : app.faithReferences.map((ref, refIndex) => {
                                const response = ref.response;
                                const identityLabel = response?.christian_identity_confirmed === true ? "Yes" : response?.christian_identity_confirmed === false ? "No" : "Not answered";
                                const recommendLabel = response?.would_recommend === true ? "Yes" : response?.would_recommend === false ? "No" : "Not answered";
                                return (
                                  <div key={ref.id || refIndex} style={{padding:refIndex?"14px 0 0":"0",marginTop:refIndex?14:0,borderTop:refIndex?"1px solid var(--aborder)":"none"}}>
                                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:8}}>
                                      <div style={{fontSize:11,fontWeight:700,color:"var(--atext)"}}>{ref.client_name || app.refPastor || "Christian-community reference"}</div>
                                      <div style={{fontSize:10,fontWeight:700,color:ref.status==="completed"?"var(--green)":ref.status==="sent"?"var(--gold-light)":"var(--atext-muted)"}}>{String(ref.status || "pending").replace(/_/g," ").toUpperCase()}</div>
                                    </div>
                                    <div style={{fontSize:10,color:"var(--atext-muted)",marginBottom:response?10:0}}>Sent: {ref.sent_at ? new Date(ref.sent_at).toLocaleString() : "Not yet"} · Completed: {ref.completed_at ? new Date(ref.completed_at).toLocaleString() : "Not yet"}</div>
                                    {response ? (
                                      <div style={{display:"grid",gap:8}}>
                                        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8}}>
                                          <div style={{padding:"8px 10px",borderRadius:8,background:"var(--abg2)",fontSize:10,color:"var(--atext-mid)"}}><strong style={{color:"var(--atext)"}}>Known as Christian:</strong> {identityLabel}</div>
                                          <div style={{padding:"8px 10px",borderRadius:8,background:"var(--abg2)",fontSize:10,color:"var(--atext-mid)"}}><strong style={{color:"var(--atext)"}}>Recommend to churches:</strong> {recommendLabel}</div>
                                        </div>
                                        <div><div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:"var(--atext-muted)",marginBottom:4}}>Responder relationship</div><div style={{fontSize:11,color:"var(--atext-mid)",lineHeight:1.6}}>{response.relationship_context || "Not provided"}</div></div>
                                        <div><div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:"var(--atext-muted)",marginBottom:4}}>Faith / character / integrity</div><div style={{fontSize:11,color:"var(--atext-mid)",lineHeight:1.6}}>{response.faith_alignment || "Not provided"}</div></div>
                                        <div><div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:"var(--atext-muted)",marginBottom:4}}>Concerns</div><div style={{fontSize:11,color:"var(--atext-mid)",lineHeight:1.6}}>{response.concerns || "None provided"}</div></div>
                                      </div>
                                    ) : <div style={{fontSize:11,color:"var(--atext-muted)",lineHeight:1.6}}>No private response has been received yet.</div>}
                                  </div>
                                );
                              })}
                            </div>
                            {/* Covenant */}
                            <div style={{padding:"10px 14px",borderRadius:"var(--r-sm)",background:app.covenantSigned?"rgba(34,197,94,0.06)":"rgba(239,68,68,0.06)",border:`1px solid ${app.covenantSigned?"var(--green-border)":"var(--red-border)"}`,marginBottom:16,fontSize:12,color:app.covenantSigned?"var(--green)":"var(--red)",fontWeight:600}}>
                              {app.covenantSigned ? "Vendor Covenant signed" : "Vendor Covenant not signed"}
                            </div>
                            {/* Action buttons */}
                            {(() => {
                              const readiness = getFaithVerificationApprovalReadiness(app);
                              const blockers = [
                                !readiness.marketplaceApproved ? "Marketplace Approval required" : null,
                                !readiness.activeVendor ? "Vendor is suspended" : null,
                                !readiness.completeEvidence ? "Completed Christian-community evidence required" : null,
                              ].filter(Boolean);
                              return (
                                <>
                                  <div style={{marginBottom:10,fontSize:10.5,color:readiness.ready?"var(--green)":"var(--atext-muted)",lineHeight:1.5}}>
                                    {readiness.ready ? "Ready for Faith Verification decision." : blockers.join(" · ")}
                                  </div>
                                  <div className="admin-action-row">
                                    <button
                                      type="button"
                                      onClick={()=>approveVerification(app)}
                                      disabled={!readiness.ready}
                                      title={readiness.ready ? "Approve Faith Verification" : blockers.join(" · ")}
                                      className="act-approve hover-fade"
                                      style={{padding:"10px 22px",borderRadius:"var(--r-sm)",fontSize:12,opacity:readiness.ready?1:0.45,cursor:readiness.ready?"pointer":"not-allowed"}}
                                    >Approve Verification</button>
                                    <button type="button" onClick={()=>rejectVerification(app)} className="act-reject" style={{padding:"10px 22px",borderRadius:"var(--r-sm)",fontSize:12}}>Reject</button>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="admin-action-row" style={{justifyContent:"space-between",paddingTop:6}}>
                      <button type="button" className="admin-btn" disabled={verificationPage===0} onClick={()=>setVerificationPage(p=>Math.max(0,p-1))}>Previous</button>
                      <span className="admin-table-meta">Showing {verificationPage*50+1}–{Math.min((verificationPage+1)*50,verificationTotal)} of {verificationTotal}</span>
                      <button type="button" className="admin-btn" disabled={(verificationPage+1)*50>=verificationTotal} onClick={()=>setVerificationPage(p=>p+1)}>Next</button>
                    </div>
                  </div>
                )}
              </div>

              <div id="admin-review-charter" role="tabpanel" hidden={adminReviewLane!=="charter"} tabIndex={-1} style={{scrollMarginTop:16}}>
                <FoundingMembersAdmin showToast={showToast} refreshSignal={adminRefreshKey} onQueueChange={()=>{ fetchAdminReviewSummary(); fetchKpis(); }} onHealthChange={reportAdminDatasetHealth} healthKey="charterMembers" founderWaitlistReviewContext={founderWaitlistReviewContext} onClearFounderWaitlistReviewContext={()=>setFounderWaitlistReviewContext(null)} onReturnToFounderBrief={()=>openAdminView("overview", {}, "Back to Founder Brief")}/>
              </div>
              <div id="admin-review-partnerships" role="tabpanel" hidden={adminReviewLane!=="partnerships"} tabIndex={-1} style={{scrollMarginTop:16}}>
                <PartnerAppsPanel showToast={showToast} refreshSignal={adminRefreshKey} onAudit={writeAuditLog} onQueueChange={fetchAdminReviewSummary} onHealthChange={reportAdminDatasetHealth} healthKey="partnershipApplications"/>
              </div>
              <div id="admin-review-ambassadors" role="tabpanel" hidden={adminReviewLane!=="ambassadors"} tabIndex={-1} style={{scrollMarginTop:16}}>
                <AmbassadorAppsPanel showToast={showToast} refreshSignal={adminRefreshKey} onAudit={writeAuditLog} onQueueChange={fetchAdminReviewSummary} onHealthChange={reportAdminDatasetHealth} healthKey="ambassadorApplications"/>
              </div>
            </>
          )}

          {/* ── USERS ── */}
          {adminView==="users" && (
            <>
              <header className="admin-page-heading">
                <div className="admin-page-eyebrow">User management</div>
                <h1 className="admin-page-title">Users & Access</h1>
                <p className="admin-page-copy">Every church, ministry, and vendor account the platform can currently read, with secured account controls.</p>
              </header>
              <div className="admin-summary-strip">
                {[
                  {label:"Matching users", val:userTotal, color:"var(--atext)"},
                  {label:"Needs review", val:adminUsersNeedingReview.length, color:"var(--gold-light)"},
                  {label:"New this week", val:adminUsersNewThisWeek.length, color:"var(--green)"},
                  {label:"Visible now", val:filteredUsers.length, color:"var(--blue2)"},
                ].map((s)=>(
                  <div key={s.label} className="admin-summary-chip">
                    <div className="admin-summary-chip-label">{s.label}</div>
                    <div className="admin-summary-chip-value" style={{color:s.color}}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:10,marginBottom:14}}>
                {[
                  {key:"attention",label:"Needs review",count:adminUsersNeedingReview.length,copy:"Unverified, pending, or suspended accounts."},
                  {key:"recent",label:"New this week",count:adminUsersNewThisWeek.length,copy:"Recent signups and accounts to scan first."},
                  {key:"all",label:"Full list",count:allUsers.length,copy:"Every loaded account on this page."},
                ].map(item => (
                  <button type="button" key={item.key} onClick={()=>{ userTriageChosenRef.current = true; setUserTriageMode(item.key); }} style={{minHeight:78,padding:"13px 14px",borderRadius:16,border:`1px solid ${userTriageMode===item.key?"rgba(216,193,143,0.42)":"var(--aborder2)"}`,background:userTriageMode===item.key?"rgba(232,224,208,0.08)":"var(--abg2)",textAlign:"left",cursor:"pointer",boxShadow:userTriageMode===item.key?"0 0 0 1px rgba(216,193,143,0.14) inset":"none"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:6}}><span style={{fontSize:12,fontWeight:800,color:"var(--atext)"}}>{item.label}</span><strong style={{fontFamily:"var(--font-sans),monospace",fontSize:16,color:userTriageMode===item.key?"var(--gold-light)":"var(--atext-mid)"}}>{item.count}</strong></div>
                    <div style={{fontSize:10.5,lineHeight:1.45,color:"var(--atext-muted)"}}>{item.copy}</div>
                  </button>
                ))}
              </div>
              <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                <input aria-label="Search by name or category…" value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search by name or category…"
                  style={{flex:1,minWidth:200,padding:"8px 12px",background:"var(--abg3)",border:"1px solid var(--aborder2)",borderRadius:"var(--r-sm)",color:"var(--atext)",fontFamily:"var(--font-sans),sans-serif",fontSize:12,outline:"none"}}/>
                {["all","church","vendor"].map(t=>(
                  <button type="button" key={t} onClick={()=>setUserTypeFilter(t)}
                    style={{padding:"7px 14px",borderRadius:"var(--r-sm)",border:"1px solid",borderColor:userTypeFilter===t?"var(--gold)":"var(--aborder2)",background:userTypeFilter===t?"rgba(232,224,208,0.08)":"none",color:userTypeFilter===t?"var(--gold-light)":"var(--atext-muted)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"var(--font-sans),sans-serif",textTransform:"capitalize"}}>
                    {t==="all"?"All Types":t}
                  </button>
                ))}
                <select aria-label="Sort users" value={userSort} onChange={e=>setUserSort(e.target.value)} style={{padding:"7px 10px",background:"var(--abg3)",border:"1px solid var(--aborder2)",borderRadius:"var(--r-sm)",color:"var(--atext)",fontSize:11}}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
                <select aria-label="Users per page" value={userPageSize} onChange={e=>setUserPageSize(Number(e.target.value))} style={{padding:"7px 10px",background:"var(--abg3)",border:"1px solid var(--aborder2)",borderRadius:"var(--r-sm)",color:"var(--atext)",fontSize:11}}><option value={25}>25 / page</option><option value={50}>50 / page</option><option value={100}>100 / page</option></select>
              </div>
              <div className={`admin-surface-grid admin-surface-grid--wide${selectedUser ? " has-detail" : ""}`}>
                <div className="admin-table-wrap" style={{marginBottom:0}}>
                  <div className="panel-hd">
                    <div className="panel-title">{userTriageMode === "attention" ? "Needs Review" : userTriageMode === "recent" ? "New This Week" : "Users"}</div>
                    <div style={{fontFamily:"var(--font-sans),monospace",fontSize:10,color:"var(--atext-muted)"}}>
                      {filteredUsers.length} shown
                    </div>
                  </div>
                  {loadingUsers ? (
                    <div style={{display:"flex",flexDirection:"column",gap:0}}>
                      {[1,2,3,4,5].map(k=>(
                        <div key={k} style={{display:"grid",gridTemplateColumns:"minmax(180px,2fr) 80px 90px 100px 90px 60px",gap:10,padding:"11px 14px",borderBottom:"1px solid var(--aborder)",alignItems:"center"}}>
                          <div style={{display:"flex",alignItems:"center",gap:9}}><div style={{width:30,height:30,borderRadius:"var(--r-sm)",background:"var(--aborder)",flexShrink:0,animation:"skeleton 1.5s ease infinite"}}/><div style={{display:"flex",flexDirection:"column",gap:5}}><div style={{height:11,width:120,background:"var(--aborder)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/><div style={{height:9,width:80,background:"var(--aborder)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/></div></div>
                          <div style={{height:18,background:"var(--aborder)",borderRadius:100,animation:"skeleton 1.5s ease infinite"}}/>
                          <div style={{height:18,background:"var(--aborder)",borderRadius:100,animation:"skeleton 1.5s ease infinite"}}/>
                          <div style={{height:10,width:"70%",background:"var(--aborder)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/>
                          <div style={{height:10,width:"60%",background:"var(--aborder)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/>
                          <div style={{height:22,background:"var(--aborder)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/>
                        </div>
                      ))}
                    </div>
                  ) : usersError ? (
                    <div className="admin-state-card error"><div className="admin-state-title">Users could not load</div><div className="admin-state-copy">The Admin console will never recommend weakening RLS. Retry, then inspect the secured Admin read path if the error continues.</div><button type="button" className="act-btn act-view" onClick={fetchAllUsers}>Retry</button></div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="admin-state-card"><div className="admin-state-title">No users in this triage view</div><div className="admin-state-copy">Switch to Full list or adjust the search/account-type filter. The underlying user read path is unchanged.</div></div>
                  ) : (
                    <div className="admin-table-scroll" style={{overflowX:"auto"}}>
                      <table className="data-table" style={{minWidth:760}}>
                        <colgroup><col style={{width:"30%"}}/><col style={{width:"12%"}}/><col style={{width:"16%"}}/><col style={{width:"17%"}}/><col style={{width:"14%"}}/><col style={{width:"11%"}}/></colgroup>
                        <thead><tr>{["Name","Type","Status","Location","Joined",""].map((h,i)=><th key={i} style={{padding:"10px 14px 7px"}}>{h}</th>)}</tr></thead>
                        <tbody>
                          {filteredUsers
                            .map((u,i)=>(
                            <tr key={u.id||i} style={{cursor:"pointer",background:selectedUser?.id===u.id?"rgba(232,224,208,0.05)":"transparent"}} onClick={()=>setSelectedUser(selectedUser?.id===u.id?null:u)}>
                              <td style={{padding:"10px 14px"}}>
                                <div style={{display:"flex",alignItems:"center",gap:9}}>
                                  <div style={{width:30,height:30,borderRadius:"var(--r-sm)",background:u.type==="church"?"#162032":"#3D2200",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.75)",flexShrink:0}}>
                                    {u.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{fontSize:12,fontWeight:600,color:"var(--atext)"}}>{u.name}</div>
                                    {u.category&&<div style={{fontSize:10,color:"var(--atext-muted)"}}>{u.category}</div>}
                                  </div>
                                </div>
                              </td>
                              <td style={{padding:"10px 8px",whiteSpace:"nowrap"}}><span className={`badge ${u.type==="church"?"badge-blue":"badge-gold"}`}>{u.type}</span></td>
                              <td style={{padding:"10px 8px",whiteSpace:"nowrap"}}>
                                {(() => { const pill = getAdminUserStatusPill(u); return <span style={pill.style}>{pill.label}</span>; })()}
                              </td>
                              <td style={{padding:"10px 8px",fontSize:11,color:"var(--atext-muted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}} title={u.city}>{u.city}</td>
                              <td style={{padding:"10px 8px",fontSize:10,color:"var(--atext-muted)",fontFamily:"var(--font-sans),monospace",whiteSpace:"nowrap"}}>{u.joined}</td>
                              <td style={{padding:"10px 14px"}}>
                                <button type="button" className="act-btn act-view" style={{fontSize:10}} onClick={e=>{e.stopPropagation();setSelectedUser(selectedUser?.id===u.id?null:u);}}>Details</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {!loadingUsers && !usersError && userTriageMode === "all" && userTotal>0 && <div className="admin-action-row" style={{justifyContent:"space-between",padding:"12px 14px",borderTop:"1px solid var(--aborder)"}}><button type="button" className="admin-btn" disabled={userPage===0} onClick={()=>setUserPage(p=>Math.max(0,p-1))}>Previous</button><span className="admin-table-meta">Showing {userPage*userPageSize+1}–{Math.min((userPage+1)*userPageSize,userTotal)} of {userTotal}</span><button type="button" className="admin-btn" disabled={(userPage+1)*userPageSize>=userTotal} onClick={()=>setUserPage(p=>p+1)}>Next</button></div>}
                </div>
                {selectedUser && (
                  <div className="admin-detail-rail" style={{width:300,flexShrink:0,background:"var(--abg2)",border:"1px solid var(--aborder)",borderRadius:"var(--r-md)",padding:"18px 16px",animation:"fadeUp 0.15s ease",position:"sticky",top:0}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--atext-muted)"}}>User Detail</div>
                      <button type="button" aria-label="Close" onClick={()=>setSelectedUser(null)} style={{background:"none",border:"none",color:"var(--atext-muted)",cursor:"pointer",fontSize:18,lineHeight:1,padding:0}}>×</button>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,paddingBottom:16,borderBottom:"1px solid var(--aborder)"}}>
                      <div style={{width:40,height:40,borderRadius:10,background:selectedUser.type==="church"?"#162032":"#3D2200",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.8)",flexShrink:0}}>
                        {selectedUser.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:"var(--atext)",lineHeight:1.2,marginBottom:4}}>{selectedUser.name}</div>
                        <span className={`badge ${selectedUser.type==="church"?"badge-blue":"badge-gold"}`}>{selectedUser.type}</span>
                      </div>
                    </div>
                    {[
                      {label:"Category", val:selectedUser.category||"//"},
                      {label:"Location", val:selectedUser.city||"//"},
                      {label:"Access",   val:selectedUser.plan||"//"},
                      {label:"Joined",   val:selectedUser.joined||"//"},
                      {label:selectedUser.type==="church"?"Church Verified":"Faith Verified", val:(selectedUser.type==="church"?selectedUser.churchVerified:selectedUser.verified)?"Yes":"No"},
                      {label:"Status",   val:selectedUser.suspended?"Suspended":"Active"},
                    ].map((row,i)=>(
                      <div key={row.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<5?"1px solid var(--aborder)":"none"}}>
                        <span style={{fontSize:10,color:"var(--atext-muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{row.label}</span>
                        <span style={{fontSize:11,color:"var(--atext)",fontFamily:"var(--font-sans),monospace"}}>{row.val}</span>
                      </div>
                    ))}
                    <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:14}}>
                      {selectedUser.type==="vendor"&&!selectedUser.verified&&(
                        <div className="admin-inline-notice" style={{fontSize:11,lineHeight:1.6}}>
                          Faith Verification decisions are managed in the dedicated review queue.
                        </div>
                      )}
                      {selectedUser.type==="church"&&!selectedUser.churchVerified&&(
                        <button type="button" disabled={userActionId===selectedUser.id} className="act-btn act-approve" style={{width:"100%",padding:"8px",textAlign:"center"}} onClick={async()=>{
                          if (!window.confirm(`Verify ${selectedUser.name} as a church account?`)) return;
                          setUserActionId(selectedUser.id);
                          try {
                            const { data, error } = await supabase.rpc("kb_admin_verify_church", {
                              p_profile_id: selectedUser.id,
                            });
                            const reviewedChurch = Array.isArray(data) ? data[0] : data;
                            if (error) throw error;
                            if (!reviewedChurch?.profile_id || reviewedChurch?.church_verified !== true) {
                              throw new Error("Atomic church verification returned an incomplete result");
                            }
                            showToast("\u2713 "+selectedUser.name+" church account verified");
                            setSelectedUser({...selectedUser,churchVerified:true});
                            setAllUsers(us=>us.map(u=>u.id===selectedUser.id?{...u,churchVerified:true}:u));
                          } catch(err){
                            logError('church-verify-atomic-review', err, { userId: selectedUser.id });
                            showToast(`Couldn't verify ${selectedUser.name} — please try again.`, "error");
                          } finally { setUserActionId(null); }
                        }}>Verify Church</button>
                      )}
                      <button type="button" className={`act-btn ${selectedUser.suspended?'act-approve':'act-reject'}`} style={{width:"100%",padding:"8px",textAlign:"center"}} onClick={()=>toggleUserSuspension(selectedUser)}>{selectedUser.suspended?"Restore Access":"Suspend User"}</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── FINANCE & FEE SIGNALS ── */}
          {adminView==="revenue" && (
            <>
              <header className="admin-page-heading">
                <div className="admin-page-eyebrow">Commercial record</div>
                <h1 className="admin-page-title">Concierge Commercial Record</h1>
                <p className="admin-page-copy">Legacy marketplace fee modeling is paused. Project payments are not processed by FaithBid, and any separate placement fee is handled by manual agreement and invoice.</p>
              </header>
              {feeSignalError && <div className="admin-inline-notice warning" style={{marginBottom:14}}>Fee-signal data is unavailable. Values below are intentionally hidden instead of being reported as zero. <button type="button" className="panel-action" onClick={hydrateFeeSignalSnapshot}>Retry</button></div>}
              <div className="admin-metric-grid" style={{marginBottom:16}}>
                {[
                  {label:"Faith-Verified vendors",      val:formatAdminKpiValue(trustedVerifiedVendors), color:"var(--gold-light)", note:"Earned trust count · not paid subscribers"},
                  {label:"Recorded hire signals",        val:feeSignalError?"—":feeSignalSnapshot.hireSignals, color:"var(--atext)", note:"Latest up to 5,000 records · not transactions"},
                  {label:"Legacy marketplace fee model", val:"Paused", color:"var(--green)", note:"Not advertised or collected"},
                  {label:"Church rebate model", val:"Paused", color:"var(--green)", note:"Not active"},
                ].map((k)=>(
                  <div key={k.label} style={{background:"var(--abg2)",border:"1px solid var(--aborder)",borderRadius:10,padding:"14px 16px"}}>
                    <div style={{fontSize:9,color:"var(--atext-muted)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:6,fontWeight:600}}>{k.label}</div>
                    <div style={{fontFamily:"var(--font-sans),monospace",fontSize:22,fontWeight:700,color:k.color,lineHeight:1,marginBottom:4}}>{k.val}</div>
                    <div style={{fontSize:10,color:"var(--atext-muted)"}}>{k.note}</div>
                  </div>
                ))}
              </div>
              <div className="admin-two-col">
                <div className="panel" style={{marginBottom:0}}>
                  <div className="panel-hd"><div className="panel-title">Vendor Access & Trust Mix</div></div>
                  <div className="panel-body">
                    <div style={{fontSize:11,color:"var(--atext-muted)",marginBottom:14,lineHeight:1.5}}>Faith-Verified is an earned trust standard, not evidence of a paid plan or subscription revenue.</div>
                    {[
                      {name:"Faith-Verified", price:"Free to apply", count:trustedVerifiedVendors ?? "-",                                  statusLabel:"Trust status", pct:trustedVerifiedVendors == null || getAdminKpiNumber(kpis, "vendors") == null ? 0 : Math.min(100, Math.round((trustedVerifiedVendors / Math.max(1, getAdminKpiNumber(kpis, "vendors"))) * 100))},
                      {name:"Member",         price:"Free to join",  count:trustedVerifiedVendors == null || getAdminKpiNumber(kpis, "vendors") == null ? "-" : Math.max(0,getAdminKpiNumber(kpis, "vendors")-trustedVerifiedVendors),          statusLabel:"Open access",  pct:trustedVerifiedVendors == null || getAdminKpiNumber(kpis, "vendors") == null ? 0 : Math.max(0, 100 - Math.min(100, Math.round((trustedVerifiedVendors / Math.max(1, getAdminKpiNumber(kpis, "vendors"))) * 100)))},
                    ].map((t)=>(
                      <div key={t.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 12px",background:"var(--abg3)",borderRadius:"var(--r-sm)",marginBottom:7}}>
                        <div><div style={{fontSize:12,fontWeight:600,color:"var(--atext)"}}>{t.name}</div><div style={{fontSize:10,color:"var(--atext-muted)"}}>{t.count} vendors</div></div>
                        <div style={{flex:1,margin:"0 14px"}}><div style={{height:4,background:"var(--abg4)",borderRadius:2,overflow:"hidden"}}><div style={{width:`${t.pct}%`,height:"100%",background:"linear-gradient(90deg,var(--gold),var(--gold-light))",borderRadius:2}}/></div></div>
                        <div style={{textAlign:"right"}}><div style={{fontFamily:"var(--font-sans),monospace",fontSize:11,color:"var(--gold-light)"}}>{t.price}</div><div style={{fontFamily:"var(--font-sans),monospace",fontSize:13,fontWeight:600,color:"var(--green)"}}>{t.statusLabel}</div></div>
                      </div>
                    ))}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 12px",background:"var(--abg)",borderRadius:"var(--r-sm)",marginTop:4}}>
                      <div style={{fontSize:12,color:"var(--atext-mid)"}}>Placement terms</div>
                      <div style={{fontFamily:"var(--font-sans),monospace",fontSize:17,fontWeight:700,color:"var(--green)"}}>Agreed before introduction</div>
                    </div>
                  </div>
                </div>
                <div className="panel" style={{marginBottom:0}}>
                  <div className="panel-hd"><div className="panel-title">Payments status</div></div>
                  <div className="panel-body" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"32px 20px",gap:10}}>
                    <div style={{width:48,height:48,borderRadius:"var(--r-md)",background:"var(--abg3)",border:"1px solid var(--aborder2)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4}}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--atext-muted)" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--atext)"}}>Project payments stay off-platform</div>
                    <div style={{fontSize:11,color:"var(--atext-muted)",lineHeight:1.6}}>Churches pay vendors directly. Any separate FaithBid placement fee is agreed before an introduction and invoiced manually.</div>
                    <button type="button" className="act-btn act-view" style={{marginTop:6,padding:"7px 16px"}} onClick={()=>openAdminView("revenue", {financeSection:"admin-commercial-policy"})}>View fee policy below</button>
                  </div>
                </div>
              </div>
              <div id="admin-commercial-policy" tabIndex={-1} className="panel" style={{scrollMarginTop:16}}>
                <div className="panel-hd"><div className="panel-title">Commercial Policy</div><span className="badge badge-muted">Code-controlled</span></div>
                <div className="panel-body">
                  {[
                    {label:"Church and ministry access", value:"No active charge", note:"No standard public pricing is currently advertised."},
                    {label:"Vendor access", value:"No paid plan", note:"Faith-Verified is an earned trust status, not a paid plan."},
                    {label:"Placement terms", value:"Agreed case by case", note:"Disclosed before an introduction and invoiced manually."},
                    {label:"Church rebate model", value:"Paused", note:"No automatic rebate program is active."},
                    {label:"Project payments", value:"Direct", note:"Churches pay vendors directly; FaithBid does not process the project payment."},
                  ].map((item,i)=>(
                    <div key={item.label} style={{padding:"12px 0",borderBottom:i<4?"1px solid var(--aborder)":"none",display:"flex",justifyContent:"space-between",gap:20,alignItems:"flex-start"}}>
                      <div><div style={{fontSize:12,fontWeight:600,color:"var(--atext)",marginBottom:3}}>{item.label}</div><div style={{fontSize:10,color:"var(--atext-muted)",lineHeight:1.5}}>{item.note}</div></div>
                      <div style={{fontFamily:"var(--font-sans),monospace",fontSize:11,color:"var(--gold-light)",textAlign:"right",flexShrink:0}}>{item.value}</div>
                    </div>
                  ))}
                  <div className="admin-inline-notice warning" style={{marginTop:14}}>Policy version: {CHURCH_REBATE_POLICY_VERSION}. These values are configurable for future transactions, but should not be changed retroactively after a transaction commits.</div>
                </div>
              </div>
              {/* Referral intelligence moved to Insights → Growth & Launch. */}
            </>
          )}

          {/* ── DISPUTES ── */}
          {/* GET PLUGGED IN */}
          {adminView==="get-plugged-in" && <GetPluggedInAdmin showToast={showToast} founderGrowthContext={founderGrowthContext} onClearFounderGrowthContext={()=>setFounderGrowthContext(null)} onReturnToFounderBrief={()=>openAdminView("overview", {}, "Back to Founder Brief")}/>}

          {adminView==="privacy" && <AdminPrivacyRequests showToast={showToast} />}
          {adminView==="credentials" && <AdminVendorCredentials showToast={showToast} />}
          {adminView==="disputes" && (
            <>
              <header className="admin-page-heading">
                <div className="admin-page-eyebrow">Dispute center</div>
                <h1 className="admin-page-title">Dispute Cases</h1>
                <p className="admin-page-copy">Exact all-time status counts with the latest 100 cases available for review below.</p>
              </header>
              {disputeSummary.error && (
                <div className="admin-inline-notice warning" style={{marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                  <span>Exact all-time dispute counts are unavailable; recent cases are not being presented as global totals.</span>
                  <button type="button" className="act-btn act-view" onClick={fetchAdminDisputeSummary}>Retry exact counts</button>
                </div>
              )}
              <div className="admin-metric-grid" style={{marginBottom:16}}>
                {[
                  {label:"Open · all time",          val:disputeSummary.loading?"…":disputeSummary.error?"—":disputeSummary.open,          color:"var(--red)"},
                  {label:"Investigating · all time", val:disputeSummary.loading?"…":disputeSummary.error?"—":disputeSummary.investigating, color:"var(--amber)"},
                  {label:"Mediation · all time",     val:disputeSummary.loading?"…":disputeSummary.error?"—":disputeSummary.mediation,      color:"var(--blue2)"},
                  {label:"Resolved · all time",      val:disputeSummary.loading?"…":disputeSummary.error?"—":disputeSummary.resolved,       color:"var(--green)"},
                ].map((s)=>(
                  <div key={s.label} style={{background:"var(--abg2)",border:"1px solid var(--aborder)",borderRadius:"var(--r-sm)",padding:"12px 16px"}}>
                    <div style={{fontSize:9,color:"var(--atext-muted)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:5,fontWeight:600}}>{s.label}</div>
                    <div style={{fontFamily:"var(--font-sans),monospace",fontSize:26,fontWeight:700,color:s.color}}>{s.val}</div>
                  </div>
                ))}
              </div>
              {!loadingDisputes && !disputesError && (
                <div className="admin-table-meta" style={{marginBottom:12}}>
                  Recent case list: {disputes.length} of the latest 100 loaded · {recentDisputeStats.unresolved} unresolved in this list. Global open-dispute badges use a separate exact all-time unresolved aggregate.
                </div>
              )}
              {disputesError ? (
                <div className="admin-state-card error"><div className="admin-state-title">Recent disputes could not load</div><div className="admin-state-copy">The latest 100-case list is unavailable; it has not been treated as empty or used as a global total.</div><button type="button" className="act-btn act-view" onClick={fetchDisputes}>Retry recent cases</button></div>
              ) : loadingDisputes ? (
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {[1,2,3].map(k=>(
                    <div key={k} className="dispute-card" style={{display:"flex",flexDirection:"column",gap:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",gap:12}}><div style={{height:12,width:"55%",background:"var(--aborder)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/><div style={{height:20,width:64,background:"var(--aborder)",borderRadius:100,animation:"skeleton 1.5s ease infinite"}}/></div>
                      <div style={{height:9,width:"40%",background:"var(--aborder)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/>
                      <div style={{display:"flex",gap:8}}><div style={{height:20,width:100,background:"var(--aborder)",borderRadius:"var(--r-sm)",animation:"skeleton 1.5s ease infinite"}}/><div style={{height:20,width:100,background:"var(--aborder)",borderRadius:"var(--r-sm)",animation:"skeleton 1.5s ease infinite"}}/></div>
                    </div>
                  ))}
                </div>
              ) : disputes.length === 0 ? (
                <div style={{textAlign:"center",padding:"50px 40px",color:"var(--atext-muted)"}}>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--atext)",marginBottom:5}}>No disputes</div>
                  <div style={{fontSize:11}}>Disputes opened by churches or vendors will appear here.</div>
                </div>
              ) : disputes.map(d=>(
                <div key={d.id} className={`dispute-card${d.urgent?" urgent":""}`} style={adminFocus.disputeId===d.id ? {boxShadow:"0 0 0 1px rgba(216,193,143,0.28) inset"} : undefined}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8,gap:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:d.urgent?"var(--red)":"var(--atext)",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.title}</div>
                      <div style={{fontSize:10,color:"var(--atext-muted)"}}>Opened {d.opened} · <span style={{color:"var(--amber)",fontFamily:"var(--font-sans),monospace"}}>{d.amount}</span> · <span style={{color:d.openedAt && (adminClockMs-new Date(d.openedAt).getTime()) >= 1000*60*60*24 ? "var(--red)" : "var(--atext-muted)"}}>Age {formatQueueAgeLabel(adminClockMs-new Date(d.openedAt).getTime())}</span></div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                      {d.status!=="resolved" && (
                        <select aria-label={`Status for ${d.title}`} value={d.status} onChange={e=>updateDisputeStatus(d.id,e.target.value)}
                          style={{fontSize:10,padding:"4px 8px",borderRadius:"var(--r-sm)",border:"1px solid var(--aborder2)",background:"var(--abg3)",color:"var(--atext)",fontFamily:"var(--font-sans),sans-serif",cursor:"pointer"}}>
                          <option value="open">Open</option>
                          <option value="investigating">Investigating</option>
                          <option value="mediation">Mediation</option>
                        </select>
                      )}
                      {(() => { const badgeMeta = getAdminDisputeBadgeMeta(d.status); return <span className={badgeMeta.className}>{badgeMeta.label}</span>; })()}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:10}}>
                    <span style={{padding:"3px 9px",borderRadius:"var(--r-sm)",fontSize:10,fontWeight:600,background:"rgba(30,48,80,0.4)",color:"rgba(255,255,255,0.6)",border:"1px solid var(--aborder)"}}>Church: {d.church}</span>
                    <span style={{fontSize:10,color:"var(--atext-muted)",alignSelf:"center"}}>vs</span>
                    <span style={{padding:"3px 9px",borderRadius:"var(--r-sm)",fontSize:10,fontWeight:600,background:"rgba(232,224,208,0.06)",color:"var(--gold-light)",border:"1px solid rgba(232,224,208,0.15)"}}>Vendor: {d.vendor}</span>
                  </div>
                  {d.body&&<div style={{fontSize:11,color:"var(--atext-mid)",lineHeight:1.6,marginBottom:10,fontWeight:400}}>{d.body}</div>}
                  <div className="admin-inline-notice" style={{marginBottom:10}}>Persistent internal case notes are not available in the current schema, so this console does not show a fake notes field.</div>
                  {d.status!=="resolved" && (
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <button type="button" className="act-btn act-approve" onClick={()=>resolveDispute(d.id,"Refund decision recorded")}>Record Refund Decision</button>
                      <button type="button" className="act-btn act-view" onClick={()=>resolveDispute(d.id,"Release decision recorded")}>Record Release Decision</button>
                      <button type="button" className="act-btn" style={{background:"var(--amber-bg)",color:"var(--amber)",border:"1px solid var(--amber-border)"}} onClick={()=>updateDisputeStatus(d.id,"mediation")}>Move to Mediation</button>
                    </div>
                  )}
                  {d.status==="resolved" && <div style={{fontSize:11,color:"var(--green)",fontWeight:600}}>Resolved{d.resolution?` // ${d.resolution}`:""}</div>}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── REJECT REASON MODAL ── */}
      {rejectModal && (
        <div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget)closeActiveAdminDialog();}}>
          <div ref={adminDialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="admin-reject-dialog-title" tabIndex={-1} onClick={e=>e.stopPropagation()} style={{maxWidth:420}}>
            <div className="modal-hd">
              <div id="admin-reject-dialog-title" className="modal-title">Reject — {rejectModal.label}</div>
              <button type="button" className="modal-close" aria-label="Close" onClick={closeActiveAdminDialog}>×</button>
            </div>
            <div className="modal-body">
              <div style={{fontSize:13,color:"var(--atext-mid)",marginBottom:14,lineHeight:1.6}}>
                {rejectModal.type === "verification"
                  ? "The applicant will receive this decision summary. Write at least 20 characters and summarize the decision in your own words — do not paste private reference answers verbatim."
                  : "The vendor will receive a notification with this reason. Be clear and professional."}
              </div>
              <label htmlFor="reject-reason" style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"var(--atext-muted)",display:"block",marginBottom:6}}>{rejectModal.type === "verification" ? "Decision summary" : "Reason for rejection"}</label>
              <textarea
                ref={rejectReasonInputRef}
                id="reject-reason"
                value={rejectReason}
                onChange={e=>setRejectReason(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder={rejectModal.type === "verification" ? "Summarize why FaithBid could not approve Faith Verification without quoting the private respondent." : "e.g. Service category does not match our marketplace focus…"}
                style={{width:"100%",padding:"10px 12px",borderRadius:"var(--r-sm)",border:"1px solid var(--aborder2)",background:"var(--abg3)",color:"var(--atext)",fontFamily:"var(--font-sans),sans-serif",fontSize:13,resize:"none",boxSizing:"border-box",outline:"none"}}
              />
              <div style={{fontSize:11,color:"var(--atext-muted)",marginTop:4}}>
                {rejectModal.type === "verification" ? `${rejectReason.trim().length}/20 minimum · 1000 max` : "Required for rejection"}
              </div>
            </div>
            <div className="modal-footer" style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button type="button" className="btn-cancel-modal" onClick={closeActiveAdminDialog}>Cancel</button>
              <button type="button"
                className="btn-deny-modal"
                onClick={async()=>{
                  const rm = rejectModal;
                  const reason = rejectReason.trim();
                  if (!reason) {
                    showToast("Add a rejection reason before continuing.", "error");
                    rejectReasonInputRef.current?.focus?.();
                    return;
                  }
                  if (rm.type === "verification" && reason.length < 20) {
                    showToast("Faith Verification rejection summaries must be at least 20 characters.", "error");
                    rejectReasonInputRef.current?.focus?.();
                    return;
                  }
                  setRejectModal(null);
                  try {
                    if (rm.type === "vendor") await doRejectVendor(rm.id, reason);
                    else if (rm.type === "verification") await doRejectVerification(rm.extra, reason);
                  } catch (err) {
                    logError('admin-reject-modal-confirm', err, { type: rm?.type, id: rm?.id });
                    showToast("Rejection failed — please try again.", "error");
                  }
                }}
              >✕ Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ── */}
      {modal&&(
        <div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget)closeActiveAdminDialog();}}>
          <div ref={adminDialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="admin-review-dialog-title" tabIndex={-1} onClick={e=>e.stopPropagation()}>
            <div className="modal-hd"><div id="admin-review-dialog-title" className="modal-title">Review Directory Application</div><button type="button" className="modal-close" aria-label="Close" data-admin-dialog-initial onClick={closeActiveAdminDialog}>×</button></div>
            <div className="modal-body">
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <div style={{width:44,height:44,borderRadius:12,background:"var(--abg4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"var(--atext)",letterSpacing:0.5}}>{modal.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>
                <div><div style={{fontSize:14,fontWeight:700,color:"var(--atext)"}}>{modal.name}</div><div style={{fontSize:11,color:"var(--atext-muted)"}}>{modal.category} · {modal.city}</div></div>
                <span className={`badge ${modal.tier==="Faith Verified"?"badge-gold":"badge-muted"}`} style={{marginLeft:"auto"}}>{modal.tier}</span>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:9,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"var(--atext-muted)",marginBottom:8}}>Faith Statement</div>
                {modal.statement
                  ? <div style={{fontSize:12,color:"var(--atext-mid)",fontStyle:"italic",lineHeight:1.6,padding:"10px 12px",background:"var(--abg3)",borderRadius:"var(--r-sm)"}}>"{modal.statement}"</div>
                  : <div style={{fontSize:12,color:"var(--atext-muted)"}}>No faith statement provided.</div>
                }
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:9,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"var(--atext-muted)",marginBottom:8}}>Details</div>
                {[{label:"Category",val:modal.category||"//"},{label:"City",val:modal.city||"//"},{label:"Admission",val:"Pending review"},{label:"Waiting",val:modal.waiting?.label||"Unknown"},{label:"Trust",val:modal.verified?"Faith-Verified":"Not yet Faith-Verified"},{label:"Applied",val:modal.joined||"//"}].map((item,i)=>(
                  <div key={i} className="checklist-item">
                    <span style={{color:"var(--atext-muted)",width:80,flexShrink:0}}>{item.label}</span>
                    <span style={{color:"var(--atext)"}}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel-modal" onClick={closeActiveAdminDialog}>Cancel</button>
              <button type="button" className="btn-deny-modal" onClick={()=>rejectVendor(modal.id)}>✕ Reject Admission…</button>
              <button type="button" className="btn-approve-modal" onClick={()=>approveVendor(modal.id)}>✓ Admit to Directory</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
