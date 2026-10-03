import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { classifyDallasCandidates, pointInBoundary } from '../scripts/build-dallas-church-candidates.mjs';
import { parseCsv, selectDallasChristianOrganizations } from '../scripts/fetch-irs-dallas-christian-organizations.mjs';
import { reconcileIrsWithDallasCandidates } from '../scripts/reconcile-dallas-church-sources.mjs';
import { buildVerificationSample } from '../scripts/build-dallas-verification-sample.mjs';
import { summarizeVerificationResults } from '../scripts/summarize-dallas-verification-results.mjs';
import { buildControlledVerificationBatch } from '../scripts/build-dallas-controlled-verification-batch.mjs';
import { summarizeControlledVerificationResults } from '../scripts/summarize-dallas-controlled-verification-results.mjs';

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
  assert.equal(result.likelyDuplicates.find(row => row.source_external_key === 'repeat-b')?.relationship_hint, 'unresolved_same_site');
  assert.match(result.likelyDuplicates.find(row => row.source_external_key === 'repeat-b')?.reason || '', /shared site/);
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

test('IRS cross-check selects only Dallas Christian organization codes and parses quoted names', () => {
  const csv = [
    'EIN,NAME,ICO,STREET,CITY,STATE,ZIP,GROUP,SUBSECTION,AFFILIATION,CLASSIFICATION,RULING,DEDUCTIBILITY,FOUNDATION,ACTIVITY,ORGANIZATION,STATUS,TAX_PERIOD,ASSET_CD,INCOME_CD,FILING_REQ_CD,PF_FILING_REQ_CD,ACCT_PD,ASSET_AMT,INCOME_AMT,REVENUE_AMT,NTEE_CD,SORT_NAME',
    '123456789,"GRACE, COMMUNITY CHURCH",,100 MAIN ST,DALLAS,TX,75201,,03,,,,,,,,01,,,,,,,,,,X20,',
    '223456789,MOSQUE EXAMPLE,,200 MAIN ST,DALLAS,TX,75201,,03,,,,,,,,01,,,,,,,,,,X40,',
    '323456789,OUTSIDE CHURCH,,300 MAIN ST,GARLAND,TX,75040,,03,,,,,,,,01,,,,,,,,,,X21,',
  ].join('\n');
  assert.equal(parseCsv(csv)[1][1], 'GRACE, COMMUNITY CHURCH');
  const selected = selectDallasChristianOrganizations(csv);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].legal_name, 'GRACE, COMMUNITY CHURCH');
  assert.equal(selected[0].status_code, '01');
});

test('IRS evidence supports or flags candidates but never creates a church site by itself', () => {
  const result = reconcileIrsWithDallasCandidates({
    irsRecords: [
      { ein: '1', legal_name: 'Grace Community Church', street: '100 Main Street', postal_code: '75201' },
      { ein: '2', legal_name: 'Unmatched Christian Organization', street: '900 Unknown Rd', postal_code: '75240' },
      { ein: '3', legal_name: 'Unmatched Dallas Church', street: '800 Missing Ave', postal_code: '75241' },
    ],
    existing: [],
    overtureBuckets: { apparent_new: [{ source_external_key: 'gers-1', name: 'Grace Community Church', address_line_1: '100 Main St', postal_code: '75201' }] },
  });
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].basis, 'same street address');
  assert.equal(result.irsOnly.length, 2);
  assert.equal(result.irsOnly.find(row => row.ein === '2')?.lead_type, 'organization_only');
  assert.equal(result.irsOnly.find(row => row.ein === '3')?.lead_type, 'possible_missing_church');
});

test('verification sample is a deterministic 50-case cross-section instead of a blind bulk import', () => {
  const overtureRow = index => ({ source_external_key: `gers-${index}`, name: `Church ${index}`, address_line_1: `${index} Main St`, locality: 'Dallas', region_code: 'TX', postal_code: '75201' });
  const supported = Array.from({ length: 15 }, (_, index) => ({ irs: { ein: `irs-${index}`, city: 'Dallas', state: 'TX' }, candidate: { bucket: 'apparent_new', candidate_id: `gers-${index}`, candidate_name: `Church ${index}`, candidate_street: `${index} Main St`, candidate_postal_code: '75201' } }));
  const sample = buildVerificationSample({
    newChurches: Array.from({ length: 30 }, (_, index) => overtureRow(index)),
    duplicates: Array.from({ length: 5 }, (_, index) => ({ ...overtureRow(100 + index), reason: 'fixture duplicate' })),
    needsInformation: Array.from({ length: 5 }, (_, index) => ({ ...overtureRow(200 + index), problems: ['fixture gap'] })),
    supported,
    possibleMissing: Array.from({ length: 10 }, (_, index) => ({ ein: `missing-${index}`, legal_name: `Missing Church ${index}`, street: `${index} Oak Ave`, city: 'Dallas', state: 'TX', postal_code: '75202' })),
  });
  assert.equal(sample.length, 50);
  assert.equal(new Set(sample.map(row => row.case_id)).size, 50);
  assert.deepEqual(Object.fromEntries(['irs_supported', 'overture_only', 'possible_duplicate', 'needs_information', 'irs_possible_missing'].map(lane => [lane, sample.filter(row => row.lane === lane).length])), {
    irs_supported: 15,
    overture_only: 15,
    possible_duplicate: 5,
    needs_information: 5,
    irs_possible_missing: 10,
  });
  assert.ok(sample.every(row => row.result === 'pending'));
});

