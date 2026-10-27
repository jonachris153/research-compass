import requests
import json
import sys

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE = 'http://127.0.0.1:8000/api'

print("==================================================================")
print("VERIFICATION: GAP EVIDENCE GENERATION & EXCERPT LENGTH FIX")
print("==================================================================")

print("\n--- 1. Re-running ML Analysis on Corpus ---")
res_an = requests.post(f'{BASE}/analyze')
assert res_an.status_code == 200, f"Analyze failed: {res_an.status_code}"
print("Analysis completed successfully.")

print("\n--- 2. Fetching & Inspecting All Gap Evidence Excerpts ---")
res_gaps = requests.get(f'{BASE}/gaps')
assert res_gaps.status_code == 200, f"Get gaps failed: {res_gaps.status_code}"
gaps = res_gaps.json()

print(f"Total Gaps Returned: {len(gaps)}")
for g_idx, gap in enumerate(gaps, 1):
    print(f"\n[GAP {g_idx}] {gap['title']} (Category: {gap['category']}, Score: {gap['gapScore']}/100)")
    evidence = gap.get("evidence", [])
    print(f"  Evidence Count: {len(evidence)}")

    seen_paper_ids = set()
    for ev_idx, ev in enumerate(evidence, 1):
        pid = ev.get("paperId")
        title = ev.get("paperTitle", "")
        quote = ev.get("quote", "")
        signal = ev.get("signal", "")
        q_len = len(quote)

        print(f"  --- Evidence #{ev_idx} ---")
        print(f"      Paper ID: {pid}")
        print(f"      Paper Title: {title[:60]}...")
        print(f"      Signal Type: {signal}")
        print(f"      Excerpt Length: {q_len} characters")
        print(f"      Excerpt: \"{quote}\"")

        # Rigorous assertions
        assert q_len <= 350, f"FAILED: Excerpt exceeds 350 chars ({q_len} chars): {quote}"
        assert "\n\n" not in quote, "FAILED: Excerpt contains multiple paragraphs"
        assert pid not in seen_paper_ids, f"FAILED: Duplicate paper evidence for paper {pid}"
        seen_paper_ids.add(pid)

print("\n==================================================================")
print(">>> ALL GAP EVIDENCE ASSERTIONS PASSED: ZERO DUMPING, 100% CONCISE SENTENCES <<<")
print("==================================================================")
