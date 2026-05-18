/**
 * auto-translate.ts
 *
 * Encuentra claves de traducción que existen en un idioma pero faltan en otro,
 * y las traduce automáticamente usando Google Translate (gratis, sin API key).
 *
 * Uso:
 *   npx tsx scripts/auto-translate.ts                  # Traduce en→es (default)
 *   npx tsx scripts/auto-translate.ts --source en --target es
 *   npx tsx scripts/auto-translate.ts --dry-run         # Solo mostrar, no escribir
 *   npx tsx scripts/auto-translate.ts --key home.welcome  # Traducir una sola clave
 */

import { translate } from '@vitalets/google-translate-api';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const PROJECT_ROOT = resolve(__dirname !== '..' ? join(__dirname, '..') : '.');
const LOCALES_DIR = join(PROJECT_ROOT, 'src', 'i18n', 'locales');

// ─── CLI args ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const sourceLang = args.includes('--source') ? args[args.indexOf('--source') + 1] : 'en';
const targetLang = args.includes('--target') ? args[args.indexOf('--target') + 1] : 'es';
const dryRun = args.includes('--dry-run');
const singleKey = args.includes('--key') ? args[args.indexOf('--key') + 1] : null;

// ─── Helpers ───────────────────────────────────────────────────────────
function flattenKeys(
  obj: Record<string, unknown>,
  prefix = ''
): Map<string, string> {
  const map = new Map<string, string>();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = flattenKeys(value as Record<string, unknown>, fullKey);
      for (const [k, v] of nested) map.set(k, v);
    } else {
      map.set(fullKey, String(value));
    }
  }

  return map;
}

function setNestedValue(
  obj: Record<string, unknown>,
  keyPath: string,
  value: string
): void {
  const parts = keyPath.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}

function loadJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function saveJson(path: string, data: Record<string, unknown>): void {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// ─── Placeholder protection ───────────────────────────────────────────
// Google Translate can mangle interpolation placeholders like {level}.
// We replace them with unique tokens before translating and restore after.
function protectPlaceholders(text: string): { safe: string; map: Map<string, string> } {
  const map = new Map<string, string>();
  let idx = 0;
  const safe = text.replace(/\{(\w+)\}/g, (_, key) => {
    const token = `__PH${idx}__`;
    map.set(token, `{${key}}`);
    idx++;
    return token;
  });
  return { safe, map };
}

function restorePlaceholders(text: string, map: Map<string, string>): string {
  let result = text;
  for (const [token, original] of map) {
    // Escape special regex chars (just in case) and replace globally
    result = result.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), original);
  }
  return result;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Translate with retry ──────────────────────────────────────────────
async function translateWithRetry(
  text: string,
  from: string,
  to: string,
  retries = 3
): Promise<string> {
  // Proteger placeholders antes de traducir
  const { safe, map } = protectPlaceholders(text);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await translate(safe, { from, to });
      // Restaurar placeholders
      return restorePlaceholders(result.text, map);
    } catch (err: any) {
      if (attempt < retries) {
        const wait = 3000 * (attempt + 1);
        console.log(`    ⚠️  Retry ${attempt + 1}/${retries} in ${wait / 1000}s…`);
        await sleep(wait);
      } else {
        throw err;
      }
    }
  }

  throw new Error('Unexpected: all retries exhausted');
}

// ─── Main ──────────────────────────────────────────────────────────────
async function main() {
  const sourceFile = join(LOCALES_DIR, `${sourceLang}.json`);
  const targetFile = join(LOCALES_DIR, `${targetLang}.json`);

  if (!existsSync(sourceFile)) {
    console.error(`❌ Source file not found: ${sourceFile}`);
    process.exit(1);
  }
  if (!existsSync(targetFile)) {
    console.error(`❌ Target file not found: ${targetFile}`);
    process.exit(1);
  }

  console.log(`🔍 Comparing ${sourceLang}.json → ${targetLang}.json…\n`);

  const sourceData = loadJson(sourceFile);
  const targetData = loadJson(targetFile);

  const sourceKeys = flattenKeys(sourceData);
  const targetKeys = flattenKeys(targetData);

  // Encontrar claves en source que faltan en target
  const missingKeys: string[] = [];

  if (singleKey) {
    if (!sourceKeys.has(singleKey)) {
      console.error(`❌ Key "${singleKey}" not found in ${sourceLang}.json`);
      process.exit(1);
    }
    if (!targetKeys.has(singleKey)) {
      missingKeys.push(singleKey);
    } else {
      console.log(`✅ Key "${singleKey}" already exists in ${targetLang}.json`);
      process.exit(0);
    }
  } else {
    for (const [key] of sourceKeys) {
      if (!targetKeys.has(key)) {
        missingKeys.push(key);
      }
    }
  }

  if (missingKeys.length === 0) {
    console.log('✅ No missing keys found. All translations are complete!');
    process.exit(0);
  }

  console.log(
    `📝 Found ${missingKeys.length} missing key(s) in ${targetLang}.json:\n`
  );

  const translated = new Map<string, string>();
  let failed = 0;

  for (let i = 0; i < missingKeys.length; i++) {
    const key = missingKeys[i];
    const sourceValue = sourceKeys.get(key)!;

    try {
      console.log(`  [${i + 1}/${missingKeys.length}] Translating "${key}"…`);
      const translatedText = await translateWithRetry(
        sourceValue,
        sourceLang,
        targetLang
      );
      translated.set(key, translatedText);

      if (i < missingKeys.length - 1) await sleep(1500);
    } catch (err: any) {
      console.error(`  ❌ Failed to translate "${key}": ${err.message}`);
      failed++;
    }
  }

  console.log('');

  if (dryRun) {
    console.log('🔍 DRY RUN — no files were modified. Translations:');
    for (const [key, value] of translated) {
      const sourceValue = sourceKeys.get(key);
      console.log(`  ${key}: "${sourceValue}" → "${value}"`);
    }
  } else {
    // Escribir traducciones al archivo target
    for (const [key, value] of translated) {
      setNestedValue(targetData, key, value);
    }
    saveJson(targetFile, targetData);
    console.log(
      `✅ Written ${translated.size} translations to ${targetLang}.json`
    );
  }

  if (failed > 0) {
    console.log(`⚠️  ${failed} translation(s) failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
