do $$
declare
  v_def text;
  v_old text;
  v_new text;
begin
  select pg_get_functiondef('public.marketplace_publish_project(uuid)'::regprocedure) into v_def;
  v_def := replace(v_def, chr(13), '');

  v_old := E'  v_project public.projects%rowtype;\n  v_is_admin boolean := false;';
  v_new := E'  v_project public.projects%rowtype;\n  v_is_admin boolean := false;\n  v_geo_required boolean := false;';
  if strpos(v_def,v_old)=0 then raise exception 'publish geo guard declaration anchor missing'; end if;
  v_def := replace(v_def,v_old,v_new);

  v_old := E'  v_is_admin := public.kb_is_platform_admin();\n\n  if not public.kb_marketplace_public() and not v_is_admin then';
  v_new := E'  v_is_admin := public.kb_is_platform_admin();\n  select exists (\n    select 1 from public.platform_settings s\n    where s.key=''marketplace_geo_required''\n      and lower(btrim(coalesce(s.value,''''))) in (''true'',''1'',''yes'',''on'')\n  ) into v_geo_required;\n\n  if not public.kb_marketplace_public() and not v_is_admin then';
  if strpos(v_def,v_old)=0 then raise exception 'publish geo guard setting anchor missing'; end if;
  v_def := replace(v_def,v_old,v_new);

  v_old := E'  if coalesce(v_project.delivery_preference, ''either'') <> ''remote''\n     and nullif(trim(coalesce(v_project.project_city, v_project.city, '''')), '''') is null then\n    raise exception ''Project city or service area is required'' using errcode = ''23514'';\n  end if;';
  v_new := E'  if coalesce(v_project.delivery_preference, ''either'') <> ''remote''\n     and nullif(trim(coalesce(v_project.project_city, v_project.city, '''')), '''') is null then\n    raise exception ''Project city or service area is required'' using errcode = ''23514'';\n  end if;\n  if v_geo_required\n     and coalesce(v_project.delivery_preference, ''either'') <> ''remote''\n     and nullif(trim(coalesce(v_project.project_state, '''')), '''') is null then\n    raise exception ''Project state is required for on-site work'' using errcode = ''23514'';\n  end if;';
  if strpos(v_def,v_old)=0 then raise exception 'publish geo guard validation anchor missing'; end if;
  v_def := replace(v_def,v_old,v_new);

  execute v_def;
end $$;
