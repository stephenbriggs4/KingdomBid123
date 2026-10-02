-- Durable, concurrency-safe outbox leases. A crashed worker's rows become
-- claimable again after the lease expires; SKIP LOCKED prevents double-send.

alter table public.email_outbox
  add column if not exists worker_id uuid,
  add column if not exists claimed_at timestamptz,
  add column if not exists claim_expires_at timestamptz;

update public.email_outbox
set status = 'pending', worker_id = null, claimed_at = null, claim_expires_at = null
where status = 'sending';

alter table public.email_outbox
  drop constraint if exists email_outbox_sending_lease_check;
alter table public.email_outbox
  add constraint email_outbox_sending_lease_check check (
    status <> 'sending'
    or (worker_id is not null and claimed_at is not null and claim_expires_at > claimed_at)
  );

drop index if exists public.email_outbox_pending_idx;
create index email_outbox_pending_due_idx
  on public.email_outbox (digest, send_after, created_at)
  where status = 'pending' and attempts < 5;
create index email_outbox_expired_lease_idx
  on public.email_outbox (claim_expires_at)
  where status = 'sending';

create or replace function public.kb_claim_email_outbox_v1(
  p_digest boolean,
  p_limit integer,
  p_worker_id uuid,
  p_lease_seconds integer default 300
)
returns table(
  id uuid,
  user_id uuid,
  template text,
  subject text,
  payload jsonb,
  attempts integer,
  digest boolean
)
language sql
security definer
set search_path = ''
as $$
  with candidates as (
    select o.id
    from public.email_outbox o
    where o.digest = p_digest
      and o.attempts < 5
      and (
        (o.status = 'pending' and o.send_after <= clock_timestamp())
        or (o.status = 'sending' and o.claim_expires_at <= clock_timestamp())
      )
    order by o.created_at, o.id
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 25), 200))
  ), claimed as (
    update public.email_outbox o
    set status = 'sending',
        worker_id = p_worker_id,
        claimed_at = clock_timestamp(),
        claim_expires_at = clock_timestamp()
          + make_interval(secs => greatest(30, least(coalesce(p_lease_seconds, 300), 1800))),
        attempts = o.attempts + 1,
        last_error = case
          when o.status = 'sending' then 'reclaimed after expired worker lease'
          else null
        end
    from candidates c
    where o.id = c.id
      and p_worker_id is not null
    returning o.id, o.user_id, o.template, o.subject, o.payload, o.attempts, o.digest
  )
  select * from claimed;
$$;

revoke all on function public.kb_claim_email_outbox_v1(boolean, integer, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.kb_claim_email_outbox_v1(boolean, integer, uuid, integer)
  to service_role;

comment on function public.kb_claim_email_outbox_v1(boolean, integer, uuid, integer) is
  'Service-only outbox claim. Uses row locks plus expiring leases; returned rows are the exact owned batch.';

create or replace function public.kb_renew_email_outbox_lease_v1(
  p_ids uuid[],
  p_worker_id uuid,
  p_lease_seconds integer default 300
)
returns table(id uuid)
language sql
security definer
set search_path = ''
as $$
  update public.email_outbox o
  set claim_expires_at = clock_timestamp()
    + make_interval(secs => greatest(30, least(coalesce(p_lease_seconds, 300), 1800)))
  where o.id = any(coalesce(p_ids, '{}'::uuid[]))
    and cardinality(coalesce(p_ids, '{}'::uuid[])) between 1 and 200
    and p_worker_id is not null
    and o.status = 'sending'
    and o.worker_id = p_worker_id
  returning o.id;
$$;

revoke all on function public.kb_renew_email_outbox_lease_v1(uuid[], uuid, integer)
  from public, anon, authenticated;
grant execute on function public.kb_renew_email_outbox_lease_v1(uuid[], uuid, integer)
  to service_role;

comment on function public.kb_renew_email_outbox_lease_v1(uuid[], uuid, integer) is
  'Service-only lease renewal. Returns only rows still owned by the requesting worker so stale workers cannot send reclaimed work.';
