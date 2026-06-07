# Herramientas gratuitas para gestionar redes sociales de MangaAura

## Programación de posts

| Herramienta     | Plan gratis | Límites                         | Ideal para            |
| --------------- | ----------- | ------------------------------- | --------------------- |
| **Buffer**      | Sí          | 3 canales, 10 posts programados | X + Instagram         |
| **Typefully**   | Sí          | Hilos ilimitados en X           | X/Twitter             |
| **Hootsuite**   | Sí          | 2 canales, 5 programados        | Multiplataforma       |
| **Later**       | Sí          | 1 plataforma, 30 posts          | Instagram visual      |
| **TweetHunter** | Sí (prueba) | Limitado                        | Gestión de hilos en X |

## Creación de imágenes

| Herramienta          | Plan gratis           | Ideal para                                                |
| -------------------- | --------------------- | --------------------------------------------------------- |
| **Canva**            | Sí (muchas templates) | Posts, carruseles, historias                              |
| **Figma**            | Sí                    | Diseños personalizados                                    |
| **MangaAura OG API** | Gratis infinito       | `/api/og?type=blog&title=...` genera imágenes automáticas |

## Análisis

| Herramienta            | Plan gratis       | Ideal para                 |
| ---------------------- | ----------------- | -------------------------- |
| **Twitter Analytics**  | Gratis            | Métricas nativas de X      |
| **Instagram Insights** | Gratis            | Métricas nativas de IG     |
| **Social Blade**       | Gratis (limitado) | Comparativa de crecimiento |

## Contenido visual rápido

Usa este endpoint de MangaAura para generar imágenes automáticas:

```
https://mangaaura.es/api/og?type=blog&title=Tu+título+aquí
```

Esto genera una imagen 1200x630 con branding de MangaAura lista para compartir.

## Flujo de trabajo recomendado (30 min/semana)

1. **Lunes 10 min**: Genera posts con `npx tsx scripts/social/generate-posts.ts`
2. **Lunes 10 min**: Programa 7 tweets en Typefully/Buffer (1 por día)
3. **Lunes 10 min**: Crea 2 historias de Instagram en Canva
4. **Viernes 5 min**: Revisa qué funcionó, ajusta para la próxima semana

## Contenido que funciona mejor

Según datos de la industria del manga en redes:

- Hilos educativos → mejor engagement en X
- Carruseles → mejor alcance en Instagram
- Clips cortos con música → mejor viralidad en TikTok
- Posts los viernes a las 18-20h → mejor horario para comunidad manga
