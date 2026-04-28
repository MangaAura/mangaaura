/**
 * AlertManager - Sistema de alertas para el servicio de IA
 *
 * Gestiona alertas cuando modelos fallan o se degradan.
 * Usa EventEmitter para notificar cambios de estado.
 */

import { EventEmitter } from 'events';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type AlertType =
  | 'model_degraded'
  | 'model_unhealthy'
  | 'high_error_rate'
  | 'queue_backlog';

export type AlertSeverity = 'warning' | 'critical' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  acknowledged: boolean;
  dismissed: boolean;
}

export interface AlertThresholds {
  /** Umbral para marcar un modelo como degradado (fallos consecutivos) */
  degradedThreshold: number;
  /** Umbral para marcar un modelo como no saludable (fallos consecutivos) */
  unhealthyThreshold: number;
  /** Umbral de tasa de error (0-1, ej: 0.05 = 5%) */
  errorRateThreshold: number;
  /** Umbral de profundidad de cola para alerta de backlog */
  queueBacklogThreshold: number;
  /** Tiempo de vida de una alerta antes de auto-limpiarse (ms) */
  alertTTLMs: number;
}

export interface AlertConfig {
  thresholds?: Partial<AlertThresholds>;
  /** Habilitar auto-limpieza de alertas antiguas */
  enableAutoCleanup?: boolean;
  /** Intervalo de limpieza en ms */
  cleanupIntervalMs?: number;
}

export type AlertListener = (alert: Alert) => void;

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

const DEFAULT_THRESHOLDS: AlertThresholds = {
  degradedThreshold: 2,
  unhealthyThreshold: 5,
  errorRateThreshold: 0.05, // 5%
  queueBacklogThreshold: 100,
  alertTTLMs: 3600000, // 1 hora
};

// =============================================================================
// ALERT MANAGER CLASS
// =============================================================================

