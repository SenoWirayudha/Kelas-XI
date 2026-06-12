create table if not exists user_interest_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  event_type text not null check (event_type in ('save_post', 'add_to_board', 'drop_to_canvas', 'search', 'open_post')),
  tags text[] not null default '{}',
  query text,
  project_id uuid references workspaces(id) on delete set null,
  weight numeric not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists user_interest_events_user_time_idx
  on user_interest_events (user_id, created_at desc);

create index if not exists user_interest_events_tags_idx
  on user_interest_events using gin (tags);

create index if not exists user_interest_events_project_time_idx
  on user_interest_events (project_id, created_at desc)
  where project_id is not null;
