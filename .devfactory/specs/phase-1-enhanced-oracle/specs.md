# Phase 1: Enhanced Oracle - Technical Specification

## Architecture Overview

The Enhanced Oracle is a TypeScript module that runs as a persistent process, monitoring DevFactory workers and providing intelligent intervention when they get stuck.

```
┌─────────────────────────────────────────────────────────────────┐
│                      ORACLE PROCESS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Context    │    │   Monitor    │    │ Intervention │      │
│  │   Loader     │───►│    Loop      │───►│   Engine     │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                   State Manager                       │      │
│  │              (with file locking)                      │      │
│  └──────────────────────────────────────────────────────┘      │
│                            │                                    │
└────────────────────────────│────────────────────────────────────┘
                             │
                             ▼
                      .devfactory/
                      ├── beast/state.json
                      ├── oracle/
                      │   ├── guidance-*.md
                      │   ├── interventions.json
                      │   └── oracle.log
                      └── product/ & specs/
```

---

## Module Structure

### File Organization

```
src/oracle/
├── index.ts              # Public API exports
├── oracle.ts             # Main Oracle class (enhance existing)
├── context-loader.ts     # NEW: Project context management
├── stuck-detector.ts     # NEW: Stuck detection and classification
├── intervention.ts       # NEW: Intervention engine
├── takeover.ts          # NEW: Task takeover logic
├── tracker.ts           # NEW: Intervention tracking
├── prompts.ts           # NEW: Claude prompt templates
└── types.ts             # NEW: TypeScript interfaces
```

---

## Detailed Component Specifications

### 1. Context Loader (`context-loader.ts`)

**Purpose**: Load and cache project context for Oracle reasoning.

```typescript
// Types
interface ProjectContext {
  mission: string;
  missionLite: string;      // Condensed for API calls
  roadmap: RoadmapEntry[];
  techStack: TechStackInfo;
  specs: SpecContext[];
  lastLoaded: Date;
}

interface SpecContext {
  name: string;
  path: string;
  status: 'planning' | 'in_progress' | 'complete';
  srd: string;              // Full SRD content
  tasks: TaskInfo[];
  dependencies: string[];
}

interface TaskInfo {
  id: string;
  title: string;
  layer: 'database' | 'backend' | 'frontend' | 'testing';
  status: 'pending' | 'in_progress' | 'complete' | 'stuck';
  assignedTo?: string;
}

// Class
class ContextLoader {
  private context: ProjectContext | null = null;
  private fileModTimes: Map<string, number> = new Map();

  constructor(private projectRoot: string) {}

  async load(): Promise<ProjectContext> {
    // Load all product docs
    // Load all specs
    // Build context object
    // Cache and return
  }

  async refresh(): Promise<boolean> {
    // Check file mod times
    // Only reload changed files
    // Return true if anything changed
  }

  getSummary(maxTokens: number = 4000): string {
    // Generate condensed context for API calls
    // Prioritize: current task, recent issues, mission
  }

  getTaskContext(taskId: string): TaskContext {
    // Get detailed context for a specific task
    // Include: spec, dependencies, related tasks
  }
}
```

### 2. Stuck Detector (`stuck-detector.ts`)

**Purpose**: Monitor workers and detect/classify stuck states.

```typescript
// Types
type StuckClassification =
  | 'technical_error'
  | 'missing_dependency'
  | 'environment_issue'
  | 'unclear_requirements'
  | 'infinite_loop';

interface StuckWorker {
  worker: string;
  taskId: string;
  classification: StuckClassification;
  confidence: number;        // 0-1
  evidence: string[];        // Why we think this
  detectedAt: Date;
  stuckDuration: number;     // ms
}

interface DetectorConfig {
  checkInterval: number;     // ms, default 60000
  implicitThreshold: number; // ms, default 300000
  heartbeatThreshold: number;// ms, default 600000
}

// Class
class StuckDetector {
  constructor(
    private stateManager: StateManager,
    private config: DetectorConfig
  ) {}

  async detectStuck(): Promise<StuckWorker[]> {
    // Read current state
    // Check each worker
    // Classify stuck workers
    // Return list
  }

  private classifyStuck(
    worker: WorkerState,
    task: TaskState,
    history: ActivityEntry[]
  ): StuckClassification {
    // Analyze error messages
    // Check for patterns
    // Return classification
  }

  private isImplicitlyStuck(worker: WorkerState): boolean {
    // Check time in current status
    // Compare to threshold
  }
}
```

### 3. Intervention Engine (`intervention.ts`)

**Purpose**: Generate and deliver context-aware interventions.

