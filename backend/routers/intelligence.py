"""
Intelligence router:
  GET  /api/gaps    — ResearchGap[]
  GET  /api/ideas   — ResearchIdea[]
  POST /api/similar — SimilarityResult[]
  GET  /api/search  — GlobalSearchResults
"""
from __future__ import annotations

import re

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

import database as db
import ml_pipeline as ml

router = APIRouter(tags=["intelligence"])

def get_session(request: Request) -> str:
    return request.headers.get("x-session-id") or "default"


class SimilarQuery(BaseModel):
    query: str | None = None
    paperId: str | None = None


# ---------------------------------------------------------------------------
# Gaps
# ---------------------------------------------------------------------------

@router.get("/gaps")
async def get_gaps(request: Request):
    session_id = get_session(request)
    analyzed_ids = db.load_state("paper_ids_at_analysis", [], session_id=session_id)
    if not analyzed_ids:
        return []

    gaps = db.get_gaps(session_id=session_id)
    if not gaps:
        return []

    # Final API Safety Validation: Ensure evidence objects contain strictly concise 1-2 sentence quotes
    clean_gaps = []
    for g in gaps:
        clean_evidence = []
        for ev in g.get("evidence", []):
            raw_quote = str(ev.get("quote", "")).strip()
            # Strip URLs, large references, and newlines
            clean_q = re.sub(r"https?://\S+|www\.\S+", "", raw_quote)
            clean_q = re.sub(r"\s+", " ", clean_q).strip()

            if len(clean_q) > 300:
                sub = clean_q[:260]
                last_dot = max(sub.rfind("."), sub.rfind("!"), sub.rfind("?"))
                if last_dot > 40:
                    clean_q = sub[:last_dot + 1]
                else:
                    clean_q = sub.rstrip() + "..."

            if not clean_q:
                clean_q = "No concise supporting passage detected."

            clean_evidence.append({
                "paperId": str(ev.get("paperId", "")),
                "paperTitle": str(ev.get("paperTitle", "Untitled Paper")),
                "quote": clean_q,
                "signal": str(ev.get("signal", "Corpus Signal")),
            })

        g_copy = dict(g)
        g_copy["evidence"] = clean_evidence
        clean_gaps.append(g_copy)

    return clean_gaps


# ---------------------------------------------------------------------------
# Ideas
# ---------------------------------------------------------------------------

@router.get("/ideas")
async def get_ideas(request: Request):
    session_id = get_session(request)
    analyzed_ids = db.load_state("paper_ids_at_analysis", [], session_id=session_id)
    if not analyzed_ids:
        return []
    ideas = db.get_ideas(session_id=session_id)
    return ideas or []


# ---------------------------------------------------------------------------
# Similar papers (semantic search with SentenceTransformer)
# ---------------------------------------------------------------------------

@router.post("/similar")
async def find_similar(request: Request, body: SimilarQuery):
    session_id = get_session(request)
    analyzed_ids = db.load_state("paper_ids_at_analysis", [], session_id=session_id)
    if not analyzed_ids:
        return []
    all_papers = db.get_all_papers(session_id)
    id_set = set(analyzed_ids)
    papers = [p for p in all_papers if p["id"] in id_set]
    if not papers:
        return []

    target_query = ""
    excluded_id = None

    if body.paperId:
        target_paper = db.get_paper_by_id(body.paperId, session_id=session_id)
        if target_paper:
            target_query = ml._paper_text(target_paper)
            excluded_id = body.paperId

    if not target_query and body.query:
        q_str = body.query.strip()
        matched = next(
            (p for p in papers if p.get("id") == q_str or p.get("filename", "").lower() == q_str.lower() or (len(q_str) > 5 and q_str.lower() in p.get("filename", "").lower())),
            None
        )
        if matched:
            target_query = ml._paper_text(matched)
            excluded_id = matched.get("id")
        else:
            target_query = q_str

    if not target_query:
        raise HTTPException(status_code=400, detail="Query or paperId cannot be empty.")

    embeddings = db.load_state("embeddings", [])
    if not embeddings or len(embeddings) != len(papers):
        texts = [ml._paper_text(p) for p in papers]
        embs = ml._get_embeddings(texts)
        embeddings = embs.tolist()
        db.save_state("embeddings", embeddings)

    results = ml.find_similar_papers(target_query, papers, embeddings, excluded_id=excluded_id)
    return results


# ---------------------------------------------------------------------------
# Global search
# ---------------------------------------------------------------------------

@router.get("/search")
async def global_search(q: str = Query("")):
    term = q.strip().lower()
    if not term:
        return {"papers": [], "topics": [], "gaps": [], "ideas": []}

    def match(s: str) -> bool:
        return term in s.lower()

    papers = db.get_all_papers()
    gaps = db.get_gaps()
    ideas = db.get_ideas()
    topics = db.load_state("topics", [])

    matched_papers = [
        p for p in papers
        if match(p.get("title", ""))
        or match(p.get("topic", ""))
        or any(match(a) for a in p.get("algorithms", []))
        or any(match(a) for a in p.get("authors", []))
    ][:6]

    matched_topics = [
        t for t in topics
        if match(t.get("name", ""))
        or any(match(k) for k in t.get("keywords", []))
    ][:4]

    matched_gaps = [
        g for g in gaps
        if match(g.get("title", ""))
        or any(match(a) for a in g.get("algorithms", []))
    ][:4]

    matched_ideas = [
        i for i in ideas
        if match(i.get("title", ""))
        or any(match(t) for t in i.get("techniques", []))
    ][:4]

    return {
        "papers": matched_papers,
        "topics": matched_topics,
        "gaps": matched_gaps,
        "ideas": matched_ideas,
    }
