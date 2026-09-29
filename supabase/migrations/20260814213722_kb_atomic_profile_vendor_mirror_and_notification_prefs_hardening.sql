-- #9 Settings/My Account: make the profile/vendor mirror atomic and tighten notification preference integrity.

create or replace function public.kb_sync_profile_vendor_mirror(
  p_profile_patch jsonb default '{}'::jsonb,
  p_vendor_patch jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_profile jsonb := coalesce(p_profile_patch, '{}'::jsonb);
  v_vendor jsonb := coalesce(p_vendor_patch, '{}'::jsonb);
  v_profile_updated boolean := false;
  v_vendor_updated boolean := false;
begin
  if v_uid is null then
    raise exception using errcode='42501', message='Sign in before saving profile settings.';
  end if;
  if jsonb_typeof(v_profile) <> 'object' or jsonb_typeof(v_vendor) <> 'object' then
    raise exception using errcode='22023', message='Profile patches must be JSON objects.';
  end if;

  if v_profile <> '{}'::jsonb then
    update public.profiles p
    set
      org_name = case when v_profile ? 'org_name' then coalesce(v_profile->>'org_name','') else p.org_name end,
      city = case when v_profile ? 'city' then coalesce(v_profile->>'city','') else p.city end,
      state_code = case when v_profile ? 'state_code' then nullif(upper(btrim(v_profile->>'state_code')), '') else p.state_code end,
      denomination = case when v_profile ? 'denomination' then coalesce(v_profile->>'denomination','') else p.denomination end,
      category = case when v_profile ? 'category' then coalesce(v_profile->>'category','') else p.category end,
      faith_statement = case when v_profile ? 'faith_statement' then coalesce(v_profile->>'faith_statement','') else p.faith_statement end
    where p.id = v_uid;
    if not found then
      raise exception using errcode='P0002', message='Profile row not found.';
    end if;
    v_profile_updated := true;
  end if;

  if v_vendor <> '{}'::jsonb then
    update public.vendors v
    set
      name = case when v_vendor ? 'name' then coalesce(v_vendor->>'name','') else v.name end,
      category = case when v_vendor ? 'category' then coalesce(v_vendor->>'category','') else v.category end,
      city = case when v_vendor ? 'city' then coalesce(v_vendor->>'city','') else v.city end,
      service_city = case when v_vendor ? 'service_city' then nullif(btrim(v_vendor->>'service_city'),'') else v.service_city end,
      service_state = case when v_vendor ? 'service_state' then nullif(upper(btrim(v_vendor->>'service_state')),'') else v.service_state end,
      faith_statement = case when v_vendor ? 'faith_statement' then coalesce(v_vendor->>'faith_statement','') else v.faith_statement end,
      bio = case when v_vendor ? 'bio' then coalesce(v_vendor->>'bio','') else v.bio end,
      tags = case when v_vendor ? 'tags' then coalesce((select array_agg(value order by ord) from jsonb_array_elements_text(coalesce(v_vendor->'tags','[]'::jsonb)) with ordinality as x(value,ord)), '{}'::text[]) else v.tags end,
      service_model = case when v_vendor ? 'service_model' then nullif(btrim(v_vendor->>'service_model'),'') else v.service_model end,
      service_radius_miles = case when v_vendor ? 'service_radius_miles' then nullif(v_vendor->>'service_radius_miles','')::integer else v.service_radius_miles end,
      tagline = case when v_vendor ? 'tagline' then coalesce(v_vendor->>'tagline','') else v.tagline end,
      min_project_budget = case when v_vendor ? 'min_project_budget' then nullif(v_vendor->>'min_project_budget','')::integer else v.min_project_budget end,
      max_project_budget = case when v_vendor ? 'max_project_budget' then nullif(v_vendor->>'max_project_budget','')::integer else v.max_project_budget end,
      response_time = case when v_vendor ? 'response_time' then coalesce(v_vendor->>'response_time','') else v.response_time end
    where v.user_id = v_uid;
    if not found then
      raise exception using errcode='P0002', message='Vendor row not found.';
    end if;
    v_vendor_updated := true;
  end if;

  return jsonb_build_object(
    'ok', true,
    'profile_updated', v_profile_updated,
    'vendor_updated', v_vendor_updated
  );
end;
$$;

revoke all on function public.kb_sync_profile_vendor_mirror(jsonb,jsonb) from public, anon;
grant execute on function public.kb_sync_profile_vendor_mirror(jsonb,jsonb) to authenticated, service_role;

update public.notification_prefs
set
  new_bid = coalesce(new_bid, true),
  bid_accepted = coalesce(bid_accepted, true),
  new_message = coalesce(new_message, true),
  project_update = coalesce(project_update, false),
  newsletter = coalesce(newsletter, false),
  updated_at = coalesce(updated_at, now())
where new_bid is null
   or bid_accepted is null
   or new_message is null
   or project_update is null
   or newsletter is null
   or updated_at is null;

alter table public.notification_prefs
  alter column user_id set not null,
  alter column new_bid set not null,
  alter column bid_accepted set not null,
  alter column new_message set not null,
  alter column project_update set not null,
  alter column newsletter set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;
