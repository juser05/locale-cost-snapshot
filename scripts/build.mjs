import { access, cp, mkdir, rm } from 'node:fs/promises';

const output = new URL('../dist/', import.meta.url);
const root = new URL('../', import.meta.url);
const assets = ['index.html', 'styles.css', 'app.js'];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const asset of assets) {
  await cp(new URL(asset, root), new URL(asset, output));
}

try {
  await access(new URL('data/', root));
  await cp(new URL('data/', root), new URL('data/', output), { recursive: true });
  assets.push('data/');
} catch {
  console.warn('No generated data directory found; building prototype records only.');
}

console.log(`Built ${assets.length} public assets in dist/`);
