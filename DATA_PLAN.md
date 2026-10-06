# Locale data plan

Locale is intentionally a standalone project. The initial interface uses a small, clearly labeled demonstration dataset while the production ingestion jobs are built.

## Source adapters

| Dataset | Primary source | Geographic unit | Refresh target |
| --- | --- | --- | --- |
| Federal income-tax rules | IRS annual inflation adjustments | Federal | Annual, after IRS publication |
| Home value, gross rent, real-estate tax | Census ACS 5-year API | ZCTA, county, place | Annual |
| Fair Market Rent | HUD User FMR data/API | HUD area, county | Annual |
| Home-price trend | FHFA HPI downloads | ZIP, county, metro, state | Quarterly |
| State income tax | Individual state revenue agencies | State | On rule publication and monthly audit |
| Local income/sales tax | State/local agencies or a licensed provider | Address/jurisdiction | Varies; only publish verified coverage |

## Production pipeline

1. Download each source into a dated raw-data snapshot.
2. Validate schema, year, geography, missing values, and unexpected changes.
3. Normalize into versioned geography and metric tables.
4. Publish a new snapshot atomically; retain the prior version for rollback.
5. Display both the site snapshot time and the source's own observation year/date.

ZIP codes are mailing routes, not tax boundaries. The product should use ZIP/ZCTA for discovery, then require a full street address before claiming an exact local tax jurisdiction.

## Current limitation

Nationwide ACS ZIP-area housing coverage is generated and source-linked. HUD Fair Market Rent, friendly place/county names outside the four initial locations, and verified state/local income-tax rule adapters remain future work.

## Refresh command

Request a free Census Data API key, keep it outside source control, and run:

```bash
CENSUS_API_KEY="your-key" npm run refresh:census
npm run build
```

This produces prefix-sharded files under `data/zips/`, allowing each browser lookup to download only the relevant portion of the national dataset.
