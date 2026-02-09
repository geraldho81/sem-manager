# SEM Manager

Multi-agent SEM (Search Engine Marketing) Manager. Enter landing page URLs and select a target market — 7 AI agents analyze content, research competitors, develop personas, perform keyword research with real volume/CPC data, synthesize findings, build a paid search strategy, and generate RSAs — all with real-time progress updates.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + Tailwind CSS + TypeScript |
| Backend | FastAPI (Python) |
| AI Model | Kimi K2 + K2.5 (Thinking) via Moonshot API |
| Keyword API | DataForSEO (pay-as-you-go, API key auth) |
| Scraping | httpx + BeautifulSoup4 |
| Real-time | WebSocket (FastAPI + native browser WS) |

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Moonshot AI (Kimi)](https://platform.moonshot.cn/) API key
- A [DataForSEO](https://dataforseo.com/) account (optional — pipeline works without it but keywords won't have volume/CPC data)

### Quick Start

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys

pip install -r requirements.txt
cd ../frontend && npm install
cd ..

./start.sh   # starts both backend and frontend
```

Or run them separately:

```bash
# Backend (http://localhost:8000)
cd backend && uvicorn app.main:app --reload

# Frontend (http://localhost:3000)
cd frontend && npm run dev
```

Frontend proxies `/api/*` and `/ws/*` to the backend via `next.config.mjs` rewrites.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KIMI_API_KEY` | Yes | Moonshot AI API key |
| `KIMI_API_BASE` | No | API base URL (default: `https://api.moonshot.ai/v1`) |
| `KIMI_MODEL_STANDARD` | No | Standard model ID (default: `kimi-k2`) |
| `KIMI_MODEL_THINKING` | No | Thinking model ID (default: `kimi-k2.5`) |
| `DATAFORSEO_LOGIN` | No | DataForSEO login email |
| `DATAFORSEO_PASSWORD` | No | DataForSEO API password |

## How It Works

### User Flow

1. **Setup** — Enter a project name, select a target market, add one or more landing page URLs, optionally add competitor URLs
2. **Running** — Watch 7 AI agents work through the pipeline with real-time WebSocket progress updates
3. **Results** — Browse a tabbed dashboard with research summary, personas, keywords, strategy, RSA previews, and export options

### Agent Pipeline

The pipeline runs in 6 stages. Stages 2's agents run in parallel; all others are sequential.

```
Stage 1:  LandingPageAgent    Crawls all URLs, produces unified brand analysis
             │
Stage 2:  CompetitorAgent  ─┬─  PersonaAgent
          (competitors)     │   (Reddit, Quora, forums)
             │              │
Stage 3:  KeywordAgent       DataForSEO API + AI clustering
             │
Stage 4:  SynthesisAgent     Combines all research
             │
Stage 5:  StrategyAgent      Paid search strategy + ad groups
             │
Stage 6:  RSAAgent           15 headlines + 4 descriptions per ad group
```

### Agent Details

| Agent | AI Model | Input | Output |
|-------|----------|-------|--------|
| LandingPageAgent | K2 | List of landing page URLs | Brand name, services, USPs, voice, CTAs, industry, seed keywords |
| CompetitorAgent | K2 | Brand analysis + competitor URLs (or auto-discovery) | Competitor profiles, strengths, weaknesses, differentiation |
| PersonaAgent | K2 | Brand analysis + multi-source web research | 3-5 personas with goals, frustrations, search queries, triggers |
| KeywordAgent | K2 | All research + market config | Keyword clusters with volume, CPC (local currency), match types |
| SynthesisAgent | K2.5 | All research outputs | Executive summary, messaging framework, key insights |
| StrategyAgent | K2.5 | Synthesis + keywords + personas | Ad groups with keywords, match types, bids, messaging angles |
| RSAAgent | K2.5 | Strategy + synthesis + brand | 15 headlines (max 30 chars) + 4 descriptions (max 90 chars) per ad group |

## Supported Markets

Users select a target market at setup. This controls the DataForSEO location code (country-specific search data), the currency for CPC values, and the default language.

| Market | Currency | Language |
|--------|----------|----------|
| United States | USD | en |
| United Kingdom | GBP | en |
| Singapore | SGD | en |
| Malaysia | MYR | ms |
| Australia | AUD | en |
| India | INR | en |
| Indonesia | IDR | id |
| Philippines | PHP | en |
| Thailand | THB | th |
| Hong Kong | HKD | zh |

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/projects/` | Create project |
| `GET` | `/api/projects/{id}` | Get project details |
| `POST` | `/api/projects/{id}/config` | Set URLs + market |
| `GET` | `/api/projects/markets/list` | List supported markets |
| `POST` | `/api/pipeline/{id}/start` | Start agent pipeline |
| `GET` | `/api/pipeline/{id}/status` | Poll pipeline status |
| `POST` | `/api/pipeline/{id}/cancel` | Cancel running pipeline |
| `GET` | `/api/exports/{id}/csv` | Download Google Ads CSV |
| `GET` | `/api/exports/{id}/research` | Download full research JSON |
| `GET` | `/api/exports/{id}/strategy` | Download strategy + RSAs JSON |
| `WS` | `/ws/{project_id}` | Real-time agent progress |

## Project Structure

```
sem-manager/
├── README.md
├── start.sh                              # Starts both backend + frontend
├── .claude/CLAUDE.md
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   └── app/
│       ├── main.py                       # FastAPI app, CORS, routers
│       ├── config.py                     # Settings + MARKETS dict
│       ├── agents/
│       │   ├── base.py                   # BaseAgent ABC with retry + WebSocket progress
│       │   ├── landing_page_agent.py     # Multi-URL content analysis
│       │   ├── competitor_agent.py       # Auto-discover + analyze competitors
│       │   ├── persona_agent.py          # Multi-source persona research
│       │   ├── keyword_agent.py          # DataForSEO + AI clustering
│       │   ├── synthesis_agent.py        # Research synthesis
│       │   ├── strategy_agent.py         # Paid search strategy + ad groups
│       │   └── rsa_agent.py              # RSA generation + validation
│       ├── api/
│       │   ├── websocket.py              # ConnectionManager for real-time updates
│       │   └── routes/
│       │       ├── projects.py           # Project CRUD + market listing
│       │       ├── pipeline.py           # Start/status/cancel pipeline
│       │       └── exports.py            # CSV + JSON downloads
│       ├── models/
│       │   ├── project.py                # Project, config, status
│       │   ├── pipeline.py               # Agent progress, pipeline status
│       │   ├── research.py               # Brand, competitor research
│       │   ├── keywords.py               # Keyword data + clusters
│       │   ├── strategy.py               # Ad group strategy
│       │   └── rsa.py                    # Headlines, descriptions, media plan
│       ├── services/
│       │   ├── kimi_client.py            # Moonshot API client + JSON repair
│       │   ├── scraper.py                # httpx web crawler
│       │   ├── multi_source_scraper.py   # Reddit/Quora/StackExchange/Medium/Web
│       │   ├── dataforseo_client.py      # DataForSEO keyword API
│       │   ├── csv_exporter.py           # Google Ads Editor CSV format
│       │   ├── file_manager.py           # Project file I/O
│       │   └── pipeline_orchestrator.py  # 6-stage pipeline orchestration
│       └── utils/
│           └── prompts.py                # All 7 agent system prompts
└── frontend/
    ├── package.json
    ├── next.config.mjs                   # API proxy rewrites
    ├── tailwind.config.ts
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx                  # Main wizard page
        │   └── globals.css
        ├── components/
        │   ├── wizard/
        │   │   ├── StepIndicator.tsx      # Setup → Running → Results steps
        │   │   ├── SetupStep.tsx          # URL inputs + market selector
        │   │   ├── RunningStep.tsx         # 7 agent progress cards
        │   │   └── ResultsStep.tsx         # Tabbed results dashboard
        │   └── results/
        │       ├── ResearchSummary.tsx     # Executive summary + messaging framework
        │       ├── PersonaCards.tsx        # Visual persona cards
        │       ├── KeywordDashboard.tsx    # Sortable keyword table with clusters
        │       ├── StrategyView.tsx        # Ad group strategy cards
        │       └── RSAPreview.tsx          # RSA preview with character counts
        ├── hooks/
        │   ├── useWebSocket.ts            # WebSocket connection + agent updates
        │   └── usePipeline.ts             # Pipeline state management
        ├── services/
        │   └── api.ts                     # API client
        └── types/
            └── index.ts                   # TypeScript interfaces

```

## DataForSEO Integration

The keyword agent uses three DataForSEO endpoints:

- **Keywords for Site** — Discovers keywords associated with a domain
- **Related Keywords** — Expands seed keywords into related terms
- **Search Volume** — Gets volume + CPC data for keyword lists

The `location_code` from the selected market determines country-specific data. CPC values are returned in the market's native currency automatically.

If DataForSEO credentials are not configured or the API fails, the pipeline continues gracefully using AI-extracted keywords from the landing page content (without volume/CPC data).

## Exports

- **Google Ads CSV** — Import directly into Google Ads Editor. Includes campaign, ad groups, keywords with match types and bids, and RSAs with all 15 headlines + 4 descriptions.
- **Research JSON** — Full research output from all agents (brand, competitors, personas, keywords, synthesis).
- **Strategy JSON** — Campaign strategy + RSA ad copy for all ad groups.
