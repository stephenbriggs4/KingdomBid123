create or replace function public.marketplace_service_submit_bid(
  p_project_id uuid,
  p_amount numeric,
  p_timeline text,
  p_cover_letter text default '',
  p_milestones jsonb default '[]'::jsonb
)
returns public.bids
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_vendor public.vendors%rowtype;
  v_project public.projects%rowtype;
  v_bid public.bids%rowtype;
  v_timeline text := btrim(coalesce(p_timeline, ''));
  v_cover_letter text := btrim(coalesce(p_cover_letter, ''));
  v_milestones jsonb := coalesce(p_milestones, '[]'::jsonb);
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Sign in to submit a bid.';
  end if;
  if not exists (
    select 1 from public.platform_settings s
    where s.key = 'bidding_enabled'
      and lower(btrim(coalesce(s.value, ''))) in ('true', '1', 'yes', 'on')
  ) then
    raise exception using errcode = '42501', message = 'Bidding is not enabled.';
  end if;
  if not exists (
    select 1 from auth.users u
    where u.id = v_user_id and u.email_confirmed_at is not null
  ) then
    raise exception using errcode = '42501', message = 'Confirm your email before submitting a bid.';
  end if;
  select v.* into v_vendor from public.vendors v where v.user_id = v_user_id limit 1;
  if not found then
    raise exception using errcode = '42501', message = 'Only vendor accounts can submit bids.';
  end if;
  if coalesce(v_vendor.suspended, false) then
    raise exception using errcode = '42501', message = 'This vendor account is suspended.';
  end if;
  if not (
    lower(coalesce(v_vendor.verification_status, '')) = 'approved'
    or (v_vendor.verification_status is null and coalesce(v_vendor.verified, false))
  ) then
    raise exception using errcode = '42501', message = 'Vendor approval is required before bidding.';
  end if;
  select p.* into v_project from public.projects p where p.id = p_project_id;
  if not found or lower(coalesce(v_project.status, '')) <> 'open' then
    raise exception using errcode = 'P0001', message = 'This project is not accepting bids.';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 10000000 then
    raise exception using errcode = '22023', message = 'Bid amount must be greater than zero and no more than 10000000.';
  end if;
  if v_timeline = '' or char_length(v_timeline) > 200 then
    raise exception using errcode = '22023', message = 'Bid timeline is required and must be 200 characters or fewer.';
  end if;
  if char_length(v_cover_letter) > 1500 then
    raise exception using errcode = '22023', message = 'Cover letter must be 1500 characters or fewer.';
  end if;
  if jsonb_typeof(v_milestones) <> 'array'
     or jsonb_array_length(v_milestones) > 25
     or octet_length(v_milestones::text) > 50000 then
    raise exception using errcode = '22023', message = 'Bid milestones are invalid.';
  end if;
  begin
    insert into public.bids (
      project_id, church_id, vendor_id, vendor_user_id,
      vendor_name, vendor_emoji, category,
      amount, timeline, cover_letter, milestones,
      status, submitted_at
    ) values (
      v_project.id, v_project.church_id, v_user_id, v_user_id,
      coalesce(nullif(btrim(v_vendor.name), ''), 'Unknown Vendor'),
      coalesce(v_vendor.emoji, ''), coalesce(v_vendor.category, ''),
      p_amount, v_timeline, v_cover_letter, v_milestones,
      'pending', now()
    )
    returning * into v_bid;
  exception when unique_violation then
    raise exception using errcode = '23505', message = 'A bid already exists for this vendor and project.';
  end;
  return v_bid;
end;
$$;
revoke all on function public.marketplace_service_submit_bid(uuid,numeric,text,text,jsonb) from public, anon;
grant execute on function public.marketplace_service_submit_bid(uuid,numeric,text,text,jsonb) to authenticated, service_role;
