export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0分';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}時間${minutes}分`;
  } else if (hours > 0) {
    return `${hours}時間`;
  }
  return `${minutes}分`;
}

export function formatShortDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

export function parseYearMonth(yearMonthStr: string): { year: number; month: number } {
  const [yearStr, monthStr] = yearMonthStr.split('-');
  return {
    year: parseInt(yearStr, 10),
    month: parseInt(monthStr, 10),
  };
}

export function getAdjacentMonth(yearMonthStr: string, delta: number): string {
  const { year, month } = parseYearMonth(yearMonthStr);
  const date = new Date(year, month - 1 + delta, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getAdjacentDate(dateStr: string, deltaDays: number): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10) + deltaDays);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateWithWeekday(dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const w = weekdays[date.getDay()];
  return `${parseInt(monthStr, 10)}月${parseInt(dayStr, 10)}日(${w})`;
}

