'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Hash, Gauge } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { GENRE_DISPLAY, DEFAULT_GENRE_DISPLAY } from '@/constants/genres';
import { useGenres } from '@/hooks/useGenres';
import { useT } from '@/i18n';

const CARD_FULL = 132 + 12;

interface GenreCardData {
  slug: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function buildGenreCards(genres: Array<{ slug: string; name: string }>): GenreCardData[] {
  return genres.map((g) => {
    const display = GENRE_DISPLAY[g.slug] || DEFAULT_GENRE_DISPLAY;
    return {
      slug: g.slug,
      name: g.name,
      icon: display.icon,
      color: display.color,
    };
  });
}

function GenreCard({
  genre,
  hidden = false,
}: {
  genre: GenreCardData;
  hidden?: boolean;
}) {
  const t = useT();
  const Icon = genre.icon;
  return (
    <Link
      href={`/explore?genres[]=${genre.name}&sort=popularity`}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden || undefined}
      className={`flex-shrink-0 w-[132px] snap-start flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 active:scale-100 active:translate-y-0 ${genre.color}`}
      aria-label={genre.name}
    >
      <Icon className="w-6 h-6" />
      <span className="text-sm font-bold text-center leading-tight">
        {(() => { const label = t(`genres.${genre.slug}`); return label.startsWith('genres.') ? genre.name.charAt(0).toUpperCase() + genre.name.slice(1) : label; })()}
      </span>
    </Link>
  );
}

