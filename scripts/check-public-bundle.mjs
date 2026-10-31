// Scan a deployed site's public JS for a Supabase service-role key.
// Usage: node scripts/check-public-bundle.mjs https://www.neurochiro.co
// Never prints a key. Prints PASS or FAIL: service_role found in <chunk>.

const base = process.argv[2];
if (!base) {
  console.error('Usage: node scripts/check-public-bundle.mjs <baseUrl>');
  process.exit(2);
}

const pages = ['/', '/login', '/directory', '/doctor/dashboard'];
const chunkRe = /\/_next\/static\/[^"'\\\s>]+\.js/g;
const jwtRe = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;

function roleOf(token) {
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    );
    return typeof json.role === 'string' ? json.role : 'unknown';
  } catch {
    return 'unknown';
  }
}

const chunks = new Set();
for (const page of pages) {
  const response = await fetch(new URL(page, base));
  const html = await response.text();
  for (const match of html.matchAll(chunkRe)) chunks.add(match[0]);
}

const queue = [...chunks];
const seen = new Set();
let scanned = 0;

while (queue.length > 0) {
  const chunk = queue.shift();
  if (!chunk || seen.has(chunk)) continue;
  seen.add(chunk);
  const response = await fetch(new URL(chunk, base));
  if (!response.ok) continue;
  const js = await response.text();
  scanned += 1;
  for (const match of js.matchAll(chunkRe)) {
    if (!seen.has(match[0])) queue.push(match[0]);
  }
  if (js.includes('sb_secret_')) {
    console.error(`FAIL: service_role found in ${chunk}`);
    process.exit(1);
  }
  for (const match of js.matchAll(jwtRe)) {
    const role = roleOf(match[0]);
    if (role !== 'anon') {
      console.error(`FAIL: service_role found in ${chunk}`);
      process.exit(1);
    }
  }
}

if (scanned === 0) {
  console.error('FAIL: no public JS chunks were found to scan');
  process.exit(1);
}

console.log('PASS: only anon/publishable keys found');
