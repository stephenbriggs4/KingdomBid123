# Landing cleanup archive — 2026-09-15

This note records the recoverable source for the first landing-redesign cleanup.

- Removed component: `LandingFaithVerified`
- Reason: it was not rendered and duplicated the current `LandingChurchTrustStrip` experience.
- Last intact commit: `f715b33`
- Recovery command (read-only): `git show f715b33:src/App.jsx`
- Original location: `src/App.jsx`, immediately after `goToLandingFAQ` and before `LandingPricing`.

The live `LandingChurchTrustStrip` was preserved unchanged.
