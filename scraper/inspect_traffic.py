import os
import sys
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

from config import get_members

BASE_DIR = Path(__file__).resolve().parent
AUTH_DIR = BASE_DIR / "auth_profile"
OUTPUT_DIR = BASE_DIR / "output"

MEMBERS = get_members()

def run_deep_inspection():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    traffic_log_path = OUTPUT_DIR / "network_traffic.jsonl"
    traffic_log_file = open(traffic_log_path, "w", encoding="utf-8")

    def handle_response(response):
        url = response.url
        # 画像やフォント、静的スクリプトは除外してAPI通信にフォーカス
        ignore_exts = [".js", ".css", ".png", ".jpg", ".svg", ".wasm", ".ico", ".woff", ".woff2"]
        if any(url.split("?")[0].endswith(ext) for ext in ignore_exts):
            return

        try:
            status = response.status
            content_type = response.headers.get("content-type", "")
            
            # 興味深いエンドポイント
            body_text = None
            if ("json" in content_type or "rpc" in url or "proto" in content_type or 
                "batchexecute" in url or "family" in url or "activity" in url or "google" in url):
                try:
                    body_text = response.text()
                except Exception:
                    body_text = "<binary or undecodable>"

            record = {
                "timestamp": time.time(),
                "url": url,
                "status": status,
                "content_type": content_type,
                "method": response.request.method,
                "post_data": response.request.post_data if response.request.method == "POST" else None,
                "body_preview": body_text[:5000] if body_text else None
            }
            traffic_log_file.write(json.dumps(record, ensure_ascii=False) + "\n")
            traffic_log_file.flush()

            # コンソールへの簡易通知
            if body_text and any(k in body_text for k in ["YouTube", "Chrome", "Roblox", "activity", "duration", "minute", "usage"]):
                print(f"  [HIT KEYWORD in API] {url}")
        except Exception as e:
            pass

    print("Family Link の詳細ネットワーク通信調査を開始します...")
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
            print(f"\n[{member['name']} (ID: {member['id']})] を読み込み中...")
            page = context.new_page()
            page.on("response", handle_response)

            try:
                page.goto(member["url"], wait_until="load", timeout=60000)
            except Exception as e:
                print(f"  Load error: {e}")

            # Flutter Web が起動し、API通信が終わるまで待つ（20秒待機）
            print("  Flutter Web の初期化およびデータ取得待機中 (20秒)...")
            for i in range(20):
                time.sleep(1)

            # スクリーンショット更新
            shot_path = OUTPUT_DIR / f"activity_member_{member['id']}_loaded.png"
            page.screenshot(path=str(shot_path), full_page=True)
            print(f"  画面スクリーンショット保存: {shot_path}")

            # Flutter Web の semantics（アクセシビリティツリー）を有効化してみる
            # Flutter Web はアクセシビリティを有効にすると、DOMにテキスト要素が生成されることがある
            try:
                btn = page.query_selector("flt-semantics-placeholder")
                if btn:
                    print("  Flutter semantics 有効化ボタンをクリック試行...")
                    btn.click()
                    time.sleep(3)
                    # 有効化後のスクリーンショットとテキスト確認
                    shot_acc_path = OUTPUT_DIR / f"activity_member_{member['id']}_accessible.png"
                    page.screenshot(path=str(shot_acc_path), full_page=True)
            except Exception as e:
                print(f"  アクセシビリティ有効化試行スキップ: {e}")

            page.close()

        context.close()
    traffic_log_file.close()
    print("\n詳細調査完了！")

if __name__ == "__main__":
    run_deep_inspection()
