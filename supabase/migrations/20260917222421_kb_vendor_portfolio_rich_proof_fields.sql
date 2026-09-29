alter table public.vendor_portfolio_items
  add column if not exists category text,
  add column if not exists client_name text,
  add column if not exists client_name_permission boolean not null default false,
  add column if not exists image_urls text[] not null default '{}'::text[],
  add column if not exists pdf_url text;

do $$ begin
  alter table public.vendor_portfolio_items
    add constraint vendor_portfolio_items_category_len_check
    check (category is null or char_length(btrim(category)) <= 120);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.vendor_portfolio_items
    add constraint vendor_portfolio_items_client_name_len_check
    check (client_name is null or char_length(btrim(client_name)) <= 160);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.vendor_portfolio_items
    add constraint vendor_portfolio_items_client_permission_check
    check (client_name is null or btrim(client_name) = '' or client_name_permission = true);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.vendor_portfolio_items
    add constraint vendor_portfolio_items_image_count_check
    check (cardinality(image_urls) <= 3);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.vendor_portfolio_items
    add constraint vendor_portfolio_items_pdf_url_shape
    check (pdf_url is null or (char_length(pdf_url) <= 2048 and pdf_url ~* '^https?://'));
exception when duplicate_object then null; end $$;
