create table if not exists workspace_invite_links (
  id           uuid not null primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  token        text not null unique,
  role         text not null default 'view' check (role in ('view', 'edit')),
  created_by   uuid not null references users(id),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz,
  revoked_at   timestamptz,
  deleted_at   timestamptz
);

create index if not exists idx_workspace_invite_links_workspace
  on workspace_invite_links(workspace_id);