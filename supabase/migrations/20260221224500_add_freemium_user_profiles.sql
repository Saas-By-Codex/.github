create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_tier text not null default 'free' check (plan_tier in ('free', 'pro')),
  recoveries_this_month integer not null default 0,
  recovery_month text not null default to_char(now(), 'YYYY-MM'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "Users can read their own profile"
on public.user_profiles
for select
using (auth.uid() = user_id);

create policy "Service role can manage user profiles"
on public.user_profiles
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
