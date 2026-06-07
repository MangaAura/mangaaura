const W = 'w=800&h=450&fit=crop&auto=format';
const U = (id: string) => `https://images.unsplash.com/photo-${id}?${W}`;

export const BLOG_COVERS: Record<string, string> = {
  // Phase 1 — already in DB
  'donde-leer-manga-online-gratis-legal-2026': U('1523240795612-9a054b0db644'),
  'como-crear-tu-propio-manga-guia-completa': U('1460661419201-fd4cecdf8a8b'),
  'gamificacion-lectura-xp-logros-manga': U('1517694712202-14dd9538aa97'),
  'guia-generos-manga-shonen-shojo-seinen': U('1495446815901-a7297e633e8d'),
  'manga-vs-webtoon-diferencias-ventajas': U('1517245386807-bb43f82c33c4'),

  // Phase 2 — seed-blog-articles-phase2.ts / .sql
  'mejor-manga-romance-2026': U('1494979118697-1deb2bb55138'),
  'manga-seinen-recomendado': U('1532153975070-2e9ab71f1b14'),
  'mejores-mangas-fantasia-epica': U('1518709263855-3f8e6b71b9d3'),
  'manga-terror-psicologico': U('1509245312802-0c6ed7e8b97d'),
  'manhwa-recomendado-2026': U('1498050108023-c5249f4df085'),
  'mejor-manga-accion-2026': U('1487189343488-9ef409b9c3e3'),
  'webtoon-recomendado-2026': U('1521737604893-d14cc237f11d'),
  'mejores-mangas-cortos': U('1512820790803-83ca734da794'),
  'manga-aoi-superacion': U('1507003211169-0a1dd7228f2d'),

  // Phase 3 — seed-blog-articles-phase3-data.ts
  'manga-comedia-romance-recomendado': U('1456513080510-7bf3a84b82f8'),
  'manga-isekai-recomendado': U('1513364776144-60967b0f800f'),
  'mejores-mangas-deporte': U('1461891615477-2be42682f3f4'),
  'manga-slice-of-life': U('1499755312798-5a3f6fdde72b'),
  'manga-drama-recomendado': U('1488192014695-8fabc3dfd5b0'),
  'mejor-manga-suspense': U('1506905925346-21ef0ad8f3a9'),
  'manga-shoujo-recomendado': U('1513295230947-9cb0c8adfcef'),
  'manga-aventura-epica': U('1501785888046-af2a7f4d6b3f'),
  'mejores-manhwa-fantasia': U('1518709263855-3f8e6b71b9d3'),
  'manga-psicologico-recomendado': U('1434030216411-0b793f4b4173'),

  // API route extras (from /admin/news/seed)
  'mejores-paginas-leer-manga-espanol': U('1523240795612-9a054b0db644'),
  'aplicaciones-dibujar-manga-pc-tablet': U('1460661419201-fd4cecdf8a8b'),
  'como-ganar-dinero-dibujando-manga-2026': U('1513364776144-60967b0f800f'),
  'mejores-plataformas-publicar-manga-online': U('1521737604893-d14cc237f11d'),
  'crowdfunding-manga-como-funciona': U('1553729786-e1d9e2a7aa9f'),
  'herramientas-ia-crear-manga-2026': U('1677442136019-21780ecad995'),
  'como-escribir-guion-manga': U('1455390588535-5b9c1b2a7b0e'),
  'consejos-dibujo-digital-manga': U('1460661419201-fd4cecdf8a8b'),
  'comunidad-manga-online-foros-clanes': U('1529156065264-49936e8a5dd5'),
  'manga-y-lectura-digital-beneficios': U('1498050108023-c5249f4df085'),
};
