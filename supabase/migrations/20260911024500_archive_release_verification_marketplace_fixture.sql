-- Remove the synthetic marketplace release-verification fixture from live
-- marketplace tables while preserving an internal, recoverable JSON snapshot.

create table if not exists concierge_ops.release_verification_fixture_archive (
  id bigint generated always as identity primary key,
  source_table text not null,
  source_id text not null,
  payload jsonb not null,
  archive_reason text not null,
  archived_at timestamptz not null default clock_timestamp(),
  constraint release_verification_fixture_archive_unique
    unique (source_table, source_id, archive_reason)
);

alter table concierge_ops.release_verification_fixture_archive enable row level security;
revoke all on table concierge_ops.release_verification_fixture_archive from public, anon, authenticated;
grant select, insert on table concierge_ops.release_verification_fixture_archive to service_role;
grant usage, select on sequence concierge_ops.release_verification_fixture_archive_id_seq to service_role;

with fixture_project as (
  select p.*
  from public.projects p
  where p.source = 'codex-freeze-verification'
    and p.record_origin = 'qa'
    and p.title = 'Freeze Verification Hire Flow'
)
insert into concierge_ops.release_verification_fixture_archive
  (source_table, source_id, payload, archive_reason)
select 'public.projects', p.id::text, to_jsonb(p), 'remove_release_verification_fixture'
from fixture_project p
on conflict (source_table, source_id, archive_reason) do nothing;

with fixture_project as (
  select p.id
  from public.projects p
  where p.source = 'codex-freeze-verification'
    and p.record_origin = 'qa'
    and p.title = 'Freeze Verification Hire Flow'
)
insert into concierge_ops.release_verification_fixture_archive
  (source_table, source_id, payload, archive_reason)
select 'public.bids', b.id::text, to_jsonb(b), 'remove_release_verification_fixture'
from public.bids b
join fixture_project p on p.id = b.project_id
on conflict (source_table, source_id, archive_reason) do nothing;

with fixture_project as (
  select p.id
  from public.projects p
  where p.source = 'codex-freeze-verification'
    and p.record_origin = 'qa'
    and p.title = 'Freeze Verification Hire Flow'
), fixture_vendor_users as (
  select distinct b.vendor_user_id
  from public.bids b
  join fixture_project p on p.id = b.project_id
  where b.vendor_user_id is not null
)
insert into concierge_ops.release_verification_fixture_archive
  (source_table, source_id, payload, archive_reason)
select 'public.vendors', v.id::text, to_jsonb(v), 'remove_release_verification_fixture'
from public.vendors v
join fixture_vendor_users f on f.vendor_user_id = v.user_id
on conflict (source_table, source_id, archive_reason) do nothing;

do $$
declare
  fixture_project_ids uuid[];
  fixture_bid_ids uuid[];
  fixture_vendor_ids uuid[];
  fixture_vendor_user_ids uuid[];
begin
  select coalesce(array_agg(p.id), array[]::uuid[])
  into fixture_project_ids
  from public.projects p
  where p.source = 'codex-freeze-verification'
    and p.record_origin = 'qa'
    and p.title = 'Freeze Verification Hire Flow';

  select coalesce(array_agg(b.id), array[]::uuid[]),
         coalesce(array_agg(distinct b.vendor_user_id) filter (where b.vendor_user_id is not null), array[]::uuid[])
  into fixture_bid_ids, fixture_vendor_user_ids
  from public.bids b
  where b.project_id = any(fixture_project_ids);

  select coalesce(array_agg(v.id), array[]::uuid[])
  into fixture_vendor_ids
  from public.vendors v
  where v.user_id = any(fixture_vendor_user_ids);

  delete from public.notifications n
  where exists (
    select 1
    from unnest(fixture_project_ids || fixture_bid_ids || fixture_vendor_ids || fixture_vendor_user_ids) fixture_id
    where n.meta::text ilike '%' || fixture_id::text || '%'
  );

  delete from public.messages m
  using public.conversations c
  where m.conversation_id = c.id
    and c.project_id = any(fixture_project_ids);

  delete from public.conversation_user_state s
  using public.conversations c
  where s.conversation_id = c.id
    and c.project_id = any(fixture_project_ids);

  delete from public.conversations c where c.project_id = any(fixture_project_ids);
  delete from public.project_payment_installments i
    where i.project_id = any(fixture_project_ids) or i.bid_id = any(fixture_bid_ids);
  delete from public.project_payment_plans p
    where p.project_id = any(fixture_project_ids) or p.bid_id = any(fixture_bid_ids);
  delete from public.stripe_payment_transactions t where t.project_id = any(fixture_project_ids);
  delete from public.faithbid_church_rebates r
    where r.project_id = any(fixture_project_ids)
       or r.bid_id = any(fixture_bid_ids)
       or r.vendor_id = any(fixture_vendor_ids);
  delete from public.reviews r where r.vendor_id = any(fixture_vendor_ids);

  delete from public.projects p where p.id = any(fixture_project_ids);
  delete from public.vendors v where v.id = any(fixture_vendor_ids);
end
$$;

notify pgrst, 'reload schema';
