alter table public.project_activity_feed drop constraint if exists project_activity_feed_kind_check;
alter table public.project_activity_feed add constraint project_activity_feed_kind_check check (
  kind = any (array[
    'project_saved'::text,
    'vendor_attached'::text,
    'vendor_invited'::text,
    'bid_received'::text,
    'vendor_shortlisted'::text,
    'vendor_hired'::text,
    'priority_marked'::text,
    'project_needs_attention'::text,
    'compare_started'::text,
    'compare_updated'::text,
    'deal_room_opened'::text,
    'milestone_requested'::text,
    'milestone_approved'::text,
    'closeout_ready'::text,
    'review_requested'::text,
    'project_started'::text,
    'completion_requested'::text,
    'completion_request_withdrawn'::text,
    'completion_changes_requested'::text,
    'project_completed'::text,
    'project_reopened'::text
  ])
);
