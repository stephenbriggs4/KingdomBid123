import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { withRequestDeadline } from "./supabaseReliability";
import "leaflet/dist/leaflet.css";
import "./styles/church-intelligence.css";

const TABS = [["organizations","Organizations"],["queue","Research Queue"],["sources","Sources"],["geography","Dallas Geography"],["links","System Links"],["health","Data Health"]];

const PURPOSES = ["research","verification","internal_analytics","outreach","export","redistribution","publication"];
const OPERATING_STATES = ["active","inactive","unknown","review"];
const GEOCODE_PRECISIONS = ["rooftop","parcel","interpolated","street","postal","city","unknown"];
const AUTHORITY_CLASSES = ["official","open_dataset","first_party","directory","commercial","other"];
const ACCESS_METHODS = ["api","bulk_download","public_web","manual","written_permission","other"];
const AUTOMATION_STATUSES = ["approved","manual_only","prohibited","unknown","paused"];
const CASE_TYPES = ["duplicate","boundary","evidence_conflict","correction","merge","split","closure","ai_staged_claim","source_policy"];
const SEVERITIES = ["low","normal","high","critical"];
const CASE_STATUSES = ["open","in_progress","resolved","dismissed"];
const BOUNDARY_SCOPES = ["city","county","metro"];
const SYSTEM_KEYS = ["faithbid_profile","growth_church","concierge_organization","gpi_organization"];
const LINK_STATUSES = ["proposed","active","rejected","superseded"];
const CASE_TYPE_LABELS = {
  boundary: "Might not be inside Dallas city limits",
  duplicate: "Possible duplicate record",
  evidence_conflict: "Conflicting information found",
  correction: "Correction needed",
  merge: "Should be merged with another record",
  split: "Should be split into separate records",
  closure: "Church may have closed",
  ai_staged_claim: "New fact awaiting review",
  source_policy: "Source usage rights need review",
};

