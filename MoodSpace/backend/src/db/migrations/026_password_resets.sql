create table if not exists password_resets (
  id serial primary key,
  user_id uuid not null references users(id) on delete cascade,
  purpose text not null check (purpose in ('reset', 'change')),
  token_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_password_resets_user_purpose on password_resets(user_id, purpose);
