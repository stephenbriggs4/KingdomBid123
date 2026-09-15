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

test('the broken example cards are replaced by one honest framed preview', () => {
  assert.match(reveal, /<figure className="fb-product-peek"/);
  assert.match(reveal, /Product preview/);
  assert.match(reveal, /Illustrative interface—no live listings shown\./);
  assert.doesNotMatch(reveal, /Illustrative provider profile|Example only|Example — not a live listing/);
  assert.doesNotMatch(reveal, /supabase|from\(/i);
});

test('both marketplace sides reuse the approved card system with generic content', () => {
  assert.match(app, /function LandingVendorPreviewCard[\s\S]*className="kb-marketplace-vendor-card"/);
  assert.match(app, /function LandingProjectPreviewCard[\s\S]*className="kb-marketplace-project-card"/);
  assert.match(reveal, /LandingVendorPreviewCard/);
  assert.match(reveal, /LandingProjectPreviewCard/);
  assert.match(reveal, /Facilities service provider/);
  assert.match(reveal, /Creative services team/);
  assert.match(reveal, /Facility maintenance need/);
  assert.match(reveal, /Church website refresh/);
  assert.match(reveal, /aria-pressed=\{previewMode === "vendors"\}/);
  assert.match(reveal, /aria-pressed=\{previewMode === "projects"\}/);
  assert.doesNotMatch(reveal, /rating|reviews?\s*:\s*\d|projects completed/i);
});

test('product peek is responsive and reduced-motion safe', () => {
  assert.match(css, /\.fb-product-peek\s*\{[\s\S]*?overflow:\s*hidden/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.fb-product-peek__cards\s*\{\s*grid-template-columns:\s*1fr/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.fb-product-peek__cards > article:nth-child\(2\)\s*\{\s*display:\s*none/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.fb-product-peek\s*\{[\s\S]*?transition:\s*none/);
});
