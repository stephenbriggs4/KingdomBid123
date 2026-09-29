create table if not exists public.project_milestone_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_type text not null check (task_type in ('award_protocol','review_request','referral_follow_up')),
  triggered_by_stage text not null check (triggered_by_stage in ('award','completed')),
  title text not null,
  reason text not null,
  status text not null default 'open' check (status in ('open','completed','dismissed')),
  due_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  completed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, task_type)
);

comment on table public.project_milestone_tasks is
'Internal, human-owned founder tasks created only from real project milestone evidence. No row sends a message, review request, referral request, or payment instruction.';
comment on column public.project_milestone_tasks.due_at is
'Nullable by design. FaithBid does not invent a follow-up deadline when the project record has none.';

alter table public.project_milestone_tasks enable row level security;
drop policy if exists project_milestone_tasks_admin_all on public.project_milestone_tasks;
create policy project_milestone_tasks_admin_all on public.project_milestone_tasks
for all to authenticated
using (coalesce(public.kb_is_platform_admin(), false))
with check (coalesce(public.kb_is_platform_admin(), false));
revoke all on public.project_milestone_tasks from anon;
grant select,insert,update,delete on public.project_milestone_tasks to authenticated,service_role;

create or replace function private.kb_seed_real_project_milestone_tasks_v0()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.record_origin <> 'real' then return new; end if;

  if new.hired_vendor_id is not null
     or new.hired_at is not null
     or new.status in ('hired','in_progress','completed') then
    insert into public.project_milestone_tasks(project_id,task_type,triggered_by_stage,title,reason,evidence)
    values(
      new.id,
      'award_protocol',
      'award',
      'Run the manual transaction protocol',
      'A real project has an award signal. A founder must confirm award acknowledgment, work-start expectations, completion handling, fee tracking, and review eligibility without implying integrated payments.',
      jsonb_build_object('project_title',new.title,'project_status',new.status,'hired_vendor_id',new.hired_vendor_id,'hired_at',new.hired_at,'record_origin',new.record_origin)
    )
    on conflict(project_id,task_type) do nothing;
  end if;

  if new.completed_at is not null or new.status = 'completed' then
    insert into public.project_milestone_tasks(project_id,task_type,triggered_by_stage,title,reason,evidence)
    values
    (
      new.id,
      'review_request',
      'completed',
      'Prepare the verified review request',
      'A real project has a completion signal. A human should confirm review eligibility and then request feedback through the approved FaithBid flow.',
      jsonb_build_object('project_title',new.title,'project_status',new.status,'completed_at',new.completed_at,'record_origin',new.record_origin)
    ),
    (
      new.id,
      'referral_follow_up',
      'completed',
      'Prepare the referral follow-up',
      'A real project has a completion signal. A human may ask for an introduction or referral only after confirming the relationship and approved language.',
      jsonb_build_object('project_title',new.title,'project_status',new.status,'completed_at',new.completed_at,'record_origin',new.record_origin)
    )
    on conflict(project_id,task_type) do nothing;
  end if;
  return new;
end;
$function$;

drop trigger if exists kb_real_project_milestone_tasks_v0 on public.projects;
create trigger kb_real_project_milestone_tasks_v0
after insert or update of hired_vendor_id,hired_at,status,completed_at on public.projects
for each row execute function private.kb_seed_real_project_milestone_tasks_v0();

insert into public.project_milestone_tasks(project_id,task_type,triggered_by_stage,title,reason,evidence)
select p.id,'award_protocol','award','Run the manual transaction protocol',
'A real project has an award signal. A founder must confirm award acknowledgment, work-start expectations, completion handling, fee tracking, and review eligibility without implying integrated payments.',
jsonb_build_object('project_title',p.title,'project_status',p.status,'hired_vendor_id',p.hired_vendor_id,'hired_at',p.hired_at,'record_origin',p.record_origin)
from public.projects p
where p.record_origin='real' and (p.hired_vendor_id is not null or p.hired_at is not null or p.status in ('hired','in_progress','completed'))
on conflict(project_id,task_type) do nothing;

insert into public.project_milestone_tasks(project_id,task_type,triggered_by_stage,title,reason,evidence)
select p.id,t.task_type,'completed',t.title,t.reason,
jsonb_build_object('project_title',p.title,'project_status',p.status,'completed_at',p.completed_at,'record_origin',p.record_origin)
from public.projects p
cross join (values
 ('review_request'::text,'Prepare the verified review request'::text,'A real project has a completion signal. A human should confirm review eligibility and then request feedback through the approved FaithBid flow.'::text),
 ('referral_follow_up'::text,'Prepare the referral follow-up'::text,'A real project has a completion signal. A human may ask for an introduction or referral only after confirming the relationship and approved language.'::text)
) t(task_type,title,reason)
where p.record_origin='real' and (p.completed_at is not null or p.status='completed')
on conflict(project_id,task_type) do nothing;

