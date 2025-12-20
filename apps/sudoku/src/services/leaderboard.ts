export type LeaderboardMode = 'time_ms' | 'mistakes';

export type LeaderboardEntry = {
  rank: number;
  displayName: string;
  value: number;
};

export async function submitScore(input: { mode: LeaderboardMode; value: number }) {
  const base = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
  if (!base) return;

  const { getAccessToken } = await import('./auth');
  const token = await getAccessToken();
  if (!token) return;

  await fetch(`${base}/submit-score`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      game_key: 'sudoku',
      mode: input.mode,
      value: input.value,
    }),
  });
}

export async function getTop50(mode: LeaderboardMode): Promise<LeaderboardEntry[]> {
  // Placeholder: return mock until Supabase configured.
  return Array.from({ length: 10 }, (_, i) => ({
    rank: i + 1,
    displayName: `Player ${i + 1}`,
    value: mode === 'time_ms' ? 60_000 + i * 1_000 : i,
  }));
}


