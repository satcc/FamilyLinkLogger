import os
import sys
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

from config import get_members

BASE_DIR = Path(__file__).resolve().parent
AUTH_DIR = BASE_DIR / "auth_profile"
RAW_API_DIR = BASE_DIR / "output" / "raw_api"

MEMBERS = get_members()

def capture_member(context, member):
    print(f"\n[{member['name']} (ID: {member['id']})] のデータ取得を開始...")
    page = context.new_page()

    captured_responses = {}

    def handle_response(response):
        url = response.url
        if "appsandusage" in url or "settingResources" in url:
            try:
                text = response.text()
                tag = "appsandusage" if "appsandusage" in url else "settingResources"
                captured_responses[tag] = text
                print(f"  Captured {tag} (size: {len(text)} chars)")
            except Exception as e:
                pass

    page.on("response", handle_response)

    try:
        page.goto(member["url"], wait_until="load", timeout=60000)
    except Exception as e:
        print(f"  Load error: {e}")

    # appsandusage がキャプチャされるまで最大30秒待機
    for _ in range(30):
        if "appsandusage" in captured_responses:
            break
        page.wait_for_timeout(1000)

    # さらに少し余韻を持たせる（他の関連通信のため）
    page.wait_for_timeout(3000)

    for tag, content in captured_responses.items():
        fname = f"{member['name']}_{member['id']}_{tag}.json"
        fpath = RAW_API_DIR / fname
        fpath.write_text(content, encoding="utf-8")
        print(f"  Saved to: {fpath} ({len(content)} chars)")

    page.close()

def main():
    RAW_API_DIR.mkdir(parents=True, exist_ok=True)
    print("Family Link データ取得スクリプト実行中...")
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(AUTH_DIR),
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox"
            ],
            viewport={"width": 1280, "height": 900},
            locale="ja-JP"
        )

        for member in MEMBERS:
            capture_member(context, member)

        context.close()
    print("\n取得処理完了！")

if __name__ == "__main__":
    main()
