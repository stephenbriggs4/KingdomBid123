import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('My Projects and My Work use restorable hash routes', () => {
  assert.match(source, /const APP_PROJECT_SUBTAB_BY_ROUTE = Object\.freeze\(\{[\s\S]*"my-projects": "mine"[\s\S]*"my-work": "work"/);
  assert.match(source, /useState\(\(\) => readProjectSubTabFromHash\(window\.location\.hash\)\)/);
  assert.match(source, /window\.location\.hash = getProjectSubTabRoute\(NAV_SUBTAB\[navTarget\]\)/);
  assert.match(source, /setNavSubTab\(target === "projects" \? targetSubTab : null\)/);
  assert.match(source, /safeScreen === "projects" && pending\?\.navSubTab[\s\S]*getProjectSubTabRoute\(pending\.navSubTab\)/);
});

test('the private-access loader and Projects screen are mutually exclusive', () => {
  assert.match(source, /const marketplaceWorkspaceReady = authReady && marketplaceGateLoaded && canAccessMarketplace/);
  assert.match(source, /screen==="projects" && !marketplaceWorkspaceReady/);
  assert.match(source, /screen==="projects" && marketplaceWorkspaceReady/);
  assert.doesNotMatch(source, /screen==="projects" && canAccessMarketplace\) && <React\.Suspense/);
});

test('active church workspace access comes from the database profile', () => {
  assert.match(source, /function hasActiveChurchWorkspaceAccess\(profile\)/);
  assert.match(source, /normalizeAuthRole\(profile\?\.role\) !== "church"/);
  assert.match(source, /account_status,access_status/);
  assert.match(source, /hasExplicitAccess \|\| hasCharterWorkspaceAccess \|\| hasChurchWorkspaceAccess/);
  assert.doesNotMatch(source, /hasActiveChurchWorkspaceAccess\([^)]*user_metadata/);
});

test('a same-user gate refresh keeps the current workspace mounted', () => {
  assert.match(source, /const gateIdentityChanged = marketplaceGateUserIdRef\.current !== userId/);
  assert.match(source, /if \(gateIdentityChanged\) \{[\s\S]*setMarketplaceGateLoaded\(false\);[\s\S]*setPrivateMarketplaceAccess\(false\);/);
  assert.match(source, /const marketplaceAccessPending = !authReady \|\| !marketplaceGateLoaded/);
  assert.match(source, /resolvedMarketplaceTarget && !marketplaceAccessPending && !marketplaceAccessAllowed/);
});
