
CREATE OR REPLACE FUNCTION public.confirm_hire(p_bid_id uuid, p_project_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_bid public.bids%rowtype;
  v_project public.projects%rowtype;
  v_vendor public.vendors%rowtype;
  v_conversation_id uuid;
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

  insert into public.hire_confirmations(
    project_id,bid_id,church_id,vendor_id,vendor_name,project_title,
    amount,bid_amount,platform_fee,status,created_at
  ) values (
    v_project.id,v_bid.id,v_project.church_id,v_bid.vendor_id,
    coalesce(v_bid.vendor_name,v_vendor.name,''),coalesce(v_project.title,''),
    v_bid.amount,v_bid.amount,null,'recorded',now()
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

  if coalesce((select np.bid_accepted from public.notification_prefs np where np.user_id = v_bid.vendor_id), true) then
    insert into public.notifications(user_id,type,body,meta)
    values(
      v_bid.vendor_id,'bid_accepted',
      'You were hired for ' || coalesce(v_project.title,'a project'),
      jsonb_build_object('project_id',v_project.id,'bid_id',v_bid.id,'conversation_id',v_conversation_id,'project_title',v_project.title)
    );
  end if;

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
$function$
