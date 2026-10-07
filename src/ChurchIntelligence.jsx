import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { withRequestDeadline } from "./supabaseReliability";
import "leaflet/dist/leaflet.css";
import "./styles/church-intelligence.css";

const OPERATING_STATES = ["active","inactive","unknown"];

// Five-state status model, derived entirely from fields the overview RPC
// already returns (dallas_membership, open_review_case_count,
// has_promoted_claim) -- no backend change needed. The same function feeds
// both the status filter chips and the map marker colors, so there is one
// definition of "verified," not two.
const STATUS_META = {
  verified: { label: "Verified", color: "#1f7a4a" },
  needs_review: { label: "Needs review", color: "#b7791f" },
  boundary_review: { label: "Boundary review", color: "#c9962e" },
  outside_dallas: { label: "Outside Dallas", color: "#9a3b2f" },
  candidate: { label: "Candidate", color: "#8a8f87" },
};
const STATUS_ORDER = ["verified", "needs_review", "boundary_review", "outside_dallas", "candidate"];

function churchStatus(row) {
  if (row?.intelligence_status && STATUS_META[row.intelligence_status]) return row.intelligence_status;
  if (row?.dallas_membership === "excluded") return "outside_dallas";
  if ((row?.open_review_case_count || 0) > 0) return "needs_review";
  if (row?.dallas_membership === "review") return "boundary_review";
  if (row?.is_ready) return "verified";
  return "candidate";
}

// Fixed presets for v1 -- a small shared table to let staff save their own
// views isn't justified yet at 40 records. These are just shorthand for
// filter states the controls below already support.
const SAVED_VIEWS = [
  { key: "needs_review", label: "Needs review", apply: () => ({ statuses: ["needs_review", "boundary_review"] }) },
  { key: "not_connected", label: "Not yet checked against FaithBid", apply: () => ({ connectedOnly: false, statuses: [] }) },
  { key: "single_source", label: "Still single-source", apply: () => ({ statuses: ["candidate"] }) },
];

function parseHashParams() {
  const raw = String(window.location.hash || "");
  const qIndex = raw.indexOf("?");
  if (qIndex === -1) return new URLSearchParams();
  return new URLSearchParams(raw.slice(qIndex + 1));
}

function writeHashParams(params) {
  const raw = String(window.location.hash || "#church-intelligence");
  const base = raw.split("?")[0] || "#church-intelligence";
  const qs = params.toString();
  const next = qs ? `${base}?${qs}` : base;
  if (next !== raw) window.history.replaceState(null, "", next);
}

async function sha256Hex(input) {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function Empty({ eyebrow, title, detail }) {
  return <div className="ci-empty"><span aria-hidden="true">CI</span><div><p className="ci-eyebrow">{eyebrow}</p><h3>{title}</h3><p>{detail}</p></div></div>;
}

function Badge({ children, tone = "neutral" }) {
  return <span className={`ci-badge ci-badge-${tone}`}>{children}</span>;
}


function Banner({ banner, onDismiss }) {
  if (!banner) return null;
  return <div className={`ci-banner ci-banner-${banner.type}`}><span>{banner.text}</span><button type="button" onClick={onDismiss} aria-label="Dismiss">×</button></div>;
}

function Modal({ title, subtitle, onClose, children, wide }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const previouslyFocused = document.activeElement;
    const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const getFocusable = () => Array.from(dialog.querySelectorAll(focusableSelector)).filter(node => node.getClientRects().length > 0);
    const initialFocus = dialog.querySelector('input:not([disabled]),select:not([disabled]),textarea:not([disabled])') || getFocusable()[0] || dialog;
    initialFocus.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) { event.preventDefault(); dialog.focus(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };

    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) previouslyFocused.focus();
    };
  }, [onClose]);

  return <div className="ci-modal-backdrop" role="dialog" aria-modal="true" aria-label={title} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div ref={dialogRef} className={`ci-modal${wide ? " wide" : ""}`} tabIndex={-1}>
      <header><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div><button type="button" onClick={onClose} aria-label="Close">×</button></header>
      <div className="ci-modal-body">{children}</div>
    </div>
  </div>;
}