async function sha256Hex(input) {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function fmtDate(v) {
  if (!v) return "—";
  try { return new Date(v).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
  catch { return String(v); }
}

function Empty({ eyebrow, title, detail }) {
  return <div className="ci-empty"><span aria-hidden="true">CI</span><div><p className="ci-eyebrow">{eyebrow}</p><h3>{title}</h3><p>{detail}</p></div></div>;
}

function Metric({ label, value, detail, tone = "" }) {
  return <article className={`ci-metric ${tone}`}><span>{label}</span><strong>{value}</strong><p>{detail}</p></article>;
}

function Badge({ children, tone = "neutral" }) {
  return <span className={`ci-badge ci-badge-${tone}`}>{children}</span>;
}

function severityTone(s) { return s === "critical" ? "danger" : s === "high" ? "warn" : s === "normal" ? "neutral" : "muted"; }
function statusTone(s) { return s === "resolved" ? "good" : s === "dismissed" ? "muted" : s === "in_progress" ? "warn" : "neutral"; }
function linkTone(s) { return s === "active" ? "good" : s === "rejected" ? "danger" : s === "superseded" ? "muted" : "warn"; }
function publicationTone(s) { return s === "published" ? "good" : s === "rejected" ? "danger" : s === "superseded" ? "muted" : "warn"; }

function Banner({ banner, onDismiss }) {
  if (!banner) return null;
  return <div className={`ci-banner ci-banner-${banner.type}`}><span>{banner.text}</span><button type="button" onClick={onDismiss} aria-label="Dismiss">×</button></div>;
}

function Modal({ title, subtitle, onClose, children, wide }) {
  return <div className="ci-modal-backdrop" role="dialog" aria-modal="true" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className={`ci-modal${wide ? " wide" : ""}`}>
      <header><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div><button type="button" onClick={onClose} aria-label="Close">×</button></header>
      <div className="ci-modal-body">{children}</div>
    </div>
  </div>;
}

function Field({ label, children, hint }) {
  return <label className="ci-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function PurposeCheckboxes({ value, onChange }) {
  return <div className="ci-chip-row">
    {PURPOSES.map(p => <label key={p} className={`ci-check-chip${value.includes(p) ? " checked" : ""}`}>
      <input type="checkbox" checked={value.includes(p)} onChange={() => onChange(value.includes(p) ? value.filter(v => v !== p) : [...value, p])} />
      {p.replace(/_/g, " ")}
    </label>)}
  </div>;
}

export default function ChurchIntelligence({ currentUser, isAdmin, nav }) {
  const [tab, setTab] = useState("organizations");
  const [banner, setBanner] = useState(null);

  const purpose = "research";
  const [checkedAt, setCheckedAt] = useState(null);

  const [directory, setDirectory] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState("");
  const [directorySearch, setDirectorySearch] = useState("");
  const [matchResults, setMatchResults] = useState({});
  const [matchLoadingId, setMatchLoadingId] = useState(null);
  const [directoryView, setDirectoryView] = useState("list");

  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [orgDetail, setOrgDetail] = useState(null);
  const [orgDetailLoading, setOrgDetailLoading] = useState(false);
  const [orgDetailError, setOrgDetailError] = useState("");
  const [orgLinks, setOrgLinks] = useState([]);

  const [reviewCases, setReviewCases] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState("");
  const [reviewStatusFilter, setReviewStatusFilter] = useState(null);
  const [openCaseId, setOpenCaseId] = useState(null);

  const [sources, setSources] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourcesError, setSourcesError] = useState("");

  const [boundaries, setBoundaries] = useState([]);
  const [boundariesLoading, setBoundariesLoading] = useState(true);
  const [boundariesError, setBoundariesError] = useState("");

  const [systemLinks, setSystemLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [linksError, setLinksError] = useState("");

  const [showNewOrgModal, setShowNewOrgModal] = useState(false);
  const [showNewCaseModal, setShowNewCaseModal] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(null);
  const [showRestrictModal, setShowRestrictModal] = useState(null);
  const [showStageBoundaryModal, setShowStageBoundaryModal] = useState(false);
  const [showNewLinkModal, setShowNewLinkModal] = useState(false);
  const [busy, setBusy] = useState(false);

  const callRpc = useCallback(async (fn, args, label) => {
    const { data, error } = await withRequestDeadline(
      signal => supabase.rpc(fn, args).abortSignal(signal),
      { timeoutMs: 15000, label },
    );
    if (error) throw error;
    return data;
  }, []);

  const refreshDirectory = useCallback(async () => {
    if (!currentUser?.id || !isAdmin) return;
    setDirectoryLoading(true); setDirectoryError("");
    try {
      const data = await callRpc("ci_list_organizations_overview", { p_limit: 500 }, "Church Intelligence directory read");
      setDirectory(Array.isArray(data) ? data : []); setCheckedAt(new Date());
    } catch (err) { setDirectory([]); setDirectoryError(err?.message || "The directory service did not respond."); }
    finally { setDirectoryLoading(false); }
  }, [currentUser?.id, isAdmin, callRpc]);

  const refreshReviewCases = useCallback(async () => {
    if (!currentUser?.id || !isAdmin) return;
    setReviewLoading(true); setReviewError("");
    try {
      const data = await callRpc("ci_list_review_cases", { p_status: reviewStatusFilter, p_limit: 100 }, "Church Intelligence review queue read");
      setReviewCases(Array.isArray(data) ? data : []);
    } catch (err) { setReviewCases([]); setReviewError(err?.message || "The research queue did not respond."); }
    finally { setReviewLoading(false); }
  }, [currentUser?.id, isAdmin, reviewStatusFilter, callRpc]);

  const refreshSources = useCallback(async () => {
    if (!currentUser?.id || !isAdmin) return;
    setSourcesLoading(true); setSourcesError("");
    try {
      const data = await callRpc("ci_list_sources", { p_limit: 200 }, "Church Intelligence source registry read");
      setSources(Array.isArray(data) ? data : []);
    } catch (err) { setSources([]); setSourcesError(err?.message || "The source registry did not respond."); }
    finally { setSourcesLoading(false); }
  }, [currentUser?.id, isAdmin, callRpc]);

  const refreshBoundaries = useCallback(async () => {
    if (!currentUser?.id || !isAdmin) return;
    setBoundariesLoading(true); setBoundariesError("");
    try {
      const data = await callRpc("ci_list_boundary_versions", { p_limit: 100 }, "Church Intelligence boundary read");
      setBoundaries(Array.isArray(data) ? data : []);
    } catch (err) { setBoundaries([]); setBoundariesError(err?.message || "Boundary versions did not respond."); }
    finally { setBoundariesLoading(false); }
  }, [currentUser?.id, isAdmin, callRpc]);

  const refreshSystemLinks = useCallback(async () => {
    if (!currentUser?.id || !isAdmin) return;
    setLinksLoading(true); setLinksError("");
    try {
      const data = await callRpc("ci_list_system_links", { p_organization_id: null, p_limit: 200 }, "Church Intelligence system links read");
      setSystemLinks(Array.isArray(data) ? data : []);
    } catch (err) { setSystemLinks([]); setLinksError(err?.message || "System links did not respond."); }
    finally { setLinksLoading(false); }
  }, [currentUser?.id, isAdmin, callRpc]);

  const refreshAll = useCallback(() => {
    void refreshDirectory(); void refreshReviewCases(); void refreshSources(); void refreshBoundaries(); void refreshSystemLinks();
  }, [refreshDirectory, refreshReviewCases, refreshSources, refreshBoundaries, refreshSystemLinks]);

  useEffect(() => { const t = setTimeout(() => { refreshAll(); }, 0); return () => clearTimeout(t); }, [refreshAll]);

  const openOrgDetail = useCallback(async (orgId) => {
    setSelectedOrgId(orgId); setOrgDetail(null); setOrgDetailError(""); setOrgDetailLoading(true);
    try {
      const data = await callRpc("ci_get_organization", { p_organization_id: orgId, p_requested_purpose: purpose }, "Church Intelligence organization detail");
      setOrgDetail(data);
      const linkData = await callRpc("ci_list_system_links", { p_organization_id: orgId, p_limit: 50 }, "Church Intelligence org links");
      setOrgLinks(Array.isArray(linkData) ? linkData : []);
    } catch (err) { setOrgDetailError(err?.message || "Could not load this organization."); }
    finally { setOrgDetailLoading(false); }
  }, [callRpc, purpose]);

  const notify = (type, text) => setBanner({ type, text });

  const runAction = async (fn, args, label, onSuccess) => {
    setBusy(true);
    try { await callRpc(fn, args, label); notify("success", `${label} succeeded.`); if (onSuccess) await onSuccess(); }
    catch (err) { notify("error", err?.message || `${label} failed.`); }
    finally { setBusy(false); }
  };

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
      await callRpc("ci_resolve_review_case", { p_case_id: reviewId, p_status: "resolved", p_resolution: { action: "faithbid_profile_link", faithbid_profile_id: profileId }, p_reason: "FaithBid account link confirmed by platform admin" }, "Resolve FaithBid link review");
      notify("success", "Linked to FaithBid account."); setMatchResults(prev => ({ ...prev, [orgId]: undefined })); await refreshDirectory();
    } catch (err) { notify("error", err?.message || "Could not link this FaithBid account."); }
    finally { setBusy(false); }
  };

  const online = !directoryLoading && !directoryError;
  const checked = useMemo(() => checkedAt ? checkedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Not checked", [checkedAt]);
  const openCases = useMemo(() => reviewCases.filter(c => c.status === "open" || c.status === "in_progress").length, [reviewCases]);
  const publishedBoundaries = useMemo(() => boundaries.filter(b => b.publication_status === "published").length, [boundaries]);
  const activeLinks = useMemo(() => systemLinks.filter(l => l.link_status === "active").length, [systemLinks]);

  const foundationChecks = useMemo(() => [
    ["Private RPC boundary", online ? "Verified" : directoryError ? "Unavailable" : "Not checked", online ? "Admin-authorized research read succeeded." : directoryError || "The private service has not been checked yet."],
    ["Canonical hierarchy", "Designed", "The approved organization → campus → site constraints require database acceptance-test evidence before this is marked verified."],
    ["Purpose restrictions", "Designed", "The schema preserves claim-level rights snapshots; promote a claim to exercise the path."],
    ["Dallas geography", publishedBoundaries > 0 ? "Published" : "Not published", publishedBoundaries > 0 ? `${publishedBoundaries} published boundary version(s).` : "No City of Dallas boundary version has been published yet."],
    ["Operational ownership", activeLinks > 0 ? "Exercised" : "Designed", activeLinks > 0 ? `${activeLinks} active cross-system link(s).` : "The bridge contract is defined; no cross-system handoff has been exercised yet."],
    ["Production acquisition", "Paused", "Intentionally paused until the 50-case gold-set measurement gate."],
  ], [online, directoryError, publishedBoundaries, activeLinks]);

  if (!isAdmin) return <div className="ci-denied"><p className="ci-eyebrow">Internal workspace</p><h1>Church Intelligence is restricted.</h1><p>This research workspace is available only to FaithBid platform administrators.</p><button type="button" onClick={() => nav?.("projects")}>Back to marketplace</button></div>;

  return <section className="ci-shell" aria-label="Church Intelligence">
    <header className="ci-hero">
      <div><p className="ci-eyebrow">FaithBid internal · Dallas V1</p><h1>Church Intelligence</h1><p>Build a verified picture of every Dallas church, preserve why each fact can be used, and hand qualified organizations into Growth without creating another CRM.</p></div>
      <div className="ci-actions"><span className={online ? "live" : ""}>{directoryLoading ? "Checking private service" : online ? "Private service online" : "Service needs attention"}</span><button type="button" onClick={refreshAll} disabled={directoryLoading}>{directoryLoading ? "Checking…" : "Refresh"}</button></div>
    </header>

    <Banner banner={banner} onDismiss={() => setBanner(null)} />

    <div className="ci-metrics">
      <Metric label="Churches in Dallas intel" value={directory.length} detail={`${directory.filter(d => d.linked_to_faithbid).length} synced to FaithBid`} />
      <Metric label="Open review cases" value={openCases} detail={`${reviewCases.length} total in queue`} tone={openCases > 0 ? "gold" : ""} />
      <Metric label="Dallas authority" value={publishedBoundaries > 0 ? "Published" : "Not loaded"} detail="City-limits boundary version status" tone={publishedBoundaries > 0 ? "green" : "gold"} />
      <Metric label="Operational handoff" value={activeLinks} detail="Active cross-system links" />
    </div>

    <nav className="ci-tabs" aria-label="Church Intelligence sections">{TABS.map(([id, label]) => <button key={id} type="button" className={tab === id ? "active" : ""} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>{label}</button>)}</nav>

    <div className="ci-panel">
      {tab === "organizations" && (
        selectedOrgId ? (
          <OrgDetail
            overviewRow={directory.find(d => d.id === selectedOrgId)}
            detail={orgDetail}
            loading={orgDetailLoading}
            error={orgDetailError}
            links={orgLinks}
            busy={busy}
            onBack={() => { setSelectedOrgId(null); setOrgDetail(null); }}
            onPromote={(claimId) => runAction("ci_promote_claim", { p_claim_id: claimId, p_reason: "Promoted from Church Intelligence Church 360 view" }, "Promote claim", async () => { await openOrgDetail(selectedOrgId); await refreshDirectory(); })}
            onOpenCase={() => setShowNewCaseModal({ organizationId: selectedOrgId })}
            onAddLink={() => setShowNewLinkModal(true)}
          />
        ) : (
          <>
            <div className="ci-panel-head">
              <div><p className="ci-eyebrow">Dallas church directory</p><h2>Organizations</h2></div>
              <div className="ci-panel-head-actions">
                <div className="ci-subfilter"><button type="button" className={directoryView === "list" ? "active" : ""} onClick={() => setDirectoryView("list")}>List</button><button type="button" className={directoryView === "map" ? "active" : ""} onClick={() => setDirectoryView("map")}>Map</button></div>
                <input className="ci-search" type="search" placeholder="Search by name, address, or zip…" value={directorySearch} onChange={e => setDirectorySearch(e.target.value)} />
                <button type="button" onClick={() => setShowNewOrgModal(true)}>+ Add organization</button>
              </div>
            </div>
            {directoryLoading ? <div className="ci-loading" role="status">Loading Dallas churches…</div>
              : directoryError ? <div className="ci-alert" role="alert"><div><strong>Church Intelligence could not load.</strong><span>{directoryError}</span></div><button type="button" onClick={refreshDirectory}>Try again</button></div>
              : directory.length ? (() => {
                  const q = directorySearch.trim().toLowerCase();
                  const rows = q ? directory.filter(d => [d.canonical_name, d.address_line_1, d.postal_code, d.locality].filter(Boolean).some(v => v.toLowerCase().includes(q))) : directory;
                  if (directoryView === "map") return rows.length ? <DallasMap rows={rows} onSelect={openOrgDetail} /> : <Empty eyebrow="No matches" title="No churches match that search." detail="Try a different name, street, or zip code." />;
                  return rows.length ? <div className="ci-table-wrap"><table className="ci-table"><thead><tr><th>Church</th><th>Address</th><th>Denomination</th><th>FaithBid</th><th>Status</th><th /></tr></thead><tbody>{rows.map(row => <React.Fragment key={row.id}><tr>
                    <td><strong>{row.canonical_name || "Unnamed organization"}</strong></td>
                    <td>{row.address_line_1 ? <>{row.address_line_1}<span className="ci-addr-sub">{row.locality}, {row.region_code} {row.postal_code}</span></> : <span className="ci-muted">No address on file</span>}</td>
                    <td>{row.denomination || <span className="ci-muted">—</span>}</td>
                    <td>{row.linked_to_faithbid ? <Badge tone="good">Synced</Badge> : <button type="button" className="ci-badge-btn" disabled={matchLoadingId === row.id} onClick={() => checkMatch(row.id)}>{matchLoadingId === row.id ? "Checking…" : "Not linked — check"}</button>}</td>
                    <td>{row.dallas_membership === "excluded" ? <Badge tone="danger">Outside Dallas</Badge> : row.dallas_membership === "review" ? <Badge tone="warn">Boundary check</Badge> : row.open_review_case_count > 0 ? <Badge tone="warn">Needs review</Badge> : row.has_promoted_claim ? <Badge tone="good">Verified</Badge> : <Badge tone="neutral">New</Badge>}</td>
                    <td><button type="button" className="ci-link-btn" onClick={() => openOrgDetail(row.id)}>Details →</button></td>
                  </tr>
                  {matchResults[row.id] !== undefined && <tr className="ci-detail-row"><td colSpan={6}><div className="ci-case-detail">
                    {matchResults[row.id].length ? matchResults[row.id].map(m => <div key={m.profile_id} className="ci-match-row">
                      <div><strong>{m.org_name || "Unnamed account"}</strong><span className="ci-addr-sub">{m.city}, {m.state_code} {m.denomination ? `· ${m.denomination}` : ""} · {Math.round(m.name_similarity * 100)}% name match{m.city_match ? " · same city" : ""}</span></div>
                      <button type="button" disabled={busy} onClick={() => linkMatch(row.id, m.profile_id)}>Link this account</button>
                    </div>) : <p className="ci-muted">No FaithBid church account looks like a match yet. This church likely hasn't signed up on FaithBid.</p>}
                  </div></td></tr>}
                  </React.Fragment>)}</tbody></table></div> : <Empty eyebrow="No matches" title="No churches match that search." detail="Try a different name, street, or zip code." />;
                })()
              : <Empty eyebrow="Dallas V1" title="No churches have been added yet." detail="Click + Add organization to enter the first one, or run the approved Dallas gold-set research pass." />}
          </>
        )
      )}

      {tab === "queue" && (
        <>
          <div className="ci-panel-head">
            <div><p className="ci-eyebrow">Human review</p><h2>Research Queue</h2></div>
            <div className="ci-panel-head-actions">
              <div className="ci-subfilter">
                <button type="button" className={reviewStatusFilter === null ? "active" : ""} onClick={() => setReviewStatusFilter(null)}>All</button>
                {CASE_STATUSES.map(s => <button key={s} type="button" className={reviewStatusFilter === s ? "active" : ""} onClick={() => setReviewStatusFilter(s)}>{s.replace("_", " ")}</button>)}
              </div>
              <button type="button" onClick={() => setShowNewCaseModal({})}>+ Open case</button>
            </div>
          </div>
          {reviewLoading ? <div className="ci-loading" role="status">Loading review queue…</div>
            : reviewError ? <div className="ci-alert" role="alert"><div><strong>Research Queue could not load.</strong><span>{reviewError}</span></div><button type="button" onClick={refreshReviewCases}>Try again</button></div>
            : reviewCases.length ? <div className="ci-table-wrap"><table className="ci-table"><thead><tr><th>Church</th><th>Issue</th><th>Severity</th><th>Status</th><th>Opened</th><th /></tr></thead><tbody>{reviewCases.map(c => <React.Fragment key={c.id}><tr><td><strong>{c.subject_organization_name || "Not tied to one church"}</strong></td><td>{CASE_TYPE_LABELS[c.case_type] || c.case_type}</td><td><Badge tone={severityTone(c.severity)}>{c.severity}</Badge></td><td><Badge tone={statusTone(c.status)}>{c.status.replace("_", " ")}</Badge></td><td>{fmtDate(c.created_at)}</td><td><button type="button" className="ci-link-btn" onClick={() => setOpenCaseId(openCaseId === c.id ? null : c.id)}>{openCaseId === c.id ? "Hide" : "Details"}</button></td></tr>{openCaseId === c.id && <tr className="ci-detail-row"><td colSpan={6}><div className="ci-case-detail">{c.case_payload?.note ? <p>{c.case_payload.note}</p> : c.case_payload?.distance_m !== undefined ? <p>This address is only {Math.round(c.case_payload.distance_m)} meters from the Dallas city line — too close to confidently place it in or out of Dallas automatically.</p> : <pre>{JSON.stringify(c.case_payload, null, 2)}</pre>}{c.resolution?.notes && <p><strong>Resolution:</strong> {c.resolution.notes}</p>}{(c.status === "open" || c.status === "in_progress") && <button type="button" onClick={() => setShowResolveModal(c)}>Resolve / dismiss</button>}</div></td></tr>}</React.Fragment>)}</tbody></table></div>
            : <Empty eyebrow="Controlled rollout" title="No Dallas review work is pending." detail="Boundary ambiguity, duplicates, corrections, and source conflicts will appear here as research is staged." />}
        </>
      )}

      {tab === "sources" && (
        <>
          <div className="ci-panel-head"><div><p className="ci-eyebrow">Evidence policy</p><h2>Sources</h2></div><span>Purpose-scoped by design</span></div>
          {sourcesLoading ? <div className="ci-loading" role="status">Loading source registry…</div>
            : sourcesError ? <div className="ci-alert" role="alert"><div><strong>Sources could not load.</strong><span>{sourcesError}</span></div><button type="button" onClick={refreshSources}>Try again</button></div>
            : sources.length ? <div className="ci-table-wrap"><table className="ci-table"><thead><tr><th>Source</th><th>Authority</th><th>Access</th><th>Automation</th><th>Allowed purposes</th><th /></tr></thead><tbody>{sources.map(s => <tr key={s.id}><td><strong>{s.display_name}</strong><small>{s.source_key}</small></td><td>{s.authority_class}</td><td>{s.access_method}</td><td><Badge tone={s.automation_status === "approved" ? "good" : s.automation_status === "prohibited" ? "danger" : "warn"}>{s.automation_status}</Badge></td><td>{(s.default_allowed_purposes || []).join(", ")}</td><td><button type="button" className="ci-link-btn" onClick={() => setShowRestrictModal(s)}>Restrict…</button></td></tr>)}</tbody></table></div>
            : <Empty eyebrow="Source registry" title="No sources are registered yet." detail="Register a source directly in the registry before research bundles can cite it. Source policy is private and evidence-backed; each claim keeps the immutable rights snapshot that applied when it was collected." />}
        </>
      )}

      {tab === "geography" && (
        <>
          <div className="ci-panel-head"><div><p className="ci-eyebrow">Jurisdiction authority</p><h2>Dallas Geography</h2></div><div className="ci-panel-head-actions"><button type="button" onClick={() => setShowStageBoundaryModal(true)}>+ Stage boundary</button></div></div>
          {boundariesLoading ? <div className="ci-loading" role="status">Loading boundary versions…</div>
            : boundariesError ? <div className="ci-alert" role="alert"><div><strong>Boundary versions could not load.</strong><span>{boundariesError}</span></div><button type="button" onClick={refreshBoundaries}>Try again</button></div>
            : boundaries.length ? <div className="ci-table-wrap"><table className="ci-table"><thead><tr><th>Version</th><th>Scope</th><th>SRID</th><th>Status</th><th>Published</th><th /></tr></thead><tbody>{boundaries.map(b => <tr key={b.id}><td><strong>{b.version_label}</strong><small>{b.geometry_hash?.slice(0, 16)}…</small></td><td>{b.boundary_scope}</td><td>{b.source_srid} → {b.normalized_srid}</td><td><Badge tone={publicationTone(b.publication_status)}>{b.publication_status}</Badge></td><td>{fmtDate(b.published_at)}</td><td>{b.publication_status === "draft" && <button type="button" className="ci-link-btn" onClick={() => runAction("ci_publish_boundary", { p_boundary_id: b.id, p_reason: "Published from Church Intelligence Dallas Geography view" }, "Publish boundary", refreshBoundaries)}>Publish</button>}</td></tr>)}</tbody></table></div>
            : <Empty eyebrow="City of Dallas" title="No boundary version has been staged yet." detail="The Dallas authority is the versioned City Limits jurisdiction polygon. Stage the official geometry, then publish it to begin Dallas membership evaluation." />}
        </>
      )}

      {tab === "links" && (
        <>
          <div className="ci-panel-head"><div><p className="ci-eyebrow">Cross-system bridges</p><h2>System Links</h2></div><div className="ci-panel-head-actions"><button type="button" onClick={() => setShowNewLinkModal(true)}>+ New link</button></div></div>
          {linksLoading ? <div className="ci-loading" role="status">Loading system links…</div>
            : linksError ? <div className="ci-alert" role="alert"><div><strong>System links could not load.</strong><span>{linksError}</span></div><button type="button" onClick={refreshSystemLinks}>Try again</button></div>
            : systemLinks.length ? <div className="ci-table-wrap"><table className="ci-table"><thead><tr><th>Church</th><th>System</th><th>FaithBid account</th><th>Status</th><th>Linked</th></tr></thead><tbody>{systemLinks.map(l => <tr key={l.id}><td><strong>{l.organization_name || "Unknown church"}</strong></td><td>{l.system_key.replace(/_/g, " ")}</td><td>{l.faithbid_org_name || <span className="ci-muted">{l.growth_church_id || l.concierge_organization_id || l.gpi_organization_id || "—"}</span>}</td><td><Badge tone={linkTone(l.link_status)}>{l.link_status}</Badge></td><td>{fmtDate(l.created_at)}</td></tr>)}</tbody></table></div>
            : <Empty eyebrow="Operational ownership" title="No cross-system links exist yet." detail="Church Intelligence identifies and verifies; Growth, Concierge, and GPI own the relationship and marketplace work. Link a canonical organization to hand it off without duplicating ownership." />}
        </>
      )}

      {tab === "health" && (
        <>
          <div className="ci-panel-head"><div><p className="ci-eyebrow">Foundation status</p><h2>Data Health</h2></div><span>Last checked {checked}</span></div>
          <div className="ci-health-grid">{foundationChecks.map(([label, status, detail]) => <article className="ci-health" key={label}><span className={status === "Verified" || status === "Published" || status === "Exercised" ? "good" : "paused"}>{status}</span><h3>{label}</h3><p>{detail}</p></article>)}</div>
        </>
      )}
    </div>

    {showNewOrgModal && <NewOrgModal sources={sources} busy={busy} onClose={() => setShowNewOrgModal(false)} onSubmit={async (bundle, reason) => {
      setBusy(true);
      try { await callRpc("ci_create_research_bundle", { p_bundle: bundle, p_reason: reason }, "Create research bundle");
        notify("success", "Research bundle created."); setShowNewOrgModal(false); await refreshDirectory();
      } catch (err) { notify("error", err?.message || "Could not create the research bundle."); }
      finally { setBusy(false); }
    }} />}

    {showNewCaseModal && <NewCaseModal defaultOrgId={showNewCaseModal.organizationId} busy={busy} onClose={() => setShowNewCaseModal(null)} onSubmit={async (payload, reason) => {
      setBusy(true);
      try {
        await callRpc("ci_open_review_case", { p_case_type: payload.case_type, p_severity: payload.severity, p_organization_id: payload.organization_id || null, p_campus_id: null, p_site_id: null, p_payload: payload.notes ? { notes: payload.notes } : {}, p_reason: reason }, "Open review case");
        notify("success", "Review case opened."); setShowNewCaseModal(null); await refreshReviewCases();
      } catch (err) { notify("error", err?.message || "Could not open the review case."); }
      finally { setBusy(false); }
    }} />}

    {showResolveModal && <ResolveCaseModal caseItem={showResolveModal} busy={busy} onClose={() => setShowResolveModal(null)} onSubmit={async (status, notes, reason) => {
      setBusy(true);
      try {
        await callRpc("ci_resolve_review_case", { p_review_id: showResolveModal.id, p_status: status, p_resolution: { notes }, p_reason: reason }, "Resolve review case");
        notify("success", "Review case updated."); setShowResolveModal(null); setOpenCaseId(null); await refreshReviewCases();
      } catch (err) { notify("error", err?.message || "Could not update the review case."); }
      finally { setBusy(false); }
    }} />}

    {showRestrictModal && <RestrictSourceModal source={showRestrictModal} busy={busy} onClose={() => setShowRestrictModal(null)} onSubmit={async (allowed, reason) => {
      setBusy(true);
      try {
        await callRpc("ci_apply_source_policy_restriction", { p_source_id: showRestrictModal.id, p_allowed: allowed, p_reason: reason }, "Restrict source policy");
        notify("success", "Source policy restricted."); setShowRestrictModal(null); await refreshSources();
      } catch (err) { notify("error", err?.message || "Could not restrict the source policy."); }
      finally { setBusy(false); }
    }} />}

    {showStageBoundaryModal && <StageBoundaryModal busy={busy} onClose={() => setShowStageBoundaryModal(false)} onSubmit={async (form, reason) => {
      setBusy(true);
      try {
        await callRpc("ci_stage_dallas_boundary", { p_source_record_id: form.sourceRecordId, p_native_wkt: form.nativeWkt, p_version_label: form.versionLabel, p_transformation_metadata: form.metadata, p_reason: reason }, "Stage Dallas boundary");
        notify("success", "Boundary version staged."); setShowStageBoundaryModal(false); await refreshBoundaries();
      } catch (err) { notify("error", err?.message || "Could not stage the boundary version."); }
      finally { setBusy(false); }
    }} />}

    {showNewLinkModal && <NewLinkModal organizations={directory} defaultOrgId={selectedOrgId} busy={busy} onClose={() => setShowNewLinkModal(false)} onSubmit={async (form, reason) => {
      setBusy(true);
      try {
        const reviewId = form.status === "active" ? await callRpc("ci_open_review_case", {
          p_case_type: "correction", p_severity: "low", p_organization_id: form.organizationId, p_campus_id: null, p_site_id: null,
          p_payload: { action: "system_link", system_key: form.systemKey, external_id: form.targetId },
          p_reason: reason,
        }, "Open system-link review") : null;
        await callRpc("ci_set_system_link", {
          p_organization_id: form.organizationId, p_system_key: form.systemKey,
          p_profile_id: form.systemKey === "faithbid_profile" ? form.targetId : null,
          p_growth_id: form.systemKey === "growth_church" ? form.targetId : null,
          p_concierge_id: form.systemKey === "concierge_organization" ? form.targetId : null,
          p_gpi_id: form.systemKey === "gpi_organization" ? form.targetId : null,
          p_status: form.status, p_evidence_id: null, p_review_id: reviewId, p_reason: reason,
        }, "Set system link");
        if (reviewId) await callRpc("ci_resolve_review_case", { p_case_id: reviewId, p_status: "resolved", p_resolution: { action: "system_link", system_key: form.systemKey, external_id: form.targetId }, p_reason: reason }, "Resolve system-link review");
        notify("success", "System link saved."); setShowNewLinkModal(false); await refreshSystemLinks(); await refreshDirectory();
        if (selectedOrgId) await openOrgDetail(selectedOrgId);
      } catch (err) { notify("error", err?.message || "Could not save the system link."); }
      finally { setBusy(false); }
    }} />}
  </section>;
}

function membershipLabel(m) {
  if (m === "included") return { text: "Confirmed in Dallas", tone: "good" };
  if (m === "excluded") return { text: "Outside Dallas", tone: "danger" };
  if (m === "review") return { text: "Right on the boundary — needs a look", tone: "warn" };
  return { text: "Not yet checked against the Dallas boundary", tone: "muted" };
}

function OrgDetail({ detail, overviewRow, loading, error, links, busy, onBack, onPromote, onOpenCase, onAddLink }) {
  const allPromoted = detail?.claims?.length > 0 && detail.claims.every(c => c.claim_status === "promoted");
  const membership = membershipLabel(overviewRow?.dallas_membership);
  return <>
    <div className="ci-panel-head"><div><p className="ci-eyebrow">Church profile</p><h2>{detail?.organization?.canonical_name || "Organization"}</h2></div><div className="ci-panel-head-actions"><button type="button" onClick={onOpenCase}>Flag an issue</button><button type="button" onClick={onAddLink}>Link FaithBid account</button><button type="button" className="ci-btn-secondary" onClick={onBack}>← Back to directory</button></div></div>
    {loading ? <div className="ci-loading" role="status">Loading church profile…</div>
      : error ? <div className="ci-alert" role="alert"><div><strong>Could not load this church.</strong><span>{error}</span></div></div>
      : !detail ? null : <div className="ci-church360">
        <div className="ci-profile-card">
          <div className="ci-profile-row"><span>Address</span><strong>{overviewRow?.address_line_1 ? `${overviewRow.address_line_1}, ${overviewRow.locality}, ${overviewRow.region_code} ${overviewRow.postal_code}` : "Not on file"}</strong></div>
          <div className="ci-profile-row"><span>Denomination</span><strong>{overviewRow?.denomination || "Not recorded"}</strong></div>
          <div className="ci-profile-row"><span>Dallas status</span><Badge tone={membership.tone}>{membership.text}</Badge></div>
          <div className="ci-profile-row"><span>Verification</span>{allPromoted ? <Badge tone="good">Verified</Badge> : <Badge tone="neutral">Not yet verified</Badge>}</div>
          {!allPromoted && detail.claims?.some(c => c.claim_status === "observed") && <button type="button" disabled={busy} onClick={() => onPromote(detail.claims.find(c => c.claim_status === "observed").id)}>Mark verified</button>}
        </div>

        {detail.campuses?.length > 1 && <>
          <h3>Campuses</h3>
          <div className="ci-table-wrap"><table className="ci-table"><thead><tr><th>Campus</th><th>Primary</th></tr></thead><tbody>{detail.campuses.map(c => <tr key={c.id}><td>{c.campus_name}</td><td>{c.is_primary ? "Yes" : "No"}</td></tr>)}</tbody></table></div>
        </>}

        <h3>FaithBid account</h3>
        {links?.length ? <div className="ci-table-wrap"><table className="ci-table"><thead><tr><th>System</th><th>Status</th></tr></thead><tbody>{links.map(l => <tr key={l.id}><td>{l.faithbid_org_name || l.system_key.replace(/_/g, " ")}</td><td><Badge tone={linkTone(l.link_status)}>{l.link_status}</Badge></td></tr>)}</tbody></table></div> : <p className="ci-muted">Not linked to a FaithBid account yet.</p>}
      </div>}
  </>;
}

function DallasMap({ rows, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;
      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, { scrollWheelZoom: false }).setView([32.7767, -96.797], 10.5);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapRef.current);
        layerRef.current = L.layerGroup().addTo(mapRef.current);
      }
      layerRef.current.clearLayers();
      const pts = [];
      for (const row of rows) {
        if (row.latitude == null || row.longitude == null) continue;
        const color = row.dallas_membership === "excluded" ? "#c35f50" : row.dallas_membership === "review" ? "#c4973a" : row.has_promoted_claim ? "#286046" : "#9a7436";
        const marker = L.circleMarker([row.latitude, row.longitude], { radius: 7, color, fillColor: color, fillOpacity: 0.85, weight: 1.5 });
        const tooltip = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = row.canonical_name || "Unnamed organization";
        tooltip.append(title);
        if (row.address_line_1) { tooltip.append(document.createElement("br"), document.createTextNode(row.address_line_1)); }
        marker.bindTooltip(tooltip, { direction: "top" });
        marker.on("click", () => onSelect(row.id));
        marker.addTo(layerRef.current);
        pts.push([row.latitude, row.longitude]);
      }
      if (pts.length) mapRef.current.fitBounds(pts, { padding: [24, 24], maxZoom: 13 });
    }).catch(() => { if (!cancelled) setMapError("The map could not load. Use the list view to continue reviewing churches."); });
    return () => { cancelled = true; };
  }, [rows, onSelect]);

  useEffect(() => () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } }, []);

  return <div className="ci-map-wrap">{mapError ? <div className="ci-alert" role="alert"><div><strong>Map unavailable.</strong><span>{mapError}</span></div></div> : null}<div ref={containerRef} className="ci-map" /><div className="ci-map-legend"><span><i style={{ background: "#286046" }} />Verified</span><span><i style={{ background: "#9a7436" }} />New</span><span><i style={{ background: "#c4973a" }} />Boundary check</span><span><i style={{ background: "#c35f50" }} />Outside Dallas</span></div></div>;
}

