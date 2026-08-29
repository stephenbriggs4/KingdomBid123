-- P3-2 REVIEW ONLY — DO NOT RUN WITHOUT EXPLICIT PRODUCTION APPROVAL.
-- Live verification at preparation time:
--   public."Reviews" = 0 rows, six legacy columns, no dependencies/triggers,
--                      no anon/authenticated grants
--   public.reviews   = active secured implementation (23 columns)
-- This transaction drops only the empty, case-colliding legacy table.

begin;

do $guard$
declare
  legacy_rows bigint;
  legacy_columns bigint;
  dependency_count bigint;
begin
  if to_regclass('public."Reviews"') is null then
    raise exception 'P3-2 aborted: public."Reviews" is already absent';
  end if;
  if to_regclass('public.reviews') is null then
    raise exception 'P3-2 aborted: active public.reviews is missing';
  end if;

  execute 'select count(*) from public."Reviews"' into legacy_rows;
  if legacy_rows <> 0 then
    raise exception 'P3-2 aborted: legacy public."Reviews" is no longer empty (%)', legacy_rows;
  end if;

  select count(*) into legacy_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'Reviews'
    and (column_name, data_type) in (
      ('id', 'bigint'),
      ('vendor_id', 'text'),
      ('church_id', 'text'),
      ('project_id', 'text'),
      ('rating', 'text'),
      ('body', 'text')
    );
  if legacy_columns <> 6 then
    raise exception 'P3-2 aborted: legacy Reviews column contract drifted (%)', legacy_columns;
  end if;

  select count(*) into dependency_count
  from pg_constraint con
  where con.contype = 'f'
    and (con.conrelid = 'public."Reviews"'::regclass or con.confrelid = 'public."Reviews"'::regclass);
  if dependency_count <> 0 then
    raise exception 'P3-2 aborted: foreign-key dependencies now exist (%)', dependency_count;
  end if;

  select count(*) into dependency_count
  from pg_depend d
  join pg_rewrite r on r.oid = d.objid
  where d.refobjid = 'public."Reviews"'::regclass;
  if dependency_count <> 0 then
    raise exception 'P3-2 aborted: dependent views now exist (%)', dependency_count;
  end if;

  select count(*) into dependency_count
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and (p.prosrc ilike '%public."Reviews"%' or p.prosrc ilike '%from "Reviews"%' or p.prosrc ilike '%into "Reviews"%');
  if dependency_count <> 0 then
    raise exception 'P3-2 aborted: public functions now reference legacy Reviews (%)', dependency_count;
  end if;

  select count(*) into dependency_count
  from information_schema.triggers
  where event_object_schema = 'public' and event_object_table = 'Reviews';
  if dependency_count <> 0 then
    raise exception 'P3-2 aborted: legacy Reviews triggers now exist (%)', dependency_count;
  end if;
end
$guard$;

drop table public."Reviews";

do $postcondition$
begin
  if to_regclass('public."Reviews"') is not null then
    raise exception 'P3-2 postcondition failed: legacy public."Reviews" still exists';
  end if;
  if to_regclass('public.reviews') is null then
    raise exception 'P3-2 postcondition failed: active public.reviews was affected';
  end if;
end
$postcondition$;

commit;
