# SEM Manager

## What This Is
Full-stack multi-agent SEM (Search Engine Marketing) tool. User enters landing page URLs + target market, 7 AI agents run a pipeline to analyze the brand, research competitors/personas, cluster keywords with real volume/CPC data, synthesize findings, build a paid search strategy, and generate RSAs. Results export as Google Ads Editor CSV.

## Tech Stack
- **Backend:** FastAPI (Python 3.10+) at `localhost:8000`
- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS at `localhost:3000`
- **AI:** Kimi K2 (`kimi-k2-turbo-preview`) and K2.5 Thinking (`kimi-k2.5`) via Moonshot API (OpenAI-compatible)
- **Keywords:** DataForSEO API (optional — pipeline degrades gracefully without it)
- **Scraping:** httpx + BeautifulSoup4, multi-source (Reddit, Quora, StackExchange, Medium, web)
- **Real-time:** WebSocket for live agent progress updates

## Running
```bash
./start.sh   # starts both backend and frontend
```
Or manually: `uvicorn app.main:app --reload` in `backend/`, `npm run dev` in `frontend/`.
Frontend proxies `/api/*` and `/ws/*` to backend via `next.config.mjs` rewrites.

## AI Models

Two Kimi models, configured in `backend/app/config.py`:
- `KIMI_MODEL_THINKING` = `kimi-k2.5` — for agents needing deep reasoning (creative, strategic)
- `KIMI_MODEL_STANDARD` = `kimi-k2-turbo-preview` — for agents doing extraction, analysis, clustering

Model selection is controlled by `use_large_model: bool` on each agent:
- `use_large_model=True` → `kimi-k2.5` (thinking)
- `use_large_model=False` → `kimi-k2-turbo-preview` (standard)

| Agent | Model | `use_large_model` | Why |
|-------|-------|-------------------|-----|
| RSAAgent | K2.5 (non-thinking) | True | Ad copy (parallelized, explicit temp=0.7 skips thinking) |
| StrategyAgent | K2.5 | True | Strategic planning |
| SynthesisAgent | K2.5 | True | High-level research synthesis |
| PersonaAgent | K2 | False | Structured persona extraction |
| LandingPageAgent | K2 | False | Content analysis/extraction |
| CompetitorAgent | K2 | False | Competitor analysis |
| KeywordAgent | K2 | False | Keyword clustering |

## Agent Pipeline (6 stages)

```
Stage 1:  LandingPageAgent       Crawls URLs → brand analysis
Stage 2:  CompetitorAgent ─┬─ PersonaAgent    (parallel)
Stage 3:  KeywordAgent          DataForSEO + AI clustering
Stage 4:  SynthesisAgent        Combines all research
Stage 5:  StrategyAgent         Ad groups + keyword assignments
Stage 6:  RSAAgent              15 headlines + 4 descriptions per ad group
```

Orchestrated by `services/pipeline_orchestrator.py`. Each agent inherits from `agents/base.py` (BaseAgent ABC) which provides retry logic and WebSocket progress emission.

## Key Architecture Patterns

- **Agent pattern:** All agents extend `BaseAgent`. Constructor takes `(project_id, kimi_client, use_large_model)`. Must implement `async execute(input_data) -> dict`. Called via `run_with_retry()` which handles retries + progress.
- **Kimi client:** `services/kimi_client.py` wraps AsyncOpenAI client. Two methods: `chat()` (single prompt → JSON) and `chat_with_context()` (multi-turn). Includes JSON repair for malformed LLM output.
- **Prompts:** All agent prompts in `utils/prompts.py`. Each is a format string filled by the agent before calling Kimi.
- **Config:** Pydantic `BaseSettings` in `config.py`, reads from `.env`. Also contains `MARKETS` dict (10 markets with location codes, currencies, languages).
- **Frontend state:** `hooks/usePipeline.ts` manages pipeline state, `hooks/useWebSocket.ts` handles real-time agent updates.
- **API proxy:** Frontend Next.js rewrites `/api/*` and `/ws/*` to backend `localhost:8000`.

## File Layout
```
backend/app/
  config.py                  Settings + MARKETS dict
  main.py                    FastAPI app, CORS, routers
  agents/
    base.py                  BaseAgent ABC (retry + WebSocket progress)
    landing_page_agent.py    Brand analysis from URLs
    competitor_agent.py      Competitor discovery + analysis
    persona_agent.py         Multi-source persona research
    keyword_agent.py         DataForSEO + AI keyword clustering
    synthesis_agent.py       Research synthesis
    strategy_agent.py        Campaign strategy + ad groups
    rsa_agent.py             RSA generation + validation
  api/
    websocket.py             ConnectionManager
    routes/
      projects.py            Project CRUD + market listing
      pipeline.py            Start/status/cancel pipeline
      exports.py             CSV + JSON downloads
  models/                    Pydantic models (project, pipeline, research, keywords, strategy, rsa)
  services/
    kimi_client.py           Moonshot API client + JSON repair
    scraper.py               httpx web crawler
    multi_source_scraper.py  Reddit/Quora/StackExchange/Medium/Web
    dataforseo_client.py     DataForSEO keyword API
    csv_exporter.py          Google Ads Editor CSV
    file_manager.py          Project file I/O
    pipeline_orchestrator.py 6-stage pipeline orchestration
  utils/
    prompts.py               All 7 agent system prompts

frontend/src/
  app/page.tsx               Main wizard page
  components/wizard/         Setup → Running → Results steps
  components/results/        Tabbed results dashboard
  hooks/                     useWebSocket.ts, usePipeline.ts
  services/api.ts            API client
  types/index.ts             TypeScript interfaces
```

## Environment Variables
Configured in `backend/.env` (see `.env.example`):
- `KIMI_API_KEY` (required) — Moonshot AI API key
- `KIMI_API_BASE` — API base URL (default: `https://api.moonshot.ai/v1`)
- `KIMI_MODEL_STANDARD` — Standard model (default: `kimi-k2-turbo-preview`)
- `KIMI_MODEL_THINKING` — Thinking model (default: `kimi-k2.5`)
- `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` — Optional keyword data API

## Conventions
- Backend follows FastAPI patterns with Pydantic models
- Agents inherit from BaseAgent ABC — do not create agents without this base class
- All agent prompts centralized in `utils/prompts.py` — never hardcode prompts in agent files
- Frontend uses React hooks for state management (no Redux/Zustand)
- WebSocket for real-time pipeline progress — agents emit via `self.emit_progress()`
- In-memory project storage (no database) — FileManager handles JSON persistence to disk
