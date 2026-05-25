# MangaAura — ADN del Negocio

## 🧬 Identidad Fundamental

### Misión

> **Democratizar el acceso al manga global, conectando lectores con creadores en una plataforma donde la pasión por las historias genera valor económico para ambas partes.**

### Visión

> **Ser la plataforma líder en habla hispana de distribución y creación de manga, reconocida por integrar tecnología de IA para potenciar la experiencia creativa, con un modelo económico que premia la participación activa y el talento.**

### Lema

> *"Lee. Crea. Destaca."*

---

## 💎 Ventajas Competitivas Diferenciadoras

### 1. Ecosistema de Economía Virtual (Aura)

A diferencia de plataformas pasivas de lectura, MangaAura posee una **moneda virtual propia** que:

- **Incentiva la actividad**: XP por lectura, logros, rankings mensuales
- **Genera Revenue Sharing**: creadores reciben Aura por contenido exitoso
- **Crowdfunding**: lectores pueden financiar capítulos antes de publicarse
- **Propinas directas**: apoyo económico inmediato a creadores favoritos

### 2. IA Paralela como Infraestructura Central

El stack de IA no es un añadido — es **núcleo de la plataforma**:

- **Moderación automática** de comentarios con detección de toxicidad
- **Traducción automática** de contenido (Google Translate API + v9)
- **Generación de descripciones** y tags con NVIDIA NIM + OpenAI
- **Recomendaciones personalizadas** basadas en patrones de lectura
- **Dashboard administrativo** con métricas en tiempo real y health checks

### 3. PWA-First con Offline Nativo

La aplicación está diseñada desde cero como **Progressive Web App**:

- Instalable en móvil y desktop sin app store
- Lectura offline de capítulos cacheados
- Push notifications para nuevos capítulos
- Background sync cuando hay conectividad
- Share target para compartir desde otras apps

### 4. Sistema de Gamificación Profundo

Más que badges triviales:

- **XP persistente** que se refleja en rankings
- **Sistema de logros** que desbloquea funcionalidades
- **Clanes** con identidad grupal y rankings colectivos
- **Temporadas y eventos** que crean urgencia y engagement
- **Streaks** de lectura que premian consistencia

### 5. Stack Tecnológico de Vanguardia

| Categoría | Tecnología | Ventaja |
|-----------|------------|---------|
| Framework | Next.js 16 + React 19 | App Router, Server Components, turbopack |
| BD | Prisma + PostgreSQL/SQLite | ORM tipado, dual-db para dev/prod |
| Cache | Redis + memory fallback | Rendimiento sin vendor lock-in |
| Auth | NextAuth v5 + JWT | Autenticación moderna con 2FA |
| Pagos | Stripe | Checkout embebido, webhooks, subscriptions |
| Realtime | Socket.IO + Redis Adapter | Notificaciones y chat escalables |
| Storage | Vercel Blob + filesystem | URLs firmadas, eliminación automática |
| Email | Resend/SMTP | Transaccional y marketing |
| AI | NVIDIA NIM + OpenAI | Fallback automático entre proveedores |
| Testing | Vitest + Playwright | Cobertura total, E2E confiable |

---

## 🏛️ Pilares Estratégicos

### Pilar 1: La Biblioteca como Ventaja

Una colección curada de manga (no scraping masivo) con:

- Metadatos enriquecidos (géneros, estado, автор,Editorial)
- Portadas optimizadas con blurhash para carga progresiva
- Rankings mensuales basados en engagement real (no views inflateadas)
- Sistema de géneros jerárquico con `parentId` y `order`

### Pilar 2: El Lector como Creador

La barrera de entrada para crear es mínima:

- Upload drag & drop con reordenación visual de páginas
- Dashboard completo de analytics para cada manga
- Gestión de series completas desde el editor
- Posibilidad de crowdfunding por capítulo

### Pilar 3: Monetización Transparente

El usuario entiende exactamente cómo funciona el dinero:

- Compra de Aura via Stripe con precios claros
- Historial completo de transacciones en la wallet
- Propinas con notificación al creador en tiempo real
- Revenue sharing documentado (patrocinio = % para autor)

### Pilar 4: Comunidad Autosuficiente

Los usuarios generan contenido que beneficia a otros:

- Comentarios anidados con replies infinitos
- Sistema de likes en comentarios
- Clanes con membresías y rankings propios
- Eventos que recompensan participación colectiva

---

## 🎯 Propuesta de Valor por Segmento

### Para Lectores

> **"Tu próxima serie favorita te está esperando. Y mientras la lees, estás construyendo tu reputación en la comunidad."**

- Descubrimiento guiado por IA
- Progreso sincronizado entre dispositivos
- Gamificación que premia la consistencia
- Acceso offline para commuting

### Para Creadores

> **"Publica tu manga, construye tu audiencia, y recibe apoyo económico directo de tus lectores más fieles."**

- Zero costo de plataforma (primera etapa)
- Dashboard de analytics detallado
- Herramientas de crowdfunding integradas
- Exposición en rankings meritocráticos

