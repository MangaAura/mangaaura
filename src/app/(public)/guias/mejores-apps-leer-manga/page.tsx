import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/Layout/Container';
import { FAQPageStructuredData, BreadcrumbStructuredData } from '@/components/SEO/StructuredData';

export const metadata: Metadata = {
  title: 'Mejores aplicaciones para leer manga digitalmente | 2026',
  description: 'Comparativa de las mejores apps para leer manga en Android, iOS y PC. Tachiyomi, Manga Plus, Shonen Jump, MangaAura y más.',
  openGraph: {
    title: 'Mejores aplicaciones para leer manga digitalmente | 2026',
    description: 'Las mejores apps para leer manga en tu móvil, tablet u ordenador. Guía completa con lectores CBR/CBZ y plataformas oficiales.',
    type: 'article',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/guias/mejores-apps-leer-manga' },
};

const faqItems = [
  {
    question: '¿Cuáles son las mejores aplicaciones para leer manga digitalmente?',
    answer: 'Las mejores aplicaciones incluyen: Manga Plus by Shueisha (gratis, oficial), Shonen Jump (2.99€/mes), MangaAura (comunidad y creadores), Tachiyomi/Mihon (lector de múltiples fuentes), Webtoon (webcomics), ComiXology (tienda Amazon) y Perfect Viewer (lector CBR/CBZ local). La mejor elección depende de si prefieres contenido oficial gratuito, suscripción o leer tus propios archivos.',
  },
  {
    question: '¿Qué app recomiendas para leer manga en Android?',
    answer: 'Para Android destacan: Manga Plus (gratis, oficial), Tachiyomi/Mihon (código abierto, multicuente), Kotatsu (interfaz moderna), Webtoon (webcomics) y MangaAura (contenido original). Para archivos CBR/CBZ, Perfect Viewer y ComicRack son excelentes opciones.',
  },
  {
    question: '¿Hay aplicaciones para leer manga en iOS?',
    answer: 'Sí. En iOS las mejores opciones son: Manga Plus, Shonen Jump, Webtoon, ComiXology, MangaAura (vía web), y Panel (lector CBR/CBZ). Apple Books también permite leer mangas comprados en formato EPUB.',
  },
  {
    question: '¿Qué es Tachiyomi y por qué es tan popular?',
    answer: 'Tachiyomi es un lector de manga de código abierto para Android que permite agregar múltiples fuentes (repositorios) para buscar y leer manga. Es popular por su personalización, soporte de descargas offline, y actualizaciones automáticas. Su sucesor moderno es Mihon.',
  },
  {
    question: '¿Puedo leer manga offline en estas aplicaciones?',
    answer: 'Sí. Manga Plus permite descargar capítulos para lectura offline. MangaAura también ofrece funcionalidad offline. Tachiyomi/Mihon permite descargar de múltiples fuentes. ComiXology y Kindle permiten descargar mangas comprados.',
  },
];

export default function MejoresAppsPage() {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: 'Guías', item: '/guias' },
          { name: 'Mejores apps para leer manga', item: '/guias/mejores-apps-leer-manga' },
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
          <h1 className="text-4xl font-bold mb-4">Mejores aplicaciones para leer manga digitalmente</h1>
          <p className="text-lg text-fg-secondary mb-8">
            Tanto si eres nuevo en el mundo del manga como si ya eres un lector veterano, tener la aplicación
            adecuada marca la diferencia. Esta guía compara las mejores apps para Android, iOS y PC.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Plataformas oficiales</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-3 text-left">App</th>
                  <th className="border border-border p-3 text-left">Precio</th>
                  <th className="border border-border p-3 text-left">Catálogo</th>
                  <th className="border border-border p-3 text-left">Offline</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border p-3 font-semibold">Manga Plus</td>
                  <td className="border border-border p-3">Gratis</td>
                  <td className="border border-border p-3">Shueisha (One Piece, Jujutsu Kaisen...)</td>
                  <td className="border border-border p-3">Sí</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-semibold">Shonen Jump</td>
                  <td className="border border-border p-3">2.99€/mes</td>
                  <td className="border border-border p-3">15,000+ capítulos VIZ</td>
                  <td className="border border-border p-3">Sí</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-semibold">MangaAura</td>
                  <td className="border border-border p-3">Gratis + Premium</td>
                  <td className="border border-border p-3">Contenido original + IA</td>
                  <td className="border border-border p-3">Sí</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-semibold">Webtoon</td>
                  <td className="border border-border p-3">Gratis</td>
                  <td className="border border-border p-3">100M+ usuarios, webcomics</td>
                  <td className="border border-border p-3">Sí</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-semibold">ComiXology</td>
                  <td className="border border-border p-3">Por título</td>
                  <td className="border border-border p-3">Amazon, miles de títulos</td>
                  <td className="border border-border p-3">Sí</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Lectores de archivos (CBR/CBZ)</h2>
          <div className="space-y-4">
            <div className="border border-border rounded-xl p-5">
              <h3 className="text-xl font-bold">Mihon (sucesor de Tachiyomi)</h3>
              <p className="text-fg-secondary mt-1">Código abierto, multiplataforma de fuentes. Ideal para usuarios avanzados que quieren control total sobre su experiencia de lectura. Soporta extensiones para cientos de fuentes.</p>
            </div>
            <div className="border border-border rounded-xl p-5">
              <h3 className="text-xl font-bold">Perfect Viewer</h3>
              <p className="text-fg-secondary mt-1">El mejor lector de CBR/CBZ para Android. Rápido, ligero y con soporte para códecs personalizados.</p>
            </div>
            <div className="border border-border rounded-xl p-5">
              <h3 className="text-xl font-bold">YACReader</h3>
              <p className="text-fg-secondary mt-1">Lector multiplataforma (Windows, Mac, Linux, iOS). Interfaz limpia y potente gestión de biblioteca.</p>
            </div>
          </div>

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

          <div className="mt-8 text-center">
            <Link href="/explore" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
              Explora mangas en MangaAura
            </Link>
          </div>
        </article>
      </Container>
    </>
  );
}
