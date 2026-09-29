-- FaithBid P0-B2A — token secrecy + durable reference submission abuse control

-- 1. Hide faith-community reference rows from applicants.
drop policy if exists "kb_vendor_references_owner_select" on public.vendor_references;
drop policy if exists "kb_vendor_references_owner_select_past_client" on public.vendor_references;

create policy kb_vendor_references_owner_select_past_client
on public.vendor_references
for select
to authenticated
using (
  vendor_id = auth.uid()
  and purpose = 'past_client'
);

comment on policy kb_vendor_references_owner_select_past_client
on public.vendor_references is
  'Vendors may directly read only their past-client reference rows. Faith-community references are hidden because their token is independent-evidence bearer material; vendors receive safe status through kb_get_my_faith_verification_status().';

-- 2. Safe tracker: latest application only, one row per faith-community reference linked to that application.
create or replace function public.kb_get_my_faith_verification_status()
returns table(
  verification_id uuid,
  application_status text,
  reference_id uuid,
  reference_name text,
  reference_status text,
  reference_sent_at timestamptz,
  reference_completed_at timestamptz,
  community_name text,
  relationship_snapshot text,
  application_created_at timestamp without time zone
)
language plpgsql
stable
security definer
set search_path to 'public', 'auth', 'extensions'
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Sign in to view Faith Verification status.' using errcode = '42501';
  end if;

  return query
  with latest_verification as (
    select vv.*
    from public.vendor_verifications vv
    where vv.user_id = v_user_id
    order by vv.created_at desc nulls last, vv.id desc
    limit 1
  )
  select
    vv.id,
    vv.status,
    vr.id,
    vr.client_name,
    vr.status,
    vr.sent_at,
    vr.completed_at,
    vv.ref_church_name,
    vv.ref_relationship,
    vv.created_at
  from latest_verification vv
  left join public.vendor_references vr
    on vr.verification_id = vv.id
   and vr.purpose = 'faith_community'
  order by vr.created_at asc nulls last, vr.id asc;
end;
$$;

revoke all on function public.kb_get_my_faith_verification_status() from public, anon;
grant execute on function public.kb_get_my_faith_verification_status() to authenticated, service_role;

comment on function public.kb_get_my_faith_verification_status() is
  'SECURITY DEFINER safe applicant tracker. Ownership is enforced internally with vendor_verifications.user_id = auth.uid(). Returns only the latest Faith Verification application, with one row per linked faith-community reference. Never returns bearer tokens, reference email addresses, or raw responses.';

-- 3. Tokenless atomic Faith Verification application RPC v2.
create or replace function public.kb_submit_faith_verification_application_v2(
  p_faith_statement text,
  p_ref_church_name text,
  p_ref_name text,
  p_ref_email text,
  p_ref_phone text default null,
  p_ref_relationship text default null,
  p_covenant_signed boolean default false
)
returns table(
  verification_id uuid,
  reference_id uuid,
  application_status text,
  reference_status text
)
language plpgsql
security definer
set search_path to 'public', 'auth', 'extensions'
as $$
declare
  v_user_id uuid := auth.uid();
  v_vendor public.vendors%rowtype;
  v_faith_statement text := btrim(coalesce(p_faith_statement, ''));
  v_church_name text := btrim(coalesce(p_ref_church_name, ''));
  v_ref_name text := btrim(coalesce(p_ref_name, ''));
  v_ref_email text := lower(btrim(coalesce(p_ref_email, '')));
  v_ref_phone text := nullif(btrim(coalesce(p_ref_phone, '')), '');
  v_ref_relationship text := nullif(btrim(coalesce(p_ref_relationship, '')), '');
  v_verification_id uuid;
  v_reference_id uuid;
  v_token text;
