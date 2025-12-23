/**
 * Build-time guard for Expo web exports.
 *
 * Why: Expo web bundles bake `EXPO_PUBLIC_*` at build time. If Netlify branch deploys
 * are missing these variables, the site will deploy but crash at runtime.
 *
 * This script fails the build early with clear diagnostics (without printing secrets).
 */
const required = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  // Daily requires a base URL for manifest/payload hosting; without it the app shows "Daily unavailable".
  'EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL',
];
const optional = ['EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL', 'EXPO_PUBLIC_SUDOKU_FREEPLAY_BASE_URL'];

function isPresent(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function envPresence(key) {
  return isPresent(process.env[key]);
}

// Netlify-provided context variables (safe to log).
const netlifyContext = {
  NETLIFY: process.env.NETLIFY,
  CONTEXT: process.env.CONTEXT,
  BRANCH: process.env.BRANCH,
  HEAD: process.env.HEAD,
  URL: process.env.URL,
  DEPLOY_PRIME_URL: process.env.DEPLOY_PRIME_URL,
  DEPLOY_URL: process.env.DEPLOY_URL,
  REVIEW_ID: process.env.REVIEW_ID,
};

const missingRequired = required.filter((k) => !envPresence(k));

// eslint-disable-next-line no-console
console.log('[env] Expo public env check (web export)');
// eslint-disable-next-line no-console
console.log('[env] Netlify context:', JSON.stringify(netlifyContext, null, 2));
// eslint-disable-next-line no-console
console.log(
  '[env] Presence:',
  JSON.stringify(
    {
      required: Object.fromEntries(required.map((k) => [k, envPresence(k)])),
      optional: Object.fromEntries(optional.map((k) => [k, envPresence(k)])),
    },
    null,
    2,
  ),
);

if (missingRequired.length > 0) {
  // eslint-disable-next-line no-console
  console.error(
    `[env] Missing required EXPO_PUBLIC_* variables: ${missingRequired.join(', ')}`,
  );
  // eslint-disable-next-line no-console
  console.error(
    [
      '[env] Fix (Netlify): Site settings → Build & deploy → Environment → Environment variables.',
      '[env] Make sure the variables are scoped to the deploy context you are building (Branch deploys for `dev`).',
      '[env] Then trigger a fresh deploy.',
    ].join('\n'),
  );
  process.exit(1);
}


