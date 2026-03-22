create table if not exists public.payment_recovery_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id text not null,
  invoice_status text not null check (invoice_status in ('failed', 'recovered')),
  amount_due integer not null,
  recovered_amount integer not null default 0,
  currency text not null default 'usd',
  retry_count integer not null default 0,
  next_retry_at timestamptz not null,
  customer_email text,
  last_error text,
  recovered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, invoice_id)
);

create index if not exists payment_recovery_cases_user_id_idx on public.payment_recovery_cases(user_id);
create index if not exists payment_recovery_cases_next_retry_at_idx on public.payment_recovery_cases(next_retry_at);

alter table public.payment_recovery_cases enable row level security;

create policy "Users can read their own recovery cases"
on public.payment_recovery_cases
for select
using (auth.uid() = user_id);

create policy "Service role can manage recovery cases"
on public.payment_recovery_cases
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
