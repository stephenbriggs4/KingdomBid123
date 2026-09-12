begin;

-- B1: preserve and remove only the two independently verified QA hire rows
-- whose project, bid, and vendor parents were removed by earlier fixture
-- cleanup migrations. A partial match is treated as a changed live condition
-- and aborts the migration.
do $$
declare
  v_live_count integer;
  v_archived_count integer;
  v_deleted_count integer;
begin
  select count(*)
  into v_live_count
  from public.hire_confirmations h
  where (
      h.id = 'bb433e98-bdca-4fa8-80e9-2283c73d893f'::uuid
      and h.project_title = 'Freeze Verification Hire Flow'
      and h.vendor_name = 'My Vendor Business'
    )
    or (
      h.id = 'b38a6233-a4ac-4db5-a308-895be9ecfd34'::uuid
      and h.project_title = 'Deal Room UI Audit Test Project'
      and h.vendor_name = 'Vendor123'
    );

  if v_live_count not in (0, 2) then
    raise exception 'B1 live state changed: expected zero or two exact orphan fixtures, found %', v_live_count;
  end if;

  if exists (
    select 1
    from public.hire_confirmations h
    where h.id in (
      'bb433e98-bdca-4fa8-80e9-2283c73d893f'::uuid,
      'b38a6233-a4ac-4db5-a308-895be9ecfd34'::uuid
    )
      and (
        exists (select 1 from public.projects p where p.id = h.project_id)
        or exists (select 1 from public.bids b where b.id = h.bid_id)
        or exists (select 1 from public.vendors v where v.id = h.vendor_id)
      )
  ) then
    raise exception 'B1 refused: a named hire row is no longer fully orphaned';
  end if;

  insert into concierge_ops.release_verification_fixture_archive
    (source_table, source_id, payload, archive_reason)
  select
    'public.hire_confirmations',
    h.id::text,
    to_jsonb(h),
    'remove_orphaned_marketplace_hire_fixtures'
  from public.hire_confirmations h
  where h.id in (
    'bb433e98-bdca-4fa8-80e9-2283c73d893f'::uuid,
    'b38a6233-a4ac-4db5-a308-895be9ecfd34'::uuid
  )
  on conflict (source_table, source_id, archive_reason) do nothing;

  select count(*)
  into v_archived_count
  from concierge_ops.release_verification_fixture_archive a
  where a.source_table = 'public.hire_confirmations'
    and a.source_id in (
      'bb433e98-bdca-4fa8-80e9-2283c73d893f'::text,
      'b38a6233-a4ac-4db5-a308-895be9ecfd34'::text
    )
    and a.archive_reason = 'remove_orphaned_marketplace_hire_fixtures'
    and (a.payload ->> 'id') = a.source_id;

  if v_archived_count <> v_live_count then
    raise exception 'B1 archive verification failed: expected % recoverable snapshots, found %', v_live_count, v_archived_count;
  end if;

  delete from public.hire_confirmations h
  where h.id in (
    'bb433e98-bdca-4fa8-80e9-2283c73d893f'::uuid,
    'b38a6233-a4ac-4db5-a308-895be9ecfd34'::uuid
  );
  get diagnostics v_deleted_count = row_count;

  if v_deleted_count <> v_live_count then
    raise exception 'B1 delete verification failed: expected % rows, deleted %', v_live_count, v_deleted_count;
  end if;
end
$$;

