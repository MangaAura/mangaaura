'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { offlineStorage } from '@/lib/offline-storage';

interface UseOfflineReturn {
  isOnline: boolean;
  isOffline: boolean;
  saveChapterForOffline: (mangaId: string, chapterNumber: number, title: string, pages: string[]) => Promise<void>;
  getOfflineChapter: (mangaId: string, chapterNumber: number) => Promise<{ title: string; pages: string[] } | null>;
  queueAction: (type: string, data: unknown) => Promise<void>;
  syncWhenOnline: () => Promise<void>;
  clearExpiredCache: () => Promise<void>;
  storageInfo: { mangas: number; chapters: number; actions: number } | null;
  refreshStorageInfo: () => Promise<void>;
}

/**
 * Queue an action for background sync and register the sync event.
 * Can be used outside of React components too.
 */
export async function queueSyncAction(type: string, data: unknown): Promise<void> {
  await offlineStorage.queueAction(type, data);
  try {
    const registration = await navigator.serviceWorker.ready;
    await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-pending-actions');
  } catch {
    console.warn('[Offline] Background Sync not supported');
  }
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') return navigator.onLine;
    return true;
  });
  const [storageInfo, setStorageInfo] = useState<{ mangas: number; chapters: number; actions: number } | null>(null);
  const isSyncing = useRef(false);

  const refreshStorageInfo = useCallback(async (): Promise<void> => {
    const info = await offlineStorage.getStorageInfo();
    setStorageInfo(info);
  }, []);

  const syncWhenOnline = useCallback(async (): Promise<void> => {
    if (!navigator.onLine || isSyncing.current) return;
    isSyncing.current = true;

    try {
      const actions = await offlineStorage.getQueuedActions();
      for (const action of actions) {
        try {
          const response = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: action.type,
              data: action.data,
              timestamp: action.timestamp.toISOString(),
            }),
          });
          if (response.ok) {
            await offlineStorage.removeQueuedAction(action.id);
          }
        } catch {
          // Retry later — keep action in queue
        }
      }
    } finally {
      isSyncing.current = false;
      await refreshStorageInfo();
    }
  }, [refreshStorageInfo]);

  const queueAction = useCallback(async (type: string, data: unknown): Promise<void> => {
    await queueSyncAction(type, data);
    await refreshStorageInfo();
  }, [refreshStorageInfo]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncWhenOnline();
    };
    const handleOffline = () => setIsOnline(false);

    // Listen for SYNC_NOW messages from Service Worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_NOW') {
        syncWhenOnline();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    navigator.serviceWorker?.addEventListener('message', handleMessage);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshStorageInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [syncWhenOnline, refreshStorageInfo]);

  const saveChapterForOffline = useCallback(async (
    mangaId: string,
    chapterNumber: number,
    title: string,
    pages: string[]
  ): Promise<void> => {
    const chapterId = `${mangaId}-${chapterNumber}`;
    await offlineStorage.saveChapter({
      id: chapterId,
      mangaId,
      chapterNumber,
      title,
      pages,
    });
    await refreshStorageInfo();
  }, []);

  const getOfflineChapter = useCallback(async (
    mangaId: string,
    chapterNumber: number
  ): Promise<{ title: string; pages: string[] } | null> => {
    const chapter = await offlineStorage.getChapter(mangaId, chapterNumber);
    if (!chapter) return null;
    return { title: chapter.title, pages: chapter.pages };
  }, []);

  const clearExpiredCache = useCallback(async (): Promise<void> => {
    await offlineStorage.clearExpiredData();
    await refreshStorageInfo();
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    saveChapterForOffline,
    getOfflineChapter,
    queueAction,
    syncWhenOnline,
    clearExpiredCache,
    storageInfo,
    refreshStorageInfo,
  };
}
