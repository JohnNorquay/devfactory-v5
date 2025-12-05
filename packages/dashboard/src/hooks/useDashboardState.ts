/**
 * Dashboard State Management Hook
 * Manages the complete dashboard state with WebSocket integration
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  DashboardState,
  SpecUIState,
  WorkerUIState,
  ActivityEntry,
  InterventionSummary,
} from '../types/dashboard.js';
import { useWebSocket } from './useWebSocket.js';

const MAX_ACTIVITY_ENTRIES = 100;
const MAX_RECENT_INTERVENTIONS = 10;

const initialState: DashboardState = {
  connection: 'disconnected',
  overall: {
    totalTasks: 0,
    completedTasks: 0,
    percentage: 0,
    status: 'idle',
  },
  specs: [],
  workers: {},
  oracle: {
    status: 'idle',
    activeInterventions: 0,
    totalInterventions: 0,
    recentInterventions: [],
  },
  activity: [],
  assemblyLine: {
    stations: [],
    activeCars: [],
    connections: [],
  },
};

export interface UseDashboardStateReturn {
  state: DashboardState;
  isConnected: boolean;
  isReconnecting: boolean;
}

export function useDashboardState(wsUrl: string): UseDashboardStateReturn {
  const [state, setState] = useState<DashboardState>(initialState);
  const { isConnected, isReconnecting, lastEvent } = useWebSocket({
    url: wsUrl,
    autoConnect: true,
  });

  // Add activity log entry
  const addActivity = useCallback((entry: ActivityEntry) => {
    setState((prev) => ({
      ...prev,
      activity: [entry, ...prev.activity].slice(0, MAX_ACTIVITY_ENTRIES),
    }));
  }, []);

  // Calculate overall progress from specs
  const calculateOverallProgress = useCallback((specs: SpecUIState[]) => {
    if (specs.length === 0) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        percentage: 0,
        status: 'idle' as const,
      };
    }

    const totalTasks = specs.reduce((sum, spec) => sum + spec.totalTasks, 0);
    const completedTasks = specs.reduce((sum, spec) => sum + spec.completedTasks, 0);

    const hasError = specs.some((s) => s.status === 'failed');
    const allCompleted = specs.every((s) => s.status === 'completed');
    const anyActive = specs.some((s) => s.status === 'active');

    let status: 'idle' | 'running' | 'paused' | 'completed' | 'failed' = 'idle';
    if (hasError) status = 'failed';
    else if (allCompleted) status = 'completed';
    else if (anyActive) status = 'running';

    return {
      totalTasks,
      completedTasks,
      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      status,
    };
  }, []);

  // Handle WebSocket events
  useEffect(() => {
    if (!lastEvent) return;

    const event = lastEvent;

    switch (event.type) {
      case 'connection_status': {
        const payload = event.payload as { status: 'connected' | 'disconnected' };
        setState((prev) => ({
          ...prev,
          connection: payload.status,
        }));

        if (payload.status === 'connected') {
          addActivity({
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            type: 'message',
            message: 'Connected to DevFactory',
            severity: 'success',
          });
        }
        break;
      }

      case 'state_update': {
        const payload = event.payload as Partial<DashboardState>;
        setState((prev) => {
          const newState = { ...prev, ...payload };
          // Recalculate overall progress if specs were updated
          if (payload.specs) {
            newState.overall = calculateOverallProgress(payload.specs);
          }
          return newState;
        });
        break;
      }

      case 'task_started': {
        const payload = event.payload as { workerId: string; taskId: string; specId: string };

        // Update spec state
        setState((prev) => {
          const specs = prev.specs.map((spec) => {
            if (spec.id === payload.specId && spec.currentTask === undefined) {
              return {
                ...spec,
                currentTask: payload.taskId,
                status: 'active' as const,
              };
            }
            return spec;
          });

          return {
            ...prev,
            specs,
            overall: calculateOverallProgress(specs),
          };
        });

        // Add activity
        addActivity({
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          type: 'task_start',
          message: `Task started: ${payload.taskId}`,
          workerId: payload.workerId,
          specId: payload.specId,
          severity: 'info',
        });
        break;
      }

      case 'task_completed': {
        const payload = event.payload as {
          workerId: string;
          taskId: string;
          specId: string;
          success: boolean;
        };

        // Update spec state
        setState((prev) => {
          const specs = prev.specs.map((spec) => {
            if (spec.id === payload.specId) {
              const newCompletedTasks = spec.completedTasks + 1;
              const newProgress = Math.round((newCompletedTasks / spec.totalTasks) * 100);

              return {
                ...spec,
                completedTasks: newCompletedTasks,
                progress: newProgress,
                currentTask: undefined,
                status: newCompletedTasks >= spec.totalTasks ? ('completed' as const) : spec.status,
              };
            }
            return spec;
          });

          return {
            ...prev,
            specs,
            overall: calculateOverallProgress(specs),
          };
        });

        // Add activity
        addActivity({
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          type: 'task_complete',
          message: `Task ${payload.success ? 'completed' : 'failed'}: ${payload.taskId}`,
          workerId: payload.workerId,
          specId: payload.specId,
          severity: payload.success ? 'success' : 'error',
        });
        break;
      }

      case 'worker_status': {
        const payload = event.payload as { workerId: string; status: string };

        setState((prev) => ({
          ...prev,
          workers: {
            ...prev.workers,
            [payload.workerId]: {
              ...prev.workers[payload.workerId],
              status: payload.status as WorkerUIState['status'],
              lastActivity: new Date(),
            },
          },
        }));
        break;
      }

      case 'intervention': {
        const payload = event.payload as InterventionSummary;

        setState((prev) => ({
          ...prev,
          oracle: {
            ...prev.oracle,
            status: 'intervening',
            activeInterventions: prev.oracle.activeInterventions + 1,
            totalInterventions: prev.oracle.totalInterventions + 1,
            recentInterventions: [payload, ...prev.oracle.recentInterventions].slice(
              0,
              MAX_RECENT_INTERVENTIONS
            ),
            lastCheck: new Date(),
          },
        }));

        addActivity({
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          type: 'intervention',
          message: `Oracle intervention: ${payload.reason}`,
          workerId: payload.targetWorker,
          severity: 'warning',
        });
        break;
      }

      case 'activity': {
        const payload = event.payload as ActivityEntry;
        addActivity(payload);
        break;
      }

      case 'spec_progress': {
        const payload = event.payload as {
          specId: string;
          progress: number;
          completedTasks: number;
        };

        setState((prev) => {
          const specs = prev.specs.map((spec) =>
            spec.id === payload.specId
              ? {
                  ...spec,
                  progress: payload.progress,
                  completedTasks: payload.completedTasks,
                }
              : spec
          );

          return {
            ...prev,
            specs,
            overall: calculateOverallProgress(specs),
          };
        });
        break;
      }

      default:
        console.log('[Dashboard] Unhandled event type:', (event as { type: string }).type);
    }
  }, [lastEvent, addActivity, calculateOverallProgress]);

  // Update connection status based on WebSocket state
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      connection: isReconnecting ? 'reconnecting' : isConnected ? 'connected' : 'disconnected',
    }));
  }, [isConnected, isReconnecting]);

  return {
    state,
    isConnected,
    isReconnecting,
  };
}
