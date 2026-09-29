-- ============================================================================
-- Fix: church accounts could not SELECT their own posted projects while
-- marketplace_public=false, because church_id ownership was nested inside
-- the kb_marketplace_public() branch of kb_projects_select_authenticated.
-- This is why "My Projects" showed "No active projects yet" for a church
-- that had real (including [TEST] synthetic) projects on file.
--
-- Also folds in the reconciled Migration 008 "finding A" tightening from
-- FAITHBID_BIDDING_COMPLETE_CUMULATIVE_AUDIT...2026-09-22.md (Part XXV):
-- a cancelled invitation / archived relationship must not keep granting a
-- vendor private-project visibility.
--
-- Scope: this policy only. Does not touch marketplace_public, bidding_enabled,
-- or the rest of Migration 008 (decline/cancel invite commands, cancellation
-- trigger, new notification events) — those remain drafted/not applied.
-- ============================================================================

drop policy if exists kb_projects_select_authenticated
  on public.projects;

create policy kb_projects_select_authenticated
on public.projects
for select
to authenticated
using (
  public.kb_is_platform_admin()
  or hired_vendor_id = (select auth.uid())
  or church_id = (select auth.uid())
  or (
    public.kb_marketplace_public()
    and status = 'open'
  )
  or (
    status = 'open'
    and (
      exists (
        select 1
        from public.vendor_invites vi
        where vi.project_id = projects.id
          and vi.vendor_user_id = (select auth.uid())
          and vi.status in (
            'invited',
            'no_response',
            'bid_received',
            'declined'
          )
      )
      or exists (
        select 1
        from public.project_vendor_links pvl
        where pvl.project_id = projects.id
          and pvl.vendor_user_id = (select auth.uid())
          and pvl.stage in (
            'watching',
            'invited',
            'bid_received',
            'shortlisted',
            'hired',
            'declined'
          )
      )
    )
  )
);
