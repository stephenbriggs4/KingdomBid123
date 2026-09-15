# Landing cleanup archive — 2026-09-15

This note records the recoverable source for the first landing-redesign cleanup.

- Removed component: `LandingFaithVerified`
- Reason: it was not rendered and duplicated the current `LandingChurchTrustStrip` experience.
- Last intact commit: `f715b33`
- Recovery command (read-only): `git show f715b33:src/App.jsx`
- Original location: `src/App.jsx`, immediately after `goToLandingFAQ` and before `LandingPricing`.

The live `LandingChurchTrustStrip` was preserved unchanged.

- Removed component: `KingdomBuilderTeaser`
- Reason: it was not rendered, duplicated the landing page's access CTAs, and contained outdated pre-launch promises plus developer-facing copy.
- Last intact commit: `c0a3dcd`
- Recovery command (read-only): `git show c0a3dcd:src/App.jsx`
- The separate `/join` route and its `KingdomBuilderSection` were not changed.
