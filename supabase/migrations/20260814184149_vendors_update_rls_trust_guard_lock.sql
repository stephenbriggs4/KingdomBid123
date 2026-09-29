create or replace function public.kb_vendor_protected_fields_guard()
returns trigger
language plpgsql
set search_path to 'pg_catalog','public','auth'
as $$
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean := false;
begin
  if v_uid is null then
    return new;
  end if;

  v_is_admin := public.kb_is_platform_admin();
  if v_is_admin then
    return new;
  end if;

  if v_uid = old.user_id then
    if new.user_id is distinct from old.user_id
       or new.verified is distinct from old.verified
       or new.verification_status is distinct from old.verification_status
       or new.verified_at is distinct from old.verified_at
       or new.founding_vendor is distinct from old.founding_vendor
       or new.suspended is distinct from old.suspended
       or new.tier is distinct from old.tier
       or new.rating is distinct from old.rating
       or new.reviews_count is distinct from old.reviews_count
       or new.projects_count is distinct from old.projects_count
       or new.elder_endorsed is distinct from old.elder_endorsed
       or new.elder_endorsement_status is distinct from old.elder_endorsement_status
       or new.elder_endorsement is distinct from old.elder_endorsement
       or new.completed_project_count is distinct from old.completed_project_count
       or new.reference_count is distinct from old.reference_count
       or new.response_speed_label is distinct from old.response_speed_label then
      raise exception using errcode='42501', message='Vendor trust and verification fields are platform-managed.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.kb_vendor_protected_fields_guard() from public, anon, authenticated;
grant execute on function public.kb_vendor_protected_fields_guard() to postgres, service_role;

drop trigger if exists kb_vendor_protected_fields_guard_tg on public.vendors;
create trigger kb_vendor_protected_fields_guard_tg
before update on public.vendors
for each row execute function public.kb_vendor_protected_fields_guard();

drop policy if exists "Vendors can update own profile" on public.vendors;
drop policy if exists vendors_update_self on public.vendors;
drop policy if exists kb_vendors_update_own on public.vendors;

create policy kb_vendors_update_own
on public.vendors for update
to authenticated
using (
  user_id = (select auth.uid())
  or public.kb_is_platform_admin()
)
with check (
  user_id = (select auth.uid())
  or public.kb_is_platform_admin()
);
