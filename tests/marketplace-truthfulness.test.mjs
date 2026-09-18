import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const projectsSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('project marketplace never backfills persisted inventory with sample projects', () => {
  assert.match(appSource, /const SAMPLE_PROJECTS = Object\.freeze\(\[\]\);/);
  assert.doesNotMatch(appSource, /\[\.\.\.\(openProjects \|\| \[\]\), \.\.\.\(SAMPLE_PROJECTS/);
  assert.doesNotMatch(projectsSource, /SAMPLE_PROJECTS \|\| \[\]/);
  assert.match(appSource, /No open project briefs yet/);
  assert.match(projectsSource, /No open project briefs yet/);
});

test('project marketplace statistics have no fabricated floors or fallback averages', () => {
  for (const source of [appSource, projectsSource]) {
    assert.doesNotMatch(source, /Math\.max\(closing,\s*5\)/);
    assert.doesNotMatch(source, /avgBudget[\s\S]{0,180}:\s*2400/);
    assert.doesNotMatch(source, /curated briefs/);
  }
});

test('public About page defers give-back terms to unresolved governance review', () => {
  const aboutStart = appSource.indexOf('function AboutScreen');
  const aboutEnd = appSource.indexOf('function AmbassadorScreen', aboutStart);
  const aboutSource = appSource.slice(aboutStart, aboutEnd);
  assert.match(aboutSource, /Church give-back terms are not yet final/);
  assert.match(aboutSource, /Standard platform fees, paid vendor plans, and any church give-back program remain under review/);
  assert.doesNotMatch(aboutSource, /CHURCH_REBATE_RATE_LABEL/);
  assert.doesNotMatch(aboutSource, /10% capped|standard 10%|5% platform|\$400/);
  assert.doesNotMatch(aboutSource, /Beta policy:/);
});

test('every signed-out pricing surface labels unresolved terms instead of publishing numerical promises', () => {
  const landingPricingStart = appSource.indexOf('function LandingPricing');
  const landingPricingEnd = appSource.indexOf('function LandingTestimonials', landingPricingStart);
  const helpStart = appSource.indexOf('function HelpModal');
  const helpEnd = appSource.indexOf('const KB_LANDING_FAQS', helpStart);
  const landingFaqStart = helpEnd;
  const landingFaqEnd = appSource.indexOf('const KB_START_FREE_ROLE_META', landingFaqStart);

  const publicPricingSurfaces = [
    appSource.slice(landingPricingStart, landingPricingEnd),
    appSource.slice(helpStart, helpEnd),
    appSource.slice(landingFaqStart, landingFaqEnd),
  ];

  for (const source of publicPricingSurfaces) {
    assert.match(source, /under review|not currently advertising/i);
    assert.doesNotMatch(source, /10%|5% platform|PLATFORM_FEE_CAP|VENDOR_PRO_FEE_CAP|VENDOR_PRO_PRICE_LABEL|computePlatformFee/);
  }

  assert.match(appSource, /const PLATFORM_FEE_RATE = 0\.10/);
  assert.match(appSource, /const CHURCH_REBATE_RATE = 0\.25/);
});

test('the in-app contract does not create an unapproved fee commitment', () => {
  const legalStart = appSource.indexOf('const KB_LEGAL_DOC_CONTENT');
  const legalEnd = appSource.indexOf('function buildLegalDocMeta', legalStart);
  const legalSource = appSource.slice(legalStart, legalEnd);
  assert.match(legalSource, /not currently advertising a standard platform fee/);
  assert.match(legalSource, /separately published terms accepted before that charge is incurred/);
  assert.doesNotMatch(legalSource, /PLATFORM_FEE_CAP|10%|5%/);
});

test('vendor empty state distinguishes zero inventory from zero filter matches', () => {
  for (const source of [appSource, projectsSource]) {
    assert.match(source, /vendors\.length === 0/);
    assert.match(source, /activeFilterCount > 0/);
    assert.match(source, /No vendors match those filters/);
  }
  assert.match(appSource, /Approved vendors will appear here/);
  assert.match(projectsSource, /No vendors are available in this view/);
});
