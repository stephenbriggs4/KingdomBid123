create or replace function concierge_ops.link_need_requesting_contact(
  p_need_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_need concierge_ops.needs%rowtype;
  v_contact_id uuid;
  v_first_name text := nullif(btrim(p_payload ->> 'first_name'), '');
  v_last_name text := nullif(btrim(p_payload ->> 'last_name'), '');
  v_email text := nullif(btrim(p_payload ->> 'email'), '');
  v_phone text := nullif(btrim(p_payload ->> 'phone'), '');
  v_title_role text := nullif(btrim(p_payload ->> 'title_role'), '');
  v_make_primary boolean := false;
begin
  if not public.kb_is_platform_admin() then
    raise exception using errcode = '42501', message = 'Platform administrator access is required';
  end if;

  if v_first_name is null and v_last_name is null then
    raise exception 'A contact first or last name is required';
  end if;
  if v_email is null and v_phone is null then
    raise exception 'A reachable email address or phone number is required';
  end if;

  select * into v_need
  from concierge_ops.needs
  where id = p_need_id and archived_at is null
  for update;

  if not found then raise exception 'Need not found'; end if;
  if v_need.status not in ('intake', 'clarifying') then
    raise exception 'A requesting contact can be linked only during Intake or Clarifying review';
  end if;
  if v_need.requesting_contact_id is not null then
    raise exception 'This Need already has a requesting contact';
  end if;

  select (primary_contact_id is null) into v_make_primary
  from concierge_ops.organizations
  where id = v_need.organization_id and archived_at is null
  for update;

  if not found then raise exception 'Organization not found'; end if;

  insert into concierge_ops.people (
    first_name, last_name, title_role, decision_role, email, phone,
    preferred_channel, contact_status, is_primary_contact, contact_notes,
    organization_id
  ) values (
    v_first_name, v_last_name, v_title_role, 'coordinator', v_email, v_phone,
    case when v_email is not null then 'email' else 'phone' end,
    'unverified', v_make_primary,
    'Church-approved requesting contact linked explicitly during Concierge intake review.',
    v_need.organization_id
  ) returning id into v_contact_id;

  if v_make_primary then
    update concierge_ops.organizations
    set primary_contact_id = v_contact_id
    where id = v_need.organization_id and primary_contact_id is null;
  end if;

  update concierge_ops.needs
  set requesting_contact_id = v_contact_id
  where id = v_need.id;

  return jsonb_build_object(
    'need_id', v_need.id,
    'organization_id', v_need.organization_id,
    'contact_id', v_contact_id,
    'is_primary_contact', v_make_primary
  );
end;
$$;

revoke all on function concierge_ops.link_need_requesting_contact(uuid, jsonb)
  from public, anon;
grant execute on function concierge_ops.link_need_requesting_contact(uuid, jsonb)
  to authenticated, service_role;

comment on function concierge_ops.link_need_requesting_contact(uuid, jsonb) is
  'Admin-only atomic contact capture for a Concierge Need. Contact data must be entered explicitly; Church OS staff data is never copied automatically.';
