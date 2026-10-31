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

def on_response(response):
    """通信を監視し、JSONなどのレスポンスがあれば調査用に出力"""
    try:
        content_type = response.headers.get("content-type", "")
        # Family Link や Google の RPC/JSON 通信をキャッチ
        if "application/json" in content_type or "rpc" in response.url or "batchexecute" in response.url:
            text = response.text()
            if "activity" in response.url or "app" in response.url or "member" in response.url:
                print(f"  [API Detected] {response.url[:80]}... (Length: {len(text)})")
    except Exception:
        pass

def fetch_member_activity(context, member):
    print(f"\n[{member['name']} (ID: {member['id']})] のアクティビティページへ移動中...")
    page = context.new_page()
    page.on("response", on_response)

    try:
        page.goto(member["url"], wait_until="networkidle", timeout=45000)
    except Exception as e:
        print(f"  ページロード警告 (networkidle timeout 等): {e}")

    # レンダリング完了を待機
    page.wait_for_timeout(5000)

    # スクリーンショットを保存
    screenshot_path = OUTPUT_DIR / f"activity_member_{member['id']}.png"
    page.screenshot(path=str(screenshot_path), full_page=True)
    print(f"  スクリーンショット保存: {screenshot_path}")

    # ページタイトルとURL確認
    print(f"  Page Title: {page.title()}")
    print(f"  Current URL: {page.url}")

    # ログイン画面にリダイレクトされていないかチェック
    if "accounts.google.com" in page.url or "signin" in page.url:
        print("  [警告] ログイン画面にリダイレクトされました。先に python scraper/login.py を実行してログインしてください。")
        page.close()
        return

    # DOMテキストや候補要素の探索
    print("  --- ページのDOM要素テキストのサンプリング ---")
    # アプリ名や時間の表示がありそうな要素を探索
    elements = page.query_selector_all("div, span, li, p")
    extracted_texts = []
    for el in elements:
        try:
            text = el.inner_text().strip()
            # 「分」「時間」「min」「hr」などが含まれるか、短めの文字列を抽出
            if text and len(text) < 100:
                if any(k in text for k in ["分", "時間", "min", "hr", "利用", "今日", "Today"]):
                    extracted_texts.append(text)
        except Exception:
            pass

    # 重複排除して上位を表示
    unique_texts = list(dict.fromkeys(extracted_texts))[:20]
    for t in unique_texts:
        print(f"    - {t}")

    # ページ全体のHTML保存（後でセレクタ解析用）
    html_path = OUTPUT_DIR / f"page_member_{member['id']}.html"
    html_path.write_text(page.content(), encoding="utf-8")
    print(f"  HTMLソース保存: {html_path}")

    page.close()

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if not AUTH_DIR.exists():
        print(f"エラー: {AUTH_DIR} が存在しません。先に `python scraper/login.py` を実行してください。")
        sys.exit(1)

    print("Family Link データ取得・画面解析検証 (PoC) を開始します...")
    with sync_playwright() as p:
        # ヘッドレスで起動 (検証初期で挙動を見たい場合は headless=False に切り替え可能)
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
            fetch_member_activity(context, member)

        context.close()
    print("\n検証完了。")

if __name__ == "__main__":
    main()
