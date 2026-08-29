import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://knkwaphosqronbhrvlsu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtua3dhcGhvc3Fyb25iaHJ2bHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODU1ODgsImV4cCI6MjA4OTM2MTU4OH0.HvFXoCzHihc8CjQfcgdVooCpJ_ztI7sM2G2m07Y2srM'

// Supabase Auth's default browser lock steals ownership after its acquire
// timeout. Under FaithBid's bursty signed-in startup that can abort the request
// already holding the lock and discard an otherwise-valid login. Wait for the
// browser lock instead; the auth-state listener returns synchronously, so the
// lock holder is no longer able to deadlock on a nested Supabase query.
let fallbackLockQueue = Promise.resolve()
const patientAuthLock = async (name, _acquireTimeout, fn) => {
  if (typeof navigator !== 'undefined' && navigator?.locks?.request) {
    return navigator.locks.request(name, { mode: 'exclusive' }, fn)
  }

  const previous = fallbackLockQueue.catch(() => undefined)
  let releaseCurrent
  fallbackLockQueue = new Promise(resolve => { releaseCurrent = resolve })
  await previous
  try {
    return await fn()
  } finally {
    releaseCurrent()
  }
}

const existingBrowserClient = typeof window !== 'undefined'
  ? window.__FAITHBID_SUPABASE_CLIENT__
  : null

export const supabase = existingBrowserClient || createClient(supabaseUrl, supabaseAnonKey, {
  auth: { lock: patientAuthLock },
})

// Vite can re-evaluate this module during hot updates while the prior Auth
// client is still subscribed. Keep one client per browser page so both clients
// never compete for the same persisted session or refresh token.
if (typeof window !== 'undefined' && !window.__FAITHBID_SUPABASE_CLIENT__) {
  window.__FAITHBID_SUPABASE_CLIENT__ = supabase
}
export const supabaseConfigured = true