begin
  if v_user_id is null then
    raise exception 'Sign in to submit Faith Verification.' using errcode = '42501';
  end if;

  select v.* into v_vendor
  from public.vendors v
  where v.user_id = v_user_id
  for update;

  if not found then
    raise exception 'A vendor profile is required before Faith Verification.' using errcode = '42501';
  end if;

  if coalesce(v_vendor.verified, false) then
    raise exception 'Faith Verification already exists for this vendor. Contact FaithBid if this status appears incorrect.' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.vendor_verifications vv
    where vv.vendor_id = v_vendor.id
      and vv.status in ('pending', 'needs_info')
  ) then
    raise exception 'An active Faith Verification application already exists.' using errcode = '23505';
  end if;

  if char_length(v_faith_statement) < 80 or char_length(v_faith_statement) > 5000 then
    raise exception 'Faith statement must be between 80 and 5000 characters.' using errcode = '22023';
  end if;

  if v_church_name = '' or char_length(v_church_name) > 200 then
    raise exception 'Christian community or church name is required.' using errcode = '22023';
  end if;

  if v_ref_name = '' or char_length(v_ref_name) > 160 then
    raise exception 'Reference name is required.' using errcode = '22023';
  end if;

  if char_length(v_ref_email) > 320
     or v_ref_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'A valid reference email address is required.' using errcode = '22023';
  end if;

  if v_ref_phone is not null and char_length(v_ref_phone) > 64 then
    raise exception 'Reference phone number is too long.' using errcode = '22023';
  end if;

  if v_ref_relationship is not null and char_length(v_ref_relationship) > 500 then
    raise exception 'Reference relationship description is too long.' using errcode = '22023';
  end if;

  if coalesce(p_covenant_signed, false) is not true then
    raise exception 'Vendor Covenant acceptance is required.' using errcode = '23514';
  end if;

  insert into public.vendor_verifications (
    vendor_id, user_id, tier_goal, faith_statement,
    ref_church_name, ref_pastor_name, ref_pastor_email,
    ref_pastor_phone, ref_relationship,
    covenant_signed, covenant_signed_at, status
  ) values (
    v_vendor.id, v_user_id, 'faith_verified', v_faith_statement,
    v_church_name, v_ref_name, v_ref_email,
    v_ref_phone, v_ref_relationship,
    true, now(), 'pending'
  ) returning id into v_verification_id;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.vendor_references (
    vendor_id, client_name, client_email, project_context,
    token, status, purpose, verification_id
  ) values (
    v_user_id, v_ref_name, v_ref_email, v_ref_relationship,
    v_token, 'pending', 'faith_community', v_verification_id
  ) returning id into v_reference_id;

  return query
  select v_verification_id, v_reference_id, 'pending'::text, 'pending'::text;
end;
$$;

revoke all on function public.kb_submit_faith_verification_application_v2(text,text,text,text,text,text,boolean) from public, anon;
grant execute on function public.kb_submit_faith_verification_application_v2(text,text,text,text,text,text,boolean) to authenticated, service_role;

comment on function public.kb_submit_faith_verification_application_v2(text,text,text,text,text,text,boolean) is
  'Tokenless client-facing Faith Verification application RPC. Creates verification and linked faith-community reference atomically but never returns the reference bearer token.';

-- 4. Close old token-returning Faith application RPC to clients immediately.
revoke execute on function public.kb_submit_faith_verification_application(text,text,text,text,text,text,boolean) from public, anon, authenticated;
grant execute on function public.kb_submit_faith_verification_application(text,text,text,text,text,text,boolean) to service_role;

comment on function public.kb_submit_faith_verification_application(text,text,text,text,text,text,boolean) is
  'LEGACY token-returning Faith application RPC. Client execution revoked in P0-B2A because applicants must never possess faith-community reference bearer tokens.';