```typescript
// Types
interface InterventionRequest {
  worker: StuckWorker;
  context: ProjectContext;
  previousInterventions: InterventionRecord[];
}

interface InterventionResult {
  type: 'guidance' | 'takeover' | 'escalation';
  success: boolean;
  guidancePath?: string;
  error?: string;
}

interface GuidanceContent {
  rootCause: string;
  suggestedFix: string[];
  codeSnippets?: CodeSnippet[];
  escalate: boolean;
  escalateReason?: string;
}

// Class
class InterventionEngine {
  constructor(
    private claude: Anthropic,
    private contextLoader: ContextLoader,
    private tracker: InterventionTracker
  ) {}

  async intervene(request: InterventionRequest): Promise<InterventionResult> {
    // Decide strategy
    const strategy = this.decideStrategy(request);

    switch (strategy) {
      case 'guidance':
        return this.provideGuidance(request);
      case 'takeover':
        return this.attemptTakeover(request);
      case 'escalation':
        return this.escalate(request);
    }
  }

  private decideStrategy(request: InterventionRequest): string {
    // If unclear requirements -> escalate
    // If 2+ failed interventions -> takeover
    // Else -> guidance
  }

  private async provideGuidance(request: InterventionRequest): Promise<InterventionResult> {
    // Build prompt
    // Call Claude API
    // Parse response
    // Write guidance file
    // Update state
    // Track intervention
  }

  private async attemptTakeover(request: InterventionRequest): Promise<InterventionResult> {
    // Delegate to TakeoverManager
  }

  private async escalate(request: InterventionRequest): Promise<InterventionResult> {
    // Write escalation guidance
    // Mark task for human attention
    // Track intervention
  }
}
```

### 4. Takeover Manager (`takeover.ts`)

**Purpose**: Handle Oracle directly completing stuck tasks.

```typescript
// Types
interface TakeoverRequest {
  taskId: string;
  taskContext: TaskContext;
  reason: string;
}

interface TakeoverResult {
  success: boolean;
  filesChanged?: string[];
  error?: string;
  duration: number;
}

// Class
class TakeoverManager {
  private activeTakeover: string | null = null;

  constructor(
    private claude: Anthropic,
    private stateManager: StateManager,
    private contextLoader: ContextLoader
  ) {}

  async takeover(request: TakeoverRequest): Promise<TakeoverResult> {
    // Check no active takeover
    if (this.activeTakeover) {
      throw new Error('Another takeover is in progress');
    }

    this.activeTakeover = request.taskId;

    try {
      // Update state to oracle_takeover
      // Build comprehensive prompt
      // Spawn Claude to complete task
      // Monitor progress
      // On completion: update state, mark checkbox
      // Return result
    } finally {
      this.activeTakeover = null;
    }
  }

  private buildTakeoverPrompt(request: TakeoverRequest): string {
    // Include full task context
    // Include spec requirements
    // Include existing code context
    // Clear instructions for completion
  }
}
```

### 5. Intervention Tracker (`tracker.ts`)

**Purpose**: Track and report on all Oracle interventions.

```typescript
// Types (from SRD)
interface InterventionRecord {
  id: string;
  timestamp: string;
  taskId: string;
  worker: string;
  classification: StuckClassification;
  type: 'guidance' | 'takeover' | 'escalation';
  contextSummary: string;
  action: string;
  outcome: 'pending' | 'resolved' | 'failed' | 'escalated';
  resolutionTime?: number;
}

interface OracleStats {
  totalInterventions: number;
  successRate: number;
  avgResolutionTime: number;
  byClassification: Record<StuckClassification, number>;
  takeoverRate: number;
}

// Class
class InterventionTracker {
  private records: InterventionRecord[] = [];
  private filePath: string;

  constructor(projectRoot: string) {
    this.filePath = path.join(projectRoot, '.devfactory/oracle/interventions.json');
    this.load();
  }

  record(intervention: Omit<InterventionRecord, 'id' | 'timestamp'>): string {
    // Generate ID
    // Add timestamp
    // Append to records
    // Save to file
    // Prune if > 100
    // Return ID
  }

  updateOutcome(id: string, outcome: string, resolutionTime?: number): void {
    // Find record
    // Update outcome
    // Save
  }

  getStats(): OracleStats {
    // Calculate from records
  }

  getHistory(limit: number = 10): InterventionRecord[] {
    // Return most recent N
  }

  private load(): void {
    // Load from file if exists
  }

  private save(): void {
    // Write to file
  }

  private prune(): void {
    // Keep only last 100
  }
}
```

### 6. Prompts (`prompts.ts`)

**Purpose**: Claude prompt templates for consistent, effective interventions.

```typescript
export const ORACLE_SYSTEM_PROMPT = `You are The Oracle, the all-knowing overseer of the DevFactory development system.

## Your Role
You watch over distributed AI workers building software. When a worker gets stuck, you intervene with precise, context-aware guidance.

## What You Know
- The project's mission and goals
- All specifications being implemented
- Task dependencies and current progress
- What each worker is trying to accomplish

## How You Help
1. Analyze the root cause of the stuck state
2. Provide specific, actionable guidance
3. Include code snippets when helpful
4. Recommend escalation only when truly needed

## Response Format
Always structure your response as:

