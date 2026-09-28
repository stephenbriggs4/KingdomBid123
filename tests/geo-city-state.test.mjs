import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const mig = read('../supabase/migrations/20260928140000_geo_city_state_parse_and_sync.sql');
const fix = read('../supabase/migrations/20260928141000_vendor_profile_location_sync_fix.sql');
const profile = read('../src/ProfileScreen.jsx');
const has = (src, re, msg) => assert.ok(re.test(src), msg);

has(mig, /function public\.kb_parse_city_state\(p_text text\)/, 'city/state parser exists');
has(mig, /\('TEXAS','TX'\)/, 'parser knows full state names');
has(mig, /kb_parse_city_state\(new\.city|kb_parse_city_state\(v_city\)/, 'profile geo trigger uses the parser');
has(mig, /new\.service_state := v_ps;/, 'vendor geo trigger fills service_state');
has(mig, /update public\.vendors set city = city/, 'existing vendors are backfilled');
has(mig, /update public\.profiles set city = city/, 'existing profiles are backfilled');
has(fix, /after insert or update of city, service_city, service_state on public\.vendors/, 'vendor->profile sync fires on any location save');
// The completion meter merges vendor + profile sources instead of trusting one table.
has(profile, /firstFilled\(vendorForm\.bio, vendorRow\?\.bio\)/, 'meter reads the vendor bio');
has(profile, /hasCityAndState\(vendorCity, vendorState\)/, 'meter accepts a City, State value');
console.log('geo-city-state: ok');
