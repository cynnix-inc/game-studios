import type { PlatformServices } from './types';

/**
 * Native stubs for later integration with Game Center / Google Play Games Services.
 */
export function createNativePlatformServices(): PlatformServices {
  return {
    leaderboards: {
      async getTop() {
        return [];
      },
      async submit() {
        // TODO: integrate native leaderboards later
      },
    },
  };
}


