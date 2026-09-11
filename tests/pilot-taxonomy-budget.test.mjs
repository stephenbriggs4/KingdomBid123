import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appUrl = new URL('../src/App.jsx', import.meta.url);
const migrationUrl = new URL('../supabase/migrations/20260910143000_unify_service_taxonomy_and_budget_translation.sql', import.meta.url);
const demandMigrationUrl = new URL('../supabase/migrations/20260910151500_admin_demand_reconciliation_summary.sql', import.meta.url);
const governanceMigrationUrl = new URL('../supabase/migrations/20260910163000_pilot_governance_decision_ledger.sql', import.meta.url);
const demandTruthMigrationUrl = new URL('../supabase/migrations/20260911011500_truth_label_demand_reconciliation.sql', import.meta.url);

test('Marketplace and Concierge derive categories from one application taxonomy', async () => {
  const source = await readFile(appUrl, 'utf8');
  const taxonomy = source.slice(
    source.indexOf('const FB_SERVICE_TAXONOMY'),
    source.indexOf('const TIMELINES'),
  );

  for (const key of [
    'cleaning_and_janitorial',
    'landscaping_and_grounds',
    'facilities_and_maintenance',
    'av_production_and_worship_technology',
    'it_cybersecurity_and_managed_services',
    'finance_accounting_and_payroll',
  ]) {
    assert.match(taxonomy, new RegExp(`key:"${key}"[^\n]+pilotEligible:true`));
  }

  assert.match(source, /const CATEGORIES = FB_SERVICE_TAXONOMY/);
  assert.match(source, /const FB_CONCIERGE_SERVICE_CATEGORIES = Object\.freeze\(\s*FB_SERVICE_TAXONOMY/);
  assert.match(source, /FB_SERVICE_TAXONOMY\.filter\(\(category\) => category\.pilotEligible\)/);
});

test('Marketplace budget bands translate deterministically and broad bands require church confirmation', async () => {
  const source = await readFile(appUrl, 'utf8');
  const budgetSection = source.slice(
    source.indexOf('const FB_MARKETPLACE_BUDGET_BANDS'),
    source.indexOf('const TIMELINES'),
  );

  assert.equal((budgetSection.match(/translation:"automatic"/g) || []).length, 6);
  assert.equal((budgetSection.match(/translation:"church_confirmation_required"/g) || []).length, 1);
  assert.match(source, /A Marketplace budget of \$25,000\+ is resolved by direct church confirmation/);
  assert.match(source, /do not infer it/);
});

test('database taxonomy and budget boundary mirror the application contract', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /create table if not exists public\.faithbid_service_taxonomy/);
  assert.match(sql, /constraint faithbid_service_taxonomy_scope_check/);
  assert.match(sql, /create or replace function concierge_ops\.translate_marketplace_budget_band/);
  assert.match(sql, /budget_translation_status := 'church_confirmation_required'/);
  assert.match(sql, /select taxonomy\.pilot_eligible/);
});

test('Dallas Pilot demand counts are reconciled server-side without applicant details', async () => {
  const [source, sql, truthSql] = await Promise.all([
    readFile(appUrl, 'utf8'),
    readFile(demandMigrationUrl, 'utf8'),
    readFile(demandTruthMigrationUrl, 'utf8'),
  ]);

  assert.match(sql, /create or replace function concierge_ops\.demand_reconciliation_summary\(\)/);
  assert.match(sql, /public\.kb_is_platform_admin\(\)/);
  assert.match(sql, /count\(distinct identity_key\)/);
  assert.match(sql, /revoke all on function concierge_ops\.demand_reconciliation_summary\(\)\s+from public, anon/);
  assert.match(source, /label="Confirmed pilot churches"/);
  assert.match(source, /label="Deduplicated church intake"/);
  assert.match(source, /intake is not qualification or commitment/);
  assert.match(source, /research leads are not bench vendors/);
  assert.match(truthSql, /source quality, qualification, and commitment are separate facts/);
});

test('unresolved strategy items stay visible without being silently decided', async () => {
  const [source, sql] = await Promise.all([
    readFile(appUrl, 'utf8'),
    readFile(governanceMigrationUrl, 'utf8'),
  ]);

  assert.match(sql, /create table if not exists concierge_ops\.pilot_governance_decisions/);
  assert.match(sql, /'founder_decision_required'/);
  assert.match(sql, /'external_evidence_required'/);
  assert.match(sql, /'legal_review_required'/);
  assert.match(sql, /'waiting_for_real_deal'/);
  assert.match(sql, /do not edit the locked baseline silently/i);
  assert.match(source, /title="Founder decision ledger"/);
  assert.match(source, /never decides them silently/);
});
