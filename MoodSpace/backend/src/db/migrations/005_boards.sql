create table if not exists boards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  name text not null,
  description text null,
  categories jsonb not null default '[]'::jsonb,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists boards_owner_updated_idx
  on boards (owner_id, updated_at desc);

create table if not exists board_items (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards(id) on delete cascade,
  post_id uuid null references posts(id) on delete cascade,
  media_asset_id uuid null references media_assets(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint board_items_single_source check (num_nonnulls(post_id, media_asset_id) = 1)
);

create unique index if not exists board_items_board_post_idx
  on board_items (board_id, post_id)
  where post_id is not null;

create unique index if not exists board_items_board_media_idx
  on board_items (board_id, media_asset_id)
  where media_asset_id is not null;

create index if not exists board_items_board_created_idx
  on board_items (board_id, created_at desc);
