# 🚀 MangaAura — Roadmap de Crecimiento (Solo Founder, Cero Presupuesto)

Este documento es tu checklist diario/semanal para atraer usuarios y creadores sin gastar dinero. Sigue el orden.

---

## Fase 0: Fundación ✅ (ya está)

- [x] Web en producción (mangaaura.es)
- [x] Stripe live configurado
- [x] Resend emails configurado
- [x] Blog con 5 artículos SEO
- [x] Sitemap + robots.txt + meta tags + OG images + structured data
- [x] SEO kit: sharing, portadas automáticas, artículos relacionados
- [x] Social media kit: plan, templates, generador de posts
- [x] Directory submission kit: 24 directorios con copy listo
- [x] Discord webhook + cron endpoint

---

## Fase 1: Configuración Inmediata (Esta Semana)

### Día 1 — Google Search Console + Analytics base

- [ ] Ir a https://search.google.com/search-console
- [ ] Añadir propiedad `mangaaura.es` (método: tag HTML o DNS)
- [ ] Verificar la propiedad
- [ ] Enviar sitemap: `https://mangaaura.es/sitemap.xml`
- [ ] Enviar news sitemap: `https://mangaaura.es/news-sitemap.xml`
- [ ] Crear cuenta en https://analytics.google.com (GA4)
- [ ] Añadir el tag de GA4 al `<head>` (yo te lo puedo generar si me das el ID)

**¿Por qué?** Sin Search Console no sabes si Google está indexando tus artículos. Sin Analytics no sabes cuánta gente llega.

### Día 2 — Discord Webhook

- [ ] Abrir Discord → Server Settings → Integrations → Webhooks
- [ ] Crear webhook en el canal #noticias o #general
- [ ] Copiar URL → añadir a Vercel como `DISCORD_WEBHOOK_URL`
- [ ] Probar: `curl https://mangaaura.es/api/cron/discord-notify`
- [ ] Verificar que el post llega al canal

**¿Por qué?** Publicación automática. Cada vez que alguien sube un capítulo o escribes un artículo, se publica solo en Discord sin que toques nada.

### Día 3 — Primeros directorios (los más fáciles)

- [ ] **Crunchbase** (5 min): https://www.crunchbase.com → Add your company
- [ ] **LinkedIn Company Page** (10 min): Crear página de empresa "MangaAura"
- [ ] **GitHub** (5 min): Crear organización/README con link a mangaaura.es
- [ ] **Dev.to** (5 min): Publicar perfil con link
- [ ] **AlternativeTo** (10 min): Añadir MangaAura como alternativa a MangaPlus, Webtoon

Estos 5 son los más rápidos y dan backlinks base. No necesitas screenshots ni demo.

### Día 4 — Directorios IA (ALTA prioridad)

