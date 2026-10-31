import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

from browser_helper import get_chrome_context, prepare_page

def main():
    print("=" * 60)
    print("Google Family Link ログインツール (正規 Chrome モード)")
    print("=" * 60)
    print("本物の Google Chrome が起動します。")
    print("1. アカウントをクリックしてパスワード等を入力してください")
    print("2. Family Link の画面（お子様の名前が表示される画面）まで進めてください")
    print("3. 画面が表示されたら、このターミナルで【Enter キー】を押してください")
    print("=" * 60)

    with sync_playwright() as p:
        context = get_chrome_context(p, is_login=True)
        page = prepare_page(context)
        page.goto("https://familylink.google.com/")

        try:
            input("\n>>> Family Link 画面が表示されたら、ここで Enter キーを押してください: ")
        except (KeyboardInterrupt, EOFError):
            pass

        print("\nセッション情報を保存しています...")
        time.sleep(3)
        context.close()
        print("=" * 60)
        print("セッション保存完了！正規 Chrome のプロファイルとして長期保持されます。")
        print("=" * 60)

if __name__ == "__main__":
    main()