-- 5. Durable shared submission-attempt gate.
create or replace function public.kb_begin_reference_submission_attempt_v2(p_token text)
returns table(
  attempt_id uuid,
  allowed boolean,
  gate_reason text,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path to 'public', 'auth', 'extensions'
as $$
declare
  v_token text := trim(coalesce(p_token, ''));
  v_token_hash text := encode(extensions.digest(trim(coalesce(p_token, '')), 'sha256'), 'hex');
  v_ip_hash text := public.kb_request_ip_fingerprint();
  v_token_count integer := 0;
  v_ip_count integer := 0;
  v_token_oldest timestamptz;
  v_ip_oldest timestamptz;
  v_attempt_id uuid;
  v_retry integer;
begin
  -- For non-empty tokens, always take token then IP. Empty-token noise skips the
  -- token lock/count entirely, but is still IP-serialized and durably recorded.
  if v_token <> '' then
    perform pg_advisory_xact_lock(hashtextextended('faithbid-reference-token:' || v_token_hash, 0));
  end if;

  perform pg_advisory_xact_lock(hashtextextended('faithbid-reference-ip:' || v_ip_hash, 0));

  if v_token <> '' then
    select count(*)::integer, min(a.created_at)
      into v_token_count, v_token_oldest
    from public.vendor_reference_submission_attempts a
    where a.token_hash = v_token_hash
      and a.created_at >= now() - interval '10 minutes'
      and coalesce(a.reason, '') not in ('rate_limited_token', 'rate_limited_ip');

    if v_token_count >= 5 then
      v_retry := greatest(
        1,
        coalesce(
          ceil(extract(epoch from ((v_token_oldest + interval '10 minutes') - clock_timestamp())))::integer,
          600
        )
      );

      insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
      values(v_token_hash,v_ip_hash,false,'rate_limited_token')
      returning id into v_attempt_id;

      return query select v_attempt_id,false,'rate_limited_token'::text,v_retry;
      return;
    end if;
  end if;

  select count(*)::integer, min(a.created_at)
    into v_ip_count, v_ip_oldest
  from public.vendor_reference_submission_attempts a
  where a.ip_hash = v_ip_hash
    and a.created_at >= now() - interval '10 minutes'
    and coalesce(a.reason, '') not in ('rate_limited_token', 'rate_limited_ip');

  if v_ip_count >= 30 then
    v_retry := greatest(
      1,
      coalesce(
        ceil(extract(epoch from ((v_ip_oldest + interval '10 minutes') - clock_timestamp())))::integer,
        600
      )
    );

    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'rate_limited_ip')
    returning id into v_attempt_id;

    return query select v_attempt_id,false,'rate_limited_ip'::text,v_retry;
    return;
  end if;

  insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
  values(v_token_hash,v_ip_hash,false,'started')
  returning id into v_attempt_id;

  return query select v_attempt_id,true,null::text,null::integer;
end;
$$;

revoke all on function public.kb_begin_reference_submission_attempt_v2(text) from public, anon, authenticated, service_role;

comment on function public.kb_begin_reference_submission_attempt_v2(text) is
  'Internal durable reference-submission gate. Non-empty tokens are serialized before IP; empty-token noise skips the token bucket but remains IP-limited. Enforces 5/token/10min and 30/IP/10min and creates attempt rows that survive structured rejection paths.';

