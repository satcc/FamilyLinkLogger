import os
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Tuple

DATA_DIR = Path(__file__).resolve().parent.parent / "public" / "data"
STATE_FILE = Path(__file__).resolve().parent / "state.json"

def load_json(path: Path) -> Dict[str, Any]:
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}

def save_json(path: Path, data: Any):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

def parse_appsandusage_raw(raw_data: list) -> Tuple[Dict[str, dict], Dict[str, Dict[str, int]]]:
    """
    appsandusage の生JSONレスポンスから以下を抽出する:
    1. app_master: { pkg: { "name": app_name, "icon": icon_url } }
    2. daily_usage: { "YYYY-MM-DD": { pkg: cumulative_seconds } }
    """
    app_master = {}
    # Item 1: アプリマスタ
    if len(raw_data) > 1 and isinstance(raw_data[1], list):
        for item in raw_data[1]:
            if isinstance(item, list) and len(item) >= 2:
                pkg = item[0]
                name = item[1]
                icon = item[2] if len(item) > 2 and isinstance(item[2], str) else ""
                app_master[pkg] = {
                    "name": name,
                    "icon": icon
                }

    # Item 6: 日別利用履歴
    daily_usage = {}
    if len(raw_data) > 6 and isinstance(raw_data[6], list):
        for record in raw_data[6]:
            if not (isinstance(record, list) and len(record) >= 5):
                continue
            duration_info = record[0]
            pkgs = record[1]
            date_parts = record[4]

            if not (isinstance(date_parts, list) and len(date_parts) == 3):
                continue
            date_str = f"{date_parts[0]:04d}-{date_parts[1]:02d}-{date_parts[2]:02d}"
            
            pkg = pkgs[0] if (isinstance(pkgs, list) and pkgs) else "unknown"
            seconds = 0
            if isinstance(duration_info, list) and duration_info:
                seconds = int(duration_info[0])
            elif isinstance(duration_info, (int, str)):
                seconds = int(duration_info)

            if date_str not in daily_usage:
                daily_usage[date_str] = {}
            daily_usage[date_str][pkg] = daily_usage[date_str].get(pkg, 0) + seconds

    return app_master, daily_usage

def update_monthly_data(
    member_id: str,
    member_name: str,
    app_master: Dict[str, dict],
    daily_usage: Dict[str, Dict[str, int]],
    now: datetime
):
    """
    日別利用データおよび差分をもとに、public/data/YYYY-MM.json を更新する。
    10分ごとの高頻度実行に対応し、秒単位で正確に差分を累積して丸め誤差を防ぐ。
    """
    state = load_json(STATE_FILE)
    member_state = state.get(member_id, {})

    today_str = now.strftime("%Y-%m-%d")
    current_hour_str = f"{now.hour:02d}"
    # 10分刻みのスロット (例: "14:00", "14:10", "14:20" ...)
    ten_min_slot = f"{now.hour:02d}:{(now.minute // 10) * 10:02d}"

    # 当日の累積秒数
    today_app_seconds = daily_usage.get(today_str, {})

    # 前回の記録と比較して差分（利用秒数）を計算
    last_date = member_state.get("date")
    last_app_seconds = member_state.get("app_cumulative_seconds", {})

    diff_seconds = {}
    if last_date == today_str:
        # 同日内の差分
        for pkg, current_sec in today_app_seconds.items():
            prev_sec = last_app_seconds.get(pkg, 0)
            diff_sec = current_sec - prev_sec
            if diff_sec > 0:
                diff_seconds[pkg] = diff_sec
    else:
        # 日付が変わった、または初回
        for pkg, current_sec in today_app_seconds.items():
            if current_sec > 0:
                diff_seconds[pkg] = current_sec

    # state を更新
    state[member_id] = {
        "date": today_str,
        "hour": now.hour,
        "minute": now.minute,
        "updated_at": now.isoformat(),
        "app_cumulative_seconds": today_app_seconds
    }
    save_json(STATE_FILE, state)

    # daily_usage に含まれる全日付を月ごとにグループ化して更新
    months = set()
    for d_str in daily_usage.keys():
        months.add(d_str[:7]) # "YYYY-MM"

    for yyyy_mm in months:
        monthly_file = DATA_DIR / f"{yyyy_mm}.json"
        month_data = load_json(monthly_file)
        if not month_data:
            month_data = {
                "yearMonth": yyyy_mm,
                "members": {}
            }

        if member_id not in month_data["members"]:
            month_data["members"][member_id] = {
                "id": member_id,
                "name": member_name,
                "days": {}
            }

        member_obj = month_data["members"][member_id]
        member_obj["name"] = member_name  # 名前を最新化

        # この月に属する日付を反映
        for d_str, apps_usage in daily_usage.items():
            if not d_str.startswith(yyyy_mm):
                continue
            day_num_str = d_str[8:10] # "03" など

            if day_num_str not in member_obj["days"]:
                member_obj["days"][day_num_str] = {
                    "date": d_str,
                    "totalSeconds": 0,
                    "totalMinutes": 0,
                    "apps": {},
                    "hourly": {},
                    "hourlySeconds": {},
                    "slots": {}
                }

            day_obj = member_obj["days"][day_num_str]

            # 日別のアプリ別累積と合計
            total_sec = sum(apps_usage.values())
            day_obj["totalSeconds"] = total_sec
            day_obj["totalMinutes"] = round(total_sec / 60)

            apps_summary = {}
            for pkg, sec in apps_usage.items():
                meta = app_master.get(pkg, {"name": pkg, "icon": ""})
                apps_summary[pkg] = {
                    "package": pkg,
                    "name": meta["name"],
                    "icon": meta["icon"],
                    "seconds": sec,
                    "minutes": round(sec / 60)
                }
            day_obj["apps"] = apps_summary

            # もし今日の日付で、差分があれば hourly および slots に反映
            if d_str == today_str and diff_seconds:
                if "hourly" not in day_obj:
                    day_obj["hourly"] = {}
                if "hourlySeconds" not in day_obj:
                    day_obj["hourlySeconds"] = {}
                if "slots" not in day_obj:
                    day_obj["slots"] = {}

                if current_hour_str not in day_obj["hourlySeconds"]:
                    day_obj["hourlySeconds"][current_hour_str] = {}
                if current_hour_str not in day_obj["hourly"]:
                    day_obj["hourly"][current_hour_str] = {}
                if ten_min_slot not in day_obj["slots"]:
                    day_obj["slots"][ten_min_slot] = {}

                hour_sec_slot = day_obj["hourlySeconds"][current_hour_str]
                hour_min_slot = day_obj["hourly"][current_hour_str]
                ten_slot = day_obj["slots"][ten_min_slot]

                for pkg, diff_sec in diff_seconds.items():
                    meta = app_master.get(pkg, {"name": pkg, "icon": ""})
                    app_name = meta["name"]

                    # 10分スロットへの秒数加算
                    ten_slot[app_name] = ten_slot.get(app_name, 0) + diff_sec

                    # 1時間スロット（秒数ベースで蓄積して丸め誤差を防ぐ）
                    hour_sec_slot[app_name] = hour_sec_slot.get(app_name, 0) + diff_sec
                    # 分数に変換 (1分未満でも差分があれば1分、または四捨五入)
                    accumulated_sec = hour_sec_slot[app_name]
                    hour_min_slot[app_name] = max(1, round(accumulated_sec / 60))

        save_json(monthly_file, month_data)
        print(f"Updated {monthly_file.name} for {member_name}")

    has_changes = bool(diff_seconds)
    return has_changes
