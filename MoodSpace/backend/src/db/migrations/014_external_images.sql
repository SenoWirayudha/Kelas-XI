create table if not exists external_images (
  id text primary key,
  provider text not null,
  external_id text not null,
  title text,
  description text,
  tags jsonb not null default '[]'::jsonb,
  url text not null,
  thumbnail_url text,
  width int,
  height int,
  mime_type text,
  author text,
  license text,
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_id)
);

create table if not exists external_image_saves (
  user_id uuid not null references users(id) on delete cascade,
  external_image_id text not null references external_images(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, external_image_id)
);

create index if not exists external_image_saves_user_idx
  on external_image_saves (user_id, created_at desc);

alter table board_items
  add column if not exists external_image_id text null references external_images(id) on delete cascade;

alter table board_items
  drop constraint if exists board_items_single_source;

alter table board_items
  add constraint board_items_single_source check (num_nonnulls(post_id, media_asset_id, external_image_id) = 1);

create unique index if not exists board_items_board_external_image_idx
  on board_items (board_id, external_image_id)
  where external_image_id is not null;
