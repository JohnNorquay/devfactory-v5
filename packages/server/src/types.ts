// Dashboard state types
export interface DashboardState {
  status: 'idle' | 'planning' | 'building' | 'testing' | 'error';
  currentPhase: string;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  specs: SpecStatus[];
  workers: WorkerStatus[];
  metrics: BuildMetrics;
  logs: LogEntry[];
}

export interface SpecStatus {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  startTime?: number;
  endTime?: number;
  estimatedDuration?: number;
}

export interface WorkerStatus {
  id: string;
  name: string;
  status: 'idle' | 'busy' | 'error';
  currentTask?: string;
  tasksCompleted: number;
  startTime?: number;
}

export interface BuildMetrics {
  totalDuration?: number;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  filesModified: number;
  linesChanged: number;
}

export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  source?: string;
}

// Beast state file structure (from .devfactory directory)
export interface BeastState {
  sessionId: string;
  status: string;
  currentSpec?: string;
  specs: Array<{
    id: string;
    path: string;
    status: string;
    progress?: number;
  }>;
  startTime: number;
  endTime?: number;
  metrics?: Record<string, any>;
}
