export interface OracleContext {
  product: ProductContext;
  specs: SpecContext[];
  workers: WorkerContext[];
  currentState: BeastState;
}

export interface ProductContext {
  mission: string;
  techStack: string[];
  patterns: string[];
}

export interface SpecContext {
  id: string;
  name: string;
  phase: string;
  tasks: TaskContext[];
  acceptanceCriteria: string[];
}

export interface TaskContext {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignedWorker?: string;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
  lastError?: string;
}

export interface WorkerContext {
  id: string;
  name: string;
  status: 'idle' | 'working' | 'stuck' | 'offline';
  currentTask?: string;
  recentActivity: ActivityEntry[];
  stuckDuration?: number;
}

export interface ActivityEntry {
  timestamp: Date;
  type: 'task_start' | 'task_complete' | 'error' | 'intervention' | 'message';
  message: string;
  metadata?: Record<string, unknown>;
}

export interface BeastState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  activeSpec?: string;
  startedAt?: Date;
  totalTasks: number;
  completedTasks: number;
}

export interface StuckIndicator {
  workerId: string;
  taskId: string;
  reason: 'no_progress' | 'repeated_errors' | 'timeout' | 'explicit_stuck';
  duration: number;
  errorPattern?: string;
  confidence: number;
}

export interface Intervention {
  id: string;
  type: 'guidance' | 'takeover' | 'reassign' | 'skip';
  targetWorker: string;
  targetTask: string;
  reason: string;
  prompt?: string;
  createdAt: Date;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: string;
}
