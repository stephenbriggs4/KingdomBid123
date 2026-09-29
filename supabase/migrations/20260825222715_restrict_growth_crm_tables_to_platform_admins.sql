
drop policy if exists "Auth users only" on public.growth_vendors;
drop policy if exists "Auth users only" on public.growth_churches;

create policy kb_growth_vendors_platform_admin_all
on public.growth_vendors
for all
to authenticated
using ((select public.kb_is_platform_admin()))
with check ((select public.kb_is_platform_admin()));

create policy kb_growth_churches_platform_admin_all
on public.growth_churches
for all
to authenticated
using ((select public.kb_is_platform_admin()))
with check ((select public.kb_is_platform_admin()));

revoke all privileges on table public.growth_vendors from anon;
revoke all privileges on table public.growth_churches from anon;

revoke truncate, references, trigger on table public.growth_vendors from authenticated;
revoke truncate, references, trigger on table public.growth_churches from authenticated;

grant select, insert, update, delete on table public.growth_vendors to authenticated;
grant select, insert, update, delete on table public.growth_churches to authenticated;
