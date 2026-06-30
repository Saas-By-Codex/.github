# Deployment

## Prerequisites

- A managed PostgreSQL database (Neon, Supabase, Railway, or AWS RDS).
- A Vercel account (or any Node host that runs Next.js 14).
- Optional: a Stripe account for billing, a Mapbox token for maps.

## 1. Provision the database

Create a PostgreSQL instance and copy its connection string. It becomes
`DATABASE_URL`. Ensure SSL is enabled for production (append `?sslmode=require`
if your provider needs it).

## 2. Configure environment variables

In Vercel → Project → Settings → Environment Variables, add everything in
`.env.example` for the **Production** (and Preview) scope. At minimum:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | managed Postgres URL |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | your production URL, e.g. `https://app.example.com` |
| `TOKEN_ENCRYPTION_KEY` | `openssl rand -hex 32` (keep stable — rotating it invalidates stored tokens) |
| `DEMO_MODE` | `true` to keep simulated data; `false` for real integrations |

## 3. Run migrations

Apply the schema to the production database:

```bash
# locally, pointed at the prod DATABASE_URL, or as a CI/deploy step
npm run prisma:deploy
```

`npm run build` also runs `prisma generate` so the client is available at
runtime.

## 4. Deploy

Push to the connected branch (or `vercel deploy --prod`). Vercel builds with
`npm run build` and serves `next start`.

## 5. (Optional) Seed a demo tenant

```bash
npm run db:seed   # creates owner@demo.evfleetiq.com / demo12345 + sample fleet
```

## 6. (Optional) Enable Stripe billing

1. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the
   `STRIPE_PRICE_*` variables (one per plan).
2. In the Stripe dashboard, add a webhook endpoint pointing at
   `https://<your-domain>/api/billing/webhook` for the events
   `checkout.session.completed` and `customer.subscription.deleted`.
3. `POST /api/billing/checkout` returns a hosted Checkout URL for the chosen plan.

## 7. Verify

- `GET /api/health` → `{ "status": "ok" }`.
- Sign up, complete onboarding, load demo data, and confirm dashboards render.

## Notes for production hardening

- Replace the in-memory rate limiter with a shared store (Upstash Redis) if you
  run multiple instances.
- Put the app behind your platform's WAF/DDoS protection.
- Rotate `AUTH_SECRET` and database credentials per your security policy
  (`TOKEN_ENCRYPTION_KEY` should remain stable or be rotated with a re-encryption
  migration).
