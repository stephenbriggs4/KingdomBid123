begin;

do $preflight$
declare
  extension_schema text;
  queued_requests bigint;
begin
  select n.nspname
  into extension_schema
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pg_net';

  if extension_schema is distinct from 'public' then
    raise exception 'C2 expected pg_net in public, found %', coalesce(extension_schema, 'not installed');
  end if;

  select count(*) into queued_requests from net.http_request_queue;
  if queued_requests <> 0 then
    raise exception 'C2 refused to relocate pg_net with % queued HTTP requests', queued_requests;
  end if;
end
$preflight$;

create temporary table pg_net_response_backup on commit drop as
select * from net._http_response;

drop extension pg_net;
create extension pg_net with schema extensions;

insert into net._http_response
  (id, status_code, content_type, headers, content, timed_out, error_msg, created)
select id, status_code, content_type, headers, content, timed_out, error_msg, created
from pg_net_response_backup;

do $verify$
declare
  backup_count bigint;
  restored_count bigint;
  extension_schema text;
begin
  select count(*) into backup_count from pg_net_response_backup;
  select count(*) into restored_count from net._http_response;
  select n.nspname
  into extension_schema
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pg_net';

  if extension_schema is distinct from 'extensions' then
    raise exception 'C2 pg_net relocation failed; extension schema is %', coalesce(extension_schema, 'missing');
  end if;

  if restored_count <> backup_count then
    raise exception 'C2 restored % of % pg_net response rows', restored_count, backup_count;
  end if;

  if to_regprocedure('net.http_get(text,jsonb,jsonb,integer)') is null
     or to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is null then
    raise exception 'C2 pg_net HTTP functions were not restored';
  end if;

  if not has_schema_privilege('service_role', 'net', 'usage')
     or not has_function_privilege('service_role', 'net.http_get(text,jsonb,jsonb,integer)', 'execute')
     or not has_function_privilege('service_role', 'net.http_post(text,jsonb,jsonb,jsonb,integer)', 'execute') then
    raise exception 'C2 pg_net service-role grants were not restored';
  end if;
end
$verify$;

commit;
