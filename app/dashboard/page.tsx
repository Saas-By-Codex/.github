import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UpgradeModal } from '@/components/upgrade-modal';
import { getLoggedInSupabaseUser } from '@/lib/auth';
import { getDashboardCases, getOrCreateUserProfile, type RecoveryCaseRow } from '@/lib/supabase';

const FREE_RECOVERY_LIMIT = 50;

function formatAmount(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(cents / 100);
}

function isInCurrentMonth(isoDate?: string): boolean {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  const now = new Date();

  return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth();
}

function getStats(cases: RecoveryCaseRow[]) {
  const failed = cases.filter((item) => item.invoice_status === 'failed').length;
  const recovered = cases.filter((item) => item.invoice_status === 'recovered').length;
  const recoveredThisMonth = cases
    .filter((item) => item.invoice_status === 'recovered' && isInCurrentMonth(item.updated_at))
    .reduce((sum, item) => sum + (item.recovered_amount ?? 0), 0);
  const recoveryRate = failed + recovered === 0 ? 0 : (recovered / (failed + recovered)) * 100;

  return { failed, recovered, recoveredThisMonth, recoveryRate };
}

export default async function DashboardPage() {
  const user = await getLoggedInSupabaseUser();
  if (!user) {
    redirect('/login?next=/dashboard');
  }

  const [recoveryCases, profile] = await Promise.all([getDashboardCases(user.id), getOrCreateUserProfile(user.id)]);
  const stats = getStats(recoveryCases);

  const freeLimitReached = profile.plan_tier === 'free' && profile.recoveries_this_month >= FREE_RECOVERY_LIMIT;
  const checkoutUrl = process.env.NEXT_PUBLIC_STRIPE_PRO_CHECKOUT_URL ?? '/dashboard/billing';

  return (
    <>
      <UpgradeModal open={freeLimitReached} checkoutUrl={checkoutUrl} />
      <main className="mx-auto max-w-6xl p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Recovery Dashboard</h1>
            <p className="text-muted-foreground mt-1">Monitor failed payment retries and recovered revenue.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard/connect-stripe" className="text-primary underline">
              Connect / Update Stripe key
            </Link>
            <Link href="/dashboard/settings" className="text-primary underline">
              Settings
            </Link>
            <Link href="/pricing" className="text-primary underline">
              Pricing
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total recovered this month</CardTitle>
              <CardDescription>Recovered revenue for the current month.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatAmount(stats.recoveredThisMonth)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recovery rate</CardTitle>
              <CardDescription>Recovered invoices over failed + recovered invoices.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stats.recoveryRate.toFixed(1)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan usage</CardTitle>
              <CardDescription>Free plan includes up to 50 recoveries / month.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {profile.recoveries_this_month} / {profile.plan_tier === 'free' ? '50' : '∞'}
              </p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Failed payment timeline</CardTitle>
            <CardDescription>Failed | Recovered | Amount | Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">Failed</th>
                    <th className="py-2">Recovered</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recoveryCases.map((item) => (
                    <tr key={item.invoice_id} className="border-b last:border-0">
                      <td className="py-2">{item.invoice_id}</td>
                      <td className="py-2">{item.invoice_status === 'recovered' ? item.invoice_id : '—'}</td>
                      <td className="py-2">{formatAmount(item.recovered_amount ?? item.amount_due, item.currency ?? 'usd')}</td>
                      <td className="py-2">
                        {item.invoice_status === 'recovered' ? <Badge>Recovered</Badge> : <Badge variant="secondary">Failed</Badge>}
                      </td>
                    </tr>
                  ))}
                  {recoveryCases.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        No failed payments yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
