import requests
import json
import os
import sys

def log(msg):
    print(msg, flush=True)

BASE = 'http://127.0.0.1:8000/api'
pdf_dir = 'scratch/sample_pdfs'
pdf_files = [os.path.join(pdf_dir, f) for f in os.listdir(pdf_dir) if f.endswith('.pdf')]

log(f'=== STEP 1: Uploading {len(pdf_files)} Real Open-Access Research PDFs ===')
files_payload = [('files', (os.path.basename(p), open(p, 'rb'), 'application/pdf')) for p in pdf_files]
res = requests.post(f'{BASE}/papers/upload', files=files_payload)
log(f'Upload response status: {res.status_code}')
upload_items = res.json()
log('Upload results:')
for u in upload_items:
    log(f'  - {u["name"]}: status={u["status"]}, pages={u.get("pages")}, sizeMb={u.get("sizeMb")} MB')

log('\n=== STEP 2: Duplicate PDF Detection Test ===')
res_dup = requests.post(f'{BASE}/papers/upload', files=[('files', (os.path.basename(pdf_files[0]), open(pdf_files[0], 'rb'), 'application/pdf'))])
dup_item = res_dup.json()[0]
log(f'  - Duplicate result for {dup_item["name"]}: status={dup_item["status"]}, error="{dup_item.get("error")}"')

log('\n=== STEP 3: Executing ML Pipeline ===')
res_an = requests.post(f'{BASE}/analyze')
log(f'Analyze response status: {res_an.status_code}')
log(f'Analyze results: {json.dumps(res_an.json(), indent=2)}')

log('\n=== STEP 4: Verifying Dashboard Stats ===')
res_db = requests.get(f'{BASE}/dashboard')
db = res_db.json()
log(f'  Total Papers: {db["totalPapers"]}')
log(f'  Research Topics: {db["researchTopics"]}')
log(f'  Potential Gaps: {db["potentialGaps"]}')
log(f'  Generated Ideas: {db["generatedIdeas"]}')
log(f'  Average Similarity: {db["averageSimilarity"]}%')

log('\n=== STEP 5: Verifying Research Landscape ===')
res_ls = requests.get(f'{BASE}/landscape')
ls = res_ls.json()
log(f'  Papers Analyzed: {ls["papersAnalyzed"]}')
log(f'  Topics Identified: {ls["topicsIdentified"]}')
log(f'  Algorithm Adoption: {[a["name"] for a in ls["algorithmAdoption"][:5]]}')
log(f'  Dataset Concentration: {[d["name"] for d in ls["datasetConcentration"][:5]]}')

log('\n=== STEP 6: Verifying Potential Research Gaps & Evidence ===')
res_gp = requests.get(f'{BASE}/gaps')
gaps = res_gp.json()
log(f'  Found {len(gaps)} gaps:')
for g in gaps:
    log(f'  * [{g["category"]}] {g["title"]}')
    log(f'    - Corpus-based Gap Score: {g["gapScore"]}/100')
    log(f'    - Evidence count: {len(g["evidence"])}')
    if g["evidence"]:
        log(f'    - Sample quote from corpus: "{g["evidence"][0]["quote"][:90]}..."')

log('\n=== STEP 7: Verifying Potentially Novel Research Directions ===')
res_id = requests.get(f'{BASE}/ideas')
ideas = res_id.json()
log(f'  Found {len(ideas)} research directions:')
for i in ideas:
    log(f'  * {i["title"]}')
    log(f'    - Corpus Novelty Indicator: {i["noveltyScore"]}%, Impact: {i["impactScore"]}%, Feasibility: {i["feasibilityScore"]}%')
    log(f'    - Addressing Gap: {i["researchGap"]}')
    log(f'    - Supported by: {i["supportingPapers"]} paper(s)')

log('\n=== STEP 8: Verifying Semantic Paper Retrieval ===')
res_sim = requests.post(f'{BASE}/similar', json={'query': 'Deep convolutional neural networks and sliding window feature extraction for human activity recognition on wearable inertial sensors'})
similar = res_sim.json()
log(f'  Returned {len(similar)} ranked matches:')
for s in similar[:3]:
    log(f'  * {s["title"]} ({s["similarity"]}% similarity)')
    log(f'    Rationale: {s["whySimilar"][0]}')

log('\n=== STEP 9: Verifying ML Model Lab Results ===')
res_md = requests.get(f'{BASE}/models')
models = res_md.json()
log(f'  Trained {len(models)} classifiers:')
for m in models:
    log(f'  * {m["name"]} ({m["family"]}): Acc={m["accuracy"]}%, F1={m["f1"]}%, Time={m["trainingTimeSec"]}s')
    log(f'    Confusion matrix shape: {len(m["confusionMatrix"])}x{len(m["confusionMatrix"][0])}')
