alter table public.vendors
  add column if not exists availability_status text not null default 'unknown',
  add column if not exists availability_updated_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.vendors'::regclass
      and conname = 'vendors_availability_status_check'
  ) then
    alter table public.vendors
      add constraint vendors_availability_status_check
      check (availability_status in ('unknown', 'available', 'limited', 'unavailable'));
  end if;
end
$$;

comment on column public.vendors.availability_status is
  'Explicit vendor-supplied or admin-reviewed marketplace availability. Never infer available from a missing conversation.';

create table if not exists public.marketplace_vendor_curation (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  market_key text not null default 'dallas',
  featured_rank integer not null default 100 check (featured_rank between 1 and 10000),
  featured_reason text,
  featured_from timestamptz not null default now(),
  featured_until timestamptz,
  active boolean not null default true,
  curated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_vendor_curation_window_check check (featured_until is null or featured_until > featured_from),
  constraint marketplace_vendor_curation_vendor_market_key unique (vendor_id, market_key)
);

comment on table public.marketplace_vendor_curation is
  'Manual FaithBid curation for the pilot Featured rail. This is not paid placement; future sponsorship must use a separately disclosed model.';

create index if not exists marketplace_vendor_curation_active_rank_idx
  on public.marketplace_vendor_curation (market_key, active, featured_rank, featured_from desc);

alter table public.marketplace_vendor_curation enable row level security;

drop policy if exists marketplace_vendor_curation_read_active on public.marketplace_vendor_curation;
create policy marketplace_vendor_curation_read_active
  on public.marketplace_vendor_curation for select to authenticated
  using (active and featured_from <= now() and (featured_until is null or featured_until > now()));

drop policy if exists marketplace_vendor_curation_admin_all on public.marketplace_vendor_curation;
create policy marketplace_vendor_curation_admin_all
  on public.marketplace_vendor_curation for all to authenticated
  using (public.kb_is_platform_admin())
  with check (public.kb_is_platform_admin());

grant select, insert, update, delete on public.marketplace_vendor_curation to authenticated;

do $$
declare v_missing integer;
begin
  select count(*) into v_missing
  from (values ('availability_status'), ('availability_updated_at')) expected(column_name)
  where not exists (
    select 1 from information_schema.columns c
    where c.table_schema='public' and c.table_name='vendors' and c.column_name=expected.column_name
  );
  if v_missing <> 0 then
    raise exception 'Marketplace vendor availability migration incomplete: % columns missing', v_missing;
  end if;
  if to_regclass('public.marketplace_vendor_curation') is null then
    raise exception 'Marketplace vendor curation table was not created';
  end if;
end
$$;
