import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const projects = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const docs = readFileSync(new URL('../docs/ui-header-surface-contract.md', import.meta.url), 'utf8');

assert.match(app, /function getHeaderSurfaceMode\(screen, navSubTab\)/);
assert.match(app, /screen === "get-plugged-in"[\s\S]*KB_HEADER_SURFACE_MODE\.BROWSE/);
assert.match(app, /\["mine", "work"\]\.includes\(navSubTab\)[\s\S]*KB_HEADER_SURFACE_MODE\.WORK[\s\S]*KB_HEADER_SURFACE_MODE\.BROWSE/);
for (const screen of ['inbox', 'messages', 'reviews', 'profile', 'verify-profile', 'concierge']) {
  assert.ok(app.includes(`"${screen}"`), `work-surface mapping must include ${screen}`);
}
assert.match(app, /data-kb-header-mode=\{getHeaderSurfaceMode\(screen, navSubTab\)\}/);
assert.match(app, /\.platform-fullscreen-shell-inbox,[\s\S]*\.platform-fullscreen-shell-messages\{\s*background:#fffdf8;/);
assert.doesNotMatch(app, /\(screen==='inbox'\|\|screen==='messages'\)[^\n]*#090b10/);

assert.ok(projects.includes('kb-live-handpicked-hero'), 'Marketplace must retain its browse hero');
assert.ok(projects.includes('myproj-command-shell'), 'My Projects must retain its work header');
for (const heading of ['Browse mode', 'Work mode', 'Standard mode', 'Marketplace', 'Get Plugged In', 'My Projects', 'Deal Rooms', 'Reviews', 'Profile', 'Concierge']) {
  assert.ok(docs.includes(heading), `header contract must document ${heading}`);
}

console.log('B4a header contract passed: browse and work routes are explicit, documented, and Deal Rooms uses the light work shell.');
