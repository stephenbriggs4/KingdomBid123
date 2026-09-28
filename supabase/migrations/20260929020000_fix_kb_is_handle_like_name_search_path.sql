-- get_advisors flagged kb_is_handle_like_name (added in the previous migration)
-- for a mutable search_path -- every other SECURITY DEFINER/plpgsql function in
-- this project pins search_path; this one omitted it since it's a plain SQL
-- function with no table access, but the advisory still applies.
create or replace function public.kb_is_handle_like_name(p_value text)
returns boolean
language sql
immutable
set search_path to 'pg_catalog'
as $function$
  select coalesce(btrim(p_value), '') <> ''
    and btrim(p_value) ~ '^[a-z0-9._-]+$'
    and btrim(p_value) ~ '[0-9._-]';
$function$;
