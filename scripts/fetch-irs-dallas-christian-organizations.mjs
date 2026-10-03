import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_URL = 'https://www.irs.gov/pub/irs-soi/eo_tx.csv';
const SOURCE_RELEASE_FALLBACK = '2026-09-08';
const CHRISTIAN_NTEE_CODES = new Set(['X20', 'X21', 'X22']);
const PURPOSES = ['research', 'verification', 'internal_analytics'];

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some(value => value !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows;
}

export function selectDallasChristianOrganizations(csvText) {
  const [headers, ...rows] = parseCsv(csvText);
  if (!headers?.includes('EIN') || !headers.includes('NTEE_CD') || !headers.includes('CITY')) {
    throw new Error('IRS EO BMF CSV is missing required columns');
  }
  const position = Object.fromEntries(headers.map((header, index) => [header, index]));
  const value = (row, key) => String(row[position[key]] ?? '').trim();
  return rows
    .filter(row => value(row, 'CITY').toUpperCase() === 'DALLAS')
    .filter(row => CHRISTIAN_NTEE_CODES.has(value(row, 'NTEE_CD').toUpperCase()))
    .map(row => ({
      ein: value(row, 'EIN').padStart(9, '0'),
      legal_name: value(row, 'NAME'),
      sort_name: value(row, 'SORT_NAME'),
      care_of_name: value(row, 'ICO'),
      street: value(row, 'STREET'),
      city: value(row, 'CITY'),
      state: value(row, 'STATE'),
      postal_code: value(row, 'ZIP'),
      ntee_code: value(row, 'NTEE_CD'),
      status_code: value(row, 'STATUS').padStart(2, '0'),
      subsection_code: value(row, 'SUBSECTION'),
      affiliation_code: value(row, 'AFFILIATION'),
      classification_code: value(row, 'CLASSIFICATION'),
      ruling_date: value(row, 'RULING'),
      deductibility_code: value(row, 'DEDUCTIBILITY'),
      tax_period: value(row, 'TAX_PERIOD'),
    }))
    .sort((left, right) => left.legal_name.localeCompare(right.legal_name) || left.ein.localeCompare(right.ein));
}

async function main() {
  const output = path.resolve(process.argv[2] || 'work/dallas-church-acquisition/irs-dallas-christian-organizations.json');
  const response = await fetch(SOURCE_URL, { headers: { accept: 'text/csv', 'user-agent': 'FaithBid-Church-Intelligence/1.0' } });
  if (!response.ok) throw new Error(`IRS EO BMF request failed (${response.status})`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const sourceRelease = response.headers.get('last-modified') || SOURCE_RELEASE_FALLBACK;
  const records = selectDallasChristianOrganizations(bytes.toString('utf8'));
  const document = {
    source: 'IRS Exempt Organizations Business Master File Extract',
    source_url: SOURCE_URL,
    source_release: sourceRelease,
    retrieved_at: new Date().toISOString(),
    content_sha256: createHash('sha256').update(bytes).digest('hex'),
    selection: { filing_city: 'DALLAS', ntee_codes: [...CHRISTIAN_NTEE_CODES] },
    limitation: 'Filing addresses may be headquarters rather than church sites, and churches that never applied for recognition are absent.',
    allowed_purposes: PURPOSES,
    production_writes: 0,
    records,
  };
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(document, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ output, records: records.length, source_release: sourceRelease }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
  });
}
