# Estrategia AI SEO — MangaAura

> Fecha: May 2026  
> Objetivo: Optimizar MangaAura para ser citado en respuestas de IA (Google AI Overviews, ChatGPT, Perplexity, Claude, Gemini, Copilot)

---

## 1. Diagnóstico Actual

### 1.1 Lo que MangaAura ya hace bien ✅

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| **llms.txt** | ✅ Mejorado | `/public/llms.txt` con Quick facts, Pricing, FAQ extendido, URLs canónicas | Ahora incluye precio, datos rápidos, features IA |
| **pricing.md** | ✅ Creado | `/public/pricing.md` con estructura parseable por agentes de IA | Precios lectores, Aura packs, premium, creadores |
| **robots.txt** | ✅ Excelente | Permite GPTBot, ClaudeBot, anthropic-ai, PerplexityBot, ChatGPT-User, Google-Extended, OAI-SearchBot, CCBot, cohere-ai | Todos los AI crawlers permitidos |
| **Sitemap** | ✅ Dinámico | Incluye mangas, capítulos, colecciones, clanes, blog, foros, anuncios | Prioridades + changeFreq |
| **Schema markup** | ✅ Extendido | `MangaStructuredData`, `ChapterStructuredData`, `BreadcrumbStructuredData`, `WebsiteStructuredData`, `OrganizationStructuredData`, `FAQPageStructuredData`, `HowToStructuredData`, `NewsArticleStructuredData`, `WebPageStructuredData`, `SearchResultsPageStructuredData` | 10 tipos de schema implementados |
| **OG images** | ✅ Excelente | Dinámicas vía `/api/og` con 8 tipos de contenido | |
| **Metadata** | ✅ Completo | OG tags, Twitter cards, hreflang, canonical, keywords, alternates de idioma | Con helper `withHreflang()` |
| **PWA** | ✅ Completo | Manifest, service worker, share target, offline | |
| **Seguridad** | ✅ Bueno | `security.txt`, Sentry, rate limiting | |
| **Crawlers** | ✅ Abiertos | Todos los bots AI permitidos con disallows razonables | `/creator/manga/new` y `/creator/sponsors` permitidos para Googlebot |

### 1.2 Lo que falta o se puede mejorar 🔧

| Aspecto | Estado | Impacto AI SEO | Notas |
|---------|--------|----------------|-------|
| **Pricing público** | ✅ Implementado | **Alto** — `/public/pricing.md` + ruta `/pricing` + `llms.txt` actualizado | Agentes de IA pueden parsear precios |
| **Comparativas ("X vs Y")** | ✅ Implementado | **Alto** — ruta `/comparison` con tabla + Product schema para 7 plataformas | WebPageStructuredData + FAQPage añadido |
| **Página de FAQ dedicada** | ✅ Implementado | **Alto** — ruta `/faq` con FAQPage schema + ayuda `/help` | 8 preguntas con i18n |
| **Datos/estadísticas originales** | ✅ Implementado | **Alto** — hero homepage + `/how-it-works` muestran stats reales DB (lectores, series, capítulos) | Cifras actualizadas cada 5 min (ISR) |
| **Artículos de blog profundos** | ✅ Implementado | **Medio** — ruta `/blog/[slug]` con Article schema + autor + fechas | 6 guías completas + noticias dinámicas |
| **Freshness (fechas visibles)** | ✅ Implementado | **Medio** — BlogArticleClient + NewsArticleClient muestran fecha + autor + tiempo lectura | Calendar + Clock icons visibles |
| **Author attribution** | ✅ Implementado | **Medio** — AuthorCard + avatar + username + schema author en todas las páginas | Autor visible con link a perfil |
| **FAQ schema** | ✅ Implementado | **Medio** — FAQPageStructuredData en homepage, /faq, /how-it-works, /comparison, /about-us, /help, /affiliate, guías | 10+ páginas con schema FAQ |
| **HowTo schema** | ✅ Implementado | **Medio** — HowToStructuredData en /how-it-works, /creator/manga/new, guías de principiantes | Pasos con position + nombre |
| **NewsArticle schema** | ✅ Implementado | **Medio** — NewsArticleStructuredData en `/news/[year]/[month]/[slug]` | category, wordCount, keywords |
| **Wikipedia / third-party presence** | ❌ Pendiente | **Medio** — 7.8% de citas de ChatGPT vienen de Wikipedia | Requiere acción externa (no código) |
| **Content freshness** | ✅ Implementado | **Medio** — `datePublished` + `dateModified` en schema + UI | Fechas visibles y en schema |
| **Agentic readiness** | ✅ Parcial | **Medio** — HTML semántico, precios visibles sin JS, landing pages públicas | Falta checklist formal |
| **Monitoreo AI visibility** | ❌ Pendiente | **Alto** — sin herramienta de tracking | Recomendado: Otterly AI o DIY mensual |

---

## 2. Query Fan-Out: Cómo Google AI Overviews Explora Consultas

Google AI Overviews no responde solo la consulta exacta del usuario. Genera **consultas relacionadas concurrentes** (fan-out) para construir una respuesta completa. Por ejemplo, "cómo publicar manga" dispara consultas paralelas sobre plataformas, costos, derechos de autor, formatos, etc.

