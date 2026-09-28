import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const mig = read('../supabase/migrations/20260928200000_church_size_matching.sql');
const app = read('../src/App.jsx');
const profile = read('../src/ProfileScreen.jsx');
const panel = read('../src/VendorCredentialsPanel.jsx');
const has = (src, re, msg) => assert.ok(re.test(src), msg);

has(mig, /congregation_size in \('under_100','100_300','300_1000','over_1000'\)/, 'profile size uses fixed buckets');
has(mig, /kb_project_church_size_snapshot_v1[\s\S]{0,400}from public\.profiles/, 'project size is snapshotted server-side');
has(mig, /'congregation_size'\]::text\[\]/, 'profile save RPC accepts congregation_size');
has(profile, /id="ob-size"/, 'church profile has a congregation size field');
has(profile, /congregation_size: role === "church"/, 'only churches save a congregation size');
has(panel, /Church sizes you serve/, 'vendors declare the church sizes they serve');
has(app, /const sizeFit = sizeKnown && vendorSizes\.includes\(churchSize\)/, 'matching compares church size to sizes served');
has(app, /size: sizeFit \? 6 : 0/, 'size fit adds a bounded score component');
has(app, /church_id,church_size,church_name/, 'project reads include church_size');
has(app, /created_at,church_sizes_served"/, 'vendor directory reads include church_sizes_served');
console.log('church-size-matching: ok');
