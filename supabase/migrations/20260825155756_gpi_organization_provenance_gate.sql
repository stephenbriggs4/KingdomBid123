begin;

alter table public.gpi_organizations
  add column if not exists record_origin text not null default 'unclassified';

alter table public.gpi_organizations
  drop constraint if exists gpi_organizations_record_origin_check;

alter table public.gpi_organizations
  add constraint gpi_organizations_record_origin_check
  check (record_origin in ('real','synthetic','qa','unclassified'));

do $block$
declare
  v_updated integer;
begin
  update public.gpi_organizations
  set record_origin='qa'
  where id in (
    '233ba450-77da-47ef-9d43-dfc659871975'::uuid,
    '255d3123-7066-4aa0-a8dd-35cae7a7c737'::uuid,
    '2c9902f6-cee9-49b8-b406-aabddc22be0e'::uuid,
    '3df261ab-656e-4f7b-b856-2dd291e56d13'::uuid,
    'a46eca06-2e1f-4a69-ad60-96088284b6d1'::uuid,
    'cff9e043-e7b0-4b57-9ee3-b70f45384e7a'::uuid
  );

  get diagnostics v_updated = row_count;
  if v_updated <> 6 then
    raise exception 'Expected to classify 6 known GPI QA hosts; classified %.', v_updated;
  end if;
end;
$block$;

create index if not exists gpi_organizations_record_origin_idx
  on public.gpi_organizations(record_origin);

create or replace function private.gpi_require_organization_origin_before_verification()
returns trigger
language plpgsql
security definer
set search_path=''
as $function$
begin
  if new.status='verified' and new.record_origin='unclassified' then
    raise exception 'Classify the GPI organization record_origin before verification.'
      using errcode='23514';
  end if;
  return new;
end;
$function$;

revoke all on function private.gpi_require_organization_origin_before_verification()
  from public, anon, authenticated;

drop trigger if exists gpi_organizations_05_require_origin on public.gpi_organizations;
create trigger gpi_organizations_05_require_origin
before insert or update of status,record_origin on public.gpi_organizations
for each row
execute function private.gpi_require_organization_origin_before_verification();

comment on column public.gpi_organizations.record_origin is
  'Data provenance: real, synthetic, qa, or unclassified. A verified organization cannot remain unclassified.';

commit;
