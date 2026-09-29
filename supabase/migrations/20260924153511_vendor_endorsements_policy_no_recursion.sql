drop policy if exists "Churches can submit pending endorsements" on public.vendor_endorsements;
create policy "Churches can submit pending endorsements" on public.vendor_endorsements
  for insert to authenticated
  with check (
    (select auth.uid()) = endorser_id
    and lower(coalesce(status, 'pending')) = 'pending'
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'church')
  );
create unique index if not exists vendor_endorsements_one_per_endorser_uidx
  on public.vendor_endorsements (vendor_id, endorser_id)
  where endorser_id is not null;
