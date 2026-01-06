import type { TypedSupabaseClient } from '@cynnix-studios/supabase';

export type OAuthProvider = 'google' | 'apple';

export async function signOut(supabase: TypedSupabaseClient) {
  await supabase.auth.signOut();
}

export async function getSession(supabase: TypedSupabaseClient) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthStateChange(
  supabase: TypedSupabaseClient,
  cb: (event: string) => void,
) {
  const { data } = supabase.auth.onAuthStateChange((event) => cb(event));
  return () => data.subscription.unsubscribe();
}

/**
 * Web OAuth flow. On native, prefer `signInWithApple()` / `signInWithGoogle()`.
 */
export async function signInWithOAuthRedirect(
  supabase: TypedSupabaseClient,
  provider: OAuthProvider,
  redirectTo?: string,
) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: redirectTo ? { redirectTo } : undefined,
  });
  if (error) throw error;
}



