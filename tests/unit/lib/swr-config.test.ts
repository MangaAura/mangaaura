import { describe, it, expect } from 'vitest';

import { getPaginatedKey } from '@/lib/swr-config';

describe('SWR Config - getPaginatedKey', () => {
  it('generates key with page parameter', () => {
    const key = getPaginatedKey('/api/manga', 1);
    expect(key).toBe('/api/manga?page=1');
  });

  it('generates key with page and filters', () => {
    const key = getPaginatedKey('/api/library', 2, {
      status: 'READING',
      sort: 'updatedAt',
    });
    expect(key).toContain('page=2');
    expect(key).toContain('status=READING');
    expect(key).toContain('sort=updatedAt');
  });

  it('excludes undefined filter values', () => {
    const key = getPaginatedKey('/api/search', 1, {
      q: 'naruto',
      genre: undefined,
    });
    expect(key).toBe('/api/search?page=1&q=naruto');
  });

  it('excludes empty string filter values', () => {
    const key = getPaginatedKey('/api/search', 1, {
      q: 'one piece',
      genre: '',
    });
    expect(key).toBe('/api/search?page=1&q=one+piece');
  });

  it('handles no filters', () => {
    const key = getPaginatedKey('/api/feed', 1);
    expect(key).toBe('/api/feed?page=1');
  });
});
