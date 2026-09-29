-- FaithBid 0207: Public Organization Home read contract
-- Main project: knkwaphosqronbhrvlsu

create or replace function public.gpi_service_get_public_organization(
  p_organization_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'organization', jsonb_build_object(
      'id', organization.id,
      'name', organization.name,
      'description', organization.description,
      'verified', organization.status = 'verified',
      'public_opportunity_count', (
        select count(*)::integer
        from public.gpi_public_opportunities_internal opportunity
        where opportunity.organization_id = organization.id
      )
    ),
    'opportunities', coalesce((
      select jsonb_agg(to_jsonb(opportunity) order by opportunity.next_starts_at nulls last, opportunity.title)
      from public.gpi_public_opportunities_internal opportunity
      where opportunity.organization_id = organization.id
    ), '[]'::jsonb)
  )
  from public.gpi_organizations organization
  where organization.id = p_organization_id
    and organization.status = 'verified'
$function$;

revoke execute on function public.gpi_service_get_public_organization(uuid)
  from public, anon, authenticated;
grant execute on function public.gpi_service_get_public_organization(uuid)
  to service_role;
