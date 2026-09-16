import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/landing-v2.css', import.meta.url), 'utf8');
const revealStart = app.indexOf('function LandingExampleReveal');
const revealEnd = app.indexOf('function LandingScreen', revealStart);
const reveal = app.slice(revealStart, revealEnd);
const landingStart = app.indexOf('function LandingScreen');
const landingEnd = app.indexOf('function LandingChurchTrustStrip', landingStart);
const landing = app.slice(landingStart, landingEnd);

test('landing explains the mechanism before showing the product peek', () => {
  const howItWorks = landing.indexOf('<FirstSessionTrustRail />');
  const productPeek = landing.indexOf('<LandingExampleReveal />');
  const stats = landing.indexOf('STATS + BROWSE ALL ROW');
  assert.ok(howItWorks > 0, 'How It Works must render after the hero');
  assert.ok(productPeek > howItWorks, 'the product peek must follow How It Works');
  assert.ok(stats > productPeek, 'everything after the product peek must retain its order');
  assert.match(landing, /onClick=\{scrollToHowItWorks\} aria-label="Learn how FaithBid works"/);
});

test('the glimpse is frameless and carries one clear illustrative label', () => {
  assert.match(reveal, /<figure className=\{`fb-product-peek/);
  assert.equal((reveal.match(/Example vendor profiles — illustrative, not live listings\./g) || []).length, 1);
  assert.doesNotMatch(reveal, /Product preview|app\.faithbid\.com|fb-product-peek__(chrome|app|topbar|search)/);
  assert.doesNotMatch(reveal, /supabase|from\(/i);
});

test('the composition uses three generic marketplace cards with concrete details', () => {
  assert.match(app, /function LandingVendorPreviewCard[\s\S]*className="kb-marketplace-vendor-card"/);
  assert.equal((reveal.match(/callout:\{ type:/g) || []).length, 3);
  assert.match(reveal, /Facilities service provider/);
  assert.match(reveal, /Creative services team/);
  assert.match(reveal, /Technology support partner/);
  assert.match(reveal, /Available now · Serves DFW/);
  assert.match(reveal, /Booking this month · Serves North Texas/);
  assert.match(reveal, /Available this week · Remote \+ DFW/);
  assert.match(reveal, /\/gpi\/volunteer\.jpg[\s\S]*\/gpi\/creative\.jpg[\s\S]*\/gpi\/professional\.jpg/);
  assert.doesNotMatch(reveal, /faithbid-marketplace-church|faithbid-landing-church|Availability shown here/);
  assert.doesNotMatch(reveal, /fb-product-peek__(mode|hero|categories|segments)|aria-pressed|LandingProjectPreviewCard/);
});

test('value callouts point to trust signals and stack on mobile', () => {
  assert.match(reveal, /Every vendor is vetted before they appear/);
  assert.match(reveal, /See real availability before you reach out/);
  assert.match(reveal, /Real reviews from real churches/);
  assert.match(reveal, /Church-submitted reviews/);
  assert.match(css, /\.fb-product-peek__card-wrap\.is-vetting[\s\S]*\.kb-marketplace-vendor-card__verified/);
  assert.match(css, /\.fb-product-peek__card-wrap\.is-availability[\s\S]*\.kb-marketplace-vendor-card__status/);
  assert.match(css, /\.fb-product-peek__card-wrap\.is-reviews[\s\S]*\.fb-product-peek__review/);
  assert.match(app, /className="kb-marketplace-vendor-card" tabIndex=\{0\}/);
  assert.match(app, /className="fb-product-peek__callout" tabIndex=\{0\}/);
  assert.match(css, /\.fb-product-peek__card-wrap:hover[\s\S]*\.fb-product-peek__card-wrap:focus-within/);
  assert.match(css, /\.kb-marketplace-vendor-card:focus-visible[\s\S]*\.fb-product-peek__callout:focus-visible/);
});

test('base state is visible and motion is progressive enhancement only', () => {
  assert.match(reveal, /const \[motionReady, setMotionReady\] = useState\(false\)/);
  assert.match(css, /\.fb-product-peek\.is-motion-ready:not\(\.is-revealed\) \.fb-product-peek__card-wrap\s*\{[\s\S]*?opacity:\s*0/);
  const baseRule = css.match(/\.fb-product-peek\s*\{([\s\S]*?)\}/)?.[1] || '';
  assert.doesNotMatch(baseRule, /opacity:\s*0|visibility:\s*hidden|display:\s*none/);
});

test('product peek is responsive and reduced-motion safe', () => {
  assert.match(css, /\.fb-product-peek\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(css, /\.fb-product-peek__cards\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3/);
  assert.match(css, /@media \(max-width: 1100px\)[\s\S]*?\.fb-product-peek__cards\s*\{\s*grid-template-columns:\s*1fr/);
  assert.match(css, /@media \(max-width: 1100px\)[\s\S]*?\.fb-product-peek__cards \.kb-marketplace-vendor-card\s*\{\s*height:\s*auto/);
  assert.match(css, /@media \(max-width: 1100px\)[\s\S]*?\.fb-product-peek__card-wrap\.is-vetting \.fb-product-peek__callout[\s\S]*?position:\s*relative/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation:\s*none !important[\s\S]*?transition:\s*none !important/);
});

test('annotation text has WCAG AA contrast on the ivory section', () => {
  assert.match(css, /\.fb-example-reveal\s*\{[^}]*background:\s*#fffdf8/);
  assert.match(css, /\.fb-product-peek__callout\s*\{[^}]*color:\s*#2d433a/);
  const luminance = (hex) => {
    const channels = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
  };
  const light = luminance('fffdf8');
  const dark = luminance('2d433a');
  assert.ok((light + .05) / (dark + .05) >= 4.5);
});
