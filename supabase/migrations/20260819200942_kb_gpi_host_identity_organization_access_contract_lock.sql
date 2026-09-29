create table public.gpi_organization_access_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.gpi_organizations(id) on delete restrict,
  requester_profile_id uuid not null references public.profiles(id) on delete restrict,
  requested_role text not null default 'admin' check (requested_role in ('admin','editor')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn')),
  request_message text null check (request_message is null or char_length(request_message) <= 1000),
  organization_contact_email text not null check (
    organization_contact_email = lower(btrim(organization_contact_email))
    and char_length(organization_contact_email) between 3 and 320
    and organization_contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  reviewed_by_profile_id uuid null references public.profiles(id) on delete restrict,
  reviewed_at timestamptz null,
  decision_reason text null check (decision_reason is null or char_length(decision_reason) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gpi_organization_access_requests_review_state_check check (
    ((status in ('approved','rejected')) and reviewed_by_profile_id is not null and reviewed_at is not null)
    or ((status in ('pending','withdrawn')) and reviewed_by_profile_id is null and reviewed_at is null)
  )
);

create unique index gpi_organization_access_requests_one_pending_idx
  on public.gpi_organization_access_requests(organization_id, requester_profile_id)
  where status = 'pending';
create index gpi_organization_access_requests_org_status_idx
  on public.gpi_organization_access_requests(organization_id, status, created_at desc);
create index gpi_organization_access_requests_requester_status_idx
  on public.gpi_organization_access_requests(requester_profile_id, status, created_at desc);
create index gpi_organization_access_requests_reviewer_idx
  on public.gpi_organization_access_requests(reviewed_by_profile_id)
  where reviewed_by_profile_id is not null;

alter table public.gpi_organization_access_requests enable row level security;
revoke all on table public.gpi_organization_access_requests from public, anon, authenticated;
grant select, insert, update, delete on table public.gpi_organization_access_requests to service_role;

create trigger gpi_organization_access_requests_updated_at
before update on public.gpi_organization_access_requests
for each row execute function public.gpi_set_updated_at();

create or replace function public.gpi_host_has_organization_role(
  p_organization_id uuid,
  p_roles text[] default array['admin','editor']::text[]
)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select auth.uid() is not null
    and exists (
      select 1
      from public.gpi_organization_members m
      where m.organization_id = p_organization_id
        and m.profile_id = auth.uid()
        and m.active
        and m.role = any(coalesce(p_roles, array['admin','editor']::text[]))
    );
$function$;

create or replace function public.gpi_host_get_context()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_profile_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_profile_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'memberships', coalesce((
      select jsonb_agg(jsonb_build_object(
        'organization_id', o.id,
        'organization_name', o.name,
        'organization_status', o.status,
        'membership_role', m.role,
        'active', m.active,
        'open_count', (select count(*)::integer from public.gpi_opportunities x where x.organization_id=o.id and x.status='open'),
        'requires_review_count', (select count(*)::integer from public.gpi_opportunities x where x.organization_id=o.id and x.status='requires_review'),
        'draft_count', (select count(*)::integer from public.gpi_opportunities x where x.organization_id=o.id and x.status='draft'),
        'closed_count', (select count(*)::integer from public.gpi_opportunities x where x.organization_id=o.id and x.status='closed')
      ) order by m.active desc, o.name)
      from public.gpi_organization_members m
      join public.gpi_organizations o on o.id=m.organization_id
      where m.profile_id=v_profile_id
    ), '[]'::jsonb),
    'access_requests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'request_id', r.id,
        'organization_id', r.organization_id,
        'organization_name', o.name,
        'requested_role', r.requested_role,
        'status', r.status,
        'created_at', r.created_at,
        'reviewed_at', r.reviewed_at
      ) order by r.created_at desc)
      from public.gpi_organization_access_requests r
      join public.gpi_organizations o on o.id=r.organization_id
      where r.requester_profile_id=v_profile_id
        and r.status in ('pending','approved','rejected','withdrawn')
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$function$;

