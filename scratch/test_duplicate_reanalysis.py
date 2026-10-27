import requests
import json
import os

BASE = 'http://127.0.0.1:8000/api'
pdf_dir = 'scratch/sample_pdfs'
pdf_files = [os.path.join(pdf_dir, f) for f in os.listdir(pdf_dir) if f.endswith('.pdf')][:4]

print("==================================================")
print("TEST: DUPLICATE PDF HANDLING & MULTI-CYCLE RE-ANALYSIS")
print("==================================================")

for cycle in range(1, 4):
    print(f"\n--- CYCLE {cycle}: Uploading {len(pdf_files)} PDFs ---")
    files_payload = [('files', (os.path.basename(p), open(p, 'rb'), 'application/pdf')) for p in pdf_files]
    res_up = requests.post(f'{BASE}/papers/upload', files=files_payload)
    assert res_up.status_code == 200, f"Upload failed with {res_up.status_code}"
    items = res_up.json()
    for item in items:
        print(f"  * File: {item['name']}, Status: {item['status']}, Msg: {item.get('error')}")
        assert item['status'] != 'failed', f"Paper {item['name']} unexpectedly failed!"
        if cycle > 1:
            assert "ready to re-analyze" in (item.get('error') or ""), "Expected duplicate message"

    print(f"--- CYCLE {cycle}: Triggering ML Analysis ---")
    res_an = requests.post(f'{BASE}/analyze')
    assert res_an.status_code == 200, f"Analyze failed with {res_an.status_code}"
    print(f"  Analysis Output: {json.dumps(res_an.json())}")

    res_p = requests.get(f'{BASE}/papers')
    total_papers = res_p.json()['total']
    print(f"  Total papers in database: {total_papers}")

print("\n--- Testing Global Dashboard & Models endpoints ---")
res_db = requests.get(f'{BASE}/dashboard')
assert res_db.status_code == 200
print(f"Dashboard OK: {res_db.json()['totalPapers']} papers, {res_db.json()['potentialGaps']} gaps")

res_mod = requests.get(f'{BASE}/models')
assert res_mod.status_code == 200
print(f"Model Lab OK: {len(res_mod.json())} models benchmarked")

print("\n>>> ALL DUPLICATE HANDLING & RE-ANALYSIS TESTS PASSED WITH 100% SUCCESS! <<<")
