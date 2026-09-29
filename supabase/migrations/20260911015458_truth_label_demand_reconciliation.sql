-- Keep deduplicated demand metrics honest: intake records are not qualified
-- prospects, active bench vendors, or founding-pilot commitments.

update concierge_ops.pilot_governance_decisions
set current_truth = 'Demand records are deduplicated across intake sources. The dashboard labels them as intake because source quality, qualification, and commitment are separate facts.',
    next_action = 'Re-run the founder-only summary when source data changes and review record quality before treating any organization or vendor as actionable.',
    updated_at = clock_timestamp()
where decision_key = 'demand_reconciliation';

notify pgrst, 'reload schema';
