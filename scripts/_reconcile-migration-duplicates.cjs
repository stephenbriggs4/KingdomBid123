// R-63: for every migration "name" that has more than one file (different
// version prefixes), classify the relationship:
//  - identical: byte-identical after stripping SQL line comments and blank
//    lines (timestamp drift, or a hand-authored file vs. the comment-free
//    live pull of the same migration -- schema_migrations.statements
//    strips `-- comment` lines since they aren't executable statements)
//  - different: genuinely distinct SQL, e.g. two real separate live
//    migrations that happen to share a name
const fs = require('fs');
const path = require('path');

const dir = path.join('supabase', 'migrations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));

function stripComments(sql) {
  return sql
    .split(/\r?\n/)
    .map(line => line.replace(/--.*$/, '').trimEnd())
    .filter(line => line.trim() !== '')
    .join('\n')
    .trim();
}

const byName = new Map();
for (const f of files) {
  const m = f.match(/^(\d+)_(.+)\.sql$/);
  if (!m) continue;
  const [, version, name] = m;
  if (!byName.has(name)) byName.set(name, []);
  byName.get(name).push({ version, file: f });
}

const identicalGroups = [];
const differentGroups = [];
for (const [name, entries] of byName) {
  if (entries.length < 2) continue;
  entries.sort((a, b) => a.version.localeCompare(b.version));
  const bodies = entries.map(e => stripComments(fs.readFileSync(path.join(dir, e.file), 'utf8')));
  const allSame = bodies.every(b => b === bodies[0]);
  if (allSame) identicalGroups.push({ name, entries });
  else differentGroups.push({ name, entries, bodies: bodies.map((b, i) => ({ version: entries[i].version, preview: b.slice(0, 200) })) });
}

console.log('Identical (comment-insensitive):', identicalGroups.length);
console.log('Genuinely different:', differentGroups.length);

fs.writeFileSync('C:/Users/StephenBriggs/kingdombid-safety/reconcile_report.json', JSON.stringify({ identicalGroups, differentGroups }, null, 2));
console.log('\n=== DIFFERENT (needs manual look) ===');
for (const g of differentGroups) console.log(g.name, '->', g.entries.map(e => e.version).join(', '));
