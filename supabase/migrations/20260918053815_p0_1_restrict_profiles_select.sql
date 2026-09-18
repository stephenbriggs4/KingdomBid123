
-- P0-1: replace blanket authenticated SELECT (qual=true, all columns) with owner/admin only.
drop policy if exists kb_profiles_select_auth on public.profiles;

create policy kb_profiles_select_own_or_admin
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or kb_is_platform_admin()
);

-- Safe public projection: only fields the product already renders to other users
-- (vendor/church names on cards, faith statement testimonial, location, org type,
-- verification badges, member-since date). Never email/account_status/access_status/
-- referral*/signup_source*/vendor_pro_*/nda_required/place_id.
create or replace function public.kb_profiles_public(p_ids uuid[])
returns table (
  id uuid,
  role text,
  org_name text,
  city text,
  state_code text,
  denomination text,
  category text,
  faith_statement text,
  church_verified boolean,
  founding_vendor boolean,
  vendor_type text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id, p.role, p.org_name, p.city, p.state_code, p.denomination, p.category,
    p.faith_statement, p.church_verified, p.founding_vendor, p.vendor_type, p.created_at
  from public.profiles p
  where p.id = any(coalesce(p_ids, '{}'::uuid[]))
  limit 200;
$$;

revoke all on function public.kb_profiles_public(uuid[]) from public;
grant execute on function public.kb_profiles_public(uuid[]) to authenticated;
