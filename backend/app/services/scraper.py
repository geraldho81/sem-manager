from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from urllib.parse import urljoin, urlparse
import json
import asyncio

import httpx
from app.config import settings


class WebScraper:
    """Simple web scraper using HTTP requests."""

    def __init__(self):
        self.client: Optional[httpx.AsyncClient] = None
        self._lock = asyncio.Lock()

    async def _ensure_client(self):
        """Ensure HTTP client is initialized."""
        async with self._lock:
            if self.client is None:
                self.client = httpx.AsyncClient(
                    timeout=30.0,
                    follow_redirects=True,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
                    }
                )

    async def crawl_site(
        self,
        url: str,
        max_pages: int = None,
        include_metadata: bool = True,
    ) -> str:
        """Crawl a website and extract text content."""
        if max_pages is None:
            max_pages = settings.MAX_PAGES_TO_CRAWL

        await self._ensure_client()

        visited = set()
        to_visit = [url]
        all_content = []
        base_domain = urlparse(url).netloc

        while to_visit and len(visited) < max_pages:
            current_url = to_visit.pop(0)
            if current_url in visited:
                continue

            try:
                response = await self.client.get(current_url)
                response.raise_for_status()

                content_type = response.headers.get("content-type", "")
                if "text/html" not in content_type:
                    continue

                html = response.text
                soup = BeautifulSoup(html, "html.parser")

                for element in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
                    element.decompose()

                main_content = soup.find("main") or soup.find("article") or soup.body
                if main_content:
                    text = main_content.get_text(separator=" ", strip=True)
                else:
                    text = soup.get_text(separator=" ", strip=True)

                text = " ".join(text.split())

                content_item = {
                    "url": current_url,
                    "text": text[:10000],
                }

                if include_metadata:
                    content_item["title"] = soup.title.string if soup.title else ""
                    content_item["meta_description"] = self._get_meta_description(soup)
                    content_item["h1"] = self._get_h1(soup)

                all_content.append(content_item)
                visited.add(current_url)

                for link in soup.find_all("a", href=True):
                    href = link["href"]
                    full_url = urljoin(current_url, href)
                    parsed = urlparse(full_url)
                    if parsed.netloc == base_domain and full_url not in visited:
                        if not any(full_url.endswith(ext) for ext in [".pdf", ".jpg", ".png", ".gif", ".zip"]):
                            to_visit.append(full_url)

            except Exception as e:
                print(f"Error crawling {current_url}: {e}")
                continue

        return json.dumps(all_content, indent=2, ensure_ascii=False)

    async def scrape_page(self, url: str) -> Dict[str, str]:
        """Scrape a single page."""
        await self._ensure_client()

        try:
            response = await self.client.get(url)
            response.raise_for_status()

            html = response.text
            soup = BeautifulSoup(html, "html.parser")

            for element in soup(["script", "style", "nav", "footer"]):
                element.decompose()

            text = soup.get_text(separator=" ", strip=True)
            text = " ".join(text.split())

            return {
                "url": url,
                "title": soup.title.string if soup.title else "",
                "meta_description": self._get_meta_description(soup),
                "h1": self._get_h1(soup),
                "text": text[:10000],
            }

        except Exception as e:
            return {
                "url": url,
                "error": str(e),
                "text": "",
            }

    def _get_meta_description(self, soup: BeautifulSoup) -> str:
        """Extract meta description from soup."""
        meta = soup.find("meta", attrs={"name": "description"})
        if meta and meta.get("content"):
            return meta["content"]

        og_meta = soup.find("meta", attrs={"property": "og:description"})
        if og_meta and og_meta.get("content"):
            return og_meta["content"]

        return ""

    def _get_h1(self, soup: BeautifulSoup) -> str:
        """Extract first H1 from soup."""
        h1 = soup.find("h1")
        return h1.get_text(strip=True) if h1 else ""

    async def close(self):
        """Close the HTTP client."""
        if self.client:
            await self.client.aclose()
