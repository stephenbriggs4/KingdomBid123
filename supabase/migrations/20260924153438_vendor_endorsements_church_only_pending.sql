drop policy if exists "Authenticated can endorse vendors" on public.vendor_endorsements;
create policy "Churches can submit pending endorsements" on public.vendor_endorsements
  for insert to authenticated
  with check (
    (select auth.uid()) = endorser_id
    and lower(coalesce(status, 'pending')) = 'pending'
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'church')
    and not exists (
      select 1 from public.vendor_endorsements e
      where e.vendor_id = vendor_endorsements.vendor_id and e.endorser_id = (select auth.uid())
    )
  );
