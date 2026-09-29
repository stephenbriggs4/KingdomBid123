-- FaithBid Bidding v2 — Migration 009
-- Foreign-key index hardening identified by the Supabase database advisor.
-- Additive only: no data, RLS, function, or feature-flag changes.

create index if not exists bid_revisions_created_by_idx
  on private.bid_revisions (created_by);

create index if not exists bids_church_id_idx
  on public.bids (church_id);

create index if not exists bids_project_church_idx
  on public.bids (project_id, church_id);

create index if not exists bids_vendor_user_id_idx
  on public.bids (vendor_user_id);

create index if not exists project_vendor_links_project_church_idx
  on public.project_vendor_links (project_id, church_id);

create index if not exists projects_cancelled_by_idx
  on public.projects (cancelled_by);

create index if not exists vendor_invites_cancelled_by_idx
  on public.vendor_invites (cancelled_by);

create index if not exists vendor_invites_project_church_idx
  on public.vendor_invites (project_id, church_id);