function NewOrgModal({ sources, busy, onClose, onSubmit }) {
  const [name, setName] = useState(""); const [state, setState] = useState("active"); const [campus, setCampus] = useState("");
  const [addr1, setAddr1] = useState(""); const [addr2, setAddr2] = useState(""); const [locality, setLocality] = useState("Dallas"); const [region, setRegion] = useState("TX"); const [postal, setPostal] = useState("");
  const [sourceId, setSourceId] = useState(sources[0]?.id || ""); const [sourceUrl, setSourceUrl] = useState(""); const [sourceKey, setSourceKey] = useState("");
  const [parserVersion, setParserVersion] = useState("manual-entry-v1"); const [notes, setNotes] = useState("");
  const [purposes, setPurposes] = useState(["research"]); const [reason, setReason] = useState("");
  const [submitError, setSubmitError] = useState("");

  const canSubmit = name.trim().length >= 2 && addr1.trim() && locality.trim() && region.trim() && sourceId && (sourceUrl.trim() || sourceKey.trim()) && purposes.length && reason.trim();

  const submit = async () => {
    setSubmitError("");
    if (!canSubmit) { setSubmitError("Fill in the required fields: organization name, address, source, at least one allowed purpose, and a reason."); return; }
    const normalized = `${addr1.trim()}${addr2.trim() ? ", " + addr2.trim() : ""}, ${locality.trim()}, ${region.trim()}${postal.trim() ? " " + postal.trim() : ""}`;
    const nonce = crypto.randomUUID();
    const contentHash = await sha256Hex(`manual:${name}:${normalized}:${nonce}`);
    const extractionHash = await sha256Hex(`extract:${contentHash}`);
    const bundle = {
      canonical_name: name.trim(), operating_state: state, campus_name: campus.trim() || name.trim(),
      address_line_1: addr1.trim(), address_line_2: addr2.trim() || null, locality: locality.trim(), region_code: region.trim().toUpperCase(), postal_code: postal.trim() || null,
      normalized_address: normalized,
      source_id: sourceId, source_external_key: sourceKey.trim() || null, source_url: sourceUrl.trim() || null,
      content_hash: contentHash, extraction_hash: extractionHash, parser_version: parserVersion.trim() || "manual-entry-v1",
      retention_mode: "metadata_only", source_license_snapshot: {}, source_metadata: notes.trim() ? { notes: notes.trim() } : {},
      allowed_purposes: purposes,
    };
    await onSubmit(bundle, reason.trim());
  };

  return <Modal title="Add organization" subtitle="Creates a canonical organization, primary campus, site, and the founding evidence claim in one research bundle." onClose={onClose} wide>
    <div className="ci-form-grid">
      <Field label="Canonical name *"><input value={name} onChange={e => setName(e.target.value)} placeholder="First Baptist Church of Dallas" /></Field>
      <Field label="Operating state"><select value={state} onChange={e => setState(e.target.value)}>{OPERATING_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
      <Field label="Campus name" hint="Defaults to the organization name"><input value={campus} onChange={e => setCampus(e.target.value)} /></Field>
      <Field label="Address line 1 *"><input value={addr1} onChange={e => setAddr1(e.target.value)} /></Field>
      <Field label="Address line 2"><input value={addr2} onChange={e => setAddr2(e.target.value)} /></Field>
      <Field label="City *"><input value={locality} onChange={e => setLocality(e.target.value)} /></Field>
      <Field label="State code *"><input value={region} onChange={e => setRegion(e.target.value)} maxLength={2} /></Field>
      <Field label="Postal code"><input value={postal} onChange={e => setPostal(e.target.value)} /></Field>
      <Field label="Source *" hint={sources.length ? "Which registered source this came from" : "No sources are registered yet — register one before adding organizations"}>
        <select value={sourceId} onChange={e => setSourceId(e.target.value)} disabled={!sources.length}><option value="">Select a source…</option>{sources.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}</select>
      </Field>
      <Field label="Source URL"><input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://…" /></Field>
      <Field label="Source external key" hint="Required if no URL"><input value={sourceKey} onChange={e => setSourceKey(e.target.value)} /></Field>
      <Field label="Parser version"><input value={parserVersion} onChange={e => setParserVersion(e.target.value)} /></Field>
    </div>
    <Field label="Notes" hint="Stored as source metadata, not retained content"><textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
    <Field label="Allowed purposes for this claim *"><PurposeCheckboxes value={purposes} onChange={setPurposes} /></Field>
    <Field label="Reason for this change *" hint="Required for the audit trail"><input value={reason} onChange={e => setReason(e.target.value)} placeholder="Manual Dallas gold-set entry" /></Field>
    {submitError && <p className="ci-form-error">{submitError}</p>}
    <div className="ci-modal-actions"><button type="button" className="ci-btn-secondary" onClick={onClose}>Cancel</button><button type="button" disabled={busy} onClick={submit}>{busy ? "Creating…" : "Create research bundle"}</button></div>
  </Modal>;
}

function NewCaseModal({ defaultOrgId, busy, onClose, onSubmit }) {
  const [caseType, setCaseType] = useState("evidence_conflict"); const [severity, setSeverity] = useState("normal");
  const [organizationId, setOrganizationId] = useState(defaultOrgId || ""); const [notes, setNotes] = useState(""); const [reason, setReason] = useState("");
  const canSubmit = caseType && severity && reason.trim();
  return <Modal title="Open review case" onClose={onClose}>
    <Field label="Case type"><select value={caseType} onChange={e => setCaseType(e.target.value)}>{CASE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}</select></Field>
    <Field label="Severity"><select value={severity} onChange={e => setSeverity(e.target.value)}>{SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
    <Field label="Organization ID" hint="Optional — leave blank for a case not tied to one organization"><input value={organizationId} onChange={e => setOrganizationId(e.target.value)} /></Field>
    <Field label="Notes"><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
    <Field label="Reason *"><input value={reason} onChange={e => setReason(e.target.value)} /></Field>
    <div className="ci-modal-actions"><button type="button" className="ci-btn-secondary" onClick={onClose}>Cancel</button><button type="button" disabled={busy || !canSubmit} onClick={() => onSubmit({ case_type: caseType, severity, organization_id: organizationId.trim() || null, notes: notes.trim() || null }, reason.trim())}>{busy ? "Opening…" : "Open case"}</button></div>
  </Modal>;
}

function ResolveCaseModal({ caseItem, busy, onClose, onSubmit }) {
  const [status, setStatus] = useState("resolved"); const [notes, setNotes] = useState(""); const [reason, setReason] = useState("");
  return <Modal title={`Resolve case ${caseItem.id.slice(0, 8)}…`} onClose={onClose}>
    <Field label="Status"><select value={status} onChange={e => setStatus(e.target.value)}><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></Field>
    <Field label="Resolution notes"><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
    <Field label="Reason *"><input value={reason} onChange={e => setReason(e.target.value)} /></Field>
    <div className="ci-modal-actions"><button type="button" className="ci-btn-secondary" onClick={onClose}>Cancel</button><button type="button" disabled={busy || !reason.trim()} onClick={() => onSubmit(status, notes.trim(), reason.trim())}>{busy ? "Saving…" : "Save resolution"}</button></div>
  </Modal>;
}

function RestrictSourceModal({ source, busy, onClose, onSubmit }) {
  const [allowed, setAllowed] = useState(source.default_allowed_purposes || []); const [reason, setReason] = useState("");
  return <Modal title={`Restrict ${source.display_name}`} subtitle="Narrows what this source's future evidence may be used for. Historical claims keep their original rights snapshot." onClose={onClose}>
    <Field label="Allowed purposes"><PurposeCheckboxes value={allowed} onChange={setAllowed} /></Field>
    <Field label="Reason *"><input value={reason} onChange={e => setReason(e.target.value)} /></Field>
    <div className="ci-modal-actions"><button type="button" className="ci-btn-secondary" onClick={onClose}>Cancel</button><button type="button" disabled={busy || !allowed.length || !reason.trim()} onClick={() => onSubmit(allowed, reason.trim())}>{busy ? "Saving…" : "Apply restriction"}</button></div>
  </Modal>;
}

function StageBoundaryModal({ busy, onClose, onSubmit }) {
  const [sourceRecordId, setSourceRecordId] = useState(""); const [versionLabel, setVersionLabel] = useState(""); const [wkt, setWkt] = useState(""); const [reason, setReason] = useState("");
  const canSubmit = sourceRecordId.trim() && versionLabel.trim() && wkt.trim() && reason.trim();
  return <Modal title="Stage Dallas boundary" subtitle="Advanced: requires a source_record_id already produced by the boundary acquisition script, and native-authority WKT geometry." onClose={onClose} wide>
    <Field label="Source record ID *" hint="UUID from the Dallas boundary acquisition pipeline"><input value={sourceRecordId} onChange={e => setSourceRecordId(e.target.value)} /></Field>
    <Field label="Version label *"><input value={versionLabel} onChange={e => setVersionLabel(e.target.value)} placeholder="dallas-city-limits-v1" /></Field>
    <Field label="Native WKT geometry *"><textarea rows={4} value={wkt} onChange={e => setWkt(e.target.value)} placeholder="MULTIPOLYGON(...)" /></Field>
    <Field label="Reason *"><input value={reason} onChange={e => setReason(e.target.value)} /></Field>
    <div className="ci-modal-actions"><button type="button" className="ci-btn-secondary" onClick={onClose}>Cancel</button><button type="button" disabled={busy || !canSubmit} onClick={() => onSubmit({ sourceRecordId: sourceRecordId.trim(), versionLabel: versionLabel.trim(), nativeWkt: wkt.trim(), metadata: { staged_via: "church-intelligence-ui" } }, reason.trim())}>{busy ? "Staging…" : "Stage boundary"}</button></div>
  </Modal>;
}

function NewLinkModal({ organizations, defaultOrgId, busy, onClose, onSubmit }) {
  const [organizationId, setOrganizationId] = useState(defaultOrgId || ""); const [systemKey, setSystemKey] = useState("faithbid_profile");
  const [targetId, setTargetId] = useState(""); const [status, setStatus] = useState("proposed"); const [reason, setReason] = useState("");
  const canSubmit = organizationId.trim() && systemKey && targetId.trim() && status && reason.trim();
  return <Modal title="New system link" subtitle="Bridges a canonical organization to an existing FaithBid, Growth, Concierge, or GPI record without duplicating ownership." onClose={onClose}>
    <Field label="Organization *">{organizations.length ? <select value={organizationId} onChange={e => setOrganizationId(e.target.value)}><option value="">Select…</option>{organizations.map(o => <option key={o.id} value={o.id}>{o.canonical_name}</option>)}</select> : <input value={organizationId} onChange={e => setOrganizationId(e.target.value)} placeholder="Organization UUID" />}</Field>
    <Field label="System"><select value={systemKey} onChange={e => setSystemKey(e.target.value)}>{SYSTEM_KEYS.map(k => <option key={k} value={k}>{k.replace(/_/g, " ")}</option>)}</select></Field>
    <Field label="Target record ID *" hint={`The ${systemKey.replace(/_/g, " ")} record UUID`}><input value={targetId} onChange={e => setTargetId(e.target.value)} /></Field>
    <Field label="Link status"><select value={status} onChange={e => setStatus(e.target.value)}>{LINK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
    <Field label="Reason *"><input value={reason} onChange={e => setReason(e.target.value)} /></Field>
    <div className="ci-modal-actions"><button type="button" className="ci-btn-secondary" onClick={onClose}>Cancel</button><button type="button" disabled={busy || !canSubmit} onClick={() => onSubmit({ organizationId: organizationId.trim(), systemKey, targetId: targetId.trim(), status }, reason.trim())}>{busy ? "Saving…" : "Save link"}</button></div>
  </Modal>;
}
