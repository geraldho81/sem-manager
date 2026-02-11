import asyncio
from typing import Any, Dict, List

from app.agents.base import BaseAgent
from app.services.kimi_client import KimiClient
from app.models.rsa import Headline, Description, AdGroupRSA, KeywordWithMatch
from app.utils.prompts import RSA_GENERATION_PROMPT


class RSAAgent(BaseAgent):
    """Agent that generates RSA ad copy for each ad group."""

    def __init__(self, project_id: str, kimi_client: KimiClient):
        super().__init__(project_id, kimi_client, use_large_model=True)
        self.agent_name = "RSAAgent"

    INCOMPLETE_ENDINGS = {
        'the', 'a', 'an', 'in', 'for', 'and', 'of', 'to', 'with', 'by',
        'at', 'on', 'is', 'are', 'your', 'our', 'their', 'its', 'as',
        'from', 'that', 'this', 'or', 'be', 'we', 'you', "you'll",
    }

    def _fit_to_limit(self, text: str, max_chars: int) -> str:
        text = text.strip().rstrip(':').rstrip('...').rstrip('\u2026').strip()

        if len(text) <= max_chars:
            text = self._remove_incomplete_ending(text)
            return text

        words = text.split()
        result = []
        current_length = 0

        for word in words:
            word_length = len(word)
            space_needed = 1 if result else 0
            new_length = current_length + space_needed + word_length

            if new_length <= max_chars:
                result.append(word)
                current_length = new_length
            else:
                break

        final_text = " ".join(result)
        return self._remove_incomplete_ending(final_text)

    def _remove_incomplete_ending(self, text: str) -> str:
        words = text.split()
        while words and words[-1].lower().rstrip(',:') in self.INCOMPLETE_ENDINGS:
            words.pop()
        return " ".join(words) if words else text

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        strategy = input_data["strategy"]
        synthesis = input_data["synthesis"]
        brand_research = input_data["brand_research"]
        market_key = input_data.get("market", "us")
        currency = input_data.get("currency", "USD")

        ad_groups = strategy.get("ad_groups", [])
        total = len(ad_groups)

        await self.emit_progress(
            "running", 10,
            f"Generating RSAs for {total} ad groups in parallel...",
        )

        tasks = [
            self._generate_rsa_for_ad_group(
                ad_group=ad_group,
                synthesis=synthesis,
                brand_research=brand_research,
                currency=currency,
            )
            for ad_group in ad_groups
        ]
        all_rsas = await asyncio.gather(*tasks)

        await self.emit_progress("running", 95, "Finalizing RSA generation...")

        return {"ad_group_rsas": [rsa.model_dump() for rsa in all_rsas]}

    async def _generate_rsa_for_ad_group(
        self,
        ad_group: Dict,
        synthesis: Dict,
        brand_research: Dict,
        currency: str,
    ) -> AdGroupRSA:
        keywords = ad_group.get("keywords", [])
        keyword_texts = []
        for kw in keywords[:15]:
            if isinstance(kw, dict):
                keyword_texts.append(kw.get("keyword", kw.get("text", str(kw))))
            else:
                keyword_texts.append(str(kw))

        messaging = synthesis.get("messaging_framework", {})

        prompt = RSA_GENERATION_PROMPT.format(
            ad_group_name=ad_group.get("name", ""),
            ad_group_theme=ad_group.get("theme", ""),
            keywords=", ".join(keyword_texts),
            target_persona=ad_group.get("target_persona", ""),
            messaging_angle=ad_group.get("messaging_angle", ""),
            brand_voice=brand_research.get("brand_voice", "professional"),
            value_props=", ".join(brand_research.get("value_propositions", [])[:5]),
            ctas=", ".join(brand_research.get("call_to_actions", ["Learn More", "Get Started"])[:5]),
            strategy_context=str({
                "primary_message": messaging.get("primary_message", ""),
                "tone_guidelines": messaging.get("tone_guidelines", ""),
                "proof_points": messaging.get("proof_points", []),
            }),
        )

        response = await self.kimi_client.chat(
            prompt=prompt,
            use_large_model=True,
            temperature=0.7,
            system_prompt="You are an expert Google Ads copywriter. Always respond with valid JSON. Never truncate words.",
        )

        # Parse headlines
        headlines = []
        for h in response.get("headlines", [])[:15]:
            text = h.get("text", "") if isinstance(h, dict) else str(h)
            text = self._fit_to_limit(text.strip(), 30)
            if text:
                headlines.append(Headline(text=text))

        brand_name = brand_research.get('brand_name', 'Get Started')
        fallback_headlines = [
            f"{brand_name[:20]} Solutions",
            "Get Started Today",
            "Learn More Now",
        ]
        while len(headlines) < 3:
            fallback = fallback_headlines[len(headlines) % len(fallback_headlines)]
            headlines.append(Headline(text=self._fit_to_limit(fallback, 30)))

        # Parse descriptions
        descriptions = []
        for d in response.get("descriptions", [])[:4]:
            text = d.get("text", "") if isinstance(d, dict) else str(d)
            text = self._fit_to_limit(text.strip(), 90)
            if text:
                descriptions.append(Description(text=text))

        fallback_descriptions = [
            f"Discover {brand_name}. Get started with us today.",
            f"Learn how {brand_name} can help you. Contact us now.",
        ]
        while len(descriptions) < 2:
            fallback = fallback_descriptions[len(descriptions) % len(fallback_descriptions)]
            descriptions.append(Description(text=self._fit_to_limit(fallback, 90)))

        # Build keyword objects
        keyword_objects = []
        for kw in keywords:
            if isinstance(kw, dict):
                keyword_objects.append(KeywordWithMatch(
                    text=kw.get("keyword", kw.get("text", str(kw))),
                    match_type=kw.get("recommended_match_type", kw.get("match_type", "broad")),
                    cpc=kw.get("cpc") or ad_group.get("suggested_bid", 1.0),
                    monthly_volume=kw.get("search_volume", kw.get("monthly_volume")),
                    currency=currency,
                ))
            else:
                keyword_objects.append(KeywordWithMatch(
                    text=str(kw),
                    match_type="broad",
                    cpc=ad_group.get("suggested_bid", 1.0),
                    currency=currency,
                ))

        return AdGroupRSA(
            ad_group_name=ad_group.get("name", "Ad Group"),
            keywords=keyword_objects,
            cpc_bid=ad_group.get("suggested_bid", 1.0),
            headlines=headlines,
            descriptions=descriptions,
        )
