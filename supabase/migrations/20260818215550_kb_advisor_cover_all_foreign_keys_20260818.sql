-- Cover every currently-unindexed public-schema foreign key with a standard B-tree index.
-- The loop is idempotent by catalog state: it only creates an index when no valid, ready,
-- non-partial index already has the FK columns as its leading columns.
DO $$
DECLARE
  r record;
  idx_name text;
  cols_sql text;
BEGIN
  FOR r IN
    SELECT
      c.oid AS con_oid,
      c.conname,
      c.conrelid,
      c.conkey,
      n.nspname AS schema_name,
      t.relname AS table_name,
      array_agg(a.attname ORDER BY u.ord) AS columns
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN unnest(c.conkey) WITH ORDINALITY u(attnum, ord) ON true
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = u.attnum
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_index i
        WHERE i.indrelid = c.conrelid
          AND i.indisvalid
          AND i.indisready
          AND i.indpred IS NULL
          AND (i.indkey::smallint[])[0:cardinality(c.conkey)-1] = c.conkey
      )
    GROUP BY c.oid, c.conname, c.conrelid, c.conkey, n.nspname, t.relname
    ORDER BY t.relname, c.conname
  LOOP
    idx_name := format('kb_fk_%s_%s_idx', left(r.table_name, 24), left(md5(r.conname), 12));
    SELECT string_agg(format('%I', col), ', ')
      INTO cols_sql
    FROM unnest(r.columns) AS col;

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I.%I (%s)',
      idx_name,
      r.schema_name,
      r.table_name,
      cols_sql
    );
  END LOOP;
END $$;
