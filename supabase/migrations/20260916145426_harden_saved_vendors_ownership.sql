do $$
declare
  v_null_owner_rows bigint;
begin
  select count(*)
    into v_null_owner_rows
  from public.saved_vendors
  where user_id is null
     or vendor_id is null;

  if v_null_owner_rows <> 0 then
    raise exception 'Cannot harden saved_vendors: % rows have a null user_id or vendor_id', v_null_owner_rows;
  end if;
end
$$;

alter table public.saved_vendors
  alter column user_id set not null,
  alter column vendor_id set not null;

alter table public.saved_vendors enable row level security;

revoke all on table public.saved_vendors from anon;
revoke all on table public.saved_vendors from authenticated;
grant select, insert, update, delete on table public.saved_vendors to authenticated;

drop policy if exists kb_saved_vendors_own on public.saved_vendors;
create policy kb_saved_vendors_own
  on public.saved_vendors
  for all
  to authenticated
  using (
    (select auth.uid()) = user_id
    or (select public.kb_is_platform_admin())
  )
  with check (
    (select auth.uid()) = user_id
    or (select public.kb_is_platform_admin())
  );

do $$
declare
  v_nullable_columns integer;
  v_fk_count integer;
  v_unique_count integer;
  v_policy_count integer;
begin
  select count(*)
    into v_nullable_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'saved_vendors'
    and column_name in ('user_id', 'vendor_id')
    and is_nullable <> 'NO';

  if v_nullable_columns <> 0 then
    raise exception 'saved_vendors owner columns remain nullable';
  end if;

  if has_table_privilege('anon', 'public.saved_vendors', 'SELECT')
    or has_table_privilege('anon', 'public.saved_vendors', 'INSERT')
    or has_table_privilege('anon', 'public.saved_vendors', 'UPDATE')
    or has_table_privilege('anon', 'public.saved_vendors', 'DELETE') then
    raise exception 'anon still has saved_vendors data privileges';
  end if;

  if not has_table_privilege('authenticated', 'public.saved_vendors', 'SELECT')
    or not has_table_privilege('authenticated', 'public.saved_vendors', 'INSERT')
    or not has_table_privilege('authenticated', 'public.saved_vendors', 'UPDATE')
    or not has_table_privilege('authenticated', 'public.saved_vendors', 'DELETE') then
    raise exception 'authenticated is missing required saved_vendors data privileges';
  end if;

  select count(*)
    into v_fk_count
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace n on n.oid = rel.relnamespace
  where n.nspname = 'public'
    and rel.relname = 'saved_vendors'
    and con.contype = 'f'
    and pg_get_constraintdef(con.oid) like '%ON DELETE CASCADE%';

  if v_fk_count <> 2 then
    raise exception 'Expected two cascading saved_vendors foreign keys, found %', v_fk_count;
  end if;

  select count(*)
    into v_unique_count
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace n on n.oid = rel.relnamespace
  where n.nspname = 'public'
    and rel.relname = 'saved_vendors'
    and con.contype = 'u'
    and pg_get_constraintdef(con.oid) like '%(user_id, vendor_id)%';

  if v_unique_count <> 1 then
    raise exception 'Expected one saved_vendors user/vendor uniqueness constraint, found %', v_unique_count;
  end if;

  select count(*)
    into v_policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'saved_vendors'
    and policyname = 'kb_saved_vendors_own'
    and cmd = 'ALL'
    and roles = array['authenticated']::name[];

  if v_policy_count <> 1 then
    raise exception 'Expected one authenticated ownership policy on saved_vendors, found %', v_policy_count;
  end if;
end
$$;
