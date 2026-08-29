begin;

-- FaithBid Deal Room attachments use the canonical immutable path:
-- chat/<conversation_id>/<timestamp>_<filename>.
-- Remove the obsolete user-folder policies. The SELECT policy below was
-- especially unsafe because it authorized every authenticated user for every
-- object in the private chat-files bucket.
drop policy if exists chat_files_read_own on storage.objects;
drop policy if exists chat_files_insert_own on storage.objects;
drop policy if exists chat_files_update_own on storage.objects;
drop policy if exists chat_files_delete_own on storage.objects;

-- Messages remain visible to either conversation participant, but only the
-- original author may update a message. Platform admins retain recovery access.
drop policy if exists kb_messages_update_conversation_participants on public.messages;

create policy kb_messages_update_author_or_admin
on public.messages
for update
to authenticated
using (
  (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (
          c.church_id = (select auth.uid())
          or c.vendor_id = (select auth.uid())
        )
    )
  )
  or public.kb_is_platform_admin()
)
with check (
  (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (
          c.church_id = (select auth.uid())
          or c.vendor_id = (select auth.uid())
        )
    )
  )
  or public.kb_is_platform_admin()
);

commit;
