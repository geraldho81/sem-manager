from typing import Any, Dict, List

from app.agents.base import BaseAgent
from app.services.kimi_client import KimiClient
from app.services.scraper import WebScraper
from app.utils.prompts import COMPETITOR_ANALYSIS_PROMPT, COMPETITOR_DISCOVERY_PROMPT


class CompetitorAgent(BaseAgent):
    """Agent that discovers and analyzes competitors."""

    def __init__(self, project_id: str, kimi_client: KimiClient, scraper: WebScraper):
        super().__init__(project_id, kimi_client, use_large_model=False)
        self.agent_name = "CompetitorAgent"
        self.scraper = scraper

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        brand_research = input_data["brand_research"]
        competitor_urls = input_data.get("competitor_urls", [])

        # Auto-discover competitors if none provided
        if not competitor_urls:
            await self.emit_progress("running", 10, "Auto-discovering competitors...")
            discovery = await self.kimi_client.chat(
                prompt=COMPETITOR_DISCOVERY_PROMPT.format(
                    brand_analysis=str(brand_research)
                ),
                system_prompt="You are a competitive intelligence analyst. Return valid JSON.",
            )
            discovered = discovery.get("likely_competitors", [])
            competitor_urls = [c.get("url", "") for c in discovered if c.get("url")]
            await self.emit_progress(
                "running", 20,
                f"Discovered {len(competitor_urls)} competitor(s)"
            )

        competitors = []
        total = len(competitor_urls)

        for i, url in enumerate(competitor_urls[:5]):  # Limit to 5
            progress = 20 + int((i / max(total, 1)) * 60)
            await self.emit_progress("running", progress, f"Analyzing competitor: {url}")

            try:
                page_data = await self.scraper.scrape_page(url)
                if page_data.get("error"):
                    continue

                prompt = COMPETITOR_ANALYSIS_PROMPT.format(
                    content=str(page_data),
                    our_brand=str(brand_research),
                )

                analysis = await self.kimi_client.chat(
                    prompt=prompt,
                    system_prompt="You are a competitive intelligence analyst. Return valid JSON.",
                )

                analysis["url"] = url
                competitors.append(analysis)

            except Exception as e:
                print(f"Error analyzing competitor {url}: {e}")
                continue

        # Summarize competitive landscape
        await self.emit_progress("running", 85, "Summarizing competitive landscape...")

        return {
            "competitors": competitors,
            "competitive_advantages": brand_research.get("unique_selling_points", []),
            "gaps_opportunities": [],
            "total_analyzed": len(competitors),
        }
