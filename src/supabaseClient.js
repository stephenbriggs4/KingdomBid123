import { createClient } from '@supabase/supabase-js'

const FAITHBID_PRODUCTION_PROJECT_REF = 'knkwaphosqronbhrvlsu'
const fallbackSupabaseUrl = `https://${FAITHBID_PRODUCTION_PROJECT_REF}.supabase.co`
const fallbackSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Imtua3dhcGhvc3Fyb25iaHJ2bHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODU1ODgsImV4cCI6MjA4OTM2MTU4OH0.HvFXoCzHihc8CjQfcgdVooCpJ_ztI7sM2G2m07Y2srM'
const viteEnv = import.meta.env || {}

const supabaseUrl = String(viteEnv.VITE_SUPABASE_URL || fallbackSupabaseUrl).trim()
const supabaseAnonKey = String(
  viteEnv.VITE_SUPABASE_PUBLISHABLE_KEY
  || viteEnv.VITE_SUPABASE_ANON_KEY
  || fallbackSupabaseAnonKey,
).trim()

const projectRefFromUrl = (url) => {
  try {
    return new URL(url).hostname.split('.')[0] || ''
  } catch {
    return ''
  }
}

export const supabaseProjectRef = projectRefFromUrl(supabaseUrl)
export const supabaseQaMode = viteEnv.MODE === 'qa'
  || /^(1|true|yes)$/i.test(String(viteEnv.VITE_FAITHBID_QA_MODE || '').trim())

if (supabaseQaMode && supabaseProjectRef === FAITHBID_PRODUCTION_PROJECT_REF) {
  throw new Error(
    `FaithBid QA mode cannot use the production Supabase project ${FAITHBID_PRODUCTION_PROJECT_REF}. Configure a full-app non-production project first.`,
  )
}

const existingBrowserClient = typeof window !== 'undefined'
  ? window.__FAITHBID_SUPABASE_CLIENT__
  : null
const existingBrowserProjectRef = typeof window !== 'undefined'
  ? window.__FAITHBID_SUPABASE_PROJECT_REF__
  : null

export const supabase = existingBrowserClient && existingBrowserProjectRef === supabaseProjectRef
  ? existingBrowserClient
  : createClient(supabaseUrl, supabaseAnonKey)

// Vite can re-evaluate this module during hot updates while the prior Auth
// client is still subscribed. Keep one client per browser page so both clients
// never compete for the same persisted session or refresh token.
if (typeof window !== 'undefined') {
  window.__FAITHBID_SUPABASE_CLIENT__ = supabase
  window.__FAITHBID_SUPABASE_PROJECT_REF__ = supabaseProjectRef
}
export const supabaseConfigured = true
