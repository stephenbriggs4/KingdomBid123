do $$ begin
  alter table public.vendor_portfolio_items
    add constraint vendor_portfolio_items_source_project_shape_check
    check (
      (source = 'manual' and source_project_id is null)
      or (source = 'faithbid_project' and source_project_id is not null)
    );
exception when duplicate_object then null; end $$;
