import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { classifyDallasCandidates, pointInBoundary } from '../scripts/build-dallas-church-candidates.mjs';

const boundary = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { CITY: 'Dallas' },
    geometry: { type: 'Polygon', coordinates: [[[-97, 32.6], [-96.4, 32.6], [-96.4, 33.1], [-97, 33.1], [-97, 32.6]]] },
  }],
};

const place = (overrides = {}) => ({
  id: 'gers-new',
  name: 'Grace Community Church',
  operating_status: 'open',
  taxonomy_hierarchy: ['religious_organization', 'place_of_worship', 'christian_place_of_worship'],
  confidence: 0.91,
  sources: [{ property: '', dataset: 'meta', provider: 'meta', record_id: 'source-1', license: 'CDLA-Permissive-2.0', update_time: '2026-09-14T00:00:00Z', version: '2026-09-14' }],
  addresses: [{ freeform: '100 Main Street', locality: 'Dallas', region: 'TX', postcode: '75201', country: 'US' }],
  longitude: -96.8,
  latitude: 32.8,
  ...overrides,
});

test('Dallas city polygon inclusion is deterministic and excludes bbox-only results', () => {
  assert.equal(pointInBoundary([-96.8, 32.8], boundary), true);
  assert.equal(pointInBoundary([-97.1, 32.8], boundary), false);
});

test('collector keeps only Christian places physically inside Dallas', () => {
  const result = classifyDallasCandidates({
    overture: { records: [
      place(),
      place({ id: 'mosque', name: 'Masjid Example', taxonomy_hierarchy: ['place_of_worship', 'muslim_place_of_worship'] }),
      place({ id: 'outside', name: 'Outside Church', longitude: -97.1 }),
      place({ id: 'seminary', name: 'Example Seminary', taxonomy_hierarchy: ['religious_organization', 'seminary'] }),
    ] },
    existing: [],
    boundary,
  });
  assert.deepEqual(result.newChurches.map(row => row.source_external_key), ['gers-new']);
  assert.equal(result.newChurches[0].source_attribution[0].license, 'CDLA-Permissive-2.0');
  assert.equal(result.stats.input, 4);
  assert.equal(result.stats.christian, 2);
  assert.equal(result.stats.outside_dallas, 1);
});

test('existing address matches and repeated Overture records become likely duplicates, never auto-merges', () => {
  const result = classifyDallasCandidates({
    overture: { records: [
      place({ id: 'match-existing', name: 'Grace Church' }),
      place({ id: 'same-name-far', name: 'Grace Community Church', addresses: [{ freeform: '900 Faraway Ave', locality: 'Dallas', region: 'TX', postcode: '75240' }] }),
      place({ id: 'repeat-a', name: 'Another Church', addresses: [{ freeform: '200 Elm Rd', locality: 'Dallas', region: 'TX', postcode: '75202' }] }),
      place({ id: 'repeat-b', name: 'Another Church Campus', addresses: [{ freeform: '200 Elm Road', locality: 'Dallas', region: 'TX', postcode: '75202' }] }),
    ] },
    existing: [{ id: 'existing-1', canonical_name: 'Grace Community Church', address_line_1: '100 Main St', locality: 'Dallas', region_code: 'TX', postal_code: '75201' }],
    boundary,
  });
  assert.equal(result.newChurches.length, 2);
  assert.equal(result.likelyDuplicates.length, 2);
  assert.equal(result.likelyDuplicates.find(row => row.source_external_key === 'match-existing')?.matched_existing_id, 'existing-1');
  assert.equal(result.likelyDuplicates.find(row => row.source_external_key === 'repeat-b')?.duplicate_of_source_key, 'repeat-a');
});

test('incomplete, low-confidence, and closed records are preserved for research instead of silently discarded', () => {
  const result = classifyDallasCandidates({
    overture: { records: [
      place({ id: 'low', confidence: 0.2 }),
      place({ id: 'no-address', name: 'No Address Church', addresses: [] }),
      place({ id: 'closed', name: 'Closed Church', operating_status: 'permanently_closed', confidence: 0, addresses: [{ freeform: '300 Oak St', locality: 'Dallas', region: 'TX', postcode: '75203' }] }),
      place({ id: 'wrong-city', name: 'Mismatched Church', addresses: [{ freeform: '400 Pine St', locality: 'Garland', region: 'TX', postcode: '75043' }] }),
    ] },
    existing: [],
    boundary,
    minimumConfidence: 0.55,
  });
  assert.equal(result.newChurches.length, 0);
  assert.equal(result.needsMoreInformation.length, 4);
  assert.ok(result.needsMoreInformation.some(row => row.problems.includes('marked permanently closed')));
  assert.ok(result.needsMoreInformation.some(row => row.problems.includes('address city disagrees with Dallas boundary point')));
});

test('acquisition scripts are dry-run only and retain research-only rights', () => {
  const buildSource = fs.readFileSync(new URL('../scripts/build-dallas-church-candidates.mjs', import.meta.url), 'utf8');
  const fetchSource = fs.readFileSync(new URL('../scripts/fetch-overture-dallas-churches.py', import.meta.url), 'utf8');
  assert.match(buildSource, /production_writes: 0/);
  assert.match(buildSource, /outreach_allowed: false/);
  assert.match(buildSource, /export_allowed: false/);
  assert.match(buildSource, /redistribution_allowed: false/);
  assert.match(buildSource, /source_attribution: row\.source_attribution/);
  assert.doesNotMatch(`${buildSource}\n${fetchSource}`, /createClient|supabase\.rpc|\.from\(/);
});

test('boundary fetch preserves native EPSG:2276 authority and labels WGS84 as derived', () => {
  const source = fs.readFileSync(new URL('../scripts/fetch-dallas-boundary.mjs', import.meta.url), 'utf8');
  assert.match(source, /Deliberately no outSR/);
  assert.match(source, /wkid !== 2276/);
  assert.match(source, /local candidate filtering only; native EPSG:2276 remains authoritative/);
});
