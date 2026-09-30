-- R-35: covering indexes for foreign keys the advisor flagged.
create index if not exists match_snapshots_project_church_idx on public.match_snapshots (project_id, church_id);
create index if not exists match_snapshots_vendor_pair_idx on public.match_snapshots (vendor_id, vendor_user_id);
create index if not exists marketplace_vendor_curation_curated_by_idx on public.marketplace_vendor_curation (curated_by);
create index if not exists privacy_requests_resolved_by_idx on public.privacy_requests (resolved_by) where resolved_by is not null;
create index if not exists needs_church_sourcing_permission_recorded_by_idx on concierge_ops.needs (church_sourcing_permission_recorded_by);
create index if not exists organizations_pilot_cohort_recorded_by_idx on concierge_ops.organizations (pilot_cohort_recorded_by);
