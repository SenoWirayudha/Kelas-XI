create table if not exists workspace_collaborators (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id      uuid not null references users(id) on delete cascade,
  role         text not null default 'view' check (role in ('view', 'edit')),
  invited_by   uuid not null references users(id),
  invited_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists idx_workspace_collaborators_user
  on workspace_collaborators(user_id);
