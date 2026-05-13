# API Documentation

## Base URL
```
https://inkverse.app/api
```

## Authentication
Most endpoints require authentication via NextAuth session cookie.

---

## Collections

### GET /api/collections
List public collections.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| filter | string | 'all', 'public', 'private' |
| userId | string | Filter by user |
| page | number | Pagination page |
| limit | number | Items per page |

**Response:**
```json
{
  "collections": [
    {
      "id": "string",
      "name": "string",
      "description": "string | null",
      "isPublic": true,
      "user": { /* User object */ },
      "_count": { "mangas": 5 },
      "previewMangas": [ /* Manga array */ ]
    }
  ],
  "pagination": { /* Pagination info */ }
}
```

### POST /api/collections
Create a new collection.

**Body:**
```json
{
  "name": "string (1-100 chars)",
  "description": "string (optional, max 500)",
  "isPublic": true
}
```

### GET /api/collections/:id
Get collection details.

### PATCH /api/collections/:id
Update collection.

### DELETE /api/collections/:id
Delete collection.

### POST /api/collections/:id/items
Add manga to collection.

**Body:**
```json
{ "mangaId": "string" }
```

### DELETE /api/collections/:id/items?mangaId=xxx
Remove manga from collection.

---

## Conversations (DM)

### GET /api/conversations
Get user's conversations.

**Response:**
```json
{
  "conversations": [
    {
      "id": "string",
      "participant": { /* User object */ },
      "lastMessageAt": "datetime",
      "unreadCount": 0,
      "isBlocked": false,
      "lastMessage": { /* Message object */ }
    }
  ]
}
```

### POST /api/conversations
Create or get existing conversation.

**Body:**
```json
{ "userId": "string" }
```

### GET /api/conversations/:id/messages
Get messages in conversation.

### POST /api/conversations/:id/messages
Send message.

**Body:**
```json
{ "content": "string (1-2000 chars)" }
```

---

## Reports

### GET /api/reports
Get reports (Admin/Moderator only).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | 'PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED' |
| priority | string | 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL' |
| assignedTo | string | 'me', 'unassigned' |

### POST /api/reports
Create a report.

**Body:**
```json
{
  "targetType": "USER | MANGA | CHAPTER | COMMENT",
  "targetId": "string",
  "reason": "spam | harassment | inappropriate | copyright | other",
  "description": "string (optional)"
}
```

### GET /api/reports/:id
Get report details.

### PATCH /api/reports/:id
Update report status.

**Body:**
```json
{
  "status": "PENDING | UNDER_REVIEW | RESOLVED | DISMISSED | ESCALATED",
  "resolution": "string"
}
```

---

## Notifications

### GET /api/notifications
Get user notifications.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| unreadOnly | boolean | Filter unread only |
| page | number | Pagination |
| limit | number | Items per page |

### POST /api/notifications/:id/read
Mark notification as read.

### POST /api/notifications/read-all
Mark all notifications as read.

### POST /api/notifications/subscribe
Subscribe to push notifications.

**Body:**
```json
{ "subscription": { /* PushSubscription object */ } }
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": [ /* Optional validation errors */ ]
}
```

**Status Codes:**
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 429: Rate Limited
- 500: Server Error
