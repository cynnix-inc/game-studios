import { createSaveService } from '@cynnix-studios/game-foundation';

const GAME_KEY = 'sudoku';
const SLOT = 'device_id';

type DeviceIdSave = { id: string };

const saveService = createSaveService();

function fallbackId(): string {
  const maybe = globalThis.crypto?.randomUUID?.();
  if (maybe) return maybe;
  // Fallback: pseudo UUIDv4-ish; sufficient for per-install device identity in MVP.
  const rnd = () =>
    Math.floor(Math.random() * 0xffff)
      .toString(16)
      .padStart(4, '0');
  return `${rnd()}${rnd()}-${rnd()}-${rnd()}-${rnd()}-${rnd()}${rnd()}${rnd()}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await saveService.local.read<DeviceIdSave>(GAME_KEY, SLOT);
  const id = existing?.data?.id;
  if (typeof id === 'string' && id.length > 0) return id;

  const created = fallbackId();
  await saveService.local.write({ gameKey: GAME_KEY, slot: SLOT, data: { id: created } });
  return created;
}


