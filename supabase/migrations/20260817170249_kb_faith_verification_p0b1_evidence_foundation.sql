alter table public.vendor_references
  add column purpose text not null default 'past_client';

alter table public.vendor_references
  add column verification_id uuid null;

alter table public.vendor_references
  add constraint vendor_references_purpose_check
  check (purpose in ('past_client', 'faith_community'));

alter table public.vendor_references
  add constraint vendor_references_verification_link_shape_check
  check (
    (purpose = 'past_client' and verification_id is null)
    or
    (purpose = 'faith_community' and verification_id is not null)
  );

alter table public.vendor_references
  add constraint vendor_references_verification_id_fkey
  foreign key (verification_id)
  references public.vendor_verifications(id)
  on delete restrict;

create index vendor_references_verification_id_idx
  on public.vendor_references (verification_id)
  where verification_id is not null;

comment on column public.vendor_references.vendor_id is
  'AUTH USER ID. References auth.users(id). This is not public.vendors.id.';

comment on column public.vendor_verifications.vendor_id is
  'VENDOR ROW ID. References public.vendors(id). This is not auth.users.id.';

comment on column public.vendor_references.purpose is
  'Reference purpose. past_client = vendor work proof; faith_community = private Faith Verification evidence.';

comment on column public.vendor_references.verification_id is
  'Required only for faith_community references; links evidence to its Faith Verification application.';

alter table public.vendor_reference_responses
  add column christian_identity_confirmed boolean null;

alter table public.vendor_reference_responses
  add column relationship_context text null;

alter table public.vendor_reference_responses
  add constraint vendor_reference_responses_relationship_context_length_check
  check (
    relationship_context is null
    or char_length(relationship_context) <= 2000
  );

create or replace function public.kb_vendor_reference_evidence_guard()
returns trigger
language plpgsql
set search_path to 'public', 'auth', 'extensions'
as $$
declare
  v_verification_user_id uuid;
begin
  if new.purpose = 'past_client' then
    if new.verification_id is not null then
      raise exception
        'past-client references cannot be linked to a Faith Verification application'
        using errcode = '23514';
    end if;

  elsif new.purpose = 'faith_community' then
    if new.verification_id is null then
      raise exception
        'faith-community references require a verification application'
        using errcode = '23514';
    end if;

    select vv.user_id
      into v_verification_user_id
    from public.vendor_verifications vv
    where vv.id = new.verification_id;

    if not found then
      raise exception
        'Faith Verification application not found'
        using errcode = '23503';
    end if;

    if v_verification_user_id is null
       or v_verification_user_id is distinct from new.vendor_id then
      raise exception
        'faith-community reference owner does not match verification applicant'
        using errcode = '23514';
    end if;
  end if;

  if tg_op = 'UPDATE'
     and old.purpose = 'faith_community' then
    if new.vendor_id is distinct from old.vendor_id
       or new.purpose is distinct from old.purpose
       or new.verification_id is distinct from old.verification_id
       or new.token is distinct from old.token
       or new.client_name is distinct from old.client_name
       or new.client_email is distinct from old.client_email
       or new.project_context is distinct from old.project_context then
      raise exception
        'faith-community reference identity evidence is immutable'
        using errcode = '42501';
    end if;

    if old.status = 'completed'
       and (
         new.status is distinct from old.status
         or new.sent_at is distinct from old.sent_at
         or new.completed_at is distinct from old.completed_at
       ) then
      raise exception
        'completed faith-community reference evidence is immutable'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

comment on function public.kb_vendor_reference_evidence_guard() is
  'Faith-community reference identity is immutable. Completed faith-community evidence is terminal by design. Future Cancel/Replace flows must cancel only unanswered pending/sent references and create a new reference; they must not bypass or rewrite completed evidence.';

create trigger kb_vendor_reference_evidence_guard
before insert or update
on public.vendor_references
for each row
execute function public.kb_vendor_reference_evidence_guard();

