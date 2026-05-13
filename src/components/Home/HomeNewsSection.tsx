'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';

export function HomeNewsSection() {
  const news = [
    {
      category: 'COMUNIDAD',
      title: '¡Arranca la Temporada 3 de Clanes!',
      description: 'Reúne a tu gremio y preparaos para la nueva batalla por InkCoins. Nuevas recompensas añadidas al pozo.',
    },
    {
      category: 'PLATAFORMA',
      title: 'Nuevo Lector Paged Mode',
      description: 'Basado en vuestro feedback, hemos pulido el sistema de lectura por páginas para consumir menos RAM en móviles.',
    },
  ];

  return (
    <section>
      <div className="flex justify-between items-center mb-6 border-b border-custom pb-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Star className="text-[var(--warning)]" /> Noticias de InkVerse
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {news.map((item) => (
          <Link key={item.title} href="/help">
            <div className="bg-secondary border border-custom rounded-xl p-5 hover:border-[var(--primary)] transition-colors cursor-pointer group h-full">
              <div className="bg-[var(--primary-subtle)] text-[var(--primary)] text-xs font-bold inline-block px-2 py-1 rounded mb-3">
                {item.category}
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-fg-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-muted line-clamp-2">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
