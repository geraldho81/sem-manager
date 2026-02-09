from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class AgentStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class AgentProgress(BaseModel):
    agent: str
    status: AgentStatus
    progress: int = 0
    message: str = ""
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None


class PipelineStatus(BaseModel):
    project_id: str
    status: AgentStatus
    current_agent: Optional[str] = None
    agents: List[AgentProgress]
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    outputs: Dict[str, Any] = Field(default_factory=dict)