create or replace function public.kb_admin_list_project_milestone_tasks_v0()
returns table(
  id uuid,
  project_id uuid,
  project_title text,
  task_type text,
  triggered_by_stage text,
  title text,
  reason text,
  status text,
  due_at timestamptz,
  evidence jsonb,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path=''
as $function$
begin
  if not coalesce(public.kb_is_platform_admin(),false) then
    raise exception 'Project milestone tasks require platform administrator access' using errcode='42501';
  end if;
  return query
  select t.id,t.project_id,p.title,t.task_type,t.triggered_by_stage,t.title,t.reason,t.status,t.due_at,t.evidence,t.created_at
  from public.project_milestone_tasks t
  join public.projects p on p.id=t.project_id and p.record_origin='real'
  order by case t.status when 'open' then 0 else 1 end, t.due_at nulls last, t.created_at, t.id;
end;
$function$;
revoke all on function public.kb_admin_list_project_milestone_tasks_v0() from public,anon;
grant execute on function public.kb_admin_list_project_milestone_tasks_v0() to authenticated,service_role;

create or replace function public.kb_admin_set_project_milestone_task_status_v0(p_task_id uuid,p_status text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare v_status text:=lower(trim(coalesce(p_status,''))); v_task public.project_milestone_tasks%rowtype;
begin
  if not coalesce(public.kb_is_platform_admin(),false) then
    raise exception 'Project milestone task updates require platform administrator access' using errcode='42501';
  end if;
  if v_status not in ('open','completed','dismissed') then raise exception 'Unsupported task status' using errcode='22023'; end if;
  update public.project_milestone_tasks
  set status=v_status,
      completed_at=case when v_status='completed' then clock_timestamp() else null end,
      completed_by=case when v_status='completed' then auth.uid() else null end,
      updated_at=clock_timestamp()
  where id=p_task_id
  returning * into v_task;
  if not found then raise exception 'Project milestone task not found' using errcode='P0002'; end if;
  return to_jsonb(v_task);
end;
$function$;
revoke all on function public.kb_admin_set_project_milestone_task_status_v0(uuid,text) from public,anon;
grant execute on function public.kb_admin_set_project_milestone_task_status_v0(uuid,text) to authenticated,service_role;

alter function public.kb_admin_get_founder_brief_v0(timestamptz)
rename to kb_admin_get_founder_brief_channel_20260824_v2;

create or replace function public.kb_admin_get_founder_brief_v0(p_as_of timestamptz default now())
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $function$
declare v_brief jsonb; v_metrics jsonb; v_task_actions jsonb; v_open bigint;
begin
  v_brief:=public.kb_admin_get_founder_brief_channel_20260824_v2(p_as_of);
  select count(*) into v_open from public.project_milestone_tasks t join public.projects p on p.id=t.project_id where p.record_origin='real' and t.status='open';
  v_metrics:=coalesce(v_brief->'metrics','{}'::jsonb) || jsonb_build_object(
    'open_project_milestone_tasks',jsonb_build_object('value',v_open,'status','available')
  );
  select coalesce(jsonb_agg(jsonb_build_object(
    'action_key','project-milestone-task:'||t.id::text,
    'action_type','project_milestone_task',
    'priority',case t.task_type when 'award_protocol' then 90 when 'review_request' then 82 else 74 end,
    'title',t.title,
    'reason',t.reason,
    'recommended_action',case t.task_type
      when 'award_protocol' then 'Open the real project, run the manual transaction protocol, and record each confirmed milestone.'
      when 'review_request' then 'Confirm completion and review eligibility, then use the approved human-reviewed request flow.'
      else 'Confirm the completed relationship and approved language before asking for any referral.'
    end,
    'entity_type','project',
    'entity_id',t.project_id,
    'evidence',t.evidence || jsonb_build_object('task_id',t.id,'task_type',t.task_type,'due_at',t.due_at),
    'destination','projects',
    'generated_by','project_milestone_tasks_v0'
  ) order by case t.task_type when 'award_protocol' then 0 when 'review_request' then 1 else 2 end,t.created_at,t.id),'[]'::jsonb)
  into v_task_actions
  from (
    select t.* from public.project_milestone_tasks t
    join public.projects p on p.id=t.project_id and p.record_origin='real'
    where t.status='open'
    order by case t.task_type when 'award_protocol' then 0 when 'review_request' then 1 else 2 end,t.created_at,t.id
    limit 6
  ) t;
  return v_brief || jsonb_build_object(
    'contract_version',2,
    'metrics',v_metrics,
    'actions',v_task_actions || coalesce(v_brief->'actions','[]'::jsonb)
  );
end;
$function$;
revoke all on function public.kb_admin_get_founder_brief_v0(timestamptz) from public,anon;
grant execute on function public.kb_admin_get_founder_brief_v0(timestamptz) to authenticated,service_role;
