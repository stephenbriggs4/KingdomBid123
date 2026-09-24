import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const projectsSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('vendor-pair signals bridge public vendor ids to vendor user ids', () => {
  assert.match(appSource, /function addVendorPairIdentityAliases/);
  assert.match(appSource, /from\('vendors'\)\.select\('id,user_id'\)\.in\('user_id', signalVendorUserIds\)/);
  assert.match(appSource, /addVendorPairIdentityAliases\(maps, identityResult\.data\)/);
  assert.match(projectsSource, /const inviteSignalChurchId = String\(firstNonEmpty\(matchContextProject\?\.church_id/);
  assert.match(projectsSource, /fetchVendorPairSignalMaps\(\{ projectId: inviteProjectId, churchId: inviteSignalChurchId \}\)/);
  for (const source of [appSource, projectsSource]) {
    assert.match(source, /vendorPairSignalsLoading\s*\?\s*'Checking relationship'/);
    assert.match(source, /relationshipUnavailable\s*\?\s*'Relationship unavailable'/);
    assert.match(source, /displayDealState === 'not_contacted'\s*\? 'Available'/);
  }

  const helperStart = appSource.indexOf('function normalizeVendorPairSignalKey');
  const helperEnd = appSource.indexOf('async function runVendorPairSignalSource', helperStart);
  assert.ok(helperStart >= 0 && helperEnd > helperStart);
  const context = {
    safeArray: value => Array.isArray(value) ? value : [],
    firstNonEmpty: (...values) => values.find(value => value !== null && value !== undefined && String(value).trim() !== '') || '',
  };
  vm.runInNewContext(`${appSource.slice(helperStart, helperEnd)}\nthis.signalApi = { makeEmptyVendorPairSignalMaps, addRowsToVendorPairMap, addVendorPairIdentityAliases, getVendorPairSignalMapEntry };`, context);
  const maps = context.signalApi.makeEmptyVendorPairSignalMaps();
  const conversation = { id: 'conversation-1', vendor_id: 'vendor-user-1' };
  context.signalApi.addRowsToVendorPairMap(maps.conversationsByVendor, [conversation], 'conversation');
  context.signalApi.addVendorPairIdentityAliases(maps, [{ id: 'vendor-row-1', user_id: 'vendor-user-1' }]);
  assert.equal(context.signalApi.getVendorPairSignalMapEntry(maps.conversationsByVendor, 'vendor-row-1')?.id, conversation.id);
});

test('draft creation UX never claims publication or vendor notification', () => {
  assert.match(appSource, /status:\s*"draft"|status:\s*'draft'/);
  assert.match(appSource, /Your brief is saved as a draft\. Post it whenever you're ready — no vendors have been notified\./);
  for (const source of [appSource, projectsSource]) {
    assert.doesNotMatch(source, /Faith-aligned vendors have been notified/);
    assert.doesNotMatch(source, /Your project is live\./);
  }
  assert.match(projectsSource, /This project is still a draft\. Vendors have not been notified\./);
});
