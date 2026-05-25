# ADR 002: Estrategia de Dual Database

## Estado
Aceptado

## Contexto
Necesitamos manejar:
1. **Datos transaccionales**: Usuarios, mangas, transacciones (ACID requerido)
2. **Datos analíticos**: Logs de lectura, comentarios, reportes (escrituras masivas)

## Decisión
Usamos **PostgreSQL + Prisma** para core y **MongoDB + Mongoose** para analytics/big data.

## División de Responsabilidades

### PostgreSQL (Core)
| Tabla | Propósito |
|-------|-----------|
| User | Perfiles, XP, Aura |
| MangaSeries | Metadatos de series |
| Chapter | Capítulos, crowdfunding |
| Transaction | Historial de Aura |
| Clan | Gremios de lectores |
| Achievement | Logros desbloqueados |

### MongoDB (Analytics)
| Colección | Propósito |
|-----------|-----------|
| ReadingLog | Eventos de lectura (scroll, tiempo) |
| Comment | Comentarios con análisis IA |
| QualityReport | Reportes de errores |
| PromptLibrary | Biblioteca de prompts IA |

## Justificación

### ¿Por qué no solo PostgreSQL?
- Escrituras masivas de logs saturan la DB
- Schema rígido dificulta evolución
- Escalado vertical limitado

### ¿Por qué no solo MongoDB?
- Sin transacciones ACID para operaciones financieras
- Sin joins eficientes para relaciones complejas
- Más complejo para queries complejas

## Sincronización

```
┌──────────────┐     ┌──────────────┐
│   PostgreSQL │     │   MongoDB    │
│   (Core)     │     │   (Analytics)│
├──────────────┤     ├──────────────┤
│ User         │────▶│ ReadingLog   │
│ Chapter      │     │ Comment      │
│ Transaction  │     │ QualityReport│
└──────────────┘     └──────────────┘
```

- **Lectura**: Joins en PostgreSQL, agregaciones en MongoDB
- **Escritura**: Transacciones en PostgreSQL, eventos en MongoDB
- **Eventual Consistency**: OK para analytics

## Ejemplo de uso
```typescript
// Crear usuario → PostgreSQL
const user = await prisma.user.create({ ... });

// Registrar lectura → MongoDB
await ReadingLogModel.create({
  userId: user.id,
  events: [...],
  completed: true
});
```

## Consecuencias

### Positivas
- ✅ Escalabilidad independiente
- ✅ Flexibilidad de schema para logs
- ✅ ACID para datos críticos
- ✅ Performance optimizada por caso

### Negativas
- ❌ Complejidad de dos conexiones
- ❌ Consistencia eventual
- ❌ Backup/restore más complejo

## Alternativas

### PostgreSQL + TimescaleDB
- ⚠️ Bueno para time-series, pero overkill
- ⚠️ Más infraestructura

### DynamoDB + Aurora
- ❌ Vendor lock-in (AWS)
- ❌ Costo más alto

## Decisiones Relacionadas
- ADR 001: Clean Architecture (isolation permite dual DB)
- ADR 003: Event-Driven (sincronización vía eventos)

## Fecha
2024-01-20
