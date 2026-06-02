/**
 * sync-total-views.ts
 *
 * Recalcula manga.totalViews como SUM(chapter.viewCount) para todos los mangas.
 * Útil después del cambio a que los views se cuenten solo desde analytics.
 *
 * Uso: npm run sync:total-views
 *      npx tsx scripts/sync-total-views.ts
 *
 * Es idempotente — se puede ejecutar múltiples veces sin efectos secundarios.
 */

import { prisma } from '../src/lib/prisma';

const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';
const RESET = '\x1b[0m';

async function main() {
  console.log(`\n${BOLD}${CYAN}══════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}${CYAN}   🔄 Sync: manga.totalViews = SUM(chapter.viewCount)${RESET}`);
  console.log(`${BOLD}${CYAN}══════════════════════════════════════════════${RESET}\n`);

  // ─── 1. Agrupar capítulos por mangaId y sumar viewCount ──────────────
  console.log(`  ${GRAY}📊 Agrupando capítulos...${RESET}`);
  const chapterStats = await prisma.chapter.groupBy({
    by: ['mangaId'],
    _sum: { viewCount: true },
  });

  console.log(`  ${GREEN}✓${RESET} ${chapterStats.length} mangas con capítulos encontrados\n`);

  if (chapterStats.length === 0) {
    console.log(`  ${YELLOW}⚠️  No hay capítulos en la base de datos.${RESET}`);
    return;
  }

  // ─── 2. Obtener valores actuales para comparar ───────────────────────
  const mangaIds = chapterStats.map((c) => c.mangaId);
  const currentMangas = await prisma.mangaSeries.findMany({
    where: { id: { in: mangaIds } },
    select: { id: true, title: true, slug: true, totalViews: true },
  });

  const mangaMap = new Map(currentMangas.map((m) => [m.id, m]));

  // ─── 3. Preparar actualizaciones ─────────────────────────────────────
  const updates: { id: string; title: string; oldViews: number; newViews: number }[] = [];
  let totalDiff = 0;

  for (const stat of chapterStats) {
    const manga = mangaMap.get(stat.mangaId);
    if (!manga) continue;

    const sumViews = stat._sum.viewCount ?? 0;
    const diff = sumViews - manga.totalViews;

    if (diff !== 0) {
      updates.push({
        id: manga.id,
        title: manga.title,
        oldViews: manga.totalViews,
        newViews: sumViews,
      });
      totalDiff += diff;
    }
  }

  // ─── 4. Aplicar actualizaciones ──────────────────────────────────────
  if (updates.length === 0) {
    console.log(`  ${GREEN}✅${RESET} Todos los mangas ya están sincronizados. No hay cambios necesarios.\n`);
    return;
  }

  console.log(`  ${YELLOW}⚠️  ${updates.length} mangas necesitan actualización${RESET}`);
  console.log(`  ${GRAY}   Diferencia total: ${totalDiff > 0 ? '+' : ''}${totalDiff} views${RESET}\n`);

  // Mostrar los que más cambiaron (top 10)
  const sortedUpdates = [...updates].sort((a, b) => Math.abs(b.newViews - b.oldViews) - Math.abs(a.newViews - a.oldViews));
  console.log(`  ${BOLD}Top cambios:${RESET}`);
  for (const u of sortedUpdates.slice(0, 10)) {
    const diff = u.newViews - u.oldViews;
    const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
    const color = diff > 0 ? GREEN : RED;
    console.log(`    ${GRAY}→${RESET} ${u.title.slice(0, 50).padEnd(52)} ${u.oldViews} → ${color}${u.newViews}${RESET} ${GRAY}(${color}${diffStr}${RESET}${GRAY})${RESET}`);
  }
  if (updates.length > 10) {
    console.log(`    ${GRAY}... y ${updates.length - 10} más${RESET}`);
  }

  // Actualizar en batches
  console.log(`\n  ${GRAY}✍️  Actualizando base de datos...${RESET}`);

  const BATCH_SIZE = 50;
  let updated = 0;

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);

    await prisma.$transaction(
      batch.map((u) =>
        prisma.mangaSeries.update({
          where: { id: u.id },
          data: { totalViews: u.newViews },
        })
      )
    );

    updated += batch.length;
    process.stdout.write(`\r  ${GREEN}✓${RESET} ${updated}/${updates.length} actualizados`);
  }

  console.log(`\n\n${BOLD}${GREEN}══════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}${GREEN}   ✅ Sincronización completada${RESET}`);
  console.log(`${BOLD}${GREEN}══════════════════════════════════════════════${RESET}`);
  console.log(`\n  ${GREEN}${updates.length}${RESET} mangas actualizados`);
  console.log(`  ${GREEN}${totalDiff > 0 ? '+' : ''}${totalDiff.toLocaleString()}${RESET} views ajustados en total\n`);

  // Resumen por tipo de cambio
  const increased = updates.filter((u) => u.newViews > u.oldViews).length;
  const decreased = updates.filter((u) => u.newViews < u.oldViews).length;
  if (increased > 0) console.log(`  ${GREEN}↑${RESET} ${increased} mangas aumentaron sus views`);
  if (decreased > 0) console.log(`  ${RED}↓${RESET} ${decreased} mangas disminuyeron sus views`);

  if (decreased > 0) {
    console.log(`\n  ${YELLOW}💡 Los que disminuyeron probablemente tenían visitas de página de manga`);
    console.log(`     que ahora se descuentan (solo cuentan lecturas reales de capítulos).${RESET}`);
  }

  console.log();
}

main()
  .catch((err) => {
    console.error(`\n${RED}Fatal error:${RESET}`, err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
