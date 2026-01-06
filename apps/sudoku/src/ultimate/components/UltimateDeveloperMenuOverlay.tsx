import React from 'react';
import { Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { Code2, Pause, Trophy, AlertCircle, Trash2, X, Settings, Database, Eye } from 'lucide-react-native';

import { MakeButton } from '../../components/make/MakeButton';
import { MakeCard } from '../../components/make/MakeCard';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import { clearLocalInProgressSave, readLocalInProgressSave } from '../../services/saves';
import { clearLocalSettings, updateLocalSettings } from '../../services/settings';
import { clearLockModePreference, readLockModePreference } from '../../services/lockModePreference';
import { isDevToolsAllowed } from '../../services/runtimeEnv';
import { usePlayerStore } from '../../state/usePlayerStore';
import { useSettingsStore } from '../../state/useSettingsStore';

type DevTrigger = 'pause' | 'win' | 'lose';

function emitDevTrigger(trigger: DevTrigger) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('devTrigger', trigger);
    window.dispatchEvent(new CustomEvent('devTrigger', { detail: trigger }));
  } else {
    // Best-effort fallback on native.
    const s = usePlayerStore.getState();
    if (trigger === 'pause') s.pauseRun();
    if (trigger === 'win') s.devForceComplete();
    if (trigger === 'lose') s.devForceFail();
  }
}

export function UltimateDeveloperMenuOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { theme: makeTheme, themeType, setThemeType } = useMakeTheme();

  const settings = useSettingsStore((s) => s.settings);
  const devAllowed = isDevToolsAllowed();

  const [pos, setPos] = React.useState({ x: 24, y: 24 });
  const [dragging, setDragging] = React.useState(false);
  const dragOffset = React.useRef({ x: 0, y: 0 });

  if (!devAllowed) return null;

  const clearAllLocal = async () => {
    await Promise.allSettled([clearLocalInProgressSave(), clearLocalSettings(), clearLockModePreference()]);
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    console.log('[dev] Cleared local storage');
  };

  const logGameState = async () => {
    const saved = await readLocalInProgressSave();
    const lockPref = await readLockModePreference();
    console.log('=== DEV GAME STATE ===');
    console.log('In-progress save:', saved ?? 'None');
    console.log('Lock Mode Preference:', lockPref);
    console.log('Settings (store):', settings ?? 'Not loaded');
    console.log('Player State (store):', usePlayerStore.getState());
  };

  const themes: ReadonlyArray<{ value: typeof themeType; label: string }> = [
    { value: 'default', label: 'Default' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'grayscale', label: 'Grayscale' },
    { value: 'device', label: 'Match Device' },
  ];

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
      {/* Backdrop is click-through like Make (menu itself handles pointer events). */}
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <View
          style={{
            position: 'absolute',
            left: pos.x,
            top: pos.y,
            width: 400,
            maxHeight: '80%',
          }}
        >
          <Pressable
            onPress={() => null}
            style={({ pressed }) => ({
              opacity: pressed && Platform.OS !== 'web' ? 0.98 : 1,
            })}
          >
            <MakeCard
              style={[
                {
                  borderRadius: 16,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: makeTheme.card.border,
                  backgroundColor: makeTheme.card.background,
                },
                Platform.select({
                  web: { boxShadow: '0 20px 50px rgba(0,0,0,0.25)' } as unknown as object,
                  ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
                  android: { elevation: 12 },
                }),
              ]}
            >
              {/* Header (draggable on web) */}
              <Pressable
                onPressIn={(e) => {
                  if (Platform.OS !== 'web') return;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const ne = e.nativeEvent as any;
                  const clientX = typeof ne?.pageX === 'number' ? ne.pageX : typeof ne?.clientX === 'number' ? ne.clientX : 0;
                  const clientY = typeof ne?.pageY === 'number' ? ne.pageY : typeof ne?.clientY === 'number' ? ne.clientY : 0;
                  dragOffset.current = { x: clientX - pos.x, y: clientY - pos.y };
                  setDragging(true);
                }}
                onPressOut={() => setDragging(false)}
                onPointerMove={(e) => {
                  if (Platform.OS !== 'web') return;
                  if (!dragging) return;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const ne = e.nativeEvent as any;
                  const clientX = typeof ne?.pageX === 'number' ? ne.pageX : typeof ne?.clientX === 'number' ? ne.clientX : 0;
                  const clientY = typeof ne?.pageY === 'number' ? ne.pageY : typeof ne?.clientY === 'number' ? ne.clientY : 0;
                  setPos({ x: clientX - dragOffset.current.x, y: clientY - dragOffset.current.y });
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: makeTheme.card.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  ...(Platform.OS === 'web' ? ({ cursor: 'move' } as unknown as object) : null),
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Code2 width={18} height={18} color={makeTheme.accent} />
                  <MakeText weight="semibold">Developer Menu</MakeText>
                </View>
                <Pressable
                  accessibilityLabel="Close developer menu"
                  onPress={onClose}
                  style={({ pressed }) => ({
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: pressed ? makeTheme.card.border : 'transparent',
                  })}
                >
                  <X width={16} height={16} color={makeTheme.text.primary} />
                </Pressable>
              </Pressable>

              <ScrollView contentContainerStyle={{ padding: 14, gap: 16 }}>
                {/* Theme Switcher */}
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Settings width={16} height={16} color={makeTheme.text.muted} />
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      Quick Theme Switch
                    </MakeText>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {themes.map((t) => {
                      const selected = themeType === t.value;
                      return (
                        <MakeButton
                          key={t.value}
                          title={t.label}
                          accessibilityLabel={`Theme: ${t.label}`}
                          variant={selected ? 'primary' : 'secondary'}
                          elevation="flat"
                          radius={12}
                          onPress={() => setThemeType(t.value)}
                          contentStyle={{ height: 36, paddingHorizontal: 12, paddingVertical: 0 }}
                          titleStyle={{ fontSize: 12 }}
                        />
                      );
                    })}
                  </View>
                </View>

                {/* Storage Actions */}
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Database width={16} height={16} color={makeTheme.text.muted} />
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      Local Storage
                    </MakeText>
                  </View>
                  <View style={{ gap: 8 }}>
                    <MakeButton
                      title="Clear Saved Game"
                      accessibilityLabel="Clear Saved Game"
                      variant="secondary"
                      elevation="flat"
                      radius={12}
                      onPress={() => void clearLocalInProgressSave()}
                      contentStyle={{ height: 40, paddingHorizontal: 14, paddingVertical: 0 }}
                    />
                    <MakeButton
                      title="Reset Grid Settings"
                      accessibilityLabel="Reset Grid Settings"
                      variant="secondary"
                      elevation="flat"
                      radius={12}
                      onPress={() => {
                        if (!settings) return;
                        const deviceId = usePlayerStore.getState().deviceId ?? 'unknown';
                        // Drop the `ui` block to return to defaults (Make semantics).
                        const next = { ...settings, ui: undefined, updatedAtMs: Date.now(), updatedByDeviceId: deviceId };
                        updateLocalSettings(next);
                      }}
                      contentStyle={{ height: 40, paddingHorizontal: 14, paddingVertical: 0 }}
                    />
                    <MakeButton
                      title="Reset Lock Mode Preference"
                      accessibilityLabel="Reset Lock Mode Preference"
                      variant="secondary"
                      elevation="flat"
                      radius={12}
                      onPress={() => void clearLockModePreference()}
                      contentStyle={{ height: 40, paddingHorizontal: 14, paddingVertical: 0 }}
                    />
                    <MakeButton
                      title="Clear All LocalStorage"
                      accessibilityLabel="Clear All LocalStorage"
                      variant="secondary"
                      elevation="flat"
                      radius={12}
                      leftIcon={<Trash2 width={16} height={16} color={makeTheme.text.primary} />}
                      onPress={() => void clearAllLocal()}
                      contentStyle={{ height: 40, paddingHorizontal: 14, paddingVertical: 0 }}
                    />
                  </View>
                </View>

                {/* Debug */}
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Eye width={16} height={16} color={makeTheme.text.muted} />
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      Debug
                    </MakeText>
                  </View>
                  <View style={{ gap: 8 }}>
                    <MakeButton
                      title="Log Game State to Console"
                      accessibilityLabel="Log Game State to Console"
                      variant="secondary"
                      elevation="flat"
                      radius={12}
                      onPress={() => void logGameState()}
                      contentStyle={{ height: 40, paddingHorizontal: 14, paddingVertical: 0 }}
                    />
                    <MakeButton
                      title="Trigger Pause"
                      accessibilityLabel="Trigger Pause"
                      variant="secondary"
                      elevation="flat"
                      radius={12}
                      leftIcon={<Pause width={16} height={16} color={makeTheme.text.primary} />}
                      onPress={() => emitDevTrigger('pause')}
                      contentStyle={{ height: 40, paddingHorizontal: 14, paddingVertical: 0 }}
                    />
                    <MakeButton
                      title="Trigger Win"
                      accessibilityLabel="Trigger Win"
                      variant="secondary"
                      elevation="flat"
                      radius={12}
                      leftIcon={<Trophy width={16} height={16} color={makeTheme.text.primary} />}
                      onPress={() => emitDevTrigger('win')}
                      contentStyle={{ height: 40, paddingHorizontal: 14, paddingVertical: 0 }}
                    />
                    <MakeButton
                      title="Trigger Lose"
                      accessibilityLabel="Trigger Lose"
                      variant="secondary"
                      elevation="flat"
                      radius={12}
                      leftIcon={<AlertCircle width={16} height={16} color={makeTheme.text.primary} />}
                      onPress={() => emitDevTrigger('lose')}
                      contentStyle={{ height: 40, paddingHorizontal: 14, paddingVertical: 0 }}
                    />
                  </View>
                </View>

                <View style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: makeTheme.card.border }}>
                  <MakeText tone="muted" style={{ fontSize: 12 }}>
                    Tip: Press Ctrl+Shift+D to toggle this menu
                  </MakeText>
                </View>
              </ScrollView>
            </MakeCard>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}


