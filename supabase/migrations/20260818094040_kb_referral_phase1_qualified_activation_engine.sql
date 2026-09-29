-- FaithBid Referral Phase 1 — Checkpoint 2
-- Server-owned Qualified Activation engine, founding-period award gate,
-- and validated-referral admin review queue support.

-- 1) One-way founding-period closure guard.
CREATE OR REPLACE FUNCTION public.kb_guard_founding_period_closure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_now timestamptz;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.key = 'founding_period_closed_at' THEN
      PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtext('faithbid'),
        pg_catalog.hashtext('founding_connector_period')
      );
      v_now := pg_catalog.clock_timestamp();
      NEW.value := v_now::text;
      NEW.updated_at := v_now;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.key = 'founding_period_closed_at'
       OR NEW.key = 'founding_period_closed_at' THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'founding_period_closed_at is immutable once set';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.key = 'founding_period_closed_at' THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'founding_period_closed_at cannot be deleted once set';
    END IF;
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END
$function$;

DROP TRIGGER IF EXISTS kb_guard_founding_period_closure ON public.platform_settings;
CREATE TRIGGER kb_guard_founding_period_closure
BEFORE INSERT OR UPDATE OR DELETE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.kb_guard_founding_period_closure();

-- 2) Private idempotent evaluator.
--    qualified_at records historical truth regardless of founding-period state.
--    Founding Connector is awarded only if qualification occurred before closure.
CREATE OR REPLACE FUNCTION public.kb_evaluate_referral_qualification_internal(
  p_referred_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_referral_id uuid;
  v_referrer_id uuid;
  v_referred_role text;
  v_status text;
  v_existing_qualified_at timestamptz;
  v_profile_role text;
  v_onboarding_complete boolean;
  v_conversion_ok boolean := false;
  v_vendor_ok boolean := false;
  v_now timestamptz;
  v_effective_qualified_at timestamptz;
  v_closed_at timestamptz;
BEGIN
  IF p_referred_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    r.id,
    r.referrer_id,
    lower(btrim(coalesce(r.referred_role, ''))),
    lower(btrim(coalesce(r.status, ''))),
    r.qualified_at
  INTO
    v_referral_id,
    v_referrer_id,
    v_referred_role,
    v_status,
    v_existing_qualified_at
  FROM public.referrals r
  WHERE r.referred_user_id = p_referred_user_id
    AND r.type IN ('signup', 'waitlist')
  ORDER BY r.created_at NULLS LAST, r.id
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_status <> 'converted'
     OR v_referrer_id IS NULL
     OR v_referrer_id = p_referred_user_id THEN
    RETURN;
  END IF;

  SELECT
    lower(btrim(coalesce(p.role, ''))),
    coalesce(p.onboarding_complete, false)
  INTO
    v_profile_role,
    v_onboarding_complete
  FROM public.profiles p
  WHERE p.id = p_referred_user_id;

  IF NOT FOUND
     OR v_profile_role NOT IN ('church', 'vendor')
     OR NOT v_onboarding_complete
     OR v_referred_role <> v_profile_role THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.waitlist_conversions c
    WHERE c.auth_user_id = p_referred_user_id
      AND c.role = v_profile_role
      AND c.conversion_status = 'completed'
      AND c.completed_at IS NOT NULL
      AND c.authorization_status = 'active'
  )
  INTO v_conversion_ok;

  IF NOT v_conversion_ok THEN
    RETURN;
  END IF;

  IF v_profile_role = 'vendor' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.vendors v
      WHERE v.user_id = p_referred_user_id
        AND coalesce(v.founding_vendor, false) = true
        AND lower(btrim(coalesce(v.verification_status, ''))) = 'approved'
        AND coalesce(v.suspended, false) = false
    )
    INTO v_vendor_ok;

    IF NOT v_vendor_ok THEN
      RETURN;
    END IF;
  END IF;

  v_now := pg_catalog.clock_timestamp();

  IF v_existing_qualified_at IS NULL THEN
    UPDATE public.referrals
       SET qualified_at = v_now
     WHERE id = v_referral_id
       AND qualified_at IS NULL
    RETURNING qualified_at INTO v_effective_qualified_at;

    IF NOT FOUND THEN
      SELECT r.qualified_at
        INTO v_effective_qualified_at
      FROM public.referrals r
      WHERE r.id = v_referral_id;
    END IF;
  ELSE
    v_effective_qualified_at := v_existing_qualified_at;
  END IF;

  IF v_effective_qualified_at IS NULL THEN
    RETURN;
  END IF;

  -- Serialize award eligibility against the one-way founding-period closure.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('faithbid'),
    pg_catalog.hashtext('founding_connector_period')
  );

  SELECT ps.value::timestamptz
    INTO v_closed_at
  FROM public.platform_settings ps
  WHERE ps.key = 'founding_period_closed_at';

  IF v_closed_at IS NULL OR v_effective_qualified_at < v_closed_at THEN
    -- The award ledger is user-level; do not overload a single referral row
    -- to represent a permanent referrer achievement.
    IF EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = v_referrer_id
    ) THEN
      INSERT INTO public.referral_rewards (
        user_id,
        reward_type,
        reward_label,
        referral_count_at_award,
        fulfilled,
        fulfilled_at
      ) VALUES (
        v_referrer_id,
        'founding_connector',
        'Founding Connector',
        1,
        true,
        v_now
      )
      ON CONFLICT (user_id, reward_type) DO NOTHING;
    END IF;
  END IF;
