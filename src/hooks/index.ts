/**
 * Debounce & Throttle
 */
export {
  useDebounce,
  useDebouncedCallback,
  useDebouncedSearch,
  useThrottle,
  useRateLimit,
} from './useDebounce';

/**
 * Custom Hooks
 *
 * Hooks reutilizables para toda la aplicación.
 */

// Notifications
export {
  useMangaNotifications as useNotifications,
  useNotificationListener as useNotificationCount,
} from './useNotifications';

// Auth & User
export { useSession } from 'next-auth/react';

// AI Service
export {
  useAIService,
  useAIJob,
  useAIBatch,
  useAIServiceHealth,
} from './useAIService';

export {
  useAIAlerts,
  useCriticalAlerts,
  useModelAlerts,
  useAIAlertsRealtime,
  useAIAlertNotifier,
} from './useAIAlerts';

// Manga Management
export {
  useMangaUpload,
  type UploadProgress,
} from './useMangaUpload';

export {
  useManga,
} from './useManga';

export {
  useCreatorMangas,
  type CreatorDashboardStats as DashboardStats,
} from './useCreatorMangas';

// Types
// Note: AIServiceState type is defined locally in useAIService, not exported

// Comments
export {
  useChapterComments,
  type Comment,
} from './useChapterComments';

// Analytics
export {
  useAnalytics,
  useChapterAnalytics,
  trackEvent,
} from './useAnalytics';
export { useReadingAnalytics } from './useReadingAnalytics';

// MongoDB Analytics (nuevos)
export { useMongoAnalytics } from './useMongoAnalytics';
export { useReadingMongoAnalytics } from './useReadingMongoAnalytics';
