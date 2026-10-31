export interface AppUsage {
  package: string;
  name: string;
  icon: string;
  seconds: number;
  minutes: number;
}

export interface DayUsage {
  date: string; // "YYYY-MM-DD"
  totalSeconds: number;
  totalMinutes: number;
  apps: Record<string, AppUsage>;
  hourly: Record<string, Record<string, number>>; // "00"~"23" -> { "AppName": minutes }
  hourlySeconds?: Record<string, Record<string, number>>; // "00"~"23" -> { "AppName": seconds }
  slots?: Record<string, Record<string, number>>; // "14:10" -> { "AppName": seconds }
}

export interface Member {
  id: string;
  name: string;
  days: Record<string, DayUsage>; // "01"~"31" -> DayUsage
}

export interface MonthlyData {
  yearMonth: string; // "YYYY-MM"
  members: Record<string, Member>;
}
