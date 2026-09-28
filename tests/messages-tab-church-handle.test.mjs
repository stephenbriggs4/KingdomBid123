import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/MessagesTab.jsx', import.meta.url), 'utf8');
const has = (re, msg) => assert.ok(re.test(src), msg);

has(/function isHandleLikeChurchName\(value\)/, 'MessagesTab has its own copy of the handle filter (separate module from App.jsx)');
has(/const counterpart = useCallback\(\(c\) => \{[\s\S]{0,220}isHandleLikeChurchName/, 'the Inbox conversation counterpart name filters handle-like church names');
console.log('messages-tab-church-handle: ok');
