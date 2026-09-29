
alter table public.groups
  add column if not exists external_group_key text,
  add column if not exists canonical_link text,
  add column if not exists membership_verified_at timestamptz,
  add column if not exists membership_source text,
  add column if not exists pilot_relevant boolean not null default false,
  add column if not exists geographic_scope text,
  add column if not exists service_category_tags text[] not null default '{}'::text[],
  add column if not exists faithbid_relevance text not null default 'unreviewed';

update public.groups
set external_group_key = lower((regexp_match(link, '(?i)facebook\.com/groups/([^/?#]+)'))[1]),
    canonical_link = 'https://www.facebook.com/groups/' || lower((regexp_match(link, '(?i)facebook\.com/groups/([^/?#]+)'))[1])
where lower(platform) = 'facebook'
  and link ~* 'facebook\.com/groups/[^/?#]+'
  and external_group_key is null;

drop index if exists public.groups_name_unique;

create unique index if not exists groups_platform_external_group_key_unique
  on public.groups (lower(platform), external_group_key)
  where external_group_key is not null;

create index if not exists groups_membership_inventory_idx
  on public.groups (join_status, membership_verified_at desc)
  where lower(platform) = 'facebook' and join_status in ('member', 'requested');

create index if not exists groups_pilot_relevant_idx
  on public.groups (pilot_relevant, growth_priority_tier, member_count desc)
  where pilot_relevant = true;

alter table public.groups
  drop constraint if exists groups_faithbid_relevance_check;

alter table public.groups
  add constraint groups_faithbid_relevance_check
  check (faithbid_relevance in ('pilot', 'candidate', 'low_relevance', 'personal', 'unreviewed'));

comment on column public.groups.external_group_key is 'Stable platform-native group identifier used for deduplication.';
comment on column public.groups.membership_verified_at is 'Most recent direct observation of the operator membership state.';
comment on column public.groups.pilot_relevant is 'Explicit Dallas Pilot sourcing filter; never inferred at query time.';
