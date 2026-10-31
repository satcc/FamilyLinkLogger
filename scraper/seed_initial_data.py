import json
from datetime import datetime
from pathlib import Path
from processor import parse_appsandusage_raw, update_monthly_data
from config import get_members

raw_dir = Path(__file__).resolve().parent / "output" / "raw_api"

configured = get_members()
members = [
    {"id": m["id"], "name": m["name"], "file_match": f"*_{m['id']}_appsandusage.json"}
    for m in configured
]

now = datetime.now()

for m in members:
    matching = list(raw_dir.glob(m["file_match"]))
    if not matching:
        print(f"No file found for {m['name']}")
        continue
    raw_data = json.loads(matching[0].read_text(encoding="utf-8"))
    app_master, daily_usage = parse_appsandusage_raw(raw_data)
    print(f"Member: {m['name']} -> Apps: {len(app_master)}, Days: {len(daily_usage)}")
    update_monthly_data(m["id"], m["name"], app_master, daily_usage, now)

print("Seed update completed!")
