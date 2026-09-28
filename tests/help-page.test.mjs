import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const has = (re, message) => assert.ok(re.test(src), message);

has(/"about","help","unsubscribe","privacy","terms","activity"/, '#help is a registered route (not a 404)');
has(/screen==="help"\s+&& <HelpModal asPage/, 'help route renders the Help & FAQ page');
has(/help: 'Help & FAQ — FaithBid'/, 'help has its own document title');
has(/privacy: 'Privacy — FaithBid'/, 'privacy has its own document title');
has(/terms: 'Terms — FaithBid'/, 'terms has its own document title');
has(/nav\?\.\("help"\);\}\}>Help<\/a>/, 'public footer links to Help');
has(/Still need help\?/, 'help page shows a clear way to contact support');
console.log('help-page: ok');
