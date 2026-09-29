do $$
declare
  v_def text;
  v_old text;
  v_new text;
begin
  select pg_get_functiondef('public.kb_marketplace_geo_fit(uuid,uuid)'::regprocedure) into v_def;
  v_def := replace(v_def, chr(13), '');

  v_old := E'  if v_project_mode=''remote'' then\n    if v_vendor_mode in (''remote'',''both'',''national'',''nationwide'') then\n      return jsonb_build_object(''eligibility'',''eligible'',''fit_tier'',''remote'',''reason'',''Remote-compatible project and vendor.'',''distance_miles'',null);\n    end if;\n    return jsonb_build_object(''eligibility'',''unknown'',''fit_tier'',''delivery_review'',''reason'',''Vendor is not marked remote-capable.'',''distance_miles'',null);\n  end if;\n\n  if v_vendor_mode=''remote'' then';
  v_new := E'  if v_project_mode=''remote'' then\n    if v_vendor_mode in (''remote'',''both'',''national'',''nationwide'') then\n      return jsonb_build_object(''eligibility'',''eligible'',''fit_tier'',''remote'',''reason'',''Remote-compatible project and vendor.'',''distance_miles'',null);\n    end if;\n    return jsonb_build_object(''eligibility'',''unknown'',''fit_tier'',''delivery_review'',''reason'',''Vendor is not marked remote-capable.'',''distance_miles'',null);\n  end if;\n\n  if v_project_mode=''either'' and v_vendor_mode in (''remote'',''both'',''national'',''nationwide'') then\n    return jsonb_build_object(''eligibility'',''eligible'',''fit_tier'',''remote'',''reason'',''Project allows remote delivery and vendor is remote-capable.'',''distance_miles'',null);\n  end if;\n\n  if v_vendor_mode=''remote'' then';
  if strpos(v_def,v_old)=0 then raise exception 'geo fit delivery anchor missing'; end if;
  v_def := replace(v_def,v_old,v_new);
  execute v_def;
end $$;

alter function public.kb_marketplace_geo_fit(uuid,uuid) security invoker;
revoke all on function public.kb_marketplace_geo_fit(uuid,uuid) from public,anon,authenticated;
grant execute on function public.kb_marketplace_geo_fit(uuid,uuid) to service_role;
