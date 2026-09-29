-- #6 Vendor portfolio foundation. Phase 1 UI will expose external links only; schema leaves room for later verified images/case studies.
create table if not exists public.vendor_portfolio_items (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'link' check (type in ('link','image','case_study')),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  url text,
  source text not null default 'manual' check (source in ('manual','faithbid_project')),
  source_project_id uuid references public.projects(id) on delete set null,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendor_portfolio_items_url_shape check (
    (type = 'link' and url is not null and char_length(url) <= 2048 and url ~* '^https?://')
    or (type <> 'link')
  )
);

create index if not exists vendor_portfolio_items_vendor_order_idx
  on public.vendor_portfolio_items(vendor_id, display_order, created_at);

alter table public.vendor_portfolio_items enable row level security;

drop policy if exists kb_vendor_portfolio_select_authenticated on public.vendor_portfolio_items;
create policy kb_vendor_portfolio_select_authenticated
on public.vendor_portfolio_items for select to authenticated
using (
  vendor_id = auth.uid()
  or public.kb_is_platform_admin()
  or exists (
    select 1 from public.platform_settings s
    where s.key='marketplace_public'
      and lower(btrim(coalesce(s.value,''))) in ('true','1','yes','on')
  )
);

drop policy if exists kb_vendor_portfolio_select_anon on public.vendor_portfolio_items;
create policy kb_vendor_portfolio_select_anon
on public.vendor_portfolio_items for select to anon
using (
  exists (
    select 1 from public.platform_settings s
    where s.key='marketplace_public'
      and lower(btrim(coalesce(s.value,''))) in ('true','1','yes','on')
  )
);

drop policy if exists kb_vendor_portfolio_insert_own on public.vendor_portfolio_items;
create policy kb_vendor_portfolio_insert_own
on public.vendor_portfolio_items for insert to authenticated
with check (vendor_id = auth.uid() or public.kb_is_platform_admin());

drop policy if exists kb_vendor_portfolio_update_own on public.vendor_portfolio_items;
create policy kb_vendor_portfolio_update_own
on public.vendor_portfolio_items for update to authenticated
using (vendor_id = auth.uid() or public.kb_is_platform_admin())
with check (vendor_id = auth.uid() or public.kb_is_platform_admin());

drop policy if exists kb_vendor_portfolio_delete_own on public.vendor_portfolio_items;
create policy kb_vendor_portfolio_delete_own
on public.vendor_portfolio_items for delete to authenticated
using (vendor_id = auth.uid() or public.kb_is_platform_admin());

create or replace function public.kb_vendor_portfolio_touch_updated_at()
returns trigger language plpgsql set search_path='' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists vendor_portfolio_items_touch_updated_at on public.vendor_portfolio_items;
create trigger vendor_portfolio_items_touch_updated_at
before update on public.vendor_portfolio_items
for each row execute function public.kb_vendor_portfolio_touch_updated_at();
