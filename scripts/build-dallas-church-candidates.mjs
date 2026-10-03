import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PURPOSES = Object.freeze(['research', 'verification', 'internal_analytics']);
const PARSER_VERSION = 'faithbid_dallas_overture_v1';

const clean = value => String(value ?? '').trim();
const fold = value => clean(value)
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\bsaint\b/g, 'st')
  .replace(/\bchurch of god in christ\b/g, 'cogic')
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

const sha256 = value => createHash('sha256').update(value).digest('hex');

function primaryName(names) {
  if (typeof names === 'string') return clean(names);
  if (typeof names?.primary === 'string') return clean(names.primary);
  return '';
}

function recordFromFeature(feature) {
  const properties = feature?.properties || {};
  const coordinates = feature?.geometry?.type === 'Point' ? feature.geometry.coordinates : [];
  return { ...properties, id: properties.id || feature.id, longitude: coordinates[0], latitude: coordinates[1] };
}

function overtureRecords(document) {
  if (Array.isArray(document)) return document;
  if (Array.isArray(document?.records)) return document.records;
  if (document?.type === 'FeatureCollection' && Array.isArray(document.features)) {
    return document.features.map(recordFromFeature);
  }
  throw new Error('Overture input must be an array, a {records: []} document, or GeoJSON FeatureCollection');
}

function firstAddress(record) {
  const address = Array.isArray(record.addresses) ? record.addresses[0] : record.address || {};
  return {
    address_line_1: clean(address?.freeform || address?.address_line_1),
    locality: clean(address?.locality || address?.city),
    region_code: clean(address?.region || address?.region_code).toUpperCase(),
    postal_code: clean(address?.postcode || address?.postal_code),
    country_code: clean(address?.country || address?.country_code || 'US').toUpperCase(),
  };
}

function hierarchyFor(record) {
  if (Array.isArray(record.taxonomy_hierarchy)) return record.taxonomy_hierarchy;
  if (Array.isArray(record.taxonomy?.hierarchy)) return record.taxonomy.hierarchy;
  return [];
}

function sourceAttributionFor(record) {
  if (!Array.isArray(record.sources)) return [];
  return record.sources.map(source => ({
    property: clean(source?.property),
    dataset: clean(source?.dataset),
    provider: clean(source?.provider),
    resource: clean(source?.resource),
    record_id: clean(source?.record_id),
    license: clean(source?.license),
    update_time: clean(source?.update_time),
    version: clean(source?.version),
  }));
}

function normalizeCandidate(record) {
  const address = firstAddress(record);
  const longitude = Number(record.longitude ?? record.bbox?.xmin);
  const latitude = Number(record.latitude ?? record.bbox?.ymin);
  const name = primaryName(record.name || record.names);
  const confidence = record.confidence == null ? null : Number(record.confidence);
  return {
    source_external_key: clean(record.id),
    name,
    normalized_name: fold(name),
    ...address,
    normalized_address: fold([address.address_line_1, address.locality, address.region_code, address.postal_code].filter(Boolean).join(' ')),
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    confidence: Number.isFinite(confidence) ? confidence : null,
    operating_status: clean(record.operating_status || 'unknown'),
    basic_category: clean(record.basic_category),
    taxonomy_primary: clean(record.taxonomy_primary || record.taxonomy?.primary),
    taxonomy_hierarchy: hierarchyFor(record).map(clean).filter(Boolean),
    source_attribution: sourceAttributionFor(record),
    websites: Array.isArray(record.websites) ? record.websites.map(clean).filter(Boolean) : [],
    socials: Array.isArray(record.socials) ? record.socials.map(clean).filter(Boolean) : [],
    emails: Array.isArray(record.emails) ? record.emails.map(clean).filter(Boolean) : [],
    phones: Array.isArray(record.phones) ? record.phones.map(clean).filter(Boolean) : [],
  };
}

function normalizeExisting(record) {
  const name = clean(record.canonical_name || record.name);
  const address = clean(record.normalized_address) || fold([
    record.address_line_1,
    record.locality,
    record.region_code,
    record.postal_code,
  ].filter(Boolean).join(' '));
  return {
    id: clean(record.id),
    name,
    normalized_name: fold(name),
    normalized_address: fold(address),
    locality: fold(record.locality),
    postal_code: fold(record.postal_code),
    latitude: Number.isFinite(Number(record.latitude)) ? Number(record.latitude) : null,
    longitude: Number.isFinite(Number(record.longitude)) ? Number(record.longitude) : null,
  };
}

function pointInRing([x, y], ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [xi, yi] = ring[index];
    const [xj, yj] = ring[previous];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point, polygon) {
  if (!polygon?.length || !pointInRing(point, polygon[0])) return false;
  return !polygon.slice(1).some(ring => pointInRing(point, ring));
}

