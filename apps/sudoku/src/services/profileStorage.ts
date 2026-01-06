import type { GuestProfile } from '@cynnix-studios/game-foundation';
import { createSaveService } from '@cynnix-studios/game-foundation';

const GAME_KEY = 'sudoku';
const SLOT = 'player_profile_v1';

const profileSaveService = createSaveService();

function isGuestProfile(v: unknown): v is GuestProfile {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return o.mode === 'guest' && typeof o.guestId === 'string' && typeof o.displayName === 'string';
}

export async function readStoredGuestProfile(): Promise<GuestProfile | null> {
  const saved = await profileSaveService.local.read<Record<string, unknown>>(GAME_KEY, SLOT);
  if (!saved) return null;
  const data = saved.data;
  if (!isGuestProfile(data)) return null;
  return data;
}

export async function writeStoredGuestProfile(profile: GuestProfile): Promise<void> {
  await profileSaveService.local.write({
    gameKey: GAME_KEY,
    slot: SLOT,
    data: profile,
  });
}

export async function clearStoredProfile(): Promise<void> {
  await profileSaveService.local.clear(GAME_KEY, SLOT);
}