**Implicaciones para MangaAura:**
- No optimizar para una sola query por página. Cada página debe cubrir **todo el clúster temático**.
- Una página sobre "crowdfunding de cómics" debe cubrir también: cómo funciona, cuánto cuesta, plataformas alternativas, consejos para campañas exitosas.
- El sitio en conjunto debe tener contenido que responda los **5-10 queries relacionadas** más probables.

**Ejemplo para query target "publicar manga gratis":**
| Query fan-out probable | ¿MangaAura lo cubre? |
|-----------------------|---------------------|
| "dónde publicar manga online gratis" | ✅ (ruta /creator/manga/new) |
| "cómo ganar dinero con mi manga" | ⚠️ Falta guía visible |
| "plataformas para publicar manga" | ❌ Falta página comparativa |
| "derechos de autor al publicar manga" | ❌ No existe |
| "formatos de página para manga digital" | ❌ No existe |
| "consejos para crear manga" | ❌ No existe |

**Acción:** Para cada query target principal, listar las 5-10 queries fan-out y asegurar cobertura.

---

## 3. Estrategia: Los 3 Pilares

### 3.1 Pilar 1: Estructura — Hacer el contenido extraíble

#### 3.1.1 FAQ Schema en páginas clave

Agregar `FAQPage` schema en:
- **Página de inicio** — preguntas frecuentes sobre la plataforma
- **Página de exploración** — cómo funciona el descubrimiento
- **Página de creador** — cómo publicar y monetizar
- **Página de Aura/economía** — cómo funciona la moneda virtual

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿MangaAura es gratis?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sí, leer manga en MangaAura es completamente gratis. Los creadores ganan mediante crowdfunding con Aura y patrocinios."
      }
    },
    {
      "@type": "Question",
      "name": "¿Cómo funciona Aura?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Aura es la moneda virtual de MangaAura. Los lectores compran Aura para crowdfundear capítulos, dar propinas a creadores y participar en pujas de patrocinio. Los creadores ganan Aura cuando los lectores apoyan su contenido."
      }
    },
    {
      "@type": "Question",
      "name": "¿Cómo puedo crear mi propio manga?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Regístrate como creador en MangaAura y usa el dashboard de creador para subir tus capítulos con drag & drop. Puedes gestionar toda tu serie, ver analytics y recibir crowdfunding de tus lectores."
      }
    }
  ]
}
```

**Ubicación recomendada:** Agregar `FAQStructuredData` component en `src/components/SEO/` similar a los existentes, e importarlo en páginas relevantes.

#### 3.1.2 HowTo Schema para guías de creadores

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Cómo publicar tu primer capítulo en MangaAura",
  "step": [
    { "@type": "HowToStep", "position": 1, "name": "Regístrate como creador", "text": "Crea una cuenta y selecciona el rol de creador" },
    { "@type": "HowToStep", "position": 2, "name": "Crea tu serie de manga", "text": "Completa el formulario con título, descripción y portada" },
    { "@type": "HowToStep", "position": 3, "name": "Sube tu primer capítulo", "text": "Arrastra las páginas y ordénalas con drag & drop" },
    { "@type": "HowToStep", "position": 4, "name": "Publica y comparte", "text": "Revisa y publica tu capítulo para que los lectores lo vean" }
  ]
}
```

#### 3.1.3 Estructurar contenido como answer blocks

Cada página clave debe tener un **párrafo de definición de 40-60 palabras** en los primeros 150 caracteres:

**Ejemplo para página de manga:**
> "One Piece es un manga de aventura y fantasía creado por Eiichiro Oda. Publicado en MangaAura con 1100+ capítulos, sigue las aventuras de Monkey D. Luffy y su tripulación en busca del tesoro legendario. Con una calificación de 4.8/5, es uno de los mangas más leídos en la plataforma."

#### 3.1.4 Tablas de comparación

Crear páginas de comparación para consultas de alto volumen:
- "Mejores plataformas de manga online" → MangaAura vs MangaPlus vs Tappytoon vs Shonen Jump
- "MangaAura vs otras plataformas de manga"

**Estructura recomendada:**
```markdown
| Característica | MangaAura | MangaPlus | Tappytoon |
|----------------|-----------|-----------|-----------|
| Precio | Gratis | Gratis | Pago |
| Crowdfunding | ✅ Sí | ❌ No | ❌ No |
| Publicar manga | ✅ Sí | ❌ No | ❌ No |
| IA para descubrimiento | ✅ Sí | ❌ No | ❌ No |
| Offline | ✅ Sí | ❌ No | ❌ No |
```

---

### 3.2 Pilar 2: Autoridad — Hacer que la IA quiera citarnos

#### 2.2.1 Estadísticas y datos originales

MangaAura tiene datos únicos que pueden publicarse:

| Dato | Fuente | Impacto |
|------|--------|---------|
| "X lectores activos mensuales" | Sistema de analytics | +37-40% citación |
| "Y capítulos leídos este mes" | Sistema de reading sessions | +37-40% citación |
| "Z creadores activos en la plataforma" | Base de datos | +37-40% citación |
| "Promedio de minutos de lectura por usuario" | Sistema de analytics | +37-40% citación |
| "Tasa de retención D7/D30" | Sistema de analytics | +37-40% citación |

