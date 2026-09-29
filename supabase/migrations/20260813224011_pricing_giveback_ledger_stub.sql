-- FAITHBID SQL 0128
-- Pricing Strategy v1.7: direct hiring-church rebate ledger stub.
--
-- Purpose:
-- - Retire the old pooled "ministry fund" concept at the data-model layer.
-- - Prepare a transaction-specific rebate ledger tied to the hiring church.
-- - Preserve open founder decisions by storing explicit policy-pending state.
-- - Do NOT calculate, schedule, or pay rebates in this migration.

create table if not exists public.faithbid_church_rebates (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null references public.projects(id) on delete cascade,
  bid_id uuid references public.bids(id) on delete set null,
  hire_confirmation_id uuid references public.hire_confirmations(id) on delete set null,
  payment_plan_id uuid references public.project_payment_plans(id) on delete set null,
  installment_id uuid references public.project_payment_installments(id) on delete set null,
  stripe_transaction_id uuid references public.stripe_payment_transactions(id) on delete set null,

  church_id uuid not null references public.profiles(id) on delete restrict,
  vendor_id uuid not null references public.vendors(id) on delete restrict,

  gross_platform_fee_cents bigint not null default 0 check (gross_platform_fee_cents >= 0),
  refund_adjustment_cents bigint not null default 0 check (refund_adjustment_cents >= 0),
  dispute_adjustment_cents bigint not null default 0 check (dispute_adjustment_cents >= 0),
  reversal_adjustment_cents bigint not null default 0 check (reversal_adjustment_cents >= 0),
  net_retained_platform_fee_cents bigint generated always as (
    greatest(
      0,
      gross_platform_fee_cents
        - refund_adjustment_cents
        - dispute_adjustment_cents
        - reversal_adjustment_cents
    )
  ) stored,

  rebate_basis text not null default 'net_retained_platform_fee'
    check (rebate_basis = 'net_retained_platform_fee'),
  rebate_rate_basis_points integer
    check (rebate_rate_basis_points is null or (rebate_rate_basis_points >= 0 and rebate_rate_basis_points <= 10000)),
  rebate_amount_cents bigint
    check (rebate_amount_cents is null or rebate_amount_cents >= 0),

  fee_finality_status text not null default 'policy_pending'
    check (fee_finality_status in (
      'policy_pending',
      'pending_collection',
      'collected_not_final',
      'final',
      'reversed',
      'void'
    )),
  rebate_status text not null default 'not_configured'
    check (rebate_status in (
      'not_configured',
      'pending_finality',
      'eligible',
      'scheduled',
      'paid',
      'void',
      'reversed'
    )),

  payout_method text not null default 'cash_pending_rail'
    check (payout_method in ('cash_pending_rail', 'cash_ach', 'cash_check', 'manual_cash')),
  payout_reference text,
  payout_scheduled_at timestamptz,
  payout_paid_at timestamptz,

  policy_version text not null default 'pricing_strategy_v1_7_open_decisions',
  open_decisions jsonb not null default jsonb_build_object(
    'fee_trigger', 'open',
    'fee_base', 'open',
    'reversal_policy', 'open',
    'rebate_percentage', 'open',
    'payout_frequency', 'open',
    'payout_threshold', 'open'
  ),
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.faithbid_church_rebates is
  'Transaction-specific direct rebate ledger for the hiring church. Stubbed for Pricing Strategy v1.7; no payout logic is activated until open founder decisions are finalized.';

comment on column public.faithbid_church_rebates.net_retained_platform_fee_cents is
  'FaithBid platform fee remaining after refund, dispute, reversal, and cancellation adjustments. Church rebate must be based on this value, not raw collection.';

comment on column public.faithbid_church_rebates.rebate_rate_basis_points is
  'Null until founder selects the direct church rebate percentage.';

comment on column public.faithbid_church_rebates.fee_finality_status is
  'Policy-pending until the fee trigger, fee base, and reversal/finality rules are published.';

create index if not exists faithbid_church_rebates_project_idx
  on public.faithbid_church_rebates(project_id);

create index if not exists faithbid_church_rebates_church_idx
  on public.faithbid_church_rebates(church_id);

create index if not exists faithbid_church_rebates_vendor_idx
  on public.faithbid_church_rebates(vendor_id);

create index if not exists faithbid_church_rebates_status_idx
  on public.faithbid_church_rebates(fee_finality_status, rebate_status);

create unique index if not exists faithbid_church_rebates_stripe_transaction_once_idx
  on public.faithbid_church_rebates(stripe_transaction_id)
  where stripe_transaction_id is not null;

alter table public.faithbid_church_rebates enable row level security;

revoke all on table public.faithbid_church_rebates from anon;
revoke all on table public.faithbid_church_rebates from authenticated;

insert into public.platform_settings(key, value)
values (
  'church_rebate_policy_status',
  jsonb_build_object(
    'strategy_version', 'v1.7',
    'model', 'direct_hiring_church_cash_rebate',
    'source_basis', 'net_retained_platform_fee',
    'platform_credit_deferred', true,
    'fee_trigger', 'open',
    'fee_base', 'open',
    'reversal_policy', 'open',
    'rebate_percentage', 'open',
    'payout_frequency', 'open',
    'payout_threshold', 'open',
    'active_payouts_enabled', false
  )
)
on conflict (key) do update
set value = excluded.value,
    updated_at = now();
