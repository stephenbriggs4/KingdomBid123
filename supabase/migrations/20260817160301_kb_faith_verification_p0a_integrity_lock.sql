-- FaithBid P0-A Integrity Lock
-- Scope: verification/reference RLS hardening, canonical status contracts,
-- one-active-verification constraint, completed/sent reference evidence protection,
-- reference-response direct-write restriction, and Elder Endorsed public-PII quarantine.

-- ============================================================
-- 1. vendor_verifications
-- ============================================================

drop policy if exists "Users manage own verifications"
  on public.vendor_verifications;

drop policy if exists "kb_vendor_verifications_own_or_admin"
  on public.vendor_verifications;

drop policy if exists "vendor_verifications_insert_self"
  on public.vendor_verifications;

drop policy if exists "vendor_verifications_select_self"
  on public.vendor_verifications;

drop policy if exists "vendor_verifications_update_admin"
  on public.vendor_verifications;

create policy kb_vendor_verifications_owner_select
on public.vendor_verifications
for select
to authenticated
using (
  user_id = auth.uid()
);

create policy kb_vendor_verifications_owner_insert_pending
on public.vendor_verifications
for insert
to authenticated
with check (
  user_id = auth.uid()
  and coalesce(status, 'pending') = 'pending'
  and reviewed_at is null
  and exists (
    select 1
    from public.vendors v
    where v.id = vendor_verifications.vendor_id
      and v.user_id = auth.uid()
      and coalesce(v.verified, false) = false
  )
);

create policy kb_vendor_verifications_admin_all
on public.vendor_verifications
for all
to authenticated
using (
  public.kb_is_platform_admin()
)
with check (
  public.kb_is_platform_admin()
);

alter table public.vendor_verifications
  alter column status set default 'pending';

alter table public.vendor_verifications
  alter column status set not null;

alter table public.vendor_verifications
  add constraint vendor_verifications_status_check
  check (status in ('pending', 'needs_info', 'approved', 'rejected'));

create unique index vendor_verifications_one_active_per_vendor_idx
on public.vendor_verifications (vendor_id)
where status in ('pending', 'needs_info');

-- ============================================================
-- 2. vendor_references
-- ============================================================

drop policy if exists "kb_vendor_references_owner"
  on public.vendor_references;

create policy kb_vendor_references_owner_select
on public.vendor_references
for select
to authenticated
using (
  vendor_id = auth.uid()
);

create policy kb_vendor_references_owner_insert_pending
on public.vendor_references
for insert
to authenticated
with check (
  vendor_id = auth.uid()
  and status = 'pending'
  and sent_at is null
  and completed_at is null
);

create policy kb_vendor_references_owner_delete_unsent
on public.vendor_references
for delete
to authenticated
using (
  vendor_id = auth.uid()
  and status = 'pending'
  and sent_at is null
  and completed_at is null
  and not exists (
    select 1
    from public.vendor_reference_responses vrr
    where vrr.reference_id = vendor_references.id
  )
);

create policy kb_vendor_references_admin_select
on public.vendor_references
for select
to authenticated
using (
  public.kb_is_platform_admin()
);

create policy kb_vendor_references_admin_update
on public.vendor_references
for update
to authenticated
using (
  public.kb_is_platform_admin()
)
with check (
  public.kb_is_platform_admin()
);

alter table public.vendor_references
  add constraint vendor_references_status_check
  check (status in ('pending', 'sent', 'completed', 'cancelled'));

-- ============================================================
-- 3. vendor_reference_responses
-- ============================================================

drop policy if exists "kb_vendor_reference_responses_admin"
  on public.vendor_reference_responses;

drop policy if exists "kb_vendor_reference_responses_owner_select"
  on public.vendor_reference_responses;

create policy kb_vendor_reference_responses_owner_select
on public.vendor_reference_responses
for select
to authenticated
using (
  vendor_id = auth.uid()
);

create policy kb_vendor_reference_responses_admin_select
on public.vendor_reference_responses
for select
to authenticated
using (
  public.kb_is_platform_admin()
);

-- ============================================================
-- 4. Elder Endorsed PII quarantine
-- ============================================================

drop policy if exists "vendor_endorsements_read_all"
  on public.vendor_endorsements;
