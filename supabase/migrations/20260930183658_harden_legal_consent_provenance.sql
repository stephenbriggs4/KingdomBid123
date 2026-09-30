-- Bind account consent to the auth.users row created by Supabase Auth, keep
-- document versions server-controlled, and capture waitlist consent in the
-- same transaction as a newly inserted application.

create or replace function private.kb_current_legal_documents()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'terms', 'draft-2026-09-28',
    'privacy', 'draft-2026-09-28'
  );
$$;

revoke all on function private.kb_current_legal_documents() from public, anon, authenticated;

create unique index if not exists legal_consents_user_kind_documents_uq
  on public.legal_consents (user_id, kind, md5(documents::text))
  where user_id is not null;

create or replace function private.kb_capture_auth_signup_legal_consent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_consent jsonb := coalesce(new.raw_user_meta_data -> 'legal_consent', '{}'::jsonb);
  v_kind text := v_consent ->> 'kind';
begin
  if coalesce((v_consent ->> 'accepted')::boolean, false) is not true then
    return new;
  end if;

  if v_kind not in ('church_signup', 'vendor_signup', 'individual_signup', 'guest_post_project') then
    raise exception 'invalid legal consent kind' using errcode = '22023';
  end if;

  if new.email is null or new.email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'auth user email required for legal consent' using errcode = '22023';
  end if;

  insert into public.legal_consents (
    user_id, email, kind, documents, marketing_opt_in, consented_at
  ) values (
    new.id,
    lower(new.email),
    v_kind,
    private.kb_current_legal_documents(),
    coalesce((v_consent ->> 'marketing_opt_in')::boolean, false),
    now()
  )
  on conflict do nothing;

  return new;
end;
$$;

revoke all on function private.kb_capture_auth_signup_legal_consent() from public, anon, authenticated;

drop trigger if exists kb_capture_auth_signup_legal_consent on auth.users;
create trigger kb_capture_auth_signup_legal_consent
  after insert on auth.users
  for each row execute function private.kb_capture_auth_signup_legal_consent();

-- Preserve the public signature for authenticated re-consent, but never trust
-- browser-supplied identity or document-version fields.
create or replace function public.kb_record_legal_consent(
  p_email text,
  p_kind text,
  p_documents jsonb,
  p_marketing_opt_in boolean default false
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_kind not in ('church_signup', 'vendor_signup', 'individual_signup', 'guest_post_project') then
    raise exception 'invalid kind' using errcode = '22023';
  end if;

  select lower(u.email) into strict v_email
  from auth.users u
  where u.id = v_user_id;

  insert into public.legal_consents (
    user_id, email, kind, documents, marketing_opt_in, consented_at
  ) values (
    v_user_id,
    v_email,
    p_kind,
    private.kb_current_legal_documents(),
    coalesce(p_marketing_opt_in, false),
    now()
  )
  on conflict do nothing
  returning id into v_id;

  if v_id is null then
    select lc.id into v_id
    from public.legal_consents lc
    where lc.user_id = v_user_id
      and lc.kind = p_kind
      and lc.documents = private.kb_current_legal_documents()
    order by lc.consented_at desc
    limit 1;
  end if;
  return v_id;
end;
$$;

revoke all on function public.kb_record_legal_consent(text, text, jsonb, boolean)
  from public, anon, authenticated;
grant execute on function public.kb_record_legal_consent(text, text, jsonb, boolean)
  to authenticated;

drop policy if exists legal_consents_admin_read on public.legal_consents;
drop policy if exists legal_consents_own_read on public.legal_consents;
create policy legal_consents_owner_or_admin_read on public.legal_consents
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select coalesce(public.kb_is_platform_admin(), false))
  );

alter function public.kb_submit_waitlist_application_v2(jsonb)
  rename to kb_submit_waitlist_application_v2_unconsented_legacy;
revoke all on function public.kb_submit_waitlist_application_v2_unconsented_legacy(jsonb)
  from public, anon, authenticated;
grant execute on function public.kb_submit_waitlist_application_v2_unconsented_legacy(jsonb)
  to service_role;

create or replace function public.kb_submit_waitlist_application_v2(p_payload jsonb)
returns table(
  id uuid,
  created_at timestamptz,
  referral_code text,
  queue_position bigint,
  referral_validated boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_receipt record;
  v_email text := lower(btrim(coalesce(p_payload ->> 'email', '')));
begin
  if coalesce((p_payload #>> '{legal_consent,accepted}')::boolean, false) is not true then
    raise exception 'legal consent is required' using errcode = '22023';
  end if;

  select * into strict v_receipt
  from public.kb_submit_waitlist_application_v2_unconsented_legacy(p_payload);

  -- xmin proves that this row was created by this transaction. A duplicate
  -- submission cannot manufacture a new consent row for an existing email.
  insert into public.legal_consents (
    user_id, email, kind, documents, marketing_opt_in, consented_at
  )
  select
    null,
    lower(w.email),
    'waitlist',
    private.kb_current_legal_documents(),
    coalesce((p_payload #>> '{legal_consent,marketing_opt_in}')::boolean, false),
    now()
  from public.waitlist w
  where w.id = v_receipt.id
    and lower(w.email) = v_email
    and w.xmin::text::bigint = pg_current_xact_id()::text::bigint;

  return query select
    v_receipt.id::uuid,
    v_receipt.created_at::timestamptz,
    v_receipt.referral_code::text,
    v_receipt.queue_position::bigint,
    v_receipt.referral_validated::boolean;
end;
$$;

revoke all on function public.kb_submit_waitlist_application_v2(jsonb) from public;
grant execute on function public.kb_submit_waitlist_application_v2(jsonb)
  to anon, authenticated, service_role;

comment on function public.kb_submit_waitlist_application_v2(jsonb) is
  'Public waitlist intake. Captures server-versioned legal consent only when this transaction inserts the canonical waitlist row.';
