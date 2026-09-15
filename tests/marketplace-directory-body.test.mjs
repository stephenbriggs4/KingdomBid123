import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/marketplace-v2.css', import.meta.url), 'utf8');
const directoryMigration = readFileSync(new URL('../supabase/migrations/20260915170203_marketplace_vendor_directory_body.sql', import.meta.url), 'utf8');
const nearbyMigration = readFileSync(new URL('../supabase/migrations/20260915170828_marketplace_vendor_nearby_sort.sql', import.meta.url), 'utf8');

test('church marketplace keeps the existing hero and replaces only the body', () => {
  assert.match(app, /<ChurchMarketplaceHero[\s\S]*?<main className="kb-marketplace-directory-body"/);
  assert.match(app, /\['All','Facilities','Creative','Technology','Marketing','Finance','Events','Ministry Support'\]/);
});

test('featured rail uses real modes, arrows, and pointer drag controls', () => {
  for (const label of ['Featured', 'Newest', 'Nearby']) assert.match(app, new RegExp(`>${label}<`));
  assert.match(app, /Scroll featured vendors left/);
  assert.match(app, /Scroll featured vendors right/);
  assert.match(app, /onPointerDown=\{handleRailPointerDown\}/);
  assert.match(app, /onPointerMove=\{handleRailPointerMove\}/);
  assert.match(app, /marketplace_vendor_curation/);
  assert.match(app, /kb_marketplace_vendor_distances_for_church/);
});

test('best match implements approved weights and honest missing-signal normalization', () => {
  assert.match(app, /key:'category', weight:40/);
  assert.match(app, /key:'proximity', weight:25/);
  assert.match(app, /key:'availability', weight:20/);
  assert.match(app, /key:'faith_verified', weight:15/);
  assert.match(app, /earned \/ availableWeight/);
  for (const option of ['Best match', 'Available first', 'A–Z']) assert.match(app, new RegExp(`<option>${option}</option>`));
});

test('availability is explicit and conversation state overrides it', () => {
  assert.match(app, /label:'In conversation'/);
  assert.match(app, /label:'Available'/);
  assert.match(app, /label:'Limited availability'/);
  assert.match(app, /label:'Availability not confirmed'/);
  assert.doesNotMatch(app.slice(app.indexOf('function MarketplaceVendorDirectoryCard'), app.indexOf('function AllVendorsLanding')), />Verified</);
  assert.match(app, /> Faith Verified</);
});

test('saved hearts persist through the authenticated saved_vendors table', () => {
  assert.match(app, /from\('saved_vendors'\)\s*\.select\('vendor_id'\)/);
  assert.match(app, /from\('saved_vendors'\)\.delete\(\)\.eq\('user_id', userId\)\.eq\('vendor_id', key\)/);
  assert.match(app, /from\('saved_vendors'\)\.upsert\(\{ user_id:userId, vendor_id:key \}/);
  assert.match(app, /aria-pressed=\{saved\}/);
});

test('empty states are truthful and never invent listings', () => {
  assert.match(app, /No vendors match those filters/);
  assert.match(app, /does not fill empty results with sample listings/);
  assert.match(app, /Approved vendors will appear here/);
});

test('directory body is fluid across laptop, monitor, large monitor, and mobile', () => {
  assert.match(css, /\.kb-marketplace-directory-body\s*\{[\s\S]*?width:\s*calc\(100% - clamp\(36px, 5vw, 112px\)\)/);
  assert.match(css, /max-width:\s*1760px/);
  assert.match(css, /grid-template-columns:\s*repeat\(auto-fit, minmax\(min\(100%, 270px\), 1fr\)\)/);
  assert.match(css, /@media \(min-width:\s*1840px\)/);
  assert.match(css, /@media \(max-width:\s*(?:720|760)px\)/);
});

test('database support has explicit availability, curation RLS/grants, and authenticated nearby RPC', () => {
  assert.match(directoryMigration, /availability_status/);
  assert.match(directoryMigration, /create table if not exists public\.marketplace_vendor_curation/i);
  assert.match(directoryMigration, /enable row level security/i);
  assert.match(directoryMigration, /grant select, insert, update, delete on public\.marketplace_vendor_curation to authenticated/i);
  assert.match(nearbyMigration, /auth\.uid\(\)/);
  assert.match(nearbyMigration, /revoke all on function public\.kb_marketplace_vendor_distances_for_church\(\)\s+from public, anon/i);
  assert.match(nearbyMigration, /grant execute on function public\.kb_marketplace_vendor_distances_for_church\(\)\s+to authenticated/i);
});
