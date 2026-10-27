"""
Papers router:
  POST /api/papers/upload  — multipart PDF upload
  GET  /api/papers         — paginated, filtered list
  GET  /api/papers/{id}    — single paper detail
  DELETE /api/papers/{id}  — remove a paper
"""
from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import JSONResponse

import database as db
import pdf_processor as pdf

router = APIRouter(tags=["papers"])

def get_session(request: Request) -> str:
    return request.headers.get("x-session-id") or "default"


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

@router.post("/upload")
async def upload_papers(request: Request, files: list[UploadFile] = File(...)):
    """
    Accept 1–20 PDF files. Returns UploadItem[] with per-file status.
    Validates: magic bytes, size, duplicate (SHA-256), scanned PDFs.
    """
    session_id = get_session(request)
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")
    if len(files) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 files per upload.")

    results = []
    for upload in files:
        filename = upload.filename or "unknown.pdf"
        data = await upload.read()
        file_hash = db.file_hash(data)
        item_id = f"paper-{uuid.uuid4().hex[:12]}"

        # --- Validation ---
        try:
            pdf.validate_file(filename, data)
        except pdf.PDFValidationError as e:
            results.append({
                "id": item_id,
                "name": filename,
                "pages": 0,
                "sizeMb": round(len(data) / 1024 / 1024, 2),
                "status": "failed",
                "error": str(e),
            })
            continue

        # --- Duplicate detection ---
        if db.paper_exists_by_hash(file_hash, session_id=session_id):
            existing = db.get_paper_by_hash(file_hash, session_id=session_id)
            db.save_state("analysis_done", False, session_id=session_id)
            results.append({
                "id": existing["id"] if existing else item_id,
                "name": filename,
                "pages": existing.get("metadata", {}).get("pages", 1) if existing else 1,
                "sizeMb": round(len(data) / 1024 / 1024, 2),
                "status": "ready",
                "error": None,
                "title": existing.get("title", filename.replace(".pdf", "").title()) if existing else filename,
                "authors": existing.get("authors", []) if existing else [],
                "year": existing.get("year", 2024) if existing else 2024,
                "domain": existing.get("domain", "Human Activity Recognition") if existing else "Human Activity Recognition",
                "keywords": (existing.get("keywords", [])[:8]) if existing else [],
                "algorithms": (existing.get("algorithms", [])[:6]) if existing else [],
                "datasets": (existing.get("datasets", [])[:4]) if existing else [],
                "abstract": ((existing.get("abstract", "")[:220] + "…") if len(existing.get("abstract", "")) > 220 else existing.get("abstract", "")) if existing else "",
                "journal": existing.get("metadata", {}).get("journal", "Uploaded Paper") if existing else "Uploaded Paper",
            })
            continue

        # --- Extraction ---
        try:
            extracted = pdf.process_pdf(filename, data)
        except Exception as e:
            results.append({
                "id": item_id,
                "name": filename,
                "pages": 0,
                "sizeMb": round(len(data) / 1024 / 1024, 2),
                "status": "failed",
                "error": f"Extraction error: {str(e)[:200]}",
            })
            continue

        # --- Build Paper dict ---
        paper_dict = {
            "id": item_id,
            "title": extracted.title,
            "authors": extracted.authors,
            "year": extracted.year,
            "topic": "Unanalyzed",
            "domain": extracted.domain,
            "algorithms": extracted.algorithms,
            "datasets": extracted.datasets,
            "keywords": extracted.keywords,
            "similarity": 0.0,
            "status": "ready",
            "abstract": extracted.abstract,
            "methodology": extracted.methodology,
            "results": extracted.results_text,
            "limitations": extracted.limitations,
            "futureWork": extracted.future_work,
            "opportunities": [],
            "metadata": {
                "pages": extracted.pages,
                "sizeMb": extracted.size_mb,
                "journal": "Uploaded Paper",
                "doi": None,
                "citations": 0,
                "references": 0,
                "demo": False,
            },
        }

        # Persist
        db.save_paper(item_id, file_hash, filename, paper_dict, extracted.raw_text, session_id=session_id)

        # Invalidate analysis cache so next GET /api/dashboard re-runs
        db.save_state("analysis_done", False, session_id=session_id)

        status_val = "ready"
        error_val = None
        if extracted.is_scanned:
            status_val = "ready"
            error_val = extracted.warnings[0] if extracted.warnings else None

        results.append({
            "id": item_id,
            "name": filename,
            "pages": extracted.pages,
            "sizeMb": extracted.size_mb,
            "status": status_val,
            "error": error_val,
            # Structured metadata for immediate display in the upload modal
            "title": extracted.title,
            "authors": extracted.authors,
            "year": extracted.year,
            "domain": extracted.domain,
            "keywords": extracted.keywords[:8],
            "algorithms": extracted.algorithms[:6],
            "datasets": extracted.datasets[:4],
            "abstract": (extracted.abstract[:220] + "…") if len(extracted.abstract) > 220 else extracted.abstract,
            "journal": _detect_journal(extracted.raw_text),
        })

    # Record the IDs of papers uploaded in this batch as latest_uploaded_ids
    valid_ids = [r["id"] for r in results if r.get("status") != "failed"]
    if valid_ids:
        db.save_state("latest_uploaded_ids", valid_ids, session_id=session_id)

    return results


