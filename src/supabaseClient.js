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

// Identical REST reads that are in flight at the same moment share one network call.
// Nothing is cached after the response lands, so data is never stale.
const inflightReads = new Map()
function dedupedFetch(input, init = {}) {
  const method = String(init.method || (typeof input !== "string" && input?.method) || "GET").toUpperCase()
  const url = typeof input === "string" ? input : input?.url
  if ((method !== "GET" && method !== "HEAD") || !url || !url.includes("/rest/v1/") || init.signal) {
    return fetch(input, init)
  }
  const headers = init.headers instanceof Headers ? Object.fromEntries(init.headers.entries()) : { ...(init.headers || {}) }
  const key = method + " " + url + " " + JSON.stringify(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]).sort())
  const pending = inflightReads.get(key)
  if (pending) return pending.then((res) => res.clone())
  const request = fetch(input, init)
  inflightReads.set(key, request)
  const clear = () => { if (inflightReads.get(key) === request) inflightReads.delete(key) }
  request.then(clear, clear)
  return request.then((res) => res.clone())
}

const existingBrowserClient = typeof window !== 'undefined'
  ? window.__FAITHBID_SUPABASE_CLIENT__
  : null
const existingBrowserProjectRef = typeof window !== 'undefined'
  ? window.__FAITHBID_SUPABASE_PROJECT_REF__
  : null

export const supabase = existingBrowserClient && existingBrowserProjectRef === supabaseProjectRef
  ? existingBrowserClient
  : createClient(supabaseUrl, supabaseAnonKey, { global: { fetch: dedupedFetch } })

// Vite can re-evaluate this module during hot updates while the prior Auth
// client is still subscribed. Keep one client per browser page so both clients
// never compete for the same persisted session or refresh token.
if (typeof window !== 'undefined') {
  window.__FAITHBID_SUPABASE_CLIENT__ = supabase
  window.__FAITHBID_SUPABASE_PROJECT_REF__ = supabaseProjectRef
}
export const supabaseConfigured = true
