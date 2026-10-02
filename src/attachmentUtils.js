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
