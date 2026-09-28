import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const has = (re, msg) => assert.ok(re.test(app), msg);

// Real bug found live: formatBudgetRangeTypography was defined only inside the
// ProjectsScreen IIFE, but detailBudgetParts (a true top-level function) called it,
// throwing ReferenceError and crashing the whole project detail page for every viewer.
has(/Top-level copy: detailBudgetParts lives outside the ProjectsScreen IIFE/, 'the scope-fix comment documents why the duplicate exists');
const detailBudgetPartsIdx = app.indexOf('function detailBudgetParts(rawBudget)');
const topLevelCopyIdx = app.lastIndexOf('function formatBudgetRangeTypography(value) {', detailBudgetPartsIdx);
assert.ok(topLevelCopyIdx > 0 && detailBudgetPartsIdx - topLevelCopyIdx < 400, 'a formatBudgetRangeTypography copy sits immediately before detailBudgetParts, in its own true top-level scope');

// R-16 gap found live: several church-name fallbacks skipped the handle check and
// still showed a raw account handle (e.g. "stephenbriggs0128") to vendors.
has(/const churchDisplayName = \(\(\) => \{[\s\S]{0,220}isHandleLikeChurchName/, 'the project-detail "About the church" card filters handle-like names');
has(/const shareText = `\$\{headline\} · \$\{churchDisplayName\}`;/, 'the share text uses the sanitized display name');
has(/const churchName = \[project\?\.church_name, project\?\.church\]\.map\(v => String\(v \|\| ''\)\.trim\(\)\)\.find\(v => v && !isHandleLikeChurchName\(v\)\) \|\| "the church";/, 'BidForm filters handle-like church names');
has(/const church = \[project\.church, p\?\.church_name, p\?\.church\][\s\S]{0,80}isHandleLikeChurchName[\s\S]{0,20}\|\| "Ministry";/, 'the marketplace project card filters handle-like church names');
has(/churchName: extra\?\.churchName \|\| \[project\.church, project\.church_name\][\s\S]{0,80}isHandleLikeChurchName/, 'inbox-thread creation filters handle-like church names');
console.log('church-name-scope-fix: ok');
