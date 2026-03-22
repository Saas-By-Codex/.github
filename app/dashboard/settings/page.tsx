import Link from 'next/link';
import { redirect } from 'next/navigation';
import { updateSettingsAction } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getLoggedInSupabaseUser } from '@/lib/auth';
import { getOrCreateUserProfile } from '@/lib/supabase';

interface SettingsPageProps {
  searchParams: Promise<{ saved?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const user = await getLoggedInSupabaseUser();
  if (!user) {
    redirect('/login?next=/dashboard/settings');
  }

  const profile = await getOrCreateUserProfile(user.id);
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-4xl p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Recovery settings</h1>
          <p className="text-muted-foreground">Control retries and customize customer emails.</p>
        </div>
        <Link className="text-primary underline" href="/dashboard">
          Back to dashboard
        </Link>
      </div>

      {params.saved === '1' && (
        <div className="rounded-md border border-green-600/40 bg-green-500/10 px-4 py-3 text-sm">Settings saved successfully.</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Automation</CardTitle>
          <CardDescription>Enable or disable automatic smart retries.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateSettingsAction} className="space-y-6">
            <label className="flex items-center gap-3 text-sm">
              <input defaultChecked={profile.auto_retry_enabled} name="autoRetryEnabled" type="checkbox" />
              Enable hourly auto-retry dunning job
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="retryEmailSubject">Retry email subject</Label>
                <Input
                  defaultValue={profile.retry_email_subject ?? '⚠️ Payment retry attempted for {{invoice_id}}'}
                  id="retryEmailSubject"
                  name="retryEmailSubject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recoveredEmailSubject">Recovered email subject</Label>
                <Input
                  defaultValue={profile.recovered_email_subject ?? '✅ Payment recovered: {{invoice_id}}'}
                  id="recoveredEmailSubject"
                  name="recoveredEmailSubject"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="retryEmailBody">Retry email HTML</Label>
                <textarea
                  className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={
                    profile.retry_email_body ??
                    '<p>We retried invoice <strong>{{invoice_id}}</strong> for <strong>{{amount}}</strong>.</p><p>Currency: {{currency}}</p>'
                  }
                  id="retryEmailBody"
                  name="retryEmailBody"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recoveredEmailBody">Recovered email HTML</Label>
                <textarea
                  className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={
                    profile.recovered_email_body ??
                    '<p>Great news — invoice <strong>{{invoice_id}}</strong> was recovered for <strong>{{amount}}</strong>.</p><p>Currency: {{currency}}</p>'
                  }
                  id="recoveredEmailBody"
                  name="recoveredEmailBody"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">Available placeholders: {'{{invoice_id}}'}, {'{{amount}}'}, {'{{currency}}'}.</p>

            <Button type="submit">Save settings</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
