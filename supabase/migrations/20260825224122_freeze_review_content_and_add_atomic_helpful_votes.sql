
create or replace function private.kb_reviews_update_guard()
returns trigger
language plpgsql
set search_path=''
as $$
declare
  v_old public.reviews%rowtype;
  v_new public.reviews%rowtype;
  v_vendor_owner boolean := false;
begin
  if current_user::text in ('postgres','service_role','supabase_admin')
     or (select public.kb_is_platform_admin()) then
    return new;
  end if;

  select exists (
    select 1
    from public.vendors v
    where v.id=old.vendor_id
      and v.user_id=(select auth.uid())
  ) into v_vendor_owner;

  if not v_vendor_owner then
    raise exception 'Only the reviewed vendor may publish a response.'
      using errcode='42501';
  end if;

  v_old:=old;
  v_new:=new;
  v_new.vendor_reply:=v_old.vendor_reply;
  v_new.reply:=v_old.reply;

  if v_new is distinct from v_old then
    raise exception 'Published review content is immutable.'
      using errcode='42501';
  end if;

  new.vendor_reply:=nullif(btrim(new.vendor_reply),'');
  if new.vendor_reply is null then
    raise exception 'A vendor response cannot be empty.'
      using errcode='23514';
  end if;
  if char_length(new.vendor_reply)>1200 then
    raise exception 'A vendor response cannot exceed 1200 characters.'
      using errcode='22001';
  end if;

  new.reply:=new.vendor_reply;
  return new;
end;
$$;

revoke execute on function private.kb_reviews_update_guard()
  from public, anon, authenticated, service_role;

drop trigger if exists kb_reviews_update_guard_tg on public.reviews;
create trigger kb_reviews_update_guard_tg
before update on public.reviews
for each row execute function private.kb_reviews_update_guard();

drop policy if exists kb_reviews_update_involved on public.reviews;
create policy kb_reviews_update_vendor_reply_or_admin
on public.reviews
for update
to authenticated
using (
  (select public.kb_is_platform_admin())
  or exists (
    select 1
    from public.vendors v
    where v.id=reviews.vendor_id
      and v.user_id=(select auth.uid())
  )
)
with check (
  (select public.kb_is_platform_admin())
  or exists (
    select 1
    from public.vendors v
    where v.id=reviews.vendor_id
      and v.user_id=(select auth.uid())
  )
);

revoke truncate, references, trigger on table public.reviews from anon;
revoke truncate, references, trigger on table public.reviews from authenticated;

create table public.review_helpful_votes (
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id,user_id)
);

create index review_helpful_votes_user_id_idx
  on public.review_helpful_votes(user_id);

alter table public.review_helpful_votes enable row level security;
revoke all privileges on table public.review_helpful_votes from public, anon, authenticated;
grant all privileges on table public.review_helpful_votes to service_role;

create or replace function public.kb_mark_review_helpful(p_review_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := auth.uid();
  v_inserted boolean := false;
  v_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Sign in to mark a review helpful.'
      using errcode='42501';
  end if;
  if p_review_id is null then
    raise exception 'Review is required.'
      using errcode='22023';
  end if;
  if not exists (select 1 from public.reviews r where r.id=p_review_id) then
    raise exception 'Review not found.'
      using errcode='P0002';
  end if;

  insert into public.review_helpful_votes(review_id,user_id)
  values(p_review_id,v_user_id)
  on conflict (review_id,user_id) do nothing
  returning true into v_inserted;

  if coalesce(v_inserted,false) then
    update public.reviews
    set helpful_count=coalesce(helpful_count,0)+1,
        helpful=coalesce(helpful,0)+1
    where id=p_review_id
    returning helpful_count into v_count;
  else
    select coalesce(r.helpful_count,0)
    into v_count
    from public.reviews r
    where r.id=p_review_id;
  end if;

  return jsonb_build_object(
    'review_id',p_review_id,
    'marked',coalesce(v_inserted,false),
    'helpful_count',coalesce(v_count,0)
  );
end;
$$;

revoke execute on function public.kb_mark_review_helpful(uuid)
  from public, anon;
grant execute on function public.kb_mark_review_helpful(uuid)
  to authenticated, service_role;
