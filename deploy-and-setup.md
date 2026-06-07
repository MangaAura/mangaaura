# Deploy & Setup Helper — MangaAura

Usa este script desde tu máquina local para gestionar despliegues y variables de entorno.

## Requisitos

- Tener Vercel CLI instalado: `npm i -g vercel`
- Estar logueado: `vercel login`
- Tener acceso al proyecto en Vercel

---

## 1. Desplegar cambios pendientes

```bash
git add -A
git commit -m "feat: new blog articles, social tools, discord notifications, analytics, pwa manifest"
git push
```

Vercel despliega automáticamente desde `main`. No necesitas `vercel deploy`.

---

## 2. Configurar variables de entorno en Vercel

```bash
# Analytics (crear en analytics.google.com primero)
vercel env add NEXT_PUBLIC_GA_ID

# Search Console (poner el content="" de la etiqueta de verificación)
vercel env add NEXT_PUBLIC_GOOGLE_VERIFICATION

# Discord (crear webhook en Server Settings > Integrations > Webhooks)
vercel env add DISCORD_WEBHOOK_URL

# CRON_SECRET (generar string aleatorio: openssl rand -hex 32)
vercel env add CRON_SECRET

# Email (Resend)
vercel env add RESEND_API_KEY
```

¡Importante! Después de añadir env vars, redeploy:

```bash
git commit --allow-empty -m "chore: trigger redeploy after env config"
git push
```

---

## 3. Verificar y probar

```bash
# Ver Search Console → ver mangaaura.es está verificada
# Ver Analytics → ver datos están llegando

# Probar Discord
curl "https://mangaaura.es/api/cron/discord-notify?secret=TU_SECRET"
# Debería responder: {"ok":true,"results":["article: ok","chapters: ok"]}

# Probar Search Console verification
curl "https://mangaaura.es"
# Ver meta tag: <meta name="google-site-verification" content="...">
```

---

## 4. Subir artículos del blog (fase 2)

El script no funciona desde local (Neon bloquea IPs no autorizadas).
Opción A — Usar Neon SQL Console:

```bash
# Ir a https://console.neon.tech
# Seleccionar proyecto → SQL Editor
# Abrir scripts/seed-blog-articles-phase2.sql
# Copiar y pegar todo → Run
```

Opción B — Desde Vercel (si tienes acceso SSH/CLI):

```bash
vercel env pull .env.production
npx tsx scripts/seed-blog-articles-phase2.ts
```

---

## 5. Generar posts para redes sociales

```bash
npx tsx scripts/social/generate-posts.ts
# Salida: scripts/social/out/posts-YYYY-MM-DD.md
# Copiar contenido a Buffer/Typefully y programar
```

---

## 6. Estado del deploy

```bash
# Ver últimas 5 deploys
vercel list

# Ver logs de producción
vercel logs --limit 50
```

---

## Checklist post-deploy

- [ ] Search Console: mangaaura.es verificada
- [ ] Sitemaps enviados: /sitemap.xml, /news-sitemap.xml
- [ ] GA4: datos fluyendo (ver en analytics.google.com en 24h)
- [ ] Discord: webhook responde ok
- [ ] CRON_SECRET configurado
- [ ] Artículos fase 2 insertados (Neon SQL Editor)
- [ ] 1 post/día programado en X
- [ ] Directorios IA: TAAFT, Futurepedia, Toolify enviados
