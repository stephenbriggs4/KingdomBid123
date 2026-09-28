import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
assert.match(
  app,
  /const church = \[project\.church_name, project\.church\]\.map\(v => String\(v \|\| ''\)\.trim\(\)\)\.find\(v => v && !isHandleLikeChurchName\(v\)\) \|\| '';[\s\S]{0,40}const city = project\.city/,
  'the project-detail document title/meta description filters handle-like church names'
);
console.log('project-detail-title-handle: ok');
