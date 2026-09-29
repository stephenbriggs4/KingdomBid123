
alter table public.project_activity_feed
drop constraint project_activity_feed_kind_check;

alter table public.project_activity_feed
add constraint project_activity_feed_kind_check
check (kind = any (array[
  'project_saved','vendor_attached','vendor_invited','bid_received',
  'vendor_shortlisted','vendor_hired','priority_marked',
  'project_needs_attention','compare_started','compare_updated',
  'deal_room_opened','milestone_requested','milestone_approved',
  'closeout_ready','review_requested','project_started',
  'completion_requested','completion_request_withdrawn',
  'completion_changes_requested','project_completed','project_reopened',
  'workspace_sync','approval_requested','dispute_resolved'
]::text[]));
