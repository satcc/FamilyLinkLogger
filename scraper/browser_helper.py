import os
from pathlib import Path
from playwright_stealth import Stealth

BASE_DIR = Path(__file__).resolve().parent
AUTH_DIR = BASE_DIR / "auth_profile"

_stealth_instance = Stealth()

def get_chrome_context(playwright_instance, is_login=False):
    AUTH_DIR.mkdir(parents=True, exist_ok=True)
    
    args = [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-infobars",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
    ]

    if not is_login:
        # 収集時は画面外に配置（ユーザーの邪魔にならず、Google側には通常Chromeとして認識される）
        args.extend([
            "--window-position=-3200,-3200",
            "--window-size=1280,900"
        ])
    else:
        args.extend([
            "--window-size=1280,900"
        ])

    context = playwright_instance.chromium.launch_persistent_context(
        user_data_dir=str(AUTH_DIR),
        channel="chrome",  # 本物の Google Chrome を使用
        headless=False,     # ヘッドレスではなく実ブラウザ（画面外配置）でGoogle検知を完全回避
        args=args,
        locale="ja-JP",
        viewport={"width": 1280, "height": 900}
    )
    return context

def prepare_page(context):
    page = context.new_page()
    _stealth_instance.apply_stealth_sync(page)
    return page
