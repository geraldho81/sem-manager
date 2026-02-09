from typing import Any, Dict, List

from app.agents.base import BaseAgent
from app.services.kimi_client import KimiClient
from app.services.scraper import WebScraper
from app.utils.prompts import LANDING_PAGE_ANALYSIS_PROMPT


class LandingPageAgent(BaseAgent):
    """Agent that crawls and analyzes multiple landing page URLs."""

    def __init__(self, project_id: str, kimi_client: KimiClient, scraper: WebScraper):
        super().__init__(project_id, kimi_client, use_large_model=False)
        self.agent_name = "LandingPageAgent"
        self.scraper = scraper

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        urls: List[str] = input_data["landing_page_urls"]

        await self.emit_progress("running", 10, f"Crawling {len(urls)} landing page(s)...")

        all_content = []
        for i, url in enumerate(urls):
            progress = 10 + int((i / len(urls)) * 40)
            await self.emit_progress("running", progress, f"Crawling {url}...")

            content = await self.scraper.crawl_site(url, max_pages=5)
            all_content.append(f"=== URL: {url} ===\n{content}")

        combined_content = "\n\n".join(all_content)

        await self.emit_progress("running", 60, "Analyzing brand content with AI...")

        prompt = LANDING_PAGE_ANALYSIS_PROMPT.format(content=combined_content)

        result = await self.kimi_client.chat(
            prompt=prompt,
            system_prompt="You are a brand research specialist. Always respond with valid JSON.",
            use_large_model=False,
        )

        await self.emit_progress("running", 95, "Brand analysis complete")

        return result
