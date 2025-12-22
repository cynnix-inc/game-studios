/**
 * Supabase Database types (repo-synced).
 *
 * This repo does not currently vendor the Supabase CLI, so these types are kept in sync with
 * `supabase/migrations/*.sql` for local type-safety.
 *
 * If/when a Supabase project is configured, you can regenerate authoritative types via:
 *
 *   supabase gen types typescript --project-id <PROJECT_REF> --schema public > packages/supabase/src/types/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          user_id: string | null;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          display_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      saves: {
        Row: {
          player_id: string;
          game_key: string;
          slot: string;
          data: Json;
          updated_at: string;
        };
        Insert: {
          player_id: string;
          game_key: string;
          slot?: string;
          data: Json;
          updated_at?: string;
        };
        Update: {
          player_id?: string;
          game_key?: string;
          slot?: string;
          data?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      leaderboard_scores: {
        Row: {
          game_key: string;
          mode: string;
          player_id: string;
          best_value: number;
          updated_at: string;
        };
        Insert: {
          game_key: string;
          mode: string;
          player_id: string;
          best_value: number;
          updated_at?: string;
        };
        Update: {
          game_key?: string;
          mode?: string;
          player_id?: string;
          best_value?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_runs: {
        Row: {
          id: string;
          utc_date: string;
          player_id: string;
          raw_time_ms: number;
          score_ms: number;
          mistakes_count: number;
          hints_used_count: number;
          hint_breakdown: Json;
          ranked_submission: boolean;
          client_submission_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          utc_date: string;
          player_id: string;
          raw_time_ms: number;
          score_ms: number;
          mistakes_count?: number;
          hints_used_count?: number;
          hint_breakdown?: Json;
          ranked_submission?: boolean;
          client_submission_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          utc_date?: string;
          player_id?: string;
          raw_time_ms?: number;
          score_ms?: number;
          mistakes_count?: number;
          hints_used_count?: number;
          hint_breakdown?: Json;
          ranked_submission?: boolean;
          client_submission_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};


