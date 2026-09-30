-- Re-assert the demand truth label using a migration that fails in the same
-- transaction if its stable key ever stops matching exactly one row.

do $$
declare
  affected_rows integer;
begin
  update concierge_ops.pilot_governance_decisions
  set current_truth = 'Demand records are deduplicated across intake sources. The dashboard labels them as intake because source quality, qualification, and commitment are separate facts.',
      next_action = 'Re-run the founder-only summary when source data changes and review record quality before treating any organization or vendor as actionable.',
      updated_at = clock_timestamp()
  where decision_key = 'demand_deduplication';

  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception
      'Expected to update exactly one demand_deduplication governance row; updated %',
      affected_rows;
  end if;

  if not exists (
    select 1
    from concierge_ops.pilot_governance_decisions
    where decision_key = 'demand_deduplication'
      and current_truth = 'Demand records are deduplicated across intake sources. The dashboard labels them as intake because source quality, qualification, and commitment are separate facts.'
  ) then
    raise exception 'Demand truth-label verification failed after update';
  end if;
end
$$;
