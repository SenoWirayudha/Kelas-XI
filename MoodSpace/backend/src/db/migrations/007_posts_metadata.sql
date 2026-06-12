alter table posts
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists posts_metadata_gin_idx
  on posts using gin (metadata);
