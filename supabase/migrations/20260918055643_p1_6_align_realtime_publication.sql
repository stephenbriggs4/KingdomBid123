
-- P1-6: the frontend subscribes to postgres_changes on projects, bids,
-- saved_projects, project_vendor_links, project_activity_feed, and project_ops,
-- but the live supabase_realtime publication only contained conversations,
-- messages, notifications, conversation_user_state -- so those subscriptions
-- silently never received events. All six tables already have RLS enabled
-- with properly scoped owner/participant SELECT policies (verified), so
-- adding them is safe: Realtime enforces the same RLS for authenticated
-- subscribers. Chosen to add rather than remove the subscriptions, since this
-- is real, already-built live-update UX and event volume is negligible at
-- current pilot scale.
alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.bids;
alter publication supabase_realtime add table public.saved_projects;
alter publication supabase_realtime add table public.project_vendor_links;
alter publication supabase_realtime add table public.project_activity_feed;
alter publication supabase_realtime add table public.project_ops;
