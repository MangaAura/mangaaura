/**
 * Genera posts para redes sociales a partir de los artículos del blog de MangaAura.
 * No requiere conexión a BD — usa los datos de artículos conocidos.
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

const templates: Record<string, (title: string, slug: string, excerpt: string) => string[]> = {
  tweet: (title, slug, excerpt) => [
    `📖 "${title}"\n\n${excerpt}\n\nLee el artículo completo 👇\n${BASE_URL}/blog/${slug}`,
    `¿Sabías que...? ${excerpt}\n\nEntra aquí para leer más: ${BASE_URL}/blog/${slug}`,
    `Nuevo en el blog de MangaAura 📝\n\n"${title}"\n\n${excerpt}\n${BASE_URL}/blog/${slug}`,
  ],
  thread: (title, slug, excerpt) => {
    const lines = excerpt.split('. ').filter(Boolean);
    const thread: string[] = [
      `🧵 ${title}\n\n${lines[0] || excerpt}`,
    ];
    for (let i = 1; i < Math.min(lines.length, 4); i++) {
      thread.push(lines[i]);
    }
    thread.push(`\nLee el artículo completo aquí 👇\n${BASE_URL}/blog/${slug}\n\n#Manga #MangaAura`);
    return thread;
  },
  instagram: (title, slug, excerpt) => [
    `📖 "${title}"\n\n${excerpt.slice(0, 200)}...\n\n👇 Lee más en MangaAura\n${BASE_URL}/blog/${slug}`,
  ],
};

function main() {
  const lines: string[] = [];
  const now = new Date();
  lines.push('# Posts generados para redes sociales — MangaAura');
  lines.push(`# Fecha: ${now.toISOString().split('T')[0]}`);
  lines.push('');

  for (const article of ARTICLES) {
    const { title, slug, excerpt } = article;

    lines.push(`## ${title}`);
    lines.push(`Slug: ${slug}`);
    lines.push('');

    // Tweet
    lines.push('### Tweet (X)');
    const tweetOptions = templates.tweet(title, slug, excerpt);
    tweetOptions.forEach((t, i) => {
      lines.push(`Opción ${i + 1}:`);
      lines.push(t);
      lines.push('');
    });

    // Thread
    lines.push('### Hilo (X)');
    const thread = templates.thread(title, slug, excerpt);
    thread.forEach((t, i) => {
      lines.push(`[${i + 1}/${thread.length}] ${t}`);
      lines.push('');
    });

    lines.push('---');
    lines.push('');
  }

  const outDir = path.join(__dirname, 'out');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const dateStr = now.toISOString().split('T')[0];
  const outFile = path.join(outDir, `posts-${dateStr}.md`);
  fs.writeFileSync(outFile, lines.join('\n'), 'utf-8');
  console.log(`✅ Posts generados: ${outFile}`);
  console.log(`   ${ARTICLES.length} artículos procesados`);
}

main();
