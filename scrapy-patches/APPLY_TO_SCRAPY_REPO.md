# Scrapy → Platform API Pipeline

Apply these changes to `evently-swiss/scrapy` to replace the MariaDB pipeline.

## Files to add

- Copy `api_push_pipeline.py` to `evently/pipelines/api_push.py` in the scrapy repo.

## settings.py changes

```python
import os

# Platform API (replaces MariaDB)
PLATFORM_API_URL = os.environ.get("PLATFORM_API_URL", "http://localhost:3000")
PLATFORM_API_KEY = os.environ.get("PLATFORM_API_KEY", "")

ITEM_PIPELINES = {
    'evently.pipelines.api_push.ApiPushPipeline': 300,
    # Remove or comment out the MariaDB pipeline
    # 'evently.pipelines.mariadb.MariaDbPipeline': 300,
}
```

## requirements.txt changes

```
# Remove:
# PyMySQL or mysql-connector-python

# Add (if not already present):
requests>=2.28.0
```

## Spider item fields required

Each spider must yield items with at least:
- `event_uid` — unique identifier (SHA256 or similar)
- `venue_slug` — must match a `Venue.slug` in the platform DB
- `title` — event name
- `date` — ISO 8601 date string (e.g. `"2026-04-05"`)

Optional: `start_time`, `end_time`, `event_url`, `image_url`, `cost`, `tags`

## Environment variables on Pi

```bash
export PLATFORM_API_URL=https://evently.swiss
export PLATFORM_API_KEY=<SCRAPER_API_KEY from platform .env>
```

## Deployment notes

1. Provision `SCRAPER_API_KEY` on the platform (add to `.env` and production secrets)
2. Set venue slugs in the platform DB to match those used in spider items
3. Configure cron to also call `POST /api/internal/reconcile-events` after each scrape run
