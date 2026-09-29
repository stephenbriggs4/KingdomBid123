-- Prevent future public-schema routines owned by postgres from being auto-exposed.
-- Existing routine ACLs are unchanged; future APIs must explicitly GRANT EXECUTE.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