function Field({ label, children, hint }) {
  return <label className="ci-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export default function ChurchIntelligence({ currentUser, isAdmin, nav }) {
  const [view, setView] = useState("list");
  const [workspaceTab, setWorkspaceTab] = useState("directory");
  const [banner, setBanner] = useState(null);

  const purpose = "research";

  const [directory, setDirectory] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState("");
  const [directoryRefreshedAt, setDirectoryRefreshedAt] = useState(null);
  const initialParams = useMemo(() => parseHashParams(), []);
  const [directorySearch, setDirectorySearch] = useState(() => initialParams.get("q") || "");
  const [statusFilters, setStatusFilters] = useState(() => (initialParams.get("status") || "").split(",").filter(Boolean));
  const [denominationFilters, setDenominationFilters] = useState(() => (initialParams.get("denom") || "").split(",").filter(Boolean));
  const [districtFilters, setDistrictFilters] = useState(() => (initialParams.get("district") || "").split(",").filter(Boolean));
  const [postalFilter, setPostalFilter] = useState(() => initialParams.get("zip") || "all");
  const [connectedOnly, setConnectedOnly] = useState(() => initialParams.get("connected") === "1");
  const [showDensity, setShowDensity] = useState(false);
  const [boundaryGeojson, setBoundaryGeojson] = useState(null);
  const [districtGeojson, setDistrictGeojson] = useState(null);
  const [matchResults, setMatchResults] = useState({});
  const [matchLoadingId, setMatchLoadingId] = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [orgDetail, setOrgDetail] = useState(null);
  const [orgDetailLoading, setOrgDetailLoading] = useState(false);
  const [orgDetailError, setOrgDetailError] = useState("");

  const [sources, setSources] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [signals, setSignals] = useState([]);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [health, setHealth] = useState(null);

  const [showNewOrgModal, setShowNewOrgModal] = useState(false);
  const [busy, setBusy] = useState(false);

  const callRpc = useCallback(async (fn, args, label) => {
    const { data, error } = await withRequestDeadline(
      signal => supabase.rpc(fn, args).abortSignal(signal),
      { timeoutMs: 15000, label },
    );
    if (error) throw error;
    return data;
  }, []);
  const notify = useCallback((type, text) => setBanner({ type, text }), []);

  const refreshDirectory = useCallback(async () => {
    if (!currentUser?.id || !isAdmin) return;
    setDirectoryLoading(true); setDirectoryError("");
    try {
      const rows = [];
      let offset = 0;
      let total = 0;
      let refreshedAt = null;
      do {
        const page = await callRpc("ci_list_organizations_overview_page", { p_limit: 200, p_offset: offset }, "Church Intelligence directory read");
        const pageRows = Array.isArray(page?.rows) ? page.rows : [];
        rows.push(...pageRows);
        total = Number(page?.total || 0);
        refreshedAt = page?.refreshed_at || refreshedAt;
        offset += pageRows.length;
        if (!pageRows.length) break;
      } while (offset < total);
      setDirectory(rows);
      setDirectoryRefreshedAt(refreshedAt);
    } catch (err) { setDirectory([]); setDirectoryError(err?.message || "The directory service did not respond."); }
    finally { setDirectoryLoading(false); }
  }, [currentUser?.id, isAdmin, callRpc]);

  const refreshReviews = useCallback(async () => {
    if (!currentUser?.id || !isAdmin) return;
    setReviewsLoading(true);
    try {
      const data = await callRpc("ci_list_review_cases", { p_status: null, p_limit: 200 }, "Church Intelligence review queue");
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) { notify("error", err?.message || "Could not load the review queue."); }
    finally { setReviewsLoading(false); }
  }, [currentUser?.id, isAdmin, callRpc, notify]);

  const refreshSignals = useCallback(async () => {
    if (!currentUser?.id || !isAdmin) return;
    setSignalsLoading(true);
    try {
      const data = await callRpc("ci_list_operational_signals", { p_status: null, p_limit: 500 }, "Church website signals");
      setSignals(Array.isArray(data) ? data : []);
    } catch (err) { notify("error", err?.message || "Could not load website signals."); }
    finally { setSignalsLoading(false); }
  }, [currentUser?.id, isAdmin, callRpc, notify]);

  const refreshHealth = useCallback(async () => {
    if (!currentUser?.id || !isAdmin) return;
    try { setHealth(await callRpc("ci_get_health_summary", {}, "Church Intelligence health summary")); }
    catch { setHealth(null); }
  }, [currentUser?.id, isAdmin, callRpc]);

  const refreshSources = useCallback(async () => {
    if (!currentUser?.id || !isAdmin) return;
    try {
      const data = await callRpc("ci_list_sources", { p_limit: 200 }, "Church Intelligence source registry read");
      setSources(Array.isArray(data) ? data : []);
    } catch { setSources([]); }
  }, [currentUser?.id, isAdmin, callRpc]);

  const refreshBoundary = useCallback(async () => {
    if (!currentUser?.id || !isAdmin) return;
    try {
      const [city, districts] = await Promise.all([
        callRpc("ci_get_boundary_geojson", { p_scope: "city" }, "Church Intelligence city boundary read"),
        callRpc("ci_get_boundary_geojson", { p_scope: "district" }, "Church Intelligence district boundary read"),
      ]);
      setBoundaryGeojson(city || null);
      setDistrictGeojson(districts || null);
    } catch { setBoundaryGeojson(null); setDistrictGeojson(null); }
  }, [currentUser?.id, isAdmin, callRpc]);

  const refreshAll = useCallback(() => {
    void refreshDirectory(); void refreshSources(); void refreshBoundary(); void refreshReviews(); void refreshSignals(); void refreshHealth();
  }, [refreshDirectory, refreshSources, refreshBoundary, refreshReviews, refreshSignals, refreshHealth]);

  useEffect(() => { const t = setTimeout(() => { refreshAll(); }, 0); return () => clearTimeout(t); }, [refreshAll]);

  // Keep the URL hash in sync with filter state so a view is shareable --
  // history.replaceState, not location.hash=, so this never fires the app's
  // own hashchange route listener (which only cares about the path before
  // "?" anyway; see readAppScreenFromHash in App.jsx).
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilters.length) params.set("status", statusFilters.join(","));
    if (denominationFilters.length) params.set("denom", denominationFilters.join(","));
    if (districtFilters.length) params.set("district", districtFilters.join(","));
    if (postalFilter !== "all") params.set("zip", postalFilter);
    if (connectedOnly) params.set("connected", "1");
    if (directorySearch.trim()) params.set("q", directorySearch.trim());
    writeHashParams(params);
  }, [statusFilters, denominationFilters, districtFilters, postalFilter, connectedOnly, directorySearch]);

  const openOrgDetail = useCallback(async (orgId) => {
    setSelectedOrgId(orgId); setOrgDetail(null); setOrgDetailError(""); setOrgDetailLoading(true);
    try {
      const data = await callRpc("ci_get_organization_profile", { p_organization_id: orgId, p_requested_purpose: purpose }, "Church Intelligence organization detail");
      setOrgDetail(data);
    } catch (err) { setOrgDetailError(err?.message || "Could not load this organization."); }
    finally { setOrgDetailLoading(false); }
  }, [callRpc, purpose]);

  const checkMatch = async (orgId) => {
    setMatchLoadingId(orgId);
    try {
      const data = await callRpc("ci_suggest_faithbid_matches", { p_organization_id: orgId, p_limit: 5 }, "FaithBid match suggestions");
      setMatchResults(prev => ({ ...prev, [orgId]: Array.isArray(data) ? data : [] }));
    } catch (err) { notify("error", err?.message || "Could not check for FaithBid matches."); }
    finally { setMatchLoadingId(null); }
  };

  const linkMatch = async (orgId, profileId) => {
    setBusy(true);
    try {
      const reviewId = await callRpc("ci_open_review_case", {
        p_case_type: "correction", p_severity: "low", p_organization_id: orgId, p_campus_id: null, p_site_id: null,
        p_payload: { action: "faithbid_profile_link", faithbid_profile_id: profileId },
        p_reason: "Human review of a FaithBid account match suggestion",
      }, "Open FaithBid link review");
      await callRpc("ci_set_system_link", { p_organization_id: orgId, p_system_key: "faithbid_profile", p_profile_id: profileId, p_growth_id: null, p_concierge_id: null, p_gpi_id: null, p_status: "active", p_evidence_id: null, p_review_id: reviewId, p_reason: "Human-confirmed from Church Intelligence directory match suggestion" }, "Link FaithBid account");
      await callRpc("ci_resolve_review_case", { p_review_id: reviewId, p_status: "resolved", p_resolution: { action: "faithbid_profile_link", faithbid_profile_id: profileId }, p_reason: "FaithBid account link confirmed by platform admin" }, "Resolve FaithBid link review");
      notify("success", "Linked to FaithBid account."); setMatchResults(prev => ({ ...prev, [orgId]: undefined })); await refreshDirectory();
    } catch (err) { notify("error", err?.message || "Could not link this FaithBid account."); }
    finally { setBusy(false); }
  };

  const online = !directoryLoading && !directoryError;
  const directoryStats = useMemo(() => {
    const ready = directory.filter(row => row.is_ready).length;
    return {
      ready,
      missing: directory.length - ready,
      connected: directory.filter(row => row.linked_to_faithbid).length,
    };
  }, [directory]);

  const resolveReview = async (review, status) => {
    const reason = window.prompt(status === "resolved" ? "What evidence or decision resolves this case?" : "Why should this case be dismissed?");
    if (!reason?.trim()) return;
    setBusy(true);
    try {
      await callRpc("ci_resolve_review_case", { p_review_id: review.id, p_status: status, p_resolution: { decision: status, note: reason.trim() }, p_reason: reason.trim() }, "Resolve Church Intelligence review");
      notify("success", `Review ${status}.`); await Promise.all([refreshReviews(), refreshDirectory(), refreshHealth()]);
    } catch (err) { notify("error", err?.message || "Could not update this review."); }
    finally { setBusy(false); }
  };

  const reviewSignal = async (signal, status) => {
    const reason = window.prompt(status === "dismissed" ? "Why is this not actionable?" : "What did you verify on the church website?");
    if (!reason?.trim()) return;
    setBusy(true);
    try {
      await callRpc("ci_review_operational_signal", { p_signal_id: signal.id, p_status: status, p_reason: reason.trim() }, "Review church website signal");
      notify("success", status === "dismissed" ? "Signal dismissed." : "Signal confirmed as reviewed."); await Promise.all([refreshSignals(), refreshHealth()]);
    } catch (err) { notify("error", err?.message || "Could not update this signal."); }
    finally { setBusy(false); }
  };
  const deferredSearch = useDeferredValue(directorySearch.trim().toLowerCase());
  const denominations = useMemo(() => [...new Set(directory.map(row => row.denomination).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [directory]);
  const postalCodes = useMemo(() => [...new Set(directory.map(row => row.postal_code?.slice(0, 5)).filter(Boolean))].sort(), [directory]);
  const councilDistricts = useMemo(() => Array.from({ length: 14 }, (_, index) => String(index + 1)), []);

  const matchesSearchFn = useCallback((row) => !deferredSearch || [row.canonical_name, row.address_line_1, row.postal_code, row.locality]
    .filter(Boolean).some(value => value.toLowerCase().includes(deferredSearch)), [deferredSearch]);
  const matchesZipFn = useCallback((row) => postalFilter === "all" || row.postal_code?.startsWith(postalFilter), [postalFilter]);
  const matchesDistrictFn = useCallback((row) => !districtFilters.length || districtFilters.includes(String(row.council_district || "")), [districtFilters]);
  const matchesConnectedFn = useCallback((row) => !connectedOnly || row.linked_to_faithbid, [connectedOnly]);

  const filteredDirectory = useMemo(() => directory.filter(row => {
    const matchesDenomination = !denominationFilters.length || denominationFilters.includes(row.denomination);
    const matchesStatus = !statusFilters.length || statusFilters.includes(churchStatus(row));
    return matchesSearchFn(row) && matchesDenomination && matchesDistrictFn(row) && matchesZipFn(row) && matchesConnectedFn(row) && matchesStatus;
  }), [directory, denominationFilters, statusFilters, matchesSearchFn, matchesDistrictFn, matchesZipFn, matchesConnectedFn]);

  // Faceted counts: how many results each option would add given every
  // OTHER active filter (but not itself). The paginated loader collects the
  // complete directory before these client-side counts are calculated.
  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(STATUS_ORDER.map(key => [key, 0]));
    for (const row of directory) {
      if (!matchesSearchFn(row) || !matchesDistrictFn(row) || !matchesZipFn(row) || !matchesConnectedFn(row)) continue;
      if (denominationFilters.length && !denominationFilters.includes(row.denomination)) continue;
      counts[churchStatus(row)] = (counts[churchStatus(row)] || 0) + 1;
    }
    return counts;
  }, [directory, denominationFilters, matchesSearchFn, matchesDistrictFn, matchesZipFn, matchesConnectedFn]);
  const denominationCounts = useMemo(() => {
    const counts = {};
    for (const row of directory) {
      if (!row.denomination) continue;
      if (!matchesSearchFn(row) || !matchesDistrictFn(row) || !matchesZipFn(row) || !matchesConnectedFn(row)) continue;
      if (statusFilters.length && !statusFilters.includes(churchStatus(row))) continue;
      counts[row.denomination] = (counts[row.denomination] || 0) + 1;
    }
    return counts;
  }, [directory, statusFilters, matchesSearchFn, matchesDistrictFn, matchesZipFn, matchesConnectedFn]);
  const districtCounts = useMemo(() => {
    const counts = Object.fromEntries(councilDistricts.map(value => [value, 0]));
    for (const row of directory) {
      if (!matchesSearchFn(row) || !matchesZipFn(row) || !matchesConnectedFn(row)) continue;
      if (denominationFilters.length && !denominationFilters.includes(row.denomination)) continue;
      if (statusFilters.length && !statusFilters.includes(churchStatus(row))) continue;
      const district = String(row.council_district || "");
      if (district) counts[district] = (counts[district] || 0) + 1;
    }
    return counts;
  }, [councilDistricts, directory, denominationFilters, statusFilters, matchesSearchFn, matchesZipFn, matchesConnectedFn]);

  const toggleStatusFilter = (key) => setStatusFilters(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  const toggleDenominationFilter = (value) => setDenominationFilters(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  const toggleDistrictFilter = (value) => setDistrictFilters(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  const applySavedView = (view) => {
    const result = view.apply();
    if ("statuses" in result) setStatusFilters(result.statuses);
    if ("connectedOnly" in result) setConnectedOnly(result.connectedOnly);
  };

  const hasActiveFilters = directorySearch || statusFilters.length || denominationFilters.length || districtFilters.length || postalFilter !== "all" || connectedOnly;
  const clearDirectoryFilters = () => {
    setDirectorySearch("");
    setStatusFilters([]);
    setDenominationFilters([]);
    setDistrictFilters([]);
    setPostalFilter("all");
    setConnectedOnly(false);
  };

  if (!isAdmin) return <div className="ci-denied"><p className="ci-eyebrow">Internal workspace</p><h1>Church Intelligence is restricted.</h1><p>This research workspace is available only to FaithBid platform administrators.</p><button type="button" onClick={() => nav?.("projects")}>Back to marketplace</button></div>;

  return <section className="ci-shell" aria-label="Church Intelligence">
    <header className="ci-hero">
      <div><p className="ci-eyebrow">FaithBid internal · Dallas</p><h1>Dallas Churches</h1><p>Find any church FaithBid has loaded, understand what we know, and connect it to an existing FaithBid account.</p></div>
      <div className="ci-actions"><span className={online ? "live" : ""}>{directoryLoading ? "Loading churches" : online ? "Directory ready" : "Directory needs attention"}</span><button type="button" onClick={() => setShowNewOrgModal(true)}>+ Add church</button><button type="button" className="ci-btn-secondary" onClick={refreshAll} disabled={directoryLoading}>{directoryLoading ? "Loading…" : "Refresh"}</button></div>
    </header>

    <Banner banner={banner} onDismiss={() => setBanner(null)} />

    <nav className="ci-tabs" aria-label="Church Intelligence workspace">
      {[['directory','Directory'],['reviews',`Review Queue${reviews.filter(item => ['open','in_progress'].includes(item.status)).length ? ` (${reviews.filter(item => ['open','in_progress'].includes(item.status)).length})` : ''}`],['signals',`Website Signals${signals.filter(item => item.status === 'new').length ? ` (${signals.filter(item => item.status === 'new').length})` : ''}`],['health','Coverage & Health']].map(([key,label]) =>
        <button key={key} type="button" className={workspaceTab === key ? "active" : ""} aria-pressed={workspaceTab === key} onClick={() => { setWorkspaceTab(key); setSelectedOrgId(null); }}>{label}</button>
      )}
    </nav>

    <section className="ci-coverage" aria-label="Dallas church coverage">
      <div><span>Loaded in FaithBid</span><strong>{directoryLoading ? "—" : directory.length.toLocaleString()}</strong></div>
      <div><span>Basics complete</span><strong>{directoryLoading ? "—" : directoryStats.ready.toLocaleString()}</strong></div>
      <div><span>Connected accounts</span><strong>{directoryLoading ? "—" : directoryStats.connected.toLocaleString()}</strong></div>
      <p><strong>As of:</strong> {directoryRefreshedAt ? new Date(directoryRefreshedAt).toLocaleString() : directoryLoading ? "Loading…" : "Unavailable"}. Readiness requires an address, denomination, confirmed Dallas inclusion, and no open review.</p>
    </section>

    {workspaceTab === "reviews" ? <ReviewQueue reviews={reviews} loading={reviewsLoading} busy={busy} onResolve={resolveReview} />
      : workspaceTab === "signals" ? <SignalsInbox signals={signals} loading={signalsLoading} busy={busy} onReview={reviewSignal} />
      : workspaceTab === "health" ? <HealthPanel health={health} directory={directory} />
      : <div className="ci-panel ci-directory-panel">
      {selectedOrgId ? (
          <OrgDetail
            overviewRow={directory.find(d => d.id === selectedOrgId)}
            detail={orgDetail}
            loading={orgDetailLoading}
            error={orgDetailError}
            onBack={() => { setSelectedOrgId(null); setOrgDetail(null); }}
            matchResults={matchResults[selectedOrgId]}
            matchLoading={matchLoadingId === selectedOrgId}
            busy={busy}
            onCheckMatch={() => checkMatch(selectedOrgId)}
            onLinkMatch={(profileId) => linkMatch(selectedOrgId, profileId)}
          />
      ) : (
          <>
            <div className="ci-directory-command">
              <div>
                <p className="ci-eyebrow">Church directory</p>
                <h2>Find a Dallas church</h2>
                <p>Search the records already loaded into FaithBid. Open a church to see its details and account connection.</p>
              </div>
              <div className="ci-view-switch" aria-label="Directory view">
                <button type="button" className={view === "list" ? "active" : ""} aria-pressed={view === "list"} onClick={() => setView("list")}>List</button>
                <button type="button" className={view === "map" ? "active" : ""} aria-pressed={view === "map"} onClick={() => setView("map")}>Map</button>
              </div>
            </div>

            <div className="ci-search-wrap">
              <span aria-hidden="true">⌕</span>
              <input className="ci-search" type="search" aria-label="Search Dallas churches" placeholder="Search by church name, street, city, or ZIP code" value={directorySearch} onChange={e => setDirectorySearch(e.target.value)} />
              {directorySearch && <button type="button" onClick={() => setDirectorySearch("")} aria-label="Clear search">×</button>}
            </div>

            <div className="ci-saved-views" aria-label="Saved views">
              {SAVED_VIEWS.map(v => <button key={v.key} type="button" className="ci-saved-view-btn" onClick={() => applySavedView(v)}>{v.label}</button>)}
            </div>

            <div className="ci-quick-filters" aria-label="Status filters (select any number)">
              {STATUS_ORDER.map(key => <button key={key} type="button" className={statusFilters.includes(key) ? "active" : ""} aria-pressed={statusFilters.includes(key)} onClick={() => toggleStatusFilter(key)} style={statusFilters.includes(key) ? { background: STATUS_META[key].color, borderColor: STATUS_META[key].color } : undefined}>
                {STATUS_META[key].label}{!directoryLoading ? ` · ${statusCounts[key] || 0}` : ""}
              </button>)}
              <button type="button" className={connectedOnly ? "active" : ""} aria-pressed={connectedOnly} onClick={() => setConnectedOnly(v => !v)}>On FaithBid{!directoryLoading ? ` · ${directoryStats.connected}` : ""}</button>
            </div>

            <div className="ci-directory-toolbar">
              <p aria-live="polite"><strong>{filteredDirectory.length}</strong> {filteredDirectory.length === 1 ? "church" : "churches"} shown</p>
              <div>
                <details className="ci-multiselect">
                  <summary>Council district{districtFilters.length ? ` (${districtFilters.length})` : ""}</summary>
                  <div className="ci-multiselect-panel">
                    {councilDistricts.map(value => <label key={value}><input type="checkbox" checked={districtFilters.includes(value)} onChange={() => toggleDistrictFilter(value)} />District {value} <span>· {districtCounts[value] || 0}</span></label>)}
                  </div>
                </details>
                <details className="ci-multiselect">
                  <summary>Denomination{denominationFilters.length ? ` (${denominationFilters.length})` : ""}</summary>
                  <div className="ci-multiselect-panel">
                    {denominations.map(value => <label key={value}><input type="checkbox" checked={denominationFilters.includes(value)} onChange={() => toggleDenominationFilter(value)} />{value} <span>· {denominationCounts[value] || 0}</span></label>)}
                  </div>
                </details>
                <label><span>Precise ZIP</span><select aria-label="Filter by ZIP code" value={postalFilter} onChange={event => setPostalFilter(event.target.value)}><option value="all">All ZIP codes</option>{postalCodes.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
                {hasActiveFilters && <button type="button" className="ci-clear-filters" onClick={clearDirectoryFilters}>Reset all</button>}
              </div>
            </div>
            {directoryLoading ? <div className="ci-loading" role="status">Loading Dallas churches…</div>
              : directoryError ? <div className="ci-alert" role="alert"><div><strong>Church Intelligence could not load.</strong><span>{directoryError}</span></div><button type="button" onClick={refreshDirectory}>Try again</button></div>
              : view === "map" ? <>
                  <div className="ci-map-summary">
                    <span><strong>{filteredDirectory.filter(row => row.latitude != null && row.longitude != null).length}</strong> of {filteredDirectory.length} matching churches shown on the map.</span>
                    <button type="button" className={`ci-density-toggle${showDensity ? " active" : ""}`} aria-pressed={showDensity} onClick={() => setShowDensity(v => !v)}>Density view</button>
                  </div>
                  <DallasMap rows={filteredDirectory} onSelect={(orgId) => { setView("list"); void openOrgDetail(orgId); }} boundary={boundaryGeojson} districts={districtGeojson} activeDistricts={districtFilters} onDistrictToggle={toggleDistrictFilter} showDensity={showDensity} />
                </>
              : directory.length ? filteredDirectory.length ? <div className="ci-church-list">{filteredDirectory.map(row => {
                const status = churchStatus(row);
                return <article className="ci-church-row" key={row.id}>
                  <button type="button" className="ci-church-main" onClick={() => openOrgDetail(row.id)}>
                    <span className="ci-church-mark" aria-hidden="true" style={{ background: STATUS_META[status].color }}>{(row.canonical_name || "C").trim().charAt(0).toUpperCase()}</span>
                    <span className="ci-church-copy"><strong>{row.canonical_name || "Unnamed church"}</strong><span>{row.address_line_1 ? `${row.address_line_1} · ${row.locality}, ${row.region_code} ${row.postal_code || ""}` : "Address not recorded"}</span></span>
                    <span className="ci-church-denomination">{row.denomination || "Denomination not recorded"}{row.council_district ? ` · District ${row.council_district}` : ""}</span>
                  </button>
                  <div className="ci-church-actions">
                    <Badge tone={status === "verified" ? "good" : status === "candidate" ? "neutral" : "warn"}>{STATUS_META[status].label}</Badge>
                    {row.linked_to_faithbid && <Badge tone="neutral">On FaithBid</Badge>}
                    <button type="button" className="ci-link-btn" onClick={() => openOrgDetail(row.id)} aria-label={`View ${row.canonical_name || "church"}`}>Open →</button>
                  </div>
                </article>})}</div> : <Empty eyebrow="No matches" title="No churches match that search." detail="Reset the filters or try another church name, street, city, or ZIP code." />
              : <Empty eyebrow="Dallas church directory" title="No churches have been added yet." detail="Add the first church to begin building the Dallas list." />}
          </>
      )}

    </div>}

    {showNewOrgModal && <NewOrgModal sources={sources} directory={directory} busy={busy} onClose={() => setShowNewOrgModal(false)} onSubmit={async (bundle, reason) => {
      setBusy(true);
      try { await callRpc("ci_create_research_bundle", { p_bundle: bundle, p_reason: reason }, "Create research bundle");
        notify("success", "Church added to the Dallas directory."); setShowNewOrgModal(false); await refreshDirectory();
      } catch (err) { notify("error", err?.message || "Could not add this church."); }
      finally { setBusy(false); }
    }} />}
  </section>;
}

function ReviewQueue({ reviews, loading, busy, onResolve }) {
  const active = reviews.filter(item => ["open", "in_progress"].includes(item.status));
  const closed = reviews.filter(item => !["open", "in_progress"].includes(item.status));
  return <section className="ci-panel">
    <div className="ci-panel-head"><div><p className="ci-eyebrow">Human decisions</p><h2>Review Queue</h2><p className="ci-panel-intro">Resolve boundary questions, evidence conflicts, corrections, and other cases before records are treated as ready.</p></div><span>{active.length} open</span></div>
    {loading ? <div className="ci-loading">Loading review cases…</div> : active.length ? <div className="ci-review-list">{active.map(item => <article className="ci-review-card" key={item.id}>
      <div><div className="ci-chip-row"><Badge tone={item.severity === "high" || item.severity === "critical" ? "danger" : "warn"}>{item.severity}</Badge><Badge>{item.case_type.replace(/_/g, " ")}</Badge></div><h3>{item.subject_organization_name || "Record-level review"}</h3><p>{item.case_payload?.reason || item.case_payload?.note || "Open the supporting record and document the decision."}</p><small>Opened {new Date(item.created_at).toLocaleString()}</small></div>
      <div className="ci-review-actions"><button type="button" disabled={busy} onClick={() => onResolve(item, "resolved")}>Resolve</button><button type="button" className="ci-btn-secondary" disabled={busy} onClick={() => onResolve(item, "dismissed")}>Dismiss</button></div>
    </article>)}</div> : <Empty eyebrow="Review queue" title="No open cases." detail="All current Church Intelligence review cases have a documented decision." />}
    {!!closed.length && <details className="ci-history"><summary>Closed history ({closed.length})</summary><div className="ci-review-list compact">{closed.map(item => <article className="ci-review-card" key={item.id}><div><Badge tone="muted">{item.status}</Badge><h3>{item.subject_organization_name || item.case_type.replace(/_/g, " ")}</h3><p>{item.resolution?.note || item.resolution?.reason || "Decision recorded."}</p></div></article>)}</div></details>}
  </section>;
}

function SignalsInbox({ signals, loading, busy, onReview }) {
  const active = signals.filter(item => item.status === "new");
  return <section className="ci-panel">
    <div className="ci-panel-head"><div><p className="ci-eyebrow">First-party church websites</p><h2>Website Signals</h2><p className="ci-panel-intro">Weekly hints about jobs, renovations, capital campaigns, campuses, relocations, and physical projects. These are not canonical facts until a person confirms them.</p></div><span>{active.length} new</span></div>
    <div className="ci-signal-safety"><strong>Human review required.</strong> Leadership posts, events, sermons, and general news are excluded. Nothing is sent to Growth Engine automatically.</div>
    {loading ? <div className="ci-loading">Loading website signals…</div> : signals.length ? <div className="ci-signal-grid">{signals.map(signal => <article className="ci-signal-card" key={signal.id}>
      <div className="ci-chip-row"><Badge tone={signal.status === "new" ? "warn" : signal.status === "dismissed" ? "muted" : "good"}>{signal.status}</Badge><Badge>{signal.signal_type.replace(/_/g, " ")}</Badge><span className="ci-confidence">{Math.round(Number(signal.confidence_score) * 100)}% confidence</span></div>
      <h3>{signal.title}</h3><strong>{signal.canonical_name}</strong><p>{signal.summary}</p><blockquote>“{signal.evidence_quote}”</blockquote>
      <div className="ci-signal-footer"><a href={signal.source_url} target="_blank" rel="noreferrer">Verify on church website ↗</a><span>Detected {new Date(signal.detected_at).toLocaleDateString()}</span></div>
      {signal.status === "new" && <div className="ci-review-actions"><button type="button" disabled={busy} onClick={() => onReview(signal, "reviewed")}>Confirm reviewed</button><button type="button" className="ci-btn-secondary" disabled={busy} onClick={() => onReview(signal, "dismissed")}>Dismiss</button></div>}
      {signal.review_reason && <small className="ci-decision-note">Decision: {signal.review_reason}</small>}
    </article>)}</div> : <Empty eyebrow="Website signal monitor" title="No signals have been detected yet." detail="The weekly monitor will place only source-linked, AI-classified hints here for human confirmation." />}
  </section>;
}

function HealthPanel({ health, directory }) {
  const values = [
    ["Organizations", health?.organizations ?? directory.length, "Canonical church records"],
    ["Websites", health?.canonical_websites ?? "—", "Eligible first-party sites"],
    ["Two-source", health?.two_source_organizations ?? "—", "Genuinely independent corroboration"],
    ["Single-source", health?.single_source_organizations ?? "—", "Must close or be deliberately accepted"],
    ["Open reviews", health?.open_reviews ?? "—", "Human decisions outstanding"],
    ["New signals", health?.new_signals ?? "—", "Website hints awaiting review"],
  ];
  return <section className="ci-panel"><div className="ci-panel-head"><div><p className="ci-eyebrow">Coverage controls</p><h2>Coverage & Health</h2><p className="ci-panel-intro">This is the honest operating picture—loaded records, independent evidence, review debt, and monitor freshness.</p></div><span>{health?.as_of ? `As of ${new Date(health.as_of).toLocaleString()}` : "Loading"}</span></div>
    <div className="ci-coverage-grid">{values.map(([label,value,detail]) => <article key={label}><strong>{typeof value === "number" ? value.toLocaleString() : value}</strong><span>{label} · {detail}</span></article>)}</div>
    <div className="ci-health-grid"><article className="ci-health"><span className="good">Evidence gate</span><h3>{health?.single_source_pending ? "Partially cleared" : "Cleared"}</h3><p>{health?.two_source_organizations ?? 0} records have at least two independent source families; {health?.single_source_organizations ?? 0} remain visibly single-source ({health?.single_source_accepted ?? 0} deliberately accepted, {health?.single_source_pending ?? health?.single_source_organizations ?? 0} pending).</p></article><article className="ci-health"><span className="paused">Acquisition gate</span><h3>{health?.single_source_pending ? "Large batch held" : "Controlled batch allowed"}</h3><p>{health?.single_source_pending ? "The 1,922-candidate expansion remains blocked until the pending single-source records are closed or deliberately accepted." : "Only a measured, reviewed batch is allowed; this is not approval for an uncontrolled full import."}</p></article><article className="ci-health"><span className="good">Website monitor</span><h3>{health?.last_website_scan ? "Running" : "Ready for first run"}</h3><p>{health?.last_website_scan ? `Last scan ${new Date(health.last_website_scan).toLocaleString()}` : "No website scan has been recorded yet."}</p></article></div>
  </section>;
}

function formatClaimValue(value) {
  if (value == null) return "Not recorded";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(formatClaimValue).join(", ");
  return Object.values(value).every(v => ["string", "number", "boolean"].includes(typeof v))
    ? Object.values(value).join(" · ")
    : JSON.stringify(value);
}

function OrgDetail({ detail, overviewRow, loading, error, onBack, matchResults, matchLoading, busy, onCheckMatch, onLinkMatch }) {
  const [pendingMatch, setPendingMatch] = useState(null);
  const currentClaims = detail?.claims?.filter(claim => claim.claim_status !== "rejected" && claim.claim_status !== "superseded") || [];
  const churchName = detail?.organization?.canonical_name || overviewRow?.canonical_name || "Church";
  return <>
    <button type="button" className="ci-detail-back" onClick={onBack}>← All Dallas churches</button>
    <div className="ci-detail-heading"><div className="ci-church-mark" aria-hidden="true">{churchName.trim().charAt(0).toUpperCase()}</div><div><p className="ci-eyebrow">Church profile</p><h2>{churchName}</h2><p>{overviewRow?.address_line_1 ? `${overviewRow.address_line_1}, ${overviewRow.locality}, ${overviewRow.region_code} ${overviewRow.postal_code || ""}` : "Address not recorded"}</p></div></div>
    {loading ? <div className="ci-loading" role="status">Loading church profile…</div>
      : error ? <div className="ci-alert" role="alert"><div><strong>Could not load this church.</strong><span>{error}</span></div></div>
      : !detail ? null : <div className="ci-church360">
        <div className="ci-detail-grid">
          <section className="ci-profile-card">
            <p className="ci-eyebrow">At a glance</p>
            <div className="ci-profile-row"><span>Address</span><strong>{overviewRow?.address_line_1 ? `${overviewRow.address_line_1}, ${overviewRow.locality}, ${overviewRow.region_code} ${overviewRow.postal_code || ""}` : "Not recorded"}</strong></div>
            <div className="ci-profile-row"><span>Denomination</span><strong>{overviewRow?.denomination || "Not recorded"}</strong></div>
            <div className="ci-profile-row"><span>Status</span><strong>{String(detail.organization?.operating_state || overviewRow?.operating_state || "Unknown").replace(/^./, value => value.toUpperCase())}</strong></div>
            <div className="ci-profile-row"><span>Dallas membership</span><strong>{overviewRow?.dallas_membership || "Not evaluated"}{overviewRow?.council_district ? ` · District ${overviewRow.council_district}` : ""}</strong></div>
            <div className="ci-profile-row"><span>Independent sources</span><strong>{detail.evidence_summary?.independent_source_families ?? overviewRow?.evidence_family_count ?? 0}</strong></div>
            <div className="ci-profile-row"><span>Evidence observed</span><strong>{detail.evidence_summary?.last_observed_at ? new Date(detail.evidence_summary.last_observed_at).toLocaleDateString() : "Not recorded"}</strong></div>
          </section>
          <section className="ci-account-card">
            <div><p className="ci-eyebrow">FaithBid account</p><h3>{overviewRow?.linked_to_faithbid ? "Connected" : "Not connected yet"}</h3><p>{overviewRow?.linked_to_faithbid ? "This research record is already linked to a FaithBid church account." : "Check for an existing church account before creating or linking anything manually."}</p></div>
            {overviewRow?.linked_to_faithbid ? <Badge tone="good">On FaithBid</Badge> : <button type="button" disabled={matchLoading} onClick={onCheckMatch}>{matchLoading ? "Checking…" : "Find matching account"}</button>}
          </section>
        </div>

        {matchResults !== undefined && !overviewRow?.linked_to_faithbid && <section className="ci-match-panel"><h3>Possible FaithBid accounts</h3>{matchResults.length ? matchResults.map(match => <div key={match.profile_id} className="ci-match-row"><div><strong>{match.org_name || "Unnamed account"}</strong><span className="ci-addr-sub">{match.city}, {match.state_code}{match.denomination ? ` · ${match.denomination}` : ""} · {Math.round(match.name_similarity * 100)}% name match{match.city_match ? " · same city" : ""}</span></div><button type="button" disabled={busy} onClick={() => setPendingMatch(match)}>Compare & confirm</button></div>) : <p className="ci-muted">No likely FaithBid account was found. Nothing was changed.</p>}</section>}

        {detail.campuses?.length > 1 && <>
          <h3>Campuses</h3>
          <div className="ci-table-wrap"><table className="ci-table"><thead><tr><th>Campus</th><th>Primary</th></tr></thead><tbody>{detail.campuses.map(c => <tr key={c.id}><td>{c.campus_name}</td><td>{c.is_primary ? "Yes" : "No"}</td></tr>)}</tbody></table></div>
        </>}

        <h3>Sites & boundary membership</h3>
        {detail.campuses?.some(campus => campus.sites?.length) ? <div className="ci-site-list">{detail.campuses.flatMap(campus => (campus.sites || []).map(site => <article key={site.id}><strong>{campus.campus_name}</strong><p>{site.address_line_1}, {site.locality}, {site.region_code} {site.postal_code || ""}</p><div className="ci-chip-row">{(site.memberships || []).map((membership, index) => <Badge key={`${membership.boundary_scope}-${index}`} tone={membership.membership_result === "included" ? "good" : "warn"}>{membership.boundary_scope === "district" ? `District ${membership.council_district}` : `Dallas ${membership.membership_result}`}</Badge>)}</div></article>))}</div> : <p className="ci-muted">No current site is recorded.</p>}

        <h3>Evidence & provenance</h3>
        {currentClaims.length ? <div className="ci-evidence-list">{currentClaims.map(claim => <article key={claim.id}><div><span>{claim.attribute_key.replace(/[_.]/g, " ")}</span><Badge tone={claim.claim_status === "promoted" ? "good" : "neutral"}>{claim.claim_status}</Badge></div><strong>{formatClaimValue(claim.asserted_value)}</strong><p>{claim.source?.display_name || "Source not named"}{claim.source?.authority_class ? ` · ${claim.source.authority_class}` : ""} · observed {new Date(claim.observed_at).toLocaleDateString()}{claim.source?.retrieved_at ? ` · retrieved ${new Date(claim.source.retrieved_at).toLocaleDateString()}` : ""}</p>{claim.source?.source_url && <a href={claim.source.source_url} target="_blank" rel="noreferrer">Open source ↗</a>}</article>)}</div> : <p className="ci-muted">No additional information is on file yet.</p>}

        <h3>Review history</h3>
        {detail.reviews?.length ? <div className="ci-review-history">{detail.reviews.map(review => <article key={review.id}><Badge tone={review.status === "resolved" ? "good" : review.status === "dismissed" ? "muted" : "warn"}>{review.status}</Badge><strong>{review.case_type.replace(/_/g, " ")}</strong><span>{new Date(review.created_at).toLocaleDateString()}</span></article>)}</div> : <p className="ci-muted">No review cases have been recorded.</p>}
      </div>}
    {pendingMatch && <Modal title="Confirm the account link" subtitle="Compare both records. This creates an audited Church Intelligence link only after you confirm." onClose={() => setPendingMatch(null)}>
      <div className="ci-compare-grid"><article><p className="ci-eyebrow">Church Intelligence</p><h4>{churchName}</h4><p>{overviewRow?.address_line_1}, {overviewRow?.locality}, {overviewRow?.region_code} {overviewRow?.postal_code || ""}</p><p>{overviewRow?.denomination || "Denomination not recorded"}</p></article><article><p className="ci-eyebrow">FaithBid account</p><h4>{pendingMatch.org_name || "Unnamed account"}</h4><p>{pendingMatch.city}, {pendingMatch.state_code}</p><p>{pendingMatch.denomination || "Denomination not recorded"}</p></article></div>
      <p className="ci-confirm-note">Name similarity: {Math.round(pendingMatch.name_similarity * 100)}%. Confirm only if these describe the same church organization.</p>
      <div className="ci-modal-actions"><button type="button" className="ci-btn-secondary" onClick={() => setPendingMatch(null)}>Cancel</button><button type="button" disabled={busy} onClick={async () => { await onLinkMatch(pendingMatch.profile_id); setPendingMatch(null); }}>{busy ? "Linking…" : "Confirm link"}</button></div>
    </Modal>}
  </>;
}

// Custom lightweight clustering, no new dependency. Groups markers within a
// fixed pixel radius at the current zoom, in screen space (via
// latLngToContainerPoint), and rebuilds on moveend/zoomend. This is the
// deliberate alternative to leaflet.markercluster: more code, zero new
// package and zero new entry in the dependency-audit gate -- see the
// roadmap doc for the tradeoff stated plainly.
const CLUSTER_PIXEL_RADIUS = 36;

function clusterPoints(L, map, rows) {
  const withPixels = rows
    .filter(row => row.latitude != null && row.longitude != null)
    .map(row => ({ row, pt: map.latLngToContainerPoint([row.latitude, row.longitude]) }));
  const clusters = [];
  const used = new Array(withPixels.length).fill(false);
  for (let i = 0; i < withPixels.length; i++) {
    if (used[i]) continue;
    const group = [withPixels[i]];
    used[i] = true;
    for (let j = i + 1; j < withPixels.length; j++) {
      if (used[j]) continue;
      const dx = withPixels[i].pt.x - withPixels[j].pt.x;
      const dy = withPixels[i].pt.y - withPixels[j].pt.y;
      if (Math.sqrt(dx * dx + dy * dy) <= CLUSTER_PIXEL_RADIUS) { group.push(withPixels[j]); used[j] = true; }
    }
    clusters.push(group);
  }
  return clusters;
}

// Density view: a coarse lat/lng grid of how many *loaded* records fall in
// each cell. Deliberately not called a "gap" view -- there is no real
// candidate baseline to compare against yet (the fake 1,962 number that
// would have made that possible was removed in Pass 1). ~0.01 degrees is
// roughly 1km at this latitude.
const DENSITY_CELL_DEGREES = 0.01;

function densityCells(rows) {
  const grid = new Map();
  for (const row of rows) {
    if (row.latitude == null || row.longitude == null) continue;
    const cellLat = Math.floor(row.latitude / DENSITY_CELL_DEGREES) * DENSITY_CELL_DEGREES;
    const cellLng = Math.floor(row.longitude / DENSITY_CELL_DEGREES) * DENSITY_CELL_DEGREES;
    const key = `${cellLat.toFixed(4)},${cellLng.toFixed(4)}`;
    grid.set(key, (grid.get(key) || 0) + 1);
  }
  return [...grid.entries()].map(([key, count]) => {
    const [lat, lng] = key.split(",").map(Number);
    return { lat, lng, count };
  });
}

function DallasMap({ rows, onSelect, boundary, districts, activeDistricts, onDistrictToggle, showDensity }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const boundaryLayerRef = useRef(null);
  const districtLayerRef = useRef(null);
  const leafletRef = useRef(null);
  const [mapError, setMapError] = useState("");
  const [mapReady, setMapReady] = useState(false);

  const render = useCallback(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !layerRef.current) return;
    layerRef.current.clearLayers();
    const validRows = rows.filter(r => r.latitude != null && r.longitude != null);

    if (showDensity) {
      const maxCount = Math.max(1, ...densityCells(validRows).map(c => c.count));
      for (const cell of densityCells(validRows)) {
        const bounds = [[cell.lat, cell.lng], [cell.lat + DENSITY_CELL_DEGREES, cell.lng + DENSITY_CELL_DEGREES]];
        L.rectangle(bounds, { color: "#17352b", weight: 0, fillOpacity: 0.15 + 0.55 * (cell.count / maxCount), fillColor: "#17352b" }).addTo(layerRef.current);
      }
      return;
    }

    for (const group of clusterPoints(L, map, validRows)) {
      if (group.length === 1) {
        const row = group[0].row;
        const status = churchStatus(row);
        const color = STATUS_META[status].color;
        const marker = L.circleMarker([row.latitude, row.longitude], { radius: 7, color, fillColor: color, fillOpacity: 0.85, weight: 1.5 });
        const tooltip = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = row.canonical_name || "Unnamed organization";
        tooltip.append(title);
        if (row.address_line_1) tooltip.append(document.createElement("br"), document.createTextNode(row.address_line_1));
        tooltip.append(document.createElement("br"), document.createTextNode(STATUS_META[status].label));
        marker.bindTooltip(tooltip, { direction: "top" });
        marker.on("click", () => onSelect(row.id));
        marker.addTo(layerRef.current);
      } else {
        const avgLat = group.reduce((sum, g) => sum + g.row.latitude, 0) / group.length;
        const avgLng = group.reduce((sum, g) => sum + g.row.longitude, 0) / group.length;
        const marker = L.circleMarker([avgLat, avgLng], { radius: 12 + Math.min(10, group.length), color: "#17352b", fillColor: "#17352b", fillOpacity: 0.85, weight: 2 });
        marker.bindTooltip(`${group.length} churches here — zoom in to see them`, { direction: "top" });
        marker.on("click", () => map.setView([avgLat, avgLng], Math.min(map.getZoom() + 2, 18)));
        marker.addTo(layerRef.current);
      }
    }
  }, [rows, onSelect, showDensity]);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;
      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, { scrollWheelZoom: false }).setView([32.7767, -96.797], 10.5);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapRef.current);
        mapRef.current.createPane("ciDistrictPane");
        mapRef.current.getPane("ciDistrictPane").style.zIndex = "350";
        layerRef.current = L.layerGroup().addTo(mapRef.current);
        mapRef.current.on("moveend zoomend", render);
        setMapReady(true);
      }
      render();
      const validRows = rows.filter(r => r.latitude != null && r.longitude != null);
      const pts = validRows.map(r => [r.latitude, r.longitude]);
      if (pts.length) mapRef.current.fitBounds(pts, { padding: [24, 24], maxZoom: 13 });
    }).catch(() => { if (!cancelled) setMapError("The map could not load. Use the list view to continue reviewing churches."); });
    return () => { cancelled = true; };
  }, [rows, render]);

  // Boundary is fetched once per session and barely ever changes -- its own
  // effect, separate from the rows/clustering effect above, so panning or
  // filtering never re-fetches or re-draws it.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !boundary?.geometry) return;
    if (boundaryLayerRef.current) { map.removeLayer(boundaryLayerRef.current); boundaryLayerRef.current = null; }
    boundaryLayerRef.current = L.geoJSON(boundary.geometry, {
      style: { color: "#8a6729", weight: 2, dashArray: "6 4", fill: false },
      interactive: false,
    }).addTo(map);
    boundaryLayerRef.current.bringToBack();
  }, [boundary, mapReady]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !districts?.geometry) return;
    if (districtLayerRef.current) { map.removeLayer(districtLayerRef.current); districtLayerRef.current = null; }
    districtLayerRef.current = L.geoJSON(districts.geometry, {
      style: feature => {
        const district = String(feature?.properties?.council_district || "");
        const active = activeDistricts.includes(district);
        return { pane: "ciDistrictPane", color: active ? "#1f7a4a" : "#5d6f66", weight: active ? 3 : 1.25, fill: true, fillColor: active ? "#1f7a4a" : "#6f8a7d", fillOpacity: active ? 0.12 : 0.035 };
      },
      onEachFeature: (feature, layer) => {
        const district = String(feature?.properties?.council_district || "");
        layer.bindTooltip(`Council District ${district}`, { direction: "center", sticky: true });
        layer.on("click", () => onDistrictToggle(district));
      },
    }).addTo(map);
    if (boundaryLayerRef.current) boundaryLayerRef.current.bringToBack();
  }, [districts, activeDistricts, onDistrictToggle, mapReady]);

  useEffect(() => () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } }, []);

  return <div className="ci-map-wrap">
    {mapError ? <div className="ci-alert" role="alert"><div><strong>Map unavailable.</strong><span>{mapError}</span></div></div> : null}
    <div ref={containerRef} className="ci-map" />
    <div className="ci-map-legend">
      {showDensity
        ? <span><i style={{ background: "#17352b" }} />More loaded churches in this area</span>
        : STATUS_ORDER.map(key => <span key={key}><i style={{ background: STATUS_META[key].color }} />{STATUS_META[key].label}</span>)}
      {boundary && <span className="ci-map-legend-boundary"><i className="ci-map-legend-line" />City of Dallas boundary</span>}
      {districts && <span className="ci-map-legend-boundary"><i className="ci-map-legend-line" />Click a council district to filter</span>}
    </div>
  </div>;
}

