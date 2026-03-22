'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getLoggedInSupabaseUser } from '@/lib/auth';
import { updateUserSettings } from '@/lib/supabase';

export async function updateSettingsAction(formData: FormData): Promise<void> {
  const user = await getLoggedInSupabaseUser();
  if (!user) {
    redirect('/login?next=/dashboard/settings');
  }

  const autoRetryEnabled = formData.get('autoRetryEnabled') === 'on';
  const retryEmailSubject = String(formData.get('retryEmailSubject') ?? '').trim() || null;
  const retryEmailBody = String(formData.get('retryEmailBody') ?? '').trim() || null;
  const recoveredEmailSubject = String(formData.get('recoveredEmailSubject') ?? '').trim() || null;
  const recoveredEmailBody = String(formData.get('recoveredEmailBody') ?? '').trim() || null;

  await updateUserSettings(user.id, {
    auto_retry_enabled: autoRetryEnabled,
    retry_email_subject: retryEmailSubject,
    retry_email_body: retryEmailBody,
    recovered_email_subject: recoveredEmailSubject,
    recovered_email_body: recoveredEmailBody
  });

  revalidatePath('/dashboard/settings');
  redirect('/dashboard/settings?saved=1');
}
