-- FAITHBID SQL 0129
-- Pricing Strategy v1.7: beta policy defaults for direct hiring-church rebate.
--
-- This migration records wise beta defaults as configurable policy.
-- It does NOT turn on automatic payouts.
--
-- Founder-safe principle:
-- - These defaults can change for future transactions.
-- - Once published/accepted for a specific transaction, do not retroactively change that transaction's economics.

insert into public.platform_settings(key, value)
values (
  'church_rebate_policy_status',
  jsonb_build_object(
    'strategy_version', 'v1.7',
    'policy_version', 'pricing_strategy_v1_7_beta_defaults_2026_08_13',
    'model', 'direct_hiring_church_cash_rebate',
    'source_basis', 'net_retained_platform_fee',
    'platform_credit_deferred', true,

    'fee_trigger', 'first_platform_payment_clears',
    'fee_trigger_note', 'For beta, treat the platform fee as triggered only when a real platform payment clears, not merely when a project is browsed, proposed, or casually discussed.',

    'fee_base', 'actual_amount_paid_through_faithbid',
    'fee_base_note', 'For beta, use actual paid amount through FaithBid/payment records rather than stale original estimate if project scope changes.',

    'reversal_policy', 'not_final_until_30_days_after_clearance_with_no_open_refund_dispute_or_cancellation',
    'fee_finality_window_days', 30,
    'reversal_policy_note', 'A fee is final only after the finality window passes and there is no open refund, dispute, reversal, or cancellation adjustment.',

    'rebate_percentage', '25_percent_of_net_retained_platform_fee',
    'rebate_rate_basis_points', 2500,
    'rebate_basis_note', 'Rebate is calculated from FaithBid net retained platform fee, after refund/dispute/reversal/cancellation adjustments, never from project value.',

    'payout_method', 'cash',
    'payout_frequency', 'monthly',
    'payout_threshold_cents', 2500,
    'payout_threshold_label', '$25',
    'payout_note', 'Cash payout is the coherent near-term path; payout rail/reconciliation can be manual until bank-transfer automation exists.',

    'active_payouts_enabled', false,
    'automatic_rebate_calculation_enabled', false,
    'retroactive_changes_allowed', false
  )
)
on conflict (key) do update
set value = excluded.value,
    updated_at = now();

alter table public.faithbid_church_rebates
  alter column rebate_rate_basis_points set default 2500,
  alter column policy_version set default 'pricing_strategy_v1_7_beta_defaults_2026_08_13';

comment on column public.faithbid_church_rebates.rebate_rate_basis_points is
  'Beta default is 2500 basis points (25%) of FaithBid net retained platform fee. May change for future transactions, not retroactively after commitment.';

comment on column public.faithbid_church_rebates.policy_version is
  'Policy version applied to the rebate record. Keep transaction economics stable once committed/published.';