-- 6. Past-client response RPC v2. Old v1 remains for installed 0159 until B2-D.
create or replace function public.kb_submit_vendor_reference_response_v2(
  p_token text,
  p_would_recommend boolean,
  p_overall_rating integer,
  p_strengths text default null,
  p_concerns text default null,
  p_faith_alignment text default null,
  p_honeypot text default null
)
returns table(
  ok boolean,
  reason text,
  response_id uuid,
  reference_id uuid,
  already_submitted boolean,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path to 'public', 'auth', 'extensions'
as $$
declare
  v_gate record;
  v_ref record;
  v_token text := trim(coalesce(p_token, ''));
  v_response_id uuid;
begin
  select * into v_gate from public.kb_begin_reference_submission_attempt_v2(v_token);

  if not coalesce(v_gate.allowed, false) then
    return query select false,v_gate.gate_reason,null::uuid,null::uuid,false,v_gate.retry_after_seconds;
    return;
  end if;

  if v_token = '' then
    update public.vendor_reference_submission_attempts a set reason='missing_token' where a.id=v_gate.attempt_id;
    return query select false,'missing_token'::text,null::uuid,null::uuid,false,null::integer;
    return;
  end if;

  if nullif(trim(coalesce(p_honeypot, '')), '') is not null then
    update public.vendor_reference_submission_attempts a set reason='honeypot' where a.id=v_gate.attempt_id;
    return query select false,'honeypot'::text,null::uuid,null::uuid,false,null::integer;
    return;
  end if;

  if p_would_recommend is null then
    update public.vendor_reference_submission_attempts a set reason='missing_recommendation' where a.id=v_gate.attempt_id;
    return query select false,'missing_recommendation'::text,null::uuid,null::uuid,false,null::integer;
    return;
  end if;

  if p_overall_rating is null or p_overall_rating < 1 or p_overall_rating > 5 then
    update public.vendor_reference_submission_attempts a set reason='invalid_rating' where a.id=v_gate.attempt_id;
    return query select false,'invalid_rating'::text,null::uuid,null::uuid,false,null::integer;
    return;
  end if;

  select vr.id,vr.vendor_id,vr.status,vr.purpose into v_ref
  from public.vendor_references vr
  where vr.token=v_token and vr.status <> 'cancelled'
  limit 1;

  if v_ref.id is null then
    update public.vendor_reference_submission_attempts a set reason='invalid_token' where a.id=v_gate.attempt_id;
    return query select false,'invalid_token'::text,null::uuid,null::uuid,false,null::integer;
    return;
  end if;

  if v_ref.purpose <> 'past_client' then
    update public.vendor_reference_submission_attempts a set reason='wrong_purpose_past_client' where a.id=v_gate.attempt_id;
    return query select false,'wrong_purpose_past_client'::text,null::uuid,v_ref.id,false,null::integer;
    return;
  end if;

  if exists(select 1 from public.vendor_reference_responses vrr where vrr.reference_id=v_ref.id) then
    update public.vendor_reference_submission_attempts a set reason='duplicate' where a.id=v_gate.attempt_id;
    return query select false,'already_submitted'::text,null::uuid,v_ref.id,true,null::integer;
    return;
  end if;

  begin
    insert into public.vendor_reference_responses(
      reference_id,vendor_id,would_recommend,overall_rating,strengths,concerns,faith_alignment
    ) values (
      v_ref.id,v_ref.vendor_id,p_would_recommend,p_overall_rating,
      nullif(trim(coalesce(p_strengths,'')),''),
      nullif(trim(coalesce(p_concerns,'')),''),
      nullif(trim(coalesce(p_faith_alignment,'')),'')
    ) returning vendor_reference_responses.id into v_response_id;
  exception when unique_violation then
    update public.vendor_reference_submission_attempts a set reason='duplicate' where a.id=v_gate.attempt_id;
    return query select false,'already_submitted'::text,null::uuid,v_ref.id,true,null::integer;
    return;
  end;

  update public.vendor_references vr
     set status='completed',completed_at=coalesce(vr.completed_at,now())
   where vr.id=v_ref.id;

  update public.vendor_reference_submission_attempts a
     set accepted=true,reason='accepted'
   where a.id=v_gate.attempt_id;

  return query select true,null::text,v_response_id,v_ref.id,false,null::integer;
end;
$$;

revoke all on function public.kb_submit_vendor_reference_response_v2(text,boolean,integer,text,text,text,text) from public;
grant execute on function public.kb_submit_vendor_reference_response_v2(text,boolean,integer,text,text,text,text) to anon, authenticated, service_role;

-- 7. Faith-community response RPC v2.
create or replace function public.kb_submit_vendor_faith_reference_response_v2(
  p_token text,
  p_christian_identity_confirmed boolean,
  p_would_recommend boolean,
  p_relationship_context text,
  p_faith_alignment text,
  p_concerns text default null,
  p_honeypot text default null
)
returns table(
  ok boolean,
  reason text,
  response_id uuid,
  reference_id uuid,
  already_submitted boolean,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path to 'public', 'auth', 'extensions'
as $$
declare
  v_gate record;
  v_ref record;
  v_token text := trim(coalesce(p_token, ''));
  v_relationship_context text := btrim(coalesce(p_relationship_context, ''));
  v_faith_alignment text := btrim(coalesce(p_faith_alignment, ''));
  v_concerns text := nullif(btrim(coalesce(p_concerns, '')), '');
  v_response_id uuid;
begin
  select * into v_gate from public.kb_begin_reference_submission_attempt_v2(v_token);

  if not coalesce(v_gate.allowed, false) then
    return query select false,v_gate.gate_reason,null::uuid,null::uuid,false,v_gate.retry_after_seconds;
    return;
  end if;

  if v_token = '' then
    update public.vendor_reference_submission_attempts a set reason='missing_token' where a.id=v_gate.attempt_id;
    return query select false,'missing_token'::text,null::uuid,null::uuid,false,null::integer;
    return;
  end if;

  if nullif(trim(coalesce(p_honeypot, '')), '') is not null then
    update public.vendor_reference_submission_attempts a set reason='honeypot' where a.id=v_gate.attempt_id;
    return query select false,'honeypot'::text,null::uuid,null::uuid,false,null::integer;
    return;
  end if;

  if p_christian_identity_confirmed is null then
    update public.vendor_reference_submission_attempts a set reason='missing_christian_identity_confirmation' where a.id=v_gate.attempt_id;
    return query select false,'missing_christian_identity_confirmation'::text,null::uuid,null::uuid,false,null::integer;
    return;
  end if;

  if p_would_recommend is null then
    update public.vendor_reference_submission_attempts a set reason='missing_recommendation' where a.id=v_gate.attempt_id;
    return query select false,'missing_recommendation'::text,null::uuid,null::uuid,false,null::integer;
    return;
  end if;

  if char_length(v_relationship_context) < 20 or char_length(v_relationship_context) > 2000 then
    update public.vendor_reference_submission_attempts a set reason='invalid_relationship_context' where a.id=v_gate.attempt_id;
    return query select false,'invalid_relationship_context'::text,null::uuid,null::uuid,false,null::integer;
    return;
  end if;

  if char_length(v_faith_alignment) < 10 or char_length(v_faith_alignment) > 3000 then
    update public.vendor_reference_submission_attempts a set reason='invalid_faith_alignment' where a.id=v_gate.attempt_id;
    return query select false,'invalid_faith_alignment'::text,null::uuid,null::uuid,false,null::integer;
    return;
  end if;

  if v_concerns is not null and char_length(v_concerns) > 3000 then
    update public.vendor_reference_submission_attempts a set reason='invalid_concerns' where a.id=v_gate.attempt_id;
    return query select false,'invalid_concerns'::text,null::uuid,null::uuid,false,null::integer;
    return;
  end if;

  select vr.id,vr.vendor_id,vr.status,vr.purpose into v_ref
  from public.vendor_references vr
  where vr.token=v_token and vr.status <> 'cancelled'
  limit 1;

  if v_ref.id is null then
    update public.vendor_reference_submission_attempts a set reason='invalid_token' where a.id=v_gate.attempt_id;
    return query select false,'invalid_token'::text,null::uuid,null::uuid,false,null::integer;
    return;
  end if;

  if v_ref.purpose <> 'faith_community' then
    update public.vendor_reference_submission_attempts a set reason='wrong_purpose_faith' where a.id=v_gate.attempt_id;
    return query select false,'wrong_purpose_faith'::text,null::uuid,v_ref.id,false,null::integer;
    return;
  end if;

  if exists(select 1 from public.vendor_reference_responses vrr where vrr.reference_id=v_ref.id) then
    update public.vendor_reference_submission_attempts a set reason='duplicate' where a.id=v_gate.attempt_id;
    return query select false,'already_submitted'::text,null::uuid,v_ref.id,true,null::integer;
    return;
  end if;

  begin
    insert into public.vendor_reference_responses(
      reference_id,vendor_id,would_recommend,overall_rating,strengths,concerns,
      faith_alignment,christian_identity_confirmed,relationship_context
    ) values (
      v_ref.id,v_ref.vendor_id,p_would_recommend,null,null,v_concerns,
      v_faith_alignment,p_christian_identity_confirmed,v_relationship_context
    ) returning vendor_reference_responses.id into v_response_id;
  exception when unique_violation then
    update public.vendor_reference_submission_attempts a set reason='duplicate' where a.id=v_gate.attempt_id;
    return query select false,'already_submitted'::text,null::uuid,v_ref.id,true,null::integer;
    return;
  end;

  update public.vendor_references vr
     set status='completed',completed_at=coalesce(vr.completed_at,now())
   where vr.id=v_ref.id;

  update public.vendor_reference_submission_attempts a
     set accepted=true,reason='accepted'
   where a.id=v_gate.attempt_id;

  return query select true,null::text,v_response_id,v_ref.id,false,null::integer;
end;
$$;

revoke all on function public.kb_submit_vendor_faith_reference_response_v2(text,boolean,boolean,text,text,text,text) from public;
grant execute on function public.kb_submit_vendor_faith_reference_response_v2(text,boolean,boolean,text,text,text,text) to anon, authenticated, service_role;

-- 8. Close old Faith response RPC to clients immediately.
revoke execute on function public.kb_submit_vendor_faith_reference_response(text,boolean,boolean,text,text,text,text) from public, anon, authenticated;
grant execute on function public.kb_submit_vendor_faith_reference_response(text,boolean,boolean,text,text,text,text) to service_role;

comment on function public.kb_submit_vendor_faith_reference_response(text,boolean,boolean,text,text,text,text) is
  'LEGACY exception-based Faith reference response RPC. Client execution revoked in P0-B2A. Use kb_submit_vendor_faith_reference_response_v2.';

-- Old past-client v1 intentionally remains callable until B2-D.
