# 📢 Social Media Kit — MangaAura

```
scripts/social/
├── README.md              ← Este archivo
├── CONTENT_PLAN.md        ← Estrategia y calendario
├── TWEET_TEMPLATES.md     ← 10 plantillas listas para copiar y pegar
├── FREE_TOOLS.md          ← Herramientas gratuitas para programar
└── generate-posts.ts      ← Script: genera posts desde artículos del blog
```

## Cómo usar

### 1. Generar posts desde los artículos del blog

```bash
npx tsx scripts/social/generate-posts.ts
```

Esto lee los artículos publicados de la base de datos y genera:

- Tweets (3 opciones por artículo)
- Hilos (automáticos desde el excerpt)
- Posts para Instagram

Los resultados se guardan en `scripts/social/out/posts-YYYY-MM-DD.md`.

### 2. Publicar

Copia y pega los posts generados en:

- **X/Twitter**: Typefully (gratis) o directo
- **Instagram**: Buffer (gratis, 3 cuentas)
- Ambos: Usa las plantillas de TWEET_TEMPLATES.md para inspirarte

### 3. Frecuencia recomendada

| Canal     | Frecuencia       | Contenido                             |
| --------- | ---------------- | ------------------------------------- |
| X/Twitter | 1-2 posts/día    | Hilos educativos, features, comunidad |
| Instagram | 3-4 posts/semana | Carruseles, stories, reels            |
| TikTok    | Opcional         | Trends virales cuando tengas tiempo   |

### 4. Consejos para crecer sin pagar

- **Interactúa** con cuentas grandes de manga (comenta, retweetea)
- **Usa los hashtags** correctos (ver CONTENT_PLAN.md)
- **Publica en los mejores horarios**: Viernes 18-20h (hora España)
- **Sé constante**: 1 post al día > 10 posts de golpe
- **Recicla contenido**: Un hilo de X → carrusel de IG → clip de TT
