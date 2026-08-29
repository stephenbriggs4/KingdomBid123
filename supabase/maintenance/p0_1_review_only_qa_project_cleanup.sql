-- P0-1 REVIEW ONLY — DO NOT RUN WITHOUT STEPHEN'S EXPLICIT APPROVAL.
-- Production project: knkwaphosqronbhrvlsu
-- Snapshot verified: 2026-08-29
--
-- This is intentionally outside supabase/migrations so it cannot be applied as
-- part of a normal migration deployment. The transaction is strict: it aborts
-- if any target identity, dependency count, payment dependency, or chat-file
-- assumption has changed since review.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

create temp table kb_qa_project_cleanup_targets (
  id uuid primary key,
  expected_title text not null,
  expected_origin text not null
) on commit drop;

insert into kb_qa_project_cleanup_targets (id, expected_title, expected_origin) values
  ('3832d8f2-8e1a-4856-93fb-69eb0e6183fb', 'ggggggggggggggggggggggggg', 'qa'),
  ('7d227d8b-03e6-4290-bb69-cdd6b382cb38', 'Church Legal Counsel — Compliance & Contracts', 'qa'),
  ('94495237-b79c-4f6e-b531-0e714979b9e9', 'Social Media Content Templates', 'qa'),
  ('383af60b-1637-4dfa-aa43-04ade9834461', 'Sanctuary AV System Upgrade', 'qa'),
  ('2a1da94a-30ce-40aa-97c6-ea15962487c5', 'Logo & Brand Identity Package', 'qa'),
  ('d1c28e3b-057f-451a-ac3d-077692d259ec', 'Worship Leader Needed', 'qa'),
  ('56f967ab-f076-46f8-90a9-545ddcda65ab', 'Job 123', 'qa'),
  ('766e52be-0c68-4488-9134-4b4417d3e219', 'Worship Leader Needed', 'qa'),
  ('50158f1b-ae70-49a5-8bee-aabc354fa00f', 'dddddddddddddddddddd', 'qa'),
  ('3b01e2ec-4305-44d0-b661-2a03533eafc2', 'Complete Website Redesign for [Church Name]', 'qa'),
  ('aa918626-48aa-466a-999c-148977ffcbe6', 'Complete Website Redesign for [Church Name]', 'qa'),
  ('74dfdf25-e479-4c64-8312-3a79768d7ce2', 'Hello My Name is Stephen', 'qa'),
  ('ba8d43b1-967d-4394-99ab-84a2dd9ecc8d', 'Singer', 'qa'),
  ('42f705f8-dab8-4fd3-92f2-9a61cb2d50d0', 'Worship Leader', 'qa'),
  ('d5f41f57-fbd6-44f1-8fc2-6149971223f3', 'QA Regression — Signed-In Workflow 2026-08-28', 'unclassified');

-- Identity and drift guard. Every reviewed UUID must still identify the exact
-- project reviewed above and must still belong to the QA church account.
do $$
declare
  mismatch_count integer;
begin
  select count(*)
  into mismatch_count
  from kb_qa_project_cleanup_targets target
  left join public.projects project on project.id = target.id
  where project.id is null
     or project.title is distinct from target.expected_title
     or project.record_origin is distinct from target.expected_origin
     or project.church_id is distinct from 'c9536cc8-0240-420b-a66e-b809c3241f83'::uuid;

  if mismatch_count <> 0 then
    raise exception 'P0-1 cleanup aborted: % target identities changed or disappeared', mismatch_count;
  end if;
end
$$;

-- Snapshot guard. If normal use or another QA pass adds/removes dependencies,
-- stop and re-review instead of widening the deletion silently.
do $$
declare
  bid_count integer;
  conversation_count integer;
  message_count integer;
  confirmation_count integer;
