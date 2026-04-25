# Dev Portfolio Builder

A monorepo for building developer portfolios, with a **React + TypeScript + Vite** frontend and a **Python + FastAPI** backend.

## Tech Stack

| Layer    | Technology                                                  |
| -------- | ----------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v3, TanStack Router, TanStack Query |
| Backend  | Python 3.12, FastAPI, uvicorn, Pydantic                     |
| Tooling  | uv (Python), npm (Node), Orval (API codegen), Ruff (Python lint), ESLint (TS lint) |

## Project Structure

```
.
├── frontend/       # React + TypeScript + Vite
│   ├── src/
│   │   ├── api/           # HTTP client + Orval-generated hooks
│   │   ├── routes/        # TanStack Router file-based routes
│   │   └── main.tsx       # App entry (QueryClient + Router)
│   └── orval.config.ts    # Orval code generation config
├── backend/        # Python + FastAPI (managed with uv)
│   ├── main.py            # FastAPI app with endpoints
│   └── openapi.json       # Generated OpenAPI schema
└── README.md
```

## Prerequisites

- **Node.js** >= 20
- **Python** >= 3.12
- **uv** ([install guide](https://docs.astral.sh/uv/getting-started/installation/))

## Getting Started

### Backend

```bash
cd backend
uv sync
uv run uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs at `http://localhost:5173` and proxies `/api` requests to the backend.

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

This generates `src/api/generated.ts` with typed TanStack Query hooks for every endpoint.

### Linting

**Frontend:**

```bash
cd frontend
npm run lint
```

**Backend:**

```bash
cd backend
uv run ruff check .
uv run ruff format --check .
```

### Building

**Frontend:**

```bash
cd frontend
npm run build
```

### Type Checking

**Frontend:**

```bash
cd frontend
npx tsc -b
```
