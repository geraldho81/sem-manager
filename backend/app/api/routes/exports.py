from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
import json

from app.api.routes.projects import projects_db
from app.api.routes.pipeline import pipeline_status_db

router = APIRouter()


def _get_project_folder(project_id: str) -> Path:
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")

    project = projects_db[project_id]
    folder = project.get("project_folder")
    if not folder:
        raise HTTPException(status_code=404, detail="Pipeline has not been run yet")

    return Path(folder)


@router.get("/{project_id}/excel")
async def export_excel(project_id: str) -> FileResponse:
    """Download Media Plan Excel workbook."""
    project_path = _get_project_folder(project_id)

    xlsx_files = list(project_path.glob("media_plan_*.xlsx"))
    if not xlsx_files:
        raise HTTPException(status_code=404, detail="Excel file not found. Run the pipeline first.")

    xlsx_file = max(xlsx_files, key=lambda f: f.stat().st_mtime)

    return FileResponse(
        path=xlsx_file,
        filename=xlsx_file.name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/{project_id}/research")
async def export_research(project_id: str) -> JSONResponse:
    """Download full research JSON."""
    project_path = _get_project_folder(project_id)
    research_path = project_path / "research"

    if not research_path.exists():
        raise HTTPException(status_code=404, detail="Research not found")

    research = {}
    for file in research_path.glob("*.json"):
        with open(file, "r", encoding="utf-8") as f:
            research[file.stem] = json.load(f)

    if not research:
        raise HTTPException(status_code=404, detail="No research files found")

    return JSONResponse(content=research)


@router.get("/{project_id}/strategy")
async def export_strategy(project_id: str) -> JSONResponse:
    """Download strategy JSON."""
    if project_id not in pipeline_status_db:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    outputs = pipeline_status_db[project_id].outputs
    strategy = outputs.get("strategy")
    rsas = outputs.get("rsas")

    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")

    return JSONResponse(content={
        "strategy": strategy,
        "rsas": rsas,
    })
