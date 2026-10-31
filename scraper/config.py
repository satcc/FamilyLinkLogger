import os
import json
from pathlib import Path
from typing import List, Dict

BASE_DIR = Path(__file__).resolve().parent.parent

def load_env_file():
    """
    サードパーティ製ライブラリに依存せず、.env.local / .env を読み込んで os.environ にセットする。
    優先順位: 既存の環境変数 > .env.local > .env
    """
    for env_name in [".env.local", ".env"]:
        env_path = BASE_DIR / env_name
        if env_path.exists():
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#") or "=" not in line:
                            continue
                        key, val = line.split("=", 1)
                        key = key.strip()
                        val = val.strip().strip("'\"")
                        if key not in os.environ:
                            os.environ[key] = val
            except Exception as e:
                print(f"[Warning] Failed to read {env_path}: {e}")

def get_members() -> List[Dict[str, str]]:
    """
    環境変数 FAMILY_LINK_MEMBERS (JSON 文字列) から対象メンバーリストを取得する。
    未設定の場合はプレースホルダーのダミーを返す。
    """
    load_env_file()
    raw = os.environ.get("FAMILY_LINK_MEMBERS")
    if raw:
        try:
            members = json.loads(raw)
            for m in members:
                if "url" not in m and "id" in m:
                    m["url"] = f"https://familylink.google.com/member/{m['id']}/activity/app"
            return members
        except Exception as e:
            print(f"[Warning] Failed to parse FAMILY_LINK_MEMBERS from environment: {e}")

    # 環境変数未設定時のデフォルト（サンプル）
    return [
        {"id": "1", "name": "Child 1", "url": "https://familylink.google.com/member/1/activity/app"},
    ]
