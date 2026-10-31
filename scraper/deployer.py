import os
import sys
import shutil
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DATA_DIR = BASE_DIR / "public" / "data"
DIST_DIR = BASE_DIR / "dist"
DIST_DATA_DIR = DIST_DIR / "data"

def deploy_to_firebase() -> bool:
    """
    更新された JSON データを dist/data にコピーし、Firebase Hosting へデプロイする
    """
    print("\n[Firebase Deploy] データに変更があったため、Firebase Hosting へ自動アップロードを開始します...")

    # 1. dist/index.html がなければビルドを実行
    if not (DIST_DIR / "index.html").exists():
        print("  [Build] dist フォルダが存在しないため、初回ビルドを実行します...")
        cmd_build = "cmd /c npm run build" if sys.platform == "win32" else "npm run build"
        res_build = subprocess.run(cmd_build, shell=True, cwd=str(BASE_DIR), capture_output=True, text=True)
        if res_build.returncode != 0:
            print(f"  [Build Error] ビルドに失敗しました:\n{res_build.stderr}")
            return False

    # 2. public/data の最新 JSON を dist/data に同期
    DIST_DATA_DIR.mkdir(parents=True, exist_ok=True)
    for json_file in PUBLIC_DATA_DIR.glob("*.json"):
        dest_file = DIST_DATA_DIR / json_file.name
        shutil.copy2(json_file, dest_file)
    print(f"  [Sync] 最新のデータファイルを {DIST_DATA_DIR} にコピーしました。")

    # 3. firebase deploy --only hosting を実行
    if sys.platform == "win32":
        deploy_cmd = "npx.cmd firebase deploy --only hosting"
    else:
        deploy_cmd = "npx firebase deploy --only hosting"

    print(f"  [Deploy] コマンド実行中: {deploy_cmd}")
    try:
        res = subprocess.run(
            deploy_cmd,
            shell=True,
            cwd=str(BASE_DIR),
            capture_output=True,
            text=True,
            timeout=120
        )
        if res.returncode == 0:
            print("  [Deploy Success] Firebase Hosting への自動アップロードが完了しました！")
            return True
        else:
            print(f"  [Deploy Error] デプロイエラー:\n{res.stderr or res.stdout}")
            return False
    except subprocess.TimeoutExpired:
        print("  [Deploy Timeout] デプロイ処理がタイムアウトしました。")
        return False
    except Exception as e:
        print(f"  [Deploy Exception] {e}")
        return False
