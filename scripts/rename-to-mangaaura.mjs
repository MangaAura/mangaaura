#!/usr/bin/env node
/**
 * Renombra inkverse → mangaaura en todo el proyecto
 * Uso: node scripts/rename-to-mangaaura.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', '.next', 'src/generated',
  'coverage', '.vercel', 'out', '.storybook',
]);

const EXCLUDE_FILES = new Set([
  'package-lock.json',
]);

const REPLACEMENTS = [
  // Brand name (PascalCase) - user facing
  [/MangaAura/g, 'MangaAura'],

  // Typo variant
  [/MangaAura/g, 'MangaAura'],

  // Uppercase watermark
  [/MANGA AURA/g, 'MANGA AURA'],

  // Code identifiers (lowercase) for:
  // localStorage keys, cache keys, IndexedDB names, SW caches
  [/mangaaura-/g, 'mangaaura-'],
  [/mangaaura_/g, 'mangaaura_'],

  // Domain URLs (https://)
  [/https:\/\/inkverse\.app/g, 'https://mangaaura.es'],
  [/'inkverse\.app'/g, "'mangaaura.es'"],
  [/"inkverse\.app"/g, '"mangaaura.es"'],

  // CDN domains
  [/images\.inkverse\.com/g, 'images.mangaaura.es'],
  [/cdn\.inkverse\.com/g, 'cdn.mangaaura.es'],

  // Email addresses @mangaaura.es
  [/@mangaaura\.app/g, '@mangaaura.es'],

  // Email addresses @mangaaura.es (seed data)
  [/@mangaaura\.com/g, '@mangaaura.es'],

  // Social handles
  [/github\.com\/inkverse/g, 'github.com/mangaaura'],
  [/twitter\.com\/inkverse/g, 'twitter.com/mangaaura'],
  [/\@mangaaura/g, '@mangaaura'],
  [/discord\.gg\/inkverse/g, 'discord.gg/mangaaura'],

  // Sentry project
  [/mangaaura-web/g, 'mangaaura-web'],

  // Docker names (in docker-compose.yml only)
  [/mangaaura_network/g, 'mangaaura_network'],
  [/mangaaura_postgres/g, 'mangaaura_postgres'],
  [/mangaaura_mongo/g, 'mangaaura_mongo'],
  [/mangaaura_redis/g, 'mangaaura_redis'],

  // MongoDB database names
  [/mangaaura_dev/g, 'mangaaura_dev'],
  [/mangaaura_analytics/g, 'mangaaura_analytics'],
];

function shouldExclude(filePath) {
  const relative = path.relative(ROOT, filePath);
  const parts = relative.split(path.sep);
  return parts.some(p => EXCLUDE_DIRS.has(p)) || EXCLUDE_FILES.has(path.basename(filePath));
}

function processFile(filePath) {
  if (shouldExclude(filePath)) return 0;

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;
    let changed = false;

    for (const [pattern, replacement] of REPLACEMENTS) {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf-8');
      const matches = [...original.matchAll(new RegExp(
        REPLACEMENTS.map(([p]) => p.source).join('|'), 'g'
      ))];
      return matches.length;
    }
    return 0;
  } catch (err) {
    if (err.code === 'ENOENT') return 0;
    if (err.code === 'EISDIR') return 0;
    console.error(`  Error: ${filePath}: ${err.message}`);
    return 0;
  }
}

function walkDir(dir) {
  let totalChanges = 0;
  let fileCount = 0;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.has(entry.name)) {
          const [c, f] = walkDir(fullPath);
          totalChanges += c;
          fileCount += f;
        }
      } else if (entry.isFile()) {
        const changes = processFile(fullPath);
        if (changes > 0) {
          console.log(`  ${path.relative(ROOT, fullPath)} (${changes} cambios)`);
          fileCount++;
          totalChanges += changes;
        }
      }
    }
  } catch (err) {
    console.error(`  Error walking ${dir}: ${err.message}`);
  }

  return [totalChanges, fileCount];
}

console.log('╔════════════════════════════════════════╗');
console.log('║  Renombrando MangaAura → MangaAura     ║');
console.log('╚════════════════════════════════════════╝\n');

const [totalChanges, fileCount] = walkDir(ROOT);

console.log(`\n✅ Hecho! ${fileCount} archivos modificados, ${totalChanges} reemplazos.`);
console.log('\n⚠️  Archivos que requieren edición manual:');
console.log('  1. package.json → "name": "mangaaura"');
console.log('  2. package-lock.json → "name": "mangaaura"');
console.log('  3. .env* → URLs de MongoDB, etc.');
console.log('  4. docker-compose.yml → imagen/container names');
console.log('  5. AGENTS.md si existe');
console.log('\n▶️  node scripts/rename-to-mangaaura.mjs');
