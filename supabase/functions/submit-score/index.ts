// Supabase Edge Function skeleton: submit-score
// Validates input, maps auth user -> player_id, then upserts best score if better (lower).
//
// TODO:
// - Replace placeholder SQL calls with real Supabase client + service-role key in function env.
// - Enforce input shape more strictly and add rate limiting if needed.

type LeaderboardMode = 'time_ms' | 'mistakes';

type SubmitScoreBody = {
  game_key: string;
  mode: LeaderboardMode;
  value: number;
};

function bad(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return bad('Method not allowed', 405);

  let body: SubmitScoreBody;
  try {
    body = (await req.json()) as SubmitScoreBody;
  } catch {
    return bad('Invalid JSON');
  }

  const { game_key, mode, value } = body ?? ({} as SubmitScoreBody);
  if (!game_key || typeof game_key !== 'string') return bad('Missing game_key');
  if (mode !== 'time_ms' && mode !== 'mistakes') return bad('Invalid mode');
  if (!Number.isFinite(value) || value < 0) return bad('Invalid value');

  // Placeholder auth mapping:
  // In a real edge function, you would:
  // - read the user from the Authorization header (JWT)
  // - look up/create a row in public.players for that user
  // - use the service role client to bypass RLS and upsert leaderboard_scores

  return new Response(
    JSON.stringify({
      ok: true,
      message:
        'submit-score placeholder: wire Supabase service-role client, map auth user -> player_id, then conditional upsert',
    }),
    { headers: { 'content-type': 'application/json' } },
  );
}


