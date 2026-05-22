# Sistema de Subida de Mangas - MangaAura

Sistema completo para creadores de subir mangas y capítulos con Vercel Blob.

## 📋 Índice

1. [Arquitectura](#arquitectura)
2. [Configuración](#configuración)
3. [Flujo de Subida](#flujo-de-subida)
4. [APIs](#apis)
5. [Hooks](#hooks)
6. [Componentes](#componentes)
7. [Uso](#uso)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Creator Upload  │  │ Creator Dashboard│  │ New Manga Form  │ │
│  │ Page            │  │ Page             │  │ Page            │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │            │
│  ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐ │
│  │ useMangaUpload    │  │ useCreatorMangas│  │ useManga        │ │
│  │ Hook              │  │ Hook             │  │ Hook            │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
└───────────┼────────────────────┼────────────────────┼──────────┘
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                          BACKEND                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ POST /api/upload│  │ POST /api/manga │  │ POST /api/manga │ │
│  │ /image          │  │                 │  │ /[id]/chapters  │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │            │
│  ┌────────▼────────┐  ┌────────▼────────┐           │            │
│  │ @vercel/blob    │  │ Prisma DB       │◄──────────┘            │
│  │ Upload Service  │  │                 │                        │
│  └─────────────────┘  └─────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuración

### 1. Variables de Entorno

```bash
# .env.local
BLOB_READ_WRITE_TOKEN=vercel_blob_token_here
```

### 2. Obtener Token de Vercel Blob

1. Ve a tu dashboard de Vercel
2. Selecciona tu proyecto
3. Ve a "Storage" → "Connect Database"
4. Selecciona "Blob"
5. Copia el token y pégalo en `.env.local`

### 3. Configuración Editable

```typescript
// src/lib/storage-config.ts
export const storageConfig = {
  maxFileSize: 10 * 1024 * 1024,    // 10MB - editable
  chapterMaxSize: 100 * 1024 * 1024,  // 100MB - editable
  acceptedFormats: [
    'image/jpeg',   // editable
    'image/png',    // editable
    'image/webp',   // editable
    'image/gif',    // opcional
  ],
  maxFilesPerChapter: 200,           // editable
};
```

---

## 🔄 Flujo de Subida

### Paso 1: Seleccionar Manga
```tsx
// El creador selecciona un manga existente
// o crea uno nuevo si no tiene mangas
```

### Paso 2: Ingresar Datos del Capítulo
```tsx
// Número de capítulo (único por manga)
// Título opcional
```

### Paso 3: Subir Imágenes
```tsx
// Drag & drop o selector de archivos
// Validación de formatos y tamaño
// Preview automático
// Reordenación manual (drag & drop)
```

### Paso 4: Publicar
```tsx
// Crear capítulo en DB
// Subir imágenes a Vercel Blob
// Actualizar capítulo con URLs
// Redirigir a dashboard
```

---

## 🔌 APIs

### Upload

#### POST `/api/upload/image`
Sube una imagen individual.

**Request:**
```http
Content-Type: multipart/form-data

file: <File>
```

**Response:**
```json
{
  "success": true,
  "url": "https://blob.vercel-storage.com/uploads/abc123.webp",
  "filename": "page_01.webp",
  "size": 245760
}
```

---

#### POST `/api/upload/chapter`
Sube múltiples imágenes de un capítulo.

**Request:**
```http
Content-Type: multipart/form-data

mangaId: "uuid-del-manga"
chapterNumber: "15"
files[]: <File[]>
```

**Response:**
```json
{
  "success": true,
  "urls": [
    "https://blob.vercel-storage.com/chapters/manga123/ch15/01.webp",
    "https://blob.vercel-storage.com/chapters/manga123/ch15/02.webp"
  ],
  "totalSize": 1048576
}
```

---

#### POST `/api/upload/cover`
Sube la portada de un manga.

**Request:**
```http
Content-Type: multipart/form-data

mangaId: "uuid-del-manga"
file: <File>
```

**Response:**
```json
{
  "success": true,
  "url": "https://blob.vercel-storage.com/covers/manga123/cover.webp"
}
```

---

#### DELETE `/api/upload/delete`
Elimina una imagen.

**Request:**
```json
{
  "url": "https://blob.vercel-storage.com/uploads/abc123.webp"
}
```

---

### Manga Management

#### POST `/api/manga`
Crea un nuevo manga.

**Request:**
```json
{
  "title": "Mi Manga Genial",
  "description": "Una historia épica...",
  "tags": "[\"acción\", \"aventura\"]",
  "coverUrl": "https://blob.vercel-storage.com/covers/..."
}
```

---

#### POST `/api/manga/[id]/chapters`
Crea un capítulo.

**Request:**
```json
{
  "chapterNumber": 15,
  "title": "El Regreso",
  "pageUrls": [
    "https://blob.vercel-storage.com/chapters/.../01.webp",
    "https://blob.vercel-storage.com/chapters/.../02.webp"
  ]
}
```

**Response:**
```json
{
  "id": "uuid-capítulo",
  "mangaId": "uuid-manga",
  "chapterNumber": 15,
  "title": "El Regreso",
  "totalPages": 24,
  "pageUrls": "[\"url1\", \"url2\", ...]",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

#### GET `/api/creator/mangas`
Lista los mangas del creador.

**Response:**
```json
{
  "mangas": [
    {
      "id": "uuid-manga",
      "title": "Mi Manga",
      "coverUrl": "...",
      "chapterCount": 5,
      "totalViews": 1250,
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  ],
  "totalViews": 5000,
  "totalChapters": 25,
  "totalReaders": 850
}
```

---

## 🎣 Hooks

### useMangaUpload

Hook para subir imágenes de mangas.

```tsx
import { useMangaUpload } from '@/hooks/useMangaUpload';

function UploadComponent() {
  const {
    uploadImage,
    uploadChapter,
    deleteImage,
    cancelUpload,
    isUploading,
    progress,
    error,
    urls,
  } = useMangaUpload();

  const handleUpload = async (files: File[]) => {
    const result = await uploadChapter(files, 'manga-id', 15);
    if (result.success) {
      console.log('URLs:', result.urls);
    }
  };

  return (
    <div>
      {isUploading && (
        <progress value={progress} max={100} />
      )}
      <button onClick={handleUpload} disabled={isUploading}>
        Subir
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

---

### useCreatorMangas

Hook para gestionar mangas del creador.

```tsx
import { useCreatorMangas } from '@/hooks/useCreatorMangas';

function Dashboard() {
  const {
    mangas,
    stats,
    isLoading,
    refresh,
    createManga,
    deleteManga,
  } = useCreatorMangas();

  return (
    <div>
      <h1>Mis Mangas ({mangas.length})</h1>
      <p>Vistas totales: {stats.totalViews}</p>
      <p>Capítulos: {stats.totalChapters}</p>
    </div>
  );
}
```

---

### useManga

Hook para gestionar un manga específico.

```tsx
import { useManga } from '@/hooks/useManga';

function MangaPage({ mangaId }: { mangaId: string }) {
  const {
    manga,
    chapters,
    createChapter,
    updateChapter,
    deleteChapter,
  } = useManga(mangaId);

  return (
    <div>
      <h1>{manga?.title}</h1>
      <h2>Capítulos ({chapters.length})</h2>
    </div>
  );
}
```

---

## 🧩 Componentes

### CreatorSidebar

Sidebar de navegación del creador.

```tsx
import { Sidebar } from '@/components/Creator/Sidebar';

<Sidebar
  activeItem="dashboard"
  items={[
    { id: 'dashboard', label: 'Dashboard', href: '/creator/dashboard', icon: LayoutDashboard },
    { id: 'mangas', label: 'Mis Mangas', href: '/creator/dashboard', icon: BookOpen },
    { id: 'upload', label: 'Subir Capítulo', href: '/creator/upload', icon: Upload },
    { id: 'analytics', label: 'Estadísticas', href: '/creator/analytics', icon: BarChart3 },
  ]}
/>
```

---

### MangaCard

Tarjeta de manga con acciones.

```tsx
import { MangaCard } from '@/components/Creator/MangaCard';

<MangaCard
  manga={{
    id: 'uuid',
    title: 'Mi Manga',
    coverUrl: '...',
    chapterCount: 5,
    totalViews: 1250,
    status: 'ONGOING',
  }}
  onEdit={() => {}}
  onDelete={() => {}}
  onManageChapters={() => {}}
/>
```

---

### ChapterList

Lista de capítulos con reordenamiento.

```tsx
import { ChapterList } from '@/components/Creator/ChapterList';

<ChapterList
  chapters={chapters}
  onReorder={(newOrder) => {}}
  onEdit={(chapter) => {}}
  onDelete={(chapterId) => {}}
/>
```

---

## 📖 Uso

### Crear un Nuevo Manga

1. Ir a `/creator/manga/new`
2. Completar formulario:
   - Título (obligatorio)
   - Descripción
   - Tags
   - Portada (arrastrar o seleccionar)
3. Click en "Crear Manga"

### Subir un Capítulo

1. Ir a `/creator/upload`
2. Seleccionar manga del dropdown
3. Ingresar número de capítulo
4. Opcional: ingresar título
5. Arrastrar o seleccionar imágenes
6. Reordenar páginas si es necesario (drag & drop)
7. Click en "Publicar Capítulo"

### Gestionar Mangas

1. Ir a `/creator/dashboard`
2. Ver estadísticas generales
3. Click en un manga para:
   - Ver/editar detalles
   - Gestionar capítulos
   - Ver estadísticas
   - Eliminar

---

## 🔒 Seguridad

### Autenticación
- Todas las rutas `/creator/*` están protegidas
- Solo usuarios autenticados pueden acceder
- El middleware verifica sesión antes de servir páginas

### Autorización
- Solo el autor puede editar/eliminar sus mangas
- Validación de ownership en todas las APIs
- Verificación de mangaId + userId

### Validaciones
- Tamaño máximo de archivo: 10MB (configurable)
- Formatos permitidos: JPEG, PNG, WebP (configurable)
- Número de capítulo único por manga
- Máximo 200 páginas por capítulo

---

## 📊 Límites

| Recurso | Límite | Editable |
|---------|--------|----------|
| Tamaño por imagen | 10MB | ✅ `maxFileSize` |
| Tamaño por capítulo | 100MB | ✅ `chapterMaxSize` |
| Páginas por capítulo | 200 | ✅ `maxFilesPerChapter` |
| Formatos aceptados | JPEG, PNG, WebP | ✅ `acceptedFormats` |
| Almacenamiento Vercel Blob | 250MB (free) | - |

---

## 🐛 Troubleshooting

### Error: "Token not found"
Asegúrate de tener `BLOB_READ_WRITE_TOKEN` en tu `.env.local`

### Error: "File too large"
Ajusta `maxFileSize` en `src/lib/storage-config.ts`

### Error: "Invalid format"
Agrega el formato a `acceptedFormats` en la configuración

### Imágenes no se muestran
Verifica que las URLs de Vercel Blob sean accesibles públicamente

---

## 🚀 Deploy

### Prerequisitos
1. Proyecto en Vercel
2. Token de Vercel Blob configurado
3. Variables de entorno en Vercel Dashboard

### Pasos
1. Push a GitHub
2. Conectar repo en Vercel
3. Agregar variables de entorno en Vercel Dashboard
4. Deploy automático

---

## 📝 Changelog

### v1.0.0
- ✅ Subida de mangas con Vercel Blob
- ✅ Gestión de capítulos
- ✅ Reordenación manual de páginas
- ✅ Dashboard del creador
- ✅ Preview de imágenes
- ✅ Progreso de subida
- ✅ Cancelación de upload
