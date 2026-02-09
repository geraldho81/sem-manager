from pydantic_settings import BaseSettings
from typing import List, Dict, Any


MARKETS: Dict[str, Dict[str, Any]] = {
    "us": {
        "name": "United States",
        "location_code": 2840,
        "currency": "USD",
        "currency_symbol": "$",
        "language": "en",
        "flag": "🇺🇸",
    },
    "uk": {
        "name": "United Kingdom",
        "location_code": 2826,
        "currency": "GBP",
        "currency_symbol": "£",
        "language": "en",
        "flag": "🇬🇧",
    },
    "sg": {
        "name": "Singapore",
        "location_code": 2702,
        "currency": "SGD",
        "currency_symbol": "S$",
        "language": "en",
        "flag": "🇸🇬",
    },
    "my": {
        "name": "Malaysia",
        "location_code": 2458,
        "currency": "MYR",
        "currency_symbol": "RM",
        "language": "ms",
        "flag": "🇲🇾",
    },
    "au": {
        "name": "Australia",
        "location_code": 2036,
        "currency": "AUD",
        "currency_symbol": "A$",
        "language": "en",
        "flag": "🇦🇺",
    },
    "in": {
        "name": "India",
        "location_code": 2356,
        "currency": "INR",
        "currency_symbol": "₹",
        "language": "en",
        "flag": "🇮🇳",
    },
    "id": {
        "name": "Indonesia",
        "location_code": 2360,
        "currency": "IDR",
        "currency_symbol": "Rp",
        "language": "id",
        "flag": "🇮🇩",
    },
    "ph": {
        "name": "Philippines",
        "location_code": 2608,
        "currency": "PHP",
        "currency_symbol": "₱",
        "language": "en",
        "flag": "🇵🇭",
    },
    "th": {
        "name": "Thailand",
        "location_code": 2764,
        "currency": "THB",
        "currency_symbol": "฿",
        "language": "th",
        "flag": "🇹🇭",
    },
    "hk": {
        "name": "Hong Kong",
        "location_code": 2344,
        "currency": "HKD",
        "currency_symbol": "HK$",
        "language": "zh",
        "flag": "🇭🇰",
    },
}


class Settings(BaseSettings):
    # Kimi API Configuration
    KIMI_API_KEY: str = ""
    KIMI_API_BASE: str = "https://api.moonshot.ai/v1"
    KIMI_MODEL_STANDARD: str = "kimi-k2-turbo-preview"
    KIMI_MODEL_THINKING: str = "kimi-k2.5"

    # DataForSEO API
    DATAFORSEO_LOGIN: str = ""
    DATAFORSEO_PASSWORD: str = ""

    # Application Settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    MAX_RETRIES: int = 3
    RETRY_DELAY: float = 1.0
    SCRAPING_TIMEOUT: int = 30

    # Pipeline Settings
    MAX_PAGES_TO_CRAWL: int = 10
    MAX_COMPETITORS: int = 10
    MAX_AD_GROUPS: int = 20

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
