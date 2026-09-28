import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const has = (re, msg) => assert.ok(re.test(app), msg);
// Count occurrences of the shared filter helper to make sure the sweep actually
// added new call sites rather than just reusing the same one.
const helperCalls = (app.match(/isHandleLikeChurchName\(/g) || []).length;

has(/avatarText=\{getInitialsSafe\(\[project\.church\]/, 'inbox card avatar text pulls from a filtered value');
has(/church:\[project\.church_name, project\.church\]\.map\(v => String\(v \|\| ''\)\.trim\(\)\)\.find\(v => v && !isHandleLikeChurchName\(v\)\) \|\| 'Church',/, 'saved/invited card builders filter handle-like church names (buildSavedCard + buildInvitedCard)');
has(/<span>\{\[project\.church_name, project\.church\]\.map\(v => String\(v \|\| ''\)\.trim\(\)\)\.find\(v => v && !isHandleLikeChurchName\(v\)\) \|\| 'Church'\}<\/span>/, 'saved-opportunities strip filters handle-like church names');
has(/\{\[proj\.church_name, proj\.church\]\.map\(v => String\(v \|\| ''\)\.trim\(\)\)\.find\(v => v && !isHandleLikeChurchName\(v\)\) \|\| "\/\/"\}/, 'bid-review list filters handle-like church names');
has(/church:  \[meta\.church_name, meta\.church\]\.map\(v => String\(v \|\| ''\)\.trim\(\)\)\.find\(v => v && !isHandleLikeChurchName\(v\)\)/, 'hire-confirmation modal filters handle-like church names');
has(/vendorWinModal\.church && !isHandleLikeChurchName\(vendorWinModal\.church\)/, 'hire-confirmation Message-church action filters handle-like church names');
has(/church: \[project\?\.church_name, project\?\.church\]\.map\(v => String\(v \|\| ''\)\.trim\(\)\)\.find\(v => v && !isHandleLikeChurchName\(v\)\) \|\| 'Church',/, 'the "In Progress" active-project card (buildBidCard) filters handle-like church names');
assert.ok(helperCalls >= 20, `expected the handle filter to be used broadly (>=20 call sites), found ${helperCalls}`);
console.log('church-name-sweep-round2: ok,', helperCalls, 'call sites');
