create table if not exists public.user_stripe_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_key text not null,
  connected_at timestamptz not null default now(),
  last_synced timestamptz
);

alter table public.user_stripe_connections enable row level security;

create policy "Users can read their own Stripe connection"
on public.user_stripe_connections
for select
using (auth.uid() = user_id);

create policy "Service role can manage Stripe connections"
on public.user_stripe_connections
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
