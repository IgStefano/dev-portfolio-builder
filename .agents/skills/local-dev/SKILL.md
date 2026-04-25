# Local Development

## Project Structure

Monorepo with `frontend/` (React + Vite + Tailwind + TanStack Router/Query) and `backend/` (Python + FastAPI + uv).

## Running Servers

**Backend** (port 8000):
```bash
cd backend && uv sync && uv run uvicorn main:app --reload
```

**Frontend** (port 5173):
```bash
cd frontend && npm install && npm run dev
```

Vite proxies `/api` requests to the backend.

## Linting & Type Checking

**Frontend:**
```bash
cd frontend
npm run lint        # ESLint
npx tsc -b          # TypeScript
npm run build       # Full build (tsc + vite)
```

**Backend:**
```bash
cd backend
uv run ruff check .           # Lint
uv run ruff format --check .  # Format check
```

## API Code Generation (Orval)

When backend endpoints change:

1. Export OpenAPI schema:
```bash
cd backend
uv run python -c "
import json
from main import app
from fastapi.openapi.utils import get_openapi
schema = get_openapi(title=app.title, version=app.version, routes=app.routes)
with open('openapi.json', 'w') as f:
    json.dump(schema, f, indent=2)
"
```

2. Regenerate typed TanStack Query hooks:
```bash
cd frontend
npm run generate:api
```

Generated file: `frontend/src/api/generated.ts` (excluded from ESLint).
Custom HTTP client: `frontend/src/api/client.ts` (fetch-based, no axios).

## Key Config Files

- `frontend/orval.config.ts` — Orval code generation config
- `frontend/tailwind.config.js` — Tailwind content paths
- `frontend/vite.config.ts` — Vite plugins (TanStack Router, React) + API proxy
- `frontend/eslint.config.js` — ESLint with TanStack Router `Route` export allowance
- `backend/pyproject.toml` — Python deps managed by uv
