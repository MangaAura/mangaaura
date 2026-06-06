/**
 * Seed de noticias frescas basadas en la actualidad de ANN (Junio 2026)
 *
 * Uso: npx dotenv-cli -e .env -- npx tsx prisma/seed-news-fresh.ts
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
  // ─── 1. Re:Zero Season 4 ───────────────────────────────────────────
  {
    title: 'Re:Zero Temporada 4: por qué esta es la temporada que todo fan del isekai debería ver',
    slug: 'rezero-temporada-4-analisis',
    excerpt:
      'La cuarta temporada de Re:Zero está en plena emisión y ha superado todas las expectativas. Con episodios que mantienen a los fans al borde del asiento, esta entrega promete ser la mejor hasta la fecha.',
    content:
      'Hay series que marcan un antes y un después en el género isekai. Re:Zero es una de ellas. Y su cuarta temporada —que actualmente se emite dentro de la temporada de primavera de 2026— está demostrando exactamente por qué.\n\nPara los que no la conocen: Subaru Natsuki es un joven que, sin previo aviso, es transportado a un mundo de fantasía donde descubre que posee una habilidad tan poderosa como aterradora: el "Regreso por Muerte", que le permite retroceder en el tiempo al morir, pero a costa de un sufrimiento psicológico inmenso.\n\nLa temporada 4 adapta uno de los arcos más aclamados del anime, continuando la historia justo donde terminó la temporada 3. La producción a cargo de White Fox ha elevado el listón con una animación que captura a la perfección la intensidad emocional de la obra original de Tappei Nagatsuki.\n\n¿Qué hace especial a esta temporada? Sin entrar en spoilers, podemos decir que los misterios que rodean a la bruja de la envidia, el papel de Emilia en el gran esquema del mundo, y el desarrollo de Subaru como personaje alcanzan cotas nunca antes vistas. Cada episodio es un puñetazo emocional que te deja con ganas de más.\n\nSi eres fan del isekai pero aún no le has dado una oportunidad a Re:Zero, esta es tu temporada. Y si ya eres seguidor de Subaru y su sufrimiento eterno, sabes de sobra que no podrás dejar de verla.\n\nPorque en el mundo de Re:Zero, morir es solo el comienzo.',
    category: 'community',
    date: '2026-06-07',
    coverUrl: BASE + 'crop1200x630gGC/cms/episode-review.5/238160/rezero09.jpg',
    isFeatured: true,
  },

  // ─── 2. Witch Hat Atelier ──────────────────────────────────────────
  {
    title: 'Witch Hat Atelier: el anime que está enamorando a todos esta temporada (y por qué)',
    slug: 'witch-hat-atelier-temporada-primavera',
    excerpt:
      'Con una animación que parece un cuento de hadas en movimiento, Witch Hat Atelier se ha convertido en la sorpresa más hermosa de la temporada. Si no lo estás viendo, te estás perdiendo algo especial.',
    content:
      'De vez en cuando llega un anime que no solo se ve, se siente. Witch Hat Atelier, la adaptación del aclamado manga de Kamome Shirahama, es exactamente eso. Desde su estreno en la temporada de primavera de 2026, esta serie ha capturado los corazones de la audiencia con una propuesta visual y narrativa que pocas veces se ve.\n\nLa historia sigue a Coco, una niña que sueña con convertirse en bruja. Su vida cambia cuando conoce a Qifrey, un misterioso mago que la introduce en el mundo de la magia. Pero lo que hace especial a Witch Hat Atelier no es solo su premisa —que ya de por sí es encantadora—, sino la forma en que aborda la magia: no como un poder innato, sino como un arte que se aprende, se practica y se respeta.\n\nLa producción de BUG FILMS es sencillamente espectacular. Cada episodio parece un cuadro en movimiento, con una dirección artística que captura a la perfección el estilo único del manga original. La música, los detalles, los personajes… todo encaja para crear una experiencia que te transporta a un mundo donde la magia es real y está al alcance de quien se atreva a dibujarla.\n\nCon 10 episodios ya emitidos y una recepción crítica que la sitúa entre lo mejor de la temporada, Witch Hat Atelier no es solo un anime: es una carta de amor al arte, la imaginación y el poder de los sueños.\n\nSi buscas algo bonito, profundo y mágico de verdad, este es tu anime.',
    category: 'community',
    date: '2026-06-06',
    coverUrl: BASE + 'crop1200x630gGG/cms/episode-review.5/238025/witch-hat-10.png.jpg',
    isFeatured: false,
  },

  // ─── 3. Dorohedoro Season 2 ────────────────────────────────────────
  {
    title: 'Dorohedoro Temporada 2: el regreso del caos más brutal y adictivo del anime',
    slug: 'dorohedoro-temporada-2-caos',
    excerpt:
      'Once episodios después, Dorohedoro S2 confirma que la espera valió la pena. MÁLAGA, lagartos, brujas y el caos más absoluto han vuelto para quedarse.',
    content:
      'Si hay un anime que desafía cualquier categorización, ese es Dorohedoro. La segunda temporada, que actualmente se emite con 11 episodios ya disponibles, ha demostrado que la espera de seis años desde la primera temporada valió absolutamente la pena.\n\nPara los no iniciados: imagina un mundo dividido en dos dimensiones. El Agujero, un distrito industrial decadente y violento donde la gente común sobrevive como puede. Y la dimensión de los magos, donde hechiceros retorcidos usan a los habitantes del Agujero como conejillos de indias. En medio de todo, Nikaido —una mujer con poderes misteriosos— busca desesperadamente recuperar los recuerdos de Caimán, un hombre con cabeza de lagarto que no recuerda quién era antes de ser maldito.\n\nLo que hace única a Dorohedoro es su capacidad para mezclar violencia extrema con un sentido del humor absurdo, personajes carismáticos que amas a pesar de ser terribles personas, y un mundo construido con un nivel de detalle que pocos animes logran. La temporada 2, producida por MAPPA, ha mantenido esa esencia mientras eleva la apuesta en todos los sentidos.\n\nSi te gusta el anime que no tiene miedo de ensuciarse las manos, Dorohedoro es tu serie. Y esta segunda temporada es la confirmación de que el caos, bien contado, puede ser una obra de arte.',
    category: 'tools',
    date: '2026-06-05',
    coverUrl: BASE + 'crop1200x630gJK/cms/episode-review.5/237955/ss-2026-05-29-21-14-23-184.jpg',
    isFeatured: false,
  },

  // ─── 4. My Hero Academia 10 años ──────────────────────────────────
  {
    title: 'My Hero Academia cumple 10 años: cómo una serie sobre superhéroes conquistó el mundo',
    slug: 'my-hero-academia-10-aniversario',
    excerpt:
      'El 10 aniversario de My Hero Academia llega con un canal FAST, eventos especiales y el cariño de millones de fans. Repasamos cómo Deku y compañía cambiaron el anime para siempre.',
    content:
      'Un 7 de junio de 2016, un joven sin poderes llamado Izuku Midoriya soñaba con convertirse en el héroe más grande del mundo. Diez años después, My Hero Academia no solo ha cumplido ese sueño: se ha convertido en un fenómeno global que trasciende el anime.\n\nCoincidiendo con su décimo aniversario, la franquicia ha lanzado su propio canal FAST (Free Ad-Supported TV) llamado "It\'s Anime", disponible desde el 6 de junio, donde los fans pueden disfrutar de las temporadas completas de forma gratuita. Pero esto es solo la punta del iceberg.\n\nCreada por Kohei Horikoshi, la serie comenzó su publicación en Weekly Shonen Jump en julio de 2014, y el anime debutó en abril de 2016. En una década, ha generado 7 temporadas de anime, 3 películas (con una cuarta en camino), videojuegos, musicales, y una base de fans que abarca todos los continentes.\n\n¿El secreto de su éxito? My Hero Academia entendió algo que pocas series capturan: no hace falta tener poderes para ser un héroe. La determinación de Deku, el sacrificio de All Might, la redención de personajes como Endeavor o el carisma de villanos como Shigaraki crearon un universo donde cualquiera podía verse reflejado.\n\nHan pasado 10 años. Y si algo nos ha enseñado esta serie, es que los héroes de verdad no llevan capa: llevan determinación. Y My Hero Academia, sin duda, es una de las grandes heroínas del anime moderno.',
    category: 'platform',
    date: '2026-06-06',
    coverUrl: BASE + 'crop1200x630gGJ/cms/news.9/232275/mha_10th_visual_english_1203_ol.jpg',
    isFeatured: true,
  },

  // ─── 5. From Overshadowed to Overpowered ────────────────────────────
  {
    title: '"From Overshadowed to Overpowered": el nuevo isekai del verano que promete ser el más visto',
    slug: 'from-overshadowed-to-overpowered-isekai-verano',
    excerpt:
      'FLOW pone la canción de opening y la fecha de estreno ya está aquí. El isekai de Kentarou llega el 25 de junio con todos los ingredientes para convertirse en el fenómeno del verano.',
    content:
      'Cada temporada tiene su candidato a fenómeno. Y para el verano de 2026, From Overshadowed to Overpowered (Rakudai Kenja no Gakuin Musō) parte como uno de los favoritos. Y no es para menos: la adaptación del manga de Kentarou —basado a su vez en las novelas ligeras de Arata Shiraishi— ha desvelado su tráiler principal, y viene con todo.\n\nLa gran noticia: FLOW, la legendaria banda japonesa responsable de openings icónicos como "GO!!!" de Naruto y "Colors" de Code Geass, interpreta el tema de apertura "+Encount". Sí, FLOW. El hype es real.\n\n¿De qué va? Ephtal es un joven que se reencarna en un mundo de magia. Pero descubre que no tiene ningún talento mágico, y muere en la miseria. Sin embargo, el destino le da una segunda oportunidad: se reencarna de nuevo 400 años después, conservando todo su conocimiento y poder de su vida anterior. Ahora, decidido a no fracasar otra vez, se propone dominar la magia y alcanzar la cima.\n\nEl anime se estrena en streaming en Japón el 25 de junio (a las 24:00, efectivamente el 26 de junio) en d Anime Store, ABEMA y U-NEXT. La emisión en televisión comenzará el 1 de julio en Tokyo MX, ABC TV, BS Fuji y WOWOW.\n\nShūichirō Umeda da vida a Ephtal, con Reo Osanai como Anastasia y Haruka Shiraishi como Marin. La dirección corre a cargo de Hisashi Ishii en EMT Squared, con guiones supervisados por Deko Akao y diseños de personajes de Hideki Furukawa.\n\nSi te gustan los isekai de poder, segundas oportunidades y bandas sonoras que te ponen la piel de gallina, apunta el 25 de junio. Este va a ser tu nuevo vicio.',
    category: 'platform',
    date: '2026-06-07',
    coverUrl: BASE + 'crop1200x630gJB/cms/news.9/238219/00000013.jpg',
    isFeatured: false,
  },

  // ─── 6. Mahouka Part II ────────────────────────────────────────────
  {
    title: 'The Irregular at Magic High School anuncia la producción de su "Parte II"',
    slug: 'mahouka-kouko-part-ii-anunciada',
    excerpt:
      'La saga de Tatsuya Shiba continúa. Tras varias temporadas y una película, la franquicia de Mahouka Koukou no Rettousei ha confirmado que una nueva entrega está en producción.',
    content:
      'El universo de The Irregular at Magic High School (Mahouka Koukou no Rettousei) se niega a terminar. El portal oficial de la serie ha anunciado que la producción de la "Parte II" del anime ya está en marcha, acompañado de un visual que ha emocionado a los fans.\n\nPara los que llevan años siguiendo esta saga: Tatsuya Shiba —el "hermano irregula"— y su hermana Miyuki regresarán para continuar adaptando las novelas ligeras de Tsutomu Satou, que concluyeron con 32 volúmenes en 2020. La serie, que comenzó en 2014, ha sido un pilar del género de magia y ciencia ficción en el anime.\n\nLa franquicia ha tenido un recorrido impresionante: dos temporadas de anime, una película (The Girl Who Summons the Stars), y la reciente temporada que adaptó el arco de Steeplechase. Ahora, la Parte II promete continuar la historia adaptando los arcos restantes de las novelas.\n\nAunque el anuncio no especifica si será una serie de televisión, una película u OVA, el simple hecho de que la producción ya haya comenzado es una noticia que los seguidores de la saga llevaban mucho tiempo esperando.\n\nSi nunca has visto The Irregular at Magic High School, imagina un instituto de magia donde las habilidades mágicas se evalúan como cualquier otra materia. Tatsuya es un estudiante de primer año clasificado como "irregular" (de bajo rendimiento práctico), pero en realidad esconde un poder que podría cambiar el equilibrio del mundo mágico.\n\nLa Parte II ya está en camino. Y los hermanos Shiba tienen mucho más que demostrar.',
    category: 'platform',
    date: '2026-06-05',
    coverUrl: BASE + 'crop1200x630gE9/herald/198332/mahouka-season2.jpg',
    isFeatured: false,
  },

  // ─── 7. Overgeared / Tempal ────────────────────────────────────────
  {
    title: 'Overgeared se convierte en anime: "Tempal" llegará en octubre y esto es todo lo que sabemos',
    slug: 'overgeared-tempal-anime-octubre-detalles',
    excerpt:
      'El webtoon coreano de REDICE Studio se transforma en serie de TV de la mano de J.C. Staff. Tatsumaru Tachibana y Asami Seto protagonizan esta historia de objetos legendarios.',
    content:
      'El universo de los webtoons coreanos sigue conquistando el anime. La última confirmación: Overgeared, el popular webtoon de REDICE Studio, ya tiene adaptación al anime bajo el título Tempal: El Poder de los Objetos, que se estrenará en octubre de la mano del veterano estudio J.C. Staff.\n\nLa historia sigue a Youngwoo, un joven que comienza a jugar un nuevo MMORPG de realidad virtual. Lo que parece un pasatiempo cualquiera se convierte en una aventura épica cuando descubre un objeto legendario que lo transforma en el jugador más poderoso del juego. Pero el poder tiene un precio, y pronto se ve envuelto en conspiraciones que trascienden el mundo virtual.\n\nEl reparto ya está confirmado: Tatsumaru Tachibana y Asami Seto darán voz a los protagonistas. J.C. Staff, el estudio responsable de series icónicas como A Certain Magical Index, Toradora! y Food Wars, está a cargo de la producción.\n\nSi eres fan de los isekai de videojuegos —Sword Art Online, Log Horizon, Overlord—, Overgeared/Tempal tiene todos los ingredientes para convertirse en tu próxima obsesión. Y si vienes del mundo del webtoon, ya sabes de lo que hablamos: una historia adictiva, personajes carismáticos y un sistema de juego que te hará desear que existiera de verdad.\n\nOctubre está más cerca de lo que parece. Empieza a hacer espacio en tu lista de pendientes.',
    category: 'tools',
    date: '2026-06-04',
    coverUrl: BASE + 'crop1200x630gID/cms/news.9/238075/overgeared.jpg',
    isFeatured: false,
  },

  // ─── 8. Mononoke Trilogy ────────────────────────────────────────────
  {
    title: 'Mononoke: la trilogía de cine llega a su fin con una conclusión apoteósica',
    slug: 'mononoke-trilogia-pelicula-final',
    excerpt:
      'La tercera y última película de Mononoke —The Curse of the Serpent— ya está en cines y cierra una de las trilogías de anime más visualmente impactantes de la historia.',
    content:
      'Mononoke regresó por todo lo alto. La franquicia, que comenzó como un arco dentro de la serie Ayakashi: Samurai Horror Tales y luego tuvo su propia serie de televisión en 2007, ha culminado con una trilogía cinematográfica que ha dejado boquiabiertos a crítica y público por igual.\n\nLa tercera entrega, Mononoke The Movie: Chapter III – The Curse of the Serpent, ya está en cines y cierra la historia del Medicine Seller —el vendedor de medicinas de aspecto andrógino que exorcisa monstruos usando la "Espada de la Degradación"— con un broche de oro visual y narrativo.\n\nPara los que no conocen Mononoke: es uno de los animes más bellos jamás creados. Su estilo visual único —que combina ukiyo-e tradicional con diseño contemporáneo—, su narrativa críptica y psicológica, y su protagonista enigmático la convierten en una experiencia que no se parece a nada más.\n\nLa crítica ha alabado la tercera película por ser "visualmente impresionante, musicalmente potente, y llena de misterio sobrenatural y acción". Es, sin duda, un hito en la animación japonesa.\n\nSi eres amante del anime que se atreve a ser diferente, Mononoke es una cita obligada. Y ahora que la trilogía está completa, no hay mejor momento para sumergirse en su mundo hipnótico.\n\nPorque hay historias que no se cuentan: se dibujan. Y Mononoke es una de ellas.',
    category: 'contest',
    date: '2026-06-04',
    coverUrl: BASE + 'crop1200x630gHA/cms/review.2/237933/hebigami.jpg',
    isFeatured: false,
  },
];

async function seedFreshNews() {
  console.log('📰 Sembrando noticias frescas...\n');

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
  console.log('✨ ¡Noticias frescas sembradas correctamente!');
}

seedFreshNews()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
