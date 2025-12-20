// Supabase Edge Function skeleton: upsert-save
// Validates input then writes to public.saves for the authenticated player.
//
// TODO:
// - Replace placeholder logic with a real Supabase service-role client inside the edge function.
// - Validate `data` payload size and shape per game.

type UpsertSaveBody = {
  game_key: string;
  slot?: string;
  data: unknown;
};

function bad(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return bad('Method not allowed', 405);

  let body: UpsertSaveBody;
  try {
    body = (await req.json()) as UpsertSaveBody;
  } catch {
    return bad('Invalid JSON');
  }

  const { game_key, slot, data } = body ?? ({} as UpsertSaveBody);
  if (!game_key || typeof game_key !== 'string') return bad('Missing game_key');
  if (slot != null && typeof slot !== 'string') return bad('Invalid slot');
  if (data == null || typeof data !== 'object') return bad('Invalid data');

  return new Response(
    JSON.stringify({
      ok: true,
      message:
        'upsert-save placeholder: wire Supabase service-role client, map auth user -> player_id, then upsert into public.saves',
    }),
    { headers: { 'content-type': 'application/json' } },
  );
}


