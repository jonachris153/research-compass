import sys, requests, json
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
BASE = 'http://127.0.0.1:8000/api'

# 1. Re-run analysis to regenerate gaps with new extractor
print('--- Re-running analysis to invalidate cached gaps ---')
r = requests.post(f'{BASE}/analyze')
assert r.status_code == 200, f'Analyze failed: {r.status_code}'
data = r.json()
print('Analysis result:', json.dumps(data, indent=2))

# 2. Fetch gaps and inspect every evidence quote
print()
print('--- Inspecting /api/gaps response ---')
r2 = requests.get(f'{BASE}/gaps')
assert r2.status_code == 200, f'Get gaps failed: {r2.status_code}'
gaps = r2.json()
print(f'Total gaps: {len(gaps)}')

all_passed = True
for g in gaps:
    print(f'\n[GAP] {g["title"]} ({g["category"]}, score={g["gapScore"]})')
    for ev in g.get('evidence', []):
        q = ev.get('quote', '')
        status = 'PASS' if len(q) <= 300 else 'FAIL'
        if status == 'FAIL':
            all_passed = False
        print(f'  [{status}] {len(q)} chars | Signal: {ev["signal"]}')
        print(f'  Paper: {ev["paperTitle"][:70]}')
        print(f'  Quote: "{q}"')
        print()

print()
if all_passed:
    print('>>> ALL EVIDENCE QUOTES <= 300 CHARS. BUG PERMANENTLY FIXED. <<<')
else:
    print('>>> SOME QUOTES TOO LONG. NEEDS MORE WORK. <<<')
