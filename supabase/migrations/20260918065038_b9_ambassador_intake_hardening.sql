
CREATE OR REPLACE FUNCTION public.kb_submit_ambassador_application(p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
declare
  v_name text;
  v_email text;
  v_school text;
  v_ministry text;
  v_why text;
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
    and a.reason like 'ambassador_%'
    and a.created_at > now() - interval '1 hour';

  if v_recent_attempts >= 8 then
    insert into public.waitlist_submission_attempts (ip_hash, accepted, reason) values (v_ip_hash, false, 'ambassador_rate_limited');
    raise exception 'too many attempts, please try again later'
      using errcode = '429';
  end if;

  v_honeypot := nullif(btrim(coalesce(p_payload ->> 'hp_field', '')), '');
  if v_honeypot is not null then
    insert into public.waitlist_submission_attempts (ip_hash, accepted, reason) values (v_ip_hash, false, 'ambassador_honeypot');
    return jsonb_build_object('accepted', true, 'status_code', 'submitted');
  end if;

  v_name := btrim(coalesce(p_payload ->> 'name', ''));
  v_email := lower(btrim(coalesce(p_payload ->> 'email', '')));
  v_school := btrim(coalesce(p_payload ->> 'school', ''));
  v_ministry := nullif(btrim(coalesce(p_payload ->> 'ministry', '')), '');
  v_why := btrim(coalesce(p_payload ->> 'why', ''));

  if char_length(v_name) < 2 or char_length(v_name) > 150 then
    raise exception 'name must be between 2 and 150 characters'
      using errcode = '22023';
  end if;

  if char_length(v_email) > 320
     or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'valid email is required'
      using errcode = '22023';
  end if;

  if v_school not in (
    'Bible college / seminary',
    'Christian university',
    'State university / campus ministry',
    'Community college',
    'Graduate / divinity school',
    'Other'
  ) then
    raise exception 'invalid school selection'
      using errcode = '22023';
  end if;

  if v_ministry is not null and char_length(v_ministry) > 300 then
    raise exception 'ministry involvement is too long'
      using errcode = '22023';
  end if;

  if char_length(v_why) < 3 or char_length(v_why) > 3000 then
    raise exception 'application response must be between 3 and 3000 characters'
      using errcode = '22023';
  end if;

  insert into public.ambassador_applications (
    name, email, school, ministry, why, status, created_at
  )
  values (
    v_name, v_email, v_school, v_ministry, v_why, 'pending', clock_timestamp()::timestamp
  )
  on conflict do nothing;

  get diagnostics v_inserted = row_count;

  insert into public.waitlist_submission_attempts (ip_hash, accepted, reason) values (v_ip_hash, true, 'ambassador_accepted');

  return jsonb_build_object(
    'accepted', true,
    'status_code',
      case when v_inserted = 1 then 'submitted' else 'already_pending' end
  );
end;
$function$
