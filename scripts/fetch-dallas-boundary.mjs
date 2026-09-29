import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const layerUrl = 'https://gis.dallascityhall.com/arcgis/rest/services/Basemap/CityLimits/MapServer/0';
const outputDir = path.resolve(process.argv[2] || 'work/dallas-boundary-native');
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

async function getBytes(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Dallas GIS request failed (${response.status})`);
  return Buffer.from(await response.arrayBuffer());
}

async function getJson(url) {
  const bytes = await getBytes(url);
  const data = JSON.parse(bytes.toString('utf8'));
  if (data.error) throw new Error(`Dallas GIS error: ${JSON.stringify(data.error)}`);
  return { bytes, data };
}

let metadata;
let metadataFormat = 'pjson';
try {
  metadata = await getJson(`${layerUrl}?f=pjson`);
} catch (error) {
  // The City service can temporarily fail only its metadata JSON renderer
  // while the layer HTML and query endpoint remain healthy. Preserve the
  // exact HTML response and derive CRS from the authoritative native query.
  metadataFormat = 'html_fallback';
  metadata = { bytes: await getBytes(layerUrl), data: null, warning: String(error) };
}

const countResponse = await getJson(`${layerUrl}/query?where=1%3D1&returnCountOnly=true&f=json`);
const expectedCount = countResponse.data.count;
const params = new URLSearchParams({
  where: '1=1',
  outFields: 'OBJECTID,CITY',
  returnGeometry: 'true',
  returnIdsOnly: 'false',
  f: 'json',
});
// Deliberately no outSR: this is the authoritative native-CRS response.
const native = await getJson(`${layerUrl}/query?${params}`);
const features = native.data.features || [];
const legacyWkid = native.data?.spatialReference?.wkid;
const wkid = native.data?.spatialReference?.latestWkid;
if (wkid !== 2276 || legacyWkid !== 102738) {
  throw new Error(`Unexpected native CRS: wkid=${legacyWkid}, latestWkid=${wkid}`);
}
if (features.length !== expectedCount) throw new Error(`Count mismatch: expected ${expectedCount}, received ${features.length}`);
if (!features.length || features.some((feature) => String(feature.attributes?.CITY || '').toLowerCase() !== 'dallas')) {
  throw new Error('Native response is empty or contains a non-Dallas feature');
}

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, metadataFormat === 'pjson' ? 'layer-metadata.json' : 'layer-metadata.html'), metadata.bytes);
await writeFile(path.join(outputDir, 'native-city-limits.json'), native.bytes);
const manifest = {
  source_url: layerUrl,
  retrieved_at: new Date().toISOString(),
  source_wkid: legacyWkid,
  source_latest_wkid: wkid,
  metadata_format: metadataFormat,
  metadata_warning: metadata.warning || null,
  query: Object.fromEntries(params),
  query_includes_outSR: false,
  expected_count: expectedCount,
  received_count: features.length,
  metadata_sha256: sha256(metadata.bytes),
  native_response_sha256: sha256(native.bytes),
  normalization_procedure_version: 'dallas_boundary_norm_v1',
};
await writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
