create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users(id) on delete cascade,
  workspace_id uuid null references workspaces(id) on delete set null,
  published_version_id uuid null references workspace_versions(id) on delete set null,
  post_type text not null default 'workspace',
  title text,
  caption text,
  cover_media_id uuid null references media_assets(id) on delete set null,
  visibility text not null default 'public',
  status text not null default 'published',
  save_count int not null default 0,
  view_count int not null default 0,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_home_feed_idx
  on posts (status, visibility, published_at desc, id desc);

create index if not exists posts_author_idx
  on posts (author_id, published_at desc);

create index if not exists posts_workspace_idx
  on posts (workspace_id);

create index if not exists posts_published_version_idx
  on posts (published_version_id);

create table if not exists post_saves (
  user_id uuid not null references users(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists post_saves_post_idx
  on post_saves (post_id, created_at desc);

create index if not exists post_saves_user_idx
  on post_saves (user_id, created_at desc);

create table if not exists follows (
  follower_id uuid not null references users(id) on delete cascade,
  following_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create index if not exists follows_following_idx
  on follows (following_id, created_at desc);

create index if not exists follows_follower_idx
  on follows (follower_id, created_at desc);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  actor_id uuid null references users(id) on delete set null,
  type text not null,
  target_type text not null,
  target_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists notifications_unread_idx
  on notifications (user_id, created_at desc)
  where read_at is null;

create index if not exists notifications_user_idx
  on notifications (user_id, created_at desc);
