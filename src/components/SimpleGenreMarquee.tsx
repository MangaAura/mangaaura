import Link from 'next/link';
import { GENRE_CATEGORIES } from '@/constants/genres';

export function SimpleGenreMarquee() {
  return (
    <section className="relative">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-accent-blue to-accent-purple inline-block" />
        Explorar por Género
      </h2>
      <div className="relative overflow-hidden">
        <div className="flex gap-3 py-2 overflow-x-auto">
          {GENRE_CATEGORIES.map((genre) => {
            const Icon = genre.icon;
            return (
              <Link
                key={genre.slug}
                href={`/search?genres[]=${genre.slug}&sort=popularity`}
                className={`flex-shrink-0 w-[132px] flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:scale-105 ${genre.color}`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-bold text-center leading-tight capitalize">
                  {genre.slug.replace(/-/g, ' ')}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}