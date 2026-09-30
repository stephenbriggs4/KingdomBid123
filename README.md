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

There is no fallback key — `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`) are required. If either is missing, the app renders a clear "configuration missing" screen instead of starting (`src/main.jsx` + `src/supabaseClient.js`); it never silently falls through to production. Copy `.env.example` to `.env.local` and fill in real values:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_FAITHBID_QA_MODE=true
```

QA mode intentionally refuses to start if the configured Supabase URL points at the production project (`knkwaphosqronbhrvlsu`).

## Verification

```powershell
npm run build
npm test
```

`npm test` runs the full suite (`node --test tests/**/*.test.mjs`, ~245 tests across every `tests/*.test.mjs` file). Individual `npm run test:<name>` scripts also exist per file/area for targeted debugging — see `package.json`. CI (`.github/workflows/ci.yml`) runs the build, a handful of named launch-blocking checks first for clearer failure messages, then the full suite as a final gate.

```powershell
npm run lint
```

The lint baseline contains historical debt (mostly unresolved in `src/App.jsx`) and is tracked separately from the launch-blocking checks — CI does not currently fail on lint. Do not introduce *new* lint failures in files you change, and prefer fixing debt in a file while you're already touching it over leaving it for later.

## Deploy

This is a static Vite SPA with no server-side code — `npm run build` produces a self-contained `dist/` deployable to any static host (Vercel, Netlify, Cloudflare Pages, S3+CDN, etc.). No repo-specific hosting config is checked in.

- **Env vars are baked in at build time** (Vite inlines `import.meta.env.VITE_*` into the bundle) — set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the hosting platform's build environment, not just locally, and rebuild/redeploy after changing them.
- **Routing is hash-based** (`#my-projects`, `#post-project`, etc., handled entirely client-side) — this means no SPA rewrite/fallback rule is needed on the host; every path resolves to the same `index.html`.
- `scripts/check-build-budget.mjs` runs after `npm run build` in CI and fails if the main JS/CSS chunks or total `dist/` size cross a set cap — check its output if a deploy build unexpectedly fails there.
- `public/_headers` sets security headers (CSP, `X-Frame-Options`, etc.) in the `_headers`-file convention Netlify and Cloudflare Pages both read natively — Vite copies it into `dist/` unchanged. On a host that doesn't support that convention (e.g. Vercel, S3+CDN), translate it into that platform's own header config instead. The CSP is scoped to the specific external origins the app actually calls (Supabase, Sentry, Google Fonts, the stock-photo hosts used for imagery) — `tests/deploy-security-headers.test.mjs` checks the file's shape, but the live effect can only be verified after a real deploy; run a security-header scanner against the deployed URL once it's live.
- Supabase Auth email templates, redirect URLs, and any custom SMTP config live in the Supabase dashboard, not in this repo — see `docs/EMAIL_SETUP.md` if email sending needs configuring for a new environment.

## Database changes

Live Supabase is authoritative. Never replay historical migrations blindly. Inspect live schema and migration history first, create a new migration for a proven gap, run the Supabase security/performance advisors, and verify the result with a read query.

## Architecture map

- `src/App.jsx` — the authoritative integration file: routing, auth, the Marketplace, My Projects, Post a Project, Messages, Admin console, Concierge ops console, and the Church Toolkit (`FaithBidChurchOS`) all live here. Large-surface extraction into smaller files is a known-open item (see the roadmap's R-69); any extraction must preserve the existing Marketplace/My Projects/Church Toolkit/auth/routing/CSS-isolation contracts. This file is large (70K+ lines) — prefer targeted `Read`/`Grep` over opening it wholesale, and verify any edit near the file's top-level scope with an AST check, not just a successful string replace (this file has a documented history of scope bugs where an edit silently matched a nested/wrong-scope declaration).
- `src/*.jsx` (top level, outside App.jsx) — screens and components already split out: `AccountScreens.jsx` (pricing, onboarding), `AdminScreen.jsx`, `AdminPrivacyRequests.jsx`, `AdminVendorCredentials.jsx`, `Attachments.jsx`, `ChurchIntelligence.jsx`, `GetPluggedInScreen.jsx`, `LegalConsent.jsx`, `MessagesTab.jsx`, `ProfileScreen.jsx`, `ReviewsScreen.jsx`, `SettingsScreen.jsx`, `VendorCredentialsPanel.jsx`, `WaitlistScreen.jsx`, `WaitlistInvitationScreen.jsx`, `main.jsx`, `supabaseClient.js`.
- `src/styles/*.css` — hand-authored stylesheets, largest are `marketplace.css`/`marketplace-v2.css` and `legacy-route-patches.css`; expect layered, sometimes-superseded override history in the larger files (grep for numbered/versioned comment markers like "v2"/"v3" before assuming the first matching rule you find is the one that actually wins).
- `supabase/migrations/` — SQL migration history; the live database is authoritative, not this directory (see "Database changes" above).
- `tests/*.test.mjs` — plain `node:test` files, one assertion-group per concern; run via `npm test` (see "Verification" above). No test framework dependency beyond Node's built-in runner.
- `scripts/` — one-off maintenance/build scripts (build-budget check, etc.); anything named with a leading underscore is a scratch script written for a specific past task and safe to ignore or delete once its task is done.
- `docs/` — operational runbooks (e.g. `EMAIL_SETUP.md`) that need a human to execute steps outside this repo (DNS, dashboard toggles).

## Who owns what

`src/App.jsx` has a single active editor at a time by convention (not a technical lock) — check recent git history / commit messages before making changes there to confirm who's currently working in it. As of the most recent handoff, Claude is the sole editor of `src/App.jsx`; any other agent or contributor should coordinate before touching it to avoid the class of collision documented in this repo's history (two editors' concurrent changes silently overwriting each other). Everything else in the repo (styles, tests, scripts, docs, other `.jsx` files) doesn't have this restriction.
