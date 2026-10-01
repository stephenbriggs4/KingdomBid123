import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { supabaseConfigured, supabaseConfigError, supabaseProductionDevWarning } from './supabaseClient'

// R-66: a missing/misconfigured Supabase env used to silently fall back to a
// hardcoded key (or fail deep inside the auth flow as a confusing "Failed to
// fetch"). Fail loud and clear here instead, before App ever mounts.
function ConfigurationMissingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', padding: '40px 20px', fontFamily: 'system-ui, sans-serif',
      background: '#faf7f0', color: '#1c2814',
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Configuration missing</div>
      <div style={{ fontSize: 14, color: '#66716c', maxWidth: 480, lineHeight: 1.6 }}>{supabaseConfigError}</div>
    </div>
  )
}

function ProductionDevelopmentWarning() {
  if (!supabaseProductionDevWarning) return null
  return (
    <div role="status" aria-live="polite" style={{
      position: 'fixed', left: 12, bottom: 12, zIndex: 2147483647, maxWidth: 340,
      padding: '10px 13px', borderRadius: 10, background: '#fff4d6', color: '#4a3510',
      border: '2px solid #b87800', boxShadow: '0 8px 28px rgba(28,40,20,0.22)',
      fontFamily: 'system-ui, sans-serif', fontSize: 12, fontWeight: 750, lineHeight: 1.4,
    }}>
      Local preview connected to live production data. Keep testing read-only or set an explicit production-development override.
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {supabaseConfigured ? <><App /><ProductionDevelopmentWarning /></> : <ConfigurationMissingScreen />}
  </StrictMode>,
)
