import sys
import asyncio
sys.path.append('backend')
import database as db
import ml_pipeline as ml
from routers.analysis import analyze, AnalyzeRequest

analyzed_ids = db.load_state('paper_ids_at_analysis', [])
print(f"Running analyze for paper_ids: {analyzed_ids}")

result = asyncio.run(analyze(AnalyzeRequest(paper_ids=analyzed_ids)))
print("Analyze result:", result)

mr = db.load_state("model_results", {})
unsup = mr.get("unsupervised", {})
print("\n--- Model Results State in DB ---")
print("totalRelevantPapers:", unsup.get("totalRelevantPapers"))
print("numClusters:", unsup.get("numClusters"))
print("silhouetteScore:", unsup.get("silhouetteScore"))
print("clusters:")
for c in unsup.get("clusters", []):
    print(f"  Cluster {c.get('id')}: {c.get('name')} (paperCount: {c.get('paperCount')})")

topics = db.load_state("topics", [])
print(f"\n--- Topics ({len(topics)}) ---")
for t in topics:
    print(f"  {t.get('name')} ({t.get('paperCount')} papers)")
