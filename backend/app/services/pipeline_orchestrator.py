from typing import Dict, Any, List, Optional, Callable
import asyncio
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from app.models import AgentProgress, AgentStatus
from app.config import MARKETS
from app.services.kimi_client import KimiClient
from app.services.scraper import WebScraper
from app.services.multi_source_scraper import MultiSourceScraper
from app.services.dataforseo_client import DataForSEOClient
from app.services.excel_exporter import ExcelExporter
from app.services.file_manager import FileManager

from app.agents.landing_page_agent import LandingPageAgent
from app.agents.competitor_agent import CompetitorAgent
from app.agents.persona_agent import PersonaAgent
from app.agents.keyword_agent import KeywordAgent
from app.agents.synthesis_agent import SynthesisAgent
from app.agents.strategy_agent import StrategyAgent
from app.agents.rsa_agent import RSAAgent


class PipelineOrchestrator:
    """Orchestrates the 6-stage, 7-agent pipeline."""

    def __init__(self, project_id: str, project_folder: str, status_callback: Optional[Callable] = None):
        self.project_id = project_id
        self.project_folder = project_folder
        self.kimi_client = KimiClient()
        self.scraper = WebScraper()
        self.multi_source_scraper = MultiSourceScraper()
        self.dataforseo_client = DataForSEOClient()
        self.excel_exporter = ExcelExporter()
        self.file_manager = FileManager(project_folder)
        self.cancelled = False
        self.status_callback = status_callback

    def _update_agent(self, agent: str, status: str, message: str = "", progress: int = 0):
        if self.status_callback:
            agent_progress = AgentProgress(
                agent=agent,
                status=AgentStatus(status),
                progress=progress,
                message=message,
                started_at=datetime.utcnow() if status == "running" else None,
                completed_at=datetime.utcnow() if status in ["completed", "failed"] else None,
            )
            self.status_callback(agent_progress)

    async def run(
        self,
        landing_page_urls: List[str],
        market: str,
        competitor_urls: List[str],
    ) -> Dict[str, Any]:
        """
        Execute the full 6-stage pipeline.

        Stage 1: LandingPageAgent (sequential)
        Stage 2: CompetitorAgent + PersonaAgent (parallel)
        Stage 3: KeywordAgent (sequential)
        Stage 4: SynthesisAgent (sequential)
        Stage 5: StrategyAgent (sequential)
        Stage 6: RSAAgent (sequential)
        """
        results = {}
        market_config = MARKETS.get(market, MARKETS["us"])
        market_name = market_config["name"]
        currency = market_config["currency"]

        logger.info(f"[{self.project_id}] Starting pipeline for market: {market_name}")
        self._update_agent("Pipeline", "running", "Pipeline started", 0)

        try:
            # ==========================================
            # Stage 1: Landing Page Agent
            # ==========================================
            logger.info(f"[{self.project_id}] Stage 1: LandingPageAgent")
            self._update_agent("LandingPageAgent", "running", f"Crawling {len(landing_page_urls)} URL(s)...", 5)

            lp_agent = LandingPageAgent(self.project_id, self.kimi_client, self.scraper)
            brand_research = await lp_agent.run_with_retry({
                "landing_page_urls": landing_page_urls,
            })

            brand_name = brand_research.get("brand_name", "Unknown")
            results["brand_research"] = brand_research
            await self.file_manager.save_research("brand_research", brand_research)
            self._update_agent("LandingPageAgent", "completed", f"Brand: {brand_name}", 100)

            if self.cancelled:
                return results

            # ==========================================
            # Stage 2: Competitor + Persona (parallel)
            # ==========================================
            logger.info(f"[{self.project_id}] Stage 2: CompetitorAgent + PersonaAgent (parallel)")
            self._update_agent("CompetitorAgent", "running", "Analyzing competitors...", 10)
            self._update_agent("PersonaAgent", "running", "Researching audience personas...", 10)

            competitor_agent = CompetitorAgent(self.project_id, self.kimi_client, self.scraper)
            persona_agent = PersonaAgent(self.project_id, self.kimi_client, self.multi_source_scraper)

            competitor_task = competitor_agent.run_with_retry({
                "brand_research": brand_research,
                "competitor_urls": competitor_urls,
            })

            persona_task = persona_agent.run_with_retry({
                "brand_research": brand_research,
                "market": market_name,
            })

            competitor_research, persona_research = await asyncio.gather(
                competitor_task, persona_task
            )

            results["competitor_research"] = competitor_research
            results["persona_research"] = persona_research
            await self.file_manager.save_research("competitor_research", competitor_research)
            await self.file_manager.save_research("persona_research", persona_research)

            comp_count = len(competitor_research.get("competitors", []))
            persona_count = len(persona_research.get("personas", []))
            self._update_agent("CompetitorAgent", "completed", f"Analyzed {comp_count} competitor(s)", 100)
            self._update_agent("PersonaAgent", "completed", f"Created {persona_count} persona(s)", 100)

            if self.cancelled:
                return results

            # ==========================================
            # Stage 3: Keyword Agent
            # ==========================================
            logger.info(f"[{self.project_id}] Stage 3: KeywordAgent")
            self._update_agent("KeywordAgent", "running", "Fetching keyword data from DataForSEO...", 10)

            keyword_agent = KeywordAgent(self.project_id, self.kimi_client, self.dataforseo_client)
            keyword_research = await keyword_agent.run_with_retry({
                "brand_research": brand_research,
                "persona_research": persona_research,
                "market": market,
                "landing_page_urls": landing_page_urls,
            })

            results["keyword_research"] = keyword_research
            await self.file_manager.save_research("keyword_research", keyword_research)

            kw_count = keyword_research.get("total_keywords", 0)
            cluster_count = len(keyword_research.get("clusters", []))
            self._update_agent("KeywordAgent", "completed", f"{kw_count} keywords in {cluster_count} clusters", 100)

            if self.cancelled:
                return results

            # ==========================================
            # Stage 4: Synthesis Agent
            # ==========================================
            logger.info(f"[{self.project_id}] Stage 4: SynthesisAgent")
            self._update_agent("SynthesisAgent", "running", "Synthesizing all research...", 20)

            synthesis_agent = SynthesisAgent(self.project_id, self.kimi_client)
            synthesis = await synthesis_agent.run_with_retry({
                "brand_research": brand_research,
                "competitor_research": competitor_research,
                "persona_research": persona_research,
                "keyword_research": keyword_research,
                "market": market_name,
            })

            results["synthesis"] = synthesis
            await self.file_manager.save_research("synthesis", synthesis)
            self._update_agent("SynthesisAgent", "completed", "Research synthesis complete", 100)

            if self.cancelled:
                return results

            # ==========================================
            # Stage 5: Strategy Agent
            # ==========================================
            logger.info(f"[{self.project_id}] Stage 5: StrategyAgent")
            self._update_agent("StrategyAgent", "running", "Building paid search strategy...", 20)

            strategy_agent = StrategyAgent(self.project_id, self.kimi_client)
            strategy = await strategy_agent.run_with_retry({
                "synthesis": synthesis,
                "keyword_research": keyword_research,
                "persona_research": persona_research,
                "market": market,
            })

            results["strategy"] = strategy
            await self.file_manager.save_research("strategy", strategy)

            ag_count = len(strategy.get("ad_groups", []))
            self._update_agent("StrategyAgent", "completed", f"Strategy: {ag_count} ad groups", 100)

            if self.cancelled:
                return results

            # ==========================================
            # Stage 6: RSA Agent
            # ==========================================
            logger.info(f"[{self.project_id}] Stage 6: RSAAgent")
            self._update_agent("RSAAgent", "running", f"Generating RSAs for {ag_count} ad group(s)...", 10)

            rsa_agent = RSAAgent(self.project_id, self.kimi_client)
            rsas = await rsa_agent.run_with_retry({
                "strategy": strategy,
                "synthesis": synthesis,
                "brand_research": brand_research,
                "market": market,
                "currency": currency,
            })

            results["rsas"] = rsas
            await self.file_manager.save_ads("rsa_ads.json", rsas)

            total_headlines = sum(
                len(ag.get("headlines", []))
                for ag in rsas.get("ad_group_rsas", [])
            )
            self._update_agent("RSAAgent", "completed", f"{total_headlines} headlines generated", 100)

            # Export Excel
            await self._export_excel(rsas, strategy, keyword_research, brand_research, landing_page_urls, brand_name, market, currency)

            logger.info(f"[{self.project_id}] Pipeline COMPLETE!")
            self._update_agent("Pipeline", "completed", "All agents finished successfully", 100)

            return results

        except Exception as e:
            logger.error(f"[{self.project_id}] Pipeline FAILED: {str(e)}")
            self._update_agent("Pipeline", "failed", f"Pipeline failed: {str(e)}", 0)
            raise

        finally:
            await self._cleanup()

    async def _export_excel(
        self,
        rsas: Dict,
        strategy: Dict,
        keyword_research: Dict,
        brand_research: Dict,
        landing_page_urls: List[str],
        brand_name: str,
        market: str,
        currency: str,
    ):
        """Export results to Excel workbook."""
        from app.models.rsa import MediaPlan, AdGroupPlan, KeywordWithMatch

        ad_group_plans = []
        for ag_rsa in rsas.get("ad_group_rsas", []):
            keywords = []
            for kw in ag_rsa.get("keywords", []):
                keywords.append(KeywordWithMatch(
                    text=kw.get("text", ""),
                    match_type=kw.get("match_type", "broad"),
                    cpc=kw.get("cpc", 1.0),
                    monthly_volume=kw.get("monthly_volume"),
                    currency=currency,
                ))

            ad_group_plans.append(AdGroupPlan(
                name=ag_rsa.get("ad_group_name", ""),
                keywords=keywords,
                cpc_bid=ag_rsa.get("cpc_bid", 1.0),
                headlines=[h.get("text", h) if isinstance(h, dict) else h for h in ag_rsa.get("headlines", [])],
                descriptions=[d.get("text", d) if isinstance(d, dict) else d for d in ag_rsa.get("descriptions", [])],
            ))

        media_plan = MediaPlan(
            campaign_name=strategy.get("campaign_name", f"SEM Campaign - {brand_name}"),
            landing_page_urls=landing_page_urls,
            market=market,
            currency=currency,
            ad_groups=ad_group_plans,
        )

        output_folder = str(self.file_manager.get_project_path())
        excel_path = await self.excel_exporter.export(
            media_plan, strategy, keyword_research, brand_research, output_folder,
        )
        logger.info(f"[{self.project_id}] Excel exported: {excel_path}")

    async def _cleanup(self):
        try:
            await self.scraper.close()
        except Exception:
            pass
        try:
            await self.multi_source_scraper.close()
        except Exception:
            pass
        try:
            await self.dataforseo_client.close()
        except Exception:
            pass

    def cancel(self):
        self.cancelled = True
