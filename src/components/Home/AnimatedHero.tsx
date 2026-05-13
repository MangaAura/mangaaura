'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Play, Compass } from 'lucide-react';

interface AnimatedHeroProps {
  title: string;
  description: string;
  coverUrl: string | null;
  mangaSlug: string;
}

export function AnimatedHero({ title, description, coverUrl, mangaSlug }: AnimatedHeroProps) {
  return (
    <section className="relative w-full min-h-[60vh] md:min-h-[70vh] flex items-center overflow-hidden rounded-2xl">
      {coverUrl ? (
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-primary)] via-[var(--surface-primary)]/80 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-primary)] via-transparent to-transparent z-10" />
          <img
            src={coverUrl}
            alt=""
            className="w-full h-full object-cover rotate-[-2deg] scale-110 hover:scale-100 transition-transform duration-700"
            aria-hidden
          />
        </motion.div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20" />
      )}

      <div className="relative z-20 max-w-3xl px-6 md:px-12 py-16 md:py-24">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-sm uppercase tracking-widest text-[var(--primary)] mb-3 font-medium"
        >
          Destacado
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-[var(--text-primary)] mb-4 leading-tight"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-base md:text-lg text-[var(--text-secondary)] max-w-xl mb-8 leading-relaxed line-clamp-3"
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="flex flex-wrap gap-4"
        >
          <Button className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white px-8 py-3 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all">
            <a href={`/manga/${mangaSlug}`} className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Leer Ahora
            </a>
          </Button>
          <Button variant="outline" className="border-[var(--border)] text-[var(--text-primary)] px-8 py-3 rounded-xl text-base">
            <a href="/browse" className="flex items-center gap-2">
              <Compass className="w-5 h-5" />
              Explorar Mangas
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
