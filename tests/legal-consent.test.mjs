import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const app = read('../src/App.jsx');
const waitlist = read('../src/WaitlistScreen.jsx');
const invite = read('../src/WaitlistInvitationScreen.jsx');
const consent = read('../src/LegalConsent.jsx');
const consentModel = read('../src/legalConsentModel.js');
const migration = read('../supabase/migrations/20260928173159_legal_consents.sql');
const hardening = read('../supabase/migrations/20260930183658_harden_legal_consent_provenance.sql');
const has = (src, re, msg) => assert.ok(re.test(src), msg);

// shared module
has(consentModel, /export const LEGAL_DOC_VERSIONS/, 'document versions are declared');
has(consentModel, /buildLegalConsentMetadata/, 'account consent is represented as auth signup metadata');
has(consent, /required[\s\S]{0,40}aria-required/, 'checkbox is a required, accessible control');

// every account-creation surface requires and records consent
has(waitlist, /canSubmit = agreedToTerms &&/, 'waitlist submit is gated on consent');
has(waitlist, /legal_consent: \{ accepted: true/, 'waitlist consent is submitted inside the canonical waitlist transaction');
assert.ok(!waitlist.includes('recordLegalConsent'), 'waitlist does not use a forgeable follow-up consent call');
has(waitlist, /<LegalConsentCheckbox id="kb-waitlist-consent"/, 'waitlist shows the consent checkbox');
has(app, /if \(!agreedToTerms\) \{ setError\("Please agree to the Terms/, 'AuthScreen signup blocks without consent');
has(app, /legal_consent:buildLegalConsentMetadata\(selectedRole==="church"/, 'AuthScreen binds consent to auth signup');
has(app, /const canSubmit = agreedToTerms && fullName/, 'StartFree church signup is gated on consent');
has(app, /legal_consent: buildLegalConsentMetadata\(CONSENT_KINDS\.church\)/, 'StartFree church signup binds consent to auth signup');
has(app, /legal_consent: buildLegalConsentMetadata\(CONSENT_KINDS\.guestPost\)/, 'guest post-project signup binds consent to auth signup');
has(invite, /if \(!agreedToTerms\) throw new Error/, 'invitation signup blocks without consent');
has(invite, /legal_consent: buildLegalConsentMetadata/, 'invitation signup binds consent to auth signup');
assert.ok(!/I agree to the <strong[^>]*>Terms of Service<\/strong>/.test(app), 'old decorative checkbox is gone');

// database contract
has(migration, /enable row level security/, 'legal_consents has row level security');
has(migration, /revoke all on public\.legal_consents from anon, authenticated/, 'no direct table writes');
has(hardening, /after insert on auth\.users/, 'auth trigger binds signup consent to the created user');
has(hardening, /private\.kb_current_legal_documents\(\)/, 'document versions are supplied by server-controlled state');
has(hardening, /revoke all on function public\.kb_record_legal_consent[\s\S]*from public, anon, authenticated/, 'anonymous standalone consent recording is revoked');
has(hardening, /w\.xmin::text::bigint = pg_current_xact_id/, 'waitlist consent is only captured for a row inserted by the same transaction');
has(hardening, /set search_path = ''/, 'new security definer functions pin an empty search path');
console.log('legal-consent: ok');
