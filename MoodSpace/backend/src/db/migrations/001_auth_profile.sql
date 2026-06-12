create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  username text not null,
  display_name text,
  role text not null default 'user',
  status text not null default 'active',
  email_verified_at timestamptz null,
  last_login_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_email_lower_idx on users (lower(email));
create unique index if not exists users_username_lower_idx on users (lower(username));
create index if not exists users_status_idx on users (status);

create table if not exists user_auth (
  user_id uuid primary key references users(id) on delete cascade,
  password_hash text not null,
  password_updated_at timestamptz not null default now(),
  failed_login_count int not null default 0,
  locked_until timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  refresh_token_hash text not null unique,
  device_name text null,
  ip_address inet null,
  user_agent text null,
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create index if not exists auth_sessions_user_active_idx
  on auth_sessions (user_id, expires_at)
  where revoked_at is null;

create unique index if not exists auth_sessions_refresh_hash_idx
  on auth_sessions (refresh_token_hash);

create table if not exists user_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  avatar_media_id uuid null,
  banner_media_id uuid null,
  bio text null,
  website_url text null,
  location text null,
  social_links jsonb not null default '{}'::jsonb,
  profile_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
