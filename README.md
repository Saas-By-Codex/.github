# Stripe Failed Payments Recovery SaaS

## Current Boilerplate Structure (Initial Assessment)

This repository is currently a minimal scaffold with a single file:

- `README.md`

There is no initialized Next.js application, no `package.json`, and no existing source folders yet (such as `app/`, `components/`, `lib/`, `supabase/`, or `tests/`).

## Recommended Next Step

Initialize the project boilerplate in-place with the requested stack:

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase (Postgres + Auth)
- Stripe integration baseline

Then we can implement the first vertical slice:

1. Auth + Supabase client setup
2. Stripe connection flow
3. Failed-payment event ingestion
4. Smart dunning workflow basics
