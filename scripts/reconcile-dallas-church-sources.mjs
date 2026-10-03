import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const clean = value => String(value ?? '').trim();
const normalize = value => clean(value)
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\bsaint\b/g, 'st')
  .replace(/\bchurch of god in christ\b/g, 'cogic')
  .replace(/\b(incorporated|corporation|inc|corp)\b/g, ' ')
  .replace(/\b(road|rd)\b/g, 'rd')
  .replace(/\b(street|st)\b/g, 'st')
  .replace(/\b(avenue|ave)\b/g, 'ave')
  .replace(/\b(boulevard|blvd)\b/g, 'blvd')
  .replace(/\b(drive|dr)\b/g, 'dr')
  .replace(/\b(lane|ln)\b/g, 'ln')
  .replace(/\b(highway|hwy)\b/g, 'hwy')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ');

const zip5 = value => clean(value).match(/^\d{5}/)?.[0] || '';
const CHURCH_NAME_PATTERN = /\b(church|chapel|cathedral|parish|congregation|tabernacle|basilica|iglesia|eglise|templo|worship center|worship centre|kingdom hall)\b/i;
const MAILING_ADDRESS_PATTERN = /(^|\s)(p\.?\s*o\.?\s*box|pmb|apt|apartment)(\s|$)/i;

function tokenSimilarity(left, right) {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const a = new Set(left.split(' '));
  const b = new Set(right.split(' '));
  const intersection = [...a].filter(token => b.has(token)).length;
  return intersection / (a.size + b.size - intersection);
}

function candidateRecord(row, bucket) {
  return {
    candidate_id: clean(row.source_external_key || row.id),
    candidate_name: clean(row.name || row.canonical_name),
    candidate_street: clean(row.address_line_1),
    candidate_postal_code: clean(row.postal_code),
    normalized_name: normalize(row.name || row.canonical_name),
    normalized_street: normalize(row.address_line_1),
    zip5: zip5(row.postal_code),
    bucket,
  };
}

function publicMatch(candidate) {
  const result = { ...candidate };
  delete result.normalized_name;
  delete result.normalized_street;
  delete result.zip5;
  return result;
}

export function reconcileIrsWithDallasCandidates({ irsRecords, overtureBuckets, existing }) {
  const candidates = [
    ...existing.map(row => candidateRecord(row, 'existing_canonical')),
    ...Object.entries(overtureBuckets).flatMap(([bucket, rows]) => rows.map(row => candidateRecord(row, bucket))),
  ].filter(row => row.candidate_name);
  const matches = [];
  const ambiguous = [];
  const irsOnly = [];

  for (const irs of irsRecords) {
    const irsName = normalize(irs.legal_name);
    const irsStreet = normalize(irs.street);
    const irsZip = zip5(irs.postal_code);
    const exactAddress = candidates.filter(candidate => irsStreet && candidate.normalized_street === irsStreet && (!irsZip || !candidate.zip5 || candidate.zip5 === irsZip));
    if (exactAddress.length === 1) {
      matches.push({ irs, candidate: publicMatch(exactAddress[0]), basis: 'same street address', match_score: 1 });
      continue;
    }
    if (exactAddress.length > 1) {
      ambiguous.push({ irs, candidates: exactAddress.map(publicMatch), reason: 'multiple church records share the IRS street address' });
      continue;
    }
    const sameNameAndZip = candidates.filter(candidate => irsName && candidate.normalized_name === irsName && irsZip && candidate.zip5 === irsZip);
    if (sameNameAndZip.length === 1) {
      matches.push({ irs, candidate: publicMatch(sameNameAndZip[0]), basis: 'same normalized name and ZIP code', match_score: 0.97 });
      continue;
    }
    if (sameNameAndZip.length > 1) {
      ambiguous.push({ irs, candidates: sameNameAndZip.map(publicMatch), reason: 'multiple records share the IRS name and ZIP code' });
      continue;
    }
    const fuzzy = candidates
      .map(candidate => ({ candidate, score: tokenSimilarity(irsName, candidate.normalized_name) }))
      .filter(item => item.score >= 0.72 && irsZip && item.candidate.zip5 === irsZip)
      .sort((left, right) => right.score - left.score)
      .slice(0, 5);
    if (fuzzy.length) {
      ambiguous.push({ irs, candidates: fuzzy.map(item => ({ ...publicMatch(item.candidate), name_similarity: item.score })), reason: 'similar name in the same ZIP code' });
      continue;
    }
    const possibleSiteLead = CHURCH_NAME_PATTERN.test(irs.legal_name) && irs.street && !MAILING_ADDRESS_PATTERN.test(irs.street);
    irsOnly.push({
      ...irs,
      lead_type: possibleSiteLead ? 'possible_missing_church' : 'organization_only',
      reason: possibleSiteLead
        ? 'church-like legal name and non-mailbox address, but the operating site is still unverified'
        : 'no strong location match; legal organization is not evidence of a Dallas church site',
    });
  }
  return { matches, ambiguous, irsOnly };
}

