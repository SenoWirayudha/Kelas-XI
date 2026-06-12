alter table reports
  add column if not exists resolved_at timestamptz null,
  add column if not exists resolved_by uuid null references users(id) on delete set null,
  add column if not exists resolution text null;

create index if not exists reports_resolved_idx on reports (resolved_at nulls first, created_at desc);
