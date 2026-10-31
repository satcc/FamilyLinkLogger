import React from 'react';
import { ChevronLeft, ChevronRight, Smartphone, Clock } from 'lucide-react';
import { MonthlyData } from '../types';
import { formatShortDuration, parseYearMonth, getAdjacentMonth } from '../utils/format';

interface CalendarViewProps {
  currentMonth: string; // "YYYY-MM"
  data: MonthlyData | null;
  loading: boolean;
  onSelectMonth: (month: string) => void;
  onSelectDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentMonth,
  data,
  loading,
  onSelectMonth,
  onSelectDate,
}) => {
  const { year, month } = parseYearMonth(currentMonth);

  // カレンダーの計算 (月曜始まり)
  // 当月1日の曜日 (0:日曜, 1:月曜, ..., 6:土曜)
  const firstDay = new Date(year, month - 1, 1).getDay();
  // 月曜始まりのオフセット (月:0, 火:1, 水:2, 木:3, 金:4, 土:5, 日:6)
  const startOffset = (firstDay + 6) % 7;

  // 当月の日数
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* カレンダーヘッダー */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Smartphone className="w-7 h-7" />
              </span>
              スマホ利用時間ダッシュボード
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Google Family Link 連携・利用ログ
            </p>
          </div>

          {/* 月移動ナビゲーション */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectMonth(prevMonthStr)}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="前月へ"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">前月</span>
            </button>

            <span className="text-xl sm:text-2xl font-bold text-slate-800 min-w-[120px] text-center">
              {year}年 {month}月
            </span>

            <button
              onClick={() => onSelectMonth(nextMonthStr)}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="翌月へ"
            >
              <span className="hidden sm:inline">翌月</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

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

              // 各メンバーのこの日の利用状況
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

                  {/* 対象者ごとの利用時間表示（集計できなければ名前も時間も非表示） */}
                  <div className="mt-2 space-y-1.5">
                    {memberUsages.map((mu, idx) => {
                      if (!mu) return null;
                      // メンバーごとに色を分ける
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
