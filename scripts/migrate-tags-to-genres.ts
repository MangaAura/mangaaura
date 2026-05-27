import { prisma } from '../src/lib/prisma';

async function migrate() {
  const mangas = await prisma.mangaSeries.findMany({
    select: { id: true, tags: true },
  });

  let count = 0;
  for (const manga of mangas) {
    let tags: string[] = [];
    try {
      tags = JSON.parse(manga.tags || '[]');
    } catch { /* empty */ }

    for (const tagName of tags) {
      const slug = tagName
        .toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (!slug) continue;

      const genre = await prisma.genre.upsert({
        where: { slug },
        create: { name: tagName.toLowerCase().trim(), slug },
        update: {},
      });

      await prisma.mangaGenre.upsert({
        where: { mangaId_genreId: { mangaId: manga.id, genreId: genre.id } },
        create: { mangaId: manga.id, genreId: genre.id },
        update: {},
      });
      count++;
    }
  }

  console.log(`Migración completada: ${count} relaciones género-manga creadas`);
}

migrate()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
