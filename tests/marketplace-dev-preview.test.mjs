import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

// R-65 (2026-09-29): the entire marketplace ?preview=marketplace dev-only
// illustrative-fixture system this file tested (isMarketplaceDevPreviewEnabled,
// KB_MARKETPLACE_DEV_PREVIEW_VENDORS/PROJECTS, the preview save/bookmark
// short-circuit) was deliberately deleted in commit 3fbc931 ("Harden
// security, rebuild Messages tab, add attachments, and prune dead code" --
// "Remove ~2,700 lines of unreferenced functions"). It was a developer-only
// layout-review tool, not user-facing product behavior, and zero references
// to any of its identifiers remain anywhere in the codebase. Retired rather
// than deleted outright so a future search for this feature name finds the
// removal reason instead of nothing.
test('marketplace dev-preview fixture system was intentionally removed (see commit 3fbc931)', () => {
  for (const identifier of [
    'isMarketplaceDevPreviewEnabled',
    'KB_MARKETPLACE_DEV_PREVIEW_VENDORS',
    'KB_MARKETPLACE_DEV_PREVIEW_PROJECTS',
    'marketplaceDevPreview',
  ]) {
    assert.doesNotMatch(app, new RegExp(identifier), `${identifier} should stay removed -- if this fails, the dev-preview system was reintroduced and this test should be rewritten against it, not deleted again`);
  }
});
