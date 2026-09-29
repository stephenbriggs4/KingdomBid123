create or replace function public.kb_request_ip_fingerprint()
returns text
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  v_headers jsonb := '{}'::jsonb;
  v_ip text := 'unknown';
begin
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    v_headers := '{}'::jsonb;
  end;
  v_ip := coalesce(
    nullif(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1), ''),
    nullif(v_headers->>'cf-connecting-ip', ''),
    nullif(v_headers->>'x-real-ip', ''),
    'unknown'
  );
  return encode(extensions.digest(v_ip, 'sha256'), 'hex');
end;
$$;

create or replace function public.kb_submit_vendor_reference_response(
  p_token text,
  p_would_recommend boolean,
  p_overall_rating integer,
  p_strengths text default null,
  p_concerns text default null,
  p_faith_alignment text default null,
  p_honeypot text default null
)
returns table(id uuid, reference_id uuid, vendor_id uuid, already_submitted boolean)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_ref record;
  v_token text := trim(coalesce(p_token, ''));
  v_token_hash text;
  v_ip_hash text;
  v_recent_token_attempts integer := 0;
  v_recent_ip_attempts integer := 0;
  v_response_id uuid;
begin
  if nullif(v_token, '') is null then
    raise exception 'reference token is required' using errcode = 'P0002';
  end if;
  v_token_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');
  v_ip_hash := public.kb_request_ip_fingerprint();

  select count(*)::integer into v_recent_token_attempts
  from public.vendor_reference_submission_attempts
  where token_hash = v_token_hash and created_at >= now() - interval '10 minutes';

  select count(*)::integer into v_recent_ip_attempts
  from public.vendor_reference_submission_attempts
  where ip_hash = v_ip_hash and created_at >= now() - interval '10 minutes';

  if v_recent_token_attempts >= 5 then
    insert into public.vendor_reference_submission_attempts(token_hash, ip_hash, accepted, reason)
    values (v_token_hash, v_ip_hash, false, 'rate_limited_token');
    raise exception 'too many reference submissions for this link; try again later' using errcode = 'P0001';
  end if;
  if v_recent_ip_attempts >= 30 then
    insert into public.vendor_reference_submission_attempts(token_hash, ip_hash, accepted, reason)
    values (v_token_hash, v_ip_hash, false, 'rate_limited_ip');
    raise exception 'too many reference submissions; try again later' using errcode = 'P0001';
  end if;
  if nullif(trim(coalesce(p_honeypot, '')), '') is not null then
    insert into public.vendor_reference_submission_attempts(token_hash, ip_hash, accepted, reason)
    values (v_token_hash, v_ip_hash, false, 'honeypot');
    raise exception 'automated reference submission rejected' using errcode = '42501';
  end if;
  if p_would_recommend is null then
    insert into public.vendor_reference_submission_attempts(token_hash, ip_hash, accepted, reason)
    values (v_token_hash, v_ip_hash, false, 'missing_recommendation');
    raise exception 'would_recommend is required' using errcode = '23514';
  end if;
  if p_overall_rating is null or p_overall_rating < 1 or p_overall_rating > 5 then
    insert into public.vendor_reference_submission_attempts(token_hash, ip_hash, accepted, reason)
    values (v_token_hash, v_ip_hash, false, 'invalid_rating');
    raise exception 'overall_rating must be between 1 and 5' using errcode = '23514';
  end if;

  select vr.id, vr.vendor_id, vr.status into v_ref
  from public.vendor_references vr
  where vr.token = v_token and coalesce(vr.status, 'pending') not in ('removed','cancelled','deleted')
  limit 1;

  if v_ref.id is null then
    insert into public.vendor_reference_submission_attempts(token_hash, ip_hash, accepted, reason)
    values (v_token_hash, v_ip_hash, false, 'invalid_token');
    raise exception 'reference link not found' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.vendor_reference_responses where reference_id = v_ref.id) then
    insert into public.vendor_reference_submission_attempts(token_hash, ip_hash, accepted, reason)
    values (v_token_hash, v_ip_hash, false, 'duplicate');
    raise exception 'reference response already exists for this link' using errcode = '23505';
  end if;

  insert into public.vendor_reference_responses(
    reference_id,vendor_id,would_recommend,overall_rating,strengths,concerns,faith_alignment
  ) values (
    v_ref.id,v_ref.vendor_id,p_would_recommend,p_overall_rating,
    nullif(trim(coalesce(p_strengths, '')), ''),
    nullif(trim(coalesce(p_concerns, '')), ''),
    nullif(trim(coalesce(p_faith_alignment, '')), '')
  ) returning vendor_reference_responses.id into v_response_id;

  update public.vendor_references
  set status='completed', completed_at=coalesce(completed_at,now())
  where vendor_references.id=v_ref.id;

  insert into public.vendor_reference_submission_attempts(token_hash, ip_hash, accepted, reason)
  values (v_token_hash, v_ip_hash, true, 'accepted');

  return query select v_response_id, v_ref.id, v_ref.vendor_id, false;
exception when unique_violation then
  insert into public.vendor_reference_submission_attempts(token_hash, ip_hash, accepted, reason)
  values (
    coalesce(v_token_hash, encode(extensions.digest(coalesce(v_token, ''), 'sha256'), 'hex')),
    coalesce(v_ip_hash, 'unknown'), false, 'unique_violation'
  ) on conflict do nothing;
  raise exception 'reference response already exists for this link' using errcode='23505';
end;
$$;
