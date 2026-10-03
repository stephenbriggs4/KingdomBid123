import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { withRequestDeadline } from "./supabaseReliability";
import "leaflet/dist/leaflet.css";
import "./styles/church-intelligence.css";

const TABS = [["home","Overview"],["churches","All Churches"],["map","Map"]];

const OPERATING_STATES = ["active","inactive","unknown"];

async function sha256Hex(input) {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
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
  const [tab, setTab] = useState("home");
  const [banner, setBanner] = useState(null);

  const purpose = "research";

  const [directory, setDirectory] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState("");
  const [directorySearch, setDirectorySearch] = useState("");
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
  const churchesWithAddresses = useMemo(() => directory.filter(d => d.address_line_1).length, [directory]);
  const churchesWithDenominations = useMemo(() => directory.filter(d => d.denomination).length, [directory]);
  const churchesOnFaithBid = useMemo(() => directory.filter(d => d.linked_to_faithbid).length, [directory]);
  const mappedChurches = useMemo(() => directory.filter(d => d.latitude != null && d.longitude != null).length, [directory]);

  if (!isAdmin) return <div className="ci-denied"><p className="ci-eyebrow">Internal workspace</p><h1>Church Intelligence is restricted.</h1><p>This research workspace is available only to FaithBid platform administrators.</p><button type="button" onClick={() => nav?.("projects")}>Back to marketplace</button></div>;

  return <section className="ci-shell" aria-label="Church Intelligence">
    <header className="ci-hero">
      <div><p className="ci-eyebrow">FaithBid internal · Dallas V1</p><h1>Dallas Church Census</h1><p>One simple place to find every Dallas church, keep its basic information current, and see whether it already has a FaithBid account.</p></div>
      <div className="ci-actions"><span className={online ? "live" : ""}>{directoryLoading ? "Loading church list" : online ? "Church list ready" : "Church list needs attention"}</span><button type="button" onClick={refreshAll} disabled={directoryLoading}>{directoryLoading ? "Loading…" : "Refresh list"}</button></div>
    </header>

    <Banner banner={banner} onDismiss={() => setBanner(null)} />

    <nav className="ci-tabs" aria-label="Church Intelligence sections">{TABS.map(([id, label]) => <button key={id} type="button" className={tab === id ? "active" : ""} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>{label}</button>)}</nav>

    <div className="ci-panel">
      {tab === "home" && <CensusHome
        directoryLoading={directoryLoading}
        directoryError={directoryError}
        loadedRecords={directory.length}
        churchesWithAddresses={churchesWithAddresses}
        churchesWithDenominations={churchesWithDenominations}
        churchesOnFaithBid={churchesOnFaithBid}
        onNavigate={setTab}
        onAddChurch={() => setShowNewOrgModal(true)}
      />}

      {tab === "churches" && (
        selectedOrgId ? (
          <OrgDetail
            overviewRow={directory.find(d => d.id === selectedOrgId)}
            detail={orgDetail}
            loading={orgDetailLoading}
            error={orgDetailError}
            onBack={() => { setSelectedOrgId(null); setOrgDetail(null); }}
          />
        ) : (
          <>
            <div className="ci-panel-head">
              <div><p className="ci-eyebrow">Dallas church directory</p><h2>All Churches</h2><p className="ci-panel-intro">Search the churches currently in FaithBid's Dallas list. Open any church to see the information we have.</p></div>
              <div className="ci-panel-head-actions">
                <input className="ci-search" type="search" aria-label="Search churches" placeholder="Search name, street, or ZIP…" value={directorySearch} onChange={e => setDirectorySearch(e.target.value)} />
                <button type="button" onClick={() => setShowNewOrgModal(true)}>+ Add church</button>
              </div>
            </div>
            {directoryLoading ? <div className="ci-loading" role="status">Loading Dallas churches…</div>
              : directoryError ? <div className="ci-alert" role="alert"><div><strong>Church Intelligence could not load.</strong><span>{directoryError}</span></div><button type="button" onClick={refreshDirectory}>Try again</button></div>
              : directory.length ? (() => {
                  const q = directorySearch.trim().toLowerCase();
                  const rows = q ? directory.filter(d => [d.canonical_name, d.address_line_1, d.postal_code, d.locality].filter(Boolean).some(v => v.toLowerCase().includes(q))) : directory;
                  return rows.length ? <div className="ci-table-wrap"><table className="ci-table"><thead><tr><th>Church</th><th>Address</th><th>Denomination</th><th>FaithBid account</th><th /></tr></thead><tbody>{rows.map(row => <React.Fragment key={row.id}><tr>
                    <td><strong>{row.canonical_name || "Unnamed organization"}</strong></td>
                    <td>{row.address_line_1 ? <>{row.address_line_1}<span className="ci-addr-sub">{row.locality}, {row.region_code} {row.postal_code}</span></> : <span className="ci-muted">No address on file</span>}</td>
                    <td>{row.denomination || <span className="ci-muted">—</span>}</td>
                    <td>{row.linked_to_faithbid ? <Badge tone="good">Connected</Badge> : <button type="button" className="ci-badge-btn" disabled={matchLoadingId === row.id} onClick={() => checkMatch(row.id)}>{matchLoadingId === row.id ? "Checking…" : "Find account"}</button>}</td>
                    <td><button type="button" className="ci-link-btn" onClick={() => openOrgDetail(row.id)}>View →</button></td>
                  </tr>
                  {matchResults[row.id] !== undefined && <tr className="ci-detail-row"><td colSpan={5}><div className="ci-case-detail">
                    {matchResults[row.id].length ? matchResults[row.id].map(m => <div key={m.profile_id} className="ci-match-row">
                      <div><strong>{m.org_name || "Unnamed account"}</strong><span className="ci-addr-sub">{m.city}, {m.state_code} {m.denomination ? `· ${m.denomination}` : ""} · {Math.round(m.name_similarity * 100)}% name match{m.city_match ? " · same city" : ""}</span></div>
                      <button type="button" disabled={busy} onClick={() => linkMatch(row.id, m.profile_id)}>Link this account</button>
                    </div>) : <p className="ci-muted">No FaithBid church account looks like a match yet. This church likely hasn't signed up on FaithBid.</p>}
                  </div></td></tr>}
                  </React.Fragment>)}</tbody></table></div> : <Empty eyebrow="No matches" title="No churches match that search." detail="Try a different name, street, or zip code." />;
                })()
              : <Empty eyebrow="Dallas church directory" title="No churches have been added yet." detail="Add the first church to begin building the Dallas list." />}
          </>
        )
      )}

      {tab === "map" && (
        <>
          <div className="ci-panel-head"><div><p className="ci-eyebrow">Dallas church map</p><h2>Where the churches are</h2><p className="ci-panel-intro">Each marker is a church in the current directory with a mapped address.</p></div><span>{mappedChurches} of {directory.length} shown</span></div>
          {directoryLoading ? <div className="ci-loading" role="status">Loading church map…</div>
            : directoryError ? <div className="ci-alert" role="alert"><div><strong>The church map could not load.</strong><span>{directoryError}</span></div><button type="button" onClick={refreshDirectory}>Try again</button></div>
            : <DallasMap rows={directory} onSelect={(orgId) => { setTab("churches"); void openOrgDetail(orgId); }} />}
        </>
      )}

    </div>

    {showNewOrgModal && <NewOrgModal sources={sources} busy={busy} onClose={() => setShowNewOrgModal(false)} onSubmit={async (bundle, reason) => {
      setBusy(true);
      try { await callRpc("ci_create_research_bundle", { p_bundle: bundle, p_reason: reason }, "Create research bundle");
        notify("success", "Church added to the Dallas directory."); setShowNewOrgModal(false); await refreshDirectory();
      } catch (err) { notify("error", err?.message || "Could not add this church."); }
      finally { setBusy(false); }
    }} />}
  </section>;
}

function CensusHome({ directoryLoading, directoryError, loadedRecords, churchesWithAddresses, churchesWithDenominations, churchesOnFaithBid, onNavigate, onAddChurch }) {
  return <>
    <div className="ci-home-heading">
      <div><p className="ci-eyebrow">The goal</p><h2>Every church in Dallas, in one useful list</h2><p>Find the churches, keep their basic information current, and know which ones already have a FaithBid account.</p></div>
      <div className="ci-home-actions"><button type="button" onClick={() => onNavigate("churches")}>View all churches</button><button type="button" className="ci-btn-secondary" onClick={onAddChurch}>Add a church</button></div>
    </div>

    {directoryError ? <div className="ci-alert" role="alert"><div><strong>The Dallas church list could not load.</strong><span>{directoryError}</span></div></div> : null}

    <div className="ci-metrics">
      <Metric label="Churches found" value={directoryLoading ? "—" : loadedRecords} detail="Currently in the Dallas directory" tone="green" />
      <Metric label="Addresses on file" value={directoryLoading ? "—" : churchesWithAddresses} detail="Churches we can place on the map" />
      <Metric label="Denominations known" value={directoryLoading ? "—" : churchesWithDenominations} detail="Churches with a tradition recorded" />
      <Metric label="On FaithBid" value={directoryLoading ? "—" : churchesOnFaithBid} detail="Connected to an existing church account" />
    </div>

    <div className="ci-simple-plan">
      <div><p className="ci-eyebrow">What this tab is for</p><h3>Build the complete Dallas church directory</h3><p>The current number is a starting point, not the final Dallas total. We will keep adding churches until the list is complete enough to use for the pilot.</p></div>
      <ol><li><strong>Find every church</strong><span>Add missing Dallas congregations.</span></li><li><strong>Fill in the basics</strong><span>Name, address, denomination, website, and phone.</span></li><li><strong>Connect FaithBid accounts</strong><span>Match churches that have already joined the platform.</span></li></ol>
    </div>
  </>;
}

function formatClaimValue(value) {
  if (value == null) return "Not recorded";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(formatClaimValue).join(", ");
  return Object.values(value).every(v => ["string", "number", "boolean"].includes(typeof v))
    ? Object.values(value).join(" · ")
    : JSON.stringify(value);
}

function OrgDetail({ detail, overviewRow, loading, error, onBack }) {
  return <>
    <div className="ci-panel-head"><div><p className="ci-eyebrow">Church details</p><h2>{detail?.organization?.canonical_name || "Church"}</h2></div><button type="button" className="ci-btn-secondary" onClick={onBack}>← Back to all churches</button></div>
    {loading ? <div className="ci-loading" role="status">Loading church profile…</div>
      : error ? <div className="ci-alert" role="alert"><div><strong>Could not load this church.</strong><span>{error}</span></div></div>
      : !detail ? null : <div className="ci-church360">
        <div className="ci-profile-card">
          <div className="ci-profile-row"><span>Address</span><strong>{overviewRow?.address_line_1 ? `${overviewRow.address_line_1}, ${overviewRow.locality}, ${overviewRow.region_code} ${overviewRow.postal_code}` : "Not on file"}</strong></div>
          <div className="ci-profile-row"><span>Denomination</span><strong>{overviewRow?.denomination || "Not recorded"}</strong></div>
          <div className="ci-profile-row"><span>FaithBid account</span>{overviewRow?.linked_to_faithbid ? <Badge tone="good">Connected</Badge> : <Badge tone="neutral">Not connected</Badge>}</div>
        </div>

        {detail.campuses?.length > 1 && <>
          <h3>Campuses</h3>
          <div className="ci-table-wrap"><table className="ci-table"><thead><tr><th>Campus</th><th>Primary</th></tr></thead><tbody>{detail.campuses.map(c => <tr key={c.id}><td>{c.campus_name}</td><td>{c.is_primary ? "Yes" : "No"}</td></tr>)}</tbody></table></div>
        </>}

        <h3>Information on file</h3>
        {detail.claims?.length ? <div className="ci-table-wrap"><table className="ci-table"><thead><tr><th>Information</th><th>What we have</th></tr></thead><tbody>{detail.claims.filter(claim => claim.claim_status !== "rejected" && claim.claim_status !== "superseded").map(claim => <tr key={claim.id}><td>{claim.attribute_key.replace(/_/g, " ")}</td><td><strong>{formatClaimValue(claim.asserted_value)}</strong></td></tr>)}</tbody></table></div> : <p className="ci-muted">No additional information is on file yet.</p>}
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

function NewOrgModal({ sources, busy, onClose, onSubmit }) {
  const [name, setName] = useState(""); const [state, setState] = useState("active"); const [campus, setCampus] = useState("");
  const [addr1, setAddr1] = useState(""); const [addr2, setAddr2] = useState(""); const [locality, setLocality] = useState("Dallas"); const [region, setRegion] = useState("TX"); const [postal, setPostal] = useState("");
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState("");
  const source = sources.find(item => item.source_key?.includes("manual")) || sources[0];

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
      <Field label="Church name *"><input value={name} onChange={e => setName(e.target.value)} placeholder="First Baptist Church of Dallas" /></Field>
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
