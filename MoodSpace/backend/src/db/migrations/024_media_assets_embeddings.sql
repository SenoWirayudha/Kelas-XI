alter table media_assets
  add column if not exists embedding jsonb,
  add column if not exists ocr_text text;