create or replace function public.kb_vendor_verification_evidence_identity_guard()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if (
       new.user_id is distinct from old.user_id
       or new.vendor_id is distinct from old.vendor_id
     )
     and exists (
       select 1
       from public.vendor_references vr
       where vr.verification_id = old.id
         and vr.purpose = 'faith_community'
     ) then
    raise exception
      'verification identity cannot change after faith-community evidence is linked'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

comment on function public.kb_vendor_verification_evidence_identity_guard() is
  'Once faith-community evidence is linked, the verification application cannot be reassigned to a different auth user or vendor row. Review status fields remain mutable.';

create trigger kb_vendor_verification_evidence_identity_guard
before update
on public.vendor_verifications
for each row
execute function public.kb_vendor_verification_evidence_identity_guard();

drop policy if exists "kb_vendor_references_owner_insert_pending"
  on public.vendor_references;

drop policy if exists "kb_vendor_references_owner_delete_unsent"
  on public.vendor_references;

drop policy if exists "kb_vendor_references_admin_update"
  on public.vendor_references;

create policy kb_vendor_references_owner_insert_past_client_pending
on public.vendor_references
for insert
to authenticated
with check (
  vendor_id = auth.uid()
  and purpose = 'past_client'
  and verification_id is null
  and status = 'pending'
  and sent_at is null
  and completed_at is null
);

create policy kb_vendor_references_owner_delete_unsent_past_client
on public.vendor_references
for delete
to authenticated
using (
  vendor_id = auth.uid()
  and purpose = 'past_client'
  and verification_id is null
  and status = 'pending'
  and sent_at is null
  and completed_at is null
  and not exists (
    select 1
    from public.vendor_reference_responses vrr
    where vrr.reference_id = vendor_references.id
  )
);

drop policy if exists "kb_vendor_reference_responses_owner_select"
  on public.vendor_reference_responses;

create policy kb_vendor_reference_responses_owner_select_past_client
on public.vendor_reference_responses
for select
to authenticated
using (
  vendor_id = auth.uid()
  and exists (
    select 1
    from public.vendor_references vr
    where vr.id = vendor_reference_responses.reference_id
      and vr.vendor_id = auth.uid()
      and vr.purpose = 'past_client'
  )
);

create or replace function public.kb_submit_faith_verification_application(
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
  reference_token text,
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
    raise exception 'Sign in to submit Faith Verification.'
      using errcode = '42501';
  end if;

  select v.*
    into v_vendor
  from public.vendors v
  where v.user_id = v_user_id
  limit 1
  for update;

  if not found then
    raise exception 'A vendor profile is required before Faith Verification.'
      using errcode = '42501';
  end if;

  if coalesce(v_vendor.verified, false) then
    raise exception 'Faith Verification already exists for this vendor. Contact FaithBid if this status appears incorrect.'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.vendor_verifications vv
    where vv.vendor_id = v_vendor.id
      and vv.status in ('pending', 'needs_info')
  ) then
    raise exception 'An active Faith Verification application already exists.'
      using errcode = '23505';
  end if;

  if char_length(v_faith_statement) < 80
     or char_length(v_faith_statement) > 5000 then
    raise exception
      'Faith statement must be between 80 and 5000 characters.'
      using errcode = '22023';
  end if;

  if v_church_name = ''
     or char_length(v_church_name) > 200 then
    raise exception
      'Christian community or church name is required.'
      using errcode = '22023';
  end if;

  if v_ref_name = ''
     or char_length(v_ref_name) > 160 then
    raise exception
      'Reference name is required.'
      using errcode = '22023';
  end if;

  if char_length(v_ref_email) > 320
     or v_ref_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception
      'A valid reference email address is required.'
      using errcode = '22023';
  end if;

  if v_ref_phone is not null
     and char_length(v_ref_phone) > 64 then
    raise exception
      'Reference phone number is too long.'
      using errcode = '22023';
  end if;

  if v_ref_relationship is not null
     and char_length(v_ref_relationship) > 500 then
    raise exception
      'Reference relationship description is too long.'
      using errcode = '22023';
  end if;

  if coalesce(p_covenant_signed, false) is not true then
    raise exception
      'Vendor Covenant acceptance is required.'
      using errcode = '23514';
  end if;

  insert into public.vendor_verifications (
    vendor_id,
    user_id,
    tier_goal,
    faith_statement,
    ref_church_name,
    ref_pastor_name,
    ref_pastor_email,
    ref_pastor_phone,
    ref_relationship,
    covenant_signed,
    covenant_signed_at,
    status
  ) values (
    v_vendor.id,
    v_user_id,
    'faith_verified',
    v_faith_statement,
    v_church_name,
    v_ref_name,
    v_ref_email,
    v_ref_phone,
    v_ref_relationship,
    true,
    now(),
    'pending'
  )
  returning id into v_verification_id;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.vendor_references (
    vendor_id,
    client_name,
    client_email,
    project_context,
    token,
    status,
    purpose,
    verification_id
  ) values (
    v_user_id,
    v_ref_name,
    v_ref_email,
    v_ref_relationship,
    v_token,
    'pending',
    'faith_community',
    v_verification_id
  )
  returning id into v_reference_id;

  return query
  select
    v_verification_id,
    v_reference_id,
    v_token,
    'pending'::text,
    'pending'::text;
