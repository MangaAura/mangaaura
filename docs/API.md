# InkVerse API Documentation

Documentacion completa de los endpoints de la API REST de InkVerse.

## Base URL

```
Desarrollo: http://localhost:3000/api
Produccion: https://tu-dominio.vercel.app/api
```

## Autenticacion

La API utiliza **NextAuth.js v5** (Auth.js) para autenticacion. Se requiere sesion valida para la mayoria de endpoints.

### Obtener Sesion

La sesion se maneja automaticamente via cookies JWT. En requests del servidor, usa:

```typescript
import { auth } from '@/lib/auth';

const session = await auth();
if (!session?.user?.id) {
  return Response.json({ error: 'No autorizado' }, { status: 401 });
}
```

### Headers Requeridos

```http
Content-Type: application/json
```

---

## Autenticacion (`/api/auth`)

### POST `/api/auth/register`

Registra un nuevo usuario.

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "username": "usuario123",
  "password": "ContrasenaSegura123!"
}
```

**Response 201:**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "username": "usuario123",
    "xpPoints": 0,
    "level": 1,
    "inkcoinsBalance": 50,
    "rank": "Novato",
    "progressToNextLevel": 0
  }
}
```

**Errores:**
- `400`: Datos invalidos o contrasena debil
- `409`: Email o username ya existe
- `500`: Error interno

### POST `/api/auth/forgot-password`

Solicita reseteo de contrasena.

**Request:**
```json
{
  "email": "usuario@ejemplo.com"
}
```

### POST `/api/auth/reset-password`

Resetea la contrasena con token.

**Request:**
```json
{
  "token": "token-jwt",
  "password": "NuevaContrasena123!"
}
```

### GET/POST `/api/auth/[...nextauth]`

Endpoints de NextAuth.js para:
- Login con credenciales
- Login con OAuth (Google, GitHub)
- Logout
- Callbacks OAuth

---

## Mangas (`/api/manga`)

### GET `/api/manga`

Lista los mangas del usuario autenticado (para creadores).

**Query Parameters:**
| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| page | number | 1 | Pagina actual |
| limit | number | 20 | Items por pagina |

