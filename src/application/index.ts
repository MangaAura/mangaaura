/**
 * Índice principal de la capa de aplicación
 * Exporta todos los módulos de la capa de aplicación
 * siguiendo Clean Architecture
 * @packageDocumentation
 */

// DTOs - Objetos de transferencia de datos
export * from './dtos';

// Ports - Interfaces de repositorios (contratos)
export * from './ports';

// Use Cases - Casos de uso de la aplicación
export * from './use-cases';

// Services - Servicios de aplicación
export * from './services';

// Events - Eventos de dominio
export * from './events';