create or replace function public.gpi_host_search_claimable_organizations(
  p_search text,
  p_limit integer default 12
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_profile_id uuid := auth.uid();
  v_search text := btrim(coalesce(p_search,''));
  v_limit integer := greatest(1, least(coalesce(p_limit,12), 20));
  v_result jsonb;
begin
  if v_profile_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if char_length(v_search) < 2 then
    raise exception 'Search must contain at least 2 characters' using errcode = '22023';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'organization_id', q.id,
    'name', q.name,
    'description', q.description,
    'status', q.status,
    'membership_role', q.membership_role,
    'membership_active', q.membership_active,
    'pending_request_id', q.pending_request_id
  ) order by q.name), '[]'::jsonb)
  into v_result
  from (
    select o.id,o.name,o.description,o.status,
           m.role as membership_role,
           m.active as membership_active,
           r.id as pending_request_id
    from public.gpi_organizations o
    left join public.gpi_organization_members m
      on m.organization_id=o.id and m.profile_id=v_profile_id
    left join public.gpi_organization_access_requests r
      on r.organization_id=o.id and r.requester_profile_id=v_profile_id and r.status='pending'
    where o.status='verified'
      and (o.name ilike '%' || v_search || '%' or coalesce(o.description,'') ilike '%' || v_search || '%')
    order by case when lower(o.name)=lower(v_search) then 0 else 1 end, o.name
    limit v_limit
  ) q;

  return v_result;
end;
$function$;

create or replace function public.gpi_host_create_organization(
  p_name text,
  p_description text,
  p_contact_email text
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_profile_id uuid := auth.uid();
  v_name text := btrim(coalesce(p_name,''));
  v_description text := nullif(btrim(coalesce(p_description,'')), '');
  v_email text := lower(btrim(coalesce(p_contact_email,'')));
  v_org_id uuid;
begin
  if v_profile_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id=v_profile_id) then
    raise exception 'FaithBid profile is required' using errcode = '42501';
  end if;
  if char_length(v_name) not between 2 and 160 then
    raise exception 'Organization name must contain 2 to 160 characters' using errcode = '22023';
  end if;
  if char_length(coalesce(v_description,'')) > 3000 then
    raise exception 'Organization description is too long' using errcode = '22023';
  end if;
  if char_length(v_email) not between 3 and 320
     or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'A valid organization contact email is required' using errcode = '22023';
  end if;

  insert into public.gpi_organizations(name,description,status)
  values (v_name,v_description,'draft')
  returning id into v_org_id;

  insert into public.gpi_organization_members(organization_id,profile_id,role,active)
  values (v_org_id,v_profile_id,'admin',true);

  insert into public.gpi_organization_notification_endpoints(
    organization_id,channel,destination_email,status,is_primary
  ) values (
    v_org_id,'email',v_email,'pending_verification',true
  );

  return v_org_id;
end;
$function$;

create or replace function public.gpi_host_request_organization_access(
  p_organization_id uuid,
  p_requested_role text default 'admin',
  p_request_message text default null,
  p_organization_contact_email text default null
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_profile_id uuid := auth.uid();
  v_role text := lower(btrim(coalesce(p_requested_role,'admin')));
  v_message text := nullif(btrim(coalesce(p_request_message,'')), '');
  v_email text := lower(btrim(coalesce(p_organization_contact_email,'')));
  v_org_status text;
  v_existing uuid;
  v_id uuid;
begin
  if v_profile_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id=v_profile_id) then
    raise exception 'FaithBid profile is required' using errcode = '42501';
  end if;
  if p_organization_id is null then
    raise exception 'Organization id is required' using errcode = '22023';
  end if;
  if v_role not in ('admin','editor') then
    raise exception 'Requested role must be admin or editor' using errcode = '22023';
  end if;
  if char_length(coalesce(v_message,'')) > 1000 then
    raise exception 'Request message is too long' using errcode = '22023';
  end if;
  if char_length(v_email) not between 3 and 320
     or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'A valid organization contact email is required' using errcode = '22023';
  end if;

  select status into v_org_status
  from public.gpi_organizations
  where id=p_organization_id;
  if not found then
    raise exception 'Organization not found' using errcode = 'P0002';
  end if;
  if v_org_status <> 'verified' then
    raise exception 'Only verified organizations can be claimed through this workflow' using errcode = '23514';
  end if;

  if exists (
    select 1 from public.gpi_organization_members m
    where m.organization_id=p_organization_id and m.profile_id=v_profile_id and m.active
  ) then
    raise exception 'You already have active access to this organization' using errcode = '23505';
  end if;

  select id into v_existing
  from public.gpi_organization_access_requests
  where organization_id=p_organization_id
    and requester_profile_id=v_profile_id
    and status='pending'
  order by created_at desc
  limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  insert into public.gpi_organization_access_requests(
    organization_id,requester_profile_id,requested_role,status,
    request_message,organization_contact_email
  ) values (
    p_organization_id,v_profile_id,v_role,'pending',v_message,v_email
  ) returning id into v_id;

  return v_id;
