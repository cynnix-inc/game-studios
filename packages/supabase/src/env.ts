export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
  functionsUrl?: string;
};

export function getSupabasePublicEnv(): SupabasePublicEnv {
  // IMPORTANT (Expo web): EXPO_PUBLIC_* values are injected at build time, but only for
  // statically-referenced keys. Avoid `process.env[key]` here or Metro won't inline them.
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const functionsUrl = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;

  if (!url) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL (set it in .env from .env.example)');
  }
  if (!anonKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY (set it in .env from .env.example)');
  }

  return { url, anonKey, functionsUrl };
}


