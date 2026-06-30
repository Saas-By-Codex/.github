# ⚡ EVFleetIQ

**A legal, authorized, multi-brand EV fleet monitoring & analytics SaaS for small and mid-sized businesses.**

EVFleetIQ unifies battery health, charging cost, maintenance, driver behaviour, range/location, and ESG reporting for an entire electric-vehicle fleet in one B2B dashboard.

> **Safety & legality first.** EVFleetIQ only reads data from **official manufacturer APIs**, **approved telematics providers**, or **simulated demo data**. It does **not** hack, bypass, reverse-engineer, gain unauthorized access, or send unsafe vehicle-control commands. The integration layer is intentionally **read-only**.

---

## 1. Product overview

| Module | What it does |
| --- | --- |
| Auth & team accounts | Email/password auth (Auth.js), multi-tenant organizations |
| Role-based access control | `OWNER > ADMIN > MANAGER > VIEWER`, enforced everywhere |
| Company / fleet management | Organizations own all data; onboarding flow |
| Vehicle profiles | Make/model/provider/battery/range, per-vehicle detail |
| Authorized API integrations | Clean adapter interface per brand (mock in MVP) |
| Simulated EV data mode | Default; realistic telemetry without real vehicles |
| Battery status dashboard | State of charge across the fleet |
| Charging status & history | Sessions, history, daily cost & energy charts |
| Range & location | Range tracking + location where authorized |
| Maintenance alerts | Rule-derived alerts with acknowledge/resolve |
| Driver behaviour analytics | 0–100 safety/efficiency scores from trips |
| Charging cost calculator | Per-session cost from org electricity price |
| Carbon / ESG report | CO₂ saved vs. combustion, trees & fuel equivalents |
| Audit logs | Every sensitive action recorded |
| Admin dashboard | Team/role management + audit trail |
| Subscription billing | Stripe-ready data model + checkout/webhook routes |