test('verification report requires one rights-scoped result for every gold-set case', () => {
  const statuses = [
    ['irs_supported', 'verified_current'],
    ['overture_only', 'probable_current'],
    ['possible_duplicate', 'verified_current_false_duplicate_shared_site'],
    ['needs_information', 'needs_current_site_confirmation'],
    ['irs_possible_missing', 'outside_dallas_city'],
  ];
  const sample = Array.from({ length: 50 }, (_, index) => ({
    case_id: `${statuses[index % statuses.length][0]}:${index}`,
  }));
  const batch = {
    batch_id: 'fixture-batch',
    allowed_purposes: ['research', 'verification', 'internal_analytics'],
    prohibited_purposes: ['outreach', 'export', 'redistribution'],
    results: sample.map((row, index) => ({ case_id: row.case_id, status: statuses[index % statuses.length][1] })),
  };
  const summary = summarizeVerificationResults({ sample, batches: [batch] });
  assert.equal(summary.total_cases, 50);
  assert.equal(summary.unique_cases, 50);
  assert.equal(summary.measured_signals.exact_address_duplicate_candidates_confirmed_distinct_or_contaminated, 10);
  assert.equal(summary.production_writes, 0);

  assert.throws(
    () => summarizeVerificationResults({ sample, batches: [{ ...batch, results: batch.results.slice(1) }] }),
    /coverage mismatch/,
  );
  assert.throws(
    () => summarizeVerificationResults({ sample, batches: [{ ...batch, prohibited_purposes: ['outreach'] }] }),
    /missing prohibited purpose export/,
  );
});

test('controlled batch selects complete strong records without reusing gold-set cases or granting promotion rights', () => {
  const candidate = (id, confidence = 0.95) => ({
    source_external_key: id,
    name: `Church ${id}`,
    address_line_1: `${id} Main St`,
    locality: 'Dallas',
    region_code: 'TX',
    postal_code: '75201',
    latitude: 32.8,
    longitude: -96.8,
    confidence,
    operating_status: 'open',
    websites: [`https://example.com/${id}`],
    socials: [],
    phones: [],
    emails: [],
  });
  const newChurches = [candidate('done'), candidate('supported-a'), candidate('supported-b'), candidate('strong-a'), candidate('strong-b')];
  const supported = ['supported-a', 'supported-b'].map((id, index) => ({
    candidate: { candidate_id: id, bucket: 'apparent_new' },
    irs: { ein: `ein-${index}`, legal_name: `Legal ${id}` },
  }));
  const rows = buildControlledVerificationBatch({
    newChurches,
    supported,
    excludedSourceKeys: ['done'],
    size: 4,
    supportedTarget: 2,
  });
  assert.deepEqual(rows.map(row => row.lane), ['overture_irs_supported', 'overture_irs_supported', 'overture_strong', 'overture_strong']);
  assert.ok(!rows.some(row => row.source_external_key === 'done'));
  assert.ok(rows.every(row => row.outreach_allowed === false && row.export_allowed === false && row.canonical_write_allowed === false));
});

test('controlled report requires complete rights-scoped results and measures each source lane', () => {
  const candidates = Array.from({ length: 100 }, (_, index) => ({
    verification_order: index + 1,
    source_external_key: `source-${index + 1}`,
    lane: index < 50 ? 'overture_irs_supported' : 'overture_strong',
  }));
  const results = candidates.map((candidate, index) => ({
    verification_order: candidate.verification_order,
    source_external_key: candidate.source_external_key,
    status: index < 69
      ? 'verified_current'
      : index < 89
        ? 'probable_current'
        : index < 98
          ? 'needs_current_confirmation'
          : 'excluded_non_congregation',
  }));
  const batch = {
    batch_id: 'controlled-fixture',
    allowed_purposes: ['research', 'verification', 'internal_analytics'],
    prohibited_purposes: ['outreach', 'export', 'redistribution'],
    results,
  };
  const summary = summarizeControlledVerificationResults({ candidates, batches: [batch] });
  assert.equal(summary.total_results, 100);
  assert.equal(summary.categories.verified, 69);
  assert.equal(summary.categories.probable, 20);
  assert.equal(summary.categories.needs_confirmation, 9);
  assert.equal(summary.categories.excluded, 2);
  assert.equal(summary.usable_current_or_probable, 89);
  assert.equal(summary.lanes.overture_irs_supported.total, 50);
  assert.equal(summary.lanes.overture_strong.total, 50);
  assert.equal(summary.production_writes, 0);

  assert.throws(
    () => summarizeControlledVerificationResults({ candidates, batches: [{ ...batch, results: results.slice(1) }] }),
    /exactly 100 rows/,
  );
  assert.throws(
    () => summarizeControlledVerificationResults({ candidates, batches: [{ ...batch, prohibited_purposes: ['outreach'] }] }),
    /missing prohibited purpose export/,
  );
});
