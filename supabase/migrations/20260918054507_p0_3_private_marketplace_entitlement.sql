
-- P0-3: real server-recognized private-Marketplace entitlement for churches,
-- replacing the client-only "any non-suspended church" heuristic
-- (hasActiveChurchWorkspaceAccess) that granted privateMarketplaceAccess=true
-- to every church regardless of admission status while RLS still required
-- kb_marketplace_public()=true, blocking real project/vendor-directory use.
--
-- Two ways to grant it, per founder direction:
--   1. "Send them a link" -- the existing waitlist -> admin review -> invitation
--      -> finalize pipeline (already built, tokenized, admin-controlled, and
--      already used for vendors) now also grants this flag when a church
--      completes conversion, mirroring how it already sets founding_vendor=true
--      for vendors.
--   2. "Do it myself" -- a new admin-only RPC to grant/revoke the flag directly
--      on an existing profile, for churches Stephen onboards by hand.

alter table public.profiles
  add column if not exists private_marketplace_access boolean not null default false;

create or replace function public.kb_has_private_marketplace_access(p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.private_marketplace_access from public.profiles p where p.id = p_uid),
    false
  );
$$;

revoke all on function public.kb_has_private_marketplace_access(uuid) from public;
grant execute on function public.kb_has_private_marketplace_access(uuid) to authenticated, anon;

-- Admin direct-grant path.
create or replace function public.kb_admin_set_private_marketplace_access(p_profile_id uuid, p_granted boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not kb_is_platform_admin() then
    raise exception using errcode = '42501', message = 'Only a platform admin may grant private Marketplace access.';
  end if;
  update public.profiles set private_marketplace_access = coalesce(p_granted, false) where id = p_profile_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'Profile not found.';
  end if;
end;
$$;

revoke all on function public.kb_admin_set_private_marketplace_access(uuid, boolean) from public;
grant execute on function public.kb_admin_set_private_marketplace_access(uuid, boolean) to authenticated;

-- Thread the entitlement through the same RLS gates kb_marketplace_public() already guards.
drop policy if exists kb_projects_insert_owner on public.projects;
create policy kb_projects_insert_owner on public.projects for insert to authenticated
with check (
  kb_is_platform_admin()
  or ((kb_marketplace_public() or kb_has_private_marketplace_access((select auth.uid()))) and church_id = (select auth.uid()) and status = 'draft'::text)
);

drop policy if exists kb_projects_update_owner on public.projects;
create policy kb_projects_update_owner on public.projects for update to authenticated
using (
  kb_is_platform_admin()
  or ((kb_marketplace_public() or kb_has_private_marketplace_access((select auth.uid()))) and church_id = (select auth.uid()))
)
with check (
  kb_is_platform_admin()
  or ((kb_marketplace_public() or kb_has_private_marketplace_access((select auth.uid()))) and church_id = (select auth.uid()))
);

drop policy if exists kb_projects_delete_owner on public.projects;
create policy kb_projects_delete_owner on public.projects for delete to authenticated
using (
  kb_is_platform_admin()
  or ((kb_marketplace_public() or kb_has_private_marketplace_access((select auth.uid()))) and church_id = (select auth.uid()))
);

drop policy if exists kb_vendors_select_authenticated on public.vendors;
create policy kb_vendors_select_authenticated on public.vendors for select to authenticated
using (
  user_id = (select auth.uid())
  or kb_is_platform_admin()
  or (
    (kb_marketplace_public() or kb_has_private_marketplace_access((select auth.uid())))
    and not coalesce(suspended, false)
    and (lower(coalesce(verification_status, '')) = 'approved' or (verification_status is null and coalesce(verified, false)))
  )
);
