'use client';

/**
 * Offline Storage Service
 * 
 * Gestiona el almacenamiento local de datos usando IndexedDB
 * para permitir lectura offline de capítulos de manga.
 */

const DB_NAME = 'inkverse-offline';
const DB_VERSION = 1;

interface OfflineChapter {
  id: string;
  mangaId: string;
  chapterNumber: number;
  title: string;
  pages: string[]; // URLs o base64 de las páginas
  createdAt: Date;
  expiresAt: Date; // Auto-limpieza después de X días
}

interface OfflineManga {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  authorName: string;
  status: string;
  lastChapter: number;
  expiresAt: Date;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store para mangas guardados
        if (!db.objectStoreNames.contains('mangas')) {
          const mangaStore = db.createObjectStore('mangas', { keyPath: 'id' });
          mangaStore.createIndex('slug', 'slug', { unique: true });
          mangaStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }

        // Store para capítulos guardados
        if (!db.objectStoreNames.contains('chapters')) {
          const chapterStore = db.createObjectStore('chapters', { keyPath: 'id' });
          chapterStore.createIndex('mangaId', 'mangaId', { unique: false });
          chapterStore.createIndex('expiresAt', 'expiresAt', { unique: false });
          chapterStore.createIndex('chapterNumber', 'chapterNumber', { unique: false });
        }