end;
$function$;

create or replace function public.gpi_host_withdraw_organization_access_request(
  p_request_id uuid
)
returns text
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_profile_id uuid := auth.uid();
  v_status text;
begin
  if v_profile_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select status into v_status
  from public.gpi_organization_access_requests
  where id=p_request_id and requester_profile_id=v_profile_id
  for update;
  if not found then
    raise exception 'Access request not found' using errcode = 'P0002';
  end if;
  if v_status='withdrawn' then return 'withdrawn'; end if;
  if v_status<>'pending' then
    raise exception 'Only a pending request can be withdrawn' using errcode = '23514';
  end if;

  update public.gpi_organization_access_requests
  set status='withdrawn'
  where id=p_request_id;
  return 'withdrawn';
end;
$function$;

create or replace function public.gpi_admin_list_organization_access_requests(
  p_status text default 'pending',
  p_limit integer default 75
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_admin_id uuid := auth.uid();
  v_status text := lower(btrim(coalesce(p_status,'pending')));
  v_limit integer := greatest(1,least(coalesce(p_limit,75),200));
  v_result jsonb;
begin
  if v_admin_id is null or not public.kb_is_platform_admin() then
    raise exception 'not authorized' using errcode='42501';
  end if;
  if v_status not in ('pending','approved','rejected','withdrawn','all') then
    raise exception 'Unsupported access-request status' using errcode='22023';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'request_id',q.id,
    'organization_id',q.organization_id,
    'organization_name',q.organization_name,
    'organization_status',q.organization_status,
    'requester_profile_id',q.requester_profile_id,
    'requester_email',q.requester_email,
    'requester_role',q.requester_role,
    'requester_org_name',q.requester_org_name,
    'requested_role',q.requested_role,
    'status',q.status,
    'request_message',q.request_message,
    'organization_contact_email',q.organization_contact_email,
    'created_at',q.created_at,
    'reviewed_at',q.reviewed_at,
    'decision_reason',q.decision_reason
  ) order by q.created_at asc), '[]'::jsonb)
  into v_result
  from (
    select r.*,o.name organization_name,o.status organization_status,
           p.email requester_email,p.role requester_role,p.org_name requester_org_name
    from public.gpi_organization_access_requests r
    join public.gpi_organizations o on o.id=r.organization_id
    join public.profiles p on p.id=r.requester_profile_id
    where v_status='all' or r.status=v_status
    order by r.created_at asc
    limit v_limit
  ) q;

  return v_result;
end;
$function$;

