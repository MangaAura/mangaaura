/**
 * SearchBar Component
 * 
 * Barra de búsqueda con autocomplete y sugerencias.
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Clock, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useT } from '@/i18n';
import { extractApiError } from '@/lib/extract-api-error';
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
  const t = useT();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { handleError } = useErrorHandler();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches({
    syncWithServer: false,
    oldKey: 'recentSearches',
  });

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
        if (!response.ok) {
          const { message } = await extractApiError(response);
          throw new Error(message);
        }
        const data = await response.json();
        
        const mappedSuggestions: SearchSuggestion[] = data.results.map((manga: any) => ({
          id: manga.id,
          title: manga.title,
          type: 'manga',
          coverUrl: manga.coverUrl,
        }));
        
        setSuggestions(mappedSuggestions);
      } catch (error) {
        handleError(error);
        setSuggestions([]);
        setValidationError(t('search.errorConnection'));
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
    setValidationError(null);
    fetchSuggestions(value);
  };

  // Handle search submission
  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    addRecentSearch(searchQuery);
    setIsOpen(false);
    
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      router.push(`/explore?q=${encodeURIComponent(searchQuery)}`);
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



  // Keyboard navigation — combines suggestions + recent searches into a single flat list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const suggestionCount = suggestions.length;
    const recentCount = recentSearches.length;
    const totalCount = suggestionCount + recentCount;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (totalCount > 0) {
          setSelectedIndex(prev => (prev + 1) % totalCount);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (totalCount > 0) {
          setSelectedIndex(prev => (prev - 1 + totalCount) % totalCount);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < totalCount) {
          if (selectedIndex < suggestionCount) {
            handleSuggestionClick(suggestions[selectedIndex]);
          } else {
            handleRecentClick(recentSearches[selectedIndex - suggestionCount]);
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
    <div ref={containerRef} className={cn('relative', className)} role="search">
      {/* Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-[var(--text-secondary)]" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          name="search"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Buscar manga"
          aria-autocomplete="list"
          aria-activedescendant={selectedIndex >= 0 ? (selectedIndex < suggestions.length ? `search-suggestion-${selectedIndex}` : `search-recent-${selectedIndex - suggestions.length}`) : undefined}
          className={cn(
            'w-full pl-10 pr-10 py-2.5',
            'bg-[var(--surface)]/50 border border-[var(--border)]',
            'rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)]',
            'transition-all duration-200'
          )}
        />

        {/* Inline validation error */}
        <AnimatePresence>
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5 mt-1.5"
              role="alert"
            >
              <AlertCircle className="w-3.5 h-3.5 text-[var(--error)] shrink-0" />
              <span className="text-xs text-[var(--error)]">{validationError}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
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
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden" role="listbox" aria-labelledby="search-suggestions-label">
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-medium text-[var(--text-tertiary)] uppercase" id="search-suggestions-label">
                Sugerencias
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  id={`search-suggestion-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'w-full px-3 py-2 flex items-center gap-3',
                    'hover:bg-[var(--surface)] transition-colors',
                    index === selectedIndex && 'bg-[var(--surface)]'
                  )}
                  role="option"
                  aria-selected={index === selectedIndex}
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
            <div className="py-4 flex justify-center" role="status" aria-label="Buscando sugerencias">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" aria-hidden="true" />
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
                  onClick={(e) => { e.stopPropagation(); clearRecentSearches(); }}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Limpiar
                </button>
              </div>
              <AnimatePresence initial={false}>
              {recentSearches.map((search, index) => {
                const combinedIndex = suggestions.length + index;
                return (
                <motion.button
                  key={search}
                  id={`search-recent-${index}`}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  onClick={() => handleRecentClick(search)}
                  onMouseEnter={() => setSelectedIndex(combinedIndex)}
                  className={cn(
                    'w-full px-3 py-2 flex items-center gap-3',
                    'hover:bg-[var(--surface)] transition-colors',
                    combinedIndex === selectedIndex && 'bg-[var(--surface)]'
                  )}
                  role="option"
                  aria-selected={combinedIndex === selectedIndex}
                >
                  <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <span className="text-sm text-[var(--text-primary)]">{search}</span>
      </motion.button>
            )})}
          </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
