import { prisma } from '../src/lib/prisma';

function normalizeTag(tag: string): string {
  return tag.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function migrateNormalizeTags() {
  console.log('Starting tag normalization migration...');

  const mangas = await prisma.mangaSeries.findMany({
    select: { id: true, tags: true },
    where: { tags: { not: '[]' } },
  });

  let updated = 0;
  let skipped = 0;

  for (const manga of mangas) {
    try {
      const parsed = JSON.parse(manga.tags) as string[];
      const normalized = parsed.map(normalizeTag);
      const raw = JSON.stringify(normalized);

      if (raw !== manga.tags) {
        await prisma.mangaSeries.update({
          where: { id: manga.id },
          data: { tags: raw },
        });
        updated++;
        console.log(`  Updated manga ${manga.id}: ${manga.tags} -> ${raw}`);
      } else {
        skipped++;
      }
    } catch {
      console.warn(`  Skipped manga ${manga.id}: invalid JSON`);
      skipped++;
    }
  }

  console.log(`\nDone. ${updated} mangas updated, ${skipped} skipped.`);
}

migrateNormalizeTags()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
