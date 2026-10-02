import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { isHttpUrl } from "./vendorCredentialUtils";

const SOCIAL_FIELDS = [
  ["facebook", "Facebook"],
  ["instagram", "Instagram"],
  ["linkedin", "LinkedIn"],
  ["youtube", "YouTube"],
  ["x", "X"],
];
const SIZE_OPTIONS = [
  ["under_100", "Under 100"],
  ["100_300", "100 – 300"],
  ["300_1000", "300 – 1,000"],
  ["over_1000", "Over 1,000"],
];
const CONTACT_OPTIONS = [
  ["platform_messages", "FaithBid messages"],
  ["email", "Email"],
  ["phone", "Phone"],
];
const KIND_LABEL = { insurance: "General liability insurance", license: "Business or trade license" };
const STATUS_LABEL = { submitted: "Under review", verified: "Verified", rejected: "Needs attention" };
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const card = { border: "1px solid #e9dfca", borderRadius: 18, background: "#fffdf8", padding: 20, marginBottom: 18 };
const heading = { fontFamily: "var(--font-display),serif", fontSize: 20, fontWeight: 700, color: "#1C2814", margin: "0 0 4px" };
const help = { fontSize: 13, color: "#5a5246", margin: "0 0 14px", lineHeight: 1.55 };
const label = { display: "block", fontSize: 12, fontWeight: 700, color: "#1C2814", marginBottom: 4 };
const input = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #dfd5c2", background: "#fff", fontSize: 14, fontFamily: "var(--font-sans),sans-serif" };
const button = { padding: "10px 18px", borderRadius: 999, border: "none", background: "#1C2814", color: "#fffdf8", fontWeight: 700, fontSize: 13, cursor: "pointer" };

