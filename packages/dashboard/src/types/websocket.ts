/**
 * WebSocket event types for DevFactory v5 Factory Floor Dashboard
 */

import type {
  DashboardState,
  ActivityEntry,
  InterventionSummary
} from './dashboard';

/**
 * WebSocket events sent from server to client
 */
export type WebSocketEvent =
  | StateUpdateEvent
  | TaskStartedEvent
  | TaskCompletedEvent
  | WorkerStatusEvent
  | InterventionEvent
  | ActivityEvent
  | SpecProgressEvent
  | ConnectionStatusEvent;

/**
 * Full or partial dashboard state update
 */
interface StateUpdateEvent {
  type: 'state_update';
  payload: Partial<DashboardState>;
}

/**
 * A worker started a new task
 */
interface TaskStartedEvent {
  type: 'task_started';
  payload: {
    /** Worker starting the task */
    workerId: string;
    /** Task identifier */
    taskId: string;
    /** Spec the task belongs to */
    specId: string;
  };
}

/**
 * A task was completed (successfully or not)
 */
interface TaskCompletedEvent {
  type: 'task_completed';
  payload: {
    /** Worker that completed the task */
    workerId: string;
    /** Task identifier */
    taskId: string;
    /** Spec the task belongs to */
    specId: string;
    /** Whether task completed successfully */
    success: boolean;
  };
}

/**
 * Worker status changed
 */
interface WorkerStatusEvent {
  type: 'worker_status';
  payload: {
    /** Worker whose status changed */
    workerId: string;
    /** New status */
    status: string;
  };
}

/**
 * Oracle performed an intervention
 */
interface InterventionEvent {
  type: 'intervention';
  payload: InterventionSummary;
}

/**
 * New activity feed entry
 */
interface ActivityEvent {
  type: 'activity';
  payload: ActivityEntry;
}

/**
 * Spec progress updated
 */
interface SpecProgressEvent {
  type: 'spec_progress';
  payload: {
    /** Spec identifier */
    specId: string;
    /** New progress percentage */
    progress: number;
    /** New completed task count */
    completedTasks: number;
  };
}

/**
 * WebSocket connection status changed
 */
interface ConnectionStatusEvent {
  type: 'connection_status';
  payload: {
    /** New connection status */
    status: 'connected' | 'disconnected';
  };
}
