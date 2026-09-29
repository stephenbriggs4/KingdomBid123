import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { supabaseConfigured, supabaseConfigError } from './supabaseClient'

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {supabaseConfigured ? <App /> : <ConfigurationMissingScreen />}
  </StrictMode>,
)
