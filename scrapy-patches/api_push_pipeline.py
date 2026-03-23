"""
ApiPushPipeline — replaces the MariaDB pipeline in evently-swiss/scrapy.

Reads from environment / settings.py:
  PLATFORM_API_URL  e.g. https://evently.swiss
  PLATFORM_API_KEY  the SCRAPER_API_KEY provisioned on the platform

Drop this file into your pipeline module and update settings.py:

  ITEM_PIPELINES = {
      'evently.pipelines.api_push.ApiPushPipeline': 300,
  }

  PLATFORM_API_URL = os.environ.get("PLATFORM_API_URL", "http://localhost:3000")
  PLATFORM_API_KEY = os.environ.get("PLATFORM_API_KEY", "")
"""

import logging
import requests
from scrapy import Spider
from scrapy.exceptions import DropItem

logger = logging.getLogger(__name__)


class ApiPushPipeline:
    """Pushes scraped events to the platform API via POST /api/internal/scraped-events."""

    def open_spider(self, spider: Spider) -> None:
        self.api_url = spider.settings.get("PLATFORM_API_URL", "").rstrip("/")
        self.api_key = spider.settings.get("PLATFORM_API_KEY", "")
        self.endpoint = f"{self.api_url}/api/internal/scraped-events"
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        })
        if not self.api_url or not self.api_key:
            logger.warning("PLATFORM_API_URL or PLATFORM_API_KEY not set; ApiPushPipeline will drop all items")

    def close_spider(self, spider: Spider) -> None:
        self.session.close()

    def process_item(self, item: dict, spider: Spider) -> dict:
        if not self.api_url or not self.api_key:
            raise DropItem("ApiPushPipeline not configured")

        payload = {
            "externalUid": item.get("event_uid"),
            "venueSlug": item.get("venue_slug"),
            "title": item.get("title"),
            "date": item.get("date"),          # ISO 8601 string, e.g. "2026-04-05"
            "startTime": item.get("start_time"),
            "endTime": item.get("end_time"),
            "eventUrl": item.get("event_url"),
            "imageUrl": item.get("image_url"),
            "cost": item.get("cost"),
            "tags": item.get("tags") or [],
        }

        # Validate required fields before sending
        for required in ("externalUid", "venueSlug", "title", "date"):
            if not payload.get(required):
                raise DropItem(f"Missing required field '{required}' in item: {item!r}")

        try:
            resp = self.session.post(self.endpoint, json=payload, timeout=10)
            if resp.status_code == 200:
                logger.debug("Pushed event %s: %s", payload["externalUid"], payload["title"])
            elif resp.status_code in (400, 422):
                logger.warning(
                    "Validation error for event %s: %s — %s",
                    payload["externalUid"],
                    resp.status_code,
                    resp.text,
                )
            elif resp.status_code == 401:
                logger.error("Authentication failed — check PLATFORM_API_KEY")
                raise DropItem("Unauthorized")
            else:
                logger.error(
                    "Unexpected response %s for event %s: %s",
                    resp.status_code,
                    payload["externalUid"],
                    resp.text,
                )
        except requests.RequestException as exc:
            logger.error("Request failed for event %s: %s", payload.get("externalUid"), exc)

        return item
