alter table posts
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(caption, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(metadata->>'tags', '')), 'A')
  ) stored;

create index if not exists posts_search_vector_idx
  on posts using gin (search_vector);
