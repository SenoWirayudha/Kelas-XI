-- ============================================================
-- Migration 027: Workspace Templates & Publishing
-- ============================================================

-- 1. New columns
alter table workspaces
  add column if not exists is_published boolean not null default false;

alter table workspaces
  add column if not exists is_template boolean not null default false;

alter table workspaces
  add column if not exists thumbnail_url text;

alter table workspaces
  add column if not exists source_template_id uuid
  references workspaces(id) on delete set null;

alter table workspaces
  add column if not exists share_token uuid unique default gen_random_uuid();

-- 2. Feed / discovery indexes
create index if not exists workspaces_published_feed_idx
  on workspaces (published_at desc)
  where is_published = true and deleted_at is null;

create index if not exists workspaces_template_idx
  on workspaces (published_at desc)
  where is_template = true and deleted_at is null;

-- 3. RLS (only applied when Supabase auth schema exists, e.g. production)
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'auth') then
    alter table workspaces enable row level security;

    drop policy if exists "Published workspaces are publicly readable" on workspaces;
    create policy "Published workspaces are publicly readable"
      on workspaces for select
      using (is_published = true);

    drop policy if exists "Workspaces owner-only insert" on workspaces;
    create policy "Workspaces owner-only insert"
      on workspaces for insert
      with check (owner_id = auth.uid());

    drop policy if exists "Workspaces owner-only update" on workspaces;
    create policy "Workspaces owner-only update"
      on workspaces for update
      using (owner_id = auth.uid());

    drop policy if exists "Workspaces owner-only delete" on workspaces;
    create policy "Workspaces owner-only delete"
      on workspaces for delete
      using (owner_id = auth.uid());
  end if;
end
$$;