**Acción:** Crear página `/about` o sección en `/` con estadísticas de plataforma. Incluir fechas y fuentes.

#### 2.2.2 Freshness signals visibles

- Agregar "Última actualización: [fecha]" en páginas de manga, noticias, blog
- Agregar "Publicado: [fecha]" en artículos de noticias
- Implementar refresco trimestral de contenido estático

#### 2.2.3 Author attribution

- Asegurar que cada noticia, blog post y página tenga autor con nombre real y credenciales
- Agregar author schema a cada artículo
- Mostrar avatar, nombre y bio del autor al inicio/final del contenido

#### 2.2.4 E-E-A-T en contenido

**Experience:** Mostrar testimonios reales de creadores y lectores
**Expertise:** Artículos firmados por el equipo, con bios que muestren expertise
**Authoritativeness:** Logos de medios que nos han cubierto, partnerships
**Trustworthiness:** Página de privacidad, términos, seguridad (2FA, SSL)

---

### 3.3 Pilar 3: Presencia — Estar donde la IA busca

#### 3.3.1 Wikipedia

Si MangaAura no tiene página de Wikipedia, **no crear una artificialmente**. En su lugar:
- Asegurar que existan menciones orgánicas en Wikipedia (ej: listas de "plataformas de manga", "crowdfunding de cómics")
- Contribuir a artículos relacionados de forma legítima

#### 3.3.2 Reddit

- Participar en r/manga, r/webcomics, r/ComicBookCollabs, r/manga_es
- NO hacer spam — responder preguntas genuinas donde MangaAura sea relevante
- Las FAQs de Reddit son citadas frecuentemente por ChatGPT

#### 3.3.3 YouTube

- Tutoriales: "Cómo publicar tu manga gratis", "Mejores plataformas para crear manga"  
- Los videos de YouTube son citados frecuentemente por Google AI Overviews
- Incluir enlaces en la descripción

#### 3.3.4 Review sites / directorios

- Product Hunt (para creadores)
- AlternativeTo (listado como alternativa a MangaPlus, Webtoon)
- G2, Capterra (si hay caso de negocio)
- Directorios de startups SaaS españolas/latinoamericanas

#### 3.3.5 Quora

- Responder preguntas como "¿Dónde puedo publicar mi manga gratis?", "¿Cómo crowdfundear un cómic?"
- Respuestas con estructura clara y datos → alta probabilidad de citación

---

## 4. Archivos Legibles por Máquinas

### 4.1 Mejorar `/public/llms.txt` existente

El actual es bueno pero puede mejorarse:

```markdown
# MangaAura
> La plataforma de manga impulsada por IA para leer, crear y crowdfundear capítulos. 
> Gratis para lectores. Crowdfunding para creadores. Comunidad de clanes y rankings.

## Quick facts
- Price: Free for readers. Creators earn through Aura crowdfunding and sponsorships.
- Language: Spanish (primary), English (secondary)
- Platform: Web (PWA), installable on mobile and desktop
- Audience: Manga readers, manga creators, anime fans, Spanish-speaking LATAM + Spain
- Traffic: [X] MAU, [Y] chapters read/month

## Key pages
- Homepage: https://mangaaura.es - Platform overview and featured manga
- Explore: https://mangaaura.es/explore - Browse manga by genre, popularity, latest
- Rankings: https://mangaaura.es/rankings - Top manga and readers by monthly XP
- Library: https://mangaaura.es/library - Personal reading list with progress
- News: https://mangaaura.es/news - Platform news and manga industry updates
- Blog: https://mangaaura.es/blog - Guides, tutorials and platform insights

## For creators
- Create manga: https://mangaaura.es/creator/manga/new - Publish a new series
- Dashboard: https://mangaaura.es/creator/dashboard - Creator analytics
- Upload chapter: https://mangaaura.es/creator/upload - Upload new pages
- Sponsorships: https://mangaaura.es/creator/sponsors - Manage sponsorships

## Community
- Forum: https://mangaaura.es/community/forum - Discussion forums by category
- Clans: https://mangaaura.es/community/clans - User-created reading groups
- Events: https://mangaaura.es/events - Seasonal events and competitions

## Key features
- AI-powered manga discovery and recommendations
- Crowdfunding for chapters using Aura virtual currency
- XP, levels, achievements, and reading streaks gamification
- Offline reading with full PWA capabilities
- Creator revenue sharing through sponsorships
- Two-factor authentication (2FA)
- Real-time notifications via HTTP polling (30s interval)
- Multi-language support (Spanish and English)
- Image cropping and optimization for covers
- Dynamic OG images at /api/og

## FAQ
- Q: Is MangaAura free? A: Yes, reading manga is completely free.
- Q: What is Aura? A: Aura is the virtual currency used for crowdfunding chapters and tipping creators. Readers buy Aura via Stripe.
- Q: How do I create manga? A: Register as a creator (free) and use the creator dashboard to upload chapters.
- Q: What is crowdfunding? A: Readers contribute Aura to chapters they want to see published. When the goal is met, the chapter is released.
- Q: Can I read offline? A: Yes. MangaAura is a PWA with offline reading support.
- Q: What platforms support MangaAura? A: Any modern browser. Installable as a PWA on mobile and desktop.
- Q: Is there a mobile app? A: Not in app stores, but the PWA works identically and can be installed from any browser.

## Pricing
- Reading: Free (no subscription required)
- Aura packs: Starting at €X (purchased via Stripe)
- Creator fees: Zero platform fee (creators keep what they earn from crowdfunding)
- Sponsorships: Readers can sponsor creators directly
```

