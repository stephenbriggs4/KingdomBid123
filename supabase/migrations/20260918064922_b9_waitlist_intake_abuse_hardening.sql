
-- B9: the public waitlist intake had no rate limiting, no honeypot, and no
-- duplicate-submission handling -- an attacker could submit unlimited rows,
-- including under an email they don't own (pre-claiming), with no cost.
-- Benchmark: the existing vendor_reference_submission_attempts pattern
-- (ip_hash via the existing kb_request_ip_fingerprint() helper, an attempt
-- log, generic responses that don't leak which email is already registered).

create table if not exists public.waitlist_submission_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  accepted boolean not null,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.waitlist_submission_attempts enable row level security;
-- Service/definer-only table: no direct client policies, matching the
-- reference-attempt table's deny-by-default posture.

create index if not exists waitlist_submission_attempts_ip_created_idx
  on public.waitlist_submission_attempts (ip_hash, created_at desc);

CREATE OR REPLACE FUNCTION public.kb_submit_waitlist_application(p_payload jsonb)
 RETURNS TABLE(id uuid, created_at timestamp with time zone, referral_code text, queue_position bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_role text;
  v_email text;
  v_full_name text;
  v_org_name text;
  v_title_role text;
  v_category text;
  v_city text;
  v_state_code text;
  v_place_id uuid;
  v_geo_required boolean := false;
  v_delivery_model text;
  v_congregation_size text;
  v_first_project text;
  v_past_church_client text;
  v_referral_code text;
  v_referred_by text;
  v_source text;

  v_claim_drop_text text;
  v_claim_drop_id uuid;
  v_claim_source_group_name text;
  v_drop_group_id uuid;
  v_drop_audience text;
  v_drop_campaign_key text;
  v_drop_group_name text;
  v_final_group_id uuid;
  v_final_drop_id uuid;
  v_final_campaign_key text;
  v_final_source_group_name text;
  v_attribution_verified boolean := NULL;

  v_row public.waitlist%rowtype;
  v_position bigint;
  v_attempt integer := 0;
  v_constraint text;

  v_ip_hash text;
  v_recent_attempts integer;
  v_honeypot text;
  v_existing public.waitlist%rowtype;
BEGIN
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION USING errcode='22023', message='Invalid application payload.';
  END IF;

  v_ip_hash := public.kb_request_ip_fingerprint();

  SELECT count(*) INTO v_recent_attempts
  FROM public.waitlist_submission_attempts a
  WHERE a.ip_hash = v_ip_hash
    AND a.created_at > now() - interval '1 hour';

  IF v_recent_attempts >= 8 THEN
    INSERT INTO public.waitlist_submission_attempts (ip_hash, accepted, reason)
    VALUES (v_ip_hash, false, 'rate_limited');
    RAISE EXCEPTION USING errcode='429', message='Too many attempts. Please wait a while and try again.';
  END IF;

  -- Honeypot: a real visitor never sees or fills this field. A bot that
  -- fills every field gets a normal-shaped success with nothing stored, so
  -- it has no signal to distinguish this from a real submission.
  v_honeypot := nullif(btrim(coalesce(p_payload->>'hp_field', '')), '');
  IF v_honeypot IS NOT NULL THEN
    INSERT INTO public.waitlist_submission_attempts (ip_hash, accepted, reason)
    VALUES (v_ip_hash, false, 'honeypot');
    RETURN QUERY SELECT gen_random_uuid(), now(), 'FB' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)), 1::bigint;
    RETURN;
  END IF;

  v_role := lower(btrim(coalesce(p_payload->>'role','')));
  v_email := lower(btrim(coalesce(p_payload->>'email','')));
  v_full_name := nullif(btrim(coalesce(p_payload->>'full_name','')), '');
  v_org_name := nullif(btrim(coalesce(p_payload->>'org_name','')), '');
  v_title_role := nullif(btrim(coalesce(p_payload->>'title_role','')), '');
  v_category := nullif(btrim(coalesce(p_payload->>'category','')), '');
  v_city := nullif(btrim(coalesce(p_payload->>'city','')), '');
  v_state_code := upper(nullif(btrim(coalesce(p_payload->>'state_code','')), ''));
  select exists (
    select 1 from public.platform_settings s
    where s.key = 'waitlist_geo_required'
      and lower(btrim(coalesce(s.value, ''))) in ('true','1','yes','on')
  ) into v_geo_required;
  v_delivery_model := nullif(btrim(coalesce(p_payload->>'delivery_model','')), '');
  v_congregation_size := nullif(btrim(coalesce(p_payload->>'congregation_size','')), '');
  v_first_project := nullif(btrim(coalesce(p_payload->>'first_project','')), '');
  v_past_church_client := nullif(btrim(coalesce(p_payload->>'past_church_client','')), '');
  v_referred_by := upper(regexp_replace(coalesce(p_payload->>'referred_by',''), '[^A-Za-z0-9]', '', 'g'));
  v_source := nullif(btrim(coalesce(p_payload->>'source','')), '');
  v_referral_code := null; -- server-generated; browser-supplied codes are never authoritative

  v_claim_drop_text := nullif(btrim(coalesce(p_payload->>'drop_id','')), '');
  v_claim_source_group_name := nullif(left(btrim(coalesce(p_payload->>'source_group_name','')),160), '');
  v_final_source_group_name := v_claim_source_group_name;

  IF v_role NOT IN ('church','vendor') THEN
    INSERT INTO public.waitlist_submission_attempts (ip_hash, accepted, reason) VALUES (v_ip_hash, false, 'invalid_role');
    RAISE EXCEPTION USING errcode='22023', message='Application role must be church or vendor.';
  END IF;

  IF v_email='' OR char_length(v_email)>254
     OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    INSERT INTO public.waitlist_submission_attempts (ip_hash, accepted, reason) VALUES (v_ip_hash, false, 'invalid_email');
    RAISE EXCEPTION USING errcode='22023', message='A valid email address is required.';
  END IF;

  IF v_full_name IS NULL OR char_length(v_full_name)>120 THEN
    RAISE EXCEPTION USING errcode='22023', message='A valid full name is required.';
  END IF;

  IF v_org_name IS NULL OR char_length(v_org_name)>160 THEN
    RAISE EXCEPTION USING errcode='22023', message='A valid organization name is required.';
  END IF;

  IF char_length(coalesce(v_title_role,''))>120
     OR char_length(coalesce(v_category,''))>120
     OR char_length(coalesce(v_city,''))>120
     OR char_length(coalesce(v_delivery_model,''))>120
     OR char_length(coalesce(v_congregation_size,''))>120
     OR char_length(coalesce(v_first_project,''))>200
     OR char_length(coalesce(v_past_church_client,''))>200
     OR char_length(coalesce(v_source,''))>120 THEN
    RAISE EXCEPTION USING errcode='22023', message='One or more application fields are too long.';
  END IF;

  IF v_state_code IS NOT NULL AND v_state_code !~ '^[A-Z]{2}$' THEN
    RAISE EXCEPTION USING errcode='22023', message='A valid two-letter state code is required.';
  END IF;

  IF v_geo_required AND (v_city IS NULL OR v_state_code IS NULL) THEN
    RAISE EXCEPTION USING errcode='22023', message='City and state are required for early access.';
  END IF;

  IF v_role='vendor' AND (v_category IS NULL OR v_city IS NULL OR v_delivery_model IS NULL) THEN
    RAISE EXCEPTION USING errcode='22023', message='Vendor category, service area, and delivery model are required.';
  END IF;

  -- Duplicate handling: return the existing application's own receipt
  -- (same shape as a fresh success) instead of inserting again or raising a
  -- distinct "already exists" error. This makes repeated/automated
  -- resubmission a no-op instead of queue spam, and never gives a caller a
  -- way to distinguish "this email is already on the waitlist" from "this is
  -- a brand-new application" (email-enumeration protection).
  SELECT * INTO v_existing
  FROM public.waitlist w
  WHERE w.email = v_email AND w.role = v_role
  ORDER BY w.created_at ASC
  LIMIT 1;

  IF FOUND THEN
    INSERT INTO public.waitlist_submission_attempts (ip_hash, accepted, reason) VALUES (v_ip_hash, true, 'duplicate_idempotent');
    SELECT count(*)::bigint INTO v_position
    FROM public.waitlist w
    WHERE w.role = v_existing.role
      AND (
        w.created_at < v_existing.created_at
        OR (w.created_at = v_existing.created_at AND w.id <= v_existing.id)
      );
    RETURN QUERY SELECT v_existing.id, v_existing.created_at, v_existing.referral_code, v_position;
    RETURN;
  END IF;

  IF v_city IS NOT NULL AND v_state_code IS NOT NULL THEN
    SELECT p.id INTO v_place_id
    FROM public.geo_places p
    WHERE p.active
      AND lower(btrim(p.city)) = lower(btrim(v_city))
      AND p.state_code = v_state_code
      AND p.country_code = 'US'
    ORDER BY p.id
    LIMIT 1;
  END IF;

  IF v_referred_by !~ '^[A-Z0-9]{4,16}$' THEN v_referred_by := NULL; END IF;
  IF v_referral_code !~ '^[A-Z0-9]{4,16}$' THEN v_referral_code := NULL; END IF;

  -- Attribution is optional. Invalid/tampered claims never block signup.
  IF v_claim_drop_text IS NOT NULL THEN
    BEGIN
      v_claim_drop_id := v_claim_drop_text::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      v_claim_drop_id := NULL;
      v_attribution_verified := FALSE;
    END;

    IF v_claim_drop_id IS NOT NULL THEN
      SELECT d.group_id, d.audience_type, d.campaign_key, g.name
      INTO v_drop_group_id, v_drop_audience, v_drop_campaign_key, v_drop_group_name
      FROM public.growth_drops d
      JOIN public.groups g ON g.id=d.group_id
      WHERE d.id=v_claim_drop_id
        AND d.status IN ('link_generated','posted');

      IF FOUND AND (
        v_drop_audience='both'
        OR (v_drop_audience='church' AND v_role='church')
        OR (v_drop_audience='vendor' AND v_role='vendor')
      ) THEN
        v_final_group_id := v_drop_group_id;
        v_final_drop_id := v_claim_drop_id;
        v_final_campaign_key := v_drop_campaign_key;
        v_final_source_group_name := v_drop_group_name;
        v_attribution_verified := TRUE;
      ELSE
        v_attribution_verified := FALSE;
      END IF;
    END IF;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('faithbid_waitlist_queue:'||v_role,0));

  LOOP
    v_attempt := v_attempt+1;
    IF v_referral_code IS NULL OR v_attempt>1 THEN
      v_referral_code := 'FB'
        || upper(substr(replace(gen_random_uuid()::text,'-',''),1,4))
        || lpad((floor(random()*9000)+1000)::integer::text,4,'0');
    END IF;

    BEGIN
      INSERT INTO public.waitlist(
        role,email,full_name,org_name,title_role,category,city,state_code,place_id,delivery_model,
        congregation_size,first_project,past_church_client,referral_code,
        referred_by,source,source_group_name,group_id,drop_id,campaign_key,
        attribution_verified
      ) VALUES (
        v_role,
        v_email,
        v_full_name,
        v_org_name,
        v_title_role,
        CASE WHEN v_role='vendor' THEN v_category ELSE NULL END,
        v_city,
        v_state_code,
        v_place_id,
        CASE WHEN v_role='vendor' THEN v_delivery_model ELSE NULL END,
        CASE WHEN v_role='church' THEN v_congregation_size ELSE NULL END,
        CASE WHEN v_role='church' THEN v_first_project ELSE NULL END,
        CASE WHEN v_role='vendor' THEN v_past_church_client ELSE NULL END,
        v_referral_code,
        v_referred_by,
        coalesce(v_source, CASE WHEN v_role='vendor' THEN 'vendor-signup' ELSE 'church-signup' END),
        v_final_source_group_name,
        v_final_group_id,
        v_final_drop_id,
        v_final_campaign_key,
        v_attribution_verified
      )
      RETURNING * INTO v_row;

      EXIT;
    EXCEPTION WHEN unique_violation THEN
      GET STACKED DIAGNOSTICS v_constraint=CONSTRAINT_NAME;
      IF v_constraint IN ('waitlist_referral_code_key','waitlist_referral_idx') AND v_attempt<5 THEN
        v_referral_code := NULL;
      ELSE
        RAISE;
      END IF;
    END;
  END LOOP;

  INSERT INTO public.waitlist_submission_attempts (ip_hash, accepted, reason) VALUES (v_ip_hash, true, 'accepted');

  SELECT count(*)::bigint
  INTO v_position
  FROM public.waitlist w
  WHERE w.role=v_row.role
    AND (
      w.created_at<v_row.created_at
      OR (w.created_at=v_row.created_at AND w.id<=v_row.id)
    );

  RETURN QUERY
  SELECT v_row.id, v_row.created_at, v_row.referral_code, v_position;
END;
$function$
