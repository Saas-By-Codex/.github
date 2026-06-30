import { prisma, getDatabaseUrl } from "@/lib/db";

export interface DbStatus {
  ready: boolean;
  /** Which env var supplied the connection string, if any. */
  connectionVarFound: string | null;
  errorCode?: string;
  /** Sanitized — connection strings/credentials are redacted. */
  errorMessage?: string;
}

function sanitize(message: string): string {
  // Strip anything that looks like a connection string (scheme://...) so a
  // raw Prisma error never leaks credentials onto the /setup page.
  return message.replace(/[a-zA-Z][a-zA-Z0-9+.-]*:\/\/\S+/g, "[redacted]").slice(0, 400);
}

function whichVar(): string | null {
  if (process.env.DATABASE_URL) return "DATABASE_URL";
  if (process.env.POSTGRES_PRISMA_URL) return "POSTGRES_PRISMA_URL";
  if (process.env.POSTGRES_URL) return "POSTGRES_URL";
  return null;
}

/**
 * Diagnoses why the database isn't ready (no connection var vs. connected but
 * unmigrated vs. connection refused) so the /setup page can give a precise
 * next step instead of a generic "connect a database" message forever.
 */
export async function getDatabaseStatus(): Promise<DbStatus> {
  const connectionVarFound = whichVar();
  if (!connectionVarFound || !getDatabaseUrl()) {
    return { ready: false, connectionVarFound: null };
  }
  try {
    // Touch a real table so missing migrations are detected too.
    await prisma.user.count();
    return { ready: true, connectionVarFound };
  } catch (err) {
    const e = err as { code?: string; message?: string };
    return {
      ready: false,
      connectionVarFound,
      errorCode: e.code,
      errorMessage: e.message ? sanitize(e.message) : undefined,
    };
  }
}

/** Used to route visitors to /setup instead of crashing with a 500. */
export async function databaseReady(): Promise<boolean> {
  return (await getDatabaseStatus()).ready;
}
