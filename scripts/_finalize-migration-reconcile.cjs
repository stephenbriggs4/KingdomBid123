// R-63 final pass: given the live version set (authoritative) and the
// current local supabase/migrations/ directory (which now has duplicates:
// old locally-invented timestamps alongside true live-pulled timestamps),
// resolve every duplicate name group down to exactly the file(s) matching
// real live versions.
//
// Policy:
//  - identical-content groups (comment-insensitive): keep exactly one file
//    under the live-matching version number. Prefer the body that has
//    comments (more documentation) if the live-pulled one is comment-free;
//    otherwise keep the live-pulled body. Delete the other file(s).
//  - genuinely-different groups: keep only the file(s) whose version is a
//    real live version for that name; delete any local-only-timestamped
//    file whose version isn't live at all (it was a draft/earlier attempt
//    superseded by what's actually deployed).
const fs = require('fs');
const path = require('path');

const dir = path.join('supabase', 'migrations');
const liveVersions = new Set(JSON.parse(fs.readFileSync('C:/Users/StephenBriggs/kingdombid-safety/live_versions.json', 'utf8')));

const report = JSON.parse(fs.readFileSync('C:/Users/StephenBriggs/kingdombid-safety/reconcile_report.json', 'utf8'));

function stripComments(sql) {
  return sql.split(/\r?\n/).map(l => l.replace(/--.*$/, '').trimEnd()).filter(l => l.trim() !== '').join('\n').trim();
}

let deleted = 0, renamed = 0, kept = 0;

for (const g of report.identicalGroups) {
  const withPaths = g.entries.map(e => ({ ...e, path: path.join(dir, e.file), body: fs.readFileSync(path.join(dir, e.file), 'utf8') }));
  const liveEntry = withPaths.find(e => liveVersions.has(e.version));
  if (!liveEntry) { console.log('WARN: no live version found for identical group', g.name); continue; }
  // Prefer the longest body (most likely to have comments) as the content to keep.
  const bestBody = withPaths.reduce((a, b) => (b.body.length > a.body.length ? b : a)).body;
  const targetPath = path.join(dir, `${liveEntry.version}_${g.name}.sql`);
  fs.writeFileSync(targetPath, bestBody, 'utf8');
  for (const e of withPaths) {
    if (e.path !== targetPath) { fs.unlinkSync(e.path); deleted++; }
  }
  renamed++;
}

for (const g of report.differentGroups) {
  const withPaths = g.entries.map(e => ({ ...e, path: path.join(dir, e.file) }));
  for (const e of withPaths) {
    if (liveVersions.has(e.version)) {
      kept++;
    } else {
      fs.unlinkSync(e.path);
      deleted++;
      console.log('Deleted non-live draft:', e.file);
    }
  }
}

console.log('\nSummary: renamed/deduped', renamed, 'identical groups; deleted', deleted, 'redundant files; kept', kept, 'live files from different-content groups.');
