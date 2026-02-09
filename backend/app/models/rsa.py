from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Optional, Literal


class KeywordWithMatch(BaseModel):
    text: str
    match_type: Literal["broad", "phrase", "exact"] = "broad"
    cpc: float = 1.0
    monthly_volume: Optional[int] = None
    currency: str = "USD"


class Headline(BaseModel):
    text: str = Field(max_length=30)

    @field_validator("text")
    @classmethod
    def validate_headline_length(cls, v):
        if len(v) > 30:
            words = v.split()
            result = []
            length = 0
            for word in words:
                if length + len(word) + (1 if result else 0) <= 30:
                    result.append(word)
                    length += len(word) + (1 if len(result) > 1 else 0)
                else:
                    break
            return " ".join(result) if result else v[:30]
        return v


class Description(BaseModel):
    text: str = Field(max_length=90)

    @field_validator("text")
    @classmethod
    def validate_description_length(cls, v):
        if len(v) > 90:
            words = v.split()
            result = []
            length = 0
            for word in words:
                if length + len(word) + (1 if result else 0) <= 90:
                    result.append(word)
                    length += len(word) + (1 if len(result) > 1 else 0)
                else:
                    break
            return " ".join(result) if result else v[:90]
        return v


class AdGroupRSA(BaseModel):
    ad_group_name: str
    keywords: List[KeywordWithMatch]
    cpc_bid: float
    headlines: List[Headline] = Field(min_length=3, max_length=15)
    descriptions: List[Description] = Field(min_length=2, max_length=4)


class AdGroupPlan(BaseModel):
    name: str
    keywords: List[KeywordWithMatch]
    cpc_bid: float
    headlines: List[str]
    descriptions: List[str]
    headline_pins: Dict[int, int] = Field(default_factory=dict)
    description_pins: Dict[int, int] = Field(default_factory=dict)


class MediaPlan(BaseModel):
    campaign_name: str
    landing_page_urls: List[str]
    market: str
    currency: str
    ad_groups: List[AdGroupPlan]