function csvValue(value) {
  return `"${clean(value).replaceAll('"', '""')}"`;
}

function rowsToCsv(rows, kind) {
  const columns = kind === 'matches'
    ? ['ein', 'legal_name', 'street', 'postal_code', 'candidate_name', 'candidate_street', 'bucket', 'basis', 'match_score']
    : ['ein', 'legal_name', 'street', 'postal_code', 'reason'];
  const flat = rows.map(row => kind === 'matches'
    ? { ...row.irs, ...row.candidate, basis: row.basis, match_score: row.match_score }
    : row.irs ? { ...row.irs, reason: row.reason } : row);
  return `${columns.join(',')}\n${flat.map(row => columns.map(column => csvValue(row[column])).join(',')).join('\n')}\n`;
}

async function main() {
  const root = path.resolve(process.argv[2] || 'work/dallas-church-acquisition');
  const resultsDir = path.join(root, 'results');
  const outputDir = path.join(root, 'reconciliation');
  const readJson = async filepath => JSON.parse(await readFile(filepath, 'utf8'));
  const [irs, existing, newChurches, duplicates, needsInformation] = await Promise.all([
    readJson(path.join(root, 'irs-dallas-christian-organizations.json')),
    readJson(path.resolve('work/dallas-boundary-native/sites.json')),
    readJson(path.join(resultsDir, 'new-churches.json')),
    readJson(path.join(resultsDir, 'likely-duplicates.json')),
    readJson(path.join(resultsDir, 'needs-more-information.json')),
  ]);
  const result = reconcileIrsWithDallasCandidates({
    irsRecords: irs.records,
    existing: Array.isArray(existing) ? existing : existing.records || existing.sites || [],
    overtureBuckets: { apparent_new: newChurches, possible_duplicate: duplicates, needs_information: needsInformation },
  });
  const possibleMissingChurches = result.irsOnly.filter(row => row.lead_type === 'possible_missing_church');
  const organizationOnlyLeads = result.irsOnly.filter(row => row.lead_type === 'organization_only');
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'irs-supported-records.json'), `${JSON.stringify(result.matches, null, 2)}\n`);
  await writeFile(path.join(outputDir, 'ambiguous-irs-matches.json'), `${JSON.stringify(result.ambiguous, null, 2)}\n`);
  await writeFile(path.join(outputDir, 'irs-only-organizations.json'), `${JSON.stringify(result.irsOnly, null, 2)}\n`);
  await writeFile(path.join(outputDir, 'possible-missing-churches.json'), `${JSON.stringify(possibleMissingChurches, null, 2)}\n`);
  await writeFile(path.join(outputDir, 'organization-only-leads.json'), `${JSON.stringify(organizationOnlyLeads, null, 2)}\n`);
  await writeFile(path.join(outputDir, 'irs-supported-records.csv'), rowsToCsv(result.matches, 'matches'));
  await writeFile(path.join(outputDir, 'ambiguous-irs-matches.csv'), rowsToCsv(result.ambiguous, 'ambiguous'));
  await writeFile(path.join(outputDir, 'irs-only-organizations.csv'), rowsToCsv(result.irsOnly, 'irsOnly'));
  await writeFile(path.join(outputDir, 'possible-missing-churches.csv'), rowsToCsv(possibleMissingChurches, 'irsOnly'));
  await writeFile(path.join(outputDir, 'organization-only-leads.csv'), rowsToCsv(organizationOnlyLeads, 'irsOnly'));
  const summary = {
    generated_at: new Date().toISOString(),
    dry_run: true,
    production_writes: 0,
    irs_records: irs.records.length,
    supported_records: result.matches.length,
    ambiguous_matches: result.ambiguous.length,
    irs_only_organizations: result.irsOnly.length,
    possible_missing_churches: possibleMissingChurches.length,
    organization_only_leads: organizationOnlyLeads.length,
    warning: 'IRS records are legal organizations with Dallas filing addresses, not proof of an operating church site.',
  };
  await writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ output: outputDir, ...summary }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
  });
}
