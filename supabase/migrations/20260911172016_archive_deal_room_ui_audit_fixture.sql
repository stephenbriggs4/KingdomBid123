-- Archive the later Deal Room UI audit fixture that was inserted without QA
-- provenance. Its own project and bid copy explicitly identify it as TEST/QA.
-- Preserve recoverable snapshots, remove marketplace-facing rows, and leave
-- auth users/profiles untouched.

do $$
declare
  fixture_project_ids uuid[];
  fixture_bid_ids uuid[];
  fixture_vendor_ids uuid[];
  fixture_vendor_user_ids uuid[];
  project_count integer;
  bid_count integer;
  vendor_count integer;
  protected_record_count integer;
begin
  select coalesce(array_agg(p.id), array[]::uuid[]), count(*)
  into fixture_project_ids, project_count
  from public.projects p
  where p.title = 'Deal Room UI Audit Test Project'
    and p.record_origin = 'unclassified'
    and p.source is null
    and p.description ilike '%test project created for internal UI/QA auditing%';

  if project_count = 0 then
    return;
  end if;

  if project_count <> 1 then
    raise exception 'Expected one Deal Room UI audit fixture project; found %', project_count;
  end if;

  select coalesce(array_agg(b.id), array[]::uuid[]),
         coalesce(array_agg(distinct b.vendor_user_id) filter (where b.vendor_user_id is not null), array[]::uuid[]),
         count(*)
  into fixture_bid_ids, fixture_vendor_user_ids, bid_count
  from public.bids b
  where b.project_id = any(fixture_project_ids)
    and b.vendor_name = 'Vendor123'
    and b.cover_letter ilike 'TEST bid for Deal Room UI QA audit%';

  select coalesce(array_agg(v.id), array[]::uuid[]), count(*)
  into fixture_vendor_ids, vendor_count
  from public.vendors v
  where v.user_id = any(fixture_vendor_user_ids)
    and v.name = 'Vendor123'
    and v.reviews_count = 0
    and v.projects_count = 0;

  if bid_count <> 1 or vendor_count <> 1 then
    raise exception
      'Audit fixture relationship mismatch: expected one bid and one vendor; found % bids and % vendors',
      bid_count,
      vendor_count;
  end if;

  select
    (select count(*) from public.reviews r where r.vendor_id = any(fixture_vendor_ids))
    + (select count(*) from public.stripe_payment_transactions t where t.project_id = any(fixture_project_ids))
    + (select count(*) from public.faithbid_church_rebates r
       where r.project_id = any(fixture_project_ids)
          or r.bid_id = any(fixture_bid_ids)
          or r.vendor_id = any(fixture_vendor_ids))
  into protected_record_count;

  if protected_record_count <> 0 then
    raise exception
      'Refusing to archive Deal Room UI audit fixture because % review/payment records exist',
      protected_record_count;
  end if;

  insert into concierge_ops.release_verification_fixture_archive
    (source_table, source_id, payload, archive_reason)
  select 'public.projects', p.id::text, to_jsonb(p), 'remove_deal_room_ui_audit_fixture'
  from public.projects p
  where p.id = any(fixture_project_ids)
  on conflict (source_table, source_id, archive_reason) do nothing;

  insert into concierge_ops.release_verification_fixture_archive
    (source_table, source_id, payload, archive_reason)
  select 'public.bids', b.id::text, to_jsonb(b), 'remove_deal_room_ui_audit_fixture'
  from public.bids b
  where b.id = any(fixture_bid_ids)
  on conflict (source_table, source_id, archive_reason) do nothing;

  insert into concierge_ops.release_verification_fixture_archive
    (source_table, source_id, payload, archive_reason)
  select 'public.vendors', v.id::text, to_jsonb(v), 'remove_deal_room_ui_audit_fixture'
  from public.vendors v
  where v.id = any(fixture_vendor_ids)
  on conflict (source_table, source_id, archive_reason) do nothing;

  delete from public.notifications n
  where exists (
    select 1
    from unnest(fixture_project_ids || fixture_bid_ids || fixture_vendor_ids || fixture_vendor_user_ids) fixture_id
    where n.meta::text ilike '%' || fixture_id::text || '%'
  );

  delete from public.messages m
  using public.conversations c
  where m.conversation_id = c.id
    and c.project_id = any(fixture_project_ids);

  delete from public.conversation_user_state s
  using public.conversations c
  where s.conversation_id = c.id
    and c.project_id = any(fixture_project_ids);

  delete from public.conversations c where c.project_id = any(fixture_project_ids);
  delete from public.project_payment_installments i
    where i.project_id = any(fixture_project_ids) or i.bid_id = any(fixture_bid_ids);
  delete from public.project_payment_plans p
    where p.project_id = any(fixture_project_ids) or p.bid_id = any(fixture_bid_ids);
  delete from public.stripe_payment_transactions t where t.project_id = any(fixture_project_ids);
  delete from public.faithbid_church_rebates r
    where r.project_id = any(fixture_project_ids)
       or r.bid_id = any(fixture_bid_ids)
       or r.vendor_id = any(fixture_vendor_ids);
  delete from public.reviews r where r.vendor_id = any(fixture_vendor_ids);

  delete from public.projects p where p.id = any(fixture_project_ids);
  delete from public.vendors v where v.id = any(fixture_vendor_ids);
end
$$;
