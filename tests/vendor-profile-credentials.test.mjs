import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const mig = read('../supabase/migrations/20260928180549_vendor_profile_credentials.sql');
const profile = read('../src/ProfileScreen.jsx');
const panel = read('../src/VendorCredentialsPanel.jsx');
const admin = read('../src/AdminScreen.jsx');
const adminCred = read('../src/AdminVendorCredentials.jsx');
const app = read('../src/App.jsx');
const has = (src, re, msg) => assert.ok(re.test(src), msg);

// Root cause of the profile drift: the query requested columns that do not exist on vendors.
for (const bad of ['description', 'phone', 'instagram']) {
  assert.ok(!new RegExp(`vendorBaseColumns = "[^"]*[,"]${bad}[,"]`).test(profile), `profile no longer asks vendors for a nonexistent "${bad}" column`);
}
has(profile, /verification_status,website,social_links,contact_preference/, 'profile loads the new public business fields');
has(profile, /<VendorBusinessDetailsPanel/, 'vendor tab shows business details');
has(profile, /<VendorCredentialsPanel/, 'vendor tab shows credential upload');
has(panel, /accept="application\/pdf,image\/jpeg,image\/png,image\/webp"/, 'upload accepts documents and images only');
has(panel, /rpc\("kb_vendor_submit_credential_v1"/, 'vendors submit credentials through the RPC (status cannot be self-set)');
has(panel, /rpc\("kb_vendor_public_credentials_v1"/, 'churches see verified credentials through the public RPC');
has(panel, /rel="noopener noreferrer nofollow"/, 'external vendor links are safe');
has(admin, /adminView==="credentials" && <AdminVendorCredentials/, 'admin can review credentials');
has(adminCred, /createSignedUrl\(row\.document_path, 300\)/, 'admin opens documents via short-lived signed URLs');
has(app, /<VendorVerifiedCredentials vendorId=\{v\.id\}/, 'church-facing vendor profile shows verified credentials');
has(mig, /vendor-credentials', 'vendor-credentials', false/, 'credential bucket is private');
has(mig, /kb_admin_decide_vendor_credential_v1[\s\S]{0,1400}insert into public\.admin_audit_log/, 'credential decisions are audited');
has(mig, /revoke all on public\.vendor_credentials from anon, authenticated/, 'no direct credential writes');
console.log('vendor-profile-credentials: ok');
