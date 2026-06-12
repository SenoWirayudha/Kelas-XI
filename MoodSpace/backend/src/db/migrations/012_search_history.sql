create table if not exists search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  query text not null,
  query_normalized text generated always as (lower(trim(query))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint search_history_query_not_empty check (length(trim(query)) > 0)
);

create unique index if not exists search_history_user_query_idx
  on search_history (user_id, query_normalized);

create index if not exists search_history_user_updated_idx
  on search_history (user_id, updated_at desc);
