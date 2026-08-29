begin;

create unique index if not exists reviews_one_per_project_church_idx
  on public.reviews(project_id,church_id)
  where project_id is not null and church_id is not null;

create or replace function private.kb_validate_review_eligibility()
returns trigger
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_project public.projects%rowtype;
  v_vendor_id uuid;
  v_hire_confirmation_id uuid;
begin
  if tg_op='UPDATE' then
    if new.project_id is distinct from old.project_id
       or new.church_id is distinct from old.church_id
       or new.reviewer_id is distinct from old.reviewer_id
       or new.vendor_id is distinct from old.vendor_id
       or new.hire_confirmation_id is distinct from old.hire_confirmation_id
       or new.verified is distinct from old.verified then
      raise exception 'Review eligibility identity fields are immutable.'
        using errcode='42501';
    end if;
    return new;
  end if;

  if new.project_id is null then
    raise exception 'A completed FaithBid project is required to submit a review.'
      using errcode='23514';
  end if;

  select *
  into v_project
  from public.projects
  where id=new.project_id
  for share;

  if not found then
    raise exception 'Project not found.' using errcode='P0002';
  end if;

  if lower(coalesce(v_project.status,''))<>'completed'
     or v_project.completed_at is null
     or v_project.church_id is null
     or v_project.hired_vendor_id is null then
    raise exception 'Reviews require a completed project with a recorded church and hired vendor.'
      using errcode='23514';
  end if;

  select v.id
  into v_vendor_id
  from public.vendors v
  where v.user_id=v_project.hired_vendor_id;

  if v_vendor_id is null then
    raise exception 'The hired vendor does not have a canonical FaithBid vendor record.'
      using errcode='23514';
  end if;

  select h.id
  into v_hire_confirmation_id
  from public.hire_confirmations h
  where h.project_id=v_project.id
    and h.church_id=v_project.church_id
    and h.vendor_id=v_project.hired_vendor_id
  order by h.created_at desc
  limit 1;

  if v_hire_confirmation_id is null then
    raise exception 'Reviews require a recorded FaithBid hire confirmation.'
      using errcode='23514';
  end if;

  if new.church_id is distinct from v_project.church_id
     or new.reviewer_id is distinct from v_project.church_id
     or new.vendor_id is distinct from v_vendor_id then
    raise exception 'Review participants do not match the completed project.'
      using errcode='42501';
  end if;

  new.hire_confirmation_id:=v_hire_confirmation_id;
  new.verified:=true;
  return new;
end;
$function$;

revoke all on function private.kb_validate_review_eligibility()
  from public, anon, authenticated;

drop trigger if exists kb_reviews_validate_eligibility on public.reviews;
create trigger kb_reviews_validate_eligibility
before insert or update on public.reviews
for each row
execute function private.kb_validate_review_eligibility();

create or replace function public.marketplace_service_submit_review(
  p_project_id uuid,
  p_rating integer,
  p_body text,
  p_title text default null,
  p_recommend boolean default true,
  p_sub_ratings jsonb default '{}'::jsonb,
  p_tags text[] default '{}'::text[]
)
returns uuid
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid:=auth.uid();
  v_project public.projects%rowtype;
  v_vendor_id uuid;
  v_author text;
  v_city text;
  v_review_id uuid;
  v_title text:=nullif(btrim(coalesce(p_title,'')),'');
  v_body text:=btrim(coalesce(p_body,''));
  v_tags text[]:=coalesce(p_tags,'{}'::text[]);
  v_sub_ratings jsonb:=coalesce(p_sub_ratings,'{}'::jsonb);
begin
  if v_uid is null then
    raise exception 'Sign in required.' using errcode='42501';
  end if;

  if p_project_id is null then
    raise exception 'A completed project is required.' using errcode='22023';
  end if;

  if p_rating is null or p_rating<1 or p_rating>5 then
    raise exception 'Rating must be an integer from 1 to 5.' using errcode='22023';
  end if;

  if char_length(v_body)<30 or char_length(v_body)>5000 then
    raise exception 'Review body must be between 30 and 5000 characters.'
      using errcode='22023';
  end if;

  if v_title is not null and char_length(v_title)>120 then
    raise exception 'Review title must be 120 characters or fewer.'
      using errcode='22023';
  end if;

  if jsonb_typeof(v_sub_ratings)<>'object' then
    raise exception 'Sub-ratings must be a JSON object.' using errcode='22023';
  end if;

  if cardinality(v_tags)>10
     or exists(
       select 1 from unnest(v_tags) tag
       where nullif(btrim(tag),'') is null or char_length(btrim(tag))>50
     ) then
    raise exception 'Use at most 10 non-empty review tags of 50 characters or fewer.'
      using errcode='22023';
  end if;

  select *
  into v_project
  from public.projects
  where id=p_project_id
  for update;

  if not found then
    raise exception 'Project not found.' using errcode='P0002';
  end if;

  if v_project.church_id is distinct from v_uid then
    raise exception 'Only the posting church can review this project.'
      using errcode='42501';
  end if;

  if lower(coalesce(v_project.status,''))<>'completed'
     or v_project.completed_at is null
     or v_project.hired_vendor_id is null then
    raise exception 'This project is not eligible for a review yet.'
      using errcode='23514';
  end if;

  select v.id
  into v_vendor_id
  from public.vendors v
  where v.user_id=v_project.hired_vendor_id;

  if v_vendor_id is null then
    raise exception 'The hired vendor does not have a canonical FaithBid vendor record.'
      using errcode='23514';
  end if;

  select p.org_name,p.city
  into v_author,v_city
  from public.profiles p
  where p.id=v_uid;

  insert into public.reviews(
    church_id,
    vendor_id,
    reviewer_id,
    project_id,
    author,
    city,
    project,
    rating,
    title,
    body,
    recommend,
    sub_ratings,
    tags,
    verified
  )
  values(
    v_uid,
    v_vendor_id,
    v_uid,
    v_project.id,
    coalesce(nullif(btrim(v_author),''),'Church'),
    coalesce(v_city,''),
    coalesce(v_project.title,'FaithBid project'),
    p_rating,
    v_title,
    v_body,
    coalesce(p_recommend,true),
    v_sub_ratings,
    v_tags,
    true
  )
  returning id into v_review_id;

  return v_review_id;
end;
$function$;

revoke all on function public.marketplace_service_submit_review(
  uuid,integer,text,text,boolean,jsonb,text[]
) from public,anon;

grant execute on function public.marketplace_service_submit_review(
  uuid,integer,text,text,boolean,jsonb,text[]
) to authenticated;

revoke insert on table public.reviews from authenticated;
drop policy if exists kb_reviews_insert_church on public.reviews;

comment on function public.marketplace_service_submit_review(
  uuid,integer,text,text,boolean,jsonb,text[]
) is 'Creates one review for the signed-in posting church after verified project completion and recorded hire participation.';

commit;
