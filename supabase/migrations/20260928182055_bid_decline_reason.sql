alter table public.bids add column if not exists decline_reason text;
alter table public.bids drop constraint if exists bids_decline_reason_len;
alter table public.bids add constraint bids_decline_reason_len
  check (decline_reason is null or char_length(decline_reason) <= 500);

drop function if exists public.faithbid_bidding_decline_bid_v1(uuid);

create or replace function public.faithbid_bidding_decline_bid_v1(p_bid_id uuid, p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_bid public.bids%rowtype;
  v_project public.projects%rowtype;
  v_vendor public.vendors%rowtype;
  v_relationship_id uuid;
  v_activity_id uuid;
  v_notification jsonb := '{}'::jsonb;
  v_reason text := nullif(left(btrim(coalesce(p_reason, '')), 500), '');
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  select *
    into v_bid
  from public.bids
  where id = p_bid_id
  for update;

  if not found then
    raise exception 'bid not found'
      using errcode = 'P0002';
  end if;

  select *
    into v_project
  from public.projects
  where id = v_bid.project_id
  for update;

  if not found then
    raise exception 'project not found'
      using errcode = 'P0002';
  end if;

  if v_project.church_id is distinct from v_actor then
    raise exception 'only the posting church may decline this proposal'
      using errcode = '42501';
  end if;

  if lower(btrim(coalesce(v_project.status, ''))) <> 'open' then
    raise exception 'project is not open for proposal decisions'
      using errcode = 'P0001';
  end if;

  if lower(btrim(coalesce(v_bid.status, ''))) not in (
    'pending',
    'under_review',
    'declined'
  ) then
    raise exception 'proposal cannot be declined from its current state'
      using errcode = 'P0001';
  end if;

  select *
    into v_vendor
  from public.vendors
  where user_id = v_bid.vendor_id;

  if not found then
    raise exception 'vendor profile not found'
      using errcode = 'P0002';
  end if;

  if lower(btrim(coalesce(v_bid.status, ''))) <> 'declined' then
    update public.bids
       set status = 'declined',
           declined_at = coalesce(declined_at, now()),
           decline_reason = v_reason
     where id = v_bid.id
     returning * into v_bid;
  end if;

  v_relationship_id :=
    private.faithbid_bidding_sync_project_vendor_link_v1(
      v_project.id,
      v_project.church_id,
      v_vendor.id,
      v_bid.vendor_id,
      'declined',
      null
    );

  select a.id
    into v_activity_id
  from public.project_activity_feed a
  where a.project_id = v_project.id
    and a.kind = 'bid_declined'
    and a.meta ->> 'bid_id' = v_bid.id::text
  limit 1;

  if not found then
    select public.kb_append_project_activity(
      v_project.id,
      'bid_declined',
      'Proposal declined',
      v_vendor.name || ' was not selected for this project.',
      jsonb_build_object(
        'source', 'faithbid_bidding_decline_bid_v1',
        'bid_id', v_bid.id::text,
        'vendor_profile_id', v_vendor.id::text,
        'vendor_user_id', v_bid.vendor_id::text
      ),
      v_bid.vendor_id
    )
    into v_activity_id;
  end if;

  select public.kb_create_trusted_notification(
    'bid_declined',
    v_bid.id
  )
  into v_notification;

  return jsonb_build_object(
    'ok', true,
    'status_code', 'PROPOSAL_DECLINED',
    'bid_id', v_bid.id,
    'status', v_bid.status,
    'declined_at', v_bid.declined_at,
    'relationship_id', v_relationship_id,
    'activity_id', v_activity_id,
    'notification', coalesce(v_notification, '{}'::jsonb)
  );
end;
$function$;

revoke all on function public.faithbid_bidding_decline_bid_v1(uuid, text) from public, anon;
grant execute on function public.faithbid_bidding_decline_bid_v1(uuid, text) to authenticated;
