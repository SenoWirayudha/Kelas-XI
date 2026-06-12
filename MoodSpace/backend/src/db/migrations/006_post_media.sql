create table if not exists post_media (
  post_id uuid not null references posts(id) on delete cascade,
  media_id uuid not null references media_assets(id) on delete cascade,
  position int not null,
  created_at timestamptz not null default now(),
  primary key (post_id, media_id),
  constraint post_media_position_nonnegative check (position >= 0)
);

create unique index if not exists post_media_post_position_idx
  on post_media (post_id, position);

insert into post_media (post_id, media_id, position)
select id, cover_media_id, 0
from posts
where cover_media_id is not null
on conflict do nothing;
