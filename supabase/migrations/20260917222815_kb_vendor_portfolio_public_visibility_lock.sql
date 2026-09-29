drop policy if exists kb_vendor_portfolio_select_anon on public.vendor_portfolio_items;
create policy kb_vendor_portfolio_select_anon
on public.vendor_portfolio_items
for select
to anon
using (
  public.kb_marketplace_public()
  and exists (
    select 1
    from public.vendors v
    where v.user_id = vendor_portfolio_items.vendor_id
      and not coalesce(v.suspended,false)
      and (
        lower(coalesce(v.verification_status,'')) = 'approved'
        or (v.verification_status is null and coalesce(v.verified,false))
      )
  )
);

drop policy if exists kb_vendor_portfolio_select_authenticated on public.vendor_portfolio_items;
create policy kb_vendor_portfolio_select_authenticated
on public.vendor_portfolio_items
for select
to authenticated
using (
  vendor_id = (select auth.uid())
  or public.kb_is_platform_admin()
  or (
    public.kb_marketplace_public()
    and exists (
      select 1
      from public.vendors v
      where v.user_id = vendor_portfolio_items.vendor_id
        and not coalesce(v.suspended,false)
        and (
          lower(coalesce(v.verification_status,'')) = 'approved'
          or (v.verification_status is null and coalesce(v.verified,false))
        )
    )
  )
);
