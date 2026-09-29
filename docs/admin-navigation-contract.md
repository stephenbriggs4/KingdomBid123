# FaithBid admin navigation contract

This contract documents the current navigation without deciding Concierge's permanent product placement.

- **Admin Review** is the single top-level admin destination in both the desktop and mobile bottom nav, shown only to `isAdmin` users. It appears exactly once per nav (desktop + mobile = 2 occurrences of `label:"Admin Review"` in App.jsx).
- Inside Admin Review, `AdminReviewSubnav` provides tabs to every admin-operational surface: **Review** (admissions, trust review, project moderation, disputes, founder review queues), **Concierge** (Concierge Pilot Operations), **Growth Engine** (research), **Church Intelligence** (internal research module), and **QA Console** (release/QA tooling).
- The old "Workspace" dropdown that used to nest these destinations under a separate top-level menu was retired (see the "1008: Workspace dropdown retired; its destinations now live contextually" comment in App.jsx) — they now live directly under Admin Review instead.
- Concierge appears once, as an AdminReviewSubnav tab; it is not duplicated in the account menu.
- Any decision to move Concierge to a permanent top-level destination remains founder-owned and must not be inferred from this information-architecture cleanup.
