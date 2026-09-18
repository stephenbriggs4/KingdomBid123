import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/landing-v2.css', import.meta.url), 'utf8');
const revealStart = app.indexOf('const LANDING_GLIMPSE_CARDS');
const revealEnd = app.indexOf('const LANDING_PRECISION_POLISH_CSS', revealStart);
const reveal = app.slice(revealStart, revealEnd);
const landingStart = app.indexOf('function LandingScreen');
const landingEnd = app.indexOf('function LandingChurchTrustStrip', landingStart);
const landing = app.slice(landingStart, landingEnd);

test('landing explains the mechanism before showing the glimpse', () => {
  const howItWorks = landing.indexOf('<FirstSessionTrustRail />');
  const glimpse = landing.indexOf('<LandingExampleReveal />');
  const stats = landing.indexOf('STATS + BROWSE ALL ROW');
  assert.ok(howItWorks > 0, 'How It Works must render after the hero');
  assert.ok(glimpse > howItWorks, 'the glimpse must follow How It Works');
  assert.ok(stats > glimpse, 'everything after the glimpse must retain its order');
  assert.match(landing, /onClick=\{scrollToHowItWorks\} aria-label="Learn how FaithBid works"/);
});

test('the glimpse is a self-contained illustrative section with no data access', () => {
  assert.match(reveal, /id="landing-example-reveal"/);
  assert.match(reveal, /aria-label="Illustrative example of three FaithBid vendor profile cards"/);
  assert.doesNotMatch(reveal, /supabase|from\(/i);
  assert.doesNotMatch(reveal, /app\.faithbid\.com/);
  assert.doesNotMatch(css, /\.fb-product-peek|\.fb-example-reveal/, 'old section CSS must be fully removed');
});

test('three cards carry the approved content in the approved order', () => {
  assert.equal((reveal.match(/position: "(left|center|right)"/g) || []).length, 3);
  assert.match(reveal, /Facilities service provider[\s\S]*Creative services team[\s\S]*Technology support partner/);
  assert.match(reveal, /Facility care · Preventive maintenance/);
  assert.match(reveal, /Brand identity · Web design/);
  assert.match(reveal, /Systems support · Digital operations/);
  assert.match(reveal, /Available now · Serves DFW/);
  assert.match(reveal, /Booking this month · Serves North Texas/);
  assert.match(reveal, /Available this week · Remote \+ DFW/);
  assert.match(reveal, /\/gpi\/volunteer\.jpg[\s\S]*\/gpi\/creative\.jpg[\s\S]*\/gpi\/professional\.jpg/);
  assert.match(reveal, /Faith Verified/);
  assert.match(reveal, /Church-submitted review/);
});

test('illustrative content never claims real churches, named testimonials, or invented ratings data', () => {
  assert.match(reveal, /— Example church review/);
  assert.doesNotMatch(reveal, /Grace Community Church/);
  assert.doesNotMatch(reveal, /Real reviews from real churches/);
  assert.doesNotMatch(reveal, /reviews_count|rating:|avg_rating/);
});

test('three annotations are real elements with decorative connectors', () => {
  assert.match(reveal, /Every vendor is reviewed before they’re listed\./);
  assert.match(reveal, /See real availability before you reach out\./);
  assert.match(reveal, /Church-submitted reviews\./);
  assert.equal((reveal.match(/<svg className="kb-landing-glimpse__line"[^>]*aria-hidden="true"/g) || []).length, 3);
  assert.match(reveal, /kb-landing-glimpse__halo" aria-hidden="true"/);
  assert.match(reveal, /kb-landing-glimpse__ground" aria-hidden="true"/);
  assert.match(reveal, /kb-landing-glimpse__foliage[\s\S]*aria-hidden="true"/);
});

test('composition scales continuously so a laptop shows the same picture as a monitor', () => {
  assert.match(css, /--px:\s*min\(1px,\s*calc\(\(100vw - 48px\) \/ 1517\)\)/);
  assert.match(css, /\.kb-landing-glimpse__item\.is-center\s*\{[^}]*margin-top:\s*calc\(-30 \* var\(--px\)\)/);
  assert.doesNotMatch(css, /kb-landing-glimpse[^{]*\{[^}]*--gs/);
});

test('all three cards are exactly the same size (center stays raised)', () => {
  assert.match(css, /\.kb-landing-glimpse__item\.is-left,\s*\.kb-landing-glimpse__item\.is-right\s*\{\s*align-self:\s*stretch/);
  assert.match(css, /\.kb-landing-glimpse__item\.is-center\s*\{[^}]*height:\s*calc\(368 \* var\(--px\)\)[^}]*margin-top:\s*calc\(-30 \* var\(--px\)\)/);
  assert.match(css, /\.kb-landing-glimpse__item\.is-center \.kb-landing-glimpse__body,\s*\.kb-landing-glimpse__item\.is-right \.kb-landing-glimpse__body\s*\{[^}]*flex:\s*1 1 auto/);
  assert.match(css, /\.kb-landing-glimpse__item\s*\{[^}]*width:\s*calc\(320 \* var\(--px\)\)/);
  assert.doesNotMatch(css, /is-center\s*\{[^}]*width:\s*calc\(395/);
});

test('the disclosure pill and its gap are gone; mobile stacks without overlap', () => {
  assert.doesNotMatch(reveal, /kb-landing-glimpse__disclosure/);
  assert.doesNotMatch(css, /kb-landing-glimpse__disclosure/);
  assert.match(css, /@media \(max-width: 1239px\)[\s\S]*?\.kb-landing-glimpse__cards\s*\{[^}]*flex-direction:\s*column/);
  assert.match(css, /@media \(max-width: 1239px\)[\s\S]*?\.kb-landing-glimpse__line\s*\{\s*display:\s*none/);
});

test('base state is visible and motion is progressive enhancement only', () => {
  assert.match(app, /const \[motionReady, setMotionReady\] = useState\(false\)/);
  assert.match(css, /\.kb-landing-glimpse\.is-motion-ready:not\(\.is-revealed\) \.kb-landing-glimpse__item\s*\{[^}]*opacity:\s*0/);
  const base = css.match(/\.kb-landing-glimpse\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  assert.doesNotMatch(base, /opacity:\s*0|visibility:\s*hidden|display:\s*none/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.kb-landing-glimpse[\s\S]*?animation:\s*none !important[\s\S]*?transition:\s*none !important/);
});

test('annotation text has WCAG AA contrast on the ivory section', () => {
  const luminance = (hex) => {
    const channels = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
  };
  assert.match(css, /\.kb-landing-glimpse__callout p\s*\{[^}]*color:\s*#1c2a24/);
  const light = luminance('f4eee1');
  const dark = luminance('1c2a24');
  assert.ok((light + .05) / (dark + .05) >= 4.5);
});
