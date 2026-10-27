import requests
import json
import os

BASE = 'http://127.0.0.1:8000/api'
pdf_dir = 'scratch/sample_pdfs'
pdf_files = [os.path.join(pdf_dir, f) for f in os.listdir(pdf_dir) if f.endswith('.pdf')]

print('=== 1. Uploading PDFs ===')
files_payload = [('files', (os.path.basename(p), open(p, 'rb'), 'application/pdf')) for p in pdf_files]
res = requests.post(f'{BASE}/papers/upload', files=files_payload)
print('Upload status:', res.status_code)

print('\n=== 2. Running ML Pipeline (with Domain Relevance Filter) ===')
res_an = requests.post(f'{BASE}/analyze')
print('Analyze status:', res_an.status_code)
print('Analyze summary:', json.dumps(res_an.json(), indent=2))

print('\n=== 3. Checking Papers & Domain Relevance Scores ===')
res_p = requests.get(f'{BASE}/papers')
papers = res_p.json()['items']
print(f'Corpus contains {len(papers)} papers:')
for p in papers:
    print(f'  - [{p.get("relevanceCategory", "N/A").upper()}] {p["title"][:60]}... (Score: {p.get("relevanceScore")}, Topic: {p.get("topic")})')
    print(f'    Algorithms: {p.get("algorithms")}, Datasets: {p.get("datasets")}')

print('\n=== 4. Verifying Dashboard ===')
res_db = requests.get(f'{BASE}/dashboard')
db = res_db.json()
print(f'  Total Papers: {db["totalPapers"]}')
print(f'  Research Topics: {db["researchTopics"]}')
print(f'  Potential Gaps: {db["potentialGaps"]}')
print(f'  Generated Ideas: {db["generatedIdeas"]}')
print('  Top Algorithms:', [a['name'] for a in db['algorithmUsage'][:4]])

print('\n=== 5. Verifying Potential Research Gaps (Domain Grounded) ===')
res_gp = requests.get(f'{BASE}/gaps')
gaps = res_gp.json()
for g in gaps:
    print(f'  * [{g["category"]}] {g["title"]} (Score: {g["gapScore"]}/100)')
    if g['evidence']:
        print(f'    Paper: {g["evidence"][0]["paperTitle"][:50]}...')
        print(f'    Evidence Quote: "{g["evidence"][0]["quote"][:100]}..."')

print('\n=== 6. Verifying Potentially Novel Research Directions ===')
res_id = requests.get(f'{BASE}/ideas')
ideas = res_id.json()
for i in ideas:
    print(f'  * {i["title"]}')
    print(f'    Novelty: {i["noveltyScore"]}%, Impact: {i["impactScore"]}%, Feasibility: {i["feasibilityScore"]}%')
    print(f'    Supporting Paper IDs: {i.get("supportingPaperIds")}')
    print(f'    Supporting Gap IDs: {i.get("supportingGapIds")}')

print('\n=== 7. Verifying Similar Search (Query: "lightweight explainable human activity recognition using transformers") ===')
res_sim = requests.post(f'{BASE}/similar', json={'query': 'lightweight explainable human activity recognition using transformers'})
similar = res_sim.json()
print(f'Top {len(similar)} Matches:')
for s in similar:
    print(f'  * {s["title"][:60]}... ({s["similarity"]}%)')
    print(f'    Rationale: {s["whySimilar"][0]}')
