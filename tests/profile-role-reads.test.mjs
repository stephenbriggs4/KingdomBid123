import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const profileSource = readFileSync(new URL('../src/ProfileScreen.jsx', import.meta.url), 'utf8');

test('church profiles do not query the vendor table', () => {
  assert.match(profileSource, /const resolvedProfileRole = String\(safeProfile\?\.role \|\| role \|\| ""\)/);
  assert.match(profileSource, /const shouldFetchVendorRow = resolvedProfileRole === "vendor"/);

  const gateStart = profileSource.indexOf('        if (shouldFetchVendorRow) {');
  const vendorQuery = profileSource.indexOf('supabase.from("vendors")', gateStart);
  const gateEnd = profileSource.indexOf('\n        }\n        if (cancelled) return;', gateStart);
  assert.ok(gateStart >= 0 && vendorQuery > gateStart && gateEnd > vendorQuery, 'vendor reads must stay inside the vendor-role gate');
  assert.match(profileSource.slice(gateEnd), /setVendorRow\(null\)/);
});
