from pathlib import Path
from typing import Dict, Any
from datetime import datetime
import aiofiles

from app.models.rsa import MediaPlan
from app.config import MARKETS


class CSVExporter:
    """Exports media plans to Google Ads compatible CSV files."""

    async def export_google_ads_format(
        self,
        media_plan: MediaPlan,
        output_folder: str,
    ) -> str:
        output_path = Path(output_folder)
        output_path.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        csv_filename = f"google_ads_{timestamp}.csv"
        csv_path = output_path / csv_filename

        market_config = MARKETS.get(media_plan.market, {})
        currency_symbol = market_config.get("currency_symbol", "$")

        headers = [
            "Campaign",
            "Ad Group",
            "Type",
            "Keyword",
            "Match Type",
            "Max CPC",
            "Currency",
            "Monthly Volume",
            "Final URL",
            "Headline 1", "Headline 2", "Headline 3", "Headline 4", "Headline 5",
            "Headline 6", "Headline 7", "Headline 8", "Headline 9", "Headline 10",
            "Headline 11", "Headline 12", "Headline 13", "Headline 14", "Headline 15",
            "Description 1", "Description 2", "Description 3", "Description 4",
            "Status",
        ]

        rows = []
        landing_url = media_plan.landing_page_urls[0] if media_plan.landing_page_urls else ""

        for ad_group in media_plan.ad_groups:
            # Keyword rows
            for keyword in ad_group.keywords:
                match_type = keyword.match_type.capitalize() if keyword.match_type else "Broad"
                kw_cpc = keyword.cpc if keyword.cpc else ad_group.cpc_bid

                row = {
                    "Campaign": media_plan.campaign_name,
                    "Ad Group": ad_group.name,
                    "Type": "Keyword",
                    "Keyword": keyword.text,
                    "Match Type": match_type,
                    "Max CPC": f"{currency_symbol}{kw_cpc:.2f}",
                    "Currency": media_plan.currency,
                    "Monthly Volume": keyword.monthly_volume if keyword.monthly_volume else "",
                    "Final URL": landing_url,
                    "Status": "Enabled",
                }
                rows.append(row)

            # RSA row
            rsa_row = {
                "Campaign": media_plan.campaign_name,
                "Ad Group": ad_group.name,
                "Type": "Responsive Search Ad",
                "Final URL": landing_url,
                "Currency": media_plan.currency,
                "Status": "Enabled",
            }

            for i in range(15):
                if i < len(ad_group.headlines):
                    rsa_row[f"Headline {i + 1}"] = ad_group.headlines[i]
                else:
                    rsa_row[f"Headline {i + 1}"] = ""

            for i in range(4):
                if i < len(ad_group.descriptions):
                    rsa_row[f"Description {i + 1}"] = ad_group.descriptions[i]
                else:
                    rsa_row[f"Description {i + 1}"] = ""

            rows.append(rsa_row)

        async with aiofiles.open(csv_path, "w", newline="", encoding="utf-8") as f:
            await f.write(",".join(f'"{h}"' for h in headers) + "\n")

            for row in rows:
                values = []
                for h in headers:
                    value = str(row.get(h, ""))
                    value = value.replace('"', '""')
                    values.append(f'"{value}"')
                await f.write(",".join(values) + "\n")

        return str(csv_path)
