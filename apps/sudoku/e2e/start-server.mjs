import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appRoot = path.resolve(__dirname, '..');
const distDir = path.join(appRoot, 'dist');

const PORT_MOCK = Number(process.env.SUDOKU_E2E_MOCK_PORT ?? '4400');
const PORT_WEB = Number(process.env.SUDOKU_E2E_WEB_PORT ?? '4401');

function nowUtcDateKey(nowMs = Date.now()) {
  const d = new Date(nowMs);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getLastNUtcDateKeys(n, nowMs = Date.now()) {
  const out = [];
  const msDay = 24 * 60 * 60 * 1000;
  for (let i = 0; i < n; i++) {
    out.push(nowUtcDateKey(nowMs - i * msDay));
  }
  return out;
}

function makeDailyPayload(dateKey) {
  // Valid Sudoku (common solved grid) with one missing cell (index 0).
  const solution = [
    5, 3, 4, 6, 7, 8, 9, 1, 2,
    6, 7, 2, 1, 9, 5, 3, 4, 8,
    1, 9, 8, 3, 4, 2, 5, 6, 7,
    8, 5, 9, 7, 6, 1, 4, 2, 3,
    4, 2, 6, 8, 5, 3, 7, 9, 1,
    7, 1, 3, 9, 2, 4, 8, 5, 6,
    9, 6, 1, 5, 3, 7, 2, 8, 4,
    2, 8, 7, 4, 1, 9, 6, 3, 5,
    3, 4, 5, 2, 8, 6, 1, 7, 9,
  ];
  const puzzle = solution.slice();
  puzzle[0] = 0;
  return {
    schema_version: 1,
    date_key: dateKey,
    difficulty: 'easy',
    puzzle,
    solution,
  };
}

const leaderboardRows = [
  {
    rank: 1,
    player_id: 'player_aaa',
    display_name: 'Player-AAA',
    score_ms: 60_000,
    raw_time_ms: 55_000,
    mistakes_count: 0,
    hints_used_count: 0,
    created_at: new Date(Date.now() - 60_000).toISOString(),
  },
  {
    rank: 2,
    player_id: 'player_me',
    display_name: 'Player-ME',
    score_ms: 65_000,
    raw_time_ms: 60_000,
    mistakes_count: 0,
    hints_used_count: 0,
    created_at: new Date(Date.now() - 55_000).toISOString(),
  },
  {
    rank: 3,
    player_id: 'player_bbb',
    display_name: 'Player-BBB',
    score_ms: 70_000,
    raw_time_ms: 70_000,
    mistakes_count: 1,
    hints_used_count: 0,
    created_at: new Date(Date.now() - 50_000).toISOString(),
  },
  {
    rank: 4,
    player_id: 'player_ccc',
    display_name: 'Player-CCC',
    score_ms: 75_000,
    raw_time_ms: 72_000,
    mistakes_count: 0,
    hints_used_count: 1,
    created_at: new Date(Date.now() - 45_000).toISOString(),
  },
];

function json(res, status, obj) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(obj));
}

function parseRankBounds(rankParams) {
  // rank=gte.X and rank=lte.Y
  let gte = null;
  let lte = null;
  for (const v of rankParams) {
    if (typeof v !== 'string') continue;
    if (v.startsWith('gte.')) gte = Number(v.slice(4));
    if (v.startsWith('lte.')) lte = Number(v.slice(4));
  }
  return { gte, lte };
}

