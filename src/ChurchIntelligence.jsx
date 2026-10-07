import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { withRequestDeadline } from "./supabaseReliability";
import "leaflet/dist/leaflet.css";
import "./styles/church-intelligence.css";

const QUICK_FILTERS = [
  ["all", "All churches"],
  ["ready", "Basics complete"],
  ["missing", "Needs information"],
  ["connected", "On FaithBid"],
];

const OPERATING_STATES = ["active","inactive","unknown"];

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
  const [banner, setBanner] = useState(null);

  const purpose = "research";

  const [directory, setDirectory] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState("");
  const [directorySearch, setDirectorySearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");
  const [denominationFilter, setDenominationFilter] = useState("all");
  const [postalFilter, setPostalFilter] = useState("all");
  const [matchResults, setMatchResults] = useState({});
  const [matchLoadingId, setMatchLoadingId] = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [orgDetail, setOrgDetail] = useState(null);
  const [orgDetailLoading, setOrgDetailLoading] = useState(false);
  const [orgDetailError, setOrgDetailError] = useState("");

  const [sources, setSources] = useState([]);

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

  const refreshDirectory = useCallback(async () => {
    if (!currentUser?.id || !isAdmin) return;
    setDirectoryLoading(true); setDirectoryError("");
    try {
      const data = await callRpc("ci_list_organizations_overview", { p_limit: 500 }, "Church Intelligence directory read");
      setDirectory(Array.isArray(data) ? data : []);
    } catch (err) { setDirectory([]); setDirectoryError(err?.message || "The directory service did not respond."); }
    finally { setDirectoryLoading(false); }
  }, [currentUser?.id, isAdmin, callRpc]);

  const refreshSources = useCallback(async () => {
    if (!currentUser?.id || !isAdmin) return;
    try {
      const data = await callRpc("ci_list_sources", { p_limit: 200 }, "Church Intelligence source registry read");
      setSources(Array.isArray(data) ? data : []);
    } catch { setSources([]); }
  }, [currentUser?.id, isAdmin, callRpc]);

  const refreshAll = useCallback(() => {
    void refreshDirectory(); void refreshSources();
  }, [refreshDirectory, refreshSources]);

  useEffect(() => { const t = setTimeout(() => { refreshAll(); }, 0); return () => clearTimeout(t); }, [refreshAll]);

  const openOrgDetail = useCallback(async (orgId) => {
    setSelectedOrgId(orgId); setOrgDetail(null); setOrgDetailError(""); setOrgDetailLoading(true);
    try {
      const data = await callRpc("ci_get_organization", { p_organization_id: orgId, p_requested_purpose: purpose }, "Church Intelligence organization detail");
      setOrgDetail(data);
    } catch (err) { setOrgDetailError(err?.message || "Could not load this organization."); }
    finally { setOrgDetailLoading(false); }
  }, [callRpc, purpose]);

  const notify = (type, text) => setBanner({ type, text });

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
    const ready = directory.filter(row => row.address_line_1 && row.denomination).length;
    return {
      ready,
      missing: directory.length - ready,
      connected: directory.filter(row => row.linked_to_faithbid).length,
    };
  }, [directory]);
  const deferredSearch = useDeferredValue(directorySearch.trim().toLowerCase());
  const denominations = useMemo(() => [...new Set(directory.map(row => row.denomination).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [directory]);
  const postalCodes = useMemo(() => [...new Set(directory.map(row => row.postal_code?.slice(0, 5)).filter(Boolean))].sort(), [directory]);
  const filteredDirectory = useMemo(() => directory.filter(row => {
    const matchesSearch = !deferredSearch || [row.canonical_name, row.address_line_1, row.postal_code, row.locality]
      .filter(Boolean)
      .some(value => value.toLowerCase().includes(deferredSearch));
    const matchesDenomination = denominationFilter === "all" || row.denomination === denominationFilter;
    const matchesPostalCode = postalFilter === "all" || row.postal_code?.startsWith(postalFilter);
    const hasMissingDetails = !row.address_line_1 || !row.denomination;
    const matchesQuickFilter = quickFilter === "all"
      || (quickFilter === "ready" && !hasMissingDetails)
      || (quickFilter === "missing" && hasMissingDetails)
      || (quickFilter === "connected" && row.linked_to_faithbid);
    return matchesSearch && matchesDenomination && matchesPostalCode && matchesQuickFilter;
  }), [deferredSearch, denominationFilter, directory, postalFilter, quickFilter]);

  const clearDirectoryFilters = () => {
    setDirectorySearch("");
    setQuickFilter("all");
    setDenominationFilter("all");
    setPostalFilter("all");
  };

  if (!isAdmin) return <div className="ci-denied"><p className="ci-eyebrow">Internal workspace</p><h1>Church Intelligence is restricted.</h1><p>This research workspace is available only to FaithBid platform administrators.</p><button type="button" onClick={() => nav?.("projects")}>Back to marketplace</button></div>;

  return <section className="ci-shell" aria-label="Church Intelligence">
    <header className="ci-hero">
      <div><p className="ci-eyebrow">FaithBid internal · Dallas</p><h1>Dallas Churches</h1><p>Find any church FaithBid has loaded, understand what we know, and connect it to an existing FaithBid account.</p></div>
      <div className="ci-actions"><span className={online ? "live" : ""}>{directoryLoading ? "Loading churches" : online ? "Directory ready" : "Directory needs attention"}</span><button type="button" onClick={() => setShowNewOrgModal(true)}>+ Add church</button><button type="button" className="ci-btn-secondary" onClick={refreshAll} disabled={directoryLoading}>{directoryLoading ? "Loading…" : "Refresh"}</button></div>
    </header>

    <Banner banner={banner} onDismiss={() => setBanner(null)} />

    <section className="ci-coverage" aria-label="Dallas church coverage">
      <div><span>Loaded in FaithBid</span><strong>{directoryLoading ? "—" : directory.length.toLocaleString()}</strong></div>
      <div><span>Basics complete</span><strong>{directoryLoading ? "—" : directoryStats.ready.toLocaleString()}</strong></div>
      <div><span>Connected accounts</span><strong>{directoryLoading ? "—" : directoryStats.connected.toLocaleString()}</strong></div>
    </section>

    <div className="ci-panel ci-directory-panel">
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

            <div className="ci-quick-filters" aria-label="Church filters">
              {QUICK_FILTERS.map(([id, label]) => <button key={id} type="button" className={quickFilter === id ? "active" : ""} aria-pressed={quickFilter === id} onClick={() => setQuickFilter(id)}>{label}{id === "ready" && !directoryLoading ? ` · ${directoryStats.ready}` : id === "missing" && !directoryLoading ? ` · ${directoryStats.missing}` : id === "connected" && !directoryLoading ? ` · ${directoryStats.connected}` : ""}</button>)}
            </div>

            <div className="ci-directory-toolbar">
              <p aria-live="polite"><strong>{filteredDirectory.length}</strong> {filteredDirectory.length === 1 ? "church" : "churches"} shown</p>
              <div>
                <label><span>Denomination</span><select aria-label="Filter by denomination" value={denominationFilter} onChange={event => setDenominationFilter(event.target.value)}><option value="all">All denominations</option>{denominations.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
                <label><span>ZIP code</span><select aria-label="Filter by ZIP code" value={postalFilter} onChange={event => setPostalFilter(event.target.value)}><option value="all">All ZIP codes</option>{postalCodes.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
                {(directorySearch || quickFilter !== "all" || denominationFilter !== "all" || postalFilter !== "all") && <button type="button" className="ci-clear-filters" onClick={clearDirectoryFilters}>Reset all</button>}
              </div>
            </div>
            {directoryLoading ? <div className="ci-loading" role="status">Loading Dallas churches…</div>
              : directoryError ? <div className="ci-alert" role="alert"><div><strong>Church Intelligence could not load.</strong><span>{directoryError}</span></div><button type="button" onClick={refreshDirectory}>Try again</button></div>
              : view === "map" ? <><div className="ci-map-summary"><strong>{filteredDirectory.filter(row => row.latitude != null && row.longitude != null).length}</strong> of {filteredDirectory.length} matching churches shown on the map.</div><DallasMap rows={filteredDirectory} onSelect={(orgId) => { setView("list"); void openOrgDetail(orgId); }} /></>
              : directory.length ? filteredDirectory.length ? <div className="ci-church-list">{filteredDirectory.map(row => {
                const missing = [!row.address_line_1 && "address", !row.denomination && "denomination"].filter(Boolean);
                return <article className="ci-church-row" key={row.id}>
                  <button type="button" className="ci-church-main" onClick={() => openOrgDetail(row.id)}>
                    <span className="ci-church-mark" aria-hidden="true">{(row.canonical_name || "C").trim().charAt(0).toUpperCase()}</span>
                    <span className="ci-church-copy"><strong>{row.canonical_name || "Unnamed church"}</strong><span>{row.address_line_1 ? `${row.address_line_1} · ${row.locality}, ${row.region_code} ${row.postal_code || ""}` : "Address not recorded"}</span></span>
                    <span className="ci-church-denomination">{row.denomination || "Denomination not recorded"}</span>
                  </button>
                  <div className="ci-church-actions">
                    {missing.length ? <Badge tone="warn">Needs {missing.join(" + ")}</Badge> : <Badge tone="good">Basics complete</Badge>}
                    {row.linked_to_faithbid && <Badge tone="neutral">On FaithBid</Badge>}
                    <button type="button" className="ci-link-btn" onClick={() => openOrgDetail(row.id)} aria-label={`View ${row.canonical_name || "church"}`}>Open →</button>
                  </div>
                </article>})}</div> : <Empty eyebrow="No matches" title="No churches match that search." detail="Reset the filters or try another church name, street, city, or ZIP code." />
              : <Empty eyebrow="Dallas church directory" title="No churches have been added yet." detail="Add the first church to begin building the Dallas list." />}
          </>
      )}

    </div>

    {showNewOrgModal && <NewOrgModal sources={sources} directory={directory} busy={busy} onClose={() => setShowNewOrgModal(false)} onSubmit={async (bundle, reason) => {
      setBusy(true);
      try { await callRpc("ci_create_research_bundle", { p_bundle: bundle, p_reason: reason }, "Create research bundle");
        notify("success", "Church added to the Dallas directory."); setShowNewOrgModal(false); await refreshDirectory();
      } catch (err) { notify("error", err?.message || "Could not add this church."); }
      finally { setBusy(false); }
    }} />}
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
          </section>
          <section className="ci-account-card">
            <div><p className="ci-eyebrow">FaithBid account</p><h3>{overviewRow?.linked_to_faithbid ? "Connected" : "Not connected yet"}</h3><p>{overviewRow?.linked_to_faithbid ? "This research record is already linked to a FaithBid church account." : "Check for an existing church account before creating or linking anything manually."}</p></div>
            {overviewRow?.linked_to_faithbid ? <Badge tone="good">On FaithBid</Badge> : <button type="button" disabled={matchLoading} onClick={onCheckMatch}>{matchLoading ? "Checking…" : "Find matching account"}</button>}
          </section>
        </div>

        {matchResults !== undefined && !overviewRow?.linked_to_faithbid && <section className="ci-match-panel"><h3>Possible FaithBid accounts</h3>{matchResults.length ? matchResults.map(match => <div key={match.profile_id} className="ci-match-row"><div><strong>{match.org_name || "Unnamed account"}</strong><span className="ci-addr-sub">{match.city}, {match.state_code}{match.denomination ? ` · ${match.denomination}` : ""} · {Math.round(match.name_similarity * 100)}% name match{match.city_match ? " · same city" : ""}</span></div><button type="button" disabled={busy} onClick={() => onLinkMatch(match.profile_id)}>{busy ? "Linking…" : "Link this account"}</button></div>) : <p className="ci-muted">No likely FaithBid account was found. Nothing was changed.</p>}</section>}

        {detail.campuses?.length > 1 && <>
          <h3>Campuses</h3>
          <div className="ci-table-wrap"><table className="ci-table"><thead><tr><th>Campus</th><th>Primary</th></tr></thead><tbody>{detail.campuses.map(c => <tr key={c.id}><td>{c.campus_name}</td><td>{c.is_primary ? "Yes" : "No"}</td></tr>)}</tbody></table></div>
        </>}

        <h3>Information on file</h3>
        {currentClaims.length ? <div className="ci-facts-list">{currentClaims.map(claim => <div key={claim.id}><span>{claim.attribute_key.replace(/_/g, " ")}</span><strong>{formatClaimValue(claim.asserted_value)}</strong></div>)}</div> : <p className="ci-muted">No additional information is on file yet.</p>}
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
        const color = "#286046";
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

  return <div className="ci-map-wrap">{mapError ? <div className="ci-alert" role="alert"><div><strong>Map unavailable.</strong><span>{mapError}</span></div></div> : null}<div ref={containerRef} className="ci-map" /><div className="ci-map-legend"><span><i style={{ background: "#286046" }} />Church in the directory</span></div></div>;
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
