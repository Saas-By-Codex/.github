import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLoggedInSupabaseUser } from '@/lib/auth';

export default async function BillingPage() {
  const user = await getLoggedInSupabaseUser();
  if (!user) {
    redirect('/login?next=/dashboard/billing');
  }

  const checkoutUrl = process.env.NEXT_PUBLIC_STRIPE_PRO_CHECKOUT_URL;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Card>
        <CardHeader>
          <CardTitle>Upgrade to Pro</CardTitle>
          <CardDescription>Unlock unlimited recoveries for $29/mo.</CardDescription>
        </CardHeader>
        <CardContent>
          {checkoutUrl ? (
            <Button type="button">
              <Link href={checkoutUrl}>Continue to Stripe Checkout</Link>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Configure <code>NEXT_PUBLIC_STRIPE_PRO_CHECKOUT_URL</code> to connect existing Stripe subscription checkout.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
