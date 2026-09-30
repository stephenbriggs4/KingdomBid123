import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const admin = read('../src/AdminScreen.jsx');
const mig = read('../supabase/migrations/20260928174852_project_origin_audit.sql');
const has = (src, re, msg) => assert.ok(re.test(src), msg);

has(admin, /ADMIN_PROJECT_ORIGIN_LABEL = \{ real: 'Real', qa: 'Test', synthetic: 'Demo', unclassified: 'Unclassified' \}/, 'admin sees Real / Test / Demo labels');
has(admin, /rpc\('kb_admin_set_project_record_origin_v0'/, 'admin classifies through the audited RPC');
has(admin, /Reason to classify/, 'a reason is requested before classifying');
has(admin, /setAdminProjectPreviewId/, 'admin can preview a project before removing or restoring it');
has(admin, /select\('id,title,description,timeline,/, 'preview loads description and timeline');
has(admin, /useState\("attention"\)/, 'Users & Access no longer opens on an empty New-this-week view');
has(admin, /setUserTriageMode\(adminUsersNeedingReview\.length > 0 \? "attention" : "all"\)/, 'Users falls back to the full list when nothing needs review');
has(mig, /insert into public\.admin_audit_log/, 'classification writes an audit-log row');
has(mig, /char_length\(v_reason\) < 5/, 'classification requires a reason');
console.log('admin-project-classification: ok');
