"""
Analysis router:
  POST /api/analyze    — run full ML pipeline with domain relevance filtering
  GET  /api/dashboard  — aggregated DashboardStats for relevant corpus
  GET  /api/landscape  — ResearchLandscape
  GET  /api/models     — MLModelResult[]
"""
from __future__ import annotations

from collections import Counter
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

import database as db
import ml_pipeline as ml
import gap_detector
import idea_generator

router = APIRouter(tags=["analysis"])

def get_session(request: Request) -> str:
    return request.headers.get("x-session-id") or "default"

DEEP_LEARNING_NAMES = {
    "cnn", "lstm", "transformer", "bert", "vit", "mlp", "gru", "autoencoder", "gan",
}


# ---------------------------------------------------------------------------
# Analyzed papers — returns only the papers from the last analysis run
# ---------------------------------------------------------------------------

@router.get("/analyzed-papers")
async def get_analyzed_papers(request: Request):
    """
    Returns the subset of papers that were uploaded / analyzed at that instant.
    This is what the Model Lab 'Select Analyzed Paper' dropdown uses so only
    the paper uploaded at that instant is analyzed, not all previously uploaded papers.
    """
    session_id = get_session(request)
    all_papers = db.get_all_papers(session_id)
    if not all_papers:
        return []

    analyzed_ids: list[str] = db.load_state("paper_ids_at_analysis", [], session_id=session_id)
    if not analyzed_ids:
        latest_ids = db.load_state("latest_uploaded_ids", [], session_id=session_id)
        if latest_ids:
            analyzed_ids = latest_ids
        else:
            return []

    id_set = set(analyzed_ids)
    papers_by_id = {p["id"]: p for p in all_papers}
    matching = [papers_by_id[pid] for pid in analyzed_ids if pid in papers_by_id]
    return matching if matching else all_papers[:1]



# ---------------------------------------------------------------------------
# Analyze
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    paper_ids: Optional[list[str]] = None


