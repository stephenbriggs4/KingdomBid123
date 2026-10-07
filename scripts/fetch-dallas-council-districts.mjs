import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const layerUrl = 'https://gis.dallascityhall.com/arcgis/rest/services/Basemap/CouncilAreas/MapServer/0';
const outputDir = path.resolve(process.argv[2] || 'work/dallas-council-districts-native');
const sha256 = value => createHash('sha256').update(value).digest('hex');

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

function nativeFeatureWkt(feature) {
  const rings = feature.geometry?.rings || [];
  // The verified 2026 layer has one exterior ring per district. Fail closed
  // if the City changes that shape rather than guessing at multipart/hole
  // relationships in Esri JSON.
  if (rings.length !== 1 || rings[0].length < 4) {
    throw new Error(`District ${feature.attributes?.COUNCIL} no longer has exactly one valid native ring`);
  }
  const ring = rings[0];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    throw new Error(`District ${feature.attributes?.COUNCIL} native ring is not closed`);
  }
  return `POLYGON((${ring.map(point => `${Number(point[0])} ${Number(point[1])}`).join(',')}))`;
}

let metadata;
let metadataFormat = 'pjson';
try {
  metadata = await getJson(`${layerUrl}?f=pjson`);
} catch (error) {
  metadataFormat = 'html_fallback';
  metadata = { bytes: await getBytes(layerUrl), data: null, warning: String(error) };
}

const countResponse = await getJson(`${layerUrl}/query?where=1%3D1&returnCountOnly=true&f=json`);
const expectedCount = countResponse.data.count;
if (expectedCount !== 14) throw new Error(`Expected 14 council districts, received count ${expectedCount}`);

const params = new URLSearchParams({
  where: '1=1',
  // COUNCILPER is intentionally excluded: it is a point-in-time officeholder,
  // not stable boundary data.
  outFields: 'OBJECTID,COUNCIL,DISTRICT',
  returnGeometry: 'true',
  returnIdsOnly: 'false',
  f: 'json',
});
// Deliberately no outSR: native EPSG:2276 is the authoritative import.
const native = await getJson(`${layerUrl}/query?${params}`);
const features = native.data.features || [];
const legacyWkid = native.data?.spatialReference?.wkid;
const wkid = native.data?.spatialReference?.latestWkid;
if (wkid !== 2276 || legacyWkid !== 102738) {
  throw new Error(`Unexpected native CRS: wkid=${legacyWkid}, latestWkid=${wkid}`);
}
if (features.length !== 14) throw new Error(`Expected 14 native features, received ${features.length}`);
const districts = features.map(feature => Number(feature.attributes?.COUNCIL)).sort((a, b) => a - b);
if (districts.join(',') !== '1,2,3,4,5,6,7,8,9,10,11,12,13,14') {
  throw new Error(`Unexpected district numbers: ${districts.join(',')}`);
}

const wgs84Params = new URLSearchParams({
  where: '1=1',
  outFields: 'OBJECTID,COUNCIL,DISTRICT',
  returnGeometry: 'true',
  outSR: '4326',
  f: 'geojson',
});
const wgs84 = await getJson(`${layerUrl}/query?${wgs84Params}`);
if (wgs84.data?.type !== 'FeatureCollection' || wgs84.data.features?.length !== 14) {
  throw new Error('Derived WGS84 response is missing or has an unexpected feature count');
}
if (wgs84.data.features.some(feature => !['Polygon','MultiPolygon'].includes(feature.geometry?.type))) {
  throw new Error('Derived WGS84 response contains a non-polygon geometry');
}

const retrievedAt = new Date().toISOString();
const stagePayloads = features
  .map(feature => {
    const district = Number(feature.attributes.COUNCIL);
    const featureBytes = Buffer.from(JSON.stringify(feature));
    const nativeWkt = nativeFeatureWkt(feature);
    return {
      council_district: district,
      source_external_key: `dallas-council-district-${district}`,
      source_url: `${layerUrl}/query?where=COUNCIL%3D${district}&outFields=OBJECTID%2CCOUNCIL%2CDISTRICT&returnGeometry=true&f=json`,
      retrieved_at: retrievedAt,
      content_hash: sha256(featureBytes),
      extraction_hash: sha256(Buffer.from(nativeWkt)),
      native_wkt: nativeWkt,
      version_label: `dallas-council-district-${String(district).padStart(2,'0')}-2023-v1`,
      transformation_metadata: {
        boundary_scope: 'district',
        council_district: district,
        source_object_id: feature.attributes.OBJECTID,
        source_field: 'COUNCIL',
        source_field_value: district,
        effective_date: '2023-05-06',
        source_srid: 2276,
        normalized_srid: 4326,
        officeholder_field_stored: false,
      },
    };
  })
  .sort((a, b) => a.council_district - b.council_district);

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, metadataFormat === 'pjson' ? 'layer-metadata.json' : 'layer-metadata.html'), metadata.bytes);
await writeFile(path.join(outputDir, 'native-council-districts.json'), native.bytes);
await writeFile(path.join(outputDir, 'council-districts-wgs84.geojson'), wgs84.bytes);
await writeFile(path.join(outputDir, 'stage-payloads.json'), `${JSON.stringify(stagePayloads, null, 2)}\n`);

const manifest = {
  source_url: layerUrl,
  retrieved_at: retrievedAt,
  source_wkid: legacyWkid,
  source_latest_wkid: wkid,
  metadata_format: metadataFormat,
  metadata_warning: metadata.warning || null,
  query: Object.fromEntries(params),
  query_includes_outSR: false,
  expected_count: 14,
  received_count: features.length,
  district_numbers: districts,
  raw_native_bytes: native.bytes.length,
  native_response_sha256: sha256(native.bytes),
  derived_wgs84_response_sha256: sha256(wgs84.bytes),
  derived_wgs84_query: Object.fromEntries(wgs84Params),
  derived_wgs84_use: 'map QA only; native EPSG:2276 remains authoritative',
  normalization_procedure_version: 'dallas_boundary_norm_v1',
  officeholder_field_stored: false,
};
await writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
