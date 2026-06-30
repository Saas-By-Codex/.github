# Security

EVFleetIQ is designed to be a **legal, authorized** fleet platform. This document
maps each security requirement to its implementation.

## Authorized access only

- Integrations are **read-only** by contract (`src/integrations/types.ts`). There
  is no API surface to unlock, start, stop charging, or otherwise control a
  vehicle. Adding any control feature in future requires (a) official
  manufacturer API support and (b) an explicit, audited authorization scope —
  and must never be inferred, bypassed, or reverse-engineered.
- Connecting a provider represents an explicit OAuth grant by the fleet owner.
  In demo mode no external calls are made at all.

## Secrets & tokens

- **Never stored in plain text.** Connected-account access/refresh tokens are
  encrypted with **AES-256-GCM** before persistence (`src/lib/crypto.ts`) using
  `TOKEN_ENCRYPTION_KEY`. Only ciphertext is stored; tokens are never returned to
  the client or written to logs/audit metadata.
- All secrets come from **environment variables** (`.env`, never committed —
  see `.gitignore`). `.env.example` documents every variable.
- Passwords are hashed with **bcrypt** (cost 12).

## Authorization (RBAC)

- Roles `OWNER > ADMIN > MANAGER > VIEWER` with a single source of truth in
  `src/lib/rbac.ts`. Permissions (`fleet:write`, `integration:manage`,
  `member:manage`, `billing:manage`, `audit:read`, `org:admin`) map to a minimum
  role.
- Enforced in API routes via `assertCan` and in server pages via `can`.
- Safety rule: the last `OWNER` cannot be demoted.

## Tenant isolation

- Every query is scoped by `organizationId`. Detail routes (e.g. a vehicle by id)
  additionally filter on the caller's org to prevent cross-tenant access.

## Input validation

- All external input is validated with **Zod** schemas (`src/lib/validation.ts`)
  before touching the database.

## Rate limiting

- `src/lib/rate-limit.ts` applies a fixed-window limit per IP + route via the
  `withApi` wrapper (default 60/min; sensitive routes lower). Exceeding returns
  HTTP 429. For multi-instance production, back it with a shared store
  (e.g. Upstash Redis) behind the same interface.

## Audit logging

- `recordAudit` writes an `AuditLog` row for sensitive actions: org creation,
  settings changes, vehicle create, integration connect/disconnect, member role
  changes, billing checkout. Metadata never contains secrets.

## Transport & headers

- Security headers (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`) are set in `next.config.mjs`.
- Stripe webhooks verify signatures before processing.

## Responsible disclosure

This is a demonstration MVP. Before connecting real vehicle data, review each
manufacturer's API terms, obtain explicit owner authorization, and complete a
security review of the deployment environment.
