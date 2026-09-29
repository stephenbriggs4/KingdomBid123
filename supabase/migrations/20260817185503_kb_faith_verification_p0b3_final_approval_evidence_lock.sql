drop policy if exists kb_vendor_verifications_owner_insert_pending on public.vendor_verifications;

create or replace function public.kb_admin_review_faith_verification(
  p_verification_id uuid,
  p_decision text,
  p_reason text default null
)
returns table(
  verification_id uuid,
  vendor_id uuid,
  user_id uuid,
  vendor_name text,
  application_status text,
  vendor_verified boolean,
  changed boolean
)
language plpgsql
security definer
set search_path to 'public','auth','extensions'
as $$
declare
  v_admin_id uuid := auth.uid();
  v_decision text := lower(btrim(coalesce(p_decision,'')));
  v_reason text := nullif(btrim(coalesce(p_reason,'')),'');
  v_current_status text;
  v_reconciled_partial boolean := false;
  v_has_complete_evidence boolean := false;
  v_app_before public.vendor_verifications%rowtype;
  v_app_after public.vendor_verifications%rowtype;
  v_vendor_before public.vendors%rowtype;
  v_vendor_after public.vendors%rowtype;
begin
  if v_admin_id is null or not public.kb_is_platform_admin() then
    raise exception 'not authorized' using errcode='42501';
  end if;
  if p_verification_id is null then
    raise exception 'verification id is required' using errcode='22023';
  end if;
  if v_decision not in ('approved','rejected') then
    raise exception 'decision must be approved or rejected' using errcode='22023';
  end if;
  if v_decision='rejected' and (v_reason is null or char_length(v_reason) < 20) then
    raise exception 'a meaningful rejection summary of at least 20 characters is required' using errcode='22023';
  end if;
  if char_length(coalesce(v_reason,'')) > 1000 then
    raise exception 'rejection reason is too long' using errcode='22023';
  end if;

  select * into v_app_before
  from public.vendor_verifications
  where id=p_verification_id
  for update;
  if not found then
    raise exception 'verification application % not found', p_verification_id using errcode='P0002';
  end if;
  if v_app_before.vendor_id is null then
    raise exception 'verification application % has no vendor id', p_verification_id using errcode='23502';
  end if;

  select * into v_vendor_before
  from public.vendors
  where id=v_app_before.vendor_id
  for update;
  if not found then
    raise exception 'vendor % for verification application % not found', v_app_before.vendor_id,p_verification_id using errcode='P0002';
  end if;
  if v_app_before.user_id is distinct from v_vendor_before.user_id then
    raise exception 'verification application identity does not match vendor owner' using errcode='23514';
  end if;

  v_current_status := lower(btrim(coalesce(v_app_before.status,'pending')));

  if v_decision='approved' then
    if lower(btrim(coalesce(v_vendor_before.verification_status,''))) <> 'approved' then
      raise exception 'vendor must be Marketplace Approved before Faith Verification approval' using errcode='P0001';
    end if;
    if coalesce(v_vendor_before.suspended,false) then
      raise exception 'suspended vendors cannot receive Faith Verification approval' using errcode='P0001';
    end if;

    select exists(
      select 1
      from public.vendor_references vr
      join public.vendor_reference_responses vrr on vrr.reference_id=vr.id
      where vr.verification_id=v_app_before.id
        and vr.purpose='faith_community'
        and vr.status='completed'
        and vr.completed_at is not null
        and vrr.christian_identity_confirmed is not null
        and vrr.would_recommend is not null
        and char_length(btrim(coalesce(vrr.relationship_context,''))) >= 20
        and char_length(btrim(coalesce(vrr.faith_alignment,''))) >= 10
    ) into v_has_complete_evidence;

    if not v_has_complete_evidence then
      raise exception 'completed Christian-community reference evidence is required before Faith Verification approval' using errcode='P0001';
    end if;
  end if;

  if v_current_status=v_decision then
    if v_decision='approved' and not coalesce(v_vendor_before.verified,false) then
      update public.vendors
         set verified=true,
             verified_at=coalesce(verified_at,now())
       where id=v_vendor_before.id
       returning * into v_vendor_after;
      v_app_after := v_app_before;
      v_reconciled_partial := true;
    else
      return query
      select v_app_before.id,v_vendor_before.id,v_vendor_before.user_id,
             v_vendor_before.name,v_app_before.status,
             coalesce(v_vendor_before.verified,false),false;
      return;
    end if;
  else
    if v_current_status in ('approved','rejected') then
      raise exception 'verification application was already finalized as %',v_current_status using errcode='P0001';
    end if;

    update public.vendor_verifications
       set status=v_decision,
           reviewed_at=now()
     where id=p_verification_id
     returning * into v_app_after;

    if v_decision='approved' then
      update public.vendors
         set verified=true,
             verified_at=coalesce(verified_at,now())
       where id=v_vendor_before.id
       returning * into v_vendor_after;
    else
      v_vendor_after := v_vendor_before;
    end if;
  end if;

  insert into public.admin_audit_log(admin_id,action,target_table,target_id,reason,before_snapshot,after_snapshot,meta)
  values(
    v_admin_id,
    case when v_decision='approved' then 'approve_verification' else 'reject_verification' end,
    'vendors',v_vendor_before.id::text,
    case when v_decision='rejected' then v_reason else null end,
    jsonb_build_object('verification_id',v_app_before.id,'application_status',v_app_before.status,'reviewed_at',v_app_before.reviewed_at,'vendor_id',v_vendor_before.id,'vendor_verified',coalesce(v_vendor_before.verified,false),'vendor_verified_at',v_vendor_before.verified_at),
    jsonb_build_object('verification_id',v_app_after.id,'application_status',v_app_after.status,'reviewed_at',v_app_after.reviewed_at,'vendor_id',v_vendor_after.id,'vendor_verified',coalesce(v_vendor_after.verified,false),'vendor_verified_at',v_vendor_after.verified_at),
    jsonb_build_object('decision',v_decision,'vendor_name',v_vendor_after.name,'tier_goal',v_app_after.tier_goal,'reconciled_partial_state',v_reconciled_partial,'evidence_gate_enforced',v_decision='approved','source','kb_admin_review_faith_verification')
  );

  if v_vendor_after.user_id is not null then
    insert into public.notifications(user_id,type,title,body,read,created_at,meta)
    values(
      v_vendor_after.user_id,
      case when v_decision='approved' then 'verification_approved' else 'verification_rejected' end,
      case when v_decision='approved' then 'Your Faith-Verified application was approved' else 'Faith Verified application not approved' end,
      case when v_decision='approved'
        then 'Your vendor profile now carries FaithBid''s Faith-Verified trust status.'
        else 'Your Faith Verified application was not approved. Reason: '||v_reason end,
      false,now(),
      jsonb_build_object('verification_id',v_app_after.id,'vendor_id',v_vendor_after.id,'decision',v_decision,'source','kb_admin_review_faith_verification')
    );
  end if;

  return query
  select v_app_after.id,v_vendor_after.id,v_vendor_after.user_id,
         v_vendor_after.name,v_app_after.status,
         coalesce(v_vendor_after.verified,false),true;
end
$$;

comment on function public.kb_admin_review_faith_verification(uuid,text,text) is
  'P0-B3 Faith Verification review authority. New approval requires strict Marketplace Approved admission, non-suspended vendor state, and completed linked faith-community evidence. Negative respondent answers remain valid evidence. Rejection requires a meaningful nonverbatim admin summary (minimum 20 characters). Retry repair rechecks the same approval gates.';
