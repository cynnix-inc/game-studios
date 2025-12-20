import { GoogleSignin } from '@react-native-google-signin/google-signin';

import type { TypedSupabaseClient } from '@cynnix-studios/supabase';

/**
 * Google sign-in helper for native.
 *
 * TODO:
 * - Provide OAuth client IDs in `.env` (see `.env.example`).
 * - Configure `GoogleSignin.configure(...)` in app startup with platform-specific IDs.
 */
export async function signInWithGoogle(supabase: TypedSupabaseClient) {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const res = await GoogleSignin.signIn();

  const idToken = res.idToken;
  if (!idToken) {
    throw new Error('Google sign-in failed: missing idToken');
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) throw error;

  return res;
}


