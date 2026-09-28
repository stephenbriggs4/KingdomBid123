import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const app = read('../src/App.jsx');
const waitlist = read('../src/WaitlistScreen.jsx');
const invite = read('../src/WaitlistInvitationScreen.jsx');
const consent = read('../src/LegalConsent.jsx');
const migration = read('../supabase/migrations/20260928120000_legal_consents.sql');
const has = (src, re, msg) => assert.ok(re.test(src), msg);

// shared module
has(consent, /export const LEGAL_DOC_VERSIONS/, 'document versions are declared');
has(consent, /rpc\("kb_record_legal_consent"/, 'consent is written through the RPC, not a direct insert');
has(consent, /required[\s\S]{0,40}aria-required/, 'checkbox is a required, accessible control');

// every account-creation surface requires and records consent
has(waitlist, /canSubmit = agreedToTerms &&/, 'waitlist submit is gated on consent');
assert.equal((waitlist.match(/recordLegalConsent\(\{ email: payload\.email/g) || []).length, 2, 'both waitlist success paths record consent');
has(waitlist, /<LegalConsentCheckbox id="kb-waitlist-consent"/, 'waitlist shows the consent checkbox');
has(app, /if \(!agreedToTerms\) \{ setError\("Please agree to the Terms/, 'AuthScreen signup blocks without consent');
has(app, /recordLegalConsent\(\{ email, kind: selectedRole==="church"/, 'AuthScreen signup records consent');
has(app, /const canSubmit = agreedToTerms && fullName/, 'StartFree church signup is gated on consent');
has(app, /recordLegalConsent\(\{ email: email\.trim\(\), kind: CONSENT_KINDS\.church \}\)/, 'StartFree church signup records consent');
has(app, /kind: CONSENT_KINDS\.guestPost/, 'guest post-project signup records consent');
has(invite, /if \(!agreedToTerms\) throw new Error/, 'invitation signup blocks without consent');
has(invite, /recordLegalConsent\(\{ email: normalizedEmail/, 'invitation signup records consent');
assert.ok(!/I agree to the <strong[^>]*>Terms of Service<\/strong>/.test(app), 'old decorative checkbox is gone');

// database contract
has(migration, /enable row level security/, 'legal_consents has row level security');
has(migration, /revoke all on public\.legal_consents from anon, authenticated/, 'no direct table writes');
has(migration, /grant execute on function public\.kb_record_legal_consent[\s\S]*to anon, authenticated/, 'anon and authenticated may record consent via the RPC');
has(migration, /set search_path = public, pg_temp/, 'security definer function pins its search path');
console.log('legal-consent: ok');
