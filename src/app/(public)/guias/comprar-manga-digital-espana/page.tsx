import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
import Link from 'next/link';

import { Container } from '@/components/Layout/Container';
import { FAQPageStructuredData, BreadcrumbStructuredData } from '@/components/SEO/StructuredData';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.guiasComprarManga.title');
  const description = t('page.guiasComprarManga.description');

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
    alternates: { canonical: '/guias/comprar-manga-digital-espana' },
  };
}

const faqItems = [
  {
    question: '¿Cuáles son las mejores plataformas para comprar manga digital en España?',
    answer: 'Las mejores plataformas para comprar manga digital en España son: Amazon Kindle (gran catálogo, lectura en dispositivo Kindle), ComiXology (integración con Amazon, lectura guiada), Casa del Libro (tienda española, formatos EPUB), FNAC (plataforma francesa con presencia en España) y MangaAura (contenido original de creadores). Los precios oscilan entre 4.99€ y 9.99€ por volumen digital.',
  },
  {
    question: '¿Es más barato el manga digital que el físico en España?',
    answer: 'Generalmente sí. Un volumen digital cuesta entre 4.99€ y 7.99€, mientras que el físico está entre 8.50€ y 16.00€. Sin embargo, las ofertas y bundles pueden hacer el formato físico más atractivo para coleccionistas. Plataformas como ComiXology ofrecen descuentos frecuentes en sagas completas.',
  },
  {
    question: '¿Puedo leer manga comprado en diferentes dispositivos?',
    answer: 'Sí. Amazon Kindle sincroniza tu biblioteca entre dispositivos Kindle y la app Kindle. ComiXology también sincroniza entre dispositivos. MangaAura permite leer desde cualquier navegador web y su app. La mayoría de plataformas usan la nube para mantener tu progreso de lectura sincronizado.',
  },
  {
    question: '¿Qué plataforma tiene el mejor catálogo de manga en español?',
    answer: 'Amazon Kindle/ComiXology tiene el catálogo más extenso de manga en español, incluyendo editoriales como Planeta Cómic, Norma Editorial y Ivrea. Casa del Libro también ofrece una buena selección. Para contenido independiente y de creadores, MangaAura es una excelente alternativa.',
  },
];

export default function ComprarMangaPage() {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: 'Guías', item: '/guias' },
          { name: 'Comprar manga digital España', item: '/guias/comprar-manga-digital-espana' },
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
          <h1 className="text-4xl font-bold mb-4">Mejores plataformas para comprar manga digital en España</h1>
          <p className="text-lg text-fg-secondary mb-8">
            Cada vez más lectores españoles optan por el formato digital para disfrutar de sus series favoritas.
            Más económico, ocupa menos espacio y lo tienes siempre disponible.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Comparativa de plataformas</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-3 text-left">Plataforma</th>
                  <th className="border border-border p-3 text-left">Precio medio</th>
                  <th className="border border-border p-3 text-left">Catálogo español</th>
                  <th className="border border-border p-3 text-left">DRM</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border p-3 font-semibold">Amazon Kindle</td>
                  <td className="border border-border p-3">5.99€ - 8.99€</td>
                  <td className="border border-border p-3">Muy amplio</td>
                  <td className="border border-border p-3">Sí (Amazon)</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-semibold">ComiXology</td>
                  <td className="border border-border p-3">4.99€ - 7.99€</td>
                  <td className="border border-border p-3">Amplio</td>
                  <td className="border border-border p-3">Sí (Amazon)</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-semibold">Casa del Libro</td>
                  <td className="border border-border p-3">6.99€ - 9.99€</td>
                  <td className="border border-border p-3">Medio</td>
                  <td className="border border-border p-3">Sí (Adobe)</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-semibold">MangaAura</td>
                  <td className="border border-border p-3">Gratis / Premium</td>
                  <td className="border border-border p-3">Creadores independientes</td>
                  <td className="border border-border p-3">No</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-semibold">Google Play Libros</td>
                  <td className="border border-border p-3">5.99€ - 9.99€</td>
                  <td className="border border-border p-3">Medio</td>
                  <td className="border border-border p-3">Sí (Google)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Consejos para comprar manga digital</h2>
          <ul className="list-disc pl-5 space-y-2 text-fg-secondary">
            <li><strong>Compara precios:</strong> Un mismo volumen puede variar hasta 3€ entre plataformas.</li>
            <li><strong>Espera ofertas:</strong> ComiXology y Amazon tienen descuentos frecuentes (Black Friday, rebajas de verano).</li>
            <li><strong>Comprueba el DRM:</strong> Algunas plataformas usan DRM que limita la lectura a sus dispositivos.</li>
            <li><strong>Lee reseñas:</strong> La calidad de la traducción y escaneado varía entre editoriales.</li>
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

          <div className="mt-8 text-center">
            <Link href="/explore" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
              Descubre manga gratuito en MangaAura
            </Link>
          </div>
        </article>
      </Container>
    </>
  );
}
