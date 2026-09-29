-- Only the function owner can revoke the implicit PUBLIC grant reliably.
-- Assume that role briefly, harden all 13 approved RPCs, then remove the
-- temporary membership in the same transaction.
grant church_intel_api_owner to postgres;
set role church_intel_api_owner;

do $$
declare
  rpc regprocedure;
  rpc_count integer;
begin
  select count(*) into rpc_count
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname like 'ci\_%' escape '\';

  if rpc_count <> 13 then
    raise exception 'expected 13 Church Intelligence RPCs, found %', rpc_count;
  end if;

  for rpc in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like 'ci\_%' escape '\'
  loop
    execute format(
      'revoke execute on function %s from public, anon, service_role',
      rpc
    );
    execute format(
      'grant execute on function %s to authenticated',
      rpc
    );
  end loop;
end
$$;

reset role;
revoke church_intel_api_owner from postgres;
