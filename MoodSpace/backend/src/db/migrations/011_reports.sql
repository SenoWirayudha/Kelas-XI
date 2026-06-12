create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  reporter_id uuid not null references users(id) on delete cascade,
  reason text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists reports_post_idx on reports (post_id);
create index if not exists reports_reporter_idx on reports (reporter_id);
