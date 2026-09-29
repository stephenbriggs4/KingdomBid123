alter table public.projects
  add column if not exists hired_at timestamptz,
  add column if not exists work_started_at timestamptz,
  add column if not exists work_started_by uuid references auth.users(id) on delete set null,
  add column if not exists completion_requested_at timestamptz,
  add column if not exists completion_requested_by uuid references auth.users(id) on delete set null,
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by uuid references auth.users(id) on delete set null;

create or replace function public.kb_guard_project_status_writes()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if current_user in ('anon','authenticated') then
    if tg_op='INSERT' then
      if new.status is distinct from 'draft' then
        raise exception 'New projects must begin in draft' using errcode='42501';
      end if;
      if new.hired_vendor_id is not null
         or new.hired_at is not null
         or new.work_started_at is not null
         or new.work_started_by is not null
         or new.completion_requested_at is not null
         or new.completion_requested_by is not null
         or new.completed_at is not null
         or new.completed_by is not null then
        raise exception 'Project lifecycle fields are managed by guarded workflows' using errcode='42501';
      end if;
    elsif tg_op='UPDATE' then
      if new.status is distinct from old.status
         and new.status in ('open','hired','in_progress','completed') then
        raise exception 'Project lifecycle transitions must use the guarded workflow' using errcode='42501';
      end if;
      if new.hired_vendor_id is distinct from old.hired_vendor_id
         or new.hired_at is distinct from old.hired_at
         or new.work_started_at is distinct from old.work_started_at
         or new.work_started_by is distinct from old.work_started_by
         or new.completion_requested_at is distinct from old.completion_requested_at
         or new.completion_requested_by is distinct from old.completion_requested_by
         or new.completed_at is distinct from old.completed_at
         or new.completed_by is distinct from old.completed_by then
        raise exception 'Project lifecycle fields are managed by guarded workflows' using errcode='42501';
      end if;
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists kb_projects_status_write_guard on public.projects;
create trigger kb_projects_status_write_guard
before insert or update of status,hired_vendor_id,hired_at,work_started_at,work_started_by,completion_requested_at,completion_requested_by,completed_at,completed_by
on public.projects
for each row execute function public.kb_guard_project_status_writes();

