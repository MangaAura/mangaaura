# InkVerse UX/UI Design System

## 📋 Overview

InkVerse es una plataforma de lectura de manga moderna e inmersiva con soporte para IA. El diseño prioriza:
- **Dark Mode First**: Interfaz optimizada para lectura prolongada
- **Inmersión**: Mínimas distracciones durante la lectura
- **Accesibilidad**: WCAG 2.1 AA compliance
- **Performance**: Carga rápida y navegación fluida

---

## 🎨 Color System

### Primary Colors

```css
/* Modo Oscuro (Default) */
--primary: #6366f1;        /* Indigo 500 - Accent principal */
--primary-hover: #4f46e5;  /* Indigo 600 */
--primary-subtle: rgba(99, 102, 241, 0.1);

/* Backgrounds */
--bg-primary: #0f172a;     /* Slate 900 - Fondo principal */
--bg-secondary: #1e293b;   /* Slate 800 - Cards/Surfaces */
--bg-tertiary: #334155;    /* Slate 700 - Inputs/Hover states */
--bg-surface: #0b0f19;     /* Más oscuro para profundidad */

/* Text */
--text-primary: #f8fafc;   /* Slate 50 */
--text-secondary: #94a3b8; /* Slate 400 */
--text-muted: #64748b;     /* Slate 500 */
--text-disabled: #475569;  /* Slate 600 */

/* Accent Colors */
--accent-blue: #3b82f6;
--accent-purple: #8b5cf6;
--accent-pink: #ec4899;
--accent-orange: #f97316;
--accent-green: #10b981;
--accent-red: #ef4444;
--accent-yellow: #f59e0b;
```

### Semantic Colors

| Token | Uso | Hex |
|-------|-----|-----|
| `--success` | Éxito, completado | `#10b981` |
| `--warning` | Advertencia, pausa | `#f59e0b` |
| `--error` | Error, abandonado | `#ef4444` |
| `--info` | Información | `#3b82f6` |
| `--premium` | Contenido premium | `#8b5cf6` |

### Status Colors (Manga)

```css
--status-ongoing: #10b981;    /* Verde - Publicando */
--status-completed: #3b82f6;  /* Azul - Completado */
--status-hiatus: #f59e0b;     /* Ámbar - Pausado */
--status-dropped: #ef4444;    /* Rojo - Abandonado */
```

---

## 📝 Typography

### Font Families

```css
/* Headings */
--font-heading: 'Inter', system-ui, sans-serif;

/* Body */
--font-body: 'Inter', system-ui, sans-serif;

/* Monospace (código, datos) */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| **Display** | 48px / 3rem | 800 | 1.1 | Hero titles |
| **H1** | 36px / 2.25rem | 700 | 1.2 | Page titles |
| **H2** | 30px / 1.875rem | 700 | 1.3 | Section headers |
| **H3** | 24px / 1.5rem | 600 | 1.4 | Card titles |
| **H4** | 20px / 1.25rem | 600 | 1.4 | Subsection |
| **H5** | 18px / 1.125rem | 600 | 1.5 | Labels |
| **H6** | 16px / 1rem | 600 | 1.5 | Small labels |
| **Body Large** | 18px / 1.125rem | 400 | 1.6 | Featured text |
| **Body** | 16px / 1rem | 400 | 1.6 | Standard text |
| **Body Small** | 14px / 0.875rem | 400 | 1.5 | Descriptions |
| **Caption** | 12px / 0.75rem | 400 | 1.5 | Metadata |
| **Tiny** | 10px / 0.625rem | 500 | 1.4 | Tags, badges |

---

## 📐 Spacing System

### Base Unit

```css
--space-unit: 0.25rem; /* 4px */
```

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-0` | 0 | Reset |
| `--space-1` | 4px | Tight gaps |
| `--space-2` | 8px | Element padding |
| `--space-3` | 12px | Component gaps |
| `--space-4` | 16px | Standard padding |
| `--space-5` | 20px | Card padding |
| `--space-6` | 24px | Section gaps |
| `--space-8` | 32px | Large gaps |
| `--space-10` | 40px | Section padding |
| `--space-12` | 48px | Page padding |
| `--space-16` | 64px | Hero spacing |
| `--space-20` | 80px | Major sections |

### Border Radius

```css
--radius-none: 0;
--radius-sm: 4px;   /* Badges, tags */
--radius-md: 8px;   /* Buttons, inputs */
--radius-lg: 12px;  /* Cards, modals */
--radius-xl: 16px;  /* Large cards */
--radius-2xl: 24px; /* Feature cards */
--radius-full: 9999px; /* Pills, avatars */
```

---

## 🧩 Components

### Buttons

#### Primary Button
```
- Background: var(--primary)
- Text: white
- Padding: 12px 24px
- Border-radius: var(--radius-md)
- Font-weight: 600
- Hover: var(--primary-hover) + subtle glow
- Active: scale(0.98)
- Disabled: opacity 0.5, cursor not-allowed
```

#### Secondary Button
```
- Background: transparent
- Border: 1px solid var(--bg-tertiary)
- Text: var(--text-primary)
- Hover: background var(--bg-secondary)
```

#### Ghost Button
```
- Background: transparent
- Text: var(--text-secondary)
- Hover: background var(--bg-tertiary)
```

#### Action Buttons (Icon)
```
- Size: 40px x 40px
- Border-radius: var(--radius-md)
- Background: var(--bg-secondary)
- Icon size: 20px
- Hover: background var(--bg-tertiary)
```