begin
  select count(*) into bid_count
  from public.bids
  where project_id::text in (select id::text from kb_qa_project_cleanup_targets);

  select count(*) into conversation_count
  from public.conversations
  where project_id::text in (select id::text from kb_qa_project_cleanup_targets);

  select count(*) into message_count
  from public.messages
  where conversation_id in (
    select id from public.conversations
    where project_id::text in (select id::text from kb_qa_project_cleanup_targets)
  );

  select count(*) into confirmation_count
  from public.hire_confirmations
  where project_id::text in (select id::text from kb_qa_project_cleanup_targets);

  if bid_count <> 11
     or conversation_count <> 12
     or message_count <> 31
     or confirmation_count <> 5 then
    raise exception 'P0-1 cleanup aborted: dependency drift (bids %, conversations %, messages %, confirmations %)',
      bid_count, conversation_count, message_count, confirmation_count;
  end if;
end
$$;

-- match_events is disposable view/compare telemetry and legitimately grows
-- whenever a reviewed QA project is opened. Delete every event attached to
-- the explicit target UUIDs without using a brittle snapshot count.

-- Hard stop for financial, bench, or file dependencies. Those require a new
-- cleanup design and must never be silently cascaded.
do $$
begin
  if exists (
    select 1 from public.project_payment_installments
    where project_id::text in (select id::text from kb_qa_project_cleanup_targets)
  ) or exists (
    select 1 from public.project_payment_plans
    where project_id::text in (select id::text from kb_qa_project_cleanup_targets)
  ) or exists (
    select 1 from public.stripe_payment_transactions
    where project_id::text in (select id::text from kb_qa_project_cleanup_targets)
  ) or exists (
    select 1 from public.vendor_bench_candidates
    where qualifying_project_id::text in (select id::text from kb_qa_project_cleanup_targets)
  ) then
    raise exception 'P0-1 cleanup aborted: protected financial or bench dependencies exist';
  end if;

  if exists (
    select 1
    from public.messages
    where conversation_id in (
      select id from public.conversations
      where project_id::text in (select id::text from kb_qa_project_cleanup_targets)
    )
      and (
        nullif(btrim(coalesce(file_path, '')), '') is not null
        or nullif(btrim(coalesce(file_url, '')), '') is not null
      )
  ) then
    raise exception 'P0-1 cleanup aborted: chat file metadata exists; remove objects through the Storage API first';
  end if;
end
$$;

-- These legacy/history tables have project_id columns without a deleting FK,
-- so clear them explicitly before deleting conversations and projects.
delete from public."Reviews"
where project_id::text in (select id::text from kb_qa_project_cleanup_targets);

delete from public.reviews
where project_id::text in (select id::text from kb_qa_project_cleanup_targets);

delete from public.disputes
where project_id::text in (select id::text from kb_qa_project_cleanup_targets);

delete from public.hire_confirmations
where project_id::text in (select id::text from kb_qa_project_cleanup_targets);

delete from public.match_events
where project_id::text in (select id::text from kb_qa_project_cleanup_targets);

-- conversations.project_id is NO ACTION. Deleting these rows first safely
-- cascades their 31 messages and 21 per-user conversation-state rows.
delete from public.conversations
where project_id::text in (select id::text from kb_qa_project_cleanup_targets);

-- Project deletion now applies the reviewed FK behavior: bid and project-work
-- children cascade; provenance/attribution references configured SET NULL are
-- preserved; the protected RESTRICT tables were proven empty above.
delete from public.projects
where id in (select id from kb_qa_project_cleanup_targets);

-- Postcondition: no direct target or non-FK history row may survive.
do $$
begin
  if exists (select 1 from public.projects where id in (select id from kb_qa_project_cleanup_targets))
     or exists (select 1 from public.conversations where project_id::text in (select id::text from kb_qa_project_cleanup_targets))
     or exists (select 1 from public.hire_confirmations where project_id::text in (select id::text from kb_qa_project_cleanup_targets))
     or exists (select 1 from public.match_events where project_id::text in (select id::text from kb_qa_project_cleanup_targets)) then
    raise exception 'P0-1 cleanup aborted: postcondition failed';
  end if;
end
$$;

commit;
