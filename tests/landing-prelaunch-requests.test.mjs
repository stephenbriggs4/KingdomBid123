import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('pre-launch landing page does not query protected marketplace counts', () => {
  const statsEffect = appSource.indexOf('    if (!LAUNCHED) {\n      setStats((current) => ({ ...current, loaded:true }));');
  const profileCount = appSource.indexOf('countProfilesByRoleSafe("church")', statsEffect);
  const launchedBranchEnd = appSource.indexOf('\n  }, []);', statsEffect);
  assert.ok(statsEffect >= 0, 'landing stats effect must exit during pre-launch');
  assert.ok(profileCount > statsEffect && launchedBranchEnd > profileCount, 'protected counts must remain behind the launch gate');
  assert.match(appSource.slice(statsEffect, profileCount), /return undefined;/);
});
