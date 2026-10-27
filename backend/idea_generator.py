"""
Research idea generator — converts validated gaps into actionable, domain-grounded project directions.
Every idea strictly lists supporting paper IDs and supporting gap IDs.
"""
from __future__ import annotations

from collections import Counter

TECHNIQUE_MAP = {
    "future-work": [
        "Cross-Subject Adaptation",
        "Explainable AI",
        "Lightweight Transformers",
        "Benchmarking Protocol",
    ],
    "dataset": [
        "Cross-Dataset Evaluation",
        "Domain Adaptation",
        "Self-Supervised Pretraining",
        "Transfer Learning",
    ],
    "algorithm": [
        "Hybrid CNN-Transformer",
        "Ensemble Classification",
        "Feature Selection",
        "Lightweight Inference",
    ],
    "methodology": [
        "Interpretable Attention",
        "Federated Sensor Aggregation",
        "Ablation Framework",
        "Robustness Testing",
    ],
    "application": [
        "Edge Deployment",
        "On-Device TinyML",
        "Real-Time Activity Segmentation",
        "Wearable Sensing",
    ],
}

DIFFICULTY_MAP = {
    "future-work": "Intermediate",
    "dataset": "Intermediate",
    "algorithm": "Intermediate",
    "methodology": "Advanced",
    "application": "Beginner",
}


def generate_ideas(gaps: list[dict], papers: list[dict]) -> list[dict]:
    """
    Generate actionable research directions derived strictly from validated gaps.
    Returns list of ResearchIdea dicts with supportingPaperIds and supportingGapIds.
    """
    if not gaps:
        return []

    # Map relevant papers
    relevant_papers = [p for p in papers if p.get("relevanceCategory") != "low"] or papers

    ideas = []

    for i, gap in enumerate(gaps):
        category = gap.get("category", "methodology")
        techniques = TECHNIQUE_MAP.get(category, ["Machine Learning", "Wearable Sensing"])

        gap_algos = gap.get("algorithms", [])
        combined_techniques = list(dict.fromkeys(techniques + gap_algos))[:5]

        # Extract paper IDs associated with this gap's evidence
        evidence = gap.get("evidence", [])
        evidence_paper_ids = [e["paperId"] for e in evidence if "paperId" in e]
        if not evidence_paper_ids:
            evidence_paper_ids = [p["id"] for p in relevant_papers[:3]]
        evidence_paper_ids = list(dict.fromkeys(evidence_paper_ids))

        # Build solution and problem statements
        target_datasets = ", ".join(gap.get("datasets", ["standard HAR benchmarks"])[:2]) or "standard HAR benchmarks"
        target_algos = ", ".join(gap.get("algorithms", ["sensor classifiers"])[:2]) or "sensor classifiers"

        if category == "future-work":
            title = f"Adaptive Generalization Protocol for {gap.get('title', 'Wearable Sensing')}"
            problem = (
                f"Corpus evidence from {len(evidence_paper_ids)} paper(s) highlights unaddressed limitations in "
                "cross-user generalization and real-world sensor variability."
            )
            solution = (
                f"Develop a self-adaptive pipeline combining {target_algos} with subject-wise normalization "
                f"evaluated systematically across {target_datasets}."
            )
        elif category == "dataset":
            title = f"Cross-Benchmark Generalization Framework across {target_datasets}"
            problem = (
                f"Evaluation is heavily concentrated on single benchmarks ({target_datasets}), "
                "leaving cross-domain transfer performance unmeasured."
            )
            solution = (
                f"Establish a standardized leave-one-dataset-out evaluation protocol using {target_algos} "
                f"with harmonized sensor channel alignments across {target_datasets}."
            )
        elif category == "algorithm":
            title = f"Lightweight Hybrid {target_algos} Architecture for Wearable HAR"
            problem = (
                f"Dominant reliance on {target_algos} creates potential blind spots regarding "
                "latency-accuracy trade-offs on resource-constrained wearable edge devices."
            )
            solution = (
                f"Design a compact hybrid architecture integrating {target_algos} with feature selection, "
                f"measuring both macro-F1 and inference latency on {target_datasets}."
            )
        else:
            title = f"Empirical Investigation into {gap.get('title', 'Activity Recognition')}"
            problem = (
                f"The corpus indicates that '{gap.get('title')}' is currently underexplored, "
                f"with only {gap.get('affectedPapers', 1)} paper(s) addressing this sub-domain."
            )
            solution = (
                f"Formulate a comparative benchmark evaluating {target_algos} architectures on {target_datasets} "
                "with an emphasis on interpretability and feature attribution."
            )

        novelty_score = round(min(96.0, gap.get("gapScore", 70.0) * 0.95 + 4.0), 1)
        impact_score = round(min(92.0, gap.get("impactScore", 70.0) * 0.95 + 3.0), 1)
        feasibility_score = round(min(95.0, gap.get("confidence", 70.0) + 8.0), 1)

        ideas.append({
            "id": f"idea-{i + 1}",
            "title": title,
            "problemStatement": problem,
            "proposedSolution": solution,
            "researchGap": gap.get("title", ""),
            "techniques": combined_techniques,
            "noveltyScore": novelty_score,
            "impactScore": impact_score,
            "feasibilityScore": feasibility_score,
            "confidence": round(gap.get("confidence", 75.0), 1),
            "supportingPapers": len(evidence_paper_ids),
            "supportingGaps": 1,
            "supportingPaperIds": evidence_paper_ids,
            "supportingGapIds": [gap.get("id", f"gap-{i+1}")],
            "difficulty": DIFFICULTY_MAP.get(category, "Intermediate"),
        })

    return ideas
