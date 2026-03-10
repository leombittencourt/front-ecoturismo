import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['src'];
const ALLOWED_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.md', '.html', '.json']);
const BAD_PATTERN = /Ã.|Â.|�/;

function walk(dir, out) {
  const entries = readdirSync(dir);
  for (const name of entries) {
    if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) {
      walk(abs, out);
      continue;
    }
    if (!ALLOWED_EXT.has(extname(abs))) continue;
    out.push(abs);
  }
}

const files = [];
for (const d of TARGET_DIRS) walk(join(ROOT, d), files);

const offenders = [];
for (const f of files) {
  const content = readFileSync(f, 'utf8');
  if (BAD_PATTERN.test(content)) offenders.push(f);
}

if (offenders.length > 0) {
  console.error('Possivel encoding quebrado (mojibake) encontrado em:');
  for (const f of offenders) console.error(`- ${f}`);
  process.exit(1);
}

console.log('Encoding check OK.');

