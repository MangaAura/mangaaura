/**
 * Seed de noticias de última hora — 100% factuales de ANN (Junio 2026)
 *
 * Uso: npx dotenv-cli -e .env -- npx tsx prisma/seed-news-latest.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

const url = process.env.DATABASE_URL || '';
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

interface NewsSeed {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: 'platform' | 'community' | 'tools' | 'mobile' | 'contest';
  date: string;
  coverUrl: string;
  isFeatured: boolean;
}

const BASE = 'https://www.animenewsnetwork.com/thumbnails/';

const articles: NewsSeed[] = [
  // ─── 1. Tanya the Evil II ──────────────────────────────────────────
  {
    title: 'Tanya the Evil II: fecha de estreno, 25 episodios y Myth & Roid de vuelta — todo lo que sabemos',
    slug: 'tanya-the-evil-2-fecha-episodios-myth-roido',
    excerpt:
      'La segunda temporada de Saga of Tanya the Evil se estrena el 8 de julio con 25 episodios. Myth & Roid regresa para el opening y los fans llevan 5 años esperando este momento.',
    content:
      'Cinco años. Eso es lo que han tenido que esperar los fans de la saga más militarmente incorrecta del anime para ver el regreso de la pequeña teniente más temida del frente oriental. Y por fin, la espera tiene fecha de caducidad: Tanya the Evil II (Youjo Senki II) se estrena el 8 de julio de 2026.\n\nLo primero: sí, has leído bien. 25 episodios. No es una temporada de 12 ni de 13. Son 25 episodios completos. Para una serie que en su primera temporada nos dejó con 12 episodios y una película, este salto en volumen es una declaración de intenciones: la historia de Tanya Degurechaff tiene mucho más que contar.\n\nY la segunda noticia que ha hecho explotar las redes sociales: Myth & Roid, el dúo responsable del opening original "Jingo Jungle" —posiblemente uno de los mejores openings de la década pasada—, regresa para interpretar el tema de apertura de esta segunda temporada: "Re:I AM". Sí, la canción ya tiene título y suena exactamente tan épica como cabría esperar.\n\n¿De qué va Tanya the Evil? Para los que aún no conocen esta joya: un empresario japonés ateo y cínico muere y se encuentra cara a cara con una entidad que se autodenomina "Dios". Tras negarse a aceptar su autoridad, es reencarnado en un mundo alternativo de principios del siglo XX, pero en el cuerpo de una niña huérfana llamada Tanya Degurechaff. En este mundo, la magia existe, y Tanya —brillante, despiadada y decidida a vivir cómodamente— se alista en el ejército como maga de combate. Su plan: ascender rápidamente, alejarse del frente y disfrutar de una vida tranquila tras las líneas. Su problema: es tan buena luchando que la promocionan una y otra vez directamente hacia las batallas más peligrosas.\n\nLa serie es una mezcla única de estrategia militar, crítica política, reflexión filosófica sobre el libre albedrío y la fe, y secuencias de combate mágico que te dejan pegado al asiento. Todo ello aderezado con el contraste entre la apariencia inocente de Tanya —una niña rubia de ojos azules— y su naturaleza absolutamente implacable.\n\nLa animación vuelve a correr a cargo de NUT, el mismo estudio que nos trajo la primera temporada y la película. Y si el tráiler sirve de indicio, han subido el listón técnico de forma notable.\n\nApunta el 8 de julio. La teniente Degurechaff vuelve al frente. Y esta vez, viene con 25 episodios de ventaja.',
    category: 'platform',
    date: '2026-06-08',
    coverUrl: BASE + 'crop1200x630gH3/cms/news.9/238213/tanya-kv-2.jpg',
    isFeatured: true,
  },

  // ─── 2. Kaiju Girl Caramelise ──────────────────────────────────────
  {
    title: 'Kaiju Girl Caramelise: el romcom más kaiju del anime llega el 2 de julio',
    slug: 'kaiju-girl-caramelise-estreno-julio',
    excerpt:
      'La adaptación al anime del manga de Spica Aoki se estrena el 2 de julio con una premisa tan absurda como adorable: una chica que se convierte en kaiju gigante cada vez que se enamora.',
    content:
      'El anime del verano de 2026 tiene una candidata sorpresa a convertirse en el sleeper hit de la temporada. Y llega con una premisa que solo el manga japonés podía concebir: Kaiju Girl Caramelise (Kaiju no Oshi), la adaptación del manga de Spica Aoki, se estrena el próximo 2 de julio. Y sí, trata exactamente de lo que suena: una chica que se convierte en un monstruo gigante cada vez que su corazón se acelera por amor.\n\nPara los que piensan "esto o no es anime o no es romcom o no es kaiju": las tres cosas. La serie sigue a Kuroe Akaishi, una joven que vive una vida tranquila hasta que descubre que, cada vez que experimenta emociones románticas intensas, su cuerpo crece descontroladamente hasta convertirse en una criatura colosal que aterroriza la ciudad. Su crush, el popular y amable Arata Minami, no tiene ni idea de que la chica que le gusta es la misma que aparece en las noticias nocturnas arrasando edificios.\n\nEl manga original, publicado en la revista Monthly Comic Gene de Media Factory, ha sido un éxito discreto pero constante desde su lanzamiento, acumulando una base de fans fiel que llevaba años pidiendo esta adaptación. Ahora, bajo la producción del estudio Frontier Works, la historia cobra vida —y tamaño colosal— en la pantalla.\n\n¿Qué hace especial a Kaiju Girl Caramelise? En un mar de romcoms escolares, esta serie se atreve a ser diferente. No solo juega con el tropo del "secreto que no puede revelarse" de forma literal (literalmente no puede acercarse a su crush sin provocar un desastre natural), sino que además aborda temas como la autoaceptación, la ansiedad social y la presión de esconder quién eres realmente, todo envuelto en una comedia absurda y momentos genuinamente tiernos.\n\nEl reparto de voces incluye a Yurika Kubo como Kuroe y Yuma Uchida como Arata, con dirección de Yoshinobu Kasai. La fecha marcada en rojo: 2 de julio. Si buscas un romcom que no se parezca a ningún otro, este es tu anime.',
    category: 'community',
    date: '2026-06-08',
    coverUrl: BASE + 'crop1200x630g8H/cms/news.9/238245/kaiju2.png.jpg',
    isFeatured: true,
  },

  // ─── 3. A Returner's Magic Should Be Special S2 ────────────────────
  {
    title: 'A Returner\'s Magic Should Be Special Temporada 2 llega en octubre con FLOW en el opening',
    slug: 'returners-magic-special-s2-octubre-flow',
    excerpt:
      'La segunda temporada del isekai de fantasía se estrena en octubre de 2026 con la legendaria banda FLOW interpretando el opening. Desir vuelve a desafiar al destino.',
    content:
      'Hay segundas oportunidades que cambian el mundo. Y luego está la de Desir Arman, que ha vuelto al pasado una vez más —y esta vez, sus fans también pueden viajar con él. A Returner\'s Magic Should Be Special (Kaette Kita Motoyuusha no Gakuin Musō) ha confirmado que su segunda temporada se estrena en octubre de 2026, y viene con un as bajo la manga: FLOW, la banda detrás de himnos como "GO!!!" de Naruto y "Colors" de Code Geass, interpreta el opening.\n\nPara los que no conocen la serie: imagina un mundo donde la humanidad está al borde de la extinción, diezmada por una catástrofe mágica imparable. En sus últimos momentos, Desir Arman —el héroe más poderoso de su era— utiliza un hechizo prohibido para retroceder en el tiempo, volviendo a sus días de estudiante en el instituto de magia. Con todo el conocimiento de su vida anterior y un poder que no debería poseer, se propone cambiar el futuro y salvar a todos los que perdió la primera vez.\n\nLa primera temporada, emitida en 2024, dejó a los fans con ganas de más. Basada en el webtoon coreano de Usonan (que a su vez adapta la novela ligera homónima), la serie ha construido una base de seguidores que crece con cada episodio. La temporada 2 promete adaptar los arcos más intensos de la historia, justo donde la trama empieza a torcerse de verdad.\n\nY sí, FLOW al frente del opening es un golpe sobre la mesa. La banda japonesa, que recientemente también participó en From Overshadowed to Overpowered con el tema "+Encount", demuestra que sigue siendo el nombre más fiable del anime cuando se trata de canciones que te ponen la piel de gallina.\n\nLa producción continúa a cargo del estudio Arvo Animation, que ha mantenido el nivel visual que los fans esperan de una adaptación de un webtoon coreano de calidad. Los detalles sobre el reparto de voces adicional se revelarán en las próximas semanas.\n\nOctubre de 2026. Desir Arman regresa. Y esta vez, el destino no va a ganar.',
    category: 'platform',
    date: '2026-06-07',
    coverUrl: BASE + 'crop1200x630gS9/cms/news.9/238246/w676.jpeg',
    isFeatured: true,
  },

  // ─── 4. Dara-san of Reiwa ──────────────────────────────────────────
  {
    title: 'Dara-san of Reiwa: Sugita, Hayami y Koga lideran el reparto de la comedia más esperada del verano',
    slug: 'dara-san-reiwa-reparto-sugita-hayami-koga',
    excerpt:
      'Tomokazu Sugita, Saori Hayami y Aoi Koga encabezan el elenco de Dara-san of Reiwa, la adaptación del manga de comedia de la era Reiwa que se estrena el 2 de julio.',
    content:
      'Si hay un anime este verano que promete arrancar carcajadas, ese es Dara-san of Reiwa (Reiwa no Dara-san). La adaptación del manga de comedia de la era Reiwa se estrena el próximo 2 de julio, y el reparto anunciado es tan impresionante que por sí solo justifica la espera.\n\nAl frente del elenco: Tomokazu Sugita (Gintoki en Gintama, Joseph Joestar en JoJo\'s Bizarre Adventure) —posiblemente el actor de voz más carismático de Japón— da vida al protagonista. A su lado, Saori Hayami (Yor en Spy x Family, Shinobu en Demon Slayer) y Aoi Koga (Kaguya en Kaguya-sama: Love Is War) completan el trío principal. Si sumamos a Yumi Uchiyama en el reparto, estamos ante una de las listas de voces más sólidas de la temporada.\n\n¿De qué va Dara-san of Reiwa? Ambientada en la actual era Reiwa, la serie sigue las aventuras (y desventuras) de un grupo de personajes peculiares que navegan la vida cotidiana en el Japón contemporáneo. El tono es de comedia pura, con ese humor tan característico del manga japonés que encuentra lo absurdo en lo mundano. La serie promete ser un respiro cómico en medio de una temporada llena de acción y fantasía.\n\nEl manga original, publicado en la revista Big Comic Superior de Shogakukan, ha sido un éxito de crítica por su capacidad para capturar el espíritu de la era Reiwa con humor inteligente y personajes con los que es imposible no encariñarse.\n\nLa dirección corre a cargo de Shinji Ishihira, con producción del estudio Bandai Namco Pictures. La música es obra de Yuki Hayashi, conocido por su trabajo en My Hero Academia y Haikyuu!!, lo que garantiza una banda sonora que eleva cada momento cómico al nivel que merece.\n\nEl 2 de julio, las risas están aseguradas. Y con este reparto, las carcajadas también.',
    category: 'community',
    date: '2026-06-08',
    coverUrl: BASE + 'crop1200x630gID/herald/198396/darasan-01.jpg',
    isFeatured: false,
  },

  // ─── 5. Persona 6 anunciado ─────────────────────────────────────────
  {
    title: 'Persona 6 se anuncia en el Xbox Games Showcase 2026: todo lo que sabemos del regreso de ATLUS',
    slug: 'persona-6-anunciado-xbox-games-showcase-2026',
    excerpt:
      'Después de años de rumores y filtraciones, ATLUS ha confirmado Persona 6 en el Xbox Games Showcase 2026. Nuevo protagonista, nuevo escenario y la promesa de llevar la saga a un nivel nunca visto.',
    content:
      'El momento que los fans de Persona llevaban años esperando por fin ha llegado. En el marco del Xbox Games Showcase 2026, ATLUS ha confirmado oficialmente Persona 6, la nueva entrega de la aclamada saga de JRPG que comenzó con Persona 3 y alcanzó su cénit de popularidad con Persona 5.\n\nEl tráiler de anuncio —disponible ya en YouTube— nos muestra a un nuevo protagonista en lo que parece ser una ciudad japonesa bañada por luces de neón, con un estilo visual que mantiene la esencia artística de la serie pero con una paleta de colores y una dirección de arte que apuntan a una evolución significativa. El lema del juego: "Despierta a tu verdad".\n\nAunque ATLUS no ha revelado detalles concretos de la trama, el tráiler deja entrever los elementos clásicos de la serie: un grupo de estudiantes que descubren un poder especial, un mundo alternativo que acecha bajo la superficie de la realidad cotidiana, y la promesa de una historia que explorará las conexiones humanas y la búsqueda de la identidad.\n\nLa saga Persona, que nació como un spin-off de Shin Megami Tensei, se ha convertido en uno de los pilares del JRPG moderno. Persona 5 (2016) y su versión Royal (2019) vendieron millones de copias en todo el mundo y llevaron la franquicia a un público masivo, gracias a su fusión única de simulador de vida social, mazmorras por turnos y una estética inconfundible.\n\nEl anuncio se produce después de que ATLUS confirmara que Persona 5 Royal, Persona 4 Golden y Persona 3 Portable llegarían a Xbox y PC en 2022, un movimiento que muchos interpretaron como un primer paso para calentar motores de cara a Persona 6. El tiempo les ha dado la razón.\n\nDe momento, no hay ventana de lanzamiento concreta ni plataformas confirmadas más allá de Xbox (donde se anunció), pero todo apunta a que el juego llegará también a PlayStation y PC, siguiendo la estrategia multiplataforma que ATLUS ha adoptado en los últimos años.\n\nLa comunidad de fans ha estallado en redes sociales. El hashtag #Persona6 es tendencia mundial en X (Twitter), y los foros de la saga no dan abasto con teorías, análisis frame a frame del tráiler y especulaciones sobre el nuevo protagonista.\n\nDespierta a tu verdad. La espera ha terminado.',
    category: 'mobile',
    date: '2026-06-08',
    coverUrl: BASE + 'crop1200x630gY3/youtube/9lwef2jan-Q.jpg',
    isFeatured: true,
  },
];

async function seedLatestNews() {
  console.log('📰 Sembrando noticias de última hora...\n');

  const admin = await prisma.user.findFirst({
    where: { role: { in: ['ADMIN', 'OWNER'] } },
    select: { id: true },
  });

  if (!admin) {
    console.error('❌ No se encontró ningún admin. Ejecuta el seed principal primero.');
    process.exit(1);
  }

  console.log(`✅ Admin: ${admin.id}\n`);

  let created = 0;
  let skipped = 0;

  for (const article of articles) {
    const publishedAt = new Date(article.date + 'T14:00:00Z');

    const existing = await prisma.newsArticle.findUnique({
      where: { slug: article.slug },
      select: { id: true },
    });

    if (existing) {
      console.log(`⏭️  Ya existe: "${article.title}"`);
      skipped++;
      continue;
    }

    await prisma.newsArticle.create({
      data: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        coverUrl: article.coverUrl,
        category: article.category,
        authorId: admin.id,
        isPublished: true,
        isFeatured: article.isFeatured,
        publishedAt,
      },
    });

    console.log(`✅ Creada: "${article.title}"`);
    created++;
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Creadas: ${created}`);
  console.log(`   Saltadas: ${skipped}`);
  console.log(`   Destacadas: ${articles.filter(a => a.isFeatured).length}`);
  console.log('✨ ¡Noticias de última hora sembradas correctamente!');
}

seedLatestNews()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
