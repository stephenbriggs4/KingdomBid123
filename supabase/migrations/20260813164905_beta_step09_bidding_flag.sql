insert into public.platform_settings (key, value, updated_at)
values ('bidding_enabled', 'false', now())
on conflict (key) do update
set value = 'false',
    updated_at = now();
