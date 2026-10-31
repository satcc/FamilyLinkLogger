import os
import sys
import json
import time
import argparse
from datetime import datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

from browser_helper import get_chrome_context, prepare_page
from processor import parse_appsandusage_raw, update_monthly_data
from deployer import deploy_to_firebase
from config import get_members

BASE_DIR = Path(__file__).resolve().parent
AUTH_DIR = BASE_DIR / "auth_profile"

MEMBERS = get_members()

def collect_once(context, auto_deploy=True):
    now = datetime.now()
    print(f"\n[{now.strftime('%Y-%m-%d %H:%M:%S')}] データ収集を開始します...")

    any_changes = False

    for member in MEMBERS:
        print(f"  [{member['name']} (ID: {member['id']})] を取得中...")
        page = prepare_page(context)

        captured_json = None

        def handle_response(response):
            nonlocal captured_json
            if "appsandusage" in response.url:
                try:
                    captured_json = response.text()
                except Exception:
                    pass

        page.on("response", handle_response)

        try:
            page.goto(member["url"], wait_until="load", timeout=45000)
        except Exception as e:
            print(f"    ページロード警告: {e}")

        # ログイン画面へリダイレクトされた場合の検出
        if "accounts.google.com" in page.url or "signin" in page.url:
            print(f"    [認証エラー] Google セッションが切れています (URL: {page.url[:80]}...)")
            print("    `python scraper/login.py` を実行して再ログインしてください。")
            page.close()
            continue

        # appsandusage がキャプチャされるまで最大35秒待機
        for _ in range(35):
            if captured_json:
                break
            page.wait_for_timeout(1000)

        page.close()

        if not captured_json:
            print(f"    [エラー] {member['name']} の appsandusage データを取得できませんでした。")
            continue

        try:
            raw_data = json.loads(captured_json)
            app_master, daily_usage = parse_appsandusage_raw(raw_data)
            has_changes = update_monthly_data(member["id"], member["name"], app_master, daily_usage, now)
            if has_changes:
                any_changes = True
                print(f"    -> 成功: {len(app_master)} アプリ、{len(daily_usage)} 日分のデータを処理しました。(変更あり)")
            else:
                print(f"    -> 成功: {len(app_master)} アプリ、{len(daily_usage)} 日分のデータを処理しました。(変更なし)")
        except Exception as e:
            print(f"    [解析エラー] {e}")

    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] データ収集完了。")

    # 変更があった場合、Firebase Hosting へ自動アップロード
    if any_changes and auto_deploy:
        deploy_to_firebase()
    elif not any_changes:
        print("[Firebase Deploy] 前回からの利用量に変更がないため、デプロイはスキップしました。")

def main():
    parser = argparse.ArgumentParser(description="Google Family Link データ収集バッチ")
    parser.add_argument("--loop", action="store_true", help="10分ごとに常駐実行する")
    parser.add_argument("--interval", type=int, default=600, help="常駐時のインターバル秒数 (デフォルト: 600 = 10分)")
    parser.add_argument("--no-deploy", action="store_true", help="データ変更時でもFirebaseへの自動デプロイを行わない")
    args = parser.parse_args()

    auto_deploy = not args.no_deploy

    if not AUTH_DIR.exists():
        print(f"[エラー] 認証プロファイル ({AUTH_DIR}) が存在しません。先に `login.py` を実行してください。")
        sys.exit(1)

    print("Family Link Logger Collector (正規 Chrome ステルスモード) を起動します...")
    with sync_playwright() as p:
        context = get_chrome_context(p, is_login=False)

        if args.loop:
            print(f"常駐モードを開始します (間隔: {args.interval} 秒 / {args.interval // 60} 分, 自動デプロイ: {auto_deploy})...")
            try:
                while True:
                    try:
                        collect_once(context, auto_deploy=auto_deploy)
                    except Exception as e:
                        print(f"[実行時エラー] {e}")
                    print(f"次回実行まで {args.interval} 秒 ({args.interval // 60} 分) 待機中... (Ctrl+C で停止)")
                    for _ in range(args.interval):
                        time.sleep(1)
            except KeyboardInterrupt:
                print("\n[停止] Ctrl+C が押されたため、常駐モードを安全に終了しました。")
        else:
            try:
                collect_once(context, auto_deploy=auto_deploy)
            except KeyboardInterrupt:
                print("\n[停止] 処理を中断しました。")

        context.close()

if __name__ == "__main__":
    main()
