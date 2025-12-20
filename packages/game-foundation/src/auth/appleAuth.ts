import * as AppleAuthentication from 'expo-apple-authentication';

import type { TypedSupabaseClient } from '@cynnix-studios/supabase';

/**
 * Apple sign-in for iOS.
 *
 * TODO:
 * - Configure Apple Sign In capability in Apple Developer portal + Xcode entitlements (EAS handles at build time).
 * - Confirm bundle id matches `com.cynnixstudios.sudoku`.
 */
export async function signInWithApple(supabase: TypedSupabaseClient) {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple sign-in failed: missing identityToken');
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) throw error;

  return credential;
}


