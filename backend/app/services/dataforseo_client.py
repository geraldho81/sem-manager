"""DataForSEO API client for keyword research with real volume/CPC data."""

import base64
import logging
from typing import Dict, Any, List, Optional

import httpx
from app.config import settings, MARKETS

logger = logging.getLogger(__name__)

API_BASE = "https://api.dataforseo.com"


class DataForSEOClient:
    """Client for DataForSEO keyword research APIs."""

    def __init__(self):
        credentials = f"{settings.DATAFORSEO_LOGIN}:{settings.DATAFORSEO_PASSWORD}"
        encoded = base64.b64encode(credentials.encode()).decode()
        self.headers = {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/json",
        }
        self.client: Optional[httpx.AsyncClient] = None

    async def _ensure_client(self):
        if self.client is None:
            self.client = httpx.AsyncClient(
                timeout=60.0,
                headers=self.headers,
            )

    def _is_configured(self) -> bool:
        return bool(settings.DATAFORSEO_LOGIN and settings.DATAFORSEO_PASSWORD)

    async def get_keywords_for_site(
        self,
        domain: str,
        location_code: int,
        language: str = "en",
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Get keyword suggestions based on a domain."""
        if not self._is_configured():
            logger.warning("DataForSEO not configured, skipping keywords_for_site")
            return []

        await self._ensure_client()

        payload = [{
            "target": domain,
            "location_code": location_code,
            "language_code": language,
            "limit": limit,
            "include_serp_info": False,
            "include_seed_keyword": True,
        }]

        try:
            response = await self.client.post(
                f"{API_BASE}/v3/dataforseo_labs/google/keywords_for_site/live",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

            keywords = []
            tasks = data.get("tasks", [])
            if tasks and tasks[0].get("result"):
                for result in tasks[0]["result"]:
                    items = result.get("items", [])
                    for item in items:
                        kw_data = item.get("keyword_data", {})
                        kw_info = kw_data.get("keyword_info", {})
                        keywords.append({
                            "keyword": kw_data.get("keyword", ""),
                            "search_volume": kw_info.get("search_volume"),
                            "cpc": kw_info.get("cpc"),
                            "competition": kw_info.get("competition"),
                        })

            return keywords

        except Exception as e:
            logger.error(f"DataForSEO keywords_for_site error: {e}")
            return []

    async def get_related_keywords(
        self,
        seed_keyword: str,
        location_code: int,
        language: str = "en",
        limit: int = 30,
    ) -> List[Dict[str, Any]]:
        """Get related keywords for a seed keyword."""
        if not self._is_configured():
            return []

        await self._ensure_client()

        payload = [{
            "keyword": seed_keyword,
            "location_code": location_code,
            "language_code": language,
            "limit": limit,
            "include_seed_keyword": True,
        }]

        try:
            response = await self.client.post(
                f"{API_BASE}/v3/dataforseo_labs/google/related_keywords/live",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

            keywords = []
            tasks = data.get("tasks", [])
            if tasks and tasks[0].get("result"):
                for result in tasks[0]["result"]:
                    items = result.get("items", [])
                    for item in items:
                        kw_data = item.get("keyword_data", {})
                        kw_info = kw_data.get("keyword_info", {})
                        keywords.append({
                            "keyword": kw_data.get("keyword", ""),
                            "search_volume": kw_info.get("search_volume"),
                            "cpc": kw_info.get("cpc"),
                            "competition": kw_info.get("competition"),
                        })

            return keywords

        except Exception as e:
            logger.error(f"DataForSEO related_keywords error: {e}")
            return []

    async def get_search_volume(
        self,
        keywords: List[str],
        location_code: int,
        language: str = "en",
    ) -> List[Dict[str, Any]]:
        """Get search volume and CPC for a list of keywords."""
        if not self._is_configured():
            return []

        await self._ensure_client()

        payload = [{
            "keywords": keywords[:1000],
            "location_code": location_code,
            "language_code": language,
        }]

        try:
            response = await self.client.post(
                f"{API_BASE}/v3/keywords_data/google_ads/search_volume/live",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

            results = []
            tasks = data.get("tasks", [])
            if tasks and tasks[0].get("result"):
                for item in tasks[0]["result"]:
                    results.append({
                        "keyword": item.get("keyword", ""),
                        "search_volume": item.get("search_volume"),
                        "cpc": item.get("cpc"),
                        "competition": item.get("competition"),
                    })

            return results

        except Exception as e:
            logger.error(f"DataForSEO search_volume error: {e}")
            return []

    async def close(self):
        if self.client:
            await self.client.aclose()
