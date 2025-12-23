import { createClient } from '@supabase/supabase-js';

// NOTE: we import via relative path to test the actual implementation, not the package export.
import { createTypedSupabaseClient } from '../../supabase/src/client';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({})),
}));

function setGlobal<T extends object>(key: keyof typeof globalThis, value: T | undefined): () => void {
  const prev = (globalThis as unknown as Record<string, unknown>)[key as string];
  if (value === undefined) {
    delete (globalThis as unknown as Record<string, unknown>)[key as string];
  } else {
    (globalThis as unknown as Record<string, unknown>)[key as string] = value;
  }
  return () => {
    if (prev === undefined) {
      delete (globalThis as unknown as Record<string, unknown>)[key as string];
    } else {
      (globalThis as unknown as Record<string, unknown>)[key as string] = prev;
    }
  };
}

describe('createTypedSupabaseClient (web session detection)', () => {
  test('treats web as web even if navigator.product is ReactNative: detectSessionInUrl=true and no AsyncStorage adapter', () => {
    const restoreNavigator = setGlobal('navigator', { product: 'ReactNative' });
    const restoreWindow = setGlobal('window', {} as unknown as object);
    const restoreDocument = setGlobal('document', {} as unknown as object);

    try {
      createTypedSupabaseClient({ url: 'https://example.supabase.co', anonKey: 'anon' });

      const mocked = createClient as unknown as jest.Mock;
      expect(mocked).toHaveBeenCalledTimes(1);
      const config = (mocked.mock.calls[0] as [string, string, unknown])[2];
      expect(config).toMatchObject({
        auth: {
          detectSessionInUrl: true,
          // If we accidentally treat web as RN, we'd set a storage adapter for AsyncStorage.
          storage: undefined,
        },
      });
    } finally {
      restoreNavigator();
      restoreWindow();
      restoreDocument();
    }
  });
});


