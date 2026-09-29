-- Found while independently auditing Codex's Church Intelligence work: all
-- three prior migrations (phase1, auth_dependency_bridge, rpc_acl_hardening)
-- grant postgres temporary membership in church_intel_api_owner to do admin
-- work, then revoke it at the end of the same file -- but live inspection
-- showed postgres still held the membership after all three had applied.
-- postgres already has rolbypassrls=true in this managed instance, so this
-- never granted any *new* privilege (postgres could already read/write
-- everything regardless of role membership), but it contradicts the
-- migrations' own documented "no lingering membership" intent. Restoring it.
revoke church_intel_api_owner from postgres;
