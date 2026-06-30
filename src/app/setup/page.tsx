import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Shown when the app is deployed but the database isn't configured yet.
 * Pure static content — never touches the DB — so it always renders.
 */
export default function SetupPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16">
      <div className="flex items-center gap-2">
        <span className="text-2xl">⚡</span>
        <span className="text-lg font-semibold">EVFleetIQ</span>
      </div>

      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h1 className="text-xl font-semibold text-amber-900">Almost there — connect a database</h1>
        <p className="mt-2 text-sm text-amber-800">
          The app deployed successfully, but it needs a PostgreSQL database before
          you can log in. This takes about two minutes.
        </p>
      </div>

      <ol className="mt-8 space-y-6">
        <Step n={1} title="Add a Postgres database">
          In Vercel, open your project → <strong>Storage</strong> → <strong>Create Database</strong> →
          <strong> Postgres</strong> (or add the <em>Neon</em> / <em>Supabase</em> integration). Vercel
          sets <code className="rounded bg-slate-100 px-1">DATABASE_URL</code> for you automatically.
        </Step>
        <Step n={2} title="Add the remaining environment variables">
          Project → <strong>Settings</strong> → <strong>Environment Variables</strong> (Production):
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li><code className="rounded bg-slate-100 px-1">AUTH_SECRET</code> — run <code>openssl rand -base64 32</code></li>
            <li><code className="rounded bg-slate-100 px-1">TOKEN_ENCRYPTION_KEY</code> — run <code>openssl rand -hex 32</code></li>
            <li><code className="rounded bg-slate-100 px-1">NEXTAUTH_URL</code> — your deployment URL</li>
            <li><code className="rounded bg-slate-100 px-1">DEMO_MODE</code> = <code>true</code></li>
          </ul>
        </Step>
        <Step n={3} title="Create the tables">
          Locally, with that <code className="rounded bg-slate-100 px-1">DATABASE_URL</code> in your
          <code> .env</code>, run <code className="rounded bg-slate-100 px-1">npm run prisma:deploy</code>
          {" "}then <code className="rounded bg-slate-100 px-1">npm run db:seed</code> for a demo fleet.
        </Step>
        <Step n={4} title="Redeploy">
          Trigger a redeploy in Vercel so it picks up the new variables. Then reload — you&apos;ll land
          on the dashboard.
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