### Root Cause
[1-2 sentences explaining why the worker is stuck]

### Solution
[Numbered steps to resolve the issue]

### Code (if applicable)
\`\`\`[language]
[specific code to use]
\`\`\`

### Escalate
[true/false] - [reason if true]
`;

export function buildGuidancePrompt(
  context: string,
  task: TaskContext,
  stuckInfo: StuckWorker
): string {
  return `## Project Context
${context}

## Current Task
- ID: ${task.id}
- Title: ${task.title}
- Layer: ${task.layer}
- Spec: ${task.specName}

## Task Requirements
${task.requirements}

## Stuck Information
- Worker: ${stuckInfo.worker}
- Classification: ${stuckInfo.classification}
- Duration: ${Math.round(stuckInfo.stuckDuration / 1000 / 60)} minutes
- Evidence:
${stuckInfo.evidence.map(e => `  - ${e}`).join('\n')}

## Previous Attempts
${task.previousAttempts || 'None'}

---

Please analyze this situation and provide guidance to help the worker continue.`;
}

export function buildTakeoverPrompt(
  context: string,
  task: TaskContext
): string {
  return `## Mission
You are The Oracle, taking over a stuck task to complete it directly.

## Project Context
${context}

## Task to Complete
- ID: ${task.id}
- Title: ${task.title}
- Layer: ${task.layer}

## Requirements
${task.requirements}

## Current State
${task.currentState || 'Starting fresh'}

## Instructions
1. Implement this task completely
2. Follow the spec requirements exactly
3. Match existing code patterns in the project
4. When done, provide a summary of what you implemented

Do not ask questions. Complete the task based on the spec.`;
}
```

---

## Main Oracle Class Enhancement

The existing `oracle.ts` will be refactored to use these components:

```typescript
// oracle.ts (enhanced)
import { ContextLoader } from './context-loader';
import { StuckDetector } from './stuck-detector';
import { InterventionEngine } from './intervention';
import { InterventionTracker } from './tracker';

export class Oracle {
  private contextLoader: ContextLoader;
  private detector: StuckDetector;
  private engine: InterventionEngine;
  private tracker: InterventionTracker;
  private running: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(
    private projectRoot: string,
    private config: OracleConfig
  ) {
    // Initialize components
  }

  async start(): Promise<void> {
    console.log('🔮 Oracle awakening...');

    // Load initial context
    await this.contextLoader.load();

    // Start monitoring loop
    this.running = true;
    this.checkInterval = setInterval(
      () => this.check(),
      this.config.checkInterval
    );

    console.log('🔮 Oracle watching...');
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    console.log('🔮 Oracle resting...');
  }

  private async check(): Promise<void> {
    // Refresh context if needed
    await this.contextLoader.refresh();

    // Detect stuck workers
    const stuck = await this.detector.detectStuck();

    // Intervene for each
    for (const worker of stuck) {
      await this.engine.intervene({
        worker,
        context: this.contextLoader.getContext(),
        previousInterventions: this.tracker.getForTask(worker.taskId)
      });
    }
  }

  getStatus(): OracleStatus {
    return {
      running: this.running,
      uptime: this.getUptime(),
      context: this.contextLoader.getSummary(500),
      stats: this.tracker.getStats()
    };
  }

  async manualIntervene(taskId: string): Promise<InterventionResult> {
    // Get task context
    // Force intervention
  }
}
```

---

## Testing Strategy

### Unit Tests
- ContextLoader: Loading, caching, refresh detection
- StuckDetector: Classification accuracy
- InterventionTracker: Record/retrieve/prune
- Prompts: Output format validation

### Integration Tests
- Full intervention flow (stuck → guidance → resolved)
- Takeover flow (stuck → takeover → complete)
- State updates after intervention

### Mocks
- Mock Claude API responses for deterministic testing
- Mock StateManager for isolated testing
- Mock file system for context loading tests

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Claude API timeout | Retry with exponential backoff (max 3) |
| Claude API rate limit | Wait and retry after delay |
| State file locked | Wait and retry (max 5 attempts) |
| Context file missing | Log warning, use available context |
| Takeover timeout | Mark as failed, restore task to stuck |

---

## Configuration

```typescript
interface OracleConfig {
  // Timing
  checkInterval: number;        // Default: 60000 (1 min)
  implicitStuckThreshold: number; // Default: 300000 (5 min)
  heartbeatThreshold: number;   // Default: 600000 (10 min)
  takeoverTimeout: number;      // Default: 1800000 (30 min)

  // Limits
  maxInterventionsPerTask: number; // Default: 3
  maxConcurrentTakeovers: number;  // Default: 1
  maxInterventionHistory: number;  // Default: 100

  // API
  model: string;                // Default: claude-opus-4-5-20251101
  maxTokens: number;            // Default: 4096

  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logFile: string;              // Default: .devfactory/oracle/oracle.log
}
```

---

*This technical specification provides the implementation blueprint. Next: Task breakdown.*
