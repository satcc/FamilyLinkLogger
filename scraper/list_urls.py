import json
from pathlib import Path

traffic_path = Path("scraper/output/network_traffic.jsonl")

with open(traffic_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        data = json.loads(line)
        url = data.get("url", "")
        # Google static やフォント等以外
        print(f"{i:2d}: {data.get('method')} {data.get('status')} {url}")
