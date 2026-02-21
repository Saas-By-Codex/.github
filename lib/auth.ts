import { cookies } from 'next/headers';

export interface AuthUser {
  id: string;
  email?: string;
}

async function getAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const directToken = cookieStore.get('sb-access-token')?.value;
  if (directToken) {
    return directToken;
  }

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
  if (!projectRef) {
    return null;
  }

  return cookieStore.get(`sb-${projectRef}-auth-token`)?.value ?? null;
}

export async function getLoggedInSupabaseUser(): Promise<AuthUser | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const accessToken = await getAccessTokenFromCookies();

  if (!url || !anonKey || !accessToken) {
    return null;
  }

  const response = await fetch(`${url}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { id: string; email?: string };
  return { id: data.id, email: data.email };
}
