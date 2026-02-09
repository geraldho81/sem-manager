from pydantic import BaseModel
from typing import List, Optional


class BrandResearch(BaseModel):
    brand_name: str
    brand_voice: str
    value_propositions: List[str]
    products_services: List[str]
    target_audience: str
    key_messages: List[str]
    unique_selling_points: List[str]
    call_to_actions: List[str]
    industry: str = ""


class CompetitorAnalysis(BaseModel):
    url: str
    brand_name: str
    positioning: str
    key_messages: List[str]
    strengths: List[str]
    weaknesses: List[str]


class CompetitorResearch(BaseModel):
    competitors: List[CompetitorAnalysis]
    competitive_advantages: List[str]
    gaps_opportunities: List[str]