export class AlertManager extends EventEmitter {
  private alerts: Map<string, Alert> = new Map();
  private thresholds: AlertThresholds;
  private enableAutoCleanup: boolean;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: AlertConfig = {}) {
    super();
    this.setMaxListeners(100);

    this.thresholds = {
      ...DEFAULT_THRESHOLDS,
      ...config.thresholds,
    };
    this.enableAutoCleanup = config.enableAutoCleanup ?? true;

    if (this.enableAutoCleanup) {
      this.startCleanupTimer(config.cleanupIntervalMs ?? 60000);
    }
  }

  // ===========================================================================
  // SUBSCRIPTION
  // ===========================================================================

  /**
   * Suscribe a nuevas alertas
   * @param listener Función callback que recibe la alerta
   * @returns Función para desuscribirse
   */
  subscribe(listener: AlertListener): () => void {
    this.on('alert:new', listener);
    return () => {
      this.off('alert:new', listener);
    };
  }

  /**
   * Suscribe a todos los cambios de alertas (nueva, actualizada, eliminada)
   * @param listener Función callback
   * @returns Función para desuscribirse
   */
  subscribeToAll(listener: (event: string, alert: Alert) => void): () => void {
    const newHandler = (alert: Alert) => listener('new', alert);
    const updatedHandler = (alert: Alert) => listener('updated', alert);
    const clearedHandler = (alert: Alert) => listener('cleared', alert);

    this.on('alert:new', newHandler);
    this.on('alert:updated', updatedHandler);
    this.on('alert:cleared', clearedHandler);

    return () => {
      this.off('alert:new', newHandler);
      this.off('alert:updated', updatedHandler);
      this.off('alert:cleared', clearedHandler);
    };
  }

  // ===========================================================================
  // NOTIFICATION
  // ===========================================================================

  /**
   * Crea y emite una nueva alerta
   */
  notify(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Alert {
    // Verificar si ya existe una alerta similar activa
    const existingAlert = this.findExistingAlert(type, metadata);

    if (existingAlert) {
      // Actualizar alerta existente
      const updated: Alert = {
        ...existingAlert,
        message,
        metadata: { ...existingAlert.metadata, ...metadata, occurrenceCount: (existingAlert.metadata?.occurrenceCount as number ?? 1) + 1 },
        createdAt: new Date(),
      };
      this.alerts.set(updated.id, updated);
      this.emit('alert:updated', updated);
      return updated;
    }

    // Crear nueva alerta
    const alert: Alert = {
      id: crypto.randomUUID(),
      type,
      severity,
      title,
      message,
      metadata,
      createdAt: new Date(),
      acknowledged: false,
      dismissed: false,
    };

    this.alerts.set(alert.id, alert);
    this.emit('alert:new', alert);

    return alert;
  }

  /**
   * Notifica que un modelo ha sido degradado
   */
  notifyModelDegraded(modelId: string, modelName: string, reason?: string): Alert {
    return this.notify(
      'model_degraded',
      'warning',
      'Modelo Degradado',
      `El modelo "${modelName}" (${modelId}) ha sido marcado como degradado${reason ? `: ${reason}` : ''}`,
      { modelId, modelName, reason }
    );
  }

  /**
   * Notifica que un modelo no está saludable
   */
  notifyModelUnhealthy(modelId: string, modelName: string, consecutiveFailures: number): Alert {
    return this.notify(
      'model_unhealthy',
      'critical',
      'Modelo No Saludable',
      `El modelo "${modelName}" (${modelId}) ha sido marcado como no saludable tras ${consecutiveFailures} fallos consecutivos`,
      { modelId, modelName, consecutiveFailures }
    );
  }

  /**
   * Notifica tasa de error alta
   */
  notifyHighErrorRate(errorRate: number, threshold: number): Alert {
    return this.notify(
      'high_error_rate',
      errorRate > threshold * 2 ? 'critical' : 'warning',
      'Tasa de Error Alta',
      `La tasa de error actual es del ${(errorRate * 100).toFixed(1)}%, superando el umbral del ${(threshold * 100).toFixed(1)}%`,
      { errorRate, threshold, errorPercentage: errorRate * 100 }
    );
  }

  /**
   * Notifica backlog en la cola
   */
  notifyQueueBacklog(queueDepth: number, threshold: number): Alert {
    return this.notify(
      'queue_backlog',
      queueDepth > threshold * 2 ? 'critical' : 'warning',
      'Backlog en Cola',
      `La cola tiene ${queueDepth} trabajos pendientes, superando el umbral de ${threshold}`,
      { queueDepth, threshold }
    );
  }

  // ===========================================================================
  // ALERT MANAGEMENT
  // ===========================================================================

  /**
   * Marca una alerta como reconocida
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    this.alerts.set(alertId, alert);
    this.emit('alert:updated', alert);
    return true;
  }

  /**
   * Descarta/dismiss una alerta
   */
  dismissAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.dismissed = true;
    this.alerts.set(alertId, alert);
    this.emit('alert:updated', alert);
    return true;
  }

  /**
   * Elimina una alerta permanentemente
   */
  clearAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    this.alerts.delete(alertId);
    this.emit('alert:cleared', alert);
    return true;
  }

  /**
   * Limpia todas las alertas descartadas o antiguas
   */
  clearResolvedAlerts(): number {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [id, alert] of this.alerts) {
      if (alert.dismissed) {
        toDelete.push(id);
      } else if (now - alert.createdAt.getTime() > this.thresholds.alertTTLMs) {
        toDelete.push(id);
      }
    }

    toDelete.forEach((id) => {
      const alert = this.alerts.get(id);
      if (alert) {
        this.alerts.delete(id);
        this.emit('alert:cleared', alert);
      }
    });

    return toDelete.length;
  }

  /**
   * Limpia alertas por tipo
   */
  clearAlertsByType(type: AlertType): number {
    const toDelete: string[] = [];

    for (const [id, alert] of this.alerts) {
      if (alert.type === type) {
        toDelete.push(id);
      }
    }

    toDelete.forEach((id) => {
      const alert = this.alerts.get(id);
      if (alert) {
        this.alerts.delete(id);
        this.emit('alert:cleared', alert);
      }
    });

    return toDelete.length;
  }

  /**
   * Elimina todas las alertas
   */
  clearAllAlerts(): void {
    const allAlerts = Array.from(this.alerts.values());
    this.alerts.clear();
    allAlerts.forEach((alert) => this.emit('alert:cleared', alert));
  }

  // ===========================================================================
  // QUERIES
  // ===========================================================================

  /**
   * Obtiene todas las alertas activas
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter((alert) => !alert.dismissed)
      .sort((a, b) => {
        // Ordenar por severidad (critical primero) y luego por fecha
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  /**
   * Obtiene alertas por tipo
   */
  getAlertsByType(type: AlertType): Alert[] {
    return this.getActiveAlerts().filter((alert) => alert.type === type);
  }

  /**
   * Obtiene alertas por severidad
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return this.getActiveAlerts().filter((alert) => alert.severity === severity);
  }

  /**
   * Obtiene una alerta por ID
   */
  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Verifica si hay alertas críticas activas
   */
  hasCriticalAlerts(): boolean {
    return this.getActiveAlerts().some((alert) => alert.severity === 'critical');
  }

  /**
   * Obtiene el número total de alertas activas
   */
  getActiveAlertCount(): number {
    return this.getActiveAlerts().length;
  }

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  /**
   * Actualiza los umbrales de alerta
   */
  updateThresholds(thresholds: Partial<AlertThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    this.emit('config:updated', { thresholds: this.thresholds });
  }

  /**
   * Obtiene los umbrales actuales
   */
  getThresholds(): AlertThresholds {
    return { ...this.thresholds };
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  private findExistingAlert(
    type: AlertType,
    metadata?: Record<string, unknown>
  ): Alert | undefined {
    for (const alert of this.alerts.values()) {
      if (alert.type === type && !alert.dismissed) {
        // Para alertas de modelo, verificar si es el mismo modelo
        if (metadata?.modelId && alert.metadata?.modelId === metadata.modelId) {
          return alert;
        }
        // Para alertas de sistema, verificar si ya existe una similar
        if (
          type === 'high_error_rate' ||
          type === 'queue_backlog'
        ) {
          return alert;
        }
      }
    }
    return undefined;
  }

  private startCleanupTimer(intervalMs: number): void {
    this.cleanupInterval = setInterval(() => {
      this.clearResolvedAlerts();
    }, intervalMs);
  }

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.removeAllListeners();
    this.alerts.clear();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let globalAlertManager: AlertManager | null = null;

export function getAlertManager(config?: AlertConfig): AlertManager {
  if (!globalAlertManager) {
    globalAlertManager = new AlertManager(config);
  }
  return globalAlertManager;
}

export function resetAlertManager(): void {
  globalAlertManager?.dispose();
  globalAlertManager = null;
}

export default AlertManager;
