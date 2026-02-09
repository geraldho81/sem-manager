"""
Multi-source scraper for comprehensive industry and audience research.
Supports Reddit, Quora, StackExchange, Medium, and general web search.
"""

from bs4 import BeautifulSoup
from typing import List, Dict, Optional, Callable
import json
from urllib.parse import quote_plus
import asyncio
from dataclasses import dataclass
from enum import Enum

import httpx
from app.config import settings


class ResearchSource(Enum):
    REDDIT = "reddit"
    QUORA = "quora"
    STACKEXCHANGE = "stackexchange"
    MEDIUM = "medium"
    WEB = "web"


@dataclass
class DiscussionResult:
    source: str
    platform: str
    title: str
    url: str
    content: str
    author: Optional[str] = None
    upvotes: Optional[int] = None
    date: Optional[str] = None
    query: str = ""
    tags: Optional[List[str]] = None


class MultiSourceScraper:
    """Scraper for multiple research sources."""

    def __init__(self):
        self.client: Optional[httpx.AsyncClient] = None
        self._lock = asyncio.Lock()

    async def _ensure_client(self):
        async with self._lock:
            if self.client is None:
                self.client = httpx.AsyncClient(
                    timeout=30.0,
                    follow_redirects=True,
                    headers={
                        "User-Agent": (
                            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                        ),
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.5",
                        "Accept-Encoding": "gzip, deflate",
                        "Connection": "keep-alive",
                    }
                )

    async def search_all_sources(
        self,
        queries: List[str],
        sources: Optional[List[ResearchSource]] = None,
        max_results_per_query: int = 10,
        progress_callback: Optional[Callable] = None,
    ) -> Dict[str, List[DiscussionResult]]:
        await self._ensure_client()

        if sources is None:
            sources = list(ResearchSource)

        results: Dict[str, List[DiscussionResult]] = {s.value: [] for s in sources}
        total_sources = len(sources)

        for i, source in enumerate(sources):
            source_name = source.value
            progress = int((i / total_sources) * 100)

            if progress_callback:
                await progress_callback(source_name, progress)

            try:
                if source == ResearchSource.REDDIT:
                    results[source_name] = await self._search_reddit(queries, max_results_per_query)
                elif source == ResearchSource.QUORA:
                    results[source_name] = await self._search_quora(queries, max_results_per_query)
                elif source == ResearchSource.STACKEXCHANGE:
                    results[source_name] = await self._search_stackexchange(queries, max_results_per_query)
                elif source == ResearchSource.MEDIUM:
                    results[source_name] = await self._search_medium(queries, max_results_per_query)
                elif source == ResearchSource.WEB:
                    results[source_name] = await self._search_web(queries, max_results_per_query)
            except Exception as e:
                print(f"Error searching {source_name}: {e}")
                continue

        if progress_callback:
            await progress_callback("complete", 100)

        return results

    async def _search_reddit(self, queries: List[str], max_results: int) -> List[DiscussionResult]:
        results = []
        max_per_query = max(1, max_results // len(queries)) if queries else max_results

        for query in queries[:5]:
            try:
                encoded_query = quote_plus(query)
                search_url = f"https://old.reddit.com/search?q={encoded_query}&sort=relevance"

                response = await self.client.get(search_url)
                if response.status_code != 200:
                    continue

                soup = BeautifulSoup(response.text, "html.parser")
                posts = soup.find_all("div", class_="search-result-link")[:max_per_query]

                for post in posts:
                    try:
                        title_el = post.find("a", class_="search-title")
                        if title_el:
                            title = title_el.get_text(strip=True)
                            href = title_el.get("href", "")
                            score_el = post.find("span", class_="search-score")
                            upvotes = None
                            if score_el:
                                try:
                                    upvotes = int(score_el.get_text(strip=True).replace(",", ""))
                                except ValueError:
                                    pass

                            if title and href:
                                results.append(DiscussionResult(
                                    source="reddit",
                                    platform="Reddit",
                                    title=title[:200],
                                    url=href if href.startswith("http") else f"https://reddit.com{href}",
                                    content=title,
                                    upvotes=upvotes,
                                    query=query,
                                    tags=["discussion", "community"],
                                ))
                    except Exception:
                        continue
            except Exception as e:
                print(f"Error searching Reddit for '{query}': {e}")

        return results

    async def _search_quora(self, queries: List[str], max_results: int) -> List[DiscussionResult]:
        results = []
        max_per_query = max(1, max_results // len(queries)) if queries else max_results

        for query in queries[:5]:
            try:
                encoded_query = quote_plus(query)
                search_url = f"https://www.quora.com/search?q={encoded_query}&type=question"

                response = await self.client.get(search_url)
                if response.status_code != 200:
                    continue

                soup = BeautifulSoup(response.text, "html.parser")
                question_elements = soup.find_all("div", class_=lambda x: x and "question" in x.lower() if x else False)
                if not question_elements:
                    question_elements = soup.find_all("a", href=lambda x: x and "/q/" in x if x else False)

                for el in question_elements[:max_per_query]:
                    try:
                        title = ""
                        url = ""
                        if el.name == "a":
                            title = el.get_text(strip=True)
                            href = el.get("href", "")
                            url = f"https://www.quora.com{href}" if href.startswith("/") else href
                        else:
                            link = el.find("a")
                            if link:
                                title = link.get_text(strip=True)
                                href = link.get("href", "")
                                url = f"https://www.quora.com{href}" if href.startswith("/") else href

                        if title and url:
                            results.append(DiscussionResult(
                                source="quora",
                                platform="Quora",
                                title=title[:200],
                                url=url,
                                content=title,
                                query=query,
                                tags=["question", "q-and-a"],
                            ))
                    except Exception:
                        continue
            except Exception as e:
                print(f"Error searching Quora for '{query}': {e}")

        return results

    async def _search_stackexchange(self, queries: List[str], max_results: int) -> List[DiscussionResult]:
        results = []
        max_per_query = max(1, max_results // len(queries)) if queries else max_results
        api_base = "https://api.stackexchange.com/2.3/search/advanced"

        for query in queries[:5]:
            try:
                params = {
                    "q": query,
                    "sort": "relevance",
                    "order": "desc",
                    "site": "stackoverflow",
                    "pagesize": max_per_query,
                    "filter": "!9_bDE(fI5",
                }

                response = await self.client.get(api_base, params=params)
                if response.status_code != 200:
                    continue

                data = response.json()
                items = data.get("items", [])

                for item in items[:max_per_query]:
                    try:
                        title = item.get("title", "")
                        url = item.get("link", "")
                        score = item.get("score", 0)
                        tags = item.get("tags", [])

                        if title and url:
                            results.append(DiscussionResult(
                                source="stackexchange",
                                platform=f"StackExchange ({item.get('site', 'unknown')})",
                                title=title[:200],
                                url=url,
                                content=title,
                                upvotes=score,
                                query=query,
                                tags=tags[:5],
                            ))
                    except Exception:
                        continue
            except Exception as e:
                print(f"Error searching StackExchange for '{query}': {e}")

        return results

    async def _search_medium(self, queries: List[str], max_results: int) -> List[DiscussionResult]:
        results = []
        max_per_query = max(1, max_results // len(queries)) if queries else max_results

        for query in queries[:5]:
            try:
                search_url = f"https://medium.com/search?q={quote_plus(query)}"

                response = await self.client.get(search_url)
                if response.status_code != 200:
                    continue

                soup = BeautifulSoup(response.text, "html.parser")
                article_elements = soup.find_all("article")[:max_per_query]
                if not article_elements:
                    article_elements = soup.find_all("div", class_=lambda x: x and "post" in x.lower() if x else False)[:max_per_query]

                for el in article_elements:
                    try:
                        title_el = el.find(["h1", "h2", "h3"]) or el.find("a")
                        if not title_el:
                            continue

                        title = title_el.get_text(strip=True)
                        link_el = el.find("a", href=True)
                        url = ""
                        if link_el:
                            href = link_el.get("href", "")
                            if href.startswith("http"):
                                url = href
                            elif href.startswith("/"):
                                url = f"https://medium.com{href}"

                        content_el = el.find("p")
                        content = content_el.get_text(strip=True)[:300] if content_el else title

                        if title and url:
                            results.append(DiscussionResult(
                                source="medium",
                                platform="Medium",
                                title=title[:200],
                                url=url,
                                content=content,
                                query=query,
                                tags=["article", "blog"],
                            ))
                    except Exception:
                        continue
            except Exception as e:
                print(f"Error searching Medium for '{query}': {e}")

        return results

    async def _search_web(self, queries: List[str], max_results: int) -> List[DiscussionResult]:
        results = []
        max_per_query = max(1, max_results // len(queries)) if queries else max_results

        for query in queries[:5]:
            try:
                encoded_query = quote_plus(query)
                search_url = f"https://html.duckduckgo.com/html/?q={encoded_query}"

                response = await self.client.get(search_url)
                if response.status_code != 200:
                    continue

                soup = BeautifulSoup(response.text, "html.parser")
                result_elements = soup.find_all("div", class_="result")[:max_per_query]

                for el in result_elements:
                    try:
                        title_el = el.find("a", class_="result__a")
                        if not title_el:
                            continue

                        title = title_el.get_text(strip=True)
                        url = title_el.get("href", "")

                        snippet_el = el.find("a", class_="result__snippet")
                        content = snippet_el.get_text(strip=True)[:300] if snippet_el else title

                        if title and url:
                            results.append(DiscussionResult(
                                source="web",
                                platform="Web Search",
                                title=title[:200],
                                url=url,
                                content=content,
                                query=query,
                                tags=["web", "search-result"],
                            ))
                    except Exception:
                        continue
            except Exception as e:
                print(f"Error searching web for '{query}': {e}")

        return results

    def format_results_for_analysis(self, results: Dict[str, List[DiscussionResult]]) -> str:
        """Format all results into a text string for LLM analysis."""
        sections = []

        for source_name, discussions in results.items():
            if not discussions:
                continue

            sections.append(f"\n{'='*60}")
            sections.append(f"SOURCE: {source_name.upper()}")
            sections.append(f"{'='*60}\n")

            for i, disc in enumerate(discussions[:15], 1):
                sections.append(f"\n[{i}] {disc.title}")
                sections.append(f"Platform: {disc.platform}")
                sections.append(f"URL: {disc.url}")
                if disc.upvotes:
                    sections.append(f"Engagement: {disc.upvotes} upvotes")
                if disc.tags:
                    sections.append(f"Tags: {', '.join(disc.tags[:3])}")
                sections.append(f"Content: {disc.content[:300]}")
                sections.append("-" * 40)

        return "\n".join(sections)

    async def close(self):
        """Close the HTTP client."""
        if self.client:
            await self.client.aclose()
