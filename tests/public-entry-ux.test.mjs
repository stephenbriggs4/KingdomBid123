import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appUrl = new URL('../src/App.jsx', import.meta.url);
const indexUrl = new URL('../index.html', import.meta.url);

test('the prelaunch homepage is church-first and truth-first', async () => {
  const source = await readFile(appUrl, 'utf8');
  const landingStart = source.indexOf('function LandingScreen(');
  const landingEnd = source.indexOf('function LandingChurchTrustStrip(');
  const landing = source.slice(landingStart, landingEnd);

  assert.ok(landingStart >= 0 && landingEnd > landingStart);
  // The pilot copy lives in the module-level LANDING_HERO_SUBTITLE constant
  // (referenced via JSX interpolation inside LandingScreen), not inline in
  // the function body itself -- check the full source, not the `landing` slice.
  assert.match(source, /LANDING_HERO_SUBTITLE = LAUNCHED[\s\S]{0,300}our first Dallas pilot takes shape/);
  assert.doesNotMatch(landing, /fb-landing-pilot-note/);
  assert.match(landing, /Request Church Access/);
  assert.match(landing, /Apply as a Vendor/);
  assert.ok(landing.indexOf('Request Church Access') < landing.indexOf('Apply as a Vendor'), 'church access must remain the primary CTA');
  assert.doesNotMatch(landing, /Reserve vendor access/);
  assert.doesNotMatch(landing, /<LandingFaithVerified/);
  assert.equal((landing.match(/<LandingChurchTrustStrip\s*\/>/g) || []).length, 1);
  // Same footer link fixed in landing-footer.test.mjs: it's a button that
  // calls nav("get-plugged-in") now, not an <a href="#get-plugged-in"> anchor.
  assert.match(source, /nav\??\.?\("get-plugged-in"\)/);
});

test('the static browser title uses the public FaithBid brand', async () => {
  const html = await readFile(indexUrl, 'utf8');
  assert.match(html, /<title>FaithBid — Faith-Aligned Marketplace<\/title>/);
  assert.doesNotMatch(html, /<title>kingdombid<\/title>/i);
});

test('founder sessions show effective role plus explicit admin access', async () => {
  const source = await readFile(appUrl, 'utf8');

  assert.match(source, /className="kb-effective-admin-badge">Admin<\/span>/);
  assert.match(source, /Admin access/);
  assert.match(source, /isAdminUser\(currentUser, userProfile\)/);
  assert.match(source, /const isAdmin = isAdminUser\(currentUser, userProfile\);/);
  assert.doesNotMatch(source, /const isAdmin = useMemo\([\s\S]{0,160}\[currentUser\]/);
  assert.match(source, /event === "TOKEN_REFRESHED" \|\| event === "USER_UPDATED"/);
});
