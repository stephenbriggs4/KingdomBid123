
CREATE OR REPLACE FUNCTION public.kb_service_finalize_waitlist_conversion_v1_internal(p_selector_id uuid, p_token_hash bytea, p_auth_user_id uuid)
 RETURNS TABLE(status_code text, role text, profile_created boolean, vendor_created boolean, conversion_completed boolean, onboarding_required boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_now timestamptz := clock_timestamp();

  v_invitation public.waitlist_invitations%rowtype;
  v_conversion public.waitlist_conversions%rowtype;
  v_waitlist public.waitlist%rowtype;

  v_auth_email text;
  v_auth_email_normalized text;
  v_auth_email_confirmed_at timestamptz;

  v_existing_profile_role text;
  v_existing_vendor_admission_status text;
  v_profile_exists boolean := false;
  v_vendor_exists boolean := false;
  v_profile_created boolean := false;
  v_vendor_created boolean := false;

  v_profile_referral_code text;
  v_org_name text;
  v_vendor_name text;
  v_category text;
  v_city text;
  v_service_model text;
begin
  if p_selector_id is null
     or p_token_hash is null
     or octet_length(p_token_hash) <> 32
     or p_auth_user_id is null then
    return query
    select
      'unavailable'::text,
      null::text,
      false,
      false,
      false,
      true;
    return;
  end if;

  select i.*
  into v_invitation
  from public.waitlist_invitations i
  where i.selector_id = p_selector_id
    and i.token_hash = p_token_hash
  for update;

  if not found then
    return query
    select
      'unavailable'::text,
      null::text,
      false,
      false,
      false,
      true;
    return;
  end if;

  select c.*
  into strict v_conversion
  from public.waitlist_conversions c
  where c.id = v_invitation.conversion_id
  for update;

  if v_invitation.invitation_status = 'consumed'
     and v_conversion.conversion_status = 'completed'
     and v_conversion.auth_user_id = p_auth_user_id then
    return query
    select
      'completed'::text,
      v_conversion.role,
      false,
      false,
      true,
      false;
    return;
  end if;

  if v_conversion.authorization_status <> 'active'
     or v_invitation.invitation_status not in (
       'issued',
       'opened',
       'validated'
     )
     or v_invitation.expires_at <= v_now then
    return query
    select
      'unavailable'::text,
      null::text,
      false,
      false,
      false,
      true;
    return;
  end if;

  select
    u.email,
    lower(btrim(u.email)),
    u.email_confirmed_at
  into
    v_auth_email,
    v_auth_email_normalized,
    v_auth_email_confirmed_at
  from auth.users u
  where u.id = p_auth_user_id
    and u.deleted_at is null;

  if not found then
    return query
    select
      'authentication_required'::text,
      v_conversion.role,
      false,
      false,
      false,
      true;
    return;
  end if;

  if v_auth_email_normalized is distinct from
       v_conversion.email_normalized then
    return query
    select
      'authenticated_email_mismatch'::text,
      v_conversion.role,
      false,
      false,
      false,
      true;
    return;
  end if;

  if v_auth_email_confirmed_at is null then
    return query
    select
      'email_confirmation_required'::text,
      v_conversion.role,
      false,
      false,
      false,
      true;
    return;
  end if;

  select w.*
  into strict v_waitlist
  from public.waitlist w
  where w.id = v_conversion.waitlist_id
  for share;

  select
    true,
    p.role
  into
    v_profile_exists,
    v_existing_profile_role
  from public.profiles p
  where p.id = p_auth_user_id
  for update;

  if not found then
    v_profile_exists := false;
    v_existing_profile_role := null;
  end if;

  select
    true,
    lower(btrim(coalesce(v.verification_status, '')))
  into
    v_vendor_exists,
    v_existing_vendor_admission_status
  from public.vendors v
  where v.user_id = p_auth_user_id
  for update;

  if not found then
    v_vendor_exists := false;
    v_existing_vendor_admission_status := null;
  end if;

  -- A prior explicit Marketplace rejection is terminal for automatic Charter
  -- conversion. Charter approval never silently reverses that separate durable
  -- decision; the case is surfaced for Admin resolution instead.
  if v_conversion.role = 'vendor'
     and v_vendor_exists
     and v_existing_vendor_admission_status = 'rejected' then

    update public.waitlist_conversions
    set identity_status = 'authenticated',
        auth_user_id = p_auth_user_id,
        authenticated_at = coalesce(authenticated_at, v_now),
        conversion_status = 'attention_required',
        attention_required_at = coalesce(attention_required_at, v_now),
        failure_code = 'vendor_admission_conflict',
        failure_summary =
          'The authenticated vendor account has a prior rejected Marketplace admission decision that requires Admin resolution.',
        failure_retryable = false,
        updated_at = v_now
    where id = v_conversion.id;

    insert into public.waitlist_conversion_events (
      conversion_id,
      invitation_id,
      event_type,
      actor_type,
      actor_user_id,
      dedupe_key,
      safe_meta,
      created_at
    ) values
    (
      v_conversion.id,
      v_invitation.id,
      'identity_authenticated',
      'applicant',
      p_auth_user_id,
      'identity-authenticated',
      jsonb_build_object(
        'email_match', true,
        'email_confirmed', true
      ),
      v_now
    ),
    (
      v_conversion.id,
      v_invitation.id,
      'admin_attention_required',
      'system',
      null,
      'admin-attention:vendor-admission-conflict',
      jsonb_build_object(
        'reason', 'vendor_admission_conflict',
        'conversion_role', v_conversion.role
      ),
      v_now
    )
    on conflict (conversion_id, dedupe_key)
    do nothing;

    return query
    select
      'attention_required'::text,
      v_conversion.role,
      false,
      false,
      false,
      true;
    return;
  end if;

  -- Role conflicts are durable Admin-attention cases, not silent overwrites.
  if (
       v_profile_exists
       and v_existing_profile_role is not null
       and v_existing_profile_role <> v_conversion.role
     )
     or (
       v_conversion.role = 'church'
       and v_vendor_exists
     ) then

    update public.waitlist_conversions
    set identity_status = 'authenticated',
        auth_user_id = p_auth_user_id,
        authenticated_at = coalesce(
          authenticated_at,
          v_now
        ),
        conversion_status = 'attention_required',
        attention_required_at = coalesce(
          attention_required_at,
          v_now
        ),
        failure_code = 'account_role_conflict',
        failure_summary =
          'The authenticated account has an incompatible existing FaithBid role.',
        failure_retryable = false,
        updated_at = v_now
    where id = v_conversion.id;

    insert into public.waitlist_conversion_events (
      conversion_id,
      invitation_id,
      event_type,
      actor_type,
      actor_user_id,
      dedupe_key,
      safe_meta,
      created_at
    ) values
    (
      v_conversion.id,
      v_invitation.id,
      'identity_authenticated',
      'applicant',
      p_auth_user_id,
      'identity-authenticated',
      jsonb_build_object(
        'email_match', true,
        'email_confirmed', true
      ),
      v_now
    ),
    (
      v_conversion.id,
      v_invitation.id,
      'admin_attention_required',
      'system',
      null,
      'admin-attention:account-role-conflict',
      jsonb_build_object(
        'reason', 'account_role_conflict',
        'conversion_role', v_conversion.role
      ),
      v_now
    )
    on conflict (conversion_id, dedupe_key)
    do nothing;

    return query
    select
      'attention_required'::text,
      v_conversion.role,
      false,
      false,
      false,
      true;
    return;
  end if;

  v_org_name := coalesce(
    nullif(btrim(v_waitlist.org_name), ''),
    nullif(btrim(v_waitlist.name), ''),
    nullif(btrim(v_waitlist.full_name), '')
  );

  v_vendor_name := coalesce(
    nullif(btrim(v_waitlist.org_name), ''),
    nullif(btrim(v_waitlist.full_name), ''),
    nullif(btrim(v_waitlist.name), ''),
    'FaithBid Vendor'
  );

  v_category :=
    nullif(btrim(v_waitlist.category), '');

  v_city :=
    nullif(btrim(v_waitlist.city), '');

  -- Charter intake historically stored the UI value `onsite`. The canonical
  -- vendors.service_model contract uses `local`, so normalize it here while
  -- preserving all already-canonical values.
  v_service_model := case lower(btrim(coalesce(v_waitlist.delivery_model, '')))
    when 'onsite' then 'local'
    when 'local' then 'local'
    when 'remote' then 'remote'
    when 'both' then 'both'
    when 'national' then 'national'
    else 'both'
  end;

  v_profile_referral_code :=
    nullif(btrim(v_waitlist.referral_code), '');

  if v_profile_referral_code is not null
     and exists (
       select 1
       from public.profiles p
       where p.referral_code =
         v_profile_referral_code
         and p.id <> p_auth_user_id
     ) then
    v_profile_referral_code := public.generate_referral_code();
  end if;

  if not v_profile_exists then
    insert into public.profiles (
      id,
      role,
      org_name,
      city,
      state_code,
      place_id,
      category,
      referral_code,
      referred_by,
      onboarding_complete,
      church_verified,
      founding_vendor,
      private_marketplace_access,
      account_status,
      access_status,
      vendor_tier,
      signup_source,
      signup_source_group,
      email
    ) values (
      p_auth_user_id,
      v_conversion.role,
      v_org_name,
      v_city,
      v_waitlist.state_code,
      v_waitlist.place_id,
      v_category,
      v_profile_referral_code,
      nullif(btrim(v_waitlist.referred_by), ''),
      false,
      false,
      (v_conversion.role = 'vendor'),
      (v_conversion.role = 'church'),
      'active',
      'active',
      'free',
      'waitlist_conversion',
      nullif(
        btrim(v_waitlist.source_group_name),
        ''
      ),
      v_auth_email
    );

    v_profile_created := true;
  else
    update public.profiles p
    set role = coalesce(
          p.role,
          v_conversion.role
        ),
        org_name = coalesce(
          nullif(btrim(p.org_name), ''),
          v_org_name
        ),
        city = coalesce(
          nullif(btrim(p.city), ''),
          v_city
        ),
        state_code = coalesce(
          nullif(btrim(p.state_code), ''),
          v_waitlist.state_code
        ),
        place_id = coalesce(p.place_id, v_waitlist.place_id),
        category = coalesce(
          nullif(btrim(p.category), ''),
          v_category
        ),
        referral_code = coalesce(
          nullif(btrim(p.referral_code), ''),
          v_profile_referral_code
        ),
        referred_by = coalesce(
          nullif(btrim(p.referred_by), ''),
          nullif(btrim(v_waitlist.referred_by), '')
        ),
        founding_vendor = case
          when v_conversion.role = 'vendor' then true
          else p.founding_vendor
        end,
        private_marketplace_access = case
          when v_conversion.role = 'church' then true
          else p.private_marketplace_access
        end,
        signup_source = coalesce(
          nullif(btrim(p.signup_source), ''),
          'waitlist_conversion'
        ),
        signup_source_group = coalesce(
          nullif(btrim(p.signup_source_group), ''),
          nullif(
            btrim(v_waitlist.source_group_name),
            ''
          )
        ),
        email = v_auth_email
    where p.id = p_auth_user_id;
  end if;

  perform public.kb_reconcile_waitlist_referrals_internal(v_waitlist.id, p_auth_user_id);

  if v_conversion.role = 'vendor' then
    if not v_vendor_exists then
      insert into public.vendors (
        user_id,
        name,
        category,
        city,
        base_place_id,
        verified,
        verification_status,
        founding_vendor,
        suspended,
        primary_category,
        category_tags,
        service_city,
        service_state,
        service_model
      ) values (
        p_auth_user_id,
        v_vendor_name,
        v_category,
        v_city,
        v_waitlist.place_id,
        false,
        'approved',
        true,
        false,
        v_category,
        case
          when v_category is null
            then '{}'::text[]
          else array[v_category]
        end,
        v_city,
        v_waitlist.state_code,
        v_service_model
      );

      v_vendor_created := true;
    else
      update public.vendors v
      set name = coalesce(
            nullif(btrim(v.name), ''),
            v_vendor_name
          ),
          category = coalesce(
            nullif(btrim(v.category), ''),
            v_category
          ),
          city = coalesce(
            nullif(btrim(v.city), ''),
            v_city
          ),
          base_place_id = coalesce(v.base_place_id, v_waitlist.place_id),
          primary_category = coalesce(
            nullif(btrim(v.primary_category), ''),
            v_category
          ),
          category_tags = case
            when coalesce(
              cardinality(v.category_tags),
              0
            ) = 0
              and v_category is not null
              then array[v_category]
            else v.category_tags
          end,
          service_city = coalesce(
            nullif(btrim(v.service_city), ''),
            v_city
          ),
          service_state = coalesce(
            nullif(btrim(v.service_state), ''),
            v_waitlist.state_code
          ),
          service_model = coalesce(
            nullif(btrim(v.service_model), ''),
            v_service_model
          ),
          founding_vendor = true,
          verification_status = 'approved'
      where v.user_id = p_auth_user_id;

      -- Faith Verification remains separate. Explicitly do not modify:
      -- verified, verified_at, suspended, tier, ratings, endorsements,
      -- completed-project metrics, or reference/trust evidence.
    end if;
  end if;

  update public.waitlist_invitations
  set invitation_status = 'consumed',
      opened_at = coalesce(opened_at, v_now),
      validated_at = coalesce(validated_at, v_now),
      consumed_at = coalesce(consumed_at, v_now),
      updated_at = v_now
  where id = v_invitation.id;

  update public.waitlist_conversions
  set identity_status = 'authenticated',
      auth_user_id = p_auth_user_id,
      authenticated_at = coalesce(
        authenticated_at,
        v_now
      ),
      validated_at = coalesce(
        validated_at,
        v_now
      ),
      conversion_status = 'completed',
      completed_at = coalesce(
        completed_at,
        v_now
      ),
      consumed_at = coalesce(
        consumed_at,
        v_now
      ),
      attention_required_at = null,
      failure_code = null,
      failure_summary = null,
      failure_retryable = null,
      updated_at = v_now
  where id = v_conversion.id;

  insert into public.waitlist_conversion_events (
    conversion_id,
    invitation_id,
    event_type,
    actor_type,
    actor_user_id,
    dedupe_key,
    safe_meta,
    created_at
  ) values
  (
    v_conversion.id,
    v_invitation.id,
    'invitation_opened',
    'applicant',
    p_auth_user_id,
    'invitation-opened:g'
      || v_invitation.generation::text,
    jsonb_build_object(
      'generation', v_invitation.generation,
      'authenticated', true
    ),
    v_now
  ),
  (
    v_conversion.id,
    v_invitation.id,
    'identity_authenticated',
    'applicant',
    p_auth_user_id,
    'identity-authenticated',
    jsonb_build_object(
      'email_match', true,
      'email_confirmed', true
    ),
    v_now
  ),
  (
    v_conversion.id,
    v_invitation.id,
    'invitation_validated',
    'applicant',
    p_auth_user_id,
    'invitation-validated:g'
      || v_invitation.generation::text,
    jsonb_build_object(
      'generation', v_invitation.generation
    ),
    v_now
  ),
  (
    v_conversion.id,
    v_invitation.id,
    'conversion_started',
    'system',
    null,
    'conversion-started',
    jsonb_build_object(
      'conversion_schema_version',
      v_conversion.conversion_schema_version
    ),
    v_now
  ),
  (
    v_conversion.id,
    v_invitation.id,
    'conversion_completed',
    'system',
    null,
    'conversion-completed',
    jsonb_build_object(
      'role', v_conversion.role,
      'profile_created', v_profile_created,
      'vendor_created', v_vendor_created,
      'charter_vendor', (v_conversion.role = 'vendor'),
      'marketplace_approved', (v_conversion.role = 'vendor')
    ),
    v_now
  ),
  (
    v_conversion.id,
    v_invitation.id,
    'invitation_consumed',
    'applicant',
    p_auth_user_id,
    'invitation-consumed:g'
      || v_invitation.generation::text,
    jsonb_build_object(
      'generation', v_invitation.generation
    ),
    v_now
  )
  on conflict (conversion_id, dedupe_key)
  do nothing;

  return query
  select
    'completed'::text,
    v_conversion.role,
    v_profile_created,
    v_vendor_created,
    true,
    true;
end;
$function$
