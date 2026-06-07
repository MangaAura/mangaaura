import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ARTICLES_PHASE_3 } from './seed-blog-articles-phase3-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTHOR_ID = "7e054872-aa97-4f0e-a354-ed7318a51c1f";

function esc(val: string): string {
  return val.replace(/'/g, "''");
}

const lines: string[] = [];
lines.push('-- MangaAura — Artículos SEO Fase 3 (10 artículos)');
lines.push('-- Ejecutar en Neon Console: https://console.neon.tech → SQL Editor');
lines.push('');

for (const a of ARTICLES_PHASE_3) {
  lines.push(`INSERT INTO "NewsArticle" (id, title, slug, excerpt, content, "titleEn", "excerptEn", "contentEn", category, "authorId", "isPublished", "publishedAt", "createdAt", "updatedAt")`);
  lines.push(`SELECT gen_random_uuid(), '${esc(a.title)}', '${esc(a.slug)}', '${esc(a.excerpt)}', '${esc(a.content)}', '${esc(a.titleEn)}', '${esc(a.excerptEn)}', '${esc(a.contentEn)}', '${esc(a.category)}', '${AUTHOR_ID}', true, NOW(), NOW(), NOW()`);
  lines.push(`WHERE NOT EXISTS (SELECT 1 FROM "NewsArticle" WHERE slug = '${esc(a.slug)}');`);
  lines.push('');
}

const outPath = path.join(__dirname, 'seed-blog-articles-phase3.sql');
fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
console.log(`✅ SQL generado: ${outPath}`);
