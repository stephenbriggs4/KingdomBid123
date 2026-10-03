import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PURPOSES = Object.freeze(['research', 'verification', 'internal_analytics']);

const clean = value => String(value ?? '').trim();

function isCompleteCandidate(row) {
  return Boolean(
    clean(row.source_external_key)
    && clean(row.name)
    && clean(row.address_line_1)
    && clean(row.locality).toLowerCase() === 'dallas'
    && clean(row.region_code).toUpperCase() === 'TX'
    && Number.isFinite(Number(row.latitude))
    && Number.isFinite(Number(row.longitude))
    && row.operating_status !== 'permanently_closed',
  );
}

function verificationScore(row, hasIrsSupport) {
  const confidence = Number.isFinite(Number(row.confidence)) ? Number(row.confidence) : 0;
  const sourceLinkBonus = row.websites?.length ? 0.04 : 0;
  const socialBonus = row.socials?.length ? 0.02 : 0;
  const phoneBonus = row.phones?.length ? 0.01 : 0;
  const irsBonus = hasIrsSupport ? 0.08 : 0;
  return Number((confidence + sourceLinkBonus + socialBonus + phoneBonus + irsBonus).toFixed(6));
}

function compareCandidates(left, right) {
  return right.verification_score - left.verification_score
    || left.name.localeCompare(right.name)
    || left.source_external_key.localeCompare(right.source_external_key);
}

function publicRow(row, lane, irs = null) {
  return {
    lane,
    source_external_key: row.source_external_key,
    name: row.name,
    address_line_1: row.address_line_1,
    locality: row.locality,
    region_code: row.region_code,
    postal_code: row.postal_code,
    latitude: row.latitude,
    longitude: row.longitude,
    overture_confidence: row.confidence,
    verification_score: verificationScore(row, Boolean(irs)),
    irs_ein: irs?.ein || null,
    irs_legal_name: irs?.legal_name || null,
    linked_websites: row.websites || [],
    linked_socials: row.socials || [],
    linked_phones: row.phones || [],
    linked_emails: row.emails || [],
    why_selected: irs
      ? 'Complete in-boundary Overture church independently matched to an active IRS Christian organization.'
      : 'Complete high-confidence in-boundary Overture church with at least one public verification route.',
    checks: [
      'Confirm the congregation is currently operating.',
      'Confirm the public-facing name.',
      'Confirm this is a physical worship site inside the City of Dallas.',
      'Confirm linked contact information belongs to this institution before retaining it.',
    ],
    allowed_purposes: [...PURPOSES],
    outreach_allowed: false,
    export_allowed: false,
    redistribution_allowed: false,
    canonical_write_allowed: false,
  };
}

export function buildControlledVerificationBatch({
  newChurches,
  supported,
  excludedSourceKeys = [],
  size = 100,
  supportedTarget = Math.floor(size / 2),
}) {
  const excluded = new Set(excludedSourceKeys.map(clean));
  const byId = new Map(newChurches.map(row => [clean(row.source_external_key), row]));
  const supportedById = new Map();
  for (const match of supported) {
    if (match.candidate?.bucket !== 'apparent_new') continue;
    const id = clean(match.candidate.candidate_id);
    const candidate = byId.get(id);
    if (!candidate || excluded.has(id) || !isCompleteCandidate(candidate)) continue;
    if (Number(candidate.confidence) < 0.8) continue;
    supportedById.set(id, publicRow(candidate, 'overture_irs_supported', match.irs));
  }

  const supportedRows = [...supportedById.values()]
    .sort(compareCandidates)
    .slice(0, supportedTarget);
  const selectedIds = new Set(supportedRows.map(row => row.source_external_key));
  const overtureRows = newChurches
    .filter(row => !excluded.has(clean(row.source_external_key)))
    .filter(row => !supportedById.has(clean(row.source_external_key)))
    .filter(row => !selectedIds.has(clean(row.source_external_key)))
    .filter(isCompleteCandidate)
    .filter(row => Number(row.confidence) >= 0.8)
    .filter(row => row.websites?.length || row.socials?.length || row.phones?.length || row.emails?.length)
    .map(row => publicRow(row, 'overture_strong'))
    .sort(compareCandidates)
    .slice(0, Math.max(0, size - supportedRows.length));

  const rows = [...supportedRows, ...overtureRows].map((row, index) => ({
    verification_order: index + 1,
    ...row,
  }));
  if (rows.length !== size) {
    throw new Error(`Controlled batch requested ${size} records but only ${rows.length} eligible records were available`);
  }
  if (new Set(rows.map(row => row.source_external_key)).size !== rows.length) {
    throw new Error('Controlled batch contains duplicate Overture source keys');
  }
  return rows;
}

