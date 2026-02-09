from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from datetime import datetime
import asyncio

from app.services.kimi_client import KimiClient
from app.api.websocket import manager
from app.config import settings


class BaseAgent(ABC):
    """Base class for all agents in the pipeline."""

    def __init__(
        self,
        project_id: str,
        kimi_client: KimiClient,
        use_large_model: bool = False,
    ):
        self.project_id = project_id
        self.kimi_client = kimi_client
        self.use_large_model = use_large_model
        self.agent_name: str = "BaseAgent"

    async def emit_progress(self, status: str, progress: int, message: str):
        """Emit progress update via WebSocket."""
        await manager.broadcast_to_project(
            self.project_id,
            {
                "agent": self.agent_name,
                "status": status,
                "progress": progress,
                "message": message,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    @abstractmethod
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent's task. Must be implemented by subclasses."""
        pass

    async def run_with_retry(
        self,
        input_data: Dict[str, Any],
        max_retries: int = None,
    ) -> Dict[str, Any]:
        """Execute the agent's task with retry logic."""
        if max_retries is None:
            max_retries = settings.MAX_RETRIES

        last_error = None

        for attempt in range(max_retries):
            try:
                await self.emit_progress(
                    "running",
                    0,
                    f"Starting {self.agent_name}{'...' if attempt == 0 else f' (retry {attempt})'}",
                )

                result = await self.execute(input_data)

                await self.emit_progress(
                    "completed",
                    100,
                    f"{self.agent_name} completed successfully",
                )

                return result

            except Exception as e:
                last_error = e
                error_msg = str(e)

                if attempt < max_retries - 1:
                    wait_time = settings.RETRY_DELAY * (2 ** attempt)
                    await self.emit_progress(
                        "running",
                        0,
                        f"{self.agent_name} error: {error_msg[:100]}. Retrying in {wait_time}s...",
                    )
                    await asyncio.sleep(wait_time)
                else:
                    await self.emit_progress(
                        "failed",
                        0,
                        f"{self.agent_name} failed after {max_retries} attempts: {error_msg[:100]}",
                    )

        raise last_error
