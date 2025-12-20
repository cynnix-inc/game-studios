/**
 * Placeholder Database types for Supabase.
 *
 * Generate real types with the Supabase CLI (recommended) and replace this file:
 *
 * - Install: https://supabase.com/docs/guides/cli
 * - Generate:
 *   supabase gen types typescript --project-id <YOUR_PROJECT_REF> --schema public > packages/supabase/src/types/database.types.ts
 *
 * Keep this file committed so the repo typechecks before Supabase is configured.
 */
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};


