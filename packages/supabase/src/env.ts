export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
  functionsUrl?: string;
};

function readEnv(key: string): string | undefined {
  // Expo (web/native) exposes EXPO_PUBLIC_* at build time; Node also uses process.env.
  return process.env[key];
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  const url = readEnv('EXPO_PUBLIC_SUPABASE_URL');
  const anonKey = readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  const functionsUrl = readEnv('EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL');

  if (!url) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL (set it in .env from .env.example)');
  }
  if (!anonKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY (set it in .env from .env.example)');
  }

  return { url, anonKey, functionsUrl };
}


