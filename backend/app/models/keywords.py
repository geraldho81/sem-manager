from pydantic import BaseModel
from typing import List, Optional


class KeywordData(BaseModel):
    keyword: str
    search_volume: Optional[int] = None
    cpc: Optional[float] = None
    competition: Optional[float] = None
    difficulty: Optional[int] = None
    currency: str = "USD"


class KeywordCluster(BaseModel):
    cluster_name: str
    theme: str
    keywords: List[KeywordData]
    total_volume: int = 0
    avg_cpc: float = 0.0
