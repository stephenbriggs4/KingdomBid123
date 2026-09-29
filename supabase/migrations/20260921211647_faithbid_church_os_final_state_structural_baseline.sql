set check_function_bodies = off;

create schema if not exists toolkit_core;
revoke all on schema toolkit_core from public, anon, authenticated;

create table toolkit_core.action_proposals (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  run_id uuid,
  step_id bigint,
  idempotency_key text not null,
  proposal_type text not null,
  entity_type text,
  entity_id text,
  title text not null,
  summary text,
  explanation jsonb default '{}'::jsonb not null,
  proposed_action jsonb default '{}'::jsonb not null,
  risk_level text default 'low'::text not null,
  status text default 'pending'::text not null,
  expires_at timestamp with time zone,
  decided_by uuid,
  decided_at timestamp with time zone,
  executed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  decision_note text
);

create table toolkit_core.ai_generations (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  source_type text not null,
  source_id uuid not null,
  generation_kind text not null,
  idempotency_key text not null,
  status text default 'waiting_provider'::text not null,
  provider text,
  model text,
  input_snapshot jsonb default '{}'::jsonb not null,
  output_text text,
  error_message text,
  requested_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  completed_at timestamp with time zone,
  attempts integer default 0 not null,
  locked_at timestamp with time zone,
  locked_by text
);

create table toolkit_core.announcements (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  title text not null,
  body text,
  show_from date default CURRENT_DATE not null,
  show_until date,
  sort_order integer default 0 not null,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.audit_events (
  id bigint generated always as identity not null,
  workspace_id uuid,
  actor_id uuid,
  action text not null,
  target_type text,
  target_id text,
  meta jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.automation_observations (
  id bigint generated always as identity not null,
  workspace_id uuid not null,
  rule_id uuid not null,
  event_id bigint not null,
  event_type text not null,
  capability text not null,
  title text not null,
  explanation jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.automation_permissions (
  workspace_id uuid not null,
  capability text not null,
  enabled boolean default false not null,
  autonomy_level text default 'prepare'::text not null,
  updated_by uuid,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.automation_policies (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  name text not null,
  natural_language text not null,
  policy_kind text default 'operational'::text not null,
  structured_rule jsonb default '{}'::jsonb not null,
  status text default 'proposed'::text not null,
  created_by uuid,
  confirmed_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.automation_processor_state (
  processor text not null,
  last_event_id bigint default 0 not null,
  last_started_at timestamp with time zone,
  last_finished_at timestamp with time zone,
  last_error text,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.automation_rules (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  name text not null,
  capability text not null,
  trigger_event text not null,
  enabled boolean default false not null,
  required_autonomy text default 'prepare'::text not null,
  conditions jsonb default '{}'::jsonb not null,
  action_kind text not null,
  action_config jsonb default '{}'::jsonb not null,
  priority integer default 100 not null,
  version integer default 1 not null,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.automation_runs (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  rule_id uuid,
  event_id bigint,
  idempotency_key text not null,
  status text default 'queued'::text not null,
  started_at timestamp with time zone,
  finished_at timestamp with time zone,
  error_code text,
  error_message text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.automation_signal_state (
  workspace_id uuid not null,
  signal_key text not null,
  signal_type text not null,
  entity_type text not null,
  entity_id text,
  active boolean default false not null,
  state_hash text,
  last_emitted_at timestamp with time zone,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.automation_steps (
  id bigint generated always as identity not null,
  workspace_id uuid not null,
  run_id uuid not null,
  "position" integer not null,
  step_kind text not null,
  idempotency_key text,
  status text default 'queued'::text not null,
  input jsonb default '{}'::jsonb not null,
  output jsonb default '{}'::jsonb not null,
  attempt_count integer default 0 not null,
  error_message text,
  started_at timestamp with time zone,
  finished_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.availability_blackouts (
  person_id uuid not null,
  on_date date not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.brand_kits (
  workspace_id uuid not null,
  primary_color text default '#12312b'::text not null,
  accent_color text default '#c39a4a'::text not null,
  heading_font text default 'Georgia'::text not null,
  body_font text default 'Calibri'::text not null,
  tagline text,
  updated_by uuid,
  updated_at timestamp with time zone default now() not null,
  logo text
);

create table toolkit_core.calendar_items (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  title text not null,
  kind text default 'event'::text not null,
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone,
  all_day boolean default false not null,
  location text,
  notes text,
  recurrence text default 'none'::text not null,
  recurrence_until date,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.care_notes (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  person_id uuid,
  kind text not null,
  body text not null,
  status text default 'open'::text not null,
  follow_up_on date,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.channel_members (
  channel_id uuid not null,
  user_id uuid not null,
  added_at timestamp with time zone default now() not null
);

create table toolkit_core.channel_reads (
  channel_id uuid not null,
  user_id uuid not null,
  last_read_at timestamp with time zone default now() not null
);

create table toolkit_core.channels (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  name text not null,
  type text not null,
  description text,
  is_private boolean default false not null,
  archived boolean default false not null,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.chat_messages (
  id uuid default gen_random_uuid() not null,
  channel_id uuid not null,
  workspace_id uuid not null,
  author_user uuid not null,
  body text not null,
  parent_id uuid,
  pinned boolean default false not null,
  created_at timestamp with time zone default now() not null,
  edited_at timestamp with time zone,
  deleted_at timestamp with time zone
);

create table toolkit_core.chat_reactions (
  message_id uuid not null,
  user_id uuid not null,
  emoji text not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.chat_saved (
  message_id uuid not null,
  user_id uuid not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.church_memory_facts (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  fact_key text not null,
  label text not null,
  category text default 'general'::text not null,
  value jsonb default '{}'::jsonb not null,
  sensitivity text default 'general'::text not null,
  source_type text,
  source_id text,
  active boolean default true not null,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.church_rhythms (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  rhythm_key text not null,
  kind text not null,
  label text not null,
  day_of_week integer,
  time_local time without time zone,
  cadence text default 'weekly'::text not null,
  source text default 'learned'::text not null,
  confidence numeric(4,3) default 1 not null,
  active boolean default true not null,
  updated_by uuid,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.church_voice_profiles (
  workspace_id uuid not null,
  bible_translation text,
  service_term text default 'service'::text not null,
  tone text default 'warm'::text not null,
  formality text default 'conversational'::text not null,
  emoji_style text default 'minimal'::text not null,
  announcement_style text,
  mission_values text,
  phrases_use text[] default '{}'::text[] not null,
  phrases_avoid text[] default '{}'::text[] not null,
  updated_by uuid,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.connect_pages (
  workspace_id uuid not null,
  slug text not null,
  enabled boolean default false not null,
  created_at timestamp with time zone default now() not null,
  rotated_at timestamp with time zone,
  groups_public boolean default false not null,
  events_public boolean default false not null
);

create table toolkit_core.connect_submissions (
  id bigint generated always as identity not null,
  workspace_id uuid not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  interests text[] default '{}'::text[] not null,
  contact_ok boolean default false not null,
  person_id uuid,
  result text not null,
  reason text,
  ip_hash text,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.consents (
  id bigint generated always as identity not null,
  workspace_id uuid not null,
  person_id uuid not null,
  purpose text not null,
  channel text,
  status text not null,
  source text default 'staff_entry'::text not null,
  evidence text,
  recorded_by uuid,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.documents (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  name text not null,
  folder text default 'general'::text not null,
  storage_path text not null,
  file_name text not null,
  size_bytes bigint not null,
  mime text,
  expires_on date,
  restricted boolean default false not null,
  notes text,
  calendar_item_id uuid,
  uploaded_by uuid not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.event_log (
  id bigint generated always as identity not null,
  workspace_id uuid not null,
  event_type text not null,
  entity_type text not null,
  entity_id text,
  actor_id uuid,
  source text default 'system'::text not null,
  payload jsonb default '{}'::jsonb not null,
  correlation_id text,
  occurred_at timestamp with time zone default now() not null
);

create table toolkit_core.event_registrations (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  item_id uuid not null,
  person_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  party_size integer default 1 not null,
  contact_ok boolean default false not null,
  status text not null,
  ip_hash text,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.event_signups (
  item_id uuid not null,
  workspace_id uuid not null,
  capacity integer,
  blurb text,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.group_attendance (
  meeting_id uuid not null,
  person_id uuid not null,
  workspace_id uuid not null,
  present boolean not null
);

create table toolkit_core.group_meetings (
  id uuid default gen_random_uuid() not null,
  group_id uuid not null,
  workspace_id uuid not null,
  held_on date not null,
  lesson_id uuid,
  topic text,
  leader_notes text,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.group_members (
  group_id uuid not null,
  person_id uuid not null,
  workspace_id uuid not null,
  role text default 'member'::text not null,
  joined_at timestamp with time zone default now() not null
);

create table toolkit_core.group_requests (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  group_id uuid not null,
  person_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  contact_ok boolean default false not null,
  status text default 'new'::text not null,
  reason text,
  ip_hash text,
  created_at timestamp with time zone default now() not null,
  resolved_by uuid,
  resolved_at timestamp with time zone
);

create table toolkit_core.groups (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  name text not null,
  kind text default 'small_group'::text not null,
  description text,
  meets text,
  location text,
  is_open boolean default false not null,
  status text default 'active'::text not null,
  study_id uuid,
  current_position integer default 1 not null,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null,
  public_listing boolean default false not null
);

create table toolkit_core.household_members (
  household_id uuid not null,
  person_id uuid not null,
  workspace_id uuid not null,
  role text default 'adult'::text not null
);

create table toolkit_core.households (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  name text not null,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.inbound_messages (
  id bigint generated always as identity not null,
  workspace_id uuid not null,
  person_id uuid not null,
  channel text not null,
  body text not null,
  action text not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.integration_webhook_events (
  id bigint generated always as identity not null,
  workspace_id uuid,
  provider_type text not null,
  provider_name text not null,
  external_event_id text not null,
  event_type text not null,
  payload_hash text not null,
  metadata jsonb default '{}'::jsonb not null,
  status text default 'received'::text not null,
  error_message text,
  received_at timestamp with time zone default now() not null,
  processed_at timestamp with time zone
);

create table toolkit_core.invitations (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  email text not null,
  role text not null,
  token_hash text not null,
  invited_by uuid not null,
  created_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone default (now() + '14 days'::interval) not null,
  accepted_at timestamp with time zone,
  accepted_by uuid,
  revoked boolean default false not null,
  person_id uuid
);

create table toolkit_core.kids_checkins (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  child_id uuid not null,
  room_id uuid not null,
  code text,
  checked_in_at timestamp with time zone default now() not null,
  checked_in_by uuid,
  checked_out_at timestamp with time zone,
  checked_out_by uuid,
  picked_up_by uuid,
  code_hash text,
  failed_attempts integer default 0 not null,
  locked_until timestamp with time zone,
  last_failed_at timestamp with time zone
);

create table toolkit_core.kids_clearances (
  person_id uuid not null,
  workspace_id uuid not null,
  cleared_until date not null,
  note text,
  updated_by uuid,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.kids_duty (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  room_id uuid not null,
  person_id uuid not null,
  on_at timestamp with time zone default now() not null,
  off_at timestamp with time zone
);

create table toolkit_core.kids_guardians (
  child_id uuid not null,
  guardian_id uuid not null,
  workspace_id uuid not null,
  can_pickup boolean default true not null
);

create table toolkit_core.kids_health (
  person_id uuid not null,
  workspace_id uuid not null,
  allergies text,
  medical text,
  notes text
);

create table toolkit_core.kids_rooms (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  name text not null,
  ages text,
  ratio integer default 8 not null,
  active boolean default true not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.lessons (
  id uuid default gen_random_uuid() not null,
  study_id uuid not null,
  workspace_id uuid not null,
  "position" integer not null,
  title text not null,
  passage text,
  summary text,
  questions text,
  leader_notes text
);

create table toolkit_core.member_profiles (
  user_id uuid not null,
  username text not null,
  display_name text not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.mission_partners (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  name text not null,
  kind text default 'missionary'::text not null,
  region text,
  summary text,
  contact_name text,
  email text,
  phone text,
  monthly_support numeric(10,2),
  sensitive boolean default false not null,
  status text default 'active'::text not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.mission_updates (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  partner_id uuid not null,
  title text not null,
  body text,
  posted_on date default CURRENT_DATE not null,
  is_prayer boolean default false not null,
  created_by uuid,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.operational_links (
  id bigint generated always as identity not null,
  workspace_id uuid not null,
  from_type text not null,
  from_id text not null,
  relation text not null,
  to_type text not null,
  to_id text not null,
  source text default 'derived'::text not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.outbox (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  person_id uuid not null,
  channel text not null,
  purpose text not null,
  body text not null,
  status text default 'pending_approval'::text not null,
  status_reason text,
  related_type text,
  related_id uuid,
  provider text,
  provider_message_id text,
  created_by uuid not null,
  approved_by uuid,
  created_at timestamp with time zone default now() not null,
  approved_at timestamp with time zone,
  sent_at timestamp with time zone
);

create table toolkit_core.people (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  first_name text not null,
  last_name text default ''::text not null,
  email text,
  phone text,
  status text default 'guest'::text not null,
  age_group text default 'unknown'::text not null,
  preferred_channel text,
  language text default 'en'::text not null,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  user_id uuid,
  ok_show_name boolean default false not null
);

create table toolkit_core.proposal_execution_attempts (
  id bigint generated always as identity not null,
  workspace_id uuid not null,
  proposal_id uuid not null,
  action_kind text not null,
  status text not null,
  result jsonb default '{}'::jsonb not null,
  error_message text,
  started_at timestamp with time zone default now() not null,
  finished_at timestamp with time zone
);

create table toolkit_core.provider_connections (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  provider_type text not null,
  provider_name text not null,
  status text default 'not_configured'::text not null,
  secret_ref text,
  config jsonb default '{}'::jsonb not null,
  connected_by uuid,
  connected_at timestamp with time zone,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.recipe_settings (
  workspace_id uuid not null,
  recipe text not null,
  enabled boolean default false not null,
  last_run_at timestamp with time zone,
  last_created integer default 0 not null,
  updated_by uuid
);

create table toolkit_core.role_assignments (
  id uuid default gen_random_uuid() not null,
  role_id uuid not null,
  person_id uuid not null,
  status text default 'assigned'::text not null,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.run_sheet_items (
  id uuid default gen_random_uuid() not null,
  plan_id uuid not null,
  "position" integer not null,
  time_label text,
  title text not null,
  lead text,
  notes text
);

create table toolkit_core.scheduled_jobs (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  run_id uuid,
  step_id bigint,
  idempotency_key text not null,
  job_type text not null,
  payload jsonb default '{}'::jsonb not null,
  run_at timestamp with time zone default now() not null,
  status text default 'queued'::text not null,
  attempts integer default 0 not null,
  max_attempts integer default 5 not null,
  locked_at timestamp with time zone,
  locked_by text,
  error_message text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.sermon_series (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  name text not null,
  description text,
  starts_on date,
  ends_on date,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.sermons (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  series_id uuid,
  title text not null,
  speaker text,
  preached_on date not null,
  scripture text,
  summary text,
  notes text,
  status text default 'planned'::text not null,
  media_url text,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.service_plans (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  title text not null,
  starts_at timestamp with time zone not null,
  theme text,
  notes text,
  calendar_item_id uuid,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  attendance integer
);

create table toolkit_core.service_roles (
  id uuid default gen_random_uuid() not null,
  plan_id uuid not null,
  name text not null,
  needed integer default 1 not null,
  "position" integer default 0 not null
);

create table toolkit_core.studies (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  title text not null,
  description text,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.tasks (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  title text not null,
  notes text,
  due_date date,
  status text default 'open'::text not null,
  assignee_user uuid,
  source text default 'manual'::text not null,
  calendar_item_id uuid,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  completed_at timestamp with time zone
);

create table toolkit_core.volunteer_role_profiles (
  workspace_id uuid not null,
  person_id uuid not null,
  role_key text not null,
  eligible boolean default true not null,
  preferred boolean default false not null,
  updated_by uuid,
  updated_at timestamp with time zone default now() not null
);

create table toolkit_core.workflow_templates (
  template_key text not null,
  name text not null,
  capability text not null,
  description text not null,
  default_autonomy text default 'prepare'::text not null,
  active boolean default true not null
);

create table toolkit_core.workspace_features (
  workspace_id uuid not null,
  module text not null,
  enabled boolean default false not null
);

create table toolkit_core.workspace_members (
  workspace_id uuid not null,
  user_id uuid not null,
  role text not null,
  status text default 'active'::text not null,
  created_at timestamp with time zone default now() not null
);

create table toolkit_core.workspaces (
  id uuid default gen_random_uuid() not null,
  name text not null,
  timezone text default 'America/Chicago'::text not null,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null,
  quiet_start time without time zone default '21:00:00'::time without time zone not null,
  quiet_end time without time zone default '08:00:00'::time without time zone not null
);

alter table toolkit_core.action_proposals add constraint action_proposals_decision_note_check CHECK (decision_note IS NULL OR char_length(decision_note) <= 800);
alter table toolkit_core.action_proposals add constraint action_proposals_entity_type_check CHECK (entity_type IS NULL OR char_length(entity_type) <= 80);
alter table toolkit_core.action_proposals add constraint action_proposals_explanation_check CHECK (jsonb_typeof(explanation) = 'object'::text);
alter table toolkit_core.action_proposals add constraint action_proposals_idempotency_key_check CHECK (char_length(idempotency_key) >= 3 AND char_length(idempotency_key) <= 240);
alter table toolkit_core.action_proposals add constraint action_proposals_pkey PRIMARY KEY (id);
alter table toolkit_core.action_proposals add constraint action_proposals_proposal_type_check CHECK (char_length(proposal_type) >= 2 AND char_length(proposal_type) <= 80 AND proposal_type ~ '^[a-z0-9_]+$'::text);
alter table toolkit_core.action_proposals add constraint action_proposals_proposed_action_check CHECK (jsonb_typeof(proposed_action) = 'object'::text);
alter table toolkit_core.action_proposals add constraint action_proposals_risk_level_check CHECK (risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]));
alter table toolkit_core.action_proposals add constraint action_proposals_status_check CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'executed'::text, 'expired'::text, 'cancelled'::text]));
alter table toolkit_core.action_proposals add constraint action_proposals_summary_check CHECK (summary IS NULL OR char_length(summary) <= 2000);
alter table toolkit_core.action_proposals add constraint action_proposals_title_check CHECK (char_length(TRIM(BOTH FROM title)) >= 2 AND char_length(TRIM(BOTH FROM title)) <= 180);
alter table toolkit_core.action_proposals add constraint action_proposals_workspace_id_idempotency_key_key UNIQUE (workspace_id, idempotency_key);
alter table toolkit_core.ai_generations add constraint ai_generations_attempts_check CHECK (attempts >= 0);
alter table toolkit_core.ai_generations add constraint ai_generations_error_message_check CHECK (error_message IS NULL OR char_length(error_message) <= 1200);
alter table toolkit_core.ai_generations add constraint ai_generations_generation_kind_check CHECK (generation_kind = ANY (ARRAY['bulletin_summary'::text, 'sermon_slides'::text, 'sunday_recap'::text, 'devotional_5_day'::text, 'group_discussion'::text, 'midweek_email'::text, 'social_posts'::text, 'short_video_prompts'::text, 'newsletter_paragraph'::text]));
alter table toolkit_core.ai_generations add constraint ai_generations_input_snapshot_check CHECK (jsonb_typeof(input_snapshot) = 'object'::text);
alter table toolkit_core.ai_generations add constraint ai_generations_pkey PRIMARY KEY (id);
alter table toolkit_core.ai_generations add constraint ai_generations_source_type_check CHECK (source_type = ANY (ARRAY['sermon'::text, 'service_plan'::text, 'announcement'::text]));
alter table toolkit_core.ai_generations add constraint ai_generations_status_check CHECK (status = ANY (ARRAY['waiting_provider'::text, 'queued'::text, 'running'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]));
alter table toolkit_core.ai_generations add constraint ai_generations_workspace_id_idempotency_key_key UNIQUE (workspace_id, idempotency_key);
alter table toolkit_core.announcements add constraint announcements_body_check CHECK (body IS NULL OR char_length(body) <= 300);
alter table toolkit_core.announcements add constraint announcements_check CHECK (show_until IS NULL OR show_until >= show_from);
alter table toolkit_core.announcements add constraint announcements_pkey PRIMARY KEY (id);
alter table toolkit_core.announcements add constraint announcements_title_check CHECK (char_length(title) >= 1 AND char_length(title) <= 80);
alter table toolkit_core.audit_events add constraint audit_events_pkey PRIMARY KEY (id);
alter table toolkit_core.automation_observations add constraint automation_observations_pkey PRIMARY KEY (id);
alter table toolkit_core.automation_observations add constraint automation_observations_workspace_id_rule_id_event_id_key UNIQUE (workspace_id, rule_id, event_id);
alter table toolkit_core.automation_permissions add constraint automation_permissions_autonomy_level_check CHECK (autonomy_level = ANY (ARRAY['observe'::text, 'prepare'::text, 'act'::text]));
alter table toolkit_core.automation_permissions add constraint automation_permissions_capability_check CHECK (char_length(capability) >= 2 AND char_length(capability) <= 80 AND capability ~ '^[a-z0-9_]+$'::text);
alter table toolkit_core.automation_permissions add constraint automation_permissions_pkey PRIMARY KEY (workspace_id, capability);
alter table toolkit_core.automation_policies add constraint automation_policies_name_check CHECK (char_length(TRIM(BOTH FROM name)) >= 2 AND char_length(TRIM(BOTH FROM name)) <= 120);
alter table toolkit_core.automation_policies add constraint automation_policies_natural_language_check CHECK (char_length(TRIM(BOTH FROM natural_language)) >= 3 AND char_length(TRIM(BOTH FROM natural_language)) <= 1500);
alter table toolkit_core.automation_policies add constraint automation_policies_pkey PRIMARY KEY (id);
alter table toolkit_core.automation_policies add constraint automation_policies_status_check CHECK (status = ANY (ARRAY['proposed'::text, 'confirmed'::text, 'disabled'::text]));
alter table toolkit_core.automation_policies add constraint automation_policies_structured_rule_check CHECK (jsonb_typeof(structured_rule) = 'object'::text);
alter table toolkit_core.automation_policies add constraint automation_policies_workspace_id_name_key UNIQUE (workspace_id, name);
alter table toolkit_core.automation_processor_state add constraint automation_processor_state_last_error_check CHECK (last_error IS NULL OR char_length(last_error) <= 1200);
alter table toolkit_core.automation_processor_state add constraint automation_processor_state_pkey PRIMARY KEY (processor);
alter table toolkit_core.automation_rules add constraint automation_rules_action_config_check CHECK (jsonb_typeof(action_config) = 'object'::text);
alter table toolkit_core.automation_rules add constraint automation_rules_action_kind_check CHECK (char_length(action_kind) >= 2 AND char_length(action_kind) <= 80 AND action_kind ~ '^[a-z0-9_]+$'::text);
alter table toolkit_core.automation_rules add constraint automation_rules_capability_check CHECK (char_length(capability) >= 2 AND char_length(capability) <= 80 AND capability ~ '^[a-z0-9_]+$'::text);
alter table toolkit_core.automation_rules add constraint automation_rules_conditions_check CHECK (jsonb_typeof(conditions) = 'object'::text);
alter table toolkit_core.automation_rules add constraint automation_rules_name_check CHECK (char_length(TRIM(BOTH FROM name)) >= 2 AND char_length(TRIM(BOTH FROM name)) <= 120);
alter table toolkit_core.automation_rules add constraint automation_rules_pkey PRIMARY KEY (id);
alter table toolkit_core.automation_rules add constraint automation_rules_priority_check CHECK (priority >= 1 AND priority <= 1000);
alter table toolkit_core.automation_rules add constraint automation_rules_required_autonomy_check CHECK (required_autonomy = ANY (ARRAY['observe'::text, 'prepare'::text, 'act'::text]));
alter table toolkit_core.automation_rules add constraint automation_rules_trigger_event_check CHECK (char_length(trigger_event) >= 3 AND char_length(trigger_event) <= 120 AND trigger_event ~ '^[a-z0-9_*]+([.][a-z0-9_*]+)+$'::text);
alter table toolkit_core.automation_rules add constraint automation_rules_version_check CHECK (version >= 1);
alter table toolkit_core.automation_rules add constraint automation_rules_workspace_id_name_key UNIQUE (workspace_id, name);
alter table toolkit_core.automation_runs add constraint automation_runs_error_message_check CHECK (error_message IS NULL OR char_length(error_message) <= 1200);
alter table toolkit_core.automation_runs add constraint automation_runs_idempotency_key_check CHECK (char_length(idempotency_key) >= 3 AND char_length(idempotency_key) <= 240);
alter table toolkit_core.automation_runs add constraint automation_runs_pkey PRIMARY KEY (id);
alter table toolkit_core.automation_runs add constraint automation_runs_status_check CHECK (status = ANY (ARRAY['queued'::text, 'running'::text, 'waiting_approval'::text, 'succeeded'::text, 'failed'::text, 'cancelled'::text]));
alter table toolkit_core.automation_runs add constraint automation_runs_workspace_id_idempotency_key_key UNIQUE (workspace_id, idempotency_key);
alter table toolkit_core.automation_signal_state add constraint automation_signal_state_entity_type_check CHECK (char_length(entity_type) >= 1 AND char_length(entity_type) <= 80);
alter table toolkit_core.automation_signal_state add constraint automation_signal_state_pkey PRIMARY KEY (workspace_id, signal_key);
alter table toolkit_core.automation_signal_state add constraint automation_signal_state_signal_key_check CHECK (char_length(signal_key) >= 3 AND char_length(signal_key) <= 240);
alter table toolkit_core.automation_signal_state add constraint automation_signal_state_signal_type_check CHECK (char_length(signal_type) >= 3 AND char_length(signal_type) <= 120 AND signal_type ~ '^[a-z0-9_]+([.][a-z0-9_]+)+$'::text);
alter table toolkit_core.automation_steps add constraint automation_steps_attempt_count_check CHECK (attempt_count >= 0);
alter table toolkit_core.automation_steps add constraint automation_steps_error_message_check CHECK (error_message IS NULL OR char_length(error_message) <= 1200);
alter table toolkit_core.automation_steps add constraint automation_steps_idempotency_key_check CHECK (idempotency_key IS NULL OR char_length(idempotency_key) >= 3 AND char_length(idempotency_key) <= 240);
alter table toolkit_core.automation_steps add constraint automation_steps_input_check CHECK (jsonb_typeof(input) = 'object'::text);
alter table toolkit_core.automation_steps add constraint automation_steps_output_check CHECK (jsonb_typeof(output) = 'object'::text);
alter table toolkit_core.automation_steps add constraint automation_steps_pkey PRIMARY KEY (id);
alter table toolkit_core.automation_steps add constraint automation_steps_position_check CHECK ("position" >= 1 AND "position" <= 1000);
alter table toolkit_core.automation_steps add constraint automation_steps_run_id_position_key UNIQUE (run_id, "position");
alter table toolkit_core.automation_steps add constraint automation_steps_status_check CHECK (status = ANY (ARRAY['queued'::text, 'running'::text, 'waiting_approval'::text, 'succeeded'::text, 'failed'::text, 'skipped'::text, 'cancelled'::text]));
alter table toolkit_core.automation_steps add constraint automation_steps_step_kind_check CHECK (char_length(step_kind) >= 2 AND char_length(step_kind) <= 80 AND step_kind ~ '^[a-z0-9_]+$'::text);
alter table toolkit_core.automation_steps add constraint automation_steps_workspace_id_idempotency_key_key UNIQUE (workspace_id, idempotency_key);
alter table toolkit_core.availability_blackouts add constraint availability_blackouts_pkey PRIMARY KEY (person_id, on_date);
alter table toolkit_core.brand_kits add constraint brand_kits_accent_color_check CHECK (accent_color ~ '^#[0-9a-fA-F]{6}$'::text);
alter table toolkit_core.brand_kits add constraint brand_kits_body_font_check CHECK (body_font = ANY (ARRAY['Georgia'::text, 'Cambria'::text, 'Times New Roman'::text, 'Arial'::text, 'Calibri'::text, 'Verdana'::text, 'Trebuchet MS'::text]));
alter table toolkit_core.brand_kits add constraint brand_kits_heading_font_check CHECK (heading_font = ANY (ARRAY['Georgia'::text, 'Cambria'::text, 'Times New Roman'::text, 'Arial'::text, 'Calibri'::text, 'Verdana'::text, 'Trebuchet MS'::text]));
alter table toolkit_core.brand_kits add constraint brand_kits_logo_check CHECK (logo IS NULL OR logo ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$'::text AND char_length(logo) <= 400000);
alter table toolkit_core.brand_kits add constraint brand_kits_pkey PRIMARY KEY (workspace_id);
alter table toolkit_core.brand_kits add constraint brand_kits_primary_color_check CHECK (primary_color ~ '^#[0-9a-fA-F]{6}$'::text);
alter table toolkit_core.brand_kits add constraint brand_kits_tagline_check CHECK (tagline IS NULL OR char_length(tagline) <= 120);
alter table toolkit_core.calendar_items add constraint calendar_items_check CHECK (ends_at IS NULL OR ends_at >= starts_at);
alter table toolkit_core.calendar_items add constraint calendar_items_kind_check CHECK (kind = ANY (ARRAY['service'::text, 'event'::text, 'meeting'::text, 'rehearsal'::text, 'deadline'::text, 'renewal'::text, 'other'::text]));
alter table toolkit_core.calendar_items add constraint calendar_items_location_check CHECK (location IS NULL OR char_length(location) <= 160);
alter table toolkit_core.calendar_items add constraint calendar_items_notes_check CHECK (notes IS NULL OR char_length(notes) <= 2000);
alter table toolkit_core.calendar_items add constraint calendar_items_pkey PRIMARY KEY (id);
alter table toolkit_core.calendar_items add constraint calendar_items_recurrence_check CHECK (recurrence = ANY (ARRAY['none'::text, 'weekly'::text, 'monthly'::text, 'yearly'::text]));
alter table toolkit_core.calendar_items add constraint calendar_items_title_check CHECK (char_length(title) >= 1 AND char_length(title) <= 160);
alter table toolkit_core.care_notes add constraint care_notes_body_check CHECK (char_length(body) >= 1 AND char_length(body) <= 2000);
alter table toolkit_core.care_notes add constraint care_notes_kind_check CHECK (kind = ANY (ARRAY['prayer'::text, 'care'::text]));
alter table toolkit_core.care_notes add constraint care_notes_pkey PRIMARY KEY (id);
alter table toolkit_core.care_notes add constraint care_notes_status_check CHECK (status = ANY (ARRAY['open'::text, 'followed_up'::text, 'closed'::text]));
alter table toolkit_core.channel_members add constraint channel_members_pkey PRIMARY KEY (channel_id, user_id);
alter table toolkit_core.channel_reads add constraint channel_reads_pkey PRIMARY KEY (channel_id, user_id);
alter table toolkit_core.channels add constraint channels_description_check CHECK (description IS NULL OR char_length(description) <= 160);
alter table toolkit_core.channels add constraint channels_name_check CHECK (name ~ '^[a-z0-9][a-z0-9-]{1,39}$'::text);
alter table toolkit_core.channels add constraint channels_pkey PRIMARY KEY (id);
alter table toolkit_core.channels add constraint channels_type_check CHECK (type = ANY (ARRAY['church'::text, 'announcement'::text, 'team'::text, 'group'::text, 'event'::text, 'leadership'::text]));
alter table toolkit_core.channels add constraint channels_workspace_id_name_key UNIQUE (workspace_id, name);
alter table toolkit_core.chat_messages add constraint chat_messages_body_check CHECK (char_length(body) >= 1 AND char_length(body) <= 4000);
alter table toolkit_core.chat_messages add constraint chat_messages_pkey PRIMARY KEY (id);
alter table toolkit_core.chat_reactions add constraint chat_reactions_emoji_check CHECK (emoji = ANY (ARRAY['🙏'::text, '❤️'::text, '👍'::text, '🙌'::text, '😊'::text]));
alter table toolkit_core.chat_reactions add constraint chat_reactions_pkey PRIMARY KEY (message_id, user_id, emoji);
alter table toolkit_core.chat_saved add constraint chat_saved_pkey PRIMARY KEY (message_id, user_id);
alter table toolkit_core.church_memory_facts add constraint church_memory_facts_label_check CHECK (char_length(TRIM(BOTH FROM label)) >= 2 AND char_length(TRIM(BOTH FROM label)) <= 180);
alter table toolkit_core.church_memory_facts add constraint church_memory_facts_pkey PRIMARY KEY (id);
alter table toolkit_core.church_memory_facts add constraint church_memory_facts_sensitivity_check CHECK (sensitivity = ANY (ARRAY['general'::text, 'restricted'::text]));
alter table toolkit_core.church_memory_facts add constraint church_memory_facts_workspace_id_fact_key_key UNIQUE (workspace_id, fact_key);
alter table toolkit_core.church_rhythms add constraint church_rhythms_cadence_check CHECK (cadence = ANY (ARRAY['weekly'::text, 'monthly'::text, 'yearly'::text, 'custom'::text]));
alter table toolkit_core.church_rhythms add constraint church_rhythms_confidence_check CHECK (confidence >= 0::numeric AND confidence <= 1::numeric);
alter table toolkit_core.church_rhythms add constraint church_rhythms_day_of_week_check CHECK (day_of_week >= 0 AND day_of_week <= 6);
alter table toolkit_core.church_rhythms add constraint church_rhythms_kind_check CHECK (kind = ANY (ARRAY['service'::text, 'group'::text, 'event'::text, 'task'::text, 'communication'::text, 'governance'::text, 'renewal'::text, 'other'::text]));
alter table toolkit_core.church_rhythms add constraint church_rhythms_pkey PRIMARY KEY (id);
alter table toolkit_core.church_rhythms add constraint church_rhythms_source_check CHECK (source = ANY (ARRAY['learned'::text, 'explicit'::text]));
alter table toolkit_core.church_rhythms add constraint church_rhythms_workspace_id_rhythm_key_key UNIQUE (workspace_id, rhythm_key);
alter table toolkit_core.church_voice_profiles add constraint church_voice_profiles_pkey PRIMARY KEY (workspace_id);
alter table toolkit_core.connect_pages add constraint connect_pages_pkey PRIMARY KEY (workspace_id);
alter table toolkit_core.connect_pages add constraint connect_pages_slug_check CHECK (slug ~ '^[a-f0-9]{24}$'::text);
alter table toolkit_core.connect_pages add constraint connect_pages_slug_key UNIQUE (slug);
alter table toolkit_core.connect_submissions add constraint connect_submissions_pkey PRIMARY KEY (id);
alter table toolkit_core.connect_submissions add constraint connect_submissions_result_check CHECK (result = ANY (ARRAY['created'::text, 'existing'::text, 'rejected'::text]));
alter table toolkit_core.consents add constraint consents_channel_check CHECK (channel = ANY (ARRAY['sms'::text, 'email'::text, 'phone'::text, 'print'::text]));
alter table toolkit_core.consents add constraint consents_evidence_check CHECK (evidence IS NULL OR char_length(evidence) <= 500);
alter table toolkit_core.consents add constraint consents_pkey PRIMARY KEY (id);
alter table toolkit_core.consents add constraint consents_purpose_check CHECK (purpose = ANY (ARRAY['operational_messages'::text, 'newsletters'::text, 'guest_followup'::text, 'directory_listing'::text, 'photo_use'::text, 'group_matching'::text, 'volunteer_contact'::text, 'group_reminders'::text, 'missions_updates'::text, 'event_updates'::text]));
alter table toolkit_core.consents add constraint consents_source_check CHECK (char_length(source) <= 60);
alter table toolkit_core.consents add constraint consents_status_check CHECK (status = ANY (ARRAY['granted'::text, 'revoked'::text]));
alter table toolkit_core.documents add constraint documents_file_name_check CHECK (char_length(file_name) <= 240);
alter table toolkit_core.documents add constraint documents_folder_check CHECK (folder = ANY (ARRAY['general'::text, 'policies'::text, 'insurance'::text, 'contracts'::text, 'minutes'::text, 'board'::text, 'templates'::text, 'finance'::text, 'facilities'::text, 'sunday'::text, 'kids'::text, 'archive'::text]));
alter table toolkit_core.documents add constraint documents_name_check CHECK (char_length(name) >= 1 AND char_length(name) <= 200);
alter table toolkit_core.documents add constraint documents_notes_check CHECK (notes IS NULL OR char_length(notes) <= 2000);
alter table toolkit_core.documents add constraint documents_pkey PRIMARY KEY (id);
alter table toolkit_core.documents add constraint documents_size_bytes_check CHECK (size_bytes >= 0 AND size_bytes <= 26214400);
alter table toolkit_core.documents add constraint documents_storage_path_key UNIQUE (storage_path);
alter table toolkit_core.event_log add constraint event_log_entity_type_check CHECK (char_length(entity_type) >= 1 AND char_length(entity_type) <= 80);
alter table toolkit_core.event_log add constraint event_log_event_type_check CHECK (char_length(event_type) >= 3 AND char_length(event_type) <= 120 AND event_type ~ '^[a-z0-9_]+([.][a-z0-9_]+)+$'::text);
alter table toolkit_core.event_log add constraint event_log_payload_check CHECK (jsonb_typeof(payload) = 'object'::text);
alter table toolkit_core.event_log add constraint event_log_pkey PRIMARY KEY (id);
alter table toolkit_core.event_log add constraint event_log_source_check CHECK (source = ANY (ARRAY['user'::text, 'public'::text, 'system'::text, 'import'::text, 'provider'::text]));
alter table toolkit_core.event_registrations add constraint event_registrations_party_size_check CHECK (party_size >= 1 AND party_size <= 6);
alter table toolkit_core.event_registrations add constraint event_registrations_pkey PRIMARY KEY (id);
alter table toolkit_core.event_registrations add constraint event_registrations_status_check CHECK (status = ANY (ARRAY['registered'::text, 'waitlist'::text, 'cancelled'::text, 'rejected'::text]));
alter table toolkit_core.event_signups add constraint event_signups_blurb_check CHECK (blurb IS NULL OR char_length(blurb) <= 600);
alter table toolkit_core.event_signups add constraint event_signups_capacity_check CHECK (capacity IS NULL OR capacity >= 1 AND capacity <= 5000);
alter table toolkit_core.event_signups add constraint event_signups_pkey PRIMARY KEY (item_id);
alter table toolkit_core.group_attendance add constraint group_attendance_pkey PRIMARY KEY (meeting_id, person_id);
alter table toolkit_core.group_meetings add constraint group_meetings_leader_notes_check CHECK (leader_notes IS NULL OR char_length(leader_notes) <= 4000);
alter table toolkit_core.group_meetings add constraint group_meetings_pkey PRIMARY KEY (id);
alter table toolkit_core.group_meetings add constraint group_meetings_topic_check CHECK (topic IS NULL OR char_length(topic) <= 160);
alter table toolkit_core.group_members add constraint group_members_pkey PRIMARY KEY (group_id, person_id);
alter table toolkit_core.group_members add constraint group_members_role_check CHECK (role = ANY (ARRAY['leader'::text, 'co_leader'::text, 'member'::text]));
alter table toolkit_core.group_requests add constraint group_requests_pkey PRIMARY KEY (id);
alter table toolkit_core.group_requests add constraint group_requests_status_check CHECK (status = ANY (ARRAY['new'::text, 'added'::text, 'declined'::text, 'rejected'::text]));
alter table toolkit_core.groups add constraint groups_description_check CHECK (description IS NULL OR char_length(description) <= 500);
alter table toolkit_core.groups add constraint groups_kind_check CHECK (kind = ANY (ARRAY['bible_study'::text, 'small_group'::text, 'class'::text, 'prayer'::text]));
alter table toolkit_core.groups add constraint groups_location_check CHECK (location IS NULL OR char_length(location) <= 120);
alter table toolkit_core.groups add constraint groups_meets_check CHECK (meets IS NULL OR char_length(meets) <= 80);
alter table toolkit_core.groups add constraint groups_name_check CHECK (char_length(name) >= 1 AND char_length(name) <= 80);
alter table toolkit_core.groups add constraint groups_pkey PRIMARY KEY (id);
alter table toolkit_core.groups add constraint groups_status_check CHECK (status = ANY (ARRAY['active'::text, 'archived'::text]));
alter table toolkit_core.household_members add constraint household_members_person_id_key UNIQUE (person_id);
alter table toolkit_core.household_members add constraint household_members_pkey PRIMARY KEY (household_id, person_id);
alter table toolkit_core.household_members add constraint household_members_role_check CHECK (role = ANY (ARRAY['adult'::text, 'child'::text, 'other'::text]));
alter table toolkit_core.households add constraint households_name_check CHECK (char_length(name) >= 1 AND char_length(name) <= 120);
alter table toolkit_core.households add constraint households_pkey PRIMARY KEY (id);
alter table toolkit_core.inbound_messages add constraint inbound_messages_body_check CHECK (char_length(body) <= 480);
alter table toolkit_core.inbound_messages add constraint inbound_messages_channel_check CHECK (channel = ANY (ARRAY['sms'::text, 'email'::text]));
alter table toolkit_core.inbound_messages add constraint inbound_messages_pkey PRIMARY KEY (id);
alter table toolkit_core.integration_webhook_events add constraint integration_webhook_events_error_message_check CHECK (error_message IS NULL OR char_length(error_message) <= 1200);
alter table toolkit_core.integration_webhook_events add constraint integration_webhook_events_metadata_check CHECK (jsonb_typeof(metadata) = 'object'::text);
alter table toolkit_core.integration_webhook_events add constraint integration_webhook_events_pkey PRIMARY KEY (id);
alter table toolkit_core.integration_webhook_events add constraint integration_webhook_events_provider_type_check CHECK (provider_type = ANY (ARRAY['sms'::text, 'email'::text, 'calendar'::text, 'ai'::text]));
alter table toolkit_core.integration_webhook_events add constraint integration_webhook_events_provider_type_provider_name_exte_key UNIQUE (provider_type, provider_name, external_event_id);
alter table toolkit_core.integration_webhook_events add constraint integration_webhook_events_status_check CHECK (status = ANY (ARRAY['received'::text, 'processed'::text, 'ignored'::text, 'failed'::text]));
alter table toolkit_core.invitations add constraint invitations_email_check CHECK (char_length(email) <= 254 AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text);
alter table toolkit_core.invitations add constraint invitations_pkey PRIMARY KEY (id);
alter table toolkit_core.invitations add constraint invitations_role_check CHECK (role = ANY (ARRAY['pastor'::text, 'admin'::text, 'treasurer'::text, 'leader'::text, 'volunteer'::text]));
alter table toolkit_core.invitations add constraint invitations_token_hash_key UNIQUE (token_hash);
alter table toolkit_core.kids_checkins add constraint kids_checkins_failed_attempts_check CHECK (failed_attempts >= 0 AND failed_attempts <= 5);
alter table toolkit_core.kids_checkins add constraint kids_checkins_pkey PRIMARY KEY (id);
alter table toolkit_core.kids_clearances add constraint kids_clearances_note_admin_reference_check CHECK (note IS NULL OR char_length(note) <= 80 AND note !~ '[
	]'::text);
alter table toolkit_core.kids_clearances add constraint kids_clearances_note_check CHECK (note IS NULL OR char_length(note) <= 200);
alter table toolkit_core.kids_clearances add constraint kids_clearances_pkey PRIMARY KEY (person_id);
alter table toolkit_core.kids_duty add constraint kids_duty_pkey PRIMARY KEY (id);
alter table toolkit_core.kids_guardians add constraint kids_guardians_check CHECK (child_id <> guardian_id);
alter table toolkit_core.kids_guardians add constraint kids_guardians_pkey PRIMARY KEY (child_id, guardian_id);
alter table toolkit_core.kids_health add constraint kids_health_allergies_check CHECK (allergies IS NULL OR char_length(allergies) <= 500);
alter table toolkit_core.kids_health add constraint kids_health_medical_check CHECK (medical IS NULL OR char_length(medical) <= 1000);
alter table toolkit_core.kids_health add constraint kids_health_notes_check CHECK (notes IS NULL OR char_length(notes) <= 1000);
alter table toolkit_core.kids_health add constraint kids_health_pkey PRIMARY KEY (person_id);
alter table toolkit_core.kids_rooms add constraint kids_rooms_ages_check CHECK (ages IS NULL OR char_length(ages) <= 60);
alter table toolkit_core.kids_rooms add constraint kids_rooms_name_check CHECK (char_length(TRIM(BOTH FROM name)) >= 1 AND char_length(TRIM(BOTH FROM name)) <= 80);
alter table toolkit_core.kids_rooms add constraint kids_rooms_pkey PRIMARY KEY (id);
alter table toolkit_core.kids_rooms add constraint kids_rooms_ratio_check CHECK (ratio >= 1 AND ratio <= 30);
alter table toolkit_core.lessons add constraint lessons_leader_notes_check CHECK (leader_notes IS NULL OR char_length(leader_notes) <= 4000);
alter table toolkit_core.lessons add constraint lessons_passage_check CHECK (passage IS NULL OR char_length(passage) <= 120);
alter table toolkit_core.lessons add constraint lessons_pkey PRIMARY KEY (id);
alter table toolkit_core.lessons add constraint lessons_position_check CHECK ("position" >= 1);
alter table toolkit_core.lessons add constraint lessons_questions_check CHECK (questions IS NULL OR char_length(questions) <= 4000);
alter table toolkit_core.lessons add constraint lessons_summary_check CHECK (summary IS NULL OR char_length(summary) <= 2000);
alter table toolkit_core.lessons add constraint lessons_title_check CHECK (char_length(title) >= 1 AND char_length(title) <= 120);
alter table toolkit_core.member_profiles add constraint member_profiles_display_name_check CHECK (char_length(display_name) >= 1 AND char_length(display_name) <= 80);
alter table toolkit_core.member_profiles add constraint member_profiles_pkey PRIMARY KEY (user_id);
alter table toolkit_core.member_profiles add constraint member_profiles_username_check CHECK (username ~ '^[a-z0-9_]{3,30}$'::text);
alter table toolkit_core.mission_partners add constraint mission_partners_contact_name_check CHECK (contact_name IS NULL OR char_length(contact_name) <= 120);
alter table toolkit_core.mission_partners add constraint mission_partners_email_check CHECK (email IS NULL OR char_length(email) <= 254);
alter table toolkit_core.mission_partners add constraint mission_partners_kind_check CHECK (kind = ANY (ARRAY['missionary'::text, 'organization'::text, 'project'::text]));
alter table toolkit_core.mission_partners add constraint mission_partners_monthly_support_check CHECK (monthly_support IS NULL OR monthly_support >= 0::numeric);
alter table toolkit_core.mission_partners add constraint mission_partners_name_check CHECK (char_length(TRIM(BOTH FROM name)) >= 1 AND char_length(TRIM(BOTH FROM name)) <= 120);
alter table toolkit_core.mission_partners add constraint mission_partners_phone_check CHECK (phone IS NULL OR char_length(phone) <= 40);
alter table toolkit_core.mission_partners add constraint mission_partners_pkey PRIMARY KEY (id);
alter table toolkit_core.mission_partners add constraint mission_partners_region_check CHECK (region IS NULL OR char_length(region) <= 120);
alter table toolkit_core.mission_partners add constraint mission_partners_status_check CHECK (status = ANY (ARRAY['active'::text, 'archived'::text]));
alter table toolkit_core.mission_partners add constraint mission_partners_summary_check CHECK (summary IS NULL OR char_length(summary) <= 1500);
alter table toolkit_core.mission_updates add constraint mission_updates_body_check CHECK (body IS NULL OR char_length(body) <= 4000);
alter table toolkit_core.mission_updates add constraint mission_updates_pkey PRIMARY KEY (id);
alter table toolkit_core.mission_updates add constraint mission_updates_title_check CHECK (char_length(TRIM(BOTH FROM title)) >= 1 AND char_length(TRIM(BOTH FROM title)) <= 160);
alter table toolkit_core.operational_links add constraint operational_links_pkey PRIMARY KEY (id);
alter table toolkit_core.operational_links add constraint operational_links_source_check CHECK (source = ANY (ARRAY['derived'::text, 'explicit'::text]));
alter table toolkit_core.operational_links add constraint operational_links_workspace_id_from_type_from_id_relation_t_key UNIQUE (workspace_id, from_type, from_id, relation, to_type, to_id);
alter table toolkit_core.outbox add constraint outbox_body_check CHECK (char_length(body) >= 1 AND char_length(body) <= 480);
alter table toolkit_core.outbox add constraint outbox_channel_check CHECK (channel = ANY (ARRAY['sms'::text, 'email'::text]));
alter table toolkit_core.outbox add constraint outbox_pkey PRIMARY KEY (id);
alter table toolkit_core.outbox add constraint outbox_purpose_check CHECK (purpose = ANY (ARRAY['operational_messages'::text, 'newsletters'::text, 'guest_followup'::text, 'volunteer_contact'::text]));
alter table toolkit_core.outbox add constraint outbox_related_type_check CHECK (related_type IS NULL OR related_type = 'assignment'::text);
alter table toolkit_core.outbox add constraint outbox_status_check CHECK (status = ANY (ARRAY['pending_approval'::text, 'approved'::text, 'sent'::text, 'blocked'::text, 'cancelled'::text]));
alter table toolkit_core.outbox add constraint outbox_status_reason_check CHECK (status_reason IS NULL OR char_length(status_reason) <= 200);
alter table toolkit_core.people add constraint people_age_group_check CHECK (age_group = ANY (ARRAY['adult'::text, 'minor'::text, 'unknown'::text]));
alter table toolkit_core.people add constraint people_email_check CHECK (email IS NULL OR char_length(email) <= 254 AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text);
alter table toolkit_core.people add constraint people_first_name_check CHECK (char_length(first_name) >= 1 AND char_length(first_name) <= 80);
alter table toolkit_core.people add constraint people_language_check CHECK (language = ANY (ARRAY['en'::text, 'es'::text]));
alter table toolkit_core.people add constraint people_last_name_check CHECK (char_length(last_name) <= 80);
alter table toolkit_core.people add constraint people_phone_check CHECK (phone IS NULL OR char_length(phone) >= 7 AND char_length(phone) <= 24);
alter table toolkit_core.people add constraint people_pkey PRIMARY KEY (id);
alter table toolkit_core.people add constraint people_preferred_channel_check CHECK (preferred_channel = ANY (ARRAY['sms'::text, 'email'::text, 'phone'::text, 'print'::text]));
alter table toolkit_core.people add constraint people_status_check CHECK (status = ANY (ARRAY['guest'::text, 'regular'::text, 'member'::text, 'inactive'::text, 'archived'::text]));
alter table toolkit_core.proposal_execution_attempts add constraint proposal_execution_attempts_action_kind_check CHECK (char_length(action_kind) >= 2 AND char_length(action_kind) <= 80);
alter table toolkit_core.proposal_execution_attempts add constraint proposal_execution_attempts_error_message_check CHECK (error_message IS NULL OR char_length(error_message) <= 1200);
alter table toolkit_core.proposal_execution_attempts add constraint proposal_execution_attempts_pkey PRIMARY KEY (id);
alter table toolkit_core.proposal_execution_attempts add constraint proposal_execution_attempts_result_check CHECK (jsonb_typeof(result) = 'object'::text);
alter table toolkit_core.proposal_execution_attempts add constraint proposal_execution_attempts_status_check CHECK (status = ANY (ARRAY['running'::text, 'succeeded'::text, 'failed'::text]));
alter table toolkit_core.provider_connections add constraint provider_connections_config_check CHECK (jsonb_typeof(config) = 'object'::text);
alter table toolkit_core.provider_connections add constraint provider_connections_pkey PRIMARY KEY (id);
alter table toolkit_core.provider_connections add constraint provider_connections_provider_type_check CHECK (provider_type = ANY (ARRAY['ai'::text, 'sms'::text, 'email'::text, 'calendar'::text]));
alter table toolkit_core.provider_connections add constraint provider_connections_status_check CHECK (status = ANY (ARRAY['not_configured'::text, 'configured'::text, 'active'::text, 'error'::text, 'disabled'::text]));
alter table toolkit_core.provider_connections add constraint provider_connections_workspace_id_provider_type_provider_na_key UNIQUE (workspace_id, provider_type, provider_name);
alter table toolkit_core.recipe_settings add constraint recipe_settings_pkey PRIMARY KEY (workspace_id, recipe);
alter table toolkit_core.recipe_settings add constraint recipe_settings_recipe_check CHECK (recipe = ANY (ARRAY['renewals'::text, 'guest_checkin'::text, 'sunday_slides'::text]));
alter table toolkit_core.role_assignments add constraint role_assignments_pkey PRIMARY KEY (id);
alter table toolkit_core.role_assignments add constraint role_assignments_role_id_person_id_key UNIQUE (role_id, person_id);
alter table toolkit_core.role_assignments add constraint role_assignments_status_check CHECK (status = ANY (ARRAY['assigned'::text, 'confirmed'::text, 'declined'::text]));
alter table toolkit_core.run_sheet_items add constraint run_sheet_items_lead_check CHECK (lead IS NULL OR char_length(lead) <= 120);
alter table toolkit_core.run_sheet_items add constraint run_sheet_items_notes_check CHECK (notes IS NULL OR char_length(notes) <= 1000);
alter table toolkit_core.run_sheet_items add constraint run_sheet_items_pkey PRIMARY KEY (id);
alter table toolkit_core.run_sheet_items add constraint run_sheet_items_time_label_check CHECK (time_label IS NULL OR char_length(time_label) <= 20);
alter table toolkit_core.run_sheet_items add constraint run_sheet_items_title_check CHECK (char_length(title) >= 1 AND char_length(title) <= 160);
alter table toolkit_core.scheduled_jobs add constraint scheduled_jobs_attempts_check CHECK (attempts >= 0);
alter table toolkit_core.scheduled_jobs add constraint scheduled_jobs_error_message_check CHECK (error_message IS NULL OR char_length(error_message) <= 1200);
alter table toolkit_core.scheduled_jobs add constraint scheduled_jobs_idempotency_key_check CHECK (char_length(idempotency_key) >= 3 AND char_length(idempotency_key) <= 240);
alter table toolkit_core.scheduled_jobs add constraint scheduled_jobs_job_type_check CHECK (char_length(job_type) >= 2 AND char_length(job_type) <= 80 AND job_type ~ '^[a-z0-9_]+$'::text);
alter table toolkit_core.scheduled_jobs add constraint scheduled_jobs_max_attempts_check CHECK (max_attempts >= 1 AND max_attempts <= 20);
alter table toolkit_core.scheduled_jobs add constraint scheduled_jobs_payload_check CHECK (jsonb_typeof(payload) = 'object'::text);
alter table toolkit_core.scheduled_jobs add constraint scheduled_jobs_pkey PRIMARY KEY (id);
alter table toolkit_core.scheduled_jobs add constraint scheduled_jobs_status_check CHECK (status = ANY (ARRAY['queued'::text, 'claimed'::text, 'succeeded'::text, 'failed'::text, 'cancelled'::text]));
alter table toolkit_core.scheduled_jobs add constraint scheduled_jobs_workspace_id_idempotency_key_key UNIQUE (workspace_id, idempotency_key);
alter table toolkit_core.sermon_series add constraint sermon_series_check CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on);
alter table toolkit_core.sermon_series add constraint sermon_series_description_check CHECK (description IS NULL OR char_length(description) <= 1000);
alter table toolkit_core.sermon_series add constraint sermon_series_name_check CHECK (char_length(name) >= 1 AND char_length(name) <= 120);
alter table toolkit_core.sermon_series add constraint sermon_series_pkey PRIMARY KEY (id);
alter table toolkit_core.sermons add constraint sermons_media_url_check CHECK (media_url IS NULL OR char_length(media_url) <= 500 AND media_url ~* '^https?://'::text);
alter table toolkit_core.sermons add constraint sermons_notes_check CHECK (notes IS NULL OR char_length(notes) <= 30000);
alter table toolkit_core.sermons add constraint sermons_pkey PRIMARY KEY (id);
alter table toolkit_core.sermons add constraint sermons_scripture_check CHECK (scripture IS NULL OR char_length(scripture) <= 200);
alter table toolkit_core.sermons add constraint sermons_speaker_check CHECK (speaker IS NULL OR char_length(speaker) <= 120);
alter table toolkit_core.sermons add constraint sermons_status_check CHECK (status = ANY (ARRAY['planned'::text, 'ready'::text, 'preached'::text]));
alter table toolkit_core.sermons add constraint sermons_summary_check CHECK (summary IS NULL OR char_length(summary) <= 4000);
alter table toolkit_core.sermons add constraint sermons_title_check CHECK (char_length(title) >= 1 AND char_length(title) <= 200);
alter table toolkit_core.service_plans add constraint service_plans_attendance_check CHECK (attendance IS NULL OR attendance >= 0 AND attendance <= 100000);
alter table toolkit_core.service_plans add constraint service_plans_notes_check CHECK (notes IS NULL OR char_length(notes) <= 4000);
alter table toolkit_core.service_plans add constraint service_plans_pkey PRIMARY KEY (id);
alter table toolkit_core.service_plans add constraint service_plans_theme_check CHECK (theme IS NULL OR char_length(theme) <= 200);
alter table toolkit_core.service_plans add constraint service_plans_title_check CHECK (char_length(title) >= 1 AND char_length(title) <= 120);
alter table toolkit_core.service_roles add constraint service_roles_name_check CHECK (char_length(name) >= 1 AND char_length(name) <= 80);
alter table toolkit_core.service_roles add constraint service_roles_needed_check CHECK (needed >= 1 AND needed <= 50);
alter table toolkit_core.service_roles add constraint service_roles_pkey PRIMARY KEY (id);
alter table toolkit_core.studies add constraint studies_description_check CHECK (description IS NULL OR char_length(description) <= 600);
alter table toolkit_core.studies add constraint studies_pkey PRIMARY KEY (id);
alter table toolkit_core.studies add constraint studies_title_check CHECK (char_length(title) >= 1 AND char_length(title) <= 120);
alter table toolkit_core.tasks add constraint tasks_notes_check CHECK (notes IS NULL OR char_length(notes) <= 2000);
alter table toolkit_core.tasks add constraint tasks_pkey PRIMARY KEY (id);
alter table toolkit_core.tasks add constraint tasks_source_check CHECK (source = ANY (ARRAY['manual'::text, 'recipe'::text, 'system'::text]));
alter table toolkit_core.tasks add constraint tasks_status_check CHECK (status = ANY (ARRAY['open'::text, 'done'::text]));
alter table toolkit_core.tasks add constraint tasks_title_check CHECK (char_length(title) >= 1 AND char_length(title) <= 200);
alter table toolkit_core.volunteer_role_profiles add constraint volunteer_role_profiles_pkey PRIMARY KEY (workspace_id, person_id, role_key);
alter table toolkit_core.volunteer_role_profiles add constraint volunteer_role_profiles_role_key_check CHECK (char_length(role_key) >= 2 AND char_length(role_key) <= 80 AND role_key = lower(TRIM(BOTH FROM role_key)));
alter table toolkit_core.workflow_templates add constraint workflow_templates_default_autonomy_check CHECK (default_autonomy = ANY (ARRAY['observe'::text, 'prepare'::text, 'act'::text]));
alter table toolkit_core.workflow_templates add constraint workflow_templates_pkey PRIMARY KEY (template_key);
alter table toolkit_core.workspace_features add constraint workspace_features_pkey PRIMARY KEY (workspace_id, module);
alter table toolkit_core.workspace_members add constraint workspace_members_pkey PRIMARY KEY (workspace_id, user_id);
alter table toolkit_core.workspace_members add constraint workspace_members_role_check CHECK (role = ANY (ARRAY['owner'::text, 'pastor'::text, 'admin'::text, 'treasurer'::text, 'leader'::text, 'volunteer'::text]));
alter table toolkit_core.workspace_members add constraint workspace_members_status_check CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text]));
alter table toolkit_core.workspaces add constraint workspaces_name_check CHECK (char_length(name) >= 2 AND char_length(name) <= 120);
alter table toolkit_core.workspaces add constraint workspaces_pkey PRIMARY KEY (id);

alter table toolkit_core.action_proposals add constraint action_proposals_run_id_fkey FOREIGN KEY (run_id) REFERENCES toolkit_core.automation_runs(id) ON DELETE CASCADE;
alter table toolkit_core.action_proposals add constraint action_proposals_step_id_fkey FOREIGN KEY (step_id) REFERENCES toolkit_core.automation_steps(id) ON DELETE SET NULL;
alter table toolkit_core.action_proposals add constraint action_proposals_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.ai_generations add constraint ai_generations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.announcements add constraint announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table toolkit_core.announcements add constraint announcements_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.audit_events add constraint audit_events_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE SET NULL;
alter table toolkit_core.automation_observations add constraint automation_observations_event_id_fkey FOREIGN KEY (event_id) REFERENCES toolkit_core.event_log(id) ON DELETE CASCADE;
alter table toolkit_core.automation_observations add constraint automation_observations_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES toolkit_core.automation_rules(id) ON DELETE CASCADE;
alter table toolkit_core.automation_observations add constraint automation_observations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.automation_permissions add constraint automation_permissions_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.automation_policies add constraint automation_policies_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.automation_rules add constraint automation_rules_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.automation_runs add constraint automation_runs_event_id_fkey FOREIGN KEY (event_id) REFERENCES toolkit_core.event_log(id) ON DELETE SET NULL;
alter table toolkit_core.automation_runs add constraint automation_runs_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES toolkit_core.automation_rules(id) ON DELETE SET NULL;
alter table toolkit_core.automation_runs add constraint automation_runs_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.automation_signal_state add constraint automation_signal_state_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.automation_steps add constraint automation_steps_run_id_fkey FOREIGN KEY (run_id) REFERENCES toolkit_core.automation_runs(id) ON DELETE CASCADE;
alter table toolkit_core.automation_steps add constraint automation_steps_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.availability_blackouts add constraint availability_blackouts_person_id_fkey FOREIGN KEY (person_id) REFERENCES toolkit_core.people(id) ON DELETE CASCADE;
alter table toolkit_core.brand_kits add constraint brand_kits_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);
alter table toolkit_core.brand_kits add constraint brand_kits_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.calendar_items add constraint calendar_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table toolkit_core.calendar_items add constraint calendar_items_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.care_notes add constraint care_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table toolkit_core.care_notes add constraint care_notes_person_id_fkey FOREIGN KEY (person_id) REFERENCES toolkit_core.people(id) ON DELETE SET NULL;
alter table toolkit_core.care_notes add constraint care_notes_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.channel_members add constraint channel_members_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES toolkit_core.channels(id) ON DELETE CASCADE;
alter table toolkit_core.channel_members add constraint channel_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table toolkit_core.channel_reads add constraint channel_reads_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES toolkit_core.channels(id) ON DELETE CASCADE;
alter table toolkit_core.channel_reads add constraint channel_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table toolkit_core.channels add constraint channels_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table toolkit_core.channels add constraint channels_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.chat_messages add constraint chat_messages_author_user_fkey FOREIGN KEY (author_user) REFERENCES auth.users(id);
alter table toolkit_core.chat_messages add constraint chat_messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES toolkit_core.channels(id) ON DELETE CASCADE;
alter table toolkit_core.chat_messages add constraint chat_messages_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES toolkit_core.chat_messages(id) ON DELETE CASCADE;
alter table toolkit_core.chat_messages add constraint chat_messages_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.chat_reactions add constraint chat_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES toolkit_core.chat_messages(id) ON DELETE CASCADE;
alter table toolkit_core.chat_reactions add constraint chat_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table toolkit_core.chat_saved add constraint chat_saved_message_id_fkey FOREIGN KEY (message_id) REFERENCES toolkit_core.chat_messages(id) ON DELETE CASCADE;
alter table toolkit_core.chat_saved add constraint chat_saved_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table toolkit_core.church_memory_facts add constraint church_memory_facts_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.church_rhythms add constraint church_rhythms_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.church_voice_profiles add constraint church_voice_profiles_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.connect_pages add constraint connect_pages_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.connect_submissions add constraint connect_submissions_person_id_fkey FOREIGN KEY (person_id) REFERENCES toolkit_core.people(id) ON DELETE SET NULL;
alter table toolkit_core.connect_submissions add constraint connect_submissions_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.consents add constraint consents_person_id_fkey FOREIGN KEY (person_id) REFERENCES toolkit_core.people(id) ON DELETE CASCADE;
alter table toolkit_core.consents add constraint consents_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES auth.users(id);
alter table toolkit_core.consents add constraint consents_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.documents add constraint documents_calendar_item_id_fkey FOREIGN KEY (calendar_item_id) REFERENCES toolkit_core.calendar_items(id) ON DELETE SET NULL;
alter table toolkit_core.documents add constraint documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);
alter table toolkit_core.documents add constraint documents_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.event_log add constraint event_log_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.event_registrations add constraint event_registrations_item_id_fkey FOREIGN KEY (item_id) REFERENCES toolkit_core.calendar_items(id) ON DELETE CASCADE;
alter table toolkit_core.event_registrations add constraint event_registrations_person_id_fkey FOREIGN KEY (person_id) REFERENCES toolkit_core.people(id) ON DELETE SET NULL;
alter table toolkit_core.event_registrations add constraint event_registrations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.event_signups add constraint event_signups_item_id_fkey FOREIGN KEY (item_id) REFERENCES toolkit_core.calendar_items(id) ON DELETE CASCADE;
alter table toolkit_core.event_signups add constraint event_signups_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.group_attendance add constraint group_attendance_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES toolkit_core.group_meetings(id) ON DELETE CASCADE;
alter table toolkit_core.group_attendance add constraint group_attendance_person_id_fkey FOREIGN KEY (person_id) REFERENCES toolkit_core.people(id) ON DELETE CASCADE;
alter table toolkit_core.group_attendance add constraint group_attendance_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.group_meetings add constraint group_meetings_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table toolkit_core.group_meetings add constraint group_meetings_group_id_fkey FOREIGN KEY (group_id) REFERENCES toolkit_core.groups(id) ON DELETE CASCADE;
alter table toolkit_core.group_meetings add constraint group_meetings_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES toolkit_core.lessons(id) ON DELETE SET NULL;
alter table toolkit_core.group_meetings add constraint group_meetings_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.group_members add constraint group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES toolkit_core.groups(id) ON DELETE CASCADE;
alter table toolkit_core.group_members add constraint group_members_person_id_fkey FOREIGN KEY (person_id) REFERENCES toolkit_core.people(id) ON DELETE CASCADE;
alter table toolkit_core.group_members add constraint group_members_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.group_requests add constraint group_requests_group_id_fkey FOREIGN KEY (group_id) REFERENCES toolkit_core.groups(id) ON DELETE CASCADE;
alter table toolkit_core.group_requests add constraint group_requests_person_id_fkey FOREIGN KEY (person_id) REFERENCES toolkit_core.people(id) ON DELETE SET NULL;
alter table toolkit_core.group_requests add constraint group_requests_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id);
alter table toolkit_core.group_requests add constraint group_requests_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.groups add constraint groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table toolkit_core.groups add constraint groups_study_id_fkey FOREIGN KEY (study_id) REFERENCES toolkit_core.studies(id) ON DELETE SET NULL;
alter table toolkit_core.groups add constraint groups_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.household_members add constraint household_members_household_id_fkey FOREIGN KEY (household_id) REFERENCES toolkit_core.households(id) ON DELETE CASCADE;
alter table toolkit_core.household_members add constraint household_members_person_id_fkey FOREIGN KEY (person_id) REFERENCES toolkit_core.people(id) ON DELETE CASCADE;
alter table toolkit_core.household_members add constraint household_members_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.households add constraint households_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table toolkit_core.households add constraint households_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.inbound_messages add constraint inbound_messages_person_id_fkey FOREIGN KEY (person_id) REFERENCES toolkit_core.people(id) ON DELETE CASCADE;
alter table toolkit_core.inbound_messages add constraint inbound_messages_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.integration_webhook_events add constraint integration_webhook_events_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.invitations add constraint invitations_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES auth.users(id);
alter table toolkit_core.invitations add constraint invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id);
alter table toolkit_core.invitations add constraint invitations_person_id_fkey FOREIGN KEY (person_id) REFERENCES toolkit_core.people(id) ON DELETE SET NULL;
alter table toolkit_core.invitations add constraint invitations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.kids_checkins add constraint kids_checkins_checked_in_by_fkey FOREIGN KEY (checked_in_by) REFERENCES auth.users(id);
alter table toolkit_core.kids_checkins add constraint kids_checkins_checked_out_by_fkey FOREIGN KEY (checked_out_by) REFERENCES auth.users(id);
alter table toolkit_core.kids_checkins add constraint kids_checkins_child_id_fkey FOREIGN KEY (child_id) REFERENCES toolkit_core.people(id) ON DELETE CASCADE;
alter table toolkit_core.kids_checkins add constraint kids_checkins_picked_up_by_fkey FOREIGN KEY (picked_up_by) REFERENCES toolkit_core.people(id) ON DELETE SET NULL;
alter table toolkit_core.kids_checkins add constraint kids_checkins_room_id_fkey FOREIGN KEY (room_id) REFERENCES toolkit_core.kids_rooms(id) ON DELETE CASCADE;
alter table toolkit_core.kids_checkins add constraint kids_checkins_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.kids_clearances add constraint kids_clearances_person_id_fkey FOREIGN KEY (person_id) REFERENCES toolkit_core.people(id) ON DELETE CASCADE;
alter table toolkit_core.kids_clearances add constraint kids_clearances_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);
alter table toolkit_core.kids_clearances add constraint kids_clearances_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.kids_duty add constraint kids_duty_person_id_fkey FOREIGN KEY (person_id) REFERENCES toolkit_core.people(id) ON DELETE CASCADE;
alter table toolkit_core.kids_duty add constraint kids_duty_room_id_fkey FOREIGN KEY (room_id) REFERENCES toolkit_core.kids_rooms(id) ON DELETE CASCADE;
alter table toolkit_core.kids_duty add constraint kids_duty_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.kids_guardians add constraint kids_guardians_child_id_fkey FOREIGN KEY (child_id) REFERENCES toolkit_core.people(id) ON DELETE CASCADE;
alter table toolkit_core.kids_guardians add constraint kids_guardians_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES toolkit_core.people(id) ON DELETE CASCADE;
alter table toolkit_core.kids_guardians add constraint kids_guardians_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.kids_health add constraint kids_health_person_id_fkey FOREIGN KEY (person_id) REFERENCES toolkit_core.people(id) ON DELETE CASCADE;
alter table toolkit_core.kids_health add constraint kids_health_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.kids_rooms add constraint kids_rooms_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.lessons add constraint lessons_study_id_fkey FOREIGN KEY (study_id) REFERENCES toolkit_core.studies(id) ON DELETE CASCADE;
alter table toolkit_core.lessons add constraint lessons_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.member_profiles add constraint member_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table toolkit_core.mission_partners add constraint mission_partners_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.mission_updates add constraint mission_updates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table toolkit_core.mission_updates add constraint mission_updates_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES toolkit_core.mission_partners(id) ON DELETE CASCADE;
alter table toolkit_core.mission_updates add constraint mission_updates_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.operational_links add constraint operational_links_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.outbox add constraint outbox_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
alter table toolkit_core.outbox add constraint outbox_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table toolkit_core.outbox add constraint outbox_person_id_fkey FOREIGN KEY (person_id) REFERENCES toolkit_core.people(id) ON DELETE CASCADE;
alter table toolkit_core.outbox add constraint outbox_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.people add constraint people_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table toolkit_core.people add constraint people_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table toolkit_core.people add constraint people_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.proposal_execution_attempts add constraint proposal_execution_attempts_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES toolkit_core.action_proposals(id) ON DELETE CASCADE;
alter table toolkit_core.proposal_execution_attempts add constraint proposal_execution_attempts_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.provider_connections add constraint provider_connections_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.recipe_settings add constraint recipe_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);
alter table toolkit_core.recipe_settings add constraint recipe_settings_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.role_assignments add constraint role_assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table toolkit_core.role_assignments add constraint role_assignments_person_id_fkey FOREIGN KEY (person_id) REFERENCES toolkit_core.people(id) ON DELETE CASCADE;
alter table toolkit_core.role_assignments add constraint role_assignments_role_id_fkey FOREIGN KEY (role_id) REFERENCES toolkit_core.service_roles(id) ON DELETE CASCADE;
alter table toolkit_core.run_sheet_items add constraint run_sheet_items_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES toolkit_core.service_plans(id) ON DELETE CASCADE;
alter table toolkit_core.scheduled_jobs add constraint scheduled_jobs_run_id_fkey FOREIGN KEY (run_id) REFERENCES toolkit_core.automation_runs(id) ON DELETE CASCADE;
alter table toolkit_core.scheduled_jobs add constraint scheduled_jobs_step_id_fkey FOREIGN KEY (step_id) REFERENCES toolkit_core.automation_steps(id) ON DELETE SET NULL;
alter table toolkit_core.scheduled_jobs add constraint scheduled_jobs_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.sermon_series add constraint sermon_series_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table toolkit_core.sermon_series add constraint sermon_series_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.sermons add constraint sermons_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table toolkit_core.sermons add constraint sermons_series_id_fkey FOREIGN KEY (series_id) REFERENCES toolkit_core.sermon_series(id) ON DELETE SET NULL;
alter table toolkit_core.sermons add constraint sermons_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.service_plans add constraint service_plans_calendar_item_id_fkey FOREIGN KEY (calendar_item_id) REFERENCES toolkit_core.calendar_items(id) ON DELETE SET NULL;
alter table toolkit_core.service_plans add constraint service_plans_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table toolkit_core.service_plans add constraint service_plans_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.service_roles add constraint service_roles_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES toolkit_core.service_plans(id) ON DELETE CASCADE;
alter table toolkit_core.studies add constraint studies_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table toolkit_core.studies add constraint studies_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.tasks add constraint tasks_assignee_user_fkey FOREIGN KEY (assignee_user) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table toolkit_core.tasks add constraint tasks_calendar_item_id_fkey FOREIGN KEY (calendar_item_id) REFERENCES toolkit_core.calendar_items(id) ON DELETE SET NULL;
alter table toolkit_core.tasks add constraint tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table toolkit_core.tasks add constraint tasks_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.volunteer_role_profiles add constraint volunteer_role_profiles_person_id_fkey FOREIGN KEY (person_id) REFERENCES toolkit_core.people(id) ON DELETE CASCADE;
alter table toolkit_core.volunteer_role_profiles add constraint volunteer_role_profiles_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.workspace_features add constraint workspace_features_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.workspace_members add constraint workspace_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table toolkit_core.workspace_members add constraint workspace_members_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES toolkit_core.workspaces(id) ON DELETE CASCADE;
alter table toolkit_core.workspaces add constraint workspaces_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

CREATE INDEX action_proposals_pending_idx ON toolkit_core.action_proposals USING btree (workspace_id, status, created_at DESC) WHERE (status = 'pending'::text);
CREATE INDEX action_proposals_run_id_idx ON toolkit_core.action_proposals USING btree (run_id);
CREATE INDEX action_proposals_step_id_idx ON toolkit_core.action_proposals USING btree (step_id);
CREATE INDEX ai_generations_status_idx ON toolkit_core.ai_generations USING btree (workspace_id, status, created_at);
CREATE INDEX announcements_ws_idx ON toolkit_core.announcements USING btree (workspace_id, show_from);
CREATE INDEX audit_events_ws_idx ON toolkit_core.audit_events USING btree (workspace_id, id DESC);
CREATE INDEX automation_observations_event_id_idx ON toolkit_core.automation_observations USING btree (event_id);
CREATE INDEX automation_observations_rule_id_idx ON toolkit_core.automation_observations USING btree (rule_id);
CREATE INDEX automation_observations_ws_idx ON toolkit_core.automation_observations USING btree (workspace_id, created_at DESC);
CREATE INDEX automation_rules_trigger_idx ON toolkit_core.automation_rules USING btree (workspace_id, trigger_event, enabled, priority);
CREATE INDEX automation_runs_event_id_idx ON toolkit_core.automation_runs USING btree (event_id);
CREATE INDEX automation_runs_event_idx ON toolkit_core.automation_runs USING btree (workspace_id, event_id, created_at DESC);
CREATE INDEX automation_runs_rule_id_idx ON toolkit_core.automation_runs USING btree (rule_id);
CREATE INDEX automation_runs_status_idx ON toolkit_core.automation_runs USING btree (workspace_id, status, created_at DESC);
CREATE INDEX automation_signal_active_idx ON toolkit_core.automation_signal_state USING btree (workspace_id, signal_type, active, updated_at DESC);
CREATE INDEX automation_steps_run_idx ON toolkit_core.automation_steps USING btree (run_id, "position");
CREATE INDEX calendar_items_ws_idx ON toolkit_core.calendar_items USING btree (workspace_id, starts_at);
CREATE INDEX care_notes_person_idx ON toolkit_core.care_notes USING btree (person_id);
CREATE INDEX care_notes_ws_idx ON toolkit_core.care_notes USING btree (workspace_id, status);
CREATE INDEX channel_members_user_idx ON toolkit_core.channel_members USING btree (user_id);
CREATE INDEX channel_reads_user_idx ON toolkit_core.channel_reads USING btree (user_id);
CREATE INDEX chat_messages_author_idx ON toolkit_core.chat_messages USING btree (author_user);
CREATE INDEX chat_messages_channel_idx ON toolkit_core.chat_messages USING btree (channel_id, created_at);
CREATE INDEX chat_messages_parent_idx ON toolkit_core.chat_messages USING btree (parent_id);
CREATE INDEX chat_messages_ws_idx ON toolkit_core.chat_messages USING btree (workspace_id);
CREATE INDEX chat_reactions_user_idx ON toolkit_core.chat_reactions USING btree (user_id);
CREATE INDEX chat_saved_user_idx ON toolkit_core.chat_saved USING btree (user_id);
CREATE INDEX memory_category_idx ON toolkit_core.church_memory_facts USING btree (workspace_id, active, sensitivity, category);
CREATE INDEX church_rhythms_active_idx ON toolkit_core.church_rhythms USING btree (workspace_id, active, kind);
CREATE INDEX connect_submissions_ip_idx ON toolkit_core.connect_submissions USING btree (ip_hash, created_at DESC);
CREATE INDEX connect_submissions_ws_idx ON toolkit_core.connect_submissions USING btree (workspace_id, created_at DESC);
CREATE INDEX consents_person_idx ON toolkit_core.consents USING btree (person_id, purpose, channel, id DESC);
CREATE INDEX consents_ws_idx ON toolkit_core.consents USING btree (workspace_id);
CREATE INDEX documents_calendar_idx ON toolkit_core.documents USING btree (calendar_item_id);
CREATE INDEX documents_expiry_idx ON toolkit_core.documents USING btree (workspace_id, expires_on) WHERE (expires_on IS NOT NULL);
CREATE INDEX documents_ws_idx ON toolkit_core.documents USING btree (workspace_id, folder, created_at DESC);
CREATE INDEX event_log_entity_idx ON toolkit_core.event_log USING btree (workspace_id, entity_type, entity_id, occurred_at DESC) WHERE (entity_id IS NOT NULL);
CREATE INDEX event_log_processor_idx ON toolkit_core.event_log USING btree (id, workspace_id, event_type);
CREATE INDEX event_log_workspace_id_id_idx ON toolkit_core.event_log USING btree (workspace_id, id DESC);
CREATE INDEX event_log_workspace_type_time_idx ON toolkit_core.event_log USING btree (workspace_id, event_type, occurred_at DESC);
CREATE INDEX event_reg_ip_idx ON toolkit_core.event_registrations USING btree (ip_hash, created_at);
CREATE INDEX event_reg_item_idx ON toolkit_core.event_registrations USING btree (item_id, status, created_at);
CREATE INDEX group_meetings_group_idx ON toolkit_core.group_meetings USING btree (group_id, held_on DESC);
CREATE INDEX group_members_person_idx ON toolkit_core.group_members USING btree (person_id);
CREATE INDEX group_requests_ip_idx ON toolkit_core.group_requests USING btree (ip_hash, created_at);
CREATE INDEX group_requests_ws_idx ON toolkit_core.group_requests USING btree (workspace_id, status);
CREATE INDEX groups_ws_idx ON toolkit_core.groups USING btree (workspace_id);
CREATE INDEX household_members_ws_idx ON toolkit_core.household_members USING btree (workspace_id);
CREATE INDEX households_ws_idx ON toolkit_core.households USING btree (workspace_id);
CREATE INDEX inbound_messages_person_idx ON toolkit_core.inbound_messages USING btree (person_id);
CREATE INDEX inbound_ws_idx ON toolkit_core.inbound_messages USING btree (workspace_id, created_at DESC);
CREATE INDEX integration_webhook_events_workspace_id_idx ON toolkit_core.integration_webhook_events USING btree (workspace_id);
CREATE INDEX integration_webhook_status_idx ON toolkit_core.integration_webhook_events USING btree (status, received_at);
CREATE INDEX invitations_ws_idx ON toolkit_core.invitations USING btree (workspace_id, created_at DESC);
CREATE INDEX kids_checkins_open_idx ON toolkit_core.kids_checkins USING btree (workspace_id, room_id) WHERE (checked_out_at IS NULL);
CREATE INDEX kids_clearances_workspace_person_idx ON toolkit_core.kids_clearances USING btree (workspace_id, person_id, cleared_until);
CREATE INDEX kids_duty_open_idx ON toolkit_core.kids_duty USING btree (workspace_id, room_id) WHERE (off_at IS NULL);
CREATE INDEX lessons_study_idx ON toolkit_core.lessons USING btree (study_id, "position");
CREATE UNIQUE INDEX member_profiles_username_uq ON toolkit_core.member_profiles USING btree (username);
CREATE INDEX mission_partners_ws_idx ON toolkit_core.mission_partners USING btree (workspace_id, status);
CREATE INDEX mission_updates_partner_idx ON toolkit_core.mission_updates USING btree (partner_id, posted_on DESC);
CREATE INDEX operational_links_from_idx ON toolkit_core.operational_links USING btree (workspace_id, from_type, from_id);
CREATE INDEX operational_links_to_idx ON toolkit_core.operational_links USING btree (workspace_id, to_type, to_id);
CREATE INDEX outbox_person_idx ON toolkit_core.outbox USING btree (person_id, created_at DESC);
CREATE INDEX outbox_ws_idx ON toolkit_core.outbox USING btree (workspace_id, status, created_at DESC);
CREATE INDEX people_ws_idx ON toolkit_core.people USING btree (workspace_id, last_name, first_name);
CREATE UNIQUE INDEX people_ws_user_uq ON toolkit_core.people USING btree (workspace_id, user_id) WHERE (user_id IS NOT NULL);
CREATE INDEX proposal_execution_attempts_workspace_id_idx ON toolkit_core.proposal_execution_attempts USING btree (workspace_id);
CREATE INDEX proposal_execution_proposal_idx ON toolkit_core.proposal_execution_attempts USING btree (proposal_id, started_at DESC);
CREATE INDEX role_assignments_history_idx ON toolkit_core.role_assignments USING btree (person_id, status, created_at);
CREATE INDEX role_assignments_person_idx ON toolkit_core.role_assignments USING btree (person_id);
CREATE INDEX run_sheet_plan_idx ON toolkit_core.run_sheet_items USING btree (plan_id, "position");
CREATE INDEX scheduled_jobs_due_idx ON toolkit_core.scheduled_jobs USING btree (run_at, id) WHERE (status = 'queued'::text);
CREATE INDEX scheduled_jobs_run_id_idx ON toolkit_core.scheduled_jobs USING btree (run_id);
CREATE INDEX scheduled_jobs_step_id_idx ON toolkit_core.scheduled_jobs USING btree (step_id);
CREATE INDEX scheduled_jobs_workspace_status_idx ON toolkit_core.scheduled_jobs USING btree (workspace_id, status, run_at);
CREATE INDEX sermon_series_ws_idx ON toolkit_core.sermon_series USING btree (workspace_id, starts_on DESC);
CREATE INDEX sermons_series_idx ON toolkit_core.sermons USING btree (series_id);
CREATE INDEX sermons_ws_idx ON toolkit_core.sermons USING btree (workspace_id, preached_on DESC);
CREATE INDEX service_plans_calendar_idx ON toolkit_core.service_plans USING btree (calendar_item_id);
CREATE INDEX service_plans_ws_idx ON toolkit_core.service_plans USING btree (workspace_id, starts_at);
CREATE INDEX service_roles_plan_idx ON toolkit_core.service_roles USING btree (plan_id, "position");
CREATE INDEX tasks_assignee_idx ON toolkit_core.tasks USING btree (assignee_user);
CREATE INDEX tasks_calendar_idx ON toolkit_core.tasks USING btree (calendar_item_id);
CREATE INDEX tasks_ws_idx ON toolkit_core.tasks USING btree (workspace_id, status, due_date);
CREATE INDEX volunteer_role_profiles_person_idx ON toolkit_core.volunteer_role_profiles USING btree (person_id, role_key, eligible);
CREATE INDEX workspace_members_user_idx ON toolkit_core.workspace_members USING btree (user_id);

alter table toolkit_core.action_proposals enable row level security;
alter table toolkit_core.ai_generations enable row level security;
alter table toolkit_core.announcements enable row level security;
alter table toolkit_core.audit_events enable row level security;
alter table toolkit_core.automation_observations enable row level security;
alter table toolkit_core.automation_permissions enable row level security;
alter table toolkit_core.automation_policies enable row level security;
alter table toolkit_core.automation_processor_state enable row level security;
alter table toolkit_core.automation_rules enable row level security;
alter table toolkit_core.automation_runs enable row level security;
alter table toolkit_core.automation_signal_state enable row level security;
alter table toolkit_core.automation_steps enable row level security;
alter table toolkit_core.availability_blackouts enable row level security;
alter table toolkit_core.brand_kits enable row level security;
alter table toolkit_core.calendar_items enable row level security;
alter table toolkit_core.care_notes enable row level security;
alter table toolkit_core.channel_members enable row level security;
alter table toolkit_core.channel_reads enable row level security;
alter table toolkit_core.channels enable row level security;
alter table toolkit_core.chat_messages enable row level security;
alter table toolkit_core.chat_reactions enable row level security;
alter table toolkit_core.chat_saved enable row level security;
alter table toolkit_core.church_memory_facts enable row level security;
alter table toolkit_core.church_rhythms enable row level security;
alter table toolkit_core.church_voice_profiles enable row level security;
alter table toolkit_core.connect_pages enable row level security;
alter table toolkit_core.connect_submissions enable row level security;
alter table toolkit_core.consents enable row level security;
alter table toolkit_core.documents enable row level security;
alter table toolkit_core.event_log enable row level security;
alter table toolkit_core.event_registrations enable row level security;
alter table toolkit_core.event_signups enable row level security;
alter table toolkit_core.group_attendance enable row level security;
alter table toolkit_core.group_meetings enable row level security;
alter table toolkit_core.group_members enable row level security;
alter table toolkit_core.group_requests enable row level security;
alter table toolkit_core.groups enable row level security;
alter table toolkit_core.household_members enable row level security;
alter table toolkit_core.households enable row level security;
alter table toolkit_core.inbound_messages enable row level security;
alter table toolkit_core.integration_webhook_events enable row level security;
alter table toolkit_core.invitations enable row level security;
alter table toolkit_core.kids_checkins enable row level security;
alter table toolkit_core.kids_clearances enable row level security;
alter table toolkit_core.kids_duty enable row level security;
alter table toolkit_core.kids_guardians enable row level security;
alter table toolkit_core.kids_health enable row level security;
alter table toolkit_core.kids_rooms enable row level security;
alter table toolkit_core.lessons enable row level security;
alter table toolkit_core.member_profiles enable row level security;
alter table toolkit_core.mission_partners enable row level security;
alter table toolkit_core.mission_updates enable row level security;
alter table toolkit_core.operational_links enable row level security;
alter table toolkit_core.outbox enable row level security;
alter table toolkit_core.people enable row level security;
alter table toolkit_core.proposal_execution_attempts enable row level security;
alter table toolkit_core.provider_connections enable row level security;
alter table toolkit_core.recipe_settings enable row level security;
alter table toolkit_core.role_assignments enable row level security;
alter table toolkit_core.run_sheet_items enable row level security;
alter table toolkit_core.scheduled_jobs enable row level security;
alter table toolkit_core.sermon_series enable row level security;
alter table toolkit_core.sermons enable row level security;
alter table toolkit_core.service_plans enable row level security;
alter table toolkit_core.service_roles enable row level security;
alter table toolkit_core.studies enable row level security;
alter table toolkit_core.tasks enable row level security;
alter table toolkit_core.volunteer_role_profiles enable row level security;
alter table toolkit_core.workflow_templates enable row level security;
alter table toolkit_core.workspace_features enable row level security;
alter table toolkit_core.workspace_members enable row level security;
alter table toolkit_core.workspaces enable row level security;

revoke all on all tables in schema toolkit_core from public, anon, authenticated;
revoke all on all sequences in schema toolkit_core from public, anon, authenticated;

CREATE OR REPLACE FUNCTION toolkit_core.audit_no_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin raise exception 'audit_events is append-only'; end $function$
;

CREATE OR REPLACE FUNCTION toolkit_core.is_member(p_ws uuid, p_roles text[] DEFAULT NULL::text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from toolkit_core.workspace_members m
    where m.workspace_id = p_ws and m.user_id = auth.uid() and m.status = 'active'
      and (p_roles is null or m.role = any (p_roles)));
$function$
;

CREATE OR REPLACE FUNCTION public.tk_username_available(p_username text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select auth.uid() is not null
     and lower(p_username) ~ '^[a-z0-9_]{3,30}$'
     and not exists (select 1 from toolkit_core.member_profiles where username = lower(p_username));
$function$
;

CREATE OR REPLACE FUNCTION public.tk_create_workspace(p_name text, p_username text, p_display_name text, p_timezone text DEFAULT 'America/Chicago'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid := auth.uid(); v_ws uuid; v_user text := lower(p_username);
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if exists (select 1 from toolkit_core.workspace_members where user_id = v_uid) then
    raise exception 'account already belongs to a workspace' using errcode = '23505';
  end if;
  insert into toolkit_core.member_profiles (user_id, username, display_name)
    values (v_uid, v_user, trim(p_display_name))
    on conflict (user_id) do update set username = excluded.username, display_name = excluded.display_name;
  insert into toolkit_core.workspaces (name, timezone, created_by) values (trim(p_name), p_timezone, v_uid) returning id into v_ws;
  insert into toolkit_core.workspace_members (workspace_id, user_id, role) values (v_ws, v_uid, 'owner');
  insert into toolkit_core.workspace_features (workspace_id, module, enabled)
    select v_ws, x.module, x.enabled from (values
      ('week',true),('people',true),('services',true),('volunteers',true),('guests',true),('vault',true),('messages',true),('sermons',true),
      ('care',false),('groups',false),('kids',false),('marketing',false),('comms',false),('online',false),
      ('library',false),('events',false),('facilities',false),('money',false),('missions',false),('community',false),('insights',false)
    ) as x(module, enabled);
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id)
    values (v_ws, v_uid, 'workspace.created', 'workspace', v_ws::text);
  return v_ws;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_my_workspaces()
 RETURNS TABLE(workspace_id uuid, name text, timezone text, role text, username text, display_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select w.id, w.name, w.timezone, m.role, p.username, p.display_name
  from toolkit_core.workspace_members m
  join toolkit_core.workspaces w on w.id = m.workspace_id
  left join toolkit_core.member_profiles p on p.user_id = m.user_id
  where m.user_id = auth.uid() and m.status = 'active';
$function$
;

CREATE OR REPLACE FUNCTION public.tk_workspace_features(p_workspace uuid)
 RETURNS TABLE(module text, enabled boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select f.module, f.enabled from toolkit_core.workspace_features f
  where f.workspace_id = p_workspace and toolkit_core.is_member(p_workspace);
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.consents_append_only()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin raise exception 'consents is append-only'; end $function$
;

CREATE OR REPLACE FUNCTION public.tk_create_person(p_ws uuid, p_first text, p_last text, p_email text, p_phone text, p_status text DEFAULT 'guest'::text, p_age_group text DEFAULT 'unknown'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  insert into toolkit_core.people (workspace_id, first_name, last_name, email, phone, status, age_group, created_by)
  values (p_ws, trim(p_first), trim(coalesce(p_last,'')), nullif(trim(coalesce(p_email,'')),''), nullif(trim(coalesce(p_phone,'')),''), p_status, p_age_group, auth.uid())
  returning id into v_id;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id)
    values (p_ws, auth.uid(), 'person.created', 'person', v_id::text);
  return v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_update_person(p_ws uuid, p_id uuid, p_first text, p_last text, p_email text, p_phone text, p_status text, p_channel text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update toolkit_core.people set
    first_name = trim(p_first), last_name = trim(coalesce(p_last,'')),
    email = nullif(trim(coalesce(p_email,'')),''), phone = nullif(trim(coalesce(p_phone,'')),''),
    status = p_status, preferred_channel = nullif(p_channel,''), updated_at = now()
  where id = p_id and workspace_id = p_ws;
  if not found then raise exception 'person not found' using errcode = 'P0002'; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id)
    values (p_ws, auth.uid(), 'person.updated', 'person', p_id::text);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_person_consents(p_ws uuid, p_person uuid)
 RETURNS TABLE(purpose text, channel text, status text, source text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select distinct on (c.purpose, c.channel) c.purpose, c.channel, c.status, c.source, c.created_at
  from toolkit_core.consents c
  where c.workspace_id = p_ws and c.person_id = p_person
    and toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader'])
  order by c.purpose, c.channel, c.id desc;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_record_consent(p_ws uuid, p_person uuid, p_purpose text, p_channel text, p_status text, p_source text DEFAULT 'staff_entry'::text, p_evidence text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from toolkit_core.people where id = p_person and workspace_id = p_ws) then
    raise exception 'person not found' using errcode = 'P0002';
  end if;
  insert into toolkit_core.consents (workspace_id, person_id, purpose, channel, status, source, evidence, recorded_by)
  values (p_ws, p_person, p_purpose, nullif(p_channel,''), p_status, coalesce(p_source,'staff_entry'), p_evidence, auth.uid());
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta)
    values (p_ws, auth.uid(), 'consent.' || p_status, 'person', p_person::text, jsonb_build_object('purpose', p_purpose, 'channel', p_channel));
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_members(p_ws uuid)
 RETURNS TABLE(user_id uuid, display_name text, username text, role text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select m.user_id, p.display_name, p.username, m.role
  from toolkit_core.workspace_members m
  left join toolkit_core.member_profiles p on p.user_id = m.user_id
  where m.workspace_id = p_ws and m.status = 'active' and toolkit_core.is_member(p_ws);
$function$
;

CREATE OR REPLACE FUNCTION public.tk_list_calendar(p_ws uuid, p_from timestamp with time zone, p_to timestamp with time zone)
 RETURNS TABLE(item_id uuid, occurrence_start timestamp with time zone, occurrence_end timestamp with time zone, title text, kind text, all_day boolean, location text, notes text, recurrence text, recurrence_until date, starts_at timestamp with time zone, ends_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select c.id,
         o.s,
         case when c.ends_at is null then null else o.s + (c.ends_at - c.starts_at) end,
         c.title, c.kind, c.all_day, c.location, c.notes, c.recurrence, c.recurrence_until, c.starts_at, c.ends_at
  from toolkit_core.calendar_items c
  cross join lateral (
    select g as s from generate_series(
      c.starts_at,
      case when c.recurrence = 'none' then c.starts_at
           else least(p_to, coalesce((c.recurrence_until + 1)::timestamptz, p_to)) end,
      case c.recurrence when 'weekly' then interval '1 week' when 'monthly' then interval '1 month' when 'yearly' then interval '1 year' else interval '1 day' end
    ) g
  ) o
  where c.workspace_id = p_ws
    and toolkit_core.is_member(p_ws)
    and o.s >= p_from and o.s < p_to
    and (c.recurrence = 'none' or c.recurrence_until is null or o.s < (c.recurrence_until + 1)::timestamptz)
  order by o.s;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_create_calendar_item(p_ws uuid, p_title text, p_kind text, p_starts timestamp with time zone, p_ends timestamp with time zone, p_all_day boolean, p_location text, p_notes text, p_recurrence text, p_until date)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if coalesce(p_recurrence,'none') <> 'none' and p_until is not null and p_until < (p_starts at time zone 'UTC')::date - 1 then
    raise exception 'The repeat end date must be on or after the start date.' using errcode = '22023';
  end if;
  insert into toolkit_core.calendar_items (workspace_id, title, kind, starts_at, ends_at, all_day, location, notes, recurrence, recurrence_until, created_by)
  values (p_ws, trim(p_title), p_kind, p_starts, p_ends, coalesce(p_all_day,false), nullif(trim(coalesce(p_location,'')),''), nullif(trim(coalesce(p_notes,'')),''), coalesce(p_recurrence,'none'), p_until, auth.uid())
  returning id into v_id;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id) values (p_ws, auth.uid(), 'calendar.created', 'calendar_item', v_id::text);
  return v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_update_calendar_item(p_ws uuid, p_id uuid, p_title text, p_kind text, p_starts timestamp with time zone, p_ends timestamp with time zone, p_all_day boolean, p_location text, p_notes text, p_recurrence text, p_until date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if coalesce(p_recurrence,'none') <> 'none' and p_until is not null and p_until < (p_starts at time zone 'UTC')::date - 1 then
    raise exception 'The repeat end date must be on or after the start date.' using errcode = '22023';
  end if;
  update toolkit_core.calendar_items set title = trim(p_title), kind = p_kind, starts_at = p_starts, ends_at = p_ends, all_day = coalesce(p_all_day,false),
    location = nullif(trim(coalesce(p_location,'')),''), notes = nullif(trim(coalesce(p_notes,'')),''), recurrence = coalesce(p_recurrence,'none'), recurrence_until = p_until, updated_at = now()
  where id = p_id and workspace_id = p_ws;
  if not found then raise exception 'item not found' using errcode = 'P0002'; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id) values (p_ws, auth.uid(), 'calendar.updated', 'calendar_item', p_id::text);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_delete_calendar_item(p_ws uuid, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode = '42501'; end if;
  delete from toolkit_core.calendar_items where id = p_id and workspace_id = p_ws;
  if not found then raise exception 'item not found' using errcode = 'P0002'; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id) values (p_ws, auth.uid(), 'calendar.deleted', 'calendar_item', p_id::text);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_tasks(p_ws uuid)
 RETURNS TABLE(id uuid, title text, notes text, due_date date, status text, assignee_user uuid, assignee_name text, created_at timestamp with time zone, completed_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select t.id, t.title, t.notes, t.due_date, t.status, t.assignee_user, p.display_name, t.created_at, t.completed_at
  from toolkit_core.tasks t
  left join toolkit_core.member_profiles p on p.user_id = t.assignee_user
  where t.workspace_id = p_ws
    and toolkit_core.is_member(p_ws)
    and (toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) or t.assignee_user = auth.uid())
  order by (t.status = 'done'), t.due_date nulls last, t.created_at;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_create_task(p_ws uuid, p_title text, p_notes text, p_due date, p_assignee uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_assignee is not null and not toolkit_core.is_member_of(p_ws, p_assignee) then raise exception 'assignee is not in this workspace' using errcode = '22023'; end if;
  insert into toolkit_core.tasks (workspace_id, title, notes, due_date, assignee_user, created_by)
  values (p_ws, trim(p_title), nullif(trim(coalesce(p_notes,'')),''), p_due, p_assignee, auth.uid()) returning id into v_id;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id) values (p_ws, auth.uid(), 'task.created', 'task', v_id::text);
  return v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_set_task_status(p_ws uuid, p_id uuid, p_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if p_status not in ('open','done') then raise exception 'bad status' using errcode = '22023'; end if;
  update toolkit_core.tasks set status = p_status, completed_at = case when p_status = 'done' then now() else null end
  where id = p_id and workspace_id = p_ws and toolkit_core.is_member(p_ws)
    and (toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) or assignee_user = auth.uid());
  if not found then raise exception 'task not found' using errcode = 'P0002'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_delete_task(p_ws uuid, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_title text;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode='42501'; end if;
  delete from toolkit_core.tasks where id=p_id and workspace_id=p_ws returning title into v_title;
  if not found then raise exception 'task not found' using errcode='P0002'; end if;
  insert into toolkit_core.audit_events(workspace_id,actor_id,action,target_type,target_id,meta)
  values(p_ws,auth.uid(),'task.deleted','task',p_id::text,jsonb_build_object('title',v_title));
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.is_member_of(p_ws uuid, p_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (select 1 from toolkit_core.workspace_members m where m.workspace_id = p_ws and m.user_id = p_user and m.status = 'active');
$function$
;

CREATE OR REPLACE FUNCTION public.tk_list_service_plans(p_ws uuid, p_from timestamp with time zone, p_to timestamp with time zone)
 RETURNS TABLE(id uuid, title text, starts_at timestamp with time zone, theme text, roles_needed bigint, roles_filled bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select p.id, p.title, p.starts_at, p.theme,
    coalesce((select sum(r.needed) from toolkit_core.service_roles r where r.plan_id = p.id), 0),
    coalesce((select sum(least(r.needed, (select count(*) from toolkit_core.role_assignments a where a.role_id = r.id and a.status <> 'declined'))) from toolkit_core.service_roles r where r.plan_id = p.id), 0)
  from toolkit_core.service_plans p
  where p.workspace_id = p_ws and toolkit_core.is_member(p_ws) and p.starts_at >= p_from and p.starts_at < p_to
  order by p.starts_at;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_get_service_plan(p_ws uuid, p_plan uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'id', p.id, 'title', p.title, 'starts_at', p.starts_at, 'theme', p.theme, 'notes', p.notes, 'attendance', p.attendance,
    'run_sheet', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'time_label', i.time_label, 'title', i.title, 'lead', i.lead, 'notes', i.notes) order by i.position)
                           from toolkit_core.run_sheet_items i where i.plan_id = p.id), '[]'::jsonb),
    'roles', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name, 'needed', r.needed,
        'assignments', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'person_id', a.person_id, 'name', trim(pe.first_name || ' ' || pe.last_name), 'status', a.status) order by a.created_at)
                                 from toolkit_core.role_assignments a join toolkit_core.people pe on pe.id = a.person_id where a.role_id = r.id), '[]'::jsonb)
      ) order by r.position, r.name) from toolkit_core.service_roles r where r.plan_id = p.id), '[]'::jsonb)
  )
  from toolkit_core.service_plans p
  where p.id = p_plan and p.workspace_id = p_ws and toolkit_core.is_member(p_ws);
$function$
;

CREATE OR REPLACE FUNCTION public.tk_create_service_plan(p_ws uuid, p_title text, p_starts timestamp with time zone, p_theme text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_cal uuid; v_id uuid;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode = '42501'; end if;
  insert into toolkit_core.calendar_items (workspace_id, title, kind, starts_at, created_by) values (p_ws, trim(p_title), 'service', p_starts, auth.uid()) returning id into v_cal;
  insert into toolkit_core.service_plans (workspace_id, title, starts_at, theme, calendar_item_id, created_by)
  values (p_ws, trim(p_title), p_starts, nullif(trim(coalesce(p_theme,'')),''), v_cal, auth.uid()) returning id into v_id;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id) values (p_ws, auth.uid(), 'service_plan.created', 'service_plan', v_id::text);
  return v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_update_service_plan(p_ws uuid, p_plan uuid, p_title text, p_starts timestamp with time zone, p_theme text, p_notes text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_cal uuid;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode = '42501'; end if;
  update toolkit_core.service_plans set title = trim(p_title), starts_at = p_starts, theme = nullif(trim(coalesce(p_theme,'')),''), notes = nullif(trim(coalesce(p_notes,'')),''), updated_at = now()
  where id = p_plan and workspace_id = p_ws returning calendar_item_id into v_cal;
  if not found then raise exception 'plan not found' using errcode = 'P0002'; end if;
  update toolkit_core.calendar_items set title = trim(p_title), starts_at = p_starts, updated_at = now() where id = v_cal and workspace_id = p_ws;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_delete_service_plan(p_ws uuid, p_plan uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_cal uuid; v_title text;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin']) then raise exception 'not allowed' using errcode='42501'; end if;
  delete from toolkit_core.service_plans where id=p_plan and workspace_id=p_ws returning calendar_item_id,title into v_cal,v_title;
  if not found then raise exception 'plan not found' using errcode='P0002'; end if;
  delete from toolkit_core.calendar_items where id=v_cal and workspace_id=p_ws;
  insert into toolkit_core.audit_events(workspace_id,actor_id,action,target_type,target_id,meta)
  values(p_ws,auth.uid(),'service_plan.deleted','service_plan',p_plan::text,jsonb_build_object('title',v_title));
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_save_run_sheet(p_ws uuid, p_plan uuid, p_items jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from toolkit_core.service_plans where id = p_plan and workspace_id = p_ws) then raise exception 'plan not found' using errcode = 'P0002'; end if;
  if jsonb_array_length(coalesce(p_items,'[]'::jsonb)) > 60 then raise exception 'too many items' using errcode = '22023'; end if;
  delete from toolkit_core.run_sheet_items where plan_id = p_plan;
  insert into toolkit_core.run_sheet_items (plan_id, position, time_label, title, lead, notes)
  select p_plan, (t.ord - 1)::int, nullif(t.v->>'time_label',''), left(t.v->>'title',160), nullif(left(coalesce(t.v->>'lead',''),120),''), nullif(left(coalesce(t.v->>'notes',''),1000),'')
  from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) with ordinality as t(v, ord)
  where coalesce(t.v->>'title','') <> '';
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_add_roles(p_ws uuid, p_plan uuid, p_roles jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_pos int;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from toolkit_core.service_plans where id = p_plan and workspace_id = p_ws) then raise exception 'plan not found' using errcode = 'P0002'; end if;
  select coalesce(max(position), -1) + 1 into v_pos from toolkit_core.service_roles where plan_id = p_plan;
  insert into toolkit_core.service_roles (plan_id, name, needed, position)
  select p_plan, left(trim(t.v->>'name'), 80), least(greatest(coalesce((t.v->>'needed')::int, 1), 1), 50), v_pos + (t.ord - 1)::int
  from jsonb_array_elements(coalesce(p_roles,'[]'::jsonb)) with ordinality as t(v, ord)
  where coalesce(trim(t.v->>'name'),'') <> '';
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_update_role(p_ws uuid, p_role uuid, p_name text, p_needed integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode = '42501'; end if;
  update toolkit_core.service_roles r set name = trim(p_name), needed = p_needed
  from toolkit_core.service_plans p where r.id = p_role and r.plan_id = p.id and p.workspace_id = p_ws;
  if not found then raise exception 'role not found' using errcode = 'P0002'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_delete_role(p_ws uuid, p_role uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_name text; v_plan uuid;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode='42501'; end if;
  delete from toolkit_core.service_roles r
  using toolkit_core.service_plans p
  where r.id=p_role and r.plan_id=p.id and p.workspace_id=p_ws
  returning r.name,r.plan_id into v_name,v_plan;
  if not found then raise exception 'role not found' using errcode='P0002'; end if;
  insert into toolkit_core.audit_events(workspace_id,actor_id,action,target_type,target_id,meta)
  values(p_ws,auth.uid(),'service_role.deleted','service_role',p_role::text,jsonb_build_object('name',v_name,'plan_id',v_plan));
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_assign_person(p_ws uuid, p_role uuid, p_person uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from toolkit_core.service_roles r join toolkit_core.service_plans p on p.id = r.plan_id where r.id = p_role and p.workspace_id = p_ws) then raise exception 'role not found' using errcode = 'P0002'; end if;
  if not exists (select 1 from toolkit_core.people where id = p_person and workspace_id = p_ws and status <> 'archived') then raise exception 'person not found' using errcode = 'P0002'; end if;
  insert into toolkit_core.role_assignments (role_id, person_id, created_by) values (p_role, p_person, auth.uid())
  on conflict (role_id, person_id) do update set status = 'assigned' returning id into v_id;
  return v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_set_assignment(p_ws uuid, p_assignment uuid, p_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_status = 'remove' then
    delete from toolkit_core.role_assignments a using toolkit_core.service_roles r, toolkit_core.service_plans p
      where a.id = p_assignment and a.role_id = r.id and r.plan_id = p.id and p.workspace_id = p_ws;
  else
    update toolkit_core.role_assignments a set status = p_status from toolkit_core.service_roles r, toolkit_core.service_plans p
      where a.id = p_assignment and a.role_id = r.id and r.plan_id = p.id and p.workspace_id = p_ws and p_status in ('assigned','confirmed','declined');
  end if;
  if not found then raise exception 'assignment not found' using errcode = 'P0002'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_create_gap_tasks(p_ws uuid, p_plan uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_count int := 0; r record; v_title text; v_when date;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode = '42501'; end if;
  select (p.starts_at at time zone 'UTC')::date into v_when from toolkit_core.service_plans p where p.id = p_plan and p.workspace_id = p_ws;
  if v_when is null then raise exception 'plan not found' using errcode = 'P0002'; end if;
  for r in
    select sr.name, sr.needed - (select count(*) from toolkit_core.role_assignments a where a.role_id = sr.id and a.status <> 'declined') as open_n
    from toolkit_core.service_roles sr where sr.plan_id = p_plan
  loop
    if r.open_n > 0 then
      v_title := format('Find %s for %s (%s open)', r.name, to_char(v_when, 'Mon DD'), r.open_n);
      if not exists (select 1 from toolkit_core.tasks t where t.workspace_id = p_ws and t.title = v_title and t.status = 'open') then
        insert into toolkit_core.tasks (workspace_id, title, due_date, source, created_by) values (p_ws, v_title, greatest(v_when - 2, current_date), 'system', auth.uid());
        v_count := v_count + 1;
      end if;
    end if;
  end loop;
  return v_count;
end $function$
;

CREATE OR REPLACE FUNCTION toolkit_core.contact_check(p_ws uuid, p_person uuid, p_channel text, p_purpose text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_p record; v_consent text; v_today int;
begin
  select * into v_p from toolkit_core.people where id = p_person and workspace_id = p_ws;
  if not found then return 'Person not found'; end if;
  if v_p.status = 'archived' then return 'This person is archived'; end if;
  if v_p.age_group = 'minor' then return 'Messages to minors are not allowed'; end if;
  if p_channel = 'sms' and v_p.phone is null then return 'No phone number on file'; end if;
  if p_channel = 'email' and v_p.email is null then return 'No email address on file'; end if;
  select c.status into v_consent from toolkit_core.consents c
    where c.person_id = p_person and c.purpose = p_purpose and c.channel = p_channel order by c.id desc limit 1;
  if v_consent is distinct from 'granted' then
    return case when v_consent = 'revoked' then 'This person opted out of this kind of message' else 'No consent recorded for this kind of message' end;
  end if;
  select count(*) into v_today from toolkit_core.outbox o
    where o.person_id = p_person and o.channel = p_channel and o.status in ('approved','sent') and o.created_at > now() - interval '24 hours';
  if v_today >= 3 then return 'Daily message limit reached for this person'; end if;
  return null;
end $function$
;

CREATE OR REPLACE FUNCTION toolkit_core.in_quiet_hours(p_ws uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare w record; t time;
begin
  select timezone, quiet_start, quiet_end into w from toolkit_core.workspaces where id = p_ws;
  t := (now() at time zone w.timezone)::time;
  if w.quiet_start > w.quiet_end then return t >= w.quiet_start or t < w.quiet_end; end if;
  return t >= w.quiet_start and t < w.quiet_end;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_queue_message(p_ws uuid, p_person uuid, p_channel text, p_purpose text, p_body text, p_related_type text DEFAULT NULL::text, p_related_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_reason text; v_id uuid; v_status text;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from toolkit_core.people where id = p_person and workspace_id = p_ws) then raise exception 'person not found' using errcode = 'P0002'; end if;
  v_reason := toolkit_core.contact_check(p_ws, p_person, p_channel, p_purpose);
  v_status := case when v_reason is null then 'pending_approval' else 'blocked' end;
  insert into toolkit_core.outbox (workspace_id, person_id, channel, purpose, body, status, status_reason, related_type, related_id, created_by)
  values (p_ws, p_person, p_channel, p_purpose, trim(p_body), v_status, v_reason, p_related_type, p_related_id, auth.uid())
  returning id into v_id;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta)
    values (p_ws, auth.uid(), 'message.queued', 'outbox', v_id::text, jsonb_build_object('status', v_status));
  return jsonb_build_object('id', v_id, 'status', v_status, 'reason', v_reason);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_outbox(p_ws uuid)
 RETURNS TABLE(id uuid, person_id uuid, person_name text, channel text, purpose text, body text, status text, status_reason text, created_at timestamp with time zone, sent_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select o.id, o.person_id, trim(p.first_name || ' ' || p.last_name), o.channel, o.purpose, o.body, o.status, o.status_reason, o.created_at, o.sent_at
  from toolkit_core.outbox o join toolkit_core.people p on p.id = o.person_id
  where o.workspace_id = p_ws and toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader'])
  order by o.created_at desc limit 200;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_approve_message(p_ws uuid, p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare o record; v_reason text;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into o from toolkit_core.outbox where id = p_id and workspace_id = p_ws for update;
  if not found then raise exception 'message not found' using errcode = 'P0002'; end if;
  if o.status <> 'pending_approval' then raise exception 'This message is no longer waiting for approval' using errcode = '22023'; end if;
  v_reason := toolkit_core.contact_check(p_ws, o.person_id, o.channel, o.purpose);
  if v_reason is not null then
    update toolkit_core.outbox set status = 'blocked', status_reason = v_reason where id = p_id;
    return jsonb_build_object('status', 'blocked', 'reason', v_reason);
  end if;
  update toolkit_core.outbox set status = 'approved', approved_by = auth.uid(), approved_at = now() where id = p_id;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id) values (p_ws, auth.uid(), 'message.approved', 'outbox', p_id::text);
  return jsonb_build_object('status', 'approved');
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_cancel_message(p_ws uuid, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_status text;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode='42501'; end if;
  update toolkit_core.outbox
  set status='cancelled',status_reason='Cancelled by staff'
  where id=p_id and workspace_id=p_ws and status in ('pending_approval','approved','blocked')
  returning status into v_status;
  if not found then raise exception 'message not found' using errcode='P0002'; end if;
  insert into toolkit_core.audit_events(workspace_id,actor_id,action,target_type,target_id,meta)
  values(p_ws,auth.uid(),'message.cancelled','outbox',p_id::text,jsonb_build_object('status',v_status));
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_dispatch_dry_run(p_ws uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare o record; v_reason text; v_sent int := 0; v_blocked int := 0; v_deferred int := 0;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  for o in select * from toolkit_core.outbox where workspace_id = p_ws and status = 'approved' order by created_at for update loop
    v_reason := toolkit_core.contact_check(p_ws, o.person_id, o.channel, o.purpose);
    if v_reason is not null and v_reason not like 'Daily message limit%' then
      update toolkit_core.outbox set status = 'blocked', status_reason = v_reason where id = o.id; v_blocked := v_blocked + 1;
    elsif toolkit_core.in_quiet_hours(p_ws) then
      update toolkit_core.outbox set status_reason = 'Waiting for quiet hours to end' where id = o.id; v_deferred := v_deferred + 1;
    else
      update toolkit_core.outbox set status = 'sent', sent_at = now(), provider = 'dry_run', provider_message_id = 'dryrun-' || o.id, status_reason = null where id = o.id;
      v_sent := v_sent + 1;
    end if;
  end loop;
  return jsonb_build_object('sent', v_sent, 'blocked', v_blocked, 'deferred', v_deferred);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_inbound(p_ws uuid)
 RETURNS TABLE(id bigint, person_name text, channel text, body text, action text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select i.id, trim(p.first_name || ' ' || p.last_name), i.channel, i.body, i.action, i.created_at
  from toolkit_core.inbound_messages i join toolkit_core.people p on p.id = i.person_id
  where i.workspace_id = p_ws and toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader'])
  order by i.id desc limit 30;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_simulate_inbound(p_ws uuid, p_person uuid, p_body text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_text text := upper(trim(coalesce(p_body,''))); v_action text := 'other'; v_purpose text; v_assign uuid;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from toolkit_core.people where id = p_person and workspace_id = p_ws) then raise exception 'person not found' using errcode = 'P0002'; end if;

  if v_text in ('STOP','STOPALL','UNSUBSCRIBE','CANCEL','END','QUIT') then
    v_action := 'stop';
    foreach v_purpose in array array['operational_messages','guest_followup','newsletters','volunteer_contact'] loop
      insert into toolkit_core.consents (workspace_id, person_id, purpose, channel, status, source, evidence, recorded_by)
      values (p_ws, p_person, v_purpose, 'sms', 'revoked', 'reply_stop', 'STOP reply', auth.uid());
    end loop;
    update toolkit_core.outbox set status = 'cancelled', status_reason = 'Recipient replied STOP'
      where person_id = p_person and channel = 'sms' and status in ('pending_approval','approved');
  elsif v_text = 'START' then
    v_action := 'start';
    insert into toolkit_core.consents (workspace_id, person_id, purpose, channel, status, source, evidence, recorded_by)
    values (p_ws, p_person, 'operational_messages', 'sms', 'granted', 'reply_start', 'START reply', auth.uid());
  elsif v_text = 'HELP' then
    v_action := 'help';
  elsif v_text in ('1','YES','Y') or v_text in ('2','NO','N') then
    v_action := case when v_text in ('1','YES','Y') then 'yes' else 'no' end;
    select o.related_id into v_assign from toolkit_core.outbox o
      where o.person_id = p_person and o.related_type = 'assignment' and o.status = 'sent' order by o.sent_at desc limit 1;
    if v_assign is not null then
      update toolkit_core.role_assignments set status = case when v_action = 'yes' then 'confirmed' else 'declined' end where id = v_assign;
    end if;
  end if;

  insert into toolkit_core.inbound_messages (workspace_id, person_id, channel, body, action) values (p_ws, p_person, 'sms', left(coalesce(p_body,''), 480), v_action);
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta)
    values (p_ws, auth.uid(), 'message.inbound_test', 'person', p_person::text, jsonb_build_object('action', v_action));
  return v_action;
end $function$
;

CREATE OR REPLACE FUNCTION toolkit_core.can_read_channel(p_ws uuid, p_channel uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select toolkit_core.is_member(p_ws) and exists (
    select 1 from toolkit_core.channels c
    where c.id = p_channel and c.workspace_id = p_ws and not c.archived
      and (not c.is_private or exists (select 1 from toolkit_core.channel_members m where m.channel_id = c.id and m.user_id = auth.uid())));
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.can_post_channel(p_ws uuid, p_channel uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select toolkit_core.can_read_channel(p_ws, p_channel) and (
    not exists (select 1 from toolkit_core.channels c where c.id = p_channel and c.type = 'announcement')
    or toolkit_core.is_member(p_ws, array['owner','pastor','admin']));
$function$
;

CREATE OR REPLACE FUNCTION public.tk_ensure_default_channels(p_ws uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws) then raise exception 'not allowed' using errcode = '42501'; end if;
  if exists (select 1 from toolkit_core.channels where workspace_id = p_ws) then return; end if;
  insert into toolkit_core.channels (workspace_id, name, type, description, created_by) values
    (p_ws, 'announcements', 'announcement', 'Church-wide updates', auth.uid()),
    (p_ws, 'general', 'church', 'Community conversation', auth.uid());
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_channels(p_ws uuid)
 RETURNS TABLE(id uuid, name text, type text, description text, is_private boolean, member_count bigint, unread bigint, last_body text, last_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select c.id, c.name, c.type, c.description, c.is_private,
    case when c.is_private then (select count(*) from toolkit_core.channel_members m where m.channel_id = c.id)
         else (select count(*) from toolkit_core.workspace_members wm where wm.workspace_id = p_ws and wm.status = 'active') end,
    (select count(*) from toolkit_core.chat_messages x where x.channel_id = c.id and x.deleted_at is null and x.author_user <> auth.uid()
       and x.created_at > coalesce((select r.last_read_at from toolkit_core.channel_reads r where r.channel_id = c.id and r.user_id = auth.uid()), '-infinity'::timestamptz)),
    (select left(x.body, 90) from toolkit_core.chat_messages x where x.channel_id = c.id and x.deleted_at is null order by x.created_at desc limit 1),
    (select max(x.created_at) from toolkit_core.chat_messages x where x.channel_id = c.id and x.deleted_at is null)
  from toolkit_core.channels c
  where c.workspace_id = p_ws and not c.archived and toolkit_core.can_read_channel(p_ws, c.id)
  order by (c.type = 'announcement') desc, c.name;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_create_channel(p_ws uuid, p_name text, p_type text, p_description text, p_private boolean, p_members uuid[] DEFAULT '{}'::uuid[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid; u uuid;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  insert into toolkit_core.channels (workspace_id, name, type, description, is_private, created_by)
  values (p_ws, lower(trim(p_name)), p_type, nullif(trim(coalesce(p_description,'')),''), coalesce(p_private,false) or p_type = 'leadership', auth.uid()) returning id into v_id;
  insert into toolkit_core.channel_members (channel_id, user_id) values (v_id, auth.uid()) on conflict do nothing;
  foreach u in array coalesce(p_members,'{}') loop
    if toolkit_core.is_member_of(p_ws, u) then insert into toolkit_core.channel_members (channel_id, user_id) values (v_id, u) on conflict do nothing; end if;
  end loop;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id) values (p_ws, auth.uid(), 'channel.created', 'channel', v_id::text);
  return v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_channel_members(p_ws uuid, p_channel uuid)
 RETURNS TABLE(user_id uuid, display_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select m.user_id, p.display_name from toolkit_core.channel_members m
  left join toolkit_core.member_profiles p on p.user_id = m.user_id
  where m.channel_id = p_channel and toolkit_core.can_read_channel(p_ws, p_channel);
$function$
;

CREATE OR REPLACE FUNCTION public.tk_list_messages(p_ws uuid, p_channel uuid, p_parent uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, author_user uuid, author_name text, body text, parent_id uuid, pinned boolean, created_at timestamp with time zone, edited_at timestamp with time zone, reply_count bigint, reactions jsonb, saved boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select m.id, m.author_user, p.display_name, m.body, m.parent_id, m.pinned, m.created_at, m.edited_at,
    (select count(*) from toolkit_core.chat_messages r where r.parent_id = m.id and r.deleted_at is null),
    coalesce((select jsonb_agg(jsonb_build_object('emoji', g.emoji, 'count', g.n, 'mine', g.mine) order by g.emoji)
       from (select rx.emoji, count(*) n, bool_or(rx.user_id = auth.uid()) mine from toolkit_core.chat_reactions rx where rx.message_id = m.id group by rx.emoji) g), '[]'::jsonb),
    exists (select 1 from toolkit_core.chat_saved s where s.message_id = m.id and s.user_id = auth.uid())
  from toolkit_core.chat_messages m
  left join toolkit_core.member_profiles p on p.user_id = m.author_user
  where m.channel_id = p_channel and m.workspace_id = p_ws and m.deleted_at is null
    and toolkit_core.can_read_channel(p_ws, p_channel)
    and ((p_parent is null and m.parent_id is null) or m.parent_id = p_parent)
  order by m.created_at
  limit 300;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_post_message(p_ws uuid, p_channel uuid, p_body text, p_parent uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid;
begin
  if not toolkit_core.can_post_channel(p_ws, p_channel) then raise exception 'You cannot post in this channel' using errcode = '42501'; end if;
  if p_parent is not null and not exists (select 1 from toolkit_core.chat_messages where id = p_parent and channel_id = p_channel and parent_id is null and deleted_at is null) then
    raise exception 'thread not found' using errcode = 'P0002';
  end if;
  insert into toolkit_core.chat_messages (channel_id, workspace_id, author_user, body, parent_id) values (p_channel, p_ws, auth.uid(), trim(p_body), p_parent) returning id into v_id;
  insert into toolkit_core.channel_reads (channel_id, user_id, last_read_at) values (p_channel, auth.uid(), now())
    on conflict (channel_id, user_id) do update set last_read_at = now();
  return v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_edit_message(p_ws uuid, p_id uuid, p_body text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  update toolkit_core.chat_messages set body = trim(p_body), edited_at = now()
  where id = p_id and workspace_id = p_ws and author_user = auth.uid() and deleted_at is null and toolkit_core.can_read_channel(p_ws, channel_id);
  if not found then raise exception 'message not found' using errcode = 'P0002'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_delete_message(p_ws uuid, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  update toolkit_core.chat_messages set deleted_at = now()
  where id = p_id and workspace_id = p_ws and deleted_at is null and toolkit_core.can_read_channel(p_ws, channel_id)
    and (author_user = auth.uid() or toolkit_core.is_member(p_ws, array['owner','pastor','admin']));
  if not found then raise exception 'message not found' using errcode = 'P0002'; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id) values (p_ws, auth.uid(), 'message.deleted', 'chat_message', p_id::text);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_toggle_reaction(p_ws uuid, p_id uuid, p_emoji text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_channel uuid;
begin
  select channel_id into v_channel from toolkit_core.chat_messages where id = p_id and workspace_id = p_ws and deleted_at is null;
  if v_channel is null or not toolkit_core.can_read_channel(p_ws, v_channel) then raise exception 'message not found' using errcode = 'P0002'; end if;
  if exists (select 1 from toolkit_core.chat_reactions where message_id = p_id and user_id = auth.uid() and emoji = p_emoji) then
    delete from toolkit_core.chat_reactions where message_id = p_id and user_id = auth.uid() and emoji = p_emoji;
  else
    insert into toolkit_core.chat_reactions (message_id, user_id, emoji) values (p_id, auth.uid(), p_emoji);
  end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_toggle_save(p_ws uuid, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_channel uuid;
begin
  select channel_id into v_channel from toolkit_core.chat_messages where id = p_id and workspace_id = p_ws and deleted_at is null;
  if v_channel is null or not toolkit_core.can_read_channel(p_ws, v_channel) then raise exception 'message not found' using errcode = 'P0002'; end if;
  if exists (select 1 from toolkit_core.chat_saved where message_id = p_id and user_id = auth.uid()) then
    delete from toolkit_core.chat_saved where message_id = p_id and user_id = auth.uid();
  else insert into toolkit_core.chat_saved (message_id, user_id) values (p_id, auth.uid()); end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_toggle_pin(p_ws uuid, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode = '42501'; end if;
  update toolkit_core.chat_messages set pinned = not pinned where id = p_id and workspace_id = p_ws and deleted_at is null and toolkit_core.can_read_channel(p_ws, channel_id);
  if not found then raise exception 'message not found' using errcode = 'P0002'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_saved(p_ws uuid)
 RETURNS TABLE(id uuid, channel_id uuid, channel_name text, author_name text, body text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select m.id, m.channel_id, c.name, p.display_name, m.body, m.created_at
  from toolkit_core.chat_saved s
  join toolkit_core.chat_messages m on m.id = s.message_id
  join toolkit_core.channels c on c.id = m.channel_id
  left join toolkit_core.member_profiles p on p.user_id = m.author_user
  where s.user_id = auth.uid() and m.workspace_id = p_ws and m.deleted_at is null and toolkit_core.can_read_channel(p_ws, m.channel_id)
  order by s.created_at desc limit 100;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_search_messages(p_ws uuid, p_query text)
 RETURNS TABLE(id uuid, channel_id uuid, channel_name text, author_name text, body text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select m.id, m.channel_id, c.name, p.display_name, m.body, m.created_at
  from toolkit_core.chat_messages m
  join toolkit_core.channels c on c.id = m.channel_id
  left join toolkit_core.member_profiles p on p.user_id = m.author_user
  where m.workspace_id = p_ws and m.deleted_at is null and char_length(trim(p_query)) >= 2
    and m.body ilike '%' || replace(replace(trim(p_query), '%', ''), '_', '') || '%'
    and toolkit_core.can_read_channel(p_ws, m.channel_id)
  order by m.created_at desc limit 40;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_mark_read(p_ws uuid, p_channel uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.can_read_channel(p_ws, p_channel) then return; end if;
  insert into toolkit_core.channel_reads (channel_id, user_id, last_read_at) values (p_channel, auth.uid(), now())
  on conflict (channel_id, user_id) do update set last_read_at = now();
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_vault_ws(p_path text)
 RETURNS uuid
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
begin return split_part(p_path, '/', 1)::uuid; exception when others then return null; end $function$
;

CREATE OR REPLACE FUNCTION public.tk_vault_write_ok(p_path text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select public.tk_vault_ws(p_path) is not null
     and toolkit_core.is_member(public.tk_vault_ws(p_path), array['owner','pastor','admin']);
$function$
;

CREATE OR REPLACE FUNCTION public.tk_vault_read_ok(p_path text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select public.tk_vault_ws(p_path) is not null
     and toolkit_core.is_member(public.tk_vault_ws(p_path), array['owner','pastor','admin','leader'])
     and (toolkit_core.is_member(public.tk_vault_ws(p_path), array['owner','pastor','admin'])
          or not exists (select 1 from toolkit_core.documents d where d.storage_path = p_path and d.restricted));
$function$
;

CREATE OR REPLACE FUNCTION public.tk_list_documents(p_ws uuid)
 RETURNS TABLE(id uuid, name text, folder text, file_name text, storage_path text, size_bytes bigint, mime text, expires_on date, restricted boolean, notes text, created_at timestamp with time zone, uploaded_by_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select d.id, d.name, d.folder, d.file_name, d.storage_path, d.size_bytes, d.mime, d.expires_on, d.restricted, d.notes, d.created_at, p.display_name
  from toolkit_core.documents d left join toolkit_core.member_profiles p on p.user_id = d.uploaded_by
  where d.workspace_id = p_ws
    and toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader'])
    and (not d.restricted or toolkit_core.is_member(p_ws, array['owner','pastor','admin']))
  order by d.created_at desc;
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.sync_renewal_calendar(p_doc uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare d record; v_cal uuid;
begin
  select * into d from toolkit_core.documents where id = p_doc;
  if not found then return; end if;
  if d.expires_on is null then
    if d.calendar_item_id is not null then delete from toolkit_core.calendar_items where id = d.calendar_item_id; update toolkit_core.documents set calendar_item_id = null where id = p_doc; end if;
    return;
  end if;
  if d.calendar_item_id is null then
    insert into toolkit_core.calendar_items (workspace_id, title, kind, starts_at, all_day, created_by)
    values (d.workspace_id, 'Renew: ' || d.name, 'renewal', d.expires_on::timestamptz, true, d.uploaded_by) returning id into v_cal;
    update toolkit_core.documents set calendar_item_id = v_cal where id = p_doc;
  else
    update toolkit_core.calendar_items set title = 'Renew: ' || d.name, starts_at = d.expires_on::timestamptz, updated_at = now() where id = d.calendar_item_id;
  end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_create_document(p_ws uuid, p_path text, p_name text, p_file_name text, p_size bigint, p_mime text, p_folder text, p_expires date, p_restricted boolean, p_notes text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if public.tk_vault_ws(p_path) is distinct from p_ws then raise exception 'file path does not belong to this church' using errcode = '22023'; end if;
  insert into toolkit_core.documents (workspace_id, name, folder, storage_path, file_name, size_bytes, mime, expires_on, restricted, notes, uploaded_by)
  values (p_ws, trim(p_name), coalesce(p_folder,'general'), p_path, left(p_file_name, 240), p_size, p_mime, p_expires, coalesce(p_restricted,false), nullif(trim(coalesce(p_notes,'')),''), auth.uid())
  returning id into v_id;
  perform toolkit_core.sync_renewal_calendar(v_id);
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id) values (p_ws, auth.uid(), 'document.uploaded', 'document', v_id::text);
  return v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_update_document(p_ws uuid, p_id uuid, p_name text, p_folder text, p_expires date, p_restricted boolean, p_notes text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  update toolkit_core.documents set name = trim(p_name), folder = p_folder, expires_on = p_expires, restricted = coalesce(p_restricted,false),
    notes = nullif(trim(coalesce(p_notes,'')),''), updated_at = now() where id = p_id and workspace_id = p_ws;
  if not found then raise exception 'document not found' using errcode = 'P0002'; end if;
  perform toolkit_core.sync_renewal_calendar(p_id);
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id) values (p_ws, auth.uid(), 'document.updated', 'document', p_id::text);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_delete_document(p_ws uuid, p_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_path text; v_cal uuid;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  delete from toolkit_core.documents where id = p_id and workspace_id = p_ws returning storage_path, calendar_item_id into v_path, v_cal;
  if v_path is null then raise exception 'document not found' using errcode = 'P0002'; end if;
  if v_cal is not null then delete from toolkit_core.calendar_items where id = v_cal; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id) values (p_ws, auth.uid(), 'document.deleted', 'document', p_id::text);
  return v_path;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_renewals_due(p_ws uuid, p_days integer DEFAULT 60)
 RETURNS TABLE(id uuid, name text, folder text, expires_on date, days_left integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select d.id, d.name, d.folder, d.expires_on, (d.expires_on - current_date)::int
  from toolkit_core.documents d
  where d.workspace_id = p_ws and d.expires_on is not null and d.expires_on <= current_date + p_days
    and toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader'])
    and (not d.restricted or toolkit_core.is_member(p_ws, array['owner','pastor','admin']))
  order by d.expires_on;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_create_renewal_tasks(p_ws uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r record; v_count int := 0; v_title text;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  for r in select d.name, d.expires_on from toolkit_core.documents d where d.workspace_id = p_ws and d.expires_on is not null and d.expires_on <= current_date + 60 loop
    v_title := 'Renew: ' || r.name;
    if not exists (select 1 from toolkit_core.tasks t where t.workspace_id = p_ws and t.title = v_title and t.status = 'open') then
      insert into toolkit_core.tasks (workspace_id, title, due_date, source, created_by) values (p_ws, v_title, greatest(r.expires_on - 14, current_date), 'system', auth.uid());
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_series(p_ws uuid)
 RETURNS TABLE(id uuid, name text, description text, starts_on date, ends_on date, sermon_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select s.id, s.name, s.description, s.starts_on, s.ends_on,
    (select count(*) from toolkit_core.sermons x where x.series_id = s.id)
  from toolkit_core.sermon_series s
  where s.workspace_id = p_ws and toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader'])
  order by s.starts_on desc nulls last, s.created_at desc;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_save_series(p_ws uuid, p_id uuid, p_name text, p_description text, p_starts date, p_ends date)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_id is null then
    insert into toolkit_core.sermon_series (workspace_id, name, description, starts_on, ends_on, created_by)
    values (p_ws, trim(p_name), nullif(trim(coalesce(p_description,'')),''), p_starts, p_ends, auth.uid()) returning id into v_id;
  else
    update toolkit_core.sermon_series set name = trim(p_name), description = nullif(trim(coalesce(p_description,'')),''), starts_on = p_starts, ends_on = p_ends
    where id = p_id and workspace_id = p_ws returning id into v_id;
    if v_id is null then raise exception 'series not found' using errcode = 'P0002'; end if;
  end if;
  return v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_delete_series(p_ws uuid, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_name text;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin']) then raise exception 'not allowed' using errcode='42501'; end if;
  delete from toolkit_core.sermon_series where id=p_id and workspace_id=p_ws returning name into v_name;
  if not found then raise exception 'series not found' using errcode='P0002'; end if;
  insert into toolkit_core.audit_events(workspace_id,actor_id,action,target_type,target_id,meta)
  values(p_ws,auth.uid(),'sermon_series.deleted','sermon_series',p_id::text,jsonb_build_object('name',v_name));
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_list_sermons(p_ws uuid)
 RETURNS TABLE(id uuid, series_id uuid, series_name text, title text, speaker text, preached_on date, scripture text, summary text, notes text, status text, media_url text, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select m.id, m.series_id, s.name, m.title, m.speaker, m.preached_on, m.scripture, m.summary, m.notes, m.status, m.media_url, m.updated_at
  from toolkit_core.sermons m left join toolkit_core.sermon_series s on s.id = m.series_id
  where m.workspace_id = p_ws and toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader'])
  order by m.preached_on desc, m.created_at desc;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_save_sermon(p_ws uuid, p_id uuid, p_title text, p_speaker text, p_date date, p_series uuid, p_scripture text, p_summary text, p_notes text, p_status text, p_media text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_series is not null and not exists (select 1 from toolkit_core.sermon_series where id = p_series and workspace_id = p_ws) then raise exception 'series not found' using errcode = 'P0002'; end if;
  if p_id is null then
    insert into toolkit_core.sermons (workspace_id, series_id, title, speaker, preached_on, scripture, summary, notes, status, media_url, created_by)
    values (p_ws, p_series, trim(p_title), nullif(trim(coalesce(p_speaker,'')),''), p_date, nullif(trim(coalesce(p_scripture,'')),''), nullif(trim(coalesce(p_summary,'')),''), nullif(coalesce(p_notes,''),''), coalesce(p_status,'planned'), nullif(trim(coalesce(p_media,'')),''), auth.uid())
    returning id into v_id;
  else
    update toolkit_core.sermons set series_id = p_series, title = trim(p_title), speaker = nullif(trim(coalesce(p_speaker,'')),''), preached_on = p_date,
      scripture = nullif(trim(coalesce(p_scripture,'')),''), summary = nullif(trim(coalesce(p_summary,'')),''), notes = nullif(coalesce(p_notes,''),''),
      status = coalesce(p_status,'planned'), media_url = nullif(trim(coalesce(p_media,'')),''), updated_at = now()
    where id = p_id and workspace_id = p_ws returning id into v_id;
    if v_id is null then raise exception 'sermon not found' using errcode = 'P0002'; end if;
  end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id) values (p_ws, auth.uid(), case when p_id is null then 'sermon.created' else 'sermon.updated' end, 'sermon', v_id::text);
  return v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_delete_sermon(p_ws uuid, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_title text;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin']) then raise exception 'not allowed' using errcode='42501'; end if;
  delete from toolkit_core.sermons where id=p_id and workspace_id=p_ws returning title into v_title;
  if not found then raise exception 'sermon not found' using errcode='P0002'; end if;
  insert into toolkit_core.audit_events(workspace_id,actor_id,action,target_type,target_id,meta)
  values(p_ws,auth.uid(),'sermon.deleted','sermon',p_id::text,jsonb_build_object('title',v_title));
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_list_invitations(p_ws uuid)
 RETURNS TABLE(id uuid, email text, role text, created_at timestamp with time zone, expires_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select i.id, i.email, i.role, i.created_at, i.expires_at from toolkit_core.invitations i
  where i.workspace_id = p_ws and i.accepted_at is null and not i.revoked and i.expires_at > now()
    and toolkit_core.is_member(p_ws, array['owner','pastor','admin'])
  order by i.created_at desc;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_revoke_invitation(p_ws uuid, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_email text; v_role text;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin']) then raise exception 'not allowed' using errcode='42501'; end if;
  update toolkit_core.invitations set revoked=true
  where id=p_id and workspace_id=p_ws and accepted_at is null
  returning email,role into v_email,v_role;
  if not found then raise exception 'invitation not found' using errcode='P0002'; end if;
  insert into toolkit_core.audit_events(workspace_id,actor_id,action,target_type,target_id,meta)
  values(p_ws,auth.uid(),'invitation.revoked','invitation',p_id::text,jsonb_build_object('email',v_email,'role',v_role));
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_accept_invitation(p_token text, p_username text, p_display_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid := auth.uid(); i record; v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  select * into i from toolkit_core.invitations
   where token_hash = encode(extensions.digest(convert_to(coalesce(p_token,''), 'utf8'), 'sha256'), 'hex')
     and accepted_at is null and not revoked and expires_at > now() for update;
  if not found then raise exception 'This invitation is not valid or has expired' using errcode = '22023'; end if;
  if lower(i.email) <> v_email then raise exception 'This invitation was sent to a different email address' using errcode = '42501'; end if;
  if exists (select 1 from toolkit_core.workspace_members where user_id = v_uid) then raise exception 'This account already belongs to a church' using errcode = '23505'; end if;
  insert into toolkit_core.member_profiles (user_id, username, display_name) values (v_uid, lower(trim(p_username)), trim(p_display_name))
  on conflict (user_id) do update set username = excluded.username, display_name = excluded.display_name;
  insert into toolkit_core.workspace_members (workspace_id, user_id, role) values (i.workspace_id, v_uid, i.role);
  if i.person_id is not null then
    update toolkit_core.people set user_id = v_uid where id = i.person_id and workspace_id = i.workspace_id and user_id is null;
  end if;
  update toolkit_core.invitations set accepted_at = now(), accepted_by = v_uid where id = i.id;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (i.workspace_id, v_uid, 'invitation.accepted', 'invitation', i.email, jsonb_build_object('role', i.role));
  return i.workspace_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_team(p_ws uuid)
 RETURNS TABLE(user_id uuid, display_name text, username text, email text, role text, status text, joined_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select m.user_id, p.display_name, p.username, u.email::text, m.role, m.status, m.created_at
  from toolkit_core.workspace_members m
  left join toolkit_core.member_profiles p on p.user_id = m.user_id
  left join auth.users u on u.id = m.user_id
  where m.workspace_id = p_ws and toolkit_core.is_member(p_ws, array['owner','pastor','admin'])
  order by (m.role = 'owner') desc, p.display_name;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_set_member_role(p_ws uuid, p_user uuid, p_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_target text;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_role not in ('pastor','admin','treasurer','leader','volunteer') then raise exception 'invalid role' using errcode = '22023'; end if;
  if p_user = auth.uid() then raise exception 'You cannot change your own role' using errcode = '42501'; end if;
  select role into v_target from toolkit_core.workspace_members where workspace_id = p_ws and user_id = p_user;
  if v_target is null then raise exception 'member not found' using errcode = 'P0002'; end if;
  if v_target = 'owner' then raise exception 'The owner role cannot be changed' using errcode = '42501'; end if;
  if (p_role in ('pastor','admin') or v_target in ('pastor','admin')) and not toolkit_core.is_member(p_ws, array['owner','pastor']) then
    raise exception 'Only the owner or a pastor can change pastor or admin roles' using errcode = '42501';
  end if;
  update toolkit_core.workspace_members set role = p_role where workspace_id = p_ws and user_id = p_user;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'member.role_changed', 'user', p_user::text, jsonb_build_object('from', v_target, 'to', p_role));
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_remove_member(p_ws uuid, p_user uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_target text;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'You cannot remove yourself' using errcode = '42501'; end if;
  select role into v_target from toolkit_core.workspace_members where workspace_id = p_ws and user_id = p_user;
  if v_target is null then raise exception 'member not found' using errcode = 'P0002'; end if;
  if v_target = 'owner' then raise exception 'The owner cannot be removed' using errcode = '42501'; end if;
  if v_target in ('pastor','admin') and not toolkit_core.is_member(p_ws, array['owner','pastor']) then raise exception 'Only the owner or a pastor can remove a pastor or admin' using errcode = '42501'; end if;
  update toolkit_core.tasks set assignee_user = null where workspace_id = p_ws and assignee_user = p_user and status = 'open';
  delete from toolkit_core.channel_members where user_id = p_user and channel_id in (select id from toolkit_core.channels where workspace_id = p_ws);
  delete from toolkit_core.workspace_members where workspace_id = p_ws and user_id = p_user;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id) values (p_ws, auth.uid(), 'member.removed', 'user', p_user::text);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_get_settings(p_ws uuid)
 RETURNS TABLE(name text, timezone text, quiet_start time without time zone, quiet_end time without time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select w.name, w.timezone, w.quiet_start, w.quiet_end from toolkit_core.workspaces w
  where w.id = p_ws and toolkit_core.is_member(p_ws);
$function$
;

CREATE OR REPLACE FUNCTION public.tk_update_settings(p_ws uuid, p_name text, p_timezone text, p_quiet_start time without time zone, p_quiet_end time without time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from pg_timezone_names where name = p_timezone) then raise exception 'Unknown time zone' using errcode = '22023'; end if;
  update toolkit_core.workspaces set name = trim(p_name), timezone = p_timezone, quiet_start = p_quiet_start, quiet_end = p_quiet_end where id = p_ws;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id) values (p_ws, auth.uid(), 'settings.updated', 'workspace', p_ws::text);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_set_feature(p_ws uuid, p_module text, p_enabled boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_module = 'week' then raise exception 'This Week is always on' using errcode = '22023'; end if;
  update toolkit_core.workspace_features set enabled = p_enabled where workspace_id = p_ws and module = p_module;
  if not found then raise exception 'unknown module' using errcode = 'P0002'; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'module.toggled', 'module', p_module, jsonb_build_object('enabled', p_enabled));
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_audit(p_ws uuid, p_limit integer DEFAULT 60)
 RETURNS TABLE(id bigint, action text, actor_name text, target_type text, target_id text, meta jsonb, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select a.id, a.action, p.display_name, a.target_type, a.target_id, a.meta, a.created_at
  from toolkit_core.audit_events a left join toolkit_core.member_profiles p on p.user_id = a.actor_id
  where a.workspace_id = p_ws and toolkit_core.is_member(p_ws, array['owner','pastor','admin'])
  order by a.id desc limit least(greatest(p_limit, 1), 200);
$function$
;

CREATE OR REPLACE FUNCTION public.tk_export_workspace(p_ws uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare j jsonb;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor']) then raise exception 'Only the owner or a pastor can export church data' using errcode = '42501'; end if;
  select jsonb_build_object(
    'exported_at', now(),
    'format', 'church-toolkit-export-v1',
    'note', 'Files in the Vault are not included here; download them from the Vault. Deleted chat messages are excluded.',
    'workspace', (select to_jsonb(w) - 'created_by' from toolkit_core.workspaces w where w.id = p_ws),
    'members', coalesce((select jsonb_agg(jsonb_build_object('user_id', m.user_id, 'role', m.role, 'status', m.status, 'joined_at', m.created_at, 'display_name', p.display_name, 'username', p.username, 'email', u.email))
                         from toolkit_core.workspace_members m left join toolkit_core.member_profiles p on p.user_id = m.user_id left join auth.users u on u.id = m.user_id where m.workspace_id = p_ws), '[]'::jsonb),
    'people', coalesce((select jsonb_agg(to_jsonb(t) - 'created_by') from toolkit_core.people t where t.workspace_id = p_ws), '[]'::jsonb),
    'consents', coalesce((select jsonb_agg(to_jsonb(t) - 'recorded_by') from toolkit_core.consents t where t.workspace_id = p_ws), '[]'::jsonb),
    'calendar_items', coalesce((select jsonb_agg(to_jsonb(t) - 'created_by') from toolkit_core.calendar_items t where t.workspace_id = p_ws), '[]'::jsonb),
    'tasks', coalesce((select jsonb_agg(to_jsonb(t) - 'created_by') from toolkit_core.tasks t where t.workspace_id = p_ws), '[]'::jsonb),
    'service_plans', coalesce((select jsonb_agg(to_jsonb(sp) - 'created_by' || jsonb_build_object(
        'run_sheet', coalesce((select jsonb_agg(to_jsonb(i) - 'plan_id' order by i.position) from toolkit_core.run_sheet_items i where i.plan_id = sp.id), '[]'::jsonb),
        'roles', coalesce((select jsonb_agg(jsonb_build_object('name', r.name, 'needed', r.needed, 'assignments', coalesce((select jsonb_agg(jsonb_build_object('person_id', a.person_id, 'status', a.status)) from toolkit_core.role_assignments a where a.role_id = r.id), '[]'::jsonb)) order by r.position) from toolkit_core.service_roles r where r.plan_id = sp.id), '[]'::jsonb)))
      from toolkit_core.service_plans sp where sp.workspace_id = p_ws), '[]'::jsonb),
    'messages_outbox', coalesce((select jsonb_agg(to_jsonb(t) - 'created_by' - 'approved_by' - 'provider_message_id') from toolkit_core.outbox t where t.workspace_id = p_ws), '[]'::jsonb),
    'messages_inbound', coalesce((select jsonb_agg(to_jsonb(t)) from toolkit_core.inbound_messages t where t.workspace_id = p_ws), '[]'::jsonb),
    'channels', coalesce((select jsonb_agg(to_jsonb(t) - 'created_by') from toolkit_core.channels t where t.workspace_id = p_ws), '[]'::jsonb),
    'chat_messages', coalesce((select jsonb_agg(to_jsonb(t)) from toolkit_core.chat_messages t where t.workspace_id = p_ws and t.deleted_at is null), '[]'::jsonb),
    'sermon_series', coalesce((select jsonb_agg(to_jsonb(t) - 'created_by') from toolkit_core.sermon_series t where t.workspace_id = p_ws), '[]'::jsonb),
    'sermons', coalesce((select jsonb_agg(to_jsonb(t) - 'created_by') from toolkit_core.sermons t where t.workspace_id = p_ws), '[]'::jsonb),
    'documents', coalesce((select jsonb_agg(to_jsonb(t) - 'uploaded_by') from toolkit_core.documents t where t.workspace_id = p_ws), '[]'::jsonb),
    'activity_log', coalesce((select jsonb_agg(to_jsonb(t)) from (select * from toolkit_core.audit_events e where e.workspace_id = p_ws order by e.id desc limit 5000) t), '[]'::jsonb)
  ) into j;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id) values (p_ws, auth.uid(), 'workspace.exported', 'workspace', p_ws::text);
  return j;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_people(p_ws uuid)
 RETURNS TABLE(id uuid, first_name text, last_name text, email text, phone text, status text, age_group text, preferred_channel text, language text, created_at timestamp with time zone, has_login boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select p.id, p.first_name, p.last_name, p.email, p.phone, p.status, p.age_group, p.preferred_channel, p.language, p.created_at, p.user_id is not null
  from toolkit_core.people p
  where p.workspace_id = p_ws and toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader'])
  order by lower(p.last_name), lower(p.first_name);
$function$
;

CREATE OR REPLACE FUNCTION public.tk_create_invitation(p_ws uuid, p_email text, p_role text, p_person uuid DEFAULT NULL::uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_token text;
  v_email text := lower(trim(p_email));
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if p_role not in ('pastor','admin','treasurer','leader','volunteer') then
    raise exception 'invalid role' using errcode = '22023';
  end if;

  if p_role in ('pastor','admin')
     and not toolkit_core.is_member(p_ws, array['owner','pastor']) then
    raise exception 'Only the owner or a pastor can invite a pastor or admin' using errcode = '42501';
  end if;

  if p_person is not null
     and not exists (
       select 1
       from toolkit_core.people
       where id = p_person
         and workspace_id = p_ws
         and user_id is null
     ) then
    raise exception 'That person is not available to link' using errcode = '22023';
  end if;

  if exists (
    select 1
    from toolkit_core.workspace_members m
    join auth.users u on u.id = m.user_id
    where m.workspace_id = p_ws
      and lower(u.email) = v_email
  ) then
    raise exception 'That person is already on your team' using errcode = '23505';
  end if;

  update toolkit_core.invitations
     set revoked = true
   where workspace_id = p_ws
     and lower(email) = v_email
     and accepted_at is null
     and not revoked;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');

  insert into toolkit_core.invitations (
    workspace_id, email, role, token_hash, invited_by, person_id
  )
  values (
    p_ws,
    v_email,
    p_role,
    encode(extensions.digest(convert_to(v_token, 'utf8'), 'sha256'), 'hex'),
    auth.uid(),
    p_person
  );

  insert into toolkit_core.audit_events (
    workspace_id, actor_id, action, target_type, target_id, meta
  )
  values (
    p_ws,
    auth.uid(),
    'invitation.created',
    'invitation',
    v_email,
    jsonb_build_object('role', p_role)
  );

  return v_token;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_my_person(p_ws uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select p.id from toolkit_core.people p where p.workspace_id = p_ws and p.user_id = auth.uid() and toolkit_core.is_member(p_ws);
$function$
;

CREATE OR REPLACE FUNCTION public.tk_my_schedule(p_ws uuid)
 RETURNS TABLE(assignment_id uuid, plan_id uuid, plan_title text, starts_at timestamp with time zone, role_name text, status text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select a.id, sp.id, sp.title, sp.starts_at, r.name, a.status
  from toolkit_core.people pe
  join toolkit_core.role_assignments a on a.person_id = pe.id
  join toolkit_core.service_roles r on r.id = a.role_id
  join toolkit_core.service_plans sp on sp.id = r.plan_id
  where pe.workspace_id = p_ws and pe.user_id = auth.uid() and toolkit_core.is_member(p_ws)
    and sp.starts_at >= now() - interval '6 hours'
  order by sp.starts_at, r.name;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_respond_assignment(p_ws uuid, p_assignment uuid, p_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if p_status not in ('confirmed','declined') then raise exception 'invalid response' using errcode = '22023'; end if;
  update toolkit_core.role_assignments a set status = p_status
  from toolkit_core.people pe
  where a.id = p_assignment and pe.id = a.person_id and pe.workspace_id = p_ws and pe.user_id = auth.uid() and toolkit_core.is_member(p_ws);
  if not found then raise exception 'assignment not found' using errcode = 'P0002'; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'assignment.responded', 'assignment', p_assignment::text, jsonb_build_object('status', p_status));
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_my_blackouts(p_ws uuid)
 RETURNS TABLE(on_date date)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select b.on_date from toolkit_core.availability_blackouts b join toolkit_core.people pe on pe.id = b.person_id
  where pe.workspace_id = p_ws and pe.user_id = auth.uid() and toolkit_core.is_member(p_ws) and b.on_date >= current_date order by b.on_date;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_toggle_my_blackout(p_ws uuid, p_date date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_person uuid;
begin
  select pe.id into v_person from toolkit_core.people pe where pe.workspace_id = p_ws and pe.user_id = auth.uid() and toolkit_core.is_member(p_ws);
  if v_person is null then raise exception 'Your login is not linked to a person record yet' using errcode = '22023'; end if;
  if p_date < current_date then raise exception 'Choose a future date' using errcode = '22023'; end if;
  if exists (select 1 from toolkit_core.availability_blackouts where person_id = v_person and on_date = p_date) then
    delete from toolkit_core.availability_blackouts where person_id = v_person and on_date = p_date;
  else insert into toolkit_core.availability_blackouts (person_id, on_date) values (v_person, p_date); end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_blackouts_on(p_ws uuid, p_date date)
 RETURNS TABLE(person_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select b.person_id from toolkit_core.availability_blackouts b join toolkit_core.people pe on pe.id = b.person_id
  where pe.workspace_id = p_ws and b.on_date = p_date and toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']);
$function$
;

CREATE OR REPLACE FUNCTION public.tk_link_person_user(p_ws uuid, p_person uuid, p_user uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not toolkit_core.is_member_of(p_ws, p_user) then raise exception 'That login is not on your team' using errcode = '22023'; end if;
  update toolkit_core.people set user_id = p_user where id = p_person and workspace_id = p_ws and user_id is null;
  if not found then raise exception 'person not found or already linked' using errcode = 'P0002'; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id) values (p_ws, auth.uid(), 'person.linked', 'person', p_person::text);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_import_people(p_ws uuid, p_rows jsonb, p_status text DEFAULT 'member'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  r jsonb; i int := 0; v_first text; v_last text; v_email text; v_phone text; v_digits text; v_status text; v_age text;
  v_created int := 0; v_dupes int := 0; v_invalid jsonb := '[]'::jsonb; v_reason text;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_status not in ('guest','regular','member','inactive') then raise exception 'invalid status' using errcode = '22023'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 500 then raise exception 'Send between 1 and 500 rows at a time' using errcode = '22023'; end if;
  for r in select value from jsonb_array_elements(p_rows) loop
    i := i + 1; v_reason := null;
    v_first := left(trim(coalesce(r->>'first_name','')), 80);
    v_last := left(trim(coalesce(r->>'last_name','')), 80);
    v_email := nullif(lower(trim(coalesce(r->>'email',''))), '');
    v_phone := nullif(trim(coalesce(r->>'phone','')), '');
    v_digits := regexp_replace(coalesce(v_phone,''), '\D', '', 'g');
    v_status := coalesce(nullif(lower(trim(coalesce(r->>'status',''))), ''), p_status);
    v_age := case lower(trim(coalesce(r->>'age_group',''))) when 'adult' then 'adult' when 'minor' then 'minor' else 'unknown' end;
    if v_first = '' then v_reason := 'Missing first name';
    elsif v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then v_reason := 'Invalid email';
    elsif v_phone is not null and (char_length(v_digits) < 7 or char_length(v_digits) > 15) then v_reason := 'Invalid phone number';
    elsif v_status not in ('guest','regular','member','inactive') then v_reason := 'Unknown status';
    end if;
    if v_reason is not null then
      v_invalid := v_invalid || jsonb_build_array(jsonb_build_object('row', i, 'reason', v_reason));
      continue;
    end if;
    if exists (select 1 from toolkit_core.people p where p.workspace_id = p_ws and (
         (v_email is not null and lower(p.email) = v_email)
         or (char_length(v_digits) >= 7 and regexp_replace(coalesce(p.phone,''), '\D', '', 'g') = v_digits)
         or (v_email is null and v_digits = '' and lower(p.first_name) = lower(v_first) and lower(p.last_name) = lower(v_last)))) then
      v_dupes := v_dupes + 1; continue;
    end if;
    insert into toolkit_core.people (workspace_id, first_name, last_name, email, phone, status, age_group, created_by)
    values (p_ws, v_first, v_last, v_email, case when char_length(v_digits) >= 7 then v_digits else null end, v_status, v_age, auth.uid());
    v_created := v_created + 1;
  end loop;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta)
    values (p_ws, auth.uid(), 'people.imported', 'workspace', p_ws::text, jsonb_build_object('created', v_created, 'duplicates', v_dupes, 'invalid', jsonb_array_length(v_invalid)));
  return jsonb_build_object('created', v_created, 'duplicates', v_dupes, 'invalid', v_invalid);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_get_connect_page(p_ws uuid)
 RETURNS TABLE(slug text, enabled boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  insert into toolkit_core.connect_pages (workspace_id, slug) values (p_ws, encode(extensions.gen_random_bytes(12), 'hex')) on conflict do nothing;
  return query select c.slug, c.enabled from toolkit_core.connect_pages c where c.workspace_id = p_ws;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_set_connect_page(p_ws uuid, p_enabled boolean, p_rotate boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  insert into toolkit_core.connect_pages (workspace_id, slug) values (p_ws, encode(extensions.gen_random_bytes(12), 'hex')) on conflict do nothing;
  update toolkit_core.connect_pages set enabled = p_enabled,
    slug = case when p_rotate then encode(extensions.gen_random_bytes(12), 'hex') else slug end,
    rotated_at = case when p_rotate then now() else rotated_at end
  where workspace_id = p_ws;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'connect_page.updated', 'workspace', p_ws::text, jsonb_build_object('enabled', p_enabled, 'rotated', p_rotate));
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_connect_submissions(p_ws uuid)
 RETURNS TABLE(id bigint, first_name text, last_name text, interests text[], contact_ok boolean, result text, reason text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select s.id, s.first_name, s.last_name, s.interests, s.contact_ok, s.result, s.reason, s.created_at
  from toolkit_core.connect_submissions s
  where s.workspace_id = p_ws and toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader'])
  order by s.id desc limit 30;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_public_connect_info(p_slug text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select w.name from toolkit_core.connect_pages c join toolkit_core.workspaces w on w.id = c.workspace_id where c.slug = p_slug and c.enabled;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_public_connect_submit(p_slug text, p_first text, p_last text, p_email text, p_phone text, p_interests text[], p_adult boolean, p_contact_ok boolean, p_website text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_ws uuid; v_first text := left(trim(coalesce(p_first,'')), 80); v_last text := left(trim(coalesce(p_last,'')), 80);
  v_email text := nullif(lower(trim(coalesce(p_email,''))), ''); v_phone text := nullif(trim(coalesce(p_phone,'')), ''); v_digits text;
  v_ip text; v_iph text; v_person uuid; v_existing uuid; v_interests text[] := '{}'; i text; v_result text; v_note text;
  v_allowed text[] := array['kids','groups','serving','membership class','just visiting'];
begin
  select workspace_id into v_ws from toolkit_core.connect_pages where slug = coalesce(p_slug,'') and enabled;
  if v_ws is null then raise exception 'This page is not available' using errcode = 'P0002'; end if;
  begin v_ip := split_part(coalesce((current_setting('request.headers', true)::jsonb) ->> 'x-forwarded-for', 'unknown'), ',', 1); exception when others then v_ip := 'unknown'; end;
  v_iph := encode(extensions.digest(convert_to(v_ip || ':' || p_slug, 'utf8'), 'sha256'), 'hex');

  -- rate limits: per visitor and per church
  if (select count(*) from toolkit_core.connect_submissions where ip_hash = v_iph and created_at > now() - interval '1 hour') >= 5
     or (select count(*) from toolkit_core.connect_submissions where workspace_id = v_ws and created_at > now() - interval '1 hour') >= 30
     or (select count(*) from toolkit_core.connect_submissions where workspace_id = v_ws and created_at > now() - interval '1 day') >= 200 then
    raise exception 'Too many submissions right now. Please try again later.' using errcode = '54000';
  end if;

  -- bots fill the hidden field: pretend it worked
  if coalesce(p_website,'') <> '' then
    insert into toolkit_core.connect_submissions (workspace_id, result, reason, ip_hash) values (v_ws, 'rejected', 'honeypot', v_iph);
    return 'ok';
  end if;
  if v_first = '' then raise exception 'Please enter your first name' using errcode = '22023'; end if;
  if not coalesce(p_adult, false) then raise exception 'Please ask a parent or guardian to fill this out for you' using errcode = '22023'; end if;
  if v_email is null and v_phone is null then raise exception 'Please give an email or a phone number so we can say hello' using errcode = '22023'; end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then raise exception 'That email does not look right' using errcode = '22023'; end if;
  v_digits := regexp_replace(coalesce(v_phone,''), '\D', '', 'g');
  if v_phone is not null and (char_length(v_digits) < 7 or char_length(v_digits) > 15) then raise exception 'That phone number does not look right' using errcode = '22023'; end if;
  foreach i in array coalesce(p_interests, '{}') loop
    if i = any (v_allowed) and not (i = any (v_interests)) then v_interests := v_interests || i; end if;
  end loop;

  select p.id into v_existing from toolkit_core.people p where p.workspace_id = v_ws and (
    (v_email is not null and lower(p.email) = v_email) or (v_digits <> '' and regexp_replace(coalesce(p.phone,''), '\D', '', 'g') = v_digits)) limit 1;

  if v_existing is null then
    insert into toolkit_core.people (workspace_id, first_name, last_name, email, phone, status, age_group)
    values (v_ws, v_first, v_last, v_email, case when char_length(v_digits) >= 7 then v_digits else null end, 'guest', 'adult') returning id into v_person;
    v_result := 'created';
    if coalesce(p_contact_ok, false) then
      if v_email is not null then insert into toolkit_core.consents (workspace_id, person_id, purpose, channel, status, source, evidence) values (v_ws, v_person, 'guest_followup', 'email', 'granted', 'connect_card', 'Ticked the box on the connect card'); end if;
      if char_length(v_digits) >= 7 then insert into toolkit_core.consents (workspace_id, person_id, purpose, channel, status, source, evidence) values (v_ws, v_person, 'guest_followup', 'sms', 'granted', 'connect_card', 'Ticked the box on the connect card'); end if;
    end if;
  else
    v_person := v_existing; v_result := 'existing';
  end if;

  v_note := case when array_length(v_interests, 1) is null then null else 'Interested in: ' || array_to_string(v_interests, ', ') end;
  insert into toolkit_core.tasks (workspace_id, title, notes, due_date, source)
  values (v_ws, case when v_result = 'created' then 'Welcome ' else 'Follow up: returning guest ' end || trim(v_first || ' ' || v_last), v_note, current_date + 1, 'system');
  insert into toolkit_core.connect_submissions (workspace_id, first_name, last_name, email, phone, interests, contact_ok, person_id, result, ip_hash)
  values (v_ws, v_first, v_last, v_email, v_phone, v_interests, coalesce(p_contact_ok,false), v_person, v_result, v_iph);
  insert into toolkit_core.audit_events (workspace_id, action, target_type, target_id, meta) values (v_ws, 'connect_card.submitted', 'person', v_person::text, jsonb_build_object('result', v_result));
  return 'ok';
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_recipes(p_ws uuid)
 RETURNS TABLE(recipe text, enabled boolean, last_run_at timestamp with time zone, last_created integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then return; end if;
  return query
    select k.r, coalesce(s.enabled, false), s.last_run_at, coalesce(s.last_created, 0)
    from (values ('renewals'),('guest_checkin'),('sunday_slides')) k(r)
    left join toolkit_core.recipe_settings s on s.workspace_id = p_ws and s.recipe = k.r
    order by k.r;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_set_recipe(p_ws uuid, p_recipe text, p_enabled boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_recipe not in ('renewals','guest_checkin','sunday_slides') then raise exception 'unknown recipe'; end if;
  insert into toolkit_core.recipe_settings (workspace_id, recipe, enabled, updated_by) values (p_ws, p_recipe, coalesce(p_enabled,false), auth.uid())
  on conflict (workspace_id, recipe) do update set enabled = excluded.enabled, updated_by = excluded.updated_by;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, meta)
  values (p_ws, auth.uid(), 'recipe.' || case when p_enabled then 'on' else 'off' end, 'recipe', jsonb_build_object('recipe', p_recipe));
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_run_recipes(p_ws uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare n1 int := 0; n2 int := 0; n3 int := 0; r record; on1 boolean; on2 boolean; on3 boolean; tz text;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  select coalesce(bool_or(enabled) filter (where recipe='renewals'), false), coalesce(bool_or(enabled) filter (where recipe='guest_checkin'), false), coalesce(bool_or(enabled) filter (where recipe='sunday_slides'), false)
    into on1, on2, on3 from toolkit_core.recipe_settings where workspace_id = p_ws;

  if on1 then n1 := public.tk_create_renewal_tasks(p_ws); end if;

  if on2 then
    for r in select p.id, p.first_name, p.last_name from toolkit_core.people p
             where p.workspace_id = p_ws and p.status = 'guest' and p.created_at <= now() - interval '5 days' loop
      if not exists (select 1 from toolkit_core.tasks t where t.workspace_id = p_ws and t.notes = 'recipe:guest_checkin:' || r.id::text) then
        insert into toolkit_core.tasks (workspace_id, title, notes, due_date, source, created_by)
        values (p_ws, left('Check in with ' || trim(r.first_name || ' ' || coalesce(r.last_name,'')), 200), 'recipe:guest_checkin:' || r.id::text, current_date + 2, 'recipe', auth.uid());
        n2 := n2 + 1;
      end if;
    end loop;
  end if;

  if on3 then
    select timezone into tz from toolkit_core.workspaces where id = p_ws;
    for r in select sp.id, sp.starts_at from toolkit_core.service_plans sp
             where sp.workspace_id = p_ws and sp.starts_at >= now() and sp.starts_at <= now() + interval '5 days' loop
      if not exists (select 1 from toolkit_core.tasks t where t.workspace_id = p_ws and t.notes = 'recipe:sunday_slides:' || r.id::text) then
        insert into toolkit_core.tasks (workspace_id, title, notes, due_date, source, created_by)
        values (p_ws, 'Prepare the slides and bulletin for ' || to_char(r.starts_at at time zone tz, 'Mon FMDD'), 'recipe:sunday_slides:' || r.id::text,
                greatest(current_date, ((r.starts_at at time zone tz)::date) - 2), 'recipe', auth.uid());
        n3 := n3 + 1;
      end if;
    end loop;
  end if;

  update toolkit_core.recipe_settings set last_run_at = now(), last_created = case recipe when 'renewals' then n1 when 'guest_checkin' then n2 else n3 end
    where workspace_id = p_ws and enabled;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, meta)
  values (p_ws, auth.uid(), 'recipe.run', 'recipe', jsonb_build_object('renewals', n1, 'guest_checkin', n2, 'sunday_slides', n3));
  return jsonb_build_object('renewals', n1, 'guest_checkin', n2, 'sunday_slides', n3);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_setup_status(p_ws uuid)
 RETURNS TABLE(people_count bigint, consents_count bigint, plans_count bigint, team_count bigint, invites_count bigint, docs_count bigint, settings_saved boolean, connect_enabled boolean, recipes_on bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select
    (select count(*) from toolkit_core.people where workspace_id = p_ws),
    (select count(*) from toolkit_core.consents where workspace_id = p_ws),
    (select count(*) from toolkit_core.service_plans where workspace_id = p_ws),
    (select count(*) from toolkit_core.workspace_members where workspace_id = p_ws and status = 'active'),
    (select count(*) from toolkit_core.invitations where workspace_id = p_ws and not revoked),
    (select count(*) from toolkit_core.documents where workspace_id = p_ws),
    exists (select 1 from toolkit_core.audit_events where workspace_id = p_ws and action = 'settings.updated'),
    exists (select 1 from toolkit_core.connect_pages where workspace_id = p_ws and enabled),
    (select count(*) from toolkit_core.recipe_settings where workspace_id = p_ws and enabled)
  where toolkit_core.is_member(p_ws, array['owner','pastor','admin']);
$function$
;

CREATE OR REPLACE FUNCTION public.tk_list_care(p_ws uuid)
 RETURNS TABLE(id uuid, person_id uuid, person_name text, kind text, body text, status text, follow_up_on date, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor']) then return; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, meta)
  values (p_ws, auth.uid(), 'care.view', 'care', '{}'::jsonb);
  return query
    select c.id, c.person_id, nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''), c.kind, c.body, c.status, c.follow_up_on, c.created_at, c.updated_at
    from toolkit_core.care_notes c left join toolkit_core.people p on p.id = c.person_id
    where c.workspace_id = p_ws
    order by (c.status = 'closed'), c.follow_up_on nulls last, c.created_at desc;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_save_care(p_ws uuid, p_id uuid, p_person uuid, p_kind text, p_body text, p_follow_up date, p_status text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid := p_id;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_kind not in ('prayer','care') then raise exception 'invalid kind'; end if;
  if p_status not in ('open','followed_up','closed') then raise exception 'invalid status'; end if;
  if p_body is null or char_length(trim(p_body)) = 0 or char_length(p_body) > 2000 then raise exception 'note must be 1 to 2000 characters'; end if;
  if p_person is not null and not exists (select 1 from toolkit_core.people where id = p_person and workspace_id = p_ws) then raise exception 'person not found'; end if;
  if v_id is null then
    insert into toolkit_core.care_notes (workspace_id, person_id, kind, body, status, follow_up_on, created_by)
    values (p_ws, p_person, p_kind, trim(p_body), p_status, p_follow_up, auth.uid()) returning id into v_id;
    insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta)
    values (p_ws, auth.uid(), 'care.create', 'care', v_id::text, jsonb_build_object('kind', p_kind));
  else
    update toolkit_core.care_notes set person_id = p_person, kind = p_kind, body = trim(p_body), status = p_status, follow_up_on = p_follow_up, updated_at = now()
      where id = v_id and workspace_id = p_ws;
    if not found then raise exception 'note not found'; end if;
    insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta)
    values (p_ws, auth.uid(), 'care.update', 'care', v_id::text, jsonb_build_object('status', p_status));
  end if;
  return v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_delete_care(p_ws uuid, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor']) then raise exception 'not allowed' using errcode = '42501'; end if;
  delete from toolkit_core.care_notes where id = p_id and workspace_id = p_ws;
  if not found then raise exception 'note not found'; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta)
  values (p_ws, auth.uid(), 'care.delete', 'care', p_id::text, '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_households(p_ws uuid)
 RETURNS TABLE(id uuid, name text, members jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then return; end if;
  return query
    select h.id, h.name,
      coalesce((select jsonb_agg(jsonb_build_object('person_id', p.id, 'name', trim(p.first_name || ' ' || coalesce(p.last_name,'')), 'role', m.role, 'age_group', p.age_group) order by (m.role = 'child'), p.first_name)
                from toolkit_core.household_members m join toolkit_core.people p on p.id = m.person_id where m.household_id = h.id), '[]'::jsonb)
    from toolkit_core.households h where h.workspace_id = p_ws order by h.name;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_save_household(p_ws uuid, p_id uuid, p_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v uuid := p_id;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_name is null or char_length(trim(p_name)) = 0 or char_length(p_name) > 120 then raise exception 'name must be 1 to 120 characters'; end if;
  if v is null then
    insert into toolkit_core.households (workspace_id, name, created_by) values (p_ws, trim(p_name), auth.uid()) returning id into v;
  else
    update toolkit_core.households set name = trim(p_name) where id = v and workspace_id = p_ws;
    if not found then raise exception 'household not found'; end if;
  end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta)
  values (p_ws, auth.uid(), case when p_id is null then 'household.create' else 'household.rename' end, 'household', v::text, '{}'::jsonb);
  return v;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_set_household_member(p_ws uuid, p_household uuid, p_person uuid, p_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_role not in ('adult','child','other') then raise exception 'invalid role'; end if;
  if not exists (select 1 from toolkit_core.households where id = p_household and workspace_id = p_ws) then raise exception 'household not found'; end if;
  if not exists (select 1 from toolkit_core.people where id = p_person and workspace_id = p_ws) then raise exception 'person not found'; end if;
  delete from toolkit_core.household_members where person_id = p_person;
  insert into toolkit_core.household_members (household_id, person_id, workspace_id, role) values (p_household, p_person, p_ws, p_role);
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta)
  values (p_ws, auth.uid(), 'household.member', 'household', p_household::text, jsonb_build_object('role', p_role));
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_remove_household_member(p_ws uuid, p_person uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  delete from toolkit_core.household_members where person_id = p_person and workspace_id = p_ws;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta)
  values (p_ws, auth.uid(), 'household.unlink', 'household', p_person::text, '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_delete_household(p_ws uuid, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  delete from toolkit_core.households where id = p_id and workspace_id = p_ws;
  if not found then raise exception 'household not found'; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta)
  values (p_ws, auth.uid(), 'household.delete', 'household', p_id::text, '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_set_attendance(p_ws uuid, p_plan uuid, p_count integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_count is not null and (p_count < 0 or p_count > 100000) then raise exception 'attendance must be between 0 and 100000'; end if;
  update toolkit_core.service_plans set attendance = p_count, updated_at = now() where id = p_plan and workspace_id = p_ws;
  if not found then raise exception 'service not found'; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta)
  values (p_ws, auth.uid(), 'attendance.set', 'service_plan', p_plan::text, jsonb_build_object('count', p_count));
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_service_trends(p_ws uuid, p_weeks integer DEFAULT 12)
 RETURNS TABLE(id uuid, title text, starts_at timestamp with time zone, attendance integer, roles_needed bigint, roles_filled bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then return; end if;
  p_weeks := least(greatest(coalesce(p_weeks, 12), 1), 104);
  return query
    select p.id, p.title, p.starts_at, p.attendance,
      coalesce((select sum(r.needed) from toolkit_core.service_roles r where r.plan_id = p.id), 0)::bigint,
      coalesce((select sum(least(r.needed, (select count(*) from toolkit_core.role_assignments a where a.role_id = r.id and a.status <> 'declined'))) from toolkit_core.service_roles r where r.plan_id = p.id), 0)::bigint
    from toolkit_core.service_plans p
    where p.workspace_id = p_ws and p.starts_at >= now() - make_interval(weeks => p_weeks) and p.starts_at <= now() + interval '14 days'
    order by p.starts_at;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_log_print(p_ws uuid, p_kind text, p_count integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_kind not in ('directory','households') then raise exception 'unknown print kind'; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, meta)
  values (p_ws, auth.uid(), 'print.' || p_kind, 'print', jsonb_build_object('count', greatest(coalesce(p_count, 0), 0)));
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_save_brand(p_ws uuid, p_primary text, p_accent text, p_heading text, p_body text, p_tagline text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  insert into toolkit_core.brand_kits (workspace_id, primary_color, accent_color, heading_font, body_font, tagline, updated_by, updated_at)
  values (p_ws, p_primary, p_accent, p_heading, p_body, nullif(trim(coalesce(p_tagline, '')), ''), auth.uid(), now())
  on conflict (workspace_id) do update set primary_color = excluded.primary_color, accent_color = excluded.accent_color, heading_font = excluded.heading_font,
    body_font = excluded.body_font, tagline = excluded.tagline, updated_by = excluded.updated_by, updated_at = now();
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, meta) values (p_ws, auth.uid(), 'brand.updated', 'brand', '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_announcements(p_ws uuid)
 RETURNS TABLE(id uuid, title text, body text, show_from date, show_until date, sort_order integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then return; end if;
  return query select a.id, a.title, a.body, a.show_from, a.show_until, a.sort_order from toolkit_core.announcements a where a.workspace_id = p_ws order by a.sort_order, a.created_at;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_save_announcement(p_ws uuid, p_id uuid, p_title text, p_body text, p_from date, p_until date, p_sort integer DEFAULT 0)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v uuid := p_id;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_title is null or char_length(trim(p_title)) = 0 or char_length(p_title) > 80 then raise exception 'title must be 1 to 80 characters'; end if;
  if p_body is not null and char_length(p_body) > 300 then raise exception 'text must be 300 characters or fewer'; end if;
  if p_until is not null and p_until < coalesce(p_from, current_date) then raise exception 'the end date is before the start date'; end if;
  if v is null then
    insert into toolkit_core.announcements (workspace_id, title, body, show_from, show_until, sort_order, created_by)
    values (p_ws, trim(p_title), nullif(trim(coalesce(p_body, '')), ''), coalesce(p_from, current_date), p_until, coalesce(p_sort, 0), auth.uid()) returning id into v;
  else
    update toolkit_core.announcements set title = trim(p_title), body = nullif(trim(coalesce(p_body, '')), ''), show_from = coalesce(p_from, current_date), show_until = p_until, sort_order = coalesce(p_sort, 0)
      where id = v and workspace_id = p_ws;
    if not found then raise exception 'announcement not found'; end if;
  end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'announcement.saved', 'announcement', v::text, '{}'::jsonb);
  return v;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_delete_announcement(p_ws uuid, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  delete from toolkit_core.announcements where id = p_id and workspace_id = p_ws;
  if not found then raise exception 'announcement not found'; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'announcement.deleted', 'announcement', p_id::text, '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_person_display(p_ws uuid, p_person uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v boolean;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then return null; end if;
  select ok_show_name into v from toolkit_core.people where id = p_person and workspace_id = p_ws;
  return coalesce(v, false);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_set_person_display(p_ws uuid, p_person uuid, p_name_ok boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare a text;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  select age_group into a from toolkit_core.people where id = p_person and workspace_id = p_ws;
  if not found then raise exception 'person not found'; end if;
  if coalesce(p_name_ok, false) and a is distinct from 'adult' then raise exception 'names are only shown for people marked as adults'; end if;
  update toolkit_core.people set ok_show_name = coalesce(p_name_ok, false) where id = p_person and workspace_id = p_ws;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'person.display_permission', 'person', p_person::text, jsonb_build_object('name_ok', coalesce(p_name_ok, false)));
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_sunday_slide_data(p_ws uuid, p_plan uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare pl record; w record; sday date; j jsonb;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then return null; end if;
  select * into pl from toolkit_core.service_plans where id = p_plan and workspace_id = p_ws;
  if not found then return null; end if;
  select name, timezone into w from toolkit_core.workspaces where id = p_ws;
  sday := (pl.starts_at at time zone w.timezone)::date;
  select jsonb_build_object(
    'church', w.name,
    'service', jsonb_build_object('id', pl.id, 'title', pl.title, 'starts_at', pl.starts_at, 'theme', pl.theme),
    'sermon', (select jsonb_build_object('title', s.title, 'speaker', s.speaker, 'scripture', s.scripture, 'series', ss.name)
               from toolkit_core.sermons s left join toolkit_core.sermon_series ss on ss.id = s.series_id
               where s.workspace_id = p_ws and s.preached_on = sday order by s.created_at limit 1),
    'announcements', coalesce((select jsonb_agg(jsonb_build_object('title', a.title, 'body', a.body) order by a.sort_order, a.created_at)
               from toolkit_core.announcements a where a.workspace_id = p_ws and a.show_from <= sday and (a.show_until is null or a.show_until >= sday)), '[]'::jsonb),
    'team', coalesce((select jsonb_agg(jsonb_build_object('role', t.role, 'names', t.names) order by t.pos)
               from (select r.name as role, r.position as pos, jsonb_agg(trim(pe.first_name || ' ' || coalesce(pe.last_name, '')) order by pe.first_name) as names
                     from toolkit_core.service_roles r
                     join toolkit_core.role_assignments ra on ra.role_id = r.id and ra.status = 'confirmed'
                     join toolkit_core.people pe on pe.id = ra.person_id and pe.workspace_id = p_ws and pe.ok_show_name and pe.age_group = 'adult'
                     where r.plan_id = pl.id group by r.name, r.position) t), '[]'::jsonb),
    'next_service', (select starts_at from toolkit_core.service_plans where workspace_id = p_ws and starts_at > pl.starts_at order by starts_at limit 1)
  ) into j;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'slides.prepared', 'service_plan', p_plan::text, '{}'::jsonb);
  return j;
end $function$
;

CREATE OR REPLACE FUNCTION toolkit_core.my_group_role(p_ws uuid, p_group uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select gm.role from toolkit_core.group_members gm
  join toolkit_core.people p on p.id = gm.person_id
  where gm.group_id = p_group and gm.workspace_id = p_ws and p.user_id = auth.uid() and toolkit_core.is_member(p_ws)
  limit 1;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_list_groups(p_ws uuid)
 RETURNS TABLE(id uuid, name text, kind text, description text, meets text, location text, is_open boolean, status text, member_count bigint, leaders text, my_role text, study_title text, current_position integer, lesson_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_staff boolean;
begin
  if not toolkit_core.is_member(p_ws) then return; end if;
  v_staff := toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']);
  return query
    select g.id, g.name, g.kind, g.description, g.meets, g.location, g.is_open, g.status,
      (select count(*) from toolkit_core.group_members m where m.group_id = g.id),
      (select string_agg(trim(p.first_name || ' ' || coalesce(p.last_name, '')), ', ' order by p.first_name) from toolkit_core.group_members m join toolkit_core.people p on p.id = m.person_id where m.group_id = g.id and m.role in ('leader','co_leader')),
      toolkit_core.my_group_role(p_ws, g.id),
      s.title, g.current_position,
      (select count(*) from toolkit_core.lessons l where l.study_id = g.study_id)
    from toolkit_core.groups g left join toolkit_core.studies s on s.id = g.study_id
    where g.workspace_id = p_ws and (v_staff or toolkit_core.my_group_role(p_ws, g.id) is not null)
    order by (g.status = 'archived'), g.name;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_get_group(p_ws uuid, p_group uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare g record; v_staff boolean; v_manage boolean; v_role text; v_lead boolean; j jsonb;
begin
  if not toolkit_core.is_member(p_ws) then return null; end if;
  select * into g from toolkit_core.groups where id = p_group and workspace_id = p_ws;
  if not found then return null; end if;
  v_staff := toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']);
  v_manage := toolkit_core.is_member(p_ws, array['owner','pastor','admin']);
  v_role := toolkit_core.my_group_role(p_ws, p_group);
  if not v_staff and v_role is null then return null; end if;
  v_lead := v_manage or coalesce(v_role in ('leader','co_leader'), false);
  select jsonb_build_object(
    'id', g.id, 'name', g.name, 'kind', g.kind, 'description', g.description, 'meets', g.meets, 'location', g.location, 'is_open', g.is_open, 'status', g.status,
    'public_listing', case when v_manage then g.public_listing else null end,
    'current_position', g.current_position, 'my_role', v_role, 'can_manage', v_manage, 'can_lead', v_lead,
    'members', coalesce((select jsonb_agg(jsonb_build_object('person_id', p.id, 'name', trim(p.first_name || ' ' || coalesce(p.last_name, '')), 'role', m.role) order by (m.role = 'member'), p.first_name)
                         from toolkit_core.group_members m join toolkit_core.people p on p.id = m.person_id where m.group_id = g.id), '[]'::jsonb),
    'meetings', case when v_lead then coalesce((select jsonb_agg(x order by x.held_on desc) from (
                         select mt.id, mt.held_on, mt.topic, l.title as lesson_title,
                           (select count(*) from toolkit_core.group_attendance a where a.meeting_id = mt.id and a.present) as present,
                           (select count(*) from toolkit_core.group_attendance a where a.meeting_id = mt.id) as total
                         from toolkit_core.group_meetings mt left join toolkit_core.lessons l on l.id = mt.lesson_id
                         where mt.group_id = g.id order by mt.held_on desc limit 12) x), '[]'::jsonb) else '[]'::jsonb end,
    'study', (select jsonb_build_object('id', s.id, 'title', s.title) from toolkit_core.studies s where s.id = g.study_id),
    'lessons', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'position', l.position, 'title', l.title, 'passage', l.passage, 'summary', l.summary, 'questions', l.questions,
                           'leader_notes', case when v_lead then l.leader_notes else null end) order by l.position)
                         from toolkit_core.lessons l where l.study_id = g.study_id), '[]'::jsonb)
  ) into j;
  return j;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_save_group(p_ws uuid, p_id uuid, p_name text, p_kind text, p_description text, p_meets text, p_location text, p_open boolean, p_status text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v uuid := p_id;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_name is null or char_length(trim(p_name)) = 0 or char_length(p_name) > 80 then raise exception 'name must be 1 to 80 characters'; end if;
  if p_kind not in ('bible_study','small_group','class','prayer') then raise exception 'invalid kind'; end if;
  if p_status not in ('active','archived') then raise exception 'invalid status'; end if;
  if v is null then
    insert into toolkit_core.groups (workspace_id, name, kind, description, meets, location, is_open, status, created_by)
    values (p_ws, trim(p_name), p_kind, nullif(trim(coalesce(p_description,'')),''), nullif(trim(coalesce(p_meets,'')),''), nullif(trim(coalesce(p_location,'')),''), coalesce(p_open,false), p_status, auth.uid()) returning id into v;
  else
    update toolkit_core.groups set name = trim(p_name), kind = p_kind, description = nullif(trim(coalesce(p_description,'')),''), meets = nullif(trim(coalesce(p_meets,'')),''), location = nullif(trim(coalesce(p_location,'')),''), is_open = coalesce(p_open,false), status = p_status
      where id = v and workspace_id = p_ws;
    if not found then raise exception 'group not found'; end if;
  end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), case when p_id is null then 'group.created' else 'group.updated' end, 'group', v::text, '{}'::jsonb);
  return v;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_delete_group(p_ws uuid, p_group uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  delete from toolkit_core.groups where id = p_group and workspace_id = p_ws;
  if not found then raise exception 'group not found'; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'group.deleted', 'group', p_group::text, '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_set_group_member(p_ws uuid, p_group uuid, p_person uuid, p_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare a text;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_role not in ('leader','co_leader','member') then raise exception 'invalid role'; end if;
  if not exists (select 1 from toolkit_core.groups where id = p_group and workspace_id = p_ws) then raise exception 'group not found'; end if;
  select age_group into a from toolkit_core.people where id = p_person and workspace_id = p_ws;
  if not found then raise exception 'person not found'; end if;
  if a = 'minor' then raise exception 'groups are for adults for now; student groups need the children''s safety rules first'; end if;
  insert into toolkit_core.group_members (group_id, person_id, workspace_id, role) values (p_group, p_person, p_ws, p_role)
  on conflict (group_id, person_id) do update set role = excluded.role;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'group.member', 'group', p_group::text, jsonb_build_object('role', p_role));
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_remove_group_member(p_ws uuid, p_group uuid, p_person uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  delete from toolkit_core.group_members where group_id = p_group and person_id = p_person and workspace_id = p_ws;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'group.unlink', 'group', p_group::text, '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_record_meeting(p_ws uuid, p_group uuid, p_held date, p_lesson uuid, p_topic text, p_notes text, p_present uuid[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare g record; v uuid; lp int; pid uuid;
begin
  if not toolkit_core.is_member(p_ws) then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into g from toolkit_core.groups where id = p_group and workspace_id = p_ws;
  if not found then raise exception 'group not found'; end if;
  if not (toolkit_core.is_member(p_ws, array['owner','pastor','admin']) or coalesce(toolkit_core.my_group_role(p_ws, p_group) in ('leader','co_leader'), false)) then raise exception 'not allowed' using errcode = '42501'; end if;
  if g.status <> 'active' then raise exception 'this group is archived'; end if;
  if p_held is null or p_held > current_date + 1 or p_held < current_date - 365 then raise exception 'choose a date within the last year, not in the future'; end if;
  if p_lesson is not null then
    select position into lp from toolkit_core.lessons where id = p_lesson and study_id = g.study_id;
    if not found then raise exception 'that lesson is not part of this group''s study'; end if;
  end if;
  foreach pid in array coalesce(p_present, '{}'::uuid[]) loop
    if not exists (select 1 from toolkit_core.group_members where group_id = p_group and person_id = pid) then raise exception 'someone marked present is not in this group'; end if;
  end loop;
  insert into toolkit_core.group_meetings (group_id, workspace_id, held_on, lesson_id, topic, leader_notes, created_by)
  values (p_group, p_ws, p_held, p_lesson, nullif(trim(coalesce(p_topic,'')),''), nullif(trim(coalesce(p_notes,'')),''), auth.uid()) returning id into v;
  insert into toolkit_core.group_attendance (meeting_id, person_id, workspace_id, present)
  select v, m.person_id, p_ws, m.person_id = any (coalesce(p_present, '{}'::uuid[])) from toolkit_core.group_members m where m.group_id = p_group;
  if lp is not null and lp >= g.current_position then update toolkit_core.groups set current_position = lp + 1 where id = p_group; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'group.meeting', 'group', p_group::text, '{}'::jsonb);
  return v;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_set_group_study(p_ws uuid, p_group uuid, p_study uuid, p_position integer DEFAULT 1)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_study is not null and not exists (select 1 from toolkit_core.studies where id = p_study and workspace_id = p_ws) then raise exception 'study not found'; end if;
  update toolkit_core.groups set study_id = p_study, current_position = greatest(coalesce(p_position, 1), 1) where id = p_group and workspace_id = p_ws;
  if not found then raise exception 'group not found'; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'group.study', 'group', p_group::text, '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_studies(p_ws uuid)
 RETURNS TABLE(id uuid, title text, description text, lesson_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then return; end if;
  return query select s.id, s.title, s.description, (select count(*) from toolkit_core.lessons l where l.study_id = s.id) from toolkit_core.studies s where s.workspace_id = p_ws order by s.title;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_get_study(p_ws uuid, p_study uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare j jsonb;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then return null; end if;
  select jsonb_build_object('id', s.id, 'title', s.title, 'description', s.description,
    'lessons', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'position', l.position, 'title', l.title, 'passage', l.passage, 'summary', l.summary, 'questions', l.questions, 'leader_notes', l.leader_notes) order by l.position) from toolkit_core.lessons l where l.study_id = s.id), '[]'::jsonb))
  into j from toolkit_core.studies s where s.id = p_study and s.workspace_id = p_ws;
  return j;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_save_study(p_ws uuid, p_id uuid, p_title text, p_description text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v uuid := p_id;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_title is null or char_length(trim(p_title)) = 0 or char_length(p_title) > 120 then raise exception 'title must be 1 to 120 characters'; end if;
  if v is null then
    insert into toolkit_core.studies (workspace_id, title, description, created_by) values (p_ws, trim(p_title), nullif(trim(coalesce(p_description,'')),''), auth.uid()) returning id into v;
  else
    update toolkit_core.studies set title = trim(p_title), description = nullif(trim(coalesce(p_description,'')),'') where id = v and workspace_id = p_ws;
    if not found then raise exception 'study not found'; end if;
  end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'study.saved', 'study', v::text, '{}'::jsonb);
  return v;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_delete_study(p_ws uuid, p_study uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  delete from toolkit_core.studies where id = p_study and workspace_id = p_ws;
  if not found then raise exception 'study not found'; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'study.deleted', 'study', p_study::text, '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_save_lesson(p_ws uuid, p_study uuid, p_id uuid, p_title text, p_passage text, p_summary text, p_questions text, p_notes text, p_position integer DEFAULT NULL::integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v uuid := p_id; pos int;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from toolkit_core.studies where id = p_study and workspace_id = p_ws) then raise exception 'study not found'; end if;
  if p_title is null or char_length(trim(p_title)) = 0 or char_length(p_title) > 120 then raise exception 'title must be 1 to 120 characters'; end if;
  if v is null then
    select coalesce(max(position), 0) + 1 into pos from toolkit_core.lessons where study_id = p_study;
    insert into toolkit_core.lessons (study_id, workspace_id, position, title, passage, summary, questions, leader_notes)
    values (p_study, p_ws, coalesce(p_position, pos), trim(p_title), nullif(trim(coalesce(p_passage,'')),''), nullif(trim(coalesce(p_summary,'')),''), nullif(trim(coalesce(p_questions,'')),''), nullif(trim(coalesce(p_notes,'')),'')) returning id into v;
  else
    update toolkit_core.lessons set title = trim(p_title), passage = nullif(trim(coalesce(p_passage,'')),''), summary = nullif(trim(coalesce(p_summary,'')),''), questions = nullif(trim(coalesce(p_questions,'')),''), leader_notes = nullif(trim(coalesce(p_notes,'')),''), position = coalesce(p_position, position)
      where id = v and study_id = p_study and workspace_id = p_ws;
    if not found then raise exception 'lesson not found'; end if;
  end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'lesson.saved', 'study', p_study::text, '{}'::jsonb);
  return v;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_delete_lesson(p_ws uuid, p_lesson uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_title text;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin']) then raise exception 'not allowed' using errcode='42501'; end if;
  delete from toolkit_core.lessons where id=p_lesson and workspace_id=p_ws returning title into v_title;
  if not found then raise exception 'lesson not found'; end if;
  insert into toolkit_core.audit_events(workspace_id,actor_id,action,target_type,target_id,meta)
  values(p_ws,auth.uid(),'lesson.deleted','lesson',p_lesson::text,jsonb_build_object('title',v_title));
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_study_from_sermon(p_ws uuid, p_sermon uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare s record; v uuid;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  select title, scripture, summary into s from toolkit_core.sermons where id = p_sermon and workspace_id = p_ws;
  if not found then raise exception 'sermon not found'; end if;
  insert into toolkit_core.studies (workspace_id, title, description, created_by) values (p_ws, left('Study: ' || s.title, 120), 'Made from a sermon. Add discussion questions.', auth.uid()) returning id into v;
  insert into toolkit_core.lessons (study_id, workspace_id, position, title, passage, summary) values (v, p_ws, 1, s.title, s.scripture, s.summary);
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'study.from_sermon', 'study', v::text, '{}'::jsonb);
  return v;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_get_brand(p_ws uuid)
 RETURNS TABLE(primary_color text, accent_color text, heading_font text, body_font text, tagline text, logo text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws) then return; end if;
  return query
    select coalesce(b.primary_color, '#12312b'), coalesce(b.accent_color, '#c39a4a'), coalesce(b.heading_font, 'Georgia'), coalesce(b.body_font, 'Calibri'), b.tagline, b.logo
    from (select 1) x left join toolkit_core.brand_kits b on b.workspace_id = p_ws;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_set_brand_logo(p_ws uuid, p_logo text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  insert into toolkit_core.brand_kits (workspace_id, logo, updated_by, updated_at) values (p_ws, p_logo, auth.uid(), now())
  on conflict (workspace_id) do update set logo = excluded.logo, updated_by = excluded.updated_by, updated_at = now();
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, meta) values (p_ws, auth.uid(), case when p_logo is null then 'brand.logo_removed' else 'brand.logo_set' end, 'brand', '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_get_groups_page(p_ws uuid)
 RETURNS TABLE(slug text, groups_public boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  insert into toolkit_core.connect_pages (workspace_id, slug) values (p_ws, encode(extensions.gen_random_bytes(12), 'hex')) on conflict do nothing;
  return query select c.slug, c.groups_public from toolkit_core.connect_pages c where c.workspace_id = p_ws;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_set_groups_public(p_ws uuid, p_enabled boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  insert into toolkit_core.connect_pages (workspace_id, slug) values (p_ws, encode(extensions.gen_random_bytes(12), 'hex')) on conflict do nothing;
  update toolkit_core.connect_pages set groups_public = coalesce(p_enabled, false) where workspace_id = p_ws;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, meta) values (p_ws, auth.uid(), 'groups_page.' || case when p_enabled then 'on' else 'off' end, 'groups_page', '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_set_group_listing(p_ws uuid, p_group uuid, p_listed boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  update toolkit_core.groups set public_listing = coalesce(p_listed, false) where id = p_group and workspace_id = p_ws;
  if not found then raise exception 'group not found'; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'group.listing', 'group', p_group::text, jsonb_build_object('listed', coalesce(p_listed, false)));
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_public_groups_info(p_slug text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object('church', w.name,
    'groups', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'kind', g.kind, 'meets', g.meets, 'description', g.description) order by g.name)
                        from toolkit_core.groups g where g.workspace_id = c.workspace_id and g.public_listing and g.is_open and g.status = 'active'), '[]'::jsonb))
  from toolkit_core.connect_pages c join toolkit_core.workspaces w on w.id = c.workspace_id
  where c.slug = p_slug and c.groups_public;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_public_group_request(p_slug text, p_group uuid, p_first text, p_last text, p_email text, p_phone text, p_adult boolean, p_contact_ok boolean, p_website text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_ws uuid; v_first text := left(trim(coalesce(p_first,'')), 80); v_last text := left(trim(coalesce(p_last,'')), 80);
  v_email text := nullif(lower(trim(coalesce(p_email,''))), ''); v_phone text := nullif(trim(coalesce(p_phone,'')), ''); v_digits text;
  v_ip text; v_iph text; v_person uuid; v_existing uuid; v_gname text;
begin
  select workspace_id into v_ws from toolkit_core.connect_pages where slug = coalesce(p_slug,'') and groups_public;
  if v_ws is null then raise exception 'This page is not available' using errcode = 'P0002'; end if;
  begin v_ip := split_part(coalesce((current_setting('request.headers', true)::jsonb) ->> 'x-forwarded-for', 'unknown'), ',', 1); exception when others then v_ip := 'unknown'; end;
  v_iph := encode(extensions.digest(convert_to(v_ip || ':' || p_slug, 'utf8'), 'sha256'), 'hex');
  if (select count(*) from toolkit_core.group_requests where ip_hash = v_iph and created_at > now() - interval '1 hour') >= 5
     or (select count(*) from toolkit_core.group_requests where workspace_id = v_ws and created_at > now() - interval '1 hour') >= 30
     or (select count(*) from toolkit_core.group_requests where workspace_id = v_ws and created_at > now() - interval '1 day') >= 200 then
    raise exception 'Too many requests right now. Please try again later.' using errcode = '54000';
  end if;
  select name into v_gname from toolkit_core.groups where id = p_group and workspace_id = v_ws and public_listing and is_open and status = 'active';
  if v_gname is null then raise exception 'This group is not available' using errcode = 'P0002'; end if;
  if coalesce(p_website,'') <> '' then
    insert into toolkit_core.group_requests (workspace_id, group_id, status, reason, ip_hash) values (v_ws, p_group, 'rejected', 'honeypot', v_iph);
    return 'ok';
  end if;
  if v_first = '' then raise exception 'Please enter your first name' using errcode = '22023'; end if;
  if not coalesce(p_adult, false) then raise exception 'Please ask a parent or guardian to fill this out for you' using errcode = '22023'; end if;
  if v_email is null and v_phone is null then raise exception 'Please give an email or a phone number so we can reach you' using errcode = '22023'; end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then raise exception 'That email does not look right' using errcode = '22023'; end if;
  v_digits := regexp_replace(coalesce(v_phone,''), '\D', '', 'g');
  if v_phone is not null and (char_length(v_digits) < 7 or char_length(v_digits) > 15) then raise exception 'That phone number does not look right' using errcode = '22023'; end if;

  select p.id into v_existing from toolkit_core.people p where p.workspace_id = v_ws and (
    (v_email is not null and lower(p.email) = v_email) or (v_digits <> '' and regexp_replace(coalesce(p.phone,''), '\D', '', 'g') = v_digits)) limit 1;
  if v_existing is null then
    insert into toolkit_core.people (workspace_id, first_name, last_name, email, phone, status, age_group)
    values (v_ws, v_first, v_last, v_email, case when char_length(v_digits) >= 7 then v_digits else null end, 'guest', 'adult') returning id into v_person;
    if coalesce(p_contact_ok, false) then
      if v_email is not null then insert into toolkit_core.consents (workspace_id, person_id, purpose, channel, status, source, evidence) values (v_ws, v_person, 'group_reminders', 'email', 'granted', 'find_a_group', 'Ticked the box when asking to join a group'); end if;
      if char_length(v_digits) >= 7 then insert into toolkit_core.consents (workspace_id, person_id, purpose, channel, status, source, evidence) values (v_ws, v_person, 'group_reminders', 'sms', 'granted', 'find_a_group', 'Ticked the box when asking to join a group'); end if;
    end if;
  else
    v_person := v_existing;
  end if;

  -- one open request per person and group
  if exists (select 1 from toolkit_core.group_requests where group_id = p_group and person_id = v_person and status = 'new') then return 'ok'; end if;
  insert into toolkit_core.group_requests (workspace_id, group_id, person_id, first_name, last_name, email, phone, contact_ok, ip_hash)
  values (v_ws, p_group, v_person, v_first, v_last, v_email, v_phone, coalesce(p_contact_ok, false), v_iph);
  insert into toolkit_core.tasks (workspace_id, title, notes, due_date, source)
  values (v_ws, left('Group request: ' || trim(v_first || ' ' || v_last) || ' for ' || v_gname, 200), null, current_date + 2, 'system');
  insert into toolkit_core.audit_events (workspace_id, action, target_type, target_id, meta) values (v_ws, 'group_request.submitted', 'group', p_group::text, '{}'::jsonb);
  return 'ok';
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_group_requests(p_ws uuid)
 RETURNS TABLE(id uuid, group_id uuid, group_name text, first_name text, last_name text, email text, phone text, contact_ok boolean, status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then return; end if;
  return query select r.id, r.group_id, g.name, r.first_name, r.last_name, r.email, r.phone, r.contact_ok, r.status, r.created_at
    from toolkit_core.group_requests r join toolkit_core.groups g on g.id = r.group_id
    where r.workspace_id = p_ws and r.status in ('new','added','declined')
    order by (r.status <> 'new'), r.created_at desc limit 100;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_resolve_group_request(p_ws uuid, p_id uuid, p_action text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r record; a text;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_action not in ('added','declined') then raise exception 'invalid action'; end if;
  select * into r from toolkit_core.group_requests where id = p_id and workspace_id = p_ws and status = 'new';
  if not found then raise exception 'request not found'; end if;
  if p_action = 'added' then
    if r.person_id is null then raise exception 'this person no longer exists'; end if;
    select age_group into a from toolkit_core.people where id = r.person_id;
    if a = 'minor' then raise exception 'groups are for adults for now'; end if;
    insert into toolkit_core.group_members (group_id, person_id, workspace_id, role) values (r.group_id, r.person_id, p_ws, 'member') on conflict (group_id, person_id) do nothing;
  end if;
  update toolkit_core.group_requests set status = p_action, resolved_by = auth.uid(), resolved_at = now() where id = p_id;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'group_request.' || p_action, 'group', r.group_id::text, '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_get_events_page(p_ws uuid)
 RETURNS TABLE(slug text, events_public boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  insert into toolkit_core.connect_pages (workspace_id, slug) values (p_ws, encode(extensions.gen_random_bytes(12), 'hex')) on conflict do nothing;
  return query select c.slug, c.events_public from toolkit_core.connect_pages c where c.workspace_id = p_ws;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_set_events_public(p_ws uuid, p_enabled boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  insert into toolkit_core.connect_pages (workspace_id, slug) values (p_ws, encode(extensions.gen_random_bytes(12), 'hex')) on conflict do nothing;
  update toolkit_core.connect_pages set events_public = coalesce(p_enabled, false) where workspace_id = p_ws;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, meta) values (p_ws, auth.uid(), 'events_page.' || case when p_enabled then 'on' else 'off' end, 'events_page', '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_set_event_signup(p_ws uuid, p_item uuid, p_enabled boolean, p_capacity integer, p_blurb text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare i record;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into i from toolkit_core.calendar_items where id = p_item and workspace_id = p_ws;
  if not found then raise exception 'event not found'; end if;
  if not coalesce(p_enabled, false) then
    delete from toolkit_core.event_signups where item_id = p_item;
  else
    if coalesce(i.recurrence, 'none') not in ('none','') then raise exception 'Sign-up works for one-time events. Make a separate event for each date.'; end if;
    insert into toolkit_core.event_signups (item_id, workspace_id, capacity, blurb) values (p_item, p_ws, p_capacity, nullif(left(trim(coalesce(p_blurb,'')), 600), ''))
    on conflict (item_id) do update set capacity = excluded.capacity, blurb = excluded.blurb;
  end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'event_signup.' || case when p_enabled then 'on' else 'off' end, 'calendar_item', p_item::text, '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_get_event_signup(p_ws uuid, p_item uuid)
 RETURNS TABLE(enabled boolean, capacity integer, blurb text, registered bigint, waitlist bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then return; end if;
  return query select (s.item_id is not null), s.capacity, s.blurb,
    coalesce((select sum(r.party_size) from toolkit_core.event_registrations r where r.item_id = p_item and r.status = 'registered'), 0)::bigint,
    (select count(*) from toolkit_core.event_registrations r where r.item_id = p_item and r.status = 'waitlist')
  from (select 1) x left join toolkit_core.event_signups s on s.item_id = p_item and s.workspace_id = p_ws;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_list_event_registrations(p_ws uuid, p_item uuid)
 RETURNS TABLE(id uuid, first_name text, last_name text, email text, phone text, party_size integer, contact_ok boolean, status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then return; end if;
  return query select r.id, r.first_name, r.last_name, r.email, r.phone, r.party_size, r.contact_ok, r.status, r.created_at
    from toolkit_core.event_registrations r where r.workspace_id = p_ws and r.item_id = p_item and r.status in ('registered','waitlist') order by (r.status = 'waitlist'), r.created_at;
end $function$
;

CREATE OR REPLACE FUNCTION toolkit_core.promote_waitlist(p_item uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare cap int; used int; w record;
begin
  select capacity into cap from toolkit_core.event_signups where item_id = p_item for update;
  if cap is null then update toolkit_core.event_registrations set status = 'registered' where item_id = p_item and status = 'waitlist'; return; end if;
  select coalesce(sum(party_size),0) into used from toolkit_core.event_registrations where item_id = p_item and status = 'registered';
  -- first come, first served: stop at the first person who does not fit
  for w in select * from toolkit_core.event_registrations where item_id = p_item and status = 'waitlist' order by created_at loop
    if used + w.party_size <= cap then
      update toolkit_core.event_registrations set status = 'registered' where id = w.id; used := used + w.party_size;
      insert into toolkit_core.tasks (workspace_id, title, due_date, source) values (w.workspace_id, left('Waitlist spot opened: tell ' || trim(coalesce(w.first_name,'') || ' ' || coalesce(w.last_name,'')), 200), current_date + 1, 'system');
    else exit; end if;
  end loop;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_cancel_event_registration(p_ws uuid, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r record;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into r from toolkit_core.event_registrations where id = p_id and workspace_id = p_ws and status in ('registered','waitlist');
  if not found then raise exception 'registration not found'; end if;
  update toolkit_core.event_registrations set status = 'cancelled' where id = p_id;
  perform toolkit_core.promote_waitlist(r.item_id);
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'event_registration.cancelled', 'calendar_item', r.item_id::text, '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_public_events_info(p_slug text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object('church', w.name, 'events', coalesce((
    select jsonb_agg(jsonb_build_object('id', i.id, 'title', i.title, 'starts_at', i.starts_at, 'all_day', i.all_day, 'location', i.location, 'blurb', s.blurb,
      'spots_left', case when s.capacity is null then null else greatest(s.capacity - coalesce((select sum(r.party_size) from toolkit_core.event_registrations r where r.item_id = i.id and r.status = 'registered'), 0), 0) end,
      'full', s.capacity is not null and coalesce((select sum(r.party_size) from toolkit_core.event_registrations r where r.item_id = i.id and r.status = 'registered'), 0) >= s.capacity) order by i.starts_at)
    from toolkit_core.event_signups s join toolkit_core.calendar_items i on i.id = s.item_id
    where s.workspace_id = c.workspace_id and i.starts_at > now()), '[]'::jsonb))
  from toolkit_core.connect_pages c join toolkit_core.workspaces w on w.id = c.workspace_id
  where c.slug = p_slug and c.events_public;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_public_event_register(p_slug text, p_item uuid, p_first text, p_last text, p_email text, p_phone text, p_party integer, p_adult boolean, p_contact_ok boolean, p_website text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_ws uuid; v_first text := left(trim(coalesce(p_first,'')), 80); v_last text := left(trim(coalesce(p_last,'')), 80);
  v_email text := nullif(lower(trim(coalesce(p_email,''))), ''); v_phone text := nullif(trim(coalesce(p_phone,'')), ''); v_digits text;
  v_ip text; v_iph text; v_person uuid; v_existing uuid; v_title text; v_cap int; v_used int; v_status text; v_party int := coalesce(p_party, 1);
begin
  select workspace_id into v_ws from toolkit_core.connect_pages where slug = coalesce(p_slug,'') and events_public;
  if v_ws is null then raise exception 'This page is not available' using errcode = 'P0002'; end if;
  begin v_ip := split_part(coalesce((current_setting('request.headers', true)::jsonb) ->> 'x-forwarded-for', 'unknown'), ',', 1); exception when others then v_ip := 'unknown'; end;
  v_iph := encode(extensions.digest(convert_to(v_ip || ':' || p_slug, 'utf8'), 'sha256'), 'hex');
  if (select count(*) from toolkit_core.event_registrations where ip_hash = v_iph and created_at > now() - interval '1 hour') >= 5
     or (select count(*) from toolkit_core.event_registrations where workspace_id = v_ws and created_at > now() - interval '1 hour') >= 60
     or (select count(*) from toolkit_core.event_registrations where workspace_id = v_ws and created_at > now() - interval '1 day') >= 500 then
    raise exception 'Too many requests right now. Please try again later.' using errcode = '54000';
  end if;
  -- lock the event's sign-up row so two people cannot take the last spot at once
  select i.title, s.capacity into v_title, v_cap from toolkit_core.event_signups s join toolkit_core.calendar_items i on i.id = s.item_id
    where s.item_id = p_item and s.workspace_id = v_ws and i.starts_at > now() for update of s;
  if v_title is null then raise exception 'This event is not available' using errcode = 'P0002'; end if;
  if coalesce(p_website,'') <> '' then
    insert into toolkit_core.event_registrations (workspace_id, item_id, status, ip_hash) values (v_ws, p_item, 'rejected', v_iph);
    return 'registered';
  end if;
  if v_first = '' then raise exception 'Please enter your first name' using errcode = '22023'; end if;
  if not coalesce(p_adult, false) then raise exception 'Please ask a parent or guardian to sign up for you' using errcode = '22023'; end if;
  if v_party < 1 or v_party > 6 then raise exception 'You can sign up between 1 and 6 people at a time' using errcode = '22023'; end if;
  if v_email is null and v_phone is null then raise exception 'Please give an email or a phone number so we can reach you' using errcode = '22023'; end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then raise exception 'That email does not look right' using errcode = '22023'; end if;
  v_digits := regexp_replace(coalesce(v_phone,''), '\D', '', 'g');
  if v_phone is not null and (char_length(v_digits) < 7 or char_length(v_digits) > 15) then raise exception 'That phone number does not look right' using errcode = '22023'; end if;

  select p.id into v_existing from toolkit_core.people p where p.workspace_id = v_ws and (
    (v_email is not null and lower(p.email) = v_email) or (v_digits <> '' and regexp_replace(coalesce(p.phone,''), '\D', '', 'g') = v_digits)) limit 1;
  if v_existing is null then
    insert into toolkit_core.people (workspace_id, first_name, last_name, email, phone, status, age_group)
    values (v_ws, v_first, v_last, v_email, case when char_length(v_digits) >= 7 then v_digits else null end, 'guest', 'adult') returning id into v_person;
    if coalesce(p_contact_ok, false) then
      if v_email is not null then insert into toolkit_core.consents (workspace_id, person_id, purpose, channel, status, source, evidence) values (v_ws, v_person, 'event_updates', 'email', 'granted', 'event_signup', 'Ticked the box when signing up for an event'); end if;
      if char_length(v_digits) >= 7 then insert into toolkit_core.consents (workspace_id, person_id, purpose, channel, status, source, evidence) values (v_ws, v_person, 'event_updates', 'sms', 'granted', 'event_signup', 'Ticked the box when signing up for an event'); end if;
    end if;
  else v_person := v_existing; end if;

  if exists (select 1 from toolkit_core.event_registrations where item_id = p_item and person_id = v_person and status in ('registered','waitlist')) then
    select status into v_status from toolkit_core.event_registrations where item_id = p_item and person_id = v_person and status in ('registered','waitlist') limit 1;
    return v_status;
  end if;
  select coalesce(sum(party_size),0) into v_used from toolkit_core.event_registrations where item_id = p_item and status = 'registered';
  v_status := case when v_cap is null or v_used + v_party <= v_cap then 'registered' else 'waitlist' end;
  insert into toolkit_core.event_registrations (workspace_id, item_id, person_id, first_name, last_name, email, phone, party_size, contact_ok, status, ip_hash)
  values (v_ws, p_item, v_person, v_first, v_last, v_email, v_phone, v_party, coalesce(p_contact_ok, false), v_status, v_iph);
  insert into toolkit_core.audit_events (workspace_id, action, target_type, target_id, meta) values (v_ws, 'event_registration.' || v_status, 'calendar_item', p_item::text, '{}'::jsonb);
  return v_status;
end $function$
;

CREATE OR REPLACE FUNCTION toolkit_core.can_see_partner(p_ws uuid, p_sensitive boolean)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select case when p_sensitive then coalesce(toolkit_core.is_member(p_ws, array['owner','pastor','admin']), false)
              else coalesce(toolkit_core.is_member(p_ws), false) end;
$function$
;

CREATE OR REPLACE FUNCTION public.tk_list_partners(p_ws uuid)
 RETURNS TABLE(id uuid, name text, kind text, region text, summary text, status text, sensitive boolean, monthly_support numeric, last_update date, prayer_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_fin boolean;
begin
  if not toolkit_core.is_member(p_ws) then return; end if;
  v_fin := coalesce(toolkit_core.is_member(p_ws, array['owner','pastor','admin','treasurer']), false);
  return query select p.id, p.name, p.kind, p.region, p.summary, p.status, p.sensitive, case when v_fin then p.monthly_support else null end,
    (select max(u.posted_on) from toolkit_core.mission_updates u where u.partner_id = p.id),
    (select count(*) from toolkit_core.mission_updates u where u.partner_id = p.id and u.is_prayer and u.posted_on > current_date - 45)
  from toolkit_core.mission_partners p
  where p.workspace_id = p_ws and toolkit_core.can_see_partner(p_ws, p.sensitive)
  order by (p.status = 'archived'), p.name;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_get_partner(p_ws uuid, p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p record; v_manage boolean; v_fin boolean;
begin
  if not toolkit_core.is_member(p_ws) then return null; end if;
  select * into p from toolkit_core.mission_partners where id = p_id and workspace_id = p_ws;
  if not found or not toolkit_core.can_see_partner(p_ws, p.sensitive) then return null; end if;
  v_manage := coalesce(toolkit_core.is_member(p_ws, array['owner','pastor','admin']), false);
  v_fin := coalesce(toolkit_core.is_member(p_ws, array['owner','pastor','admin','treasurer']), false);
  return jsonb_build_object('id', p.id, 'name', p.name, 'kind', p.kind, 'region', p.region, 'summary', p.summary, 'status', p.status, 'sensitive', p.sensitive,
    'can_manage', v_manage,
    'contact_name', case when v_manage then p.contact_name end, 'email', case when v_manage then p.email end, 'phone', case when v_manage then p.phone end,
    'monthly_support', case when v_fin then p.monthly_support end,
    'updates', coalesce((select jsonb_agg(jsonb_build_object('id', u.id, 'title', u.title, 'body', u.body, 'posted_on', u.posted_on, 'is_prayer', u.is_prayer) order by u.posted_on desc, u.created_at desc)
                         from toolkit_core.mission_updates u where u.partner_id = p.id), '[]'::jsonb));
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_save_partner(p_ws uuid, p_id uuid, p_name text, p_kind text, p_region text, p_summary text, p_contact text, p_email text, p_phone text, p_support numeric, p_sensitive boolean, p_status text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid := p_id; old boolean;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_id is null then
    insert into toolkit_core.mission_partners (workspace_id, name, kind, region, summary, contact_name, email, phone, monthly_support, sensitive, status)
    values (p_ws, trim(p_name), coalesce(p_kind,'missionary'), nullif(trim(coalesce(p_region,'')),''), nullif(trim(coalesce(p_summary,'')),''), nullif(trim(coalesce(p_contact,'')),''), nullif(trim(coalesce(p_email,'')),''), nullif(trim(coalesce(p_phone,'')),''), p_support, coalesce(p_sensitive,false), coalesce(p_status,'active'))
    returning id into v_id;
    insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'partner.created', 'partner', v_id::text, '{}'::jsonb);
  else
    select sensitive into old from toolkit_core.mission_partners where id = p_id and workspace_id = p_ws;
    if not found then raise exception 'partner not found'; end if;
    update toolkit_core.mission_partners set name = trim(p_name), kind = coalesce(p_kind,'missionary'), region = nullif(trim(coalesce(p_region,'')),''), summary = nullif(trim(coalesce(p_summary,'')),''),
      contact_name = nullif(trim(coalesce(p_contact,'')),''), email = nullif(trim(coalesce(p_email,'')),''), phone = nullif(trim(coalesce(p_phone,'')),''), monthly_support = p_support,
      sensitive = coalesce(p_sensitive,false), status = coalesce(p_status,'active') where id = p_id and workspace_id = p_ws;
    if old is distinct from coalesce(p_sensitive,false) then
      insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'partner.sensitivity_changed', 'partner', p_id::text, jsonb_build_object('sensitive', coalesce(p_sensitive,false)));
    end if;
  end if;
  return v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_delete_partner(p_ws uuid, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  delete from toolkit_core.mission_partners where id = p_id and workspace_id = p_ws;
  if not found then raise exception 'partner not found'; end if;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'partner.deleted', 'partner', p_id::text, '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_save_partner_update(p_ws uuid, p_partner uuid, p_id uuid, p_title text, p_body text, p_posted date, p_prayer boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid := p_id;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from toolkit_core.mission_partners where id = p_partner and workspace_id = p_ws) then raise exception 'partner not found'; end if;
  if p_id is null then
    insert into toolkit_core.mission_updates (workspace_id, partner_id, title, body, posted_on, is_prayer, created_by)
    values (p_ws, p_partner, trim(p_title), nullif(trim(coalesce(p_body,'')),''), coalesce(p_posted, current_date), coalesce(p_prayer,false), auth.uid()) returning id into v_id;
  else
    update toolkit_core.mission_updates set title = trim(p_title), body = nullif(trim(coalesce(p_body,'')),''), posted_on = coalesce(p_posted, posted_on), is_prayer = coalesce(p_prayer,false)
      where id = p_id and workspace_id = p_ws and partner_id = p_partner;
    if not found then raise exception 'update not found'; end if;
  end if;
  return v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_delete_partner_update(p_ws uuid, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_title text;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin']) then raise exception 'not allowed' using errcode='42501'; end if;
  delete from toolkit_core.mission_updates where id=p_id and workspace_id=p_ws returning title into v_title;
  if not found then raise exception 'update not found'; end if;
  insert into toolkit_core.audit_events(workspace_id,actor_id,action,target_type,target_id,meta)
  values(p_ws,auth.uid(),'mission_update.deleted','mission_update',p_id::text,jsonb_build_object('title',v_title));
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_list_prayer_updates(p_ws uuid)
 RETURNS TABLE(id uuid, partner_id uuid, partner_name text, title text, body text, posted_on date)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws) then return; end if;
  return query select u.id, p.id, p.name, u.title, u.body, u.posted_on
    from toolkit_core.mission_updates u join toolkit_core.mission_partners p on p.id = u.partner_id
    where u.workspace_id = p_ws and u.is_prayer and u.posted_on > current_date - 45 and p.status = 'active' and toolkit_core.can_see_partner(p_ws, p.sensitive)
    order by u.posted_on desc limit 30;
end $function$
;

CREATE OR REPLACE FUNCTION toolkit_core.kids_team(p_ws uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce(toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']), false);
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.kids_admin(p_ws uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce(toolkit_core.is_member(p_ws, array['owner','pastor','admin']), false);
$function$
;

CREATE OR REPLACE FUNCTION public.tk_kids_rooms(p_ws uuid)
 RETURNS TABLE(id uuid, name text, ages text, ratio integer, active boolean, children bigint, adults bigint, ok boolean, problem text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.kids_team(p_ws) then return; end if;
  return query
  select r.id, r.name, r.ages, r.ratio, r.active, c.n, d.n,
    (c.n = 0 or (d.n >= 2 and c.n <= d.n * r.ratio)),
    case when c.n = 0 then null when d.n < 2 then 'Needs two cleared adults' when c.n > d.n * r.ratio then 'Over the ratio' else null end
  from toolkit_core.kids_rooms r
  cross join lateral (select count(*) n from toolkit_core.kids_checkins k where k.room_id = r.id and k.checked_out_at is null and k.checked_in_at > now() - interval '18 hours') c
  cross join lateral (select count(*) n from toolkit_core.kids_duty u where u.room_id = r.id and u.off_at is null and u.on_at > now() - interval '18 hours') d
  where r.workspace_id = p_ws order by (not r.active), r.name;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_kids_save_room(p_ws uuid, p_id uuid, p_name text, p_ages text, p_ratio integer, p_active boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v uuid := p_id;
begin
  if not toolkit_core.kids_admin(p_ws) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_id is null then insert into toolkit_core.kids_rooms (workspace_id, name, ages, ratio, active) values (p_ws, trim(p_name), nullif(trim(coalesce(p_ages,'')),''), coalesce(p_ratio, 8), coalesce(p_active, true)) returning id into v;
  else update toolkit_core.kids_rooms set name = trim(p_name), ages = nullif(trim(coalesce(p_ages,'')),''), ratio = coalesce(p_ratio, 8), active = coalesce(p_active, true) where id = p_id and workspace_id = p_ws;
    if not found then raise exception 'room not found'; end if; end if;
  return v;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_kids_delete_room(p_ws uuid, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_name text;
begin
  if not toolkit_core.kids_admin(p_ws) then raise exception 'not allowed' using errcode='42501'; end if;
  if exists(select 1 from toolkit_core.kids_checkins where room_id=p_id and checked_out_at is null) then raise exception 'Children are checked in to this room'; end if;
  delete from toolkit_core.kids_rooms where id=p_id and workspace_id=p_ws returning name into v_name;
  if not found then raise exception 'room not found'; end if;
  insert into toolkit_core.audit_events(workspace_id,actor_id,action,target_type,target_id,meta)
  values(p_ws,auth.uid(),'kids.room_deleted','kids_room',p_id::text,jsonb_build_object('name',v_name));
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_kids_children(p_ws uuid)
 RETURNS TABLE(id uuid, first_name text, last_name text, allergies text, medical text, notes text, guardians jsonb, checked_in boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.kids_team(p_ws) then return; end if;
  return query select p.id, p.first_name, p.last_name, h.allergies, h.medical, h.notes,
    coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'name', trim(g.first_name || ' ' || coalesce(g.last_name,'')), 'can_pickup', kg.can_pickup) order by g.first_name)
              from toolkit_core.kids_guardians kg join toolkit_core.people g on g.id = kg.guardian_id where kg.child_id = p.id), '[]'::jsonb),
    exists (select 1 from toolkit_core.kids_checkins k where k.child_id = p.id and k.checked_out_at is null and k.checked_in_at > now() - interval '18 hours')
  from toolkit_core.people p left join toolkit_core.kids_health h on h.person_id = p.id
  where p.workspace_id = p_ws and p.age_group = 'minor' order by p.first_name, p.last_name;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_kids_set_guardian(p_ws uuid, p_child uuid, p_guardian uuid, p_can_pickup boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.kids_team(p_ws) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from toolkit_core.people where id = p_child and workspace_id = p_ws and age_group = 'minor') then raise exception 'child not found'; end if;
  if not exists (select 1 from toolkit_core.people where id = p_guardian and workspace_id = p_ws and age_group = 'adult') then raise exception 'A guardian must be an adult in your directory'; end if;
  insert into toolkit_core.kids_guardians (child_id, guardian_id, workspace_id, can_pickup) values (p_child, p_guardian, p_ws, coalesce(p_can_pickup, true))
  on conflict (child_id, guardian_id) do update set can_pickup = excluded.can_pickup;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'kids.guardian_set', 'person', p_child::text, jsonb_build_object('can_pickup', coalesce(p_can_pickup, true)));
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_kids_remove_guardian(p_ws uuid, p_child uuid, p_guardian uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.kids_team(p_ws) then raise exception 'not allowed' using errcode = '42501'; end if;
  delete from toolkit_core.kids_guardians where child_id = p_child and guardian_id = p_guardian and workspace_id = p_ws;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'kids.guardian_removed', 'person', p_child::text, '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_kids_set_health(p_ws uuid, p_child uuid, p_allergies text, p_medical text, p_notes text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.kids_team(p_ws) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from toolkit_core.people where id = p_child and workspace_id = p_ws and age_group = 'minor') then raise exception 'child not found'; end if;
  insert into toolkit_core.kids_health (person_id, workspace_id, allergies, medical, notes) values (p_child, p_ws, nullif(trim(coalesce(p_allergies,'')),''), nullif(trim(coalesce(p_medical,'')),''), nullif(trim(coalesce(p_notes,'')),''))
  on conflict (person_id) do update set allergies = excluded.allergies, medical = excluded.medical, notes = excluded.notes;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'kids.health_updated', 'person', p_child::text, '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_kids_set_clearance(p_ws uuid, p_person uuid, p_until date, p_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_note text:=nullif(trim(regexp_replace(coalesce(p_note,''),'\s+',' ','g')),'');
begin
  if not toolkit_core.kids_admin(p_ws) then
    raise exception 'not allowed' using errcode='42501';
  end if;

  if not exists (
    select 1 from toolkit_core.people
    where id=p_person and workspace_id=p_ws and age_group='adult'
  ) then
    raise exception 'person not found';
  end if;

  if v_note is not null and char_length(v_note)>80 then
    raise exception 'Clearance reference must be 80 characters or fewer' using errcode='22023';
  end if;

  if v_note is not null and (
    v_note ~* '(social security|\mssn\M|date of birth|\mdob\M|criminal|arrest|conviction|report number|case number)'
    or v_note ~ '[0-9]{8,}'
  ) then
    raise exception 'Store only a short provider or administrative reference here, not background-check findings, DOBs, SSNs, report numbers or case details' using errcode='22023';
  end if;

  if p_until is null then
    delete from toolkit_core.kids_clearances
    where person_id=p_person and workspace_id=p_ws;
  else
    insert into toolkit_core.kids_clearances(
      person_id,workspace_id,cleared_until,note,updated_by
    )
    values(
      p_person,p_ws,p_until,v_note,auth.uid()
    )
    on conflict(person_id) do update
    set cleared_until=excluded.cleared_until,
        note=excluded.note,
        updated_by=auth.uid(),
        updated_at=now();
  end if;

  insert into toolkit_core.audit_events(
    workspace_id,actor_id,action,target_type,target_id,meta
  )
  values(
    p_ws,auth.uid(),'kids.clearance_set','person',p_person::text,
    jsonb_build_object('cleared',p_until is not null,'has_reference',v_note is not null)
  );
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_kids_helpers(p_ws uuid)
 RETURNS TABLE(id uuid, name text, cleared_until date, cleared boolean, room_id uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.kids_team(p_ws) then return; end if;
  return query select p.id, trim(p.first_name || ' ' || coalesce(p.last_name,'')), c.cleared_until, coalesce(c.cleared_until >= current_date, false),
    (select u.room_id from toolkit_core.kids_duty u where u.person_id = p.id and u.off_at is null and u.on_at > now() - interval '18 hours' limit 1)
  from toolkit_core.people p left join toolkit_core.kids_clearances c on c.person_id = p.id
  where p.workspace_id = p_ws and p.age_group = 'adult' order by (c.cleared_until is null), p.first_name;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_kids_duty_on(p_ws uuid, p_room uuid, p_person uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.kids_team(p_ws) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from toolkit_core.kids_rooms where id = p_room and workspace_id = p_ws and active) then raise exception 'room not found'; end if;
  if not exists (select 1 from toolkit_core.people where id = p_person and workspace_id = p_ws and age_group = 'adult') then raise exception 'Only adults can work in a kids room'; end if;
  if not exists (select 1 from toolkit_core.kids_clearances where person_id = p_person and workspace_id = p_ws and cleared_until >= current_date) then raise exception 'This person does not have a current background check on file'; end if;
  update toolkit_core.kids_duty set off_at = now() where person_id = p_person and off_at is null;
  insert into toolkit_core.kids_duty (workspace_id, room_id, person_id) values (p_ws, p_room, p_person);
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'kids.duty_on', 'kids_room', p_room::text, '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_kids_duty_off(p_ws uuid, p_person uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.kids_team(p_ws) then raise exception 'not allowed' using errcode = '42501'; end if;
  update toolkit_core.kids_duty set off_at = now() where person_id = p_person and workspace_id = p_ws and off_at is null;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'kids.duty_off', 'person', p_person::text, '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_kids_check_in(p_ws uuid, p_child uuid, p_room uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  r record;
  kids int;
  adults int;
  b bytea;
  v_code text;
  v_hash text;
begin
  if not toolkit_core.kids_team(p_ws) then
    raise exception 'not allowed' using errcode='42501';
  end if;

  select * into r
  from toolkit_core.kids_rooms
  where id=p_room and workspace_id=p_ws and active
  for update;

  if not found then raise exception 'room not found'; end if;

  if not exists (
    select 1 from toolkit_core.people
    where id=p_child and workspace_id=p_ws and age_group='minor'
  ) then
    raise exception 'child not found';
  end if;

  if not exists (
    select 1 from toolkit_core.kids_guardians
    where child_id=p_child and workspace_id=p_ws and can_pickup
  ) then
    raise exception 'Add a parent or guardian who can pick this child up before checking in';
  end if;

  if exists (
    select 1 from toolkit_core.kids_checkins
    where child_id=p_child
      and checked_out_at is null
      and checked_in_at > now()-interval '18 hours'
  ) then
    raise exception 'This child is already checked in';
  end if;

  select count(*) into kids
  from toolkit_core.kids_checkins
  where room_id=p_room
    and checked_out_at is null
    and checked_in_at > now()-interval '18 hours';

  select count(*) into adults
  from toolkit_core.kids_duty d
  where d.room_id=p_room
    and d.off_at is null
    and d.on_at > now()-interval '18 hours'
    and exists (
      select 1
      from toolkit_core.kids_clearances c
      where c.person_id=d.person_id
        and c.workspace_id=p_ws
        and c.cleared_until>=current_date
    );

  if adults<2 then
    raise exception 'This room needs two cleared adults on duty before children can check in';
  end if;

  if kids+1 > adults*r.ratio then
    raise exception 'This room is at its limit of % children for % adults',adults*r.ratio,adults;
  end if;

  b:=extensions.gen_random_bytes(3);
  v_code:=lpad(((get_byte(b,0)*65536 + get_byte(b,1)*256 + get_byte(b,2)) % 1000000)::text,6,'0');
  v_hash:=extensions.crypt(v_code,extensions.gen_salt('bf',10));

  insert into toolkit_core.kids_checkins(
    workspace_id,child_id,room_id,code,code_hash,failed_attempts,locked_until,last_failed_at,checked_in_by
  )
  values(
    p_ws,p_child,p_room,null,v_hash,0,null,null,auth.uid()
  );

  insert into toolkit_core.audit_events(
    workspace_id,actor_id,action,target_type,target_id,meta
  )
  values(
    p_ws,auth.uid(),'kids.check_in','person',p_child::text,
    jsonb_build_object('room',p_room,'pickup_code_digits',6)
  );

  return v_code;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_kids_present(p_ws uuid)
 RETURNS TABLE(checkin_id uuid, child_id uuid, name text, room_id uuid, room_name text, allergies text, checked_in_at timestamp with time zone, guardians jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.kids_team(p_ws) then return; end if;
  return query select k.id, p.id, trim(p.first_name || ' ' || coalesce(p.last_name,'')), r.id, r.name, h.allergies, k.checked_in_at,
    coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'name', trim(g.first_name || ' ' || coalesce(g.last_name,''))) order by g.first_name)
              from toolkit_core.kids_guardians kg join toolkit_core.people g on g.id = kg.guardian_id where kg.child_id = p.id and kg.can_pickup), '[]'::jsonb)
  from toolkit_core.kids_checkins k join toolkit_core.people p on p.id = k.child_id join toolkit_core.kids_rooms r on r.id = k.room_id left join toolkit_core.kids_health h on h.person_id = p.id
  where k.workspace_id = p_ws and k.checked_out_at is null and k.checked_in_at > now() - interval '18 hours' order by r.name, p.first_name;
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_kids_check_out(p_ws uuid, p_checkin uuid, p_code text, p_guardian uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  k record;
  v_code text:=trim(coalesce(p_code,''));
  v_attempts integer;
begin
  if not toolkit_core.kids_team(p_ws) then
    raise exception 'not allowed' using errcode='42501';
  end if;

  select * into k
  from toolkit_core.kids_checkins
  where id=p_checkin and workspace_id=p_ws and checked_out_at is null
  for update;

  if not found then
    raise exception 'This child is not checked in';
  end if;

  if k.locked_until is not null and k.locked_until>now() then
    return 'Too many incorrect pickup-code attempts. Check-out is temporarily locked. Ask an owner, pastor or admin to verify the family and reset the lock, or wait five minutes.';
  end if;

  if k.locked_until is not null and k.locked_until<=now() then
    update toolkit_core.kids_checkins
    set failed_attempts=0,locked_until=null,last_failed_at=null
    where id=p_checkin;
    k.failed_attempts:=0;
    k.locked_until:=null;
  end if;

  if k.code_hash is null then
    return 'This check-in does not have a usable pickup code. An owner, pastor or admin must verify the family and check the child in again.';
  end if;

  if v_code !~ '^[0-9]{6}$'
     or extensions.crypt(v_code,k.code_hash) is distinct from k.code_hash then

    v_attempts:=coalesce(k.failed_attempts,0)+1;

    if v_attempts>=5 then
      update toolkit_core.kids_checkins
      set failed_attempts=5,
          locked_until=now()+interval '5 minutes',
          last_failed_at=now()
      where id=p_checkin;

      insert into toolkit_core.audit_events(
        workspace_id,actor_id,action,target_type,target_id,meta
      )
      values(
        p_ws,auth.uid(),'kids.check_out_refused','person',k.child_id::text,
        jsonb_build_object('why','wrong code','attempts',5,'locked',true)
      );

      return 'Too many incorrect pickup-code attempts. Check-out is locked for five minutes. An owner, pastor or admin can reset the lock after verifying the family.';
    else
      update toolkit_core.kids_checkins
      set failed_attempts=v_attempts,last_failed_at=now()
      where id=p_checkin;

      insert into toolkit_core.audit_events(
        workspace_id,actor_id,action,target_type,target_id,meta
      )
      values(
        p_ws,auth.uid(),'kids.check_out_refused','person',k.child_id::text,
        jsonb_build_object('why','wrong code','attempts',v_attempts,'locked',false)
      );

      return format(
        'That pickup code does not match. The child was not released. %s attempt%s remaining before a temporary lock.',
        5-v_attempts,
        case when 5-v_attempts=1 then '' else 's' end
      );
    end if;
  end if;

  if not exists (
    select 1
    from toolkit_core.kids_guardians
    where child_id=k.child_id
      and guardian_id=p_guardian
      and workspace_id=p_ws
      and can_pickup
  ) then
    insert into toolkit_core.audit_events(
      workspace_id,actor_id,action,target_type,target_id,meta
    )
    values(
      p_ws,auth.uid(),'kids.check_out_refused','person',k.child_id::text,
      jsonb_build_object('why','not approved')
    );
    return 'That person is not approved to pick up this child. The child was not released.';
  end if;

  update toolkit_core.kids_checkins
  set checked_out_at=now(),
      checked_out_by=auth.uid(),
      picked_up_by=p_guardian,
      code_hash=null,
      failed_attempts=0,
      locked_until=null,
      last_failed_at=null
  where id=p_checkin;

  insert into toolkit_core.audit_events(
    workspace_id,actor_id,action,target_type,target_id,meta
  )
  values(
    p_ws,auth.uid(),'kids.check_out','person',k.child_id::text,'{}'::jsonb
  );

  return 'ok';
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_my_profile(p_ws uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p record;
begin
  if not toolkit_core.is_member(p_ws) then return null; end if;
  select * into p from toolkit_core.people where workspace_id = p_ws and user_id = auth.uid();
  if not found then return jsonb_build_object('linked', false); end if;
  return jsonb_build_object('linked', true, 'first_name', p.first_name, 'last_name', p.last_name, 'email', p.email, 'phone', p.phone,
    'preferred_channel', p.preferred_channel, 'name_ok', coalesce(p.ok_show_name, false), 'adult', p.age_group = 'adult',
    'consents', coalesce((select jsonb_agg(jsonb_build_object('purpose', x.purpose, 'channel', x.channel, 'granted', x.status = 'granted'))
       from (select distinct on (c.purpose, c.channel) c.purpose, c.channel, c.status from toolkit_core.consents c where c.person_id = p.id order by c.purpose, c.channel, c.created_at desc, c.id desc) x), '[]'::jsonb));
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_update_my_contact(p_ws uuid, p_phone text, p_channel text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid; v_phone text := nullif(trim(coalesce(p_phone,'')), ''); v_digits text;
begin
  select id into v_id from toolkit_core.people where workspace_id = p_ws and user_id = auth.uid() and toolkit_core.is_member(p_ws);
  if v_id is null then raise exception 'Your account is not linked to a person in the directory yet. Ask an admin.' using errcode = 'P0002'; end if;
  v_digits := regexp_replace(coalesce(v_phone,''), '\D', '', 'g');
  if v_phone is not null and (char_length(v_digits) < 7 or char_length(v_digits) > 15) then raise exception 'That phone number does not look right' using errcode = '22023'; end if;
  if p_channel is not null and p_channel not in ('sms','email','phone','print') then raise exception 'unknown channel' using errcode = '22023'; end if;
  update toolkit_core.people set phone = case when v_phone is null then null else v_digits end, preferred_channel = p_channel, updated_at = now() where id = v_id;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'person.self_updated', 'person', v_id::text, '{}'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_set_my_display(p_ws uuid, p_name_ok boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid; a text;
begin
  select id, age_group into v_id, a from toolkit_core.people where workspace_id = p_ws and user_id = auth.uid() and toolkit_core.is_member(p_ws);
  if v_id is null then raise exception 'Your account is not linked to a person in the directory yet. Ask an admin.' using errcode = 'P0002'; end if;
  if a <> 'adult' then raise exception 'Names are only shown for adults' using errcode = '22023'; end if;
  update toolkit_core.people set ok_show_name = coalesce(p_name_ok, false) where id = v_id;
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta) values (p_ws, auth.uid(), 'person.display_self_set', 'person', v_id::text, jsonb_build_object('name_ok', coalesce(p_name_ok, false)));
end $function$
;

CREATE OR REPLACE FUNCTION public.tk_set_my_consent(p_ws uuid, p_purpose text, p_channel text, p_granted boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid;
begin
  select id into v_id from toolkit_core.people where workspace_id = p_ws and user_id = auth.uid() and toolkit_core.is_member(p_ws);
  if v_id is null then raise exception 'Your account is not linked to a person in the directory yet. Ask an admin.' using errcode = 'P0002'; end if;
  if p_purpose not in ('operational_messages','newsletters','volunteer_contact','group_reminders','missions_updates','event_updates') then raise exception 'unknown purpose' using errcode = '22023'; end if;
  if p_channel not in ('sms','email') then raise exception 'unknown channel' using errcode = '22023'; end if;
  insert into toolkit_core.consents (workspace_id, person_id, purpose, channel, status, source, evidence, recorded_by)
  values (p_ws, v_id, p_purpose, p_channel, case when coalesce(p_granted,false) then 'granted' else 'revoked' end, 'self_service', 'Changed on My page', auth.uid());
  insert into toolkit_core.audit_events (workspace_id, actor_id, action, target_type, target_id, meta)
  values (p_ws, auth.uid(), 'consent.' || case when coalesce(p_granted,false) then 'granted' else 'revoked' end, 'person', v_id::text, jsonb_build_object('purpose', p_purpose, 'channel', p_channel, 'by', 'self'));
end $function$
;

CREATE OR REPLACE FUNCTION toolkit_core.event_no_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  raise exception 'event_log is append-only';
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.emit_event(p_ws uuid, p_event_type text, p_entity_type text, p_entity_id text DEFAULT NULL::text, p_payload jsonb DEFAULT '{}'::jsonb, p_source text DEFAULT NULL::text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_id bigint;
  v_source text;
  v_headers jsonb;
  v_correlation text;
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
begin
  if p_ws is null then
    raise exception 'workspace is required' using errcode = '22023';
  end if;

  if p_event_type is null
     or char_length(p_event_type) < 3
     or char_length(p_event_type) > 120
     or p_event_type !~ '^[a-z0-9_]+([.][a-z0-9_]+)+$' then
    raise exception 'invalid event type' using errcode = '22023';
  end if;

  if p_entity_type is null or char_length(p_entity_type) < 1 or char_length(p_entity_type) > 80 then
    raise exception 'invalid entity type' using errcode = '22023';
  end if;

  if jsonb_typeof(v_payload) <> 'object' then
    raise exception 'event payload must be an object' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_object_keys(v_payload) as k(key)
    where lower(k.key) in (
      'body','notes','medical','allergies','health','prayer','care',
      'email','phone','address','token','password','code','pickup_code',
      'first_name','last_name','name'
    )
  ) then
    raise exception 'event payload contains a restricted field' using errcode = '22023';
  end if;

  v_source := coalesce(
    nullif(p_source, ''),
    case when auth.uid() is null then 'system' else 'user' end
  );

  if v_source not in ('user','public','system','import','provider') then
    raise exception 'invalid event source' using errcode = '22023';
  end if;

  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
    v_correlation := nullif(v_headers ->> 'x-request-id', '');
  exception when others then
    v_correlation := null;
  end;

  v_correlation := coalesce(v_correlation, txid_current()::text);

  insert into toolkit_core.event_log (
    workspace_id,
    event_type,
    entity_type,
    entity_id,
    actor_id,
    source,
    payload,
    correlation_id
  )
  values (
    p_ws,
    p_event_type,
    p_entity_type,
    nullif(p_entity_id, ''),
    auth.uid(),
    v_source,
    jsonb_strip_nulls(v_payload),
    v_correlation
  )
  returning id into v_id;

  return v_id;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.capture_operational_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  j_new jsonb := '{}'::jsonb;
  j_old jsonb := '{}'::jsonb;
  v_ws uuid;
  v_entity_id text;
  v_type text;
  v_entity text;
  v_payload jsonb := '{}'::jsonb;
  v_source text;
begin
  if tg_op <> 'DELETE' then
    j_new := to_jsonb(new);
  end if;
  if tg_op <> 'INSERT' then
    j_old := to_jsonb(old);
  end if;

  v_ws := coalesce(
    nullif(j_new ->> 'workspace_id', '')::uuid,
    nullif(j_old ->> 'workspace_id', '')::uuid
  );

  if v_ws is null then
    return coalesce(new, old);
  end if;

  v_entity_id := coalesce(
    nullif(j_new ->> 'id', ''),
    nullif(j_old ->> 'id', ''),
    nullif(j_new ->> 'item_id', ''),
    nullif(j_old ->> 'item_id', '')
  );

  v_source := case
    when auth.uid() is null
         and tg_table_name in ('connect_submissions','event_registrations','group_requests')
      then 'public'
    when auth.uid() is null then 'system'
    else 'user'
  end;

  case tg_table_name
    when 'people' then
      v_entity := 'person';
      if tg_op = 'INSERT' then
        if coalesce(j_new ->> 'status','') = 'guest' then
          v_type := 'guest.created';
        else
          v_type := 'person.created';
        end if;
        v_payload := jsonb_build_object(
          'status', j_new ->> 'status',
          'age_group', j_new ->> 'age_group'
        );
      elsif tg_op = 'UPDATE'
        and (j_new ->> 'status') is distinct from (j_old ->> 'status') then
        v_type := 'person.status_changed';
        v_payload := jsonb_build_object(
          'from_status', j_old ->> 'status',
          'to_status', j_new ->> 'status'
        );
      end if;

    when 'connect_submissions' then
      if tg_op = 'INSERT' then
        v_entity := 'connect_submission';
        v_type := 'connect.submitted';
        v_payload := jsonb_build_object(
          'result', j_new ->> 'result',
          'contact_ok', (j_new ->> 'contact_ok')::boolean,
          'person_linked', (j_new ->> 'person_id') is not null
        );
      end if;

    when 'service_plans' then
      v_entity := 'service_plan';
      if tg_op = 'INSERT' then
        v_type := 'service.created';
        v_payload := jsonb_build_object(
          'starts_at', j_new ->> 'starts_at'
        );
      elsif tg_op = 'UPDATE'
        and (j_new ->> 'attendance') is distinct from (j_old ->> 'attendance')
        and (j_new ->> 'attendance') is not null then
        v_type := 'service.attendance_recorded';
        v_payload := jsonb_build_object(
          'attendance', (j_new ->> 'attendance')::integer
        );
      elsif tg_op = 'UPDATE'
        and (
          (j_new ->> 'starts_at') is distinct from (j_old ->> 'starts_at')
          or (j_new ->> 'theme') is distinct from (j_old ->> 'theme')
          or (j_new ->> 'title') is distinct from (j_old ->> 'title')
        ) then
        v_type := 'service.updated';
        v_payload := jsonb_build_object(
          'starts_at', j_new ->> 'starts_at'
        );
      end if;

    when 'role_assignments' then
      v_entity := 'assignment';
      if tg_op = 'INSERT' then
        v_type := 'assignment.created';
        v_payload := jsonb_build_object(
          'role_id', j_new ->> 'role_id',
          'status', j_new ->> 'status'
        );
      elsif tg_op = 'UPDATE'
        and (j_new ->> 'status') is distinct from (j_old ->> 'status') then
        v_type := case j_new ->> 'status'
          when 'confirmed' then 'assignment.confirmed'
          when 'declined' then 'assignment.declined'
          else 'assignment.status_changed'
        end;
        v_payload := jsonb_build_object(
          'role_id', j_new ->> 'role_id',
          'from_status', j_old ->> 'status',
          'to_status', j_new ->> 'status'
        );
      end if;

    when 'tasks' then
      v_entity := 'task';
      if tg_op = 'INSERT' then
        v_type := 'task.created';
        v_payload := jsonb_build_object(
          'due_date', j_new ->> 'due_date',
          'source', j_new ->> 'source',
          'assigned', (j_new ->> 'assignee_user') is not null
        );
      elsif tg_op = 'UPDATE'
        and (j_new ->> 'status') is distinct from (j_old ->> 'status') then
        v_type := case j_new ->> 'status'
          when 'done' then 'task.completed'
          when 'open' then 'task.reopened'
          else 'task.status_changed'
        end;
        v_payload := jsonb_build_object(
          'from_status', j_old ->> 'status',
          'to_status', j_new ->> 'status'
        );
      end if;

    when 'outbox' then
      v_entity := 'message';
      if tg_op = 'INSERT' then
        v_type := 'message.queued';
        v_payload := jsonb_build_object(
          'channel', j_new ->> 'channel',
          'purpose', j_new ->> 'purpose',
          'status', j_new ->> 'status'
        );
      elsif tg_op = 'UPDATE'
        and (j_new ->> 'status') is distinct from (j_old ->> 'status') then
        v_type := case j_new ->> 'status'
          when 'approved' then 'message.approved'
          when 'blocked' then 'message.blocked'
          when 'sent' then 'message.sent'
          when 'cancelled' then 'message.cancelled'
          else 'message.status_changed'
        end;
        v_payload := jsonb_build_object(
          'channel', j_new ->> 'channel',
          'purpose', j_new ->> 'purpose',
          'from_status', j_old ->> 'status',
          'to_status', j_new ->> 'status'
        );
      end if;

    when 'inbound_messages' then
      if tg_op = 'INSERT' then
        v_entity := 'inbound_message';
        v_type := 'message.reply_received';
        v_payload := jsonb_build_object(
          'channel', j_new ->> 'channel',
          'action', j_new ->> 'action'
        );
      end if;

    when 'documents' then
      v_entity := 'document';
      if tg_op = 'INSERT' then
        v_type := 'document.created';
        v_payload := jsonb_build_object(
          'folder', j_new ->> 'folder',
          'expires_on', j_new ->> 'expires_on',
          'restricted', (j_new ->> 'restricted')::boolean
        );
      elsif tg_op = 'UPDATE'
        and (
          (j_new ->> 'expires_on') is distinct from (j_old ->> 'expires_on')
          or (j_new ->> 'folder') is distinct from (j_old ->> 'folder')
          or (j_new ->> 'restricted') is distinct from (j_old ->> 'restricted')
        ) then
        v_type := 'document.updated';
        v_payload := jsonb_build_object(
          'folder', j_new ->> 'folder',
          'expires_on', j_new ->> 'expires_on',
          'restricted', (j_new ->> 'restricted')::boolean
        );
      elsif tg_op = 'DELETE' then
        v_type := 'document.deleted';
        v_payload := jsonb_build_object(
          'folder', j_old ->> 'folder',
          'restricted', (j_old ->> 'restricted')::boolean
        );
      end if;

    when 'sermons' then
      v_entity := 'sermon';
      if tg_op = 'INSERT' then
        v_type := 'sermon.created';
        v_payload := jsonb_build_object(
          'preached_on', j_new ->> 'preached_on',
          'status', j_new ->> 'status'
        );
      elsif tg_op = 'UPDATE'
        and (
          (j_new ->> 'status') is distinct from (j_old ->> 'status')
          or (j_new ->> 'preached_on') is distinct from (j_old ->> 'preached_on')
          or (j_new ->> 'series_id') is distinct from (j_old ->> 'series_id')
        ) then
        v_type := 'sermon.updated';
        v_payload := jsonb_build_object(
          'preached_on', j_new ->> 'preached_on',
          'status', j_new ->> 'status'
        );
      end if;

    when 'group_meetings' then
      if tg_op = 'INSERT' then
        v_entity := 'group_meeting';
        v_type := 'group.meeting_completed';
        v_payload := jsonb_build_object(
          'group_id', j_new ->> 'group_id',
          'lesson_id', j_new ->> 'lesson_id',
          'met_on', j_new ->> 'met_on'
        );
      end if;

    when 'event_registrations' then
      v_entity := 'event_registration';
      if tg_op = 'INSERT' then
        v_type := case j_new ->> 'status'
          when 'waitlist' then 'event.waitlisted'
          else 'event.registration_created'
        end;
        v_payload := jsonb_build_object(
          'item_id', j_new ->> 'item_id',
          'party_size', (j_new ->> 'party_size')::integer,
          'status', j_new ->> 'status',
          'contact_ok', (j_new ->> 'contact_ok')::boolean
        );
      elsif tg_op = 'UPDATE'
        and (j_new ->> 'status') is distinct from (j_old ->> 'status') then
        v_type := case
          when j_old ->> 'status' = 'waitlist' and j_new ->> 'status' = 'registered'
            then 'event.registration_promoted'
          when j_new ->> 'status' = 'cancelled'
            then 'event.registration_cancelled'
          else 'event.registration_status_changed'
        end;
        v_payload := jsonb_build_object(
          'item_id', j_new ->> 'item_id',
          'party_size', (j_new ->> 'party_size')::integer,
          'from_status', j_old ->> 'status',
          'to_status', j_new ->> 'status'
        );
      end if;

    when 'group_requests' then
      v_entity := 'group_request';
      if tg_op = 'INSERT' then
        v_type := 'group.request_created';
        v_payload := jsonb_build_object(
          'group_id', j_new ->> 'group_id',
          'status', j_new ->> 'status',
          'contact_ok', (j_new ->> 'contact_ok')::boolean
        );
      elsif tg_op = 'UPDATE'
        and (j_new ->> 'status') is distinct from (j_old ->> 'status') then
        v_type := 'group.request_resolved';
        v_payload := jsonb_build_object(
          'group_id', j_new ->> 'group_id',
          'from_status', j_old ->> 'status',
          'to_status', j_new ->> 'status'
        );
      end if;

    when 'mission_updates' then
      if tg_op = 'INSERT' then
        v_entity := 'mission_update';
        v_type := 'mission.update_added';
        v_payload := jsonb_build_object(
          'partner_id', j_new ->> 'partner_id',
          'posted_on', j_new ->> 'posted_on',
          'is_prayer', (j_new ->> 'is_prayer')::boolean
        );
      end if;

    when 'kids_checkins' then
      v_entity := 'kids_checkin';
      if tg_op = 'INSERT' then
        v_type := 'kids.checked_in';
        v_payload := jsonb_build_object(
          'room_id', j_new ->> 'room_id'
        );
      elsif tg_op = 'UPDATE'
        and (j_old ->> 'checked_out_at') is null
        and (j_new ->> 'checked_out_at') is not null then
        v_type := 'kids.checked_out';
        v_payload := jsonb_build_object(
          'room_id', j_new ->> 'room_id'
        );
      end if;

    when 'calendar_items' then
      v_entity := 'calendar_item';
      if tg_op = 'INSERT' then
        v_type := 'calendar.created';
        v_payload := jsonb_build_object(
          'kind', j_new ->> 'kind',
          'starts_at', j_new ->> 'starts_at',
          'recurrence', j_new ->> 'recurrence'
        );
      elsif tg_op = 'UPDATE'
        and (
          (j_new ->> 'starts_at') is distinct from (j_old ->> 'starts_at')
          or (j_new ->> 'kind') is distinct from (j_old ->> 'kind')
          or (j_new ->> 'recurrence') is distinct from (j_old ->> 'recurrence')
        ) then
        v_type := 'calendar.updated';
        v_payload := jsonb_build_object(
          'kind', j_new ->> 'kind',
          'starts_at', j_new ->> 'starts_at',
          'recurrence', j_new ->> 'recurrence'
        );
      elsif tg_op = 'DELETE' then
        v_type := 'calendar.deleted';
        v_payload := jsonb_build_object(
          'kind', j_old ->> 'kind',
          'starts_at', j_old ->> 'starts_at'
        );
      end if;
  end case;

  if v_type is not null then
    perform toolkit_core.emit_event(
      v_ws,
      v_type,
      v_entity,
      v_entity_id,
      v_payload,
      v_source
    );
  end if;

  return coalesce(new, old);
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.automation_touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at := now();
  return new;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.seed_automation_permissions(p_ws uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into toolkit_core.automation_permissions (workspace_id, capability, enabled, autonomy_level)
  select p_ws, x.capability, false, 'prepare'
  from (values
    ('operator'),
    ('sunday'),
    ('guests'),
    ('volunteers'),
    ('content'),
    ('events'),
    ('groups'),
    ('renewals'),
    ('missions'),
    ('meetings'),
    ('board'),
    ('facilities'),
    ('data_hygiene'),
    ('inbound'),
    ('onboarding')
  ) as x(capability)
  on conflict (workspace_id, capability) do nothing;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.seed_automation_permissions_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform toolkit_core.seed_automation_permissions(new.id);
  return new;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.autonomy_rank(p_level text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select case p_level
    when 'observe' then 1
    when 'prepare' then 2
    when 'act' then 3
    else 0
  end;
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.automation_permission_allows(p_ws uuid, p_capability text, p_required text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce((
    select ap.enabled
       and toolkit_core.autonomy_rank(ap.autonomy_level) >= toolkit_core.autonomy_rank(p_required)
    from toolkit_core.automation_permissions ap
    where ap.workspace_id = p_ws
      and ap.capability = p_capability
  ), false);
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.begin_automation_run(p_ws uuid, p_rule uuid, p_event bigint, p_idempotency_key text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_id uuid;
  v_rule toolkit_core.automation_rules%rowtype;
begin
  select * into v_rule
  from toolkit_core.automation_rules r
  where r.id = p_rule
    and r.workspace_id = p_ws;

  if not found then
    raise exception 'automation rule not found' using errcode = 'P0002';
  end if;

  if not v_rule.enabled then
    raise exception 'automation rule is disabled' using errcode = '42501';
  end if;

  if not toolkit_core.automation_permission_allows(
    p_ws,
    v_rule.capability,
    v_rule.required_autonomy
  ) then
    raise exception 'automation permission does not allow this rule' using errcode = '42501';
  end if;

  if p_event is not null and not exists (
    select 1 from toolkit_core.event_log e
    where e.id = p_event
      and e.workspace_id = p_ws
      and (
        v_rule.trigger_event = e.event_type
        or (
          right(v_rule.trigger_event, 2) = '.*'
          and e.event_type like left(v_rule.trigger_event, char_length(v_rule.trigger_event) - 1) || '%'
        )
      )
  ) then
    raise exception 'event does not match this automation rule' using errcode = '22023';
  end if;

  insert into toolkit_core.automation_runs (
    workspace_id, rule_id, event_id, idempotency_key, status
  )
  values (
    p_ws, p_rule, p_event, p_idempotency_key, 'queued'
  )
  on conflict (workspace_id, idempotency_key)
  do update set idempotency_key = excluded.idempotency_key
  returning id into v_id;

  return v_id;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.add_automation_step(p_ws uuid, p_run uuid, p_position integer, p_step_kind text, p_idempotency_key text, p_input jsonb DEFAULT '{}'::jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_id bigint;
begin
  if not exists (
    select 1 from toolkit_core.automation_runs r
    where r.id = p_run and r.workspace_id = p_ws
  ) then
    raise exception 'automation run not found' using errcode = 'P0002';
  end if;

  if jsonb_typeof(coalesce(p_input, '{}'::jsonb)) <> 'object' then
    raise exception 'step input must be an object' using errcode = '22023';
  end if;

  insert into toolkit_core.automation_steps (
    workspace_id, run_id, position, step_kind, idempotency_key, input
  )
  values (
    p_ws, p_run, p_position, p_step_kind, p_idempotency_key, coalesce(p_input, '{}'::jsonb)
  )
  on conflict (run_id, position)
  do update set position = excluded.position
  returning id into v_id;

  return v_id;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.create_action_proposal(p_ws uuid, p_run uuid, p_step bigint, p_idempotency_key text, p_proposal_type text, p_entity_type text, p_entity_id text, p_title text, p_summary text, p_explanation jsonb, p_proposed_action jsonb, p_risk_level text DEFAULT 'low'::text, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_id uuid;
begin
  if p_run is not null and not exists (
    select 1 from toolkit_core.automation_runs r
    where r.id = p_run and r.workspace_id = p_ws
  ) then
    raise exception 'automation run not found' using errcode = 'P0002';
  end if;

  if p_step is not null and not exists (
    select 1 from toolkit_core.automation_steps s
    where s.id = p_step and s.workspace_id = p_ws
      and (p_run is null or s.run_id = p_run)
  ) then
    raise exception 'automation step not found' using errcode = 'P0002';
  end if;

  if jsonb_typeof(coalesce(p_explanation, '{}'::jsonb)) <> 'object'
     or jsonb_typeof(coalesce(p_proposed_action, '{}'::jsonb)) <> 'object' then
    raise exception 'proposal json must be objects' using errcode = '22023';
  end if;

  insert into toolkit_core.action_proposals (
    workspace_id, run_id, step_id, idempotency_key,
    proposal_type, entity_type, entity_id, title, summary,
    explanation, proposed_action, risk_level, expires_at
  )
  values (
    p_ws, p_run, p_step, p_idempotency_key,
    p_proposal_type, p_entity_type, p_entity_id, trim(p_title), p_summary,
    coalesce(p_explanation, '{}'::jsonb),
    coalesce(p_proposed_action, '{}'::jsonb),
    p_risk_level, p_expires_at
  )
  on conflict (workspace_id, idempotency_key)
  do update set idempotency_key = excluded.idempotency_key
  returning id into v_id;

  return v_id;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.enqueue_scheduled_job(p_ws uuid, p_run uuid, p_step bigint, p_idempotency_key text, p_job_type text, p_payload jsonb, p_run_at timestamp with time zone DEFAULT now(), p_max_attempts integer DEFAULT 5)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_id uuid;
begin
  if p_run is not null and not exists (
    select 1 from toolkit_core.automation_runs r
    where r.id = p_run and r.workspace_id = p_ws
  ) then
    raise exception 'automation run not found' using errcode = 'P0002';
  end if;

  if p_step is not null and not exists (
    select 1 from toolkit_core.automation_steps s
    where s.id = p_step and s.workspace_id = p_ws
      and (p_run is null or s.run_id = p_run)
  ) then
    raise exception 'automation step not found' using errcode = 'P0002';
  end if;

  if jsonb_typeof(coalesce(p_payload, '{}'::jsonb)) <> 'object' then
    raise exception 'job payload must be an object' using errcode = '22023';
  end if;

  if p_max_attempts < 1 or p_max_attempts > 20 then
    raise exception 'invalid max attempts' using errcode = '22023';
  end if;

  insert into toolkit_core.scheduled_jobs (
    workspace_id, run_id, step_id, idempotency_key,
    job_type, payload, run_at, max_attempts
  )
  values (
    p_ws, p_run, p_step, p_idempotency_key,
    p_job_type, coalesce(p_payload, '{}'::jsonb),
    coalesce(p_run_at, now()), p_max_attempts
  )
  on conflict (workspace_id, idempotency_key)
  do update set idempotency_key = excluded.idempotency_key
  returning id into v_id;

  return v_id;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_worker_claim_jobs(p_worker text, p_limit integer DEFAULT 25)
 RETURNS TABLE(id uuid, workspace_id uuid, run_id uuid, step_id bigint, job_type text, payload jsonb, attempts integer, max_attempts integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if p_worker is null or char_length(trim(p_worker)) < 2 or char_length(p_worker) > 120 then
    raise exception 'invalid worker id' using errcode = '22023';
  end if;
  if p_limit < 1 or p_limit > 100 then
    raise exception 'invalid claim limit' using errcode = '22023';
  end if;

  return query
  with due as (
    select j.id
    from toolkit_core.scheduled_jobs j
    where j.status = 'queued'
      and j.run_at <= now()
      and j.attempts < j.max_attempts
    order by j.run_at, j.id
    for update skip locked
    limit p_limit
  ),
  claimed as (
    update toolkit_core.scheduled_jobs j
       set status = 'claimed',
           locked_at = now(),
           locked_by = trim(p_worker),
           attempts = j.attempts + 1
      from due
     where j.id = due.id
    returning j.id, j.workspace_id, j.run_id, j.step_id,
              j.job_type, j.payload, j.attempts, j.max_attempts
  )
  select * from claimed;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_worker_finish_job(p_job uuid, p_worker text, p_success boolean, p_error text DEFAULT NULL::text, p_retry_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  j toolkit_core.scheduled_jobs%rowtype;
begin
  select * into j
  from toolkit_core.scheduled_jobs
  where id = p_job
  for update;

  if not found then
    raise exception 'job not found' using errcode = 'P0002';
  end if;

  if j.status <> 'claimed' or j.locked_by is distinct from trim(p_worker) then
    raise exception 'job is not owned by this worker' using errcode = '42501';
  end if;

  if p_success then
    update toolkit_core.scheduled_jobs
       set status = 'succeeded',
           locked_at = null,
           locked_by = null,
           error_message = null
     where id = p_job;
  elsif j.attempts < j.max_attempts and p_retry_at is not null then
    update toolkit_core.scheduled_jobs
       set status = 'queued',
           run_at = greatest(p_retry_at, now()),
           locked_at = null,
           locked_by = null,
           error_message = left(p_error, 1200)
     where id = p_job;
  else
    update toolkit_core.scheduled_jobs
       set status = 'failed',
           locked_at = null,
           locked_by = null,
           error_message = left(p_error, 1200)
     where id = p_job;
  end if;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_worker_begin_run(p_ws uuid, p_rule uuid, p_event bigint, p_idempotency_key text)
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select toolkit_core.begin_automation_run(p_ws, p_rule, p_event, p_idempotency_key);
$function$
;

CREATE OR REPLACE FUNCTION public.tk_worker_add_step(p_ws uuid, p_run uuid, p_position integer, p_step_kind text, p_idempotency_key text, p_input jsonb DEFAULT '{}'::jsonb)
 RETURNS bigint
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select toolkit_core.add_automation_step(
    p_ws, p_run, p_position, p_step_kind, p_idempotency_key, p_input
  );
$function$
;

CREATE OR REPLACE FUNCTION public.tk_worker_create_proposal(p_ws uuid, p_run uuid, p_step bigint, p_idempotency_key text, p_proposal_type text, p_entity_type text, p_entity_id text, p_title text, p_summary text, p_explanation jsonb, p_proposed_action jsonb, p_risk_level text DEFAULT 'low'::text, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select toolkit_core.create_action_proposal(
    p_ws, p_run, p_step, p_idempotency_key,
    p_proposal_type, p_entity_type, p_entity_id,
    p_title, p_summary, p_explanation, p_proposed_action,
    p_risk_level, p_expires_at
  );
$function$
;

CREATE OR REPLACE FUNCTION public.tk_worker_enqueue_job(p_ws uuid, p_run uuid, p_step bigint, p_idempotency_key text, p_job_type text, p_payload jsonb, p_run_at timestamp with time zone DEFAULT now(), p_max_attempts integer DEFAULT 5)
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select toolkit_core.enqueue_scheduled_job(
    p_ws, p_run, p_step, p_idempotency_key,
    p_job_type, p_payload, p_run_at, p_max_attempts
  );
$function$
;

CREATE OR REPLACE FUNCTION public.tk_worker_set_run_status(p_run uuid, p_status text, p_error_code text DEFAULT NULL::text, p_error_message text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if p_status not in ('queued','running','waiting_approval','succeeded','failed','cancelled') then
    raise exception 'invalid run status' using errcode = '22023';
  end if;

  update toolkit_core.automation_runs
     set status = p_status,
         started_at = case
           when p_status = 'running' then coalesce(started_at, now())
           else started_at
         end,
         finished_at = case
           when p_status in ('succeeded','failed','cancelled') then now()
           else null
         end,
         error_code = case when p_status = 'failed' then left(p_error_code, 120) else null end,
         error_message = case when p_status = 'failed' then left(p_error_message, 1200) else null end
   where id = p_run;

  if not found then
    raise exception 'automation run not found' using errcode = 'P0002';
  end if;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_worker_set_step_status(p_step bigint, p_status text, p_output jsonb DEFAULT '{}'::jsonb, p_error_message text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if p_status not in ('queued','running','waiting_approval','succeeded','failed','skipped','cancelled') then
    raise exception 'invalid step status' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_output, '{}'::jsonb)) <> 'object' then
    raise exception 'step output must be an object' using errcode = '22023';
  end if;

  update toolkit_core.automation_steps
     set status = p_status,
         output = coalesce(p_output, '{}'::jsonb),
         started_at = case
           when p_status = 'running' then coalesce(started_at, now())
           else started_at
         end,
         finished_at = case
           when p_status in ('succeeded','failed','skipped','cancelled') then now()
           else null
         end,
         error_message = case when p_status = 'failed' then left(p_error_message, 1200) else null end
   where id = p_step;

  if not found then
    raise exception 'automation step not found' using errcode = 'P0002';
  end if;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.event_matches_rule(p_event_type text, p_trigger_event text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select
    p_trigger_event = p_event_type
    or (
      right(p_trigger_event, 2) = '.*'
      and p_event_type like left(p_trigger_event, char_length(p_trigger_event) - 1) || '%'
    );
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.rule_conditions_match(p_event jsonb, p_conditions jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  k text;
  v jsonb;
begin
  if p_conditions is null or p_conditions = '{}'::jsonb then
    return true;
  end if;

  if jsonb_typeof(p_conditions) <> 'object' then
    return false;
  end if;

  for k, v in select * from jsonb_each(p_conditions)
  loop
    if k = 'source' then
      if to_jsonb(p_event ->> 'source') is distinct from v then return false; end if;
    elsif k = 'entity_type' then
      if to_jsonb(p_event ->> 'entity_type') is distinct from v then return false; end if;
    elsif k = 'payload' then
      if jsonb_typeof(v) <> 'object' or not ((p_event -> 'payload') @> v) then
        return false;
      end if;
    else
      return false;
    end if;
  end loop;

  return true;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_worker_process_events(p_after_event bigint DEFAULT 0, p_limit integer DEFAULT 100)
 RETURNS TABLE(last_event_id bigint, events_scanned integer, runs_created integer, proposals_created integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  e record;
  r record;
  v_run uuid;
  v_step bigint;
  v_prop uuid;
  v_events integer := 0;
  v_runs integer := 0;
  v_props integer := 0;
  v_last bigint := coalesce(p_after_event, 0);
  v_run_key text;
  v_step_key text;
  v_prop_key text;
  v_title text;
  v_summary text;
  v_entity_type text;
  v_entity_id text;
  v_risk text;
begin
  if p_after_event < 0 then raise exception 'invalid event cursor' using errcode='22023'; end if;
  if p_limit < 1 or p_limit > 500 then raise exception 'invalid process limit' using errcode='22023'; end if;

  for e in
    select *
    from toolkit_core.event_log
    where id > p_after_event
    order by id
    limit p_limit
  loop
    v_events:=v_events+1;
    v_last:=e.id;

    insert into toolkit_core.automation_observations(
      workspace_id,rule_id,event_id,event_type,capability,title,explanation
    )
    select
      ar.workspace_id,ar.id,e.id,e.event_type,ar.capability,
      coalesce(nullif(ar.action_config->>'title',''),ar.name),
      jsonb_build_object(
        'mode','observe',
        'rule_name',ar.name,
        'entity_type',e.entity_type,
        'entity_id',e.entity_id,
        'facts',e.payload
      )
    from toolkit_core.automation_rules ar
    join toolkit_core.automation_permissions ap
      on ap.workspace_id=ar.workspace_id
     and ap.capability=ar.capability
    where ar.workspace_id=e.workspace_id
      and ar.enabled
      and ap.enabled
      and ap.autonomy_level='observe'
      and toolkit_core.event_matches_rule(e.event_type,ar.trigger_event)
      and toolkit_core.rule_conditions_match(
        jsonb_build_object('source',e.source,'entity_type',e.entity_type,'payload',e.payload),
        ar.conditions
      )
    on conflict(workspace_id,rule_id,event_id) do nothing;

    for r in
      select ar.*
      from toolkit_core.automation_rules ar
      where ar.workspace_id=e.workspace_id
        and ar.enabled
        and toolkit_core.event_matches_rule(e.event_type,ar.trigger_event)
        and toolkit_core.rule_conditions_match(
          jsonb_build_object(
            'source',e.source,
            'entity_type',e.entity_type,
            'payload',e.payload
          ),
          ar.conditions
        )
        and toolkit_core.automation_permission_allows(
          ar.workspace_id,ar.capability,ar.required_autonomy
        )
      order by ar.priority,ar.created_at,ar.id
    loop
      v_run_key:='event:'||e.id::text||':rule:'||r.id::text||':v:'||r.version::text;

      select id into v_run
      from toolkit_core.automation_runs
      where workspace_id=e.workspace_id and idempotency_key=v_run_key;

      if v_run is null then
        v_run:=toolkit_core.begin_automation_run(e.workspace_id,r.id,e.id,v_run_key);
        v_runs:=v_runs+1;
      end if;

      if r.action_kind='create_proposal' then
        v_step_key:=v_run_key||':step:proposal';
        v_step:=toolkit_core.add_automation_step(
          e.workspace_id,v_run,1,'create_proposal',v_step_key,
          jsonb_build_object(
            'event_id',e.id,'event_type',e.event_type,
            'entity_type',e.entity_type,'entity_id',e.entity_id
          )
        );

        v_prop_key:=v_run_key||':proposal';
        v_title:=coalesce(nullif(r.action_config->>'title',''),r.name);
        v_summary:=nullif(r.action_config->>'summary','');
        v_entity_type:=coalesce(nullif(r.action_config->>'entity_type',''),e.entity_type);
        v_entity_id:=coalesce(nullif(r.action_config->>'entity_id',''),e.entity_id);
        v_risk:=coalesce(nullif(r.action_config->>'risk_level',''),'low');

        if v_risk not in ('low','medium','high') then
          raise exception 'invalid proposal risk level on rule %',r.id;
        end if;

        select id into v_prop
        from toolkit_core.action_proposals
        where workspace_id=e.workspace_id and idempotency_key=v_prop_key;

        if v_prop is null then
          v_prop:=toolkit_core.create_action_proposal(
            e.workspace_id,v_run,v_step,v_prop_key,
            coalesce(nullif(r.action_config->>'proposal_type',''),r.capability),
            v_entity_type,v_entity_id,v_title,v_summary,
            jsonb_build_object(
              'event_id',e.id,'event_type',e.event_type,
              'rule_id',r.id,'rule_name',r.name,'facts',e.payload
            ),
            coalesce(r.action_config->'proposed_action','{}'::jsonb),
            v_risk,
            case when (r.action_config->>'expires_hours') ~ '^[0-9]+$'
              then now()+make_interval(hours=>(r.action_config->>'expires_hours')::integer)
              else null end
          );
          v_props:=v_props+1;
        end if;

        update toolkit_core.automation_steps
           set status='waiting_approval',started_at=coalesce(started_at,now())
         where id=v_step and status in ('queued','running');

        update toolkit_core.automation_runs
           set status='waiting_approval',started_at=coalesce(started_at,now())
         where id=v_run and status in ('queued','running');
      end if;
    end loop;
  end loop;

  return query select v_last,v_events,v_runs,v_props;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_list_action_proposals(p_ws uuid, p_status text DEFAULT 'pending'::text, p_limit integer DEFAULT 100)
 RETURNS TABLE(id uuid, proposal_type text, entity_type text, entity_id text, title text, summary text, explanation jsonb, proposed_action jsonb, risk_level text, status text, expires_at timestamp with time zone, decided_by uuid, decided_at timestamp with time zone, decision_note text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then
    return;
  end if;

  if p_status not in ('pending','approved','rejected','executed','expired','cancelled','all') then
    raise exception 'invalid proposal status' using errcode = '22023';
  end if;

  if p_limit < 1 or p_limit > 250 then
    raise exception 'invalid proposal limit' using errcode = '22023';
  end if;

  return query
  select
    ap.id,
    ap.proposal_type,
    ap.entity_type,
    ap.entity_id,
    ap.title,
    ap.summary,
    ap.explanation,
    ap.proposed_action,
    ap.risk_level,
    case
      when ap.status = 'pending' and ap.expires_at is not null and ap.expires_at <= now()
        then 'expired'
      else ap.status
    end,
    ap.expires_at,
    ap.decided_by,
    ap.decided_at,
    ap.decision_note,
    ap.created_at
  from toolkit_core.action_proposals ap
  where ap.workspace_id = p_ws
    and (
      p_status = 'all'
      or (
        p_status = 'expired'
        and ap.status = 'pending'
        and ap.expires_at is not null
        and ap.expires_at <= now()
      )
      or (
        p_status <> 'expired'
        and ap.status = p_status
        and not (
          ap.status = 'pending'
          and ap.expires_at is not null
          and ap.expires_at <= now()
        )
      )
    )
  order by
    case ap.risk_level when 'high' then 1 when 'medium' then 2 else 3 end,
    ap.created_at desc
  limit p_limit;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_decide_action_proposal(p_ws uuid, p_id uuid, p_decision text, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  ap toolkit_core.action_proposals%rowtype;
begin
  if p_decision not in ('approved','rejected') then
    raise exception 'invalid proposal decision' using errcode = '22023';
  end if;

  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select * into ap
  from toolkit_core.action_proposals
  where id = p_id
    and workspace_id = p_ws
  for update;

  if not found then
    raise exception 'proposal not found' using errcode = 'P0002';
  end if;

  if ap.status <> 'pending' then
    raise exception 'This proposal is no longer pending' using errcode = '22023';
  end if;

  if ap.expires_at is not null and ap.expires_at <= now() then
    update toolkit_core.action_proposals
       set status = 'expired',
           decided_at = now(),
           decision_note = 'Expired before review'
     where id = p_id;

    update toolkit_core.automation_steps
       set status = 'cancelled',
           finished_at = now()
     where id = ap.step_id
       and status = 'waiting_approval';

    update toolkit_core.automation_runs
       set status = 'cancelled',
           finished_at = now()
     where id = ap.run_id
       and status = 'waiting_approval';

    insert into toolkit_core.audit_events (
      workspace_id, actor_id, action, target_type, target_id, meta
    )
    values (
      p_ws, auth.uid(), 'automation.proposal_expired',
      'action_proposal', p_id::text,
      jsonb_build_object('risk_level', ap.risk_level, 'proposal_type', ap.proposal_type)
    );

    perform toolkit_core.emit_event(
      p_ws,
      'automation.proposal_expired',
      'action_proposal',
      p_id::text,
      jsonb_build_object(
        'proposal_type', ap.proposal_type,
        'risk_level', ap.risk_level
      ),
      'user'
    );

    return jsonb_build_object(
      'id', p_id,
      'status', 'expired',
      'executed', false
    );
  end if;

  if ap.risk_level = 'high'
     and not toolkit_core.is_member(p_ws, array['owner','pastor']) then
    raise exception 'High-risk proposals require an owner or pastor' using errcode = '42501';
  end if;

  update toolkit_core.action_proposals
     set status = p_decision,
         decided_by = auth.uid(),
         decided_at = now(),
         decision_note = nullif(trim(coalesce(p_note, '')), '')
   where id = p_id;

  if p_decision = 'rejected' then
    update toolkit_core.automation_steps
       set status = 'cancelled',
           finished_at = now()
     where id = ap.step_id
       and status = 'waiting_approval';

    update toolkit_core.automation_runs
       set status = 'cancelled',
           finished_at = now()
     where id = ap.run_id
       and status = 'waiting_approval';
  else
    update toolkit_core.automation_steps
       set status = 'succeeded',
           output = jsonb_build_object('proposal_status','approved'),
           finished_at = now()
     where id = ap.step_id
       and status = 'waiting_approval';

    update toolkit_core.automation_runs
       set status = 'succeeded',
           finished_at = now()
     where id = ap.run_id
       and status = 'waiting_approval';
  end if;

  insert into toolkit_core.audit_events (
    workspace_id, actor_id, action, target_type, target_id, meta
  )
  values (
    p_ws,
    auth.uid(),
    case when p_decision = 'approved'
      then 'automation.proposal_approved'
      else 'automation.proposal_rejected'
    end,
    'action_proposal',
    p_id::text,
    jsonb_build_object('risk_level', ap.risk_level, 'proposal_type', ap.proposal_type)
  );

  perform toolkit_core.emit_event(
    p_ws,
    case when p_decision = 'approved'
      then 'automation.proposal_approved'
      else 'automation.proposal_rejected'
    end,
    'action_proposal',
    p_id::text,
    jsonb_build_object(
      'proposal_type', ap.proposal_type,
      'risk_level', ap.risk_level
    ),
    'user'
  );

  return jsonb_build_object(
    'id', p_id,
    'status', p_decision,
    'executed', false
  );
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_list_automation_permissions(p_ws uuid)
 RETURNS TABLE(capability text, enabled boolean, autonomy_level text, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then
    return;
  end if;

  return query
  select ap.capability, ap.enabled, ap.autonomy_level, ap.updated_at
  from toolkit_core.automation_permissions ap
  where ap.workspace_id = p_ws
  order by ap.capability;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_set_automation_permission(p_ws uuid, p_capability text, p_enabled boolean, p_autonomy_level text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_old toolkit_core.automation_permissions%rowtype;
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin']) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if p_autonomy_level not in ('observe','prepare','act') then
    raise exception 'invalid autonomy level' using errcode = '22023';
  end if;

  if p_autonomy_level = 'act'
     and not toolkit_core.is_member(p_ws, array['owner','pastor']) then
    raise exception 'Only an owner or pastor can enable Act mode' using errcode = '42501';
  end if;

  select * into v_old
  from toolkit_core.automation_permissions
  where workspace_id = p_ws
    and capability = p_capability
  for update;

  if not found then
    raise exception 'automation capability not found' using errcode = 'P0002';
  end if;

  update toolkit_core.automation_permissions
     set enabled = coalesce(p_enabled, false),
         autonomy_level = p_autonomy_level,
         updated_by = auth.uid(),
         updated_at = now()
   where workspace_id = p_ws
     and capability = p_capability;

  insert into toolkit_core.audit_events (
    workspace_id, actor_id, action, target_type, target_id, meta
  )
  values (
    p_ws,
    auth.uid(),
    'automation.permission_changed',
    'automation_capability',
    p_capability,
    jsonb_build_object(
      'from_enabled', v_old.enabled,
      'to_enabled', coalesce(p_enabled, false),
      'from_level', v_old.autonomy_level,
      'to_level', p_autonomy_level
    )
  );

  perform toolkit_core.emit_event(
    p_ws,
    'automation.permission_changed',
    'automation_capability',
    p_capability,
    jsonb_build_object(
      'enabled', coalesce(p_enabled, false),
      'autonomy_level', p_autonomy_level
    ),
    'user'
  );
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.set_signal_state(p_ws uuid, p_signal_key text, p_signal_type text, p_entity_type text, p_entity_id text, p_active boolean, p_payload jsonb DEFAULT '{}'::jsonb, p_resolved_event_type text DEFAULT NULL::text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_old toolkit_core.automation_signal_state%rowtype;
  v_hash text;
  v_event bigint;
begin
  if jsonb_typeof(coalesce(p_payload,'{}'::jsonb)) <> 'object' then
    raise exception 'signal payload must be an object' using errcode='22023';
  end if;

  v_hash := encode(
    extensions.digest(
      convert_to(
        coalesce(p_active,false)::text || ':' || coalesce(p_payload,'{}'::jsonb)::text,
        'utf8'
      ),
      'sha256'
    ),
    'hex'
  );

  select * into v_old
  from toolkit_core.automation_signal_state
  where workspace_id=p_ws and signal_key=p_signal_key
  for update;

  if not found then
    insert into toolkit_core.automation_signal_state (
      workspace_id,signal_key,signal_type,entity_type,entity_id,
      active,state_hash,last_emitted_at,updated_at
    ) values (
      p_ws,p_signal_key,p_signal_type,p_entity_type,p_entity_id,
      coalesce(p_active,false),v_hash,
      case when p_active then now() else null end,
      now()
    );

    if p_active then
      v_event := toolkit_core.emit_event(
        p_ws,p_signal_type,p_entity_type,p_entity_id,p_payload,'system'
      );
    end if;

    return v_event;
  end if;

  update toolkit_core.automation_signal_state
     set signal_type=p_signal_type,
         entity_type=p_entity_type,
         entity_id=p_entity_id,
         active=coalesce(p_active,false),
         state_hash=v_hash,
         updated_at=now(),
         last_emitted_at = case
           when p_active and not v_old.active then now()
           when not p_active and v_old.active and p_resolved_event_type is not null then now()
           else last_emitted_at
         end
   where workspace_id=p_ws and signal_key=p_signal_key;

  if p_active and not v_old.active then
    v_event := toolkit_core.emit_event(
      p_ws,p_signal_type,p_entity_type,p_entity_id,p_payload,'system'
    );
  elsif not p_active and v_old.active and p_resolved_event_type is not null then
    v_event := toolkit_core.emit_event(
      p_ws,p_resolved_event_type,p_entity_type,p_entity_id,'{}'::jsonb,'system'
    );
  end if;

  return v_event;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.sunday_signal_sweep()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  p record;
  v_count integer := 0;
  v_needed integer;
  v_filled integer;
  v_confirmed integer;
  v_run_count integer;
  v_sermon_exists boolean;
  v_local_date date;
  v_tz text;
  v_payload jsonb;
begin
  for p in
    select sp.id,sp.workspace_id,sp.starts_at
    from toolkit_core.service_plans sp
    join toolkit_core.automation_permissions ap
      on ap.workspace_id=sp.workspace_id
     and ap.capability='sunday'
     and ap.enabled
     and toolkit_core.autonomy_rank(ap.autonomy_level) >= toolkit_core.autonomy_rank('prepare')
    where sp.starts_at >= now()
      and sp.starts_at < now() + interval '14 days'
    order by sp.starts_at
  loop
    select
      coalesce(sum(sr.needed),0)::integer,
      coalesce(count(ra.id) filter (where ra.status <> 'declined'),0)::integer,
      coalesce(count(ra.id) filter (where ra.status='confirmed'),0)::integer
    into v_needed,v_filled,v_confirmed
    from toolkit_core.service_roles sr
    left join toolkit_core.role_assignments ra on ra.role_id=sr.id
    where sr.plan_id=p.id;

    v_payload := jsonb_build_object(
      'needed',v_needed,
      'filled',v_filled,
      'confirmed',v_confirmed,
      'open',greatest(v_needed-v_filled,0),
      'starts_at',p.starts_at
    );

    perform toolkit_core.set_signal_state(
      p.workspace_id,
      'sunday:staffing:' || p.id::text,
      'service.staffing_incomplete',
      'service_plan',
      p.id::text,
      v_needed > v_filled,
      v_payload,
      'service.staffing_resolved'
    );

    if v_needed > v_filled then v_count := v_count + 1; end if;

    if p.starts_at < now() + interval '4 days' then
      select count(*)::integer into v_run_count
      from toolkit_core.run_sheet_items ri
      where ri.plan_id=p.id;

      select w.timezone into v_tz
      from toolkit_core.workspaces w
      where w.id=p.workspace_id;

      v_local_date := (p.starts_at at time zone coalesce(v_tz,'UTC'))::date;

      select exists(
        select 1
        from toolkit_core.sermons s
        where s.workspace_id=p.workspace_id
          and s.preached_on=v_local_date
          and s.status <> 'archived'
      ) into v_sermon_exists;

      v_payload := jsonb_build_object(
        'starts_at',p.starts_at,
        'run_sheet_missing',v_run_count=0,
        'sermon_missing',not coalesce(v_sermon_exists,false)
      );

      perform toolkit_core.set_signal_state(
        p.workspace_id,
        'sunday:prep:' || p.id::text,
        'service.prep_incomplete',
        'service_plan',
        p.id::text,
        (v_run_count=0 or not coalesce(v_sermon_exists,false)),
        v_payload,
        'service.prep_resolved'
      );

      if v_run_count=0 or not coalesce(v_sermon_exists,false) then
        v_count := v_count + 1;
      end if;
    end if;
  end loop;

  return v_count;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.automation_background_tick()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  st toolkit_core.automation_processor_state%rowtype;
  r record;
  v_cursor bigint;
  v_scanned integer:=0;
  v_runs integer:=0;
  v_props integer:=0;
  v_loops integer:=0;
  v_sunday_signals integer:=0;
  v_domain_signals integer:=0;
  v_hygiene_signals integer:=0;
  v_sunday_enriched integer:=0;
  v_sunday_ops_enriched integer:=0;
  v_domain_enriched integer:=0;
  v_hygiene_enriched integer:=0;
  v_permissions integer:=0;
  v_auto_approved integer:=0;
  v_execution jsonb;
begin
  if not pg_try_advisory_xact_lock(741203,1) then
    return jsonb_build_object('status','already_running');
  end if;

  select * into st
  from toolkit_core.automation_processor_state
  where processor='default'
  for update;

  if not found then
    insert into toolkit_core.automation_processor_state(processor,last_event_id,last_started_at)
    values('default',0,now())
    returning * into st;
  else
    update toolkit_core.automation_processor_state
       set last_started_at=now(),last_error=null,updated_at=now()
     where processor='default';
  end if;

  v_cursor:=st.last_event_id;
  v_permissions:=toolkit_core.sync_default_automation_permissions();
  v_sunday_signals:=toolkit_core.sunday_signal_sweep();
  v_domain_signals:=toolkit_core.domain_signal_sweep();
  v_hygiene_signals:=toolkit_core.data_hygiene_sweep();

  loop
    exit when v_loops>=10;
    v_loops:=v_loops+1;

    select * into r
    from public.tk_worker_process_events(v_cursor,250);

    if r is null or r.events_scanned=0 then exit; end if;

    v_cursor:=greatest(v_cursor,r.last_event_id);
    v_scanned:=v_scanned+r.events_scanned;
    v_runs:=v_runs+r.runs_created;
    v_props:=v_props+r.proposals_created;

    update toolkit_core.automation_processor_state
       set last_event_id=v_cursor,updated_at=now()
     where processor='default';

    exit when r.events_scanned<250;
  end loop;

  v_sunday_enriched:=toolkit_core.enrich_pending_sunday_staffing_proposals();
  v_sunday_ops_enriched:=toolkit_core.enrich_pending_sunday_operational_proposals();
  v_domain_enriched:=toolkit_core.enrich_pending_domain_proposals();
  v_hygiene_enriched:=toolkit_core.enrich_pending_data_hygiene_proposals();
  v_auto_approved:=toolkit_core.auto_approve_act_mode_proposals();
  v_execution:=toolkit_core.execute_approved_proposals(25);

  update toolkit_core.automation_processor_state
     set last_event_id=v_cursor,last_finished_at=now(),last_error=null,updated_at=now()
   where processor='default';

  return jsonb_build_object(
    'status','ok',
    'permissions_synced',v_permissions,
    'sunday_signals_active',v_sunday_signals,
    'domain_signals_active',v_domain_signals,
    'hygiene_signals_active',v_hygiene_signals,
    'events_scanned',v_scanned,
    'runs_created',v_runs,
    'proposals_created',v_props,
    'sunday_proposals_enriched',v_sunday_enriched,
    'sunday_operational_enriched',v_sunday_ops_enriched,
    'domain_proposals_enriched',v_domain_enriched,
    'hygiene_proposals_enriched',v_hygiene_enriched,
    'auto_approved',v_auto_approved,
    'executions',v_execution,
    'last_event_id',v_cursor
  );
exception when others then
  update toolkit_core.automation_processor_state
     set last_error=left(sqlerrm,1200),last_finished_at=now(),updated_at=now()
   where processor='default';
  return jsonb_build_object('status','error','error',left(sqlerrm,1200));
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.role_requires_kids_clearance(p_role_name text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select lower(coalesce(p_role_name,'')) ~ '(nursery|kids|children|child|preschool)';
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.sunday_staffing_intelligence(p_ws uuid, p_plan uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_plan record;
  v_service_date date;
  v_roles jsonb;
begin
  select sp.*, w.timezone
  into v_plan
  from toolkit_core.service_plans sp
  join toolkit_core.workspaces w on w.id = sp.workspace_id
  where sp.id = p_plan
    and sp.workspace_id = p_ws;

  if not found then
    return null;
  end if;

  v_service_date := (v_plan.starts_at at time zone coalesce(v_plan.timezone,'UTC'))::date;

  with role_base as (
    select
      sr.id as role_id,
      sr.name as role_name,
      toolkit_core.normalize_role_key(sr.name) as role_key,
      sr.position,
      sr.needed,
      count(ra.id) filter (where ra.status <> 'declined')::integer as filled,
      greatest(sr.needed - count(ra.id) filter (where ra.status <> 'declined')::integer, 0) as open_spots,
      toolkit_core.role_requires_kids_clearance(sr.name) as clearance_required,
      toolkit_core.role_requires_explicit_fit(sr.name) as explicit_fit_required
    from toolkit_core.service_roles sr
    left join toolkit_core.role_assignments ra on ra.role_id = sr.id
    where sr.plan_id = p_plan
    group by sr.id, sr.name, sr.position, sr.needed
  ),
  candidate_facts as (
    select
      rb.role_id,
      rb.role_name,
      rb.role_key,
      rb.position,
      rb.needed,
      rb.filled,
      rb.open_spots,
      rb.clearance_required,
      rb.explicit_fit_required,
      pe.id as person_id,
      trim(pe.first_name || ' ' || coalesce(pe.last_name,'')) as person_name,
      exists (
        select 1
        from toolkit_core.availability_blackouts b
        where b.person_id = pe.id
          and b.on_date = v_service_date
      ) as blacked_out,
      exists (
        select 1
        from toolkit_core.role_assignments ca
        join toolkit_core.service_roles cr on cr.id = ca.role_id
        where cr.plan_id = p_plan
          and ca.person_id = pe.id
          and ca.status <> 'declined'
      ) as same_service_conflict,
      coalesce((
        select kc.cleared_until >= v_service_date
        from toolkit_core.kids_clearances kc
        where kc.person_id = pe.id
          and kc.workspace_id = p_ws
      ), false) as clearance_ok,
      coalesce((
        select vr.eligible
        from toolkit_core.volunteer_role_profiles vr
        where vr.workspace_id=p_ws
          and vr.person_id=pe.id
          and vr.role_key=rb.role_key
      ), false) as explicit_fit,
      coalesce((
        select vr.preferred
        from toolkit_core.volunteer_role_profiles vr
        where vr.workspace_id=p_ws
          and vr.person_id=pe.id
          and vr.role_key=rb.role_key
          and vr.eligible
      ), false) as preferred_fit,
      (
        select count(*)::integer
        from toolkit_core.role_assignments ha
        join toolkit_core.service_roles hr on hr.id = ha.role_id
        join toolkit_core.service_plans hp on hp.id = hr.plan_id
        where hp.workspace_id = p_ws
          and hp.starts_at < v_plan.starts_at
          and ha.person_id = pe.id
          and ha.status = 'confirmed'
          and toolkit_core.normalize_role_key(hr.name) = rb.role_key
      ) as same_role_confirmed,
      (
        select count(*)::integer
        from toolkit_core.role_assignments la
        join toolkit_core.service_roles lr on lr.id = la.role_id
        join toolkit_core.service_plans lp on lp.id = lr.plan_id
        where lp.workspace_id = p_ws
          and lp.starts_at < v_plan.starts_at
          and lp.starts_at >= v_plan.starts_at - interval '28 days'
          and la.person_id = pe.id
          and la.status = 'confirmed'
      ) as recent_serves_28d,
      (
        select max(lp.starts_at)
        from toolkit_core.role_assignments la
        join toolkit_core.service_roles lr on lr.id = la.role_id
        join toolkit_core.service_plans lp on lp.id = lr.plan_id
        where lp.workspace_id = p_ws
          and lp.starts_at < v_plan.starts_at
          and la.person_id = pe.id
          and la.status = 'confirmed'
      ) as last_served_at,
      (
        select kc.cleared_until
        from toolkit_core.kids_clearances kc
        where kc.person_id = pe.id
          and kc.workspace_id = p_ws
      ) as cleared_until
    from role_base rb
    cross join toolkit_core.people pe
    where rb.open_spots > 0
      and pe.workspace_id = p_ws
      and pe.age_group = 'adult'
      and pe.status in ('regular','member')
  ),
  eligible as (
    select *,
      row_number() over (
        partition by role_id
        order by
          preferred_fit desc,
          same_role_confirmed desc,
          recent_serves_28d asc,
          last_served_at asc nulls last,
          lower(person_name),
          person_id
      )::integer as candidate_rank
    from candidate_facts
    where not blacked_out
      and not same_service_conflict
      and (not clearance_required or clearance_ok)
      and (
        not explicit_fit_required
        or explicit_fit
        or same_role_confirmed > 0
      )
  ),
  role_json as (
    select
      rb.role_id,
      rb.position,
      jsonb_build_object(
        'role_id', rb.role_id,
        'role_name', rb.role_name,
        'needed', rb.needed,
        'filled', rb.filled,
        'open_spots', rb.open_spots,
        'clearance_required', rb.clearance_required,
        'explicit_fit_required', rb.explicit_fit_required,
        'eligible_count', (
          select count(*) from eligible e where e.role_id = rb.role_id
        ),
        'candidates', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'rank', e.candidate_rank,
              'person_id', e.person_id,
              'person_name', e.person_name,
              'preferred_for_role', e.preferred_fit,
              'same_role_experience', e.same_role_confirmed,
              'recent_serves_28d', e.recent_serves_28d,
              'last_served_on', case
                when e.last_served_at is null then null
                else (e.last_served_at at time zone coalesce(v_plan.timezone,'UTC'))::date
              end,
              'clearance_ok', case when rb.clearance_required then e.clearance_ok else null end,
              'cleared_until', case when rb.clearance_required then e.cleared_until else null end,
              'reasons', jsonb_strip_nulls(jsonb_build_object(
                'availability', 'Available on the service date',
                'conflict', 'No assignment conflict for this service',
                'role_fit', case
                  when e.preferred_fit then 'Marked preferred for this role'
                  when e.explicit_fit then 'Marked eligible for this role'
                  when e.same_role_confirmed > 0 then 'Qualified by confirmed prior experience in this role'
                  when not rb.explicit_fit_required then 'This role does not require an explicit qualification'
                  else null
                end,
                'experience', case
                  when e.same_role_confirmed > 0
                    then 'Previously confirmed in this role ' || e.same_role_confirmed::text ||
                         case when e.same_role_confirmed = 1 then ' time' else ' times' end
                  else 'No confirmed history in this role yet'
                end,
                'workload', case
                  when e.recent_serves_28d = 0 then 'No confirmed service assignments in the prior 28 days'
                  else 'Confirmed ' || e.recent_serves_28d::text ||
                       case when e.recent_serves_28d = 1 then ' time' else ' times' end ||
                       ' in the prior 28 days'
                end,
                'kids_clearance', case
                  when rb.clearance_required and e.clearance_ok
                    then 'Kids clearance valid through ' || e.cleared_until::text
                  else null
                end
              ))
            )
            order by e.candidate_rank
          )
          from eligible e
          where e.role_id = rb.role_id
            and e.candidate_rank <= greatest(rb.open_spots * 3, 5)
        ), '[]'::jsonb),
        'blocked_counts', jsonb_build_object(
          'blackout', (
            select count(*) from candidate_facts c
            where c.role_id = rb.role_id and c.blacked_out
          ),
          'already_serving', (
            select count(*) from candidate_facts c
            where c.role_id = rb.role_id and c.same_service_conflict
          ),
          'missing_kids_clearance', (
            select count(*) from candidate_facts c
            where c.role_id = rb.role_id
              and c.clearance_required
              and not c.clearance_ok
          ),
          'missing_role_qualification', (
            select count(*) from candidate_facts c
            where c.role_id = rb.role_id
              and c.explicit_fit_required
              and not c.explicit_fit
              and c.same_role_confirmed = 0
          )
        )
      ) as role_data
    from role_base rb
    where rb.open_spots > 0
  )
  select coalesce(jsonb_agg(role_data order by position, role_id), '[]'::jsonb)
  into v_roles
  from role_json;

  return jsonb_build_object(
    'plan_id', p_plan,
    'starts_at', v_plan.starts_at,
    'service_date', v_service_date,
    'roles', coalesce(v_roles, '[]'::jsonb),
    'method', jsonb_build_object(
      'eligibility', jsonb_build_array(
        'adult regular/member',
        'not blacked out',
        'not already serving this service',
        'valid kids clearance when the role requires it',
        'specialized roles require explicit staff qualification or confirmed prior experience'
      ),
      'ordering', jsonb_build_array(
        'staff-marked preferred role fit',
        'same-role confirmed experience',
        'lighter confirmed serving load in the prior 28 days',
        'longer time since last confirmed service'
      ),
      'automatic_assignment', false,
      'automatic_contact', false
    )
  );
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_sunday_staffing_recommendations(p_ws uuid, p_plan uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then
    raise exception 'not allowed' using errcode='42501';
  end if;

  return toolkit_core.sunday_staffing_intelligence(p_ws,p_plan);
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.enrich_pending_sunday_staffing_proposals()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  ap record;
  v_intel jsonb;
  v_plan jsonb;
  v_count integer := 0;
begin
  for ap in
    select id,workspace_id,entity_id
    from toolkit_core.action_proposals
    where proposal_type='sunday_staffing'
      and status='pending'
      and entity_type='service_plan'
      and entity_id ~ '^[0-9a-fA-F-]{36}$'
  loop
    v_intel := toolkit_core.sunday_staffing_intelligence(ap.workspace_id,ap.entity_id::uuid);
    v_plan := toolkit_core.sunday_staffing_plan(ap.workspace_id,ap.entity_id::uuid);

    if v_intel is not null and v_plan is not null then
      update toolkit_core.action_proposals
         set explanation =
               coalesce(explanation,'{}'::jsonb)
               || jsonb_build_object('staffing_intelligence',v_intel,'staffing_plan',v_plan),
             proposed_action = jsonb_build_object(
               'kind','prepare_sunday_lineup',
               'plan_id',ap.entity_id,
               'assignments',v_plan->'assignments'
             )
       where id=ap.id;
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.normalize_role_key(p_role_name text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select lower(regexp_replace(trim(coalesce(p_role_name,'')), '\s+', ' ', 'g'));
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.role_requires_explicit_fit(p_role_name text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select lower(coalesce(p_role_name,'')) ~
    '(worship|band|music|instrument|sound|audio|video|tech|production|nursery|kids|children|child|preschool)';
$function$
;

CREATE OR REPLACE FUNCTION public.tk_list_volunteer_role_profiles(p_ws uuid, p_person uuid DEFAULT NULL::uuid)
 RETURNS TABLE(person_id uuid, role_key text, eligible boolean, preferred boolean, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then
    return;
  end if;

  return query
  select vr.person_id, vr.role_key, vr.eligible, vr.preferred, vr.updated_at
  from toolkit_core.volunteer_role_profiles vr
  join toolkit_core.people p on p.id=vr.person_id
  where vr.workspace_id=p_ws
    and p.workspace_id=p_ws
    and (p_person is null or vr.person_id=p_person)
  order by vr.person_id, vr.role_key;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_set_volunteer_role_profile(p_ws uuid, p_person uuid, p_role_name text, p_eligible boolean, p_preferred boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_key text := toolkit_core.normalize_role_key(p_role_name);
begin
  if not toolkit_core.is_member(p_ws, array['owner','pastor','admin','leader']) then
    raise exception 'not allowed' using errcode='42501';
  end if;

  if not exists (
    select 1 from toolkit_core.people
    where id=p_person
      and workspace_id=p_ws
      and age_group='adult'
      and status in ('regular','member')
  ) then
    raise exception 'eligible adult person not found' using errcode='P0002';
  end if;

  if char_length(v_key) < 2 or char_length(v_key) > 80 then
    raise exception 'invalid role name' using errcode='22023';
  end if;

  insert into toolkit_core.volunteer_role_profiles (
    workspace_id, person_id, role_key, eligible, preferred, updated_by, updated_at
  )
  values (
    p_ws,p_person,v_key,coalesce(p_eligible,false),
    coalesce(p_preferred,false) and coalesce(p_eligible,false),
    auth.uid(),now()
  )
  on conflict (workspace_id,person_id,role_key)
  do update set
    eligible=excluded.eligible,
    preferred=excluded.preferred,
    updated_by=auth.uid(),
    updated_at=now();

  insert into toolkit_core.audit_events (
    workspace_id,actor_id,action,target_type,target_id,meta
  ) values (
    p_ws,auth.uid(),'volunteer.role_profile_changed',
    'person',p_person::text,
    jsonb_build_object(
      'role_key',v_key,
      'eligible',coalesce(p_eligible,false),
      'preferred',coalesce(p_preferred,false) and coalesce(p_eligible,false)
    )
  );

  perform toolkit_core.emit_event(
    p_ws,
    'volunteer.role_profile_changed',
    'person',
    p_person::text,
    jsonb_build_object(
      'role_key',v_key,
      'eligible',coalesce(p_eligible,false),
      'preferred',coalesce(p_preferred,false) and coalesce(p_eligible,false)
    ),
    'user'
  );
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.queue_message_draft_internal(p_ws uuid, p_person uuid, p_channel text, p_purpose text, p_body text, p_actor uuid, p_related_type text DEFAULT NULL::text, p_related_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_reason text;
  v_id uuid;
  v_status text;
begin
  if p_actor is null or not toolkit_core.is_member_of(p_ws,p_actor) then
    raise exception 'invalid acting member' using errcode='42501';
  end if;

  if p_channel not in ('sms','email') then
    raise exception 'invalid channel' using errcode='22023';
  end if;

  if p_purpose not in ('operational_messages','newsletters','guest_followup','volunteer_contact') then
    raise exception 'invalid message purpose' using errcode='22023';
  end if;

  if not exists (
    select 1 from toolkit_core.people
    where id=p_person and workspace_id=p_ws
  ) then
    raise exception 'person not found' using errcode='P0002';
  end if;

  v_reason := toolkit_core.contact_check(p_ws,p_person,p_channel,p_purpose);
  v_status := case when v_reason is null then 'pending_approval' else 'blocked' end;

  insert into toolkit_core.outbox (
    workspace_id,person_id,channel,purpose,body,status,status_reason,
    related_type,related_id,created_by
  )
  values (
    p_ws,p_person,p_channel,p_purpose,left(trim(p_body),480),
    v_status,v_reason,p_related_type,p_related_id,p_actor
  )
  returning id into v_id;

  insert into toolkit_core.audit_events (
    workspace_id,actor_id,action,target_type,target_id,meta
  )
  values (
    p_ws,p_actor,'automation.message_draft_created','outbox',v_id::text,
    jsonb_build_object('status',v_status,'purpose',p_purpose,'channel',p_channel)
  );

  return jsonb_build_object('id',v_id,'status',v_status,'reason',v_reason);
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.sunday_staffing_plan(p_ws uuid, p_plan uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_intel jsonb;
  v_role jsonb;
  v_candidate jsonb;
  v_used uuid[] := '{}'::uuid[];
  v_assignments jsonb := '[]'::jsonb;
  v_gaps jsonb := '[]'::jsonb;
  v_open integer;
  v_added integer;
  v_person uuid;
begin
  v_intel := toolkit_core.sunday_staffing_intelligence(p_ws,p_plan);
  if v_intel is null then return null; end if;

  for v_role in
    select value
    from jsonb_array_elements(v_intel->'roles')
    order by
      (value->>'eligible_count')::integer asc,
      (value->>'open_spots')::integer desc,
      value->>'role_name'
  loop
    v_open := coalesce((v_role->>'open_spots')::integer,0);
    v_added := 0;

    for v_candidate in
      select value
      from jsonb_array_elements(coalesce(v_role->'candidates','[]'::jsonb))
      order by (value->>'rank')::integer
    loop
      exit when v_added >= v_open;
      v_person := (v_candidate->>'person_id')::uuid;

      if not (v_person = any(v_used)) then
        v_assignments := v_assignments || jsonb_build_array(jsonb_build_object(
          'role_id',v_role->>'role_id',
          'role_name',v_role->>'role_name',
          'person_id',v_candidate->>'person_id',
          'person_name',v_candidate->>'person_name',
          'rank',v_candidate->'rank',
          'reasons',v_candidate->'reasons'
        ));
        v_used := array_append(v_used,v_person);
        v_added := v_added + 1;
      end if;
    end loop;

    if v_added < v_open then
      v_gaps := v_gaps || jsonb_build_array(jsonb_build_object(
        'role_id',v_role->>'role_id',
        'role_name',v_role->>'role_name',
        'open_spots',v_open,
        'recommended',v_added,
        'still_open',v_open-v_added,
        'blocked_counts',v_role->'blocked_counts'
      ));
    end if;
  end loop;

  return jsonb_build_object(
    'plan_id',p_plan,
    'assignments',v_assignments,
    'gaps',v_gaps,
    'automatic_assignment',false,
    'automatic_contact',false
  );
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.execute_approved_proposal(p_proposal uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  ap toolkit_core.action_proposals%rowtype;
  v_kind text;
  v_attempt bigint;
  v_item jsonb;
  v_role uuid;
  v_person uuid;
  v_plan uuid;
  v_assignment uuid;
  v_channel text;
  v_name text;
  v_role_name text;
  v_message jsonb;
  v_assignments integer := 0;
  v_drafts integer := 0;
  v_result jsonb := '{}'::jsonb;
  v_sermon uuid;
  v_request uuid;
  v_group uuid;
  v_age text;
  v_pack jsonb;
begin
  select * into ap
  from toolkit_core.action_proposals
  where id=p_proposal
  for update;

  if not found then
    raise exception 'proposal not found' using errcode='P0002';
  end if;

  if ap.status='executed' and ap.executed_at is not null then
    return jsonb_build_object('status','already_executed','proposal_id',ap.id);
  end if;

  if ap.status <> 'approved' or ap.decided_by is null then
    raise exception 'proposal is not approved' using errcode='42501';
  end if;

  v_kind := nullif(ap.proposed_action->>'kind','');
  if v_kind is null then
    raise exception 'proposal has no executable action' using errcode='22023';
  end if;

  insert into toolkit_core.proposal_execution_attempts(
    workspace_id,proposal_id,action_kind,status
  ) values (
    ap.workspace_id,ap.id,v_kind,'running'
  ) returning id into v_attempt;

  begin
    if v_kind='prepare_sunday_lineup' then
      v_plan := (ap.proposed_action->>'plan_id')::uuid;

      if not exists (
        select 1 from toolkit_core.service_plans
        where id=v_plan and workspace_id=ap.workspace_id
      ) then
        raise exception 'service plan not found';
      end if;

      for v_item in
        select value from jsonb_array_elements(coalesce(ap.proposed_action->'assignments','[]'::jsonb))
      loop
        v_role := (v_item->>'role_id')::uuid;
        v_person := (v_item->>'person_id')::uuid;
        v_role_name := coalesce(v_item->>'role_name','Volunteer');

        if not exists (
          select 1
          from toolkit_core.service_roles sr
          join toolkit_core.service_plans sp on sp.id=sr.plan_id
          where sr.id=v_role and sr.plan_id=v_plan and sp.workspace_id=ap.workspace_id
        ) then
          continue;
        end if;

        if not exists (
          select 1
          from jsonb_array_elements(
            coalesce(
              (
                select r->'candidates'
                from jsonb_array_elements(
                  toolkit_core.sunday_staffing_intelligence(ap.workspace_id,v_plan)->'roles'
                ) r
                where r->>'role_id'=v_role::text
                limit 1
              ),
              '[]'::jsonb
            )
          ) c
          where c->>'person_id'=v_person::text
        ) then
          continue;
        end if;

        if (
          select count(*)
          from toolkit_core.role_assignments ra
          where ra.role_id=v_role and ra.status <> 'declined'
        ) >= (
          select needed from toolkit_core.service_roles where id=v_role
        ) then
          continue;
        end if;

        insert into toolkit_core.role_assignments(role_id,person_id,status,created_by)
        values(v_role,v_person,'assigned',ap.decided_by)
        on conflict (role_id,person_id) do update
          set status = case
            when toolkit_core.role_assignments.status='confirmed' then 'confirmed'
            else 'assigned'
          end
        returning id into v_assignment;

        v_assignments := v_assignments + 1;

        select preferred_channel,
               trim(first_name || ' ' || coalesce(last_name,''))
        into v_channel,v_name
        from toolkit_core.people
        where id=v_person and workspace_id=ap.workspace_id;

        if v_channel in ('sms','email') then
          v_message := toolkit_core.queue_message_draft_internal(
            ap.workspace_id,
            v_person,
            v_channel,
            'volunteer_contact',
            'Hi ' || coalesce(nullif(split_part(v_name,' ',1),''),'there') ||
            ', would you be able to serve with ' || v_role_name ||
            ' for the upcoming service? Please reply yes or no.',
            ap.decided_by,
            'assignment',
            v_assignment
          );
          if v_message->>'status' in ('pending_approval','blocked') then
            v_drafts := v_drafts + 1;
          end if;
        end if;
      end loop;

      v_result := jsonb_build_object(
        'assignments_prepared',v_assignments,
        'message_drafts_created',v_drafts,
        'messages_sent',0
      );

    elsif v_kind='create_task' then
      if nullif(trim(coalesce(ap.proposed_action->>'title','')),'') is null then
        raise exception 'task title is required';
      end if;

      insert into toolkit_core.tasks(
        workspace_id,title,notes,due_date,assignee_user,source,created_by
      ) values (
        ap.workspace_id,
        left(trim(ap.proposed_action->>'title'),200),
        nullif(left(trim(coalesce(ap.proposed_action->>'notes','')),2000),''),
        nullif(ap.proposed_action->>'due_date','')::date,
        nullif(ap.proposed_action->>'assignee_user','')::uuid,
        'system',
        ap.decided_by
      );

      v_result := jsonb_build_object('tasks_created',1);

    elsif v_kind='guest_followup_draft' then
      select cs.person_id
      into v_person
      from toolkit_core.connect_submissions cs
      where cs.id=(ap.proposed_action->>'submission_id')::bigint
        and cs.workspace_id=ap.workspace_id
        and cs.contact_ok
        and cs.person_id is not null;

      if v_person is null then
        raise exception 'guest submission is not contactable';
      end if;

      select preferred_channel,
             trim(first_name || ' ' || coalesce(last_name,''))
      into v_channel,v_name
      from toolkit_core.people
      where id=v_person and workspace_id=ap.workspace_id;

      if v_channel not in ('sms','email') then
        if exists(select 1 from toolkit_core.people where id=v_person and workspace_id=ap.workspace_id and phone is not null) then
          v_channel := 'sms';
        elsif exists(select 1 from toolkit_core.people where id=v_person and workspace_id=ap.workspace_id and email is not null) then
          v_channel := 'email';
        else
          raise exception 'guest has no contact channel';
        end if;
      end if;

      v_message := toolkit_core.queue_message_draft_internal(
        ap.workspace_id,
        v_person,
        v_channel,
        'guest_followup',
        'Hi ' || coalesce(nullif(split_part(v_name,' ',1),''),'there') ||
        ', thanks for connecting with us. We are glad you reached out and would love to help you take a next step.',
        ap.decided_by,
        null,
        null
      );

      v_result := jsonb_build_object(
        'message_draft',v_message,
        'messages_sent',0
      );

    elsif v_kind='request_sermon_content_pack' then
      v_sermon := (ap.proposed_action->>'sermon_id')::uuid;
      v_pack := toolkit_core.request_sermon_content_pack_internal(
        ap.workspace_id,
        v_sermon,
        ap.decided_by
      );
      v_result := jsonb_build_object('content_pack',v_pack);

    elsif v_kind='approve_group_request' then
      v_request := (ap.proposed_action->>'request_id')::uuid;

      select gr.group_id,gr.person_id
      into v_group,v_person
      from toolkit_core.group_requests gr
      where gr.id=v_request
        and gr.workspace_id=ap.workspace_id
        and gr.status='new'
      for update;

      if v_group is null or v_person is null then
        raise exception 'group request is no longer available';
      end if;

      select age_group into v_age
      from toolkit_core.people
      where id=v_person and workspace_id=ap.workspace_id;

      if v_age='minor' then
        raise exception 'groups are for adults for now';
      end if;

      insert into toolkit_core.group_members(group_id,person_id,workspace_id,role)
      values(v_group,v_person,ap.workspace_id,'member')
      on conflict(group_id,person_id) do nothing;

      update toolkit_core.group_requests
         set status='added',
             resolved_by=ap.decided_by,
             resolved_at=now()
       where id=v_request;

      insert into toolkit_core.audit_events(
        workspace_id,actor_id,action,target_type,target_id,meta
      ) values (
        ap.workspace_id,ap.decided_by,'group_request.added','group',v_group::text,
        jsonb_build_object('request_id',v_request)
      );

      v_result := jsonb_build_object(
        'group_request',v_request,
        'status','added'
      );

    else
      raise exception 'unsupported proposal action: %',v_kind using errcode='22023';
    end if;

    update toolkit_core.action_proposals
       set status='executed',
           executed_at=now()
     where id=ap.id;

    update toolkit_core.proposal_execution_attempts
       set status='succeeded',
           result=v_result,
           finished_at=now()
     where id=v_attempt;

    insert into toolkit_core.audit_events(
      workspace_id,actor_id,action,target_type,target_id,meta
    ) values (
      ap.workspace_id,ap.decided_by,'automation.proposal_executed',
      'action_proposal',ap.id::text,
      jsonb_build_object('action_kind',v_kind,'result',v_result)
    );

    perform toolkit_core.emit_event(
      ap.workspace_id,
      'automation.proposal_executed',
      'action_proposal',
      ap.id::text,
      jsonb_build_object('action_kind',v_kind),
      'system'
    );

    return jsonb_build_object(
      'status','executed',
      'proposal_id',ap.id,
      'action_kind',v_kind,
      'result',v_result
    );

  exception when others then
    update toolkit_core.proposal_execution_attempts
       set status='failed',
           error_message=left(sqlerrm,1200),
           finished_at=now()
     where id=v_attempt;
    raise;
  end;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.execute_approved_proposals(p_limit integer DEFAULT 25)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  p record;
  v_ok integer := 0;
  v_fail integer := 0;
  v_errors jsonb := '[]'::jsonb;
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception 'invalid execution limit' using errcode='22023';
  end if;

  for p in
    select id
    from toolkit_core.action_proposals
    where status='approved'
      and executed_at is null
      and proposed_action ? 'kind'
    order by decided_at nulls last,created_at
    limit p_limit
  loop
    begin
      perform toolkit_core.execute_approved_proposal(p.id);
      v_ok := v_ok + 1;
    exception when others then
      v_fail := v_fail + 1;
      v_errors := v_errors || jsonb_build_array(jsonb_build_object(
        'proposal_id',p.id,
        'error',left(sqlerrm,300)
      ));
    end;
  end loop;

  return jsonb_build_object(
    'executed',v_ok,
    'failed',v_fail,
    'errors',v_errors
  );
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.ai_provider_active(p_ws uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists(
    select 1 from toolkit_core.provider_connections
    where workspace_id=p_ws
      and provider_type='ai'
      and status='active'
  );
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.request_sermon_content_pack_internal(p_ws uuid, p_sermon uuid, p_actor uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  s record;
  k text;
  v_status text;
  v_count integer := 0;
begin
  if p_actor is null or not toolkit_core.is_member_of(p_ws,p_actor) then
    raise exception 'invalid acting member' using errcode='42501';
  end if;

  select id,title,scripture,summary,preached_on,status
  into s
  from toolkit_core.sermons
  where id=p_sermon and workspace_id=p_ws;

  if not found then raise exception 'sermon not found' using errcode='P0002'; end if;

  v_status := case when toolkit_core.ai_provider_active(p_ws) then 'queued' else 'waiting_provider' end;

  foreach k in array array[
    'bulletin_summary','sermon_slides','sunday_recap','devotional_5_day',
    'group_discussion','midweek_email','social_posts','short_video_prompts',
    'newsletter_paragraph'
  ]
  loop
    insert into toolkit_core.ai_generations(
      workspace_id,source_type,source_id,generation_kind,idempotency_key,
      status,input_snapshot,requested_by
    ) values (
      p_ws,'sermon',p_sermon,k,
      'sermon:'||p_sermon::text||':'||k||':v1',
      v_status,
      jsonb_strip_nulls(jsonb_build_object(
        'title',s.title,
        'scripture',s.scripture,
        'summary',s.summary,
        'preached_on',s.preached_on,
        'status',s.status
      )),
      p_actor
    )
    on conflict (workspace_id,idempotency_key) do nothing;

    if found then v_count := v_count + 1; end if;
  end loop;

  insert into toolkit_core.audit_events(
    workspace_id,actor_id,action,target_type,target_id,meta
  ) values (
    p_ws,p_actor,'content.pack_requested','sermon',p_sermon::text,
    jsonb_build_object('created',v_count,'status',v_status)
  );

  return jsonb_build_object(
    'created',v_count,
    'status',v_status,
    'provider_active',toolkit_core.ai_provider_active(p_ws)
  );
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_get_church_voice(p_ws uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v jsonb;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin']) then
    raise exception 'not allowed' using errcode='42501';
  end if;

  select to_jsonb(x) - 'workspace_id' - 'updated_by'
  into v
  from toolkit_core.church_voice_profiles x
  where x.workspace_id=p_ws;

  return coalesce(v,jsonb_build_object(
    'service_term','service',
    'tone','warm',
    'formality','conversational',
    'emoji_style','minimal',
    'phrases_use','[]'::jsonb,
    'phrases_avoid','[]'::jsonb
  ));
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_set_church_voice(p_ws uuid, p_bible_translation text, p_service_term text, p_tone text, p_formality text, p_emoji_style text, p_announcement_style text, p_mission_values text, p_phrases_use text[], p_phrases_avoid text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin']) then
    raise exception 'not allowed' using errcode='42501';
  end if;

  insert into toolkit_core.church_voice_profiles(
    workspace_id,bible_translation,service_term,tone,formality,emoji_style,
    announcement_style,mission_values,phrases_use,phrases_avoid,updated_by,updated_at
  ) values (
    p_ws,nullif(trim(coalesce(p_bible_translation,'')),''),
    left(coalesce(nullif(trim(p_service_term),''),'service'),40),
    left(coalesce(nullif(trim(p_tone),''),'warm'),40),
    left(coalesce(nullif(trim(p_formality),''),'conversational'),40),
    left(coalesce(nullif(trim(p_emoji_style),''),'minimal'),40),
    nullif(left(trim(coalesce(p_announcement_style,'')),500),''),
    nullif(left(trim(coalesce(p_mission_values,'')),1000),''),
    coalesce(p_phrases_use,'{}'::text[]),
    coalesce(p_phrases_avoid,'{}'::text[]),
    auth.uid(),now()
  )
  on conflict(workspace_id) do update set
    bible_translation=excluded.bible_translation,
    service_term=excluded.service_term,
    tone=excluded.tone,
    formality=excluded.formality,
    emoji_style=excluded.emoji_style,
    announcement_style=excluded.announcement_style,
    mission_values=excluded.mission_values,
    phrases_use=excluded.phrases_use,
    phrases_avoid=excluded.phrases_avoid,
    updated_by=auth.uid(),
    updated_at=now();

  insert into toolkit_core.audit_events(
    workspace_id,actor_id,action,target_type,target_id
  ) values (
    p_ws,auth.uid(),'church_voice.updated','workspace',p_ws::text
  );
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.refresh_learned_rhythms(p_ws uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_count integer := 0;
begin
  with patterns as (
    select
      extract(dow from sp.starts_at at time zone w.timezone)::integer as dow,
      (sp.starts_at at time zone w.timezone)::time(0) as tm,
      count(*) as n
    from toolkit_core.service_plans sp
    join toolkit_core.workspaces w on w.id=sp.workspace_id
    where sp.workspace_id=p_ws
      and sp.starts_at >= now()-interval '180 days'
      and sp.starts_at <= now()+interval '90 days'
    group by 1,2
    having count(*) >= 3
  )
  insert into toolkit_core.church_rhythms(
    workspace_id,rhythm_key,kind,label,day_of_week,time_local,cadence,source,confidence,active,updated_at
  )
  select
    p_ws,
    'service:'||dow::text||':'||to_char(tm,'HH24:MI'),
    'service',
    'Recurring service',
    dow,tm,'weekly','learned',
    least(0.99,0.60 + n::numeric*0.05),
    true,now()
  from patterns
  on conflict(workspace_id,rhythm_key) do update set
    day_of_week=excluded.day_of_week,
    time_local=excluded.time_local,
    confidence=excluded.confidence,
    active=true,
    updated_at=now();

  get diagnostics v_count = row_count;
  return v_count;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_list_church_rhythms(p_ws uuid)
 RETURNS TABLE(id uuid, kind text, label text, day_of_week integer, time_local time without time zone, cadence text, source text, confidence numeric, active boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then
    return;
  end if;

  return query
  select r.id,r.kind,r.label,r.day_of_week,r.time_local,r.cadence,r.source,r.confidence,r.active
  from toolkit_core.church_rhythms r
  where r.workspace_id=p_ws and r.active
  order by r.kind,r.day_of_week nulls last,r.time_local nulls last,r.label;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_provider_status(p_ws uuid)
 RETURNS TABLE(provider_type text, provider_name text, status text, connected_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin']) then
    return;
  end if;

  return query
  select p.provider_type,p.provider_name,p.status,p.connected_at
  from toolkit_core.provider_connections p
  where p.workspace_id=p_ws
  order by p.provider_type,p.provider_name;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_operator_snapshot(p_ws uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_staff boolean;
  v_next record;
  v_needed integer:=0;
  v_filled integer:=0;
  v_confirmed integer:=0;
  v_run integer:=0;
  v_sermon boolean:=false;
  v_local_date date;
  v_tz text;
  v_pending integer:=0;
  v_open_tasks integer:=0;
  v_overdue integer:=0;
  v_expiring integer:=0;
  v_guests integer:=0;
  v_group_requests integer:=0;
  v_kids_rooms_at_risk integer:=0;
  v_private_care_due integer:=0;
  v_my_assignments jsonb:='[]'::jsonb;
begin
  if not toolkit_core.is_member(p_ws) then
    raise exception 'not allowed' using errcode='42501';
  end if;
  v_staff:=toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']);
  select sp.id,sp.title,sp.starts_at into v_next
  from toolkit_core.service_plans sp
  where sp.workspace_id=p_ws and sp.starts_at>=now()
  order by sp.starts_at limit 1;
  if v_staff then
    select timezone into v_tz from toolkit_core.workspaces where id=p_ws;
    if v_next.id is not null then
      select coalesce(sum(sr.needed),0)::integer,
             coalesce(count(ra.id) filter(where ra.status<>'declined'),0)::integer,
             coalesce(count(ra.id) filter(where ra.status='confirmed'),0)::integer
      into v_needed,v_filled,v_confirmed
      from toolkit_core.service_roles sr
      left join toolkit_core.role_assignments ra on ra.role_id=sr.id
      where sr.plan_id=v_next.id;
      select count(*) into v_run from toolkit_core.run_sheet_items where plan_id=v_next.id;
      v_local_date:=(v_next.starts_at at time zone coalesce(v_tz,'UTC'))::date;
      select exists(select 1 from toolkit_core.sermons
                    where workspace_id=p_ws and preached_on=v_local_date and status<>'archived')
      into v_sermon;
    end if;
    select count(*) into v_pending from toolkit_core.action_proposals
    where workspace_id=p_ws and status='pending' and (expires_at is null or expires_at>now());
    select count(*) into v_open_tasks from toolkit_core.tasks where workspace_id=p_ws and status='open';
    select count(*) into v_overdue from toolkit_core.tasks where workspace_id=p_ws and status='open' and due_date<current_date;
    select count(*) into v_expiring from toolkit_core.documents
    where workspace_id=p_ws and expires_on between current_date and current_date+30;
    select count(*) into v_guests from toolkit_core.connect_submissions
    where workspace_id=p_ws and created_at>=now()-interval '7 days' and result in ('created','existing');
    select count(*) into v_group_requests from toolkit_core.group_requests
    where workspace_id=p_ws and status='new';
    if coalesce((select enabled from toolkit_core.workspace_features where workspace_id=p_ws and module='kids'),false)
       and toolkit_core.kids_team(p_ws) then
      select count(*)::integer into v_kids_rooms_at_risk
      from toolkit_core.kids_rooms r
      cross join lateral (
        select count(*) n from toolkit_core.kids_checkins k
        where k.room_id=r.id and k.checked_out_at is null and k.checked_in_at>now()-interval '18 hours'
      ) c
      cross join lateral (
        select count(*) n from toolkit_core.kids_duty u
        where u.room_id=r.id and u.off_at is null and u.on_at>now()-interval '18 hours'
      ) d
      where r.workspace_id=p_ws and r.active and c.n>0
        and (d.n<2 or c.n>d.n*r.ratio);
    end if;
    if coalesce((select enabled from toolkit_core.workspace_features where workspace_id=p_ws and module='care'),false)
       and toolkit_core.is_member(p_ws,array['owner','pastor']) then
      select count(*)::integer into v_private_care_due
      from toolkit_core.care_notes c
      where c.workspace_id=p_ws and c.status='open'
        and c.follow_up_on is not null and c.follow_up_on<=current_date;
    end if;
  else
    select count(*) into v_open_tasks from toolkit_core.tasks
    where workspace_id=p_ws and status='open' and assignee_user=auth.uid();
    select count(*) into v_overdue from toolkit_core.tasks
    where workspace_id=p_ws and status='open' and assignee_user=auth.uid() and due_date<current_date;
    if v_next.id is not null then
      select coalesce(jsonb_agg(jsonb_build_object(
        'assignment_id',ra.id,'role',sr.name,'status',ra.status
      ) order by sr.position,sr.name),'[]'::jsonb)
      into v_my_assignments
      from toolkit_core.people pe
      join toolkit_core.role_assignments ra on ra.person_id=pe.id
      join toolkit_core.service_roles sr on sr.id=ra.role_id
      where pe.workspace_id=p_ws and pe.user_id=auth.uid()
        and sr.plan_id=v_next.id and ra.status<>'declined';
    end if;
  end if;
  return jsonb_build_object(
    'generated_at',now(),
    'next_sunday',
      case
        when v_next.id is null then null
        when v_staff then jsonb_build_object(
          'plan_id',v_next.id,'title',v_next.title,'starts_at',v_next.starts_at,
          'needed',v_needed,'filled',v_filled,'confirmed',v_confirmed,
          'open',greatest(v_needed-v_filled,0),
          'run_sheet_ready',v_run>0,'sermon_ready',v_sermon
        )
        else jsonb_build_object(
          'plan_id',v_next.id,'title',v_next.title,'starts_at',v_next.starts_at,
          'my_assignments',coalesce(v_my_assignments,'[]'::jsonb)
        )
      end,
    'needs_you',jsonb_build_object(
      'pending_proposals',case when v_staff then v_pending else 0 end,
      'overdue_tasks',v_overdue,
      'open_tasks',v_open_tasks,
      'expiring_documents_30d',case when v_staff then v_expiring else 0 end,
      'new_connects_7d',case when v_staff then v_guests else 0 end,
      'new_group_requests',case when v_staff then v_group_requests else 0 end,
      'kids_rooms_at_risk',case when v_staff then v_kids_rooms_at_risk else 0 end,
      'private_care_followups_due',case when v_staff then v_private_care_due else 0 end
    ),
    'scope',case when v_staff then 'staff' else 'personal' end
  );
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_ai_safe_week_status(p_ws uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then
    raise exception 'not allowed' using errcode='42501';
  end if;

  return public.tk_operator_snapshot(p_ws);
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.sync_default_automation_permissions()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_count integer := 0;
begin
  with desired as (
    select
      ap.workspace_id,
      ap.capability,
      case ap.capability
        when 'sunday' then coalesce((select enabled from toolkit_core.workspace_features f where f.workspace_id=ap.workspace_id and f.module='services'),false)
        when 'volunteers' then coalesce((select enabled from toolkit_core.workspace_features f where f.workspace_id=ap.workspace_id and f.module='volunteers'),false)
        when 'guests' then coalesce((select enabled from toolkit_core.workspace_features f where f.workspace_id=ap.workspace_id and f.module='guests'),false)
        when 'content' then coalesce((select enabled from toolkit_core.workspace_features f where f.workspace_id=ap.workspace_id and f.module='sermons'),false)
        when 'renewals' then coalesce((select enabled from toolkit_core.workspace_features f where f.workspace_id=ap.workspace_id and f.module='vault'),false)
        when 'operator' then coalesce((select enabled from toolkit_core.workspace_features f where f.workspace_id=ap.workspace_id and f.module='week'),false)
        when 'events' then coalesce((select enabled from toolkit_core.workspace_features f where f.workspace_id=ap.workspace_id and f.module='events'),false)
        when 'groups' then coalesce((select enabled from toolkit_core.workspace_features f where f.workspace_id=ap.workspace_id and f.module='groups'),false)
        when 'missions' then coalesce((select enabled from toolkit_core.workspace_features f where f.workspace_id=ap.workspace_id and f.module='missions'),false)
        when 'data_hygiene' then coalesce((select enabled from toolkit_core.workspace_features f where f.workspace_id=ap.workspace_id and f.module='people'),false)
        else ap.enabled
      end as should_enable
    from toolkit_core.automation_permissions ap
    where ap.updated_by is null
      and ap.capability in ('sunday','volunteers','guests','content','renewals','operator','events','groups','missions','data_hygiene')
  )
  update toolkit_core.automation_permissions ap
     set enabled=d.should_enable,
         autonomy_level='prepare',
         updated_at=now()
    from desired d
   where ap.workspace_id=d.workspace_id
     and ap.capability=d.capability
     and (ap.enabled is distinct from d.should_enable or ap.autonomy_level<>'prepare');

  get diagnostics v_count = row_count;
  return v_count;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.domain_signal_sweep()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  d record;
  e record;
  m record;
  v_count integer := 0;
  v_days integer;
  v_registered integer;
  v_ratio numeric;
  v_last date;
begin
  for d in
    select doc.*
    from toolkit_core.documents doc
    join toolkit_core.automation_permissions ap
      on ap.workspace_id=doc.workspace_id
     and ap.capability='renewals'
     and ap.enabled
     and toolkit_core.autonomy_rank(ap.autonomy_level)>=toolkit_core.autonomy_rank('prepare')
    where doc.expires_on is not null
  loop
    v_days := d.expires_on-current_date;

    perform toolkit_core.set_signal_state(
      d.workspace_id,
      'renewal:'||d.id::text||':60',
      'document.expiry.60d',
      'document',
      d.id::text,
      v_days between 31 and 60,
      jsonb_build_object('expires_on',d.expires_on,'days_remaining',v_days,'folder',d.folder,'restricted',d.restricted),
      'document.expiry.60d_resolved'
    );

    perform toolkit_core.set_signal_state(
      d.workspace_id,
      'renewal:'||d.id::text||':30',
      'document.expiry.30d',
      'document',
      d.id::text,
      v_days between 15 and 30,
      jsonb_build_object('expires_on',d.expires_on,'days_remaining',v_days,'folder',d.folder,'restricted',d.restricted),
      'document.expiry.30d_resolved'
    );

    perform toolkit_core.set_signal_state(
      d.workspace_id,
      'renewal:'||d.id::text||':14',
      'document.expiry.14d',
      'document',
      d.id::text,
      v_days between 0 and 14,
      jsonb_build_object('expires_on',d.expires_on,'days_remaining',v_days,'folder',d.folder,'restricted',d.restricted),
      'document.expiry.14d_resolved'
    );

    perform toolkit_core.set_signal_state(
      d.workspace_id,
      'renewal:'||d.id::text||':expired',
      'document.expiry.expired',
      'document',
      d.id::text,
      v_days < 0,
      jsonb_build_object('expires_on',d.expires_on,'days_overdue',abs(v_days),'folder',d.folder,'restricted',d.restricted),
      'document.expiry.expired_resolved'
    );

    if v_days <= 60 then v_count := v_count+1; end if;
  end loop;

  for e in
    select es.item_id,es.workspace_id,es.capacity,ci.starts_at
    from toolkit_core.event_signups es
    join toolkit_core.calendar_items ci on ci.id=es.item_id
    join toolkit_core.automation_permissions ap
      on ap.workspace_id=es.workspace_id
     and ap.capability='events'
     and ap.enabled
     and toolkit_core.autonomy_rank(ap.autonomy_level)>=toolkit_core.autonomy_rank('prepare')
    where es.capacity is not null
      and es.capacity>0
      and ci.starts_at>=now()
  loop
    select coalesce(sum(party_size),0)::integer
      into v_registered
    from toolkit_core.event_registrations
    where item_id=e.item_id and status='registered';

    v_ratio := v_registered::numeric/e.capacity::numeric;

    perform toolkit_core.set_signal_state(
      e.workspace_id,
      'event:'||e.item_id::text||':80',
      'event.capacity.80pct',
      'calendar_item',
      e.item_id::text,
      v_ratio>=0.80 and v_ratio<1,
      jsonb_build_object('registered',v_registered,'capacity',e.capacity,'ratio',round(v_ratio,3),'starts_at',e.starts_at),
      'event.capacity.80pct_resolved'
    );

    perform toolkit_core.set_signal_state(
      e.workspace_id,
      'event:'||e.item_id::text||':full',
      'event.capacity.full',
      'calendar_item',
      e.item_id::text,
      v_ratio>=1,
      jsonb_build_object('registered',v_registered,'capacity',e.capacity,'ratio',round(v_ratio,3),'starts_at',e.starts_at),
      'event.capacity.full_resolved'
    );

    if v_ratio>=0.80 then v_count := v_count+1; end if;
  end loop;

  for m in
    select mp.id,mp.workspace_id,mp.sensitive
    from toolkit_core.mission_partners mp
    join toolkit_core.automation_permissions ap
      on ap.workspace_id=mp.workspace_id
     and ap.capability='missions'
     and ap.enabled
     and toolkit_core.autonomy_rank(ap.autonomy_level)>=toolkit_core.autonomy_rank('prepare')
    where mp.status='active'
  loop
    select max(mu.posted_on) into v_last
    from toolkit_core.mission_updates mu
    where mu.partner_id=m.id;

    perform toolkit_core.set_signal_state(
      m.workspace_id,
      'mission:'||m.id::text||':stale',
      'mission.update_stale',
      'mission_partner',
      m.id::text,
      v_last is null or v_last<current_date-45,
      jsonb_build_object(
        'days_since_update',case when v_last is null then null else current_date-v_last end,
        'has_prior_update',v_last is not null,
        'sensitive',m.sensitive
      ),
      'mission.update_current'
    );

    if v_last is null or v_last<current_date-45 then v_count:=v_count+1; end if;
  end loop;

  return v_count;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.enrich_pending_domain_proposals()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  ap record;
  d record;
  e record;
  g record;
  m record;
  v_count integer := 0;
  v_due date;
begin
  for ap in
    select *
    from toolkit_core.action_proposals
    where status='pending'
      and proposed_action='{}'::jsonb
      and proposal_type in (
        'guest_followup','sermon_content_pack','document_renewal',
        'event_capacity','group_request','mission_update_followup'
      )
  loop
    if ap.proposal_type='guest_followup'
       and ap.entity_type='connect_submission'
       and ap.entity_id ~ '^[0-9]+$' then
      update toolkit_core.action_proposals
         set proposed_action=jsonb_build_object(
           'kind','guest_followup_draft',
           'submission_id',ap.entity_id::bigint
         )
       where id=ap.id;
      v_count:=v_count+1;

    elsif ap.proposal_type='sermon_content_pack'
       and ap.entity_type='sermon'
       and ap.entity_id ~ '^[0-9a-fA-F-]{36}$' then
      update toolkit_core.action_proposals
         set proposed_action=jsonb_build_object(
           'kind','request_sermon_content_pack',
           'sermon_id',ap.entity_id
         )
       where id=ap.id;
      v_count:=v_count+1;

    elsif ap.proposal_type='document_renewal'
       and ap.entity_type='document'
       and ap.entity_id ~ '^[0-9a-fA-F-]{36}$' then
      select id,name,expires_on,folder into d
      from toolkit_core.documents
      where id=ap.entity_id::uuid and workspace_id=ap.workspace_id;

      if found then
        v_due:=greatest(current_date,coalesce(d.expires_on,current_date)-7);
        update toolkit_core.action_proposals
           set proposed_action=jsonb_build_object(
             'kind','create_task',
             'title',left('Renew: '||d.name,200),
             'notes','Vault renewal follow-up. Document expires '||coalesce(d.expires_on::text,'without a recorded date')||'.',
             'due_date',v_due
           )
         where id=ap.id;
        v_count:=v_count+1;
      end if;

    elsif ap.proposal_type='event_capacity'
       and ap.entity_type='calendar_item'
       and ap.entity_id ~ '^[0-9a-fA-F-]{36}$' then
      select id,title,starts_at into e
      from toolkit_core.calendar_items
      where id=ap.entity_id::uuid and workspace_id=ap.workspace_id;

      if found then
        update toolkit_core.action_proposals
           set proposed_action=jsonb_build_object(
             'kind','create_task',
             'title',left('Review event capacity: '||e.title,200),
             'notes','Registration reached a capacity threshold. Review space, staffing, waitlist, and communication.',
             'due_date',current_date
           )
         where id=ap.id;
        v_count:=v_count+1;
      end if;

    elsif ap.proposal_type='group_request'
       and ap.entity_type='group_request'
       and ap.entity_id ~ '^[0-9a-fA-F-]{36}$' then
      select id,group_id,person_id,status into g
      from toolkit_core.group_requests
      where id=ap.entity_id::uuid and workspace_id=ap.workspace_id;

      if found and g.status='new' and g.person_id is not null then
        update toolkit_core.action_proposals
           set proposed_action=jsonb_build_object(
             'kind','approve_group_request',
             'request_id',g.id,
             'group_id',g.group_id,
             'person_id',g.person_id
           )
         where id=ap.id;
        v_count:=v_count+1;
      end if;

    elsif ap.proposal_type='mission_update_followup'
       and ap.entity_type='mission_partner'
       and ap.entity_id ~ '^[0-9a-fA-F-]{36}$' then
      select id,name,sensitive into m
      from toolkit_core.mission_partners
      where id=ap.entity_id::uuid and workspace_id=ap.workspace_id;

      if found then
        update toolkit_core.action_proposals
           set proposed_action=jsonb_build_object(
             'kind','create_task',
             'title',case when m.sensitive then 'Follow up with a mission partner' else left('Follow up with mission partner: '||m.name,200) end,
             'notes','Request or record a current mission partner update.',
             'due_date',current_date+7
           )
         where id=ap.id;
        v_count:=v_count+1;
      end if;
    end if;
  end loop;

  return v_count;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.refresh_all_learned_rhythms()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare w record; v_total integer:=0;
begin
  for w in select id from toolkit_core.workspaces loop
    v_total:=v_total+toolkit_core.refresh_learned_rhythms(w.id);
  end loop;
  return v_total;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.refresh_operational_graph(p_ws uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_count integer:=0; v_n integer;
begin
  delete from toolkit_core.operational_links
  where workspace_id=p_ws and source='derived';

  insert into toolkit_core.operational_links(workspace_id,from_type,from_id,relation,to_type,to_id)
  select p_ws,'service_plan',sp.id::text,'calendar_item','calendar_item',sp.calendar_item_id::text
  from toolkit_core.service_plans sp
  where sp.workspace_id=p_ws and sp.calendar_item_id is not null;
  get diagnostics v_n=row_count; v_count:=v_count+v_n;

  insert into toolkit_core.operational_links(workspace_id,from_type,from_id,relation,to_type,to_id)
  select p_ws,'service_role',sr.id::text,'belongs_to','service_plan',sr.plan_id::text
  from toolkit_core.service_roles sr
  join toolkit_core.service_plans sp on sp.id=sr.plan_id
  where sp.workspace_id=p_ws;
  get diagnostics v_n=row_count; v_count:=v_count+v_n;

  insert into toolkit_core.operational_links(workspace_id,from_type,from_id,relation,to_type,to_id)
  select p_ws,'role_assignment',ra.id::text,'role','service_role',ra.role_id::text
  from toolkit_core.role_assignments ra
  join toolkit_core.service_roles sr on sr.id=ra.role_id
  join toolkit_core.service_plans sp on sp.id=sr.plan_id
  where sp.workspace_id=p_ws;
  get diagnostics v_n=row_count; v_count:=v_count+v_n;

  insert into toolkit_core.operational_links(workspace_id,from_type,from_id,relation,to_type,to_id)
  select p_ws,'role_assignment',ra.id::text,'person','person',ra.person_id::text
  from toolkit_core.role_assignments ra
  join toolkit_core.service_roles sr on sr.id=ra.role_id
  join toolkit_core.service_plans sp on sp.id=sr.plan_id
  where sp.workspace_id=p_ws;
  get diagnostics v_n=row_count; v_count:=v_count+v_n;

  insert into toolkit_core.operational_links(workspace_id,from_type,from_id,relation,to_type,to_id)
  select p_ws,'sermon',s.id::text,'series','sermon_series',s.series_id::text
  from toolkit_core.sermons s
  where s.workspace_id=p_ws and s.series_id is not null;
  get diagnostics v_n=row_count; v_count:=v_count+v_n;

  insert into toolkit_core.operational_links(workspace_id,from_type,from_id,relation,to_type,to_id)
  select p_ws,'document',d.id::text,'calendar_item','calendar_item',d.calendar_item_id::text
  from toolkit_core.documents d
  where d.workspace_id=p_ws and d.calendar_item_id is not null;
  get diagnostics v_n=row_count; v_count:=v_count+v_n;

  insert into toolkit_core.operational_links(workspace_id,from_type,from_id,relation,to_type,to_id)
  select p_ws,'group',g.id::text,'study','study',g.study_id::text
  from toolkit_core.groups g
  where g.workspace_id=p_ws and g.study_id is not null;
  get diagnostics v_n=row_count; v_count:=v_count+v_n;

  insert into toolkit_core.operational_links(workspace_id,from_type,from_id,relation,to_type,to_id)
  select p_ws,'group_member',(gm.group_id::text||':'||gm.person_id::text),'group','group',gm.group_id::text
  from toolkit_core.group_members gm
  where gm.workspace_id=p_ws;
  get diagnostics v_n=row_count; v_count:=v_count+v_n;

  insert into toolkit_core.operational_links(workspace_id,from_type,from_id,relation,to_type,to_id)
  select p_ws,'group_member',(gm.group_id::text||':'||gm.person_id::text),'person','person',gm.person_id::text
  from toolkit_core.group_members gm
  where gm.workspace_id=p_ws;
  get diagnostics v_n=row_count; v_count:=v_count+v_n;

  insert into toolkit_core.operational_links(workspace_id,from_type,from_id,relation,to_type,to_id)
  select p_ws,'event_registration',er.id::text,'event','calendar_item',er.item_id::text
  from toolkit_core.event_registrations er
  where er.workspace_id=p_ws;
  get diagnostics v_n=row_count; v_count:=v_count+v_n;

  insert into toolkit_core.operational_links(workspace_id,from_type,from_id,relation,to_type,to_id)
  select p_ws,'event_registration',er.id::text,'person','person',er.person_id::text
  from toolkit_core.event_registrations er
  where er.workspace_id=p_ws and er.person_id is not null;
  get diagnostics v_n=row_count; v_count:=v_count+v_n;

  insert into toolkit_core.operational_links(workspace_id,from_type,from_id,relation,to_type,to_id)
  select p_ws,'mission_update',mu.id::text,'partner','mission_partner',mu.partner_id::text
  from toolkit_core.mission_updates mu
  where mu.workspace_id=p_ws;
  get diagnostics v_n=row_count; v_count:=v_count+v_n;

  insert into toolkit_core.operational_links(workspace_id,from_type,from_id,relation,to_type,to_id)
  select p_ws,'task',t.id::text,'calendar_item','calendar_item',t.calendar_item_id::text
  from toolkit_core.tasks t
  where t.workspace_id=p_ws and t.calendar_item_id is not null;
  get diagnostics v_n=row_count; v_count:=v_count+v_n;

  return v_count;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.refresh_all_operational_graphs()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare w record; v_total integer:=0;
begin
  for w in select id from toolkit_core.workspaces loop
    v_total:=v_total+toolkit_core.refresh_operational_graph(w.id);
  end loop;
  return v_total;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_save_memory_fact(p_ws uuid, p_key text, p_label text, p_category text, p_value jsonb, p_sensitivity text DEFAULT 'general'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin']) then
    raise exception 'not allowed' using errcode='42501';
  end if;
  if p_sensitivity not in ('general','restricted') then raise exception 'invalid sensitivity'; end if;
  if jsonb_typeof(coalesce(p_value,'{}'::jsonb)) not in ('object','array','string','number','boolean','null') then
    raise exception 'invalid value';
  end if;

  insert into toolkit_core.church_memory_facts(
    workspace_id,fact_key,label,category,value,sensitivity,created_by,updated_at
  ) values (
    p_ws,left(trim(p_key),160),left(trim(p_label),180),left(trim(coalesce(p_category,'general')),80),
    coalesce(p_value,'{}'::jsonb),p_sensitivity,auth.uid(),now()
  )
  on conflict(workspace_id,fact_key) do update set
    label=excluded.label,category=excluded.category,value=excluded.value,
    sensitivity=excluded.sensitivity,active=true,updated_at=now()
  returning id into v_id;

  return v_id;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_search_church_memory(p_ws uuid, p_query text, p_limit integer DEFAULT 30)
 RETURNS TABLE(source_type text, source_id text, label text, detail text, happened_on date)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare q text:='%'||lower(trim(coalesce(p_query,'')))||'%';
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then
    return;
  end if;
  if char_length(trim(coalesce(p_query,'')))<2 then raise exception 'search needs at least 2 characters'; end if;
  if p_limit<1 or p_limit>100 then raise exception 'invalid limit'; end if;

  return query
  select * from (
    select 'memory_fact'::text,m.id::text,m.label,left(m.value::text,500),m.created_at::date
    from toolkit_core.church_memory_facts m
    where m.workspace_id=p_ws and m.active
      and m.sensitivity='general'
      and (lower(m.label) like q or lower(m.value::text) like q)

    union all
    select 'calendar_item',c.id::text,c.title,left(coalesce(c.notes,c.location,''),500),
           (c.starts_at at time zone w.timezone)::date
    from toolkit_core.calendar_items c
    join toolkit_core.workspaces w on w.id=c.workspace_id
    where c.workspace_id=p_ws and lower(c.title) like q

    union all
    select 'service_plan',s.id::text,s.title,left(coalesce(s.theme,''),500),
           (s.starts_at at time zone w.timezone)::date
    from toolkit_core.service_plans s
    join toolkit_core.workspaces w on w.id=s.workspace_id
    where s.workspace_id=p_ws
      and (lower(s.title) like q or lower(coalesce(s.theme,'')) like q)

    union all
    select 'sermon',s.id::text,s.title,left(coalesce(s.scripture,'')||' '||coalesce(s.summary,''),500),s.preached_on
    from toolkit_core.sermons s
    where s.workspace_id=p_ws
      and (lower(s.title) like q or lower(coalesce(s.scripture,'')) like q or lower(coalesce(s.summary,'')) like q)

    union all
    select 'group',g.id::text,g.name,left(coalesce(g.description,''),500),g.created_at::date
    from toolkit_core.groups g
    where g.workspace_id=p_ws and lower(g.name) like q
  ) x
  order by happened_on desc nulls last
  limit p_limit;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_save_automation_policy(p_ws uuid, p_name text, p_natural text, p_kind text, p_structured jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin']) then
    raise exception 'not allowed' using errcode='42501';
  end if;
  if jsonb_typeof(coalesce(p_structured,'{}'::jsonb))<>'object' then raise exception 'structured rule must be an object'; end if;

  insert into toolkit_core.automation_policies(
    workspace_id,name,natural_language,policy_kind,structured_rule,status,created_by,updated_at
  ) values (
    p_ws,left(trim(p_name),120),left(trim(p_natural),1500),left(trim(coalesce(p_kind,'operational')),80),
    coalesce(p_structured,'{}'::jsonb),'proposed',auth.uid(),now()
  )
  on conflict(workspace_id,name) do update set
    natural_language=excluded.natural_language,
    policy_kind=excluded.policy_kind,
    structured_rule=excluded.structured_rule,
    status='proposed',
    confirmed_by=null,
    updated_at=now()
  returning id into v_id;

  return v_id;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_confirm_automation_policy(p_ws uuid, p_id uuid, p_confirm boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin']) then
    raise exception 'not allowed' using errcode='42501';
  end if;

  update toolkit_core.automation_policies
     set status=case when p_confirm then 'confirmed' else 'disabled' end,
         confirmed_by=case when p_confirm then auth.uid() else null end,
         updated_at=now()
   where id=p_id and workspace_id=p_ws;

  if not found then raise exception 'policy not found' using errcode='P0002'; end if;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_list_workflow_templates()
 RETURNS TABLE(template_key text, name text, capability text, description text, default_autonomy text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select t.template_key,t.name,t.capability,t.description,t.default_autonomy
  from toolkit_core.workflow_templates t
  where t.active
  order by t.name;
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.data_hygiene_sweep()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare d record; v_count integer:=0; v_a uuid; v_b uuid; v_key text;
begin
  for d in
    select p.workspace_id,lower(trim(p.email)) as match_value,array_agg(p.id order by p.id) ids
    from toolkit_core.people p
    join toolkit_core.automation_permissions ap
      on ap.workspace_id=p.workspace_id and ap.capability='data_hygiene'
     and ap.enabled and toolkit_core.autonomy_rank(ap.autonomy_level)>=2
    where p.email is not null and trim(p.email)<>'' and p.status<>'archived'
    group by p.workspace_id,lower(trim(p.email))
    having count(*)>1
  loop
    for v_a,v_b in
      select a,b from unnest(d.ids) a cross join unnest(d.ids) b where a<b
    loop
      v_key:='duplicate:email:'||v_a::text||':'||v_b::text;
      perform toolkit_core.set_signal_state(
        d.workspace_id,v_key,'data.duplicate_people','workspace',d.workspace_id::text,true,
        jsonb_build_object('person_a',v_a,'person_b',v_b,'match_on','email'),null
      );
      v_count:=v_count+1;
    end loop;
  end loop;

  for d in
    select p.workspace_id,regexp_replace(p.phone,'\D','','g') as match_value,array_agg(p.id order by p.id) ids
    from toolkit_core.people p
    join toolkit_core.automation_permissions ap
      on ap.workspace_id=p.workspace_id and ap.capability='data_hygiene'
     and ap.enabled and toolkit_core.autonomy_rank(ap.autonomy_level)>=2
    where p.phone is not null and length(regexp_replace(p.phone,'\D','','g'))>=7 and p.status<>'archived'
    group by p.workspace_id,regexp_replace(p.phone,'\D','','g')
    having count(*)>1
  loop
    for v_a,v_b in
      select a,b from unnest(d.ids) a cross join unnest(d.ids) b where a<b
    loop
      v_key:='duplicate:phone:'||v_a::text||':'||v_b::text;
      perform toolkit_core.set_signal_state(
        d.workspace_id,v_key,'data.duplicate_people','workspace',d.workspace_id::text,true,
        jsonb_build_object('person_a',v_a,'person_b',v_b,'match_on','phone'),null
      );
      v_count:=v_count+1;
    end loop;
  end loop;

  return v_count;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_staff_meeting_agenda(p_ws uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_snapshot jsonb; v_props jsonb; v_tasks jsonb; v_events jsonb;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then
    raise exception 'not allowed' using errcode='42501';
  end if;

  v_snapshot:=public.tk_operator_snapshot(p_ws);

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'title',title,'risk',risk_level,'type',proposal_type,'created_at',created_at
  ) order by created_at),'[]'::jsonb)
  into v_props
  from (
    select * from toolkit_core.action_proposals
    where workspace_id=p_ws and status='pending'
    order by created_at limit 15
  ) x;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'title',title,'due_date',due_date
  ) order by due_date nulls last,created_at),'[]'::jsonb)
  into v_tasks
  from (
    select * from toolkit_core.tasks
    where workspace_id=p_ws and status='open'
    order by due_date nulls last,created_at limit 20
  ) x;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'title',title,'starts_at',starts_at,'kind',kind
  ) order by starts_at),'[]'::jsonb)
  into v_events
  from (
    select * from toolkit_core.calendar_items
    where workspace_id=p_ws and starts_at between now() and now()+interval '21 days'
    order by starts_at limit 20
  ) x;

  return jsonb_build_object(
    'operator',v_snapshot,
    'pending_decisions',v_props,
    'open_tasks',v_tasks,
    'upcoming_calendar',v_events
  );
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_board_packet(p_ws uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_att jsonb;
  v_docs integer;
  v_tasks integer;
  v_events integer;
  v_props integer;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin']) then
    raise exception 'not allowed' using errcode='42501';
  end if;

  select jsonb_build_object(
    'services',count(*),
    'with_attendance',count(attendance),
    'average_attendance',round(avg(attendance)::numeric,1),
    'minimum_attendance',min(attendance),
    'maximum_attendance',max(attendance)
  ) into v_att
  from toolkit_core.service_plans
  where workspace_id=p_ws
    and starts_at between now()-interval '90 days' and now();

  select count(*) into v_docs
  from toolkit_core.documents
  where workspace_id=p_ws and expires_on between current_date and current_date+60;

  select count(*) into v_tasks
  from toolkit_core.tasks where workspace_id=p_ws and status='open';

  select count(*) into v_events
  from toolkit_core.calendar_items
  where workspace_id=p_ws and kind='event' and starts_at between now() and now()+interval '60 days';

  select count(*) into v_props
  from toolkit_core.action_proposals
  where workspace_id=p_ws and status='pending';

  return jsonb_build_object(
    'generated_at',now(),
    'attendance_90d',v_att,
    'documents_expiring_60d',v_docs,
    'open_tasks',v_tasks,
    'upcoming_events_60d',v_events,
    'pending_operational_decisions',v_props,
    'finance',jsonb_build_object('connected',false,'note','No finance source is connected to this packet.'),
    'governance_note','Churchly compiles operational facts; humans make governance decisions.'
  );
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_operational_signals(p_ws uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_events integer;
  v_docs integer;
  v_tasks integer;
  v_total integer;
  v_top3 integer;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then
    raise exception 'not allowed' using errcode='42501';
  end if;

  select count(*) into v_events
  from toolkit_core.calendar_items
  where workspace_id=p_ws and starts_at between now() and now()+interval '14 days';

  select count(*) into v_docs
  from toolkit_core.documents
  where workspace_id=p_ws and expires_on between current_date and current_date+30;

  select count(*) into v_tasks
  from toolkit_core.tasks
  where workspace_id=p_ws and status='open' and due_date<current_date;

  select count(*) into v_total
  from toolkit_core.role_assignments ra
  join toolkit_core.service_roles sr on sr.id=ra.role_id
  join toolkit_core.service_plans sp on sp.id=sr.plan_id
  where sp.workspace_id=p_ws
    and sp.starts_at between now()-interval '90 days' and now()
    and ra.status='confirmed';

  select coalesce(sum(n),0)::integer into v_top3
  from (
    select count(*) n
    from toolkit_core.role_assignments ra
    join toolkit_core.service_roles sr on sr.id=ra.role_id
    join toolkit_core.service_plans sp on sp.id=sr.plan_id
    where sp.workspace_id=p_ws
      and sp.starts_at between now()-interval '90 days' and now()
      and ra.status='confirmed'
    group by ra.person_id
    order by count(*) desc
    limit 3
  ) x;

  return jsonb_build_object(
    'calendar_items_next_14d',v_events,
    'documents_expiring_30d',v_docs,
    'overdue_tasks',v_tasks,
    'volunteer_concentration',jsonb_build_object(
      'confirmed_assignments_90d',v_total,
      'share_covered_by_top_3',case when v_total=0 then null else round(v_top3::numeric/v_total,3) end
    )
  );
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_seasonal_patterns(p_ws uuid)
 RETURNS TABLE(title text, years integer, last_date date, typical_month integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then return; end if;

  return query
  select lower(trim(c.title)) as title,
         count(distinct extract(year from c.starts_at))::integer as years,
         max(c.starts_at)::date as last_date,
         round(avg(extract(month from c.starts_at)))::integer as typical_month
  from toolkit_core.calendar_items c
  where c.workspace_id=p_ws
    and c.starts_at<now()
    and c.kind='event'
  group by lower(trim(c.title))
  having count(distinct extract(year from c.starts_at))>=2
  order by max(c.starts_at) desc;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_self_configure_suggestions(p_ws uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_people integer;
  v_services integer;
  v_rhythms integer;
  v_voice boolean;
  v_ai boolean;
  v_suggestions jsonb:='[]'::jsonb;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin']) then
    raise exception 'not allowed' using errcode='42501';
  end if;

  select count(*) into v_people from toolkit_core.people where workspace_id=p_ws and status<>'archived';
  select count(*) into v_services from toolkit_core.service_plans where workspace_id=p_ws;
  select count(*) into v_rhythms from toolkit_core.church_rhythms where workspace_id=p_ws and active;
  select exists(select 1 from toolkit_core.church_voice_profiles where workspace_id=p_ws) into v_voice;
  v_ai:=toolkit_core.ai_provider_active(p_ws);

  if v_people=0 then v_suggestions:=v_suggestions||jsonb_build_array('Import or add people so scheduling and follow-up can work.'); end if;
  if v_services=0 then v_suggestions:=v_suggestions||jsonb_build_array('Create the next service plan so Sunday automation can begin.'); end if;
  if v_services>0 and v_rhythms=0 then v_suggestions:=v_suggestions||jsonb_build_array('More repeated service history will let Churchly learn your normal weekly rhythm.'); end if;
  if not v_voice then v_suggestions:=v_suggestions||jsonb_build_array('Set Church Voice so future generated content matches your terminology and tone.'); end if;
  if not v_ai then v_suggestions:=v_suggestions||jsonb_build_array('AI content generation is dormant until an AI provider is securely connected.'); end if;

  return jsonb_build_object(
    'people',v_people,
    'service_plans',v_services,
    'learned_rhythms',v_rhythms,
    'church_voice_configured',v_voice,
    'ai_provider_active',v_ai,
    'suggestions',v_suggestions
  );
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_ai_safe_open_roles(p_ws uuid, p_plan uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v jsonb;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then
    raise exception 'not allowed' using errcode='42501';
  end if;
  v:=toolkit_core.sunday_staffing_intelligence(p_ws,p_plan);
  return v;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_ai_safe_guest_followups(p_ws uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v jsonb;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then
    raise exception 'not allowed' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'person_id',p.id,
    'name',trim(p.first_name||' '||coalesce(p.last_name,'')),
    'created_at',cs.created_at,
    'interests',cs.interests,
    'contact_ok',cs.contact_ok
  ) order by cs.created_at desc),'[]'::jsonb)
  into v
  from toolkit_core.connect_submissions cs
  join toolkit_core.people p on p.id=cs.person_id
  where cs.workspace_id=p_ws
    and cs.result in ('created','existing')
    and cs.created_at>=now()-interval '60 days';
  return v;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_ai_safe_event_status(p_ws uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v jsonb;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then
    raise exception 'not allowed' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'event_id',c.id,'title',c.title,'starts_at',c.starts_at,
    'capacity',es.capacity,
    'registered',coalesce((select sum(er.party_size) from toolkit_core.event_registrations er where er.item_id=c.id and er.status='registered'),0),
    'waitlist',coalesce((select count(*) from toolkit_core.event_registrations er where er.item_id=c.id and er.status='waitlist'),0)
  ) order by c.starts_at),'[]'::jsonb)
  into v
  from toolkit_core.calendar_items c
  left join toolkit_core.event_signups es on es.item_id=c.id
  where c.workspace_id=p_ws and c.kind='event' and c.starts_at>=now();
  return v;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_ai_safe_document_renewals(p_ws uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v jsonb;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then
    raise exception 'not allowed' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'document_id',d.id,'name',d.name,'folder',d.folder,'expires_on',d.expires_on,
    'days_remaining',d.expires_on-current_date,'restricted',d.restricted
  ) order by d.expires_on),'[]'::jsonb)
  into v
  from toolkit_core.documents d
  where d.workspace_id=p_ws
    and d.expires_on is not null
    and d.expires_on<=current_date+60
    and (not d.restricted or toolkit_core.is_member(p_ws,array['owner','pastor','admin']));
  return v;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_ai_safe_sermon_context(p_ws uuid, p_sermon uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v jsonb;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then
    raise exception 'not allowed' using errcode='42501';
  end if;
  select jsonb_build_object(
    'id',s.id,'title',s.title,'speaker',s.speaker,'preached_on',s.preached_on,
    'scripture',s.scripture,'summary',s.summary,'notes',s.notes,'status',s.status,
    'church_voice',coalesce((
      select to_jsonb(cv)-'workspace_id'-'updated_by'
      from toolkit_core.church_voice_profiles cv where cv.workspace_id=p_ws
    ),'{}'::jsonb)
  ) into v
  from toolkit_core.sermons s
  where s.id=p_sermon and s.workspace_id=p_ws;
  return v;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_ai_safe_group_status(p_ws uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v jsonb;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then
    raise exception 'not allowed' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'group_id',g.id,'name',g.name,'kind',g.kind,'status',g.status,'is_open',g.is_open,
    'members',(select count(*) from toolkit_core.group_members gm where gm.group_id=g.id),
    'last_meeting',(select max(held_on) from toolkit_core.group_meetings m where m.group_id=g.id)
  ) order by g.name),'[]'::jsonb)
  into v
  from toolkit_core.groups g
  where g.workspace_id=p_ws;
  return v;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_worker_set_provider_connection(p_ws uuid, p_type text, p_name text, p_status text, p_secret_ref text, p_config jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid;
begin
  if p_type not in ('ai','sms','email','calendar') then raise exception 'invalid provider type'; end if;
  if p_status not in ('not_configured','configured','active','error','disabled') then raise exception 'invalid provider status'; end if;
  if jsonb_typeof(coalesce(p_config,'{}'::jsonb))<>'object' then raise exception 'provider config must be object'; end if;
  if not exists(select 1 from toolkit_core.workspaces where id=p_ws) then raise exception 'workspace not found'; end if;

  insert into toolkit_core.provider_connections(
    workspace_id,provider_type,provider_name,status,secret_ref,config,connected_at,updated_at
  ) values (
    p_ws,p_type,left(trim(p_name),80),p_status,nullif(trim(coalesce(p_secret_ref,'')),''),
    coalesce(p_config,'{}'::jsonb),
    case when p_status in ('configured','active') then now() else null end,
    now()
  )
  on conflict(workspace_id,provider_type,provider_name) do update set
    status=excluded.status,
    secret_ref=excluded.secret_ref,
    config=excluded.config,
    connected_at=case when excluded.status in ('configured','active')
      then coalesce(toolkit_core.provider_connections.connected_at,now())
      else toolkit_core.provider_connections.connected_at end,
    updated_at=now()
  returning id into v_id;

  if p_type='ai' and p_status='active' then
    update toolkit_core.ai_generations
       set status='queued',updated_at=now()
     where workspace_id=p_ws and status='waiting_provider';
  end if;

  return v_id;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_worker_claim_ai_generations(p_worker text, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, workspace_id uuid, source_type text, source_id uuid, generation_kind text, input_snapshot jsonb, provider text, model text, attempts integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if char_length(trim(coalesce(p_worker,'')))<2 then raise exception 'invalid worker'; end if;
  if p_limit<1 or p_limit>50 then raise exception 'invalid limit'; end if;

  return query
  with due as (
    select g.id
    from toolkit_core.ai_generations g
    where g.status='queued'
      and toolkit_core.ai_provider_active(g.workspace_id)
    order by g.created_at
    for update skip locked
    limit p_limit
  ),
  claimed as (
    update toolkit_core.ai_generations g
       set status='running',
           attempts=g.attempts+1,
           locked_at=now(),
           locked_by=trim(p_worker),
           updated_at=now(),
           provider=coalesce(g.provider,(
             select pc.provider_name
             from toolkit_core.provider_connections pc
             where pc.workspace_id=g.workspace_id
               and pc.provider_type='ai' and pc.status='active'
             order by pc.connected_at desc nulls last
             limit 1
           ))
      from due
     where g.id=due.id
    returning g.id,g.workspace_id,g.source_type,g.source_id,g.generation_kind,
              g.input_snapshot,g.provider,g.model,g.attempts
  )
  select * from claimed;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_worker_finish_ai_generation(p_id uuid, p_worker text, p_success boolean, p_output text DEFAULT NULL::text, p_error text DEFAULT NULL::text, p_model text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare g toolkit_core.ai_generations%rowtype;
begin
  select * into g from toolkit_core.ai_generations where id=p_id for update;
  if not found then raise exception 'generation not found'; end if;
  if g.status<>'running' or g.locked_by is distinct from trim(p_worker) then
    raise exception 'generation not owned by worker' using errcode='42501';
  end if;

  update toolkit_core.ai_generations
     set status=case when p_success then 'completed' else 'failed' end,
         output_text=case when p_success then p_output else null end,
         error_message=case when p_success then null else left(p_error,1200) end,
         model=coalesce(nullif(p_model,''),model),
         locked_at=null,
         locked_by=null,
         completed_at=case when p_success then now() else null end,
         updated_at=now()
   where id=p_id;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_worker_record_webhook_event(p_ws uuid, p_type text, p_name text, p_external_id text, p_event_type text, p_payload_hash text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id bigint;
begin
  if p_type not in ('sms','email','calendar','ai') then raise exception 'invalid provider type'; end if;
  if char_length(trim(coalesce(p_external_id,'')))<1 then raise exception 'missing external event id'; end if;
  if jsonb_typeof(coalesce(p_metadata,'{}'::jsonb))<>'object' then raise exception 'metadata must be object'; end if;

  insert into toolkit_core.integration_webhook_events(
    workspace_id,provider_type,provider_name,external_event_id,event_type,payload_hash,metadata
  ) values (
    p_ws,p_type,left(trim(p_name),80),left(trim(p_external_id),240),
    left(trim(p_event_type),120),left(trim(p_payload_hash),256),coalesce(p_metadata,'{}'::jsonb)
  )
  on conflict(provider_type,provider_name,external_event_id)
  do update set external_event_id=excluded.external_event_id
  returning id into v_id;

  return v_id;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.capture_group_meeting_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform toolkit_core.emit_event(
    new.workspace_id,
    'group.meeting_completed',
    'group_meeting',
    new.id::text,
    jsonb_strip_nulls(jsonb_build_object(
      'group_id',new.group_id,
      'lesson_id',new.lesson_id,
      'held_on',new.held_on
    )),
    case when auth.uid() is null then 'system' else 'user' end
  );
  return new;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.capture_inbound_message_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform toolkit_core.emit_event(
    new.workspace_id,
    'message.reply_received',
    'inbound_message',
    new.id::text,
    jsonb_build_object('channel',new.channel,'action',new.action),
    case when auth.uid() is null then 'provider' else 'user' end
  );
  return new;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_worker_process_inbound_sms(p_ws uuid, p_person uuid, p_body text, p_provider_name text, p_external_event_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_text text:=upper(trim(coalesce(p_body,'')));
  v_action text:='other';
  v_purpose text;
  v_assign uuid;
  v_event bigint;
  v_task uuid;
  v_hash text;
begin
  if not exists(
    select 1 from toolkit_core.people
    where id=p_person and workspace_id=p_ws
  ) then
    raise exception 'person not found' using errcode='P0002';
  end if;

  v_hash:=encode(
    extensions.digest(convert_to(coalesce(p_body,''),'utf8'),'sha256'),
    'hex'
  );

  insert into toolkit_core.integration_webhook_events(
    workspace_id,provider_type,provider_name,external_event_id,event_type,payload_hash,metadata,status
  ) values (
    p_ws,'sms',left(trim(p_provider_name),80),left(trim(p_external_event_id),240),
    'inbound_sms',v_hash,jsonb_build_object('person_id',p_person),'received'
  )
  on conflict(provider_type,provider_name,external_event_id) do nothing
  returning id into v_event;

  if v_event is null then
    return jsonb_build_object('status','duplicate','action',null);
  end if;

  if v_text in ('STOP','STOPALL','UNSUBSCRIBE','CANCEL','END','QUIT') then
    v_action:='stop';
    foreach v_purpose in array array['operational_messages','guest_followup','newsletters','volunteer_contact']
    loop
      insert into toolkit_core.consents(
        workspace_id,person_id,purpose,channel,status,source,evidence,recorded_by
      ) values (
        p_ws,p_person,v_purpose,'sms','revoked','provider_reply','STOP reply',null
      );
    end loop;

    update toolkit_core.outbox
       set status='cancelled',status_reason='Recipient replied STOP'
     where person_id=p_person and channel='sms'
       and status in ('pending_approval','approved');

  elsif v_text='START' then
    v_action:='start';
    insert into toolkit_core.consents(
      workspace_id,person_id,purpose,channel,status,source,evidence,recorded_by
    ) values (
      p_ws,p_person,'operational_messages','sms','granted','provider_reply','START reply',null
    );

  elsif v_text='HELP' then
    v_action:='help';

  elsif v_text in ('1','YES','Y','2','NO','N') then
    v_action:=case when v_text in ('1','YES','Y') then 'yes' else 'no' end;

    select o.related_id into v_assign
    from toolkit_core.outbox o
    where o.workspace_id=p_ws
      and o.person_id=p_person
      and o.channel='sms'
      and o.related_type='assignment'
      and o.status='sent'
    order by o.sent_at desc
    limit 1;

    if v_assign is not null then
      update toolkit_core.role_assignments
         set status=case when v_action='yes' then 'confirmed' else 'declined' end
       where id=v_assign;
    end if;

  elsif lower(coalesce(p_body,'')) ~ '(call me|please call|can someone call)' then
    v_action:='call_requested';
    insert into toolkit_core.tasks(
      workspace_id,title,due_date,source
    ) values (
      p_ws,'Call requested from church contact',current_date,'system'
    ) returning id into v_task;
  end if;

  insert into toolkit_core.inbound_messages(
    workspace_id,person_id,channel,body,action
  ) values (
    p_ws,p_person,'sms',left(coalesce(p_body,''),480),v_action
  );

  update toolkit_core.integration_webhook_events
     set status='processed',processed_at=now()
   where id=v_event;

  return jsonb_build_object(
    'status','processed',
    'action',v_action,
    'assignment_id',v_assign,
    'task_id',v_task
  );
exception when others then
  if v_event is not null then
    update toolkit_core.integration_webhook_events
       set status='failed',error_message=left(sqlerrm,1200),processed_at=now()
     where id=v_event;
  end if;
  raise;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_list_automation_observations(p_ws uuid, p_limit integer DEFAULT 100)
 RETURNS TABLE(id bigint, event_type text, capability text, title text, explanation jsonb, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then return; end if;
  if p_limit<1 or p_limit>250 then raise exception 'invalid limit'; end if;

  return query
  select o.id,o.event_type,o.capability,o.title,o.explanation,o.created_at
  from toolkit_core.automation_observations o
  where o.workspace_id=p_ws
  order by o.created_at desc
  limit p_limit;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.enrich_pending_sunday_operational_proposals()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  rec record;
  v_plan uuid;
  v_staffing jsonb;
  v_count integer:=0;
begin
  for rec in
    select p.*,r.name as rule_name
    from toolkit_core.action_proposals p
    left join toolkit_core.automation_runs run on run.id=p.run_id
    left join toolkit_core.automation_rules r on r.id=run.rule_id
    where p.status='pending'
      and p.proposal_type in ('sunday_replacement','sunday_preparation')
      and p.proposed_action='{}'::jsonb
  loop
    if rec.proposal_type='sunday_replacement'
       and rec.entity_type='assignment'
       and rec.entity_id ~ '^[0-9a-fA-F-]{36}$' then
      select sp.id into v_plan
      from toolkit_core.role_assignments ra
      join toolkit_core.service_roles sr on sr.id=ra.role_id
      join toolkit_core.service_plans sp on sp.id=sr.plan_id
      where ra.id=rec.entity_id::uuid and sp.workspace_id=rec.workspace_id;

      if v_plan is not null then
        v_staffing:=toolkit_core.sunday_staffing_plan(rec.workspace_id,v_plan);
        update toolkit_core.action_proposals
           set explanation=explanation||jsonb_build_object('staffing_plan',v_staffing),
               proposed_action=jsonb_build_object(
                 'kind','prepare_sunday_lineup',
                 'plan_id',v_plan,
                 'assignments',v_staffing->'assignments'
               )
         where id=rec.id;
        v_count:=v_count+1;
      end if;

    elsif rec.proposal_type='sunday_preparation'
       and rec.entity_type='service_plan'
       and rec.entity_id ~ '^[0-9a-fA-F-]{36}$' then
      update toolkit_core.action_proposals
         set proposed_action=jsonb_build_object(
           'kind','create_task',
           'title','Finish Sunday preparation',
           'notes','Review the run sheet, sermon, and remaining service preparation flagged by Churchly.',
           'due_date',current_date
         )
       where id=rec.id;
      v_count:=v_count+1;
    end if;
  end loop;

  return v_count;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.auto_approve_act_mode_proposals()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p record; v_count integer:=0;
begin
  for p in
    select ap.id,ap.workspace_id,ap.proposal_type,ap.risk_level,
           perm.updated_by as authorizer
    from toolkit_core.action_proposals ap
    join toolkit_core.automation_runs run on run.id=ap.run_id
    join toolkit_core.automation_rules ar on ar.id=run.rule_id
    join toolkit_core.automation_permissions perm
      on perm.workspace_id=ap.workspace_id and perm.capability=ar.capability
    where ap.status='pending'
      and ap.proposed_action ? 'kind'
      and ap.risk_level='low'
      and coalesce((ar.action_config->>'allow_act')::boolean,false)
      and perm.enabled
      and perm.autonomy_level='act'
      and perm.updated_by is not null
  loop
    update toolkit_core.action_proposals
       set status='approved',
           decided_by=p.authorizer,
           decided_at=now(),
           decision_note='Automatically approved under church-authorized Act mode'
     where id=p.id and status='pending';

    if found then
      insert into toolkit_core.audit_events(
        workspace_id,actor_id,action,target_type,target_id,meta
      ) values (
        p.workspace_id,p.authorizer,'automation.proposal_auto_approved',
        'action_proposal',p.id::text,
        jsonb_build_object('proposal_type',p.proposal_type)
      );
      v_count:=v_count+1;
    end if;
  end loop;

  return v_count;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_list_automation_policies(p_ws uuid)
 RETURNS TABLE(id uuid, name text, natural_language text, policy_kind text, structured_rule jsonb, status text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin']) then
    return;
  end if;

  return query
  select p.id,p.name,p.natural_language,p.policy_kind,p.structured_rule,
         p.status,p.created_at,p.updated_at
  from toolkit_core.automation_policies p
  where p.workspace_id=p_ws
  order by
    case p.status when 'proposed' then 1 when 'confirmed' then 2 else 3 end,
    p.updated_at desc;
end
$function$
;

CREATE OR REPLACE FUNCTION toolkit_core.enrich_pending_data_hygiene_proposals()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  rec record;
  v_facts jsonb;
  v_count integer:=0;
begin
  for rec in
    select id,workspace_id,explanation
    from toolkit_core.action_proposals
    where status='pending'
      and proposal_type='data_hygiene_duplicate'
      and proposed_action='{}'::jsonb
  loop
    v_facts:=coalesce(rec.explanation->'facts','{}'::jsonb);

    update toolkit_core.action_proposals
       set proposed_action=jsonb_build_object(
         'kind','create_task',
         'title','Review possible duplicate people',
         'notes',
           'Churchly found two records that may be duplicates. Match type: ' ||
           coalesce(v_facts->>'match_on','unknown') ||
           '. Person IDs: ' || coalesce(v_facts->>'person_a','?') ||
           ' and ' || coalesce(v_facts->>'person_b','?') ||
           '. Review manually; Churchly will not merge or delete either record.',
         'due_date',current_date+7
       )
     where id=rec.id;

    v_count:=v_count+1;
  end loop;

  return v_count;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_integration_preflight(p_ws uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_state record;
  v_ai boolean;
  v_sms boolean;
  v_email boolean;
  v_calendar boolean;
  v_waiting_ai integer:=0;
  v_queued_ai integer:=0;
  v_pending_outbox integer:=0;
  v_approved_outbox integer:=0;
  v_sent_outbox integer:=0;
  v_blocked_outbox integer:=0;
  v_failed_webhooks integer:=0;
  v_pending_props integer:=0;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin']) then
    raise exception 'not allowed' using errcode='42501';
  end if;

  select * into v_state
  from toolkit_core.automation_processor_state
  where processor='default';

  select exists(
    select 1 from toolkit_core.provider_connections
    where workspace_id=p_ws and provider_type='ai' and status='active'
  ) into v_ai;

  select exists(
    select 1 from toolkit_core.provider_connections
    where workspace_id=p_ws and provider_type='sms' and status='active'
  ) into v_sms;

  select exists(
    select 1 from toolkit_core.provider_connections
    where workspace_id=p_ws and provider_type='email' and status='active'
  ) into v_email;

  select exists(
    select 1 from toolkit_core.provider_connections
    where workspace_id=p_ws and provider_type='calendar' and status='active'
  ) into v_calendar;

  select count(*) into v_waiting_ai
  from toolkit_core.ai_generations
  where workspace_id=p_ws and status='waiting_provider';

  select count(*) into v_queued_ai
  from toolkit_core.ai_generations
  where workspace_id=p_ws and status in ('queued','running');

  select count(*) into v_pending_outbox
  from toolkit_core.outbox
  where workspace_id=p_ws and status='pending_approval';

  select count(*) into v_approved_outbox
  from toolkit_core.outbox
  where workspace_id=p_ws and status='approved';

  select count(*) into v_sent_outbox
  from toolkit_core.outbox
  where workspace_id=p_ws and status='sent';

  select count(*) into v_blocked_outbox
  from toolkit_core.outbox
  where workspace_id=p_ws and status='blocked';

  select count(*) into v_failed_webhooks
  from toolkit_core.integration_webhook_events
  where workspace_id=p_ws and status='failed';

  select count(*) into v_pending_props
  from toolkit_core.action_proposals
  where workspace_id=p_ws and status='pending';

  return jsonb_build_object(
    'mode','simulation_ready',
    'external_accounts_required_now',false,
    'core',jsonb_build_object(
      'event_backbone',true,
      'automation_engine',true,
      'proposal_mode',true,
      'observe_prepare_act',true,
      'processor_last_error',v_state.last_error,
      'processor_last_finished_at',v_state.last_finished_at,
      'processor_cursor',v_state.last_event_id,
      'pending_proposals',v_pending_props
    ),
    'ai',jsonb_build_object(
      'worker_contract_ready',true,
      'provider_active',v_ai,
      'live_generation_enabled',v_ai,
      'waiting_provider',v_waiting_ai,
      'queued_or_running',v_queued_ai,
      'safe_tools_ready',true,
      'status',case when v_ai then 'live_ready' else 'dormant_until_provider' end
    ),
    'messaging',jsonb_build_object(
      'approval_gate_ready',true,
      'sms_provider_active',v_sms,
      'email_provider_active',v_email,
      'pending_approval',v_pending_outbox,
      'approved_waiting_delivery',v_approved_outbox,
      'sent',v_sent_outbox,
      'blocked',v_blocked_outbox,
      'live_delivery_enabled',(v_sms or v_email),
      'status',case when (v_sms or v_email) then 'live_ready' else 'dormant_until_provider' end
    ),
    'inbound',jsonb_build_object(
      'worker_contract_ready',true,
      'stop_start_yes_no_ready',true,
      'failed_webhooks',v_failed_webhooks,
      'live_provider_active',v_sms,
      'status',case when v_sms then 'live_ready' else 'dormant_until_provider' end
    ),
    'calendar',jsonb_build_object(
      'provider_active',v_calendar,
      'status',case when v_calendar then 'live_ready' else 'optional_not_connected' end
    ),
    'safety',jsonb_build_object(
      'simulation_writes_external_data',false,
      'simulation_sends_messages',false,
      'simulation_calls_ai',false,
      'care_data_excluded_from_ai',true,
      'kids_health_excluded_from_ai',true,
      'raw_background_checks_excluded_from_ai',true
    )
  );
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_simulate_outbound_message(p_ws uuid, p_person uuid, p_channel text, p_purpose text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_reason text;
  v_provider boolean;
  v_contact_exists boolean;
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then
    raise exception 'not allowed' using errcode='42501';
  end if;

  if p_channel not in ('sms','email') then
    raise exception 'invalid channel' using errcode='22023';
  end if;

  if p_purpose not in ('operational_messages','newsletters','guest_followup','volunteer_contact') then
    raise exception 'invalid message purpose' using errcode='22023';
  end if;

  if not exists(
    select 1 from toolkit_core.people
    where id=p_person and workspace_id=p_ws
  ) then
    raise exception 'person not found' using errcode='P0002';
  end if;

  select case
    when p_channel='sms' then phone is not null and trim(phone)<>''
    else email is not null and trim(email)<>''
  end
  into v_contact_exists
  from toolkit_core.people
  where id=p_person and workspace_id=p_ws;

  v_reason:=toolkit_core.contact_check(p_ws,p_person,p_channel,p_purpose);

  select exists(
    select 1 from toolkit_core.provider_connections
    where workspace_id=p_ws
      and provider_type=p_channel
      and status='active'
  ) into v_provider;

  return jsonb_build_object(
    'simulation',true,
    'person_id',p_person,
    'channel',p_channel,
    'purpose',p_purpose,
    'contact_destination_present',coalesce(v_contact_exists,false),
    'consent_gate_passes',v_reason is null,
    'consent_block_reason',v_reason,
    'provider_active',v_provider,
    'would_create_draft',coalesce(v_contact_exists,false),
    'would_be_sendable_now',coalesce(v_contact_exists,false) and v_reason is null and v_provider,
    'would_send_in_simulation',false
  );
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_simulate_inbound_sms(p_ws uuid, p_person uuid, p_body text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_text text:=upper(trim(coalesce(p_body,'')));
  v_action text:='other';
begin
  if not toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']) then
    raise exception 'not allowed' using errcode='42501';
  end if;

  if not exists(
    select 1 from toolkit_core.people
    where id=p_person and workspace_id=p_ws
  ) then
    raise exception 'person not found' using errcode='P0002';
  end if;

  if v_text in ('STOP','STOPALL','UNSUBSCRIBE','CANCEL','END','QUIT') then
    v_action:='stop';
  elsif v_text='START' then
    v_action:='start';
  elsif v_text='HELP' then
    v_action:='help';
  elsif v_text in ('1','YES','Y') then
    v_action:='yes';
  elsif v_text in ('2','NO','N') then
    v_action:='no';
  elsif lower(coalesce(p_body,'')) ~ '(call me|please call|can someone call)' then
    v_action:='call_requested';
  end if;

  return jsonb_build_object(
    'simulation',true,
    'person_id',p_person,
    'input',left(coalesce(p_body,''),120),
    'classified_action',v_action,
    'would_revoke_sms_consent',v_action='stop',
    'would_restore_operational_sms',v_action='start',
    'would_update_latest_assignment',v_action in ('yes','no'),
    'would_create_call_task',v_action='call_requested',
    'writes_performed',false
  );
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_global_search(p_ws uuid, p_query text, p_limit integer DEFAULT 30)
 RETURNS TABLE(kind text, entity_id text, title text, detail text, route text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  q text:=lower(trim(coalesce(p_query,'')));
  pat text;
  v_staff boolean;
  v_admin boolean;
begin
  if not toolkit_core.is_member(p_ws) then
    raise exception 'not allowed' using errcode='42501';
  end if;
  if char_length(q)<2 then
    raise exception 'search needs at least 2 characters' using errcode='22023';
  end if;
  if p_limit<1 or p_limit>60 then
    raise exception 'invalid limit' using errcode='22023';
  end if;
  pat:='%'||q||'%';
  v_staff:=toolkit_core.is_member(p_ws,array['owner','pastor','admin','leader']);
  v_admin:=toolkit_core.is_member(p_ws,array['owner','pastor','admin']);

  return query
  select s.kind,s.entity_id,s.title,s.detail,s.route
  from (
    select 'person'::text as kind,p.id::text as entity_id,
      nullif(trim(coalesce(p.first_name,'')||' '||coalesce(p.last_name,'')),'')::text as title,
      concat(initcap(p.status),case when p.age_group='minor' then ' · Under 18' else '' end)::text as detail,
      'people'::text as route,
      case when lower(trim(coalesce(p.first_name,'')||' '||coalesce(p.last_name,'')))=q then 1
           when lower(trim(coalesce(p.first_name,'')||' '||coalesce(p.last_name,''))) like q||'%' then 2 else 10 end as rank
    from toolkit_core.people p
    where v_staff and p.workspace_id=p_ws and p.status<>'archived'
      and exists(select 1 from toolkit_core.workspace_features f where f.workspace_id=p_ws and f.module='people' and f.enabled)
      and (
        lower(trim(coalesce(p.first_name,'')||' '||coalesce(p.last_name,''))) like pat
        or lower(coalesce(p.email,'')) like pat
        or (
          regexp_replace(q,'\D','','g') <> ''
          and regexp_replace(coalesce(p.phone,''),'\D','','g') like '%'||regexp_replace(q,'\D','','g')||'%'
        )
      )

    union all
    select 'task',t.id::text,t.title,
      concat(initcap(t.status),case when t.due_date is not null then ' · due '||t.due_date::text else '' end),
      'tasks',
      case when lower(t.title)=q then 1 when lower(t.title) like q||'%' then 3 else 20 end
    from toolkit_core.tasks t
    where t.workspace_id=p_ws
      and (v_staff or t.assignee_user=auth.uid())
      and (lower(t.title) like pat or lower(coalesce(t.notes,'')) like pat)

    union all
    select 'calendar',c.id::text,c.title,
      concat(initcap(c.kind),case when c.location is not null and c.location<>'' then ' · '||c.location else '' end),
      'calendar',
      case when lower(c.title)=q then 1 when lower(c.title) like q||'%' then 4 else 22 end
    from toolkit_core.calendar_items c
    where c.workspace_id=p_ws
      and (lower(c.title) like pat or lower(coalesce(c.location,'')) like pat)

    union all
    select 'service',s.id::text,s.title,
      concat('Sunday · ',to_char(s.starts_at,'Mon DD, YYYY'),case when s.theme is not null and s.theme<>'' then ' · '||s.theme else '' end),
      'sunday',
      case when lower(s.title)=q then 1 when lower(s.title) like q||'%' then 4 else 23 end
    from toolkit_core.service_plans s
    where s.workspace_id=p_ws
      and exists(select 1 from toolkit_core.workspace_features f where f.workspace_id=p_ws and f.module='services' and f.enabled)
      and (lower(s.title) like pat or lower(coalesce(s.theme,'')) like pat)

    union all
    select 'sermon',s.id::text,s.title,
      concat(coalesce(s.scripture,''),case when s.preached_on is not null then ' · '||s.preached_on::text else '' end),
      'sermons',
      case when lower(s.title)=q then 1 when lower(s.title) like q||'%' then 4 else 24 end
    from toolkit_core.sermons s
    where v_staff and s.workspace_id=p_ws
      and exists(select 1 from toolkit_core.workspace_features f where f.workspace_id=p_ws and f.module='sermons' and f.enabled)
      and (
        lower(s.title) like pat or lower(coalesce(s.scripture,'')) like pat
        or lower(coalesce(s.summary,'')) like pat
      )

    union all
    select 'document',d.id::text,d.name,
      concat(coalesce(d.folder,'Document'),case when d.expires_on is not null then ' · expires '||d.expires_on::text else '' end),
      'vault',
      case when lower(d.name)=q then 1 when lower(d.name) like q||'%' then 5 else 25 end
    from toolkit_core.documents d
    where v_staff and d.workspace_id=p_ws
      and exists(select 1 from toolkit_core.workspace_features f where f.workspace_id=p_ws and f.module='vault' and f.enabled)
      and (not d.restricted or v_admin)
      and (lower(d.name) like pat or lower(coalesce(d.folder,'')) like pat or lower(coalesce(d.notes,'')) like pat)

    union all
    select 'group',g.id::text,g.name,
      concat(initcap(replace(g.kind,'_',' ')),case when g.meets is not null and g.meets<>'' then ' · '||g.meets else '' end),
      'groups',
      case when lower(g.name)=q then 1 when lower(g.name) like q||'%' then 5 else 26 end
    from toolkit_core.groups g
    where g.workspace_id=p_ws
      and exists(select 1 from toolkit_core.workspace_features f where f.workspace_id=p_ws and f.module='groups' and f.enabled)
      and (lower(g.name) like pat or lower(coalesce(g.description,'')) like pat)

    union all
    select 'channel',c.id::text,c.name,
      case when c.is_private then 'Private channel' else initcap(c.type)||' channel' end,
      'messages',
      case when lower(c.name)=q then 1 when lower(c.name) like q||'%' then 5 else 27 end
    from toolkit_core.channels c
    where c.workspace_id=p_ws
      and exists(select 1 from toolkit_core.workspace_features f where f.workspace_id=p_ws and f.module='messages' and f.enabled)
      and toolkit_core.can_read_channel(p_ws,c.id)
      and (lower(c.name) like pat or lower(coalesce(c.description,'')) like pat)

    union all
    select 'message',m.id::text,c.name,
      left(coalesce(mp.display_name,'Member')||' · '||m.body,160),
      'messages',
      35
    from toolkit_core.chat_messages m
    join toolkit_core.channels c on c.id=m.channel_id
    left join toolkit_core.member_profiles mp on mp.user_id=m.author_user
    where m.workspace_id=p_ws and m.deleted_at is null
      and exists(select 1 from toolkit_core.workspace_features f where f.workspace_id=p_ws and f.module='messages' and f.enabled)
      and toolkit_core.can_read_channel(p_ws,m.channel_id)
      and lower(m.body) like pat
  ) s
  where s.title is not null
  order by s.rank,s.title
  limit p_limit;
end
$function$
;

CREATE OR REPLACE FUNCTION public.tk_kids_reset_checkout_lock(p_ws uuid, p_checkin uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_child uuid;
begin
  if not toolkit_core.kids_admin(p_ws) then
    raise exception 'not allowed' using errcode='42501';
  end if;

  update toolkit_core.kids_checkins
  set failed_attempts=0,locked_until=null,last_failed_at=null
  where id=p_checkin
    and workspace_id=p_ws
    and checked_out_at is null
  returning child_id into v_child;

  if not found then
    raise exception 'active check-in not found' using errcode='P0002';
  end if;

  insert into toolkit_core.audit_events(
    workspace_id,actor_id,action,target_type,target_id,meta
  )
  values(
    p_ws,auth.uid(),'kids.pickup_lock_reset','person',v_child::text,
    jsonb_build_object('checkin_id',p_checkin)
  );
end
$function$
;

CREATE TRIGGER audit_events_append_only BEFORE DELETE OR UPDATE ON toolkit_core.audit_events FOR EACH ROW EXECUTE FUNCTION toolkit_core.audit_no_change();
CREATE TRIGGER automation_rules_touch BEFORE UPDATE ON toolkit_core.automation_rules FOR EACH ROW EXECUTE FUNCTION toolkit_core.automation_touch_updated_at();
CREATE TRIGGER automation_runs_touch BEFORE UPDATE ON toolkit_core.automation_runs FOR EACH ROW EXECUTE FUNCTION toolkit_core.automation_touch_updated_at();
CREATE TRIGGER automation_steps_touch BEFORE UPDATE ON toolkit_core.automation_steps FOR EACH ROW EXECUTE FUNCTION toolkit_core.automation_touch_updated_at();
CREATE TRIGGER event_calendar_items_capture AFTER INSERT OR DELETE OR UPDATE ON toolkit_core.calendar_items FOR EACH ROW EXECUTE FUNCTION toolkit_core.capture_operational_event();
CREATE TRIGGER event_connect_submissions_capture AFTER INSERT ON toolkit_core.connect_submissions FOR EACH ROW EXECUTE FUNCTION toolkit_core.capture_operational_event();
CREATE TRIGGER consents_append_only BEFORE DELETE OR UPDATE ON toolkit_core.consents FOR EACH ROW EXECUTE FUNCTION toolkit_core.consents_append_only();
CREATE TRIGGER event_documents_capture AFTER INSERT OR DELETE OR UPDATE ON toolkit_core.documents FOR EACH ROW EXECUTE FUNCTION toolkit_core.capture_operational_event();
CREATE TRIGGER event_log_append_only BEFORE DELETE OR UPDATE ON toolkit_core.event_log FOR EACH ROW EXECUTE FUNCTION toolkit_core.event_no_change();
CREATE TRIGGER event_event_registrations_capture AFTER INSERT OR UPDATE ON toolkit_core.event_registrations FOR EACH ROW EXECUTE FUNCTION toolkit_core.capture_operational_event();
CREATE TRIGGER event_group_meetings_capture AFTER INSERT ON toolkit_core.group_meetings FOR EACH ROW EXECUTE FUNCTION toolkit_core.capture_group_meeting_event();
CREATE TRIGGER event_group_requests_capture AFTER INSERT OR UPDATE ON toolkit_core.group_requests FOR EACH ROW EXECUTE FUNCTION toolkit_core.capture_operational_event();
CREATE TRIGGER event_inbound_messages_capture AFTER INSERT ON toolkit_core.inbound_messages FOR EACH ROW EXECUTE FUNCTION toolkit_core.capture_inbound_message_event();
CREATE TRIGGER event_kids_checkins_capture AFTER INSERT OR UPDATE ON toolkit_core.kids_checkins FOR EACH ROW EXECUTE FUNCTION toolkit_core.capture_operational_event();
CREATE TRIGGER event_mission_updates_capture AFTER INSERT ON toolkit_core.mission_updates FOR EACH ROW EXECUTE FUNCTION toolkit_core.capture_operational_event();
CREATE TRIGGER event_outbox_capture AFTER INSERT OR UPDATE ON toolkit_core.outbox FOR EACH ROW EXECUTE FUNCTION toolkit_core.capture_operational_event();
CREATE TRIGGER event_people_capture AFTER INSERT OR UPDATE ON toolkit_core.people FOR EACH ROW EXECUTE FUNCTION toolkit_core.capture_operational_event();
CREATE TRIGGER event_role_assignments_capture AFTER INSERT OR UPDATE ON toolkit_core.role_assignments FOR EACH ROW EXECUTE FUNCTION toolkit_core.capture_operational_event();
CREATE TRIGGER scheduled_jobs_touch BEFORE UPDATE ON toolkit_core.scheduled_jobs FOR EACH ROW EXECUTE FUNCTION toolkit_core.automation_touch_updated_at();
CREATE TRIGGER event_sermons_capture AFTER INSERT OR UPDATE ON toolkit_core.sermons FOR EACH ROW EXECUTE FUNCTION toolkit_core.capture_operational_event();
CREATE TRIGGER event_service_plans_capture AFTER INSERT OR UPDATE ON toolkit_core.service_plans FOR EACH ROW EXECUTE FUNCTION toolkit_core.capture_operational_event();
CREATE TRIGGER event_tasks_capture AFTER INSERT OR UPDATE ON toolkit_core.tasks FOR EACH ROW EXECUTE FUNCTION toolkit_core.capture_operational_event();
CREATE TRIGGER workspace_seed_automation_permissions AFTER INSERT ON toolkit_core.workspaces FOR EACH ROW EXECUTE FUNCTION toolkit_core.seed_automation_permissions_trigger();

revoke all on function toolkit_core.audit_no_change() from public, anon, authenticated, service_role;

revoke all on function toolkit_core.is_member(p_ws uuid, p_roles text[]) from public, anon, authenticated, service_role;

revoke all on function public.tk_username_available(p_username text) from public, anon, authenticated, service_role;
grant execute on function public.tk_username_available(p_username text) to authenticated;

revoke all on function public.tk_create_workspace(p_name text, p_username text, p_display_name text, p_timezone text) from public, anon, authenticated, service_role;
grant execute on function public.tk_create_workspace(p_name text, p_username text, p_display_name text, p_timezone text) to authenticated;

revoke all on function public.tk_my_workspaces() from public, anon, authenticated, service_role;
grant execute on function public.tk_my_workspaces() to authenticated;

revoke all on function public.tk_workspace_features(p_workspace uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_workspace_features(p_workspace uuid) to authenticated;

revoke all on function toolkit_core.consents_append_only() from public, anon, authenticated, service_role;

revoke all on function public.tk_create_person(p_ws uuid, p_first text, p_last text, p_email text, p_phone text, p_status text, p_age_group text) from public, anon, authenticated, service_role;
grant execute on function public.tk_create_person(p_ws uuid, p_first text, p_last text, p_email text, p_phone text, p_status text, p_age_group text) to authenticated;

revoke all on function public.tk_update_person(p_ws uuid, p_id uuid, p_first text, p_last text, p_email text, p_phone text, p_status text, p_channel text) from public, anon, authenticated, service_role;
grant execute on function public.tk_update_person(p_ws uuid, p_id uuid, p_first text, p_last text, p_email text, p_phone text, p_status text, p_channel text) to authenticated;

revoke all on function public.tk_person_consents(p_ws uuid, p_person uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_person_consents(p_ws uuid, p_person uuid) to authenticated;

revoke all on function public.tk_record_consent(p_ws uuid, p_person uuid, p_purpose text, p_channel text, p_status text, p_source text, p_evidence text) from public, anon, authenticated, service_role;
grant execute on function public.tk_record_consent(p_ws uuid, p_person uuid, p_purpose text, p_channel text, p_status text, p_source text, p_evidence text) to authenticated;

revoke all on function public.tk_list_members(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_members(p_ws uuid) to authenticated;

revoke all on function public.tk_list_calendar(p_ws uuid, p_from timestamp with time zone, p_to timestamp with time zone) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_calendar(p_ws uuid, p_from timestamp with time zone, p_to timestamp with time zone) to authenticated;

revoke all on function public.tk_create_calendar_item(p_ws uuid, p_title text, p_kind text, p_starts timestamp with time zone, p_ends timestamp with time zone, p_all_day boolean, p_location text, p_notes text, p_recurrence text, p_until date) from public, anon, authenticated, service_role;
grant execute on function public.tk_create_calendar_item(p_ws uuid, p_title text, p_kind text, p_starts timestamp with time zone, p_ends timestamp with time zone, p_all_day boolean, p_location text, p_notes text, p_recurrence text, p_until date) to authenticated;

revoke all on function public.tk_update_calendar_item(p_ws uuid, p_id uuid, p_title text, p_kind text, p_starts timestamp with time zone, p_ends timestamp with time zone, p_all_day boolean, p_location text, p_notes text, p_recurrence text, p_until date) from public, anon, authenticated, service_role;
grant execute on function public.tk_update_calendar_item(p_ws uuid, p_id uuid, p_title text, p_kind text, p_starts timestamp with time zone, p_ends timestamp with time zone, p_all_day boolean, p_location text, p_notes text, p_recurrence text, p_until date) to authenticated;

revoke all on function public.tk_delete_calendar_item(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_delete_calendar_item(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_list_tasks(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_tasks(p_ws uuid) to authenticated;

revoke all on function public.tk_create_task(p_ws uuid, p_title text, p_notes text, p_due date, p_assignee uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_create_task(p_ws uuid, p_title text, p_notes text, p_due date, p_assignee uuid) to authenticated;

revoke all on function public.tk_set_task_status(p_ws uuid, p_id uuid, p_status text) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_task_status(p_ws uuid, p_id uuid, p_status text) to authenticated;

revoke all on function public.tk_delete_task(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_delete_task(p_ws uuid, p_id uuid) to authenticated;

revoke all on function toolkit_core.is_member_of(p_ws uuid, p_user uuid) from public, anon, authenticated, service_role;

revoke all on function public.tk_list_service_plans(p_ws uuid, p_from timestamp with time zone, p_to timestamp with time zone) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_service_plans(p_ws uuid, p_from timestamp with time zone, p_to timestamp with time zone) to authenticated;

revoke all on function public.tk_get_service_plan(p_ws uuid, p_plan uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_get_service_plan(p_ws uuid, p_plan uuid) to authenticated;

revoke all on function public.tk_create_service_plan(p_ws uuid, p_title text, p_starts timestamp with time zone, p_theme text) from public, anon, authenticated, service_role;
grant execute on function public.tk_create_service_plan(p_ws uuid, p_title text, p_starts timestamp with time zone, p_theme text) to authenticated;

revoke all on function public.tk_update_service_plan(p_ws uuid, p_plan uuid, p_title text, p_starts timestamp with time zone, p_theme text, p_notes text) from public, anon, authenticated, service_role;
grant execute on function public.tk_update_service_plan(p_ws uuid, p_plan uuid, p_title text, p_starts timestamp with time zone, p_theme text, p_notes text) to authenticated;

revoke all on function public.tk_delete_service_plan(p_ws uuid, p_plan uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_delete_service_plan(p_ws uuid, p_plan uuid) to authenticated;

revoke all on function public.tk_save_run_sheet(p_ws uuid, p_plan uuid, p_items jsonb) from public, anon, authenticated, service_role;
grant execute on function public.tk_save_run_sheet(p_ws uuid, p_plan uuid, p_items jsonb) to authenticated;

revoke all on function public.tk_add_roles(p_ws uuid, p_plan uuid, p_roles jsonb) from public, anon, authenticated, service_role;
grant execute on function public.tk_add_roles(p_ws uuid, p_plan uuid, p_roles jsonb) to authenticated;

revoke all on function public.tk_update_role(p_ws uuid, p_role uuid, p_name text, p_needed integer) from public, anon, authenticated, service_role;
grant execute on function public.tk_update_role(p_ws uuid, p_role uuid, p_name text, p_needed integer) to authenticated;

revoke all on function public.tk_delete_role(p_ws uuid, p_role uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_delete_role(p_ws uuid, p_role uuid) to authenticated;

revoke all on function public.tk_assign_person(p_ws uuid, p_role uuid, p_person uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_assign_person(p_ws uuid, p_role uuid, p_person uuid) to authenticated;

revoke all on function public.tk_set_assignment(p_ws uuid, p_assignment uuid, p_status text) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_assignment(p_ws uuid, p_assignment uuid, p_status text) to authenticated;

revoke all on function public.tk_create_gap_tasks(p_ws uuid, p_plan uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_create_gap_tasks(p_ws uuid, p_plan uuid) to authenticated;

revoke all on function toolkit_core.contact_check(p_ws uuid, p_person uuid, p_channel text, p_purpose text) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.in_quiet_hours(p_ws uuid) from public, anon, authenticated, service_role;

revoke all on function public.tk_queue_message(p_ws uuid, p_person uuid, p_channel text, p_purpose text, p_body text, p_related_type text, p_related_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_queue_message(p_ws uuid, p_person uuid, p_channel text, p_purpose text, p_body text, p_related_type text, p_related_id uuid) to authenticated;

revoke all on function public.tk_list_outbox(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_outbox(p_ws uuid) to authenticated;

revoke all on function public.tk_approve_message(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_approve_message(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_cancel_message(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_cancel_message(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_dispatch_dry_run(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_dispatch_dry_run(p_ws uuid) to authenticated;

revoke all on function public.tk_list_inbound(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_inbound(p_ws uuid) to authenticated;

revoke all on function public.tk_simulate_inbound(p_ws uuid, p_person uuid, p_body text) from public, anon, authenticated, service_role;
grant execute on function public.tk_simulate_inbound(p_ws uuid, p_person uuid, p_body text) to authenticated;

revoke all on function toolkit_core.can_read_channel(p_ws uuid, p_channel uuid) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.can_post_channel(p_ws uuid, p_channel uuid) from public, anon, authenticated, service_role;

revoke all on function public.tk_ensure_default_channels(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_ensure_default_channels(p_ws uuid) to authenticated;

revoke all on function public.tk_list_channels(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_channels(p_ws uuid) to authenticated;

revoke all on function public.tk_create_channel(p_ws uuid, p_name text, p_type text, p_description text, p_private boolean, p_members uuid[]) from public, anon, authenticated, service_role;
grant execute on function public.tk_create_channel(p_ws uuid, p_name text, p_type text, p_description text, p_private boolean, p_members uuid[]) to authenticated;

revoke all on function public.tk_list_channel_members(p_ws uuid, p_channel uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_channel_members(p_ws uuid, p_channel uuid) to authenticated;

revoke all on function public.tk_list_messages(p_ws uuid, p_channel uuid, p_parent uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_messages(p_ws uuid, p_channel uuid, p_parent uuid) to authenticated;

revoke all on function public.tk_post_message(p_ws uuid, p_channel uuid, p_body text, p_parent uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_post_message(p_ws uuid, p_channel uuid, p_body text, p_parent uuid) to authenticated;

revoke all on function public.tk_edit_message(p_ws uuid, p_id uuid, p_body text) from public, anon, authenticated, service_role;
grant execute on function public.tk_edit_message(p_ws uuid, p_id uuid, p_body text) to authenticated;

revoke all on function public.tk_delete_message(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_delete_message(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_toggle_reaction(p_ws uuid, p_id uuid, p_emoji text) from public, anon, authenticated, service_role;
grant execute on function public.tk_toggle_reaction(p_ws uuid, p_id uuid, p_emoji text) to authenticated;

revoke all on function public.tk_toggle_save(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_toggle_save(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_toggle_pin(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_toggle_pin(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_list_saved(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_saved(p_ws uuid) to authenticated;

revoke all on function public.tk_search_messages(p_ws uuid, p_query text) from public, anon, authenticated, service_role;
grant execute on function public.tk_search_messages(p_ws uuid, p_query text) to authenticated;

revoke all on function public.tk_mark_read(p_ws uuid, p_channel uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_mark_read(p_ws uuid, p_channel uuid) to authenticated;

revoke all on function public.tk_vault_ws(p_path text) from public, anon, authenticated, service_role;
grant execute on function public.tk_vault_ws(p_path text) to authenticated;

revoke all on function public.tk_vault_write_ok(p_path text) from public, anon, authenticated, service_role;
grant execute on function public.tk_vault_write_ok(p_path text) to authenticated;

revoke all on function public.tk_vault_read_ok(p_path text) from public, anon, authenticated, service_role;
grant execute on function public.tk_vault_read_ok(p_path text) to authenticated;

revoke all on function public.tk_list_documents(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_documents(p_ws uuid) to authenticated;

revoke all on function toolkit_core.sync_renewal_calendar(p_doc uuid) from public, anon, authenticated, service_role;

revoke all on function public.tk_create_document(p_ws uuid, p_path text, p_name text, p_file_name text, p_size bigint, p_mime text, p_folder text, p_expires date, p_restricted boolean, p_notes text) from public, anon, authenticated, service_role;
grant execute on function public.tk_create_document(p_ws uuid, p_path text, p_name text, p_file_name text, p_size bigint, p_mime text, p_folder text, p_expires date, p_restricted boolean, p_notes text) to authenticated;

revoke all on function public.tk_update_document(p_ws uuid, p_id uuid, p_name text, p_folder text, p_expires date, p_restricted boolean, p_notes text) from public, anon, authenticated, service_role;
grant execute on function public.tk_update_document(p_ws uuid, p_id uuid, p_name text, p_folder text, p_expires date, p_restricted boolean, p_notes text) to authenticated;

revoke all on function public.tk_delete_document(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_delete_document(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_renewals_due(p_ws uuid, p_days integer) from public, anon, authenticated, service_role;
grant execute on function public.tk_renewals_due(p_ws uuid, p_days integer) to authenticated;

revoke all on function public.tk_create_renewal_tasks(p_ws uuid) from public, anon, authenticated, service_role;

revoke all on function public.tk_list_series(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_series(p_ws uuid) to authenticated;

revoke all on function public.tk_save_series(p_ws uuid, p_id uuid, p_name text, p_description text, p_starts date, p_ends date) from public, anon, authenticated, service_role;
grant execute on function public.tk_save_series(p_ws uuid, p_id uuid, p_name text, p_description text, p_starts date, p_ends date) to authenticated;

revoke all on function public.tk_delete_series(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_delete_series(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_list_sermons(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_sermons(p_ws uuid) to authenticated;

revoke all on function public.tk_save_sermon(p_ws uuid, p_id uuid, p_title text, p_speaker text, p_date date, p_series uuid, p_scripture text, p_summary text, p_notes text, p_status text, p_media text) from public, anon, authenticated, service_role;
grant execute on function public.tk_save_sermon(p_ws uuid, p_id uuid, p_title text, p_speaker text, p_date date, p_series uuid, p_scripture text, p_summary text, p_notes text, p_status text, p_media text) to authenticated;

revoke all on function public.tk_delete_sermon(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_delete_sermon(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_list_invitations(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_invitations(p_ws uuid) to authenticated;

revoke all on function public.tk_revoke_invitation(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_revoke_invitation(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_accept_invitation(p_token text, p_username text, p_display_name text) from public, anon, authenticated, service_role;
grant execute on function public.tk_accept_invitation(p_token text, p_username text, p_display_name text) to authenticated;

revoke all on function public.tk_list_team(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_team(p_ws uuid) to authenticated;

revoke all on function public.tk_set_member_role(p_ws uuid, p_user uuid, p_role text) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_member_role(p_ws uuid, p_user uuid, p_role text) to authenticated;

revoke all on function public.tk_remove_member(p_ws uuid, p_user uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_remove_member(p_ws uuid, p_user uuid) to authenticated;

revoke all on function public.tk_get_settings(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_get_settings(p_ws uuid) to authenticated;

revoke all on function public.tk_update_settings(p_ws uuid, p_name text, p_timezone text, p_quiet_start time without time zone, p_quiet_end time without time zone) from public, anon, authenticated, service_role;
grant execute on function public.tk_update_settings(p_ws uuid, p_name text, p_timezone text, p_quiet_start time without time zone, p_quiet_end time without time zone) to authenticated;

revoke all on function public.tk_set_feature(p_ws uuid, p_module text, p_enabled boolean) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_feature(p_ws uuid, p_module text, p_enabled boolean) to authenticated;

revoke all on function public.tk_list_audit(p_ws uuid, p_limit integer) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_audit(p_ws uuid, p_limit integer) to authenticated;

revoke all on function public.tk_export_workspace(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_export_workspace(p_ws uuid) to authenticated;

revoke all on function public.tk_list_people(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_people(p_ws uuid) to authenticated;

revoke all on function public.tk_create_invitation(p_ws uuid, p_email text, p_role text, p_person uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_create_invitation(p_ws uuid, p_email text, p_role text, p_person uuid) to authenticated;

revoke all on function public.tk_my_person(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_my_person(p_ws uuid) to authenticated;

revoke all on function public.tk_my_schedule(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_my_schedule(p_ws uuid) to authenticated;

revoke all on function public.tk_respond_assignment(p_ws uuid, p_assignment uuid, p_status text) from public, anon, authenticated, service_role;
grant execute on function public.tk_respond_assignment(p_ws uuid, p_assignment uuid, p_status text) to authenticated;

revoke all on function public.tk_my_blackouts(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_my_blackouts(p_ws uuid) to authenticated;

revoke all on function public.tk_toggle_my_blackout(p_ws uuid, p_date date) from public, anon, authenticated, service_role;
grant execute on function public.tk_toggle_my_blackout(p_ws uuid, p_date date) to authenticated;

revoke all on function public.tk_blackouts_on(p_ws uuid, p_date date) from public, anon, authenticated, service_role;
grant execute on function public.tk_blackouts_on(p_ws uuid, p_date date) to authenticated;

revoke all on function public.tk_link_person_user(p_ws uuid, p_person uuid, p_user uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_link_person_user(p_ws uuid, p_person uuid, p_user uuid) to authenticated;

revoke all on function public.tk_import_people(p_ws uuid, p_rows jsonb, p_status text) from public, anon, authenticated, service_role;
grant execute on function public.tk_import_people(p_ws uuid, p_rows jsonb, p_status text) to authenticated;

revoke all on function public.tk_get_connect_page(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_get_connect_page(p_ws uuid) to authenticated;

revoke all on function public.tk_set_connect_page(p_ws uuid, p_enabled boolean, p_rotate boolean) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_connect_page(p_ws uuid, p_enabled boolean, p_rotate boolean) to authenticated;

revoke all on function public.tk_list_connect_submissions(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_connect_submissions(p_ws uuid) to authenticated;

revoke all on function public.tk_public_connect_info(p_slug text) from public, anon, authenticated, service_role;
grant execute on function public.tk_public_connect_info(p_slug text) to anon;
grant execute on function public.tk_public_connect_info(p_slug text) to authenticated;

revoke all on function public.tk_public_connect_submit(p_slug text, p_first text, p_last text, p_email text, p_phone text, p_interests text[], p_adult boolean, p_contact_ok boolean, p_website text) from public, anon, authenticated, service_role;
grant execute on function public.tk_public_connect_submit(p_slug text, p_first text, p_last text, p_email text, p_phone text, p_interests text[], p_adult boolean, p_contact_ok boolean, p_website text) to anon;
grant execute on function public.tk_public_connect_submit(p_slug text, p_first text, p_last text, p_email text, p_phone text, p_interests text[], p_adult boolean, p_contact_ok boolean, p_website text) to authenticated;

revoke all on function public.tk_list_recipes(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_recipes(p_ws uuid) to authenticated;

revoke all on function public.tk_set_recipe(p_ws uuid, p_recipe text, p_enabled boolean) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_recipe(p_ws uuid, p_recipe text, p_enabled boolean) to authenticated;

revoke all on function public.tk_run_recipes(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_run_recipes(p_ws uuid) to authenticated;

revoke all on function public.tk_setup_status(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_setup_status(p_ws uuid) to authenticated;

revoke all on function public.tk_list_care(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_care(p_ws uuid) to authenticated;

revoke all on function public.tk_save_care(p_ws uuid, p_id uuid, p_person uuid, p_kind text, p_body text, p_follow_up date, p_status text) from public, anon, authenticated, service_role;
grant execute on function public.tk_save_care(p_ws uuid, p_id uuid, p_person uuid, p_kind text, p_body text, p_follow_up date, p_status text) to authenticated;

revoke all on function public.tk_delete_care(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_delete_care(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_list_households(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_households(p_ws uuid) to authenticated;

revoke all on function public.tk_save_household(p_ws uuid, p_id uuid, p_name text) from public, anon, authenticated, service_role;
grant execute on function public.tk_save_household(p_ws uuid, p_id uuid, p_name text) to authenticated;

revoke all on function public.tk_set_household_member(p_ws uuid, p_household uuid, p_person uuid, p_role text) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_household_member(p_ws uuid, p_household uuid, p_person uuid, p_role text) to authenticated;

revoke all on function public.tk_remove_household_member(p_ws uuid, p_person uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_remove_household_member(p_ws uuid, p_person uuid) to authenticated;

revoke all on function public.tk_delete_household(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_delete_household(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_set_attendance(p_ws uuid, p_plan uuid, p_count integer) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_attendance(p_ws uuid, p_plan uuid, p_count integer) to authenticated;

revoke all on function public.tk_service_trends(p_ws uuid, p_weeks integer) from public, anon, authenticated, service_role;
grant execute on function public.tk_service_trends(p_ws uuid, p_weeks integer) to authenticated;

revoke all on function public.tk_log_print(p_ws uuid, p_kind text, p_count integer) from public, anon, authenticated, service_role;
grant execute on function public.tk_log_print(p_ws uuid, p_kind text, p_count integer) to authenticated;

revoke all on function public.tk_save_brand(p_ws uuid, p_primary text, p_accent text, p_heading text, p_body text, p_tagline text) from public, anon, authenticated, service_role;
grant execute on function public.tk_save_brand(p_ws uuid, p_primary text, p_accent text, p_heading text, p_body text, p_tagline text) to authenticated;

revoke all on function public.tk_list_announcements(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_announcements(p_ws uuid) to authenticated;

revoke all on function public.tk_save_announcement(p_ws uuid, p_id uuid, p_title text, p_body text, p_from date, p_until date, p_sort integer) from public, anon, authenticated, service_role;
grant execute on function public.tk_save_announcement(p_ws uuid, p_id uuid, p_title text, p_body text, p_from date, p_until date, p_sort integer) to authenticated;

revoke all on function public.tk_delete_announcement(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_delete_announcement(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_person_display(p_ws uuid, p_person uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_person_display(p_ws uuid, p_person uuid) to authenticated;

revoke all on function public.tk_set_person_display(p_ws uuid, p_person uuid, p_name_ok boolean) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_person_display(p_ws uuid, p_person uuid, p_name_ok boolean) to authenticated;

revoke all on function public.tk_sunday_slide_data(p_ws uuid, p_plan uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_sunday_slide_data(p_ws uuid, p_plan uuid) to authenticated;

revoke all on function toolkit_core.my_group_role(p_ws uuid, p_group uuid) from public, anon, authenticated, service_role;

revoke all on function public.tk_list_groups(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_groups(p_ws uuid) to authenticated;

revoke all on function public.tk_get_group(p_ws uuid, p_group uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_get_group(p_ws uuid, p_group uuid) to authenticated;

revoke all on function public.tk_save_group(p_ws uuid, p_id uuid, p_name text, p_kind text, p_description text, p_meets text, p_location text, p_open boolean, p_status text) from public, anon, authenticated, service_role;
grant execute on function public.tk_save_group(p_ws uuid, p_id uuid, p_name text, p_kind text, p_description text, p_meets text, p_location text, p_open boolean, p_status text) to authenticated;

revoke all on function public.tk_delete_group(p_ws uuid, p_group uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_delete_group(p_ws uuid, p_group uuid) to authenticated;

revoke all on function public.tk_set_group_member(p_ws uuid, p_group uuid, p_person uuid, p_role text) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_group_member(p_ws uuid, p_group uuid, p_person uuid, p_role text) to authenticated;

revoke all on function public.tk_remove_group_member(p_ws uuid, p_group uuid, p_person uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_remove_group_member(p_ws uuid, p_group uuid, p_person uuid) to authenticated;

revoke all on function public.tk_record_meeting(p_ws uuid, p_group uuid, p_held date, p_lesson uuid, p_topic text, p_notes text, p_present uuid[]) from public, anon, authenticated, service_role;
grant execute on function public.tk_record_meeting(p_ws uuid, p_group uuid, p_held date, p_lesson uuid, p_topic text, p_notes text, p_present uuid[]) to authenticated;

revoke all on function public.tk_set_group_study(p_ws uuid, p_group uuid, p_study uuid, p_position integer) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_group_study(p_ws uuid, p_group uuid, p_study uuid, p_position integer) to authenticated;

revoke all on function public.tk_list_studies(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_studies(p_ws uuid) to authenticated;

revoke all on function public.tk_get_study(p_ws uuid, p_study uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_get_study(p_ws uuid, p_study uuid) to authenticated;

revoke all on function public.tk_save_study(p_ws uuid, p_id uuid, p_title text, p_description text) from public, anon, authenticated, service_role;
grant execute on function public.tk_save_study(p_ws uuid, p_id uuid, p_title text, p_description text) to authenticated;

revoke all on function public.tk_delete_study(p_ws uuid, p_study uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_delete_study(p_ws uuid, p_study uuid) to authenticated;

revoke all on function public.tk_save_lesson(p_ws uuid, p_study uuid, p_id uuid, p_title text, p_passage text, p_summary text, p_questions text, p_notes text, p_position integer) from public, anon, authenticated, service_role;
grant execute on function public.tk_save_lesson(p_ws uuid, p_study uuid, p_id uuid, p_title text, p_passage text, p_summary text, p_questions text, p_notes text, p_position integer) to authenticated;

revoke all on function public.tk_delete_lesson(p_ws uuid, p_lesson uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_delete_lesson(p_ws uuid, p_lesson uuid) to authenticated;

revoke all on function public.tk_study_from_sermon(p_ws uuid, p_sermon uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_study_from_sermon(p_ws uuid, p_sermon uuid) to authenticated;

revoke all on function public.tk_get_brand(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_get_brand(p_ws uuid) to authenticated;

revoke all on function public.tk_set_brand_logo(p_ws uuid, p_logo text) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_brand_logo(p_ws uuid, p_logo text) to authenticated;

revoke all on function public.tk_get_groups_page(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_get_groups_page(p_ws uuid) to authenticated;

revoke all on function public.tk_set_groups_public(p_ws uuid, p_enabled boolean) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_groups_public(p_ws uuid, p_enabled boolean) to authenticated;

revoke all on function public.tk_set_group_listing(p_ws uuid, p_group uuid, p_listed boolean) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_group_listing(p_ws uuid, p_group uuid, p_listed boolean) to authenticated;

revoke all on function public.tk_public_groups_info(p_slug text) from public, anon, authenticated, service_role;
grant execute on function public.tk_public_groups_info(p_slug text) to anon;
grant execute on function public.tk_public_groups_info(p_slug text) to authenticated;

revoke all on function public.tk_public_group_request(p_slug text, p_group uuid, p_first text, p_last text, p_email text, p_phone text, p_adult boolean, p_contact_ok boolean, p_website text) from public, anon, authenticated, service_role;
grant execute on function public.tk_public_group_request(p_slug text, p_group uuid, p_first text, p_last text, p_email text, p_phone text, p_adult boolean, p_contact_ok boolean, p_website text) to anon;
grant execute on function public.tk_public_group_request(p_slug text, p_group uuid, p_first text, p_last text, p_email text, p_phone text, p_adult boolean, p_contact_ok boolean, p_website text) to authenticated;

revoke all on function public.tk_list_group_requests(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_group_requests(p_ws uuid) to authenticated;

revoke all on function public.tk_resolve_group_request(p_ws uuid, p_id uuid, p_action text) from public, anon, authenticated, service_role;
grant execute on function public.tk_resolve_group_request(p_ws uuid, p_id uuid, p_action text) to authenticated;

revoke all on function public.tk_get_events_page(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_get_events_page(p_ws uuid) to authenticated;

revoke all on function public.tk_set_events_public(p_ws uuid, p_enabled boolean) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_events_public(p_ws uuid, p_enabled boolean) to authenticated;

revoke all on function public.tk_set_event_signup(p_ws uuid, p_item uuid, p_enabled boolean, p_capacity integer, p_blurb text) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_event_signup(p_ws uuid, p_item uuid, p_enabled boolean, p_capacity integer, p_blurb text) to authenticated;

revoke all on function public.tk_get_event_signup(p_ws uuid, p_item uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_get_event_signup(p_ws uuid, p_item uuid) to authenticated;

revoke all on function public.tk_list_event_registrations(p_ws uuid, p_item uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_event_registrations(p_ws uuid, p_item uuid) to authenticated;

revoke all on function toolkit_core.promote_waitlist(p_item uuid) from public, anon, authenticated, service_role;

revoke all on function public.tk_cancel_event_registration(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_cancel_event_registration(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_public_events_info(p_slug text) from public, anon, authenticated, service_role;
grant execute on function public.tk_public_events_info(p_slug text) to anon;
grant execute on function public.tk_public_events_info(p_slug text) to authenticated;

revoke all on function public.tk_public_event_register(p_slug text, p_item uuid, p_first text, p_last text, p_email text, p_phone text, p_party integer, p_adult boolean, p_contact_ok boolean, p_website text) from public, anon, authenticated, service_role;
grant execute on function public.tk_public_event_register(p_slug text, p_item uuid, p_first text, p_last text, p_email text, p_phone text, p_party integer, p_adult boolean, p_contact_ok boolean, p_website text) to anon;
grant execute on function public.tk_public_event_register(p_slug text, p_item uuid, p_first text, p_last text, p_email text, p_phone text, p_party integer, p_adult boolean, p_contact_ok boolean, p_website text) to authenticated;

revoke all on function toolkit_core.can_see_partner(p_ws uuid, p_sensitive boolean) from public, anon, authenticated, service_role;

revoke all on function public.tk_list_partners(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_partners(p_ws uuid) to authenticated;

revoke all on function public.tk_get_partner(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_get_partner(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_save_partner(p_ws uuid, p_id uuid, p_name text, p_kind text, p_region text, p_summary text, p_contact text, p_email text, p_phone text, p_support numeric, p_sensitive boolean, p_status text) from public, anon, authenticated, service_role;
grant execute on function public.tk_save_partner(p_ws uuid, p_id uuid, p_name text, p_kind text, p_region text, p_summary text, p_contact text, p_email text, p_phone text, p_support numeric, p_sensitive boolean, p_status text) to authenticated;

revoke all on function public.tk_delete_partner(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_delete_partner(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_save_partner_update(p_ws uuid, p_partner uuid, p_id uuid, p_title text, p_body text, p_posted date, p_prayer boolean) from public, anon, authenticated, service_role;
grant execute on function public.tk_save_partner_update(p_ws uuid, p_partner uuid, p_id uuid, p_title text, p_body text, p_posted date, p_prayer boolean) to authenticated;

revoke all on function public.tk_delete_partner_update(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_delete_partner_update(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_list_prayer_updates(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_prayer_updates(p_ws uuid) to authenticated;

revoke all on function toolkit_core.kids_team(p_ws uuid) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.kids_admin(p_ws uuid) from public, anon, authenticated, service_role;

revoke all on function public.tk_kids_rooms(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_kids_rooms(p_ws uuid) to authenticated;

revoke all on function public.tk_kids_save_room(p_ws uuid, p_id uuid, p_name text, p_ages text, p_ratio integer, p_active boolean) from public, anon, authenticated, service_role;
grant execute on function public.tk_kids_save_room(p_ws uuid, p_id uuid, p_name text, p_ages text, p_ratio integer, p_active boolean) to authenticated;

revoke all on function public.tk_kids_delete_room(p_ws uuid, p_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_kids_delete_room(p_ws uuid, p_id uuid) to authenticated;

revoke all on function public.tk_kids_children(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_kids_children(p_ws uuid) to authenticated;

revoke all on function public.tk_kids_set_guardian(p_ws uuid, p_child uuid, p_guardian uuid, p_can_pickup boolean) from public, anon, authenticated, service_role;
grant execute on function public.tk_kids_set_guardian(p_ws uuid, p_child uuid, p_guardian uuid, p_can_pickup boolean) to authenticated;

revoke all on function public.tk_kids_remove_guardian(p_ws uuid, p_child uuid, p_guardian uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_kids_remove_guardian(p_ws uuid, p_child uuid, p_guardian uuid) to authenticated;

revoke all on function public.tk_kids_set_health(p_ws uuid, p_child uuid, p_allergies text, p_medical text, p_notes text) from public, anon, authenticated, service_role;
grant execute on function public.tk_kids_set_health(p_ws uuid, p_child uuid, p_allergies text, p_medical text, p_notes text) to authenticated;

revoke all on function public.tk_kids_set_clearance(p_ws uuid, p_person uuid, p_until date, p_note text) from public, anon, authenticated, service_role;
grant execute on function public.tk_kids_set_clearance(p_ws uuid, p_person uuid, p_until date, p_note text) to authenticated;

revoke all on function public.tk_kids_helpers(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_kids_helpers(p_ws uuid) to authenticated;

revoke all on function public.tk_kids_duty_on(p_ws uuid, p_room uuid, p_person uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_kids_duty_on(p_ws uuid, p_room uuid, p_person uuid) to authenticated;

revoke all on function public.tk_kids_duty_off(p_ws uuid, p_person uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_kids_duty_off(p_ws uuid, p_person uuid) to authenticated;

revoke all on function public.tk_kids_check_in(p_ws uuid, p_child uuid, p_room uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_kids_check_in(p_ws uuid, p_child uuid, p_room uuid) to authenticated;

revoke all on function public.tk_kids_present(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_kids_present(p_ws uuid) to authenticated;

revoke all on function public.tk_kids_check_out(p_ws uuid, p_checkin uuid, p_code text, p_guardian uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_kids_check_out(p_ws uuid, p_checkin uuid, p_code text, p_guardian uuid) to authenticated;

revoke all on function public.tk_my_profile(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_my_profile(p_ws uuid) to authenticated;

revoke all on function public.tk_update_my_contact(p_ws uuid, p_phone text, p_channel text) from public, anon, authenticated, service_role;
grant execute on function public.tk_update_my_contact(p_ws uuid, p_phone text, p_channel text) to authenticated;

revoke all on function public.tk_set_my_display(p_ws uuid, p_name_ok boolean) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_my_display(p_ws uuid, p_name_ok boolean) to authenticated;

revoke all on function public.tk_set_my_consent(p_ws uuid, p_purpose text, p_channel text, p_granted boolean) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_my_consent(p_ws uuid, p_purpose text, p_channel text, p_granted boolean) to authenticated;

revoke all on function toolkit_core.event_no_change() from public, anon, authenticated, service_role;

revoke all on function toolkit_core.emit_event(p_ws uuid, p_event_type text, p_entity_type text, p_entity_id text, p_payload jsonb, p_source text) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.capture_operational_event() from public, anon, authenticated, service_role;

revoke all on function toolkit_core.automation_touch_updated_at() from public, anon, authenticated, service_role;

revoke all on function toolkit_core.seed_automation_permissions(p_ws uuid) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.seed_automation_permissions_trigger() from public, anon, authenticated, service_role;

revoke all on function toolkit_core.autonomy_rank(p_level text) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.automation_permission_allows(p_ws uuid, p_capability text, p_required text) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.begin_automation_run(p_ws uuid, p_rule uuid, p_event bigint, p_idempotency_key text) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.add_automation_step(p_ws uuid, p_run uuid, p_position integer, p_step_kind text, p_idempotency_key text, p_input jsonb) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.create_action_proposal(p_ws uuid, p_run uuid, p_step bigint, p_idempotency_key text, p_proposal_type text, p_entity_type text, p_entity_id text, p_title text, p_summary text, p_explanation jsonb, p_proposed_action jsonb, p_risk_level text, p_expires_at timestamp with time zone) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.enqueue_scheduled_job(p_ws uuid, p_run uuid, p_step bigint, p_idempotency_key text, p_job_type text, p_payload jsonb, p_run_at timestamp with time zone, p_max_attempts integer) from public, anon, authenticated, service_role;

revoke all on function public.tk_worker_claim_jobs(p_worker text, p_limit integer) from public, anon, authenticated, service_role;
grant execute on function public.tk_worker_claim_jobs(p_worker text, p_limit integer) to service_role;

revoke all on function public.tk_worker_finish_job(p_job uuid, p_worker text, p_success boolean, p_error text, p_retry_at timestamp with time zone) from public, anon, authenticated, service_role;
grant execute on function public.tk_worker_finish_job(p_job uuid, p_worker text, p_success boolean, p_error text, p_retry_at timestamp with time zone) to service_role;

revoke all on function public.tk_worker_begin_run(p_ws uuid, p_rule uuid, p_event bigint, p_idempotency_key text) from public, anon, authenticated, service_role;
grant execute on function public.tk_worker_begin_run(p_ws uuid, p_rule uuid, p_event bigint, p_idempotency_key text) to service_role;

revoke all on function public.tk_worker_add_step(p_ws uuid, p_run uuid, p_position integer, p_step_kind text, p_idempotency_key text, p_input jsonb) from public, anon, authenticated, service_role;
grant execute on function public.tk_worker_add_step(p_ws uuid, p_run uuid, p_position integer, p_step_kind text, p_idempotency_key text, p_input jsonb) to service_role;

revoke all on function public.tk_worker_create_proposal(p_ws uuid, p_run uuid, p_step bigint, p_idempotency_key text, p_proposal_type text, p_entity_type text, p_entity_id text, p_title text, p_summary text, p_explanation jsonb, p_proposed_action jsonb, p_risk_level text, p_expires_at timestamp with time zone) from public, anon, authenticated, service_role;
grant execute on function public.tk_worker_create_proposal(p_ws uuid, p_run uuid, p_step bigint, p_idempotency_key text, p_proposal_type text, p_entity_type text, p_entity_id text, p_title text, p_summary text, p_explanation jsonb, p_proposed_action jsonb, p_risk_level text, p_expires_at timestamp with time zone) to service_role;

revoke all on function public.tk_worker_enqueue_job(p_ws uuid, p_run uuid, p_step bigint, p_idempotency_key text, p_job_type text, p_payload jsonb, p_run_at timestamp with time zone, p_max_attempts integer) from public, anon, authenticated, service_role;
grant execute on function public.tk_worker_enqueue_job(p_ws uuid, p_run uuid, p_step bigint, p_idempotency_key text, p_job_type text, p_payload jsonb, p_run_at timestamp with time zone, p_max_attempts integer) to service_role;

revoke all on function public.tk_worker_set_run_status(p_run uuid, p_status text, p_error_code text, p_error_message text) from public, anon, authenticated, service_role;
grant execute on function public.tk_worker_set_run_status(p_run uuid, p_status text, p_error_code text, p_error_message text) to service_role;

revoke all on function public.tk_worker_set_step_status(p_step bigint, p_status text, p_output jsonb, p_error_message text) from public, anon, authenticated, service_role;
grant execute on function public.tk_worker_set_step_status(p_step bigint, p_status text, p_output jsonb, p_error_message text) to service_role;

revoke all on function toolkit_core.event_matches_rule(p_event_type text, p_trigger_event text) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.rule_conditions_match(p_event jsonb, p_conditions jsonb) from public, anon, authenticated, service_role;

revoke all on function public.tk_worker_process_events(p_after_event bigint, p_limit integer) from public, anon, authenticated, service_role;
grant execute on function public.tk_worker_process_events(p_after_event bigint, p_limit integer) to service_role;

revoke all on function public.tk_list_action_proposals(p_ws uuid, p_status text, p_limit integer) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_action_proposals(p_ws uuid, p_status text, p_limit integer) to authenticated;

revoke all on function public.tk_decide_action_proposal(p_ws uuid, p_id uuid, p_decision text, p_note text) from public, anon, authenticated, service_role;
grant execute on function public.tk_decide_action_proposal(p_ws uuid, p_id uuid, p_decision text, p_note text) to authenticated;

revoke all on function public.tk_list_automation_permissions(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_automation_permissions(p_ws uuid) to authenticated;

revoke all on function public.tk_set_automation_permission(p_ws uuid, p_capability text, p_enabled boolean, p_autonomy_level text) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_automation_permission(p_ws uuid, p_capability text, p_enabled boolean, p_autonomy_level text) to authenticated;

revoke all on function toolkit_core.set_signal_state(p_ws uuid, p_signal_key text, p_signal_type text, p_entity_type text, p_entity_id text, p_active boolean, p_payload jsonb, p_resolved_event_type text) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.sunday_signal_sweep() from public, anon, authenticated, service_role;

revoke all on function toolkit_core.automation_background_tick() from public, anon, authenticated, service_role;

revoke all on function toolkit_core.role_requires_kids_clearance(p_role_name text) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.sunday_staffing_intelligence(p_ws uuid, p_plan uuid) from public, anon, authenticated, service_role;

revoke all on function public.tk_sunday_staffing_recommendations(p_ws uuid, p_plan uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_sunday_staffing_recommendations(p_ws uuid, p_plan uuid) to authenticated;

revoke all on function toolkit_core.enrich_pending_sunday_staffing_proposals() from public, anon, authenticated, service_role;

revoke all on function toolkit_core.normalize_role_key(p_role_name text) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.role_requires_explicit_fit(p_role_name text) from public, anon, authenticated, service_role;

revoke all on function public.tk_list_volunteer_role_profiles(p_ws uuid, p_person uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_volunteer_role_profiles(p_ws uuid, p_person uuid) to authenticated;

revoke all on function public.tk_set_volunteer_role_profile(p_ws uuid, p_person uuid, p_role_name text, p_eligible boolean, p_preferred boolean) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_volunteer_role_profile(p_ws uuid, p_person uuid, p_role_name text, p_eligible boolean, p_preferred boolean) to authenticated;

revoke all on function toolkit_core.queue_message_draft_internal(p_ws uuid, p_person uuid, p_channel text, p_purpose text, p_body text, p_actor uuid, p_related_type text, p_related_id uuid) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.sunday_staffing_plan(p_ws uuid, p_plan uuid) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.execute_approved_proposal(p_proposal uuid) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.execute_approved_proposals(p_limit integer) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.ai_provider_active(p_ws uuid) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.request_sermon_content_pack_internal(p_ws uuid, p_sermon uuid, p_actor uuid) from public, anon, authenticated, service_role;

revoke all on function public.tk_get_church_voice(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_get_church_voice(p_ws uuid) to authenticated;

revoke all on function public.tk_set_church_voice(p_ws uuid, p_bible_translation text, p_service_term text, p_tone text, p_formality text, p_emoji_style text, p_announcement_style text, p_mission_values text, p_phrases_use text[], p_phrases_avoid text[]) from public, anon, authenticated, service_role;
grant execute on function public.tk_set_church_voice(p_ws uuid, p_bible_translation text, p_service_term text, p_tone text, p_formality text, p_emoji_style text, p_announcement_style text, p_mission_values text, p_phrases_use text[], p_phrases_avoid text[]) to authenticated;

revoke all on function toolkit_core.refresh_learned_rhythms(p_ws uuid) from public, anon, authenticated, service_role;

revoke all on function public.tk_list_church_rhythms(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_church_rhythms(p_ws uuid) to authenticated;

revoke all on function public.tk_provider_status(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_provider_status(p_ws uuid) to authenticated;

revoke all on function public.tk_operator_snapshot(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_operator_snapshot(p_ws uuid) to authenticated;

revoke all on function public.tk_ai_safe_week_status(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_ai_safe_week_status(p_ws uuid) to authenticated;

revoke all on function toolkit_core.sync_default_automation_permissions() from public, anon, authenticated, service_role;

revoke all on function toolkit_core.domain_signal_sweep() from public, anon, authenticated, service_role;

revoke all on function toolkit_core.enrich_pending_domain_proposals() from public, anon, authenticated, service_role;

revoke all on function toolkit_core.refresh_all_learned_rhythms() from public, anon, authenticated, service_role;

revoke all on function toolkit_core.refresh_operational_graph(p_ws uuid) from public, anon, authenticated, service_role;

revoke all on function toolkit_core.refresh_all_operational_graphs() from public, anon, authenticated, service_role;

revoke all on function public.tk_save_memory_fact(p_ws uuid, p_key text, p_label text, p_category text, p_value jsonb, p_sensitivity text) from public, anon, authenticated, service_role;
grant execute on function public.tk_save_memory_fact(p_ws uuid, p_key text, p_label text, p_category text, p_value jsonb, p_sensitivity text) to authenticated;

revoke all on function public.tk_search_church_memory(p_ws uuid, p_query text, p_limit integer) from public, anon, authenticated, service_role;
grant execute on function public.tk_search_church_memory(p_ws uuid, p_query text, p_limit integer) to authenticated;

revoke all on function public.tk_save_automation_policy(p_ws uuid, p_name text, p_natural text, p_kind text, p_structured jsonb) from public, anon, authenticated, service_role;
grant execute on function public.tk_save_automation_policy(p_ws uuid, p_name text, p_natural text, p_kind text, p_structured jsonb) to authenticated;

revoke all on function public.tk_confirm_automation_policy(p_ws uuid, p_id uuid, p_confirm boolean) from public, anon, authenticated, service_role;
grant execute on function public.tk_confirm_automation_policy(p_ws uuid, p_id uuid, p_confirm boolean) to authenticated;

revoke all on function public.tk_list_workflow_templates() from public, anon, authenticated, service_role;
grant execute on function public.tk_list_workflow_templates() to authenticated;

revoke all on function toolkit_core.data_hygiene_sweep() from public, anon, authenticated, service_role;

revoke all on function public.tk_staff_meeting_agenda(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_staff_meeting_agenda(p_ws uuid) to authenticated;

revoke all on function public.tk_board_packet(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_board_packet(p_ws uuid) to authenticated;

revoke all on function public.tk_operational_signals(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_operational_signals(p_ws uuid) to authenticated;

revoke all on function public.tk_seasonal_patterns(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_seasonal_patterns(p_ws uuid) to authenticated;

revoke all on function public.tk_self_configure_suggestions(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_self_configure_suggestions(p_ws uuid) to authenticated;

revoke all on function public.tk_ai_safe_open_roles(p_ws uuid, p_plan uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_ai_safe_open_roles(p_ws uuid, p_plan uuid) to authenticated;

revoke all on function public.tk_ai_safe_guest_followups(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_ai_safe_guest_followups(p_ws uuid) to authenticated;

revoke all on function public.tk_ai_safe_event_status(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_ai_safe_event_status(p_ws uuid) to authenticated;

revoke all on function public.tk_ai_safe_document_renewals(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_ai_safe_document_renewals(p_ws uuid) to authenticated;

revoke all on function public.tk_ai_safe_sermon_context(p_ws uuid, p_sermon uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_ai_safe_sermon_context(p_ws uuid, p_sermon uuid) to authenticated;

revoke all on function public.tk_ai_safe_group_status(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_ai_safe_group_status(p_ws uuid) to authenticated;

revoke all on function public.tk_worker_set_provider_connection(p_ws uuid, p_type text, p_name text, p_status text, p_secret_ref text, p_config jsonb) from public, anon, authenticated, service_role;
grant execute on function public.tk_worker_set_provider_connection(p_ws uuid, p_type text, p_name text, p_status text, p_secret_ref text, p_config jsonb) to service_role;

revoke all on function public.tk_worker_claim_ai_generations(p_worker text, p_limit integer) from public, anon, authenticated, service_role;
grant execute on function public.tk_worker_claim_ai_generations(p_worker text, p_limit integer) to service_role;

revoke all on function public.tk_worker_finish_ai_generation(p_id uuid, p_worker text, p_success boolean, p_output text, p_error text, p_model text) from public, anon, authenticated, service_role;
grant execute on function public.tk_worker_finish_ai_generation(p_id uuid, p_worker text, p_success boolean, p_output text, p_error text, p_model text) to service_role;

revoke all on function public.tk_worker_record_webhook_event(p_ws uuid, p_type text, p_name text, p_external_id text, p_event_type text, p_payload_hash text, p_metadata jsonb) from public, anon, authenticated, service_role;
grant execute on function public.tk_worker_record_webhook_event(p_ws uuid, p_type text, p_name text, p_external_id text, p_event_type text, p_payload_hash text, p_metadata jsonb) to service_role;

revoke all on function toolkit_core.capture_group_meeting_event() from public, anon, authenticated, service_role;

revoke all on function toolkit_core.capture_inbound_message_event() from public, anon, authenticated, service_role;

revoke all on function public.tk_worker_process_inbound_sms(p_ws uuid, p_person uuid, p_body text, p_provider_name text, p_external_event_id text) from public, anon, authenticated, service_role;
grant execute on function public.tk_worker_process_inbound_sms(p_ws uuid, p_person uuid, p_body text, p_provider_name text, p_external_event_id text) to service_role;

revoke all on function public.tk_list_automation_observations(p_ws uuid, p_limit integer) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_automation_observations(p_ws uuid, p_limit integer) to authenticated;

revoke all on function toolkit_core.enrich_pending_sunday_operational_proposals() from public, anon, authenticated, service_role;

revoke all on function toolkit_core.auto_approve_act_mode_proposals() from public, anon, authenticated, service_role;

revoke all on function public.tk_list_automation_policies(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_list_automation_policies(p_ws uuid) to authenticated;

revoke all on function toolkit_core.enrich_pending_data_hygiene_proposals() from public, anon, authenticated, service_role;

revoke all on function public.tk_integration_preflight(p_ws uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_integration_preflight(p_ws uuid) to authenticated;

revoke all on function public.tk_simulate_outbound_message(p_ws uuid, p_person uuid, p_channel text, p_purpose text) from public, anon, authenticated, service_role;
grant execute on function public.tk_simulate_outbound_message(p_ws uuid, p_person uuid, p_channel text, p_purpose text) to authenticated;

revoke all on function public.tk_simulate_inbound_sms(p_ws uuid, p_person uuid, p_body text) from public, anon, authenticated, service_role;
grant execute on function public.tk_simulate_inbound_sms(p_ws uuid, p_person uuid, p_body text) to authenticated;

revoke all on function public.tk_global_search(p_ws uuid, p_query text, p_limit integer) from public, anon, authenticated, service_role;
grant execute on function public.tk_global_search(p_ws uuid, p_query text, p_limit integer) to authenticated;

revoke all on function public.tk_kids_reset_checkout_lock(p_ws uuid, p_checkin uuid) from public, anon, authenticated, service_role;
grant execute on function public.tk_kids_reset_checkout_lock(p_ws uuid, p_checkin uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types,avif_autodetection) values ('toolkit-vault','toolkit-vault',false,26214400,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/png','image/jpeg','text/plain','text/csv','application/vnd.openxmlformats-officedocument.presentationml.presentation']::text[],false) on conflict (id) do update set name=excluded.name, public=excluded.public, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types, avif_autodetection=excluded.avif_autodetection;

drop policy if exists toolkit_vault_read on storage.objects;
create policy toolkit_vault_read on storage.objects for select to authenticated using (bucket_id = 'toolkit-vault' and public.tk_vault_read_ok(name));
drop policy if exists toolkit_vault_insert on storage.objects;
create policy toolkit_vault_insert on storage.objects for insert to authenticated with check (bucket_id = 'toolkit-vault' and public.tk_vault_write_ok(name));
drop policy if exists toolkit_vault_delete on storage.objects;
create policy toolkit_vault_delete on storage.objects for delete to authenticated using (bucket_id = 'toolkit-vault' and public.tk_vault_write_ok(name));

insert into toolkit_core.workflow_templates(template_key,name,capability,description,default_autonomy,active) values
('board_meeting','Board meeting','board','Compile an operational board brief without making governance decisions.','prepare',true),
('christmas','Christmas','operator','Reusable seasonal preparation structure based on approved church history.','prepare',true),
('document_renewal','Document renewal','renewals','Watch expiration windows and create accountable renewal follow-up.','prepare',true),
('easter','Easter','operator','Reusable seasonal preparation structure based on approved church history.','prepare',true),
('event','Event','events','Coordinate registration, capacity, staffing, reminders, waitlist, and follow-up.','prepare',true),
('group','Group','groups','Support group requests, meetings, curriculum progress, and leader follow-up.','prepare',true),
('guest_journey','Guest journey','guests','Follow a Connect Card from first response through a human-reviewed next step.','prepare',true),
('missions','Missions','missions','Watch partner update cadence and prepare follow-up/content work.','prepare',true),
('staff_meeting','Staff meeting','meetings','Build an agenda from unresolved operational exceptions and deadlines.','prepare',true),
('sunday','Sunday','sunday','Prepare the next service, watch staffing and preparation gaps, and surface exceptions.','prepare',true),
('vbs','VBS','events','Reusable VBS planning structure for registration, volunteers, rooms, communication, and follow-up.','prepare',true),
('volunteer_onboarding','Volunteer onboarding','volunteers','Track availability, role fit, clearances, assignments, and follow-up.','prepare',true)
on conflict (template_key) do update set name=excluded.name, capability=excluded.capability, description=excluded.description, default_autonomy=excluded.default_autonomy, active=excluded.active;

set check_function_bodies = on;
