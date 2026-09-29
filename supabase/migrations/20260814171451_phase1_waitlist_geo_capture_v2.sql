alter table public.waitlist add column if not exists state_code text;
alter table public.waitlist add column if not exists place_id uuid references public.geo_places(id) on delete set null;
alter table public.profiles add column if not exists state_code text;
alter table public.profiles add column if not exists place_id uuid references public.geo_places(id) on delete set null;
alter table public.vendors add column if not exists base_place_id uuid references public.geo_places(id) on delete set null;

alter table public.waitlist drop constraint if exists waitlist_state_code_check;
alter table public.waitlist add constraint waitlist_state_code_check check (state_code is null or state_code ~ '^[A-Z]{2}$');
alter table public.profiles drop constraint if exists profiles_state_code_check;
alter table public.profiles add constraint profiles_state_code_check check (state_code is null or state_code ~ '^[A-Z]{2}$');

create index if not exists waitlist_place_idx on public.waitlist(place_id) where place_id is not null;
create index if not exists profiles_place_idx on public.profiles(place_id) where place_id is not null;
create index if not exists vendors_base_place_idx on public.vendors(base_place_id) where base_place_id is not null;

insert into public.platform_settings(key,value,updated_at)
values ('waitlist_geo_required','false',now())
on conflict (key) do nothing;

do $$
declare
  v_def text;
  v_old text;
  v_new text;
