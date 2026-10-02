-- Managed-project inspection previously found that temporary membership granted
-- while transferring Church Intelligence RPC ownership could survive an in-file
-- revoke. Repeat the cleanup after every pending CI ownership transfer and fail
-- closed if the direct role edge still exists.
revoke church_intel_api_owner from postgres;

do $migration$
begin
  if exists (
    select 1
    from pg_auth_members membership
    join pg_roles granted_role on granted_role.oid = membership.roleid
    join pg_roles member_role on member_role.oid = membership.member
    where granted_role.rolname = 'church_intel_api_owner'
      and member_role.rolname = 'postgres'
  ) then
    raise exception
      'postgres retains direct church_intel_api_owner membership after cleanup';
  end if;
end
$migration$;
