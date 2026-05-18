/**
 * check-i18n.ts
 *
 * Escanea el código fuente en busca de llamadas a `t('...')` y verifica
 * que todas las claves existan tanto en `en.json` como en `es.json`.
 *
 * Uso: npx tsx scripts/check-i18n.ts
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join, extname } from 'path';

const PROJECT_ROOT = resolve(__dirname !== '..' ? join(__dirname, '..') : '.');
const LOCALES_DIR = join(PROJECT_ROOT, 'src', 'i18n', 'locales');
const SRC_DIR = join(PROJECT_ROOT, 'src');

// ─── Leer archivos de locale ───────────────────────────────────────────
function loadLocales(): Map<string, Record<string, unknown>> {
  const locales = new Map<string, Record<string, unknown>>();
  const files = readdirSync(LOCALES_DIR).filter((f) => extname(f) === '.json');

  for (const file of files) {
    const lang = file.replace('.json', '');
    const raw = readFileSync(join(LOCALES_DIR, file), 'utf-8');
    locales.set(lang, JSON.parse(raw));
  }

  return locales;
}

// ─── Aplanar claves anidadas ───────────────────────────────────────────
function flattenKeys(
  obj: Record<string, unknown>,
  prefix = ''
): Set<string> {
  const keys = new Set<string>();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const subKey of flattenKeys(value as Record<string, unknown>, fullKey)) {
        keys.add(subKey);
      }
    } else {
      keys.add(fullKey);
    }
  }

  return keys;
}

// ─── Escanear archivos fuente en busca de t('...') ─────────────────────
function scanSourceFiles(dir: string): Set<string> {
  const calls: string[] = [];

  function walk(current: string) {
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '.next') {
          walk(fullPath);
        }
      } else if (
        /\.(tsx?|jsx?)$/.test(entry.name) &&
        !entry.name.endsWith('.d.ts')
      ) {
        const content = readFileSync(fullPath, 'utf-8');
        // Buscar t('...') o t("...")
        const regex = /\bt\((['"`])((?:\\.|(?!\1).)*?)\1/g;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(content)) !== null) {
          const key = match[2];
          // Ignorar placeholders dinámicos (contienen ${...})
          if (!key.includes('${') && !key.includes('+')) {
            calls.push(key);
          }
        }
      }
    }
  }

  walk(dir);
  return new Set(calls);
}

// ─── Main ──────────────────────────────────────────────────────────────
function main() {
  if (!existsSync(LOCALES_DIR)) {
    console.error(`❌ Locales directory not found: ${LOCALES_DIR}`);
    process.exit(1);
  }

  console.log('🔍 Checking i18n translation keys…\n');

  const locales = loadLocales();
  const localeKeys = new Map<string, Set<string>>();

  for (const [lang, data] of locales) {
    localeKeys.set(lang, flattenKeys(data));
    console.log(`  📁 ${lang}.json — ${localeKeys.get(lang)!.size} keys`);
  }

  console.log('\n📂 Scanning source files for t() calls…');
  const usedKeys = scanSourceFiles(SRC_DIR);
  console.log(`  🔑 ${usedKeys.size} unique keys found in source\n`);

  // ─── Verificar claves faltantes ────────────────────────────────────
  let hasErrors = false;
  const allLocaleLangs = [...localeKeys.keys()];

  for (const key of usedKeys) {
    for (const lang of allLocaleLangs) {
      const keys = localeKeys.get(lang)!;
      if (!keys.has(key)) {
        console.log(`  ❌ Missing: "${key}" in ${lang}.json`);
        hasErrors = true;
      }
    }
  }

  // ─── Verificar claves no usadas ────────────────────────────────────
  for (const lang of allLocaleLangs) {
    const keys = localeKeys.get(lang)!;
    for (const key of keys) {
      if (!usedKeys.has(key)) {
        console.log(`  🟡 Unused: "${key}" in ${lang}.json`);
      }
    }
  }

  console.log('');
  if (hasErrors) {
    console.log('❌ Some translation keys are missing!');
    process.exit(1);
  } else {
    console.log('✅ All translation keys are present in all locales.');
  }
}

main();
