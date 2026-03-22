import { NextResponse } from 'next/server';
import { decryptStripeKey } from '@/lib/encryption';
import { sendRecoveryEmail } from '@/lib/email';
import {
  getDueRecoveryCases,
  getOrCreateUserProfile,
  getStripeConnections,
  touchConnectionLastSynced,
  updateUserProfileMonthlyCounter,
  upsertRecoveryCase,
  type RecoveryCaseRow
} from '@/lib/supabase';
import { listRecentFailedInvoices, retryInvoicePayment } from '@/lib/stripe';

const RETRY_DELAYS_MS = [60 * 60 * 1000, 4 * 60 * 60 * 1000, 24 * 60 * 60 * 1000, 3 * 24 * 60 * 60 * 1000];
const FREE_RECOVERY_LIMIT = 50;

function getNextRetryIso(retryCount: number): string {
  const delay = RETRY_DELAYS_MS[Math.min(retryCount, RETRY_DELAYS_MS.length - 1)];
  return new Date(Date.now() + delay).toISOString();
}

function hasValidCronSecret(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return true;
  }

  return request.headers.get('authorization') === `Bearer ${expected}`;
}

function getMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function canProcessStripeKey(stripeKey: string): boolean {
  const mode = process.env.STRIPE_MODE ?? 'test';
  if (mode === 'test') {
    return stripeKey.startsWith('rk_test_');
  }

  return true;
}

export async function GET(request: Request): Promise<NextResponse> {
  if (!hasValidCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const nowIso = new Date().toISOString();
  const createdGte = Math.floor(Date.now() / 1000) - 48 * 60 * 60;
  const monthKey = getMonthKey();
  const connections = await getStripeConnections();

  let syncedUsers = 0;
  let retriesAttempted = 0;
  let recoveredCount = 0;
  let limitedUsers = 0;
  let skippedByMode = 0;

  for (const connection of connections) {
    const profile = await getOrCreateUserProfile(connection.user_id);
    const isFreeLimited = profile.plan_tier === 'free' && profile.recoveries_this_month >= FREE_RECOVERY_LIMIT;

    if (!profile.auto_retry_enabled) {
      await touchConnectionLastSynced(connection.user_id, nowIso);
      syncedUsers += 1;
      continue;
    }

    if (isFreeLimited) {
      limitedUsers += 1;
      await touchConnectionLastSynced(connection.user_id, nowIso);
      syncedUsers += 1;
      continue;
    }

    const stripeKey = decryptStripeKey(connection.encrypted_key);

    if (!canProcessStripeKey(stripeKey)) {
      skippedByMode += 1;
      await touchConnectionLastSynced(connection.user_id, nowIso);
      syncedUsers += 1;
      continue;
    }

    const failedInvoices = await listRecentFailedInvoices(stripeKey, createdGte);
    for (const invoice of failedInvoices) {
      await upsertRecoveryCase({
        user_id: connection.user_id,
        invoice_id: invoice.id,
        invoice_status: 'failed',
        amount_due: invoice.amount_due,
        currency: invoice.currency,
        retry_count: 0,
        next_retry_at: nowIso,
        customer_email: invoice.customer_email ?? null,
        last_error: null,
        recovered_amount: 0,
        recovered_at: null
      });
    }

    const dueCases = await getDueRecoveryCases(connection.user_id, nowIso);
    let recoveredForUser = profile.recoveries_this_month;

    for (const recoveryCase of dueCases) {
      if (profile.plan_tier === 'free' && recoveredForUser >= FREE_RECOVERY_LIMIT) {
        break;
      }

      retriesAttempted += 1;

      try {
        const result = await retryInvoicePayment(stripeKey, recoveryCase.invoice_id);
        const recovered = result.paid || result.status === 'paid';

        const nextState: RecoveryCaseRow = {
          user_id: recoveryCase.user_id,
          invoice_id: recoveryCase.invoice_id,
          invoice_status: recovered ? 'recovered' : 'failed',
          amount_due: recoveryCase.amount_due,
          recovered_amount: recovered ? result.amount_paid : 0,
          currency: result.currency,
          retry_count: recovered ? recoveryCase.retry_count : recoveryCase.retry_count + 1,
          next_retry_at: recovered ? nowIso : getNextRetryIso(recoveryCase.retry_count + 1),
          customer_email: recoveryCase.customer_email,
          last_error: null,
          recovered_at: recovered ? nowIso : null
        };

        await upsertRecoveryCase(nextState);

        if (recoveryCase.customer_email) {
          await sendRecoveryEmail({
            to: recoveryCase.customer_email,
            invoiceId: recoveryCase.invoice_id,
            amount: recovered ? result.amount_paid : recoveryCase.amount_due,
            currency: result.currency,
            recovered,
            customSubject: recovered ? profile.recovered_email_subject : profile.retry_email_subject,
            customBody: recovered ? profile.recovered_email_body : profile.retry_email_body
          });
        }

        if (recovered) {
          recoveredCount += 1;
          recoveredForUser += 1;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown retry error';
        await upsertRecoveryCase({
          user_id: recoveryCase.user_id,
          invoice_id: recoveryCase.invoice_id,
          invoice_status: 'failed',
          amount_due: recoveryCase.amount_due,
          recovered_amount: 0,
          currency: recoveryCase.currency,
          retry_count: recoveryCase.retry_count + 1,
          next_retry_at: getNextRetryIso(recoveryCase.retry_count + 1),
          customer_email: recoveryCase.customer_email,
          last_error: errorMessage,
          recovered_at: null
        });
      }
    }

    if (recoveredForUser !== profile.recoveries_this_month || profile.recovery_month !== monthKey) {
      await updateUserProfileMonthlyCounter(connection.user_id, recoveredForUser, monthKey);
    }

    await touchConnectionLastSynced(connection.user_id, nowIso);
    syncedUsers += 1;
  }

  return NextResponse.json({ syncedUsers, retriesAttempted, recoveredCount, limitedUsers, skippedByMode });
}
