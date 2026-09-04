alter table public.growth_vendors
  add column if not exists business_identity_status text not null default 'unverified',
  add column if not exists website_safety_status text not null default 'unchecked',
  add column if not exists licensing_status text not null default 'unverified',
  add column if not exists insurance_status text not null default 'unverified',
  add column if not exists references_status text not null default 'not_started',
  add column if not exists commercial_capacity_status text not null default 'unverified',
  add column if not exists church_fit_status text not null default 'unverified',
  add column if not exists verification_reviewed_at timestamptz,
  add column if not exists verification_next_action text;

alter table public.growth_vendors
  drop constraint if exists growth_vendors_business_identity_status_check,
  add constraint growth_vendors_business_identity_status_check
    check (business_identity_status in ('unverified','verified','concern')),
  drop constraint if exists growth_vendors_website_safety_status_check,
  add constraint growth_vendors_website_safety_status_check
    check (website_safety_status in ('unchecked','safe','hold','not_applicable')),
  drop constraint if exists growth_vendors_licensing_status_check,
  add constraint growth_vendors_licensing_status_check
    check (licensing_status in ('unverified','verified','not_applicable','expired','concern')),
  drop constraint if exists growth_vendors_insurance_status_check,
  add constraint growth_vendors_insurance_status_check
    check (insurance_status in ('unverified','verified','expired','concern')),
  drop constraint if exists growth_vendors_references_status_check,
  add constraint growth_vendors_references_status_check
    check (references_status in ('not_started','in_progress','verified','concern')),
  drop constraint if exists growth_vendors_commercial_capacity_status_check,
  add constraint growth_vendors_commercial_capacity_status_check
    check (commercial_capacity_status in ('unverified','verified','limited','concern')),
  drop constraint if exists growth_vendors_church_fit_status_check,
  add constraint growth_vendors_church_fit_status_check
    check (church_fit_status in ('unverified','verified','concern','not_applicable'));

comment on column public.growth_vendors.business_identity_status is
  'Founder-reviewed business identity evidence gate.';
comment on column public.growth_vendors.website_safety_status is
  'Founder-reviewed website/domain safety gate; hold blocks promotion.';
comment on column public.growth_vendors.licensing_status is
  'Founder-reviewed licensing/registration gate.';
comment on column public.growth_vendors.insurance_status is
  'Founder-reviewed insurance evidence gate.';
comment on column public.growth_vendors.references_status is
  'Founder-reviewed reference evidence gate.';
comment on column public.growth_vendors.commercial_capacity_status is
  'Founder-reviewed commercial delivery capacity gate.';
comment on column public.growth_vendors.church_fit_status is
  'Founder-reviewed church/ministry fit gate.';

create or replace function concierge_ops.enforce_growth_vendor_promotion_gate()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, concierge_ops
as $$
declare
  source_vendor public.growth_vendors%rowtype;
  source_status text;
  source_commitment text;
begin
  if new.growth_vendor_id is null then
    return new;
  end if;

  select *
  into source_vendor
  from public.growth_vendors
  where id = new.growth_vendor_id;

  if not found then
    raise exception 'Growth Engine source vendor was not found.';
  end if;

  source_status := lower(coalesce(source_vendor.status, ''));
  source_commitment := lower(coalesce(source_vendor.commitment_level, ''));

  if source_status = 'research_hold'
     or not (
       source_status = any (array['qualified','approved','ready','interested','converted'])
       or source_commitment = any (array['qualified','committed','confirmed'])
     )
     or source_vendor.business_identity_status <> 'verified'
     or source_vendor.website_safety_status not in ('safe','not_applicable')
     or source_vendor.licensing_status not in ('verified','not_applicable')
     or source_vendor.insurance_status <> 'verified'
     or source_vendor.references_status <> 'verified'
     or source_vendor.commercial_capacity_status <> 'verified'
     or source_vendor.church_fit_status <> 'verified'
  then
    raise exception 'Growth Engine vendor is not eligible for Concierge promotion. Complete every verification gate and clear any research hold first.';
  end if;

  return new;
end;
$$;

drop trigger if exists vendors_growth_vendor_promotion_gate on concierge_ops.vendors;
create trigger vendors_growth_vendor_promotion_gate
before insert or update of growth_vendor_id on concierge_ops.vendors
for each row
execute function concierge_ops.enforce_growth_vendor_promotion_gate();

revoke all on function concierge_ops.enforce_growth_vendor_promotion_gate()
  from public, anon, authenticated;
