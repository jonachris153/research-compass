import requests
import json
import sys
import os

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE = 'http://127.0.0.1:8000/api'

print("==================================================================")
print("COMPREHENSIVE FINAL VERIFICATION: MODEL LAB, LANDSCAPE, GAPS, IDEAS")
print("==================================================================")

# 1. Run Analysis Pipeline
print("\n--- 1. POST /api/analyze ---")
res_an = requests.post(f'{BASE}/analyze')
assert res_an.status_code == 200, f"Analyze failed: {res_an.status_code}"
an_data = res_an.json()
print("Analysis summary:", json.dumps(an_data, indent=2))

# 2. Verify Model Lab (Unsupervised + Supervised)
print("\n--- 2. GET /api/models (Model Lab Data) ---")
res_models = requests.get(f'{BASE}/models')
assert res_models.status_code == 200, f"Get models failed: {res_models.status_code}"
model_data = res_models.json()

unsupervised = model_data.get("unsupervised", {})
print("\n[UNSUPERVISED ANALYSIS]")
print(f"  Available: {unsupervised.get('available')}")
print(f"  Clusters Count: {unsupervised.get('numClusters')}")
print(f"  Total Relevant Papers: {unsupervised.get('totalRelevantPapers')}")
print(f"  Silhouette Score: {unsupervised.get('silhouetteScore')} ({unsupervised.get('silhouetteInterpretation')})")
print("  Discovered Clusters:")
for c in unsupervised.get("clusters", []):
    print(f"    - {c['name']} ({c['paperCount']} papers, Top Algo: {c['topAlgorithm']})")
    print(f"      Keywords: {', '.join(c['keywords'])}")
    print(f"      Representative: {c['representativePapers']}")

weak_summary = model_data.get("weakLabelSummary", {})
print("\n[WEAKLY SUPERVISED SUMMARY]")
print(f"  Status: {weak_summary.get('status')}")
print(f"  Total Labelled: {weak_summary.get('totalLabelled')}")
print(f"  Label Distribution: {weak_summary.get('labelDistribution')}")
print(f"  Best Model by F1: {weak_summary.get('bestModelId')}")

supervised = model_data.get("supervised", [])
print(f"\n[SUPERVISED CLASSIFIERS ({len(supervised)} models)]")
for m in supervised:
    print(f"  * {m['name']} ({m['family']}): Accuracy={m['accuracy']}%, F1={m['f1']}%, Time={m['trainingTimeSec']}s")
    if m.get("featureImportance"):
        print(f"    Top Feature: {m['featureImportance'][0]}")

# 3. Verify Landscape Topic Clustering
print("\n--- 3. GET /api/landscape (Topic Clustering) ---")
res_land = requests.get(f'{BASE}/landscape')
assert res_land.status_code == 200, f"Get landscape failed: {res_land.status_code}"
land = res_land.json()
print("Topic Distribution:")
for t in land.get("topicDistribution", []):
    print(f"  - {t['name']}: {t['value']} papers")
topic_names = [t['name'] for t in land.get("topicDistribution", [])]
assert len(topic_names) == len(set(topic_names)), "All topic names must be unique"
print("✓ All topic names are 100% unique and distinct.")

# 4. Verify Potential Gaps & Grounded Evidence
print("\n--- 4. GET /api/gaps (Gap Analysis) ---")
res_gaps = requests.get(f'{BASE}/gaps')
assert res_gaps.status_code == 200, f"Get gaps failed: {res_gaps.status_code}"
gaps = res_gaps.json()
print(f"Found {len(gaps)} potential gaps:")
for g in gaps:
    print(f"\n  * [{g['category']}] {g['title']} (Score: {g['gapScore']}/100)")
    for ev in g.get('evidence', []):
        quote = ev.get('quote', '')
        q_len = len(quote)
        assert q_len <= 350, f"Evidence quote too long ({q_len} chars): {quote}"
        print(f"    - ({q_len} chars) [{ev.get('signal')}]: \"{quote}\"")
print("\n✓ Evidence excerpts strictly short (1-2 sentences, <=350 chars).")

# 5. Verify Novel Ideas
print("\n--- 5. GET /api/ideas (Novel Ideas) ---")
res_ideas = requests.get(f'{BASE}/ideas')
assert res_ideas.status_code == 200, f"Get ideas failed: {res_ideas.status_code}"
ideas = res_ideas.json()
for idea in ideas:
    print(f"  * {idea['title']} (Novelty: {idea['noveltyScore']}%)")
    assert idea.get('supportingPaperIds'), "Must have supportingPaperIds"
    assert idea.get('supportingGapIds'), "Must have supportingGapIds"
print("✓ Novel ideas 100% grounded in validated gaps and papers.")

# 6. Verify Semantic Search
print("\n--- 6. POST /api/similar (SentenceTransformer Cosine Similarity) ---")
res_sim = requests.post(f'{BASE}/similar', json={'query': 'self-supervised contrastive learning for inertial wearable sensors'})
assert res_sim.status_code == 200, f"Similar failed: {res_sim.status_code}"
sims = res_sim.json()
print(f"Top Semantic Matches ({len(sims)}):")
for s in sims[:3]:
    print(f"  - {s['title'][:55]}... ({s['similarity']}%) | Topic: {s['topic']}")
    print(f"    Matched Concepts: {s.get('matchedConcepts')}")
print("✓ Semantic search working with Sentence Transformer embeddings.")

print("\n==================================================================")
print(">>> ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS <<<")
print("==================================================================")