def _detect_journal(text: str) -> str:
    """Heuristically extract journal/conference name from PDF text."""
    import re
    patterns = [
        r"(?i)\bpublished in\s+([A-Z][^\n]{5,60})",
        r"(?i)\bin\s+proceedings of\s+([^\n]{5,60})",
        r"(?i)\b(IEEE\s+[A-Z][^\n]{3,50})",
        r"(?i)\b(ACM\s+[A-Z][^\n]{3,50})",
        r"(?i)\b(Nature\s+[A-Z][^\n]{3,50})",
        r"(?i)\bjournal of\s+([^\n]{5,60})",
        r"(?i)\b(Sensors|MDPI\s+\w+|Frontiers in [^\n]{3,40})",
        r"(?i)\b(arXiv:\d+\.\d+)",
    ]
    for pat in patterns:
        m = re.search(pat, text[:3000])
        if m:
            return m.group(1).strip()[:80]
    return "Preprint / Conference"


# ---------------------------------------------------------------------------
# List papers
# ---------------------------------------------------------------------------

@router.get("")
async def list_papers(
    request: Request,
    search: str = Query(""),
    topic: str = Query("all"),
    year: str = Query("all"),
    algorithm: str = Query("all"),
    dataset: str = Query("all"),
    domain: str = Query("all"),
    sort: str = Query("newest"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
):
    session_id = get_session(request)
    analyzed_ids: list[str] = db.load_state("paper_ids_at_analysis", [], session_id=session_id)
    if analyzed_ids:
        all_papers = db.get_all_papers(session_id)
        id_set = set(analyzed_ids)
        papers = [p for p in all_papers if p["id"] in id_set]
    else:
        papers = []

    # --- Filter ---
    term = search.strip().lower()
    filtered = []
    for p in papers:
        if term:
            haystack = " ".join([
                p.get("title", ""),
                p.get("topic", ""),
                " ".join(p.get("authors", [])),
                " ".join(p.get("algorithms", [])),
                " ".join(p.get("keywords", [])),
            ]).lower()
            if term not in haystack:
                continue
        if topic != "all" and p.get("topic") != topic:
            continue
        if year != "all" and str(p.get("year", "")) != year:
            continue
        if algorithm != "all" and algorithm not in p.get("algorithms", []):
            continue
        if dataset != "all" and dataset not in p.get("datasets", []):
            continue
        if domain != "all" and p.get("domain") != domain:
            continue
        filtered.append(p)

    # --- Sort ---
    if sort == "newest":
        filtered.sort(key=lambda p: p.get("year", 0), reverse=True)
    elif sort == "oldest":
        filtered.sort(key=lambda p: p.get("year", 0))
    elif sort == "similar":
        filtered.sort(key=lambda p: p.get("similarity", 0), reverse=True)
    elif sort == "cited":
        filtered.sort(key=lambda p: p.get("metadata", {}).get("citations", 0), reverse=True)

    total = len(filtered)
    start = (page - 1) * pageSize
    page_items = filtered[start: start + pageSize]

    return {
        "items": page_items,
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "pages": max(1, -(-total // pageSize)),
    }


@router.get("/facets")
async def get_facets(request: Request):
    session_id = get_session(request)
    analyzed_ids: list[str] = db.load_state("paper_ids_at_analysis", [], session_id=session_id)
    if analyzed_ids:
        all_papers = db.get_all_papers(session_id)
        id_set = set(analyzed_ids)
        papers = [p for p in all_papers if p["id"] in id_set]
    else:
        papers = []

    def uniq(vals: list[str]) -> list[str]:
        return sorted(set(v for v in vals if v))

    return {
        "topics": uniq(p.get("topic", "") for p in papers),
        "years": sorted(set(str(p.get("year", "")) for p in papers), reverse=True),
        "algorithms": uniq(a for p in papers for a in p.get("algorithms", [])),
        "datasets": uniq(d for p in papers for d in p.get("datasets", [])),
        "domains": uniq(p.get("domain", "") for p in papers),
    }


# ---------------------------------------------------------------------------
# Single paper
# ---------------------------------------------------------------------------

@router.get("/{paper_id}")
async def get_paper(paper_id: str, request: Request):
    session_id = get_session(request)
    paper = db.get_paper_by_id(paper_id, session_id=session_id)
    if not paper:
        raise HTTPException(status_code=404, detail=f"Paper '{paper_id}' not found.")
    return paper


@router.delete("/{paper_id}")
async def delete_paper(paper_id: str, request: Request):
    session_id = get_session(request)
    paper = db.get_paper_by_id(paper_id, session_id=session_id)
    if not paper:
        raise HTTPException(status_code=404, detail=f"Paper '{paper_id}' not found.")
    db.delete_paper(paper_id, session_id=session_id)
    db.save_state("analysis_done", False, session_id=session_id)
    analyzed_ids: list[str] = db.load_state("paper_ids_at_analysis", [], session_id=session_id)
    if paper_id in analyzed_ids:
        analyzed_ids.remove(paper_id)
        db.save_state("paper_ids_at_analysis", analyzed_ids, session_id=session_id)
    return {"ok": True, "deleted": paper_id}
