alter table concierge_ops.organizations
  add column pilot_cohort_entered_at timestamptz,
  add column pilot_cohort_entry_source text,
  add column pilot_cohort_entry_reference text,
  add column pilot_cohort_recorded_by uuid references public.profiles(id) on delete set null;

alter table concierge_ops.organizations
  add constraint organizations_pilot_cohort_entry_source_check
    check (
      pilot_cohort_entry_source is null
      or pilot_cohort_entry_source in ('meeting_notes','email','text_message','phone_call','signed_document','other')
    ),
  add constraint organizations_active_pilot_cohort_evidence_check
    check (
      not pilot_cohort
      or archived_at is not null
      or (
        pilot_cohort_entered_at is not null
        and pilot_cohort_entry_source is not null
        and nullif(btrim(coalesce(pilot_cohort_entry_reference, '')), '') is not null
        and pilot_cohort_recorded_by is not null
      )
    );

create or replace function concierge_ops.enforce_pilot_cohort_entry_evidence()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.pilot_cohort and new.archived_at is null and (
    new.pilot_cohort_entered_at is null
    or new.pilot_cohort_entered_at > clock_timestamp()
    or nullif(btrim(coalesce(new.pilot_cohort_entry_source, '')), '') is null
    or nullif(btrim(coalesce(new.pilot_cohort_entry_reference, '')), '') is null
    or new.pilot_cohort_recorded_by is null
  ) then
    raise exception 'Active Dallas Pilot membership requires explicit entry evidence';
  end if;

  return new;
end;
$$;

drop trigger if exists organizations_enforce_pilot_cohort_entry_evidence on concierge_ops.organizations;
create trigger organizations_enforce_pilot_cohort_entry_evidence
before insert or update of
  pilot_cohort,
  pilot_cohort_entered_at,
  pilot_cohort_entry_source,
  pilot_cohort_entry_reference,
  pilot_cohort_recorded_by,
  archived_at
on concierge_ops.organizations
for each row execute function concierge_ops.enforce_pilot_cohort_entry_evidence();

comment on column concierge_ops.organizations.pilot_cohort_entered_at is
  'When the organization explicitly agreed to enter the Dallas Pilot; not inferred from research, outreach, or intake.';
comment on column concierge_ops.organizations.pilot_cohort_entry_reference is
  'Auditable reference to the meeting note, message, email, or signed document recording explicit pilot entry.';
