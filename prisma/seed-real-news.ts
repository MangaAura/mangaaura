/**
 * Seed de noticias reales de manga/anime (Junio 2026)
 *
 * Uso: npx dotenv-cli -e .env -- npx tsx prisma/seed-real-news.ts
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

const articles: NewsSeed[] = [
  // ─── 1. Hunter x Hunter ─────────────────────────────────────────────
  {
    title: '¡Hunter x Hunter Volumen 39 ya tiene fecha! El regreso que todos esperábamos',
    slug: 'hunter-x-hunter-volumen-39',
    excerpt:
      'Después de 22 meses de silencio, Yoshihiro Togashi rompe la espera con el tomo 39. Los capítulos 401 al 410 llegan el 3 de julio y los fans ya tiemblan.',
    content:
      'Si hay una montaña rusa emocional que los lectores de manga conocemos bien, es la espera entre volúmenes de Hunter x Hunter. Y después de 22 largos meses —sí, casi dos años—, Yoshihiro Togashi finalmente nos responde con el volumen 39.\n\nShueisha lo ha confirmado: el próximo 3 de julio llegará a las librerías japonesas este esperadísimo tomo que recopila los capítulos 401 al 410. Para ponerlo en perspectiva, la última vez que tuvimos un volumen nuevo entre las manos fue en septiembre de 2024. Desde entonces, Togashi pasó por el quirófano, prometió seguir dibujando y —fiel a su estilo— nos mantuvo en vilo.\n\n¿Y lo mejor? El autor no se detiene ahí. Ya ha compartido en X (Twitter) que tiene los storyboards de los próximos capítulos listos. La máquina no se apaga.\n\nPara los que llevamos años siguiendo a Gon, Killua, Kurapika y Leorio, cada volumen es un regalo. Este 39 no solo es un número más: es la prueba de que Togashi sigue vivo, dibujando y, sobre todo, recordándonos por qué Hunter x Hunter es una obra maestra que merece cada minuto de espera.\n\nMarquen el 3 de julio en el calendario. Y si aún no han leído los capítulos anteriores… bueno, tienen un mes para ponerse al día.',
    category: 'community',
    date: '2026-06-06',
    coverUrl: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=800&h=450&fit=crop&auto=format',
    isFeatured: true,
  },

  // ─── 2. Attack on Titan 3 ────────────────────────────────────────
  {
    title: 'Attack on Titan 3: el videojuego que promete contar la historia COMPLETA del anime',
    slug: 'attack-on-titan-3-anunciado',
    excerpt:
      'Koei Tecmo y Omega Force lo han hecho oficial: Attack on Titan 3 narrará el viaje completo del Cuerpo de Exploración hasta su desenlace. Llega a PS5, Switch 2, Xbox y Steam.',
    content:
      'Si alguna vez soñaste con empuñar el equipo de maniobras tridimensional y enfrentarte cara a cara a los Nueve Titanes, prepárate porque tu momento ha llegado. Koei Tecmo y Omega Force han presentado Attack on Titan 3 durante el Summer Games Fest, y la promesa es clara: contar la historia completa del anime de principio a fin.\n\nSí, leíste bien. Por primera vez en la saga, podremos revivir —o experimentar por primera vez— la narrativa completa de Attack on Titan, desde los humildes comienzos del Cuerpo de Exploración hasta su conclusión definitiva. Y lo harás en PS5, Nintendo Switch 2, Xbox Series X|S y Steam.\n\n¿Qué significa esto en la práctica? Que podrás luchar contra los Nueve Titanes. Sí, cada uno de ellos. El juego promete combates que nunca antes habíamos visto en la franquicia, con nuevos contenidos argumentales que expanden el lore y, por supuesto, la acción frenética que Omega Force sabe hacer como nadie.\n\nEl 1 de julio (2 de julio en Japón) sabremos muchos más detalles. Pero si esta noticia te ha puesto la piel de gallina —como a nosotros—, ya puedes ir afilando las cuchillas.\n\nEl fin de la humanidad nunca se sintió tan épico.',
    category: 'tools',
    date: '2026-06-06',
    coverUrl: 'https://images.unsplash.com/photo-1535666669445-e8c15cd2e7d9?w=800&h=450&fit=crop&auto=format',
    isFeatured: false,
  },

  // ─── 3. Gifted anime 2027 ─────────────────────────────────────────
  {
    title: 'El manga "Gifted" tendrá anime en 2027: el detective prodigio llega a la pantalla',
    slug: 'gifted-manga-anime-2027',
    excerpt:
      'Del creador de Kindaichi Case Files llega la adaptación al anime de Gifted, un thriller de detectives con un giro sobrenatural que ya conquistó el live-action.',
    content:
      'Hay historias que simplemente merecen ser contadas en anime. Gifted, el manga de misterio creado por Seimaru Amagi (el genio detrás de Kindaichi Case Files) con arte de Rima Amamiya, acaba de recibir luz verde para su adaptación al anime, programada para 2027.\n\n¿De qué va? Imagina a dos chicos con dones extraordinarios. Natsuki Amakusa es un detective prodigio con una capacidad deductiva fuera de lo común. Yūya Shiki, por otro lado, nació con la habilidad de identificar asesinos. Juntos forman un dúo imparable que resuelve los casos más complejos mientras descubren secretos que van mucho más allá de lo que parece.\n\nEl manga, que se publica en Nakayoshi desde diciembre de 2021, ya tuvo una adaptación live-action en 2023 que fue todo un éxito en Japón, con dos temporadas que atraparon a la audiencia. Ahora, dará el salto al anime.\n\nCon 12 volúmenes publicados (el último llega el 12 de junio), es el momento perfecto para subirse al tren de Gifted antes de que el anime lo convierta en el próximo gran fenómeno. Porque si algo sabe hacer Seimaru Amagi, es construir misterios que te mantienen despierto hasta las 3 de la madrugada preguntándote "¿quién fue?".\n\nPrepárate. 2027 promete.',
    category: 'platform',
    date: '2026-06-05',
    coverUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=450&fit=crop&auto=format',
    isFeatured: true,
  },

  // ─── 4. Overgeared anime ──────────────────────────────────────────
  {
    title: 'Overgeared: el webtoon coreano que arrasa tendrá anime en octubre',
    slug: 'overgeared-webtoon-anime-octubre',
    excerpt:
      'El popular webtoon de REDICE Studio se transforma en "Tempal: El Poder de los Objetos" de la mano de J.C. Staff. Una historia de poder, objetos legendarios y superación.',
    content:
      'Si eres de los que devora webtoons coreanos como si no hubiera un mañana, este nombre te sonará: Overgeared. Y si no lo conoces aún, presta atención, porque su adaptación al anime —titulada Tempal: El Poder de los Objetos— llegará en octubre de la mano del legendario estudio J.C. Staff.\n\nLa historia sigue a Youngwoo, un joven que comienza a jugar un nuevo MMORPG de realidad virtual y termina descubriendo un objeto legendario que lo convierte en el jugador más poderoso… pero también en el centro de todas las conspiraciones del juego. Sí, tiene ese sabor a clásico del género, pero con un giro que lo hace adictivo.\n\nREDICE Studio, los creadores originales, han confiado esta adaptación a J.C. Staff, y el reparto ya promete: Tatsumaru Tachibana y Asami Seto darán vida a los protagonistas. Con Yen Press publicando el webtoon en inglés bajo su sello Ize Press, la base de fans global no hace más que crecer.\n\nOctubre está a la vuelta de la esquina. Y si algo nos enseña Overgeared es que, a veces, el objeto más poderoso no es el que encuentras en el juego, sino la determinación de quien lo empuña.',
    category: 'platform',
    date: '2026-06-04',
    coverUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=450&fit=crop&auto=format',
    isFeatured: false,
  },

  // ─── 5. Animal Signal ──────────────────────────────────────────────
  {
    title: 'De los creadores de "Torture Princess" y "We Never Learn": llega "Animal Signal" a Shonen Jump',
    slug: 'animal-signal-shonen-jump',
    excerpt:
      'Robinson Haruhara y Taishi Tsutsui unen fuerzas para traernos una comedia animal trepidante. El próximo gran éxito de Shonen Jump ya tiene fecha.',
    content:
      `Cuando dos titanes del manga deciden colaborar, lo mejor que puedes hacer es apartarte y dejar que la magia ocurra. Robinson Haruhara —escritor de la hilarante 'Tis Time for "Torture," Princess'— y Taishi Tsutsui —el artista detrás de la icónica 'We Never Learn'— se han unido para crear Animal Signal, y el resultado promete ser explosivo.\n\n¿De qué va? Aún no tenemos todos los detalles, pero la revista Weekly Shonen Jump ha confirmado que será una comedia de animales con un toque bishōjo que solo esta dupla podría lograr. El capítulo debut se publicará el 8 de junio en el próximo número de la revista.\n\nImagínate: el humor absurdo y adictivo de Haruhara combinado con el arte limpio, expresivo y lleno de carisma de Tsutsui. Si eso no es una receta para el éxito, no sabemos qué lo es.\n\nEn un mundo donde Shonen Jump siempre está buscando la próxima gran sensación, Animal Signal llega con el pedigrí de dos creadores que ya han demostrado saber exactamente lo que hace feliz a los lectores. Apunta el 8 de junio. Esta podría ser tu nueva obsesión.`,
    category: 'community',
    date: '2026-06-04',
    coverUrl: 'https://images.unsplash.com/photo-1543854926-5c42d67e7fbc?w=800&h=450&fit=crop&auto=format',
    isFeatured: false,
  },

  // ─── 6. Palworld 1.0 ──────────────────────────────────────────────
  {
    title: 'Palworld 1.0: la fecha de lanzamiento definitiva ya está aquí',
    slug: 'palworld-version-10-julio',
    excerpt:
      'El fenómeno que revolucionó el gaming en 2024 abandona el early access. El 10 de julio, Palworld recibe su versión completa con todo lo prometido.',
    content:
      'Lo sabemos. Pasaste horas —quizás cientos— capturando Pals, construyendo tu base y preguntándote cuándo llegaría el momento. Ese momento tiene fecha: 10 de julio de 2026.\n\nPalworld, el juego que rompió récords y se convirtió en el fenómeno global más inesperado de los últimos años, abandona oficialmente el early access con su versión 1.0. El anuncio llegó durante el Summer Games Fest, acompañado de un tráiler que nos mostró nuevo contenido, mejoras y, por supuesto, más de esas adorables (y cuestionablemente explotables) criaturas.\n\nDesde su lanzamiento en enero de 2024, Palworld ha sido mucho más que un juego: ha sido un fenómeno cultural. Generó debates sobre la industria, inspiró memes infinitos y, sobre todo, nos recordó que a veces las mejores experiencias gaming nacen de las ideas más locas. "¿Y si juntamos Pokémon con disparos y supervivencia?" Alguien lo preguntó, y Pocketpair respondió con 25 millones de copias vendidas.\n\nEl 10 de julio no es solo el lanzamiento de una versión. Es el cierre de un capítulo y el inicio de otro. Los Pals te esperan.',
    category: 'tools',
    date: '2026-06-05',
    coverUrl: 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=800&h=450&fit=crop&auto=format',
    isFeatured: false,
  },

  // ─── 7. Tanya the Evil II ──────────────────────────────────────────
  {
    title: '"Saga of Tanya the Evil II" revela su fecha de estreno: el 8 de julio la teniente vuelve al frente',
    slug: 'tanya-the-evil-ii-estreno-julio',
    excerpt:
      'La segunda temporada del isekai militar más aclamado ya tiene fecha, artistas de opening/ending y… ¿un mini anime? La teniente Degurechaff regresa con todo.',
    content:
      `Si hay una teniente que ha demostrado que el tamaño no importa cuando tienes determinación (y un pacto con un ser todopoderoso), esa es Tanya Degurechaff. Y vuelve. La segunda temporada de Saga of Tanya the Evil ya tiene fecha de estreno: 8 de julio, y los detalles que han salido a la luz prometen una temporada a la altura de las expectativas.\n\nEl anuncio —que llegó acompañado de un tráiler— reveló a los artistas encargados del opening y ending, así como la noticia de que la serie contará con un mini anime adicional. Porque parece que el universo de Tanya siempre tiene algo más que ofrecer.\n\nPara los que no la conocen: imagina a un ateo ejecutivo japonés reencarnado como una niña en una Europa alternativa en plena guerra mundial, obligada a servir a un Dios al que desprecia mientras asciende en el ejército con una crueldad y eficiencia que asusta a sus superiores. Ahora imagina todo eso con explosiones, magia militar y estrategias dignas de un genio táctico.\n\nLa temporada 1 nos dejó con el grito en el pecho. La película —'The Movie'— nos dio más de lo que queríamos. Pero la temporada 2… la temporada 2 promete ser el campo de batalla definitivo.\n\n8 de julio. Marquen sus calendarios. La teniente Degurechaff tiene una guerra que ganar.`,
    category: 'platform',
    date: '2026-06-06',
    coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=450&fit=crop&auto=format',
    isFeatured: false,
  },

  // ─── 8. Steins;Gate Re:Boot ────────────────────────────────────────
  {
    title: 'Steins;Gate Re:Boot nos muestra su ruta más oscura: el "Gamma Worldline" existe y es brutal',
    slug: 'steinsgate-reboot-gamma-worldline',
    excerpt:
      'El tráiler más reciente de Steins;Gate Re:Boot revela una línea temporal alternativa donde Okabe tendrá que enfrentarse a su versión más despiadada. El experimento continúa.',
    content:
      'El mundo de Steins;Gate siempre ha sido un lugar donde las decisiones importan. Donde un solo mensaje al pasado puede desencadenar una catástrofe. Y ahora, con el nuevo tráiler de Steins;Gate Re:Boot, sabemos que la línea temporal Gamma es real, y es tan brutal como prometían los rumores.\n\nPara los no iniciados: Steins;Gate Re:Boot es la versión remasterizada del juego original que lanzó una de las franquicias más queridas del anime y los visual novels. Pero no es un simple remaster. Incluye contenido nuevo, gráficos mejorados y, lo más importante, rutas alternativas que expanden el universo más allá de lo que conocíamos.\n\nLa ruta Gamma Worldline no es una más. Es la línea donde Okabe Rintaro —nuestro querido científico loco— se enfrenta a una versión de sí mismo que nunca quisimos conocer. Un Okabe que tomó decisiones diferentes. Un Okabe que podría ser el villano de su propia historia.\n\nEl tráiler, lanzado hoy, nos muestra fragmentos de lo que esta línea temporal depara: imágenes perturbadoras, dilemas morales llevados al extremo y, por supuesto, el regreso de todos los personajes que amamos en circunstancias que jamás imaginamos.\n\nEl juego completo saldrá pronto. Pero si algo nos ha enseñado Steins;Gate, es que el pasado nunca pasa de verdad. Y que a veces, la pregunta no es "si deberíamos" sino "a qué precio".\n\nEl experimento continúa. ¿Estás listo para cruzar la línea Gamma?',
    category: 'tools',
    date: '2026-06-06',
    coverUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop&auto=format',
    isFeatured: false,
  },
];

async function seedRealNews() {
  console.log('📰 Sembrando noticias reales de manga/anime...\n');

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
  console.log('✨ ¡Noticias sembradas correctamente!');
}

seedRealNews()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
