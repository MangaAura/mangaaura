/**
 * Seed: The Legend of Zelda — Ocarina of Time Switch 2 Remake
 * Noticia factual del Nintendo Direct (9 Junio 2026) vía ANN
 *
 * Uso: npx dotenv-cli -e .env -- npx tsx prisma/seed-zelda-news.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

const url = process.env.DATABASE_URL || '';
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function seedZeldaNews() {
  const admin = await prisma.user.findFirst({
    where: { role: { in: ['ADMIN', 'OWNER'] } },
    select: { id: true },
  });

  if (!admin) {
    console.error('No admin user found');
    process.exit(1);
  }

  const article = {
    title: 'The Legend of Zelda: Ocarina of Time regresa con un remake para Nintendo Switch 2',
    slug: 'zelda-ocarina-of-time-remake-switch-2-anuncio',
    excerpt: 'Nintendo ha anunciado durante su Nintendo Direct de junio de 2026 el remake de uno de los juegos más aclamados de la historia: Ocarina of Time. Llegará a Switch 2 durante este mismo año con gráficos renovados y una nueva experiencia para veteranos y nuevas generaciones.',
    content: [
      'Nintendo ha vuelto a hacerlo. Durante su esperado Nintendo Direct de junio de 2026, la compañía japonesa reveló al mundo el remake de The Legend of Zelda: Ocarina of Time para Nintendo Switch 2, desatando una ola de emoción entre fans de todas las generaciones.',
      '',
      'El título, originalmente lanzado para Nintendo 64 en 1998, está considerado por muchos como el mejor videojuego de la historia. Su influencia en la industria es innegable: estableció el estándar para los juegos de mundo abierto en 3D, introdujo el sistema de bloqueo Z-targeting que luego adoptarían innumerables títulos, y presentó una narrativa que combinaba aventura, misterio y un viaje emocional que aún hoy emociona.',
      '',
      'El tráiler mostrado durante el evento presenta a Link en el conocido Bosque Kokiri, pero con un nivel de detalle que solo la nueva generación de hardware de Nintendo puede ofrecer. La cinemática narrativa, acompañada de la icónica música compuesta por Koji Kondo, muestra al joven héroe empuñando la Espada Maestra y avanzando por el Templo del Tiempo mientras el arte visual se funde con el estilo clásico que los fans recuerdan con cariño.',
      '',
      'Aunque Nintendo no ha revelado detalles técnicos específicos, el tráiler sugiere que se trata de un remake completo — no una simple remasterización — con modelos de personajes rediseñados, texturas en alta definición, iluminación modernizada y una fluidez que promete aprovechar al máximo las capacidades de Switch 2.',
      '',
      'Se espera que el juego llegue durante 2026, aunque la fecha exacta está aún por confirmar. Lo que sí es seguro es que tanto quienes crecieron con la aventura de Link en la N64 como una nueva generación de jugadores podrán experimentar este clásico atemporal como nunca antes.',
    ].join('\n'),
    category: 'mobile' as const,
    date: '2026-06-09T15:17:00.000Z',
    coverUrl: 'https://www.animenewsnetwork.com/thumbnails/crop1200x630gHH/youtube/r8eMoxo4ipE.jpg',
    isFeatured: false,
  };

  const existing = await prisma.newsArticle.findUnique({ where: { slug: article.slug } });
  if (existing) {
    console.log('Ya existe, saltando.');
    await prisma.$disconnect();
    return;
  }

  await prisma.newsArticle.create({
    data: {
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      titleEn: 'The Legend of Zelda: Ocarina of Time Gets Switch 2 Remake',
      excerptEn: 'Remake of 1998 N64 game launches for Switch 2 in 2026',
      coverUrl: article.coverUrl,
      category: article.category,
      authorId: admin.id,
      isPublished: true,
      isFeatured: article.isFeatured,
      publishedAt: new Date(article.date),
    },
  });

  console.log('Creada:', article.title);
  await prisma.$disconnect();
}

seedZeldaNews().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
