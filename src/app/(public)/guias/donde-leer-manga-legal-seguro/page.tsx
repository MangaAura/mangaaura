import { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/Layout/Container';
import { FAQPageStructuredData, BreadcrumbStructuredData, WebPageStructuredData, HowToStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { withHreflang } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.guiasDondeLeer.title');
  const description = t('page.guiasDondeLeer.description');

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
    ...withHreflang('/guias/donde-leer-manga-legal-seguro'),
  };
}

const faqItems = [
  {
    question: '¿Dónde puedo leer manga online de forma legal y segura?',
    answer: 'Puedes leer manga legal en plataformas como Manga Plus by Shueisha (gratis, capítulos simultáneos con Japón), Shonen Jump (suscripción), MangaAura (comunidad de creadores), ComiXology (Amazon), Webtoon (webcomics), y VIZ Media. Estas plataformas ofrecen contenido autorizado sin riesgos de malware ni problemas legales.',
  },
  {
    question: '¿Es seguro leer manga en sitios piratas?',
    answer: 'No. Los sitios piratas suelen contener malware, anuncios invasivos y pueden exponerte a riesgos de seguridad. Según un estudio de Digital Citizens Alliance, el 43% de los sitios piratas contienen malware. Además, leer en plataformas legales apoya a los creadores y la industria del manga.',
  },
  {
    question: '¿MangaAura es una plataforma legal?',
    answer: 'Sí. MangaAura es una plataforma legal donde creadores publican su contenido original. Puedes leer manga creado por la comunidad, descubrir nuevas series y apoyar a los autores directamente. No aloja contenido pirateado.',
  },
  {
    question: '¿Cuáles son las mejores plataformas gratuitas y legales para leer manga?',
    answer: 'Las mejores opciones gratuitas y legales incluyen: Manga Plus by Shueisha (lee los últimos capítulos de One Piece, Jujutsu Kaisen y más gratis), Shonen Jump (prueba gratuita), Webtoon (webcomics gratuitos), MangaAura (contenido original de creadores), y GlobalComix (cómmics independientes).',
  },
  {
    question: '¿Puedo leer manga en español en plataformas legales?',
    answer: 'Sí. Manga Plus by Shueisha ofrece traducción oficial al español. MangaAura tiene contenido en español creado por la comunidad hispanohablante. ComiXology yAmazon también venden mangas traducidos al español.',
  },
];

