-- Remove exact duplicate foreign-key constraints while preserving the conventional canonical copies.
ALTER TABLE public.conversation_user_state
  DROP CONSTRAINT IF EXISTS fk_convo_state_convo;
ALTER TABLE public.saved_projects
  DROP CONSTRAINT IF EXISTS fk_saved_projects_project;
ALTER TABLE public.saved_vendors
  DROP CONSTRAINT IF EXISTS fk_saved_vendors_vendor;
