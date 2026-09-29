create table if not exists public.legal_consents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null,
  email         text not null check (char_length(email) between 3 and 254),
  kind          text not null check (kind in (
                  'waitlist','church_signup','vendor_signup','individual_signup','guest_post_project'
                )),
  documents     jsonb not null check (jsonb_typeof(documents) = 'object'),
  marketing_opt_in boolean not null default false,
  consented_at  timestamptz not null default now()
);

create index if not exists legal_consents_email_idx   on public.legal_consents (lower(email), consented_at desc);
create index if not exists legal_consents_user_idx    on public.legal_consents (user_id) where user_id is not null;

alter table public.legal_consents enable row level security;

drop policy if exists legal_consents_admin_read on public.legal_consents;
create policy legal_consents_admin_read on public.legal_consents
  for select to authenticated
  using ((select coalesce(public.kb_is_platform_admin(), false)));

drop policy if exists legal_consents_own_read on public.legal_consents;
create policy legal_consents_own_read on public.legal_consents
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.legal_consents from anon, authenticated;
grant select on public.legal_consents to authenticated;

create or replace function public.kb_record_legal_consent(
  p_email text,
  p_kind text,
  p_documents jsonb,
  p_marketing_opt_in boolean default false
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_id uuid;
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254 then
    raise exception 'invalid email' using errcode = '22023';
  end if;
  if p_kind not in ('waitlist','church_signup','vendor_signup','individual_signup','guest_post_project') then
    raise exception 'invalid kind' using errcode = '22023';
  end if;
  if p_documents is null or jsonb_typeof(p_documents) <> 'object'
     or (select count(*) from jsonb_object_keys(p_documents)) not between 1 and 8
     or char_length(p_documents::text) > 1000 then
    raise exception 'invalid documents' using errcode = '22023';
  end if;
  if (select count(*) from public.legal_consents
        where lower(email) = v_email and consented_at > now() - interval '1 hour') >= 20 then
    raise exception 'too many consent records' using errcode = '54000';
  end if;

  insert into public.legal_consents (user_id, email, kind, documents, marketing_opt_in)
  values ((select auth.uid()), v_email, p_kind, p_documents, coalesce(p_marketing_opt_in, false))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.kb_record_legal_consent(text, text, jsonb, boolean) from public;
grant execute on function public.kb_record_legal_consent(text, text, jsonb, boolean) to anon, authenticated;
