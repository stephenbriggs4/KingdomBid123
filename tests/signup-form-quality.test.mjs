import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const has = (re, message) => assert.ok(re.test(src), message);

has(/function AuthFloatingField\([^)]*autoComplete, required = false/, 'auth field accepts autoComplete and required');
has(/<label htmlFor=\{fieldId\} className="fb-auth-field-label"/, 'auth field label is associated with its input');
has(/label="Password" type="password".{0,200}autoComplete="current-password" required/, 'sign-in password supports password managers');
has(/label="Password" type="password".{0,200}autoComplete="new-password" required/, 'sign-up password supports password managers');
has(/label="Email address" type="email".{0,200}autoComplete="email" required/, 'email fields declare autocomplete');
has(/autoComplete="organization" required=\{selectedRole==="church"\}/, 'church name is required for churches');
has(/isHandleLikeChurchName\(displayName\)/, 'signup rejects a blank or handle-like church name');
has(/isHandleLikeChurchName\(churchName\)/, 'guest post-project signup rejects a handle-like church name');
console.log('signup-form-quality: ok');