export function GenreMarquee() {
  const t = useT();
  const { genres, isLoading } = useGenres();
  const prefersReducedMotion = useReducedMotion();
  const prefersReducedMotionRef = useRef(prefersReducedMotion);
  prefersReducedMotionRef.current = prefersReducedMotion;

  const [speed, setSpeed] = useState(() => {
    if (typeof window === 'undefined') return 0.08;
    try {
      const saved = localStorage.getItem('genreMarqueeSpeed');
      if (saved === null) return 0.08;
      const parsed = parseFloat(saved);
      return isNaN(parsed) ? 0.08 : Math.min(0.5, Math.max(0, parsed));
    } catch {
      return 0.08;
    }
  });
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const isHovering = useRef(false);
  const isDragging = useRef(false);
  const isPointerDown = useRef(false);
  const pointerStartX = useRef(0);
  const trackX = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const velocity = useRef(0);
  const lastMoveTime = useRef(0);
  const lastPointerX = useRef(0);
  const isDecelerating = useRef(false);
  const rafRef = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const genreCards = buildGenreCards(genres);
  const allItems = [...genreCards, ...genreCards];
  const halfWidth = genreCards.length * CARD_FULL;
  const halfWidthRef = useRef(halfWidth);
  halfWidthRef.current = halfWidth;

  // Bucle de animación con dependencias vacías — nunca se reinicia
  useEffect(() => {
    if (prefersReducedMotionRef.current) return;

    let isPageActive = document.visibilityState === 'visible' && document.hasFocus();
    let inViewport = true;

    const sync = () => {
      const nowActive = isPageActive && inViewport;
      if (nowActive) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }
    };

    const onVisibility = () => {
      isPageActive = document.visibilityState === 'visible' && document.hasFocus();
      sync();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onVisibility);
    window.addEventListener('focus', onVisibility);

    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewport = entry.isIntersecting;
        sync();
      },
      { rootMargin: '100px' },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);

      const hw = halfWidthRef.current;
      if (hw === 0) return;

      if (!isPageActive || !inViewport) return;

      if (prefersReducedMotionRef.current) return;

      if (isDecelerating.current) {
        const v = velocity.current;
        if (Math.abs(v) < 0.5) {
          isDecelerating.current = false;
          isDragging.current = false;
          velocity.current = 0;
        } else {
          let next = trackX.current + v;
          velocity.current *= 0.95;

          while (next <= -hw) next += hw;
          while (next > 0) next -= hw;

          trackX.current = next;
          trackRef.current?.style.setProperty('transform', `translateX(${next}px)`);
        }
      } else if (!isDragging.current && !isHovering.current) {
        let next = trackX.current - speedRef.current;
        if (next <= -hw) next += hw;
        trackX.current = next;
        trackRef.current?.style.setProperty('transform', `translateX(${next}px)`);
      }
    };

    if (isPageActive && inViewport) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onVisibility);
      window.removeEventListener('focus', onVisibility);
      observer.disconnect();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const preventClick = (e: MouseEvent) => {
      if (isDragging.current) { e.preventDefault(); e.stopPropagation(); }
    };
    const preventDrag = (e: Event) => { e.preventDefault(); };
    el.addEventListener('click', preventClick, true);
    el.addEventListener('dragstart', preventDrag);
    return () => {
      el.removeEventListener('click', preventClick, true);
      el.removeEventListener('dragstart', preventDrag);
    };
  }, []);

  const pointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isPointerDown.current = true;
    isDragging.current = false;
    isDecelerating.current = false;
    velocity.current = 0;
    pointerStartX.current = e.clientX;
    lastPointerX.current = e.clientX;
    lastMoveTime.current = performance.now();
  };

  const pointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown.current) return;

    const now = performance.now();
    const dt = now - lastMoveTime.current;
    const dxFromLast = e.clientX - lastPointerX.current;

    // Track velocity (px per 16.67ms frame)
    if (dt > 0 && dt < 100) {
      velocity.current = (dxFromLast / dt) * 16.67;
    }
    lastPointerX.current = e.clientX;
    lastMoveTime.current = now;

    const dx = e.clientX - pointerStartX.current;
    if (Math.abs(dx) > 5) {
      isDragging.current = true;
    }

    // Movimiento incremental con wrapping para scroll infinito
    const hw = halfWidthRef.current;
    if (hw > 0) {
      let next = trackX.current + dxFromLast;
      while (next <= -hw) next += hw;
      while (next > 0) next -= hw;
      trackX.current = next;
      trackRef.current?.style.setProperty('transform', `translateX(${next}px)`);
    }
  };

  const pointerUp = () => {
    isPointerDown.current = false;

    // Si arrastró con velocidad, iniciar deceleración
    if (isDragging.current && Math.abs(velocity.current) >= 2 && !prefersReducedMotion) {
      isDecelerating.current = true;
      // Click prevention breve (200ms) — la deceleración sigue independientemente
      setTimeout(() => { isDragging.current = false; }, 200);
    } else {
      if (isDragging.current) {
        setTimeout(() => { isDragging.current = false; }, 100);
      }
    }
  };

  return (
    <section ref={sectionRef} className="relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-6"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Hash className="w-6 h-6 text-[var(--primary)]" />
            {t('home.exploreByGenre')}
          </h2>
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border bg-[var(--surface)] transition-all duration-200 hover:border-[var(--border-strong)]">
            <Gauge className="w-3.5 h-3.5 text-[var(--text-tertiary)]" aria-hidden="true" />
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={speed}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setSpeed(v);
                localStorage.setItem('genreMarqueeSpeed', v.toString());
              }}
              aria-label="Velocidad del carrusel"
              className="w-20 h-1 appearance-none cursor-pointer rounded-full bg-[var(--border)] accent-[var(--primary)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
            />
            <span className="tabular-nums text-xs font-medium text-[var(--text-tertiary)] min-w-[2ch] text-right">
              {speed === 0 ? '0' : (speed * 100).toFixed(0)}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="relative overflow-hidden"
      >
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent" />

        <div
          ref={trackRef}
          className="flex gap-3 py-2 cursor-grab active:cursor-grabbing select-none"
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
          onMouseEnter={() => { isHovering.current = true; }}
          onMouseLeave={() => { isHovering.current = false; }}
        >            {allItems.length > 0 ? allItems.map((genre, i) => (
              <GenreCard
                key={`${genre.slug}-${i}`}
                genre={genre}
                hidden={i >= genreCards.length}
              />
            )) : !isLoading && (
              <div className="flex gap-3 py-2 text-sm text-[var(--text-tertiary)]">
                {t('common.noResults')}
              </div>
            )}
        </div>
      </motion.div>
    </section>
  );
}
