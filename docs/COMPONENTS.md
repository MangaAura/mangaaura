# InkVerse Components Documentation

Documentacion de los componentes React principales de InkVerse.

## Tabla de Contenidos

1. [Componentes UI](#componentes-ui)
2. [Componentes de Lector](#componentes-de-lector)
3. [Componentes de Creador](#componentes-de-creador)
4. [Componentes de Comunidad](#componentes-de-comunidad)
5. [Componentes de Pagos](#componentes-de-pagos)
6. [Componentes de Notificaciones](#componentes-de-notificaciones)
7. [Componentes de Analytics](#componentes-de-analytics)

---

## Componentes UI

### Button

Boton principal con variantes y estados de carga.

**Ubicacion:** `src/components/ui/Button.tsx`

**Props:**

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link' \| 'ink'` | `'default'` | Variante visual |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Tamano del boton |
| `isLoading` | `boolean` | `false` | Estado de carga |
| `disabled` | `boolean` | `false` | Deshabilitado |
| `children` | `React.ReactNode` | - | Contenido del boton |
| `onClick` | `() => void` | - | Handler de click |

**Ejemplos:**

```tsx
// Boton primario
<Button>Click me</Button>

// Boton de destruccion
<Button variant="destructive">Eliminar</Button>

// Boton outline
<Button variant="outline">Cancelar</Button>

// Boton con gradiente (ink)
<Button variant="ink">Destacado</Button>

// Boton con carga
<Button isLoading>Guardando...</Button>

// Boton icono
<Button size="icon">
  <PlusIcon className="w-4 h-4" />
</Button>
```

### Input

Campo de entrada de texto.

**Ubicacion:** `src/components/ui/Input.tsx`

**Props:**

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `label` | `string` | - | Label del campo |
| `error` | `string` | - | Mensaje de error |
| `icon` | `React.ReactNode` | - | Icono al inicio |
| `rightElement` | `React.ReactNode` | - | Elemento al final |

**Ejemplo:**

```tsx
<Input
  label="Email"
  type="email"
  placeholder="tu@email.com"
  error={errors.email}
  icon={<MailIcon className="w-4 h-4" />}
/>
```

### Badge

Etiqueta para mostrar estado o categoria.

**Ubicacion:** `src/components/ui/Badge.tsx`

**Props:**

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `variant` | `'default' \| 'secondary' \| 'outline' \| 'status'` | `'default'` | Variante visual |
| `size` | `'default' \| 'sm' \| 'lg'` | `'default'` | Tamano |

**Ejemplo:**

```tsx
<Badge variant="status" className="bg-green-100 text-green-700">
  En emision
</Badge>
```

### Card

Contenedor de contenido con estilo.

**Ubicacion:** `src/components/ui/Card.tsx`

**Sub-componentes:**
- `Card.Header` - Cabecera de la tarjeta
- `Card.Title` - Titulo
- `Card.Description` - Descripcion
- `Card.Content` - Contenido principal
- `Card.Footer` - Pie de tarjeta

**Ejemplo:**

```tsx
<Card>
  <Card.Header>
    <Card.Title>Titulo</Card.Title>
    <Card.Description>Descripcion</Card.Description>
  </Card.Header>
  <Card.Content>
    Contenido aqui
  </Card.Content>
  <Card.Footer>
    <Button>Accion</Button>
  </Card.Footer>
</Card>
```

### Dialog

Modal para confirmaciones y formularios.

**Ubicacion:** `src/components/ui/Dialog.tsx`

**Uso basico:**

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <Dialog.Trigger asChild>
    <Button>Abrir</Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Titulo</Dialog.Title>
      <Dialog.Description>Descripcion</Dialog.Description>
    </Dialog.Header>
    Contenido del modal
    <Dialog.Footer>
      <Button onClick={() => setOpen(false)}>Cerrar</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>
```

---

## Componentes de Lector

### MangaReader

Componente principal del lector de manga.

**Ubicacion:** `src/components/Reader/MangaReader.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `pages` | `string[]` | Si | URLs de las paginas |
| `chapterNumber` | `number` | Si | Numero de capitulo |
| `mangaTitle` | `string` | Si | Titulo del manga |
| `mangaSlug` | `string` | Si | Slug del manga |
| `mangaId` | `string` | Si | ID del manga |
| `chapterId` | `string` | Si | ID del capitulo |
| `totalChapters` | `number` | Si | Total de capitulos |
| `prevChapter` | `{ slug: string; chapterNumber: number }` | No | Capitulo anterior |
| `nextChapter` | `{ slug: string; chapterNumber: number }` | No | Capitulo siguiente |
| `initialPage` | `number` | No | Pagina inicial (default: 0) |
| `savedProgress` | `{ page: number; percentage: number }` | No | Progreso guardado |

**Ejemplo:**

```tsx
import { MangaReader } from '@/components/Reader/MangaReader';

<MangaReader
  pages={["/page1.jpg", "/page2.jpg", "/page3.jpg"]}
  chapterNumber={1}
  mangaTitle="Titulo del Manga"
  mangaSlug="titulo-manga"
  mangaId="uuid-manga"
  chapterId="uuid-chapter"
  totalChapters={10}
  prevChapter={{ slug: "titulo-manga", chapterNumber: 0 }}
  nextChapter={{ slug: "titulo-manga", chapterNumber: 2 }}
  initialPage={5}
  savedProgress={{ page: 5, percentage: 20 }}
/>
```

**Features:**
- Navegacion con teclado (←/→, A/D)
- Zoom con flechas arriba/abajo
- Reset zoom con tecla 0
- Toggle controles con espacio
- Swipe en dispositivos moviles
- Click en bordes para navegacion
- Guardado automatico de progreso
- Soporte LTR/RTL

### ReaderSettings

Panel de ajustes del lector.

**Ubicacion:** `src/components/Reader/ReaderSettings.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `direction` | `'ltr' \| 'rtl'` | Si | Direccion de lectura |
| `onDirectionChange` | `(dir: 'ltr' \| 'rtl') => void` | Si | Callback de cambio |
| `zoom` | `number` | Si | Nivel de zoom |
| `onZoomChange` | `(zoom: number) => void` | Si | Callback de zoom |

### CommentDrawer

Panel lateral de comentarios.

**Ubicacion:** `src/components/Reader/CommentDrawer.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `chapterId` | `string` | Si | ID del capitulo |
| `isOpen` | `boolean` | Si | Estado de apertura |
| `onClose` | `() => void` | Si | Callback de cierre |

### ProgressBar

Barra de progreso de lectura.

**Ubicacion:** `src/components/Reader/ProgressBar.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `current` | `number` | Si | Pagina actual |
| `total` | `number` | Si | Total de paginas |
| `showPercentage` | `boolean` | No | Mostrar porcentaje |

---

## Componentes de Creador

### ChapterList

Lista de capitulos para creadores.

**Ubicacion:** `src/components/Creator/ChapterList.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `mangaId` | `string` | Si | ID del manga |
| `chapters` | `Chapter[]` | Si | Lista de capitulos |
| `onEdit` | `(chapter: Chapter) => void` | Si | Callback de editar |
| `onDelete` | `(chapterId: string) => void` | Si | Callback de eliminar |

### MangaCard (Creator)

Tarjeta de manga para panel de creador.

**Ubicacion:** `src/components/Creator/MangaCard.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `manga` | `MangaSeries` | Si | Datos del manga |
| `onEdit` | `() => void` | Si | Callback de editar |
| `onDelete` | `() => void` | Si | Callback de eliminar |
| `chapterCount` | `number` | Si | Numero de capitulos |

### Sidebar

Barra lateral del panel de creador.

**Ubicacion:** `src/components/Creator/Sidebar.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `user` | `User` | Si | Usuario actual |
| `activeItem` | `string` | Si | Item activo |
| `onNavigate` | `(path: string) => void` | Si | Callback de navegacion |

---

## Componentes de Comunidad

### ClanCard

Tarjeta de clan para listado.

**Ubicacion:** `src/components/Clan/ClanCard.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `clan` | `Clan` | Si | Datos del clan |
| `onJoin` | `() => void` | No | Callback de unirse |
| `isMember` | `boolean` | No | Si el usuario es miembro |

### CommentSection

Seccion de comentarios con IA.

**Ubicacion:** `src/components/Comments/CommentSection.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `chapterId` | `string` | Si | ID del capitulo |
| `isSpoilerEnabled` | `boolean` | No | Permitir spoilers |

### CommentItem

Item individual de comentario.

**Ubicacion:** `src/components/Comments/CommentItem.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `comment` | `Comment` | Si | Datos del comentario |
| `onReply` | `(commentId: string) => void` | Si | Callback de responder |
| `onLike` | `(commentId: string) => void` | Si | Callback de like |
| `isReply` | `boolean` | No | Si es respuesta |

---

## Componentes de Pagos

### TipButton

Boton para enviar propinas.

**Ubicacion:** `src/components/Payments/TipButton.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `chapterId` | `string` | Si | ID del capitulo |
| `authorId` | `string` | Si | ID del autor |
| `minAmount` | `number` | No | Cantidad minima (default: 10) |
| `maxAmount` | `number` | No | Cantidad maxima (default: 1000) |
| `onSuccess` | `(amount: number) => void` | No | Callback de exito |

### CrowdfundingWidget

Widget de crowdfunding para capitulos.

**Ubicacion:** `src/components/Payments/CrowdfundingWidget.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `chapterId` | `string` | Si | ID del capitulo |
| `goal` | `number` | Si | Meta de crowdfunding |
| `current` | `number` | Si | Monto actual |
| `isCompleted` | `boolean` | Si | Si esta completado |
| `onContribute` | `(amount: number) => void` | Si | Callback de contribuir |

### ContributionModal

Modal para hacer contribuciones.

**Ubicacion:** `src/components/Payments/ContributionModal.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `isOpen` | `boolean` | Si | Estado de apertura |
| `onClose` | `() => void` | Si | Callback de cierre |
| `chapterId` | `string` | Si | ID del capitulo |
| `goal` | `number` | Si | Meta |
| `current` | `number` | Si | Actual |

---

## Componentes de Notificaciones

### NotificationBell

Campana de notificaciones con contador.

**Ubicacion:** `src/components/Notifications/NotificationBell.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `unreadCount` | `number` | Si | Contador sin leer |
| `onClick` | `() => void` | Si | Callback de click |

### NotificationList

Lista de notificaciones.

**Ubicacion:** `src/components/Notifications/NotificationList.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `notifications` | `Notification[]` | Si | Lista de notificaciones |
| `onMarkAsRead` | `(id: string) => void` | Si | Marcar como leida |
| `onMarkAllAsRead` | `() => void` | Si | Marcar todas |
| `onDelete` | `(id: string) => void` | Si | Eliminar |

### NotificationCard

Tarjeta individual de notificacion.

**Ubicacion:** `src/components/Notifications/NotificationCard.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `notification` | `Notification` | Si | Datos de la notificacion |
| `onMarkAsRead` | `() => void` | Si | Marcar como leida |
| `onDelete` | `() => void` | Si | Eliminar |

---

## Componentes de Analytics

### AnalyticsDashboard

Dashboard completo de analytics.

**Ubicacion:** `src/components/Analytics/AnalyticsDashboard.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `mangaId` | `string` | No | ID del manga (opcional) |
| `dateRange` | `{ start: Date; end: Date }` | Si | Rango de fechas |

### ViewsChart

Grafico de vistas.

**Ubicacion:** `src/components/Analytics/ViewsChart.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `data` | `ChartData[]` | Si | Datos del grafico |
| `period` | `'day' \| 'week' \| 'month'` | Si | Periodo |

### PopularChaptersChart

Grafico de capitulos mas populares.

**Ubicacion:** `src/components/Analytics/PopularChaptersChart.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `chapters` | `ChapterStats[]` | Si | Estadisticas de capitulos |
| `limit` | `number` | No | Limite de capitulos |

### StatCard

Tarjeta de estadistica.

**Ubicacion:** `src/components/Analytics/StatCard.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `title` | `string` | Si | Titulo |
| `value` | `number \| string` | Si | Valor |
| `change` | `number` | No | Cambio porcentual |
| `icon` | `React.ReactNode` | No | Icono |
| `trend` | `'up' \| 'down' \| 'neutral'` | No | Tendencia |

**Ejemplo:**

```tsx
<StatCard
  title="Vistas Totales"
  value={10000}
  change={12.5}
  trend="up"
  icon={<EyeIcon className="w-4 h-4" />}
/>
```

### DateRangePicker

Selector de rango de fechas.

**Ubicacion:** `src/components/Analytics/DateRangePicker.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `startDate` | `Date` | Si | Fecha inicio |
| `endDate` | `Date` | Si | Fecha fin |
| `onChange` | `(range: { start: Date; end: Date }) => void` | Si | Callback de cambio |

---

## Componentes de Gamificacion

### UserXPBar

Barra de XP del usuario.

**Ubicacion:** `src/components/UserXPBar.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `xpPoints` | `number` | Si | XP actual |
| `level` | `number` | Si | Nivel |
| `showRank` | `boolean` | No | Mostrar rango |

---

## Componentes de Imagen

### OptimizedImage

Imagen optimizada con lazy loading.

**Ubicacion:** `src/components/Image/OptimizedImage.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `src` | `string` | Si | URL de la imagen |
| `alt` | `string` | Si | Texto alternativo |
| `width` | `number` | Si | Ancho |
| `height` | `number` | Si | Alto |
| `priority` | `boolean` | No | Carga prioritaria |
| `placeholder` | `'blur' \| 'empty'` | No | Placeholder |
| `blurhash` | `string` | No | Blurhash para placeholder |

### ImageGallery

Galeria de imagenes.

**Ubicacion:** `src/components/Image/ImageGallery.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `images` | `ImageItem[]` | Si | Lista de imagenes |
| `columns` | `number` | No | Columnas (default: 3) |
| `gap` | `number` | No | Espacio entre imagenes |

---

## Componentes de Admin

### StatCard (Admin)

Tarjeta de estadistica para admin.

**Ubicacion:** `src/components/Admin/StatCard.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `title` | `string` | Si | Titulo |
| `value` | `number` | Si | Valor |
| `icon` | `React.ReactNode` | Si | Icono |
| `trend` | `number` | No | Tendencia |
| `color` | `string` | No | Color del borde |

### AdminSidebar

Barra lateral del panel de admin.

**Ubicacion:** `src/components/Admin/AdminSidebar.tsx`

**Props:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `activeSection` | `string` | Si | Seccion activa |
| `onNavigate` | `(section: string) => void` | Si | Callback de navegacion |

---

## Hooks Personalizados

### useAutoSaveProgress

Hook para guardar progreso de lectura automaticamente.

**Ubicacion:** `src/hooks/useReadingProgress.ts`

**Uso:**

```tsx
useAutoSaveProgress(mangaId, chapterId, currentPage, totalPages);
```

### useSocket

Hook para conexion WebSocket.

**Ubicacion:** `src/hooks/useSocket.ts`

**Uso:**

```tsx
const { socket, isConnected, emit, on } = useSocket('/party-room');
```

---

## Convenciones de Estilo

### Nomenclatura

- Componentes: PascalCase (ej: `MangaReader`)
- Hooks: camelCase con prefijo `use` (ej: `useAutoSaveProgress`)
- Props opcionales: usar `?` en TypeScript
- Event handlers: prefijo `on` (ej: `onClick`, `onSubmit`)

### Organizacion de Archivos

```
src/components/
├── ui/           # Componentes base reutilizables
├── Reader/       # Componentes del lector
├── Creator/      # Componentes del panel creador
├── Analytics/    # Componentes de analytics
├── Payments/     # Componentes de pagos
├── Comments/     # Componentes de comentarios
└── ...
```

### Performance

- Usar `React.memo` para componentes que reciben props complejas
- Usar `useMemo` para calculos costosos
- Usar `useCallback` para funciones pasadas como props
- Lazy loading de imagenes con Next.js Image
- Code splitting con dynamic imports
