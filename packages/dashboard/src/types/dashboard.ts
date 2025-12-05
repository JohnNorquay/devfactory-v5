/**
 * Core dashboard state interfaces for DevFactory v5 Factory Floor Dashboard
 */

/**
 * Main dashboard state containing all UI state
 */
export interface DashboardState {
  /** WebSocket connection status */
  connection: 'connected' | 'disconnected' | 'reconnecting';

  /** Overall progress across all specs */
  overall: OverallProgress;

  /** State of all specs being processed */
  specs: SpecUIState[];

  /** State of all workers by worker ID */
  workers: Record<string, WorkerUIState>;

  /** Oracle monitoring and intervention state */
  oracle: OracleUIState;

  /** Activity feed entries */
  activity: ActivityEntry[];

  /** Assembly line visualization state */
  assemblyLine: AssemblyLineState;
}

/**
 * Overall progress metrics across the entire build
 */
export interface OverallProgress {
  /** Total number of tasks across all specs */
  totalTasks: number;

  /** Number of completed tasks */
  completedTasks: number;

  /** Completion percentage (0-100) */
  percentage: number;

  /** Overall build status */
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';

  /** When the build started */
  startedAt?: Date;

  /** Estimated completion time */
  estimatedCompletion?: Date;
}

/**
 * UI state for a single spec being processed
 */
export interface SpecUIState {
  /** Unique spec identifier */
  id: string;

  /** Display name of the spec */
  name: string;

  /** Phase this spec belongs to */
  phase: string;

  /** Current status of the spec */
  status: 'queued' | 'active' | 'completed' | 'failed';

  /** Progress percentage (0-100) */
  progress: number;

  /** Total tasks in this spec */
  totalTasks: number;

  /** Number of completed tasks */
  completedTasks: number;

  /** Description of current task being executed */
  currentTask?: string;

  /** IDs of workers assigned to this spec */
  assignedWorkers: string[];

  /** Position on assembly line (for visualization) */
  position?: { x: number; y: number };
}

/**
 * UI state for a single worker
 */
export interface WorkerUIState {
  /** Unique worker identifier */
  id: string;

  /** Worker name (e.g., 'worker-1') */
  name: string;

  /** Human-friendly display name */
  displayName: string;

  /** Current worker status */
  status: 'idle' | 'working' | 'stuck' | 'offline';

  /** Description of current task */
  currentTask?: string;

  /** ID of spec being worked on */
  currentSpec?: string;

  /** Number of tasks completed by this worker */
  tasksCompleted: number;

  /** Timestamp of last activity */
  lastActivity?: Date;

  /** Duration in milliseconds worker has been stuck */
  stuckDuration?: number;
}

/**
 * Oracle monitoring and intervention state
 */
export interface OracleUIState {
  /** Current Oracle status */
  status: 'watching' | 'intervening' | 'idle';

  /** Number of interventions currently in progress */
  activeInterventions: number;

  /** Total interventions performed */
  totalInterventions: number;

  /** Recent intervention summaries */
  recentInterventions: InterventionSummary[];

  /** Last time Oracle checked system state */
  lastCheck?: Date;
}

/**
 * Summary of an Oracle intervention
 */
export interface InterventionSummary {
  /** Unique intervention identifier */
  id: string;

  /** Type of intervention performed */
  type: 'guidance' | 'takeover' | 'reassign' | 'skip';

  /** Worker being intervened on */
  targetWorker: string;

  /** Reason for intervention */
  reason: string;

  /** When intervention was created */
  createdAt: Date;

  /** Current status of intervention */
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

/**
 * Activity feed entry
 */
export interface ActivityEntry {
  /** Unique entry identifier */
  id: string;

  /** When the activity occurred */
  timestamp: Date;

  /** Type of activity */
  type: 'task_start' | 'task_complete' | 'error' | 'intervention' | 'spec_complete' | 'message';

  /** Activity message to display */
  message: string;

  /** Worker ID if activity relates to a worker */
  workerId?: string;

  /** Spec ID if activity relates to a spec */
  specId?: string;

  /** Severity level for styling */
  severity?: 'info' | 'warning' | 'error' | 'success';
}

/**
 * State of the assembly line visualization
 */
export interface AssemblyLineState {
  /** Work stations on the assembly line */
  stations: Station[];

  /** Active spec "cars" moving through the line */
  activeCars: SpecCar[];

  /** Connections between stations */
  connections: Connection[];
}

/**
 * A work station on the assembly line
 */
export interface Station {
  /** Unique station identifier */
  id: string;

  /** Type of work performed at this station */
  type: 'database' | 'backend' | 'frontend' | 'testing';

  /** Display name of the station */
  name: string;

  /** Current station status */
  status: 'idle' | 'active' | 'busy';

  /** Position in the SVG viewport */
  position: { x: number; y: number };

  /** Worker IDs assigned to this station */
  workersAssigned: string[];
}

/**
 * A spec "car" moving through the assembly line
 */
export interface SpecCar {
  /** ID of the spec this car represents */
  specId: string;

  /** Current position in the SVG viewport */
  position: { x: number; y: number };

  /** ID of station car is currently at */
  currentStation: string;

  /** Progress percentage through current station */
  progress: number;

  /** Current car status */
  status: 'moving' | 'at_station' | 'completed';
}

/**
 * Connection between two stations
 */
export interface Connection {
  /** Station ID this connection starts from */
  from: string;

  /** Station ID this connection goes to */
  to: string;

  /** Whether connection is currently active/in-use */
  active: boolean;
}
