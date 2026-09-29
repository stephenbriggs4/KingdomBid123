-- ============================================================================
-- FaithBid Bidding v2
-- Migration 004: Canonical Vendor Invitation Command
-- Project: knkwaphosqronbhrvlsu
-- Status: DRAFT / AUDITED / NOT APPLIED
-- Generated: 2026-09-22
--
-- DEPENDENCIES
--   Migration 001: integrity boundary / optional match_snapshot_id on invites
--   Migration 002: vendor trust/capability semantics
--   Migration 003: unified read facade
--
-- PURPOSE
--   Collapse the two current frontend invitation workflows into one atomic,
--   idempotent backend command.
--
-- IMPORTANT
--   This file has NOT been applied.
--   It does not modify App.jsx.
--   It does not enable marketplace_public or bidding_enabled.
-- ============================================================================

begin;

set local lock_timeout = '10s';
set local statement_timeout = '60s';

create or replace function public.faithbid_bidding_invite_vendor_v1(
  p_project_id uuid,
  p_vendor_profile_id uuid,
  p_match_snapshot_id uuid default null,
  p_source text default 'manual',
  p_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_project public.projects%rowtype;
  v_vendor public.vendors%rowtype;
  v_snapshot public.match_snapshots%rowtype;
  v_invite public.vendor_invites%rowtype;
  v_link public.project_vendor_links%rowtype;
  v_church_profile public.profiles%rowtype;

  v_has_snapshot boolean := false;
  v_invite_exists boolean := false;
  v_link_exists boolean := false;

  v_source_raw text := lower(btrim(coalesce(p_source, 'manual')));
  v_source text := 'manual';
  v_message_text text;

  v_conversation_id uuid;
  v_message_id uuid;
  v_activity_id uuid;
  v_notification_result jsonb := '{}'::jsonb;

  v_created_invite boolean := false;
  v_created_link boolean := false;
  v_created_conversation boolean := false;
  v_created_message boolean := false;
  v_created_activity boolean := false;
  v_created_match_event boolean := false;
  v_match_event_error text := null;
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  if p_project_id is null then
    raise exception 'project id is required'
      using errcode = '22023';
  end if;

  if p_vendor_profile_id is null then
    raise exception 'vendor profile id is required'
      using errcode = '22023';
  end if;

  -- Normalize legacy surface names into the v2 relationship-source vocabulary.
  v_source :=
    case v_source_raw
      when 'profile' then 'detail'
      when 'project-detail' then 'detail'
      when 'bid-review' then 'compare'
      when 'marketplace' then 'marketplace'
      when 'directory' then 'directory'
      when 'compare' then 'compare'
      when 'manual' then 'manual'
      when 'detail' then 'detail'
      when 'inbox' then 'inbox'
      else null
    end;

  if v_source is null then
    raise exception 'unsupported invitation source'
      using errcode = '22023';
  end if;

  v_message_text := nullif(btrim(coalesce(p_message, '')), '');
  if v_message_text is null then
    v_message_text :=
      'Hi — I''d like to invite you to bid on this project. '
      || 'Happy to answer questions if the scope is a fit.';
  end if;

  if char_length(v_message_text) > 1000 then
    raise exception 'invitation message is too long'
      using errcode = '22023';
  end if;

  -- Lock the project. This also serializes concurrent invitation commands
  -- against the same project sufficiently for the current beta scale.
  select *
    into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'project not found'
      using errcode = 'P0002';
  end if;

  -- V1 invitation authority is deliberately the posting church itself.
  if v_project.church_id is distinct from v_actor then
    raise exception 'not authorized for this project'
      using errcode = '42501';
  end if;

  if lower(btrim(coalesce(v_project.status, ''))) <> 'open' then
    raise exception 'project is not open for vendor invitations'
      using errcode = 'P0001';
  end if;

  select *
    into v_vendor
  from public.vendors
  where id = p_vendor_profile_id;

  if not found then
    raise exception 'vendor profile not found'
      using errcode = 'P0002';
  end if;

  if v_vendor.user_id is null then
    raise exception 'vendor profile has no user identity'
      using errcode = '23502';
  end if;

  if v_vendor.user_id = v_actor then
    raise exception 'church cannot invite itself as vendor'
      using errcode = '22023';
  end if;

  if coalesce(v_vendor.suspended, false) then
    raise exception 'vendor is suspended'
      using errcode = 'P0001';
  end if;

  if not (
    lower(btrim(coalesce(v_vendor.verification_status, ''))) = 'approved'
    or (
      v_vendor.verification_status is null
      and coalesce(v_vendor.verified, false)
    )
  ) then
    raise exception 'vendor is not Marketplace Approved'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.bids b
    where b.project_id = v_project.id
      and b.vendor_id = v_vendor.user_id
  ) then
    raise exception 'vendor already has a proposal on this project'
      using errcode = 'P0001';
  end if;

  -- Optional recommendation evidence.
  if p_match_snapshot_id is not null then
    select *
      into v_snapshot
    from public.match_snapshots
    where id = p_match_snapshot_id;

    if not found then
      raise exception 'match snapshot not found'
        using errcode = 'P0002';
    end if;

    if v_snapshot.project_id is distinct from v_project.id
       or v_snapshot.church_id is distinct from v_project.church_id
       or v_snapshot.vendor_id is distinct from v_vendor.id
       or (
         v_snapshot.vendor_user_id is not null
         and v_snapshot.vendor_user_id is distinct from v_vendor.user_id
       ) then
      raise exception 'match snapshot does not match project/vendor identity'
        using errcode = '23514';
    end if;

    v_has_snapshot := true;
  end if;

  -- Existing canonical invitation, if any.
  select *
    into v_invite
  from public.vendor_invites
  where project_id = v_project.id
    and vendor_id = v_vendor.id
  for update;

  v_invite_exists := found;

  if v_invite_exists then
    if lower(btrim(coalesce(v_invite.status, ''))) <> 'invited' then
      raise exception 'vendor invitation is already resolved as %', v_invite.status
        using errcode = 'P0001';
    end if;

    if p_match_snapshot_id is not null
       and v_invite.match_snapshot_id is distinct from p_match_snapshot_id then
      raise exception 'existing invitation is attached to different match evidence'
        using errcode = 'P0001';
    end if;

    if v_invite.vendor_user_id is distinct from v_vendor.user_id
       or v_invite.church_id is distinct from v_project.church_id then
      raise exception 'existing invitation identity is inconsistent'
        using errcode = '23514';
    end if;
  else
    insert into public.vendor_invites (
      project_id,
      church_id,
      vendor_id,
      vendor_user_id,
      match_snapshot_id,
      status,
      created_by
    )
    values (
      v_project.id,
      v_project.church_id,
      v_vendor.id,
      v_vendor.user_id,
      p_match_snapshot_id,
      'invited',
      v_actor
    )
    returning * into v_invite;

    v_created_invite := true;
  end if;

  -- Canonical project/vendor relationship.
  select *
    into v_link
  from public.project_vendor_links
  where project_id = v_project.id
    and vendor_user_id = v_vendor.user_id
  for update;

  v_link_exists := found;

  if v_link_exists then
    if lower(btrim(coalesce(v_link.stage, ''))) not in ('watching', 'invited') then
      raise exception 'vendor relationship is already in advanced/resolved stage %', v_link.stage
        using errcode = 'P0001';
    end if;

    if v_link.vendor_id is not null
       and v_link.vendor_id is distinct from v_vendor.id then
      raise exception 'existing project/vendor relationship has inconsistent vendor identity'
        using errcode = '23514';
    end if;

    update public.project_vendor_links
       set stage = 'invited',
           source = case
             when lower(btrim(coalesce(v_link.stage, ''))) = 'watching'
               then v_source
             else coalesce(v_link.source, v_source)
           end,
           invited_at = coalesce(invited_at, now()),
           last_activity_at = now()
     where id = v_link.id
     returning * into v_link;
  else
    insert into public.project_vendor_links (
      project_id,
      church_id,
      vendor_user_id,
      vendor_id,
      stage,
      source,
      invited_at,
      last_activity_at
    )
    values (
      v_project.id,
      v_project.church_id,
      v_vendor.user_id,
      v_vendor.id,
      'invited',
      v_source,
      now(),
      now()
    )
    returning * into v_link;

    v_created_link := true;
  end if;

  -- If this command is completing a pre-v2 link-only invitation, preserve the
  -- original invitation clock instead of pretending the invitation happened
  -- again today.
  if v_created_invite
     and v_link_exists
     and v_link.invited_at is not null
     and v_invite.invited_at is distinct from v_link.invited_at then
    update public.vendor_invites
       set invited_at = v_link.invited_at,
           no_response_after_at = public.kb_add_business_days(v_link.invited_at, 3)
     where id = v_invite.id
     returning * into v_invite;
  end if;

  -- Resolve a display church name when available.
  select *
    into v_church_profile
  from public.profiles
  where id = v_actor;

  -- Ensure one conversation for church/vendor/project.
  select c.id
    into v_conversation_id
  from public.conversations c
  where c.church_id = v_project.church_id
    and c.vendor_id = v_vendor.user_id
    and c.project_id = v_project.id
  for update;

  if not found then
    insert into public.conversations (
      project_id,
      church_id,
      vendor_id,
      church_name,
      vendor_name,
      vendor_emoji,
      status,
      project_title,
      budget,
      category
    )
    values (
      v_project.id,
      v_project.church_id,
      v_vendor.user_id,
      nullif(btrim(coalesce(v_church_profile.org_name, '')), ''),
      v_vendor.name,
      coalesce(v_vendor.emoji, '🏢'),
      'open',
      coalesce(v_project.title, ''),
      coalesce(v_project.budget, ''),
      coalesce(v_project.category, '')
    )
    returning id into v_conversation_id;

    v_created_conversation := true;
  end if;

  -- Idempotent invitation message.
  -- event_data gives the backend a durable marker instead of matching text.
  select m.id
    into v_message_id
  from public.messages m
  where m.conversation_id = v_conversation_id
    and m.event_data ->> 'kind' = 'bid_invitation'
    and m.event_data ->> 'invite_id' = v_invite.id::text
  order by m.created_at asc, m.id asc
  limit 1;

  if not found then
    insert into public.messages (
      conversation_id,
      sender_id,
      text,
      message_type,
      event_data
    )
    values (
      v_conversation_id,
      v_actor,
      v_message_text,
      'text',
      jsonb_build_object(
        'kind', 'bid_invitation',
        'invite_id', v_invite.id::text,
        'project_id', v_project.id::text,
        'vendor_profile_id', v_vendor.id::text,
        'vendor_user_id', v_vendor.user_id::text,
        'source', v_source,
        'match_snapshot_id',
          case
            when p_match_snapshot_id is null then null
            else p_match_snapshot_id::text
          end
      )
    )
    returning id into v_message_id;

    v_created_message := true;
  end if;

  -- Existing trusted notification function already validates:
  --   sender = auth.uid
  --   church owns project
  --   conversation participants
  -- and already has durable event/context dedupe.
  select public.kb_create_trusted_notification(
    'bid_invitation',
    v_message_id
  )
  into v_notification_result;

  -- Idempotent project activity.
  select a.id
    into v_activity_id
  from public.project_activity_feed a
  where a.project_id = v_project.id
    and a.kind = 'vendor_invited'
    and a.meta ->> 'invite_id' = v_invite.id::text
  order by a.created_at asc, a.id asc
  limit 1;

  if not found then
    select public.kb_append_project_activity(
      v_project.id,
      'vendor_invited',
      'Vendor invited',
      v_vendor.name || ' was invited to bid.',
      jsonb_build_object(
        'source', 'faithbid_bidding_invite_vendor_v1',
        'invite_id', v_invite.id::text,
        'vendor_profile_id', v_vendor.id::text,
        'vendor_user_id', v_vendor.user_id::text,
        'conversation_id', v_conversation_id::text,
        'match_snapshot_id',
          case
            when p_match_snapshot_id is null then null
            else p_match_snapshot_id::text
          end
      ),
      v_vendor.user_id
    )
    into v_activity_id;

    v_created_activity := true;
  end if;

  -- Match/funnel analytics are telemetry, not canonical business state.
  -- A telemetry failure must never roll back an otherwise-valid invitation.
  begin
    if not exists (
      select 1
      from public.match_events me
      where me.event_type = 'invited'
        and me.invite_id = v_invite.id::text
    ) then
      insert into public.match_events (
        event_type,
        project_id,
        church_id,
        vendor_id,
        vendor_user_id,
        actor_user_id,
        actor_role,
        source_surface,
        source_action,
        match_snapshot_id,
        invite_id,
        lens,
        fit_label,
        label_key,
        input_version,
        metadata
      )
      values (
        'invited',
        v_project.id::text,
        v_project.church_id::text,
        v_vendor.id::text,
        v_vendor.user_id::text,
        v_actor::text,
        'church',
        case
          when v_has_snapshot then 'recommended_vendors'
          else 'bidding_v2'
        end,
        'invite',
        case
          when p_match_snapshot_id is null then null
          else p_match_snapshot_id::text
        end,
        v_invite.id::text,
        case when v_has_snapshot then v_snapshot.lens else null end,
        case when v_has_snapshot then v_snapshot.fit_label else null end,
        case when v_has_snapshot then v_snapshot.label_key else null end,
        case when v_has_snapshot then v_snapshot.input_version else 'bidding_v2_invite_v1' end,
        jsonb_build_object(
          'source', 'faithbid_bidding_invite_vendor_v1',
          'vendor_name', v_vendor.name,
          'project_title', v_project.title,
          'relationship_id', v_link.id::text,
          'conversation_id', v_conversation_id::text,
          'message_id', v_message_id::text
        )
      );

      v_created_match_event := true;
    end if;
  exception
    when others then
      v_match_event_error := sqlstate || ': ' || sqlerrm;
  end;

  return jsonb_build_object(
    'ok', true,
    'status_code',
      case
        when v_created_invite then 'INVITE_CREATED'
        else 'INVITE_EXISTS'
      end,
    'project_id', v_project.id,
    'vendor_profile_id', v_vendor.id,
    'vendor_user_id', v_vendor.user_id,
    'invite_id', v_invite.id,
    'relationship_id', v_link.id,
    'conversation_id', v_conversation_id,
    'message_id', v_message_id,
    'activity_id', v_activity_id,
    'match_snapshot_id', p_match_snapshot_id,
    'source', v_source,
    'created', jsonb_build_object(
      'invite', v_created_invite,
      'relationship', v_created_link,
      'conversation', v_created_conversation,
      'message', v_created_message,
      'activity', v_created_activity,
      'match_event', v_created_match_event
    ),
    'analytics', jsonb_build_object(
      'match_event_created', v_created_match_event,
      'match_event_error', v_match_event_error
    ),
    'notification', coalesce(v_notification_result, '{}'::jsonb)
  );
end;
$function$;

revoke all on function public.faithbid_bidding_invite_vendor_v1(
  uuid, uuid, uuid, text, text
) from public, anon;

grant execute on function public.faithbid_bidding_invite_vendor_v1(
  uuid, uuid, uuid, text, text
) to authenticated;

commit;

-- ============================================================================
-- END MIGRATION 004
-- ============================================================================