**Response 200:**
```json
{
  "mangas": [
    {
      "id": "uuid",
      "title": "Titulo del Manga",
      "slug": "titulo-del-manga",
      "description": "Descripcion...",
      "coverUrl": "https://...",
      "status": "ONGOING",
      "tags": ["accion", "fantasia"],
      "authorName": "Autor",
      "rating": 4.5,
      "totalViews": 1000,
      "chapterCount": 10,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### POST `/api/manga`

Crea un nuevo manga.

**Request:**
```json
{
  "title": "Nuevo Manga",
  "description": "Descripcion del manga",
  "coverUrl": "https://...",
  "tags": ["accion", "drama"]
}
```

**Response 201:**
```json
{
  "message": "Manga creado exitosamente",
  "manga": { ... }
}
```

### GET `/api/manga/[id]`

Obtiene detalles de un manga especifico.

**Response 200:**
```json
{
  "id": "uuid",
  "title": "Titulo",
  "slug": "titulo",
  "description": "...",
  "coverUrl": "https://...",
  "status": "ONGOING",
  "tags": [...],
  "authorId": "uuid",
  "authorName": "Autor",
  "totalViews": 1000,
  "rating": 4.5,
  "chapters": [...],
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### PUT `/api/manga/[id]`

Actualiza un manga (solo el autor).

### DELETE `/api/manga/[id]`

Elimina un manga (solo el autor o admin).

---

## Capitulos (`/api/manga/[id]/chapters`)

### GET `/api/manga/[id]/chapters`

Lista capitulos de un manga.

**Response 200:**
```json
{
  "chapters": [
    {
      "id": "uuid",
      "chapterNumber": 1,
      "title": "Titulo del Capitulo",
      "totalPages": 24,
      "viewCount": 500,
      "crowdfundingGoal": 1000,
      "crowdfundingCurrent": 750,
      "isCrowdfunded": false,
      "createdAt": "2024-01-20T15:00:00Z"
    }
  ]
}
```

### POST `/api/manga/[id]/chapters`

Crea un nuevo capitulo.

**Request:**
```json
{
  "chapterNumber": 2,
  "title": "Nuevo Capitulo",
  "pageUrls": ["url1", "url2", "url3"],
  "crowdfundingGoal": 500
}
```

### GET `/api/chapters/[id]`

Obtiene detalles de un capitulo especifico.

**Response 200:**
```json
{
  "id": "uuid",
  "mangaId": "uuid",
  "chapterNumber": 1,
  "title": "Capitulo 1",
  "totalPages": 24,
  "pageUrls": ["url1", "url2", ...],
  "viewCount": 500,
  "crowdfundingGoal": 1000,
  "crowdfundingCurrent": 750,
  "isCrowdfunded": false
}
```

---

## Progreso de Lectura (`/api/reading`, `/api/progress`)

### POST `/api/reading/complete`

Marca un capitulo como completado y otorga XP.

**Request:**
```json
{
  "chapterId": "uuid",
  "mangaId": "uuid"
}
```

**Response 200:**
```json
{
  "success": true,
  "xpEarned": 2,
  "totalXP": 152,
  "oldLevel": 1,
  "newLevel": 2,
  "levelUp": true,
  "rank": "Lector Shonen",
  "progressToNextLevel": 52,
  "xpToNextLevel": 1000
}
```

### POST `/api/progress`

Guarda el progreso de lectura actual.

**Request:**
```json
{
  "chapterId": "uuid",
  "page": 5,
  "percentage": 20.8
}
```

### GET `/api/library/progress`

Obtiene el progreso de lectura del usuario.

**Response 200:**
```json
{
  "progress": [
    {
      "id": "uuid",
      "mangaId": "uuid",
      "chapterId": "uuid",
      "page": 5,
      "percentage": 20.8,
      "updatedAt": "2024-01-25T10:00:00Z"
    }
  ]
}
```

---

## Gamificacion (`/api/gamification`)

### GET `/api/gamification/xp`

Obtiene estadisticas de XP del usuario.

**Response 200:**
```json
{
  "user": {
    "id": "uuid",
    "username": "usuario",
    "xpPoints": 1500,
    "level": 2,
    "rank": "Lector Shonen",
    "progressToNextLevel": 500,
    "xpToNextLevel": 1000,
    "readingStreak": 5,
    "globalRank": 42
  },
  "leaderboard": [
    {
      "position": 1,
      "id": "uuid",
      "username": "topuser",
      "xpPoints": 5000,
      "level": 5,
      "isCurrentUser": false
    }
  ]
}
```

### POST `/api/gamification/xp`

Agrega XP a un usuario (interno/raffle).

**Request:**
```json
{
  "amount": 10,
  "reason": "Daily login bonus",
  "referenceId": "optional-reference"
}
```

---

## Economia (`/api/economy`)

### GET `/api/economy/balance`

Obtiene el balance de InkCoins del usuario.

**Response 200:**
```json
{
  "balance": 150,
  "stats": {
    "tips": {
      "given": 10,
      "received": 5,
      "totalGiven": 500,
      "totalReceived": 250
    },
    "crowdfunding": {
      "contributed": 3,
      "totalContributed": 150
    }
  }
}
```

### POST `/api/economy/tip`

Envia una propina a un autor.

**Request:**
```json
{
  "chapterId": "uuid",
  "amount": 50,
  "message": "¡Gran trabajo!"
}
```

**Response 200:**
```json
{
  "success": true,
  "tip": {
    "id": "uuid",
    "chapterId": "uuid",
    "fromUserId": "uuid",
    "toUserId": "uuid",
    "amount": 50,
    "message": "¡Gran trabajo!",
    "createdAt": "2024-01-25T10:00:00Z"
  },
  "newBalance": 100
}
```

### GET `/api/economy/transactions`

Lista transacciones del usuario.

**Response 200:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "amount": -50,
      "type": "TIP_GIVEN",
      "referenceId": "uuid",
      "description": "Propina enviada",
      "timestamp": "2024-01-25T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

## Clanes (`/api/clans`)

### GET `/api/clans`

Lista todos los clanes.

**Query Parameters:**
| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| page | number | 1 | Pagina |
| limit | number | 20 | Items por pagina |
| sortBy | string | "monthlyScore" | monthlyScore, totalScore, name |
| order | string | "desc" | asc, desc |
| search | string | - | Busqueda por nombre |

**Response 200:**
```json
{
  "clans": [
    {
      "id": "uuid",
      "name": "Los Otakus",
      "description": "Clan de lectores apasionados",
      "emblemUrl": "https://...",
      "totalScore": 5000,
      "monthlyScore": 1000,
      "memberCount": 25,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### POST `/api/clans`

Crea un nuevo clan.

**Request:**
```json
{
  "name": "Nuevo Clan",
  "description": "Descripcion del clan",
  "emblemUrl": "https://..."
}
```

### POST `/api/clans/[id]/join`

Une al usuario al clan.

### POST `/api/clans/[id]/leave`

Saca al usuario del clan.

### GET `/api/clans/[id]/members`

Lista miembros del clan.

**Response 200:**
```json
{
  "members": [
    {
      "id": "uuid",
      "userId": "uuid",
      "username": "miembro1",
      "role": "LEADER",
      "joinedAt": "2024-01-01T00:00:00Z",
      "contributedScore": 500
    }
  ]
}
```

---

## Biblioteca (`/api/library`)

### GET `/api/library`

Obtiene la biblioteca del usuario.

**Response 200:**
```json
{
  "library": [
    {
      "id": "uuid",
      "mangaId": "uuid",
      "manga": {
        "id": "uuid",
        "title": "Titulo",
        "slug": "titulo",
        "coverUrl": "https://..."
      },
      "status": "READING",
      "currentChapter": 5,
      "rating": 4.5,
      "addedAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-25T10:00:00Z"
    }
  ]
}
```

### POST `/api/library`

Agrega un manga a la biblioteca.

**Request:**
```json
{
  "mangaId": "uuid",
  "status": "PLANNED"
}
```

### PUT `/api/library/[mangaId]`

Actualiza el estado de un manga en la biblioteca.

**Request:**
```json
{
  "status": "COMPLETED",
  "currentChapter": 24,
  "rating": 5.0
}
```

---

## Comentarios (`/api/chapters/[id]/comments`)

### GET `/api/chapters/[id]/comments`

Lista comentarios de un capitulo.

**Response 200:**
```json
{
  "comments": [
    {
      "id": "uuid",
      "chapterId": "uuid",
      "userId": "uuid",
      "user": {
        "username": "usuario",
        "avatarUrl": "https://..."
      },
      "content": "¡Me encanto este capitulo!",
      "parentId": null,
      "likesCount": 10,
      "isDeleted": false,
      "createdAt": "2024-01-25T10:00:00Z"
    }
  ]
}
```

### POST `/api/chapters/[id]/comments`

Crea un nuevo comentario.

**Request:**
```json
{
  "content": "Comentario...",
  "parentId": null
}
```

### POST `/api/chapters/[id]/comments/[commentId]/like`

Da like a un comentario.

---

## Notificaciones (`/api/notifications`)

### GET `/api/notifications`

Lista notificaciones del usuario.

**Response 200:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "NEW_CHAPTER",
      "title": "Nuevo capitulo disponible",
      "message": "Manga X ha publicado el capitulo 10",
      "isRead": false,
      "createdAt": "2024-01-25T10:00:00Z"
    }
  ],
  "unreadCount": 5
}
```

### PATCH `/api/notifications/[id]/read`

Marca una notificacion como leida.

### POST `/api/notifications/read-all`

Marca todas las notificaciones como leidas.

### GET `/api/notifications/unread`

Obtiene el conteo de notificaciones no leidas.

---

## Busqueda (`/api/search`)

### GET `/api/search`

Busca mangas.

**Query Parameters:**
| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| q | string | - | Query de busqueda |
| tags | string | - | Tags separados por coma |
| status | string | - | ONGOING, COMPLETED, HIATUS, DROPPED |
| sortBy | string | "relevance" | relevance, newest, rating, views |
| page | number | 1 | Pagina |
| limit | number | 20 | Items por pagina |

**Response 200:**
```json
{
  "mangas": [...],
  "pagination": { ... }
}
```

---

## Ranking (`/api/rankings`)

### GET `/api/rankings`

Obtiene rankings de usuarios.

**Query Parameters:**
| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| type | string | "xp" | xp, clans, streak |
| period | string | "all" | all, monthly, weekly |
| page | number | 1 | Pagina |
| limit | number | 20 | Items por pagina |

---

## Creador (`/api/creator`)

### GET `/api/creator/mangas`

Lista mangas del creador autenticado.

### GET `/api/analytics/dashboard`

Obtiene analytics para el dashboard de creador.

**Response 200:**
```json
{
  "totalViews": 10000,
  "totalChapters": 50,
  "totalEarnings": {
    "tips": 5000,
    "crowdfunding": 3000
  },
  "popularMangas": [...],
  "viewsByDay": [...],
  "earningsByMonth": [...]
}
```

---

## Administracion (`/api/admin`)

### GET `/api/admin/stats`

Estadisticas generales (solo admin).

**Response 200:**
```json
{
  "users": { "total": 1000, "active": 500, "new": 50 },
  "mangas": { "total": 200, "published": 180 },
  "chapters": { "total": 5000 },
  "reports": { "pending": 10 }
}
```

### GET `/api/admin/users`

Lista usuarios (solo admin).

### GET `/api/admin/moderation`

Lista contenido reportado (solo admin).

---

## Upload (`/api/upload`)

### POST `/api/upload/cover`

Sube una imagen de portada.

**Request:** Multipart form data con archivo.

**Response 200:**
```json
{
  "url": "https://blob.vercel-storage.com/...",
  "thumbnail": "https://blob.vercel-storage.com/..."
}
```

### POST `/api/upload/chapter`

Sube paginas de un capitulo.

### POST `/api/upload/delete`

Elimina un archivo subido.

---

## Webhooks

### POST `/api/webhooks/stripe`

Webhook para eventos de Stripe.

**Eventos soportados:**
- `checkout.session.completed` - Compra completada
- `invoice.paid` - Suscripcion pagada

---

## Cron Jobs

### GET `/api/cron/reset-monthly-scores`

Resetea puntuaciones mensuales de clanes (requiere `CRON_SECRET`).

### GET `/api/cron/cleanup-expired-bids`

Limpia pujas de patrocinio expiradas.

---

## Codigos de Estado HTTP

| Codigo | Descripcion |
|--------|-------------|
| 200 | OK - Request exitoso |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos invalidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - No autorizado |
| 404 | Not Found - Recurso no existe |
| 409 | Conflict - Conflicto de datos |
| 429 | Too Many Requests - Rate limit |
| 500 | Internal Server Error |

## Rate Limiting

La API implementa rate limiting por IP y usuario:

- **General**: 100 requests/minuto
- **Autenticacion**: 5 requests/minuto
- **AI/Analisis**: 40 requests/minuto (limitacion de NVIDIA)

## Paginacion

Los endpoints que retornan listas usan paginacion:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Errores

Los errores siguen este formato:

```json
{
  "error": "Mensaje de error",
  "details": { ... },
  "code": "ERROR_CODE"
}
```

Errores comunes:
- `INVALID_DATA`: Datos de request invalidos
- `UNAUTHORIZED`: No autenticado
- `FORBIDDEN`: Sin permisos
- `NOT_FOUND`: Recurso no encontrado
- `CONFLICT`: Conflicto (ej: username duplicado)
- `INSUFFICIENT_FUNDS`: Sin fondos suficientes
- `RATE_LIMITED`: Limite de requests alcanzado
