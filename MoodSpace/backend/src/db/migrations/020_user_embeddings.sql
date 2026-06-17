create table if not exists user_embeddings (
  user_id      uuid primary key references users(id) on delete cascade,
  embedding    jsonb not null,
  momentum     float not null default 0.9,
  total_weight float not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
