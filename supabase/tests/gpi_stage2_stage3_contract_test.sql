begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(34);

create temp table stage23_tables (name text primary key) on commit drop;
insert into stage23_tables (name) values
  ('gpi_participation_consent_policies'),
  ('gpi_participation_events'),
  ('gpi_participation_notification_deliveries'),
  ('gpi_participation_occurrence_intent_events'),
  ('gpi_participation_occurrence_intents'),
  ('gpi_participation_relationships');

create temp table stage23_functions (
  signature text primary key,
  service_only boolean not null
) on commit drop;
insert into stage23_functions (signature, service_only) values
  ('public.gpi_host_get_participation_summary(uuid,uuid)', false),
  ('public.gpi_service_change_occurrence_intent(uuid,uuid,uuid,text,uuid)', true),
  ('public.gpi_service_change_recurring_updates(uuid,uuid,text,uuid)', true),
  ('public.gpi_service_claim_participation_notifications(uuid,integer)', true),
  ('public.gpi_service_get_my_occurrence_intents(uuid,uuid)', true),
  ('public.gpi_service_get_my_participation(uuid,uuid)', true),
  ('public.gpi_service_mark_participation_notification(uuid,uuid,text,text,text)', true),
  ('public.gpi_service_opt_in_recurring_updates(uuid,uuid,uuid,text,uuid)', true),
  ('public.gpi_service_prepare_participation_send(uuid,uuid)', true),
  ('public.gpi_service_queue_participation_notifications(timestamptz,interval,integer)', true),
  ('public.gpi_service_reconcile_participation_eligibility(integer)', true);

select has_table('public', 'gpi_participation_consent_policies', 'Stage 2 consent policies table exists');
select has_table('public', 'gpi_participation_relationships', 'Stage 2 relationships table exists');
select has_table('public', 'gpi_participation_events', 'Stage 2 event ledger exists');
select has_table('public', 'gpi_participation_notification_deliveries', 'Stage 2 delivery ledger exists');
select has_table('public', 'gpi_participation_occurrence_intents', 'Stage 3 occurrence intents table exists');
select has_table('public', 'gpi_participation_occurrence_intent_events', 'Stage 3 occurrence event ledger exists');

select is(
  (select count(*)::integer
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   join stage23_tables t on t.name = c.relname
   where n.nspname = 'public' and c.relrowsecurity),
  6,
  'RLS is enabled on every Stage 2/3 table'
);

select is(
  (select count(*)::integer
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   join stage23_tables t on t.name = c.relname
   where n.nspname = 'public' and c.relforcerowsecurity),
  6,
  'RLS is forced on every Stage 2/3 table'
);

