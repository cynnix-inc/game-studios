import { createTypedSupabaseClient } from '@cynnix-studios/supabase';
import {
  getSession,
  onAuthStateChange,
  signInWithApple,
  signInWithGoogle,
  signInWithOAuthRedirect,
  signOut,
} from '@cynnix-studios/game-foundation';

let supabaseClient: ReturnType<typeof createTypedSupabaseClient> | null = null;
let supabaseInitError: Error | null = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  if (supabaseInitError) throw supabaseInitError;
  try {
    supabaseClient = createTypedSupabaseClient();
    return supabaseClient;
  } catch (e) {
    supabaseInitError = e instanceof Error ? e : new Error(String(e));
    throw supabaseInitError;
  }
}

export function isSupabaseConfigured(): boolean {
  try {
    getSupabase();
    return true;
  } catch {
    return false;
  }
}

export async function signInApple() {
  return signInWithApple(getSupabase());
}

export async function signInGoogle() {
  return signInWithGoogle(getSupabase());
}

export async function signInGoogleWeb(redirectTo?: string) {
  return signInWithOAuthRedirect(getSupabase(), 'google', redirectTo);
}

export async function signOutAll() {
  return signOut(getSupabase());
}

export type SessionUserInfo = { id: string; email?: string | null };

export async function getSessionUser(): Promise<SessionUserInfo | null> {
  if (!isSupabaseConfigured()) return null;
  const session = await getSession(getSupabase());
  if (!session?.user?.id) return null;
  return { id: session.user.id, email: session.user.email ?? null };
}

export function subscribeToAuthEvents(cb: (event: string) => void): () => void {
  if (!isSupabaseConfigured()) return () => {};
  return onAuthStateChange(getSupabase(), cb);
}

export async function getAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}



