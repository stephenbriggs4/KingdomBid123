
-- P0-2: conversation creation must prove a real project relationship, not just
-- "caller is one of the two named parties." Closes the unsolicited-contact path
-- (any signed-in user could previously upsert a conversation with any other
-- user id). Preserves every legitimate current flow:
--   - vendor with a real bid on the project
--   - vendor with a vendor_invites/project_vendor_links row on the project
--   - the project's hired_vendor_id
--   - church-initiated outreach to a real, approved, non-suspended vendor on
--     a project the church actually owns (covers SuggestedVendorsAfterPost.invite
--     and the vendor-profile "mark invited" flow, which create the relationship
--     via this very message rather than a prior row)
--   - platform admin (support threads)
drop policy if exists kb_conversations_insert_participants on public.conversations;

create policy kb_conversations_insert_relationship_checked
on public.conversations
for insert
to authenticated
with check (
  kb_is_platform_admin()
  or (
    (church_id = (select auth.uid()) or vendor_id = (select auth.uid()))
    and project_id is not null
    and exists (
      select 1 from public.projects p
      where p.id = conversations.project_id
        and p.church_id = conversations.church_id
    )
    and (
      exists (
        select 1 from public.bids b
        where b.project_id = conversations.project_id
          and (b.vendor_id = conversations.vendor_id or b.vendor_user_id = conversations.vendor_id)
      )
      or exists (
        select 1 from public.vendor_invites vi
        where vi.project_id = conversations.project_id
          and (vi.vendor_id = conversations.vendor_id or vi.vendor_user_id = conversations.vendor_id)
      )
      or exists (
        select 1 from public.project_vendor_links pvl
        where pvl.project_id = conversations.project_id
          and (pvl.vendor_id = conversations.vendor_id or pvl.vendor_user_id = conversations.vendor_id)
      )
      or exists (
        select 1 from public.projects p2
        where p2.id = conversations.project_id
          and p2.hired_vendor_id = conversations.vendor_id
      )
      or (
        church_id = (select auth.uid())
        and exists (
          select 1 from public.vendors v
          where v.user_id = conversations.vendor_id
            and not coalesce(v.suspended, false)
            and (
              lower(coalesce(v.verification_status, '')) = 'approved'
              or (v.verification_status is null and coalesce(v.verified, false))
            )
        )
      )
    )
  )
);