create or replace function public.gpi_admin_review_organization_access_request(
  p_request_id uuid,
  p_decision text,
  p_approved_role text default null,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_admin_id uuid := auth.uid();
  v_decision text := lower(btrim(coalesce(p_decision,'')));
  v_reason text := nullif(btrim(coalesce(p_reason,'')), '');
  v_request public.gpi_organization_access_requests%rowtype;
  v_org_status text;
  v_role text;
  v_membership_id uuid;
begin
  if v_admin_id is null or not public.kb_is_platform_admin() then
    raise exception 'not authorized' using errcode='42501';
  end if;
  if v_decision not in ('approve','reject') then
    raise exception 'Decision must be approve or reject' using errcode='22023';
  end if;
  if char_length(coalesce(v_reason,'')) > 1000 then
    raise exception 'Decision reason is too long' using errcode='22023';
  end if;

  select * into v_request
  from public.gpi_organization_access_requests
  where id=p_request_id
  for update;
  if not found then
    raise exception 'Access request not found' using errcode='P0002';
  end if;

  if v_request.status <> 'pending' then
    select id into v_membership_id
    from public.gpi_organization_members
    where organization_id=v_request.organization_id
      and profile_id=v_request.requester_profile_id;
    return jsonb_build_object(
      'request_id',v_request.id,
      'status',v_request.status,
      'membership_id',v_membership_id
    );
  end if;

  if v_decision='approve' then
    select status into v_org_status
    from public.gpi_organizations
    where id=v_request.organization_id
    for update;
    if not found then raise exception 'Organization not found' using errcode='P0002'; end if;
    if v_org_status <> 'verified' then
      raise exception 'Only a verified organization can receive approved host access' using errcode='23514';
    end if;

    v_role := lower(btrim(coalesce(p_approved_role,v_request.requested_role)));
    if v_role not in ('admin','editor') then
      raise exception 'Approved role must be admin or editor' using errcode='22023';
    end if;

    insert into public.gpi_organization_members(organization_id,profile_id,role,active)
    values (v_request.organization_id,v_request.requester_profile_id,v_role,true)
    on conflict (organization_id,profile_id)
    do update set role=excluded.role,active=true,updated_at=now()
    returning id into v_membership_id;

    update public.gpi_organization_access_requests
    set status='approved',reviewed_by_profile_id=v_admin_id,reviewed_at=now(),decision_reason=v_reason
    where id=v_request.id;

    insert into public.admin_audit_log(
      admin_id,action,target_table,target_id,reason,before_snapshot,after_snapshot,meta
    ) values (
      v_admin_id,'gpi_approve_organization_access','gpi_organization_access_requests',v_request.id::text,v_reason,
      jsonb_build_object('status','pending','organization_id',v_request.organization_id,'requester_profile_id',v_request.requester_profile_id,'requested_role',v_request.requested_role),
      jsonb_build_object('status','approved','organization_id',v_request.organization_id,'requester_profile_id',v_request.requester_profile_id,'approved_role',v_role,'membership_id',v_membership_id),
      jsonb_build_object('source','gpi_admin_review_organization_access_request','organization_contact_email_excluded',true)
    );

    return jsonb_build_object('request_id',v_request.id,'status','approved','membership_id',v_membership_id,'role',v_role);
  end if;

  update public.gpi_organization_access_requests
  set status='rejected',reviewed_by_profile_id=v_admin_id,reviewed_at=now(),decision_reason=v_reason
  where id=v_request.id;

  insert into public.admin_audit_log(
    admin_id,action,target_table,target_id,reason,before_snapshot,after_snapshot,meta
  ) values (
    v_admin_id,'gpi_reject_organization_access','gpi_organization_access_requests',v_request.id::text,v_reason,
    jsonb_build_object('status','pending','organization_id',v_request.organization_id,'requester_profile_id',v_request.requester_profile_id,'requested_role',v_request.requested_role),
    jsonb_build_object('status','rejected','organization_id',v_request.organization_id,'requester_profile_id',v_request.requester_profile_id),
    jsonb_build_object('source','gpi_admin_review_organization_access_request','organization_contact_email_excluded',true)
  );

  return jsonb_build_object('request_id',v_request.id,'status','rejected','membership_id',null);
end;
$function$;

revoke all on function public.gpi_host_has_organization_role(uuid,text[]) from public, anon, authenticated;
grant execute on function public.gpi_host_has_organization_role(uuid,text[]) to service_role;

revoke all on function public.gpi_host_get_context() from public, anon;
grant execute on function public.gpi_host_get_context() to authenticated, service_role;

revoke all on function public.gpi_host_search_claimable_organizations(text,integer) from public, anon;
grant execute on function public.gpi_host_search_claimable_organizations(text,integer) to authenticated, service_role;

revoke all on function public.gpi_host_create_organization(text,text,text) from public, anon;
grant execute on function public.gpi_host_create_organization(text,text,text) to authenticated, service_role;

revoke all on function public.gpi_host_request_organization_access(uuid,text,text,text) from public, anon;
grant execute on function public.gpi_host_request_organization_access(uuid,text,text,text) to authenticated, service_role;

revoke all on function public.gpi_host_withdraw_organization_access_request(uuid) from public, anon;
grant execute on function public.gpi_host_withdraw_organization_access_request(uuid) to authenticated, service_role;

revoke all on function public.gpi_admin_list_organization_access_requests(text,integer) from public, anon;
grant execute on function public.gpi_admin_list_organization_access_requests(text,integer) to authenticated, service_role;

revoke all on function public.gpi_admin_review_organization_access_request(uuid,text,text,text) from public, anon;
grant execute on function public.gpi_admin_review_organization_access_request(uuid,text,text,text) to authenticated, service_role;
