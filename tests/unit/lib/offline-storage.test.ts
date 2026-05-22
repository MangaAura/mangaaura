import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock IDBKeyRange (used by clearExpiredData)
Object.defineProperty(globalThis, 'IDBKeyRange', {
  value: { only: vi.fn(), upperBound: vi.fn() },
  writable: true,
});

// Helper: create a mock IDBRequest that auto-triggers success via setter
function createMockRequest(result?: any) {
  const handlers: Record<string, (() => void) | null> = {
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
  };
  const request: any = {};
  Object.defineProperty(request, 'onsuccess', {
    set(cb: (() => void) | null) {
      handlers.onsuccess = cb;
      // Fire on next microtask so init() promise resolves
      if (cb) Promise.resolve().then(() => cb());
    },
    get() { return handlers.onsuccess; },
  });
  Object.defineProperty(request, 'onerror', {
    set(cb) { handlers.onerror = cb; },
    get() { return handlers.onerror; },
  });
  Object.defineProperty(request, 'onupgradeneeded', {
    set(cb) { handlers.onupgradeneeded = cb; },
    get() { return handlers.onupgradeneeded; },
  });
  request.result = result;
  request.error = null;
  return request;
}

const mockObjectStore = {
  put: vi.fn(() => createMockRequest()),
  get: vi.fn(() => createMockRequest(undefined)),
  add: vi.fn(() => createMockRequest(1)),
  delete: vi.fn(() => createMockRequest()),
  count: vi.fn(() => createMockRequest(0)),
  openCursor: vi.fn(() => createMockRequest(null)),
  index: vi.fn(() => ({
    openCursor: vi.fn(() => createMockRequest(null)),
    get: vi.fn(() => createMockRequest(undefined)),
  })),
  createIndex: vi.fn(),
};

const mockTransaction = {
  objectStore: vi.fn(() => mockObjectStore),
};

const mockDB = {
  transaction: vi.fn(() => mockTransaction),
  objectStoreNames: { contains: vi.fn(() => true) },
  createObjectStore: vi.fn(() => mockObjectStore),
};

const mockIndexedDB = {
  open: vi.fn(() => createMockRequest(mockDB)),
};

Object.defineProperty(globalThis, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

// Only mock Date, not timers
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

describe('OfflineStorage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules(); // Get fresh singleton from re-evaluated module
  });

  it('initializes IndexedDB on first call', async () => {
    const { offlineStorage } = await import('@/lib/offline-storage');
    await offlineStorage.init();
    expect(mockIndexedDB.open).toHaveBeenCalledWith('inkverse-offline', 1);
  });

  it('does not reinitialize after first init', async () => {
    const { offlineStorage } = await import('@/lib/offline-storage');
    await offlineStorage.init();
    await offlineStorage.init();
    expect(mockIndexedDB.open).toHaveBeenCalledTimes(1);
  });

  it('saves manga to IndexedDB', async () => {
    const { offlineStorage } = await import('@/lib/offline-storage');
    await offlineStorage.init();

    await offlineStorage.saveManga({
      id: 'manga-1',
      slug: 'test-manga',
      title: 'Test Manga',
      coverUrl: null,
      authorName: 'Author',
      status: 'ONGOING',
      lastChapter: 5,
    });

    expect(mockDB.transaction).toHaveBeenCalledWith(['mangas'], 'readwrite');
    expect(mockTransaction.objectStore).toHaveBeenCalledWith('mangas');
    expect(mockObjectStore.put).toHaveBeenCalled();
  });

  it('queues actions for background sync', async () => {
    const { offlineStorage } = await import('@/lib/offline-storage');
    await offlineStorage.init();

    await offlineStorage.queueAction('like_manga', { mangaId: 'manga-1' });
    await offlineStorage.queueAction('add_comment', { text: 'Great chapter!' });

    expect(mockDB.transaction).toHaveBeenCalledWith(['actionQueue'], 'readwrite');
    expect(mockObjectStore.add).toHaveBeenCalledTimes(2);
  });

  it('saves reading progress', async () => {
    const { offlineStorage } = await import('@/lib/offline-storage');
    await offlineStorage.init();

    await offlineStorage.saveReadingProgress('manga-1', 3, 15);
    expect(mockDB.transaction).toHaveBeenCalledWith(['readingProgress'], 'readwrite');
    expect(mockObjectStore.put).toHaveBeenCalled();
  });

  it('provides storage info', async () => {
    const { offlineStorage } = await import('@/lib/offline-storage');
    await offlineStorage.init();

    const info = await offlineStorage.getStorageInfo();
    expect(info).toBeDefined();
    expect(typeof info.mangas).toBe('number');
    expect(typeof info.chapters).toBe('number');
    expect(typeof info.actions).toBe('number');
  });

  it('clears expired data', async () => {
    const { offlineStorage } = await import('@/lib/offline-storage');
    await offlineStorage.init();
    await offlineStorage.clearExpiredData();
    expect(mockDB.transaction).toHaveBeenCalled();
  });
});
