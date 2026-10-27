import sys
sys.path.append('backend')
import database as db
import ml_pipeline as ml

analyzed_ids = db.load_state('paper_ids_at_analysis', [])
all_papers = db.get_all_papers()
papers = [p for p in all_papers if p['id'] in set(analyzed_ids)]

algos = ["rf", "svm", "lr", "nb", "dt", "mlp", "knn"]

for p in papers:
    print(f"\n==========================================")
    print(f"Paper: {p['title']}")
    print(f"Topic in DB: {p.get('topic')}")
    print(f"Algorithms: {p.get('algorithms')}")
    print(f"Keywords: {p.get('keywords')[:4]}")
    text = f"{p['title']} {p.get('abstract', '')}"
    for algo in algos:
        pred = ml.predict_with_model(text=text, model_id=algo)
        print(f"  [{algo.upper():4s}] Predicted: {pred['predictedTopic']} ({pred['confidence']}%)")
