from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class ProjectStatus(str, Enum):
    CREATED = "created"
    CONFIGURED = "configured"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectConfig(BaseModel):
    landing_page_urls: List[str] = Field(min_length=1)
    market: str  # Market key from MARKETS dict (e.g., "sg", "us")
    competitor_urls: List[str] = Field(default_factory=list)
    project_folder: str  # User-chosen output folder


class ProjectResponse(BaseModel):
    id: str
    name: str
    status: ProjectStatus
    config: Optional[ProjectConfig] = None
    created_at: datetime
    updated_at: datetime
