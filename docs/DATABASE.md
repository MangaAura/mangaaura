# MangaAura Database Documentation

Documentacion completa de la base de datos de MangaAura usando Prisma ORM.

## Tabla de Contenidos

1. [Configuracion](#configuracion)
2. [Entidades Principales](#entidades-principales)
3. [Diagrama de Entidad-Relacion](#diagrama-de-entidad-relacion)
4. [Modelos Detallados](#modelos-detallados)
5. [Relaciones](#relaciones)
6. [Indices](#indices)
7. [Migraciones](#migraciones)

---

## Configuracion

### Proveedores Soportados

El proyecto soporta multiples proveedores de base de datos via Prisma:

| Proveedor | Desarrollo | Produccion |
|-----------|-----------|------------|
| SQLite | ✅ Recomendado | ❌ No |
| PostgreSQL | ✅ | ✅ Recomendado |
| MySQL | ✅ | ✅ |

### Configuracion Actual

**Archivo:** `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // Cambiar a "postgresql" para produccion
  url      = env("DATABASE_URL")
}
```

### Variables de Entorno

```bash
# Desarrollo SQLite
DATABASE_URL="file:./dev.db"

# Produccion PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/mangaaura?schema=public"
```

---

## Entidades Principales

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENTIDADES CORE                           │
├─────────────────────────────────────────────────────────────────┤
│ User          - Usuarios registrados                              │
│ MangaSeries   - Series de manga                                 │
│ Chapter       - Capitulos individuales                          │
│ Clan          - Grupos de usuarios                              │
│ Comment       - Comentarios en capitulos                        │
│ Transaction   - Transacciones de InkCoins                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Diagrama de Entidad-Relacion

```
                    ┌──────────────┐
                    │     User     │
                    ├──────────────┤
                    │ id (PK)      │
                    │ email (UQ)   │
                    │ username(UQ) │
                    │ xpPoints     │
                    │ level        │
                    │ inkcoins     │
                    │ role         │
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┬──────────────┐
           │               │               │              │
           ▼               ▼               ▼              ▼
    ┌──────────┐   ┌────────────┐   ┌──────────┐   ┌──────────┐
    │MangaSeries │   │   Clan     │   │Transaction│   │UserLibrary│
    │(author FK) │   │(leader FK) │   │(user FK) │   │(user FK) │
    └────┬─────┘   └─────┬──────┘   └──────────┘   └────┬─────┘
         │               │                                │
         │               │                                │
         ▼               ▼                                ▼
    ┌──────────┐   ┌────────────┐                   ┌──────────┐
    │ Chapter  │   │ClanMembership│                  │ Reading  │
    │(manga FK)│   │(user FK)   │                  │ Progress │
    └────┬─────┘   └────────────┘                  └──────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │ Comment  │      │    Tip   │      │Crowdfunding
    │(chapterFK│      │(chapterFK│      │Contribution│
    └──────────┘      └──────────┘      └──────────┘
```

---

## Modelos Detallados

### User

Usuarios registrados en la plataforma.

**Tabla:** `users`

| Campo | Tipo | Requerido | Default | Descripcion |
|-------|------|-----------|---------|-------------|
| `id` | `String` | Si | `uuid()` | Identificador unico |
| `email` | `String` | Si | - | Email unico |
| `username` | `String` | Si | - | Username unico |
| `displayName` | `String` | No | - | Nombre para mostrar |
| `avatarUrl` | `String` | No | - | URL del avatar |
| `passwordHash` | `String` | No | - | Hash de contrasena (null para OAuth) |
| `emailVerified` | `DateTime` | No | - | Fecha de verificacion |
| `xpPoints` | `Int` | Si | `0` | Puntos de experiencia |
| `inkcoinsBalance` | `Int` | Si | `0` | Balance de InkCoins |
| `level` | `Int` | Si | `1` | Nivel actual |
| `readingStreak` | `Int` | Si | `0` | Racha de lectura |
| `lastReadAt` | `DateTime` | No | - | Ultima lectura |
| `role` | `String` | Si | `"USER"` | Rol: USER, CREATOR, ADMIN |
| `emailPreferences` | `String` | Si | `"{}"` | Preferencias JSON |
| `stripeCustomerId` | `String` | No | - | ID de cliente Stripe |
| `createdAt` | `DateTime` | Si | `now()` | Fecha de creacion |
| `updatedAt` | `DateTime` | Si | `updatedAt` | Ultima actualizacion |

**Indices:**
- `@unique` en `email`
- `@unique` en `username`
- `@unique` en `stripeCustomerId`

**Relaciones:**
- `accounts`: Account[]
- `sessions`: Session[]
- `achievements`: UserAchievement[]
- `mangaList`: UserManga[]
- `library`: UserLibrary[]
- `readingProgress`: ReadingProgress[]
- `createdMangas`: MangaSeries[]
- `corrections`: ChapterCorrection[]
- `readingSessions`: ReadingSession[]
- `transactions`: Transaction[]
- `sponsorshipBids`: SponsorshipBid[]
- `notifications`: Notification[]
- `tipsGiven`: Tip[]
- `tipsReceived`: Tip[]
- `crowdfundingContributions`: CrowdfundingContribution[]
- `clanMemberships`: ClanMembership[]
- `comments`: Comment[]
- `commentLikes`: CommentLike[]
- `mentions`: CommentMention[]
- `activities`: UserActivity[]
- `ledClan`: Clan?

---

### MangaSeries

Series de manga publicadas en la plataforma.

**Tabla:** `manga_series`

| Campo | Tipo | Requerido | Default | Descripcion |
|-------|------|-----------|---------|-------------|
| `id` | `String` | Si | `uuid()` | Identificador unico |
| `title` | `String` | Si | - | Titulo del manga |
| `slug` | `String` | Si | - | Slug URL-friendly |
| `description` | `String` | No | - | Descripcion |
| `coverUrl` | `String` | No | - | URL de portada |
| `authorId` | `String` | Si | - | FK a User |
| `authorName` | `String` | Si | - | Nombre del autor |
| `status` | `String` | Si | `"ONGOING"` | ONGOING, COMPLETED, HIATUS, DROPPED |
| `tags` | `String` | Si | `"[]"` | Tags JSON array |
| `totalViews` | `Int` | Si | `0` | Total de vistas |
| `rating` | `Float` | No | - | Calificacion promedio |
| `createdAt` | `DateTime` | Si | `now()` | Fecha de creacion |
| `updatedAt` | `DateTime` | Si | `updatedAt` | Ultima actualizacion |

**Indices:**
- `@unique` en `slug`

**Relaciones:**
- `author`: User (relacion "CreatedMangas")
- `chapters`: Chapter[]
- `libraryEntries`: UserLibrary[]
- `userMangas`: UserManga[]

---

### Chapter

Capitulos individuales de manga.

**Tabla:** `chapters`

| Campo | Tipo | Requerido | Default | Descripcion |
|-------|------|-----------|---------|-------------|
| `id` | `String` | Si | `uuid()` | Identificador unico |
| `mangaId` | `String` | Si | - | FK a MangaSeries |
| `chapterNumber` | `Int` | Si | - | Numero de capitulo |
| `title` | `String` | No | - | Titulo del capitulo |
| `totalPages` | `Int` | Si | `0` | Numero de paginas |
| `pageUrls` | `String` | Si | - | URLs de paginas JSON |
| `crowdfundingGoal` | `Int` | No | - | Meta de crowdfunding |
| `crowdfundingCurrent` | `Int` | Si | `0` | Monto actual |
| `isCrowdfunded` | `Boolean` | Si | `false` | Si se completo el crowdfunding |
| `viewCount` | `Int` | Si | `0` | Conteo de vistas |
| `createdAt` | `DateTime` | Si | `now()` | Fecha de creacion |

**Relaciones:**
- `manga`: MangaSeries
- `comments`: Comment[]
- `readingProgress`: ReadingProgress[]
- `tips`: Tip[]
- `crowdfundingContributions`: CrowdfundingContribution[]

---

### UserLibrary

Biblioteca personal de cada usuario (mangas guardados).

**Tabla:** `user_libraries`

| Campo | Tipo | Requerido | Default | Descripcion |
|-------|------|-----------|---------|-------------|
| `id` | `String` | Si | `uuid()` | Identificador unico |
| `userId` | `String` | Si | - | FK a User |
| `mangaId` | `String` | Si | - | FK a MangaSeries |
| `status` | `String` | Si | `"READING"` | READING, COMPLETED, PLANNED, DROPPED |
| `currentChapter` | `Int` | Si | `0` | Ultimo capitulo leido |
| `rating` | `Float` | No | - | Calificacion del usuario |
| `addedAt` | `DateTime` | Si | `now()` | Fecha de agregado |
| `updatedAt` | `DateTime` | Si | `updatedAt` | Ultima actualizacion |

**Indices:**
- `@@unique([userId, mangaId])`

**Relaciones:**
- `user`: User
- `manga`: MangaSeries

---

### ReadingProgress

Progreso de lectura por capitulo.

**Tabla:** `reading_progress`

| Campo | Tipo | Requerido | Default | Descripcion |
|-------|------|-----------|---------|-------------|
| `id` | `String` | Si | `uuid()` | Identificador unico |
| `userId` | `String` | Si | - | FK a User |
| `mangaId` | `String` | Si | - | FK a MangaSeries |
| `chapterId` | `String` | Si | - | FK a Chapter |
| `page` | `Int` | Si | `0` | Pagina actual |
| `percentage` | `Float` | Si | `0` | Porcentaje completado |
| `updatedAt` | `DateTime` | Si | `updatedAt` | Ultima actualizacion |
| `createdAt` | `DateTime` | Si | `now()` | Fecha de creacion |

**Relaciones:**
- `user`: User
- `chapter`: Chapter

---

### Clan

Grupos de usuarios para competencia y comunidad.

**Tabla:** `clans`

| Campo | Tipo | Requerido | Default | Descripcion |
|-------|------|-----------|---------|-------------|
| `id` | `String` | Si | `uuid()` | Identificador unico |
| `name` | `String` | Si | - | Nombre del clan (unico) |
| `description` | `String` | No | - | Descripcion |
| `emblemUrl` | `String` | No | - | URL del emblema |
| `totalScore` | `Int` | Si | `0` | Puntuacion total |
| `monthlyScore` | `Int` | Si | `0` | Puntuacion mensual |
| `leaderId` | `String` | No | - | FK a User (lider) |
| `createdAt` | `DateTime` | Si | `now()` | Fecha de creacion |

**Indices:**
- `@unique` en `name`
- `@unique` en `leaderId`

**Relaciones:**
- `leader`: User
- `members`: ClanMembership[]

---

### ClanMembership

Membresia de usuarios en clanes.

**Tabla:** `clan_memberships`

| Campo | Tipo | Requerido | Default | Descripcion |
|-------|------|-----------|---------|-------------|
| `id` | `String` | Si | `uuid()` | Identificador unico |
| `clanId` | `String` | Si | - | FK a Clan |
| `userId` | `String` | Si | - | FK a User |
| `role` | `String` | Si | `"MEMBER"` | LEADER, OFFICER, MEMBER |
| `joinedAt` | `DateTime` | Si | `now()` | Fecha de union |
| `contributedScore` | `Int` | Si | `0` | Puntuacion contribuida |

**Indices:**
- `@@unique([clanId, userId])`

**Relaciones:**
- `clan`: Clan
- `user`: User

---

### Transaction

Transacciones de InkCoins.

**Tabla:** `transactions`

| Campo | Tipo | Requerido | Default | Descripcion |
|-------|------|-----------|---------|-------------|
| `id` | `String` | Si | `uuid()` | Identificador unico |
| `userId` | `String` | Si | - | FK a User |
| `amount` | `Int` | Si | - | Monto (positivo/negativo) |
| `type` | `String` | Si | - | Tipo de transaccion |
| `referenceId` | `String` | No | - | ID de referencia |
| `description` | `String` | No | - | Descripcion |
| `timestamp` | `DateTime` | Si | `now()` | Fecha de transaccion |

**Tipos de transaccion:**
- `PURCHASE`: Compra de InkCoins
- `TIP_GIVEN`: Propina enviada
- `TIP_RECEIVED`: Propina recibida
- `CROWDFUNDING_CONTRIBUTION`: Contribucion a crowdfunding
- `CROWDFUNDING_RELEASED`: Fondos liberados
- `SPONSORSHIP_BID`: Puja de patrocinio
- `ACHIEVEMENT_REWARD`: Recompensa de logro
- `DAILY_LOGIN`: Bonus diario

**Relaciones:**
- `user`: User

---

### Comment

Comentarios en capitulos.

**Tabla:** `comments`

| Campo | Tipo | Requerido | Default | Descripcion |
|-------|------|-----------|---------|-------------|
| `id` | `String` | Si | `uuid()` | Identificador unico |
| `chapterId` | `String` | Si | - | FK a Chapter |
| `userId` | `String` | Si | - | FK a User |
| `content` | `String` | Si | - | Contenido del comentario |
| `parentId` | `String` | No | - | ID del comentario padre (respuestas) |
| `likesCount` | `Int` | Si | `0` | Conteo de likes |
| `isDeleted` | `Boolean` | Si | `false` | Si fue eliminado |
| `createdAt` | `DateTime` | Si | `now()` | Fecha de creacion |

**Relaciones:**
- `chapter`: Chapter
- `user`: User

---

### Notification

Notificaciones para usuarios.

**Tabla:** `notifications`

| Campo | Tipo | Requerido | Default | Descripcion |
|-------|------|-----------|---------|-------------|
| `id` | `String` | Si | `uuid()` | Identificador unico |
| `userId` | `String` | Si | - | FK a User |
| `type` | `String` | Si | - | Tipo de notificacion |
| `title` | `String` | Si | - | Titulo |
| `message` | `String` | Si | - | Mensaje |
| `isRead` | `Boolean` | Si | `false` | Si fue leida |
| `createdAt` | `DateTime` | Si | `now()` | Fecha de creacion |

**Tipos de notificacion:**
- `NEW_CHAPTER`: Nuevo capitulo disponible
- `COMMENT_REPLY`: Respuesta a comentario
- `TIP_RECEIVED`: Propina recibida
- `ACHIEVEMENT_UNLOCKED`: Logro desbloqueado
- `CROWDFUNDING_MILESTONE`: Hit de crowdfunding
- `CLAN_INVITATION`: Invitacion a clan
- `MENTION`: Mencion en comentario

**Relaciones:**
- `user`: User

---

### Tip

Propinas de usuarios a autores.

**Tabla:** `tips`

| Campo | Tipo | Requerido | Default | Descripcion |
|-------|------|-----------|---------|-------------|
| `id` | `String` | Si | `uuid()` | Identificador unico |
| `chapterId` | `String` | Si | - | FK a Chapter |
| `fromUserId` | `String` | Si | - | FK a User (emisor) |
| `toUserId` | `String` | Si | - | FK a User (receptor) |
| `amount` | `Int` | Si | - | Cantidad de InkCoins |
| `message` | `String` | No | - | Mensaje opcional |
| `createdAt` | `DateTime` | Si | `now()` | Fecha de creacion |

**Relaciones:**
- `chapter`: Chapter
- `fromUser`: User ("TipsGiven")
- `toUser`: User ("TipsReceived")

---

### CrowdfundingContribution

Contribuciones a crowdfunding de capitulos.

**Tabla:** `crowdfunding_contributions`

| Campo | Tipo | Requerido | Default | Descripcion |
|-------|------|-----------|---------|-------------|
| `id` | `String` | Si | `uuid()` | Identificador unico |
| `chapterId` | `String` | Si | - | FK a Chapter |
| `userId` | `String` | Si | - | FK a User |
| `amount` | `Int` | Si | - | Cantidad contribuida |
| `isAnonymous` | `Boolean` | Si | `false` | Si es anonimo |
| `message` | `String` | No | - | Mensaje opcional |
| `createdAt` | `DateTime` | Si | `now()` | Fecha de creacion |

**Relaciones:**
- `chapter`: Chapter
- `user`: User

---

### AchievementDefinition

Definiciones de logros disponibles.

**Tabla:** `achievement_definitions`

| Campo | Tipo | Requerido | Default | Descripcion |
|-------|------|-----------|---------|-------------|
| `id` | `String` | Si | `uuid()` | Identificador unico |
| `badgeId` | `String` | Si | - | ID unico del badge |
| `xpReward` | `Int` | Si | - | XP otorgado |
| `name` | `String` | Si | - | Nombre del logro |
| `description` | `String` | Si | - | Descripcion |
| `iconUrl` | `String` | No | - | URL del icono |
| `condition` | `String` | Si | - | Condicion JSON |
| `category` | `String` | Si | `"general"` | Categoria |
| `createdAt` | `DateTime` | Si | `now()` | Fecha de creacion |

**Indices:**
- `@unique` en `badgeId`

**Relaciones:**
- `userAchievements`: UserAchievement[]

---

### UserAchievement

Logros desbloqueados por usuarios.

**Tabla:** `user_achievements`

| Campo | Tipo | Requerido | Default | Descripcion |
|-------|------|-----------|---------|-------------|
| `id` | `String` | Si | `uuid()` | Identificador unico |
| `userId` | `String` | Si | - | FK a User |
| `achievementId` | `String` | Si | - | FK a AchievementDefinition |
| `unlockedAt` | `DateTime` | Si | `now()` | Fecha de desbloqueo |

**Indices:**
- `@@unique([userId, achievementId])`

**Relaciones:**
- `user`: User
- `achievement`: AchievementDefinition

---

### Account & Session

Modelos de NextAuth.js para autenticacion OAuth.

**Tabla:** `accounts`, `sessions`

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | `String` | Identificador unico |
| `userId` | `String` | FK a User |
| `type` | `String` | Tipo de cuenta |
| `provider` | `String` | Proveedor OAuth |
| `providerAccountId` | `String` | ID de cuenta en proveedor |
| `refresh_token` | `String` | Token de refresco |
| `access_token` | `String` | Token de acceso |
| `expires_at` | `Int` | Expiracion |
| `token_type` | `String` | Tipo de token |
| `scope` | `String` | Scope OAuth |
| `id_token` | `String` | ID token |
| `session_state` | `String` | Estado de sesion |

---

## Relaciones

### Resumen de Relaciones

| Entidad | Relaciones 1:N | Relaciones N:1 | Relaciones N:M |
|---------|---------------|----------------|----------------|
| User | mangaList, library, progress, transactions, comments | - | clans (via ClanMembership) |
| MangaSeries | chapters, libraryEntries | author (User) | userMangas (via UserManga) |
| Chapter | comments, tips, crowdfunding, progress | manga (MangaSeries) | - |
| Clan | members | leader (User) | users (via ClanMembership) |
| Comment | - | chapter, user | - |

---

## Indices

### Indices Definidos

| Tabla | Campos | Tipo | Proposito |
|-------|--------|------|-----------|
| users | email | UNIQUE | Login rapido |
| users | username | UNIQUE | Perfil unico |
| manga_series | slug | UNIQUE | URLs amigables |
| clans | name | UNIQUE | Nombres unicos |
| accounts | provider + providerAccountId | UNIQUE | OAuth unico |
| user_libraries | userId + mangaId | UNIQUE | Un manga por biblioteca |
| clan_memberships | clanId + userId | UNIQUE | Un clan por usuario |
| user_achievements | userId + achievementId | UNIQUE | Un logro por usuario |

---

## Migraciones

### Comandos de Prisma

```bash
# Generar migracion
cd prisma
npx prisma migrate dev --name descripcion-migracion

# Aplicar migraciones en produccion
npx prisma migrate deploy

# Generar cliente Prisma
npx prisma generate

# Abrir Prisma Studio
npx prisma studio

# Resetear base de datos (cuidado!)
npx prisma migrate reset

# Ver estado de migraciones
npx prisma migrate status
```

### Scripts NPM

```bash
# Migraciones
cd ..  # Volver a raiz
npm run prisma:migrate     # Ejecuta migrate dev
npm run prisma:generate    # Genera cliente
npm run prisma:studio      # Abre Studio
```

---

## Seed de Datos

### Script de Seed

**Archivo:** `prisma/seed.ts`

```typescript
// Ejemplo de seed para crear datos de prueba
import { prisma } from '../src/lib/prisma';

async function main() {
  // Crear usuario admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@mangaaura.es',
      username: 'admin',
      passwordHash: '...',
      role: 'ADMIN',
      xpPoints: 10000,
      level: 10,
    },
  });

  // Crear logros
  await prisma.achievementDefinition.createMany({
    data: [
      { badgeId: 'first_read', name: 'Primera Lectura', xpReward: 10, condition: '{}' },
      { badgeId: 'comment_10', name: 'Comentarista', xpReward: 50, condition: '{}' },
    ],
  });
}

main();
```

**Ejecutar seed:**

```bash
npm run db:seed
```

---

## Consultas Comunes

### Obtener mangas con capitulos

```typescript
const mangas = await prisma.mangaSeries.findMany({
  include: {
    chapters: {
      orderBy: { chapterNumber: 'asc' },
    },
    author: {
      select: { username: true, avatarUrl: true },
    },
  },
});
```

### Obtener biblioteca con progreso

```typescript
const library = await prisma.userLibrary.findMany({
  where: { userId },
  include: {
    manga: true,
    user: {
      include: {
        readingProgress: {
          where: { mangaId: { in: mangaIds } },
        },
      },
    },
  },
});
```

### Leaderboard de XP

```typescript
const leaderboard = await prisma.user.findMany({
  orderBy: { xpPoints: 'desc' },
  take: 10,
  select: {
    id: true,
    username: true,
    xpPoints: true,
    level: true,
    avatarUrl: true,
  },
});
```

### Transacciones atomicas

```typescript
await prisma.$transaction(async (tx) => {
  // Restar balance
  await tx.user.update({
    where: { id: fromUserId },
    data: { inkcoinsBalance: { decrement: amount } },
  });

  // Sumar balance
  await tx.user.update({
    where: { id: toUserId },
    data: { inkcoinsBalance: { increment: amount } },
  });

  // Crear registro de transaccion
  await tx.transaction.create({
    data: {
      userId: fromUserId,
      amount: -amount,
      type: 'TIP_GIVEN',
    },
  });
});
```
