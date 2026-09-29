create unique index if not exists reviews_project_reviewer_uniq
on public.reviews(project_id, reviewer_id)
where project_id is not null and reviewer_id is not null;
