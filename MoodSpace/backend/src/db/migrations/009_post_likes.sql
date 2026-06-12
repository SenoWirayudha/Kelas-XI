alter table posts
  add column if not exists like_count int not null default 0;

create table if not exists post_likes (
  user_id uuid not null references users(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists post_likes_post_idx
  on post_likes (post_id, created_at desc);

create index if not exists post_likes_user_idx
  on post_likes (user_id, created_at desc);