**Demo login** (after seeding): `owner@demo.evfleetiq.com` / `demo12345`

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js 14 (App Router) — Vercel                              │
│                                                                │
│  Server Components ──▶ lib/metrics, lib/session (RBAC)         │
│  Client Components ──▶ Recharts dashboards, forms              │
│                                                                │
│  /api/* Route Handlers ──▶ withApi() wrapper                   │
│     • rate limiting   • auth + org context   • Zod validation  │
│     • RBAC checks     • audit logging                          │
│                                                                │
│  Integration adapters (read-only)                              │
│     Tesla · Ford · Hyundai · Kia · BMW · Smartcar · Simulated  │
│     └─ demo mode → simulation engine (no external calls)       │
└───────────────┬────────────────────────────────────────┬──────┘
                │ Prisma                                   │ Stripe
        ┌───────▼─────────┐                        ┌───────▼───────┐
        │  PostgreSQL     │                        │  Billing      │
        │  (multi-tenant) │                        │  (optional)   │
        └─────────────────┘                        └───────────────┘
```

Key design decisions:

- **Multi-tenancy** — every domain row carries an `organizationId`; all queries are scoped to the caller's active org.
- **Defense in depth** — edge middleware (cookie check) → server layout guard → per-route `withApi` (rate limit + auth + RBAC + validation).
- **Read-only integrations** — the `VehicleIntegrationAdapter` interface exposes *no* control surface. Adding control later requires official API support and an explicit audited scope.
- **Encrypted secrets** — connected-account tokens are AES-256-GCM encrypted (`lib/crypto.ts`); plaintext never hits the DB or logs.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/SECURITY.md`](docs/SECURITY.md).

---

## 3. Database schema

Defined in [`prisma/schema.prisma`](prisma/schema.prisma). Models:

`User`, `Organization`, `TeamMember` (+ `Role`), `Vehicle`, `VehicleTelemetry`,
`ChargingSession`, `MaintenanceAlert`, `Driver`, `DriverTrip`,
`IntegrationAccount` (encrypted tokens), `AuditLog`, `Subscription`,
plus Auth.js `Account` / `Session`.

---

## 4. File / folder structure

```
.
├── prisma/
│   ├── schema.prisma          # data model
│   └── seed.ts                # demo account + fleet seeder
├── src/
│   ├── app/
│   │   ├── page.tsx           # landing
│   │   ├── login, signup, onboarding
│   │   ├── (dashboard)/       # auth-guarded route group + sidebar/topbar
│   │   │   ├── dashboard, vehicles, vehicles/[id]
│   │   │   ├── charging, battery, maintenance
│   │   │   ├── drivers, esg, integrations, settings, admin
│   │   └── api/               # route handlers (vehicles, alerts,
│   │       │                  #  integrations, members, demo, billing, health)
│   ├── components/            # ui, charts, sidebar, topbar, client actions
│   ├── integrations/          # adapter interface + per-brand mock adapters
│   ├── lib/                   # db, auth, crypto, rbac, rate-limit, validation,
│   │                          #  audit, session, api, metrics, calculators,
│   │                          #  simulation, demo-data, stripe, utils
│   ├── types/                 # next-auth augmentation
│   └── middleware.ts          # edge route protection
├── .env.example
└── README.md
```

---

## 5. Step-by-step implementation plan

1. **Architecture & schema** — model the multi-tenant domain in Prisma.
2. **Infra libs** — db client, crypto, auth, RBAC, rate limiting, validation, audit.
3. **Integration layer** — read-only adapter interface + brand mock adapters + simulation engine.
4. **UI shell** — Tailwind theme, layout, sidebar/topbar, shared components, charts.
5. **Pages** — landing → auth → onboarding → dashboards.
6. **API routes** — wrap all in `withApi` (rate limit + auth + RBAC + validation + audit).
7. **Simulated data** — generator + in-app "Load demo data" + seed script.
8. **Security & audit** — encrypted tokens, role checks, audit logging, security headers.
9. **Billing-ready** — Stripe client, checkout + webhook routes, `Subscription` model.
10. **Docs & deploy** — env, setup, testing checklist, deployment guide.

---

## 6. Full code

All source lives in `src/` and `prisma/` (see structure above). Notable files:
`prisma/schema.prisma`, `src/lib/{auth,crypto,rbac,api,metrics,simulation,demo-data}.ts`,
`src/integrations/*`, and the pages under `src/app/`.

---

## 7. Environment variables

Copy `.env.example` → `.env` and fill in. Highlights:

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Auth.js signing secret (`openssl rand -base64 32`) |
| `TOKEN_ENCRYPTION_KEY` | 64 hex chars for token encryption (`openssl rand -hex 32`) |
| `DEMO_MODE` | `true` (default) serves simulated data, no external calls |
| `STRIPE_SECRET_KEY` etc. | Optional billing |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Optional maps |
| `*_CLIENT_ID/SECRET` | Future official OAuth integrations (blank in demo) |

---

## 8. Setup commands

```bash
# 1. install
npm install

# 2. configure env
cp .env.example .env
#   then set DATABASE_URL, AUTH_SECRET, TOKEN_ENCRYPTION_KEY
#   openssl rand -base64 32   # AUTH_SECRET
#   openssl rand -hex 32      # TOKEN_ENCRYPTION_KEY

# 3. database
npm run prisma:generate
npm run prisma:migrate -- --name init

# 4. seed demo account + fleet
npm run db:seed

# 5. run
npm run dev
# → http://localhost:3000  (login owner@demo.evfleetiq.com / demo12345)
```

---

## 9. Testing checklist

- [ ] `npm run typecheck` passes.
- [ ] Sign up → onboarding creates an org → lands on dashboard.
- [ ] Empty states show before data; "Load demo data" populates the fleet.
- [ ] Dashboard cards, charging/energy charts, ESG numbers render.
- [ ] Vehicles list + vehicle detail (battery trend, sessions, alerts).
- [ ] Battery health bars colour-code by SoH.
- [ ] Maintenance: acknowledge & resolve update status.
- [ ] Driver analytics scores render and rank.
- [ ] Integrations: connect/disconnect; token stored **encrypted** (check DB — ciphertext only).
- [ ] Settings: non-admin sees read-only; admin can save cost/carbon factors.
- [ ] Admin: audit log lists actions; role change blocked for last owner.
- [ ] RBAC: a `VIEWER` cannot hit write APIs (403).
- [ ] Rate limiting: hammering an endpoint returns 429.
- [ ] `GET /api/health` returns `ok`.

---

## 10. Deployment

Summarised here; full guide in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

1. **Database** — provision managed PostgreSQL (Neon, Supabase, RDS). Set `DATABASE_URL`.
2. **Vercel** — import the repo; add all env vars from `.env.example` (Production scope).
3. **Migrate** — run `npm run prisma:deploy` against the prod DB (CI step or one-off).
4. **Seed (optional)** — `npm run db:seed` for a demo tenant.
5. **Stripe (optional)** — set keys, configure `/api/billing/webhook` as a Stripe webhook endpoint.
6. **Verify** — hit `/api/health`, sign up, confirm dashboards.

---

## License & disclaimer

For demonstration / educational purposes. Carbon and cost figures are estimates,
not certified accounting. Always comply with each manufacturer's API terms and
applicable law before connecting real vehicle data.
