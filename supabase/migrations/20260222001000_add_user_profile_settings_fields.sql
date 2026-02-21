alter table public.user_profiles
  add column if not exists auto_retry_enabled boolean not null default true,
  add column if not exists retry_email_subject text,
  add column if not exists retry_email_body text,
  add column if not exists recovered_email_subject text,
  add column if not exists recovered_email_body text;
