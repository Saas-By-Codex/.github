import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <section className="rounded-2xl border bg-gradient-to-br from-slate-50 to-blue-50 p-10 shadow-sm">
        <p className="text-sm font-medium text-primary">Stripe dunning automation</p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight">Recover lost revenue automatically</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Connect your Stripe account, let hourly smart retries run, and recover failed payments with customer-friendly email
          flows.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/dashboard/connect-stripe">
            Connect Stripe (Test Mode)
          </Link>
          <Link className="inline-flex h-10 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium" href="/pricing">
            View pricing
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold">Smart retry schedule</h3>
            <p className="mt-2 text-sm text-muted-foreground">Automatic retries at 1h, 4h, 24h, and 3d for failed invoices.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold">Encrypted Stripe keys</h3>
            <p className="mt-2 text-sm text-muted-foreground">Restricted keys are encrypted at rest and decrypted only during jobs.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold">Built for Stripe test mode</h3>
            <p className="mt-2 text-sm text-muted-foreground">Default cron behavior processes `rk_test_` keys unless `STRIPE_MODE=live`.</p>
          </CardContent>
        </Card>
      </section>

      <div className="mt-8 text-sm">
        <Link className="text-primary underline" href="/dashboard">
          Open dashboard
        </Link>
      </div>
    </main>
  );
}
