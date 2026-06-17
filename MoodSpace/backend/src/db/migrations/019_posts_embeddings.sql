alter table posts
  add column if not exists embedding jsonb;

create index if not exists posts_embedding_idx
  on posts using gin (embedding);
