import { readFileSync } from 'fs';

const pages = ['about-us','guides','announcements','pricing'];

console.log('Página         Antes  Ahora  Mejora');
console.log('─────────────────────────────────────');

for (const p of pages) {
  const old = JSON.parse(readFileSync(`lighthouse-${p}.json`, 'utf8'));
  const now = JSON.parse(readFileSync(`lighthouse-${p}-v2.json`, 'utf8'));
  const oScore = Math.round(old.categories.performance.score * 100);
  const nScore = Math.round(now.categories.performance.score * 100);
  const diff = nScore - oScore;
  const sign = diff >= 0 ? '+' : '';
  console.log(
    p.padEnd(15),
    String(oScore).padEnd(5),
    String(nScore).padEnd(6),
    sign + diff
  );
}

// Also show category breakdown for new scores
console.log('\n📊 Desglose completo (nuevos scores):');
console.log('Página         Rendim.  Accesib.  B.Práct.  SEO');
console.log('──────────────────────────────────────────────────');
for (const p of pages) {
  const now = JSON.parse(readFileSync(`lighthouse-${p}-v2.json`, 'utf8'));
  const c = now.categories;
  console.log(
    p.padEnd(15),
    String(Math.round(c.performance.score * 100)).padEnd(8),
    String(Math.round(c.accessibility.score * 100)).padEnd(9),
    String(Math.round(c['best-practices'].score * 100)).padEnd(9),
    Math.round(c.seo.score * 100)
  );
}
