import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/marketplace-v2.css', import.meta.url), 'utf8');

test('marketplace preview is development-only and requires an explicit URL flag', () => {
  assert.match(app, /function isMarketplaceDevPreviewEnabled\(\)[\s\S]*?!kbIsDevRuntime\(\)[\s\S]*?get\('preview'\) === 'marketplace'/);
  assert.match(app, /const marketplaceDevPreview = isMarketplaceDevPreviewEnabled\(\)/);
  assert.match(app, /const previewQuery = isMarketplaceDevPreviewEnabled\(\) \? "\?preview=marketplace" : ""/);
});

test('preview fixtures are isolated from live inventory', () => {
  assert.match(app, /KB_MARKETPLACE_DEV_PREVIEW_VENDORS/);
  assert.match(app, /KB_MARKETPLACE_DEV_PREVIEW_PROJECTS/);
  assert.match(app, /marketplaceDevPreview \? KB_MARKETPLACE_DEV_PREVIEW_PROJECTS : \(projects \|\| \[\]\)/);
  assert.match(app, /marketplaceDevPreview \? KB_MARKETPLACE_DEV_PREVIEW_VENDORS : vendorInput/);
  assert.match(app, /never stored in Supabase or counted as live Marketplace inventory/);
  assert.match(app, /illustrative brief\$\{filteredProjects\.length === 1 \? '' : 's'\} for layout review/);
});

test('vendor preview cards use service-context photography instead of church hero imagery', () => {
  const vendorFixtures = app.slice(
    app.indexOf('const KB_MARKETPLACE_DEV_PREVIEW_VENDORS'),
    app.indexOf('const KB_MARKETPLACE_DEV_PREVIEW_PROJECTS'),
  );
  assert.match(vendorFixtures, /image_url:'\/gpi\/volunteer\.jpg'/);
  assert.match(vendorFixtures, /image_url:'\/gpi\/creative\.jpg'/);
  assert.match(vendorFixtures, /image_url:'\/gpi\/professional\.jpg'/);
  assert.match(vendorFixtures, /image_url:'\/gpi\/worship\.jpg'/);
  assert.match(vendorFixtures, /image_url:'\/gpi\/mentoring\.jpg'/);
  assert.match(vendorFixtures, /image_url:'\/gpi\/outreach\.jpg'/);
  assert.doesNotMatch(vendorFixtures, /faithbid-(?:marketplace|landing)-church/i);
  assert.match(app, /const isPreviewCard = String\(vendor\?\.id \|\| ''\)\.startsWith\('preview-vendor-'\)/);
  assert.match(app, /loading=\{isPreviewCard \? 'eager' : 'lazy'\}/);
});

test('project preview cards use complete local work-context imagery without changing live image resolution', () => {
  const projectFixtures = app.slice(
    app.indexOf('const KB_MARKETPLACE_DEV_PREVIEW_PROJECTS'),
    app.indexOf('// Route alias and subtab maps'),
  );
  for (const file of ['volunteer', 'creative', 'professional', 'worship', 'mentoring', 'outreach']) {
    assert.match(projectFixtures, new RegExp(`hero_image:'/gpi/${file}\\.jpg'`));
  }
  assert.doesNotMatch(projectFixtures, /faithbid-(?:marketplace|landing)-church/i);
  assert.match(app, /if \(marketplaceDevPreview\) \{[\s\S]*?const previewImage = getValidMediaUrl\(project\?\.hero_image \|\| project\?\.image_url \|\| ''\);[\s\S]*?if \(previewImage\) return previewImage;[\s\S]*?return pickMarketplacePresetImage\(project, index\);/);
  assert.match(app, /String\(project\?\.id \|\| ''\)\.startsWith\('preview-project-'\)/);
});

test('preview cards cannot trigger persistence or live-detail navigation', () => {
  const projectSave = app.slice(app.indexOf('const handleToggleSave = async'), app.indexOf('const handleSaveCurrentSearch'));
  const vendorSave = app.slice(app.indexOf('const toggleSave = (vendor'), app.indexOf('const getInviteKey', app.indexOf('const toggleSave = (vendor')));
  const vendorOpen = app.slice(app.indexOf('const handleOpenVendor = (vendor)'), app.indexOf('const handleCompareVendor', app.indexOf('const handleOpenVendor = (vendor)')));
  assert.match(projectSave, /if \(marketplaceDevPreview\)[\s\S]*?return;/);
  assert.match(vendorSave, /if \(marketplaceDevPreview\)[\s\S]*?return;/);
  assert.match(vendorOpen, /if \(marketplaceDevPreview\)[\s\S]*?return;/);
  assert.match(app, /const openProject = \(project\) => \{\s*if \(marketplaceDevPreview\)[\s\S]*?return;/);
});

test('preview hearts respond locally without calling the live persistence handlers', () => {
  const projectSave = app.slice(app.indexOf('const handleToggleSave = async'), app.indexOf('const handleSaveCurrentSearch'));
  const vendorSave = app.slice(app.indexOf('const toggleSave = (vendor'), app.indexOf('const getInviteKey', app.indexOf('const toggleSave = (vendor')));
  assert.match(projectSave, /if \(marketplaceDevPreview\)[\s\S]*?setSavedIds\(prev =>[\s\S]*?Preview bookmark updated in this browser only\.[\s\S]*?return;/);
  assert.match(vendorSave, /if \(marketplaceDevPreview\)[\s\S]*?setLocalSavedVendorIds\(prev =>[\s\S]*?Preview bookmark updated in this browser only\.[\s\S]*?return;/);
  assert.match(app, /const effectiveSavedVendorIds = marketplaceDevPreview[\s\S]*?\? localSavedVendorIds[\s\S]*?: onToggleSave/);
  assert.match(projectSave, /await persistSavedProjectRecord/);
  assert.match(vendorSave, /if \(typeof onToggleSave === 'function'\)/);
});

test('preview notice and grids stay responsive', () => {
  assert.match(css, /\.kb-marketplace-dev-preview\s*\{[\s\S]*?grid-template-columns:\s*auto auto minmax\(260px, 1fr\)/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*?\.kb-marketplace-dev-preview\s*\{[\s\S]*?grid-template-columns:\s*auto 1fr/);
  assert.match(css, /\.kb-marketplace-vendor-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(auto-fit/);
  assert.match(css, /\.kb-marketplace-project-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(auto-fit/);
});
