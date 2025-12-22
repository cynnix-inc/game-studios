import React from 'react';

import { usePlayerStore } from '../state/usePlayerStore';
import { computeNextProfileFromSession } from '../services/authBootstrapLogic';
import { getAccessToken, getSessionUser, subscribeToAuthEvents } from '../services/auth';
import { migrateGuestLocalSavesToCloud, syncSignedInSaveSlotsOnce } from '../services/cloudSaveSync';
import { clearStoredProfile, readStoredGuestProfile, writeStoredGuestProfile } from '../services/profileStorage';
import { syncSettingsOnce } from '../services/settings';
import { syncStatsOnce } from '../services/stats';
import { trackEvent } from '../services/telemetry';

export function AuthBootstrap() {
  React.useEffect(() => {
    let cancelled = false;

    // Persist guest profile so “Continue as Guest” survives reload.
    let lastProfile = usePlayerStore.getState().profile;
    const unsubscribeProfile = usePlayerStore.subscribe((state) => {
      const profile = state.profile;
      if (profile === lastProfile) return;
      lastProfile = profile;

      if (profile?.mode === 'guest') {
        void writeStoredGuestProfile(profile);
        return;
      }
      // When switching away from guest (signed-in or null), clear stored guest profile.
      void clearStoredProfile();
    });

    const init = async () => {
      // Prefer Supabase session if configured/present.
      const user = await getSessionUser();
      if (cancelled) return;
      if (user) {
        const prev = usePlayerStore.getState().profile;
        usePlayerStore.getState().setProfile(
          computeNextProfileFromSession({
            user: { id: user.id, email: user.email ?? null },
          }),
        );
        // Signed-in sync (best-effort).
        void syncSignedInSaveSlotsOnce(user.id);
        void syncSettingsOnce();
        void syncStatsOnce();

        // If the previous profile was guest, migrate local saves into the account.
        if (prev?.mode === 'guest') {
          void trackEvent({ name: 'convert_guest_to_account' });
          const token = await getAccessToken();
          if (token) void migrateGuestLocalSavesToCloud({ token });
        }
        return;
      }

      // Otherwise restore stored guest profile (if any).
      const guest = await readStoredGuestProfile();
      if (cancelled) return;
      usePlayerStore.getState().setProfile(guest);
    };

    void init();

    const unsubscribeAuth = subscribeToAuthEvents(() => {
      // Keep it simple: on any auth event, re-read session user and update profile.
      void (async () => {
        const user = await getSessionUser();
        if (cancelled) return;
        if (user) {
          const prev = usePlayerStore.getState().profile;
          usePlayerStore.getState().setProfile(
            computeNextProfileFromSession({
              user: { id: user.id, email: user.email ?? null },
            }),
          );
          void syncSignedInSaveSlotsOnce(user.id);
          void syncSettingsOnce();
          void syncStatsOnce();
          if (prev?.mode === 'guest') {
            void trackEvent({ name: 'convert_guest_to_account' });
            const token = await getAccessToken();
            if (token) void migrateGuestLocalSavesToCloud({ token });
          }
          return;
        }
        const guest = await readStoredGuestProfile();
        if (cancelled) return;
        usePlayerStore.getState().setProfile(guest);
      })();
    });

    return () => {
      cancelled = true;
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  return null;
}


