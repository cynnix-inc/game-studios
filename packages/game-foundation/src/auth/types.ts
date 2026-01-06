export type AuthMode = 'supabase' | 'guest';

export type GuestProfile = {
  mode: 'guest';
  guestId: string;
  displayName: string;
};

export type SupabaseProfile = {
  mode: 'supabase';
  userId: string;
  email?: string | null;
  displayName?: string | null;
};

export type PlayerProfile = GuestProfile | SupabaseProfile;



