-- Add polymorphic target support to reports table
alter table reports
  add column if not exists target_type text not null default 'post',
  add column if not exists comment_id uuid null references comments(id) on delete cascade,
  add column if not exists reported_user_id uuid null references users(id) on delete cascade;

-- Add soft-delete support to comments table
alter table comments
  add column if not exists status text not null default 'active',
  add column if not exists banned_at timestamptz null,
  add column if not exists banned_by uuid null references users(id) on delete set null;

-- Add constraint to ensure exactly one target is set per target_type
create or replace function check_report_target() returns trigger as $$
begin
  if new.target_type = 'post' and new.post_id is null then
    raise exception 'post_id is required for target_type=post';
  end if;
  if new.target_type = 'comment' and new.comment_id is null then
    raise exception 'comment_id is required for target_type=comment';
  end if;
  if new.target_type = 'user' and new.reported_user_id is null then
    raise exception 'reported_user_id is required for target_type=user';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists check_report_target_trigger on reports;
create trigger check_report_target_trigger
  before insert or update on reports
  for each row execute function check_report_target();
