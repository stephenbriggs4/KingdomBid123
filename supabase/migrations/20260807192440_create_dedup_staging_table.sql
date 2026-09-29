CREATE TABLE IF NOT EXISTS public._stg_master_clean_dedup (
  row_idx integer PRIMARY KEY,
  url text,
  norm_name text
);
TRUNCATE public._stg_master_clean_dedup;
