import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const KIND_LABEL = { insurance: "Insurance", license: "License" };
const STATUS_LABEL = { submitted: "Needs review", verified: "Verified", rejected: "Rejected" };

export default function AdminVendorCredentials({ showToast = () => {} }) {
  const [rows, setRows] = useState([]);
  const [state, setState] = useState("loading");
  const [busyId, setBusyId] = useState("");
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    setState("loading");
    const { data, error } = await supabase.rpc("kb_admin_list_vendor_credentials_v1");
    if (error) { setState("error"); return; }
    setRows(data || []);
    setState("ready");
  }, []);
  useEffect(() => { load(); }, [load]);

  const openDocument = async (row) => {
    if (!row.document_path) { showToast("No document was attached.", "error"); return; }
    const { data, error } = await supabase.storage.from("vendor-credentials").createSignedUrl(row.document_path, 300);
    if (error || !data?.signedUrl) { showToast("Could not open that document.", "error"); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const decide = async (row, status) => {
    if (busyId) return;
    const note = notes[row.id] ?? "";
    if (status === "rejected" && note.trim().length < 5) { showToast("Add a short reason so the vendor knows what to fix.", "error"); return; }
    setBusyId(row.id);
    const { error } = await supabase.rpc("kb_admin_decide_vendor_credential_v1", { p_id: row.id, p_status: status, p_notes: note || null });
    setBusyId("");
    if (error) { showToast("Could not save that decision.", "error"); return; }
    showToast(status === "verified" ? "Credential verified." : "Credential rejected.");
    load();
  };

  const waiting = rows.filter((row) => row.status === "submitted").length;
  return (
    <>
      <header className="admin-page-heading">
        <div className="admin-page-eyebrow">Trust</div>
        <h1 className="admin-page-title">Vendor Credentials</h1>
        <p className="admin-page-copy">Insurance and license documents submitted by vendors. Check the document, then verify or reject with a reason. Churches see only the verified badge and expiry date.</p>
      </header>
      {state === "error" ? (
        <div className="admin-inline-notice warning" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span>Credentials could not be loaded.</span><button type="button" className="act-btn act-view" onClick={load}>Retry</button>
        </div>
      ) : state === "loading" ? <p className="admin-page-copy">Loading…</p> : rows.length === 0 ? <p className="admin-page-copy">No credentials submitted yet.</p> : (
        <>
          <p className="admin-page-copy" style={{ marginBottom: 12 }}>{waiting} waiting · {rows.length} total</p>
          <div style={{ display: "grid", gap: 12 }}>
            {rows.map((row) => (
              <section key={row.id} style={{ padding: 16, border: "1px solid rgba(28,40,20,.12)", borderRadius: 12, background: "#fffdf8" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <strong>{row.vendor_name || "Vendor"} · {KIND_LABEL[row.kind] || row.kind}</strong>
                  <span>{STATUS_LABEL[row.status] || row.status}</span>
                </div>
                <div style={{ fontSize: 13, margin: "6px 0 10px", color: "#4a5043" }}>
                  {row.reference_number ? `Number: ${row.reference_number} · ` : ""}{row.expires_on ? `Expires ${row.expires_on} · ` : ""}Submitted {new Date(row.submitted_at).toLocaleDateString()}
                </div>
                <textarea aria-label={`Notes for ${row.vendor_name || "vendor"} ${row.kind}`} rows={2} maxLength={2000} placeholder="Reason or notes (required to reject)" value={notes[row.id] ?? row.admin_notes ?? ""} onChange={(event) => setNotes((prev) => ({ ...prev, [row.id]: event.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 8, border: "1px solid rgba(28,40,20,.18)", font: "inherit" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <button type="button" className="act-btn act-view" onClick={() => openDocument(row)}>Open document</button>
                  <button type="button" className="act-btn act-view" disabled={!!busyId} onClick={() => decide(row, "verified")}>Verify</button>
                  <button type="button" className="act-btn" disabled={!!busyId} onClick={() => decide(row, "rejected")}>Reject</button>
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
}
