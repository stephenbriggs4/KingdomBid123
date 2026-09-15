import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/marketplace-v2.css', import.meta.url), 'utf8');

const card = app.slice(
  app.indexOf('function MarketplaceProjectDirectoryCard'),
  app.indexOf('function ProjectBoard'),
);

test('retains the existing project hero and replaces only its body', () => {
  assert.match(app, /<ChurchProjectsMarketplaceHero[\s\S]*?<main className="kb-marketplace-projects-body"/);
  assert.match(app, /const useStreamlinedProjectDirectory = true/);
});

test('project directory is sourced only from real open projects', () => {
  assert.match(app, /const openProjects = useMemo\(\(\) => normalizedProjects\.filter\(p => p\.status === 'open'\)/);
  assert.match(app, /const filtered = Array\.isArray\(filteredProjects\) \? filteredProjects : \[\]/);
  assert.doesNotMatch(card, /sample|fallback project/i);
});

test('light project cards are accessible and do not expose church identity', () => {
  assert.match(card, /<article className="kb-marketplace-project-card">/);
  assert.match(card, /aria-pressed=\{saved\}/);
  assert.match(card, /aria-label=\{saved \? `Remove \$\{title\} from saved projects` : `Save \$\{title\}`\}/);
  assert.match(card, /<button type="button" className="kb-marketplace-project-card__title"/);
  assert.doesNotMatch(card, /church_name|project\.church/);
});

test('project saves still commit to Supabase before the UI reports success', () => {
  assert.match(app, /await persistSavedProjectRecord\(projectId, willSave, currentUser\.id\)/);
  assert.match(app, /showToast && showToast\(compareLimitReached/);
});

test('the empty and filtered states are truthful and singular', () => {
  assert.match(app, /openProjects\.length === 0/);
  assert.match(app, /No open church projects yet/);
  assert.match(app, /FaithBid only shows real, published church needs/);
  assert.match(app, /No projects match this view/);
  assert.match(app, /Clear filters/);
});

test('the compact directory exposes only useful project controls', () => {
  for (const option of ['Best match', 'Newest', 'Closing soon', 'Highest budget']) {
    assert.match(app, new RegExp(`>${option}</option>`));
  }
  assert.match(app, /Saved\{savedIds\.size \? ` \(\$\{savedIds\.size\}\)` : ''\}/);
});

test('project body is fluid at laptop, monitor, large-monitor, and mobile widths', () => {
  assert.match(css, /\.kb-marketplace-projects-body\s*\{[\s\S]*?width:\s*calc\(100% - clamp\(36px, 5vw, 112px\)\)/);
  assert.match(css, /\.kb-marketplace-projects-body\s*\{[\s\S]*?max-width:\s*none/);
  assert.match(css, /\.kb-marketplace-project-empty,[\s\S]*?min-height:\s*410px/);
  assert.match(css, /\.kb-marketplace-project-grid\s*\{[\s\S]*?repeat\(auto-fit, minmax\(min\(100%, 280px\), 1fr\)\)/);
  assert.match(css, /@media \(min-width:\s*1840px\)[\s\S]*?\.kb-marketplace-project-grid/);
  assert.match(css, /@media \(max-width:\s*620px\)[\s\S]*?\.kb-marketplace-project-grid\s*\{\s*grid-template-columns:\s*1fr/);
});
