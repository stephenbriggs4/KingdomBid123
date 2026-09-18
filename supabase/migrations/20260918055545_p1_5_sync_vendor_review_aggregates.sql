
-- P1-5: legitimate review submission never updated vendors.rating /
-- vendors.reviews_count, so Marketplace cards could show "New to FaithBid"
-- or stale counts even after real completed-hire reviews existed. Review
-- content (including rating) is immutable after creation per
-- kb_reviews_update_guard, so INSERT/DELETE are the only mutation paths that
-- matter; UPDATE is included defensively at negligible cost.
create or replace function public.kb_sync_vendor_review_aggregates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor_id uuid := coalesce(new.vendor_id, old.vendor_id);
  v_avg numeric;
  v_count integer;
begin
  select round(avg(r.rating)::numeric, 2), count(*)
    into v_avg, v_count
  from public.reviews r
  where r.vendor_id = v_vendor_id
    and r.rating is not null;

  update public.vendors
  set rating = coalesce(v_avg, 0),
      reviews_count = coalesce(v_count, 0)
  where id = v_vendor_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists kb_reviews_sync_vendor_aggregates_tg on public.reviews;
create trigger kb_reviews_sync_vendor_aggregates_tg
after insert or update or delete on public.reviews
for each row
execute function public.kb_sync_vendor_review_aggregates();

-- Backfill existing vendor rows so current data isn't left stale by this fix.
update public.vendors v
set rating = coalesce(agg.avg_rating, 0),
    reviews_count = coalesce(agg.review_count, 0)
from (
  select vendor_id, round(avg(rating)::numeric, 2) as avg_rating, count(*) as review_count
  from public.reviews
  where rating is not null
  group by vendor_id
) agg
where agg.vendor_id = v.id;

update public.vendors v
set rating = 0, reviews_count = 0
where not exists (select 1 from public.reviews r where r.vendor_id = v.id and r.rating is not null)
  and (v.rating is distinct from 0 or v.reviews_count is distinct from 0);
