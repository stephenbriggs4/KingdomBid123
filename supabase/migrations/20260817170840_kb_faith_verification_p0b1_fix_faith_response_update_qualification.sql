create or replace function public.kb_submit_vendor_faith_reference_response(
  p_token text,
  p_christian_identity_confirmed boolean,
  p_would_recommend boolean,
  p_relationship_context text,
  p_faith_alignment text,
  p_concerns text default null,
  p_honeypot text default null
)
returns table(
  id uuid,
  reference_id uuid,
  already_submitted boolean
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_ref record;
  v_token text := trim(coalesce(p_token, ''));
  v_relationship_context text := btrim(coalesce(p_relationship_context, ''));
  v_faith_alignment text := btrim(coalesce(p_faith_alignment, ''));
  v_concerns text := nullif(btrim(coalesce(p_concerns, '')), '');
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
  from public.vendor_reference_submission_attempts a
  where a.token_hash = v_token_hash
    and a.created_at >= now() - interval '10 minutes';

  select count(*)::integer into v_recent_ip_attempts
  from public.vendor_reference_submission_attempts a
  where a.ip_hash = v_ip_hash
    and a.created_at >= now() - interval '10 minutes';

  if v_recent_token_attempts >= 5 then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'rate_limited_token');
    raise exception 'too many reference submissions for this link; try again later' using errcode = 'P0001';
  end if;

  if v_recent_ip_attempts >= 30 then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'rate_limited_ip');
    raise exception 'too many reference submissions; try again later' using errcode = 'P0001';
  end if;

  if nullif(trim(coalesce(p_honeypot, '')), '') is not null then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'honeypot');
    raise exception 'automated reference submission rejected' using errcode = '42501';
  end if;

  if p_christian_identity_confirmed is null then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'missing_christian_identity_confirmation');
    raise exception 'Christian identity confirmation must be answered' using errcode = '23514';
  end if;

  if p_would_recommend is null then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'missing_recommendation');
    raise exception 'recommendation must be answered' using errcode = '23514';
  end if;

  if char_length(v_relationship_context) < 20
     or char_length(v_relationship_context) > 2000 then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'invalid_relationship_context');
    raise exception 'relationship context must be between 20 and 2000 characters' using errcode = '22023';
  end if;

  if char_length(v_faith_alignment) < 10
     or char_length(v_faith_alignment) > 3000 then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'invalid_faith_alignment');
    raise exception 'faith and character response must be between 10 and 3000 characters' using errcode = '22023';
  end if;

  if v_concerns is not null and char_length(v_concerns) > 3000 then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'invalid_concerns');
    raise exception 'concerns response is too long' using errcode = '22023';
  end if;

  select vr.id,vr.vendor_id,vr.status,vr.purpose into v_ref
  from public.vendor_references vr
  where vr.token = v_token and vr.status <> 'cancelled'
  limit 1;

  if v_ref.id is null then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'invalid_token');
    raise exception 'reference link not found' using errcode = 'P0002';
  end if;

  if v_ref.purpose <> 'faith_community' then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'wrong_purpose_faith');
    raise exception 'this link is not a faith-community reference' using errcode = '22023';
  end if;

  if exists(
    select 1 from public.vendor_reference_responses vrr where vrr.reference_id = v_ref.id
  ) then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'duplicate');
    raise exception 'reference response already exists for this link' using errcode = '23505';
  end if;

  insert into public.vendor_reference_responses(
    reference_id,
    vendor_id,
    would_recommend,
    overall_rating,
    strengths,
    concerns,
    faith_alignment,
    christian_identity_confirmed,
    relationship_context
  ) values (
    v_ref.id,
    v_ref.vendor_id,
    p_would_recommend,
    null,
    null,
    v_concerns,
    v_faith_alignment,
    p_christian_identity_confirmed,
    v_relationship_context
  )
  returning vendor_reference_responses.id into v_response_id;

  update public.vendor_references vr
     set status = 'completed',
         completed_at = coalesce(vr.completed_at, now())
   where vr.id = v_ref.id;

  insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
  values(v_token_hash,v_ip_hash,true,'accepted');

  return query select v_response_id,v_ref.id,false;

exception when unique_violation then
  insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
  values(
    coalesce(v_token_hash,encode(extensions.digest(coalesce(v_token,''),'sha256'),'hex')),
    coalesce(v_ip_hash,'unknown'),false,'unique_violation'
  )
  on conflict do nothing;
  raise exception 'reference response already exists for this link' using errcode = '23505';
end;
$$;
