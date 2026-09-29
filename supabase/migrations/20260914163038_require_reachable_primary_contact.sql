create or replace function concierge_ops.enforce_organization_primary_contact_reachability()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.archived_at is null and new.primary_contact_id is not null and not exists (
    select 1
    from concierge_ops.people p
    where p.id = new.primary_contact_id
      and p.organization_id = new.id
      and p.archived_at is null
      and (
        nullif(btrim(coalesce(p.email, '')), '') is not null
        or nullif(btrim(coalesce(p.phone, '')), '') is not null
      )
  ) then
    raise exception 'An active organization primary contact requires an email address or phone number';
  end if;

  return new;
end;
$$;

drop trigger if exists organizations_enforce_primary_contact_reachability on concierge_ops.organizations;
create trigger organizations_enforce_primary_contact_reachability
before insert or update of primary_contact_id, archived_at
on concierge_ops.organizations
for each row execute function concierge_ops.enforce_organization_primary_contact_reachability();

create or replace function concierge_ops.enforce_primary_person_reachability()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from concierge_ops.organizations o
    where o.primary_contact_id = new.id
      and o.archived_at is null
  ) and (
    new.archived_at is not null
    or (
      nullif(btrim(coalesce(new.email, '')), '') is null
      and nullif(btrim(coalesce(new.phone, '')), '') is null
    )
  ) then
    raise exception 'An active organization primary contact requires an email address or phone number';
  end if;

  return new;
end;
$$;

drop trigger if exists people_enforce_primary_contact_reachability on concierge_ops.people;
create trigger people_enforce_primary_contact_reachability
before update of email, phone, archived_at
on concierge_ops.people
for each row execute function concierge_ops.enforce_primary_person_reachability();

comment on function concierge_ops.enforce_organization_primary_contact_reachability() is
  'Prevents active organizations from assigning an unreachable or archived primary contact.';
comment on function concierge_ops.enforce_primary_person_reachability() is
  'Prevents removal of the last reachable channel from an active organization primary contact.';
