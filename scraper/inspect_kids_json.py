import json
from pathlib import Path

raw_dir = Path("scraper/output/raw_api")
kids_json_path = list(raw_dir.glob("*_4_appsandusage.json"))[0]

data = json.loads(kids_json_path.read_text(encoding="utf-8"))

print("Type of root:", type(data))
if isinstance(data, list):
    print(f"Root list length: {len(data)}")
    for i, item in enumerate(data):
        print(f"  Item {i}: type={type(item)}, length={len(item) if isinstance(item, (list, dict, str)) else 'N/A'}")

# 整形して保存
pretty_path = raw_dir / "pretty_kids_appsandusage.json"
pretty_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Wrote {pretty_path}")
