/**
 * useAIAlerts - React Hook para gestionar alertas del sistema de IA
 *
 * Proporciona acceso reactivo a las alertas del AlertManager:
 * - Lista de alertas activas
 * - Funciones para descartar/reconocer alertas
 * - Suscripción a nuevas alertas
 */

'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  AlertManager,
  Alert,
  AlertType,
  AlertSeverity,
  AlertListener,
  getAlertManager,
} from '@/infrastructure/ai/AlertManager';

// =============================================================================
// TYPES
// =============================================================================

interface UseAIAlertsOptions {
  /** Filtrar por tipo de alerta */
  filterByType?: AlertType[];
  /** Filtrar por severidad */
  filterBySeverity?: AlertSeverity[];
  /** Auto-limpiar alertas al desmontar */
  autoCleanup?: boolean;
}

interface UseAIAlertsReturn {
  /** Lista de alertas activas */
  alerts: Alert[];
  /** Número total de alertas activas */
  alertCount: number;
  /** Hay alertas críticas activas */
  hasCriticalAlerts: boolean;
  /** Descarta una alerta */
  dismissAlert: (alertId: string) => boolean;
  /** Reconoce una alerta */
  acknowledgeAlert: (alertId: string) => boolean;
  /** Suscribe a nuevas alertas con callback personalizado */
  subscribeToAlerts: (listener: AlertListener) => () => void;
  /** Limpia todas las alertas */
  clearAllAlerts: () => void;
  /** Limpia alertas por tipo */
  clearAlertsByType: (type: AlertType) => number;
  /** Obtiene alertas filtradas */
  getFilteredAlerts: (filters: { type?: AlertType; severity?: AlertSeverity }) => Alert[];
  /** Recarga manual de alertas */
  refreshAlerts: () => void;
}

// =============================================================================
// STORE FOR SYNC EXTERNAL STORE
// =============================================================================

let alertManagerInstance: AlertManager | null = null;
let storeListeners: Set<() => void> = new Set();

function getAlertManagerInstance(): AlertManager {
  if (!alertManagerInstance) {
    alertManagerInstance = getAlertManager();
  }
  return alertManagerInstance;
}

function subscribeToStore(listener: () => void): () => void {
  storeListeners.add(listener);
  return () => storeListeners.delete(listener);
}

function notifyStoreListeners(): void {
  storeListeners.forEach((l) => l());
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useAIAlerts(options: UseAIAlertsOptions = {}): UseAIAlertsReturn {
  const { filterByType, filterBySeverity, autoCleanup = false } = options;

  const alertManager = getAlertManagerInstance();
  const mountedRef = useRef(true);

  // State for alerts
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    let activeAlerts = alertManager.getActiveAlerts();

    // Apply initial filters
    if (filterByType && filterByType.length > 0) {
      activeAlerts = activeAlerts.filter((a) => filterByType.includes(a.type));
    }
    if (filterBySeverity && filterBySeverity.length > 0) {
      activeAlerts = activeAlerts.filter((a) => filterBySeverity.includes(a.severity));
    }

    return activeAlerts;
  });

  // Computed values
  const alertCount = alerts.length;
  const hasCriticalAlerts = alerts.some((a) => a.severity === 'critical');

  // Update alerts function
  const updateAlerts = useCallback(() => {
    if (!mountedRef.current) return;

    let activeAlerts = alertManager.getActiveAlerts();

    // Apply filters
    if (filterByType && filterByType.length > 0) {
      activeAlerts = activeAlerts.filter((a) => filterByType.includes(a.type));
    }
    if (filterBySeverity && filterBySeverity.length > 0) {
      activeAlerts = activeAlerts.filter((a) => filterBySeverity.includes(a.severity));
    }

    setAlerts(activeAlerts);
  }, [alertManager, filterByType, filterBySeverity]);

  // Subscribe to alert manager events
  useEffect(() => {
    mountedRef.current = true;

    // Handler for new alerts
    const handleNewAlert = (alert: Alert) => {
      // Check if alert passes filters
      if (filterByType && !filterByType.includes(alert.type)) return;
      if (filterBySeverity && !filterBySeverity.includes(alert.severity)) return;

      updateAlerts();
      notifyStoreListeners();
    };

    // Handler for updated/cleared alerts
    const handleAlertChanged = () => {
      updateAlerts();
      notifyStoreListeners();
    };

    // Subscribe to all alert events
    const unsubscribeNew = alertManager.subscribe(handleNewAlert);
    const unsubscribeAll = alertManager.subscribeToAll((event) => {
      if (event === 'updated' || event === 'cleared') {
        handleAlertChanged();
      }
    });

    // Initial load
    updateAlerts();

    return () => {
      mountedRef.current = false;
      unsubscribeNew();
      unsubscribeAll();
    };
  }, [alertManager, filterByType, filterBySeverity, updateAlerts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoCleanup) {
        alertManager.clearResolvedAlerts();
      }
    };
  }, [alertManager, autoCleanup]);

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  const dismissAlert = useCallback(
    (alertId: string): boolean => {
      const result = alertManager.dismissAlert(alertId);
      if (result) {
        updateAlerts();
        notifyStoreListeners();
      }
      return result;
    },
    [alertManager, updateAlerts]
  );

  const acknowledgeAlert = useCallback(
    (alertId: string): boolean => {
      const result = alertManager.acknowledgeAlert(alertId);
      if (result) {
        updateAlerts();
        notifyStoreListeners();
      }
      return result;
    },
    [alertManager, updateAlerts]
  );

  const subscribeToAlerts = useCallback(
    (listener: AlertListener): (() => void) => {
      // Wrap listener to also update our state
      const wrappedListener = (alert: Alert) => {
        listener(alert);
        updateAlerts();
      };
      return alertManager.subscribe(wrappedListener);
    },
    [alertManager, updateAlerts]
  );

  const clearAllAlerts = useCallback(() => {
    alertManager.clearAllAlerts();
    updateAlerts();
    notifyStoreListeners();
  }, [alertManager, updateAlerts]);

  const clearAlertsByType = useCallback(
    (type: AlertType): number => {
      const count = alertManager.clearAlertsByType(type);
      if (count > 0) {
        updateAlerts();
        notifyStoreListeners();
      }
      return count;
    },
    [alertManager, updateAlerts]
  );

  const getFilteredAlerts = useCallback(
    (filters: { type?: AlertType; severity?: AlertSeverity }): Alert[] => {
      let filtered = alertManager.getActiveAlerts();

      if (filters.type) {
        filtered = filtered.filter((a) => a.type === filters.type);
      }
      if (filters.severity) {
        filtered = filtered.filter((a) => a.severity === filters.severity);
      }

      return filtered;
    },
    [alertManager]
  );

  const refreshAlerts = useCallback(() => {
    updateAlerts();
  }, [updateAlerts]);

  return {
    alerts,
    alertCount,
    hasCriticalAlerts,
    dismissAlert,
    acknowledgeAlert,
    subscribeToAlerts,
    clearAllAlerts,
    clearAlertsByType,
    getFilteredAlerts,
    refreshAlerts,
  };
}

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

