import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const roots = ['src/app/(doctor)', 'src/components/portal', 'src/app/(student)', 'src/components/student'];
const skip = /workshop-kit|screening-kit/;
const banned = [
  { name: 'text under 12px', re: /text-\[(8|9|10|11)px\]/ },
  { name: 'font-black', re: /font-black/ },
  { name: 'uppercase tracking', re: /uppercase tracking-/ },
  { name: 'bg-blue-', re: /bg-blue-/ },
  { name: 'emoji', re: /\p{Extended_Pictographic}/u },
];

async function filesIn(dir) {
  const found = [];
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await filesIn(full));
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name) && !skip.test(full)) found.push(full);
  }
  return found;
}

const problems = [];
for (const root of roots) {
  for (const file of await filesIn(root)) {
    const text = await readFile(file, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      for (const rule of banned) {
        if (rule.re.test(line)) problems.push(`${file}:${index + 1} ${rule.name}`);
      }
    });
  }
}

if (problems.length) {
  console.error(problems.slice(0, 80).join('\n'));
  console.error(`FAIL: ${problems.length} portal style problems`);
  process.exit(1);
}
console.log('PASS: portal style');
