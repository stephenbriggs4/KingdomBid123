-- ============================================================================
-- Fix: the church-side "Invite to bid" action from a vendor profile page
-- (App.jsx applyProfileStage -> upsertProjectVendorLink) writes source:'profile',
-- which the live project_vendor_links_source_check CHECK constraint rejects.
-- The frontend helper swallows the resulting insert error, so the UI shows
-- "Invited" / "Message about this project" while no project_vendor_links row
-- (and therefore no project-specific bid permission) actually exists.
--
-- Confirmed live 2026-09-22 by exercising the real invite flow against
-- [QA] Sanctuary AV Upgrade / Vendor123: conversation + notification were
-- created, project_vendor_links and vendor_invites were not.
--
-- This is exactly the legacy-source compatibility widening the reconciled
-- Migration 001 draft already proposes (Part IV, section "3. PROJECT_VENDOR_LINKS").
-- Scope: this CHECK constraint only. Does not touch marketplace_public,
-- bidding_enabled, RLS policies, or any other part of 001-008.
-- ============================================================================

alter table public.project_vendor_links
  drop constraint project_vendor_links_source_check;

alter table public.project_vendor_links
  add constraint project_vendor_links_source_check
  check (
    source = any (
      array[
        'marketplace'::text,
        'directory'::text,
        'compare'::text,
        'manual'::text,
        'detail'::text,
        'inbox'::text,
        -- Temporary legacy compatibility values emitted by the current hidden
        -- frontend. The future v2 invitation command should normalize new
        -- writes to the canonical set above.
        'profile'::text,
        'bid-review'::text,
        'project-detail'::text
      ]
    )
  );
