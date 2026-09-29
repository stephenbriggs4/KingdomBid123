-- FaithBid Advisor RLS consolidation phase 2: messaging, saved projects, notifications,
-- and project/vendor-link state. Preserve existing authenticated effective access while removing
-- legacy PUBLIC duplicates that only repeated auth.uid()-based predicates.

-- Per-user conversation UI state: canonical ALL policy is a strict superset for authenticated users.
DROP POLICY IF EXISTS cus_owner ON public.conversation_user_state;
DROP POLICY IF EXISTS cus_delete ON public.conversation_user_state;
DROP POLICY IF EXISTS cus_insert ON public.conversation_user_state;
DROP POLICY IF EXISTS cus_select ON public.conversation_user_state;
DROP POLICY IF EXISTS cus_update ON public.conversation_user_state;
DROP POLICY IF EXISTS conversation_user_state_delete_own ON public.conversation_user_state;
DROP POLICY IF EXISTS conversation_user_state_insert_own ON public.conversation_user_state;
DROP POLICY IF EXISTS conversation_user_state_select_own ON public.conversation_user_state;
DROP POLICY IF EXISTS conversation_user_state_update_own ON public.conversation_user_state;

-- Conversations: retain the canonical participant policies. Preserve legacy admin DELETE capability
-- explicitly without allowing participants to delete conversations.
DROP POLICY IF EXISTS conversations_admin_all ON public.conversations;
DROP POLICY IF EXISTS "Participants can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS conversations_insert_participant ON public.conversations;
DROP POLICY IF EXISTS convos_insert ON public.conversations;
DROP POLICY IF EXISTS conversations_select_participants ON public.conversations;
DROP POLICY IF EXISTS convos_select ON public.conversations;
DROP POLICY IF EXISTS conversations_update_participants ON public.conversations;
DROP POLICY IF EXISTS convos_update ON public.conversations;
CREATE POLICY kb_conversations_admin_delete
  ON public.conversations
  FOR DELETE
  TO authenticated
  USING (kb_is_platform_admin());

-- Notifications: collapse legacy PUBLIC owner/admin layers into one policy per action.
-- Users keep read/update/delete of their own rows; platform admins keep full management.
DROP POLICY IF EXISTS notifications_admin_all ON public.notifications;
DROP POLICY IF EXISTS notifications_delete_self ON public.notifications;
DROP POLICY IF EXISTS notifications_select ON public.notifications;
DROP POLICY IF EXISTS notifications_select_self ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS notifications_update_self ON public.notifications;

CREATE POLICY kb_notifications_select_own_or_admin
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING ((user_id = (select auth.uid())) OR kb_is_platform_admin());
CREATE POLICY kb_notifications_update_own_or_admin
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING ((user_id = (select auth.uid())) OR kb_is_platform_admin())
  WITH CHECK ((user_id = (select auth.uid())) OR kb_is_platform_admin());
CREATE POLICY kb_notifications_delete_own_or_admin
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING ((user_id = (select auth.uid())) OR kb_is_platform_admin());
CREATE POLICY kb_notifications_admin_insert
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (kb_is_platform_admin());

-- Saved projects: canonical authenticated owner/admin ALL policy supersedes every legacy owner copy.
DROP POLICY IF EXISTS saved_projects_owner ON public.saved_projects;
DROP POLICY IF EXISTS saved_projects_delete ON public.saved_projects;
DROP POLICY IF EXISTS saved_projects_delete_own ON public.saved_projects;
DROP POLICY IF EXISTS saved_projects_insert ON public.saved_projects;
DROP POLICY IF EXISTS saved_projects_insert_own ON public.saved_projects;
DROP POLICY IF EXISTS saved_projects_select ON public.saved_projects;
DROP POLICY IF EXISTS saved_projects_select_own ON public.saved_projects;

-- Project/vendor links: canonical involved/admin ALL policy already contains every effective legacy branch.
DROP POLICY IF EXISTS pvl_delete ON public.project_vendor_links;
DROP POLICY IF EXISTS pvl_delete_church ON public.project_vendor_links;
DROP POLICY IF EXISTS project_vendor_links_insert_related ON public.project_vendor_links;
DROP POLICY IF EXISTS pvl_insert ON public.project_vendor_links;
DROP POLICY IF EXISTS pvl_insert_church ON public.project_vendor_links;
DROP POLICY IF EXISTS project_vendor_links_select_related ON public.project_vendor_links;
DROP POLICY IF EXISTS pvl_select ON public.project_vendor_links;
DROP POLICY IF EXISTS pvl_select_parties ON public.project_vendor_links;
DROP POLICY IF EXISTS project_vendor_links_update_related ON public.project_vendor_links;
DROP POLICY IF EXISTS pvl_update ON public.project_vendor_links;
DROP POLICY IF EXISTS pvl_update_parties ON public.project_vendor_links;
