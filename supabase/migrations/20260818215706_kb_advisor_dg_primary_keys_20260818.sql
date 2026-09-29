-- Preserve historical _dg working data and use its proven natural unique key.
ALTER TABLE public._dg_scratch
  ALTER COLUMN url_norm SET NOT NULL;
ALTER TABLE public._dg_scratch
  ADD CONSTRAINT _dg_scratch_pkey PRIMARY KEY (url_norm);

ALTER TABLE public._dg_final
  ALTER COLUMN url_norm SET NOT NULL;
ALTER TABLE public._dg_final
  ADD CONSTRAINT _dg_final_pkey PRIMARY KEY (url_norm);
