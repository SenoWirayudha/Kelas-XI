alter table external_images
  add column if not exists embedding jsonb;

create index if not exists external_images_embedding_idx
  on external_images using gin (embedding);
