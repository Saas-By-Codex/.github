'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { encryptStripeKey } from '@/lib/encryption';
import { getLoggedInSupabaseUser } from '@/lib/auth';
import { upsertUserStripeConnection } from '@/lib/supabase';

function validateRestrictedKey(key: string): boolean {
  return /^rk_(live|test)_[A-Za-z0-9]+$/.test(key);
}

export async function connectStripeKeyAction(formData: FormData): Promise<void> {
  const user = await getLoggedInSupabaseUser();

  if (!user) {
    redirect('/login?next=/dashboard/connect-stripe');
  }

  const rawKey = formData.get('stripeRestrictedKey');
  if (typeof rawKey !== 'string' || rawKey.trim().length === 0) {
    redirect('/dashboard/connect-stripe?error=missing');
  }

  const trimmedKey = rawKey.trim();
  if (!validateRestrictedKey(trimmedKey)) {
    redirect('/dashboard/connect-stripe?error=invalid');
  }

  const encryptedKey = encryptStripeKey(trimmedKey);

  await upsertUserStripeConnection({
    user_id: user.id,
    encrypted_key: encryptedKey,
    connected_at: new Date().toISOString(),
    last_synced: null
  });

  revalidatePath('/dashboard/connect-stripe');
  redirect('/dashboard/connect-stripe?success=1');
}
