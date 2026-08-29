-- FaithBid 0212 - Stage 2 recurring-updates consent policy
-- REVIEW DRAFT ONLY. Run only after the 0211 participation migration exists.
-- Exact source bytes: CONSENT_COPY.txt

begin;

update public.gpi_participation_consent_policies
set active = false,
    retired_at = coalesce(retired_at, greatest(effective_at, clock_timestamp()))
where active;

insert into public.gpi_participation_consent_policies (
  version,
  body_hash,
  effective_at,
  retired_at,
  active
) values (
  'stage2-recurring-updates-v1',
  '8c05f11b1bf3c8a2978be81506ee5e258220dbffc429e676d221fa8bab7fd3ef',
  clock_timestamp(),
  null,
  true
);

commit;


