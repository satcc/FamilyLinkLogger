import React from 'react';
import { ChevronLeft, ChevronRight, Clock, Users, User } from 'lucide-react';
import { MonthlyData } from '../types';
import { formatMinutes, formatShortDuration, parseYearMonth, getAdjacentMonth } from '../utils/format';

interface CalendarViewProps {
  currentMonth: string; // "YYYY-MM"
  data: MonthlyData | null;
  loading: boolean;
  selectedMemberId: string | null;
  onSelectMember: (memberId: string | null) => void;
  onSelectMonth: (month: string) => void;
  onSelectDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentMonth,
  data,
  loading,
  selectedMemberId,
  onSelectMember,
  onSelectMonth,
  onSelectDate,
}) => {
  const { year, month } = parseYearMonth(currentMonth);

  // カレンダーの計算 (月曜始まり)
  const firstDay = new Date(year, month - 1, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  // カレンダーグリッドセル生成
  const calendarCells = [];
  for (let i = 0; i < startOffset; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  // 今日の日付文字列
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const weekDayLabels = ['月', '火', '水', '木', '金', '土', '日'];

  const prevMonthStr = getAdjacentMonth(currentMonth, -1);
  const nextMonthStr = getAdjacentMonth(currentMonth, 1);

  // メンバーリスト
  const members = data?.members ? Object.values(data.members) : [];

  // 選択中のメンバーオブジェクト（指定があれば）
  const selectedMember = selectedMemberId ? members.find((m) => m.id === selectedMemberId) : null;

  // 選択中メンバーの月間サマリー集計
  let totalMonthMinutes = 0;
  let usedDaysCount = 0;
  let maxUsageDay: { day: string; minutes: number } | null = null;
  const monthAppsUsageMap: Record<string, { name: string; icon: string; minutes: number }> = {};

  if (selectedMember?.days) {
    Object.entries(selectedMember.days).forEach(([dStr, dayData]) => {
      if (dayData.totalMinutes > 0) {
        totalMonthMinutes += dayData.totalMinutes;
        usedDaysCount += 1;
        if (!maxUsageDay || dayData.totalMinutes > maxUsageDay.minutes) {
          maxUsageDay = { day: dStr, minutes: dayData.totalMinutes };
        }
        if (dayData.apps) {
          Object.values(dayData.apps).forEach((app) => {
            if (!monthAppsUsageMap[app.package]) {
              monthAppsUsageMap[app.package] = { name: app.name, icon: app.icon, minutes: 0 };
            }
            monthAppsUsageMap[app.package].minutes += app.minutes;
          });
        }
      }
    });
  }

  const avgDailyMinutes = usedDaysCount > 0 ? Math.round(totalMonthMinutes / usedDaysCount) : 0;
  const topApp = Object.values(monthAppsUsageMap).sort((a, b) => b.minutes - a.minutes)[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* メンバー切り替えバー (人ごとのページ切り替え) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            ページ切替:
          </span>
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => onSelectMember(null)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                selectedMemberId === null
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>全員まとめ</span>
            </button>
            {members.map((m) => {
              const isSelected = selectedMemberId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectMember(m.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                    isSelected
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>{m.name} のページ</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 月移動ナビゲーション */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => onSelectMonth(prevMonthStr)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="前月へ"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">前月</span>
          </button>

          <span className="text-base sm:text-lg font-bold text-slate-800 min-w-[100px] text-center">
            {year}年 {month}月
          </span>

          <button
            onClick={() => onSelectMonth(nextMonthStr)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="翌月へ"
          >
            <span className="hidden sm:inline">翌月</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 個別メンバー選択時の月間サマリーヘッダー */}
      {selectedMember && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {selectedMember.name} の月間総時間
            </p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {formatMinutes(totalMonthMinutes)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              1日平均利用時間
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {formatMinutes(avgDailyMinutes)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              利用日数
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {usedDaysCount} <span className="text-sm font-normal text-slate-500">/ {daysInMonth}日</span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              最多利用アプリ
            </p>
            <p className="text-base font-bold text-slate-800 mt-1 truncate" title={topApp?.name}>
              {topApp?.name || '利用なし'}
            </p>
            {topApp && (
              <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                {formatMinutes(topApp.minutes)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ローディング表示 */}
      {loading && (
        <div className="text-center py-12 text-slate-400">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
          <p className="text-sm">データを読み込み中...</p>
        </div>
      )}

      {/* カレンダー本体 */}
      {!loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* 曜日ヘッダー (月曜始まり) */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-3">
            {weekDayLabels.map((label, idx) => (
              <div
                key={label}
                className={`text-sm font-semibold ${
                  idx === 5 ? 'text-blue-600' : idx === 6 ? 'text-rose-600' : 'text-slate-600'
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {calendarCells.map((dayNum, cellIndex) => {
              if (dayNum === null) {
                return <div key={`empty-${cellIndex}`} className="min-h-[110px] bg-slate-50/50" />;
              }

              const dayStr = String(dayNum).padStart(2, '0');
              const fullDateStr = `${currentMonth}-${dayStr}`;
              const isToday = fullDateStr === todayStr;

              // 1. 個別メンバー表示モードの場合
              if (selectedMember) {
                const dayData = selectedMember.days?.[dayStr];
                const totalMin = dayData?.totalMinutes || 0;
                const hasUsage = totalMin > 0;
                const appCount = dayData?.apps ? Object.keys(dayData.apps).length : 0;

                // 時間帯に応じたバッジのカラーリング
                let badgeStyle = 'bg-slate-100 text-slate-600';
                if (totalMin >= 180) {
                  badgeStyle = 'bg-indigo-600 text-white shadow-sm';
                } else if (totalMin >= 60) {
                  badgeStyle = 'bg-indigo-100 text-indigo-700 border border-indigo-200';
                } else if (totalMin > 0) {
                  badgeStyle = 'bg-slate-100 text-slate-700 border border-slate-200';
                }

                return (
                  <div
                    key={fullDateStr}
                    onClick={() => onSelectDate(fullDateStr)}
                    className={`min-h-[110px] p-2.5 transition-colors cursor-pointer group flex flex-col justify-between ${
                      isToday ? 'bg-indigo-50/40 hover:bg-indigo-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center justify-center text-sm font-semibold w-7 h-7 rounded-full ${
                          isToday
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-700 group-hover:text-indigo-600'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {hasUsage && (
                        <span className="text-[10px] text-slate-400 group-hover:text-indigo-500">
                          詳細 &rarr;
                        </span>
                      )}
                    </div>

                    {/* その人専用の利用時間表示 */}
                    <div className="mt-2">
                      {hasUsage ? (
                        <div className="space-y-1">
                          <div
                            className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between font-bold ${badgeStyle}`}
                          >
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 opacity-75" />
                              {formatMinutes(totalMin)}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 text-right pr-1">
                            {appCount}個のアプリ
                          </p>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-300 py-1 text-center">
                          利用なし
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // 2. 全員まとめ表示モードの場合
              const memberUsages = members
                .map((m) => {
                  const dayData = m.days?.[dayStr];
                  if (!dayData || dayData.totalMinutes <= 0) return null;
                  return {
                    id: m.id,
                    name: m.name,
                    minutes: dayData.totalMinutes,
                  };
                })
                .filter(Boolean);

              const hasUsage = memberUsages.length > 0;

              return (
                <div
                  key={fullDateStr}
                  onClick={() => onSelectDate(fullDateStr)}
                  className={`min-h-[110px] p-2.5 transition-colors cursor-pointer group flex flex-col justify-between ${
                    isToday ? 'bg-indigo-50/40 hover:bg-indigo-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center text-sm font-semibold w-7 h-7 rounded-full ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-700 group-hover:text-indigo-600'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {hasUsage && (
                      <span className="text-[10px] text-slate-400 group-hover:text-indigo-500">
                        詳細 &rarr;
                      </span>
                    )}
                  </div>

                  {/* 全対象者のバッジ並列表示 */}
                  <div className="mt-2 space-y-1.5">
                    {memberUsages.map((mu, idx) => {
                      if (!mu) return null;
                      const badgeColors = [
                        'bg-blue-50 text-blue-700 border-blue-200',
                        'bg-emerald-50 text-emerald-700 border-emerald-200',
                        'bg-purple-50 text-purple-700 border-purple-200',
                      ];
                      const color = badgeColors[idx % badgeColors.length];

                      return (
                        <div
                          key={mu.id}
                          className={`text-xs px-2 py-1 rounded-md border flex items-center justify-between ${color}`}
                        >
                          <span className="font-medium truncate max-w-[65px]">{mu.name}</span>
                          <span className="font-bold flex items-center gap-0.5 ml-1">
                            <Clock className="w-3 h-3 opacity-60" />
                            {formatShortDuration(mu.minutes)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