- [ ] **TAAFT** (There's An AI For That): https://taaft.io
- [ ] **Futurepedia**: https://futurepedia.io
- [ ] **Toolify**: https://www.toolify.ai
- [ ] **Future Tools**: https://futuretools.io
- [ ] **AI Stage**: https://aistage.io
- [ ] **aitools.inc**: https://aitools.inc

Usa el copy del archivo `scripts/social/mangaaura-descriptions.ts` → sección AI.

**¿Por qué?** Estas son las que más probablemente te darán tráfico ahora mismo. La audiencia busca herramientas de IA y MangaAura tiene IA.

### Día 5 — Redes Sociales

- [ ] Crear cuenta en **Buffer** (gratis, 3 cuentas)
- [ ] Conectar **X/Twitter** a Buffer
- [ ] Ejecutar: `npx tsx scripts/social/generate-posts.ts`
- [ ] Copiar los posts generados a Buffer (programar 1/día)
- [ ] Crear cuenta **Instagram** para MangaAura
- [ ] Subir 3 posts visuales (usa Canva + el OG API de MangaAura)

### Día 6 — Reddit (ALTA prioridad AI SEO)

- [ ] Leer `scripts/social/REDDIT_POSTS.md` para entender la estrategia
- [ ] Crear cuenta en Reddit con nombre relacionado (ej: MangaReaderES, MangaCreatorDev)
- [ ] No publicar nada el primer día — solo leer y entender la cultura de cada subreddit
- [ ] Días 2-7: Comentar en 3-5 hilos de r/manga, r/webtoons, r/ComicBookCollabs
- [ ] Semana 2: Publicar primer post de recomendación (sin enlaces, puro valor)
- [ ] Semana 3: Introducir menciones orgánicas de MangaAura cuando sea relevante

**¿Por qué?** Reddit es el 2º tipo de contenido más citado por ChatGPT. Las menciones orgánicas en Reddit valen ORO para AI SEO.

### Día 7 — YouTube (Planificar y grabar)

- [ ] Leer `scripts/social/YOUTUBE_SCRIPTS.md` para elegir primer video
- [ ] Grabar primer video: "Dónde publicar tu manga GRATIS en 2026"
- [ ] Crear thumbnail con Canva
- [ ] Subir a YouTube con descripción SEO + tags + enlaces
- [ ] Publicar transcripción como blog post en MangaAura (`/blog/`)

**¿Por qué?** Los videos de YouTube son citados frecuentemente por Google AI Overviews.

---

## Fase 2: Contenido Semanal (Cada Semana)

### Cada lunes (20 min)

```bash
npx tsx scripts/social/generate-posts.ts
# → Revisa scripts/social/out/posts-*.md
# → Programa 7 tweets en Buffer
```

### Cada miércoles (30 min)

- [ ] Publicar 1 artículo nuevo en el blog (puedo ayudarte a escribirlos)
- [ ] Compartir en X + Discord automáticamente

### Cada viernes (15 min)

- [ ] Revisar Search Console: ¿qué palabras clave están trayendo tráfico?
- [ ] Revisar Analytics: ¿cuántos usuarios? ¿de dónde vienen?
- [ ] Responder comentarios en X/Instagram

---

## Fase 3: Próximos Features (Cuando tengas tiempo)

### Prioridad alta

- [ ] **Extensión Chrome** — Añade "Leer en MangaAura" a sitios como MyAnimeList (puedo construirla)
- [ ] **Newsletter por email** — Capturar emails desde el blog con CTA "Suscríbete para más guías"
- [ ] **Página de alternativas** — `/alternatives/mangaplus`, `/alternatives/webtoon` (SEO powerhouse)

### Prioridad media

- [ ] **Programa de referidos** mejorado con tracking en dashboard
- [ ] **Embeds para creadores** — Widget "Apoya este manga en MangaAura" para páginas externas
- [ ] **Badge/Link "Disponible en MangaAura"** para que creadores lo pongan en sus redes

### Prioridad baja

- [ ] Product Hunt launch (requiere 3 semanas de preparación)
- [ ] G2 reviews (requiere 10 usuarios activos que dejen review)

---

## Métricas Clave (Track Semanal)

| Métrica                  | Semana 1 | Mes 1 | Mes 3 |
| ------------------------ | -------- | ----- | ----- |
| Usuarios registrados     | —        | —     | —     |
| Artículos en blog        | 5        | 10    | 25    |
| Seguidores en X          | —        | —     | —     |
| Directorios enviados     | 10       | 30    | 50+   |
| Dominios referentes (DR) | 0        | 10    | 30+   |
| Visitas/día (orgánico)   | —        | 30    | 200+  |
| Discord miembros         | 1        | —     | —     |

---

## Si te quedas sin tiempo: Prioriza ESTO

1. **Search Console** (gratis, 10 min, imprescindible)
2. **Directorios IA** (2h total, tráfico directo)
3. **1 post/día en X** (10 min/día, comunidad)
4. **1 artículo/semana en blog** (inversión SEO que compone)

El resto puede esperar. Haz estas 4 cosas consistentemente 1 mes y verás resultados.
