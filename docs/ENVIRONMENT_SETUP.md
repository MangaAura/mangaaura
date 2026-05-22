# Configuración de Variables de Entorno

## Desarrollo Local

### 1. Clonar el archivo de ejemplo

```bash
cp .env.example .env.local
```

### 2. Configurar las variables

Edita `.env.local` con tus valores:

#### Database (SQLite para desarrollo)

```env
DATABASE_URL="file:./dev.db"
```

Para usar PostgreSQL en desarrollo:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/inkverse?schema=public"
```

#### MongoDB (Opcional en desarrollo)

```env
MONGODB_URI="mongodb://localhost:27017/mangaaura_dev"
```

#### Redis (Opcional en desarrollo)

```env
REDIS_URL="redis://localhost:6379"
```

Si no tienes Redis, las funciones de caché funcionarán sin él.

#### NextAuth.js (Obligatorio)

```env
NEXTAUTH_SECRET="tu-secreto-minimo-32-caracteres"
NEXTAUTH_URL="http://localhost:3000"
```

Genera un secreto seguro:

```bash
openssl rand -base64 32
```

#### NVIDIA AI API (Opcional)

Para desarrollo, deja vacío o usa el proveedor "in-memory":

```env
NVIDIA_API_KEY=""
AI_PROVIDER="in-memory"
```

## Producción (Vercel)

### 1. Configurar en Dashboard de Vercel

Ve a: **Project Settings > Environment Variables**

Agrega cada variable:

| Variable | Valor de ejemplo | Tipo |
|----------|------------------|------|
| `DATABASE_URL` | `postgresql://...` | Production |
| `MONGODB_URI` | `mongodb+srv://...` | Production |
| `REDIS_URL` | `rediss://...` | Production |
| `NEXTAUTH_SECRET` | `abc123...` | Production |
| `NEXTAUTH_URL` | `https://mangaaura.es` | Production |
| `NVIDIA_API_KEY` | `nvapi-...` | Production |
| `GOOGLE_CLIENT_ID` | `...apps.googleusercontent.com` | Production |
| `GOOGLE_CLIENT_SECRET` | `...` | Production |
| `GITHUB_CLIENT_ID` | `...` | Production |
| `GITHUB_CLIENT_SECRET` | `...` | Production |
| `CRON_SECRET` | `...` | Production |

### 2. Usando CLI de Vercel

```bash
# Login
vercel login

# Agregar variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
```

### 3. Servicios recomendados

#### Database (PostgreSQL)

- **Vercel Postgres** (integrado)
- **Supabase** (gratis hasta 500MB)
- **Railway** (gratis hasta 500MB)
- **Neon** (gratis hasta 500MB)

#### MongoDB

- **MongoDB Atlas** (gratis 512MB)

#### Redis

- **Upstash** (gratis 10,000 requests/día)
- **Redis Cloud** (gratis 30MB)

## Verificación

Para verificar que las variables están configuradas:

```bash
# En desarrollo
cat .env.local

# En producción (Vercel)
vercel env ls
```

## Variables Opcionales

Estas variables tienen valores por defecto y son opcionales:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Entorno de ejecución |
| `APP_NAME` | `MangaAura` | Nombre de la app |
| `APP_URL` | `http://localhost:3000` | URL base |
| `AI_PROVIDER` | `in-memory` | Proveedor de IA |
| `AI_RATE_LIMIT` | `40` | Límite de requests/min |
| `ENABLE_AI_ANALYSIS` | `true` | Habilitar análisis IA |
| `CSP_REPORT_URL` | - | Endpoint para recibir reportes de violaciones CSP |

### Monitoreo CSP (Content Security Policy)

Para recibir reportes de violaciones CSP en producción, configura:

```env
CSP_REPORT_URL="https://mangaaura.es/api/csp-report"
```

Esto aña de `report-uri` al header `Content-Security-Policy` y habilita
el endpoint `/api/csp-report` para recibir y registrar violaciones.
Los reportes de extensiones de navegador (chrome-extension://, moz-extension://, etc.)
se filtran automáticamente como ruido.

## Solución de Problemas

### Error: "DATABASE_URL is not defined"

Asegúrate de que `.env.local` existe y tiene la variable definida.

### Error: "JWT must be provided"

El `NEXTAUTH_SECRET` debe tener al menos 32 caracteres.

### Error: "Redis connection failed"

En desarrollo, Redis es opcional. La app funcionará sin caché.

### Error: "NVIDIA API rate limit exceeded"

Verifica tu plan de NVIDIA AI. El límite gratuito es 40 RPM.