export function pointInBoundary(point, boundaryDocument) {
  const geometries = boundaryDocument?.type === 'FeatureCollection'
    ? boundaryDocument.features.map(feature => feature.geometry)
    : boundaryDocument?.type === 'Feature'
      ? [boundaryDocument.geometry]
      : [boundaryDocument];
  return geometries.some(geometry => {
    if (geometry?.type === 'Polygon') return pointInPolygon(point, geometry.coordinates);
    if (geometry?.type === 'MultiPolygon') return geometry.coordinates.some(polygon => pointInPolygon(point, polygon));
    return false;
  });
}

function distanceMeters(a, b) {
  if ([a.latitude, a.longitude, b.latitude, b.longitude].some(value => value == null)) return null;
  const radians = degrees => degrees * Math.PI / 180;
  const lat = radians(b.latitude - a.latitude);
  const lon = radians(b.longitude - a.longitude);
  const value = Math.sin(lat / 2) ** 2
    + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(lon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function tokenSimilarity(left, right) {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const a = new Set(left.split(' '));
  const b = new Set(right.split(' '));
  const intersection = [...a].filter(token => b.has(token)).length;
  return intersection / (a.size + b.size - intersection);
}

function matchCandidate(candidate, existing) {
  let best = null;
  for (const record of existing) {
    const addressMatch = Boolean(candidate.normalized_address && candidate.normalized_address === record.normalized_address);
    const nameScore = tokenSimilarity(candidate.normalized_name, record.normalized_name);
    const distance = distanceMeters(candidate, record);
    const samePostalCode = Boolean(candidate.postal_code && fold(candidate.postal_code) === record.postal_code);
    let reason = null;
    let score = 0;
    if (addressMatch) {
      reason = 'same normalized address';
      score = 1;
    } else if (nameScore === 1 && (samePostalCode || distance != null && distance <= 500)) {
      reason = 'same name in the same area';
      score = 0.97;
    } else if (nameScore >= 0.8 && distance != null && distance <= 250) {
      reason = 'very similar name and nearby location';
      score = Math.min(0.96, nameScore + 0.1);
    }
    if (reason && (!best || score > best.match_score)) {
      best = { matched_existing_id: record.id, matched_existing_name: record.name, reason, match_score: score, distance_m: distance == null ? null : Math.round(distance) };
    }
  }
  return best;
}

function qualityProblems(candidate, minimumConfidence) {
  const problems = [];
  if (!candidate.name) problems.push('missing name');
  if (!candidate.address_line_1) problems.push('missing street address');
  if (!candidate.locality) problems.push('missing city');
  else if (fold(candidate.locality) !== 'dallas') problems.push('address city disagrees with Dallas boundary point');
  if (candidate.region_code && candidate.region_code !== 'TX') problems.push('address state is not Texas');
  if (candidate.country_code && candidate.country_code !== 'US') problems.push('address country is not United States');
  if (candidate.latitude == null || candidate.longitude == null) problems.push('missing coordinates');
  if (candidate.confidence == null) problems.push('missing confidence');
  else if (candidate.confidence < minimumConfidence) problems.push(`confidence below ${minimumConfidence}`);
  if (candidate.operating_status === 'permanently_closed') problems.push('marked permanently closed');
  return problems;
}

function duplicateKey(candidate) {
  if (candidate.normalized_address) return `address:${candidate.normalized_address}`;
  if (candidate.normalized_name && candidate.latitude != null && candidate.longitude != null) {
    return `point:${candidate.normalized_name}:${candidate.latitude.toFixed(3)}:${candidate.longitude.toFixed(3)}`;
  }
  return `source:${candidate.source_external_key}`;
}

function publicCandidate(candidate) {
  const result = { ...candidate };
  delete result.normalized_name;
  return result;
}

export function classifyDallasCandidates({ overture, existing = [], boundary, minimumConfidence = 0.55 }) {
  const stats = { input: 0, christian: 0, outside_dallas: 0, closed: 0, repeated_source_records: 0 };
  const normalizedExisting = existing.map(normalizeExisting);
  const seen = new Map();
  const newChurches = [];
  const likelyDuplicates = [];
  const needsMoreInformation = [];

  for (const rawRecord of overtureRecords(overture)) {
    stats.input += 1;
    const candidate = normalizeCandidate(rawRecord);
    if (!candidate.taxonomy_hierarchy.includes('christian_place_of_worship')) continue;
    stats.christian += 1;
    if (candidate.latitude == null || candidate.longitude == null || !pointInBoundary([candidate.longitude, candidate.latitude], boundary)) {
      stats.outside_dallas += 1;
      continue;
    }
    if (candidate.operating_status === 'permanently_closed') stats.closed += 1;

    const key = duplicateKey(candidate);
    const prior = seen.get(key);
    if (prior) {
      stats.repeated_source_records += 1;
      likelyDuplicates.push({ ...publicCandidate(candidate), duplicate_of_source_key: prior.source_external_key, reason: 'duplicate within Overture extract', match_score: 1 });
      continue;
    }
    seen.set(key, candidate);

    const match = matchCandidate(candidate, normalizedExisting);
    if (match) {
      likelyDuplicates.push({ ...publicCandidate(candidate), ...match });
      continue;
    }
    const problems = qualityProblems(candidate, minimumConfidence);
    if (problems.length) {
      needsMoreInformation.push({ ...publicCandidate(candidate), problems });
      continue;
    }
    newChurches.push(publicCandidate(candidate));
  }

  const byName = (a, b) => a.name.localeCompare(b.name) || a.source_external_key.localeCompare(b.source_external_key);
  newChurches.sort(byName);
  likelyDuplicates.sort(byName);
  needsMoreInformation.sort(byName);
  return { stats, newChurches, likelyDuplicates, needsMoreInformation };
}

function csvValue(value) {
  const text = Array.isArray(value) ? value.join(' | ') : typeof value === 'object' && value !== null ? JSON.stringify(value) : clean(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function asCsv(rows) {
  if (!rows.length) return 'name,source_external_key,address_line_1,locality,region_code,postal_code,confidence,reason_or_problems\n';
  const columns = ['name', 'source_external_key', 'address_line_1', 'locality', 'region_code', 'postal_code', 'latitude', 'longitude', 'confidence', 'reason', 'problems', 'matched_existing_name', 'matched_existing_id'];
  return `${columns.join(',')}\n${rows.map(row => columns.map(column => csvValue(row[column])).join(',')).join('\n')}\n`;
}

function researchBundles(rows, release) {
  return rows.map(row => ({
    source: {
      source_key: 'overture_places',
      source_external_key: row.source_external_key,
      source_release: release,
      source_schema_version: '2.0.0',
      retention_mode: 'metadata_only',
      license_name: 'CDLA Permissive 2.0',
      source_attribution: row.source_attribution,
    },
    effective_rights: {
      allowed_purposes: [...PURPOSES],
      current_use_ceiling: [...PURPOSES],
      outreach_allowed: false,
      export_allowed: false,
      redistribution_allowed: false,
    },
    proposed_record: row,
    action: 'human verification required before canonical creation',
  }));
}

async function runCli() {
  const args = new Map();
  for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index], process.argv[index + 1]);
  for (const required of ['--overture', '--existing', '--boundary']) {
    if (!args.get(required)) throw new Error(`Missing required argument ${required}`);
  }
  const outputDir = path.resolve(args.get('--output') || 'work/dallas-church-acquisition/results');
  const minimumConfidence = Number(args.get('--minimum-confidence') || 0.55);
  const [overtureBytes, existingBytes, boundaryBytes] = await Promise.all([
    readFile(path.resolve(args.get('--overture'))),
    readFile(path.resolve(args.get('--existing'))),
    readFile(path.resolve(args.get('--boundary'))),
  ]);
  const overture = JSON.parse(overtureBytes);
  const existingDocument = JSON.parse(existingBytes);
  const existing = Array.isArray(existingDocument) ? existingDocument : existingDocument.records || existingDocument.sites || [];
  const boundary = JSON.parse(boundaryBytes);
  const classified = classifyDallasCandidates({ overture, existing, boundary, minimumConfidence });
  const release = clean(overture.release || args.get('--release') || 'unknown');
  await mkdir(outputDir, { recursive: true });

  const outputs = {
    'new-churches.json': classified.newChurches,
    'likely-duplicates.json': classified.likelyDuplicates,
    'needs-more-information.json': classified.needsMoreInformation,
    'research-bundles.json': researchBundles(classified.newChurches, release),
  };
  for (const [filename, rows] of Object.entries(outputs)) {
    await writeFile(path.join(outputDir, filename), `${JSON.stringify(rows, null, 2)}\n`);
  }
  await writeFile(path.join(outputDir, 'new-churches.csv'), asCsv(classified.newChurches));
  await writeFile(path.join(outputDir, 'likely-duplicates.csv'), asCsv(classified.likelyDuplicates));
  await writeFile(path.join(outputDir, 'needs-more-information.csv'), asCsv(classified.needsMoreInformation));

  const manifest = {
    generated_at: new Date().toISOString(),
    parser_version: PARSER_VERSION,
    dry_run: true,
    production_writes: 0,
    release,
    minimum_confidence: minimumConfidence,
    purpose_scope: [...PURPOSES],
    counts: {
      ...classified.stats,
      new_churches: classified.newChurches.length,
      likely_duplicates: classified.likelyDuplicates.length,
      needs_more_information: classified.needsMoreInformation.length,
    },
    input_hashes: {
      overture_sha256: sha256(overtureBytes),
      existing_sha256: sha256(existingBytes),
      boundary_sha256: sha256(boundaryBytes),
    },
  };
  await writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ output: outputDir, ...manifest.counts }, null, 2)}\n`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  runCli().catch(error => {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
  });
}
