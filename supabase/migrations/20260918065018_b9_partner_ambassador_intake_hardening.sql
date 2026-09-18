
-- B9: apply the same rate-limit + honeypot pattern to the other two public
-- anon-executable intake RPCs the audit named alongside waitlist. Reuses the
-- waitlist_submission_attempts ip_hash log (same helper, same table) with a
-- distinguishing reason tag rather than adding a near-duplicate table.
CREATE OR REPLACE FUNCTION public.kb_submit_partner_application(p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
declare
  v_name text;
  v_email text;
  v_org text;
  v_city text;
  v_size text;
  v_message text;
  v_partner_type text;
  v_inserted integer := 0;
  v_ip_hash text;
  v_recent_attempts integer;
  v_honeypot text;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'application payload must be a JSON object'
      using errcode = '22023';
  end if;

  v_ip_hash := public.kb_request_ip_fingerprint();

  select count(*) into v_recent_attempts
  from public.waitlist_submission_attempts a
  where a.ip_hash = v_ip_hash
    and a.reason like 'partner_%'
    and a.created_at > now() - interval '1 hour';

  if v_recent_attempts >= 8 then
    insert into public.waitlist_submission_attempts (ip_hash, accepted, reason) values (v_ip_hash, false, 'partner_rate_limited');
    raise exception 'too many attempts, please try again later'
      using errcode = '429';
  end if;

  v_honeypot := nullif(btrim(coalesce(p_payload ->> 'hp_field', '')), '');
  if v_honeypot is not null then
    insert into public.waitlist_submission_attempts (ip_hash, accepted, reason) values (v_ip_hash, false, 'partner_honeypot');
    return jsonb_build_object('accepted', true, 'status_code', 'submitted');
  end if;

  v_name := btrim(coalesce(p_payload ->> 'name', ''));
  v_email := lower(btrim(coalesce(p_payload ->> 'email', '')));
  v_org := btrim(coalesce(p_payload ->> 'org', ''));
  v_city := nullif(btrim(coalesce(p_payload ->> 'city', '')), '');
  v_size := nullif(btrim(coalesce(p_payload ->> 'size', '')), '');
  v_message := nullif(btrim(coalesce(p_payload ->> 'message', '')), '');
  v_partner_type := lower(btrim(coalesce(p_payload ->> 'partner_type', '')));

  if char_length(v_name) < 2 or char_length(v_name) > 150 then
    raise exception 'name must be between 2 and 150 characters'
      using errcode = '22023';
  end if;

  if char_length(v_email) > 320
     or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'valid email is required'
      using errcode = '22023';
  end if;

  if char_length(v_org) < 2 or char_length(v_org) > 250 then
    raise exception 'organization must be between 2 and 250 characters'
      using errcode = '22023';
  end if;

  if v_partner_type not in ('church', 'org') then
    raise exception 'invalid partnership type'
      using errcode = '22023';
  end if;

  if v_city is not null and char_length(v_city) > 150 then
    raise exception 'city is too long'
      using errcode = '22023';
  end if;

  if v_size is not null and char_length(v_size) > 100 then
    raise exception 'organization size is too long'
      using errcode = '22023';
  end if;

  if v_message is not null and char_length(v_message) > 3000 then
    raise exception 'message is too long'
      using errcode = '22023';
  end if;

  insert into public.partner_applications (
    name, email, org, city, size, message, partner_type, status, created_at
  )
  values (
    v_name, v_email, v_org, v_city, v_size, v_message, v_partner_type, 'pending', clock_timestamp()::timestamp
  )
  on conflict do nothing;

  get diagnostics v_inserted = row_count;

  insert into public.waitlist_submission_attempts (ip_hash, accepted, reason) values (v_ip_hash, true, 'partner_accepted');

  return jsonb_build_object(
    'accepted', true,
    'status_code',
      case when v_inserted = 1 then 'submitted' else 'already_pending' end
  );
end;
$function$
