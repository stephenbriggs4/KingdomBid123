import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('empty Concierge pipeline renders one truthful orientation state', () => {
  assert.match(source, /const hasConciergePipelineActivity = records\.organizations\.length > 0[\s\S]*records\.engagements\.length > 0/);
  assert.match(source, /view === "command" && status === "ready" && !hasConciergePipelineActivity/);
  assert.match(source, /The workspace is ready for Church #1\./);
  assert.match(source, /not represented as approved bench vendors/);
  assert.match(source, /actionLabel="Create first intake"/);
  assert.match(source, /secondaryLabel="Review vendor evidence"/);
});

test('governance decisions are grouped without changing their stored statuses', () => {
  assert.match(source, /const blockingGovernanceDecisions = records\.governanceDecisions\.filter\(\(item\) => item\.status !== "complete" && item\.blocks_pilot\)/);
  assert.match(source, /const nonBlockingGovernanceDecisions = records\.governanceDecisions\.filter\(\(item\) => item\.status !== "complete" && !item\.blocks_pilot\)/);
  assert.match(source, /const completedGovernanceDecisions = records\.governanceDecisions\.filter\(\(item\) => item\.status === "complete"\)/);
  assert.match(source, /title="Blocks pilot milestone"[\s\S]*title="Open, not blocking"[\s\S]*title="Completed"/);
  assert.doesNotMatch(source, /pilot_governance_decisions"\)\.update/);
});
