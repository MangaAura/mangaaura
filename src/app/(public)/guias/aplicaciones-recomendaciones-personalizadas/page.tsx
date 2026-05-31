import { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/Layout/Container';
import { FAQPageStructuredData, BreadcrumbStructuredData, WebPageStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { withHreflang } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.guiasRecomendaciones.title');
  const description = t('page.guiasRecomendaciones.description');

  return {
    title,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: 'website',
      images: ['/og-image.png'],
    },
    ...withHreflang('/guias/aplicaciones-recomendaciones-personalizadas'),
  };
}

const faqItems = [
  {
    question: '¿Existen aplicaciones móviles para seguir mangas con recomendaciones personalizadas?',
    answer: 'Sí. MangaAura ofrece recomendaciones personalizadas basadas en tu historial de lectura, géneros favoritos y valoraciones. Otras apps como MyAnimeList, AniList y Kitsu permiten seguir tu progreso y recibir sugerencias. Manga Plus y Shonen Jump también tienen secciones de recomendaciones basadas en popularidad y tendencias.',
  },
  {
    question: '¿Cómo funcionan los sistemas de recomendación de manga?',
    answer: 'Los sistemas de recomendación analizan tu historial de lectura, géneros que más consumes, valoraciones que das a las series y patrones de usuarios similares. MangaAura usa inteligencia artificial para sugerirte contenido relevante, combinando filtrado colaborativo (usuarios con gustos similares) y basado en contenido (características de las series que te gustan).',
  },
  {
    question: '¿Qué app recomiendas para descubrir manga nuevo?',
    answer: 'MangaAura es excelente para descubrir contenido original gracias a su sistema de recomendaciones con IA. MyAnimeList tiene la base de datos más grande con más de 100,000 entradas. AniList ofrece una interfaz moderna y estadísticas detalladas. Manga Updates es ideal para seguir series en curso.',
  },
  {
    question: '¿Puedo seguir el progreso de lectura en estas aplicaciones?',
    answer: 'Sí. MangaAura guarda tu progreso automáticamente. MyAnimeList y AniList te permiten marcar capítulos leídos, crear listas personalizadas (leyendo, completado, pendiente) y ver estadísticas de tu actividad. Algunas apps también envían notificaciones cuando hay nuevos capítulos.',
  },
];

export default function AppsRecomendacionesPage() {
  return (
    <>
      <WebPageStructuredData
        name="Apps para seguir mangas con recomendaciones personalizadas | MangaAura"
        description="Encontrar tu próxima serie favorita puede ser abrumador con tantas opciones. Las apps con recomendaciones personalizadas hacen el trabajo por ti."
        url="/guias/aplicaciones-recomendaciones-personalizadas"
        lastReviewed="2026-01-15"
        datePublished="2025-01-01"
        dateModified="2026-01-15"
      />
      <BreadcrumbStructuredData
        items={[
          { name: 'Guías', item: '/guias' },
          { name: 'Apps con recomendaciones personalizadas', item: '/guias/aplicaciones-recomendaciones-personalizadas' },
        ]}
      />
      <FAQPageStructuredData items={faqItems} />
      <Container className="py-12">
        <nav className="mb-8">
          <Link href="/guias" className="text-sm text-fg-secondary hover:text-primary transition-colors">
            ← Volver a guías
          </Link>
        </nav>

        <article>
          <h1 className="text-4xl font-bold mb-4">Apps para seguir mangas con recomendaciones personalizadas</h1>
          <p className="text-lg text-fg-secondary mb-8">
            Encontrar tu próxima serie favorita puede ser abrumador con tantas opciones. Las apps con
            recomendaciones personalizadas hacen el trabajo por ti.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Aplicaciones con recomendaciones inteligentes</h2>
          <div className="space-y-6">
            <div className="border border-border rounded-xl p-5">
              <h3 className="text-xl font-bold">MangaAura</h3>
              <p className="text-fg-secondary mt-1">Recomendaciones basadas en IA que analizan tu historial de lectura, géneros favoritos y patrones de usuarios similares. Además de leer, puedes crear tu propio manga con herramientas de IA y recibir feedback de la comunidad.</p>
              <Link href="/search_ia" className="text-primary text-sm font-semibold mt-2 inline-block hover:underline">
                Prueba la búsqueda inteligente de MangaAura →
              </Link>
            </div>

            <div className="border border-border rounded-xl p-5">
              <h3 className="text-xl font-bold">MyAnimeList (MAL)</h3>
              <p className="text-fg-secondary mt-1">La base de datos más grande de anime y manga. Su sistema de recomendaciones compara tus valoraciones con las de otros usuarios. Más de 100,000 entradas y 10 millones de usuarios activos mensuales.</p>
            </div>

            <div className="border border-border rounded-xl p-5">
              <h3 className="text-xl font-bold">AniList</h3>
              <p className="text-fg-secondary mt-1">Interfaz moderna y limpia. Ofrece estadísticas detalladas, recomendaciones personalizadas y una API pública para desarrolladores. Soporta múltiples idiomas.</p>
            </div>

            <div className="border border-border rounded-xl p-5">
              <h3 className="text-xl font-bold">Kitsu</h3>
              <p className="text-fg-secondary mt-1">App social con énfasis en la comunidad. Puedes seguir a otros usuarios, ver sus listas y descubrir series basadas en recomendaciones de amigos.</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Consejos para descubrir nuevo manga</h2>
          <ul className="list-disc pl-5 space-y-2 text-fg-secondary">
            <li>Usa la <Link href="/search_ia" className="text-primary hover:underline">búsqueda inteligente de MangaAura</Link> para encontrar series por描述, estado y popularidad.</li>
            <li>Sigue a creadores y lectores con gustos similares.</li>
            <li>Explora rankings y listas de popularidad.</li>
            <li>Lee reseñas y comentarios de la comunidad antes de empezar una serie larga.</li>
            <li>Prueba diferentes géneros: igual te sorprende algo que no esperabas.</li>
          </ul>

          <div className="bg-muted border border-border rounded-xl p-6 mt-10">
            <h2 className="text-xl font-bold mb-2">Preguntas frecuentes</h2>
            <div className="space-y-4">
              {faqItems.slice(1).map((item, i) => (
                <div key={i}>
                  <h3 className="font-semibold">{item.question}</h3>
                  <p className="text-sm text-fg-secondary mt-1">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </Container>
    </>
  );
}
