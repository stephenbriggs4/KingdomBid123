begin;

do $cleanup$
declare
  final_count bigint;
  scratch_count bigint;
  archived_count integer;
begin
  if to_regclass('scratch._dg_final') is null
     or to_regclass('scratch._dg_scratch') is null then
    raise exception 'C1 cleanup requires both audited scratch tables to exist';
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'scratch'
      and c.relkind not in ('i')
      and c.relname not in ('_dg_final', '_dg_scratch')
  ) then
    raise exception 'C1 cleanup stopped because the scratch schema contains an unexpected object';
  end if;

  select count(*) into final_count from scratch._dg_final;
  select count(*) into scratch_count from scratch._dg_scratch;

  insert into concierge_ops.release_verification_fixture_archive
    (source_table, source_id, payload, archive_reason)
  values
    (
      'scratch._dg_final',
      'c1-production-scratch-snapshot-20260912',
      jsonb_build_object(
        'row_count', final_count,
        'rows', coalesce(
          (select jsonb_agg(to_jsonb(row_data) order by row_data.url_norm, row_data.name_norm) from scratch._dg_final row_data),
          '[]'::jsonb
        )
      ),
      'archive_before_removing_production_scratch_schema'
    ),
    (
      'scratch._dg_scratch',
      'c1-production-scratch-snapshot-20260912',
      jsonb_build_object(
        'row_count', scratch_count,
        'rows', coalesce(
          (select jsonb_agg(to_jsonb(row_data) order by row_data.url_norm, row_data.name_norm) from scratch._dg_scratch row_data),
          '[]'::jsonb
        )
      ),
      'archive_before_removing_production_scratch_schema'
    );

  get diagnostics archived_count = row_count;
  if archived_count <> 2 then
    raise exception 'C1 expected 2 archive rows, wrote %', archived_count;
  end if;

  if not exists (
    select 1
    from concierge_ops.release_verification_fixture_archive a
    where a.source_table = 'scratch._dg_final'
      and a.source_id = 'c1-production-scratch-snapshot-20260912'
      and (a.payload ->> 'row_count')::bigint = final_count
      and jsonb_array_length(a.payload -> 'rows') = final_count
  ) or not exists (
    select 1
    from concierge_ops.release_verification_fixture_archive a
    where a.source_table = 'scratch._dg_scratch'
      and a.source_id = 'c1-production-scratch-snapshot-20260912'
      and (a.payload ->> 'row_count')::bigint = scratch_count
      and jsonb_array_length(a.payload -> 'rows') = scratch_count
  ) then
    raise exception 'C1 archive verification failed; scratch tables were not removed';
  end if;

  drop table scratch._dg_final;
  drop table scratch._dg_scratch;
  drop schema scratch;

  if to_regnamespace('scratch') is not null then
    raise exception 'C1 cleanup failed to remove the scratch schema';
  end if;
end
$cleanup$;

comment on table concierge_ops.release_verification_fixture_archive is
  'Restricted recovery ledger for archived QA fixtures and one-time production cleanup snapshots; retained for reversible audit cleanup.';

commit;
