// Fails the build when a public Supabase env var holds a secret key.
// Does not load .env files. When the key is absent (local lint, CI without
// Vercel env), it warns and exits 0. Never prints the key.

const forbidden = Object.keys(process.env).filter(
  (name) => name.startsWith('NEXT_PUBLIC_') && /SERVICE|SECRET|PRIVATE/i.test(name),
);

if (forbidden.length > 0) {
  console.error(
    `FAIL: public env name contains SERVICE, SECRET, or PRIVATE: ${forbidden.join(', ')}`,
  );
  process.exit(1);
}

const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!key) {
  console.warn(
    'warn: no public Supabase key in the environment; skipping the secret-key check',
  );
  process.exit(0);
}

if (key.startsWith('sb_secret_')) {
  console.error('FAIL: public Supabase key starts with sb_secret_');
  process.exit(1);
}

if (key.startsWith('sb_publishable_')) {
  console.log('PASS: publishable public key');
  process.exit(0);
}

const parts = key.split('.');
if (parts.length === 3 && parts[0].startsWith('eyJ')) {
  let role = 'unknown';
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    );
    role = typeof payload.role === 'string' ? payload.role : 'unknown';
  } catch {
    console.error('FAIL: public Supabase key looks like a JWT but the payload did not decode');
    process.exit(1);
  }
  console.log(`role=${role}`);
  if (role !== 'anon') {
    console.error('FAIL: public Supabase key JWT role is not anon');
    process.exit(1);
  }
  process.exit(0);
}

console.log('PASS: public key is not a secret key');
process.exit(0);
