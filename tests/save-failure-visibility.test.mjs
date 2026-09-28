import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const has = (re, msg) => assert.ok(re.test(app), msg);
const no = (re, msg) => assert.ok(!re.test(app), msg);

has(/const reportSaveFailure = \(where, err, meta = \{\}\) => \{[\s\S]{0,200}logError\(where, err, meta\);/, 'save failures are reported to Sentry through logError');
has(/new CustomEvent\("kb:save-failed"/, 'save failures notify the app shell');
has(/addEventListener\("kb:save-failed", onSaveFailed\)/, 'the shell listens for save failures');
has(/Some changes could not be saved/, 'the user sees a plain "not saved" message');
has(/reportSaveFailure\('project-workspace-sync'/, 'workspace sync failures are no longer swallowed');
has(/reportSaveFailure\('project-event-post'/, 'project event post failures are no longer swallowed');
has(/reportSaveFailure\('project-ops-legacy-feed'/, 'legacy feed failures are no longer dev-only');
has(/logError\('hire-confirmation-rpc'/, 'hire confirmation failures reach Sentry');
no(/console\.warn\('\[kb\] persistProjectWorkspaceSync/, 'workspace sync is not dev-only anymore');
console.log('save-failure-visibility: ok');
