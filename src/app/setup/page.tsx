import Link from "next/link";
import { getDatabaseStatus } from "@/lib/db-check";

export const dynamic = "force-dynamic";

/**
 * Shown when the app is deployed but the database isn't ready yet. Runs a
 * live diagnostic (instead of a static checklist) so the page tells you
 * exactly which step is blocking — no DB connection found, vs. connected but
 * tables missing, vs. a connection error.
 */
export default async function SetupPage() {
  const status = await getDatabaseStatus();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16">
      <div className="flex items-center gap-2">
        <span className="text-2xl">⚡</span>
        <span className="text-lg font-semibold">EVFleetIQ</span>
      </div>

      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h1 className="text-xl font-semibold text-amber-900">Almost there — connect a database</h1>
        <p className="mt-2 text-sm text-amber-800">
          The app deployed successfully, but it needs a working PostgreSQL database before
          you can log in.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Live diagnosis</h2>

        {!status.connectionVarFound ? (
          <div className="mt-2 text-sm text-slate-600">
            <p>
              ❌ <strong>No database connection found.</strong> I checked{" "}
              <code className="rounded bg-slate-100 px-1">DATABASE_URL</code>,{" "}
              <code className="rounded bg-slate-100 px-1">POSTGRES_PRISMA_URL</code>, and{" "}
              <code className="rounded bg-slate-100 px-1">POSTGRES_URL</code> — none are set on this
              deployment.
            </p>
            <p className="mt-2">
              Make sure you created a <strong>Postgres</strong> database (Storage → Create Database →
              Postgres — <em>not</em> Edge Config), that it&apos;s connected to <strong>this</strong>{" "}
              project, that the var is enabled for the <strong>Production</strong> environment, and that
              you redeployed <em>after</em> connecting it.
            </p>
          </div>
        ) : status.ready ? (
          <p className="mt-2 text-sm text-brand-700">
            ✅ Connected via <code className="rounded bg-slate-100 px-1">{status.connectionVarFound}</code>{" "}
            and tables look present. If you&apos;re still seeing this page, try reloading.
          </p>
        ) : (
          <div className="mt-2 text-sm text-slate-600">
            <p>
              ⚠️ Found a connection string in{" "}
              <code className="rounded bg-slate-100 px-1">{status.connectionVarFound}</code>, but the
              database query failed{status.errorCode ? ` (code ${status.errorCode})` : ""}.
            </p>
            {status.errorMessage && (
              <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                {status.errorMessage}
              </pre>
            )}
            <p className="mt-2">
              This usually means the tables haven&apos;t been created yet. Open{" "}
              <strong>Deployments → latest → Logs</strong> in Vercel and look for lines starting with{" "}
              <code className="rounded bg-slate-100 px-1">[vercel-build]</code> — they say whether table
              creation succeeded or why it didn&apos;t.
            </p>
          </div>
        )}
      </div>

      <ol className="mt-8 space-y-6">
        <Step n={1} title="Add a Postgres database">
          In Vercel, open your project → <strong>Storage</strong> → <strong>Create Database</strong> →
          <strong> Postgres</strong>, and connect it to this project for the{" "}
          <strong>Production</strong> environment.
        </Step>
        <Step n={2} title="Add the remaining environment variables">
          Project → <strong>Settings</strong> → <strong>Environment Variables</strong> (Production):
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li><code className="rounded bg-slate-100 px-1">AUTH_SECRET</code></li>
            <li><code className="rounded bg-slate-100 px-1">TOKEN_ENCRYPTION_KEY</code></li>
            <li><code className="rounded bg-slate-100 px-1">DEMO_MODE</code> = <code>true</code></li>
          </ul>
        </Step>
        <Step n={3} title="Redeploy">
          Tables and demo data are created automatically during the build — just redeploy after the
          database and env vars are in place, then reload this page.
        </Step>
      </ol>

      <div className="mt-10 flex gap-3">
        <Link href="/" className="btn-secondary">Back to landing</Link>
        <Link href="/login" className="btn-primary">I&apos;ve set it up — log in</Link>
      </div>
    </main>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
        {n}
      </span>
      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <div className="mt-1 text-sm text-slate-600">{children}</div>
      </div>
    </li>
  );
}
