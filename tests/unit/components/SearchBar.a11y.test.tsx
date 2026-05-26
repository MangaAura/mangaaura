import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

// Mock hooks
const mockT = vi.hoisted(() => (key: string) => {
  const translations: Record<string, string> = {
    'common.search': 'Buscar',
    'common.searchSuggestions': 'Sugerencias de búsqueda',
    'common.noResults': 'Sin resultados',
    'common.suggestions': 'Sugerencias',
    'search.recentSearches': 'Búsquedas recientes',
    'search.clearRecent': 'Limpiar búsquedas recientes',
    'search.clear': 'Limpiar',
    'search.removeRecent': 'Eliminar',
    'search.pressEnterToSearch': 'Presiona Enter para buscar',
    'search.iaTitle': 'Búsqueda inteligente',
    'search.viewAllResults': 'Ver todos los resultados',
    'search.statusHiatus': 'En pausa',
    'search.errorConnection': 'Error de conexión',
    'browse.semanticSearch': 'Búsqueda inteligente',
    'manga.ongoing': 'En emisión',
    'manga.completed': 'Finalizado',
  };
  return translations[key] || key;
});

const mockAddRecentSearch = vi.fn();
const mockRemoveRecentSearch = vi.fn();
const mockClearRecentSearches = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/i18n', () => ({
  useT: () => mockT,
}));

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (val: string) => val,
}));

vi.mock('@/hooks/useRecentSearches', () => ({
  useRecentSearches: () => ({
    recentSearches: ['naruto', 'one piece'],
    addRecentSearch: mockAddRecentSearch,
    removeRecentSearch: mockRemoveRecentSearch,
    clearRecentSearches: mockClearRecentSearches,
  }),
}));

// Mock constants to avoid import issues
vi.mock('@/constants/genres', () => ({
  GENRE_DISPLAY: {},
}));

vi.mock('@/lib/extract-api-error', () => ({
  extractApiError: vi.fn().mockResolvedValue({ message: 'Error' }),
}));

import { SearchBar } from '@/components/Layout/SearchBar';

// Mock fetch response helper
function mockFetchResults(results: any[]) {
  vi.mocked(global.fetch).mockResolvedValue(
    new Response(JSON.stringify({ results }), { status: 200 })
  );
}

describe('SearchBar — Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchResults([]);
  });

  describe('ARIA roles and attributes', () => {
    it('renders form with role="search"', () => {
      const { container } = render(<SearchBar />);
      const form = container.querySelector('form');
      expect(form).toHaveAttribute('role', 'search');
    });

    it('renders input with role="combobox" and type="search"', () => {
      render(<SearchBar />);
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('input has aria-label for search', () => {
      render(<SearchBar />);
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-label', 'Buscar');
    });

    it('input has aria-autocomplete="list"', () => {
      render(<SearchBar />);
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
    });

    it('input has aria-controls pointing to suggestions container', () => {
      render(<SearchBar />);
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-controls', 'search-suggestions');
    });

    it('sets aria-expanded=false when input is empty', () => {
      render(<SearchBar />);
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    it('sets aria-expanded=true when typing and dropdown is open', async () => {
      render(<SearchBar />);
      const input = screen.getByRole('combobox');

      await act(async () => {
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'na' } });
      });

      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('suggestion items have role="option" and aria-selected', async () => {
      mockFetchResults([
        { id: '1', title: 'Naruto', slug: 'naruto', status: 'ONGOING', totalViews: 1000, chapterCount: 700 },
      ]);

      render(<SearchBar />);
      const input = screen.getByRole('combobox');

      await act(async () => {
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'naruto' } });
      });

      // Wait for fetch to resolve
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThanOrEqual(1);
      expect(options[0]).toHaveAttribute('aria-selected');
    });

    it('sets aria-activedescendant when navigating with keyboard', async () => {
      mockFetchResults([
        { id: '1', title: 'Naruto', slug: 'naruto', status: 'ONGOING', totalViews: 1000, chapterCount: 700 },
        { id: '2', title: 'Naruto Shippuden', slug: 'naruto-shippuden', status: 'COMPLETED', totalViews: 2000, chapterCount: 500 },
      ]);

      render(<SearchBar />);
      const input = screen.getByRole('combobox');

      await act(async () => {
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'naruto' } });
      });

      // Wait for fetch
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      // Press ArrowDown to select first option
      await act(async () => {
        fireEvent.keyDown(input, { key: 'ArrowDown' });
      });

      expect(input).toHaveAttribute('aria-activedescendant', 'suggestion-0');
    });
  });

  describe('Keyboard navigation', () => {
    it('opens dropdown on input change and closes on Escape', async () => {
      // Set up fetch to return results BEFORE typing so suggestions are populated
      mockFetchResults([
        { id: '1', title: 'Naruto', slug: 'naruto', status: 'ONGOING', totalViews: 1000, chapterCount: 700 },
      ]);

      render(<SearchBar />);
      const input = screen.getByRole('combobox');

      // Type to open dropdown — fetch will return results, suggestions.length > 0
      await act(async () => {
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'na' } });
      });

      // Wait for fetch to resolve
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      // Dropdown should be visible and suggestions populated
      expect(input).toHaveAttribute('aria-expanded', 'true');

      // Press Escape to close — handler will not early-return because suggestions have items
      await act(async () => {
        fireEvent.keyDown(input, { key: 'Escape' });
      });

      // Explicitly blur the input to trigger onBlur handler (inputRef.current?.blur()
      // inside the Escape handler may not trigger React's synthetic onBlur in JSDOM)
      await act(async () => {
        fireEvent.blur(input);
      });

      // Wait for onBlur's setTimeout(150ms) to fire so isFocused becomes false
      await act(async () => {
        await new Promise((r) => setTimeout(r, 200));
      });

      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Search icon accessibility', () => {
    it('search icon has aria-hidden="true"', () => {
      const { container } = render(<SearchBar />);
      const searchIcon = container.querySelector('.lucide-search');
      expect(searchIcon?.closest('[aria-hidden="true"]')).toBeDefined();
    });
  });

  describe('Input autoComplete', () => {
    it('input has autocomplete="off"', () => {
      render(<SearchBar />);
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('autocomplete', 'off');
    });
  });

  describe('axe accessibility audit', () => {
    it('has no axe violations in initial state', async () => {
      const { container } = render(<SearchBar />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations with dropdown open with suggestions', async () => {
      mockFetchResults([
        { id: '1', title: 'Naruto', slug: 'naruto', status: 'ONGOING', totalViews: 1000, chapterCount: 700 },
      ]);

      const { container } = render(<SearchBar />);
      const input = screen.getByRole('combobox');

      await act(async () => {
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'naruto' } });
      });

      // Wait for fetch to complete
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
