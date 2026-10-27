# Research Compass AI — Backend

## Quick Start

### 1. Prerequisites
- Python 3.10+
- pip

### 2. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

> **Note:** `sentence-transformers` will download the `all-MiniLM-L6-v2` model (~90 MB) on first use. Subsequent runs are instant.

### 3. Configure environment (optional)

```bash
cp .env.example .env
# Edit .env if needed (default port is 8000)
```

### 4. Start the backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 5. Start the frontend (separate terminal)

```bash
# From project root
npm install
npm run dev
```

The frontend dev server proxies `/api/*` → `http://localhost:8000`.

---

## API Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:**       http://localhost:8000/redoc
- **Health:**      http://localhost:8000/api/health

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/papers/upload` | Upload 1–20 PDF files |
| GET | `/api/papers` | List papers (search, filter, paginate) |
| GET | `/api/papers/facets` | Get filter facet values |
| GET | `/api/papers/{id}` | Single paper detail |
| DELETE | `/api/papers/{id}` | Remove a paper |
| POST | `/api/analyze` | Run full ML pipeline |
| GET | `/api/dashboard` | Dashboard statistics |
| GET | `/api/landscape` | Research landscape data |
| GET | `/api/models` | ML model comparison results |
| GET | `/api/gaps` | Detected research gaps |
| GET | `/api/ideas` | Generated research ideas |
| POST | `/api/similar` | Semantic similarity search |
| GET | `/api/search?q=` | Global search |

---

## PDF Requirements

- **Format:** PDF only (validated by magic bytes)
- **Size:** Max 50 MB per file
- **Source:** Open-access only (arXiv, PubMed Central, DOAJ, institutional repos)
- **Scanned PDFs:** Detected with a warning; text extraction may be incomplete

## Important Notes

- Evidence in gap/idea results comes **only** from your uploaded corpus
- Scores are **corpus-based indicators**, not proofs of global novelty
- Labels used: "Potential Research Gap", "Corpus-based Gap Score", "Potentially Novel Direction"
- No authentication, billing, or external API dependencies
