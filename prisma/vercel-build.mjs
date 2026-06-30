// Runs during the Vercel build (before `next build`).
//
// If a Postgres database is connected, it creates/updates the tables directly
// from prisma/schema.prisma (`prisma db push`) and seeds the demo account — so
// you never have to run migrations from a terminal. If no database is
// configured yet, it skips quietly and the app shows the /setup page instead.
//
// Every failure here is non-fatal: the Next.js build still proceeds so the
// landing page deploys regardless.
import { execSync } from "node:child_process";

// Prefer a direct (non-pooled) connection for DDL; pooled URLs (pgbouncer)
// can choke on schema changes.
const directUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

function run(cmd) {
  execSync(cmd, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: directUrl },
  });
}

if (!directUrl) {
  console.log(
    "[vercel-build] No Postgres connection found — skipping DB setup. " +
      "Connect a Postgres database in Vercel → Storage; the app shows /setup until then.",
  );
} else {
  try {
    console.log("[vercel-build] Creating/updating tables (prisma db push)...");
    run("npx prisma db push --skip-generate --accept-data-loss");

    console.log("[vercel-build] Seeding demo account + fleet...");
    run("npx tsx prisma/seed.ts");

    console.log("[vercel-build] Database ready.");
  } catch (err) {
    console.error(
      "[vercel-build] DB setup did not complete (continuing build):",
      err?.message ?? err,
    );
  }
}
