from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether,
)

from app.config import MARKETS


# Brand colors
PRIMARY = colors.HexColor("#1F4E79")
ACCENT = colors.HexColor("#3B82F6")
LIGHT_BG = colors.HexColor("#F0F4FA")
TEXT_COLOR = colors.HexColor("#333333")
MUTED_TEXT = colors.HexColor("#6B7280")
WHITE = colors.white
ROW_ALT = colors.HexColor("#F8FAFC")


class PDFExporter:
    """Generates a professional A4 PDF report from SEM pipeline results."""

    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._register_styles()
        self.story: List = []

    def _register_styles(self):
        self.styles.add(ParagraphStyle(
            "CoverTitle", fontName="Helvetica-Bold", fontSize=28,
            textColor=PRIMARY, alignment=TA_CENTER, spaceAfter=12,
        ))
        self.styles.add(ParagraphStyle(
            "CoverSub", fontName="Helvetica", fontSize=14,
            textColor=MUTED_TEXT, alignment=TA_CENTER, spaceAfter=6,
        ))
        self.styles.add(ParagraphStyle(
            "SectionTitle", fontName="Helvetica-Bold", fontSize=16,
            textColor=PRIMARY, spaceBefore=18, spaceAfter=10,
        ))
        self.styles.add(ParagraphStyle(
            "SubHeading", fontName="Helvetica-Bold", fontSize=12,
            textColor=PRIMARY, spaceBefore=12, spaceAfter=6,
        ))
        self.styles.add(ParagraphStyle(
            "BodyText2", fontName="Helvetica", fontSize=10,
            textColor=TEXT_COLOR, leading=14, spaceAfter=4,
        ))
        self.styles.add(ParagraphStyle(
            "BulletItem", fontName="Helvetica", fontSize=10,
            textColor=TEXT_COLOR, leading=14, leftIndent=18,
            bulletIndent=6, spaceAfter=2,
        ))
        self.styles.add(ParagraphStyle(
            "SmallMuted", fontName="Helvetica", fontSize=8,
            textColor=MUTED_TEXT,
        ))
        self.styles.add(ParagraphStyle(
            "TableHeader", fontName="Helvetica-Bold", fontSize=9,
            textColor=WHITE, alignment=TA_LEFT,
        ))
        self.styles.add(ParagraphStyle(
            "TableCell", fontName="Helvetica", fontSize=9,
            textColor=TEXT_COLOR, leading=12,
        ))
        self.styles.add(ParagraphStyle(
            "BoxText", fontName="Helvetica", fontSize=10,
            textColor=TEXT_COLOR, leading=14, backColor=LIGHT_BG,
        ))

    # ------------------------------------------------------------------
    # Public
    # ------------------------------------------------------------------

    def export(
        self,
        results: Dict[str, Any],
        project_name: str,
        market: str,
        currency: str,
        landing_page_urls: List[str],
        output_folder: str,
    ) -> str:
        output_path = Path(output_folder)
        output_path.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        pdf_path = output_path / f"sem_report_{timestamp}.pdf"

        brand_research = results.get("brand_research", {})
        brand_name = brand_research.get("brand_name", project_name)
        market_config = MARKETS.get(market, MARKETS.get("us", {}))
        market_name = market_config.get("name", market)

        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=A4,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=20 * mm,
            bottomMargin=25 * mm,
        )

        self.story = []

        campaign_name = results.get("strategy", {}).get("campaign_name", f"SEM Campaign - {brand_name}")

        self._build_cover_page(brand_name, campaign_name, market_name, currency, landing_page_urls)
        self._build_research_summary(results.get("synthesis", {}))
        self._build_personas(results.get("persona_research", {}))
        self._build_competitors(results.get("competitor_research", {}))
        self._build_keywords(results.get("keyword_research", {}), currency)
        self._build_strategy(results.get("strategy", {}), currency)
        self._build_rsas(results.get("rsas", {}))

        doc.build(self.story, onFirstPage=self._footer, onLaterPages=self._footer)
        return str(pdf_path)

    # ------------------------------------------------------------------
    # Cover page
    # ------------------------------------------------------------------

    def _build_cover_page(
        self,
        brand_name: str,
        campaign_name: str,
        market_name: str,
        currency: str,
        landing_page_urls: List[str],
    ):
        self.story.append(Spacer(1, 80))
        self.story.append(Paragraph("SEM Analysis Report", self.styles["CoverTitle"]))
        self.story.append(Spacer(1, 12))
        self.story.append(HRFlowable(width="40%", thickness=2, color=ACCENT, spaceAfter=20))
        self.story.append(Paragraph(brand_name, self.styles["CoverSub"]))
        self.story.append(Spacer(1, 6))
        self.story.append(Paragraph(campaign_name, self.styles["CoverSub"]))
        self.story.append(Spacer(1, 30))

        details = [
            f"<b>Market:</b> {market_name}",
            f"<b>Currency:</b> {currency}",
            f"<b>Date:</b> {datetime.now().strftime('%B %d, %Y')}",
        ]
        for url in landing_page_urls[:5]:
            details.append(f"<b>URL:</b> {_esc(url)}")

        for line in details:
            self.story.append(Paragraph(line, self.styles["CoverSub"]))

        self.story.append(PageBreak())

    # ------------------------------------------------------------------
    # 1. Research Summary
    # ------------------------------------------------------------------

    def _build_research_summary(self, synthesis: Dict[str, Any]):
        if not synthesis:
            return

        self.story.append(Paragraph("Research Summary", self.styles["SectionTitle"]))
        self.story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=10))

        # Executive summary
        exec_summary = synthesis.get("executive_summary", "")
        if exec_summary:
            self.story.append(Paragraph("Executive Summary", self.styles["SubHeading"]))
            self._add_box_text(exec_summary)

        # Key insights
        insights = synthesis.get("key_insights", [])
        if insights:
            self.story.append(Paragraph("Key Insights", self.styles["SubHeading"]))
            for i, insight in enumerate(insights, 1):
                text = insight if isinstance(insight, str) else str(insight)
                self.story.append(Paragraph(
                    f"<b>{i}.</b> {_esc(text)}", self.styles["BulletItem"],
                ))

        # Competitive positioning
        comp_pos = synthesis.get("competitive_positioning", "")
        if comp_pos:
            self.story.append(Paragraph("Competitive Positioning", self.styles["SubHeading"]))
            self._add_body(comp_pos)

        # Messaging framework
        messaging = synthesis.get("messaging_framework", {})
        if isinstance(messaging, dict) and messaging:
            self.story.append(Paragraph("Messaging Framework", self.styles["SubHeading"]))

            primary = messaging.get("primary_message", "")
            if primary:
                self._add_box_text(f"Primary Message: {primary}")

            for key in ("supporting_messages", "proof_points"):
                items = messaging.get(key, [])
                if items:
                    label = key.replace("_", " ").title()
                    self.story.append(Paragraph(label, self.styles["SubHeading"]))
                    self._add_bullet_list(items)

            tone = messaging.get("tone", "")
            if tone:
                self.story.append(Paragraph(f"<b>Tone:</b> {_esc(str(tone))}", self.styles["BodyText2"]))

        self.story.append(PageBreak())

    # ------------------------------------------------------------------
    # 2. Personas
    # ------------------------------------------------------------------

    def _build_personas(self, persona_research: Dict[str, Any]):
        personas = persona_research.get("personas", [])
        if not personas:
            return

        self.story.append(Paragraph("Audience Personas", self.styles["SectionTitle"]))
        self.story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=10))

        for persona in personas:
            name = persona.get("name", "Persona")
            age = persona.get("age", "")
            occupation = persona.get("occupation", "")
            subtitle_parts = [p for p in [str(age) if age else "", occupation] if p]
            subtitle = " | ".join(subtitle_parts)

            block = []
            block.append(Paragraph(f"{_esc(name)}", self.styles["SubHeading"]))
            if subtitle:
                block.append(Paragraph(_esc(subtitle), self.styles["SmallMuted"]))
            block.append(Spacer(1, 4))

            desc = persona.get("description", "")
            if desc:
                block.append(Paragraph(_esc(str(desc)), self.styles["BodyText2"]))

            for key, label in [
                ("goals", "Goals"),
                ("frustrations", "Frustrations"),
                ("pain_points", "Pain Points"),
                ("search_queries", "Search Queries"),
                ("messaging_angles", "Messaging Angles"),
                ("online_behaviors", "Online Behaviors"),
            ]:
                items = persona.get(key, [])
                if items:
                    block.append(Paragraph(f"<b>{label}:</b>", self.styles["BodyText2"]))
                    for item in items:
                        block.append(Paragraph(
                            f"\u2022 {_esc(str(item))}", self.styles["BulletItem"],
                        ))

            block.append(Spacer(1, 12))
            self.story.append(KeepTogether(block))

        self.story.append(PageBreak())

    # ------------------------------------------------------------------
    # 3. Competitors
    # ------------------------------------------------------------------

    def _build_competitors(self, competitor_research: Dict[str, Any]):
        if not competitor_research:
            return

        self.story.append(Paragraph("Competitor Analysis", self.styles["SectionTitle"]))
        self.story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=10))

        # Competitive advantages
        advantages = competitor_research.get("competitive_advantages", [])
        if advantages:
            self.story.append(Paragraph("Our Competitive Advantages", self.styles["SubHeading"]))
            self._add_bullet_list(advantages)

        gaps = competitor_research.get("gaps_opportunities", [])
        if gaps:
            self.story.append(Paragraph("Gaps &amp; Opportunities", self.styles["SubHeading"]))
            self._add_bullet_list(gaps)

        # Individual competitors
        competitors = competitor_research.get("competitors", [])
        for comp in competitors:
            brand = comp.get("brand_name", "Competitor")
            url = comp.get("url", "")

            block = []
            block.append(Paragraph(_esc(brand), self.styles["SubHeading"]))
            if url:
                block.append(Paragraph(_esc(url), self.styles["SmallMuted"]))
            block.append(Spacer(1, 4))

            positioning = comp.get("positioning", "")
            if positioning:
                block.append(Paragraph(f"<b>Positioning:</b> {_esc(str(positioning))}", self.styles["BodyText2"]))

            # Strengths / Weaknesses side by side
            strengths = comp.get("strengths", [])
            weaknesses = comp.get("weaknesses", [])
            if strengths or weaknesses:
                sw_data = [
                    [Paragraph("<b>Strengths</b>", self.styles["TableHeader"]),
                     Paragraph("<b>Weaknesses</b>", self.styles["TableHeader"])],
                ]
                max_rows = max(len(strengths), len(weaknesses))
                for i in range(max_rows):
                    s = _esc(str(strengths[i])) if i < len(strengths) else ""
                    w = _esc(str(weaknesses[i])) if i < len(weaknesses) else ""
                    sw_data.append([
                        Paragraph(s, self.styles["TableCell"]),
                        Paragraph(w, self.styles["TableCell"]),
                    ])

                page_width = A4[0] - 40 * mm
                sw_table = Table(sw_data, colWidths=[page_width * 0.5, page_width * 0.5])
                sw_table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
                    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]))
                # Alternate row shading
                for row_idx in range(1, len(sw_data)):
                    if row_idx % 2 == 0:
                        sw_table.setStyle(TableStyle([
                            ("BACKGROUND", (0, row_idx), (-1, row_idx), ROW_ALT),
                        ]))
                block.append(Spacer(1, 4))
                block.append(sw_table)

            # Key messages
            messages = comp.get("key_messages", [])
            if messages:
                block.append(Spacer(1, 6))
                block.append(Paragraph("<b>Key Messages:</b>", self.styles["BodyText2"]))
                for msg in messages:
                    block.append(Paragraph(f"\u2022 {_esc(str(msg))}", self.styles["BulletItem"]))

            block.append(Spacer(1, 14))
            self.story.append(KeepTogether(block))

        self.story.append(PageBreak())

    # ------------------------------------------------------------------
    # 4. Keywords
    # ------------------------------------------------------------------

    def _build_keywords(self, keyword_research: Dict[str, Any], currency: str):
        clusters = keyword_research.get("clusters", [])
        if not clusters:
            return

        self.story.append(Paragraph("Keyword Research", self.styles["SectionTitle"]))
        self.story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=10))

        total_kw = keyword_research.get("total_keywords", 0)
        total_vol = keyword_research.get("total_volume", 0)
        if total_kw or total_vol:
            self.story.append(Paragraph(
                f"<b>Total Keywords:</b> {total_kw}  |  <b>Total Volume:</b> {total_vol:,}",
                self.styles["BodyText2"],
            ))
            self.story.append(Spacer(1, 8))

        page_width = A4[0] - 40 * mm
        col_widths = [page_width * 0.38, page_width * 0.15, page_width * 0.15, page_width * 0.16, page_width * 0.16]
        headers = ["Keyword", "Volume", f"CPC ({currency})", "Match Type", "Intent"]

        for cluster in clusters:
            cluster_name = cluster.get("cluster_name", cluster.get("name", "Cluster"))
            theme = cluster.get("theme", "")
            keywords = cluster.get("keywords", [])

            self.story.append(Paragraph(
                f"{_esc(cluster_name)}" + (f" — {_esc(theme)}" if theme else ""),
                self.styles["SubHeading"],
            ))

            if not keywords:
                self.story.append(Paragraph("No keywords in this cluster.", self.styles["BodyText2"]))
                continue

            rows = []
            for kw in keywords:
                if isinstance(kw, dict):
                    rows.append([
                        kw.get("keyword", kw.get("text", "")),
                        str(kw.get("search_volume", kw.get("monthly_volume", "-"))),
                        str(kw.get("cpc", "-")),
                        kw.get("match_type", "broad").capitalize(),
                        kw.get("intent", "-"),
                    ])
                else:
                    rows.append([str(kw), "-", "-", "Broad", "-"])

            table = self._data_table(headers, rows, col_widths)
            self.story.append(table)
            self.story.append(Spacer(1, 10))

        # Negative keywords
        neg = keyword_research.get("negative_keywords", [])
        if neg:
            self.story.append(Paragraph("Negative Keywords", self.styles["SubHeading"]))
            self._add_bullet_list(neg)

        self.story.append(PageBreak())

    # ------------------------------------------------------------------
    # 5. Strategy
    # ------------------------------------------------------------------

    def _build_strategy(self, strategy: Dict[str, Any], currency: str):
        if not strategy:
            return

        self.story.append(Paragraph("Paid Search Strategy", self.styles["SectionTitle"]))
        self.story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=10))

        # Campaign overview box
        overview_lines = []
        for key, label in [
            ("campaign_name", "Campaign"),
            ("objective", "Objective"),
            ("budget_recommendation", "Budget Recommendation"),
            ("bidding_strategy", "Bidding Strategy"),
            ("targeting_notes", "Targeting Notes"),
        ]:
            val = strategy.get(key, "")
            if val:
                overview_lines.append(f"<b>{label}:</b> {_esc(str(val))}")

        if overview_lines:
            self._add_box_text("<br/>".join(overview_lines))
            self.story.append(Spacer(1, 8))

        # Ad groups
        ad_groups = strategy.get("ad_groups", [])
        page_width = A4[0] - 40 * mm

        for ag in ad_groups:
            name = ag.get("name", "Ad Group")
            theme = ag.get("theme", "")
            priority = ag.get("priority", "medium")
            bid = ag.get("suggested_bid", 0)
            persona = ag.get("target_persona", "")

            block = []
            block.append(Paragraph(f"{_esc(name)}", self.styles["SubHeading"]))

            meta_parts = []
            if theme:
                meta_parts.append(f"Theme: {_esc(theme)}")
            if priority:
                meta_parts.append(f"Priority: {priority.capitalize()}")
            if bid:
                meta_parts.append(f"Bid: {currency} {bid:.2f}")
            if persona:
                meta_parts.append(f"Persona: {_esc(persona)}")
            if meta_parts:
                block.append(Paragraph(" | ".join(meta_parts), self.styles["SmallMuted"]))
                block.append(Spacer(1, 4))

            # Keywords with match types
            keywords = ag.get("keywords", [])
            match_types = ag.get("match_types", {})
            if keywords:
                kw_header = ["Keyword", "Match Type"]
                kw_rows = []
                for kw in keywords:
                    mt = match_types.get(kw, "broad").capitalize() if isinstance(match_types, dict) else "Broad"
                    kw_rows.append([str(kw), mt])

                kw_table = self._data_table(
                    kw_header, kw_rows,
                    [page_width * 0.65, page_width * 0.35],
                )
                block.append(kw_table)

            # Messaging angle
            angle = ag.get("messaging_angle", "")
            if angle:
                block.append(Spacer(1, 4))
                block.append(Paragraph(f"<b>Messaging Angle:</b> {_esc(str(angle))}", self.styles["BodyText2"]))

            block.append(Spacer(1, 12))
            self.story.append(KeepTogether(block))

        # Negative keywords
        neg = strategy.get("negative_keywords", [])
        if neg:
            self.story.append(Paragraph("Negative Keywords", self.styles["SubHeading"]))
            self._add_bullet_list(neg)

        self.story.append(PageBreak())

    # ------------------------------------------------------------------
    # 6. RSAs
    # ------------------------------------------------------------------

    def _build_rsas(self, rsas: Dict[str, Any]):
        ad_groups = rsas.get("ad_group_rsas", [])
        if not ad_groups:
            return

        self.story.append(Paragraph("Responsive Search Ads", self.styles["SectionTitle"]))
        self.story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=10))

        page_width = A4[0] - 40 * mm

        for ag in ad_groups:
            ag_name = ag.get("ad_group_name", "Ad Group")

            block = []
            block.append(Paragraph(_esc(ag_name), self.styles["SubHeading"]))
            block.append(Spacer(1, 4))

            # Headlines table
            headlines = ag.get("headlines", [])
            if headlines:
                block.append(Paragraph("<b>Headlines</b>", self.styles["BodyText2"]))
                h_header = ["#", "Headline", "Chars"]
                h_rows = []
                for i, h in enumerate(headlines, 1):
                    text = h.get("text", h) if isinstance(h, dict) else str(h)
                    h_rows.append([str(i), text, str(len(text))])

                h_table = self._data_table(
                    h_header, h_rows,
                    [page_width * 0.08, page_width * 0.78, page_width * 0.14],
                )
                block.append(h_table)
                block.append(Spacer(1, 8))

            # Descriptions table
            descriptions = ag.get("descriptions", [])
            if descriptions:
                block.append(Paragraph("<b>Descriptions</b>", self.styles["BodyText2"]))
                d_header = ["#", "Description", "Chars"]
                d_rows = []
                for i, d in enumerate(descriptions, 1):
                    text = d.get("text", d) if isinstance(d, dict) else str(d)
                    d_rows.append([str(i), text, str(len(text))])

                d_table = self._data_table(
                    d_header, d_rows,
                    [page_width * 0.08, page_width * 0.78, page_width * 0.14],
                )
                block.append(d_table)
                block.append(Spacer(1, 8))

            # Keywords
            keywords = ag.get("keywords", [])
            if keywords:
                block.append(Paragraph("<b>Keywords:</b>", self.styles["BodyText2"]))
                kw_strs = []
                for kw in keywords:
                    if isinstance(kw, dict):
                        text = kw.get("text", "")
                        mt = kw.get("match_type", "broad")
                        kw_strs.append(f"{text} [{mt}]")
                    else:
                        kw_strs.append(str(kw))
                block.append(Paragraph(_esc(", ".join(kw_strs)), self.styles["BodyText2"]))

            block.append(Spacer(1, 16))
            self.story.append(KeepTogether(block))

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _data_table(self, headers: List[str], rows: List[List[str]], col_widths: List[float]) -> Table:
        """Build a styled table with header row and alternating shading."""
        header_row = [Paragraph(_esc(h), self.styles["TableHeader"]) for h in headers]
        data = [header_row]
        for row in rows:
            data.append([Paragraph(_esc(str(c)), self.styles["TableCell"]) for c in row])

        table = Table(data, colWidths=col_widths, repeatRows=1)

        style_cmds = [
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]

        # Alternating row shading
        for row_idx in range(1, len(data)):
            if row_idx % 2 == 0:
                style_cmds.append(("BACKGROUND", (0, row_idx), (-1, row_idx), ROW_ALT))

        table.setStyle(TableStyle(style_cmds))
        return table

    def _add_box_text(self, text: str):
        """Add text inside a shaded box."""
        if not text:
            return
        box_data = [[Paragraph(_esc(str(text)), self.styles["BodyText2"])]]
        box = Table(box_data, colWidths=[A4[0] - 40 * mm])
        box.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("ROUNDEDCORNERS", [4, 4, 4, 4]),
        ]))
        self.story.append(box)
        self.story.append(Spacer(1, 6))

    def _add_body(self, text):
        """Add body text, handling str or list."""
        if isinstance(text, list):
            self._add_bullet_list(text)
        elif text:
            self.story.append(Paragraph(_esc(str(text)), self.styles["BodyText2"]))

    def _add_bullet_list(self, items: List):
        for item in items:
            self.story.append(Paragraph(
                f"\u2022 {_esc(str(item))}", self.styles["BulletItem"],
            ))
        self.story.append(Spacer(1, 4))

    @staticmethod
    def _footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(MUTED_TEXT)
        canvas.drawString(
            doc.leftMargin,
            15 * mm,
            f"Generated by SEM Manager  |  {datetime.now().strftime('%B %d, %Y')}",
        )
        canvas.drawRightString(
            A4[0] - doc.rightMargin,
            15 * mm,
            f"Page {doc.page}",
        )
        canvas.restoreState()


def _esc(text: str) -> str:
    """Escape XML special characters for ReportLab Paragraph markup."""
    if not text:
        return ""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
