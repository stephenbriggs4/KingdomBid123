import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export const ATTACH_MAX_BYTES = 15 * 1024 * 1024;
export const ATTACH_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt,.csv";
const ALLOWED_TYPES = new Set([
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg", "image/png", "image/webp", "text/plain", "text/csv",
]);

export function formatFileSize(bytes) {
  const n = Number(bytes) || 0;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

// Returns { ok, files, error } for a candidate list added to an existing selection.
export function validateAttachmentFiles(existing = [], incoming = [], maxFiles = 5) {
  const next = [...existing];
  for (const file of incoming) {
    if (!ALLOWED_TYPES.has(file.type)) return { ok: false, files: existing, error: `"${file.name}" is not a supported file type.` };
    if (file.size > ATTACH_MAX_BYTES) return { ok: false, files: existing, error: `"${file.name}" is over 15 MB.` };
    if (file.size <= 0) return { ok: false, files: existing, error: `"${file.name}" is empty.` };
    if (next.length >= maxFiles) return { ok: false, files: existing, error: `You can attach up to ${maxFiles} files.` };
    next.push(file);
  }
  return { ok: true, files: next, error: "" };
}

function safeExtension(name) {
  return (String(name).split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
}

async function uploadFiles({ bucket, table, folder, userId, rowBase, files }) {
  let uploaded = 0;
  const failed = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const path = `${userId}/${folder}/${Date.now()}-${index}.${safeExtension(file.name)}`;
    try {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { error: rowError } = await supabase.from(table).insert({
        ...rowBase, file_path: path, file_name: file.name.slice(0, 200), mime_type: file.type || null, size_bytes: file.size,
      });
      if (rowError) {
        await supabase.storage.from(bucket).remove([path]);
        throw rowError;
      }
      uploaded += 1;
    } catch {
      failed.push(file.name);
    }
  }
  return { uploaded, failed };
}

export function uploadBidAttachments({ bidId, userId, files }) {
  if (!bidId || !userId || !files?.length) return Promise.resolve({ uploaded: 0, failed: [] });
  return uploadFiles({ bucket: "bid-attachments", table: "bid_attachments", folder: bidId, userId, rowBase: { bid_id: bidId, vendor_user_id: userId }, files });
}

export function uploadProjectAttachments({ projectId, userId, files }) {
  if (!projectId || !userId || !files?.length) return Promise.resolve({ uploaded: 0, failed: [] });
  return uploadFiles({ bucket: "project-files", table: "project_attachments", folder: projectId, userId, rowBase: { project_id: projectId, church_id: userId }, files });
}

const box = { border: "1px dashed #d8ccb4", borderRadius: 12, padding: 12, background: "#fffdf8" };
const linkButton = { background: "none", border: "none", padding: 0, color: "#74551f", fontWeight: 700, textDecoration: "underline", cursor: "pointer", font: "inherit" };

// Chosen-but-not-yet-uploaded files (used inside forms).
export function FilePicker({ files, onChange, max = 5, label = "Attachments (optional)", help = "PDF, Word, Excel, PowerPoint or images. Up to 15 MB each.", disabled = false, showToast = () => {}, id = "kb-file-picker" }) {
  return (
    <div style={box}>
      <label htmlFor={id} style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#2e3038", marginBottom: 4 }}>{label}</label>
      <div style={{ fontSize: 12, color: "#6b6558", marginBottom: 8 }}>{help} Maximum {max} files.</div>
      <input
        id={id}
        type="file"
        multiple
        accept={ATTACH_ACCEPT}
        disabled={disabled || files.length >= max}
        onChange={(event) => {
          const result = validateAttachmentFiles(files, Array.from(event.target.files || []), max);
          if (!result.ok) showToast(result.error, "error");
          onChange(result.files);
          event.target.value = "";
        }}
      />
      {files.length ? (
        <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 6 }}>
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
              <span style={{ overflowWrap: "anywhere" }}>{file.name} <span style={{ color: "#8b8171" }}>({formatFileSize(file.size)})</span></span>
              <button type="button" style={linkButton} disabled={disabled} onClick={() => onChange(files.filter((_, i) => i !== index))} aria-label={`Remove ${file.name}`}>Remove</button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

async function openSigned(bucket, path, showToast) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
  if (error || !data?.signedUrl) { showToast("Could not open that file.", "error"); return; }
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}

function AttachmentRows({ rows, bucket, canDelete, table, onDeleted, showToast }) {
  const remove = async (row) => {
    if (!window.confirm(`Remove ${row.file_name}?`)) return;
    const { error } = await supabase.from(table).delete().eq("id", row.id);
    if (error) { showToast("Could not remove that file.", "error"); return; }
    await supabase.storage.from(bucket).remove([row.file_path]);
    onDeleted();
  };
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
      {rows.map((row) => (
        <li key={row.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, alignItems: "center" }}>
          <button type="button" style={{ ...linkButton, textAlign: "left", overflowWrap: "anywhere" }} onClick={() => openSigned(bucket, row.file_path, showToast)}>
            {row.file_name}
          </button>
          <span style={{ display: "inline-flex", gap: 10, alignItems: "center", color: "#8b8171", flexShrink: 0 }}>
            {formatFileSize(row.size_bytes)}
            {canDelete ? <button type="button" style={linkButton} onClick={() => remove(row)} aria-label={`Remove ${row.file_name}`}>Remove</button> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

function useAttachmentRows(table, column, id) {
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const load = useCallback(async () => {
    if (!id) { setRows([]); setLoaded(true); return; }
    const { data } = await supabase.from(table).select("id,file_path,file_name,mime_type,size_bytes,created_at").eq(column, id).order("created_at", { ascending: true });
    setRows(data || []);
    setLoaded(true);
  }, [table, column, id]);
  useEffect(() => { load(); }, [load]);
  return { rows, loaded, reload: load };
}

// Attachments on one proposal: churches read; the vendor who owns it can add/remove.
export function BidAttachmentList({ bidId, canEdit = false, userId = null, showToast = () => {}, heading = "Attachments" }) {
  const { rows, loaded, reload } = useAttachmentRows("bid_attachments", "bid_id", bidId);
  const [adding, setAdding] = useState([]);
  const [busy, setBusy] = useState(false);
  if (loaded && !rows.length && !canEdit) return null;
  const upload = async () => {
    if (busy || !adding.length) return;
    setBusy(true);
    const result = await uploadBidAttachments({ bidId, userId, files: adding });
    setBusy(false);
    setAdding([]);
    if (result.failed.length) showToast(`Could not upload: ${result.failed.join(", ")}`, "error"); else showToast("Files attached.");
    reload();
  };
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.4, color: "#4a5043", textTransform: "uppercase", marginBottom: 6 }}>{heading}</div>
      {rows.length ? <AttachmentRows rows={rows} bucket="bid-attachments" table="bid_attachments" canDelete={canEdit} onDeleted={reload} showToast={showToast} /> : <div style={{ fontSize: 13, color: "#8b8171" }}>No files attached.</div>}
      {canEdit && rows.length < 5 ? (
        <div style={{ marginTop: 8 }}>
          <FilePicker id={`kb-bid-files-${bidId}`} files={adding} onChange={setAdding} max={5 - rows.length} label="Add files" showToast={showToast} disabled={busy} />
          {adding.length ? <button type="button" style={{ ...linkButton, marginTop: 8 }} onClick={upload} disabled={busy}>{busy ? "Uploading…" : "Upload files"}</button> : null}
        </div>
      ) : null}
    </div>
  );
}

// Files on a project brief: visible to the owner, invited vendors and bidders.
export function ProjectFilesList({ projectId, canEdit = false, userId = null, showToast = () => {}, heading = "Project files" }) {
  const { rows, loaded, reload } = useAttachmentRows("project_attachments", "project_id", projectId);
  const [adding, setAdding] = useState([]);
  const [busy, setBusy] = useState(false);
  if (loaded && !rows.length && !canEdit) return null;
  const upload = async () => {
    if (busy || !adding.length) return;
    setBusy(true);
    const result = await uploadProjectAttachments({ projectId, userId, files: adding });
    setBusy(false);
    setAdding([]);
    if (result.failed.length) showToast(`Could not upload: ${result.failed.join(", ")}`, "error"); else showToast("Files attached.");
    reload();
  };
  return (
    <section style={{ margin: "18px 0" }} aria-label={heading}>
      <h2 className="kb-pdr-serif kb-pdr-section-title">{heading}</h2>
      {rows.length ? <AttachmentRows rows={rows} bucket="project-files" table="project_attachments" canDelete={canEdit} onDeleted={reload} showToast={showToast} /> : <div style={{ fontSize: 13, color: "#8b8171" }}>No files attached yet.</div>}
      {canEdit && rows.length < 10 ? (
        <div style={{ marginTop: 10 }}>
          <FilePicker id={`kb-project-files-${projectId}`} files={adding} onChange={setAdding} max={10 - rows.length} label="Add a brief, floor plan or RFP" showToast={showToast} disabled={busy} />
          {adding.length ? <button type="button" style={{ ...linkButton, marginTop: 8 }} onClick={upload} disabled={busy}>{busy ? "Uploading…" : "Upload files"}</button> : null}
        </div>
      ) : null}
    </section>
  );
}
