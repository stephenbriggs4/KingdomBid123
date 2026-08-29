-- Keep the canonical split_part-based owner policies and remove equivalent
-- legacy foldername-based INSERT/UPDATE policies.
drop policy if exists "vendor assets upload own photos" on storage.objects;
drop policy if exists "vendor assets update own photos" on storage.objects;
