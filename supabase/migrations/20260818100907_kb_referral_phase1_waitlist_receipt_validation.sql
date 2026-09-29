create or replace function public.kb_submit_waitlist_application_v2(p_payload jsonb)
returns table(
  id uuid,
  created_at timestamptz,
  referral_code text,
  queue_position bigint,
  referral_validated boolean
)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_receipt record;
  v_validated boolean := false;
begin
  select *
    into strict v_receipt
  from public.kb_submit_waitlist_application(p_payload);

  select exists (
    select 1
    from public.waitlist w
    join public.referrals r
      on r.type = 'waitlist'
     and lower(btrim(coalesce(r.referred_email, ''))) = lower(btrim(coalesce(w.email, '')))
     and lower(btrim(coalesce(r.referred_role, ''))) = lower(btrim(coalesce(w.role, '')))
    where w.id = v_receipt.id
  )
  into v_validated;

  return query
  select
    v_receipt.id::uuid,
    v_receipt.created_at::timestamptz,
    v_receipt.referral_code::text,
    v_receipt.queue_position::bigint,
    coalesce(v_validated, false)::boolean;
end
$function$;

revoke all on function public.kb_submit_waitlist_application_v2(jsonb) from public;
grant execute on function public.kb_submit_waitlist_application_v2(jsonb) to anon, authenticated, service_role;
