import {
  Sword,
  BookOpen,
  Smile,
  Sparkles,
  Skull,
  Wrench,
  Search,
  Heart,
  GraduationCap,
  Rocket,
  Flame,
  Coffee,
  Ghost,
  Monitor,
  Eye,
  Hash,
} from 'lucide-react';

export interface GenreCategory {
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  slug: string;
  tag: string;
  color: string;
}

/**
 * Mapping of genre slugs to their display properties (icon and color).
 * The actual list of genres comes from the database (see /api/genres endpoint),
 * but display info for known genres is defined here since icons/colors
 * are React components that can't be stored in the DB.
 *
 * When adding new genres from the DB that aren't in this map,
 * a default icon (Hash) and color will be used.
 */
export const GENRE_DISPLAY: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  'accion': {
    icon: Sword,
    color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-800 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]',
  },
  'aventura': {
    icon: BookOpen,
    color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-800 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]',
  },
  'ciencia-ficcion': {
    icon: Rocket,
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200 dark:bg-cyan-900 dark:text-cyan-300 dark:border-cyan-800 dark:hover:bg-cyan-800 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]',
  },
  'comedia': {
    icon: Smile,
    color: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-800 dark:hover:bg-orange-800 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]',
  },
  'escolar': {
    icon: GraduationCap,
    color: 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:border-teal-800 dark:hover:bg-teal-800 hover:shadow-[0_0_15px_rgba(20,184,166,0.3)]',
  },
  'fantasia': {
    icon: Sparkles,
    color: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-800 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]',
  },
  'magia': {
    icon: Flame,
    color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-200 dark:bg-fuchsia-900 dark:text-fuchsia-300 dark:border-fuchsia-800 dark:hover:bg-fuchsia-800 hover:shadow-[0_0_15px_rgba(217,70,239,0.3)]',
  },
  'mecha': {
    icon: Wrench,
    color: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 hover:shadow-[0_0_15px_rgba(100,116,139,0.3)]',
  },
  'misterio': {
    icon: Search,
    color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-800 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]',
  },
  'oscuro': {
    icon: Skull,
    color: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 hover:shadow-[0_0_15px_rgba(55,55,55,0.3)]',
  },
  'policiaco': {
    icon: Eye,
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-800 dark:hover:bg-indigo-800 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]',
  },
  'robots': {
    icon: Monitor,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-800 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]',
  },
  'romance': {
    icon: Heart,
    color: 'bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200 dark:bg-pink-900 dark:text-pink-300 dark:border-pink-800 dark:hover:bg-pink-800 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]',
  },
  'slice-of-life': {
    icon: Coffee,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800 dark:hover:bg-yellow-800 hover:shadow-[0_0_15px_rgba(202,138,4,0.3)]',
  },
  'suspenso': {
    icon: Ghost,
    color: 'bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200 dark:bg-violet-900 dark:text-violet-300 dark:border-violet-800 dark:hover:bg-violet-800 hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]',
  },
};

/** Default display for genres not in GENRE_DISPLAY */
export const DEFAULT_GENRE_DISPLAY = {
  icon: Hash,
  color: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 hover:shadow-[0_0_15px_rgba(100,116,139,0.3)]',
};

/** @deprecated Genres are now stored in the database. Use /api/genres or fetch directly. */
export const GENRE_CATEGORIES: GenreCategory[] = Object.entries(GENRE_DISPLAY).map(([slug, display]) => ({
  labelKey: slug,
  icon: display.icon,
  slug,
  tag: slug,
  color: display.color,
}));

export const GENRE_SLUGS = Object.keys(GENRE_DISPLAY);

export const GENRE_SLUG_SET = new Set(GENRE_SLUGS);

export const CANONICAL_TAGS = GENRE_SLUGS;

export const CANONICAL_TAG_SET = new Set(CANONICAL_TAGS);

/**
 * Set of all known genre identifiers — already lowercase and without accents.
 */
export const KNOWN_GENRE_KEYS = new Set([
  ...CANONICAL_TAGS,
  ...CANONICAL_TAGS.map(normalizeGenreKey),
]);

/**
 * Normalize a genre string: lowercase + strip diacritics.
 * Use this before checking KNOWN_GENRE_KEYS so "Fantasía" → "fantasia".
 */
export function normalizeGenreKey(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** @deprecated Use the database genres or the /api/genres endpoint for the authoritative list. */
export const ENGLISH_TO_SLUG: Record<string, string> =
  Object.fromEntries(GENRE_CATEGORIES.map(g => [g.tag, g.slug]));

/** @deprecated Use the database genres or the /api/genres endpoint for the authoritative list. */
export const SLUG_TO_ENGLISH: Record<string, string> =
  Object.fromEntries(GENRE_CATEGORIES.map(g => [g.slug, g.tag]));
