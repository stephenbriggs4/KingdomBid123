-- TRUNCATE is table-wide, bypasses RLS, and is never a legitimate browser action.
-- Remove it consistently from every current public table instead of fixing tables
-- one at a time as they appear in audits.
revoke truncate on all tables in schema public from anon, authenticated;

-- Keep tables subsequently created by the primary migration owner from inheriting
-- browser-role TRUNCATE privileges through default grants.
alter default privileges for role postgres in schema public
  revoke truncate on tables from anon, authenticated;
