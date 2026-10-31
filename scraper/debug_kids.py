import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_DIR = Path(__file__).resolve().parent
AUTH_DIR = BASE_DIR / "auth_profile"
OUTPUT_DIR = BASE_DIR / "output"

def debug_kids():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    url = "https://familylink.google.com/member/4/activity/app"
    
    print(f"Kids (ID: 4) のアクセス調査を開始: {url}")
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(AUTH_DIR),
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
            viewport={"width": 1280, "height": 900},
            locale="ja-JP"
        )

        page = context.new_page()

        requests_log = []
        responses_log = []

        def on_request(req):
            if "kidsmanagement" in req.url or "appsandusage" in req.url:
                requests_log.append(f"REQ: {req.method} {req.url[:120]}")

        def on_response(res):
            if "kidsmanagement" in res.url or "appsandusage" in res.url:
                responses_log.append(f"RES: {res.status} {res.url[:120]}")

        page.on("request", on_request)
        page.on("response", on_response)

        try:
            page.goto(url, wait_until="load", timeout=45000)
        except Exception as e:
            print(f"Page load warning: {e}")

        # 15秒間待機しながらログを監視
        for i in range(15):
            time.sleep(1)
            if any("appsandusage" in r for r in responses_log):
                print(f"  -> appsandusage detected at {i+1}s!")
                break

        print(f"Final URL: {page.url}")
        print(f"Page Title: {page.title()}")

        shot_path = OUTPUT_DIR / "debug_kids_current.png"
        page.screenshot(path=str(shot_path), full_page=True)
        print(f"Screenshot saved: {shot_path}")

        print("\n--- Captured Requests ---")
        for r in requests_log:
            print(" ", r)

        print("\n--- Captured Responses ---")
        for r in responses_log:
            print(" ", r)

        page.close()
        context.close()

if __name__ == "__main__":
    debug_kids()
