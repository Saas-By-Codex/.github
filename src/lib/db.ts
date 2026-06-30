import { PrismaClient } from "@prisma/client";

/**
 * Resolve the database connection string from whichever env var the host
 * provides. Vercel's Neon integration sets DATABASE_URL; the classic Vercel
 * Postgres integration sets POSTGRES_PRISMA_URL / POSTGRES_URL. Supporting all
 * of them means the app works no matter which Postgres option is connected.
 */
export function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    undefined
  );
}

// Reuse the Prisma client across hot-reloads in development to avoid
// exhausting database connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const url = getDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Explicit datasourceUrl lets us fall back across the env vars above.
    ...(url ? { datasourceUrl: url } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
