begin;

-- The application directory already filters to admitted vendors, but RLS is
-- the durable boundary. When the marketplace is public, anonymous and
-- unrelated authenticated users must never be able to read pending, rejected,
-- or suspended vendor records directly through the Data API.
drop policy if exists kb_vendors_select_anon on public.vendors;
create policy kb_vendors_select_anon
on public.vendors
for select
to anon
using (
  public.kb_marketplace_public()
  and not coalesce(suspended, false)
  and (
    lower(coalesce(verification_status, '')) = 'approved'
    or (
      verification_status is null
      and coalesce(verified, false)
    )
  )
);

drop policy if exists kb_vendors_select_authenticated on public.vendors;
create policy kb_vendors_select_authenticated
on public.vendors
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.kb_is_platform_admin()
  or (
    public.kb_marketplace_public()
    and not coalesce(suspended, false)
    and (
      lower(coalesce(verification_status, '')) = 'approved'
      or (
        verification_status is null
        and coalesce(verified, false)
      )
    )
  )
);

comment on policy kb_vendors_select_anon on public.vendors is
  'Public directory reads expose only admitted, unsuspended vendors while the marketplace is public.';

comment on policy kb_vendors_select_authenticated on public.vendors is
  'Authenticated users can read their own vendor row, admins can review all rows, and unrelated users see only admitted, unsuspended public-directory vendors.';

commit;