-- Financial hire records now block parent deletion until a cleanup or archival
-- path handles them explicitly. NOT VALID enforces new writes immediately;
-- validation below proves the existing table is clean before commit.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'hire_confirmations_project_id_fkey' and conrelid = 'public.hire_confirmations'::regclass) then
    alter table public.hire_confirmations
      add constraint hire_confirmations_project_id_fkey
      foreign key (project_id) references public.projects(id)
      on delete restrict not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'hire_confirmations_bid_id_fkey' and conrelid = 'public.hire_confirmations'::regclass) then
    alter table public.hire_confirmations
      add constraint hire_confirmations_bid_id_fkey
      foreign key (bid_id) references public.bids(id)
      on delete restrict not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'hire_confirmations_church_id_fkey' and conrelid = 'public.hire_confirmations'::regclass) then
    alter table public.hire_confirmations
      add constraint hire_confirmations_church_id_fkey
      foreign key (church_id) references auth.users(id)
      on delete restrict not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'hire_confirmations_vendor_id_fkey' and conrelid = 'public.hire_confirmations'::regclass) then
    alter table public.hire_confirmations
      add constraint hire_confirmations_vendor_id_fkey
      foreign key (vendor_id) references auth.users(id)
      on delete restrict not valid;
  end if;
end
$$;

alter table public.hire_confirmations validate constraint hire_confirmations_project_id_fkey;
alter table public.hire_confirmations validate constraint hire_confirmations_bid_id_fkey;
alter table public.hire_confirmations validate constraint hire_confirmations_church_id_fkey;
alter table public.hire_confirmations validate constraint hire_confirmations_vendor_id_fkey;

alter table public.hire_confirmations alter column project_id set not null;
alter table public.hire_confirmations alter column bid_id set not null;

create index if not exists hire_confirmations_church_id_idx on public.hire_confirmations(church_id);

