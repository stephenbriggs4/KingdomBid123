-- #11 Reference survey idempotence: one response per token/reference, enforced under concurrency.
create unique index if not exists vendor_reference_responses_reference_id_unique
  on public.vendor_reference_responses(reference_id);
