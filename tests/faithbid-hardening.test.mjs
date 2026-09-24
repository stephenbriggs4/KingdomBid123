import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const messagesTab = readFileSync(new URL('../src/MessagesTab.jsx', import.meta.url), 'utf8');
const client = readFileSync(new URL('../src/supabaseClient.js', import.meta.url), 'utf8');
const migrationsDir = new URL('../supabase/migrations/', import.meta.url);
const migrations = readdirSync(migrationsDir).map((f) => readFileSync(new URL(f, migrationsDir), 'utf8'));

const lines = app.split(/\r?\n/);
function block(prefix) {
  const i = lines.findIndex((l) => l.startsWith(prefix));
  assert.ok(i >= 0, `missing block: ${prefix}`);
  let e = i;
  while (!/^(}|\]\);|\);)/.test(lines[e])) e += 1;
  return lines.slice(i, e + 1).join('\n');
}

test('every project category a church can post appears under a marketplace category filter', () => {
  const code = [
    block('const __KB_CATEGORY_SYNONYMS'),
    block('function __kbNormalizeScoringToken'),
    block('const __KB_TOKEN_TO_CATEGORIES'),
    block('function __kbCanonicalizeToCategories'),
    block('const FB_SERVICE_TAXONOMY'),
    block('const KB_MARKETPLACE_DIRECTORY_CATEGORY_KEYS'),
    `globalThis.__result = FB_SERVICE_TAXONOMY.filter((c) => c.marketplaceLabel).map((c) => {
       const keys = __kbCanonicalizeToCategories(c.marketplaceLabel);
       const groups = Object.entries(KB_MARKETPLACE_DIRECTORY_CATEGORY_KEYS).filter(([, ks]) => [...keys].some((k) => ks.includes(k))).map(([g]) => g);
       return { label: c.marketplaceLabel, groups };
     });`,
  ].join('\n');
  const sandbox = {};
  vm.runInNewContext(code, sandbox);
  const orphaned = sandbox.__result.filter((r) => r.groups.length === 0).map((r) => r.label);
  assert.equal(JSON.stringify(orphaned), "[]");
});

test('profile trigger blocks self-granting private marketplace access, NDA and billing fields', () => {
  const guard = migrations.filter((m) => m.includes('kb_profile_protected_fields_guard')).pop();
  assert.ok(guard);
  for (const col of ['private_marketplace_access', 'nda_required', 'vendor_pro_billing', 'vendor_pro_intent']) {
    assert.match(guard, new RegExp(`new\\.${col} is distinct from old\\.${col}`));
  }
  assert.match(guard, /new\.private_marketplace_access := false/);
});

test('the anonymous legacy portfolio policy stays dropped', () => {
  assert.ok(migrations.some((m) => /drop policy if exists "Public can view portfolio items" on public\.vendor_portfolio/i.test(m)));
});

test('duplicate messages are prevented in the database and the client', () => {
  assert.ok(migrations.some((m) => m.includes('messages_invite_once_uidx')));
  assert.match(app, /kbInviteInFlight/);
});

test('messages tab supports attachments through the private chat-files bucket', () => {
  assert.match(messagesTab, /from\('chat-files'\)\.upload/);
  assert.match(messagesTab, /createSignedUrl/);
  assert.match(messagesTab, /25 \* 1024 \* 1024/);
  assert.match(messagesTab, /chat\/\$\{activeId\}\//);
});

test('lifecycle notifications open the project conversation and are titled', () => {
  assert.match(app, /project_completion_requested: 'Work is ready for review'/);
  assert.match(app, /async function kbOpenMessagesForProject/);
  assert.match(app, /type === 'project_completion_requested' \|\| type === 'project_completion_changes_requested' \|\| type === 'project_completed'/);
  assert.match(messagesTab, /from\('notifications'\)\.update\(\{ read: true \}\)/);
});

test('identical in-flight REST reads share one request', () => {
  assert.match(client, /function dedupedFetch/);
  assert.match(client, /global: \{ fetch: dedupedFetch \}/);
});

test('the church dashboard shows a first-run checklist that can be dismissed', () => {
  assert.match(app, /data-testid="church-getting-started"/);
  assert.match(app, /kb_church_getting_started_dismissed/);
});

test('the retired message screen is not imported anywhere', () => {
  assert.doesNotMatch(app, /<MessagesScreen|import.*MessagesScreen/);
});

test("participants cannot rewrite conversation offer terms, and reviews are not readable for unapproved vendors", () => {
  const guard = migrations.filter((m) => m.includes("kb_conversations_identity_guard")).pop();
  assert.match(guard, /new.offer_amount is distinct from old.offer_amount/);
  assert.match(guard, /new.budget is distinct from old.budget/);
  const reviews = migrations.find((m) => m.includes("create policy kb_reviews_select_authenticated"));
  assert.ok(reviews);
  assert.doesNotMatch(reviews, /using (true)/i);
});

test("endorsements are church-only, pending-only, and one per church per vendor without a recursive policy", () => {
  const m = migrations.find((x) => x.includes("Churches can submit pending endorsements"));
  assert.ok(m);
  assert.match(m, /p.role = .church./);
  assert.match(m, /vendor_endorsements_one_per_endorser_uidx/);
  assert.doesNotMatch(m.split("create unique index")[0].split("create policy")[1] || "", /from public.vendor_endorsements/);
});