**Cambios clave respecto al actual:**
- Añadir sección `Quick facts` con datos relevantes
- Añadir `Pricing` sección (agentes de IA necesitan precios)
- FAQ más detallado
- URLs canónicas completas con descripciones

### 4.2 Crear `/public/pricing.md`

> **Nota de ruteo:** Los archivos en `/public/` se sirven en la raíz del dominio. `/public/pricing.md` será accesible como `mangaaura.es/pricing.md`, no como `/pricing`. Si se desea `/pricing` como URL amigable, crear una ruta en Next.js App Router. El archivo `.md` es para agentes de IA (formato parseable); la ruta `/pricing` es para humanos.

```markdown
# Precios — MangaAura

## Para Lectores (Gratis)
- Price: 0 €/mes
- Features: Lectura ilimitada, biblioteca personal, progreso sincronizado, XP y logros
- Límites: Ninguno — todo el contenido es gratuito

## Aura (Moneda Virtual)
- 100 Aura: 1,00 €
- 500 Aura: 4,50 € (10% descuento)
- 1000 Aura: 8,00 € (20% descuento)
- 5000 Aura: 35,00 € (30% descuento)
- Método de pago: Stripe (tarjeta de crédito/débito)

## Para Creadores (Gratis)
- Price: 0 €/mes
- Features: Dashboard, analytics, upload de capítulos, crowdfunding
- Revenue: Los creadores reciben el 100% del crowdfunding (sin comisión de plataforma)
- Límites: Sin límite de series ni capítulos

## Patrocinios
- Los lectores pueden patrocinar directamente a creadores
- Sin suscripción mensual requerida
- Pago por capítulo via Aura
```

### 4.3 Verificar que `/pricing.md` y `/llms.txt` están en el sitemap

Ambos archivos deben aparecer en el sitemap.xml para que los crawlers los descubran. También linkear desde la página de inicio y el footer.

---

## 5. Optimización por Tipo de Contenido

### 5.1 Páginas de Manga (mayor volumen)

**Prioridad: Alta** — son las páginas más indexadas y compartidas

| Acción | Esfuerzo | Impacto |
|--------|----------|---------|
| Definición de 40-60 palabras en primer párrafo | Bajo | Alto |
| FAQ con preguntas comunes sobre el manga | Medio | Alto |
| Schema Article → Book ya implementado | - | - |
| Agregar "Última actualización" visible | Bajo | Medio |
| Agregar estadísticas: capítulos, ratings, lectores | Bajo | Alto |
| Fragmento extraíble para "trama de [manga]" | Bajo | Alto |

**Estructura recomendada del primer bloque visible:**
```
[Title] es un manga de [género] creado por [autor] en [año]. 
Con [X] capítulos publicados y una calificación de [Y]/5, sigue 
la historia de [protagonista/resumen de 1-2 líneas].
```

### 5.2 Páginas de Creador / Subida de Manga

**Prioridad: Alta** — búsquedas como "dónde publicar mi manga", "plataforma para crear manga"

| Acción | Esfuerzo | Impacto |
|--------|----------|---------|
| Guía paso a paso "Cómo publicar manga" con HowTo schema | Medio | Alto |
| Estadísticas: "X creadores ya publican aquí" | Bajo | Alto |
| Testimonios de creadores exitosos | Medio | Alto |
| Comparativa con otras plataformas (FAQ) | Medio | Alto |
| Precios visibles (gratis, sin comisión) | Bajo | Muy Alto |

### 5.3 Noticias y Blog

**Prioridad: Media** — contenido que puede posicionarse para consultas informativas

| Acción | Esfuerzo | Impacto |
|--------|----------|---------|
| Fecha visible + autor con credenciales | Bajo | Medio |
| Artículos con datos/estadísticas originales | Medio | Alto |
| FAQ schema si hay preguntas en el artículo | Bajo | Medio |
| Enlazar a fuentes externas (citación recíproca) | Bajo | Alto |

### 5.4 Página de Exploración / Rankings

**Prioridad: Media** — consultas tipo "mejores mangas"

| Acción | Esfuerzo | Impacto |
|--------|----------|---------|
| Descripción de 40-60 palabras al inicio | Bajo | Medio |
| Fragmento "Top X mangas en MangaAura" extraíble | Bajo | Alto |
| FAQs: "¿Cómo se calculan los rankings?" | Bajo | Medio |
| Mostrar criterios de ranking de forma visible | Bajo | Medio |

---

## 6. Optimización Técnica

### 6.1 ⚠️ Revisión crítica: robots.txt bloquea `/creator` para Googlebot

El archivo `src/app/robots.ts` actual tiene:
```
User-agent: *
Disallow: /creator
Disallow: /api
...

User-agent: Googlebot
Disallow: /creator
Disallow: /manager
...
```

**Problema:** `/creator` está bloqueado tanto para `*` como para `Googlebot` explícitamente. Esto significa que Google AI Overviews **no puede indexar** las páginas de creador ("/creator/manga/new", "/creator/dashboard", "/creator/upload").

