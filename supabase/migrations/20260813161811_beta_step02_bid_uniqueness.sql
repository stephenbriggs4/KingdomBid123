set lock_timeout = '5s';
set statement_timeout = '30s';

do $migration$
begin
  if exists (
    select 1
    from public.bids
    group by project_id, vendor_id
    having count(*) > 1
  ) then
    raise exception 'Cannot add bid uniqueness constraint: duplicate project/vendor pairs exist';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.bids'::regclass
      and conname = 'bids_project_id_vendor_id_key'
      and contype = 'u'
  ) then
    alter table public.bids
      add constraint bids_project_id_vendor_id_key
      unique (project_id, vendor_id);
  end if;
end
$migration$;
