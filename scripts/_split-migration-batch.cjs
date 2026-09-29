// R-63: parses a staging text file (written from a batched Supabase SQL
// extraction, using the delimiter format below) and writes each migration
// out as its own properly named file in supabase/migrations/.
const fs = require('fs');
const path = require('path');

const stagingFile = process.argv[2];
if (!stagingFile) throw new Error('usage: node _split-migration-batch.cjs <staging-file>');

const raw = fs.readFileSync(stagingFile, 'utf8');
// The MCP tool wraps its result as {"result": "...<untrusted-data-ID>\n[{\"out\":\"...\"}]\n</untrusted-data-ID>..."}.
// Extract the JSON array between the untrusted-data tags and pull `out`.
const outer = JSON.parse(raw);
const resultText = outer.result;
const arrayMatch = resultText.match(/\n(\[.*\])\n<\/untrusted-data-/s);
if (!arrayMatch) throw new Error('could not find embedded JSON array in tool output');
const parsed = JSON.parse(arrayMatch[1]);
const text = parsed[0].out;
const blocks = text.split('-----MIGRATION-START-----').slice(1);
let written = 0;
for (const block of blocks) {
  const endIdx = block.indexOf('-----MIGRATION-END-----');
  const body = endIdx === -1 ? block : block.slice(0, endIdx);
  const lines = body.split('\n');
  // lines[0] is empty (right after the delimiter+newline), version is lines[1], name lines[2]
  let i = 0;
  while (lines[i] !== undefined && lines[i].trim() === '') i++;
  const version = lines[i].trim();
  const name = lines[i + 1].trim();
  const sqlStartMarker = lines.indexOf('-----SQL-----', i);
  const sql = lines.slice(sqlStartMarker + 1).join('\n').replace(/\s+$/, '') + '\n';
  const filename = `${version}_${name}.sql`;
  const outPath = path.join('supabase', 'migrations', filename);
  fs.writeFileSync(outPath, sql, 'utf8');
  written++;
  console.log('wrote', filename, sql.length, 'bytes');
}
console.log('Total written:', written);
