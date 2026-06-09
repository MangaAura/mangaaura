/**
 * Seed masivo: Nintendo Direct Junio 2026 + noticias de anime
 * 8 artículos factuales de ANN con storytelling en español
 *
 * Uso: npx dotenv-cli -e .env -- npx tsx prisma/seed-direct-news.ts
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
  titleEn: string;
  excerptEn: string;
  isFeatured: boolean;
}

const THUMBS = 'https://www.animenewsnetwork.com/thumbnails/';

const articles: NewsSeed[] = [
  // ─── 1. Fire Emblem: Fortune's Weave ──────────────────────────────
  {
    title: "Fire Emblem: Fortune's Weave — nuevo tráiler revela 4 héroes y fecha de lanzamiento en septiembre",
    slug: 'fire-emblem-fortunes-weave-trailer-4-heroes-septiembre',
    excerpt: "Nintendo ha mostrado un nuevo tráiler de Fire Emblem: Fortune's Weave durante el Nintendo Direct, revelando a cuatro nuevos héroes y confirmando que el juego llegará a Switch 2 el 17 de septiembre.",
    content: [
      "La saga de estrategia por excelencia de Nintendo está de vuelta. Durante el Nintendo Direct de junio de 2026, la compañía mostró un nuevo y extenso tráiler de Fire Emblem: Fortune's Weave, la próxima entrega de la legendaria serie de rol táctico.",
      '',
      'El tráiler nos presenta a cuatro nuevos héroes que protagonizarán la historia: Cai, un joven espadachín de mirada determinada; Dietrich, un imponente caballero de armadura pesada; Theodora, una misteriosa maga de élite; y Leda, una arquera de passado incierto. Cada uno con su propio estilo de combate y motivaciones que, como es tradición en Fire Emblem, se entrelazarán a lo largo de una narrativa llena de giros políticos y batallas decisivas.',
      '',
      "La historia de Fortune's Weave gira en torno al tapiz del destino, un artefacto milenario capaz de reescribir la realidad. Los reinos de Alderac y Valdoria están al borde de la guerra, y solo un grupo de héroes unidos por el hilo del destino podrá evitar la catástrofe.",
      '',
      "Fire Emblem: Fortune's Weave se lanzará para Nintendo Switch 2 el 17 de septiembre de 2026. Los primeros análisis ya apuntan a que podría tratarse de uno de los títulos más ambiciosos de Intelligent Systems en años, con nuevas mecánicas de combate que expanden el sistema de armas y habilidades de entregas anteriores.",
    ].join('\n'),
    category: 'mobile',
    date: '2026-06-09T16:24:00.000Z',
    coverUrl: THUMBS + 'crop1200x630gH9/youtube/Rl5_C4sc5zk.jpg',
    titleEn: "Fire Emblem: Fortune's Weave Game's Trailer Reveals 4 Heroes, September 17 Release",
    excerptEn: 'Video previews heroes Cai, Dietrich, Theodora, Leda',
    isFeatured: false,
  },

  // ─── 2. Kingdom Hearts IV Switch 2 ─────────────────────────────────
  {
    title: 'Kingdom Hearts IV llegará a Nintendo Switch 2 — Square Enix revela colección completa de la saga',
    slug: 'kingdom-hearts-iv-switch-2-anuncio-coleccion',
    excerpt: 'Square Enix ha anunciado durante el Nintendo Direct que Kingdom Hearts IV llegará a Switch 2, junto con una colección que reúne las entregas principales de la saga para la nueva consola.',
    content: [
      'El momento que los fans de Kingdom Hearts estaban esperando por fin ha llegado. Durante el Nintendo Direct de junio de 2026, Square Enix confirmó que Kingdom Hearts IV se lanzará para Nintendo Switch 2 el mismo día que en PlayStation 5, Xbox Series X|S y PC.',
      '',
      'Aunque la compañía no especificó la fecha de lanzamiento exacta, el tráiler mostrado durante el evento dejó claro que el juego luce espectacular en la nueva consola de Nintendo. Las escenas de Sora explorando el mundo de Quadratum —el impactante escenario inspirado en el Shibuya de la vida real— se ven más detalladas que nunca.',
      '',
      'Pero eso no es todo. Square Enix también anunció Kingdom Hearts Collection [I~III] para Switch 2, PS5, Xbox Series X|S y PC, que incluye las versiones HD de las tres entregas principales de la saga. Esta colección se lanzará el 8 de octubre, justo a tiempo para que los nuevos jugadores se pongan al día antes del lanzamiento de Kingdom Hearts IV.',
      '',
      'Kingdom Hearts IV representa un nuevo comienzo para la serie, con la "Lost Master Arc" que sigue a Sora en un mundo que mezcla la realidad de Tokio con el estilo mágico y Disney que caracteriza la franquicia. El juego utiliza Unreal Engine 5 para ofrecer un salto gráfico generacional.',
    ].join('\n'),
    category: 'mobile',
    date: '2026-06-09T15:39:00.000Z',
    coverUrl: THUMBS + 'crop1200x630gY0/youtube/kIpQz_9zQS0.jpg',
    titleEn: "Square Enix Announces Kingdom Hearts IV Game's Switch 2 Release With Trailer; Kingdom Hearts Collection [I~III] for Switch 2, PS5, Xbox X|S, PC",
    excerptEn: 'Collection with previous HD Kingdom Hearts releases launches on October 8',
    isFeatured: false,
  },

  // ─── 3. Xenoblade Genesis ──────────────────────────────────────────
  {
    title: 'Xenoblade Genesis anunciado para Switch 2 — Monolith Soft prepara el salto a 2027 con una nueva épica',
    slug: 'xenoblade-genesis-switch-2-anuncio-2027',
    excerpt: 'Nintendo ha anunciado Xenoblade Genesis, un nuevo título de la aclamada serie de rol de Monolith Soft, junto con versiones mejoradas de Xenoblade Chronicles para Switch 2.',
    content: [
      'Monolith Soft ha vuelto a hacerlo. Durante el Nintendo Direct de junio de 2026, Nintendo anunció Xenoblade Genesis, una nueva entrega de la saga Xenoblade que llegará a Nintendo Switch 2 en 2027.',
      '',
      'El tráiler, narrado y con subtítulos en inglés, muestra un mundo completamente nuevo con paisajes que desafían la imaginación: llanuras infinitas flotando sobre un mar de nubes, criaturas colosales surcando los cielos y una arquitectura que fusiona lo orgánico con lo mecánico en el estilo característico de la serie.',
      '',
      'Pero las noticias no terminan ahí. Nintendo también anunció Switch 2 Editions para tres títulos de Xenoblade Chronicles: Xenoblade Chronicles: Definitive Edition, Xenoblade Chronicles 2 y Xenoblade Chronicles 3. Estas versiones incluirán mejoras gráficas y de rendimiento adaptadas a la nueva consola.',
      '',
      'Xenoblade Genesis promete llevar la serie a nuevas alturas, aprovechando el hardware de Switch 2 para ofrecer mundos aún más vastos y detallados. Los fans de Monolith Soft tienen motivos de sobra para marcar 2027 en el calendario.',
    ].join('\n'),
    category: 'mobile',
    date: '2026-06-09T16:10:00.000Z',
    coverUrl: THUMBS + 'crop1200x630gLC/youtube/ttLdz0wGjmc.jpg',
    titleEn: 'Nintendo Announces Xenoblade Genesis Game, Switch 2 Editions for 3 Xenoblade Chronicles Titles',
    excerptEn: 'Trailer reveals 2027 Switch 2 launch for Xenoblade Genesis',
    isFeatured: false,
  },

  // ─── 4. Dragon's Dogma 2 Switch 2 ──────────────────────────────────
  {
    title: "Dragon's Dogma 2 aterriza en Switch 2 con la expansión Dark Arisen incluida",
    slug: 'dragons-dogma-2-switch-2-dark-arisen-octubre',
    excerpt: "Capcom ha anunciado la versión para Switch 2 de Dragon's Dogma 2, que incluirá la nueva expansión \"Dark Arisen\" y llegará el 9 de octubre.",
    content: [
      "El regreso de una de las franquicias más queridas de Capcom continúa expandiéndose. Durante el Nintendo Direct de junio de 2026, la compañía anunció que Dragon's Dogma 2 llegará a Nintendo Switch 2 el 9 de octubre, e incluirá la nueva expansión \"Dark Arisen\" como parte del paquete.",
      '',
      "Dragon's Dogma 2: Dark Arisen no es solo un port. La versión para Switch 2 incluirá el juego base completo y la nueva expansión que añade contenido inédito, nuevas criaturas, mazmorras y una historia que amplía el lore del mundo de Gransys. La expansión también estará disponible para otras plataformas.",
      '',
      'El juego original, lanzado en 2024 para PS5, Xbox Series X|S y PC, fue aclamado por su sistema de combate dinámico, su mundo abierto lleno de misterios y su innovador sistema de peones —compañeros controlados por IA que aprenden de otros jugadores. La versión para Switch 2 promete mantener toda esa experiencia con gráficos optimizados para la nueva consola.',
      '',
      'Esta noticia llega como parte de una oleada de anuncios de Capcom durante el Direct, que también incluyó Devil May Cry 5: Devil Hunter Edition y Onimusha: Way of the Sword para Switch 2.',
    ].join('\n'),
    category: 'mobile',
    date: '2026-06-09T17:30:00.000Z',
    coverUrl: THUMBS + 'crop1200x630gI0/youtube/6ETzS9wQl7Q.jpg',
    titleEn: "Dragon's Dogma 2 Game Gets Switch 2 Version With New 'Dark Arisen' Expansion",
    excerptEn: 'Game launches for Switch 2 on October 9, Dark Arisen expansion also launches for other systems',
    isFeatured: false,
  },

  // ─── 5. Metaphor: ReFantazio Switch 2 ──────────────────────────────
  {
    title: 'Metaphor: ReFantazio de Atlus llega a Switch 2 el 12 de noviembre',
    slug: 'metaphor-refantazio-switch-2-noviembre',
    excerpt: 'El aclamado RPG de Atlus y Studio Zero, Metaphor: ReFantazio, se lanzará para Nintendo Switch 2 el 12 de noviembre, llevando su mundo de fantasía política a la nueva consola.',
    content: [
      'Atlus y Studio Zero han confirmado durante el Nintendo Direct de junio de 2026 que Metaphor: ReFantazio, el aclamado RPG de fantasía que conquistó a crítica y público en 2024, llegará a Nintendo Switch 2 el 12 de noviembre.',
      '',
      'Metaphor: ReFantazio representa una nueva IP de los creadores de Persona y Shin Megami Tensei. Ambientado en un mundo de fantasía donde la realidad y la imaginación se entrelazan, el juego sigue a un joven que se embarca en un viaje para romper una maldición mortal mientras compite en una contienda real por el trono.',
      '',
      'El juego destaca por su innovador sistema de combate que combina acción en tiempo real con batallas por turnos, y por su impresionante dirección artística que fusiona el estilo de Kazuma Kaneko con una estética de fantasía europea. Originalmente lanzado en PlayStation 4, PlayStation 5, Xbox Series X|S y PC, Metaphor: ReFantazio fue nominado a múltiples premios Juego del Año.',
      '',
      'Con esta llegada a Switch 2, los jugadores de Nintendo podrán disfrutar de uno de los RPG más aclamados de los últimos años. Atlus no ha confirmado si habrá contenido exclusivo, pero el juego incluirá todas las actualizaciones y mejoras publicadas hasta la fecha.',
    ].join('\n'),
    category: 'mobile',
    date: '2026-06-09T19:42:00.000Z',
    coverUrl: THUMBS + 'crop1200x630gY6/youtube/qJv9Yud-1U4.jpg',
    titleEn: 'Metaphor: ReFantazio Game Gets Switch 2 Release on November 12',
    excerptEn: "Atlus, Studio Zero's game launched on PS4/5, Xbox X|S, PC in October 2024",
    isFeatured: false,
  },

  // ─── 6. I Want to Love You Till Your Dying Day ──────────────────────
  {
    title: 'I Want to Love You Till Your Dying Day: el anime romántico más esperado del verano se estrena el 7 de julio',
    slug: 'i-want-to-love-you-till-your-dying-day-anime-julio',
    excerpt: 'La adaptación al anime del aclamado manga de Nachi Aono se estrena el 7 de julio con ReoNa interpretando el opening y sajou no hana en el ending.',
    content: [
      'Uno de los manga románticos más aclamados de los últimos años finalmente tiene fecha de estreno en anime. I Want to Love You Till Your Dying Day (Kimi ga Shinu made Koi wo Shitai) debutará el 7 de julio de 2026, y los detalles revelados durante el evento prometen una adaptación a la altura de las expectativas.',
      '',
      'La producción ha confirmado que ReoNa —conocida por sus temas en Sword Art Online y The Angel Next Door Spoils Me Rotten— interpretará el opening "Amore", una canción que promete capturar la esencia agridulce de la historia. Por su parte, sajou no hana se encargará del ending "Éternel", continuando su trayectoria como uno de los grupos más queridos del anime romántico.',
      '',
      'El segundo vídeo promocional, revelado junto con el cartel oficial, muestra escenas que ya están haciendo llorar a los fans del manga: los momentos cotidianos entre los protagonistas, las miradas cómplices y esa atmósfera de melancolía que impregna cada página de la obra original.',
      '',
      'La historia sigue a una joven que sabe que le queda poco tiempo de vida y decide aprovechar cada momento al lado de la persona que ama. Una premisa que podría sonar trillada en otras manos, pero que Nachi Aono convierte en una exploración profunda y conmovedora sobre el amor, la pérdida y la belleza de los instantes efímeros.',
    ].join('\n'),
    category: 'platform',
    date: '2026-06-09T12:04:00.000Z',
    coverUrl: THUMBS + 'crop1200x630gHJ/cms/news.9/238313/shinu.jpg',
    titleEn: "I Want to Love You Till Your Dying Day Anime's 2nd Video Unveils Theme Songs, July 7 Debut",
    excerptEn: 'ReoNa performs "Amore" opening song, sajou no hana performs "Éternel" ending song',
    isFeatured: false,
  },

  // ─── 7. Cyborg 009: Nemesis ────────────────────────────────────────
  {
    title: 'Mamoru Miyano se une a Cyborg 009: Nemesis como el Cyborg 002 — la nueva serie de verano',
    slug: 'cyborg-009-nemesis-mamoru-miyano-cyborg-002',
    excerpt: 'La nueva serie de Ishimori Production suma a Mamoru Miyano como Jet Link, el Cyborg 002 capaz de volar a Mach 5. La serie llegará este verano.',
    content: [
      'El legendario Cyborg 009 regresa con una serie completamente nueva, y lo hace con un reparto de lujo. Ishimori Production ha anunciado que Mamoru Miyano —una de las voces más icónicas de la industria, conocida por sus papeles en Death Note, Steins;Gate y Mobile Suit Gundam 00— interpretará a Cyborg 002, también conocido como Jet Link.',
      '',
      'Cyborg 002 es el velocista del equipo: capaz de volar a velocidad Mach 5, sus habilidades lo convierten en el explorador ideal y en el primero en llegar al campo de batalla. Miyano aportará su característica energía y carisma a este personaje que ha sido uno de los favoritos de los fans desde la creación original de Shōtarō Ishinomori.',
      '',
      'La serie, titulada Cyborg 009: Nemesis, sigue a un grupo de nueve individuos secuestrados por una organización global conocida como Black Ghost, que busca dominar el mundo. Convertidos en cyborgs contra su voluntad, los nueve héroes deberán unir sus fuerzas para detener los planes de la organización que los creó.',
      '',
      'La producción promete una animación moderna que respeta el diseño clásico de los personajes, combinando la estética original de Ishinomori con técnicas de animación digital contemporáneas. La serie se estrenará durante la temporada de verano de 2026, aunque la fecha exacta está aún por confirmar.',
    ].join('\n'),
    category: 'platform',
    date: '2026-06-09T06:09:00.000Z',
    coverUrl: THUMBS + 'crop1200x630gO7/cms/news.9/238306/002.jpg',
    titleEn: 'Cyborg 009: Nemesis Anime Casts Mamoru Miyano as Cyborg 002',
    excerptEn: 'Miyano voices Jet Link, who can fly at Mach 5, in summer series',
    isFeatured: false,
  },

  // ─── 8. FromSoftware's The Duskbloods ──────────────────────────────
  {
    title: 'The Duskbloods: el nuevo juego PvPvE de FromSoftware tendrá beta cerrada en verano — exclusivo de Switch 2',
    slug: 'the-duskbloods-fromsoftware-switch-2-beta-verano',
    excerpt: 'FromSoftware ha revelado The Duskbloods, un PvPvE multiplayer exclusivo para Switch 2 que tendrá una Closed Network Test este verano antes de su lanzamiento en 2026.',
    content: [
      'FromSoftware, los creadores de Dark Souls, Elden Ring y Sekiro, están trabajando en algo completamente nuevo y, para sorpresa de muchos, será exclusivo de Nintendo Switch 2. The Duskbloods es un juego de acción PvPvE multijugador que promete llevar la fórmula del estudio a un territorio nunca antes explorado.',
      '',
      'Revelado durante el Nintendo Direct de junio de 2026, el tráiler muestra un mundo oscuro y atmosférico donde los jugadores controlan a un Bloodsworn —guerreros unidos por un juramento de sangre— y luchan contra enemigos y otros jugadores en un mundo que combina la estética gótica característica de FromSoftware con un diseño más colorido y dinámico.',
      '',
      'El juego tendrá una Closed Network Test durante el verano de 2026, permitiendo a los jugadores probar los servidores y la jugabilidad antes del lanzamiento completo, previsto para finales de 2026. Esta será la primera vez que FromSoftware se aventura en el territorio de las exclusivas de Nintendo, lo que representa un hito tanto para el estudio como para la plataforma.',
      '',
      'Los detalles sobre las mecánicas específicas son aún limitados, pero las primeras impresiones apuntan a un juego que combina el combate táctico característico de FromSoftware con elementos de extracción y progresión en un mundo persistente.',
    ].join('\n'),
    category: 'mobile',
    date: '2026-06-09T18:30:00.000Z',
    coverUrl: THUMBS + 'crop1200x630gF0/youtube/d0ij2uQ87nc.jpg',
    titleEn: "FromSoftware's The Duskbloods Switch 2 Game Gets Closed Network Test in Summer",
    excerptEn: 'Game launches exclusively for Switch 2 in 2026',
    isFeatured: false,
  },
];

async function seedDirectNews() {
  const admin = await prisma.user.findFirst({
    where: { role: { in: ['ADMIN', 'OWNER'] } },
    select: { id: true },
  });

  if (!admin) {
    console.error('No admin user found');
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const art of articles) {
    const existing = await prisma.newsArticle.findUnique({ where: { slug: art.slug } });
    if (existing) {
      console.log('SKIP:', art.slug);
      skipped++;
      continue;
    }

    await prisma.newsArticle.create({
      data: {
        title: art.title,
        slug: art.slug,
        excerpt: art.excerpt,
        content: art.content,
        titleEn: art.titleEn,
        excerptEn: art.excerptEn,
        coverUrl: art.coverUrl,
        category: art.category,
        authorId: admin.id,
        isPublished: true,
        isFeatured: art.isFeatured,
        publishedAt: new Date(art.date),
      },
    });

    console.log('CREATE:', art.slug);
    created++;
  }

  console.log(`\nHecho: ${created} creadas, ${skipped} saltadas`);
  await prisma.$disconnect();
}

seedDirectNews().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
