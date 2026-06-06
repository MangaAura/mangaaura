import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const url = process.env.DATABASE_URL || '';
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

const updates: { slug: string; coverUrl: string }[] = [
  {
    slug: 'hunter-x-hunter-volumen-39',
    coverUrl:
      'https://www.animenewsnetwork.com/thumbnails/crop1200x630gP5/cms/news.9/238016/61xdidkuo5l.sl1200.jpg',
  },
  {
    slug: 'attack-on-titan-3-anunciado',
    coverUrl:
      'https://www.animenewsnetwork.com/thumbnails/crop1200x630gL9/youtube/pFK0K6IR-M4.jpg',
  },
  {
    slug: 'gifted-manga-anime-2027',
    coverUrl:
      'https://www.animenewsnetwork.com/thumbnails/crop1200x630gOF/cms/news.9/238136/gifted-anime.jpeg',
  },
  {
    slug: 'overgeared-webtoon-anime-octubre',
    coverUrl:
      'https://www.animenewsnetwork.com/thumbnails/crop1200x630gID/cms/news.9/238075/overgeared.jpg',
  },
  {
    slug: 'animal-signal-shonen-jump',
    coverUrl:
      'https://www.animenewsnetwork.com/thumbnails/crop1200x630gGH/cms/news.9/237991/nextimg-2026-no28b.png.jpg',
  },
  {
    slug: 'palworld-version-10-julio',
    coverUrl:
      'https://www.animenewsnetwork.com/thumbnails/crop1200x630gG5/youtube/gKum7LqFi1s.jpg',
  },
  {
    slug: 'tanya-the-evil-ii-estreno-julio',
    coverUrl:
      'https://www.animenewsnetwork.com/thumbnails/crop1200x630gH3/cms/news.9/238213/tanya-kv-2.jpg',
  },
  {
    slug: 'steinsgate-reboot-gamma-worldline',
    coverUrl:
      'https://www.animenewsnetwork.com/thumbnails/crop1200x630gJ0/youtube/okwY1iijZyc.jpg',
  },
];

async function main() {
  console.log('Actualizando covers de noticias...\n');

  let ok = 0;
  let notFound = 0;

  for (const u of updates) {
    const article = await prisma.newsArticle.findUnique({
      where: { slug: u.slug },
      select: { id: true, coverUrl: true },
    });

    if (!article) {
      console.log(`❌ No encontrado: "${u.slug}"`);
      notFound++;
      continue;
    }

    await prisma.newsArticle.update({
      where: { slug: u.slug },
      data: { coverUrl: u.coverUrl },
    });

    console.log(`✅ "${u.slug}"`);
    ok++;
  }

  console.log(`\n📊 Resultado:`);
  console.log(`   Actualizadas: ${ok}`);
  console.log(`   No encontradas: ${notFound}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