/**
 * Hook para obtener solo alertas críticas
 */
export function useCriticalAlerts(): {
  alerts: Alert[];
  count: number;
  dismissAlert: (alertId: string) => boolean;
} {
  const { alerts, dismissAlert } = useAIAlerts({ filterBySeverity: ['critical'] });

  return {
    alerts,
    count: alerts.length,
    dismissAlert,
  };
}

/**
 * Hook para obtener alertas de modelo
 */
export function useModelAlerts(): {
  alerts: Alert[];
  degradedModels: Alert[];
  unhealthyModels: Alert[];
  dismissAlert: (alertId: string) => boolean;
} {
  const { alerts, dismissAlert } = useAIAlerts({
    filterByType: ['model_degraded', 'model_unhealthy'],
  });

  return {
    alerts,
    degradedModels: alerts.filter((a) => a.type === 'model_degraded'),
    unhealthyModels: alerts.filter((a) => a.type === 'model_unhealthy'),
    dismissAlert,
  };
}

/**
 * Hook para suscripción en tiempo real (con useSyncExternalStore)
 */
export function useAIAlertsRealtime(options: UseAIAlertsOptions = {}): {
  alerts: Alert[];
  hasCriticalAlerts: boolean;
} {
  const { filterByType, filterBySeverity } = options;

  const alertManager = getAlertManagerInstance();

  const subscribe = useCallback(
    (callback: () => void) => {
      const unsubscribe = alertManager.subscribe((alert) => {
        // Check if alert passes filters before notifying
        if (filterByType && !filterByType.includes(alert.type)) return;
        if (filterBySeverity && !filterBySeverity.includes(alert.severity)) return;
        callback();
      });
      return unsubscribe;
    },
    [alertManager, filterByType, filterBySeverity]
  );

  const getSnapshot = useCallback(() => {
    let activeAlerts = alertManager.getActiveAlerts();

    if (filterByType && filterByType.length > 0) {
      activeAlerts = activeAlerts.filter((a) => filterByType.includes(a.type));
    }
    if (filterBySeverity && filterBySeverity.length > 0) {
      activeAlerts = activeAlerts.filter((a) => filterBySeverity.includes(a.severity));
    }

    return activeAlerts;
  }, [alertManager, filterByType, filterBySeverity]);

  const getServerSnapshot = useCallback(() => [], []);

  const alerts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hasCriticalAlerts = alerts.some((a) => a.severity === 'critical');

  return { alerts, hasCriticalAlerts };
}

/**
 * Hook simple para mostrar notificaciones de alertas
 */
export function useAIAlertNotifier(
  onNewAlert?: (alert: Alert) => void,
  onCriticalAlert?: (alert: Alert) => void
): void {
  const alertManager = getAlertManagerInstance();

  useEffect(() => {
    const unsubscribe = alertManager.subscribe((alert) => {
      onNewAlert?.(alert);
      if (alert.severity === 'critical') {
        onCriticalAlert?.(alert);
      }
    });

    return unsubscribe;
  }, [alertManager, onNewAlert, onCriticalAlert]);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useAIAlerts;
