import type { RealtimeAnalytics } from '@/types/socket';

let currentStats: RealtimeAnalytics = {
  activeReaders: 0,
  activeReadersChange: 0,
  activeSessions: [],
  popularNow: [],
  readersPerMinute: 0,
  peakToday: 0,
  peakTime: '',
};

export function setRealtimeAnalytics(stats: RealtimeAnalytics): void {
  currentStats = stats;
}

export function getRealtimeAnalytics(): RealtimeAnalytics {
  return currentStats;
}
