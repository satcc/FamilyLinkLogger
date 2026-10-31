import json
from pathlib import Path

raw_dir = Path("scraper/output/raw_api")
ikuto_path = list(raw_dir.glob("*_5_appsandusage.json"))[0]
data = json.loads(ikuto_path.read_text(encoding="utf-8"))

dates = set()
for record in data[6]:
    if len(record) > 4 and record[4]:
        d = record[4]
        dates.add(f"{d[0]:04d}-{d[1]:02d}-{d[2]:02d}")

sorted_dates = sorted(list(dates))
print(f"取得できた日付の一覧 (全 {len(sorted_dates)} 日分):")
for d in sorted_dates:
    print(f"  {d}")
