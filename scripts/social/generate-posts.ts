/**
 * Genera posts para redes sociales a partir de los artículos del blog de MangaAura.
 * No requiere conexión a BD — usa los datos de artículos conocidos.
 * Todos los tweets respetan el límite de 280 caracteres de X.
 * Los URLs nunca se truncan — X los acorta a 23 caracteres via t.co.
 *
 * Uso: npx tsx scripts/social/generate-posts.ts
 *
 * Salida: ./out/posts-[fecha].md
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';
const MAX_TWEET_LENGTH = 280;
const TCO_LENGTH = 23; // Twitter acorta todos los HTTPS URLs a 23 caracteres

const ARTICLES = [
  {
    title: "Dónde leer manga online gratis y legal en español en 2026",
    slug: "donde-leer-manga-online-gratis-legal-2026",
    excerpt: "Descubre las mejores plataformas para leer manga online gratis y de forma legal en español. Comparamos MangaPlus, Webtoon, MangaAura y otras alternativas para que elijas la mejor.",
    category: "platform",
  },
  {
    title: "Cómo crear tu propio manga: guía completa para publicar online",
    slug: "como-crear-tu-propio-manga-guia-completa-2026",
    excerpt: "Aprende cómo crear tu propio manga desde cero. Te explicamos el proceso completo: guion, dibujo, herramientas digitales, IA, y las mejores plataformas para publicar online.",
    category: "guides",
  },
  {
    title: "Gamificación en la lectura: cómo el XP y los logros transforman tu experiencia manga",
    slug: "gamificacion-lectura-xp-logros-manga",
    excerpt: "Descubre cómo la gamificación está revolucionando la lectura de manga. Los sistemas de XP, logros, clanes y rankings convierten cada capítulo en una aventura.",
    category: "features",
  },
  {
    title: "Guía de géneros de manga: shonen, shojo, seinen y más explicados",
    slug: "guia-generos-manga-shonen-shojo-seinen",
    excerpt: "Explora los principales géneros de manga: shonen, shojo, seinen, josei y más. Te explicamos sus características, ejemplos imprescindibles y cómo elegir tu próximo manga.",
    category: "guides",
  },
  {
    title: "Manga vs Webtoon: diferencias, ventajas y cuál elegir según tu estilo",
    slug: "manga-vs-webtoon-diferencias-ventajas",
    excerpt: "¿Manga o webtoon? Analizamos las diferencias clave entre ambos formatos: lectura, creación, monetización y cuál se adapta mejor a cada tipo de lector y creador.",
    category: "comparison",
  },
];

/** Calcula la longitud que tendrá el tweet en X, contando URLs como 23 caracteres */
function twitterLength(text: string): number {
  const urlRegex = /https?:\/\/\S+/g;
  let result = text;
  for (const match of text.match(urlRegex) || []) {
    result = result.replace(match, '_'.repeat(TCO_LENGTH));
  }
  return result.length;
}

/** Trunca el texto ANTES del URL para que quepa en 280 caracteres de X */
function fitTweet(textWithUrl: string): string {
  const urlMatch = textWithUrl.match(/(https?:\/\/\S+)$/);
  if (!urlMatch) {
    // Sin URL, truncar normal
    if (twitterLength(textWithUrl) <= MAX_TWEET_LENGTH) return textWithUrl;
    return textWithUrl.slice(0, MAX_TWEET_LENGTH - 3) + '...';
  }

  const url = urlMatch[1];
  const before = textWithUrl.slice(0, -url.length);
  const beforeLen = twitterLength(before);
  const urlLen = TCO_LENGTH;
  const totalLen = beforeLen + (before ? 2 : 0) + urlLen; // +2 por el salto de línea antes del URL

  if (totalLen <= MAX_TWEET_LENGTH) return textWithUrl;

  // Necesitamos acortar `before`
  const excess = totalLen - MAX_TWEET_LENGTH;
  const maxBefore = before.length - excess - 3; // -3 por "..."
  if (maxBefore <= 0) return url; // Caso extremo: solo URL
  return before.slice(0, maxBefore).trimEnd() + '...\n\n' + url;
}

