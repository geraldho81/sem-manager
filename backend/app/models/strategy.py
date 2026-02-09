from pydantic import BaseModel
from typing import List, Optional, Dict


class AdGroupStrategy(BaseModel):
    name: str
    theme: str
    keywords: List[str]
    match_types: Dict[str, str] = {}  # keyword -> match_type
    target_persona: str = ""
    messaging_angle: str = ""
    priority: str = "medium"  # high, medium, low
    suggested_bid: float = 1.0


class PaidSearchStrategy(BaseModel):
    campaign_name: str
    objective: str
    budget_recommendation: str
    ad_groups: List[AdGroupStrategy]
    negative_keywords: List[str] = []
    bidding_strategy: str = ""
    targeting_notes: str = ""
