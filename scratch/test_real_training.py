import sys
sys.path.append('backend')
import database as db
import ml_pipeline as ml

analyzed_ids = db.load_state('paper_ids_at_analysis', [])
all_papers = db.get_all_papers()
papers = [p for p in all_papers if p['id'] in set(analyzed_ids)]

print(f"Training classifiers on {len(papers)} papers...")
train_res = ml.train_classifiers(papers)
print("Supervised models count:", len(train_res.get("supervised", [])))
for m in train_res.get("supervised", []):
    print(f"  Model {m['id']} ({m['name']}): accuracy={m['accuracy']}%, F1={m['f1']}%")

print("\nTesting predict_with_model for each paper:")
for p in papers:
    text = f"{p['title']} {p.get('abstract', '')}"
    print(f"\n--- {p['title'][:50]} ---")
    for mid in ["rf", "svm", "lr", "nb", "dt", "mlp", "knn"]:
        pred = ml.predict_with_model(text=text, model_id=mid)
        top = pred['predictedTopic']
        conf = pred['confidence']
        print(f"  {mid.upper():4s}: {top} ({conf}%) | lat: {pred['latencyMs']}ms")
