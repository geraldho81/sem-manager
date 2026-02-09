from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from pathlib import Path
import io
import zipfile

from app.api.routes.projects import projects_db

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


@router.get("/{project_id}/zip")
async def export_zip(project_id: str):
    """Download all outputs as a single zip: .md files + .xlsx media plan."""
    project_path = _get_project_folder(project_id)

    project_name = projects_db[project_id].get("name", "sem_export")
    safe_name = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in project_name)

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        # Add .md files from research/ and ads/ subfolders
        for subfolder in ("research", "ads"):
            folder = project_path / subfolder
            if folder.exists():
                for md_file in sorted(folder.glob("*.md")):
                    zf.write(md_file, f"{subfolder}/{md_file.name}")

        # Add .xlsx media plan
        xlsx_files = list(project_path.glob("media_plan_*.xlsx"))
        if xlsx_files:
            xlsx_file = max(xlsx_files, key=lambda f: f.stat().st_mtime)
            zf.write(xlsx_file, xlsx_file.name)

    buf.seek(0)

    if buf.getbuffer().nbytes <= 22:  # Empty zip is ~22 bytes
        raise HTTPException(status_code=404, detail="No output files found. Run the pipeline first.")

    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}_export.zip"'},
    )
