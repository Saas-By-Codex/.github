import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-bold">Pricing</h1>
      <p className="mt-3 text-muted-foreground">Start free, then scale with Pro when recoveries grow.</p>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold">$0</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Up to 50 recovered payments / month</li>
              <li>Hourly retry automation</li>
              <li>Basic analytics dashboard</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-primary/50 shadow-sm">
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>For serious revenue recovery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold">$29/mo or 5% of recovered</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Unlimited monthly recoveries</li>
              <li>Advanced email customization</li>
              <li>Priority retry processing</li>
            </ul>
            <Link className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/dashboard/billing">
              Upgrade to Pro
            </Link>
          </CardContent>
        </Card>
      </section>

      <div className="mt-8 text-sm">
        <Link className="text-primary underline" href="/dashboard">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
