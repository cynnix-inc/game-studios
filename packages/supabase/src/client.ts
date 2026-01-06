import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './types/database.types';
import { getSupabasePublicEnv, type SupabasePublicEnv } from './env';

export type TypedSupabaseClient = SupabaseClient<Database>;

type AsyncStorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

function isWebRuntime(): boolean {
  // Expo web / react-native-web provides a DOM; true React Native does not.
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function isReactNativeRuntime(): boolean {
  // RN sets navigator.product = 'ReactNative'. Web/Node do not.
  const nav = (globalThis as unknown as { navigator?: { product?: string } }).navigator;
  // NOTE: On Expo Web, navigator.product may still be 'ReactNative' (react-native-web),
  // but we must treat that as web so OAuth redirect sessions are detected in the URL.
  return nav?.product === 'ReactNative' && !isWebRuntime();
}

export function createTypedSupabaseClient(env?: SupabasePublicEnv): TypedSupabaseClient {
  const { url, anonKey } = env ?? getSupabasePublicEnv();
  const shouldUseAsyncStorage = isReactNativeRuntime();

  // supabase-js expects an async storage adapter on React Native, otherwise sessions won't persist.
  // Keep this Node-safe by dynamically importing AsyncStorage only when the adapter is used.
  const storage: AsyncStorageLike | undefined = shouldUseAsyncStorage
    ? {
        async getItem(key) {
          const mod = await import('@react-native-async-storage/async-storage');
          return mod.default.getItem(key);
        },
        async setItem(key, value) {
          const mod = await import('@react-native-async-storage/async-storage');
          await mod.default.setItem(key, value);
        },
        async removeItem(key) {
          const mod = await import('@react-native-async-storage/async-storage');
          await mod.default.removeItem(key);
        },
      }
    : undefined;

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: !shouldUseAsyncStorage,
      storage,
    },
  });
}