end;
$$;

revoke all
on function public.kb_submit_faith_verification_application(
  text, text, text, text, text, text, boolean
)
from public;

grant execute
on function public.kb_submit_faith_verification_application(
  text, text, text, text, text, text, boolean
)
to authenticated, service_role;

create or replace function public.kb_get_vendor_reference_survey_v2(
  p_token text
)
returns table(
  id uuid,
  purpose text,
  client_name text,
  reference_context text,
  status text,
  vendor_name text,
  already_submitted boolean
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if nullif(trim(coalesce(p_token, '')), '') is null then
    raise exception 'reference token is required'
      using errcode = 'P0002';
  end if;

  return query
  select
    vr.id,
    vr.purpose,
    vr.client_name,
    case
      when vr.purpose = 'faith_community' then
        nullif(
          concat_ws(
            ' · ',
            nullif(btrim(vv.ref_church_name), ''),
            nullif(btrim(vv.ref_relationship), '')
          ),
          ''
        )
      else vr.project_context
    end as reference_context,
    vr.status,
    coalesce(v.name, 'FaithBid vendor') as vendor_name,
    exists (
      select 1
      from public.vendor_reference_responses vrr
      where vrr.reference_id = vr.id
    ) as already_submitted
  from public.vendor_references vr
  left join public.vendors v
    on v.user_id = vr.vendor_id
  left join public.vendor_verifications vv
    on vv.id = vr.verification_id
  where vr.token = p_token
    and vr.status <> 'cancelled'
  limit 1;
end;
$$;

revoke all
on function public.kb_get_vendor_reference_survey_v2(text)
from public;

grant execute
on function public.kb_get_vendor_reference_survey_v2(text)
to anon, authenticated, service_role;

create or replace function public.kb_get_vendor_reference_survey(
  p_token text
)
returns table(
  id uuid,
  vendor_id uuid,
  client_name text,
  project_context text,
  status text,
  vendor_name text,
  already_submitted boolean
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if nullif(trim(coalesce(p_token, '')), '') is null then
    raise exception 'reference token is required'
      using errcode = 'P0002';
  end if;

  return query
  select
    vr.id,
    vr.vendor_id,
    vr.client_name,
    vr.project_context,
    vr.status,
    coalesce(v.name, 'FaithBid vendor') as vendor_name,
    exists (
      select 1
      from public.vendor_reference_responses vrr
      where vrr.reference_id = vr.id
    ) as already_submitted
  from public.vendor_references vr
  left join public.vendors v
    on v.user_id = vr.vendor_id
  where vr.token = p_token
    and vr.purpose = 'past_client'
    and vr.status <> 'cancelled'
  limit 1;
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
returns table(
  id uuid,
  reference_id uuid,
  vendor_id uuid,
  already_submitted boolean
)
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
    raise exception 'reference token is required' using errcode='P0002';
  end if;

  v_token_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');
  v_ip_hash := public.kb_request_ip_fingerprint();

  select count(*)::integer into v_recent_token_attempts
  from public.vendor_reference_submission_attempts a
  where a.token_hash=v_token_hash and a.created_at >= now()-interval '10 minutes';

  select count(*)::integer into v_recent_ip_attempts
  from public.vendor_reference_submission_attempts a
  where a.ip_hash=v_ip_hash and a.created_at >= now()-interval '10 minutes';

  if v_recent_token_attempts >= 5 then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'rate_limited_token');
    raise exception 'too many reference submissions for this link; try again later' using errcode='P0001';
  end if;

  if v_recent_ip_attempts >= 30 then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'rate_limited_ip');
    raise exception 'too many reference submissions; try again later' using errcode='P0001';
  end if;

  if nullif(trim(coalesce(p_honeypot,'')),'') is not null then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'honeypot');
    raise exception 'automated reference submission rejected' using errcode='42501';
  end if;

  if p_would_recommend is null then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'missing_recommendation');
    raise exception 'would_recommend is required' using errcode='23514';
  end if;

  if p_overall_rating is null or p_overall_rating < 1 or p_overall_rating > 5 then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'invalid_rating');
    raise exception 'overall_rating must be between 1 and 5' using errcode='23514';
  end if;

  select vr.id,vr.vendor_id,vr.status,vr.purpose into v_ref
  from public.vendor_references vr
  where vr.token=v_token and vr.status <> 'cancelled'
  limit 1;

  if v_ref.id is null then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'invalid_token');
    raise exception 'reference link not found' using errcode='P0002';
  end if;

  if v_ref.purpose <> 'past_client' then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'wrong_purpose_past_client');
    raise exception 'this link is not a past-client reference' using errcode='22023';
  end if;

  if exists(select 1 from public.vendor_reference_responses vrr where vrr.reference_id=v_ref.id) then
    insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
    values(v_token_hash,v_ip_hash,false,'duplicate');
    raise exception 'reference response already exists for this link' using errcode='23505';
  end if;

  insert into public.vendor_reference_responses(
    reference_id,vendor_id,would_recommend,overall_rating,strengths,concerns,faith_alignment
  ) values(
    v_ref.id,v_ref.vendor_id,p_would_recommend,p_overall_rating,
    nullif(trim(coalesce(p_strengths,'')),''),
    nullif(trim(coalesce(p_concerns,'')),''),
    nullif(trim(coalesce(p_faith_alignment,'')),'')
  )
  returning vendor_reference_responses.id into v_response_id;

  update public.vendor_references vr
  set status='completed',completed_at=coalesce(vr.completed_at,now())
  where vr.id=v_ref.id;

  insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
  values(v_token_hash,v_ip_hash,true,'accepted');

  return query select v_response_id,v_ref.id,v_ref.vendor_id,false;

exception when unique_violation then
  insert into public.vendor_reference_submission_attempts(token_hash,ip_hash,accepted,reason)
  values(
    coalesce(v_token_hash,encode(extensions.digest(coalesce(v_token,''),'sha256'),'hex')),
    coalesce(v_ip_hash,'unknown'),false,'unique_violation'
  )
  on conflict do nothing;
  raise exception 'reference response already exists for this link' using errcode='23505';
end;
$$;

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

  update public.vendor_references
     set status = 'completed',
         completed_at = coalesce(completed_at, now())
   where id = v_ref.id;

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

revoke all
on function public.kb_submit_vendor_faith_reference_response(
  text, boolean, boolean, text, text, text, text
)
from public;

grant execute
on function public.kb_submit_vendor_faith_reference_response(
  text, boolean, boolean, text, text, text, text
)
to anon, authenticated, service_role;
