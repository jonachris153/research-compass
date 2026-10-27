import sys, os
sys.path.insert(0, os.path.abspath('.'))
import backend.database as db
import backend.ml_pipeline as ml
import numpy as np

papers = db.get_all_papers()
res = ml.train_classifiers(papers)

test_text = "Lightweight CNN model on edge microcontroller for human activity recognition using accelerometer"

for mid in ['rf', 'svm', 'nb', 'lr', 'dt', 'knn', 'mlp']:
    pred = ml.predict_with_model(test_text, model_id=mid)
    print(f"Model: {mid:<4} ({pred['modelName']:<22}) -> Confidence: {pred['confidence']}%  Topic: {pred['predictedTopic']}")
