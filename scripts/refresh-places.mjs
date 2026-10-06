import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const source = 'https://download.geonames.org/export/zip/US.zip';
const temporary = await mkdtemp(join(tmpdir(), 'locale-places-'));
const archive = join(temporary, 'US.zip');

try {
  const response = await fetch(source, { headers: { 'user-agent': 'Locale place refresh' } });
  if (!response.ok) throw new Error(`GeoNames returned ${response.status}`);
  await writeFile(archive, Buffer.from(await response.arrayBuffer()));
  const { stdout } = await execFileAsync('unzip', ['-p', archive], { maxBuffer: 30 * 1024 * 1024 });
  const byZip = new Map();
  const cityShards = {};
  const seen = new Set();
  const validZips = new Set();

  for (const line of stdout.split('\n')) {
    if (!line) continue;
    const [, zip, city, state, stateCode, county] = line.split('\t');
    if (!/^\d{5}$/.test(zip) || !city) continue;
    if (!byZip.has(zip)) byZip.set(zip, { city, state, stateCode, county });
    const normalized = `${city}, ${stateCode}`.toLowerCase();
    const key = `${normalized}|${zip}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const shard = normalized[0].replace(/[^a-z0-9]/, '_');
    (cityShards[shard] ||= []).push({ label: `${city}, ${stateCode}`, normalized, zip });
  }

  const zipDirectory = new URL('../data/zips/', import.meta.url);
  for (const file of await readdir(zipDirectory)) {
    if (!file.endsWith('.json')) continue;
    const url = new URL(file, zipDirectory);
    const records = JSON.parse(await readFile(url, 'utf8'));
    for (const record of records) {
      validZips.add(record.zip);
      const place = byZip.get(record.zip);
      if (!place) continue;
      record.name = `${place.city}, ${place.stateCode}`;
      record.county = place.county || place.state;
    }
    await writeFile(url, JSON.stringify(records));
  }

  const cityDirectory = new URL('../data/cities/', import.meta.url);
  await rm(cityDirectory, { recursive: true, force: true });
  await mkdir(cityDirectory, { recursive: true });
  let searchableRecords = 0;
  for (const [shard, places] of Object.entries(cityShards)) {
    const searchable = places.filter(place => validZips.has(place.zip));
    searchable.sort((a, b) => a.label.localeCompare(b.label) || a.zip.localeCompare(b.zip));
    searchableRecords += searchable.length;
    await writeFile(new URL(`${shard}.json`, cityDirectory), JSON.stringify(searchable));
  }

  const metadataUrl = new URL('../data/metadata.json', import.meta.url);
  const metadata = JSON.parse(await readFile(metadataUrl, 'utf8'));
  metadata.placeSource = 'GeoNames postal code data';
  metadata.placeSourceUrl = source;
  metadata.placeRecords = searchableRecords;
  await writeFile(metadataUrl, JSON.stringify(metadata, null, 2));
  console.log(`Added place labels and ${searchableRecords.toLocaleString()} searchable city/ZIP entries.`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
