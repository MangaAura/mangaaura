import { BookOpen, Sparkles, Trophy, Users } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import { WelcomeContent } from './WelcomeContent';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { auth } from '@/lib/auth';
import { withHreflang } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.welcome.title');
  const description = t('page.welcome.description');

  return {
    title,
    description,
    robots: { index: false, follow: false },
    ...withHreflang('/welcome'),
  };
}

const steps = [
  {
    icon: BookOpen,
    title: 'Explora mangas',
    description: 'Descubre miles de mangas, manhwas y webtoons. Navega por géneros, rankings y novedades.',
    href: '/explore',
    cta: 'Explorar mangas',
  },
  {
    icon: Trophy,
    title: 'Gana recompensas',
    description: 'Completa misiones, mantén rachas de lectura y sube de nivel. Desbloquea logros y gana Aura.',
    href: '/quests',
    cta: 'Ver misiones',
  },
  {
    icon: Users,
    title: 'Únete a la comunidad',
    description: 'Participa en foros, crea o únete a clanes, comenta y comparte tus mangas favoritos.',
    href: '/community',
    cta: 'Ir a la comunidad',
  },
  {
    icon: Sparkles,
    title: 'Crea con IA',
    description: 'Usa nuestras herramientas de IA para generar mangas, personajes y escenarios. Publica y monetiza tu obra.',
    href: '/creator/manga/new',
    cta: 'Crear manga',
  },
];

export default async function WelcomePage() {
  const session = await auth();

  return (
    <main id="main-content" className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-8">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {session?.user?.name
            ? `¡Bienvenido, ${session.user.name}!`
            : '¡Bienvenido a MangaAura!'}
        </h1>
        <p className="text-lg text-fg-secondary mb-12 max-w-xl mx-auto">
          Tu plataforma para leer, crear y crowdfundear manga con inteligencia artificial.
          Aquí tienes algunos lugares por donde empezar:
        </p>

        <WelcomeContent steps={steps} />

        {!session && (
          <div className="mt-12 pt-12 border-t border-border">
            <p className="text-fg-secondary mb-4">
              ¿Ya tienes cuenta o quieres unirte?
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/auth/login"
                className="inline-flex items-center px-6 py-3 rounded-full bg-[var(--primary)] dark:bg-[var(--primary-hover)] text-primary-fg font-medium hover:opacity-90 transition-opacity"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center px-6 py-3 rounded-full border border-border font-medium hover:bg-surface-secondary transition-colors"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
