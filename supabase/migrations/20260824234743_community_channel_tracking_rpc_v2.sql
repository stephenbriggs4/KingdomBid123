create or replace function public.kb_growth_drops_for_group_v2(p_group_id uuid)
returns table(
  id uuid,
  audience_type text,
  status text,
  approval_status text,
  campaign_key text,
  draft_content text,
  response_count integer,
  review_requested_at timestamptz,
  approved_at timestamptz,
  link_generated_at timestamptz,
  posted_at timestamptz,
  tracked_signup_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not coalesce(public.kb_is_platform_admin(), false) then
    raise exception 'Growth content records require platform administrator access' using errcode = '42501';
  end if;
  return query
  select d.id,d.audience_type,d.status,d.approval_status,d.campaign_key,d.draft_content,d.response_count,
    d.review_requested_at,d.approved_at,d.link_generated_at,d.posted_at,
    (select count(*)::bigint from public.waitlist w where w.drop_id=d.id and w.attribution_verified is true)
  from public.growth_drops d
  where d.group_id=p_group_id
  order by d.created_at desc,d.id;
end;
$function$;
revoke all on function public.kb_growth_drops_for_group_v2(uuid) from public,anon;
grant execute on function public.kb_growth_drops_for_group_v2(uuid) to authenticated,service_role;

create or replace function public.kb_admin_create_growth_content_draft_v0(
  p_group_id uuid,
  p_audience_type text,
  p_draft_content text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare v_group public.groups%rowtype; v_drop public.growth_drops%rowtype; v_audience text:=lower(trim(coalesce(p_audience_type,'')));
begin
  if not coalesce(public.kb_is_platform_admin(),false) then raise exception 'Content drafts require platform administrator access' using errcode='42501'; end if;
  if v_audience not in ('church','vendor') then raise exception 'Audience must be church or vendor' using errcode='22023'; end if;
  select * into v_group from public.groups where id=p_group_id;
  if not found then raise exception 'Group not found' using errcode='P0002'; end if;
  insert into public.growth_drops(platform,group_name,group_id,audience_type,campaign_key,status,approval_status,draft_content,content_summary,leads_generated,response_count)
  values(v_group.platform,v_group.name,v_group.id,v_audience,case when v_audience='church' then 'quick_match_brief' else 'charter_vendor' end,'draft','draft',nullif(trim(coalesce(p_draft_content,'')),''),'Human-reviewed Growth content draft',0,0)
  returning * into v_drop;
  return to_jsonb(v_drop);
end;
$function$;
revoke all on function public.kb_admin_create_growth_content_draft_v0(uuid,text,text) from public,anon;
grant execute on function public.kb_admin_create_growth_content_draft_v0(uuid,text,text) to authenticated,service_role;

create or replace function public.kb_admin_mark_growth_drop_link_generated_v0(p_drop_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare v_drop public.growth_drops%rowtype;
begin
  if not coalesce(public.kb_is_platform_admin(),false) then raise exception 'Tracked-link generation requires platform administrator access' using errcode='42501'; end if;
  select * into v_drop from public.growth_drops where id=p_drop_id for update;
  if not found then raise exception 'Content record not found' using errcode='P0002'; end if;
  if v_drop.approval_status <> 'approved' then raise exception 'Only approved content can generate a tracked link' using errcode='22023'; end if;
  update public.growth_drops set status='link_generated',link_generated_at=coalesce(link_generated_at,clock_timestamp()) where id=p_drop_id returning * into v_drop;
  return to_jsonb(v_drop);
end;
$function$;
revoke all on function public.kb_admin_mark_growth_drop_link_generated_v0(uuid) from public,anon;
grant execute on function public.kb_admin_mark_growth_drop_link_generated_v0(uuid) to authenticated,service_role;

create or replace function public.kb_admin_record_growth_drop_responses_v0(p_drop_id uuid,p_response_count integer)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare v_drop public.growth_drops%rowtype;
begin
  if not coalesce(public.kb_is_platform_admin(),false) then raise exception 'Response tracking requires platform administrator access' using errcode='42501'; end if;
  if p_response_count < 0 then raise exception 'Response count cannot be negative' using errcode='22023'; end if;
  select * into v_drop from public.growth_drops where id=p_drop_id for update;
  if not found then raise exception 'Content record not found' using errcode='P0002'; end if;
  if v_drop.status <> 'posted' then raise exception 'Responses can only be logged after a post is marked posted' using errcode='22023'; end if;
  update public.growth_drops set response_count=p_response_count where id=p_drop_id returning * into v_drop;
  return to_jsonb(v_drop);
end;
$function$;
revoke all on function public.kb_admin_record_growth_drop_responses_v0(uuid,integer) from public,anon;
grant execute on function public.kb_admin_record_growth_drop_responses_v0(uuid,integer) to authenticated,service_role;