function makeTweet(parts: string[]): string {
  return fitTweet(parts.join('\n\n'));
}

const templates = {
  tweet: (title: string, slug: string, excerpt: string): string[] => {
    const url = `${BASE_URL}/blog/${slug}`;
    return [
      makeTweet([`📖 ${title}`, excerpt, url]),
      makeTweet([`¿Sabías que...? ${excerpt.slice(0, 200)}`, `👉 ${url}`]),
      makeTweet([`📝 "${title}"`, excerpt, url]),
    ];
  },
  thread: (title: string, slug: string, excerpt: string): string[] => {
    const url = `${BASE_URL}/blog/${slug}`;
    const parts = excerpt.split('. ').filter(Boolean);
    const thread: string[] = [
      makeTweet([`🧵 ${title}`, parts[0] || excerpt]),
    ];
    for (let i = 1; i < Math.min(parts.length, 4); i++) {
      const t = parts[i].length > 260 ? parts[i].slice(0, 257) + '...' : parts[i];
      thread.push(t);
    }
    thread.push(`👇 ${url}\n#Manga #MangaAura`);
    return thread;
  },
  instagram: (title: string, slug: string, excerpt: string): string[] => {
    const url = `${BASE_URL}/blog/${slug}`;
    const text = `📖 "${title}"\n\n${excerpt.slice(0, 150)}...\n\n👇 Lee más en MangaAura\n${url}`;
    return [text.slice(0, 2200)];
  },
};

function main() {
  const lines: string[] = [];
  const now = new Date();
  lines.push('# Posts generados para redes sociales — MangaAura');
  lines.push(`# Fecha: ${now.toISOString().split('T')[0]}`);
  lines.push('');

  for (const article of ARTICLES) {
    const { title, slug, excerpt } = article;
    const url = `${BASE_URL}/blog/${slug}`;

    lines.push(`## ${title}`);
    lines.push(`Slug: ${slug}`);
    lines.push('');

    lines.push('### Tweet (X)');
    const tweetOptions = templates.tweet(title, slug, excerpt);
    tweetOptions.forEach((t, i) => {
      lines.push(`Opción ${i + 1}:`);
      lines.push(t);
      lines.push(`(caracteres X: ${twitterLength(t)}, texto: ${t.length})`);
      lines.push('');
    });

    lines.push('### Hilo (X)');
    const thread = templates.thread(title, slug, excerpt);
    thread.forEach((t, i) => {
      lines.push(`[${i + 1}/${thread.length}]`);
      lines.push(t);
      lines.push(`(caracteres X: ${twitterLength(t)})`);
      lines.push('');
    });

    lines.push('---');
    lines.push('');
  }

  // Bonus: tweets promocionales generales
  lines.push('## Posts promocionales generales');
  lines.push('');
  const promos = [
    `¿Eres creador de manga? En MangaAura publicas tus obras, recibes apoyo directo con Aura y conectas con una comunidad que ama el manga tanto como tú. 🚀\n\n${BASE_URL}`,
    `Leer manga en MangaAura tiene recompensa 🏆 Gana XP, sube de nivel, únete a clanes y compite en rankings mientras disfrutas de tus series favoritas.\n\n${BASE_URL}`,
    `MangaAura no es solo leer: es una experiencia. Gamificación, crowdfunding para creadores, IA para artistas y una comunidad activa. Todo en un solo lugar.\n\n${BASE_URL}`,
    `El manga independiente necesita más apoyo. En MangaAura, cada capítulo que lees ayuda a los creadores. Publica gratis o apoya a tus artistas favoritos con Aura.\n\n${BASE_URL}`,
  ];
  promos.forEach((p, i) => {
    lines.push(`Opción ${i + 1}:`);
    lines.push(fitTweet(p));
    lines.push(`(caracteres X: ${twitterLength(fitTweet(p))})`);
    lines.push('');
  });

  const outDir = path.join(__dirname, 'out');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const dateStr = now.toISOString().split('T')[0];
  const outFile = path.join(outDir, `posts-${dateStr}.md`);
  fs.writeFileSync(outFile, lines.join('\n'), 'utf-8');
  console.log(`✅ Posts generados: ${outFile}`);
}

main();
