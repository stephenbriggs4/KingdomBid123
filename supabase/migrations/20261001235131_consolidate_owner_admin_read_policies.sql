-- Preserve the existing owner-or-admin access contract while ensuring each
-- SELECT evaluates one permissive policy instead of two.

drop policy if exists privacy_requests_own_read on public.privacy_requests;
drop policy if exists privacy_requests_admin_read on public.privacy_requests;
create policy privacy_requests_owner_or_admin_read
  on public.privacy_requests
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select coalesce(public.kb_is_platform_admin(), false))
  );

drop policy if exists vendor_credentials_owner_read on public.vendor_credentials;
drop policy if exists vendor_credentials_admin_read on public.vendor_credentials;
create policy vendor_credentials_owner_or_admin_read
  on public.vendor_credentials
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select coalesce(public.kb_is_platform_admin(), false))
  );

-- The old owner FOR ALL policy overlapped with the admin SELECT policy.
-- Split owner mutations by command and combine only the read contract.
drop policy if exists vendor_private_contact_owner on public.vendor_private_contact;
drop policy if exists vendor_private_contact_admin on public.vendor_private_contact;

create policy vendor_private_contact_owner_or_admin_read
  on public.vendor_private_contact
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select coalesce(public.kb_is_platform_admin(), false))
  );

create policy vendor_private_contact_owner_insert
  on public.vendor_private_contact
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.vendors v
      where v.id = vendor_id
        and v.user_id = (select auth.uid())
    )
  );

create policy vendor_private_contact_owner_update
  on public.vendor_private_contact
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.vendors v
      where v.id = vendor_id
        and v.user_id = (select auth.uid())
    )
  );

create policy vendor_private_contact_owner_delete
  on public.vendor_private_contact
  for delete to authenticated
  using (user_id = (select auth.uid()));