function normalizeChurchName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(word => word && !["the", "of", "a", "an", "church"].includes(word))
    .join(" ")
    .trim();
}

function NewOrgModal({ sources, directory, busy, onClose, onSubmit }) {
  const [name, setName] = useState(""); const [state, setState] = useState("active"); const [campus, setCampus] = useState("");
  const [addr1, setAddr1] = useState(""); const [addr2, setAddr2] = useState(""); const [locality, setLocality] = useState("Dallas"); const [region, setRegion] = useState("TX"); const [postal, setPostal] = useState("");
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState("");
  const source = sources.find(item => item.source_key?.includes("manual")) || sources[0];

  const possibleDuplicates = useMemo(() => {
    const normalizedInput = normalizeChurchName(name);
    if (normalizedInput.length < 4) return [];
    return (directory || []).filter(row => {
      const normalizedExisting = normalizeChurchName(row.canonical_name);
      return normalizedExisting && (normalizedExisting === normalizedInput || normalizedExisting.includes(normalizedInput) || normalizedInput.includes(normalizedExisting));
    }).slice(0, 5);
  }, [name, directory]);

  const canSubmit = name.trim().length >= 2 && addr1.trim() && locality.trim() && region.trim() && source?.id;

  const submit = async () => {
    setSubmitError("");
    if (!canSubmit) { setSubmitError(source?.id ? "Add the church name and address." : "Churches cannot be added until the directory source is available."); return; }
    const normalized = `${addr1.trim()}${addr2.trim() ? ", " + addr2.trim() : ""}, ${locality.trim()}, ${region.trim()}${postal.trim() ? " " + postal.trim() : ""}`;
    const nonce = crypto.randomUUID();
    const contentHash = await sha256Hex(`manual:${name}:${normalized}:${nonce}`);
    const extractionHash = await sha256Hex(`extract:${contentHash}`);
    const bundle = {
      canonical_name: name.trim(), operating_state: state, campus_name: campus.trim() || name.trim(),
      address_line_1: addr1.trim(), address_line_2: addr2.trim() || null, locality: locality.trim(), region_code: region.trim().toUpperCase(), postal_code: postal.trim() || null,
      normalized_address: normalized,
      source_id: source.id, source_external_key: `manual-ui:${nonce}`, source_url: null,
      content_hash: contentHash, extraction_hash: extractionHash, parser_version: "manual-entry-v1",
      retention_mode: "metadata_only", source_license_snapshot: {}, source_metadata: notes.trim() ? { notes: notes.trim() } : {},
      allowed_purposes: ["research"],
    };
    await onSubmit(bundle, "Church added manually from the Dallas church directory");
  };

  return <Modal title="Add a church" subtitle="Add the church's basic information. The system will handle the internal recordkeeping." onClose={onClose} wide>
    <div className="ci-form-grid">
      <Field label="Church name *">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="First Baptist Church of Dallas" />
        {possibleDuplicates.length > 0 && (
          <div className="ci-dup-warning" role="status">
            <strong>Already in the directory?</strong>
            <ul>{possibleDuplicates.map(row => <li key={row.id}>{row.canonical_name}{row.address_line_1 ? ` · ${row.address_line_1}, ${row.locality}` : ""}</li>)}</ul>
            <span>Check these before adding a new record — this may already be loaded.</span>
          </div>
        )}
      </Field>
      <Field label="Status"><select value={state} onChange={e => setState(e.target.value)}>{OPERATING_STATES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></Field>
      <Field label="Campus name" hint="Only needed when this is one campus of a larger church"><input value={campus} onChange={e => setCampus(e.target.value)} /></Field>
      <Field label="Street address *"><input value={addr1} onChange={e => setAddr1(e.target.value)} /></Field>
      <Field label="Address line 2"><input value={addr2} onChange={e => setAddr2(e.target.value)} /></Field>
      <Field label="City *"><input value={locality} onChange={e => setLocality(e.target.value)} /></Field>
      <Field label="State *"><input value={region} onChange={e => setRegion(e.target.value)} maxLength={2} /></Field>
      <Field label="ZIP code"><input value={postal} onChange={e => setPostal(e.target.value)} /></Field>
    </div>
    <Field label="Notes"><textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything useful about this church" /></Field>
    {submitError && <p className="ci-form-error">{submitError}</p>}
    <div className="ci-modal-actions"><button type="button" className="ci-btn-secondary" onClick={onClose}>Cancel</button><button type="button" disabled={busy || !canSubmit} onClick={submit}>{busy ? "Saving…" : "Add church"}</button></div>
  </Modal>;
}