function startMockServer() {
  const server = createServer((req, res) => {
    const u = new URL(req.url ?? '/', 'http://localhost');
    // Minimal CORS for fetch in the exported web bundle.
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
    res.setHeader('access-control-allow-headers', 'content-type,authorization,apikey,x-request-id');
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    // Daily manifest/payload (served under /daily/*)
    if (req.method === 'GET' && u.pathname === '/daily/manifest.json') {
      const keys = getLastNUtcDateKeys(30);
      const entries = keys.map((k) => ({ date_key: k, url: `daily/${k}.json` }));
      return json(res, 200, { schema_version: 1, entries });
    }
    if (req.method === 'GET' && u.pathname.startsWith('/daily/daily/') && u.pathname.endsWith('.json')) {
      const dateKey = u.pathname.replace('/daily/daily/', '').replace(/\.json$/, '');
      return json(res, 200, makeDailyPayload(dateKey));
    }

    // Edge Functions
    if (req.method === 'POST' && u.pathname === '/submit-score') {
      return json(res, 200, {
        ok: true,
        requestId: 'e2e-request',
        data: {
          utc_date: nowUtcDateKey(),
          ranked_submission: true,
          display_name: 'Player-ME',
          raw_time_ms: 60_000,
          score_ms: 60_000,
          mistakes_count: 0,
          hints_used_count: 0,
          client_submission_id: null,
        },
      });
    }

    // Supabase REST (leaderboards)
    if (req.method === 'GET' && u.pathname.startsWith('/rest/v1/')) {
      const view = u.pathname.replace('/rest/v1/', '');
      const utcDate = (u.searchParams.get('utc_date') ?? '').replace(/^eq\./, '') || nowUtcDateKey();
      const playerIdEq = u.searchParams.get('player_id');
      const rankParams = u.searchParams.getAll('rank');

      // Players lookup for Around You
      if (view === 'players') {
        return json(res, 200, [{ id: 'player_me' }]);
      }

      if (view === 'daily_leaderboard_score_v1' || view === 'daily_leaderboard_raw_time_v1') {
        const base = leaderboardRows.map((r) => ({ ...r, utc_date: utcDate }));

        // player filter
        if (playerIdEq && playerIdEq.startsWith('eq.')) {
          const pid = playerIdEq.slice(3);
          const me = base.find((r) => r.player_id === pid);
          return json(res, 200, me ? [me] : []);
        }

        // rank range filter
        if (rankParams.length > 0) {
          const { gte, lte } = parseRankBounds(rankParams);
          const filtered = base.filter((r) => (gte == null || r.rank >= gte) && (lte == null || r.rank <= lte));
          return json(res, 200, filtered);
        }

        // default: top list
        return json(res, 200, base);
      }

      return json(res, 404, { message: 'not_found' });
    }

    // Supabase auth user endpoint
    if (req.method === 'GET' && u.pathname === '/auth/v1/user') {
      return json(res, 200, { id: 'user_me' });
    }

    res.statusCode = 404;
    res.end('not found');
  });

  return new Promise((resolve) => {
    server.listen(PORT_MOCK, () => resolve(server));
  });
}

function contentTypeFor(p) {
  if (p.endsWith('.html')) return 'text/html; charset=utf-8';
  if (p.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (p.endsWith('.css')) return 'text/css; charset=utf-8';
  if (p.endsWith('.json')) return 'application/json; charset=utf-8';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function startStaticServer() {
  const server = createServer((req, res) => {
    const u = new URL(req.url ?? '/', 'http://localhost');
    const cleanPath = decodeURIComponent(u.pathname);
    const rel = cleanPath === '/' ? '/index.html' : cleanPath;
    const filePath = path.join(distDir, rel);
    const safePath = path.resolve(filePath);
    if (!safePath.startsWith(path.resolve(distDir))) {
      res.statusCode = 400;
      res.end('bad request');
      return;
    }

    const tryPaths = [safePath, path.join(distDir, 'index.html')];
    for (const p of tryPaths) {
      if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) continue;
      res.statusCode = 200;
      res.setHeader('content-type', contentTypeFor(p));
      fs.createReadStream(p).pipe(res);
      return;
    }
    res.statusCode = 404;
    res.end('not found');
  });

  return new Promise((resolve) => {
    server.listen(PORT_WEB, () => resolve(server));
  });
}

async function exportWebOrDie(env) {
  // Always export fresh so env is embedded correctly in the web bundle.
  fs.rmSync(distDir, { recursive: true, force: true });

  // Run the same export guard as `apps/sudoku/package.json` (but do it inline so we can pass `-c`).
  await new Promise((resolve, reject) => {
    const child = spawn('node', ['../../scripts/verify-expo-public-env.mjs'], {
      cwd: appRoot,
      env,
      stdio: 'inherit',
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`verify-expo-public-env.mjs failed with exit code ${code}`));
    });
  });

  await new Promise((resolve, reject) => {
    // IMPORTANT: clear Metro bundler cache so EXPO_PUBLIC_* changes are reflected in the output.
    const child = spawn('corepack', ['pnpm', 'exec', 'expo', 'export', '-p', 'web', '--output-dir', 'dist', '-c'], {
      cwd: appRoot,
      env,
      stdio: 'inherit',
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`export:web:sudoku failed with exit code ${code}`));
    });
  });
}

