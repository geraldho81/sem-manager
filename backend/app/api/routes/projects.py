from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from datetime import datetime
import uuid

from app.models import ProjectCreate, ProjectConfig, ProjectResponse, ProjectStatus
from app.config import MARKETS

router = APIRouter()

# In-memory project storage
projects_db: Dict[str, Dict[str, Any]] = {}


# --- Static routes MUST come before /{project_id} ---

@router.get("/")
async def list_projects() -> list:
    """List all projects."""
    result = []
    for p in projects_db.values():
        data = p.copy()
        if data["config"]:
            data["config"] = ProjectConfig(**data["config"])
        result.append(ProjectResponse(**data))
    return result


@router.get("/markets/list")
async def list_markets() -> Dict[str, Any]:
    """List all supported markets."""
    return {"markets": MARKETS}


@router.get("/browse-folder")
async def browse_folder() -> Dict[str, str]:
    """Open a native OS folder picker and return the selected path."""
    import asyncio
    import subprocess
    import sys

    if sys.platform != "darwin":
        raise HTTPException(status_code=501, detail="Folder picker is only available on macOS")

    def _pick_folder():
        result = subprocess.run(
            ["osascript", "-e", 'POSIX path of (choose folder with prompt "Select Output Folder")'],
            capture_output=True, text=True, timeout=120,
        )
        return result.stdout.strip().rstrip("/")

    try:
        loop = asyncio.get_event_loop()
        folder = await loop.run_in_executor(None, _pick_folder)
        if not folder:
            raise HTTPException(status_code=400, detail="No folder selected")
        return {"folder": folder}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Dynamic routes ---

@router.post("/", response_model=ProjectResponse)
async def create_project(project: ProjectCreate) -> ProjectResponse:
    """Create a new SEM project."""
    project_id = str(uuid.uuid4())[:8]
    now = datetime.utcnow()

    project_data = {
        "id": project_id,
        "name": project.name,
        "status": ProjectStatus.CREATED,
        "config": None,
        "created_at": now,
        "updated_at": now,
    }

    projects_db[project_id] = project_data
    return ProjectResponse(**project_data)


@router.post("/{project_id}/config")
async def set_project_config(project_id: str, config: ProjectConfig) -> Dict[str, str]:
    """Set project configuration (URLs + market)."""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")

    if config.market not in MARKETS:
        raise HTTPException(status_code=400, detail=f"Invalid market: {config.market}")

    projects_db[project_id]["config"] = config.model_dump()
    projects_db[project_id]["status"] = ProjectStatus.CONFIGURED
    projects_db[project_id]["updated_at"] = datetime.utcnow()

    return {"message": "Project configured", "project_id": project_id}


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str) -> ProjectResponse:
    """Get project details."""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")

    project_data = projects_db[project_id].copy()
    if project_data["config"]:
        project_data["config"] = ProjectConfig(**project_data["config"])

    return ProjectResponse(**project_data)
