/**
 * SearchBar Component
 * 
 * Barra de búsqueda con autocomplete y sugerencias.
 */

'use client';

import { Search, X, Clock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect, useRef } from 'react';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  id: string;
  title: string;
  type: 'manga' | 'author' | 'genre';
  coverUrl?: string;
  slug?: string;
}

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  showSuggestions?: boolean;
}

export function SearchBar({
  className,
  placeholder = 'Buscar mangas, autores, géneros...',
  onSearch,
  showSuggestions = true,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Fetch suggestions
  const fetchSuggestions = useDebouncedCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || !showSuggestions) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        
        const mappedSuggestions: SearchSuggestion[] = data.results.map((manga: any) => ({
          id: manga.id,
          title: manga.title,
          type: 'manga',
          coverUrl: manga.coverUrl,
        }));
        
        setSuggestions(mappedSuggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    300
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    setSelectedIndex(-1);
    fetchSuggestions(value);
  };

  // Handle search submission
  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    saveRecentSearch(searchQuery);
    setIsOpen(false);
    
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    setIsOpen(false);
    router.push(`/manga/${suggestion.slug || suggestion.id}`);
  };

  // Handle recent search click
  const handleRecentClick = (search: string) => {
    setQuery(search);
    handleSearch(search);
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Clear recent searches
  const clearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = suggestions.length > 0 ? suggestions : recentSearches.map(s => ({ id: s, title: s, type: 'manga' as const }));
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          const selected = items[selectedIndex];
          if ('type' in selected && selected.type === 'manga') {
            handleSuggestionClick(selected as SearchSuggestion);
          } else {
            handleRecentClick(selected.title);
          }
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = isOpen && (suggestions.length > 0 || recentSearches.length > 0);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-[var(--text-secondary)]" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Buscar manga"
          className={cn(
            'w-full pl-10 pr-10 py-2.5',
            'bg-[var(--surface)]/50 border border-[var(--border)]',
            'rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)]',
            'transition-all duration-200'
          )}
        />
        
        {/* Clear button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-medium text-[var(--text-tertiary)] uppercase">
                Sugerencias
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    'w-full px-3 py-2 flex items-center gap-3',
                    'hover:bg-[var(--surface)] transition-colors',
                    index === selectedIndex && 'bg-[var(--surface)]'
                  )}
                >
                  {suggestion.coverUrl ? (
                    <OptimizedImage
                      src={suggestion.coverUrl}
                      alt={suggestion.title}
                      width={32}
                      height={40}
                      className="rounded"
                      objectFit="cover"
                    />
                  ) : (
                    <div className="w-8 h-10 bg-[var(--surface-sunken)] rounded flex items-center justify-center">
                      <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-sm text-[var(--text-primary)] font-medium">{suggestion.title}</p>
                    <p className="text-xs text-[var(--text-secondary)]">Manga</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="py-4 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
            </div>
          )}

          {/* Recent searches */}
          {recentSearches.length > 0 && !isLoading && (
            <div className="py-2 border-t border-[var(--border-strong)]">
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase">
                  Búsquedas recientes
                </span>
                <button
                  onClick={clearRecent}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Limpiar
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={search}
                  onClick={() => handleRecentClick(search)}
                  className={cn(
                    'w-full px-3 py-2 flex items-center gap-3',
                    'hover:bg-[var(--surface)] transition-colors',
                    index + suggestions.length === selectedIndex && 'bg-[var(--surface)]'
                  )}
                >
                  <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <span className="text-sm text-[var(--text-primary)]">{search}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
