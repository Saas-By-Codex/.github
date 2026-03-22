export interface SupabaseConnectionRow {
  user_id: string;
  encrypted_key: string;
  connected_at?: string;
  last_synced?: string | null;
}

export interface StripeConnection {
  user_id: string;
  encrypted_key: string;
  connected_at: string;
  last_synced: string | null;
}

export interface UserProfile {
  user_id: string;
  plan_tier: 'free' | 'pro';
  recoveries_this_month: number;
  recovery_month: string;
  auto_retry_enabled: boolean;
  retry_email_subject: string | null;
  retry_email_body: string | null;
  recovered_email_subject: string | null;
  recovered_email_body: string | null;
}

export interface RecoveryCaseRow {
  id?: string;
  user_id: string;
  invoice_id: string;
  invoice_status: 'failed' | 'recovered';
  amount_due: number;
  recovered_amount?: number;
  currency?: string;
  retry_count: number;
  next_retry_at: string;
  customer_email?: string | null;
  last_error?: string | null;
  recovered_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  return { url, serviceRoleKey };
}

async function supabaseRequest(path: string, init: RequestInit): Promise<Response> {
  const { url, serviceRoleKey } = getSupabaseEnv();

  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    },
    cache: 'no-store'
  });
}

function getCurrentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export async function upsertUserStripeConnection(payload: SupabaseConnectionRow): Promise<void> {
  const response = await supabaseRequest('user_stripe_connections?on_conflict=user_id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to persist Stripe connection in Supabase: ${detail}`);
  }
}

export async function getStripeConnections(): Promise<StripeConnection[]> {
  const response = await supabaseRequest('user_stripe_connections?select=user_id,encrypted_key,connected_at,last_synced', {
    method: 'GET'
  });

  if (!response.ok) {
    throw new Error(`Failed loading Stripe connections: ${await response.text()}`);
  }

  return (await response.json()) as StripeConnection[];
}

export async function touchConnectionLastSynced(userId: string, syncedAt: string): Promise<void> {
  const response = await supabaseRequest(`user_stripe_connections?user_id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ last_synced: syncedAt })
  });

  if (!response.ok) {
    throw new Error(`Failed updating last_synced: ${await response.text()}`);
  }
}

export async function upsertRecoveryCase(payload: RecoveryCaseRow): Promise<void> {
  const response = await supabaseRequest('payment_recovery_cases?on_conflict=user_id,invoice_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Failed to upsert recovery case: ${await response.text()}`);
  }
}

export async function getDueRecoveryCases(userId: string, nowIso: string): Promise<RecoveryCaseRow[]> {
  const query = [
    'select=id,user_id,invoice_id,invoice_status,amount_due,recovered_amount,currency,retry_count,next_retry_at,customer_email,last_error,recovered_at',
    `user_id=eq.${encodeURIComponent(userId)}`,
    'invoice_status=eq.failed',
    `next_retry_at=lte.${encodeURIComponent(nowIso)}`,
    'retry_count=lt.4'
  ].join('&');

  const response = await supabaseRequest(`payment_recovery_cases?${query}`, { method: 'GET' });

  if (!response.ok) {
    throw new Error(`Failed to load due recovery cases: ${await response.text()}`);
  }

  return (await response.json()) as RecoveryCaseRow[];
}

export async function getDashboardCases(userId: string): Promise<RecoveryCaseRow[]> {
  const response = await supabaseRequest(
    `payment_recovery_cases?select=invoice_id,invoice_status,amount_due,recovered_amount,currency,retry_count,updated_at&user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc`,
    { method: 'GET' }
  );

  if (!response.ok) {
    throw new Error(`Failed to load dashboard cases: ${await response.text()}`);
  }

  return (await response.json()) as RecoveryCaseRow[];
}

export async function getOrCreateUserProfile(userId: string): Promise<UserProfile> {
  const monthKey = getCurrentMonthKey();

  const upsertResponse = await supabaseRequest('user_profiles?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      user_id: userId,
      plan_tier: 'free',
      recoveries_this_month: 0,
      recovery_month: monthKey,
      auto_retry_enabled: true
    })
  });

  if (!upsertResponse.ok) {
    throw new Error(`Failed upserting user profile: ${await upsertResponse.text()}`);
  }

  const response = await supabaseRequest(
    `user_profiles?select=user_id,plan_tier,recoveries_this_month,recovery_month,auto_retry_enabled,retry_email_subject,retry_email_body,recovered_email_subject,recovered_email_body&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    { method: 'GET' }
  );

  if (!response.ok) {
    throw new Error(`Failed loading user profile: ${await response.text()}`);
  }

  const rows = (await response.json()) as UserProfile[];
  const profile = rows[0];
  if (!profile) {
    throw new Error('User profile not found after upsert.');
  }

  if (profile.recovery_month !== monthKey) {
    await updateUserProfileMonthlyCounter(profile.user_id, 0, monthKey);
    return { ...profile, recoveries_this_month: 0, recovery_month: monthKey };
  }

  return profile;
}

export async function updateUserProfileMonthlyCounter(userId: string, count: number, monthKey: string): Promise<void> {
  const response = await supabaseRequest(`user_profiles?user_id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      recoveries_this_month: count,
      recovery_month: monthKey,
      updated_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Failed updating profile recoveries counter: ${await response.text()}`);
  }
}

export async function updateUserSettings(userId: string, payload: Partial<UserProfile>): Promise<void> {
  const response = await supabaseRequest(`user_profiles?user_id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      auto_retry_enabled: payload.auto_retry_enabled,
      retry_email_subject: payload.retry_email_subject,
      retry_email_body: payload.retry_email_body,
      recovered_email_subject: payload.recovered_email_subject,
      recovered_email_body: payload.recovered_email_body,
      updated_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Failed updating user settings: ${await response.text()}`);
  }
}
