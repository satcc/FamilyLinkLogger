import React, { useState } from 'react';
import { ArrowLeft, Clock, Calendar, Smartphone, Info } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { MonthlyData, DayUsage } from '../types';
import { formatMinutes } from '../utils/format';

interface DayDetailViewProps {
  dateStr: string; // "YYYY-MM-DD"
  monthlyData: MonthlyData | null;
  onBackToMonth: (yearMonth: string) => void;
}

// アプリごとのカラーパレット
const APP_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#6366F1', '#14B8A6'
];

export const DayDetailView: React.FC<DayDetailViewProps> = ({
  dateStr,
  monthlyData,
  onBackToMonth,
}) => {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const yearMonth = `${yearStr}-${monthStr}`;
  const dayNum = parseInt(dayStr, 10);
  const monthNum = parseInt(monthStr, 10);

  // メンバー一覧
  const members = monthlyData?.members ? Object.values(monthlyData.members) : [];

  // 選択中のメンバータブ
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    members.length > 0 ? members[0].id : ''
  );

  const activeMember = members.find((m) => m.id === selectedMemberId) || members[0];
  const dayData: DayUsage | undefined = activeMember?.days?.[dayStr];

  // 時間帯グラフ用のデータ成形
  // 00時〜23時の24スロット
  const hourlyData = dayData?.hourly || {};
  const hasHourly = Object.keys(hourlyData).length > 0;

  // 登場するすべてのアプリ名を抽出
  const allAppNamesSet = new Set<string>();
  if (hasHourly) {
    Object.values(hourlyData).forEach((slot) => {
      Object.keys(slot).forEach((app) => allAppNamesSet.add(app));
    });
  }
  const allAppNames = Array.from(allAppNamesSet);

  // 24時間スロットデータ
  const chartData = [];
  for (let h = 0; h < 24; h++) {
    const hStr = String(h).padStart(2, '0');
    const slot = hourlyData[hStr] || {};
    const item: Record<string, any> = {
      hour: `${h}:00`,
    };
    allAppNames.forEach((appName) => {
      item[appName] = slot[appName] || 0;
    });
    chartData.push(item);
  }

  // アプリ別サマリー（日合計）
  const appsList = dayData?.apps ? Object.values(dayData.apps) : [];
  appsList.sort((a, b) => b.seconds - a.seconds);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ナビゲーションバー */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onBackToMonth(yearMonth)}
              className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-slate-200"
              title="カレンダーへ戻る"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                {/* 日付の月をクリックするとトップページへ */}
                <button
                  onClick={() => onBackToMonth(yearMonth)}
                  className="text-lg sm:text-xl font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  title={`${yearStr}年${monthNum}月のカレンダーに戻る`}
                >
                  <Calendar className="w-5 h-5" />
                  {yearStr}年 {monthNum}月
                </button>
                <span className="text-xl sm:text-2xl font-bold text-slate-800">
                  {dayNum}日 の利用状況
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                対象者の時間帯別アプリ利用量および内訳
              </p>
            </div>
          </div>

          {/* メンバー切り替えタブ */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
            {members.map((m) => {
              const isSelected = (activeMember?.id || '') === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                    isSelected
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 対象者の利用データ表示 */}
      {!dayData || dayData.totalMinutes <= 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">利用データがありません</h3>
          <p className="text-slate-400 text-sm mt-1">
            この日は {activeMember?.name || '対象者'} のスマホ利用が記録されていないか、未同期です。
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* サマリーカード */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  総利用時間
                </p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {formatMinutes(dayData.totalMinutes)}
                </p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  利用アプリ数
                </p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {appsList.length} <span className="text-sm font-normal text-slate-500">個</span>
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Smartphone className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  最長利用アプリ
                </p>
                <p className="text-lg font-bold text-slate-800 mt-1 truncate max-w-[180px]">
                  {appsList[0]?.name || 'なし'}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
                {appsList[0] ? formatMinutes(appsList[0].minutes) : '-'}
              </span>
            </div>
          </div>

          {/* 1日の時間ごとアプリ利用グラフ (積み上げ棒グラフ) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                時間帯別アプリ利用グラフ (0:00 〜 23:00)
              </h2>
              <span className="text-xs text-slate-400">単位: 分</span>
            </div>

            {hasHourly ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="hour"
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      interval={1}
                      stroke="#CBD5E1"
                    />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} stroke="#CBD5E1" />
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} 分`, name]}
                      labelFormatter={(label) => `${label} の利用量`}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    {allAppNames.map((appName, index) => (
                      <Bar
                        key={appName}
                        dataKey={appName}
                        stackId="a"
                        fill={APP_COLORS[index % APP_COLORS.length]}
                        radius={[2, 2, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                <Info className="w-8 h-8 text-indigo-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-700">
                  時間帯別の詳細ログは毎時の定期実行によって記録されます
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  過去のインポートデータには日別の合計値が保存されています。1時間ごとのコレクターバッチが動いた時間帯からグラフに積み上げ棒が表示されます。
                </p>
              </div>
            )}
          </div>

          {/* アプリ別利用時間内訳テーブル */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">アプリ別利用時間内訳</h2>
              <span className="text-xs text-slate-400">{appsList.length} 件</span>
            </div>

            <div className="divide-y divide-slate-100">
              {appsList.map((app) => {
                const percentage =
                  dayData.totalMinutes > 0
                    ? Math.round((app.minutes / dayData.totalMinutes) * 100)
                    : 0;

                return (
                  <div
                    key={app.package}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {app.icon ? (
                        <img
                          src={app.icon}
                          alt={app.name}
                          className="w-10 h-10 rounded-xl object-contain border border-slate-100 bg-white"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <Smartphone className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{app.name}</p>
                        <p className="text-xs text-slate-400 truncate">{app.package}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="hidden sm:block w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                      <div className="min-w-[80px]">
                        <p className="text-sm font-bold text-slate-800">
                          {formatMinutes(app.minutes)}
                        </p>
                        <p className="text-xs text-slate-400">{percentage}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
