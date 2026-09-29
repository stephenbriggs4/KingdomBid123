
create or replace function private.kb_project_activity_immutable_guard()
returns trigger
language plpgsql
security invoker
set search_path=''
as $$
begin
  if current_user in ('postgres','service_role','supabase_admin')
     or public.kb_is_platform_admin() then
    if tg_op='DELETE' then return old; end if;
    return new;
  end if;
  raise exception 'Project activity history is append-only.'
    using errcode='42501';
end;
$$;

drop trigger if exists kb_project_activity_immutable_guard_tg
on public.project_activity_feed;
create trigger kb_project_activity_immutable_guard_tg
before update or delete on public.project_activity_feed
for each row execute function private.kb_project_activity_immutable_guard();

create or replace function public.kb_append_project_activity(
  p_project_id uuid,
  p_kind text,
  p_title text,
  p_body text default null,
  p_meta jsonb default '{}'::jsonb,
  p_vendor_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid := auth.uid();
  v_project public.projects%rowtype;
  v_vendor_user_id uuid;
  v_id uuid;
  v_is_admin boolean := false;
  v_is_related_vendor boolean := false;
begin
  if v_actor is null then
    raise exception 'Sign in to add project activity.' using errcode='42501';
  end if;
  if p_project_id is null then
    raise exception 'Project is required.' using errcode='22023';
  end if;

  select * into v_project
  from public.projects
  where id=p_project_id;

  if not found then
    raise exception 'Project not found.' using errcode='P0002';
  end if;

  v_is_admin := public.kb_is_platform_admin();
  v_is_related_vendor :=
       v_actor=v_project.hired_vendor_id
    or exists(select 1 from public.bids b
              where b.project_id=v_project.id and b.vendor_id=v_actor)
    or exists(select 1 from public.project_vendor_links l
              where l.project_id=v_project.id and l.vendor_user_id=v_actor);

  if not v_is_admin and v_actor<>v_project.church_id and not v_is_related_vendor then
    raise exception 'You are not a participant in this project.'
      using errcode='42501';
  end if;

  if char_length(btrim(coalesce(p_kind,''))) not between 1 and 64 then
    raise exception 'Activity kind must be between 1 and 64 characters.'
      using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_title,''))) not between 1 and 240 then
    raise exception 'Activity title must be between 1 and 240 characters.'
      using errcode='22023';
  end if;
  if p_body is not null and char_length(p_body)>2000 then
    raise exception 'Activity body is too long.' using errcode='22023';
  end if;
  if pg_column_size(coalesce(p_meta,'{}'::jsonb))>65536 then
    raise exception 'Activity metadata is too large.' using errcode='22023';
  end if;

  if v_actor<>v_project.church_id and not v_is_admin then
    v_vendor_user_id := v_actor;
  else
    v_vendor_user_id := p_vendor_user_id;
    if v_vendor_user_id is not null
       and not exists(select 1 from public.vendors v where v.user_id=v_vendor_user_id) then
      raise exception 'Target vendor not found.' using errcode='P0002';
    end if;
  end if;

  insert into public.project_activity_feed(
    project_id,church_id,actor_user_id,vendor_user_id,kind,title,body,meta
  ) values (
    v_project.id,v_project.church_id,v_actor,v_vendor_user_id,
    btrim(p_kind),btrim(p_title),p_body,coalesce(p_meta,'{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.kb_append_project_activity(uuid,text,text,text,jsonb,uuid) from public,anon;
grant execute on function public.kb_append_project_activity(uuid,text,text,text,jsonb,uuid) to authenticated,service_role;

drop policy if exists kb_project_activity_feed_involved on public.project_activity_feed;
drop policy if exists kb_project_activity_feed_select_involved on public.project_activity_feed;
create policy kb_project_activity_feed_select_involved
on public.project_activity_feed
for select to authenticated
using (
  church_id=(select auth.uid())
  or actor_user_id=(select auth.uid())
  or vendor_user_id=(select auth.uid())
  or (select public.kb_is_platform_admin())
);

revoke all on table public.project_activity_feed from anon;
revoke insert,update,delete,truncate,references,trigger
on table public.project_activity_feed from authenticated;
grant select on table public.project_activity_feed to authenticated;
grant all on table public.project_activity_feed to service_role;
