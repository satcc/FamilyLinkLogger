# FamilyLinkLogger

Google Family Link で管理している子供のアプリ利用時間を定期取得し、時間帯ごとの利用状況を可視化するダッシュボードシステムです。

## 主な機能

- **定期データ収集 (Python + Playwright)**:
  - 10分ごとに Family Link の内部 API から当日の累積秒数を自動取得。
  - 前回の値との差分を算出し、時間帯ごとの利用量（どのアプリを何分使ったか）を記録。
  - 月単位の JSON ファイル（`public/data/YYYY-MM.json`）として自動出力。
  - **変更検知＆自動アップロード**: 利用時間に変更（増加）があった場合のみ、Firebase Hosting へ自動で高速アップロード。
- **Web ダッシュボード (React + TypeScript + Vite + Tailwind CSS)**:
  - **トップ画面**: 月曜始まりのカレンダー表示。対象者ごとの日別総利用時間をバッジ表示。前月・翌月ナビゲーション。
  - **日付別詳細画面**: 0:00〜23:00 の時間帯別積み上げ棒グラフ、アプリ別利用時間内訳テーブル（アイコン・パーセンテージ表示）。日付の月をクリックするとカレンダーへ戻るナビゲーション。
- **Firebase 連携**:
  - Firebase Hosting による SPA & 月別 JSON 静的ホスティング。
  - Firebase Auth（Google 認証）による家族限定アクセス制御。

---

## ディレクトリ構成

```
FamilyLinkLogger/
├── public/
│   └── data/               # 月単位の利用データ (YYYY-MM.json)
├── scraper/
│   ├── auth_profile/       # Playwright のブラウザプロファイル・Cookie (git除外)
│   ├── collector.py        # 定期実行バッチ (1時間ごとの収集・差分計算)
│   ├── processor.py        # 差分計算・月別JSON生成エンジン
│   └── login.py            # 初回Googleログイン・セッション保存ツール
├── src/
│   ├── components/
│   │   ├── CalendarView.tsx   # カレンダー画面 (トップ)
│   │   ├── DayDetailView.tsx  # 日付別詳細グラフ画面
│   │   └── Navbar.tsx         # ヘッダー・Auth管理
│   ├── types.ts            # データ型定義
│   ├── firebase.ts         # Firebase Auth 初期化
│   ├── App.tsx             # メインアプリケーション
│   └── main.tsx            # エントリポイント
├── firebase.json           # Firebase Hosting 設定
├── run_collector.bat       # Windows 定期実行用バッチ
├── run_collector.sh        # Linux / Raspberry Pi 定期実行用スクリプト
└── memo.md                 # 要件定義メモ
```

---

## 使い方

### 1. 初回セットアップ (Google ログイン)

```powershell
# 初回ブラウザログイン (セッションを auth_profile に永続化)
.\.venv\Scripts\python.exe scraper\login.py
```
ブラウザが起動したら管理者アカウントで Google にログインし、Family Link の画面が表示されたらターミナルで Enter キーを押してください。

### 2. データ収集の実行

データ収集時に前回の値から利用時間が増加（変更）していた場合、**自動的に Firebase Hosting へ高速アップロード（デプロイ）** されます（利用時間の変更がなかった回はデプロイがスキップされます）。

```powershell
# 単発実行 (差分計算 & public/data/YYYY-MM.json の更新 + 変更時自動デプロイ)
.\.venv\Scripts\python.exe scraper\collector.py

# または常駐モード (10分ごとに自動ループ実行 + 変更時自動デプロイ)
.\.venv\Scripts\python.exe scraper\collector.py --loop

# Windows 用バッチでの実行 (タスクスケジューラ用)
.\run_collector.bat
```

#### 主なコマンドラインオプション

| オプション | 説明 |
| :--- | :--- |
| `--loop` | 常駐モードで起動し、定期的に自動収集を繰り返します（Ctrl+C で停止）。 |
| `--interval <秒数>` | 常駐モードの実行間隔を秒単位で指定します（デフォルト: `600` = 10分）。 |
| `--no-deploy` | データの変更が検知されても、Firebase Hosting への自動アップロードを行いません（ローカルでの動作確認や手動テスト時に便利です）。 |

**オプション指定の実行例:**
```powershell
# 自動デプロイを行わずに単発テスト実行
.\.venv\Scripts\python.exe scraper\collector.py --no-deploy

# 5分（300秒）おきの常駐ループ実行
.\.venv\Scripts\python.exe scraper\collector.py --loop --interval 300
```

### 3. ダッシュボードのローカル起動

```powershell
cmd /c npm run dev
```
ブラウザで `http://localhost:5173` を開くと、カレンダーと利用時間ダッシュボードが確認できます。

### 4. 本番ビルドと Firebase デプロイ

```powershell
# 本番ビルド (dist フォルダに SPA とデータ JSON を出力)
cmd /c npm run build

# Firebase Hosting へデプロイ
npx.cmd firebase deploy --only hosting
```