export default function DondeLeerMangaPage() {
  return (
    <>
      <WebPageStructuredData
        name="¿Dónde leer manga online de forma legal y segura? | MangaAura"
        description="Leer manga online es más fácil que nunca, pero no todos los sitios son seguros ni legales. Esta guía te muestra las mejores plataformas donde puedes disfrutar de tus series favoritas sin riesgos y apoyando a la industria."
        url="/guias/donde-leer-manga-legal-seguro"
        lastReviewed="2026-01-15"
        datePublished="2025-01-01"
        dateModified="2026-01-15"
      />
      <BreadcrumbStructuredData
        items={[
          { name: 'Guías', item: '/guias' },
          { name: 'Dónde leer manga legal', item: '/guias/donde-leer-manga-legal-seguro' },
        ]}
      />
      <HowToStructuredData
        name="Cómo leer manga online de forma legal y segura"
        description="Encuentra las mejores plataformas legales para leer manga online sin riesgos. Apoya a los creadores y disfruta de contenido de calidad."
        steps={[
          { name: 'Elige una plataforma legal', text: 'Las mejores opciones legales incluyen Manga Plus by Shueisha (gratis, capítulos simultáneos con Japón), Shonen Jump (2.99€/mes, +15,000 capítulos), MangaAura (gratis, contenido original de creadores), Webtoon (webcomics gratis) y ComiXology.' },
          { name: 'Verifica que sea una fuente oficial', text: 'Las plataformas legales tienen licencias de las editoriales. Manga Plus es de Shueisha, Shonen Jump de VIZ Media, MangaAura tiene contenido original. Busca el sello "oficial" o "licenciado".' },
          { name: 'Evita sitios piratas', text: 'Los sitios piratas contienen malware (43% según Digital Citizens Alliance), anuncios invasivos y pueden exponerte a riesgos de seguridad. Además, leer en plataformas legales apoya a los creadores.' },
          { name: 'Disfruta de las ventajas del contenido legal', text: 'Las plataformas legales ofrecen traducciones oficiales, imágenes en alta resolución, lectura offline, actualizaciones simultáneas con Japón y la satisfacción de apoyar a la industria del manga.' },
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
          <h1 className="text-4xl font-bold mb-4">¿Dónde leer manga online de forma legal y segura?</h1>
          <p className="text-lg text-fg-secondary mb-8">
            Leer manga online es más fácil que nunca, pero no todos los sitios son seguros ni legales.
            Esta guía te muestra las mejores plataformas donde puedes disfrutar de tus series favoritas
            sin riesgos y apoyando a la industria.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Plataformas legales recomendadas</h2>

          <div className="space-y-6">
            <div className="border border-border rounded-xl p-5">
              <h3 className="text-xl font-bold">Manga Plus by Shueisha</h3>
              <p className="text-fg-secondary mt-1">La plataforma oficial de Shueisha, la editorial más grande de Japón. Publica los últimos capítulos de series como <strong>One Piece</strong> (más de 516 millones de copias vendidas), <strong>Jujutsu Kaisen</strong>, <strong>Chainsaw Man</strong> y <strong>Spy x Family</strong> simultáneamente con Japón. Es gratuita con publicidad.</p>
              <Link href="/explore" className="text-primary text-sm font-semibold mt-2 inline-block hover:underline">
                Explora mangas en MangaAura →
              </Link>
            </div>

            <div className="border border-border rounded-xl p-5">
              <h3 className="text-xl font-bold">Shonen Jump (VIZ Media)</h3>
              <p className="text-fg-secondary mt-1">Suscripción mensual por 2.99€ con acceso a más de 15,000 capítulos de series clásicas y actuales. Incluye <strong>Dragon Ball</strong>, <strong>Naruto</strong>, <strong>My Hero Academia</strong> y <strong>Demon Slayer</strong> (que vendió 150 millones de copias en solo 4 años).</p>
            </div>

            <div className="border border-border rounded-xl p-5">
              <h3 className="text-xl font-bold">MangaAura</h3>
              <p className="text-fg-secondary mt-1">Plataforma de manga con IA donde puedes leer contenido original de creadores, descubrir nuevas series y participar en la comunidad. Ofrece recomendaciones personalizadas basadas en tus gustos de lectura.</p>
              <Link href="/explore" className="text-primary text-sm font-semibold mt-2 inline-block hover:underline">
                Descubre mangas nuevos →
              </Link>
            </div>

            <div className="border border-border rounded-xl p-5">
              <h3 className="text-xl font-bold">Webtoon</h3>
              <p className="text-fg-secondary mt-1">La plataforma líder de webcomics con más de 100 millones de usuarios mensuales. Ideal para leer manhwa y webtoons coreanos en formato vertical optimizado para móvil.</p>
            </div>

            <div className="border border-border rounded-xl p-5">
              <h3 className="text-xl font-bold">ComiXology (Amazon)</h3>
              <p className="text-fg-secondary mt-1">Tienda digital de Amazon con miles de mangas y cómics. Compatible con Kindle y dispositivos móviles. Ofrece lectura offline y panel a panel para una experiencia inmersiva.</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mt-10 mb-4">¿Por qué elegir plataformas legales?</h2>
          <ul className="list-disc pl-5 space-y-2 text-fg-secondary">
            <li><strong>Seguridad:</strong> Sin malware, anuncios engañosos ni riesgos de phishing.</li>
            <li><strong>Calidad:</strong> Traducciones oficiales, imágenes en alta resolución y sin cortes.</li>
            <li><strong>Apoyo a creadores:</strong> Cada lectura legal contribuye a que los autores sigan creando.</li>
            <li><strong>Actualizaciones:</strong> Capítulos simultáneos con Japón en plataformas como Manga Plus.</li>
            <li><strong>Lectura offline:</strong> Descarga capítulos para leer sin conexión.</li>
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
