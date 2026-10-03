import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_ALLOWED_PURPOSES = ['research', 'verification', 'internal_analytics'];
const REQUIRED_PROHIBITED_PURPOSES = ['outreach', 'export', 'redistribution'];

const countBy = (rows, key) => Object.fromEntries(
  [...new Set(rows.map(row => row[key]))]
    .sort()
    .map(value => [value, rows.filter(row => row[key] === value).length]),
);

function requireExactPurposeScope(batch) {
  for (const purpose of REQUIRED_ALLOWED_PURPOSES) {
    if (!batch.allowed_purposes?.includes(purpose)) {
      throw new Error(`${batch.batch_id} is missing allowed purpose ${purpose}`);
    }
  }
  for (const purpose of REQUIRED_PROHIBITED_PURPOSES) {
    if (!batch.prohibited_purposes?.includes(purpose)) {
      throw new Error(`${batch.batch_id} is missing prohibited purpose ${purpose}`);
    }
  }
}

export function summarizeVerificationResults({ sample, batches }) {
  if (!Array.isArray(sample) || sample.length !== 50) {
    throw new Error(`Gold set must contain exactly 50 cases; received ${sample?.length ?? 0}`);
  }
  const sampleIds = sample.map(row => row.case_id);
  if (new Set(sampleIds).size !== sampleIds.length) throw new Error('Gold-set case IDs must be unique');

  for (const batch of batches) requireExactPurposeScope(batch);
  const results = batches.flatMap(batch => batch.results || []);
  const resultIds = results.map(row => row.case_id);
  if (new Set(resultIds).size !== resultIds.length) throw new Error('Verification result case IDs must be unique');

  const expected = new Set(sampleIds);
  const actual = new Set(resultIds);
  const missing = sampleIds.filter(caseId => !actual.has(caseId));
  const unexpected = resultIds.filter(caseId => !expected.has(caseId));
  if (missing.length || unexpected.length) {
    throw new Error(`Verification coverage mismatch: missing=${missing.join(',') || 'none'} unexpected=${unexpected.join(',') || 'none'}`);
  }

  const withLane = results.map(result => ({
    ...result,
    lane: result.case_id.split(':', 1)[0],
  }));
  const laneNames = [...new Set(withLane.map(row => row.lane))].sort();
  const lanes = Object.fromEntries(laneNames.map(lane => {
    const rows = withLane.filter(row => row.lane === lane);
    return [lane, { total: rows.length, statuses: countBy(rows, 'status') }];
  }));

  const statusIn = (lane, statuses) => withLane.filter(row => row.lane === lane && statuses.includes(row.status)).length;
  const measuredSignals = {
    irs_supported_current_or_probable: statusIn('irs_supported', [
      'verified_current',
      'verified_current_address_correction',
      'probable_current',
    ]),
    overture_only_current_or_probable: statusIn('overture_only', [
      'verified_current',
      'probable_current',
      'probable_current_address_correction',
    ]),
    exact_address_duplicate_candidates_confirmed_distinct_or_contaminated: statusIn('possible_duplicate', [
      'verified_current_false_duplicate_different_suites',
      'verified_current_false_duplicate_identity_contamination',
      'verified_current_false_duplicate_shared_site',
    ]),
    exact_address_duplicate_candidates_unresolved: statusIn('possible_duplicate', [
      'possible_shared_site_needs_confirmation',
      'possible_shared_site_or_identity_transition',
    ]),
    low_information_probable_current: statusIn('needs_information', ['probable_current']),
    low_information_not_ready: statusIn('needs_information', [
      'needs_current_site_confirmation',
      'needs_current_site_confirmation_address_recovered',
      'stale_historic_identity_current_occupant_differs',
    ]),
    irs_possible_missing_credible_dallas_leads_or_matches: statusIn('irs_possible_missing', [
      'probable_dallas_church_site',
      'verified_dallas_congregation_site_unconfirmed',
      'verified_existing_overture_address_correction',
    ]),
    irs_possible_missing_outside_dallas: statusIn('irs_possible_missing', ['outside_dallas_city']),
    irs_possible_missing_excluded_non_site: statusIn('irs_possible_missing', ['exclude_not_church_site']),
    irs_possible_missing_unresolved: statusIn('irs_possible_missing', ['needs_site_confirmation']),
  };

  return {
    generated_at: new Date().toISOString(),
    dry_run: true,
    production_writes: 0,
    total_cases: results.length,
    unique_cases: actual.size,
    purpose_scope: {
      allowed: [...REQUIRED_ALLOWED_PURPOSES],
      prohibited: [...REQUIRED_PROHIBITED_PURPOSES],
    },
    lanes,
    measured_signals: measuredSignals,
  };
}

async function main() {
  const root = path.resolve(process.argv[2] || 'work/dallas-church-acquisition');
  const verificationDir = path.join(root, 'verification-sample');
  const sample = JSON.parse(await readFile(path.join(verificationDir, 'dallas-verification-sample.json'), 'utf8'));
  const names = (await readdir(verificationDir))
    .filter(name => /^verification-results-batch-\d+\.json$/.test(name))
    .sort();
  const batches = await Promise.all(names.map(async name => JSON.parse(await readFile(path.join(verificationDir, name), 'utf8'))));
  const summary = summarizeVerificationResults({ sample, batches });
  await mkdir(verificationDir, { recursive: true });
  const output = path.join(verificationDir, 'measurement-summary.json');
  await writeFile(output, `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ output, ...summary }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
  });
}
