import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const profileSource = readFileSync(new URL('../src/ProfileScreen.jsx', import.meta.url), 'utf8');

test('church profiles do not query the vendor table', () => {
  assert.match(profileSource, /const resolvedProfileRole = String\(safeProfile\?\.role \|\| role \|\| ""\)/);
  assert.match(profileSource, /const shouldFetchVendorRow = resolvedProfileRole === "vendor"/);

  const gateStart = profileSource.indexOf('        if (shouldFetchVendorRow) {');
  const vendorQuery = profileSource.indexOf('supabase.from("vendors")', gateStart);
  // R-65 (2026-09-29): this file uses CRLF line endings; the search string
  // must match \r\n, not a bare \n, or indexOf silently never finds it.
  const gateEnd = profileSource.indexOf('\r\n        }\r\n        if (cancelled) return;', gateStart);
  assert.ok(gateStart >= 0 && vendorQuery > gateStart && gateEnd > vendorQuery, 'vendor reads must stay inside the vendor-role gate');
  assert.match(profileSource.slice(gateEnd), /setVendorRow\(null\)/);
});
