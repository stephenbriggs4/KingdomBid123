-- FaithBid Prelaunch Beta Access Blueprint v1.5
-- Section 13, Step 12: narrow bid mutations and remove direct UPDATE access.

create or replace function public.marketplace_service_mutate_bid(
  p_bid_id uuid,
  p_action text,
  p_amount numeric default null,
  p_cover_letter text default null
)
returns public.bids
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_action text := lower(btrim(coalesce(p_action, '')));
  v_bid public.bids%rowtype;
  v_project public.projects%rowtype;
  v_cover_letter text := btrim(coalesce(p_cover_letter, ''));
begin
  if v_user_id is null then
    raise exception using errcode='42501', message='Sign in to update a bid.';
  end if;

  select b.* into v_bid from public.bids b where b.id=p_bid_id for update;
  if not found then
    raise exception using errcode='P0002', message='Bid not found.';
  end if;

  select p.* into v_project from public.projects p where p.id=v_bid.project_id;
  if not found then
    raise exception using errcode='P0002', message='Project not found.';
  end if;

  case v_action
    when 'edit' then
      if v_bid.vendor_id <> v_user_id or lower(coalesce(v_bid.status,'')) <> 'pending' then
        raise exception using errcode='42501', message='Only the vendor may edit a pending bid.';
      end if;
      if p_amount is null or p_amount <= 0 or p_amount > 10000000 then
        raise exception using errcode='22023', message='Bid amount must be greater than zero and no more than 10000000.';
      end if;
      if char_length(v_cover_letter) > 1500 then
        raise exception using errcode='22023', message='Cover letter must be 1500 characters or fewer.';
      end if;
      update public.bids set amount=p_amount, cover_letter=v_cover_letter
      where id=v_bid.id returning * into v_bid;

    when 'withdraw' then
      if v_bid.vendor_id <> v_user_id or lower(coalesce(v_bid.status,'')) not in ('pending','under_review') then
        raise exception using errcode='42501', message='Only the vendor may withdraw a pending or reviewed bid.';
      end if;
      update public.bids set status='withdrawn', withdrawn_at=now()
      where id=v_bid.id returning * into v_bid;

    when 'review' then
      if v_project.church_id <> v_user_id or lower(coalesce(v_bid.status,'')) <> 'pending' then
        raise exception using errcode='42501', message='Only the posting church may review a pending bid.';
      end if;
      update public.bids set status='under_review'
      where id=v_bid.id returning * into v_bid;

    when 'decline' then
      if v_project.church_id <> v_user_id or lower(coalesce(v_bid.status,'')) not in ('pending','under_review') then
        raise exception using errcode='42501', message='Only the posting church may decline a pending or reviewed bid.';
      end if;
      update public.bids set status='declined'
      where id=v_bid.id returning * into v_bid;

    else
      raise exception using errcode='22023', message='Unsupported bid action.';
  end case;

  return v_bid;
end;
$$;

revoke all on function public.marketplace_service_mutate_bid(uuid,text,numeric,text) from public, anon;
grant execute on function public.marketplace_service_mutate_bid(uuid,text,numeric,text) to authenticated, service_role;

revoke update, delete, truncate on table public.bids from anon, authenticated;
drop policy if exists "Project owners can update bids" on public.bids;
drop policy if exists "kb_bids_update_involved" on public.bids;
