import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const hashKey = value => createHash('sha256').update(String(value)).digest('hex');
const stablePick = (rows, count, id) => [...rows]
  .sort((left, right) => hashKey(id(left)).localeCompare(hashKey(id(right))))
  .slice(0, count);

function overtureCase(row, lane, why) {
  return {
    case_id: `${lane}:${row.source_external_key}`,
    lane,
    name: row.name,
    address: [row.address_line_1, row.locality, row.region_code, row.postal_code].filter(Boolean).join(', '),
    source_keys: [row.source_external_key],
    why,
    check: 'Confirm this is a currently operating Christian church at this Dallas address.',
    result: 'pending',
  };
}

export function buildVerificationSample({ newChurches, duplicates, needsInformation, supported, possibleMissing }) {
  const supportedNew = supported.filter(row => row.candidate?.bucket === 'apparent_new');
  const supportedIds = new Set(supportedNew.map(row => row.candidate.candidate_id));
  const overtureOnly = newChurches.filter(row => !supportedIds.has(row.source_external_key));
  const cases = [
    ...stablePick(supportedNew, 15, row => row.irs.ein).map(row => ({
      case_id: `irs_supported:${row.irs.ein}`,
      lane: 'irs_supported',
      name: row.candidate.candidate_name,
      address: [row.candidate.candidate_street, row.irs.city, row.irs.state, row.candidate.candidate_postal_code].filter(Boolean).join(', '),
      source_keys: [row.candidate.candidate_id, row.irs.ein],
      why: 'Overture place and IRS organization independently point to the same church.',
      check: 'Confirm the church is open and the public-facing name/address are current.',
      result: 'pending',
    })),
    ...stablePick(overtureOnly, 15, row => row.source_external_key).map(row => overtureCase(row, 'overture_only', 'Plausible Dallas church found by Overture but not independently matched yet.')),
    ...stablePick(duplicates, 5, row => row.source_external_key).map(row => overtureCase(row, 'possible_duplicate', row.reason || 'Possible duplicate record.')),
    ...stablePick(needsInformation, 5, row => row.source_external_key).map(row => overtureCase(row, 'needs_information', (row.problems || []).join('; '))),
    ...stablePick(possibleMissing, 10, row => row.ein).map(row => ({
      case_id: `irs_possible_missing:${row.ein}`,
      lane: 'irs_possible_missing',
      name: row.legal_name,
      address: [row.street, row.city, row.state, row.postal_code].filter(Boolean).join(', '),
      source_keys: [row.ein],
      why: 'Church-like IRS organization with no strong Overture match.',
      check: 'Determine whether this legal organization operates a church at a physical Dallas site.',
      result: 'pending',
    })),
  ];
  if (cases.length !== 50 || new Set(cases.map(row => row.case_id)).size !== 50) {
    throw new Error(`Verification sample must contain 50 unique cases; received ${cases.length}`);
  }
  return cases;
}

function csvValue(value) {
  const text = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function asCsv(rows) {
  const columns = ['case_id', 'lane', 'name', 'address', 'why', 'check', 'source_keys', 'result'];
  return `${columns.join(',')}\n${rows.map(row => columns.map(column => csvValue(row[column])).join(',')).join('\n')}\n`;
}

async function main() {
  const root = path.resolve(process.argv[2] || 'work/dallas-church-acquisition');
  const readJson = async filepath => JSON.parse(await readFile(filepath, 'utf8'));
  const [newChurches, duplicates, needsInformation, supported, possibleMissing] = await Promise.all([
    readJson(path.join(root, 'results', 'new-churches.json')),
    readJson(path.join(root, 'results', 'likely-duplicates.json')),
    readJson(path.join(root, 'results', 'needs-more-information.json')),
    readJson(path.join(root, 'reconciliation', 'irs-supported-records.json')),
    readJson(path.join(root, 'reconciliation', 'possible-missing-churches.json')),
  ]);
  const sample = buildVerificationSample({ newChurches, duplicates, needsInformation, supported, possibleMissing });
  const outputDir = path.join(root, 'verification-sample');
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'dallas-verification-sample.json'), `${JSON.stringify(sample, null, 2)}\n`);
  await writeFile(path.join(outputDir, 'dallas-verification-sample.csv'), asCsv(sample));
  const lanes = Object.fromEntries([...new Set(sample.map(row => row.lane))].map(lane => [lane, sample.filter(row => row.lane === lane).length]));
  await writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify({ generated_at: new Date().toISOString(), dry_run: true, production_writes: 0, total: sample.length, lanes }, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ output: outputDir, total: sample.length, lanes }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
  });
}
