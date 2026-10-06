import { mkdir, rm, writeFile } from 'node:fs/promises';

const year = process.env.CENSUS_YEAR || '2024';
const apiKey = process.env.CENSUS_API_KEY;
if (!apiKey) throw new Error('Set CENSUS_API_KEY to a free Census Data API key before refreshing.');
const variables = ['NAME', 'B25077_001E', 'B25064_001E', 'B25103_001E'];
const endpoint = `https://api.census.gov/data/${year}/acs/acs5?get=${variables.join(',')}&for=zip%20code%20tabulation%20area:*&key=${encodeURIComponent(apiKey)}`;
const output = new URL('../data/zips/', import.meta.url);

const response = await fetch(endpoint, { headers: { 'user-agent': 'Locale data refresh' } });
if (!response.ok) throw new Error(`Census API returned ${response.status}`);
const body = await response.text();
if (body.trimStart().startsWith('<')) {
  const title = body.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || 'HTML error';
  throw new Error(`Census API returned: ${title}. Verify and activate CENSUS_API_KEY.`);
}
const rows = JSON.parse(body);
const headers = rows.shift();
const index = Object.fromEntries(headers.map((header, position) => [header, position]));
const number = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};
const shards = {};

for (const row of rows) {
  const zip = row[index['zip code tabulation area']];
  if (!/^\d{5}$/.test(zip)) continue;
  const record = {
    zip,
    name: `ZIP ${zip}`,
    county: 'Census ZIP Code Tabulation Area',
    home: number(row[index.B25077_001E]),
    rent: number(row[index.B25064_001E]),
    property: number(row[index.B25103_001E]),
    hud: null,
    censusYear: Number(year)
  };
  (shards[zip.slice(0, 2)] ||= []).push(record);
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const [prefix, records] of Object.entries(shards)) {
  await writeFile(new URL(`${prefix}.json`, output), JSON.stringify(records));
}
await writeFile(new URL('../data/metadata.json', import.meta.url), JSON.stringify({
  source: 'U.S. Census Bureau ACS 5-year estimates',
  sourceYear: Number(year),
  refreshedAt: new Date().toISOString(),
  records: rows.length,
  shards: Object.keys(shards).length,
  endpoint: endpoint.replace(apiKey, '[redacted]')
}, null, 2));

console.log(`Wrote ${rows.length.toLocaleString()} ZCTAs across ${Object.keys(shards).length} prefix files.`);
