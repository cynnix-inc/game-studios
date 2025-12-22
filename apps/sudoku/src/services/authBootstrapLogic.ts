import type { PlayerProfile } from '@cynnix-studios/game-foundation';

export type SessionLike =
  | null
  | {
      user: {
        id: string;
        email?: string | null;
      };
    };

export function computeNextProfileFromSession(session: SessionLike): PlayerProfile | null {
  if (!session) return null;
  return {
    mode: 'supabase',
    userId: session.user.id,
    email: session.user.email ?? null,
  };
}


