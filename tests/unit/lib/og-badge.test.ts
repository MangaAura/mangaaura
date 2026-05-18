import { describe, it, expect } from 'vitest';
import { getBadgeSvg, getBadgeIcon, RARITY_COLORS } from '@/lib/og-badge';

// ─── Helpers ───────────────────────────────────────────────────────

/** Assert the SVG output contains the expected structural elements */
function expectValidBadgeSvg(svg: string) {
  expect(svg).toContain('<svg');
  expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  expect(svg).toContain('viewBox="0 0 160 160"');
  expect(svg).toContain('<circle');
  expect(svg).toContain('<text');
  expect(svg).toContain('</svg>');
}

// ─── getBadgeIcon: icon mapping ────────────────────────────────────

describe('getBadgeIcon', () => {
  describe('racha (streak) badges', () => {
    it('maps "racha-7" to 🔥', () => {
      expect(getBadgeIcon('racha-7')).toBe('🔥');
    });

    it('maps "racha-30" to 🔥', () => {
      expect(getBadgeIcon('racha-30')).toBe('🔥');
    });

    it('maps "racha-100" to 🔥', () => {
      expect(getBadgeIcon('racha-100')).toBe('🔥');
    });

    it('maps bare "racha" to 🔥', () => {
      expect(getBadgeIcon('racha')).toBe('🔥');
    });

    it('is case-insensitive: "RACHA-7" → 🔥', () => {
      expect(getBadgeIcon('RACHA-7')).toBe('🔥');
    });
  });

  describe('misionero (quest) badges', () => {
    it('maps "misionero-novato" to 🎯', () => {
      expect(getBadgeIcon('misionero-novato')).toBe('🎯');
    });

    it('maps "misionero-leyenda" to 🎯', () => {
      expect(getBadgeIcon('misionero-leyenda')).toBe('🎯');
    });
  });

  describe('lector (reading) badges', () => {
    it('maps "lector-inicial" to 📖', () => {
      expect(getBadgeIcon('lector-inicial')).toBe('📖');
    });

    it('maps "lector-voraz" to 📖', () => {
      expect(getBadgeIcon('lector-voraz')).toBe('📖');
    });
  });

  describe('capitulos badges', () => {
    it('maps "capitulos-10" to 📚', () => {
      expect(getBadgeIcon('capitulos-10')).toBe('📚');
    });

    it('maps "capitulos-100" to 📚', () => {
      expect(getBadgeIcon('capitulos-100')).toBe('📚');
    });
  });

  describe('social badges', () => {
    it('maps "social-amigo" to 💬', () => {
      expect(getBadgeIcon('social-amigo')).toBe('💬');
    });

    it('maps "comentarios-50" to 💬', () => {
      expect(getBadgeIcon('comentarios-50')).toBe('💬');
    });
  });

  describe('creador (creator) badges', () => {
    it('maps "creador-principiante" to ✨', () => {
      expect(getBadgeIcon('creador-principiante')).toBe('✨');
    });

    it('maps "mangas-3" to 🖋️', () => {
      expect(getBadgeIcon('mangas-3')).toBe('🖋️');
    });
  });

  describe('milestone badges', () => {
    it('maps "nivel-10" to 👑', () => {
      expect(getBadgeIcon('nivel-10')).toBe('👑');
    });

    it('maps "xp-1000" to ⚡', () => {
      expect(getBadgeIcon('xp-1000')).toBe('⚡');
    });
  });

  describe('unknown / edge-case badge IDs', () => {
    it('returns 🏆 for completely unknown badge ID', () => {
      expect(getBadgeIcon('desconocido-total')).toBe('🏆');
    });

    it('returns 🏆 for empty string', () => {
      expect(getBadgeIcon('')).toBe('🏆');
    });

    it('returns 🏆 for gibberish', () => {
      expect(getBadgeIcon('xyz-123-abc')).toBe('🏆');
    });
  });

  describe('match priority (first match wins)', () => {
    it('"racha-comentarios" matches 🔥 not 💬 (racha checked first)', () => {
      // "racha" appears first in the map, so it should win
      expect(getBadgeIcon('racha-comentarios')).toBe('🔥');
    });
  });
});

// ─── getBadgeSvg: SVG generation ───────────────────────────────────

