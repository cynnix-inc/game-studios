import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './types/database.types';
import { getSupabasePublicEnv, type SupabasePublicEnv } from './env';

export type TypedSupabaseClient = SupabaseClient<Database>;

export function createTypedSupabaseClient(env?: SupabasePublicEnv): TypedSupabaseClient {
  const { url, anonKey } = env ?? getSupabasePublicEnv();
  return createClient<Database>(url, anonKey);
}


