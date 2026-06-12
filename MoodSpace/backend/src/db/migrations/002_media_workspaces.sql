create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid null references users(id) on delete set null,
  source_type text not null default 'upload',
  storage_provider text not null default 's3',
  bucket text null,
  object_key text null,
  public_url text null,
  mime_type text,
  width int null,
  height int null,
  size_bytes bigint null,
  upload_status text not null default 'pending',
  blurhash text null,
  dominant_color text null,
  checksum text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index if not exists media_assets_owner_idx
  on media_assets (owner_id, created_at desc)
  where deleted_at is null;

create index if not exists media_assets_source_idx
  on media_assets (source_type, created_at desc)
  where deleted_at is null;

create index if not exists media_assets_object_key_idx
  on media_assets (bucket, object_key)
  where deleted_at is null;

create table if not exists uploaded_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  media_id uuid not null references media_assets(id) on delete cascade,
  title text null,
  description text null,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists uploaded_assets_user_idx
  on uploaded_assets (user_id, created_at desc);

create unique index if not exists uploaded_assets_user_media_idx
  on uploaded_assets (user_id, media_id);

alter table user_profiles
  add constraint user_profiles_avatar_media_fk
  foreign key (avatar_media_id) references media_assets(id) on delete set null;

alter table user_profiles
  add constraint user_profiles_banner_media_fk
  foreign key (banner_media_id) references media_assets(id) on delete set null;

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text null,
  visibility text not null default 'private',
  status text not null default 'draft',
  canvas_width int not null,
  canvas_height int not null,
  canvas_ratio text null,
  background jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  thumbnail_media_id uuid null references media_assets(id) on delete set null,
  current_version_id uuid null,
  latest_autosave_version_id uuid null,
  published_version_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz null,
  deleted_at timestamptz null
);

create index if not exists workspaces_owner_updated_idx
  on workspaces (owner_id, updated_at desc)
  where deleted_at is null;

create index if not exists workspaces_public_idx
  on workspaces (visibility, status, published_at desc)
  where deleted_at is null;

create table if not exists workspace_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  version_no int not null,
  save_type text not null,
  snapshot jsonb not null,
  snapshot_hash text null,
  created_by uuid null references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists workspace_versions_no_idx
  on workspace_versions (workspace_id, version_no);

create index if not exists workspace_versions_workspace_created_idx
  on workspace_versions (workspace_id, created_at desc);

create index if not exists workspace_versions_hash_idx
  on workspace_versions (workspace_id, snapshot_hash);

create index if not exists workspace_versions_snapshot_gin_idx
  on workspace_versions using gin (snapshot jsonb_path_ops);

alter table workspaces
  add constraint workspaces_current_version_fk
  foreign key (current_version_id) references workspace_versions(id) on delete set null;

alter table workspaces
  add constraint workspaces_latest_autosave_version_fk
  foreign key (latest_autosave_version_id) references workspace_versions(id) on delete set null;

alter table workspaces
  add constraint workspaces_published_version_fk
  foreign key (published_version_id) references workspace_versions(id) on delete set null;

create table if not exists workspace_activity (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid null references users(id) on delete set null,
  activity_type text not null,
  version_id uuid null references workspace_versions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists workspace_activity_workspace_idx
  on workspace_activity (workspace_id, created_at desc);