function csvValue(value) {
  const text = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function asCsv(rows) {
  const columns = [
    'verification_order', 'lane', 'name', 'address_line_1', 'locality', 'region_code', 'postal_code',
    'overture_confidence', 'verification_score', 'irs_ein', 'irs_legal_name', 'linked_websites',
    'linked_socials', 'linked_phones', 'why_selected',
  ];
  return `${columns.join(',')}\n${rows.map(row => columns.map(column => csvValue(row[column])).join(',')).join('\n')}\n`;
}

function parseCliArgs(args) {
  const options = {
    root: 'work/dallas-church-acquisition',
    batch: '001',
    size: 100,
    supportedTarget: 50,
  };
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (!value.startsWith('--')) {
      options.root = value;
      continue;
    }
    const [flag, inline] = value.split('=', 2);
    const next = inline ?? args[index + 1];
    if (inline === undefined) index += 1;
    if (flag === '--batch') options.batch = String(next).padStart(3, '0');
    else if (flag === '--size') options.size = Number(next);
    else if (flag === '--supported-target') options.supportedTarget = Number(next);
    else if (flag === '--root') options.root = next;
    else throw new Error(`Unknown argument ${flag}`);
  }
  if (!Number.isInteger(options.size) || options.size < 1) throw new Error('--size must be a positive integer');
  if (!Number.isInteger(options.supportedTarget) || options.supportedTarget < 0 || options.supportedTarget > options.size) {
    throw new Error('--supported-target must be an integer between 0 and --size');
  }
  if (!/^\d{3}$/.test(options.batch)) throw new Error('--batch must be a three-digit batch number');
  return options;
}

async function priorControlledSourceKeys(root, currentBatch) {
  const current = Number(currentBatch);
  const names = (await readdir(root, { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && /^controlled-batch-\d{3}$/.test(entry.name))
    .filter(entry => Number(entry.name.slice(-3)) < current)
    .map(entry => entry.name)
    .sort();
  const sourceKeys = [];
  for (const name of names) {
    const files = (await readdir(path.join(root, name)))
      .filter(filename => /^verify-next-\d+\.json$/.test(filename))
      .sort();
    for (const filename of files) {
      const rows = JSON.parse(await readFile(path.join(root, name, filename), 'utf8'));
      sourceKeys.push(...rows.map(row => row.source_external_key));
    }
  }
  return sourceKeys;
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  const root = path.resolve(options.root);
  const readJson = async filepath => JSON.parse(await readFile(filepath, 'utf8'));
  const [newChurches, supported, goldSample] = await Promise.all([
    readJson(path.join(root, 'results', 'new-churches.json')),
    readJson(path.join(root, 'reconciliation', 'irs-supported-records.json')),
    readJson(path.join(root, 'verification-sample', 'dallas-verification-sample.json')),
  ]);
  const goldSourceKeys = goldSample.flatMap(row => row.source_keys || []);
  const priorSourceKeys = await priorControlledSourceKeys(root, options.batch);
  const excludedSourceKeys = [...new Set([...goldSourceKeys, ...priorSourceKeys])];
  const rows = buildControlledVerificationBatch({
    newChurches,
    supported,
    excludedSourceKeys,
    size: options.size,
    supportedTarget: options.supportedTarget,
  });
  const outputDir = path.join(root, `controlled-batch-${options.batch}`);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, `verify-next-${options.size}.json`), `${JSON.stringify(rows, null, 2)}\n`);
  await writeFile(path.join(outputDir, `verify-next-${options.size}.csv`), asCsv(rows));
  const laneCounts = Object.fromEntries([...new Set(rows.map(row => row.lane))].map(lane => [lane, rows.filter(row => row.lane === lane).length]));
  const manifest = {
    generated_at: new Date().toISOString(),
    dry_run: true,
    production_writes: 0,
    total: rows.length,
    lanes: laneCounts,
    excluded_completed_gold_set_source_keys: goldSourceKeys.length,
    excluded_prior_controlled_source_keys: priorSourceKeys.length,
    purpose_scope: [...PURPOSES],
    prohibited_purposes: ['outreach', 'export', 'redistribution'],
    canonical_write_allowed: false,
  };
  await writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ output: outputDir, ...manifest }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
  });
}
