import { createClient } from '@supabase/supabase-js'

const FAITHBID_PRODUCTION_PROJECT_REF = 'knkwaphosqronbhrvlsu'
const viteEnv = import.meta.env || {}

// R-66: this used to fall back to a hardcoded production URL/anon key when
// the env vars were missing, so a broken local/deploy config either silently
// pointed at production or surfaced as a confusing "Failed to fetch" deep in
// the auth flow instead of a clear, immediate error.
const supabaseUrl = String(viteEnv.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = String(
  viteEnv.VITE_SUPABASE_PUBLISHABLE_KEY
  || viteEnv.VITE_SUPABASE_ANON_KEY
  || '',
).trim()

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const supabaseConfigError = supabaseConfigured
  ? ''
  : 'Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY). Set them in .env.local and restart the dev server.'

export { supabaseUrl, supabaseAnonKey }

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

// PostgREST silently truncates unpaged reads at max_rows (1000). When a read that asked
// for no explicit limit/range comes back with exactly that many rows, tell the app so it
// can be reported instead of quietly showing an incomplete list.
const REST_ROW_CAP = 1000
const reportedRowCapTables = new Set()
function noteRowCap(url, res) {
  try {
    if (!res || !res.ok || typeof window === "undefined") return
    if (/[?&](limit|offset)=/.test(url)) return
    const range = res.headers.get("content-range") || ""
    const match = /^0-(\d+)\//.exec(range)
    if (!match || Number(match[1]) + 1 < REST_ROW_CAP) return
    const table = (/\/rest\/v1\/([^?/]+)/.exec(url) || [])[1] || "unknown"
    if (reportedRowCapTables.has(table)) return
    reportedRowCapTables.add(table)
    window.dispatchEvent(new CustomEvent("kb:rest-row-cap", { detail: { table } }))
  } catch { /* detection must never break a read */ }
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
  request.then((res) => noteRowCap(url, res)).catch(() => {})
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

// A missing URL/key must not throw here -- that would crash the whole module
// graph before App.jsx gets a chance to render the clear "configuration
// missing" screen. createClient needs *some* well-formed URL to construct
// without throwing; the placeholder is never used for a real request because
// nothing renders past the config-missing screen when supabaseConfigured is false.
export const supabase = existingBrowserClient && existingBrowserProjectRef === supabaseProjectRef
  ? existingBrowserClient
  : createClient(
      supabaseConfigured ? supabaseUrl : 'https://not-configured.invalid',
      supabaseConfigured ? supabaseAnonKey : 'not-configured',
      { global: { fetch: dedupedFetch } },
    )

// Vite can re-evaluate this module during hot updates while the prior Auth
// client is still subscribed. Keep one client per browser page so both clients
// never compete for the same persisted session or refresh token.
if (typeof window !== 'undefined') {
  window.__FAITHBID_SUPABASE_CLIENT__ = supabase
  window.__FAITHBID_SUPABASE_PROJECT_REF__ = supabaseProjectRef
}