**Impacto:** Si se crea una guía "Cómo publicar manga en MangaAura" en `/creator/manga/new`, Google AI Overviews no podrá citarla.

**Solución recomendada:**
- Mantener `Disallow: /api` (datos sensibles)
- Eliminar `Disallow: /creator` para Googlebot (o para todos los user-agents si las páginas de creador deben ser indexables)
- Alternativa: agregar las páginas públicas de creador bajo `/guide/` o `/learn/` y que sean indexables, mientras `/creator/dashboard` etc. siguen protegidas

### 6.2 Schema markup que falta agregar

| Schema | Páginas | Prioridad | Nota |
|--------|---------|-----------|------|
| `FAQPage` | Home, /about, /explore | Alta | Verificar que el componente `StructuredData` existente acepte tipo FAQ |
| `HowTo` | /creator/manga/new, /creator/upload | Alta | El formulario de subida ya tiene pasos: mapear al schema |
| `WebPage` con `lastReviewed` | Todas las páginas de contenido | Media | Ya existe `WebsiteStructuredData`, extenderlo |
| `NewsArticle` | /news/* | Media | Actualmente usa schema `Article`, migrar a `NewsArticle` para noticias |
| `DiscussionForumPosting` | /community/forum/* | Baja | Foro con categorías → mapeo directo |
| `BreadcrumbList` | Ya existe | ✅ | Verificar en todas las rutas con layout compartido |

### 6.3 Cache headers para AI crawlers

Los crawlers de IA respetan Cache-Control. Las páginas deben:
- `public, max-age=3600, stale-while-revalidate=86400` para páginas de manga
- `public, max-age=600` para páginas dinámicas (exploración, rankings)

### 6.4 Core Web Vitals

AI Overviews de Google prioriza páginas con buen CWV:
- **LCP** < 2.5s (ya optimizado con lazy loading, imágenes WebP)
- **INP** < 200ms (React 19, Server Components ayudan)
- **CLS** < 0.1 (verificar en páginas de manga y capítulos)

**Acción:** Auditoría Lighthouse en las 5 páginas principales, medir y registrar en un spreadsheet para tracking mensual.

### 6.5 Indexación de contenido dinámico

MangaAura genera mucho contenido vía API (capítulos, comentarios). Asegurar que:
- Las páginas clave (mangas, capítulos) son SSR, no CSR
- El sitemap incluye URLs completas con `lastModified` correcto
- No hay contenido crítico detrás de JavaScript pesado

### 6.6 Preparación para agentes autónomos (Agentic Experiences)

Los agentes de IA están empezando a visitar sitios directamente — no solo leer el texto, sino hacer clic, comparar, y recomendar productos. MangaAura debe prepararse:

**Cómo los agentes acceden al sitio:**
- **Visual rendering** — capturan la página como la ve un usuario
- **DOM inspection** — parsean el HTML directamente
- **Accessibility tree** — usan la misma información semántica que un lector de pantalla

**Qué hacer:**
1. **HTML semántico** — usar `<main>`, `<nav>`, `<article>`, `<section>`, `<button>`, jerarquía correcta de headings, `alt` text en imágenes — esto ya se hace mayormente ✅
2. **Precios visibles sin JS** — el pricing debe estar en HTML inicial, no renderizado por JavaScript. El archivo `/public/pricing.md` ayuda a esto
3. **No bloquear contenido con login** — las landing pages de creador deben ser públicas y accesibles
4. **Etiquetado claro** — cada botón y enlace debe tener texto descriptivo (no genérico como "click aquí")
5. **Selectores estables** — evitar layouts que se re-rendericen constantemente, los agentes se confunden

---

## 7. Contenido a Crear (Priorizado)

### Prioridad Alta (esta semana)

| Tipo de contenido | Query target | Formato | Consultas fan-out a cubrir |
|-------------------|-------------|---------|--------------------------|
| **Página "Cómo funciona"** | "cómo funciona MangaAura", "que es MangaAura" | Página dedicada con definición + FAQ + HowTo schema | gratis?, creadores?, Aura, comisiones, requisitos |
| **Página de precios** | "MangaAura precio", "MangaAura es gratis" | Pricing público + pricing.md + ruta /pricing | Aura packs, suscripción, creadores ganan, comisiones |
| **Estadísticas de plataforma** | "mejores plataformas de manga", "MangaAura cuantos usuarios" | Sección en homepage + /about con datos | competidores, lectores, creadores, crecimiento |

### Prioridad Media (próximas 2 semanas)

| Tipo de contenido | Query target | Formato |
|-------------------|-------------|---------|
| **Guía: Cómo publicar manga gratis** | "dónde publicar manga gratis", "publicar manga online" | Blog post con HowTo schema |
| **Comparativa: MangaAura vs otras plataformas** | "MangaAura vs MangaPlus", "mejor plataforma para leer manga" | Página comparativa con tabla (33% de citas en IA) |
| **Guía: Cómo crowdfundear tu manga** | "crowdfunding cómic", "financiar manga" | Blog post + HowTo schema |

### Prioridad Baja (próximo mes)

| Tipo de contenido | Query target | Formato |
|-------------------|-------------|---------|
| **Guía: Cómo ganar XP y subir de nivel** | "mangaaura niveles", "sistema de XP manga" | Blog post con HowTo |
| **Guía de clanes** | "clanes manga", "grupos de lectura manga" | Blog post |
| **Entrevistas a creadores** | "creadores manga MangaAura" | Serie de blog posts |
| **Estadísticas anuales** | "manga latinoamerica 2025", "plataformas manga crecimiento" | Post anual con datos originales |

---

## 8. Monitoreo

### 8.1 Check mensual DIY

1. Seleccionar las 20 queries clave de la tabla de contenido
2. Ejecutar cada una en:
   - Google (buscar AI Overview)
   - ChatGPT (con web search)
   - Perplexity
3. Registrar en spreadsheet:
   - ¿Aparece MangaAura como fuente?
   - ¿Qué competidores aparecen?
   - ¿Qué página específica fue citada?
   - ¿Qué formato tenía el contenido citado?

### 8.2 Queries clave a monitorear

| Query | Intención | Competidores probables |
|-------|-----------|----------------------|
| "plataforma para publicar manga gratis" | Creadores | Webtoon, Tapas, MangaPlus |
| "leer manga online gratis" | Lectores | MangaPlus, TMO, varias |
| "crowdfunding cómic" | Creadores | Kickstarter, Patreon |
| "mejores plataformas de manga 2025" | Ambos | MangaPlus, VIZ, Shonen Jump |
| "crear manga con IA" | Creadores | Midjourney, DALL-E (como tools) |
| "MangaAura" | Navegacional | (brand, debe ser #1) |
| "como funciona MangaAura" | Informativa | (brand) |
| "manga online comunidad" | Lectores | Webtoon, Tapas |
| "alternativas a MangaPlus" | Creadores | Competidores directos |
| "moneda virtual manga" | Creadores | (niche query) |

### 8.3 Herramientas de monitoreo recomendadas

| Herramienta | Cobertura | Costo |
|-------------|-----------|-------|
| **Otterly AI** | ChatGPT, Perplexity, Google AI Overviews | Desde $29/mes |
| **Peec AI** | ChatGPT, Gemini, Perplexity, Claude, Copilot+ | Desde $39/mes |
| **ZipTie** | Google AI Overviews, ChatGPT, Perplexity, Gemini | Desde $49/mes |
| **DIY** (spreadsheet) | Manual, todas las plataformas | Gratis |

### 8.4 Señales de alerta

- MangaAura no aparece en ninguna AI search para queries de marca → problema grave
- Competidores son citados sistemáticamente para queries donde tenemos mejor contenido → analizar su estructura
- Baja tasa de clics desde AI Overviews → revisar si el fragmento extraído responde completamente
- Contenido desactualizado siendo citado → urgencia de freshness

---

## 9. Quick Wins — Estado Actual

### ✅ Completados

- [x] **⚠️ Revisar robots.txt** — `/creator/manga/new` y `/creator/sponsors` permitidos para Googlebot. Las páginas públicas de creador son indexables.
- [x] **FAQSchema component** — `FAQPageStructuredData` creado y usado en homepage, /faq, /how-it-works, /comparison, /about-us, /help, /affiliate, guías
- [x] **Mejorar `/public/llms.txt`** — secciones Quick facts, Pricing, FAQ extendido, URLs canónicas
- [x] **Crear `/public/pricing.md`** — estructura completa legible por agentes
- [x] **Estadísticas en homepage** — hero section muestra totalMangas, totalReaders, totalChapters desde DB
- [x] **Fecha visible en noticias/blog** — Calendar icon + date en BlogArticleClient y NewsArticleClient
- [x] **Verificar robots.txt** — todos los AI crawlers permitidos (GPTBot, ClaudeBot, anthropic-ai, PerplexityBot, ChatGPT-User, Google-Extended, OAI-SearchBot)
- [x] **Página comparativa** — ruta `/comparison` con tabla + Product schema para 7 plataformas + FAQ
- [x] **HowTo schema** — implementado en /how-it-works, /creator/manga/new, guías
- [x] **NewsArticle schema** — implementado en `/news/[year]/[month]/[slug]`

### ✅ Recién Completados

- [x] **Auditoría Lighthouse** — 5 páginas principales auditadas (ver sección 10)
- [x] **Wikipedia / third-party presence** — estrategia documentada (ver sección 11)
- [x] **Monitoreo AI visibility** — sistema DIY + herramientas documentado (ver sección 12)

---

## 10. Resultados Auditoría Lighthouse

> Fecha: Junio 2026
> Herramienta: Chrome DevTools Lighthouse (Mobile)
> Entorno: Desarrollo local (localhost:3000)

### Resultados por Página

| Página | Performance | Accesibilidad | Best Practices | SEO |
|--------|:-----------:|:-------------:|:--------------:|:--:|
| **Homepage** (`/`) | — | **93** | **92** | **92** |
| **Explorar** (`/explore`) | — | **100** | **92** | **100** |
| **Cómo funciona** (`/how-it-works`) | — | **100** | **92** | **100** |
| **Comparativa** (`/comparison`) | — | **100** | **92** | **100** |
| **Precios** (`/pricing`) | — | **100** | **92** | **100** |

> ⚠️ Nota: Las métricas de Performance no se registraron porque el audit se ejecutó en entorno de desarrollo local. Las cifras reales en producción serán diferentes. Se recomienda auditar en producción con PageSpeed Insights.

### Issues Detectados

| Issue | Severidad | Páginas afectadas | Solución |
|-------|:---------:|-------------------|----------|
| **CSP bloquea Vercel Analytics** | Media | Todas | Añadir `va.vercel-scripts.com` a CSP `script-src` |
| **CSP bloquea Google Analytics** | Media | Todas | Añadir `region1.google-analytics.com` a CSP `connect-src` |
| **Preload fonts no usados** | Baja | Homepage | Revisar preload de fuentes en layout |
| **SEO score 92 en homepage** | Baja | Homepage | Revisar meta description y heading structure |

### Recomendaciones

1. **Core Web Vitals**: Auditar en producción con PageSpeed Insights una vez en producción
2. **CSP**: Revisar Content Security Policy para permitir analytics sin comprometer seguridad
3. **Preload fonts**: Limpiar preloads no utilizados para mejorar LCP
4. **Homepage SEO**: El score 92 es bueno, pero revisar que el H1 contenga keyword principal

---

## 11. Estrategia de Presencia en Wikipedia y Directorios

### Estado Actual

| Canal | Estado | Acción |
|-------|--------|--------|
| **Wikipedia (ES/EN)** | ❌ No existe | **No crear artificialmente** — sin cobertura significativa de medios independientes, será eliminado |
| **AlternativeTo** | ❌ No listado | **Alta prioridad** — listar MangaAura como alternativa a MangaPlus, Webtoon |
| **Product Hunt** | ❌ No listado | **Alta prioridad** — lanzar cuando haya una feature importante nueva |
| **G2 / Capterra** | ❌ No listado | **Baja prioridad** — más orientado a B2B/SaaS |
| **Reddit (r/manga, etc.)** | ✅ En progreso | Ver `scripts/social/out/` — 10 posts listos |
| **YouTube** | ✅ En progreso | 6 guiones listos, pendiente grabación |

### Plan de Acción por Prioridad

#### 🔴 Prioridad Alta (Esta semana)

**AlternativeTo**
- URL: https://alternativeto.net
- Propuesta: Listar MangaAura como alternativa gratuita a MangaPlus, Webtoon, Tapas
- Beneficio: Los usuarios que buscan "alternativas a X" encuentran MangaAura
- Las IAs (ChatGPT, Perplexity) citan frecuentemente AlternativeTo en recomendaciones

**Product Hunt**
- URL: https://producthunt.com
- Preparar landing page con screenshots y demo
- Ideal para lanzar con una feature destacada (nueva herramienta IA, redesign, etc.)
- Beneficio: Visibilidad en comunidad tech y backlinks de alta calidad

#### 🟡 Prioridad Media (Próximas 2 semanas)

**Directorios de startups españolas/latinoamericanas**
- Listar en directorios de startups SaaS de España y LATAM
- Ejemplos: Startups.es, Novobrief, HolaLuz
- Beneficio: Backlinks desde dominios .es, relevancia geográfica

**Menciones en blogs de manga**
- Contactar blogs de manga/anime en español para reseñas o menciones
- Las menciones en medios independientes son el requisito #1 para Wikipedia
- Priorizar medios con dominio .es que cubran cultura japonesa

#### 🟢 Prioridad Baja (Próximo mes)

**Wikipedia (solo si hay suficiente cobertura mediática)**
- Requisito: Varias fuentes independientes y fiables cubriendo MangaAura
- Sin cobertura mediática → no crear página → será eliminada por falta de notabilidad
- Estrategia: conseguir menciones en prensa primero, luego evaluar Wikipedia

**G2 / Capterra / TrustRadius**
- Más relevantes cuando MangaAura tenga un componente B2B claro
- Por ahora, priorizar canales de comunidad (Reddit, AlternativeTo, Product Hunt)

### Reglas de Oro

1. **No crear Wikipedia artificialmente** — sin cobertura de medios independientes, el artículo será eliminado
2. **Las menciones en Reddit y AlternativeTo son más efectivas** que Wikipedia para AI SEO (Reddit es el 2º tipo de contenido más citado por ChatGPT)
3. **Backlinks de calidad > cantidad** — un enlace desde un dominio .es relevante vale más que 10 directorios genéricos
4. **Actualizar perfiles trimestralmente** — mantener información de pricing y features actualizada

---

## 12. Sistema de Monitoreo AI Visibility

### Opción 1: DIY (Gratis — Recomendada para empezar)

Frecuencia: **Mensual** (primer sábado de cada mes)
Tiempo estimado: **30-45 minutos**

#### Queries a Monitorear (20 queries)

| # | Query | Intención | ChatGPT | Perplexity | Google AIO | ¿Citados? |
|:-:|-------|:--------:|:-------:|:----------:|:----------:|:---------:|
| 1 | "dónde publicar manga gratis" | Creadores | — | — | — | — |
| 2 | "plataformas para publicar manga" | Creadores | — | — | — | — |
| 3 | "MangaAura" | Brand | — | — | — | — |
| 4 | "cómo funciona MangaAura" | Brand | — | — | — | — |
| 5 | "MangaAura precio" | Brand | — | — | — | — |
| 6 | "mejores plataformas de manga" | Ambos | — | — | — | — |
| 7 | "MangaAura vs MangaPlus" | Comparativa | — | — | — | — |
| 8 | "crowdfunding cómic" | Creadores | — | — | — | — |
| 9 | "crear manga con IA" | Creadores | — | — | — | — |
| 10 | "leer manga online gratis español" | Lectores | — | — | — | — |
| 11 | "alternativas a MangaPlus" | Creadores | — | — | — | — |
| 12 | "alternativas a Webtoon" | Creadores | — | — | — | — |
| 13 | "monetizar manga" | Creadores | — | — | — | — |
| 14 | "comunidad manga online" | Lectores | — | — | — | — |
| 15 | "manga online comunidad hispana" | Lectores | — | — | — | — |
| 16 | "ganar dinero con mi manga" | Creadores | — | — | — | — |
| 17 | "plataforma de manga con IA" | Creadores | — | — | — | — |
| 18 | "shonen vs seinen diferencias" | Lectores | — | — | — | — |
| 19 | "que es manga" | Lectores | — | — | — | — |
| 20 | "cómo leer manga" | Lectores | — | — | — | — |

#### Instrucciones

1. Abrir cada query en:
   - **ChatGPT** (con web search habilitado)
   - **Perplexity** (perplexity.ai)
   - **Google** (buscar AI Overviews al inicio)
2. Registrar:
   - ✅ MangaAura aparece como fuente citada
   - ⬜ No aparece, pero competidores sí (anotar quiénes)
   - ❌ Sin respuesta AI para esta query
3. Anotar la URL específica que fue citada (si aplica)

#### Spreadsheet Template

```
https://docs.google.com/spreadsheets/d/ (crear copia)
```

Columnas:
- Query | Categoría | ChatGPT | Perplexity | Google AIO | URL citada | Competidores citados | Notas

### Opción 2: Herramientas Automatizadas (Pago — Cuando el presupuesto lo permita)

| Herramienta | Precio | Cobertura | Ideal para |
|-------------|:-----:|-----------|------------|
| **Otterly AI** | ~$29/mes | ChatGPT, Perplexity, Google AIO, Gemini | Equipos pequeños, 15-20 queries |
| **Peec AI** | ~€75-95/mes | ChatGPT, Gemini, Perplexity, Claude, Copilot | Marketing teams, 50+ queries |
| **ZipTie** | ~$49/mes | Google AIO, ChatGPT, Perplexity, Gemini | Brand mention + sentiment |
| **Profound** | ~$499/mes | Enterprise, multi-engine | Grandes equipos, tracking masivo |

#### Recomendación

Empezar con **DIY mensual** (gratis) durante 3 meses. Si se confirma que las queries target están generando tráfico AI, considerar **Otterly AI** ($29/mes) para automatizar el tracking.

### Señales de Éxito (3 meses)

| Métrica | Target | Cómo medirlo |
|---------|:-----:|-------------|
| Queries brand citadas en AI | 5/10 | Check mensual DIY |
| Queries no-brand citadas | 3-5 | Check mensual DIY |
| Tráfico referido desde AI | >100 visitas/mes | Google Analytics / Vercel Analytics |
| Schema implementado | 10+ tipos | Validación manual |
| Contenido comparativa/guía | 3+ artículos | Conteo en /blog y /guides |

---

## 13. Progreso General del Plan GEO

| Fase | Estado | % |
|:----:|:------:|:-:|
| **Fase 1: Fundación técnica** (robots, sitemap, schema, metadata) | ✅ Completado | 100% |
| **Fase 2: Archivos legibles por máquinas** (llms.txt, pricing.md) | ✅ Completado | 100% |
| **Fase 3: Contenido estructurado** (FAQ, HowTo, comparativas, guías) | ✅ Completado | 100% |
| **Fase 4: Freshness + autoridad** (fechas, autores, stats) | ✅ Completado | 100% |
| **Fase 5: Presencia externa** (Wikipedia, directorios, Reddit, YouTube) | 🟡 En progreso | 40% |
| **Fase 6: Monitoreo** (Lighthouse, AI visibility tracking) | 🟡 En progreso | 70% |

---

## 14. Lo que NO Hacer

1. **NO crear páginas separadas "para IA"** — Google lo llama **scaled content abuse** en su spam policy. Mismo contenido para humanos e IA.
2. **NO fragmentar contenido en bloques diminutos** — Google dice explícitamente: "Don't break your content into tiny pieces for AI to better understand it." Usar párrafos y headings normales.
3. **NO keyword stuffing** — el estudio Princeton muestra -10% de visibilidad en IA.
4. **NO fabricar citas en Wikipedia/Reddit** — participación auténtica o nada.
5. **NO bloquear AI crawlers** — actualmente están permitidos ✅, mantener así. Verificar que `Google-Extended` (Google Gemini/AI Overviews) también está permitido.
6. **NO esconder precios detrás de JS o "contact sales"** — los agentes de IA necesitan verlos en HTML plano.
7. **NO ignorar E-E-A-T** — contenido sin autor, fechas ni fuentes pierde contra competidores.
8. **NO olvidar monitorear** — la AI search cambia rápido. Check mensual obligatorio.
9. **NO generar contenido masivo con IA y esperar citación** — el contenido generado por IA es válido si cumple Search Essentials, pero masa de variaciones finas no.
