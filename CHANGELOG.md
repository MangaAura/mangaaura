# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Sistema completo de autenticación con NextAuth v5
- Integración con proveedores OAuth (Google, Discord, GitHub)
- Panel de administración con gestión de mangas, usuarios y moderación
- Sistema de biblioteca personal con progreso de lectura
- Rankings y sistema de XP
- Clanes de lectura
- Sistema de comentarios con likes y menciones
- Crowdfunding para capítulos con InkCoins
- Sistema de propinas entre usuarios
- Notificaciones en tiempo real
- PWA completa con offline support
- Push notifications
- Templates de email responsivos
- Integración Stripe para compra de InkCoins
- Analytics de lectura
- Sistema de logros y badges
- Panel de creador con analytics
- Subida de capítulos drag & drop
- Gestión de series de manga
- Sistema de búsqueda con filtros
- Cache con Redis
- Rate limiting
- Health check endpoint
- Sentry integration para error tracking

### Changed
- Migración a Next.js 16 con Turbopack
- Actualización a React 19
- Mejoras de performance con lazy loading
- Optimización de imágenes con Sharp

### Fixed
- Errores de TypeScript en build
- Suspense boundaries para useSearchParams
- Configuración de Prisma para modelos relacionados

## [0.1.0] - 2024

### Added
- Versión inicial del proyecto
- Estructura base con Next.js App Router
- Configuración de Tailwind CSS y componentes UI
- Setup inicial de Prisma con SQLite
- Layout responsive con Navbar y Sidebar
- Página principal con featured mangas
- Sistema de búsqueda básico

### Tech Stack
- Next.js 15+
- React 18+
- TypeScript 5+
- Tailwind CSS 3+
- Prisma 5+
- NextAuth v5 beta

---

## Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato (no afectan código)
- `refactor:` Refactorización de código
- `perf:` Mejora de performance
- `test:` Cambios en tests
- `chore:` Tareas de mantenimiento
- `ci:` Cambios en CI/CD
- `build:` Cambios en build system
- `revert:` Revertir cambios

Ejemplo:
```
feat(auth): add password reset functionality

- Add password reset email template
- Create /api/auth/forgot-password endpoint
- Add reset password page

Closes #123
```
