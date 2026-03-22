'use client';

import { Button } from '@/components/ui/button';

interface UpgradeModalProps {
  open: boolean;
  checkoutUrl: string;
}

export function UpgradeModal({ open, checkoutUrl }: UpgradeModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-background p-8 shadow-2xl border">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Free plan limit reached</p>
        <h2 className="mt-2 text-3xl font-bold">Upgrade to Pro — $29/mo</h2>
        <p className="mt-3 text-muted-foreground text-lg">
          You reached 50 recovered payments this month. Upgrade now to continue automatic recoveries with no cap.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Unlimited monthly recoveries</li>
          <li>Priority retry processing</li>
          <li>Advanced dunning insights</li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="button" onClick={() => (window.location.href = checkoutUrl)}>
            Upgrade to Pro
          </Button>
          <Button type="button" variant="outline" onClick={() => (window.location.href = '/dashboard/connect-stripe')}>
            Manage Stripe connection
          </Button>
        </div>
      </div>
    </div>
  );
}