### Para Patrocinadores/Marca

> **"Llega a una audiencia altamente comprometida de amantes del manga con mensajes nativos."**

- Aura como vehículo de patrocinio
- Posibilidad de capítulos "sponsored"
- Datos demográficos y de engagement disponibles

---

## 📐 Modelo de Ingresos

### Streams Primarios

| Stream | Mecánica | Contribución Estimada |
|--------|----------|----------------------|
| Venta de Aura | % sobre cada compra | 60-70% |
| Patrocinio de capítulos | Tarifa fija por capítulo | 15-20% |
| Ads (futuro) | Banners no intrusivos | 5-10% |
| Premium tiers | Funcionalidades exclusivas | 5-10% |

### Streams Secundarios

- ** merchandise**: link a tiendas externas (affiliate)
- ** eventos patrocinados**: rankings temáticos de marcas
- ** API para terceros**: acceso a datos agregados (anonimizados)

---

## 🔒 Factores Críticos de Éxito

1. **Retención de lectores**: El modelo gamificación + XP debe generar hábito diario
2. **Onboarding de creadores**: La barrera para subir contenido debe ser < 5 minutos
3. **Calidad del descubrimiento**: La IA de recomendaciones debe ser significativamente mejor que filtrar por género
4. **Velocidad de carga**: < 2s para primer paint en mobile 3G
5. **Moderación de comunidad**: Comments seguros sin convertir la plataforma en un jardín vallado
6. **Trust en transacciones**: Los Aura deben sentirse tangibles, no como fichas de casino

---

## ⚠️ Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Dependencia de NVIDIA NIM | Media | Alto | Fallback a OpenAI ya implementado |
| Concurrencia con plataformas established (MangaPlus, Tappytoon) | Alta | Alto | Diferenciación en comunidad + IA |
| Costos de GPU para IA | Media | Medio | Rate limiting + caché agresivo |
| Regulación de monedas virtuales | Baja | Muy Alto | Aura son crédito, no dinero real |
| Abandono de creadores por falta de monetización | Media | Alto | Revenue sharing dès el día 1 |

---

## 🚀 Roadmap Estratégico (12-18 meses)

### Fase 1: Consolidación (0-6 meses)

- [ ] Estabilizar sistema de pagos con Stripe
- [ ] Implementar sistema de Premium tiers
- [ ] Dashboard de analytics para creadores
- [ ] Sistema de recomendación basado en IA

### Fase 2: Escalamiento (6-12 meses)

- [ ] Programa de afiliados
- [ ] Eventos сезонные (temporadas de rankings)
- [ ] App nativa (Electron/Capacitor) opcional
- [ ] API pública para terceros

### Fase 3: Expansión (12-18 meses)

- [ ] Integración con editoriales existentes
- [ ] Sistema de licencias para manga oficial
- [ ] Expansión a otros idiomas (portugués, francés)
- [ ] Manga original (creado en la plataforma)

---

## 📊 Métricas Clave (KPIs)

| Métrica | Meta 6 meses | Meta 12 meses |
|---------|-------------|---------------|
| Usuarios activos mensuales (MAU) | 10,000 | 100,000 |
| Creadores activos | 100 | 1,000 |
| Capítulos subidos/mes | 500 | 5,000 |
| Revenue mensual | $1,000 MRR | $15,000 MRR |
| NPS (Net Promoter Score) | > 40 | > 60 |
| Retention D7 | > 30% | > 45% |
| Tiempo medio de lectura/día | 20 min | 45 min |

---

## 🧩 Estructura Organizacional Implícita

```
┌─────────────────────────────────────────────────────┐
│                    USUARIO ANÓNIMO                   │
│    Descubre → Lee sample → Se registra (free)       │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌───────────────┐           ┌───────────────┐
│   LECTOR      │           │   CREADOR     │
│               │           │               │
│ • Biblioteca  │           │ • Upload      │
│ • XP/Gamificación          │ • Dashboard   │
│ • Comentarios │           │ • Analytics   │
│ • Notificaciones           │ • Crowdfunding│
│ • Wallet      │           │ • Earnings    │
└───────────────┘           └───────────────┘
        │                           │
        └─────────────┬─────────────┘
                      │
                     ▼
         ┌─────────────────────┐
         │   PATROCINADOR      │
         │                     │
         │ • Compra Aura      │
         │ • Patrocina caps    │
         │ • Da propinas       │
         └─────────────────────┘
```

---

## 📝 Conclusión

MangaAura no es solo una plataforma de lectura — es un **ecosistema de valor** donde:

- El **lector** es recompensado por su actividad y construcción de reputación
- El **creador** tiene un camino claro desde la publicación hasta la monetización
- La **tecnología** (IA, real-time, offline) es invisible pero mejora cada interacción
- La **comunidad** se autogestiona con moderación inteligente

La diferenciación no está en una sola feature, sino en la **combinación sinérgica** de todas ellas: un lector activo que gana XP, puede convertirse en creador, que puede monetizar con Aura, que otros pueden comprar para patrocinar capítulos, generando un ciclo virtuoso de valor.