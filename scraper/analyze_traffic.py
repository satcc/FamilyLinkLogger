import json
from pathlib import Path

traffic_path = Path("scraper/output/network_traffic.jsonl")

with open(traffic_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        data = json.loads(line)
        body = data.get("body_preview", "")
        if not body:
            continue
        
        # 探すキーワード
        keywords = ["Prime Video", "Google Chrome", "8340", "10380", "1320", "139", "22"]
        hits = [kw for kw in ["Prime Video", "Google Chrome"] if kw in body]
        if hits:
            print(f"=== Line {i}: URL = {data.get('url')} ===")
            for h in hits:
                idx = body.find(h)
                s = max(0, idx - 150)
                e = min(len(body), idx + 250)
                print(f"[{h}] snippet:\n{body[s:e]}\n")
