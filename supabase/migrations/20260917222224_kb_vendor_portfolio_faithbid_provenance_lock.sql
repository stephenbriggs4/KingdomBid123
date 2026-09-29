drop policy if exists kb_vendor_portfolio_insert_own on public.vendor_portfolio_items;
create policy kb_vendor_portfolio_insert_own
on public.vendor_portfolio_items
for insert
to authenticated
with check (
  ((vendor_id = (select auth.uid())) or public.kb_is_platform_admin())
  and (
    (source = 'manual' and source_project_id is null)
    or (
      source = 'faithbid_project'
      and source_project_id is not null
      and exists (
        select 1
        from public.projects p
        where p.id = source_project_id
          and p.hired_vendor_id = vendor_id
          and lower(coalesce(p.status,'')) = 'completed'
          and p.completed_at is not null
      )
    )
  )
);

drop policy if exists kb_vendor_portfolio_update_own on public.vendor_portfolio_items;
create policy kb_vendor_portfolio_update_own
on public.vendor_portfolio_items
for update
to authenticated
using ((vendor_id = (select auth.uid())) or public.kb_is_platform_admin())
with check (
  ((vendor_id = (select auth.uid())) or public.kb_is_platform_admin())
  and (
    (source = 'manual' and source_project_id is null)
    or (
      source = 'faithbid_project'
      and source_project_id is not null
      and exists (
        select 1
        from public.projects p
        where p.id = source_project_id
          and p.hired_vendor_id = vendor_id
          and lower(coalesce(p.status,'')) = 'completed'
          and p.completed_at is not null
      )
    )
  )
);

create unique index if not exists vendor_portfolio_items_faithbid_project_uniq
on public.vendor_portfolio_items(vendor_id, source_project_id)
where source = 'faithbid_project' and source_project_id is not null;
