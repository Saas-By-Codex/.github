# Architecture

## Stack

- **Framework**: Next.js 14 (App Router), TypeScript, React Server Components.
- **Styling**: Tailwind CSS with a small component layer (`globals.css`).
- **Data**: PostgreSQL via Prisma ORM.
- **Auth**: Auth.js (NextAuth v5), JWT sessions, Credentials provider (OAuth-ready).
- **Charts**: Recharts (client components).
- **Payments**: Stripe (optional, lazily initialized).
- **Hosting**: Vercel + managed PostgreSQL.

## Request lifecycle

### Pages (Server Components)

1. `src/middleware.ts` runs at the edge and redirects unauthenticated users away
   from protected prefixes by checking the Auth.js session cookie.
2. `src/app/(dashboard)/layout.tsx` resolves the session and active org context
   (`getActiveContext`). No org → redirect to onboarding.
3. Pages query the DB through `lib/metrics.ts` (always scoped by `organizationId`)
   and render server-side; interactive bits are small client components.

### API routes (Route Handlers)

Every handler is wrapped by `withApi` (`src/lib/api.ts`), which applies, in order:

1. **Rate limiting** — `lib/rate-limit.ts`, keyed by IP + route.
2. **Authentication** — resolves the user + active org via `getActiveContext`.
3. **Handler** — runs business logic; throws are normalized:
   - `ZodError` → 422, `ForbiddenError` → 403, unknown → 500.

Inside handlers we additionally call `assertCan(role, permission)` for RBAC and
`recordAudit(...)` for sensitive mutations.

## Multi-tenancy

There is no global data. Every domain model has an `organizationId` and every
query filters on it. A user's "active org" is currently their first membership
(`lib/session.ts`); swapping in an org-switcher only touches that one function.

## Integration layer

`src/integrations/types.ts` defines `VehicleIntegrationAdapter` — a **read-only**
contract (`verify`, `listVehicles`, `getTelemetry`). There is deliberately **no**
method to actuate the vehicle.

- `MockVehicleAdapter` implements the contract using the simulation engine.
- Per-brand adapters (`adapters.ts`) subclass it with brand metadata and the
  read-only OAuth scopes they would request.
- To go live: override the three methods to call the manufacturer's official API
  with the decrypted OAuth token. Nothing else in the app changes.

## Simulation engine

`lib/simulation.ts` produces plausible, seed-stable telemetry so the entire
product is demoable without any real vehicle connection. `lib/demo-data.ts`
composes it into a full fleet (vehicles, charging sessions, drivers, trips,
maintenance alerts).

## Analytics

Pure functions in `lib/calculators.ts` (charging cost, carbon savings, driver
score) keep the math testable and free of I/O. `lib/metrics.ts` aggregates DB
rows into dashboard-ready shapes.
