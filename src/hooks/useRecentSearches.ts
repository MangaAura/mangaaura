/**
 * useRecentSearches Hook
 *
 * Shared logic for recent searches across SearchBars and explore page:
 * - localStorage persistence (with optional migration from an old key)
 * - Server sync via /api/user/recent-searches (optional)
 * - add/remove/clear operations
 */

'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseRecentSearchesOptions {
  /** localStorage key. Default: 'mangaaura_recent_searches' */
  storageKey?: string;
  /** Max items to keep. Default: 8 */
  maxItems?: number;
  /** If true, syncs with server via /api/user/recent-searches. Default: true */
  syncWithServer?: boolean;
  /** Optional old key to migrate data from (e.g. 'recentSearches') */
  oldKey?: string;
}

interface UseRecentSearchesReturn {
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  /** Whether the initial localStorage load has completed */
  isReady: boolean;
}

export function useRecentSearches(options: UseRecentSearchesOptions = {}): UseRecentSearchesReturn {
  const {
    storageKey = 'mangaaura_recent_searches',
    maxItems = 8,
    syncWithServer = true,
    oldKey,
  } = options;

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const initializedRef = useRef(false);
  const { data: session } = useSession();

  // ── Load from localStorage (once on mount) ─────────────────────
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const load = (): string[] => {
      try {
        // Try new key first
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed.slice(0, maxItems);
        }

        // Migration from old key
        if (oldKey) {
          const oldStored = localStorage.getItem(oldKey);
          if (oldStored) {
            const parsed = JSON.parse(oldStored);
            if (Array.isArray(parsed)) {
              const items = parsed.slice(0, maxItems);
              localStorage.setItem(storageKey, JSON.stringify(items));
              localStorage.removeItem(oldKey);
              return items;
            }
          }
        }
      } catch {
        // Ignore parse errors
      }
      return [];
    };

    setRecentSearches(load());
    setIsReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist to localStorage ────────────────────────────────────
  const persistLocal = useCallback(
    (searches: string[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(searches));
      } catch {
        // Ignore quota errors
      }
    },
    [storageKey]
  );

  // ── Sync from server when auth changes ─────────────────────────
  useEffect(() => {
    if (!syncWithServer || !session?.user?.id || !isReady) return;

    fetch('/api/user/recent-searches')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        const serverSearches = (data.searches || []).map(
          (s: { query: string }) => s.query
        ).slice(0, maxItems);

        setRecentSearches((prev) => {
          const merged = [...serverSearches];
          for (const s of prev) {
            if (!merged.includes(s)) merged.push(s);
          }
          const final = merged.slice(0, maxItems);
          persistLocal(final);
          return final;
        });
      })
      .catch(() => {
        // Keep current state on fetch failure
      });
  }, [syncWithServer, session?.user?.id, isReady, maxItems, persistLocal]);

  // ── Add a search ───────────────────────────────────────────────
  const addRecentSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s !== searchQuery);
        const next = [searchQuery, ...filtered].slice(0, maxItems);
        persistLocal(next);
        return next;
      });

      // Fire-and-forget server sync
      if (syncWithServer && session?.user?.id) {
        fetch('/api/user/recent-searches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery }),
        }).catch(() => { /* silent */ });
      }
    },
    [syncWithServer, session?.user?.id, maxItems, persistLocal]
  );

  // ── Remove a search ────────────────────────────────────────────
  const removeRecentSearch = useCallback(
    (searchQuery: string) => {
      setRecentSearches((prev) => {
        const next = prev.filter((s) => s !== searchQuery);
        persistLocal(next);
        return next;
      });

      if (syncWithServer && session?.user?.id) {
        fetch(`/api/user/recent-searches?query=${encodeURIComponent(searchQuery)}`, {
          method: 'DELETE',
        }).catch(() => { /* silent */ });
      }
    },
    [syncWithServer, session?.user?.id, persistLocal]
  );

  // ── Clear all searches ─────────────────────────────────────────
  const clearRecentSearches = useCallback(
    () => {
      setRecentSearches([]);
      persistLocal([]);

      if (syncWithServer && session?.user?.id) {
        fetch('/api/user/recent-searches', {
          method: 'DELETE',
        }).catch(() => { /* silent */ });
      }
    },
    [syncWithServer, session?.user?.id, persistLocal]
  );

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    isReady,
  };
}
