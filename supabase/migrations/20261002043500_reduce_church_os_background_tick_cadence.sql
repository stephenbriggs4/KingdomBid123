-- Reduce idle Church OS automation polling pressure on the shared database.
--
-- Live evidence on 2026-10-01 showed the every-minute job had no event backlog,
-- while 44 starts failed with "job startup timeout" in the preceding 24 hours.
-- Five-minute polling keeps the internal automation responsive without spending a
-- database worker connection on an idle check every minute.

do $migration$
declare
  v_job_id bigint;
begin
  select j.jobid
    into v_job_id
  from cron.job as j
  where j.jobname = 'churchly-automation-background-tick';

  if v_job_id is null then
    raise exception
      'Expected cron job churchly-automation-background-tick was not found';
  end if;

  perform cron.alter_job(
    job_id := v_job_id,
    schedule := '*/5 * * * *'
  );
end
$migration$;

