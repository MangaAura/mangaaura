# Discord Integration — MangaAura

## Qué tenemos

```
scripts/discord/
└── notify-new-content.ts    ← Script para notificar artículos/capítulos a Discord
src/app/api/cron/discord-notify/
└── route.ts                 ← Endpoint Cron de Vercel para auto-notificar
```

## Cómo configurar

### 1. Crear un Webhook en Discord

1. Abre tu servidor Discord
2. Server Settings → Integrations → Webhooks → New Webhook
3. Nómbralo "MangaAura", selecciona el canal
4. Copia la URL del webhook

### 2. Configurar variables de entorno

En Vercel (Production):

```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
CRON_SECRET=  ← una clave aleatoria (opcional, protege el cron)
```

En `.env.local` para pruebas:

```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DATABASE_URL=postgresql://...
```

### 3. Probar localmente

```bash
# Notificar último artículo
npx tsx scripts/discord/notify-new-content.ts

# Notificar artículo específico
npx tsx scripts/discord/notify-new-content.ts --article=donde-leer-manga-online-gratis-legal-2026

# Notificar últimos capítulos
npx tsx scripts/discord/notify-new-content.ts --chapters
```

### 4. El cron ya está configurado

En `vercel.json` → notifica a las 12:00 UTC cada día.

### 5. Probar el cron

```bash
curl "https://mangaaura.es/api/cron/discord-notify?secret=TU_SECRET"
```

---

## Posibles expansiones

- **Comandos slash** (necesita Bot, no solo Webhook): `/ranking`, `/ultimo-capitulo`, `/top-lectores`
- **Notificaciones por evento**: Cuando alguien sube de nivel, cuando un manga llega a meta de crowdfunding
- **Multi-servidor**: Bot que se puede invitar a cualquier servidor
