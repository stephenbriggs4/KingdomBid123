-- Supabase Advisor 0003: hoist auth.uid()/auth.role() calls into initplans.
-- This is a mechanical policy-expression optimization only; authorization predicates stay the same.
DO $$
DECLARE
  r record;
  q text;
  c text;
  stmt text;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, qual, with_check,
           replace(replace(coalesce(qual,'') || ' ' || coalesce(with_check,''), '( SELECT auth.uid() AS uid)', ''), '( SELECT auth.role() AS role)', '') AS remaining
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    IF r.remaining NOT LIKE '%auth.uid()%' AND r.remaining NOT LIKE '%auth.role()%' THEN
      CONTINUE;
    END IF;

    q := r.qual;
    c := r.with_check;

    IF q IS NOT NULL THEN
      q := replace(q, '( SELECT auth.uid() AS uid)', '__KB_UID_ALREADY_SELECT__');
      q := replace(q, '( SELECT auth.role() AS role)', '__KB_ROLE_ALREADY_SELECT__');
      q := replace(q, 'auth.uid()', '(select auth.uid())');
      q := replace(q, 'auth.role()', '(select auth.role())');
      q := replace(q, '__KB_UID_ALREADY_SELECT__', '( SELECT auth.uid() AS uid)');
      q := replace(q, '__KB_ROLE_ALREADY_SELECT__', '( SELECT auth.role() AS role)');
    END IF;

    IF c IS NOT NULL THEN
      c := replace(c, '( SELECT auth.uid() AS uid)', '__KB_UID_ALREADY_SELECT__');
      c := replace(c, '( SELECT auth.role() AS role)', '__KB_ROLE_ALREADY_SELECT__');
      c := replace(c, 'auth.uid()', '(select auth.uid())');
      c := replace(c, 'auth.role()', '(select auth.role())');
      c := replace(c, '__KB_UID_ALREADY_SELECT__', '( SELECT auth.uid() AS uid)');
      c := replace(c, '__KB_ROLE_ALREADY_SELECT__', '( SELECT auth.role() AS role)');
    END IF;

    stmt := format('ALTER POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    IF q IS NOT NULL THEN
      stmt := stmt || ' USING (' || q || ')';
    END IF;
    IF c IS NOT NULL THEN
      stmt := stmt || ' WITH CHECK (' || c || ')';
    END IF;

    EXECUTE stmt;
  END LOOP;
END $$;
