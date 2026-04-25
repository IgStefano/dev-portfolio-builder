# Dev Portfolio Builder

A monorepo for building developer portfolios, with a **React + TypeScript + Vite** frontend and a **Python + FastAPI** backend.

## Project Structure

```
.
├── frontend/       # React + TypeScript + Vite
├── backend/        # Python + FastAPI (managed with uv)
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
