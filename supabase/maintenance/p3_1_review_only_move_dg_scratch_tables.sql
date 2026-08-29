-- P3-1 REVIEW ONLY — DO NOT RUN WITHOUT EXPLICIT PRODUCTION APPROVAL.
-- Live verification at preparation time:
--   public._dg_scratch = 692 rows
--   public._dg_final   = 503 rows
-- Both tables have RLS, no anon/authenticated grants, and no foreign-key,
-- view, function, or trigger dependencies. This transaction preserves the
-- rows while removing scratch artifacts from the public application schema.

begin;

do $guard$
declare
  scratch_rows bigint;
  final_rows bigint;
  dependency_count bigint;
begin
  if to_regclass('public._dg_scratch') is null or to_regclass('public._dg_final') is null then
    raise exception 'P3-1 aborted: expected public scratch tables are missing';
  end if;

  execute 'select count(*) from public._dg_scratch' into scratch_rows;
  execute 'select count(*) from public._dg_final' into final_rows;
  if scratch_rows <> 692 or final_rows <> 503 then
    raise exception 'P3-1 aborted: row-count drift (_dg_scratch %, _dg_final %)', scratch_rows, final_rows;
  end if;

  select count(*) into dependency_count
  from pg_constraint con
  where con.contype = 'f'
    and (
      con.conrelid in ('public._dg_scratch'::regclass, 'public._dg_final'::regclass)
      or con.confrelid in ('public._dg_scratch'::regclass, 'public._dg_final'::regclass)
    );
  if dependency_count <> 0 then
    raise exception 'P3-1 aborted: scratch-table foreign-key dependencies now exist (%)', dependency_count;
  end if;

  select count(*) into dependency_count
  from pg_depend d
  join pg_rewrite r on r.oid = d.objid
  where d.refobjid in ('public._dg_scratch'::regclass, 'public._dg_final'::regclass);
  if dependency_count <> 0 then
    raise exception 'P3-1 aborted: dependent views now exist (%)', dependency_count;
  end if;

  select count(*) into dependency_count
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname not in ('pg_catalog', 'information_schema')
    and (p.prosrc ilike '%_dg_scratch%' or p.prosrc ilike '%_dg_final%');
  if dependency_count <> 0 then
    raise exception 'P3-1 aborted: database functions now reference scratch tables (%)', dependency_count;
  end if;
end
$guard$;

create schema if not exists scratch;
revoke all on schema scratch from public, anon, authenticated;

alter table public._dg_scratch set schema scratch;
alter table public._dg_final set schema scratch;

revoke all on table scratch._dg_scratch from public, anon, authenticated;
revoke all on table scratch._dg_final from public, anon, authenticated;

comment on schema scratch is 'Non-application staging and data-reconciliation artifacts; never exposed through browser roles.';
comment on table scratch._dg_scratch is 'Preserved P3-1 data-reconciliation scratch rows moved out of public.';
comment on table scratch._dg_final is 'Preserved P3-1 data-reconciliation final rows moved out of public.';

do $postcondition$
begin
  if to_regclass('public._dg_scratch') is not null or to_regclass('public._dg_final') is not null then
    raise exception 'P3-1 postcondition failed: scratch tables remain in public';
  end if;
  if to_regclass('scratch._dg_scratch') is null or to_regclass('scratch._dg_final') is null then
    raise exception 'P3-1 postcondition failed: preserved scratch tables are missing';
  end if;
  if (select count(*) from scratch._dg_scratch) <> 692
     or (select count(*) from scratch._dg_final) <> 503 then
    raise exception 'P3-1 postcondition failed: preserved scratch row counts changed';
  end if;
end
$postcondition$;

commit;
