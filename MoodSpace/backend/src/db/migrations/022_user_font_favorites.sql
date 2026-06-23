create table if not exists user_font_favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references users(id) on delete cascade,
  font_family text not null,
  created_at timestamptz default now(),
  unique(user_id, font_family)
);

create index if not exists user_font_favorites_user_idx
  on user_font_favorites (user_id, font_family);
