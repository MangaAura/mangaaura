# MangaAura - Arquitectura Técnica

## 🏗️ Arquitectura General

MangaAura utiliza **Arquitectura Hexagonal** (Clean Architecture) con **Domain-Driven Design** para garantizar extensibilidad y testabilidad.

```
┌─────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER (Next.js 16 + Tailwind CSS)              │
│ ├── App Router (Server Components)                           │
│ ├── API Routes                                              │
│ └── UI Components                                           │
├─────────────────────────────────────────────────────────────┤
│ APPLICATION LAYER                                           │
│ ├── Use Cases (RegisterUser, CompleteChapter, etc.)         │
│ ├── DTOs                                                    │
│ └── Services Coordination                                   │
├─────────────────────────────────────────────────────────────┤
│ DOMAIN LAYER (Core Business Logic)                          │
│ ├── Entities (User, Manga, Chapter)                         │
│ ├── Value Objects (Email, Password, XP, Money)              │
│ ├── Domain Events                                           │
│ └── Repository Interfaces (Ports)                           │
├─────────────────────────────────────────────────────────────┤
│ INFRASTRUCTURE LAYER (Adapters)                             │
│ ├── PostgreSQL + Prisma (Core Data)                        │
│ ├── MongoDB + Mongoose (Analytics)                         │
│ ├── NVIDIA AI Provider (40 RPM with Rate Limiting)         │
│ ├── NextAuth.js (Authentication)                           │
│ └── BullMQ + Redis (Queues)                                │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Stack Tecnológico

### Core
| Componente | Tecnología | Versión |
|------------|-----------|---------|
| Framework | Next.js | 16.2.4 |
| React | React | 19.2.4 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |

### Database
| Propósito | Tecnología | ORM |
|-----------|-----------|-----|
| Core Data | PostgreSQL | Prisma 7.8 |
| Analytics | MongoDB | Mongoose |
| Cache/Queue | Redis | BullMQ |

### Testing
| Tipo | Framework |
|------|-----------|
| Unit | Vitest + Testing Library |
| E2E | Playwright |
| Coverage | v8 |

### AI
| Servicio | NVIDIA API |
| Rate Limit | 40 RPM |
| Caché | 1 hora TTL |
| Fallback | InMemoryAIProvider |

### Auth
| Método | Implementación |
|--------|---------------|
| Credentials | bcryptjs + JWT |
| OAuth | Google + GitHub |
| Session | 30 días |

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests unitarios
npm run test

# Con UI interactiva
npm run test:ui

# Con coverage
npm run test:coverage

# Tests E2E
npm run test:e2e

# E2E con UI
npm run test:e2e:ui
```

### Estructura de Tests

```
tests/
├── unit/
│   ├── core/
│   │   ├── entities/          # Tests de entidades
│   │   └── value-objects/     # Tests de value objects
│   └── application/
│       └── use-cases/         # Tests de casos de uso
├── integration/
│   ├── repositories/          # Tests de DB
│   └── api/                   # Tests de endpoints
└── e2e/
    └── auth/                  # Flujos completos
```

## 🗄️ Modelos de Datos

### PostgreSQL (Prisma)

```prisma
- User (id, email, username, xpPoints, auraBalance, ...)
- MangaSeries (id, title, slug, authorId, status, ...)
- Chapter (id, mangaId, chapterNumber, crowdfundingGoal, ...)
- Clan (id, name, totalScore, monthlyScore, ...)
- Transaction (id, userId, amount, type, ...)
- AchievementDefinition (id, badgeId, xpReward, ...)
- SponsorshipBid (id, chapterId, userId, bidAmount, ...)
- UserManga (id, userId, mangaId, status, progress, ...)
- ChapterCorrection (id, chapterId, userId, status, ...)
- ReadingSession (id, userId, chapterId, durationSeconds, ...)
- Account/Sessions (NextAuth.js)
```

### MongoDB (Mongoose)

```typescript
- ReadingLog (userId, chapterId, events, totalTimeSeconds)
- Comment (chapterId, userId, aiAnalysis, isHidden)
- QualityReport (chapterId, issueType, severity, status)
- PromptLibrary (authorId, prompt, style, isPublic)
```

## 🎯 Value Objects

### Email
- Validación de formato
- Normalización (minúsculas, trim)
- Extracción de dominio

### Password
- Requisitos: 8+ chars, mayúscula, minúscula, número, especial
- Hashing con bcrypt
- Ocultación en logs

