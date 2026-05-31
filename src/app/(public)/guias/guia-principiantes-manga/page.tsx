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
  const title = t('page.guiasPrincipiantes.title');
  const description = t('page.guiasPrincipiantes.description');

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
    ...withHreflang('/guias/guia-principiantes-manga'),
  };
}

const faqItems = [
  {
    question: '¿Cómo se lee el manga correctamente?',
    answer: 'El manga se lee de derecha a izquierda, al revés que los cómics occidentales. Empieza por la página que consideras la "última" (la contraportada) y avanza hacia la portada. Las viñetas también se leen de derecha a izquierda y de arriba abajo. Los globos de diálogo siguen el mismo orden: derecha a izquierda.',
  },
  {
    question: '¿Qué manga debería leer si soy principiante?',
    answer: 'Para empezar recomendamos: One Piece (aventura, el manga más vendido de la historia con 516M+ copias), Death Note (thriller psicológico, ideal para adultos), Naruto (ninjas, acción), Attack on Titan (acción, giro argumentales), My Hero Academia (superhéroes) y Demon Slayer (acción, arte espectacular). Todas estas series tienen versiones digitales legales disponibles.',
  },
  {
    question: '¿Cuál es la diferencia entre manga y anime?',
    answer: 'El manga es el cómic japonés (en blanco y negro, generalmente), mientras que el anime es la adaptación animada. El manga suele publicarse antes que el anime y a menudo contiene más detalles, historias secundarias y arcos que no llegan a la pantalla. Leer el manga te da la historia completa sin esperas entre temporadas.',
  },
  {
    question: '¿Dónde puedo empezar a leer manga online?',
    answer: 'Puedes empezar en MangaAura, una plataforma gratuita con manga original y herramientas de IA para creadores. También recomendamos Manga Plus by Shueisha (gratis, oficial), Shonen Jump (2.99€/mes), y Webtoon (webcomics gratuitos). Explora diferentes géneros hasta encontrar lo que más te guste.',
  },
  {
    question: '¿Cuánto cuesta empezar a leer manga?',
    answer: 'Puedes empezar completamente gratis. Plataformas como Manga Plus y MangaAura ofrecen contenido gratuito legal. Si prefieres el formato físico, los tomos cuestan entre 8€ y 16€ en España. La suscripción a Shonen Jump cuesta 2.99€/mes por más de 15,000 capítulos.',
  },
];

const genres = [
  { name: 'Shonen', desc: 'Para jóvenes, acción y aventura (One Piece, Naruto, Dragon Ball)', url: '/explore?tag=shonen' },
  { name: 'Shojo', desc: 'Para jóvenes, romance y drama (Sailor Moon, Fruits Basket)', url: '/explore?tag=shojo' },
  { name: 'Seinen', desc: 'Para adultos, tramas complejas (Berserk, Monster, Vagabond)', url: '/explore?tag=seinen' },
  { name: 'Josei', desc: 'Para mujeres adultas, romance realista (Nana, Paradise Kiss)', url: '/explore?tag=josei' },
  { name: 'Isekai', desc: 'Personajes transportados a otro mundo (Re:Zero, Mushoku Tensei)', url: '/explore?tag=isekai' },
  { name: 'Slice of Life', desc: 'Día a día, costumbrismo (Yotsuba, Barakamon)', url: '/explore?tag=slice-of-life' },
];

export default function GuiaPrincipiantesPage() {
  return (
    <>
      <WebPageStructuredData
        name="Guía para principiantes: cómo leer manga | MangaAura"
        description="Bienvenido al mundo del manga. Esta guía te enseña todo lo básico: cómo se lee, qué géneros existen, por dónde empezar y dónde encontrar tus primeras series."
        url="/guias/guia-principiantes-manga"
        lastReviewed="2026-01-15"
        datePublished="2025-01-01"
        dateModified="2026-01-15"
      />
      <BreadcrumbStructuredData
        items={[
          { name: 'Guías', item: '/guias' },
          { name: 'Guía para principiantes', item: '/guias/guia-principiantes-manga' },
        ]}
      />
      <HowToStructuredData
        name="Cómo leer manga: guía completa para principiantes"
        description="Aprende todo lo básico sobre el manga: cómo se lee, qué géneros existen, por dónde empezar y dónde encontrar tus primeras series."
        totalTime="PT30M"
        steps={[
          { name: 'Elige un género que te guste', text: 'Explora los principales géneros: Shonen (acción, aventura), Shojo (romance), Seinen (adultos), Josei (mujeres adultas), Isekai (mundos alternativos) y Slice of Life (costumbrismo). Elige el que más resuene contigo.' },
          { name: 'Encuentra una plataforma de lectura', text: 'Regístrate en plataformas legales como MangaAura (gratis), Manga Plus by Shueisha (gratis) o Shonen Jump (2.99€/mes) para acceder a miles de capítulos.' },
          { name: 'Empieza con series cortas', text: 'Comienza con series de pocos tomos como Death Note (12 tomos) o Frieren antes de embarcarte en sagas largas como One Piece (100+ tomos).' },
          { name: 'Acostúmbrate a la lectura inversa', text: 'El manga se lee de derecha a izquierda, al revés de los cómics occidentales. Tus ojos se adaptarán naturalmente después de unos pocos capítulos.' },
          { name: 'Únete a la comunidad', text: 'Comenta capítulos, comparte recomendaciones y descubre nuevos títulos en la comunidad de MangaAura. La experiencia de leer manga es mejor cuando la compartes.' },
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
          <h1 className="text-4xl font-bold mb-4">Guía para principiantes en la lectura de cómics japoneses</h1>
          <p className="text-lg text-fg-secondary mb-8">
            Bienvenido al mundo del manga. Esta guía te enseña todo lo básico: cómo se lee, qué géneros existen,
            por dónde empezar y dónde encontrar tus primeras series.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">¿Qué es el manga?</h2>
          <p className="text-fg-secondary mb-4">
            El manga son cómics japoneses. A diferencia de los cómics occidentales, se leen de derecha a izquierda
            y suelen publicarse en blanco y negro. Japón publica más de 2,000 millones de tomos al año, y la industria
            del manga facturó más de 6,700 millones de dólares en 2025 según Statista.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Géneros populares</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {genres.map((g) => (
              <div key={g.name} className="border border-border rounded-xl p-4">
                <h3 className="font-bold text-lg">{g.name}</h3>
                <p className="text-sm text-fg-secondary mt-1">{g.desc}</p>
                <Link href={g.url} className="text-primary text-xs font-semibold mt-2 inline-block hover:underline">
                  Explorar →
                </Link>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Cómo empezar a leer manga</h2>
          <ol className="list-decimal pl-5 space-y-3 text-fg-secondary">
            <li><strong>Elige un género</strong> que te guste (acción, romance, terror, etc.) y busca series populares.</li>
            <li><strong>Encuentra una plataforma</strong> como MangaAura, Manga Plus o Shonen Jump.</li>
            <li><strong>Empieza con series cortas</strong> (Death Note tiene 12 tomos) antes de embarcarte en sagas largas.</li>
            <li><strong>Acostúmbrate a la lectura inversa:</strong> derecha a izquierda. Tus ojos se adaptarán en pocos capítulos.</li>
            <li><strong>Únete a la comunidad:</strong> comenta capítulos, comparte recomendaciones y descubre nuevos títulos.</li>
          </ol>

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
              Empieza a leer manga gratis en MangaAura
            </Link>
          </div>
        </article>
      </Container>
    </>
  );
}
