alter table public.waitlist
  add constraint waitlist_state_code_valid check (
    state_code is null or state_code = any (array['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']::text[])
  ) not valid;
alter table public.waitlist validate constraint waitlist_state_code_valid;

alter table public.profiles
  add constraint profiles_state_code_valid check (
    state_code is null or state_code = any (array['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']::text[])
  ) not valid;
alter table public.profiles validate constraint profiles_state_code_valid;

alter table public.vendors
  add constraint vendors_service_state_valid check (
    service_state is null or service_state = any (array['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']::text[])
  ) not valid;
alter table public.vendors validate constraint vendors_service_state_valid;

alter table public.projects
  add constraint projects_project_state_valid check (
    project_state is null or project_state = any (array['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']::text[])
  ) not valid;
alter table public.projects validate constraint projects_project_state_valid;