        // Store para progreso de lectura offline
        if (!db.objectStoreNames.contains('readingProgress')) {
          const progressStore = db.createObjectStore('readingProgress', { keyPath: 'mangaId' });
          progressStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Store para queue de acciones pendientes
        if (!db.objectStoreNames.contains('actionQueue')) {
          const queueStore = db.createObjectStore('actionQueue', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  // ============ MANGAS ============

  async saveManga(manga: Omit<OfflineManga, 'expiresAt'>): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const data: OfflineManga = {
      ...manga,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['mangas'], 'readwrite');
      const store = transaction.objectStore('mangas');
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getManga(id: string): Promise<OfflineManga | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['mangas'], 'readonly');
      const store = transaction.objectStore('mangas');
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as OfflineManga | undefined;
        if (result && new Date(result.expiresAt) > new Date()) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getSavedMangas(): Promise<OfflineManga[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['mangas'], 'readonly');
      const store = transaction.objectStore('mangas');
      const request = store.openCursor();
      const results: OfflineManga[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const manga = cursor.value as OfflineManga;
          if (new Date(manga.expiresAt) > new Date()) {
            results.push(manga);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteManga(id: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    // Eliminar manga y todos sus capítulos
    const transaction = this.db.transaction(['mangas', 'chapters'], 'readwrite');
    const mangaStore = transaction.objectStore('mangas');
    const chapterStore = transaction.objectStore('chapters');

    mangaStore.delete(id);
    
    // Eliminar capítulos relacionados
    const chapterIndex = chapterStore.index('mangaId');
    const request = chapterIndex.openCursor(IDBKeyRange.only(id));
    
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        chapterStore.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
  }

  // ============ CHAPTERS ============

  async saveChapter(chapter: Omit<OfflineChapter, 'createdAt' | 'expiresAt'>): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date();
    const data: OfflineChapter = {
      ...chapter,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 días
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['chapters'], 'readwrite');
      const store = transaction.objectStore('chapters');
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getChapter(mangaId: string, chapterNumber: number): Promise<OfflineChapter | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['chapters'], 'readonly');
      const store = transaction.objectStore('chapters');
      const index = store.index('mangaId');
      const request = index.openCursor(IDBKeyRange.only(mangaId));

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const chapter = cursor.value as OfflineChapter;
          if (chapter.chapterNumber === chapterNumber && new Date(chapter.expiresAt) > new Date()) {
            resolve(chapter);
            return;
          }
          cursor.continue();
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getMangaChapters(mangaId: string): Promise<OfflineChapter[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['chapters'], 'readonly');
      const store = transaction.objectStore('chapters');
      const index = store.index('mangaId');
      const request = index.openCursor(IDBKeyRange.only(mangaId));
      const results: OfflineChapter[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const chapter = cursor.value as OfflineChapter;
          if (new Date(chapter.expiresAt) > new Date()) {
            results.push(chapter);
          }
          cursor.continue();
        } else {
          resolve(results.sort((a, b) => a.chapterNumber - b.chapterNumber));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteChapter(id: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['chapters'], 'readwrite');
      const store = transaction.objectStore('chapters');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============ READING PROGRESS ============

  async saveReadingProgress(mangaId: string, chapterNumber: number, pageNumber: number): Promise<void> {
    await this.init();
    if (!this.db) return;

    const data = {
      mangaId,
      chapterNumber,
      pageNumber,
      updatedAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['readingProgress'], 'readwrite');
      const store = transaction.objectStore('readingProgress');
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getReadingProgress(mangaId: string): Promise<{ chapterNumber: number; pageNumber: number } | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['readingProgress'], 'readonly');
      const store = transaction.objectStore('readingProgress');
      const request = store.get(mangaId);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? { chapterNumber: result.chapterNumber, pageNumber: result.pageNumber } : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ============ ACTION QUEUE (Background Sync) ============

  async queueAction(type: string, data: unknown): Promise<void> {
    await this.init();
    if (!this.db) return;

    const action = {
      type,
      data,
      timestamp: new Date(),
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actionQueue'], 'readwrite');
      const store = transaction.objectStore('actionQueue');
      const request = store.add(action);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getQueuedActions(): Promise<{ id: number; type: string; data: unknown; timestamp: Date; retries: number }[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actionQueue'], 'readonly');
      const store = transaction.objectStore('actionQueue');
      const request = store.openCursor();
      const results: { id: number; type: string; data: unknown; timestamp: Date; retries: number }[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async removeQueuedAction(id: number): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actionQueue'], 'readwrite');
      const store = transaction.objectStore('actionQueue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============ STORAGE MANAGEMENT ============

  async clearExpiredData(): Promise<void> {
    await this.init();
    if (!this.db) return;

    const now = new Date();
    
    // Limpiar mangas expirados
    const mangaTransaction = this.db.transaction(['mangas'], 'readwrite');
    const mangaStore = mangaTransaction.objectStore('mangas');
    const mangaIndex = mangaStore.index('expiresAt');
    const mangaRequest = mangaIndex.openCursor(IDBKeyRange.upperBound(now));

    mangaRequest.onsuccess = () => {
      const cursor = mangaRequest.result;
      if (cursor) {
        mangaStore.delete(cursor.primaryKey);
        cursor.continue();
      }
    };

    // Limpiar capítulos expirados
    const chapterTransaction = this.db.transaction(['chapters'], 'readwrite');
    const chapterStore = chapterTransaction.objectStore('chapters');
    const chapterIndex = chapterStore.index('expiresAt');
    const chapterRequest = chapterIndex.openCursor(IDBKeyRange.upperBound(now));

    chapterRequest.onsuccess = () => {
      const cursor = chapterRequest.result;
      if (cursor) {
        chapterStore.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
  }

  async getStorageInfo(): Promise<{ mangas: number; chapters: number; actions: number }> {
    await this.init();
    if (!this.db) return { mangas: 0, chapters: 0, actions: 0 };

    const [mangas, chapters, actions] = await Promise.all([
      this.getSavedMangas(),
      new Promise<number>((resolve) => {
        const transaction = this.db!.transaction(['chapters'], 'readonly');
        const store = transaction.objectStore('chapters');
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      }),
      new Promise<number>((resolve) => {
        const transaction = this.db!.transaction(['actionQueue'], 'readonly');
        const store = transaction.objectStore('actionQueue');
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      }),
    ]);

    return { mangas: mangas.length, chapters, actions };
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// Hook para usar el storage
export function useOfflineStorage() {
  return offlineStorage;
}

export type { OfflineChapter, OfflineManga };
