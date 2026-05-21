'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { GENRE_CATEGORIES } from '@/constants/genres';
import { useT } from '@/i18n';

const CARD_FULL = 132 + 12;

function GenreCard({
  genre,
  hidden = false,
}: {
  genre: (typeof GENRE_CATEGORIES)[number];
  hidden?: boolean;
}) {
  const t = useT();
  const Icon = genre.icon;
  return (
    <Link
      href={`/explore?genres[]=${genre.tag}&sort=popularity`}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden || undefined}
      className={`flex-shrink-0 w-[132px] snap-start flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 active:scale-100 active:translate-y-0 ${genre.color}`}
      aria-label={t(`genres.${genre.labelKey}`)}
    >
      <Icon className="w-6 h-6" />
      <span className="text-sm font-bold text-center leading-tight">
        {t(`genres.${genre.labelKey}`)}
      </span>
    </Link>
  );
}

export function GenreMarquee() {
  const t = useT();
  const prefersReducedMotion = useReducedMotion();
  const prefersReducedMotionRef = useRef(prefersReducedMotion);
  prefersReducedMotionRef.current = prefersReducedMotion;

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

  const allItems = [...GENRE_CATEGORIES, ...GENRE_CATEGORIES];
  const halfWidth = GENRE_CATEGORIES.length * CARD_FULL;

  // Bucle de animación con dependencias vacías — nunca se reinicia
  useEffect(() => {
    if (prefersReducedMotionRef.current) return;

    const tick = () => {
      const prm = prefersReducedMotionRef.current;
      if (prm) return;

      if (isDecelerating.current) {
        const v = velocity.current;
        if (Math.abs(v) < 0.5) {
          isDecelerating.current = false;
          isDragging.current = false;
          velocity.current = 0;
        } else {
          let next = trackX.current + v;
          velocity.current *= 0.95;

          while (next <= -halfWidth) next += halfWidth;
          while (next > 0) next -= halfWidth;

          trackX.current = next;
          trackRef.current?.style.setProperty('transform', `translateX(${next}px)`);
        }
      } else if (!isDragging.current && !isHovering.current) {
        let next = trackX.current - 0.3;
        if (next <= -halfWidth) next += halfWidth;
        trackX.current = next;
        trackRef.current?.style.setProperty('transform', `translateX(${next}px)`);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
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
    let next = trackX.current + dxFromLast;
    while (next <= -halfWidth) next += halfWidth;
    while (next > 0) next -= halfWidth;
    trackX.current = next;
    trackRef.current?.style.setProperty('transform', `translateX(${next}px)`);
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
    <section className="relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-accent-blue to-accent-purple inline-block" />
          {t('home.exploreByGenre')}
        </h2>
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
        >
          {allItems.map((genre, i) => (
            <GenreCard
              key={`${genre.slug}-${i}`}
              genre={genre}
              hidden={i >= GENRE_CATEGORIES.length}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
