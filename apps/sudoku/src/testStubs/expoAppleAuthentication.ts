export const AppleAuthenticationScope = {
  FULL_NAME: 'FULL_NAME',
  EMAIL: 'EMAIL',
} as const;

export async function signInAsync(): Promise<{ identityToken: string | null }> {
  return { identityToken: null };
}