create or replace function public.marketplace_service_transition_project(
  p_project_id uuid,
  p_action text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_action text := lower(btrim(coalesce(p_action,'')));
  v_note text := nullif(btrim(coalesce(p_note,'')), '');
  v_project public.projects%rowtype;
  v_is_admin boolean := false;
  v_is_church boolean := false;
  v_is_vendor boolean := false;
  v_from_status text;
  v_event_kind text;
  v_event_title text;
  v_event_meta jsonb := '{}'::jsonb;
  v_idempotent boolean := false;
begin
  if v_uid is null then
    raise exception 'Sign in required.' using errcode='42501';
  end if;
  if p_project_id is null then
    raise exception 'Project is required.' using errcode='22023';
  end if;
  if char_length(coalesce(v_note,'')) > 500 then
    raise exception 'Lifecycle note must be 500 characters or fewer.' using errcode='22023';
  end if;

  v_is_admin := public.kb_is_platform_admin();
  select * into v_project from public.projects where id=p_project_id for update;
  if not found then
    raise exception 'Project not found.' using errcode='P0002';
  end if;

  v_from_status := lower(coalesce(v_project.status,''));
  v_is_church := v_project.church_id = v_uid;
  v_is_vendor := v_project.hired_vendor_id = v_uid;

  if not (v_is_admin or v_is_church or v_is_vendor) then
    raise exception 'Only the posting church, hired vendor, or platform admin can manage this project lifecycle.' using errcode='42501';
  end if;

  case v_action
    when 'start' then
      if v_project.hired_vendor_id is null then
        raise exception 'A vendor must be hired before work can start.' using errcode='P0001';
      end if;
      if v_from_status='in_progress' then
        v_idempotent := true;
      elsif v_from_status<>'hired' then
        raise exception 'Only a hired project can move into progress.' using errcode='P0001';
      else
        update public.projects
        set status='in_progress',
            work_started_at=coalesce(work_started_at,now()),
            work_started_by=coalesce(work_started_by,v_uid),
            completion_requested_at=null,
            completion_requested_by=null,
            completed_at=null,
            completed_by=null
        where id=v_project.id
        returning * into v_project;
        v_event_kind := 'project_started';
        v_event_title := 'Project work started';
      end if;

    when 'request_completion' then
      if not (v_is_vendor or v_is_admin) then
        raise exception 'Only the hired vendor can request project completion.' using errcode='42501';
      end if;
      if v_from_status<>'in_progress' then
        raise exception 'Completion can only be requested while work is in progress.' using errcode='P0001';
      end if;
      if v_project.completion_requested_at is not null then
        v_idempotent := true;
      else
        update public.projects
        set completion_requested_at=now(),
            completion_requested_by=v_uid
        where id=v_project.id
        returning * into v_project;
        v_event_kind := 'completion_requested';
        v_event_title := 'Vendor requested project completion';
        if v_project.church_id is not null then
          insert into public.notifications(user_id,type,body,meta)
          values(
            v_project.church_id,
            'project_completion_requested',
            'Your vendor says ' || coalesce(v_project.title,'this project') || ' is ready for completion review.',
            jsonb_build_object('project_id',v_project.id,'actor_user_id',v_uid)
          );
        end if;
      end if;

    when 'cancel_completion_request' then
      if not (v_is_vendor or v_is_admin) then
        raise exception 'Only the hired vendor can withdraw a completion request.' using errcode='42501';
      end if;
      if v_from_status<>'in_progress' then
        raise exception 'Completion requests can only be changed while work is in progress.' using errcode='P0001';
      end if;
      if v_project.completion_requested_at is null then
        v_idempotent := true;
      else
        update public.projects
        set completion_requested_at=null,
            completion_requested_by=null
        where id=v_project.id
        returning * into v_project;
        v_event_kind := 'completion_request_withdrawn';
        v_event_title := 'Completion request withdrawn';
      end if;

    when 'request_changes' then
      if not (v_is_church or v_is_admin) then
        raise exception 'Only the posting church can request changes before completion.' using errcode='42501';
      end if;
      if v_from_status<>'in_progress' or v_project.completion_requested_at is null then
        raise exception 'There is no completion request waiting for church review.' using errcode='P0001';
      end if;
      if not v_is_admin and char_length(coalesce(v_note,'')) < 3 then
        raise exception 'Add a short note explaining what still needs attention.' using errcode='22023';
      end if;
      update public.projects
      set completion_requested_at=null,
          completion_requested_by=null
      where id=v_project.id
      returning * into v_project;
      v_event_kind := 'completion_changes_requested';
      v_event_title := 'Church requested changes before completion';
      if v_project.hired_vendor_id is not null then
        insert into public.notifications(user_id,type,body,meta)
        values(
          v_project.hired_vendor_id,
          'project_completion_changes_requested',
          'The church requested changes before completing ' || coalesce(v_project.title,'the project') || '.',
          jsonb_build_object('project_id',v_project.id,'actor_user_id',v_uid,'note',v_note)
        );
      end if;

    when 'confirm_completion' then
      if not (v_is_church or v_is_admin) then
        raise exception 'Only the posting church can confirm project completion.' using errcode='42501';
      end if;
      if v_from_status='completed' then
        v_idempotent := true;
      elsif v_from_status<>'in_progress' then
        raise exception 'Only an in-progress project can be completed.' using errcode='P0001';
      elsif v_project.completion_requested_at is null and not v_is_admin then
        raise exception 'The hired vendor must request completion before the church can confirm it.' using errcode='P0001';
      else
        update public.projects
        set status='completed',
            completed_at=coalesce(completed_at,now()),
            completed_by=coalesce(completed_by,v_uid)
        where id=v_project.id
        returning * into v_project;

        insert into public.project_ops(project_id,church_id,vendor_user_id,ops_state,updated_by)
        values(
          v_project.id,
          v_project.church_id,
          v_project.hired_vendor_id,
          jsonb_build_object('closeout',jsonb_build_object('status','completed','reviewRequested',true,'finalReview','requested')),
          v_uid
        )
        on conflict(project_id) do update
        set ops_state=jsonb_set(
              coalesce(public.project_ops.ops_state,'{}'::jsonb),
              '{closeout}',
              coalesce(public.project_ops.ops_state->'closeout','{}'::jsonb)
                || jsonb_build_object('status','completed','reviewRequested',true,'finalReview','requested'),
              true
            ),
            updated_by=v_uid;

        v_event_kind := 'project_completed';
        v_event_title := 'Project completion confirmed';
        if v_project.hired_vendor_id is not null then
          insert into public.notifications(user_id,type,body,meta)
          values(
            v_project.hired_vendor_id,
            'project_completed',
            'The church confirmed completion of ' || coalesce(v_project.title,'your project') || '.',
            jsonb_build_object('project_id',v_project.id,'actor_user_id',v_uid)
          );
        end if;
      end if;

    when 'reopen' then
      if not v_is_admin then
        raise exception 'Only a platform admin can reopen a completed project.' using errcode='42501';
      end if;
      if char_length(coalesce(v_note,'')) < 5 then
        raise exception 'Admin reopen requires a reason of at least 5 characters.' using errcode='22023';
      end if;
      if v_from_status='in_progress' then
        v_idempotent := true;
      elsif v_from_status<>'completed' then
        raise exception 'Only a completed project can be reopened.' using errcode='P0001';
      else
        update public.projects
        set status='in_progress',
            completion_requested_at=null,
            completion_requested_by=null,
            completed_at=null,
            completed_by=null,
            work_started_at=coalesce(work_started_at,now()),
            work_started_by=coalesce(work_started_by,v_uid)
        where id=v_project.id
        returning * into v_project;

        update public.project_ops
        set ops_state=jsonb_set(
              coalesce(ops_state,'{}'::jsonb),
              '{closeout}',
              coalesce(ops_state->'closeout','{}'::jsonb)
                || jsonb_build_object('status','open','reviewRequested',false),
              true
            ),
            updated_by=v_uid
        where project_id=v_project.id;

        v_event_kind := 'project_reopened';
        v_event_title := 'Project reopened by platform admin';
      end if;

    else
      raise exception 'Unsupported project lifecycle action.' using errcode='22023';
  end case;

  if v_event_kind is not null then
    v_event_meta := jsonb_build_object(
      'action',v_action,
      'from_status',v_from_status,
      'to_status',lower(coalesce(v_project.status,'')),
      'actor_role',case when v_is_admin then 'admin' when v_is_church then 'church' when v_is_vendor then 'vendor' else 'unknown' end
    );
    if v_note is not null then v_event_meta := v_event_meta || jsonb_build_object('note',v_note); end if;

    insert into public.project_activity_feed(project_id,church_id,actor_user_id,vendor_user_id,kind,title,body,meta)
    values(
      v_project.id,
      v_project.church_id,
      v_uid,
      v_project.hired_vendor_id,
      v_event_kind,
      v_event_title,
      v_note,
      v_event_meta
    );
  end if;

  return to_jsonb(v_project) || jsonb_build_object('action',v_action,'idempotent',v_idempotent);
end;
$function$;

revoke all on function public.marketplace_service_transition_project(uuid,text,text) from public, anon;
grant execute on function public.marketplace_service_transition_project(uuid,text,text) to authenticated;

create or replace function public.confirm_hire(p_bid_id uuid, p_project_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_bid public.bids%rowtype;
  v_project public.projects%rowtype;
  v_vendor public.vendors%rowtype;
  v_conversation_id uuid;
  v_vendor_tier text;
  v_fee numeric;
begin
  if v_user_id is null then
    raise exception using errcode='42501', message='Sign in to hire a vendor.';
  end if;
  if p_bid_id is null or p_project_id is null then
    raise exception using errcode='22023', message='Bid and project are required.';
  end if;

  select p.* into v_project from public.projects p
  where p.id=p_project_id for update;
  if not found then
    raise exception using errcode='P0002', message='Project not found.';
  end if;
  if v_project.church_id is distinct from v_user_id then
    raise exception using errcode='42501', message='Only the posting church may hire for this project.';
  end if;
  if lower(coalesce(v_project.status,'')) <> 'open' or v_project.hired_vendor_id is not null then
    raise exception using errcode='P0001', message='This project is not eligible for hiring.';
  end if;

  select b.* into v_bid from public.bids b
  where b.id=p_bid_id and b.project_id=p_project_id for update;
  if not found then
    raise exception using errcode='P0002', message='Bid not found for this project.';
  end if;
  if lower(coalesce(v_bid.status,'')) not in ('pending','under_review') then
    raise exception using errcode='P0001', message='This bid is not eligible for hiring.';
  end if;
  if v_bid.amount is null or v_bid.amount <= 0 then
    raise exception using errcode='22023', message='The bid amount is invalid.';
  end if;

  select v.* into v_vendor from public.vendors v where v.user_id=v_bid.vendor_id limit 1;
  if not found
     or coalesce(v_vendor.suspended,false)
     or not (
       lower(coalesce(v_vendor.verification_status,''))='approved'
       or (v_vendor.verification_status is null and coalesce(v_vendor.verified,false))
     ) then
    raise exception using errcode='42501', message='The vendor is not eligible to be hired.';
  end if;

  if exists(select 1 from public.hire_confirmations h where h.bid_id=p_bid_id) then
    raise exception using errcode='23505', message='A hire confirmation already exists for this bid.';
  end if;

  v_vendor_tier := v_vendor.tier;
  v_fee := public.kb_compute_platform_fee(v_bid.amount, v_vendor_tier);

  insert into public.hire_confirmations(
    project_id,bid_id,church_id,vendor_id,vendor_name,project_title,
    amount,bid_amount,platform_fee,status,created_at
  ) values (
    v_project.id,v_bid.id,v_project.church_id,v_bid.vendor_id,
    coalesce(v_bid.vendor_name,v_vendor.name,''),coalesce(v_project.title,''),
    v_bid.amount,v_bid.amount,v_fee,'pending_payment',now()
  );

  update public.bids set status='hired' where id=v_bid.id;
  update public.bids set status='declined'
  where project_id=v_project.id and id<>v_bid.id
    and lower(coalesce(status,'')) in ('pending','under_review');
  update public.projects
  set status='hired',
      hired_vendor_id=v_bid.vendor_id,
      hired_at=coalesce(hired_at,now()),
      work_started_at=null,
      work_started_by=null,
      completion_requested_at=null,
      completion_requested_by=null,
      completed_at=null,
      completed_by=null
  where id=v_project.id
  returning * into v_project;

  select c.id into v_conversation_id
  from public.conversations c
  where c.church_id=v_project.church_id
    and c.vendor_id=v_bid.vendor_id
    and c.project_id=v_project.id
  order by c.id limit 1;

  if v_conversation_id is null then
    insert into public.conversations(church_id,vendor_id,project_id)
    values(v_project.church_id,v_bid.vendor_id,v_project.id)
    returning id into v_conversation_id;
  end if;

  insert into public.notifications(user_id,type,body,meta)
  values(
    v_bid.vendor_id,'bid_accepted',
    'You were hired for ' || coalesce(v_project.title,'a project'),
    jsonb_build_object('project_id',v_project.id,'bid_id',v_bid.id,'conversation_id',v_conversation_id,'project_title',v_project.title)
  );

  insert into public.project_activity_feed(project_id,church_id,actor_user_id,vendor_user_id,kind,title,body,meta)
  values(
    v_project.id,
    v_project.church_id,
    v_user_id,
    v_bid.vendor_id,
    'vendor_hired',
    'Vendor hired',
    null,
    jsonb_build_object('from_status','open','to_status','hired','bid_id',v_bid.id)
  );

  return jsonb_build_object('success',true,'conversation_id',v_conversation_id,'project',to_jsonb(v_project));
exception when unique_violation then
  raise exception using errcode='23505', message='This hire has already been confirmed.';
end;
$function$;

comment on function public.marketplace_service_transition_project(uuid,text,text) is
'Guarded post-hire lifecycle contract. Payment state remains separate from projects.status.';
