import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

assert.match(src, /function isHandleLikeChurchName\(/, 'handle-detection helper exists');
assert.match(src, /raw\.toLowerCase\(\) === 'church' \|\| isHandleLikeChurchName\(raw\)/, 'project detail hides handle-like church names');
assert.match(src, /church: \(p\.church_name && !isHandleLikeChurchName\(p\.church_name\)\)/, 'project mapper hides handle-like church names');

const fn = src.match(/function isHandleLikeChurchName\(value\) \{[\s\S]*?\n\}/)[0];
const isHandle = new Function(`${fn}; return isHandleLikeChurchName;`)();
assert.equal(isHandle('stephenbriggs0128'), true);
assert.equal(isHandle('grace.community'), true);
assert.equal(isHandle('Grace Community Church'), false);
assert.equal(isHandle('Hope'), false);
assert.equal(isHandle(''), false);
console.log('church-name-display: ok');
