/**
 * Shared utilities for OG image badge generation.
 * Extracted from the achievements OG route for testability and reuse.
 */

/** Rarity tier → color configuration for badge rendering */
export const RARITY_COLORS: Record<string, { gradient: string; glow: string; label: string }> = {
  EASY: { gradient: '#22c55e', glow: 'rgba(34,197,94,0.3)', label: 'Común' },
  MEDIUM: { gradient: '#3b82f6', glow: 'rgba(59,130,246,0.3)', label: 'Raro' },
  HARD: { gradient: '#8b5cf6', glow: 'rgba(139,92,246,0.3)', label: 'Épico' },
  LEGENDARY: { gradient: '#f59e0b', glow: 'rgba(245,158,11,0.4)', label: 'Legendario' },
};

/** Maps badge ID substrings to emoji icons for OG image rendering */
const BADGE_ICON_MAP: Record<string, string> = {
  // Streak badges — flame
  racha: '🔥',
  // Quest badges — target
  misionero: '🎯',
  // Reading badges — book
  lector: '📖',
  capitulos: '📚',
  // Social badges
  social: '💬',
  comentarios: '💬',
  // Creator badges
  creador: '✨',
  mangas: '🖋️',
  // Milestone badges
  nivel: '👑',
  xp: '⚡',
};

/** Default icon when no pattern matches */
const DEFAULT_ICON = '🏆';

/**
 * Looks up the emoji icon for a given badge ID by matching against known substrings.
 * Returns the default trophy icon if no pattern matches.
 */
export function getBadgeIcon(badgeId: string): string {
  const normalized = badgeId.toLowerCase();
  for (const [key, val] of Object.entries(BADGE_ICON_MAP)) {
    if (normalized.includes(key)) {
      return val;
    }
  }
  return DEFAULT_ICON;
}

/**
 * Generates an inline SVG string for a badge, suitable for embedding in
 * `@vercel/og` ImageResponse (Satori) data URIs.
 *
 * @param badgeId  — The achievement's badge identifier (e.g. "racha-7", "misionero-leyenda")
 * @param rarity   — One of EASY | MEDIUM | HARD | LEGENDARY
 * @returns A complete, self-contained `<svg>…</svg>` string
 */
export function getBadgeSvg(badgeId: string, rarity: string): string {
  const normalizedRarity = rarity.toUpperCase();
  const color = RARITY_COLORS[normalizedRarity]?.gradient || '#6366f1';
  const glowColor = RARITY_COLORS[normalizedRarity]?.glow || 'rgba(99,102,241,0.3)';
  const icon = getBadgeIcon(badgeId);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
    <defs>
      <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="80" cy="80" r="76" fill="#0f172a" stroke="${color}" stroke-width="3"/>
    <circle cx="80" cy="80" r="72" fill="none" stroke="${glowColor}" stroke-width="6" opacity="0.3"/>
    <circle cx="80" cy="80" r="60" fill="url(#bgGlow)"/>
    <text x="80" y="95" text-anchor="middle" font-size="52" font-family="system-ui">${icon}</text>
  </svg>`;
}
