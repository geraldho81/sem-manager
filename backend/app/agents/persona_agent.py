from typing import Any, Dict

from app.agents.base import BaseAgent
from app.services.kimi_client import KimiClient
from app.services.multi_source_scraper import MultiSourceScraper
from app.utils.prompts import PERSONA_RESEARCH_PROMPT


class PersonaAgent(BaseAgent):
    """Agent that creates audience personas from multi-source research."""

    def __init__(self, project_id: str, kimi_client: KimiClient, multi_scraper: MultiSourceScraper):
        super().__init__(project_id, kimi_client, use_large_model=False)
        self.agent_name = "PersonaAgent"
        self.multi_scraper = multi_scraper

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        brand_research = input_data["brand_research"]
        market = input_data.get("market", "United States")

        brand_name = brand_research.get("brand_name", "Unknown")
        industry = brand_research.get("industry", "")
        products = brand_research.get("products_services", [])
        audience = brand_research.get("target_audience", "")

        # Build search queries from brand context
        queries = [
            f"{industry} customer problems",
            f"why choose {industry} services",
            f"{industry} buying decision",
            f"best {products[0] if products else industry}",
            f"{industry} customer reviews complaints",
        ]

        await self.emit_progress("running", 15, "Searching Reddit, Quora, forums...")

        async def progress_cb(source: str, pct: int):
            await self.emit_progress("running", 15 + int(pct * 0.4), f"Researching on {source}...")

        research_results = await self.multi_scraper.search_all_sources(
            queries=queries,
            max_results_per_query=8,
            progress_callback=progress_cb,
        )

        research_text = self.multi_scraper.format_results_for_analysis(research_results)

        # Count sources
        source_counts = {k: len(v) for k, v in research_results.items()}

        await self.emit_progress("running", 60, "Building audience personas with AI...")

        prompt = PERSONA_RESEARCH_PROMPT.format(
            brand_name=brand_name,
            industry=industry,
            products_services=", ".join(products),
            initial_audience=audience,
            market=market,
            research_content=research_text[:15000],
        )

        result = await self.kimi_client.chat(
            prompt=prompt,
            system_prompt="You are a market research specialist. Return valid JSON with detailed personas.",
            use_large_model=False,
        )

        result["research_sources"] = source_counts

        persona_count = len(result.get("personas", []))
        await self.emit_progress("running", 95, f"Created {persona_count} personas")

        return result
