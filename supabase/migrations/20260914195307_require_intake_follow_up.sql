create or replace function concierge_ops.enforce_intake_follow_up()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.archived_at is null and new.status in ('intake','clarifying') and (
    nullif(btrim(coalesce(new.next_action, '')), '') is null
    or new.next_action_on is null
  ) then
    raise exception 'Intake and clarifying needs require a next action and date';
  end if;

  if new.archived_at is null
     and new.status in ('intake','clarifying')
     and new.next_action_on < current_date
     and (tg_op = 'INSERT' or new.next_action_on is distinct from old.next_action_on) then
    raise exception 'A newly assigned next action date cannot be in the past';
  end if;

  return new;
end;
$$;

drop trigger if exists needs_enforce_intake_follow_up on concierge_ops.needs;
create trigger needs_enforce_intake_follow_up
before insert or update of status, next_action, next_action_on, archived_at
on concierge_ops.needs
for each row execute function concierge_ops.enforce_intake_follow_up();

comment on function concierge_ops.enforce_intake_follow_up() is
  'Requires a concrete dated follow-up for active intake and clarifying needs while allowing an overdue record to remain editable.';
