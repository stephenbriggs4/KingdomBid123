-- Defense-in-depth: these private trigger functions write data and were
-- executable by anonymous users. Trigger firing does not check EXECUTE at
-- call time (only when the trigger is created), so revoking EXECUTE from
-- anon and PUBLIC does not affect the triggers.
revoke execute on function private.faithbid_sync_project_bids_count_v1() from public, anon;
revoke execute on function private.kb_seed_cohort_gated_growth_foundations_v0() from public, anon;
revoke execute on function private.kb_seed_real_project_milestone_tasks_v0() from public, anon;
