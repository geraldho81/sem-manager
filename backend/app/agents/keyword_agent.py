from typing import Any, Dict, List
from urllib.parse import urlparse

from app.agents.base import BaseAgent
from app.services.kimi_client import KimiClient
from app.services.dataforseo_client import DataForSEOClient
from app.config import MARKETS
from app.utils.prompts import KEYWORD_CLUSTERING_PROMPT


class KeywordAgent(BaseAgent):
    """Agent that performs keyword research using DataForSEO + AI clustering."""

    def __init__(self, project_id: str, kimi_client: KimiClient, dataforseo_client: DataForSEOClient):
        super().__init__(project_id, kimi_client, use_large_model=False)
        self.agent_name = "KeywordAgent"
        self.dataforseo = dataforseo_client

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        brand_research = input_data["brand_research"]
        persona_research = input_data.get("persona_research", {})
        market_key = input_data.get("market", "us")
        landing_page_urls = input_data.get("landing_page_urls", [])

        market = MARKETS.get(market_key, MARKETS["us"])
        location_code = market["location_code"]
        language = market["language"]
        currency = market["currency"]

        all_keywords = []

        # Step 1: Get keywords from domains
        await self.emit_progress("running", 10, "Fetching keywords from landing page domains...")

        domains = list(set(urlparse(url).netloc for url in landing_page_urls if url))

        for domain in domains[:3]:
            await self.emit_progress("running", 15, f"Fetching keywords for {domain}...")
            site_keywords = await self.dataforseo.get_keywords_for_site(
                domain=domain,
                location_code=location_code,
                language=language,
                limit=50,
            )
            all_keywords.extend(site_keywords)

        # Step 2: Get related keywords from seed keywords
        seed_keywords = brand_research.get("seed_keywords", [])
        if not seed_keywords:
            # Fallback: use products/services as seeds
            seed_keywords = brand_research.get("products_services", [])[:5]

        # Also add persona search queries as seeds
        personas = persona_research.get("personas", [])
        for persona in personas[:3]:
            seed_keywords.extend(persona.get("sample_search_queries", [])[:3])

        await self.emit_progress("running", 35, f"Expanding {len(seed_keywords)} seed keywords...")

        for i, seed in enumerate(seed_keywords[:8]):
            progress = 35 + int((i / max(len(seed_keywords[:8]), 1)) * 30)
            await self.emit_progress("running", progress, f"Expanding: {seed[:30]}...")

            related = await self.dataforseo.get_related_keywords(
                seed_keyword=seed,
                location_code=location_code,
                language=language,
                limit=20,
            )
            all_keywords.extend(related)

        # Deduplicate
        seen = set()
        unique_keywords = []
        for kw in all_keywords:
            keyword_text = kw.get("keyword", "").lower().strip()
            if keyword_text and keyword_text not in seen:
                seen.add(keyword_text)
                unique_keywords.append(kw)

        await self.emit_progress(
            "running", 70,
            f"Found {len(unique_keywords)} unique keywords. Clustering with AI..."
        )

        # If no keywords from DataForSEO, use Kimi-extracted keywords
        if not unique_keywords:
            await self.emit_progress("running", 72, "DataForSEO returned no data. Using AI-extracted keywords...")
            unique_keywords = [
                {"keyword": kw, "search_volume": None, "cpc": None, "competition": None}
                for kw in seed_keywords
            ]

        # Step 3: Cluster with AI
        keyword_data_str = "\n".join(
            f"- {kw['keyword']} | Volume: {kw.get('search_volume', 'N/A')} | "
            f"CPC: {kw.get('cpc', 'N/A')} {currency} | Competition: {kw.get('competition', 'N/A')}"
            for kw in unique_keywords[:100]
        )

        prompt = KEYWORD_CLUSTERING_PROMPT.format(
            keyword_data=keyword_data_str,
            brand_context=str({
                "brand_name": brand_research.get("brand_name"),
                "industry": brand_research.get("industry"),
                "products_services": brand_research.get("products_services"),
                "value_propositions": brand_research.get("value_propositions"),
            }),
            market=market["name"],
            currency=currency,
        )

        clusters = await self.kimi_client.chat(
            prompt=prompt,
            system_prompt="You are a paid search keyword strategist. Return valid JSON.",
        )

        await self.emit_progress("running", 95, f"Organized into {len(clusters.get('clusters', []))} clusters")

        return {
            "clusters": clusters.get("clusters", []),
            "negative_keywords": clusters.get("negative_keywords", []),
            "keyword_gaps": clusters.get("keyword_gaps", []),
            "total_keywords": len(unique_keywords),
            "market": market_key,
            "currency": currency,
            "raw_keywords": unique_keywords[:200],
        }