### Cards

#### Manga Card
```
- Aspect ratio: 2/3
- Border-radius: var(--radius-lg)
- Background: var(--bg-secondary)
- Shadow: subtle on hover
- Hover: scale(1.02) + enhanced shadow
- Transition: 300ms ease
```

#### Info Card
```
- Padding: var(--space-5)
- Border-radius: var(--radius-lg)
- Background: var(--bg-secondary)
- Border: 1px solid var(--bg-tertiary)
```

### Inputs

#### Text Input
```
- Background: var(--bg-secondary)
- Border: 1px solid var(--bg-tertiary)
- Border-radius: var(--radius-md)
- Padding: 12px 16px
- Focus: border-color var(--primary) + glow
- Placeholder: var(--text-muted)
```

#### Search Input
```
- Background: var(--bg-tertiary)
- Border-radius: var(--radius-full)
- Padding-left: 44px (for icon)
- Icon: Search, 20px, var(--text-muted)
```

### Badges

```
- Padding: 4px 12px
- Border-radius: var(--radius-full)
- Font-size: var(--text-xs)
- Font-weight: 600
- Variants:
  - default: bg-slate-700
  - primary: bg-indigo-500
  - success: bg-emerald-500
  - warning: bg-amber-500
  - danger: bg-red-500
```

---

## 📱 Layout

### Container

```css
.container {
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

/* Responsive */
@media (min-width: 640px) { padding: 1.5rem; }
@media (min-width: 1024px) { padding: 2rem; }
```

### Grid System

```css
/* Manga Grid */
.manga-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 640px) {
  .manga-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 768px) {
  .manga-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 1024px) {
  .manga-grid { grid-template-columns: repeat(5, 1fr); }
}

@media (min-width: 1280px) {
  .manga-grid { grid-template-columns: repeat(6, 1fr); }
}
```

### Reader Layout

```
- Full viewport height
- Minimal UI chrome
- Focus mode: hide all controls after 3s inactivity
- Navigation: arrow keys, tap zones, scroll
```

---

## 🎭 Animations

### Transitions

```css
/* Standard */
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
--transition-slower: 500ms ease;

/* Easing */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Micro-interactions

```css
/* Button press */
.button:active {
  transform: scale(0.98);
}

/* Card hover */
.card {
  transition: transform 300ms var(--ease-out),
              box-shadow 300ms var(--ease-out);
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

/* Page transitions */
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}
.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms, transform 300ms;
}
```

---

## 🖼️ Imagery

### Manga Covers

```
- Aspect ratio: 2:3
- Border-radius: var(--radius-lg)
- Object-fit: cover
- Loading: blur placeholder
- Error: fallback gradient
```

### User Avatars

```
- Shape: circular
- Sizes: 32px (sm), 40px (md), 48px (lg), 64px (xl)
- Border: 2px solid var(--bg-secondary)
- Fallback: initials with gradient
```

### Placeholder States

```css
.placeholder-gradient {
  background: linear-gradient(
    135deg,
    var(--bg-secondary) 0%,
    var(--bg-tertiary) 50%,
    var(--bg-secondary) 100%
  );
  background-size: 200% 200%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

---

## 📊 Reader Experience

### Page Viewer

```
- Background: var(--bg-surface) #0b0f19
- Page display: fit-to-width or fit-to-height
- Zoom: 100% - 200%
- Transition: slide between pages
- Progress: bottom bar with chapter info
```

### Reading Modes

```
Mode: Vertical Scroll
- Continuous scrolling
- Smooth momentum
- Chapter transitions with divider

Mode: Paged
- Single page view
- Tap zones for navigation
- Swipe gesture support
```

### Accessibility Features

```
- Keyboard navigation: Arrow keys, Space
- Screen reader: ARIA labels on all controls
- Focus indicators: Visible focus rings
- Reduced motion: Respect prefers-reduced-motion
- Color contrast: WCAG 2.1 AA minimum
```

---

## 🌐 Responsive Breakpoints

| Breakpoint | Min Width | Max Container | Notes |
|------------|-----------|---------------|-------|
| Mobile | 0px | 100% | Single column |
| sm | 640px | 100% | 2 columns |
| md | 768px | 100% | 3-4 columns |
| lg | 1024px | 1024px | Full layout |
| xl | 1280px | 1280px | Max content |
| 2xl | 1536px | 1280px | Centered |

---

## 🎯 Design Principles

1. **Dark Mode First**: Diseñado para lectura nocturna
2. **Content First**: El manga es el protagonista
3. **Progressive Disclosure**: Opciones avanzadas ocultas por defecto
4. **Immediate Feedback**: Toda acción tiene respuesta visual
5. **Consistency**: Patrones coherentes en toda la app
6. **Performance**: Animaciones de 60fps, carga progresiva

---

## 🛠️ Implementation Notes

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
        },
        surface: {
          DEFAULT: '#0f172a',
          secondary: '#1e293b',
          tertiary: '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
    },
  },
}
```

### Common Utilities

```css
/* Glassmorphism */
.glass {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Truncate */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

---

## 📝 Changelog

### v2.0 - 2026-04-27
- ✅ Estandarizado `[slug]` en todas las rutas dinámicas
- ✅ Actualizado color system para mejor contraste
- ✅ Agregado glassmorphism para elementos flotantes
- ✅ Definido grid system responsivo
- ✅ Especificado animaciones y transiciones
- ✅ Documentado Reader Experience

---

*Para dudas o sugerencias, consultar el equipo de desarrollo.*
