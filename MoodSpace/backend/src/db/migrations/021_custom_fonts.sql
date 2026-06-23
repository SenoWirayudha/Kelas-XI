create table if not exists custom_fonts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  family text not null,
  storage_key text not null,
  url text not null,
  mime_type text not null,
  size_bytes int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists custom_fonts_user_idx
  on custom_fonts (user_id, created_at desc);
