# FaithBid

FaithBid is a React/Vite application that combines the FaithBid marketplace, church and vendor workspaces, and the church-only Church Toolkit in one authenticated product.

## Product boundaries

- One app, one FaithBid session, and one Supabase backend.
- Production Supabase project: `knkwaphosqronbhrvlsu`.
- Church Toolkit routes are namespaced under `#church-os/...` and are unavailable to vendor accounts.
- Church Toolkit external-help requests never publish Marketplace projects automatically.
- Concierge finalization remains the authority that creates an engagement.

## Local development

Requirements: Node.js 22 or newer and npm.

```powershell
npm ci
npm run dev -- --port 5173 --strictPort
```

The checked-in client has a production publishable-key fallback for the existing local workflow. For a non-production environment, provide both values explicitly:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_FAITHBID_QA_MODE=true
```

QA mode intentionally refuses to start against the production project.

## Verification

```powershell
npm run build
npm run test:hardening
npm run test:launch-surface
npm run test:my-projects-routing
npm run test:budget-truth
npm run test:reconciliation-regressions
```

The full lint baseline contains historical debt and is tracked separately from the launch-blocking checks. Do not hide new lint failures in files you change.

## Database changes

Live Supabase is authoritative. Never replay historical migrations blindly. Inspect live schema and migration history first, create a new migration for a proven gap, run the Supabase security/performance advisors, and verify the result with a read query.

## Current architecture note

`src/App.jsx` is still the authoritative integration file. Large-surface extraction is planned, but it must preserve the current Marketplace, My Projects, Church Toolkit, auth, routing, and CSS-isolation contracts.
