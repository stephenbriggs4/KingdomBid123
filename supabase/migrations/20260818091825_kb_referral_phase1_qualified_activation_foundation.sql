-- FaithBid #12 / Checkpoint 1
-- Referral data-contract foundation only.
-- No qualification evaluator, award trigger, priority ordering, launch cutoff,
-- or frontend behavior is introduced in this migration.

ALTER TABLE public.referrals
  ADD COLUMN qualified_at timestamptz NULL;

COMMENT ON COLUMN public.referrals.qualified_at IS
  'Write-once timestamp recording when this referral reached canonical Qualified Activation. Separate from referrals.status account-conversion semantics.';

ALTER TABLE public.referrals
  ALTER COLUMN credit_amount DROP DEFAULT;

ALTER TABLE public.referrals
  ADD CONSTRAINT referrals_no_self_referral_check
  CHECK (
    referrer_id IS NULL
    OR referred_user_id IS NULL
    OR referrer_id <> referred_user_id
  );

ALTER TABLE public.referral_rewards
  ADD CONSTRAINT referral_rewards_user_type_unique
  UNIQUE (user_id, reward_type);

CREATE OR REPLACE FUNCTION public.kb_guard_referral_qualified_at_write_once()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF OLD.qualified_at IS NOT NULL
     AND NEW.qualified_at IS DISTINCT FROM OLD.qualified_at THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'referrals.qualified_at is immutable once set';
  END IF;

  RETURN NEW;
END
$function$;

CREATE TRIGGER kb_guard_referral_qualified_at_write_once
BEFORE UPDATE OF qualified_at ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.kb_guard_referral_qualified_at_write_once();

CREATE OR REPLACE FUNCTION public.kb_reconcile_waitlist_referrals_internal(
  p_waitlist_id uuid,
  p_auth_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_waitlist public.waitlist%rowtype;
  v_own_code text;
  v_email text;
  v_role text;
begin
  if p_waitlist_id is null or p_auth_user_id is null then return; end if;

  select * into v_waitlist
  from public.waitlist w
  where w.id = p_waitlist_id;

  if not found then return; end if;

  v_own_code := public.kb_canonical_referral_code(v_waitlist.referral_code);
  v_email := lower(btrim(coalesce(v_waitlist.email,'')));
  v_role := lower(btrim(coalesce(v_waitlist.role,'')));

  -- Backfill the referrer account only when doing so cannot create a
  -- self-referral relationship with an already-linked referred user.
  if v_own_code ~ '^[A-Z0-9]{4,16}$' then
    update public.referrals r
       set referrer_id = p_auth_user_id
     where r.referrer_id is null
       and public.kb_canonical_referral_code(r.referrer_code) = v_own_code
       and (r.referred_user_id is null or r.referred_user_id <> p_auth_user_id);
  end if;

  -- Link the referred account only when doing so cannot make the same user
  -- both the referrer and referred participant.
  if v_email <> '' and v_role in ('church','vendor') then
    update public.referrals r
       set referred_id = p_auth_user_id,
           referred_user_id = p_auth_user_id,
           status = 'converted'
     where r.type = 'waitlist'
       and lower(btrim(coalesce(r.referred_email,''))) = v_email
       and lower(btrim(coalesce(r.referred_role,''))) = v_role
       and (r.referred_user_id is null or r.referred_user_id = p_auth_user_id)
       and (r.referrer_id is null or r.referrer_id <> p_auth_user_id);
  end if;
end
$function$;
