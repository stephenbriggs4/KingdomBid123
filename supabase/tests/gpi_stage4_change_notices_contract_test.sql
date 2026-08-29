begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(36);

select has_table('public', 'gpi_occurrence_change_events', 'Stage 4 event table exists');
select has_table('public', 'gpi_occurrence_change_recipients', 'Stage 4 recipient table exists');

select is(
  (select count(*)::integer
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname in ('gpi_occurrence_change_events', 'gpi_occurrence_change_recipients')
     and c.relrowsecurity),
  2,
  'RLS is enabled on both Stage 4 tables'
);

select is(
  (select count(*)::integer
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname in ('gpi_occurrence_change_events', 'gpi_occurrence_change_recipients')
     and c.relforcerowsecurity),
  2,
  'RLS is forced on both Stage 4 tables'
);

select is(
  (select count(*)::integer
   from unnest(array['gpi_occurrence_change_events','gpi_occurrence_change_recipients']) t(name)
   where has_table_privilege('anon', format('public.%I', name), 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')),
  0,
  'anon has no direct Stage 4 table privileges'
);

select is(
  (select count(*)::integer
   from unnest(array['gpi_occurrence_change_events','gpi_occurrence_change_recipients']) t(name)
   where has_table_privilege('authenticated', format('public.%I', name), 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')),
  0,
  'authenticated has no direct Stage 4 table privileges'
);

select is(
  (select count(*)::integer
   from unnest(array['gpi_occurrence_change_events','gpi_occurrence_change_recipients']) t(name)
   where has_table_privilege('service_role', format('public.%I', name), 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')),
  0,
  'service_role uses the Stage 4 RPC instead of direct table access'
);

select ok(to_regprocedure('public.gpi_capture_occurrence_change_notices()') is not null, 'Stage 4 trigger function exists');
select ok(to_regprocedure('public.gpi_service_get_my_occurrence_change_notices(uuid,uuid,integer)') is not null, 'Stage 4 participant read RPC exists');

select ok(
  (select prosecdef from pg_proc where oid = to_regprocedure('public.gpi_capture_occurrence_change_notices()')),
  'Stage 4 trigger function is security definer'
);

select ok(
  (select prosecdef from pg_proc where oid = to_regprocedure('public.gpi_service_get_my_occurrence_change_notices(uuid,uuid,integer)')),
  'Stage 4 read RPC is security definer'
);

select ok(
  exists (
    select 1 from pg_proc p
    where p.oid = to_regprocedure('public.gpi_capture_occurrence_change_notices()')
      and 'search_path=""' = any(coalesce(p.proconfig, '{}'::text[]))
  ),
  'Stage 4 trigger function has an empty search_path'
);

select ok(
  exists (
    select 1 from pg_proc p
    where p.oid = to_regprocedure('public.gpi_service_get_my_occurrence_change_notices(uuid,uuid,integer)')
      and 'search_path=""' = any(coalesce(p.proconfig, '{}'::text[]))
  ),
  'Stage 4 read RPC has an empty search_path'
);

select ok(
  not has_function_privilege('anon', 'public.gpi_service_get_my_occurrence_change_notices(uuid,uuid,integer)', 'EXECUTE'),
  'anon cannot execute the Stage 4 read RPC'
);

select ok(
  not has_function_privilege('authenticated', 'public.gpi_service_get_my_occurrence_change_notices(uuid,uuid,integer)', 'EXECUTE'),
  'authenticated cannot execute the service-only Stage 4 read RPC directly'
);

select ok(
  has_function_privilege('service_role', 'public.gpi_service_get_my_occurrence_change_notices(uuid,uuid,integer)', 'EXECUTE'),
  'service_role can execute the Stage 4 read RPC'
);

select ok(
  not has_function_privilege('service_role', 'public.gpi_capture_occurrence_change_notices()', 'EXECUTE'),
  'service_role cannot invoke the trigger function directly'
);

select ok(
  not exists (
    select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    where a.grantee = 0 and a.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot invoke the Stage 4 trigger function'
)
from pg_proc p
where p.oid = to_regprocedure('public.gpi_capture_occurrence_change_notices()');

select ok(
  exists (
    select 1 from pg_trigger t
    where t.tgrelid = 'public.gpi_opportunity_occurrences'::regclass
      and t.tgname = 'gpi_occurrences_15_stage4_notices'
      and not t.tgisinternal
      and t.tgenabled = 'O'
  ),
  'Stage 4 trigger is enabled on the authoritative occurrence table'
);

select matches(
  (select pg_get_triggerdef(t.oid, true) from pg_trigger t
   where t.tgrelid = 'public.gpi_opportunity_occurrences'::regclass
     and t.tgname = 'gpi_occurrences_15_stage4_notices'),
  '^CREATE TRIGGER .* BEFORE UPDATE ON gpi_opportunity_occurrences ',
  'Stage 4 captures the pre-update audience'
);

select is(
  (select count(*)::integer from pg_constraint
   where conrelid in ('public.gpi_occurrence_change_events'::regclass, 'public.gpi_occurrence_change_recipients'::regclass)
     and contype = 'f'),
  5,
  'Stage 4 has five structural foreign keys'
);

select ok(
  exists (select 1 from pg_constraint
          where conrelid = 'public.gpi_occurrence_change_recipients'::regclass
            and conname = 'gpi_occurrence_change_recipients_pkey'
            and contype = 'p'),
  'One recipient row per event and relationship is enforced'
);

select ok(
  exists (select 1 from pg_constraint
          where conrelid = 'public.gpi_occurrence_change_events'::regclass
            and conname = 'gpi_occurrence_change_events_shape_check'
            and contype = 'c'),
  'Event type and old/new state shape are constrained'
);

select ok(
  exists (select 1 from pg_constraint
          where conrelid = 'public.gpi_occurrence_change_events'::regclass
            and conname = 'gpi_occurrence_change_events_actor_check'
            and contype = 'c'),
  'Actor kind and profile presence are structurally consistent'
);

select ok(
  exists (select 1 from pg_constraint
          where conrelid = 'public.gpi_occurrence_change_recipients'::regclass
            and pg_get_constraintdef(oid) like '%planning_intent%prior_next_gathering%'),
  'Recipient reason is narrowly constrained'
);

select is(
  (select count(*)::integer from pg_indexes
   where schemaname = 'public' and indexname in (
     'gpi_occurrence_change_events_occurrence_created_idx',
     'gpi_occurrence_change_events_opportunity_created_idx',
     'gpi_occurrence_change_events_opportunity_org_fk_idx',
     'gpi_occurrence_change_events_actor_fk_idx',
     'gpi_occurrence_change_recipients_relationship_created_idx',
     'gpi_occurrence_change_recipients_event_opportunity_fk_idx',
     'gpi_occurrence_change_recipients_relationship_opportunity_fk_idx'
   )),
  7,
  'Stage 4 query and foreign-key indexes exist'
);

select is(
  (select count(*)::integer from information_schema.columns
   where table_schema = 'public'
     and table_name = 'gpi_occurrence_change_events'
     and column_name in ('private_address_text','virtual_join_url','email','phone','participant_id','seeker_profile_id')),
  0,
  'Stage 4 event rows contain no protected logistics or recipient identity'
);

select is(
  (select count(*)::integer from information_schema.columns
   where table_schema = 'public'
     and table_name in ('gpi_occurrence_change_events','gpi_occurrence_change_recipients')
     and data_type in ('json','jsonb')),
  0,
  'Stage 4 uses typed safe facts instead of unrestricted JSON payloads'
);

select matches(
  pg_get_functiondef(to_regprocedure('public.gpi_capture_occurrence_change_notices()')),
  'gpi_is_public_eligible',
  'Trigger reuses the authoritative public eligibility function'
);

select matches(
  pg_get_functiondef(to_regprocedure('public.gpi_capture_occurrence_change_notices()')),
  'gpi_participation_occurrence_intents',
  'Trigger resolves private planning-intent recipients server-side'
);

select ok(
  position('kb_is_platform_admin' in lower(pg_get_functiondef(to_regprocedure('public.gpi_capture_occurrence_change_notices()')))) = 0
  and position('app_metadata' in lower(pg_get_functiondef(to_regprocedure('public.gpi_capture_occurrence_change_notices()')))) > 0,
  'Trigger classifies Platform Admin without a project-specific helper dependency'
);

select ok(
  position('pg_net' in lower(pg_get_functiondef(to_regprocedure('public.gpi_capture_occurrence_change_notices()')))) = 0
  and position('http' in lower(pg_get_functiondef(to_regprocedure('public.gpi_capture_occurrence_change_notices()')))) = 0
  and position('resend' in lower(pg_get_functiondef(to_regprocedure('public.gpi_capture_occurrence_change_notices()')))) = 0,
  'Trigger performs no network or email work while the occurrence row is locked'
);

select ok(
  position('actor_profile_id' in lower(pg_get_functiondef(to_regprocedure('public.gpi_service_get_my_occurrence_change_notices(uuid,uuid,integer)')))) = 0
  and position('recipient_reason' in lower(pg_get_functiondef(to_regprocedure('public.gpi_service_get_my_occurrence_change_notices(uuid,uuid,integer)')))) = 0,
  'Participant response does not expose actor identity or internal recipient reason'
);

select matches(
  pg_get_functiondef(to_regprocedure('public.gpi_service_get_my_occurrence_change_notices(uuid,uuid,integer)')),
  'r.seeker_profile_id = p_profile_id',
  'Stage 4 read RPC scopes every notice through the owning relationship profile'
);

select matches(
  lower(pg_get_functiondef(to_regprocedure('public.gpi_service_get_my_occurrence_change_notices(uuid,uuid,integer)'))),
  'least\(greatest\(coalesce\(p_limit, 20\), 1\), 50\)',
  'Stage 4 read limit is bounded by the server'
);

select matches(
  pg_get_functiondef(to_regprocedure('public.gpi_service_get_my_occurrence_change_notices(uuid,uuid,integer)')),
  '180 days',
  'Stage 4 in-product read window is limited to 180 days'
);

select * from finish();
rollback;
