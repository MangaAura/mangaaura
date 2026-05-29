'use client';

import { Search, MessageCircle, Loader2, UserPlus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

interface SearchUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
}

export function UserSearchBar({ autoFocus: externalAutoFocus }: { autoFocus?: boolean } = {}) {
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingConv, setCreatingConv] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const searchUsers = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.users || []);
        setIsOpen(true);
      } else {
        setError('Error al buscar usuarios');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUsers(val), 300);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setError(null);
    inputRef.current?.focus();
  };

  const handleSelectUser = async (user: SearchUser) => {
    if (creatingConv) return;
    setCreatingConv(user.id);

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!res.ok) throw new Error('Failed to create conversation');
      const data = await res.json();

      handleClear();
      router.push(`/messages/${data.conversation?.id || data.id}`);
    } catch {
      setError('Error al crear conversación');
    } finally {
      setCreatingConv(null);
    }
  };

  // Focus when Nueva conversación is clicked
  useEffect(() => {
    if (externalAutoFocus) {
      inputRef.current?.focus();
    }
  }, [externalAutoFocus]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200 bg-[var(--surface-elevated)]',
          isOpen && results.length > 0
            ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20 rounded-b-none'
            : 'border-[var(--border)] hover:border-[var(--text-tertiary)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20',
        )}
      >
        <Search className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder={t('conversations.searchPlaceholder') || 'Buscar usuarios...'}
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none border-none"
        />
        {isSearching && (
          <Loader2 className="w-4 h-4 animate-spin text-[var(--text-tertiary)] flex-shrink-0" />
        )}
        {query && !isSearching && (
          <button
            onClick={handleClear}
            className="p-0.5 rounded-full hover:bg-[var(--surface-sunken)] transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 bg-[var(--surface-elevated)] border border-t-0 border-[var(--primary)] rounded-b-xl shadow-2xl max-h-80 overflow-y-auto">
          {error ? (
            <div className="p-4 text-sm text-red-500 text-center">{error}</div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center">
              <UserPlus className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-tertiary)]">
                {t('conversations.noUsersFound') || 'No se encontraron usuarios'}
              </p>
            </div>
          ) : (
            <div className="py-1">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                {t('conversations.searchResults') || 'Usuarios'}
              </div>
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  disabled={creatingConv === user.id}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--surface-sunken)] transition-colors text-left disabled:opacity-50"
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-[var(--surface-sunken)] text-[var(--text-secondary)] text-sm">
                      {(user.displayName || user.username)[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {user.displayName || user.username}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--surface-sunken)] px-1.5 py-0.5 rounded-full">
                        Lv.{user.level}
                      </span>
                    </div>
                    {user.displayName && (
                      <p className="text-xs text-[var(--text-tertiary)] truncate">
                        @{user.username}
                      </p>
                    )}
                  </div>
                  {creatingConv === user.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)] flex-shrink-0" />
                  ) : (
                    <MessageCircle className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 group-hover:text-[var(--primary)]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
