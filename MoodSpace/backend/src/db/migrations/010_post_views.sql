alter table posts
  add column if not exists unique_view_count int not null default 0;

create table if not exists post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  viewer_id uuid not null references users(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists post_views_post_idx
  on post_views (post_id, viewed_at desc);

create index if not exists post_views_viewer_idx
  on post_views (viewer_id, viewed_at desc);

create index if not exists post_views_unique_viewer_idx
  on post_views (post_id, viewer_id);
