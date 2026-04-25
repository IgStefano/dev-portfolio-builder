# Dev Portfolio Builder

A web app that turns a GitHub profile URL into a single-page developer portfolio
in under a minute. Paste your GitHub URL, pick a theme, and hit generate. The
product extracts signal from your GitHub profile (bio, top repos, languages,
READMEs), an LLM writes the copy (hero, about, project blurbs, optional blog
stubs), and the result is rendered through one of three preset visual themes
inside a live preview.

From the preview, you can switch themes instantly, change the tone (professional
/ playful / minimal), regenerate the copy, or steer it with a free-form text
instruction.

## Tech Stack

| Layer    | Technology                                                           |
| -------- | -------------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v3, TanStack Router/Query  |
| Backend  | Python 3.12, FastAPI, uvicorn, Pydantic                              |
| UI       | Radix primitives, class-variance-authority, clsx, tailwind-merge     |
| Tooling  | uv (Python), npm (Node), Orval (API codegen), Ruff (lint), ESLint   |

## Prerequisites

- **Node.js** >= 20
- **Python** >= 3.12
- **uv** ([install guide](https://docs.astral.sh/uv/getting-started/installation/))

## Getting Started

### 1. Environment setup

```bash
# Copy the example env file and add your Anthropic key
cp backend/.env.example backend/.env
# Edit backend/.env and set ANTHROPIC_API_KEY=sk-ant-...
```

> **Note:** The app works without an API key — the landing page shows a
> "Demo mode" banner and generation returns stub data. Set the key to enable
> real LLM-powered copy.

### 2. Run the backend

```bash
cd backend
uv sync
uv run uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. Interactive docs at
`http://localhost:8000/docs`.

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs at `http://localhost:5173` and proxies `/api`
requests to the backend.

### 4. Open the app

Navigate to `http://localhost:5173` in your browser, paste a GitHub profile URL,
choose your options, and generate your portfolio.

## Project Structure

```
.
├── frontend/           # React + TypeScript + Vite
│   ├── src/
│   │   ├── api/               # HTTP client + Orval-generated hooks
│   │   ├── components/ui/     # shadcn-style UI components (Radix + CVA)
│   │   ├── lib/               # Utilities, postMessage channel, theme CSS
│   │   └── routes/            # TanStack Router file-based routes
│   └── orval.config.ts        # Orval code generation config
├── backend/            # Python + FastAPI
│   ├── main.py                # FastAPI app with endpoints
│   ├── schemas.py             # Pydantic models (API contract)
│   ├── github_client.py       # GitHub REST API integration
│   ├── fixtures/              # Sample data for stub mode
│   ├── tests/                 # pytest test suite
│   ├── openapi.json           # Generated OpenAPI schema
│   ├── .env.example           # Environment template
│   └── pyproject.toml         # Python dependencies
└── README.md
```

## Development

### API Code Generation (Orval)

When you modify backend endpoints, regenerate the frontend API hooks:

```bash
# 1. Export the updated OpenAPI schema
cd backend
uv run python -c "
import json
from main import app
from fastapi.openapi.utils import get_openapi
schema = get_openapi(title=app.title, version=app.version, routes=app.routes)
with open('openapi.json', 'w') as f:
    json.dump(schema, f, indent=2)
"

# 2. Regenerate typed hooks
cd ../frontend
npm run generate:api
```

### Linting

```bash
# Frontend
cd frontend && npm run lint

# Backend
cd backend && uv run ruff check . && uv run ruff format --check .
```

### Type Checking

```bash
cd frontend && npx tsc -b
```

### Building

```bash
cd frontend && npm run build
```
