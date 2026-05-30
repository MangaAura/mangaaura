import { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/Layout/Container';
import { FAQPageStructuredData, BreadcrumbStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.guiasMasVendido.title');
  const description = t('page.guiasMasVendido.description');

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
    alternates: { canonical: '/guias/manga-mas-vendido-historia' },
  };
}

const faqItems = [
  {
    question: '¿Cuál es el manga más vendido de la historia?',
    answer: 'One Piece de Eiichiro Oda es el manga más vendido de la historia con más de 516 millones de copias en circulación a nivel mundial (2025). Le sigue Golgo 13 (300 millones), Dragon Ball (260 millones), Naruto (250 millones) y Detective Conan (250 millones). One Piece también ostenta el Récord Guinness como "la serie de cómics más publicada por un solo autor".',
  },
  {
    question: '¿Cuánto ha vendido One Piece en total?',
    answer: 'One Piece ha vendido más de 516 millones de copias en todo el mundo desde su debut en 1997. Solo en Japón ha vendido más de 400 millones. La serie tiene más de 110 volúmenes recopilatorios y sigue en publicación. Es el manga más vendido desde 2007, superando a Dragon Ball.',
  },
  {
    question: '¿Qué manga ha vendido más: Dragon Ball o Naruto?',
    answer: 'Dragon Ball ha vendido aproximadamente 260 millones de copias, mientras que Naruto ha vendido 250 millones. Dragon Ball tiene ventaja por su publicación más temprana (1984 vs 1999), aunque Naruto ha tenido un mayor impacto en la popularización global del manga y el anime fuera de Japón.',
  },
  {
    question: '¿Hay algún manga que haya superado a One Piece en ventas?',
    answer: 'No. One Piece es el manga más vendido de la historia con 516 millones de copias. El segundo lugar, Golgo 13 (300 millones), está lejos del récord de One Piece. Sin embargo, si hablamos de franquicia completa (incluyendo anime, videojuegos y merchandising), Pokémon es la franquicia más exitosa.',
  },
  {
    question: '¿Dónde puedo leer One Piece y otros mangas populares?',
    answer: 'Puedes leer One Piece de forma legal y gratuita en Manga Plus by Shueisha (últimos capítulos). MangaAura ofrece contenido original de creadores emergentes. Para la colección completa, Shonen Jump (2.99€/mes) tiene más de 15,000 capítulos incluyendo todos estos clásicos.',
  },
];

export default function MangaMasVendidoPage() {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: 'Guías', item: '/guias' },
          { name: 'Manga más vendido', item: '/guias/manga-mas-vendido-historia' },
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
          <h1 className="text-4xl font-bold mb-4">¿Cuál es el manga más vendido de la historia?</h1>
          <p className="text-lg text-fg-secondary mb-8">
            El manga es una industria global que mueve miles de millones. Estas son las series que han
            marcado un antes y un después en ventas, con cifras actualizadas a 2025-2026.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Ranking de mangas más vendidos</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-3 text-left">#</th>
                  <th className="border border-border p-3 text-left">Manga</th>
                  <th className="border border-border p-3 text-left">Autor</th>
                  <th className="border border-border p-3 text-left">Copias (millones)</th>
                  <th className="border border-border p-3 text-left">Años activo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border p-3 font-bold">1</td>
                  <td className="border border-border p-3 font-semibold">One Piece</td>
                  <td className="border border-border p-3">Eiichiro Oda</td>
                  <td className="border border-border p-3">516+</td>
                  <td className="border border-border p-3">1997–presente</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-bold">2</td>
                  <td className="border border-border p-3 font-semibold">Golgo 13</td>
                  <td className="border border-border p-3">Takao Saito</td>
                  <td className="border border-border p-3">300</td>
                  <td className="border border-border p-3">1968–presente</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-bold">3</td>
                  <td className="border border-border p-3 font-semibold">Dragon Ball</td>
                  <td className="border border-border p-3">Akira Toriyama</td>
                  <td className="border border-border p-3">260</td>
                  <td className="border border-border p-3">1984–1995</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-bold">4</td>
                  <td className="border border-border p-3 font-semibold">Naruto</td>
                  <td className="border border-border p-3">Masashi Kishimoto</td>
                  <td className="border border-border p-3">250</td>
                  <td className="border border-border p-3">1999–2014</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-bold">5</td>
                  <td className="border border-border p-3 font-semibold">Detective Conan</td>
                  <td className="border border-border p-3">Gosho Aoyama</td>
                  <td className="border border-border p-3">250</td>
                  <td className="border border-border p-3">1994–presente</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-bold">6</td>
                  <td className="border border-border p-3 font-semibold">Demon Slayer</td>
                  <td className="border border-border p-3">Koyoharu Gotouge</td>
                  <td className="border border-border p-3">150</td>
                  <td className="border border-border p-3">2016–2020</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-bold">7</td>
                  <td className="border border-border p-3 font-semibold">Attack on Titan</td>
                  <td className="border border-border p-3">Hajime Isayama</td>
                  <td className="border border-border p-3">140</td>
                  <td className="border border-border p-3">2009–2021</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-bold">8</td>
                  <td className="border border-border p-3 font-semibold">Slam Dunk</td>
                  <td className="border border-border p-3">Takehiko Inoue</td>
                  <td className="border border-border p-3">170</td>
                  <td className="border border-border p-3">1990–1996</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-bold">9</td>
                  <td className="border border-border p-3 font-semibold">Kochikame</td>
                  <td className="border border-border p-3">Osamu Akimoto</td>
                  <td className="border border-border p-3">156</td>
                  <td className="border border-border p-3">1976–2016</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-bold">10</td>
                  <td className="border border-border p-3 font-semibold">Oishinbo</td>
                  <td className="border border-border p-3">Tetsu Kariya</td>
                  <td className="border border-border p-3">135</td>
                  <td className="border border-border p-3">1983–presente</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm text-fg-secondary mb-8">
            *Fuentes: Shueisha, Shogakukan, Kodansha, Oricon. Cifras actualizadas a 2025.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Factores que explican el éxito de One Piece</h2>
          <ul className="list-disc pl-5 space-y-2 text-fg-secondary">
            <li><strong>Más de 25 años de publicación ininterrumpida</strong> (1997–presente).</li>
            <li><strong>Más de 110 volúmenes</strong> recopilatorios, de los cuales 103 han superado el millón de copias en Japón.</li>
            <li><strong>Récord Guinness</strong> como la serie de cómics más publicada por un solo autor.</li>
            <li><strong>Atracción intergeneracional:</strong> padres que crecieron con Luffy ahora comparten la serie con sus hijos.</li>
            <li><strong>Expansión global:</strong> traducido a más de 40 idiomas.</li>
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
              Descubre mangas populares en MangaAura
            </Link>
          </div>
        </article>
      </Container>
    </>
  );
}
