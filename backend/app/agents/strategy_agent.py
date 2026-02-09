from typing import Any, Dict

from app.agents.base import BaseAgent
from app.services.kimi_client import KimiClient
from app.config import MARKETS
from app.utils.prompts import STRATEGY_PROMPT


class StrategyAgent(BaseAgent):
    """Agent that creates the paid search strategy with ad group recommendations."""

    def __init__(self, project_id: str, kimi_client: KimiClient):
        super().__init__(project_id, kimi_client, use_large_model=True)
        self.agent_name = "StrategyAgent"

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        synthesis = input_data["synthesis"]
        keyword_research = input_data["keyword_research"]
        persona_research = input_data["persona_research"]
        market_key = input_data.get("market", "us")

        market = MARKETS.get(market_key, MARKETS["us"])

        await self.emit_progress("running", 20, "Building paid search strategy...")

        prompt = STRATEGY_PROMPT.format(
            synthesis=str(synthesis)[:5000],
            keyword_clusters=str(keyword_research.get("clusters", []))[:5000],
            personas=str(persona_research.get("personas", []))[:3000],
            market=market["name"],
            currency=market["currency"],
        )

        await self.emit_progress("running", 50, "Creating ad group structure...")

        result = await self.kimi_client.chat(
            prompt=prompt,
            system_prompt="You are an expert paid search strategist. Return valid JSON.",
            use_large_model=True,
        )

        ad_group_count = len(result.get("ad_groups", []))
        await self.emit_progress("running", 95, f"Strategy complete: {ad_group_count} ad groups")

        return result
