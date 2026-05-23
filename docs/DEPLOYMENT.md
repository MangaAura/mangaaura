# MangaAura Deployment Guide

Guia completa para desplegar MangaAura en produccion.

## Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Despliegue en Vercel](#despliegue-en-vercel)
3. [Configuracion de Base de Datos](#configuracion-de-base-de-datos)
4. [Configuracion de Redis](#configuracion-de-redis)
5. [Configuracion de Almacenamiento](#configuracion-de-almacenamiento)
6. [Configuracion de Email](#configuracion-de-email)
7. [Variables de Entorno](#variables-de-entorno)
8. [Dominio Personalizado](#dominio-personalizado)
9. [Monitoreo](#monitoreo)
10. [Troubleshooting](#troubleshooting)

---

## Requisitos Previos

Antes de comenzar el despliegue, asegurate de tener:

- [ ] Cuenta en [Vercel](https://vercel.com)
- [ ] Cuenta en [GitHub](https://github.com) (o GitLab/Bitbucket)
- [ ] Base de datos PostgreSQL (Neon/Supabase/Railway)
- [ ] Redis (Upstash/Redis Cloud)
- [ ] Proyecto en Vercel Blob Storage
- [ ] Cuenta en [Stripe](https://stripe.com) (para pagos)
- [ ] Cuenta en [Resend](https://resend.com) (para emails)

---

## Despliegue en Vercel

### Paso 1: Importar Proyecto

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en "Add New..." → "Project"
3. Importa tu repositorio de Git
4. Selecciona el proyecto MangaAura

### Paso 2: Configurar Build

Vercel detectara automaticamente Next.js. Verifica estas configuraciones:

**Build Settings:**
```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

**Node.js Version:**
```
Node.js Version: 20.x (o superior)
```

### Paso 3: Configurar Variables de Entorno

Durante el despliegue inicial, configura las variables esenciales:

```bash
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=tu-secreto-32-caracteres
NEXTAUTH_URL=https://tu-dominio.vercel.app

# Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_token
```

Las demas variables se configuran despues (ver [Variables de Entorno](#variables-de-entorno)).

### Paso 4: Desplegar

1. Click "Deploy"
2. Espera a que termine el build
3. Accede a tu URL de despliegue

---

## Configuracion de Base de Datos

### Opcion 1: Neon (Recomendado)

**Ventajas:**
- Servless PostgreSQL
- Escalado automatico
- Buen free tier
- Integracion nativa con Vercel

**Pasos:**

1. Crea cuenta en [neon.tech](https://neon.tech)
2. Crea un nuevo proyecto
3. Crea una base de datos llamada `mangaaura`
4. Ve a "Connection Details" → "Prisma"
5. Copia el "Connection String"
6. En Vercel Dashboard → Settings → Environment Variables:
   ```
   DATABASE_URL=tu-connection-string
   ```

### Opcion 2: Supabase

**Ventajas:**
- Base de datos + autenticacion
- Buena documentacion
- Generoso free tier

**Pasos:**

1. Crea cuenta en [supabase.com](https://supabase.com)
2. Crea nuevo proyecto
3. Ve a Settings → Database → Connection string
4. Selecciona "Prisma" → Copia URI
5. Configura en Vercel:
   ```
   DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
   ```

### Migrar desde SQLite

Si desarrollaste con SQLite, debes migrar a PostgreSQL:

```bash
# 1. Actualizar schema.prisma
# Cambiar provider a "postgresql"

# 2. Generar migraciones para PostgreSQL
npx prisma migrate dev --name init_postgres

# 3. Aplicar en produccion
npx prisma migrate deploy
```

### Seed de Datos en Produccion

```bash
# Local: conectar a DB de produccion
DATABASE_URL="postgresql://..." npx prisma db seed

# O usar Vercel CLI
vercel env add DATABASE_URL
vercel --prod
```

---

## Configuracion de Redis

Redis se usa para cache, rate limiting y colas de procesamiento.

### Upstash (Recomendado)

**Pasos:**

1. Crea cuenta en [upstash.com](https://upstash.com)
2. Crea nuevo database
3. Selecciona region cercana a tu despliegue Vercel
4. Ve a "Details" → Copia "Redis URL"
5. Configura en Vercel:
   ```
   REDIS_URL=rediss://default:password@host:port
   ```

**Nota:** Usa `rediss://` (con doble s) para conexion SSL.

### Redis Cloud

Alternativa si necesitas mas capacidad:

1. [Redis Cloud](https://redis.com/cloud/)
2. Crea subscription
3. Crea database
4. Copia endpoint y configura REDIS_URL

---

## Configuracion de Almacenamiento

### Vercel Blob Storage (Recomendado)

**Pasos:**

1. En Vercel Dashboard → Storage → Create
2. Selecciona "Blob"
3. Crea store
4. Ve a "Browse" → ".env.local"
5. Copia el valor de `BLOB_READ_WRITE_TOKEN`
6. Configura en Environment Variables:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_token_aqui
   ```

**Limites del plan gratuito:**
- 250 MB almacenamiento
- 100 GB bandwidth/mes
- 1M requests/mes

### Alternativas

Para mayor capacidad:
- **AWS S3** + CloudFront
- **Cloudflare R2**
- **DigitalOcean Spaces**

---

## Configuracion de Email

### Resend (Recomendado - Gratis hasta 3000 emails/mes)

**Pasos:**

1. Crea cuenta en [resend.com](https://resend.com)
2. Verifica tu dominio (añade registros DNS)
3. Ve a "API Keys" → Create API Key
4. Copia la API key
5. Configura en Vercel:
   ```
   RESEND_API_KEY=re_tu_api_key
   EMAIL_FROM=noreply@tu-dominio.com
   EMAIL_FROM_NAME="MangaAura"
   ```

**Verificacion de dominio:**

Añade estos registros DNS en tu proveedor:

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@tu-dominio.com

Type: TXT
Name: resend._domainkey
Value: [proporcionado por Resend]

Type: TXT
Name: resend._domainkey.tu-dominio.com
Value: [proporcionado por Resend]
```

### SMTP Alternativo

Si prefieres usar SMTP (Gmail, Outlook, etc.):

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password
```

**Nota:** Para Gmail, usa "App Passwords" no tu contrasena normal.

---

## Variables de Entorno

### Lista Completa de Variables

Configura todas estas variables en Vercel Dashboard → Settings → Environment Variables:

#### Obligatorias

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de PostgreSQL | `postgresql://...` |
| `NEXTAUTH_SECRET` | Secreto JWT | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL de la app | `https://tu-dominio.com` |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob | `vercel_blob_...` |

#### OAuth (Opcional pero recomendado)

| Variable | Descripcion | Como obtener |
|----------|-------------|--------------|
| `GOOGLE_CLIENT_ID` | ID de Google OAuth | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Secreto de Google | Google Cloud Console |
| `GITHUB_ID` | ID de GitHub OAuth | GitHub Settings → Developer |
| `GITHUB_SECRET` | Secreto de GitHub | GitHub Settings → Developer |

#### Servicios

| Variable | Descripcion | Proveedor |
|----------|-------------|-----------|
| `REDIS_URL` | URL de Redis | Upstash |
| `MONGODB_URI` | URI de MongoDB | MongoDB Atlas |
| `RESEND_API_KEY` | API Key de Resend | Resend |
| `STRIPE_SECRET_KEY` | Clave secreta Stripe | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Secreto webhook Stripe | Stripe Dashboard |

#### IA (Opcional)

| Variable | Descripcion | Como obtener |
|----------|-------------|--------------|
| `NVIDIA_API_KEY` | API de NVIDIA | build.nvidia.com |

#### Configuracion

| Variable | Default | Descripcion |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Entorno |
| `APP_NAME` | `MangaAura` | Nombre de la app |
| `APP_URL` | - | URL de la app |
| `ENABLE_AI_ANALYSIS` | `true` | Habilitar IA |
| `AI_RATE_LIMIT` | `40` | RPM de NVIDIA |
| `CRON_SECRET` | - | Secreto para cron jobs |

### Configurar via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Agregar variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add BLOB_READ_WRITE_TOKEN
vercel env add REDIS_URL
vercel env add RESEND_API_KEY

# Para produccion especificamente
vercel env add DATABASE_URL --prod
```

---

## Dominio Personalizado

### Paso 1: Comprar Dominio

Opciones populares:
- [Namecheap](https://namecheap.com)
- [Google Domains](https://domains.google)
- [Cloudflare Registrar](https://cloudflare.com)
- [Porkbun](https://porkbun.com)

### Paso 2: Configurar en Vercel

1. Vercel Dashboard → Project Settings → Domains
2. Click "Add"
3. Ingresa tu dominio
4. Selecciona opcion de configuracion DNS

### Paso 3: Configurar DNS

**Opcion A: Nameservers de Vercel (Recomendado)**

Cambia los nameservers de tu dominio a:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**Opcion B: Registros DNS Manuales**

Añade estos registros:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Paso 4: Configurar HTTPS

Vercel proporciona SSL automaticamente via Let's Encrypt. Verifica:

1. El dominio aparece como "Valid" en el dashboard
2. HTTPS esta habilitado automaticamente
3. Redireccion de HTTP a HTTPS funciona

### Paso 5: Actualizar NEXTAUTH_URL

```bash
vercel env rm NEXTAUTH_URL
vercel env add NEXTAUTH_URL
# Valor: https://tu-dominio.com
```

Redespliega:
```bash
vercel --prod
```

---

## Monitoreo

### Vercel Analytics

Habilitado automaticamente. Ve a:
- Vercel Dashboard → Analytics

Métricas disponibles:
- Web Vitals (LCP, FID, CLS)
- Tiempo de carga
- Requests por ruta

### Logs

**En tiempo real:**
```bash
vercel logs --prod
```

**Filtrar por funcion:**
```bash
vercel logs --prod --filter=api/manga
```

**En Dashboard:**
- Functions → Selecciona funcion → Logs

### Errores

Configura integraciones:

1. **Sentry** (Recomendado)
   ```bash
   vercel integrations add sentry
   ```

2. **LogRocket**
   ```bash
   vercel integrations add logrocket
   ```

3. **Datadog**
   ```bash
   vercel integrations add datadog
   ```

### Alertas

Configura alertas en Vercel:
- Dashboard → Settings → Notifications
- Habilitar email para errores
- Configurar alertas de uso

---

## Troubleshooting

### Error: "Database connection failed"

**Causas comunes:**
1. DATABASE_URL incorrecta
2. IP no permitida en DB
3. SSL requerido pero no configurado

**Solucion:**
```bash
# Verificar formato
postgresql://user:password@host:5432/dbname?schema=public&sslmode=verify-full

# Para Neon/Supabase, usa ?sslmode=verify-full
```

### Error: "Build failed"

**Causas comunes:**
1. TypeScript errors
2. Dependencias faltantes
3. Variables de entorno no configuradas

**Solucion:**
```bash
# Local build test
npm run build

# Verificar variables
vercel env ls

# Reinstalar dependencias
rm -rf node_modules
npm install
```

### Error: "Images not loading"

**Causas:**
1. BLOB_READ_WRITE_TOKEN incorrecto
2. Permisos de blob storage
3. URLs de imagen expiradas

**Solucion:**
```bash
# Verificar token en Vercel
# Asegurate de que las imagenes se suban correctamente
# Revisa los logs de upload
```

### Error: "OAuth redirect mismatch"

**Causas:**
1. NEXTAUTH_URL incorrecta
2. URLs de callback OAuth mal configuradas

**Solucion:**
```bash
# Actualizar NEXTAUTH_URL
vercel env rm NEXTAUTH_URL --prod
vercel env add NEXTAUTH_URL --prod
# Valor exacto con https://

# Configurar URIs en Google/GitHub:
# https://tu-dominio.com/api/auth/callback/google
# https://tu-dominio.com/api/auth/callback/github
```

### Error: "Rate limit exceeded"

**Solucion:**
1. Revisar uso de NVIDIA API (40 RPM)
2. Implementar cache mas agresivo
3. Aumentar tier de plan

### Build muy lento

**Optimizaciones:**
```bash
# Usar pnpm en lugar de npm
vercel env add ENABLE_PNPM
# Valor: true

# Incrementar timeout de build
# Project Settings → Build & Development Settings
```

---

## Checklist Pre-Despliegue

Antes de hacer el despliegue final:

- [ ] Base de datos PostgreSQL configurada
- [ ] Migraciones aplicadas (`prisma migrate deploy`)
- [ ] Seed de datos ejecutado (si es necesario)
- [ ] Redis configurado (para cache/rate limiting)
- [ ] Vercel Blob Storage configurado
- [ ] OAuth apps configuradas (Google/GitHub)
- [ ] Emails configurados (Resend)
- [ ] Variables de entorno todas configuradas
- [ ] Dominio personalizado configurado (opcional)
- [ ] NEXTAUTH_URL actualizado con dominio final
- [ ] Stripe webhooks configurados (para pagos)
- [ ] Monitoreo configurado (Sentry/LogRocket)
- [ ] Tests pasando (`npm run test`)
- [ ] Build local exitoso (`npm run build`)
- [ ] Lighthouse score aceptable

---

## Comandos Utiles

```bash
# Deploy a preview
vercel

# Deploy a produccion
vercel --prod

# Ver logs
vercel logs --prod

# Ejecutar funcion serverless local
vercel dev

# Listar variables
vercel env ls

# Eliminar variable
vercel env rm VARIABLE_NAME

# Redeploy sin cache
vercel --prod --force
```

---

## Escalamiento

### Planes Recomendados

**Para lanzamiento (0-1000 usuarios):**
- Vercel: Hobby (gratis)
- Neon: Free Tier
- Upstash: Free Tier
- Resend: Free Tier (3000 emails/mes)
- Stripe: Free (solo fees de transaccion)

**Para crecimiento (1000-10000 usuarios):**
- Vercel: Pro ($20/mes)
- Neon: Pro ($19/mes)
- Upstash: Pay as you go
- Resend: Pro ($20/mes)

**Para escala (10000+ usuarios):**
- Vercel: Pro o Enterprise
- Neon: Pro o mayor
- Redis: Enterprise plan
- CDN: Cloudflare Pro

---

## Recursos

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Neon Documentation](https://neon.tech/docs)
- [Upstash Documentation](https://docs.upstash.com/)
- [Resend Documentation](https://resend.com/docs)
