begin;

alter function public.marketplace_service_submit_review(
  uuid,integer,text,text,boolean,jsonb,text[]
) set schema private;

alter function private.marketplace_service_submit_review(
  uuid,integer,text,text,boolean,jsonb,text[]
) rename to kb_submit_review;

revoke all on function private.kb_submit_review(
  uuid,integer,text,text,boolean,jsonb,text[]
) from public,anon;

grant execute on function private.kb_submit_review(
  uuid,integer,text,text,boolean,jsonb,text[]
) to authenticated;

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
language sql
security invoker
set search_path=''
as $function$
  select private.kb_submit_review(
    p_project_id,
    p_rating,
    p_body,
    p_title,
    p_recommend,
    p_sub_ratings,
    p_tags
  );
$function$;

revoke all on function public.marketplace_service_submit_review(
  uuid,integer,text,text,boolean,jsonb,text[]
) from public,anon;

grant execute on function public.marketplace_service_submit_review(
  uuid,integer,text,text,boolean,jsonb,text[]
) to authenticated;

comment on function private.kb_submit_review(
  uuid,integer,text,text,boolean,jsonb,text[]
) is 'Private privileged implementation. Validates auth.uid, locks the project, and derives all review eligibility evidence server-side.';

comment on function public.marketplace_service_submit_review(
  uuid,integer,text,text,boolean,jsonb,text[]
) is 'Exposed SECURITY INVOKER wrapper for the private, actor-validating review submission implementation.';

commit;