select is(
  (select count(*)::integer from stage23_tables
   where has_table_privilege('anon', format('public.%I', name), 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')),
  0,
  'anon has no direct Stage 2/3 table privileges'
);

select is(
  (select count(*)::integer from stage23_tables
   where has_table_privilege('authenticated', format('public.%I', name), 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')),
  0,
  'authenticated has no direct Stage 2/3 table privileges'
);

select is(
  (select count(*)::integer from stage23_tables
   where has_table_privilege('service_role', format('public.%I', name), 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')),
  0,
  'service_role uses RPCs instead of direct Stage 2/3 table privileges'
);

select ok(to_regprocedure('public.gpi_host_get_participation_summary(uuid,uuid)') is not null, 'Host aggregate RPC exists');
select ok(to_regprocedure('public.gpi_service_change_occurrence_intent(uuid,uuid,uuid,text,uuid)') is not null, 'Occurrence intent mutation RPC exists');
select ok(to_regprocedure('public.gpi_service_change_recurring_updates(uuid,uuid,text,uuid)') is not null, 'Recurring update mutation RPC exists');
select ok(to_regprocedure('public.gpi_service_claim_participation_notifications(uuid,integer)') is not null, 'Notification claim RPC exists');
select ok(to_regprocedure('public.gpi_service_get_my_occurrence_intents(uuid,uuid)') is not null, 'Occurrence intent read RPC exists');
select ok(to_regprocedure('public.gpi_service_get_my_participation(uuid,uuid)') is not null, 'Participation read RPC exists');
select ok(to_regprocedure('public.gpi_service_mark_participation_notification(uuid,uuid,text,text,text)') is not null, 'Notification result RPC exists');
select ok(to_regprocedure('public.gpi_service_opt_in_recurring_updates(uuid,uuid,uuid,text,uuid)') is not null, 'Recurring update opt-in RPC exists');
select ok(to_regprocedure('public.gpi_service_prepare_participation_send(uuid,uuid)') is not null, 'Notification preparation RPC exists');
select ok(to_regprocedure('public.gpi_service_queue_participation_notifications(timestamptz,interval,integer)') is not null, 'Notification queue RPC exists');
select ok(to_regprocedure('public.gpi_service_reconcile_participation_eligibility(integer)') is not null, 'Eligibility reconciliation RPC exists');

select is(
  (select count(*)::integer
   from stage23_functions f
   join pg_proc p on p.oid = to_regprocedure(f.signature)
   where p.prosecdef),
  11,
  'All Stage 2/3 RPCs are security definer functions'
);

select is(
  (select count(*)::integer
   from stage23_functions f
   join pg_proc p on p.oid = to_regprocedure(f.signature)
   where 'search_path=""' = any(coalesce(p.proconfig, '{}'::text[]))),
  11,
  'All Stage 2/3 RPCs use an empty hardened search_path'
);

select is(
  (select count(*)::integer from stage23_functions
   where service_only and has_function_privilege('anon', signature, 'EXECUTE')),
  0,
  'anon cannot execute service-only Stage 2/3 RPCs'
);

select is(
  (select count(*)::integer from stage23_functions
   where service_only and has_function_privilege('authenticated', signature, 'EXECUTE')),
  0,
  'authenticated cannot execute service-only Stage 2/3 RPCs'
);

select is(
  (select count(*)::integer
   from stage23_functions f
   join pg_proc p on p.oid = to_regprocedure(f.signature)
   where f.service_only
     and exists (
       select 1
       from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
       where a.grantee = 0 and a.privilege_type = 'EXECUTE'
     )),
  0,
  'PUBLIC cannot execute service-only Stage 2/3 RPCs'
);

select is(
  (select count(*)::integer from stage23_functions
   where service_only and has_function_privilege('service_role', signature, 'EXECUTE')),
  10,
  'service_role can execute every service-only Stage 2/3 RPC'
);

select ok(
  has_function_privilege('authenticated', 'public.gpi_host_get_participation_summary(uuid,uuid)', 'EXECUTE'),
  'authenticated hosts can execute the anonymous aggregate RPC'
);

select ok(
  not has_function_privilege('anon', 'public.gpi_host_get_participation_summary(uuid,uuid)', 'EXECUTE'),
  'anon cannot execute the host aggregate RPC'
);

select ok(
  to_regclass('public.gpi_participation_relationships_current_key') is not null,
  'One current relationship per seeker and opportunity is enforced'
);

select ok(
  exists (
    select 1 from pg_constraint
    where conname = 'gpi_participation_occurrence_intents_natural_key'
      and conrelid = 'public.gpi_participation_occurrence_intents'::regclass
      and contype = 'u'
  ),
  'One occurrence intent row per relationship and occurrence is enforced'
);

select is(
  (select count(*)::integer
   from pg_constraint
   where conname in (
     'gpi_participation_events_operation_id_key',
     'gpi_participation_occurrence_intent_events_operation_id_key'
   ) and contype = 'u'),
  2,
  'Stage 2 and Stage 3 operation IDs are idempotent'
);

select ok(
  exists (
    select 1
    from public.gpi_participation_consent_policies
    where version = 'stage2-recurring-updates-v1'
      and active
      and retired_at is null
      and body_hash ~ '^[0-9a-f]{64}$'
  ),
  'The approved Stage 2 recurring-update consent policy is active'
);

select * from finish();
rollback;
