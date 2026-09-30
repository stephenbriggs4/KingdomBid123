-- MEDIUM-2: either conversation participant could rewrite offer terms. Nothing in the app writes these columns.
create or replace function public.kb_conversations_identity_guard()
 returns trigger
 language plpgsql
 set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return new;
  end if;

  if public.kb_is_platform_admin() then
    return new;
  end if;

  if new.church_id is distinct from old.church_id
     or new.vendor_id is distinct from old.vendor_id
     or new.project_id is distinct from old.project_id then
    raise exception using errcode='42501', message='Conversation identity (church, vendor, project) is immutable after creation.';
  end if;

  if new.offer_amount is distinct from old.offer_amount
     or new.offer_expiry is distinct from old.offer_expiry
     or new.budget is distinct from old.budget then
    raise exception using errcode='42501', message='Offer terms are platform-managed.';
  end if;

  return new;
end;
$function$;

-- LOW-1: any signed-in user could read every review, including reviews of unapproved or suspended vendors.
drop policy if exists kb_reviews_select_authenticated on public.reviews;
create policy kb_reviews_select_authenticated on public.reviews
  for select to authenticated
  using (
    reviewer_id = (select auth.uid())
    or church_id = (select auth.uid())
    or public.kb_is_platform_admin()
    or exists (
      select 1 from public.vendors v
      where v.id = reviews.vendor_id
        and (
          v.user_id = (select auth.uid())
          or (
            not coalesce(v.suspended, false)
            and (
              lower(coalesce(v.verification_status, '')) = 'approved'
              or (v.verification_status is null and coalesce(v.verified, false))
            )
          )
        )
    )
  );