-- Internal, archive-first cleanup for deliberately synthetic marketplace
-- fixtures. This is SECURITY INVOKER and unavailable to browser roles.
create or replace function private.kb_archive_and_delete_marketplace_fixture_v1(
  p_project_ids uuid[],
  p_vendor_ids uuid[],
  p_archive_reason text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_project_ids uuid[];
  v_vendor_ids uuid[];
  v_bid_ids uuid[];
  v_conversation_ids uuid[];
  v_project_count integer;
  v_vendor_count integer;
  v_protected_count integer;
  v_missing_archive_count integer;
begin
  select coalesce(array_agg(distinct id), array[]::uuid[])
  into v_project_ids
  from unnest(coalesce(p_project_ids, array[]::uuid[])) id
  where id is not null;

  select coalesce(array_agg(distinct id), array[]::uuid[])
  into v_vendor_ids
  from unnest(coalesce(p_vendor_ids, array[]::uuid[])) id
  where id is not null;

  if cardinality(v_project_ids) = 0 then
    raise exception 'Fixture cleanup requires at least one explicit project id';
  end if;
  if nullif(btrim(p_archive_reason), '') is null
     or p_archive_reason !~ '^qa_fixture_cleanup:' then
    raise exception 'Fixture cleanup requires a qa_fixture_cleanup: archive reason';
  end if;

  select count(*) into v_project_count
  from public.projects p
  where p.id = any(v_project_ids)
    and p.record_origin in ('qa', 'synthetic');
  if v_project_count <> cardinality(v_project_ids) then
    raise exception 'Fixture cleanup refused: every project must exist and be explicitly QA/synthetic';
  end if;

  select count(*) into v_vendor_count
  from public.vendors v where v.id = any(v_vendor_ids);
  if v_vendor_count <> cardinality(v_vendor_ids) then
    raise exception 'Fixture cleanup refused: explicit vendor set does not match live rows';
  end if;

  select coalesce(array_agg(b.id), array[]::uuid[])
  into v_bid_ids
  from public.bids b
  where b.project_id = any(v_project_ids);

  select coalesce(array_agg(c.id), array[]::uuid[])
  into v_conversation_ids
  from public.conversations c
  where c.project_id = any(v_project_ids);

  select
    (select count(*) from public.reviews r where r.project_id = any(v_project_ids) or r.vendor_id = any(v_vendor_ids))
    + (select count(*) from public.stripe_payment_transactions t where t.project_id = any(v_project_ids))
    + (select count(*) from public.project_payment_plans p where p.project_id = any(v_project_ids) or p.bid_id = any(v_bid_ids))
    + (select count(*) from public.project_payment_installments i where i.project_id = any(v_project_ids) or i.bid_id = any(v_bid_ids))
    + (select count(*) from public.faithbid_church_rebates r where r.project_id = any(v_project_ids) or r.bid_id = any(v_bid_ids) or r.vendor_id = any(v_vendor_ids))
  into v_protected_count;
  if v_protected_count <> 0 then
    raise exception 'Fixture cleanup refused: % review/payment/rebate rows require separate handling', v_protected_count;
  end if;

  insert into concierge_ops.release_verification_fixture_archive(source_table, source_id, payload, archive_reason)
  select 'public.projects', p.id::text, to_jsonb(p), p_archive_reason from public.projects p where p.id = any(v_project_ids)
  on conflict (source_table, source_id, archive_reason) do nothing;

  insert into concierge_ops.release_verification_fixture_archive(source_table, source_id, payload, archive_reason)
  select 'public.bids', b.id::text, to_jsonb(b), p_archive_reason from public.bids b where b.id = any(v_bid_ids)
  on conflict (source_table, source_id, archive_reason) do nothing;

  insert into concierge_ops.release_verification_fixture_archive(source_table, source_id, payload, archive_reason)
  select 'public.vendors', v.id::text, to_jsonb(v), p_archive_reason from public.vendors v where v.id = any(v_vendor_ids)
  on conflict (source_table, source_id, archive_reason) do nothing;

  insert into concierge_ops.release_verification_fixture_archive(source_table, source_id, payload, archive_reason)
  select 'public.conversations', c.id::text, to_jsonb(c), p_archive_reason from public.conversations c where c.id = any(v_conversation_ids)
  on conflict (source_table, source_id, archive_reason) do nothing;

  insert into concierge_ops.release_verification_fixture_archive(source_table, source_id, payload, archive_reason)
  select 'public.notifications', n.id::text, to_jsonb(n), p_archive_reason
  from public.notifications n
  where exists (
    select 1 from unnest(v_project_ids || v_bid_ids || v_vendor_ids || v_conversation_ids) target_id
    where n.meta::text ilike '%' || target_id::text || '%'
  )
  on conflict (source_table, source_id, archive_reason) do nothing;

  insert into concierge_ops.release_verification_fixture_archive(source_table, source_id, payload, archive_reason)
  select 'public.messages', m.id::text, to_jsonb(m), p_archive_reason
  from public.messages m where m.conversation_id = any(v_conversation_ids)
  on conflict (source_table, source_id, archive_reason) do nothing;

  insert into concierge_ops.release_verification_fixture_archive(source_table, source_id, payload, archive_reason)
  select 'public.conversation_user_state', s.id::text, to_jsonb(s), p_archive_reason
  from public.conversation_user_state s where s.conversation_id = any(v_conversation_ids)
  on conflict (source_table, source_id, archive_reason) do nothing;

  insert into concierge_ops.release_verification_fixture_archive(source_table, source_id, payload, archive_reason)
  select 'public.hire_confirmations', h.id::text, to_jsonb(h), p_archive_reason
  from public.hire_confirmations h
  where h.project_id = any(v_project_ids) or h.bid_id = any(v_bid_ids)
  on conflict (source_table, source_id, archive_reason) do nothing;

  insert into concierge_ops.release_verification_fixture_archive(source_table, source_id, payload, archive_reason)
  select 'public.project_activity_feed', a.id::text, to_jsonb(a), p_archive_reason
  from public.project_activity_feed a where a.project_id = any(v_project_ids)
  on conflict (source_table, source_id, archive_reason) do nothing;

  select count(*) into v_missing_archive_count
  from (
    select 'public.projects'::text source_table, p.id::text source_id from public.projects p where p.id = any(v_project_ids)
    union all select 'public.bids', b.id::text from public.bids b where b.id = any(v_bid_ids)
    union all select 'public.vendors', v.id::text from public.vendors v where v.id = any(v_vendor_ids)
    union all select 'public.conversations', c.id::text from public.conversations c where c.id = any(v_conversation_ids)
    union all select 'public.notifications', n.id::text from public.notifications n where exists (
      select 1 from unnest(v_project_ids || v_bid_ids || v_vendor_ids || v_conversation_ids) target_id
      where n.meta::text ilike '%' || target_id::text || '%'
    )
    union all select 'public.messages', m.id::text from public.messages m where m.conversation_id = any(v_conversation_ids)
    union all select 'public.conversation_user_state', s.id::text from public.conversation_user_state s where s.conversation_id = any(v_conversation_ids)
    union all select 'public.hire_confirmations', h.id::text from public.hire_confirmations h where h.project_id = any(v_project_ids) or h.bid_id = any(v_bid_ids)
    union all select 'public.project_activity_feed', a.id::text from public.project_activity_feed a where a.project_id = any(v_project_ids)
  ) expected
  where not exists (
    select 1 from concierge_ops.release_verification_fixture_archive a
    where a.source_table = expected.source_table
      and a.source_id = expected.source_id
      and a.archive_reason = p_archive_reason
      and (a.payload ->> 'id') = expected.source_id
  );
  if v_missing_archive_count <> 0 then
    raise exception 'Fixture cleanup archive verification failed for % rows', v_missing_archive_count;
  end if;

  delete from public.notifications n where exists (
    select 1 from unnest(v_project_ids || v_bid_ids || v_vendor_ids || v_conversation_ids) target_id
    where n.meta::text ilike '%' || target_id::text || '%'
  );
  delete from public.messages m where m.conversation_id = any(v_conversation_ids);
  delete from public.conversation_user_state s where s.conversation_id = any(v_conversation_ids);
  delete from public.conversations c where c.id = any(v_conversation_ids);
  delete from public.hire_confirmations h where h.project_id = any(v_project_ids) or h.bid_id = any(v_bid_ids);
  delete from public.project_activity_feed a where a.project_id = any(v_project_ids);
  delete from public.bids b where b.id = any(v_bid_ids);
  delete from public.projects p where p.id = any(v_project_ids);
  delete from public.vendors v where v.id = any(v_vendor_ids);

  if exists (select 1 from public.projects p where p.id = any(v_project_ids))
     or exists (select 1 from public.bids b where b.id = any(v_bid_ids))
     or exists (select 1 from public.vendors v where v.id = any(v_vendor_ids))
     or exists (select 1 from public.conversations c where c.id = any(v_conversation_ids))
     or exists (select 1 from public.hire_confirmations h where h.project_id = any(v_project_ids) or h.bid_id = any(v_bid_ids))
     or exists (select 1 from public.project_activity_feed a where a.project_id = any(v_project_ids))
     or exists (
       select 1 from public.notifications n where exists (
         select 1 from unnest(v_project_ids || v_bid_ids || v_vendor_ids || v_conversation_ids) target_id
         where n.meta::text ilike '%' || target_id::text || '%'
       )
     ) then
    raise exception 'Fixture cleanup postcondition failed';
  end if;

  return jsonb_build_object(
    'project_ids', v_project_ids,
    'bid_ids', v_bid_ids,
    'vendor_ids', v_vendor_ids,
    'conversation_ids', v_conversation_ids,
    'archive_reason', p_archive_reason,
    'status', 'archived_and_deleted'
  );
end;
$$;

revoke all on function private.kb_archive_and_delete_marketplace_fixture_v1(uuid[], uuid[], text)
  from public, anon, authenticated;
grant execute on function private.kb_archive_and_delete_marketplace_fixture_v1(uuid[], uuid[], text)
  to service_role;

comment on function private.kb_archive_and_delete_marketplace_fixture_v1(uuid[], uuid[], text) is
  'Internal archive-first cleanup for explicit QA/synthetic marketplace fixtures. Refuses projects without QA provenance and any fixture with protected review/payment/rebate rows.';

do $$
begin
  if exists (
    select 1 from public.hire_confirmations h
    where not exists (select 1 from public.projects p where p.id = h.project_id)
  ) then
    raise exception 'B1 acceptance failed: orphaned hire confirmation remains';
  end if;
end
$$;

commit;
