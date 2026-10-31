import json
from pathlib import Path

raw_dir = Path("scraper/output/raw_api")
data = json.loads((raw_dir / "pretty_kids_appsandusage.json").read_text(encoding="utf-8"))

print("=== Item 0 ===")
print(data[0])

print("\n=== Item 2 ===")
print(data[2])

print("\n=== Item 3 ===")
print(data[3])

print("\n=== Item 6 (first 5 elements) ===")
for x in data[6][:5]:
    print(x)

print("\n=== Item 1 (first 3 elements) ===")
for x in data[1][:3]:
    print(x)
