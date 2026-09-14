create or replace function concierge_ops.enforce_need_sourcing_timeline()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_sourcing_statuses constant text[] := array[
    'ready_to_source','sourcing','shortlist_ready','organization_reviewing','vendor_selected'
  ];
  v_entering_sourcing boolean := new.status = any(v_sourcing_statuses)
    and (tg_op = 'INSERT' or old.status <> all(v_sourcing_statuses));
begin
  if new.archived_at is null and new.status = any(v_sourcing_statuses) and (
    new.target_decision_on is null
    or new.target_start_on is null
    or new.target_start_on < new.target_decision_on
  ) then
    raise exception 'Sourcing requires a decision date and a start date on or after it';
  end if;

  if new.archived_at is null and v_entering_sourcing and new.target_decision_on < current_date then
    raise exception 'A need cannot enter sourcing with a decision date in the past';
  end if;

  return new;
end;
$$;

drop trigger if exists needs_enforce_sourcing_timeline on concierge_ops.needs;
create trigger needs_enforce_sourcing_timeline
before insert or update of status, target_decision_on, target_start_on, archived_at
on concierge_ops.needs
for each row execute function concierge_ops.enforce_need_sourcing_timeline();

comment on function concierge_ops.enforce_need_sourcing_timeline() is
  'Requires a coherent church decision/start timeline before sourcing begins without trapping records after their target dates pass.';
