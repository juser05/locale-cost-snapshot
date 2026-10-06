# Locale — Tax & Cost Snapshot

A standalone website for exploring estimated federal income tax and public housing-cost statistics by location.

## Run locally

```bash
npm run serve
```

Open `http://localhost:4174`.

## Build and deploy

```bash
npm run build
npx wrangler deploy
```

The checked-in `wrangler.jsonc` is the source of truth for the Cloudflare Worker name, compatibility date, public URL, and static asset directory. In Cloudflare Builds, use `npm run build` as the build command and `npx wrangler deploy` as the deploy command.

## Current coverage

- Functional 2026 federal tax estimate for three filing statuses
- 33,772 Census ZIP Code Tabulation Areas, prefix-sharded for fast lookup
- 2024 ACS median home value, median gross rent, and median real-estate tax paid
- Explicit source-year and methodology language
- State and local tax coverage intentionally marked unavailable until authoritative rule adapters exist

The four named prototype locations retain friendly city/county labels, but their housing figures now come from the generated Census dataset. Other locations currently use their ZIP/ZCTA identifier until a national place-name crosswalk is added.

See [DATA_PLAN.md](DATA_PLAN.md) for the planned source adapters and refresh process.
