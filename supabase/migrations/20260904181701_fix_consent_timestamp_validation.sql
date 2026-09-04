-- Consent can be recorded during a long-running transaction. Compare against
-- the wall clock, not the transaction-start timestamp, to avoid false future
-- date failures for evidence captured later in the same request.

create or replace function public.enforce_growth_vendor_qualification_consent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.consideration_consent_status = 'confirmed'
     and new.consideration_consented_at > clock_timestamp() then
    raise exception 'Vendor consideration consent cannot be dated in the future.';
  end if;

  if lower(coalesce(new.status, '')) = any (array['qualified','approved','ready','interested','converted'])
     and new.consideration_consent_status <> 'confirmed' then
    raise exception 'A Growth Engine vendor cannot be qualified until explicit agreement to be considered is confirmed.';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_growth_vendor_qualification_consent()
  from public, anon, authenticated;

create or replace function concierge_ops.enforce_vendor_consideration_consent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.consideration_consent_status <> 'confirmed'
     or new.consideration_consented_at is null
     or nullif(btrim(coalesce(new.consideration_consent_source, '')), '') is null
     or nullif(btrim(coalesce(new.consideration_consent_reference, '')), '') is null
     or new.consideration_consent_recorded_by is null then
    raise exception 'A full Concierge vendor record requires explicit, evidenced agreement to be considered.';
  end if;

  if new.consideration_consented_at > clock_timestamp() then
    raise exception 'Vendor consideration consent cannot be dated in the future.';
  end if;

  return new;
end;
$$;

revoke all on function concierge_ops.enforce_vendor_consideration_consent()
  from public, anon, authenticated;
