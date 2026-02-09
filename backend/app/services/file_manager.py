from pathlib import Path
from typing import Any, Dict
import aiofiles


def _to_markdown(data: Dict[str, Any], title: str = "") -> str:
    """Convert agent output dict to readable markdown."""
    lines = []
    if title:
        lines.append(f"# {title}\n")
    _render_dict(data, lines, level=2)
    return "\n".join(lines)


def _render_dict(obj: Any, lines: list, level: int = 2):
    """Recursively render a dict/list structure as markdown."""
    if isinstance(obj, dict):
        for key, value in obj.items():
            heading = key.replace("_", " ").title()
            if isinstance(value, dict):
                lines.append(f"{'#' * level} {heading}\n")
                _render_dict(value, lines, level + 1)
            elif isinstance(value, list):
                lines.append(f"{'#' * level} {heading}\n")
                _render_list(value, lines, level + 1)
            else:
                lines.append(f"**{heading}:** {value}\n")
    else:
        lines.append(str(obj))


def _render_list(items: list, lines: list, level: int):
    """Render a list as markdown."""
    if not items:
        lines.append("*(none)*\n")
        return

    # Check if items are simple values or complex objects
    if all(isinstance(item, (str, int, float, bool)) for item in items):
        for item in items:
            lines.append(f"- {item}")
        lines.append("")
    else:
        for i, item in enumerate(items):
            if isinstance(item, dict):
                # Use a name/title field as sub-heading if available
                name = (
                    item.get("name")
                    or item.get("keyword")
                    or item.get("ad_group_name")
                    or item.get("cluster_name")
                    or item.get("text")
                    or f"Item {i + 1}"
                )
                lines.append(f"{'#' * level} {name}\n")
                for key, value in item.items():
                    if key in ("name", "keyword", "ad_group_name", "cluster_name"):
                        continue
                    heading = key.replace("_", " ").title()
                    if isinstance(value, list):
                        lines.append(f"**{heading}:**")
                        for v in value:
                            if isinstance(v, dict):
                                parts = [f"{k}: {val}" for k, val in v.items()]
                                lines.append(f"  - {' | '.join(parts)}")
                            else:
                                lines.append(f"  - {v}")
                        lines.append("")
                    elif isinstance(value, dict):
                        lines.append(f"**{heading}:**")
                        for k, v in value.items():
                            lines.append(f"  - {k.replace('_', ' ').title()}: {v}")
                        lines.append("")
                    else:
                        lines.append(f"**{heading}:** {value}\n")
            else:
                lines.append(f"- {item}")
        if not isinstance(items[-1], dict):
            lines.append("")


TITLES = {
    "brand_research": "Brand Research",
    "competitor_research": "Competitor Research",
    "persona_research": "Audience Personas",
    "keyword_research": "Keyword Research",
    "synthesis": "Research Synthesis",
    "strategy": "Paid Search Strategy",
}


class FileManager:
    """Manages file operations for project data."""

    def __init__(self, project_folder: str):
        self.project_folder = Path(project_folder)
        self._ensure_structure()

    def _ensure_structure(self):
        (self.project_folder / "research").mkdir(parents=True, exist_ok=True)
        (self.project_folder / "ads").mkdir(parents=True, exist_ok=True)

    async def save_research(self, filename: str, data: Dict[str, Any]) -> str:
        """Save research output as .md only."""
        title = TITLES.get(filename, filename.replace("_", " ").title())
        md_content = _to_markdown(data, title)
        md_path = self.project_folder / "research" / f"{filename}.md"
        async with aiofiles.open(md_path, "w", encoding="utf-8") as f:
            await f.write(md_content)
        return str(md_path)

    async def save_ads(self, filename: str, data: Any) -> str:
        """Save ads output as .md only."""
        md_filename = filename.rsplit(".", 1)[0] + ".md"
        md_path = self.project_folder / "ads" / md_filename
        md_content = _to_markdown(data if isinstance(data, dict) else {"data": data}, "RSA Ads")
        async with aiofiles.open(md_path, "w", encoding="utf-8") as f:
            await f.write(md_content)
        return str(md_path)

    def get_project_path(self) -> Path:
        return self.project_folder
