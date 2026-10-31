import json
from pathlib import Path

raw_dir = Path("scraper/output/raw_api")
sample_files = list(raw_dir.glob("*_appsandusage.json"))
if not sample_files:
    print("No sample file found in scraper/output/raw_api")
    exit(0)
data = json.loads(sample_files[0].read_text(encoding="utf-8"))

# Item 1: アプリマスタ (package -> name)
app_map = {}
for app in data[1]:
    pkg = app[0]
    name = app[1]
    icon = app[2] if len(app) > 2 else ""
    app_map[pkg] = {"name": name, "icon": icon}

# Item 6: 日別・アプリ別利用時間
print("=== Sample Member Usage Extraction ===")
# 2026年10月3日のデータを集計
today_records = []
for record in data[6]:
    # record: [duration_seconds, [pkg], device_id, ?, [year, month, day]]
    duration_info = record[0]
    seconds = int(duration_info[0]) if isinstance(duration_info, list) else int(duration_info)
    pkgs = record[1]
    pkg = pkgs[0] if pkgs else "unknown"
    date_parts = record[4] if len(record) > 4 else None

    app_info = app_map.get(pkg, {"name": pkg})
    
    if date_parts == [2026, 10, 3]:
        minutes = seconds // 60
        hours = minutes // 60
        rem_min = minutes % 60
        today_records.append({
            "pkg": pkg,
            "name": app_info["name"],
            "seconds": seconds,
            "display": f"{hours}時間{rem_min}分 ({seconds}秒)" if hours > 0 else f"{rem_min}分 ({seconds}秒)"
        })

# 利用時間順にソート
today_records.sort(key=lambda x: x["seconds"], reverse=True)
total_sec = sum(r["seconds"] for r in today_records)
total_min = total_sec // 60

print(f"今日 (2026-10-03) の合計利用時間: {total_min // 60}時間{total_min % 60}分 ({total_sec}秒)")
for r in today_records:
    print(f"  - {r['name']}: {r['display']}")
