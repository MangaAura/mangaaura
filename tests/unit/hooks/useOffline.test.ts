import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
});

// Mock offline storage
vi.mock('@/lib/offline-storage', () => ({
  offlineStorage: {
    saveChapter: vi.fn().mockResolvedValue(undefined),
    getChapter: vi.fn().mockResolvedValue(null),
    getQueuedActions: vi.fn().mockResolvedValue([]),
    removeQueuedAction: vi.fn().mockResolvedValue(undefined),
    clearExpiredData: vi.fn().mockResolvedValue(undefined),
    getStorageInfo: vi.fn().mockResolvedValue({ mangas: 2, chapters: 5, actions: 0 }),
  },
}));

import { useOffline } from '@/hooks/useOffline';

describe('useOffline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (navigator as any).onLine = true;
  });

  it('detects online status', () => {
    const { result } = renderHook(() => useOffline());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it('tracks storage info', async () => {
    const { result } = renderHook(() => useOffline());

    await waitFor(() => {
      expect(result.current.storageInfo).not.toBeNull();
    });

    expect(result.current.storageInfo?.mangas).toBe(2);
    expect(result.current.storageInfo?.chapters).toBe(5);
  });

  it('saves chapter for offline', async () => {
    const { result } = renderHook(() => useOffline());

    await act(async () => {
      await result.current.saveChapterForOffline(
        'manga-1',
        1,
        'Chapter 1',
        ['/page1.jpg', '/page2.jpg']
      );
    });

    const { offlineStorage } = await import('@/lib/offline-storage');
    expect(offlineStorage.saveChapter).toHaveBeenCalledWith({
      id: 'manga-1-1',
      mangaId: 'manga-1',
      chapterNumber: 1,
      title: 'Chapter 1',
      pages: ['/page1.jpg', '/page2.jpg'],
    });
  });

  it('returns null when chapter not in offline storage', async () => {
    const { result } = renderHook(() => useOffline());

    let chapter;
    await act(async () => {
      chapter = await result.current.getOfflineChapter('manga-1', 99);
    });

    expect(chapter).toBeNull();
  });

  it('syncs queued actions when online', async () => {
    const { result } = renderHook(() => useOffline());

    await act(async () => {
      await result.current.syncWhenOnline();
    });

    // Should not throw when no actions queued
    expect(result.current.isOnline).toBe(true);
  });

  it('clears expired cache', async () => {
    const { result } = renderHook(() => useOffline());

    await act(async () => {
      await result.current.clearExpiredCache();
    });

    const { offlineStorage } = await import('@/lib/offline-storage');
    expect(offlineStorage.clearExpiredData).toHaveBeenCalled();
  });

  it('detects offline status changes', async () => {
    const { result } = renderHook(() => useOffline());

    expect(result.current.isOnline).toBe(true);

    await act(() => {
      (navigator as any).onLine = false;
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });

  it('handles online comeback', async () => {
    const { result } = renderHook(() => useOffline());

    await act(() => {
      (navigator as any).onLine = true;
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });
});
