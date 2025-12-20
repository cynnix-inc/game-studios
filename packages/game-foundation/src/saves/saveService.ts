import type { GameSave, SaveWriteResult } from './types';

export type SaveStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

async function loadDefaultStorage(): Promise<SaveStorage> {
  // Lazy import to keep Node-safe typecheck in non-RN contexts.
  const mod = await import('@react-native-async-storage/async-storage');
  const AsyncStorage = mod.default;
  return {
    getItem: (k) => AsyncStorage.getItem(k),
    setItem: (k, v) => AsyncStorage.setItem(k, v),
    removeItem: (k) => AsyncStorage.removeItem(k),
  };
}

export type SaveService = {
  local: {
    read<T extends object>(gameKey: string, slot?: string): Promise<GameSave<T> | null>;
    write<T extends object>(save: Omit<GameSave<T>, 'updatedAtMs'>): Promise<SaveWriteResult>;
    clear(gameKey: string, slot?: string): Promise<void>;
  };
  cloud: {
    // Placeholder for Supabase-backed sync
    pull(): Promise<void>;
    push(): Promise<void>;
  };
};

function makeKey(gameKey: string, slot: string) {
  return `cynnix.save.${gameKey}.${slot}`;
}

export function createSaveService(opts?: { storage?: SaveStorage }): SaveService {
  let storagePromise: Promise<SaveStorage> | undefined;
  const getStorage = async () => {
    if (opts?.storage) return opts.storage;
    storagePromise ??= loadDefaultStorage();
    return storagePromise;
  };

  return {
    local: {
      async read<T extends object>(gameKey: string, slot = 'main') {
        const storage = await getStorage();
        const raw = await storage.getItem(makeKey(gameKey, slot));
        if (!raw) return null;
        return JSON.parse(raw) as GameSave<T>;
      },
      async write<T extends object>(save: Omit<GameSave<T>, 'updatedAtMs'>) {
        const storage = await getStorage();
        const updatedAtMs = Date.now();
        const full: GameSave<T> = { ...save, updatedAtMs };
        await storage.setItem(makeKey(save.gameKey, save.slot), JSON.stringify(full));
        return { ok: true, updatedAtMs };
      },
      async clear(gameKey: string, slot = 'main') {
        const storage = await getStorage();
        await storage.removeItem(makeKey(gameKey, slot));
      },
    },
    cloud: {
      async pull() {
        // TODO: wire to Supabase later.
      },
      async push() {
        // TODO: wire to Supabase later.
      },
    },
  };
}


