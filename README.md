# InkVerse - Plataforma de Manga

<p align="center">
  <img src="public/icons/icon-192x192.svg" alt="InkVerse Logo" width="120">
</p>

<p align="center">
  <strong>Lee, descubre y crea mangas en la plataforma más completa para fans y creadores.</strong>
</p>

<p align="center">
  <a href="https://nextjs.org">
    <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js">
  </a>
  <a href="https://www.typescriptlang.org">
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript">
  </a>
  <a href="https://www.prisma.io">
    <img src="https://img.shields.io/badge/Prisma-5.0-2D3748?style=flat-square&logo=prisma" alt="Prisma">
  </a>
  <a href="https://tailwindcss.com">
    <img src="https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind">
  </a>
</p>

## ✨ Características

### 📖 Para Lectores
- **Lector optimizado**: Modo paginado y scroll, navegación fluida
- **Biblioteca personal**: Organiza tus mangas favoritos
- **Progreso de lectura**: Sincronización automática
- **Sistema XP**: Gana recompensas mientras lees
- **Logros**: Desbloquea insignias por tu actividad
- **Notificaciones**: Alertas de nuevos capítulos
- **PWA**: Instala como app en móvil/desktop
- **Offline**: Acceso a contenido cacheado

### ✍️ Para Creadores
- **Subida de capítulos**: Arrastra y suelta páginas
- **Editor de manga**: Gestión completa de series
- **Crowdfunding**: Financia capítulos con InkCoins
- **Propinas**: Recibe apoyo de lectores
- **Analytics**: Estadísticas de lectura
- **Rankings**: Compite en rankings mensuales

### 💰 Economía InkCoins
- **Compra**: Integración Stripe para comprar InkCoins
- **Uso**: Patrocina capítulos, da propinas
- **Gana**: XP por lectura, logros, ranking
- **Wallet**: Gestión de saldo y transacciones

### 👥 Comunidad
- **Clanes**: Únete o crea grupos de lectura
- **Comentarios**: Discute capítulos
- **Rankings**: Compite por XP mensual
- **Eventos**: Temporadas y competiciones

## 🚀 Tecnologías

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Estilos**: Tailwind CSS + Radix UI
- **Estado**: Zustand + SWR
- **Backend**: Next.js API Routes + Edge Functions
- **Base de datos**: Prisma + SQLite (dev) / PostgreSQL (prod)
- **Cache**: Redis + Memory fallback
- **Auth**: NextAuth v5 + JWT
- **Pagos**: Stripe
- **Email**: Resend / SMTP
- **Storage**: Vercel Blob / Local filesystem
- **AI**: NVIDIA NIM + OpenAI
- **Testing**: Vitest + Playwright
- **CI/CD**: GitHub Actions

## 📦 Instalación

### Requisitos
- Node.js 18+
- npm 9+
- Git

### Clonar y configurar

```bash
# Clonar repositorio
git clone https://github.com/yourusername/inkverse.git
cd inkverse

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar desarrollo
npm run dev
```

### Acceder a la app

- **App**: http://localhost:3000
- **Studio**: http://localhost:5555 (Prisma Studio)

## 🏗️ Estructura del Proyecto

```
inkverse/
├── prisma/                 # Esquema de base de datos
├── public/                 # Assets estáticos
│   ├── icons/             # Iconos PWA
│   └── manifest.json      # Config PWA
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API Routes
│   │   ├── (routes)/      # Páginas de la app
│   │   └── layout.tsx     # Root layout
│   ├── components/        # Componentes React
│   │   ├── ui/           # Componentes base
│   │   └── pwa/          # Componentes PWA
│   ├── core/             # Lógica de negocio
│   │   └── services/     # Servicios
│   ├── hooks/            # Custom hooks
│   │   └── __tests__/    # Tests de hooks
│   ├── lib/              # Utilidades
│   │   ├── email-templates.ts
│   │   ├── notifications.ts
│   │   └── stripe.ts
│   └── types/            # Tipos TypeScript
├── scripts/              # Scripts de utilidad
│   └── deploy/          # Scripts de deployment
├── docs/                 # Documentación
│   └── deployment/      # Guías de deployment
├── tests/                # Tests
├── next.config.ts       # Configuración Next.js
├── tailwind.config.ts   # Configuración Tailwind
└── package.json         # Dependencias
```

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests con UI
npm run test:ui

# Tests E2E
npm run test:e2e

# Cobertura
npm run test:coverage
```

## 📊 Scripts disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run dev:socket      # Iniciar servidor WebSocket
npm run dev:all         # Iniciar ambos

# Build
npm run build           # Build para producción
npm start               # Iniciar servidor producción

# Database
npm run prisma:migrate  # Crear migración
npm run prisma:generate # Generar cliente
npm run prisma:studio   # Abrir Prisma Studio
npm run db:seed         # Ejecutar seed

# Testing
npm run test            # Tests unitarios
npm run test:ui         # Tests con UI
npm run test:coverage   # Tests con cobertura
npm run test:e2e        # Tests E2E

# Linting
npm run lint            # Ejecutar ESLint
```

## 🚀 Deployment

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Ver [docs/deployment/VERCEL.md](docs/deployment/VERCEL.md) para guía detallada.

### Variables de entorno requeridas

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="random-secret"
NEXTAUTH_URL="https://your-domain.com"

# Opcionales
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
RESEND_API_KEY="re_..."
REDIS_URL="redis://..."
SENTRY_DSN="https://..."
```

## 📱 PWA

InkVerse es una Progressive Web App completa:

- **Instalación**: Añade a pantalla de inicio
- **Offline**: Funciona sin conexión
- **Push notifications**: Alertas de nuevos capítulos
- **Share target**: Comparte desde otras apps
- **Background sync**: Sincroniza cuando hay conexión

## 🎨 Personalización

### Temas

Editar `tailwind.config.ts`:

```ts
colors: {
  primary: {
    DEFAULT: '#6366f1',
    dark: '#4f46e5',
  },
  // ...
}
```

### Configuración

Ver `next.config.ts` para opciones de:
- Optimización de imágenes
- Cache headers
- Experimental features
- Turbopack

## 🔒 Seguridad

- **Auth**: JWT + bcrypt para contraseñas
- **Rate limiting**: Configurable por endpoint
- **CORS**: Configurado en API routes
- **Headers**: Security headers en next.config
- **Validation**: Zod para validación de inputs
- **SQL Injection**: Protección vía Prisma
- **XSS**: Sanitización de contenido

## 📈 Monitoreo

### Sentry (opcional)

Configurar `SENTRY_DSN` para:
- Error tracking
- Performance monitoring
- Session replay

### Analytics

- Vercel Analytics: Habilitado por defecto
- Custom events: Vía API `/api/analytics`

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

### Guías de contribución

- Seguir [Conventional Commits](https://conventionalcommits.org)
- Tests para nuevas funcionalidades
- Documentar APIs en código
- Respetar el linter (ESLint)

## 📝 Licencia

[MIT](LICENSE) © InkVerse

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org) - Framework
- [Vercel](https://vercel.com) - Hosting
- [Prisma](https://prisma.io) - ORM
- [Stripe](https://stripe.com) - Pagos
- [Radix UI](https://radix-ui.com) - Componentes base

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/yourusername/inkverse/issues)
- **Email**: support@inkverse.app
- **Discord**: [Unirse](https://discord.gg/inkverse)

---

<p align="center">
  Hecho con ❤️ por el equipo de InkVerse
</p>