function injectE2EEnvIntoExportedHtml(distRoot, vars) {
  const js = [
    '/* e2e env injection (test-only) */',
    `globalThis.__E2E_EXPO_PUBLIC_SUPABASE_URL=${JSON.stringify(vars.EXPO_PUBLIC_SUPABASE_URL)};`,
    `globalThis.__E2E_EXPO_PUBLIC_SUPABASE_ANON_KEY=${JSON.stringify(vars.EXPO_PUBLIC_SUPABASE_ANON_KEY)};`,
    `globalThis.__E2E_EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL=${JSON.stringify(vars.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL)};`,
    `globalThis.__E2E_EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL=${JSON.stringify(vars.EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL)};`,
    `globalThis.__E2E_EXPO_PUBLIC_E2E_ACCESS_TOKEN=${JSON.stringify(vars.EXPO_PUBLIC_E2E_ACCESS_TOKEN)};`,
  ].join('\n');

  const snippet = `<script>\n${js}\n</script>\n`;

  /** @type {string[]} */
  const stack = [distRoot];
  while (stack.length > 0) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        stack.push(p);
        continue;
      }
      if (!ent.isFile() || !p.endsWith('.html')) continue;
      const html = fs.readFileSync(p, 'utf8');
      if (html.includes('__E2E_EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL')) continue;
      const next = html.includes('</head>') ? html.replace('</head>', `${snippet}</head>`) : `${snippet}${html}`;
      fs.writeFileSync(p, next, 'utf8');
    }
  }
}

async function main() {
  const mockBase = `http://127.0.0.1:${PORT_MOCK}`;
  const dailyBase = `${mockBase}/daily`;

  // Start mock server first (so export can be configured to point at it).
  await startMockServer();

  const env = {
    ...process.env,
    EXPO_PUBLIC_SUPABASE_URL: mockBase,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'e2e-anon-key',
    EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL: mockBase,
    EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL: dailyBase,
    EXPO_PUBLIC_E2E_ACCESS_TOKEN: process.env.EXPO_PUBLIC_E2E_ACCESS_TOKEN ?? 'e2e-access-token',
  };

  // Ensure env is visible both via spawned env and (for some toolchains) via this process env.
  // Expo web export bakes EXPO_PUBLIC_* at build time.
  process.env.EXPO_PUBLIC_SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL = env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
  process.env.EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL = env.EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL;
  process.env.EXPO_PUBLIC_E2E_ACCESS_TOKEN = env.EXPO_PUBLIC_E2E_ACCESS_TOKEN;

  console.log('e2e_env_presence', {
    EXPO_PUBLIC_SUPABASE_URL: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL: !!process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL,
    EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL: !!process.env.EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL,
    EXPO_PUBLIC_E2E_ACCESS_TOKEN: !!process.env.EXPO_PUBLIC_E2E_ACCESS_TOKEN,
  });

  await exportWebOrDie(process.env);
  injectE2EEnvIntoExportedHtml(distDir, env);
  await startStaticServer();

  // Signal readiness to Playwright by keeping the process alive.
  console.log(`e2e_server_ready http://127.0.0.1:${PORT_WEB}`);
  setInterval(() => {}, 60_000);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


