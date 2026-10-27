import os
import sys
import json

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.insert(0, backend_dir)

import database as db
import ml_pipeline as ml

papers = db.get_all_papers()
print(f"Total papers in DB: {len(papers)}")

# 1. Test train_classifiers
res = ml.train_classifiers(papers)
print("\n--- Model Lab Supervised Results ---")
for m in res.get("supervised", []):
    print(f"Model: {m['name']} ({m['id']}) -> Acc: {m['accuracy']}%, Prec: {m['precision']}%, Rec: {m['recall']}%, F1: {m['f1']}%, Time: {m['trainingTimeSec']}s, CM: {m['confusionMatrix']}")

# 2. Test find_similar_papers
embeddings = db.load_state("embeddings", [])
if not embeddings:
    texts = [ml._paper_text(p) for p in papers]
    embeddings = ml._get_embeddings(texts).tolist()

print("\n--- Testing Similar Papers Queries ---")
for q in ["YOLO related papers", "lightweight transformer human activity recognition", "explainable HAR"]:
    sim_res = ml.find_similar_papers(q, papers, embeddings)
    print(f"\nQuery: '{q}' -> {len(sim_res)} results:")
    for r in sim_res:
        print(f"  - [{r['similarity']}%] {r['title'][:60]} (Topic: {r['topic']})")
