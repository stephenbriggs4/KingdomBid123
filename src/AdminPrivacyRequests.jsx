import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const KIND_LABEL = { deletion: "Account deletion", export: "Data export", correction: "Data correction" };
const STATUS_LABEL = { open: "Open", in_progress: "In progress", completed: "Completed", declined: "Declined" };

export default function AdminPrivacyRequests({ showToast = () => {} }) {
  const [rows, setRows] = useState([]);
  const [state, setState] = useState("loading");
  const [busyId, setBusyId] = useState("");
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    setState("loading");
    const { data, error } = await supabase.rpc("kb_admin_list_privacy_requests");
    if (error) { setState("error"); return; }
    setRows(data || []);
    setState("ready");
  }, []);
  useEffect(() => {
    let cancelled = false;
    supabase.rpc("kb_admin_list_privacy_requests").then(({ data, error }) => {
      if (cancelled) return;
      if (error) { setState("error"); return; }
      setRows(data || []);
      setState("ready");
    });
    return () => { cancelled = true; };
  }, []);

  const resolve = async (row, status) => {
    if (busyId) return;
    if (status === "completed" && row.kind === "deletion" && !window.confirm("Mark this deletion as completed? Only do this after the data has actually been removed under the Data Deletion Request Process.")) return;
    setBusyId(row.id);
    const { error } = await supabase.rpc("kb_admin_resolve_privacy_request", {
      p_id: row.id,
      p_status: status,
      p_notes: notes[row.id] ?? row.admin_notes ?? null,
    });
    setBusyId("");
    if (error) { showToast("Could not update that request. Try again."); return; }
    showToast("Request updated.");
    load();
  };

  const active = rows.filter(row => row.status === "open" || row.status === "in_progress");
  return (
    <>
      <header className="admin-page-heading">
        <div className="admin-page-eyebrow">Privacy</div>
        <h1 className="admin-page-title">Privacy Requests</h1>
        <p className="admin-page-copy">Account deletion, data export and correction requests. Nothing is removed automatically: verify the person, complete the work under the Data Deletion Request Process, then mark it done here.</p>
      </header>
      {state === "error" ? (
        <div className="admin-inline-notice warning" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span>Privacy requests could not be loaded.</span>
          <button type="button" className="act-btn act-view" onClick={load}>Retry</button>
        </div>
      ) : state === "loading" ? (
        <p className="admin-page-copy">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="admin-page-copy">No privacy requests yet.</p>
      ) : (
        <>
          <p className="admin-page-copy" style={{ marginBottom: 12 }}>{active.length} open · {rows.length} total</p>
          <div style={{ display: "grid", gap: 12 }}>
            {rows.map(row => {
              const isActive = row.status === "open" || row.status === "in_progress";
              return (
                <section key={row.id} className="admin-card" style={{ padding: 16, border: "1px solid rgba(28,40,20,.12)", borderRadius: 12, background: "#fffdf8" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <strong>{KIND_LABEL[row.kind] || row.kind}</strong>
                    <span>{STATUS_LABEL[row.status] || row.status} · {new Date(row.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 13, margin: "6px 0 10px", color: "#4a5043" }}>{row.email}{row.details ? ` — ${row.details}` : ""}</div>
                  <textarea
                    aria-label={`Notes for ${row.email}`}
                    rows={2}
                    maxLength={4000}
                    placeholder="Internal notes (what was verified, what was done)"
                    value={notes[row.id] ?? row.admin_notes ?? ""}
                    onChange={event => setNotes(prev => ({ ...prev, [row.id]: event.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 8, border: "1px solid rgba(28,40,20,.18)", font: "inherit" }}
                  />
                  {isActive ? (
                    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                      {row.status === "open" ? <button type="button" className="act-btn act-view" disabled={!!busyId} onClick={() => resolve(row, "in_progress")}>Start work</button> : null}
                      <button type="button" className="act-btn act-view" disabled={!!busyId} onClick={() => resolve(row, "completed")}>Mark completed</button>
                      <button type="button" className="act-btn" disabled={!!busyId} onClick={() => resolve(row, "declined")}>Decline</button>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