END
$function$;

-- 3) Trigger wrappers. They deliberately fail open for the core account flow:
--    referral-recognition defects must never block account conversion/onboarding.
CREATE OR REPLACE FUNCTION public.kb_referral_qualification_profile_touch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_referred_user_id uuid;
BEGIN
  BEGIN
    IF coalesce(NEW.onboarding_complete, false) THEN
      PERFORM public.kb_evaluate_referral_qualification_internal(NEW.id);
    END IF;

    -- If this newly-created profile is itself a referrer, retry any already-
    -- qualified referred users so the user-level award can be granted now that
    -- the referral_rewards FK target definitely exists.
    IF TG_OP = 'INSERT' THEN
      FOR v_referred_user_id IN
        SELECT r.referred_user_id
        FROM public.referrals r
        WHERE r.referrer_id = NEW.id
          AND r.referred_user_id IS NOT NULL
          AND r.qualified_at IS NOT NULL
      LOOP
        PERFORM public.kb_evaluate_referral_qualification_internal(v_referred_user_id);
      END LOOP;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'referral qualification profile evaluation failed for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION public.kb_referral_qualification_conversion_touch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  BEGIN
    IF NEW.auth_user_id IS NOT NULL
       AND NEW.conversion_status = 'completed'
       AND NEW.authorization_status = 'active' THEN
      PERFORM public.kb_evaluate_referral_qualification_internal(NEW.auth_user_id);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'referral qualification conversion evaluation failed for user %: %', NEW.auth_user_id, SQLERRM;
  END;

  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION public.kb_referral_qualification_vendor_touch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  BEGIN
    IF NEW.user_id IS NOT NULL THEN
      PERFORM public.kb_evaluate_referral_qualification_internal(NEW.user_id);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'referral qualification vendor evaluation failed for user %: %', NEW.user_id, SQLERRM;
  END;

  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION public.kb_referral_qualification_referral_touch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  BEGIN
    IF NEW.referred_user_id IS NOT NULL THEN
      PERFORM public.kb_evaluate_referral_qualification_internal(NEW.referred_user_id);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'referral qualification referral evaluation failed for referred user %: %', NEW.referred_user_id, SQLERRM;
  END;

  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS kb_referral_qualification_profile_touch ON public.profiles;
CREATE TRIGGER kb_referral_qualification_profile_touch
AFTER INSERT OR UPDATE OF onboarding_complete, role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.kb_referral_qualification_profile_touch();

DROP TRIGGER IF EXISTS kb_referral_qualification_conversion_touch ON public.waitlist_conversions;
CREATE TRIGGER kb_referral_qualification_conversion_touch
AFTER INSERT OR UPDATE OF conversion_status, auth_user_id, authorization_status
ON public.waitlist_conversions
FOR EACH ROW
EXECUTE FUNCTION public.kb_referral_qualification_conversion_touch();

DROP TRIGGER IF EXISTS kb_referral_qualification_vendor_touch ON public.vendors;
CREATE TRIGGER kb_referral_qualification_vendor_touch
AFTER INSERT OR UPDATE OF founding_vendor, verification_status, suspended
ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.kb_referral_qualification_vendor_touch();

DROP TRIGGER IF EXISTS kb_referral_qualification_referral_touch ON public.referrals;
CREATE TRIGGER kb_referral_qualification_referral_touch
AFTER INSERT OR UPDATE OF referrer_id, referred_user_id, status
ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.kb_referral_qualification_referral_touch();

-- 4) Validated-referral admin review queue support.
--    SECURITY INVOKER preserves the underlying waitlist/referrals RLS checks.
CREATE OR REPLACE VIEW public.kb_waitlist_review_queue
WITH (security_invoker = true)
AS
SELECT
  w.*,
  EXISTS (
    SELECT 1
    FROM public.referrals r
    WHERE r.type = 'waitlist'
      AND lower(btrim(coalesce(r.referred_email, ''))) = lower(btrim(coalesce(w.email, '')))
      AND lower(btrim(coalesce(r.referred_role, ''))) = lower(btrim(coalesce(w.role, '')))
  ) AS has_valid_referral
FROM public.waitlist w;

REVOKE ALL ON TABLE public.kb_waitlist_review_queue FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.kb_waitlist_review_queue TO authenticated;

-- 5) Keep server-owned functions out of normal browser RPC surface.
REVOKE ALL ON FUNCTION public.kb_evaluate_referral_qualification_internal(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kb_evaluate_referral_qualification_internal(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.kb_guard_founding_period_closure() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.kb_referral_qualification_profile_touch() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.kb_referral_qualification_conversion_touch() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.kb_referral_qualification_vendor_touch() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.kb_referral_qualification_referral_touch() FROM PUBLIC, anon, authenticated;
