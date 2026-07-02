alter table posts
  add column if not exists text_embedding jsonb;

create index if not exists posts_text_embedding_idx
  on posts using gin (text_embedding);