@router.post("/analyze")
async def analyze(request: Request, body: AnalyzeRequest | None = None):
    """
    Run the full ML pipeline.
    If body.paper_ids is provided, only those papers are marked as the instant analyzed set.
    Otherwise, if latest_uploaded_ids exists, that is used.
    Models and clusters are calibrated on the broader corpus so topic predictions are rich.
    """
    session_id = get_session(request)
    all_papers = db.get_all_papers(session_id)
    if not all_papers:
        raise HTTPException(status_code=400, detail="No papers uploaded yet.")

    # Filter to requested paper IDs if provided
    requested_ids = (body.paper_ids or []) if body else []
    if requested_ids:
        id_set = set(requested_ids)
        instant_papers = [p for p in all_papers if p["id"] in id_set]
        if not instant_papers:
            raise HTTPException(status_code=400, detail="None of the specified paper IDs were found.")
    else:
        latest_ids = db.load_state("latest_uploaded_ids", [], session_id=session_id)
        if latest_ids:
            id_set = set(latest_ids)
            instant_papers = [p for p in all_papers if p["id"] in id_set] or all_papers[:1]
        else:
            instant_papers = all_papers[:1]

    # Save strictly the IDs of the paper(s) uploaded/analyzed at this instant
    instant_ids = [p["id"] for p in instant_papers]
    db.save_state("paper_ids_at_analysis", instant_ids, session_id=session_id)

    # Scope the entire pipeline strictly to papers submitted in this session.
    # This ensures cluster count, silhouette, gaps, ideas, and ML metrics
    # all reflect exactly the papers the user uploaded — nothing from previous runs.
    corpus_papers = instant_papers

    # --- Step 1: Compute Domain Relevance across all papers ---
    rel_scores, rel_categories = ml.compute_domain_relevance(corpus_papers)
    relevant_ids = set()
    for paper in corpus_papers:
        pid = paper["id"]
        paper["relevanceScore"] = rel_scores.get(pid, 0.0)
        cat = rel_categories.get(pid, "relevant")
        paper["relevanceCategory"] = cat
        if cat != "low":
            relevant_ids.add(pid)

    # --- Step 2: Cluster papers ---
    cluster_result = ml.cluster_papers(corpus_papers, relevant_ids)
    assignments = cluster_result["assignments"]
    topics = cluster_result["topics"]
    embeddings = cluster_result["embeddings"]

    # Update papers in DB
    for paper in corpus_papers:
        pid = paper["id"]
        if pid in assignments:
            paper["topic"] = assignments[pid]["topic"]
            paper["similarity"] = assignments[pid]["similarity"]
        if pid in instant_ids:
            paper["status"] = "analyzed"
        db.update_paper_data(pid, paper, session_id=session_id)

    db.save_state("topics", topics, session_id=session_id)
    db.save_state("embeddings", embeddings, session_id=session_id)

    # --- Step 3: Detect gaps on domain-relevant papers ---
    gaps = gap_detector.detect_gaps(corpus_papers, topics)
    db.save_gaps(gaps, session_id=session_id)

    # --- Step 4: Generate novel ideas from validated gaps ---
    ideas = idea_generator.generate_ideas(gaps, corpus_papers)
    db.save_ideas(ideas, session_id=session_id)

    # --- Step 5: Unsupervised Analysis and Weakly Supervised ML Classifiers ---
    unsupervised = ml.compute_unsupervised_analysis(corpus_papers, embeddings, topics)
    model_lab_results = ml.train_classifiers(corpus_papers)
    model_lab_results["unsupervised"] = unsupervised
    db.save_state("model_results", model_lab_results, session_id=session_id)

    db.save_state("analysis_done", True, session_id=session_id)
    db.save_state("analysis_timestamp", datetime.utcnow().isoformat(), session_id=session_id)

    return {
        "ok": True,
        "papersAnalyzed": len(instant_papers),
        "relevantPapers": len(relevant_ids),
        "excludedLowRelevance": len(corpus_papers) - len(relevant_ids),
        "topicsFound": len(topics),
        "gapsDetected": len(gaps),
        "ideasGenerated": len(ideas),
        "instantPaperIds": instant_ids,
    }


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@router.get("/dashboard")
async def get_dashboard(request: Request):
    # Only use papers that were part of the last analysis run in this session.
    # This ensures all counts & charts reflect exactly the papers the user submitted.
    session_id = get_session(request)
    analyzed_ids: list[str] = db.load_state("paper_ids_at_analysis", [], session_id=session_id)

    if analyzed_ids:
        all_papers = db.get_all_papers(session_id)
        id_set = set(analyzed_ids)
        papers = [p for p in all_papers if p["id"] in id_set]
    else:
        # No analysis run yet — return zero analyzed papers
        papers = []

    if not papers:
        return {
            "totalPapers": 0,
            "researchTopics": 0,
            "potentialGaps": 0,
            "generatedIdeas": 0,
            "averageSimilarity": 0,
            "activity": [],
            "topicDistribution": [],
            "algorithmUsage": [],
            "domainDistribution": [],
            "insights": [],
            "recentPapers": [],
        }

    relevant_papers = [p for p in papers if p.get("relevanceCategory") != "low"] or papers

    gaps = db.get_gaps(session_id=session_id)
    ideas = db.get_ideas(session_id=session_id)
    topics = db.load_state("topics", [], session_id=session_id)

    sims = [p.get("similarity", 0.0) for p in relevant_papers if p.get("similarity", 0) > 0]
    avg_sim = round(sum(sims) / len(sims), 1) if sims else 0.0

    # Topic distribution (relevant only)
    topic_counts: Counter = Counter(p.get("topic", "General HAR") for p in relevant_papers)
    topic_dist = [{"name": name, "value": count} for name, count in topic_counts.most_common(8)]

    # Algorithm usage (relevant only)
    algo_counts: Counter = Counter(a for p in relevant_papers for a in p.get("algorithms", []))
    algo_usage = [{"name": name, "value": count} for name, count in algo_counts.most_common(8)]

    # Domain distribution
    domain_counts: Counter = Counter(p.get("domain", "Human Activity Recognition") for p in relevant_papers)
    domain_dist = [{"name": name, "value": count} for name, count in domain_counts.most_common(6)]

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    current_month = datetime.utcnow().month
    activity = []
    bucket_size = max(1, len(papers) // 8)
    for i in range(min(8, len(papers))):
        m_idx = (current_month - 8 + i) % 12
        batch = papers[i * bucket_size: (i + 1) * bucket_size]
        activity.append({
            "month": months[m_idx],
            "papers": len(batch),
            "ideas": max(0, len(batch) // 3),
        })

    insights = _build_insights(relevant_papers, topics, gaps)

    return {
        "totalPapers": len(papers),
        "researchTopics": len(topics) or len(topic_counts),
        "potentialGaps": len(gaps),
        "generatedIdeas": len(ideas),
        "averageSimilarity": avg_sim,
        "activity": activity,
        "topicDistribution": topic_dist,
        "algorithmUsage": algo_usage,
        "domainDistribution": domain_dist,
        "insights": insights,
        "recentPapers": papers[:6],
    }


def _build_insights(papers, topics, gaps) -> list[dict]:
    insights = []
    n = len(papers)
    if not papers:
        return []

    deep = sum(
        1 for p in papers
        if any(a.lower() in DEEP_LEARNING_NAMES for a in p.get("algorithms", []))
    )
    if n > 0 and deep > 0:
        insights.append({
            "id": "ins-1",
            "title": "Deep & sequence architectures prominent",
            "detail": f"{deep} of {n} relevant papers employ deep learning (CNN/LSTM/Transformers).",
            "sources": deep,
            "tone": "positive",
        })

    ds_counts: Counter = Counter(d for p in papers for d in p.get("datasets", []))
    if ds_counts:
        top_ds, top_count = ds_counts.most_common(1)[0]
        insights.append({
            "id": "ins-2",
            "title": f"Benchmark concentration on {top_ds}",
            "detail": f"'{top_ds}' is evaluated across {top_count} study/studies.",
            "sources": top_count,
            "tone": "warning",
        })

    if gaps:
        insights.append({
            "id": "ins-3",
            "title": f"{len(gaps)} potential research gaps surfaced",
            "detail": "Corpus signals derived strictly from uploaded papers. See Gap Analysis.",
            "sources": len(papers),
            "tone": "neutral",
        })

    return insights[:4]


# ---------------------------------------------------------------------------
# Landscape
# ---------------------------------------------------------------------------

@router.get("/landscape")
async def get_landscape(request: Request):
    session_id = get_session(request)
    analyzed_ids: list[str] = db.load_state("paper_ids_at_analysis", [], session_id=session_id)
    if analyzed_ids:
        all_papers = db.get_all_papers(session_id)
        id_set = set(analyzed_ids)
        papers = [p for p in all_papers if p["id"] in id_set]
    else:
        papers = []

    if not papers:
        return {
            "topicDistribution": [],
            "methodologyEvolution": [],
            "algorithmAdoption": [],
            "datasetConcentration": [],
            "domains": [],
            "keywordTrends": [],
            "evolution": [],
            "topicsCount": 0,
            "datasetsDetected": 0,
            "keywordCloud": [],
        }

    relevant_papers = [p for p in papers if p.get("relevanceCategory") != "low"] or papers
    topics = db.load_state("topics", [], session_id=session_id)

    topic_counts: Counter = Counter(p.get("topic", "General HAR") for p in relevant_papers)
    topic_dist = [{"name": n, "value": c} for n, c in topic_counts.most_common(8)]

    year_counts: Counter = Counter(p.get("year", 2024) for p in relevant_papers)
    deep_year: Counter = Counter()
    classical_year: Counter = Counter()
    for p in relevant_papers:
        yr = p.get("year", 2024)
        algos = [a.lower() for a in p.get("algorithms", [])]
        if any(a in DEEP_LEARNING_NAMES for a in algos):
            deep_year[yr] += 1
        else:
            classical_year[yr] += 1

    all_years = sorted(year_counts.keys())
    evolution = [
        {
            "year": str(y),
            "papers": year_counts[y],
            "deepLearning": deep_year.get(y, 0),
            "classical": classical_year.get(y, 0),
        }
        for y in all_years
    ]

    algo_counts: Counter = Counter(a for p in relevant_papers for a in p.get("algorithms", []))
    algo_adoption = [{"name": n, "value": c} for n, c in algo_counts.most_common(8)]

    ds_counts: Counter = Counter(d for p in relevant_papers for d in p.get("datasets", []))
    dataset_conc = [{"name": n, "value": c} for n, c in ds_counts.most_common(8)]

    domain_counts: Counter = Counter(p.get("domain", "Human Activity Recognition") for p in relevant_papers)
    domains = [{"name": n, "value": c} for n, c in domain_counts.most_common(6)]

    # Clean Keyword cloud
    kw_counts: Counter = Counter(
        kw.lower() for p in relevant_papers
        for kw in p.get("keywords", [])
        if len(kw) > 2 and kw.lower() not in ml.NOISE_WORDS
    )
    max_w = max(kw_counts.values()) if kw_counts else 1
    keyword_cloud = [
        {"text": kw, "weight": round(count / max_w * 100, 1)}
        for kw, count in kw_counts.most_common(20)
    ]

    insights = _build_landscape_insights(relevant_papers, topics)

    return {
        "papersAnalyzed": len(papers),
        "topicsIdentified": len(topics) or len(topic_counts),
        "algorithmsDetected": len(algo_counts),
        "datasetsDetected": len(ds_counts),
        "topicDistribution": topic_dist,
        "evolution": evolution,
        "algorithmAdoption": algo_adoption,
        "datasetConcentration": dataset_conc,
        "domains": domains,
        "keywordCloud": keyword_cloud,
        "clusters": topics,
        "insights": insights,
    }


def _build_landscape_insights(papers, topics) -> list[dict]:
    insights = []
    n = len(papers)
    if not papers:
        return []

    year_counts: Counter = Counter(p.get("year", 2024) for p in papers)
    recent_years = sorted(year_counts.keys())[-3:]
    recent_count = sum(year_counts[y] for y in recent_years)
    if recent_count > 0:
        insights.append({
            "id": "l-1",
            "title": "Recent publication coverage",
            "detail": f"{recent_count} papers represent recent literature ({', '.join(str(y) for y in recent_years)}).",
            "sources": recent_count,
            "tone": "positive",
        })

    ds_counts: Counter = Counter(d for p in papers for d in p.get("datasets", []))
    if ds_counts:
        top_ds, top_n = ds_counts.most_common(1)[0]
        insights.append({
            "id": "l-2",
            "title": f"Primary benchmark: {top_ds}",
            "detail": f"Evaluations cite '{top_ds}' ({top_n} paper(s)).",
            "sources": top_n,
            "tone": "warning",
        })

    if topics:
        fastest = max(topics, key=lambda t: t.get("growth", 0))
        insights.append({
            "id": "l-3",
            "title": f"'{fastest['name']}' represents leading cluster",
            "detail": f"Encompasses {fastest.get('paperCount', 0)} papers in the analyzed domain.",
            "sources": fastest.get("paperCount", 0),
            "tone": "neutral",
        })

    return insights[:4]


# ---------------------------------------------------------------------------
# Model Lab
# ---------------------------------------------------------------------------

@router.get("/models")
async def get_models(request: Request):
    session_id = get_session(request)
    analyzed_ids: list[str] = db.load_state("paper_ids_at_analysis", [], session_id=session_id)
    if not analyzed_ids:
        return {
            "supervised": [],
            "unsupervised": {"available": False, "numClusters": 0, "totalRelevantPapers": 0, "clusters": []},
            "weakLabelSummary": {"status": "ready", "totalLabelled": 0},
        }

    results = db.load_state("model_results", {}, session_id=session_id)
    if not results:
        return {
            "supervised": [],
            "unsupervised": {"available": False, "numClusters": 0, "totalRelevantPapers": 0, "clusters": []},
            "weakLabelSummary": {"status": "ready", "totalLabelled": 0},
        }
    if isinstance(results, list):
        return {
            "supervised": results,
            "unsupervised": {"available": False},
            "weakLabelSummary": {"status": "ready", "totalLabelled": len(results)},
        }
    return results


class PredictRequest(BaseModel):
    text: Optional[str] = None
    paperId: Optional[str] = None
    modelId: Optional[str] = "rf"


@router.post("/models/predict")
async def predict_model(request: Request, body: PredictRequest):
    session_id = get_session(request)
    text = ""
    if body.paperId:
        paper = db.get_paper_by_id(body.paperId, session_id=session_id)
        if paper:
            text = ml._paper_text(paper)
    if not text and body.text:
        text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Must provide text or paperId")

    return ml.predict_with_model(text=text, model_id=body.modelId or "rf")


@router.post("/reset")
async def reset_corpus(request: Request):
    db.clear_all_data()
    return {"ok": True, "message": "All data reset to zero"}



