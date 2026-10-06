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
- Four demonstration ZIP-code snapshots
- Explicit source-year and methodology language
- State and local tax coverage intentionally marked unavailable until authoritative rule adapters exist

The housing figures are demonstration values for interface development. The next release milestone is replacing them with versioned Census ACS and HUD ingestion.

See [DATA_PLAN.md](DATA_PLAN.md) for the planned source adapters and refresh process.
