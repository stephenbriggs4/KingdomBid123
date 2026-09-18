
-- P1-2: a draft project (status='draft') was firing the same trusted
-- notification as an actual publish, whose copy claims "is now live. Vendors
-- will start bidding soon." Split into project_draft_created (fired at
-- creation) vs project_posted (now fired only from marketplace_publish_project,
-- the real draft->open transition). No existing branch logic changed.
CREATE OR REPLACE FUNCTION public.kb_create_trusted_notification(p_event text, p_context_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
declare
  v_actor uuid := auth.uid();
  v_event text := lower(btrim(coalesce(p_event, '')));
  v_message jsonb;
  v_conversation jsonb;
  v_bid jsonb;
  v_project jsonb;
  v_vendor jsonb;
  v_actor_profile jsonb;
  v_recipient uuid;
  v_sender uuid;
  v_church uuid;
  v_vendor_user uuid;
  v_conversation_id uuid;
  v_project_id uuid;
  v_file_name text;
  v_message_text text;
  v_title text;
  v_body text;
  v_link text;
  v_notification_type text;
  v_project_title text;
  v_vendor_name text;
  v_actor_name text;
  v_amount numeric;
  v_amount_label text;
  v_inserted integer := 0;
begin
  if v_actor is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  if p_context_id is null then
    raise exception 'context id is required'
      using errcode = '22023';
  end if;

  if v_event not in (
    'message_sent',
    'project_update',
    'bid_invitation',
    'new_bid',
    'bid_declined',
    'project_cancelled',
    'project_draft_created',
    'project_posted',
    'review_prompt'
  ) then
    raise exception 'unsupported notification event'
      using errcode = '22023';
  end if;

  -- -------------------------------------------------------------------------
  -- Message-backed events.
  -- -------------------------------------------------------------------------
  if v_event in ('message_sent', 'project_update', 'bid_invitation') then
    select to_jsonb(m)
      into v_message
    from public.messages m
    where m.id = p_context_id;

    if v_message is null then
      raise exception 'message not found'
        using errcode = 'P0002';
    end if;

    v_sender := nullif(v_message ->> 'sender_id', '')::uuid;
    v_conversation_id := nullif(v_message ->> 'conversation_id', '')::uuid;

    if v_sender is distinct from v_actor then
      raise exception 'not authorized for this message'
        using errcode = '42501';
    end if;

    if v_conversation_id is null then
      raise exception 'message has no conversation'
        using errcode = '23502';
    end if;

    select to_jsonb(c)
      into v_conversation
    from public.conversations c
    where c.id = v_conversation_id;

    if v_conversation is null then
      raise exception 'conversation not found'
        using errcode = 'P0002';
    end if;

    v_church := nullif(v_conversation ->> 'church_id', '')::uuid;
    v_vendor_user := nullif(v_conversation ->> 'vendor_id', '')::uuid;
    v_project_id := nullif(v_conversation ->> 'project_id', '')::uuid;

    if v_actor = v_church then
      v_recipient := v_vendor_user;
    elsif v_actor = v_vendor_user then
      v_recipient := v_church;
    else
      raise exception 'not a conversation participant'
        using errcode = '42501';
    end if;

    if v_recipient is null or v_recipient = v_actor then
      return jsonb_build_object(
        'status_code', 'no_distinct_recipient',
        'event', v_event,
        'inserted_count', 0
      );
    end if;

    v_file_name := nullif(btrim(coalesce(v_message ->> 'file_name', '')), '');
    v_message_text := coalesce(
      nullif(btrim(coalesce(v_message ->> 'text', '')), ''),
      nullif(btrim(coalesce(v_message ->> 'body', '')), ''),
      ''
    );

    if v_event = 'message_sent' then
      v_notification_type := 'new_message';
      v_title := case when v_file_name is not null then 'New file' else 'New message' end;
      v_body := case
        when v_file_name is not null then left('📎 ' || v_file_name, 140)
        when char_length(v_message_text) > 60 then left(v_message_text, 60) || '…'
        else left(v_message_text, 60)
      end;
      v_link := 'inbox';

    elsif v_event = 'project_update' then
      if v_message_text not like 'Project update · %' then
        raise exception 'message is not a project update'
          using errcode = '22023';
      end if;

      v_notification_type := 'project_update';
      v_title := 'Project update';
      v_body := left(
        btrim(substr(v_message_text, char_length('Project update · ') + 1)),
        140
      );
      v_link := 'inbox';

    else
      if v_actor is distinct from v_church then
        raise exception 'only the church may send a bid invitation'
          using errcode = '42501';
      end if;

      if v_project_id is null then
        raise exception 'bid invitation has no project context'
          using errcode = '22023';
      end if;

      select to_jsonb(p)
        into v_project
      from public.projects p
      where p.id = v_project_id;

      if v_project is null then
        raise exception 'project not found'
          using errcode = 'P0002';
      end if;

      if nullif(v_project ->> 'church_id', '')::uuid is distinct from v_actor then
        raise exception 'not authorized for this project'
          using errcode = '42501';
      end if;

      select to_jsonb(pr)
        into v_actor_profile
      from public.profiles pr
      where pr.id = v_actor;

      v_actor_name := coalesce(
        nullif(btrim(coalesce(v_actor_profile ->> 'org_name', '')), ''),
        nullif(btrim(coalesce(v_conversation ->> 'church_name', '')), ''),
        'A church'
      );
      v_project_title := coalesce(
        nullif(btrim(coalesce(v_project ->> 'title', '')), ''),
        nullif(btrim(coalesce(v_conversation ->> 'project_title', '')), '')
      );

      v_notification_type := 'new_message';
      v_title := 'New bid invitation';
      v_body := left(
        v_actor_name || ' invited you to bid'
        || case
             when v_project_title <> '' then ' on "' || v_project_title || '"'
             else '.'
           end,
        500
      );
      v_link := 'inbox';
    end if;

    insert into public.notifications (
      user_id,
      type,
      text,
      title,
      body,
      link,
      read,
      created_at,
      meta
    )
    values (
      v_recipient,
      v_notification_type,
      v_body,
      v_title,
      v_body,
      v_link,
      false,
      now(),
      jsonb_build_object(
        'source', 'kb_create_trusted_notification',
        'source_event', v_event,
        'context_id', p_context_id::text,
        'conversation_id', v_conversation_id::text,
        'project_id', case when v_project_id is null then null else v_project_id::text end,
        'actor_id', v_actor::text
      )
    )
    on conflict do nothing;

    get diagnostics v_inserted = row_count;

  -- -------------------------------------------------------------------------
  -- Bid submitted.
  -- -------------------------------------------------------------------------
  elsif v_event = 'new_bid' then
    select to_jsonb(b)
      into v_bid
    from public.bids b
    where b.id = p_context_id;

    if v_bid is null then
      raise exception 'bid not found'
        using errcode = 'P0002';
    end if;

    v_vendor_user := nullif(v_bid ->> 'vendor_id', '')::uuid;
    v_project_id := nullif(v_bid ->> 'project_id', '')::uuid;

    if v_vendor_user is distinct from v_actor then
      raise exception 'not authorized for this bid'
        using errcode = '42501';
    end if;

    select to_jsonb(p)
      into v_project
    from public.projects p
    where p.id = v_project_id;

    if v_project is null then
      raise exception 'project not found'
        using errcode = 'P0002';
    end if;

    if nullif(v_bid ->> 'project_id', '')::uuid
       is distinct from nullif(v_project ->> 'id', '')::uuid then
      raise exception 'bid project mismatch'
        using errcode = '22023';
    end if;

    v_recipient := nullif(v_project ->> 'church_id', '')::uuid;
    if v_recipient is null or v_recipient = v_actor then
      raise exception 'bid has no valid church recipient'
        using errcode = '23502';
    end if;

    v_project_title := coalesce(
      nullif(btrim(coalesce(v_project ->> 'title', '')), ''),
      'the project'
    );
    v_vendor_name := coalesce(
      nullif(btrim(coalesce(v_bid ->> 'vendor_name', '')), ''),
      'A vendor'
    );

    begin
      v_amount := nullif(v_bid ->> 'amount', '')::numeric;
    exception when others then
      v_amount := null;
    end;

    v_amount_label := case
      when v_amount is null then 'a proposal'
      else '$' || regexp_replace(to_char(v_amount, 'FM9999999990.00'), '\.00$', '')
    end;

    v_notification_type := 'new_bid';
    v_title := 'New bid received';
    v_body := left(
      v_vendor_name || ' bid ' || v_amount_label || ' on "' || v_project_title || '"',
      500
    );
    v_link := 'bids/' || p_context_id::text;

    insert into public.notifications (
      user_id, type, text, title, body, link, read, created_at, meta
    )
    values (
      v_recipient,
      v_notification_type,
      v_body,
      v_title,
      v_body,
      v_link,
      false,
      now(),
      jsonb_build_object(
        'source', 'kb_create_trusted_notification',
        'source_event', v_event,
        'context_id', p_context_id::text,
        'project_id', v_project_id::text,
        'actor_id', v_actor::text
      )
    )
    on conflict do nothing;

    get diagnostics v_inserted = row_count;

  -- -------------------------------------------------------------------------
  -- Bid declined.
  -- -------------------------------------------------------------------------
  elsif v_event = 'bid_declined' then
    select to_jsonb(b)
      into v_bid
    from public.bids b
    where b.id = p_context_id;

    if v_bid is null then
      raise exception 'bid not found'
        using errcode = 'P0002';
    end if;

    if lower(btrim(coalesce(v_bid ->> 'status', ''))) <> 'declined' then
      raise exception 'bid is not declined'
        using errcode = '22023';
    end if;

    v_project_id := nullif(v_bid ->> 'project_id', '')::uuid;
    v_recipient := nullif(v_bid ->> 'vendor_id', '')::uuid;

    select to_jsonb(p)
      into v_project
    from public.projects p
    where p.id = v_project_id;

    if v_project is null then
      raise exception 'project not found'
        using errcode = 'P0002';
    end if;

    if nullif(v_project ->> 'church_id', '')::uuid is distinct from v_actor then
      raise exception 'not authorized for this project'
        using errcode = '42501';
    end if;

    if v_recipient is null or v_recipient = v_actor then
      raise exception 'bid has no valid vendor recipient'
        using errcode = '23502';
    end if;

    v_project_title := coalesce(
      nullif(btrim(coalesce(v_project ->> 'title', '')), ''),
      'the project'
    );
    v_notification_type := 'bid_declined';
    v_title := 'Bid update';
    v_body := left(
      'Your bid on "' || v_project_title
      || '" was not selected this time. Keep bidding — your next win is coming.',
      500
    );
    v_link := 'projects';

    insert into public.notifications (
      user_id, type, text, title, body, link, read, created_at, meta
    )
    values (
      v_recipient,
      v_notification_type,
      v_body,
      v_title,
      v_body,
      v_link,
      false,
      now(),
      jsonb_build_object(
        'source', 'kb_create_trusted_notification',
        'source_event', v_event,
        'context_id', p_context_id::text,
        'project_id', v_project_id::text,
        'actor_id', v_actor::text
      )
    )
    on conflict do nothing;

    get diagnostics v_inserted = row_count;

  -- -------------------------------------------------------------------------
  -- Project cancelled: notify each still-pending bidder once.
  -- -------------------------------------------------------------------------
  elsif v_event = 'project_cancelled' then
    select to_jsonb(p)
      into v_project
    from public.projects p
    where p.id = p_context_id;

    if v_project is null then
      raise exception 'project not found'
        using errcode = 'P0002';
    end if;

    if nullif(v_project ->> 'church_id', '')::uuid is distinct from v_actor then
      raise exception 'not authorized for this project'
        using errcode = '42501';
    end if;

    if lower(btrim(coalesce(v_project ->> 'status', ''))) <> 'cancelled' then
      raise exception 'project is not cancelled'
        using errcode = '22023';
    end if;

    v_project_title := coalesce(
      nullif(btrim(coalesce(v_project ->> 'title', '')), ''),
      'A project'
    );

    insert into public.notifications (
      user_id, type, text, title, body, link, read, created_at, meta
    )
    select distinct
      b.vendor_id,
      'project_cancelled',
      left(
        '"' || v_project_title
        || '" has been closed by the church. Your proposal was not selected.',
        500
      ),
      'Project closed',
      left(
        '"' || v_project_title
        || '" has been closed by the church. Your proposal was not selected.',
        500
      ),
      'projects',
      false,
      now(),
      jsonb_build_object(
        'source', 'kb_create_trusted_notification',
        'source_event', v_event,
        'context_id', p_context_id::text,
        'project_id', p_context_id::text,
        'actor_id', v_actor::text
      )
    from public.bids b
    where b.project_id = p_context_id
      and lower(btrim(coalesce(b.status, ''))) = 'pending'
      and b.vendor_id is not null
      and b.vendor_id <> v_actor
    on conflict do nothing;

    get diagnostics v_inserted = row_count;

  -- -------------------------------------------------------------------------
  -- Project draft created: trusted self-notification. Must never claim the
  -- project is live -- publication is a separate, later action.
  -- -------------------------------------------------------------------------
  elsif v_event = 'project_draft_created' then
    select to_jsonb(p)
      into v_project
    from public.projects p
    where p.id = p_context_id;

    if v_project is null then
      raise exception 'project not found'
        using errcode = 'P0002';
    end if;

    if nullif(v_project ->> 'church_id', '')::uuid is distinct from v_actor then
      raise exception 'not authorized for this project'
        using errcode = '42501';
    end if;

    v_project_title := coalesce(
      nullif(btrim(coalesce(v_project ->> 'title', '')), ''),
      'Your project'
    );
    v_notification_type := 'project_draft_created';
    v_title := 'Draft saved';
    v_body := left(
      '"' || v_project_title || '" was saved as a draft. Publish it when you''re ready — vendors won''t see it until then.',
      500
    );
    v_link := 'projects/' || p_context_id::text;

    insert into public.notifications (
      user_id, type, text, title, body, link, read, created_at, meta
    )
    values (
      v_actor,
      v_notification_type,
      v_body,
      v_title,
      v_body,
      v_link,
      false,
      now(),
      jsonb_build_object(
        'source', 'kb_create_trusted_notification',
        'source_event', v_event,
        'context_id', p_context_id::text,
        'project_id', p_context_id::text,
        'actor_id', v_actor::text
      )
    )
    on conflict do nothing;

    get diagnostics v_inserted = row_count;

  -- -------------------------------------------------------------------------
  -- Project posted: trusted self-notification. Only fired from the real
  -- draft->open publish transition (marketplace_publish_project), never at
  -- draft creation.
  -- -------------------------------------------------------------------------
  elsif v_event = 'project_posted' then
    select to_jsonb(p)
      into v_project
    from public.projects p
    where p.id = p_context_id;

    if v_project is null then
      raise exception 'project not found'
        using errcode = 'P0002';
    end if;

    if nullif(v_project ->> 'church_id', '')::uuid is distinct from v_actor then
      raise exception 'not authorized for this project'
        using errcode = '42501';
    end if;

    v_project_title := coalesce(
      nullif(btrim(coalesce(v_project ->> 'title', '')), ''),
      'Your project'
    );
    v_notification_type := 'project_posted';
    v_title := 'Project posted successfully';
    v_body := left(
      '"' || v_project_title || '" is now live. Vendors will start bidding soon.',
      500
    );
    v_link := 'projects/' || p_context_id::text;

    insert into public.notifications (
      user_id, type, text, title, body, link, read, created_at, meta
    )
    values (
      v_actor,
      v_notification_type,
      v_body,
      v_title,
      v_body,
      v_link,
      false,
      now(),
      jsonb_build_object(
        'source', 'kb_create_trusted_notification',
        'source_event', v_event,
        'context_id', p_context_id::text,
        'project_id', p_context_id::text,
        'actor_id', v_actor::text
      )
    )
    on conflict do nothing;

    get diagnostics v_inserted = row_count;

  -- -------------------------------------------------------------------------
  -- Project completed: trusted self review prompt.
  -- -------------------------------------------------------------------------
  else
    select to_jsonb(p)
      into v_project
    from public.projects p
    where p.id = p_context_id;

    if v_project is null then
      raise exception 'project not found'
        using errcode = 'P0002';
    end if;

    if nullif(v_project ->> 'church_id', '')::uuid is distinct from v_actor then
      raise exception 'not authorized for this project'
        using errcode = '42501';
    end if;

    if lower(btrim(coalesce(v_project ->> 'status', ''))) <> 'completed' then
      raise exception 'project is not completed'
        using errcode = '22023';
    end if;

    v_vendor_user := nullif(v_project ->> 'hired_vendor_id', '')::uuid;

    select to_jsonb(b)
      into v_bid
    from public.bids b
    where b.project_id = p_context_id
      and lower(btrim(coalesce(b.status, ''))) = 'hired'
    order by b.id
    limit 1;

    if v_vendor_user is null and v_bid is not null then
      v_vendor_user := nullif(v_bid ->> 'vendor_id', '')::uuid;
    end if;

    if v_vendor_user is not null then
      select to_jsonb(v)
        into v_vendor
      from public.vendors v
      where v.user_id = v_vendor_user
      limit 1;
    end if;

    v_vendor_name := coalesce(
      nullif(btrim(coalesce(v_bid ->> 'vendor_name', '')), ''),
      nullif(btrim(coalesce(v_vendor ->> 'name', '')), ''),
      'your vendor'
    );
    v_project_title := coalesce(
      nullif(btrim(coalesce(v_project ->> 'title', '')), ''),
      'your project'
    );

    v_notification_type := 'review_prompt';
    v_title := 'Leave a review';
    v_body := left(
      'Your project "' || v_project_title || '" is complete. Rate '
      || v_vendor_name || ' to help the community.',
      500
    );
    v_link := 'reviews';

    insert into public.notifications (
      user_id, type, text, title, body, link, read, created_at, meta
    )
    values (
      v_actor,
      v_notification_type,
      v_body,
      v_title,
      v_body,
      v_link,
      false,
      now(),
      jsonb_build_object(
        'source', 'kb_create_trusted_notification',
        'source_event', v_event,
        'context_id', p_context_id::text,
        'project_id', p_context_id::text,
        'vendor_user_id', case
          when v_vendor_user is null then null
          else v_vendor_user::text
        end,
        'actor_id', v_actor::text
      )
    )
    on conflict do nothing;

    get diagnostics v_inserted = row_count;
  end if;

  return jsonb_build_object(
    'status_code', case when v_inserted > 0 then 'created' else 'already_recorded' end,
    'event', v_event,
    'inserted_count', v_inserted
  );
end;
$function$