describe('getBadgeSvg', () => {
  describe('SVG structural integrity', () => {
    it('produces a valid SVG string with all structural elements', () => {
      const svg = getBadgeSvg('racha-7', 'EASY');
      expectValidBadgeSvg(svg);
    });

    it('includes the icon as text content', () => {
      const svg = getBadgeSvg('racha-7', 'EASY');
      expect(svg).toContain('🔥');
    });

    it('includes the default icon for unknown badge', () => {
      const svg = getBadgeSvg('unknown-badge', 'MEDIUM');
      expect(svg).toContain('🏆');
      expectValidBadgeSvg(svg);
    });
  });

  describe('rarity color injection', () => {
    it('EASY → green gradient (#22c55e)', () => {
      const svg = getBadgeSvg('racha-7', 'EASY');
      expect(svg).toContain('#22c55e');
    });

    it('MEDIUM → blue gradient (#3b82f6)', () => {
      const svg = getBadgeSvg('racha-7', 'MEDIUM');
      expect(svg).toContain('#3b82f6');
    });

    it('HARD → purple gradient (#8b5cf6)', () => {
      const svg = getBadgeSvg('racha-7', 'HARD');
      expect(svg).toContain('#8b5cf6');
    });

    it('LEGENDARY → amber gradient (#f59e0b)', () => {
      const svg = getBadgeSvg('racha-7', 'LEGENDARY');
      expect(svg).toContain('#f59e0b');
    });

    it('unknown rarity → fallback indigo (#6366f1)', () => {
      const svg = getBadgeSvg('racha-7', 'NONEXISTENT');
      expect(svg).toContain('#6366f1');
    });
  });

  describe('rarity glow injection', () => {
    it('EASY → green glow', () => {
      const svg = getBadgeSvg('racha-7', 'EASY');
      expect(svg).toContain('rgba(34,197,94,0.3)');
    });

    it('LEGENDARY → amber glow with higher opacity', () => {
      const svg = getBadgeSvg('racha-7', 'LEGENDARY');
      expect(svg).toContain('rgba(245,158,11,0.4)');
    });

    it('unknown rarity → indigo fallback glow', () => {
      const svg = getBadgeSvg('racha-7', 'INVALID');
      expect(svg).toContain('rgba(99,102,241,0.3)');
    });
  });

  describe('case-insensitive rarity', () => {
    it('"easy" (lowercase) works', () => {
      const svg = getBadgeSvg('racha-7', 'easy');
      expect(svg).toContain('#22c55e');
    });

    it('"legendary" (lowercase) works', () => {
      const svg = getBadgeSvg('racha-7', 'legendary');
      expect(svg).toContain('#f59e0b');
    });
  });

  describe('radial gradient defs', () => {
    it('includes radialGradient with id "bgGlow"', () => {
      const svg = getBadgeSvg('racha-7', 'EASY');
      expect(svg).toContain('<radialGradient id="bgGlow"');
    });

    it('references the gradient via url(#bgGlow)', () => {
      const svg = getBadgeSvg('racha-7', 'EASY');
      expect(svg).toContain('url(#bgGlow)');
    });
  });

  describe('all badge ID pattern combinations across rarities', () => {
    const badgeIds = [
      'racha-7',
      'racha-30',
      'misionero-novato',
      'misionero-leyenda',
      'lector-inicial',
      'lector-voraz',
      'capitulos-10',
      'capitulos-100',
      'social-amigo',
      'comentarios-50',
      'creador-principiante',
      'mangas-3',
      'nivel-10',
      'xp-1000',
    ];
    const rarities = ['EASY', 'MEDIUM', 'HARD', 'LEGENDARY'];

    for (const badgeId of badgeIds) {
      for (const rarity of rarities) {
        it(`${badgeId} + ${rarity} → valid SVG with correct elements`, () => {
          const svg = getBadgeSvg(badgeId, rarity);
          expectValidBadgeSvg(svg);
          // Should contain the rarity-specific color
          const expectedColor = RARITY_COLORS[rarity]?.gradient;
          expect(svg).toContain(expectedColor);
        });
      }
    }
  });

  describe('edge cases', () => {
    it('empty badgeId generates valid SVG with default icon', () => {
      const svg = getBadgeSvg('', 'EASY');
      expectValidBadgeSvg(svg);
      expect(svg).toContain('🏆');
    });

    it('empty rarity falls back to indigo', () => {
      const svg = getBadgeSvg('racha-7', '');
      expect(svg).toContain('#6366f1');
    });

    it('very long badgeId still works', () => {
      const svg = getBadgeSvg('racha-'.repeat(50), 'HARD');
      expectValidBadgeSvg(svg);
      expect(svg).toContain('🔥'); // contains "racha"
    });

    it('badgeId with special characters still finds match', () => {
      const svg = getBadgeSvg('!!!racha@@@', 'EASY');
      expect(svg).toContain('🔥');
    });

    it('produces deterministic output for same inputs', () => {
      const svg1 = getBadgeSvg('racha-7', 'HARD');
      const svg2 = getBadgeSvg('racha-7', 'HARD');
      expect(svg1).toBe(svg2);
    });

    it('SVG is self-contained (no external references besides data)', () => {
      const svg = getBadgeSvg('racha-7', 'EASY');
      expect(svg).not.toContain('href=');
      expect(svg).not.toContain('xlink:href');
    });
  });
});

// ─── RARITY_COLORS: static data ────────────────────────────────────

describe('RARITY_COLORS', () => {
  it('defines all four standard rarities', () => {
    expect(Object.keys(RARITY_COLORS)).toHaveLength(4);
    expect(RARITY_COLORS).toHaveProperty('EASY');
    expect(RARITY_COLORS).toHaveProperty('MEDIUM');
    expect(RARITY_COLORS).toHaveProperty('HARD');
    expect(RARITY_COLORS).toHaveProperty('LEGENDARY');
  });

  it('each rarity has gradient, glow, and label', () => {
    for (const rarity of Object.values(RARITY_COLORS)) {
      expect(rarity).toHaveProperty('gradient');
      expect(rarity).toHaveProperty('glow');
      expect(rarity).toHaveProperty('label');
      expect(typeof rarity.gradient).toBe('string');
      expect(typeof rarity.glow).toBe('string');
      expect(typeof rarity.label).toBe('string');
      expect(rarity.gradient).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('EASY has predictable values', () => {
    expect(RARITY_COLORS.EASY).toEqual({
      gradient: '#22c55e',
      glow: 'rgba(34,197,94,0.3)',
      label: 'Común',
    });
  });

  it('LEGENDARY has distinct glow opacity', () => {
    expect(RARITY_COLORS.LEGENDARY.glow).toBe('rgba(245,158,11,0.4)');
  });
});
