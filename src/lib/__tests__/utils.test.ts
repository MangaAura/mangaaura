import { describe, it, expect } from 'vitest';
import {
  cn,
  formatNumber,
  formatDate,
  formatTimeAgo,
  getRankColor,
  getRankBgColor,
} from '@/lib/utils';

describe('cn (className utility)', () => {
  it('merges tailwind classes correctly', () => {
    const result = cn('px-4 py-2', 'bg-blue-500');
    expect(result).toBe('px-4 py-2 bg-blue-500');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });

  it('removes falsy values', () => {
    const result = cn('class-1', false && 'class-2', null, undefined, 'class-3');
    expect(result).toBe('class-1 class-3');
  });

  it('handles arrays of classes', () => {
    const result = cn(['class-1', 'class-2'], 'class-3');
    expect(result).toBe('class-1 class-2 class-3');
  });

  it('deduplicates conflicting tailwind classes', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).not.toContain('px-2');
  });
});

describe('formatNumber', () => {
  it('formats numbers less than 1000 as is', () => {
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(1)).toBe('1');
  });

  it('formats thousands with K suffix', () => {
    expect(formatNumber(1000)).toBe('1.0K');
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(999999)).toBe('1000.0K');
  });

  it('formats millions with M suffix', () => {
    expect(formatNumber(1000000)).toBe('1.0M');
    expect(formatNumber(2500000)).toBe('2.5M');
    expect(formatNumber(100000000)).toBe('100.0M');
  });
});

describe('formatDate', () => {
  it('formats Date object to Spanish locale', () => {
    const date = new Date('2024-03-15');
    const result = formatDate(date);
    expect(result).toContain('marzo');
    expect(result).toContain('2024');
    expect(result).toContain('15');
  });

  it('formats date string', () => {
    const result = formatDate('2024-12-25');
    expect(result).toContain('diciembre');
    expect(result).toContain('2024');
    expect(result).toContain('25');
  });

  it('handles different date formats', () => {
    const result1 = formatDate('2024-01-01T00:00:00Z');
    const result2 = formatDate('2024/01/01');
    expect(result1).toContain('enero');
    expect(result2).toContain('enero');
  });
});

describe('formatTimeAgo', () => {
  it('returns "hace un momento" for very recent times', () => {
    const now = new Date();
    const result = formatTimeAgo(now);
    expect(result).toBe('hace un momento');
  });

  it('returns minutes for recent times', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = formatTimeAgo(fiveMinutesAgo);
    expect(result).toBe('hace 5m');
  });

  it('returns hours for times within 24 hours', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const result = formatTimeAgo(threeHoursAgo);
    expect(result).toBe('hace 3h');
  });

  it('returns days for times within 30 days', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const result = formatTimeAgo(fiveDaysAgo);
    expect(result).toBe('hace 5d');
  });

  it('returns formatted date for older times', () => {
    const oldDate = new Date('2023-01-01');
    const result = formatTimeAgo(oldDate);
    expect(result).toContain('enero');
    expect(result).toContain('2023');
  });
});

describe('getRankColor', () => {
  it('returns correct color for novato rank', () => {
    expect(getRankColor('novato')).toBe('text-[var(--text-tertiary)]');
    expect(getRankColor('Novato')).toBe('text-[var(--text-tertiary)]');
    expect(getRankColor('NOVATO')).toBe('text-[var(--text-tertiary)]');
  });

  it('returns correct color for lector shonen rank', () => {
    expect(getRankColor('lector shonen')).toBe('text-[var(--accent-green)]');
    expect(getRankColor('Lector Shonen')).toBe('text-[var(--accent-green)]');
  });

  it('returns correct color for otaku experto rank', () => {
    expect(getRankColor('otaku experto')).toBe('text-[var(--accent-blue)]');
  });

  it('returns correct color for maestro otaku rank', () => {
    expect(getRankColor('maestro otaku')).toBe('text-[var(--accent-purple)]');
  });

  it('returns correct color for leyenda manga rank', () => {
    expect(getRankColor('leyenda manga')).toBe('text-[var(--warning)]');
  });

  it('returns default color for unknown rank', () => {
    expect(getRankColor('unknown')).toBe('text-[var(--text-tertiary)]');
    expect(getRankColor('')).toBe('text-[var(--text-tertiary)]');
  });
});

describe('getRankBgColor', () => {
  it('returns correct background color for all ranks', () => {
    expect(getRankBgColor('novato')).toBe('bg-[var(--surface-sunken)]');
    expect(getRankBgColor('lector shonen')).toBe('bg-[var(--accent-green)]/10');
    expect(getRankBgColor('otaku experto')).toBe('bg-[var(--accent-blue)]/10');
    expect(getRankBgColor('maestro otaku')).toBe('bg-[var(--accent-purple)]/10');
    expect(getRankBgColor('leyenda manga')).toBe('bg-[var(--warning)]/10');
  });

  it('returns default background for unknown rank', () => {
    expect(getRankBgColor('unknown')).toBe('bg-[var(--surface-sunken)]');
  });
});
