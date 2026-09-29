drop policy if exists kb_reviews_public_select on public.reviews;
create policy kb_reviews_select_anon_marketplace
on public.reviews
for select
to anon
using (
  public.kb_marketplace_public()
  and exists (
    select 1
    from public.vendors v
    where v.id = reviews.vendor_id
      and not coalesce(v.suspended,false)
      and (
        lower(coalesce(v.verification_status,'')) = 'approved'
        or (v.verification_status is null and coalesce(v.verified,false))
      )
  )
);

create policy kb_reviews_select_authenticated
on public.reviews
for select
to authenticated
using (true);
