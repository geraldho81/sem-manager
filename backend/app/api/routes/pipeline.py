from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any
from datetime import datetime
import tempfile
import os

from app.models import AgentStatus, PipelineStatus, ProjectStatus, AgentProgress
from app.api.routes.projects import projects_db
from app.services.pipeline_orchestrator import PipelineOrchestrator

router = APIRouter()

pipeline_status_db: Dict[str, PipelineStatus] = {}
pipeline_instances: Dict[str, PipelineOrchestrator] = {}


def update_agent_status(project_id: str, progress: AgentProgress):
    if project_id in pipeline_status_db:
        agents = pipeline_status_db[project_id].agents
        existing = None
        for i, agent in enumerate(agents):
            if agent.agent == progress.agent:
                existing = i
                break
        if existing is not None:
            agents[existing] = progress
        else:
            agents.append(progress)


async def run_pipeline_task(project_id: str, config: Dict[str, Any]):
    """Background task to run the pipeline."""
    def status_callback(progress: AgentProgress):
        update_agent_status(project_id, progress)

    # Use user-specified folder or fall back to temp
    user_folder = config.get("project_folder")
    if user_folder:
        project_folder = os.path.join(user_folder, project_id)
    else:
        project_folder = os.path.join(tempfile.gettempdir(), "sem-manager", project_id)
    os.makedirs(project_folder, exist_ok=True)

    orchestrator = PipelineOrchestrator(project_id, project_folder, status_callback)
    pipeline_instances[project_id] = orchestrator

    try:
        pipeline_status_db[project_id].status = AgentStatus.RUNNING
        pipeline_status_db[project_id].started_at = datetime.utcnow()
        projects_db[project_id]["status"] = ProjectStatus.RUNNING

        results = await orchestrator.run(
            landing_page_urls=config["landing_page_urls"],
            market=config["market"],
            competitor_urls=config.get("competitor_urls", []),
        )

        pipeline_status_db[project_id].status = AgentStatus.COMPLETED
        pipeline_status_db[project_id].completed_at = datetime.utcnow()
        pipeline_status_db[project_id].outputs = results
        projects_db[project_id]["status"] = ProjectStatus.COMPLETED
        projects_db[project_id]["project_folder"] = project_folder

    except Exception as e:
        pipeline_status_db[project_id].status = AgentStatus.FAILED
        pipeline_status_db[project_id].completed_at = datetime.utcnow()
        projects_db[project_id]["status"] = ProjectStatus.FAILED

    finally:
        if project_id in pipeline_instances:
            del pipeline_instances[project_id]


@router.post("/{project_id}/start")
async def start_pipeline(project_id: str, background_tasks: BackgroundTasks) -> Dict[str, str]:
    """Start the agent pipeline for a project."""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")

    project = projects_db[project_id]

    if project["status"] == ProjectStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Pipeline already running")

    if not project["config"]:
        raise HTTPException(status_code=400, detail="Project not configured")

    pipeline_status_db[project_id] = PipelineStatus(
        project_id=project_id,
        status=AgentStatus.PENDING,
        agents=[],
    )

    background_tasks.add_task(
        run_pipeline_task,
        project_id,
        project["config"],
    )

    return {"message": "Pipeline started", "project_id": project_id}


@router.get("/{project_id}/status")
async def get_pipeline_status(project_id: str) -> PipelineStatus:
    """Get current pipeline execution status."""
    if project_id not in pipeline_status_db:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    return pipeline_status_db[project_id]


@router.post("/{project_id}/cancel")
async def cancel_pipeline(project_id: str) -> Dict[str, str]:
    """Cancel a running pipeline."""
    if project_id not in pipeline_instances:
        raise HTTPException(status_code=404, detail="No running pipeline found")

    pipeline_instances[project_id].cancel()
    return {"message": "Pipeline cancellation requested"}
