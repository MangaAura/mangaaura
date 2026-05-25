'use client';

import { useState, useEffect, useCallback } from 'react';

import { offlineStorage } from '@/lib/offline-storage';

interface UseOfflineReturn {
  isOnline: boolean;
  isOffline: boolean;
  saveChapterForOffline: (mangaId: string, chapterNumber: number, title: string, pages: string[]) => Promise<void>;
  getOfflineChapter: (mangaId: string, chapterNumber: number) => Promise<{ title: string; pages: string[] } | null>;
  syncWhenOnline: () => Promise<void>;
  clearExpiredCache: () => Promise<void>;
  storageInfo: { mangas: number; chapters: number; actions: number } | null;
  refreshStorageInfo: () => Promise<void>;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [storageInfo, setStorageInfo] = useState<{ mangas: number; chapters: number; actions: number } | null>(null);

  const refreshStorageInfo = useCallback(async (): Promise<void> => {
    const info = await offlineStorage.getStorageInfo();
    setStorageInfo(info);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshStorageInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  const syncWhenOnline = useCallback(async (): Promise<void> => {
    if (!navigator.onLine) return;

    const actions = await offlineStorage.getQueuedActions();
    for (const action of actions) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action),
        });
        await offlineStorage.removeQueuedAction(action.id);
      } catch {
        // Retry later
      }
    }
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
    syncWhenOnline,
    clearExpiredCache,
    storageInfo,
    refreshStorageInfo,
  };
}
