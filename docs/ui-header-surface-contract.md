# FaithBid Header Surface Contract

FaithBid uses two intentional header modes. The route wrapper exposes the active mode as `data-kb-header-mode` so styling and regression tests share the same source of truth.

## Browse mode

Browse mode supports discovery. It may use an immersive image, dark field, or larger editorial hero, while retaining the shared FaithBid navigation and typography.

- Marketplace, including vendor and project browsing
- Get Plugged In

Project and vendor detail pages may continue the visual context of the browse surface that opened them.

## Work mode

Work mode supports decisions and ongoing tasks. It uses a light cream canvas, compact command hierarchy, and content-first controls. It must not inherit a dark outer shell from a browse or messaging treatment.

- My Projects
- My Work
- Deal Rooms
- Reviews
- Profile and verification
- Concierge

## Standard mode

Public information, authentication, settings, and administrative utilities use their existing purpose-specific layouts. They must not be restyled as browse or work surfaces unless they are explicitly added to the route contract.