### XP
- Cálculo de niveles (cada 1000 XP)
- Ranks: Novato → Lector Shonen → Otaku Experto → Maestro Otaku → Leyenda Manga
- Fuentes: Capítulo (+2), Comentario (+5), Corrección (+20)

### Money (Aura)
- Operaciones seguras (no negativos)
- Validación de moneda
- Transacciones atómicas

## 🔒 Autenticación

### NextAuth.js v5 Configuration

```typescript
// Providers
- Credentials (Email + Password)
- Google OAuth
- GitHub OAuth

// Session
- JWT strategy
- 30 días de duración
- Datos de gamificación incluidos

// Callbacks
- JWT: Persistir XP, nivel, role
- Session: Enviar datos al cliente
- SignIn: Bonus de registro
```

### JWT Payload

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "xpPoints": 1500,
  "level": 2,
  "role": "USER"
}
```

## 🤖 AI Integration (NVIDIA)

### Rate Limiting
- **Límite**: 40 requests/minuto
- **Cola automática**: Bull/Bottleneck
- **Caché**: 1 hora TTL

### Funcionalidades

```typescript
interface IAProvider {
  analyzeComment(content: string): CommentAnalysis;
  detectSpoiler(content: string): number; // 0-100
  summarizeChapter(text: string): ChapterSummary;
  generateNotificationHook(summary: string): string;
  generateEmbedding(text: string): number[];
  classifyGenre(prompt: string): string[];
  classifyQuality(imageUrl: string): QualityAssessment;
}
```

### Fallback
Si NVIDIA falla, usa `InMemoryAIProvider` con heurísticas locales:
- Detección de spoilers por palabras clave
- Sentimiento por palabras positivas/negativas
- Géneros por keywords

## 📊 Gamificación

### Sistema de XP

```typescript
// Ganar XP
user.completeChapter('chapter-001');     // +2 XP
user.postComment('chapter-001');         // +5 XP
user.addXP(XP.fromCorrection(), 'CORRECTION'); // +20 XP

// Niveles
0-999 XP    → Nivel 1  (Novato)
1000-2999   → Nivel 2+ (Lector Shonen)
3000-5999   → Nivel 4+ (Otaku Experto)
6000-9999   → Nivel 7+ (Maestro Otaku)
10000+      → Nivel 10+ (Leyenda Manga)
```

### Aura

```typescript
// Fuentes
+ 50  → Registro
+ 2   → Capítulo completado
+ 5   → Comentario
+ 20  → Corrección aprobada
+ X   → Logros desbloqueados

// Usos
- Propinas a autores
- Crowdfunding de capítulos
- Pujas de patrocinio
```

## 🎭 Domain Events

### Eventos Emitidos

```typescript
USER_REGISTERED           → Crear wallet Aura
USER_REGISTERED_OAUTH   → Verificar email automáticamente
CHAPTER_COMPLETED         → Agregar XP, actualizar streak
COMMENT_POSTED            → Analizar con IA, agregar XP
XP_EARNED                 → Verificar logros
LEVEL_UP                  → Notificar usuario
AURA_EARNED           → Actualizar balance
AURA_SPENT            → Verificar transacción
```

### Bus de Eventos

```typescript
const eventBus = getEventBus();

eventBus.subscribe<ChapterCompletedEvent>('CHAPTER_COMPLETED', async (event) => {
  await addXPUseCase.execute({ userId: event.payload.userId, amount: 2 });
  await checkAchievementsUseCase.execute(event.payload.userId);
});
```

## 🔧 Comandos Útiles

```bash
# Database
npx prisma migrate dev --name init
npx prisma generate
npx prisma studio

# Testing
npm run test
npm run test:coverage
npm run test:e2e

# Development
npm run dev
npm run build
npm start
```

## 📚 ADRs (Architecture Decision Records)

- [ADR 001: Clean Architecture](./docs/ADR/001-clean-architecture.md)
- [ADR 002: Dual Database Strategy](./docs/ADR/002-dual-database.md)
- [ADR 003: NVIDIA Rate Limiting](./docs/ADR/003-nvidia-rate-limiting.md)

## 🚀 Próximos Pasos (Fase 2)

1. **API Routes**
   - /api/auth/* (NextAuth handlers)
   - /api/manga/* (CRUD básico)
   - /api/reading/complete
   - /api/gamification/xp

2. **MongoDB Integration**
   - Conexión real
   - Repositorios
   - Tests de integración

3. **Queue System**
   - BullMQ setup
   - Workers para análisis IA
   - Jobs asíncronos

4. **UI Components**
   - Forms con validación
   - Dashboard de usuario
   - Manga reader

## 📄 Licencia

MIT - MangaAura Team
