import { prisma, getDatabaseUrl } from "@/lib/db";

/**
 * Returns true when the database is reachable AND the schema is present.
 * Used to route visitors to a friendly /setup page instead of crashing with a
 * 500 when a fresh deploy has no database or hasn't been migrated yet.
 */
export async function databaseReady(): Promise<boolean> {
  if (!getDatabaseUrl()) return false;
  try {
    // Touch a real table so missing migrations are detected too.
    await prisma.user.count();
    return true;
  } catch {
    return false;
  }
}
