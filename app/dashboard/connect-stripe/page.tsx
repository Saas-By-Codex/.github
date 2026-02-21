import { CheckCircle2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { connectStripeKeyAction } from './actions';
import { getLoggedInSupabaseUser } from '@/lib/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PageProps {
  searchParams: Promise<{ success?: string; error?: string }>;
}

function getErrorMessage(errorCode?: string): string | null {
  if (errorCode === 'missing') return 'Please paste your Stripe restricted secret key.';
  if (errorCode === 'invalid') return 'Invalid key format. Expected key like rk_live_... or rk_test_...';
  return null;
}

export default async function ConnectStripePage({ searchParams }: PageProps) {
  const user = await getLoggedInSupabaseUser();
  if (!user) {
    redirect('/login?next=/dashboard/connect-stripe');
  }

  const params = await searchParams;
  const isConnected = params.success === '1';
  const errorMessage = getErrorMessage(params.error);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Connect Stripe</CardTitle>
              <CardDescription>Paste your Stripe Restricted Secret Key to enable payment recovery sync.</CardDescription>
            </div>
            {isConnected ? <Badge>Connected ✓</Badge> : <Badge variant="secondary">Not connected</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Stripe connected</AlertTitle>
              <AlertDescription>Your restricted key is encrypted and saved securely.</AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert className="border-red-500/40">
              <AlertTitle>Unable to connect</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form action={connectStripeKeyAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stripeRestrictedKey">Stripe Restricted Secret Key</Label>
              <Input
                id="stripeRestrictedKey"
                name="stripeRestrictedKey"
                type="password"
                required
                placeholder="rk_live_..."
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Use a restricted key with read/write access only for payments and invoices.
              </p>
            </div>
            <Button type="submit">Connect Stripe</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
