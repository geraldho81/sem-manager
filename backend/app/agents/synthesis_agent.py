from typing import Any, Dict

from app.agents.base import BaseAgent
from app.services.kimi_client import KimiClient
from app.utils.prompts import SYNTHESIS_PROMPT


class SynthesisAgent(BaseAgent):
    """Agent that synthesizes all research into a comprehensive summary."""

    def __init__(self, project_id: str, kimi_client: KimiClient):
        super().__init__(project_id, kimi_client, use_large_model=True)
        self.agent_name = "SynthesisAgent"

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        brand_research = input_data["brand_research"]
        competitor_research = input_data["competitor_research"]
        persona_research = input_data["persona_research"]
        keyword_research = input_data["keyword_research"]
        market = input_data.get("market", "United States")

        await self.emit_progress("running", 20, "Combining all research findings...")

        # Truncate large inputs to fit context
        prompt = SYNTHESIS_PROMPT.format(
            brand=str(brand_research)[:3000],
            competitors=str(competitor_research)[:3000],
            personas=str(persona_research)[:4000],
            keywords=str(keyword_research)[:4000],
            market=market,
        )

        await self.emit_progress("running", 50, "Synthesizing insights with AI...")

        result = await self.kimi_client.chat(
            prompt=prompt,
            system_prompt="You are a senior marketing strategist. Return valid JSON with comprehensive synthesis.",
            use_large_model=True,
        )

        insights_count = len(result.get("key_insights", []))
        await self.emit_progress("running", 95, f"Synthesis complete: {insights_count} key insights")

        return result
