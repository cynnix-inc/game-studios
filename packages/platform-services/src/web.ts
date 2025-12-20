import type { PlatformServices } from './types';

export function createWebPlatformServices(): PlatformServices {
  return {
    leaderboards: {
      async getTop() {
        return [];
      },
      async submit() {
        // no-op on web for now; app uses Supabase edge functions directly.
      },
    },
  };
}


