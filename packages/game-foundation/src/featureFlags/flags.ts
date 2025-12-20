export type FeatureFlagKey = string & {};

export type FeatureFlags = {
  isEnabled(key: FeatureFlagKey): boolean;
};

export function createStaticFeatureFlags(enabled: FeatureFlagKey[] = []): FeatureFlags {
  const set = new Set(enabled);
  return {
    isEnabled(key) {
      return set.has(key);
    },
  };
}


