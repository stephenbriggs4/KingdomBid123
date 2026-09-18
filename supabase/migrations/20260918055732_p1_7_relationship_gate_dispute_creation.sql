
-- P1-7: dispute INSERT only proved caller was one named side, with no check
-- that project_id/church_id/vendor_id form a real hire relationship and no
-- enforcement that raised_by = auth.uid(). No client code currently creates
-- disputes (feature not yet built), so this closes a live but unused API
-- surface rather than migrating an existing caller. When a dispute-filing UI
-- is built, it should submit only reason/body/evidence and let this policy
-- (or a wrapping RPC) derive identities.
drop policy if exists kb_disputes_insert_involved on public.disputes;

create policy kb_disputes_insert_relationship_checked
on public.disputes
for insert
to authenticated
with check (
  kb_is_platform_admin()
  or (
    raised_by = (select auth.uid())
    and (church_id = (select auth.uid()) or vendor_id = (select auth.uid()))
    and project_id is not null
    and exists (
      select 1 from public.projects p
      where p.id = disputes.project_id
        and p.church_id = disputes.church_id
        and (
          p.hired_vendor_id = disputes.vendor_id
          or exists (
            select 1 from public.bids b
            where b.project_id = p.id
              and (b.vendor_id = disputes.vendor_id or b.vendor_user_id = disputes.vendor_id)
              and lower(coalesce(b.status, '')) = 'hired'
          )
        )
    )
  )
);