begin
  select pg_get_functiondef('public.kb_submit_waitlist_application(jsonb)'::regprocedure) into v_def;
  v_def := replace(v_def, chr(13), '');

  v_old := E'  v_city text;\n  v_delivery_model text;';
  v_new := E'  v_city text;\n  v_state_code text;\n  v_place_id uuid;\n  v_geo_required boolean := false;\n  v_delivery_model text;';
  if strpos(v_def, v_old) = 0 then raise exception 'waitlist geo patch: declaration anchor missing'; end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := E'  v_city := nullif(btrim(coalesce(p_payload->>''city'','''')), '''');\n  v_delivery_model := nullif(btrim(coalesce(p_payload->>''delivery_model'','''')), '''');';
  v_new := E'  v_city := nullif(btrim(coalesce(p_payload->>''city'','''')), '''');\n  v_state_code := upper(nullif(btrim(coalesce(p_payload->>''state_code'','''')), ''''));\n  select exists (\n    select 1 from public.platform_settings s\n    where s.key = ''waitlist_geo_required''\n      and lower(btrim(coalesce(s.value, ''''))) in (''true'',''1'',''yes'',''on'')\n  ) into v_geo_required;\n  v_delivery_model := nullif(btrim(coalesce(p_payload->>''delivery_model'','''')), '''');';
  if strpos(v_def, v_old) = 0 then raise exception 'waitlist geo patch: assignment anchor missing'; end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := E'  IF v_role=''vendor'' AND (v_category IS NULL OR v_city IS NULL OR v_delivery_model IS NULL) THEN\n    RAISE EXCEPTION USING errcode=''22023'', message=''Vendor category, service area, and delivery model are required.'';\n  END IF;';
  v_new := E'  IF v_state_code IS NOT NULL AND v_state_code !~ ''^[A-Z]{2}$'' THEN\n    RAISE EXCEPTION USING errcode=''22023'', message=''A valid two-letter state code is required.'';\n  END IF;\n\n  IF v_geo_required AND (v_city IS NULL OR v_state_code IS NULL) THEN\n    RAISE EXCEPTION USING errcode=''22023'', message=''City and state are required for early access.'';\n  END IF;\n\n  IF v_role=''vendor'' AND (v_category IS NULL OR v_city IS NULL OR v_delivery_model IS NULL) THEN\n    RAISE EXCEPTION USING errcode=''22023'', message=''Vendor category, service area, and delivery model are required.'';\n  END IF;\n\n  IF v_city IS NOT NULL AND v_state_code IS NOT NULL THEN\n    SELECT p.id INTO v_place_id\n    FROM public.geo_places p\n    WHERE p.active\n      AND lower(btrim(p.city)) = lower(btrim(v_city))\n      AND p.state_code = v_state_code\n      AND p.country_code = ''US''\n    ORDER BY p.id\n    LIMIT 1;\n  END IF;';
  if strpos(v_def, v_old) = 0 then raise exception 'waitlist geo patch: validation anchor missing'; end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := E'        role,email,full_name,org_name,title_role,category,city,delivery_model,\n        congregation_size,first_project,past_church_client,referral_code,';
  v_new := E'        role,email,full_name,org_name,title_role,category,city,state_code,place_id,delivery_model,\n        congregation_size,first_project,past_church_client,referral_code,';
  if strpos(v_def, v_old) = 0 then raise exception 'waitlist geo patch: insert column anchor missing'; end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := E'        v_city,\n        CASE WHEN v_role=''vendor'' THEN v_delivery_model ELSE NULL END,';
  v_new := E'        v_city,\n        v_state_code,\n        v_place_id,\n        CASE WHEN v_role=''vendor'' THEN v_delivery_model ELSE NULL END,';
  if strpos(v_def, v_old) = 0 then raise exception 'waitlist geo patch: insert value anchor missing'; end if;
  v_def := replace(v_def, v_old, v_new);

  execute v_def;
end $$;

do $$
declare
  v_def text;
  v_old text;
  v_new text;
begin
  select pg_get_functiondef('public.kb_service_finalize_waitlist_conversion_v1_internal(uuid,bytea,uuid)'::regprocedure) into v_def;
  v_def := replace(v_def, chr(13), '');

  v_old := E'      org_name,\n      city,\n      category,';
  v_new := E'      org_name,\n      city,\n      state_code,\n      place_id,\n      category,';
  if strpos(v_def, v_old) = 0 then raise exception 'finalizer geo patch: profile insert columns anchor missing'; end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := E'      v_org_name,\n      v_city,\n      v_category,';
  v_new := E'      v_org_name,\n      v_city,\n      v_waitlist.state_code,\n      v_waitlist.place_id,\n      v_category,';
  if strpos(v_def, v_old) = 0 then raise exception 'finalizer geo patch: profile insert values anchor missing'; end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := E'        city = coalesce(\n          nullif(btrim(p.city), ''''),\n          v_city\n        ),\n        category = coalesce(';
  v_new := E'        city = coalesce(\n          nullif(btrim(p.city), ''''),\n          v_city\n        ),\n        state_code = coalesce(\n          nullif(btrim(p.state_code), ''''),\n          v_waitlist.state_code\n        ),\n        place_id = coalesce(p.place_id, v_waitlist.place_id),\n        category = coalesce(';
  if strpos(v_def, v_old) = 0 then raise exception 'finalizer geo patch: profile update anchor missing'; end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := E'        category,\n        city,\n        verified,';
  v_new := E'        category,\n        city,\n        base_place_id,\n        verified,';
  if strpos(v_def, v_old) = 0 then raise exception 'finalizer geo patch: vendor insert base column anchor missing'; end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := E'        category_tags,\n        service_city,\n        service_model';
  v_new := E'        category_tags,\n        service_city,\n        service_state,\n        service_model';
  if strpos(v_def, v_old) = 0 then raise exception 'finalizer geo patch: vendor insert service column anchor missing'; end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := E'        v_category,\n        v_city,\n        false,';
  v_new := E'        v_category,\n        v_city,\n        v_waitlist.place_id,\n        false,';
  if strpos(v_def, v_old) = 0 then raise exception 'finalizer geo patch: vendor insert base value anchor missing'; end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := E'        end,\n        v_city,\n        v_service_model';
  v_new := E'        end,\n        v_city,\n        v_waitlist.state_code,\n        v_service_model';
  if strpos(v_def, v_old) = 0 then raise exception 'finalizer geo patch: vendor insert service value anchor missing'; end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := E'          city = coalesce(\n            nullif(btrim(v.city), ''''),\n            v_city\n          ),\n          primary_category = coalesce(';
  v_new := E'          city = coalesce(\n            nullif(btrim(v.city), ''''),\n            v_city\n          ),\n          base_place_id = coalesce(v.base_place_id, v_waitlist.place_id),\n          primary_category = coalesce(';
  if strpos(v_def, v_old) = 0 then raise exception 'finalizer geo patch: vendor update base anchor missing'; end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := E'          service_city = coalesce(\n            nullif(btrim(v.service_city), ''''),\n            v_city\n          ),\n          service_model = coalesce(';
  v_new := E'          service_city = coalesce(\n            nullif(btrim(v.service_city), ''''),\n            v_city\n          ),\n          service_state = coalesce(\n            nullif(btrim(v.service_state), ''''),\n            v_waitlist.state_code\n          ),\n          service_model = coalesce(';
  if strpos(v_def, v_old) = 0 then raise exception 'finalizer geo patch: vendor update service anchor missing'; end if;
  v_def := replace(v_def, v_old, v_new);

  execute v_def;
end $$;