export function VendorBusinessDetailsPanel({ vendorRow, currentUser, showToast = () => {}, onSaved = () => {} }) {
  const [website, setWebsite] = useState(vendorRow?.website || "");
  const [social, setSocial] = useState(vendorRow?.social_links && typeof vendorRow.social_links === "object" ? vendorRow.social_links : {});
  const [preference, setPreference] = useState(vendorRow?.contact_preference || "platform_messages");
  const [phone, setPhone] = useState("");
  const [sizes, setSizes] = useState(Array.isArray(vendorRow?.church_sizes_served) ? vendorRow.church_sizes_served : []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!vendorRow?.id) return;
    let cancelled = false;
    supabase.from("vendor_private_contact").select("phone").eq("vendor_id", vendorRow.id).maybeSingle()
      .then(({ data }) => { if (!cancelled && data?.phone) setPhone(data.phone); });
    return () => { cancelled = true; };
  }, [vendorRow?.id]);

  const save = async () => {
    if (saving || !vendorRow?.id) return;
    if (!isHttpUrl(website) || SOCIAL_FIELDS.some(([key]) => !isHttpUrl(social[key]))) {
      showToast("Links must start with http:// or https://", "error");
      return;
    }
    const cleanPhone = String(phone || "").trim();
    if (preference === "phone" && cleanPhone.length < 7) {
      showToast("Add a phone number to use phone as your contact preference.", "error");
      return;
    }
    const socialLinks = {};
    for (const [key] of SOCIAL_FIELDS) {
      const value = String(social[key] || "").trim();
      if (value) socialLinks[key] = value;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("vendors").update({
        website: String(website || "").trim() || null,
        social_links: socialLinks,
        contact_preference: preference,
        church_sizes_served: sizes,
      }).eq("id", vendorRow.id);
      if (error) throw error;
      if (cleanPhone) {
        const { error: phoneError } = await supabase.from("vendor_private_contact")
          .upsert({ vendor_id: vendorRow.id, user_id: currentUser.id, phone: cleanPhone, updated_at: new Date().toISOString() }, { onConflict: "vendor_id" });
        if (phoneError) throw phoneError;
      } else {
        await supabase.from("vendor_private_contact").delete().eq("vendor_id", vendorRow.id);
      }
      onSaved({ website: String(website || "").trim() || null, social_links: socialLinks, contact_preference: preference, church_sizes_served: sizes });
      showToast("Business details saved.");
    } catch {
      showToast("Could not save business details. Check the links and try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section style={card} aria-labelledby="vendor-business-details-title">
      <h3 id="vendor-business-details-title" style={heading}>Business details</h3>
      <p style={help}>Churches see your website and social links. Your phone number stays private until a church hires you.</p>
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={label} htmlFor="vbd-website">Website</label>
          <input id="vbd-website" style={input} type="url" inputMode="url" autoComplete="url" placeholder="https://yourbusiness.com" value={website} onChange={(event) => setWebsite(event.target.value)} maxLength={300} />
        </div>
        {SOCIAL_FIELDS.map(([key, name]) => (
          <div key={key}>
            <label style={label} htmlFor={`vbd-${key}`}>{name}</label>
            <input id={`vbd-${key}`} style={input} type="url" inputMode="url" placeholder={`https://${key === "x" ? "x.com" : `${key}.com`}/yourpage`} value={social[key] || ""} onChange={(event) => setSocial((prev) => ({ ...prev, [key]: event.target.value }))} maxLength={300} />
          </div>
        ))}
        <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
          <legend style={label}>Church sizes you serve</legend>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {SIZE_OPTIONS.map(([value, name]) => (
              <label key={value} style={{ fontSize: 13, display: "inline-flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={sizes.includes(value)} onChange={(event) => setSizes((prev) => event.target.checked ? [...prev, value] : prev.filter((item) => item !== value))} />
                {name}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label style={label} htmlFor="vbd-contact">How should churches reach you?</label>
          <select id="vbd-contact" style={input} value={preference} onChange={(event) => setPreference(event.target.value)}>
            {CONTACT_OPTIONS.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
          </select>
        </div>
        <div>
          <label style={label} htmlFor="vbd-phone">Phone (private)</label>
          <input id="vbd-phone" style={input} type="tel" autoComplete="tel" placeholder="(214) 555-0182" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={30} />
        </div>
        <div><button type="button" style={{ ...button, opacity: saving ? 0.6 : 1 }} onClick={save} disabled={saving}>{saving ? "Saving…" : "Save business details"}</button></div>
      </div>
    </section>
  );
}

export function VendorCredentialsPanel({ vendorRow, currentUser, showToast = () => {} }) {
  const [rows, setRows] = useState([]);
  const [busyKind, setBusyKind] = useState("");
  const [forms, setForms] = useState({ insurance: { reference: "", expires: "" }, license: { reference: "", expires: "" } });
  const vendorId = vendorRow?.id || null;

  const load = useCallback(async () => {
    if (!vendorId) return;
    const { data } = await supabase.from("vendor_credentials")
      .select("id,kind,status,reference_number,expires_on,admin_notes,submitted_at,verified_at").eq("vendor_id", vendorId);
    setRows(data || []);
  }, [vendorId]);
  useEffect(() => {
    if (!vendorId) return undefined;
    let cancelled = false;
    supabase.from("vendor_credentials")
      .select("id,kind,status,reference_number,expires_on,admin_notes,submitted_at,verified_at")
      .eq("vendor_id", vendorId)
      .then(({ data }) => { if (!cancelled) setRows(data || []); });
    return () => { cancelled = true; };
  }, [vendorId]);

  const setField = (kind, field, value) => setForms((prev) => ({ ...prev, [kind]: { ...prev[kind], [field]: value } }));

  const submit = async (kind, file) => {
    if (busyKind || !currentUser?.id) return;
    const form = forms[kind];
    const existing = rows.find((row) => row.kind === kind);
    if (!file && !existing) { showToast("Attach a copy of the document.", "error"); return; }
    if (file && !ALLOWED_TYPES.includes(file.type)) { showToast("Upload a PDF, JPG, PNG or WebP file.", "error"); return; }
    if (file && file.size > MAX_FILE_BYTES) { showToast("That file is over 10 MB.", "error"); return; }
    if (form.expires && form.expires < new Date().toISOString().slice(0, 10)) { showToast("The expiry date is in the past.", "error"); return; }
    setBusyKind(kind);
    try {
      let path = null;
      if (file) {
        const extension = (file.name.split(".").pop() || "pdf").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "pdf";
        path = `${currentUser.id}/${kind}-${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("vendor-credentials").upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
      }
      const { error } = await supabase.rpc("kb_vendor_submit_credential_v1", {
        p_kind: kind,
        p_reference: form.reference || null,
        p_expires_on: form.expires || null,
        p_document_path: path,
      });
      if (error) throw error;
      showToast("Submitted for review.");
      load();
    } catch {
      showToast("Could not submit that document. Please try again.", "error");
    } finally {
      setBusyKind("");
    }
  };

  return (
    <section style={card} aria-labelledby="vendor-credentials-title">
      <h3 id="vendor-credentials-title" style={heading}>Insurance and license</h3>
      <p style={help}>Upload your documents once. A FaithBid team member reviews them. Churches see a &ldquo;Verified&rdquo; badge and the expiry date, never your documents.</p>
      <div style={{ display: "grid", gap: 16 }}>
        {Object.keys(KIND_LABEL).map((kind) => {
          const row = rows.find((item) => item.kind === kind);
          return (
            <div key={kind} style={{ borderTop: "1px solid #f0e9d9", paddingTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                <strong style={{ fontSize: 14, color: "#1C2814" }}>{KIND_LABEL[kind]}</strong>
                {row ? <span style={{ fontSize: 12, fontWeight: 700, color: row.status === "verified" ? "#2b6b3f" : row.status === "rejected" ? "#9b2c22" : "#8a6a1f" }}>{STATUS_LABEL[row.status]}{row.status === "verified" && row.expires_on ? ` · expires ${row.expires_on}` : ""}</span> : <span style={{ fontSize: 12, color: "#7a7062" }}>Not submitted</span>}
              </div>
              {row?.status === "rejected" && row.admin_notes ? <p style={{ ...help, color: "#9b2c22" }}>{row.admin_notes}</p> : null}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
                <div>
                  <label style={label} htmlFor={`vc-ref-${kind}`}>{kind === "insurance" ? "Policy number" : "License number"}</label>
                  <input id={`vc-ref-${kind}`} style={input} value={forms[kind].reference} onChange={(event) => setField(kind, "reference", event.target.value)} maxLength={80} />
                </div>
                <div>
                  <label style={label} htmlFor={`vc-exp-${kind}`}>Expires on</label>
                  <input id={`vc-exp-${kind}`} style={input} type="date" value={forms[kind].expires} onChange={(event) => setField(kind, "expires", event.target.value)} />
                </div>
                <div>
                  <label style={label} htmlFor={`vc-file-${kind}`}>Document (PDF or image)</label>
                  <input id={`vc-file-${kind}`} style={{ ...input, padding: 8 }} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={busyKind === kind} onChange={(event) => { const file = event.target.files?.[0]; if (file) submit(kind, file); event.target.value = ""; }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function VendorVerifiedCredentials({ vendorId, compact = false }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (!vendorId) return undefined;
    let cancelled = false;
    supabase.rpc("kb_vendor_public_credentials_v1", { p_vendor_id: vendorId })
      .then(({ data, error }) => { if (!cancelled && !error) setRows(data || []); });
    return () => { cancelled = true; };
  }, [vendorId]);
  if (!rows.length) return null;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: compact ? "6px 0" : "10px 0" }}>
      {rows.map((row) => (
        <span key={row.kind} style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "#eef6ee", color: "#2b6b3f", border: "1px solid #cfe3cf" }}>
          {row.kind === "insurance" ? "Insurance verified" : "License verified"}{row.expires_on ? ` · through ${row.expires_on}` : ""}
        </span>
      ))}
    </div>
  );
}

const SOCIAL_LABEL = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", youtube: "YouTube", x: "X" };

// Website, social links and (only for a church that has hired this vendor) phone.
export function VendorPublicContact({ vendorId }) {
  const [info, setInfo] = useState(null);
  const [phone, setPhone] = useState("");
  useEffect(() => {
    if (!vendorId) return undefined;
    let cancelled = false;
    supabase.from("vendors").select("website,social_links,contact_preference").eq("id", vendorId).maybeSingle()
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setInfo(data);
        if (data.contact_preference === "phone") {
          supabase.rpc("kb_vendor_phone_for_church_v1", { p_vendor_id: vendorId })
            .then(({ data: number }) => { if (!cancelled && number) setPhone(number); });
        }
      });
    return () => { cancelled = true; };
  }, [vendorId]);

  if (!info) return null;
  const links = Object.entries(info.social_links || {}).filter(([key, value]) => SOCIAL_LABEL[key] && isHttpUrl(value) && value);
  const hasWebsite = info.website && isHttpUrl(info.website);
  if (!hasWebsite && !links.length && !phone) return null;
  const linkStyle = { color: "#74551f", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 2 };
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "12px 0", fontSize: 14 }}>
      {hasWebsite ? <a href={info.website} target="_blank" rel="noopener noreferrer nofollow" style={linkStyle}>Website</a> : null}
      {links.map(([key, value]) => <a key={key} href={value} target="_blank" rel="noopener noreferrer nofollow" style={linkStyle}>{SOCIAL_LABEL[key]}</a>)}
      {phone ? <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} style={linkStyle}>{phone}</a> : null}
    </div>
  );
}
