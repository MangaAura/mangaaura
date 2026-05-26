/**
 * Keyword Stuffing Checker
 *
 * Scans i18n translation files for potential keyword stuffing — when the same
 * word or phrase appears excessively across translations, which can harm SEO
 * and create a poor user experience.
 *
 * Usage:
 *   npx tsx scripts/check-keyword-stuffing.ts
 *
 * Options:
 *   --threshold=N  Minimum occurrences to flag a word (default: 10)
 *   --min-length=N Minimum word length to consider (default: 4)
 *   --lang=en,es   Comma-separated list of languages to check (default: all)
 */

import * as fs from 'fs';
import * as path from 'path';

interface NestedRecord {
  [key: string]: string | NestedRecord;
}

function flattenValues(obj: NestedRecord, prefix = ''): string[] {
  const values: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      values.push(value);
    } else if (typeof value === 'object' && value !== null) {
      values.push(...flattenValues(value as NestedRecord, fullKey));
    }
  }
  return values;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[¿¡.,;:!?()"'“”‘’\-/\\[\]{}|@#$%^&*+=<>~`]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

interface WordCount {
  word: string;
  count: number;
  examples: string[];
}

function main() {
  const args = process.argv.slice(2);
  const threshold = parseInt(args.find((a) => a.startsWith('--threshold='))?.split('=')[1] || '10', 10);
  const minLength = parseInt(args.find((a) => a.startsWith('--min-length='))?.split('=')[1] || '4', 10);
  const langFilter = args.find((a) => a.startsWith('--lang='))?.split('=')[1]?.split(',') || [];

  const localesDir = path.resolve(__dirname, '../src/i18n/locales');
  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith('.json'));

  let hasIssues = false;

  for (const file of files) {
    const lang = file.replace('.json', '');
    if (langFilter.length > 0 && !langFilter.includes(lang)) continue;

    const content = fs.readFileSync(path.join(localesDir, file), 'utf-8');
    const translations: NestedRecord = JSON.parse(content);

    const values = flattenValues(translations);
    const wordMap = new Map<string, WordCount>();

    for (const text of values) {
      const words = tokenize(text);
      const uniqueWords = new Set(words);

      for (const word of uniqueWords) {
        if (word.length < minLength) continue;
        // Skip common stop words
        const stopWords = new Set([
          'this', 'that', 'with', 'from', 'your', 'para', 'como', 'más',
          'cada', 'todo', 'what', 'when', 'where', 'which', 'their',
          'them', 'they', 'have', 'has', 'had', 'not', 'are', 'was',
          'been', 'some', 'such', 'only', 'also', 'very', 'just',
          'over', 'than', 'then', 'para', 'una', 'una', 'por', 'con',
          'del', 'las', 'los', 'mas', 'pero', 'está', 'esta', 'puede',
          'como', 'para', 'todo', 'cada', 'este', 'más', 'entre',
        ]);
        if (stopWords.has(word)) continue;

        const existing = wordMap.get(word);
        if (existing) {
          existing.count++;
          if (existing.examples.length < 3) {
            existing.examples.push(text.length > 80 ? text.slice(0, 77) + '...' : text);
          }
        } else {
          wordMap.set(word, { word, count: 1, examples: [] });
        }
      }
    }

    const flagged = Array.from(wordMap.values())
      .filter((w) => w.count >= threshold)
      .sort((a, b) => b.count - a.count);

    if (flagged.length > 0) {
      hasIssues = true;
      console.log(`\n=== ${lang.toUpperCase()} (threshold: ${threshold}+, min length: ${minLength}) ===`);
      console.log(`Total translation strings: ${values.length}`);
      console.log(`Unique words scanned: ${wordMap.size}\n`);

      for (const item of flagged) {
        console.log(`  ${item.word.padEnd(20)} ${String(item.count).padStart(4)} veces`);
        if (item.examples.length > 0) {
          for (const ex of item.examples) {
            console.log(`    → "${ex}"`);
          }
          console.log();
        }
      }
    } else {
      console.log(`✓ ${lang.toUpperCase()}: No keyword stuffing detected (threshold: ${threshold})`);
    }
  }

  if (hasIssues) {
    console.log('\n⚠️  Potential keyword stuffing detected. Review flagged words above.');
    console.log('   Consider: using synonyms, varying phrasing, or removing redundant occurrences.');
    process.exit(0); // Non-error exit — this is an advisory check
  } else {
    console.log('\n✅ All languages passed keyword stuffing check.');
  }
}

main();
