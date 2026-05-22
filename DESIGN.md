---
name: MangaAura
version: 1.0.0

colors:
  background: "#ffffff"
  foreground: "#0f0f0f"
  surface: "#fafafa"
  surface-elevated: "#ffffff"
  surface-sunken: "#f5f5f5"
  text-primary: "#0f0f0f"
  text-secondary: "#6b6b6b"
  text-tertiary: "#a3a3a3"
  text-muted: "#737373"
  text-inverse: "#ffffff"
  border: "#e5e5e5"
  border-subtle: "#f0f0f0"
  border-strong: "#d4d4d4"
  primary: "#6366f1"
  primary-hover: "#4f46e5"
  primary-subtle: "#eef2ff"
  accent-purple: "#8b5cf6"
  accent-purple-hover: "#7c3aed"
  success: "#22c55e"
  warning: "#f59e0b"
  error: "#ef4444"
  info: "#3b82f6"

  dark-background: "#0a0a0a"
  dark-foreground: "#fafafa"
  dark-surface: "#141414"
  dark-surface-elevated: "#1a1a1a"
  dark-surface-sunken: "#0f0f0f"
  dark-text-primary: "#fafafa"
  dark-text-secondary: "#a3a3a3"
  dark-text-tertiary: "#737373"
  dark-text-muted: "#525252"
  dark-text-inverse: "#0a0a0a"
  dark-border: "#262626"
  dark-primary: "#818cf8"
  dark-accent-purple: "#a78bfa"

typography:
  font-family: "Inter Variable"
  font-family-fallback: "system-ui, sans-serif"
  h1:
    fontSize: 2.5rem
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.025em
  h2:
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.025em
  h3:
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.025em
  body:
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
    textTransform: uppercase
    letterSpacing: 0.05em

rounded:
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 24px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px

shadows:
  xs: "0 1px 2px rgba(0,0,0,0.04)"
  sm: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)"
  md: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.03)"
  lg: "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.02)"
  glow: "0 0 20px rgba(99,102,241,0.15)"

  dark-xs: "0 1px 2px rgba(0,0,0,0.3)"
  dark-sm: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.2)"
  dark-md: "0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.2)"
  dark-glow: "0 0 30px rgba(99,102,241,0.25)"

transitions:
  fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)"
  base: "200ms cubic-bezier(0.4, 0, 0.2, 1)"
  slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)"

breakpoints:
  sm: 640px
  md: 768px
  lg: 1024px
  xl: 1280px
---

## Overview

MangaAura is a manga reading and creation platform with a modern, clean aesthetic centered on readability and immersion. The design prioritizes content — manga pages — above all else, using neutral surfaces, subtle shadows, and a distinctive indigo primary palette with violet accents.

The visual identity combines **editorial clarity** (clean typography, generous whitespace, structured grids) with **gaming dynamism** (gradient accents, XP/level badges, glowing interactions). It aims to feel premium but approachable, like a high-end manga anthology app.

## Colors

### Light Mode

The light palette is built on warm-leaning neutrals with a crisp, clean feel:

- **Primary (#6366f1):** Indigo — the core interactive color for buttons, links, active states.
- **Accent Purple (#8b5cf6):** Used for gradients, premium features, creator branding.
- **Background (#ffffff):** Pure white base.
- **Surface (#fafafa):** Off-white for card backgrounds, sidebars.
- **Surface Elevated (#ffffff):** Pure white for elevated cards, modals.
- **Surface Sunken (#f5f5f5):** Light gray for input backgrounds, skeleton loading.
- **Text Primary (#0f0f0f):** Near-black for body text and headings.
- **Text Secondary (#6b6b6b):** Dimmed text for metadata, descriptions.
- **Text Tertiary (#a3a3a3):** Very dimmed for placeholders.
- **Border (#e5e5e5):** Light gray for container borders.
- **Success (#22c55e):** Green for positive states (XP gained, InkCoins).
- **Warning (#f59e0b):** Amber for alerts, level-up thresholds.
- **Error (#ef4444):** Red for destructive actions, errors.

### Dark Mode

The dark palette uses deep near-blacks with maintainable contrast:

- **Background (#0a0a0a):** Almost-black base — OLED-friendly.
- **Surface (#141414):** Slightly lighter for cards.
- **Surface Elevated (#1a1a1a):** Distinguishable from surface for modals.
- **Primary (#818cf8):** Brighter indigo to maintain contrast in dark mode.
- **Text Primary (#fafafa):** Near-white for readability.
- **Border (#262626):** Dark gray borders that don't overpower.

## Typography

**Inter Variable** is the sole typeface, loaded via `next/font/google` with `display: swap` and preload enabled. It provides excellent legibility at both small and large sizes.

Headings use tight letter-spacing (`-0.025em`) and high font weights (600-800) for impact. Body text uses standard weight with comfortable line-height (1.6) for extended reading sessions.

## Spacing

The spacing scale follows a 4px base unit, expanding through standard increments: 4, 8, 16, 24, 32, 48px. Cards and sections use `var(--surface-elevated)` backgrounds with `var(--radius-lg)` (12px) rounded corners and subtle shadows.

## Rounded Corners

- **sm (6px):** Badges, pills, small elements
- **md (8px):** Buttons, inputs, cards
- **lg (12px):** Main cards, dialogs
- **xl (16px):** Hero sections, large containers
- **2xl (24px):** Full-width banners
- **full (9999px):** Circular avatars, infinite pills

## Shadows

Shadows are intentionally subtle in light mode (low opacity, tight blur) and more pronounced in dark mode (higher opacity for depth perception on dark backgrounds). A `glow` shadow is used sparingly for primary interactive elements.

## Motion & Animation

Transitions use the standard cubic-bezier `(0.4, 0, 0.2, 1)` easing curve at three durations:
- **fast (150ms):** Micro-interactions, hover states, button presses
- **base (200ms):** Card hover, panel open/close
- **slow (300ms):** Page transitions, theme toggling

Animations include: fade-in, fade-up, loading-bar, shimmer for skeletons, and pulse for loading states. All animations respect `prefers-reduced-motion` via a global media query.

## Components

### Buttons
- **Primary:** Solid indigo background, white text, glow shadow on hover.
- **Secondary:** Outlined with border, transparent background, hover fills.
- **Ghost:** Fully transparent, dim text, hover reveals background.

### Cards
- `.card`: Elevated surface with border, shadow, hover lift effect.
- `.card-ghost`: Transparent until hovered, used for interactive grids.

### Navigation
- Links use muted text with rounded hover backgrounds.
- Active links use primary color with primary-subtle background.

### Reader
The manga reader uses separate theme variables (`data-theme` attribute) for light, sepia, dark, and OLED modes, independent of the site's dark/light toggle. Reader settings include brightness, contrast, sepia, and page gap sliders.

## Animations

All animations are defined as CSS `@keyframes` and exposed as utility classes:
- `.animate-in`: Quick fade + slide up (0.3s)
- `.animate-fade-up`: Longer fade + slide up (0.5s)
- `.animate-loading-bar`: Infinite horizontal sweep for progress
- `.animate-shimmer`: Gradient sweep for skeleton loading
- `animate-pulse`: Opacity oscillation (Tailwind)
