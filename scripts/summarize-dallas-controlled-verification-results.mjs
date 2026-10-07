import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_ALLOWED_PURPOSES = ['research', 'verification', 'internal_analytics'];
const REQUIRED_PROHIBITED_PURPOSES = ['outreach', 'export', 'redistribution'];

function requirePurposeScope(batch) {
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

export function controlledResultCategory(status) {
  if (status.startsWith('verified_')) return 'verified';
  if (status.startsWith('probable_')) return 'probable';
  if (status.startsWith('excluded_')) return 'excluded';
  if (status.startsWith('needs_')) return 'needs_confirmation';
  throw new Error(`Unknown controlled-batch status: ${status}`);
}

const countBy = (rows, getter) => Object.fromEntries(
  [...new Set(rows.map(getter))]
    .sort()
    .map(value => [value, rows.filter(row => getter(row) === value).length]),
);

export function summarizeControlledVerificationResults({ candidates, batches }) {
  if (!Array.isArray(candidates) || candidates.length < 1) {
    throw new Error(`Controlled batch must contain at least one candidate; received ${candidates?.length ?? 0}`);
  }
  const expectedCount = candidates.length;
  const candidateOrders = candidates.map(row => row.verification_order);
  const candidateKeys = candidates.map(row => row.source_external_key);
  if (new Set(candidateOrders).size !== expectedCount || new Set(candidateKeys).size !== expectedCount) {
    throw new Error('Controlled-batch verification orders and source keys must be unique');
  }

  for (const batch of batches) requirePurposeScope(batch);
  const results = batches.flatMap(batch => batch.results || []);
  if (results.length !== expectedCount) {
    throw new Error(`Controlled results must match the candidate count of ${expectedCount}; received ${results.length}`);
  }
  const resultOrders = results.map(row => row.verification_order);
  const resultKeys = results.map(row => row.source_external_key);
  if (new Set(resultOrders).size !== expectedCount || new Set(resultKeys).size !== expectedCount) {
    throw new Error('Controlled result verification orders and source keys must be unique');
  }

  const expectedByOrder = new Map(candidates.map(row => [row.verification_order, row]));
  for (const result of results) {
    const candidate = expectedByOrder.get(result.verification_order);
    if (!candidate || candidate.source_external_key !== result.source_external_key) {
      throw new Error(`Controlled result does not match candidate at order ${result.verification_order}`);
    }
  }

  const joined = results.map(result => {
    const candidate = expectedByOrder.get(result.verification_order);
    return {
      ...result,
      lane: candidate.lane,
      category: controlledResultCategory(result.status),
    };
  });
  const categoryCounts = countBy(joined, row => row.category);
  const laneNames = [...new Set(joined.map(row => row.lane))].sort();
  const lanes = Object.fromEntries(laneNames.map(lane => {
    const rows = joined.filter(row => row.lane === lane);
    return [lane, {
      total: rows.length,
      categories: countBy(rows, row => row.category),
      statuses: countBy(rows, row => row.status),
    }];
  }));

  const statusContains = fragment => joined.filter(row => row.status.includes(fragment)).length;
  const usable = joined.filter(row => ['verified', 'probable'].includes(row.category)).length;
  return {
    generated_at: new Date().toISOString(),
    dry_run: true,
    production_writes: 0,
    total_candidates: candidates.length,
    total_results: joined.length,
    purpose_scope: {
      allowed: [...REQUIRED_ALLOWED_PURPOSES],
      prohibited: [...REQUIRED_PROHIBITED_PURPOSES],
    },
    categories: categoryCounts,
    usable_current_or_probable: usable,
    held_back_or_excluded: joined.length - usable,
    lanes,
    measured_signals: {
      bad_links_quarantined: statusContains('bad_link_quarantined'),
      irs_identity_conflicts: statusContains('irs_identity_conflict'),
      identity_transitions_needing_confirmation: statusContains('identity_transition'),
      current_name_updates: statusContains('name_updated'),
      current_address_updates: statusContains('address_updated'),
      secondary_ministry_sites_identified: statusContains('secondary_ministry_site'),
      shared_host_sites_identified: statusContains('shared_host_site'),
      same_campus_dual_addresses_identified: statusContains('same_campus_dual_address'),
      stale_or_noncongregation_records_excluded: categoryCounts.excluded || 0,
    },
  };
}

async function main() {
  const root = path.resolve(process.argv[2] || 'work/dallas-church-acquisition/controlled-batch-001');
  const directoryNames = await readdir(root);
  const candidateNames = directoryNames.filter(name => /^verify-next-\d+\.json$/.test(name));
  if (candidateNames.length !== 1) {
    throw new Error(`Controlled batch directory must contain exactly one verify-next-N.json file; found ${candidateNames.length}`);
  }
  const candidates = JSON.parse(await readFile(path.join(root, candidateNames[0]), 'utf8'));
  const names = directoryNames
    .filter(name => /^verification-results-\d{3}-\d{3}\.json$/.test(name))
    .sort();
  const batches = await Promise.all(names.map(async name => JSON.parse(await readFile(path.join(root, name), 'utf8'))));
  const summary = summarizeControlledVerificationResults({ candidates, batches });
  await mkdir(root, { recursive: true });
  const output = path.join(root, 'measurement-summary.json');
  await writeFile(output, `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ output, ...summary }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
  });
}
