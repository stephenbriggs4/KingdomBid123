import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './styles/mobile-touch-targets.css'
import { supabaseConfigured, supabaseConfigError, supabaseProductionDevWarning } from './supabaseClient'
import { ConfigurationMissingScreen, ProductionDevelopmentWarning } from './StartupScreens.jsx'

// R-66: a missing/misconfigured Supabase env used to silently fall back to a
// hardcoded key (or fail deep inside the auth flow as a confusing "Failed to
// fetch"). Fail loud and clear here instead, before App ever mounts.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {supabaseConfigured ? <><App /><ProductionDevelopmentWarning visible={supabaseProductionDevWarning} /></> : <ConfigurationMissingScreen message={supabaseConfigError} />}
  </StrictMode>,
)
