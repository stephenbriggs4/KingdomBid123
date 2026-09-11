import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const projectsSource = readFileSync(new URL('../src/ProjectsScreen.jsx', import.meta.url), 'utf8');

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
  assert.match(aboutSource, /after legal and policy review/);
  assert.doesNotMatch(aboutSource, /CHURCH_REBATE_RATE_LABEL/);
  assert.doesNotMatch(aboutSource, /Beta policy:/);
});

test('vendor empty state distinguishes zero inventory from zero filter matches', () => {
  for (const source of [appSource, projectsSource]) {
    assert.match(source, /vendors\.length === 0/);
    assert.match(source, /No vendors are available in the marketplace yet/);
    assert.match(source, /activeFilterCount > 0/);
    assert.match(source, /No vendors match those filters/);
  }
});
