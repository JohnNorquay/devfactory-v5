# Phase 1: Enhanced Oracle - Software Requirements Document

## 1. Overview

### 1.1 Purpose
The Enhanced Oracle transforms DevFactory's stuck-worker handling from basic guidance generation to intelligent, context-aware intervention that understands the full project mission and can take direct action when needed.

### 1.2 Scope
This phase enhances the existing Oracle module in `devfactory-distributed` with:
- Complete project context awareness
- Intelligent stuck classification
- Targeted intervention strategies
- Task takeover capability
- Comprehensive tracking and reporting

### 1.3 Definitions
- **Oracle**: An Opus 4.5 instance that monitors and assists stuck workers
- **Intervention**: Any Oracle action to help a stuck worker
- **Takeover**: Oracle directly completing a task instead of just advising
- **Guidance**: Written advice for a worker to read and act upon

---

## 2. User Stories

### US-1: As a non-developer product owner
**I want** the Oracle to understand my project's mission
**So that** it can make decisions aligned with what we're building

### US-2: As a DevFactory user
**I want** stuck workers to be automatically helped
**So that** builds don't stall waiting for my intervention

### US-3: As a developer debugging an issue
**I want** to see why the Oracle intervened and what it tried
**So that** I can understand what went wrong

### US-4: As a DevFactory orchestrator
**I want** the Oracle to take over tasks that keep failing
**So that** blocking tasks don't hold up the entire build

### US-5: As a product owner watching the build
**I want** to see Oracle activity in the dashboard
**So that** I know when and how it's helping

---

## 3. Functional Requirements

### 3.1 Context Management

#### 3.1.1 Context Loading
The Oracle SHALL load the following on startup:
- Product documents (mission.md, roadmap.md, tech-stack.md)
- All spec documents (srd.md, specs.md, tasks.md per spec)
- Orchestration files (orchestration.yml per spec)
- Current state (state.json)

#### 3.1.2 Context Caching
The Oracle SHALL:
- Cache loaded context in memory
- Track file modification times
- Only reload files that have changed
- Provide `getContext()` API for other components

#### 3.1.3 Context Summary
The Oracle SHALL generate a condensed context summary (~4000 tokens) for API calls, including:
- Project mission (1 paragraph)
- Current specs and their status
- Task currently being worked on by each worker
- Recent issues and interventions

### 3.2 Stuck Detection

#### 3.2.1 Detection Sources
The Oracle SHALL detect stuck workers from:
- Explicit status: `worker.status === "stuck"`
- Implicit timeout: `worker.status === "in_progress"` for > threshold
- Verification loop: > 2 consecutive verification failures
- Heartbeat missing: No state update from worker for > threshold

#### 3.2.2 Stuck Classification
The Oracle SHALL classify stuck states as one of:
| Classification | Indicators | Default Action |
|----------------|------------|----------------|
| `technical_error` | Error message present, code-related | Provide fix guidance |
| `missing_dependency` | Waiting on blocked task | Notify and wait |
| `environment_issue` | Missing env var, config, package | Provide setup guidance |
| `unclear_requirements` | Spec ambiguity, missing detail | Escalate to human |
| `infinite_loop` | Same error 3+ times | Takeover or escalate |

#### 3.2.3 Detection Timing
- Check interval: Configurable, default 60 seconds
- Stuck threshold (implicit): Configurable, default 5 minutes
- Heartbeat threshold: Configurable, default 10 minutes

### 3.3 Intervention System

#### 3.3.1 Intervention Decision
The Oracle SHALL decide intervention strategy based on:
```
IF stuck_classification == unclear_requirements:
  escalate_to_human()
ELIF previous_interventions >= 2 AND !resolved:
  attempt_takeover()
ELSE:
  provide_guidance()
```

#### 3.3.2 Guidance Generation
The Oracle SHALL generate guidance by:
1. Loading full context summary
2. Adding specific task details
3. Adding error/stuck information
4. Calling Claude API with structured prompt
5. Parsing response for:
   - Root cause analysis
   - Suggested fix steps
   - Code snippets (if applicable)
   - Escalation recommendation

#### 3.3.3 Guidance Delivery
The Oracle SHALL deliver guidance by:
1. Writing to `.devfactory/oracle/guidance-{task-id}.md`
2. Updating state.json: `oracle_guidance[task_id] = { path, timestamp, escalate }`
3. Logging the intervention

#### 3.3.4 Task Takeover
The Oracle SHALL implement takeover by:
1. Marking task as `status: "oracle_takeover"` in state.json
2. Spawning a Claude subagent with full context
3. Directing subagent to complete the task
4. On success: Update state to complete, mark checkbox
5. On failure: Mark as stuck with escalation flag

### 3.4 Tracking and Reporting

#### 3.4.1 Intervention Record
Each intervention SHALL be recorded with:
```typescript
interface InterventionRecord {
  id: string;                    // UUID
  timestamp: string;             // ISO 8601
  taskId: string;
  worker: string;
  classification: StuckClassification;
  type: 'guidance' | 'takeover' | 'escalation';
  contextSummary: string;        // What Oracle knew
  action: string;                // What Oracle did
  outcome: 'pending' | 'resolved' | 'failed' | 'escalated';
  resolutionTime?: number;       // ms from intervention to resolution
}
```

#### 3.4.2 Storage
- File: `.devfactory/oracle/interventions.json`
- Format: Array of InterventionRecord
- Retention: Last 100 interventions
- Pruning: On startup, remove oldest beyond 100

#### 3.4.3 Statistics
The Oracle SHALL calculate and expose:
- Total interventions (current session)
- Success rate (resolved / (resolved + failed))
- Average resolution time
- Most common stuck classifications
- Takeover rate

### 3.5 CLI Commands

#### 3.5.1 `devfactory oracle start [--verbose]`
Start Oracle monitoring in foreground or background.

#### 3.5.2 `devfactory oracle stop`
Stop running Oracle process.

#### 3.5.3 `devfactory oracle status`
Display:
- Oracle running state
- Uptime
- Workers being monitored
- Recent interventions (last 5)
- Current statistics

#### 3.5.4 `devfactory oracle intervene <task-id>`
Manually trigger Oracle intervention for a specific task.

#### 3.5.5 `devfactory oracle history [--limit N]`
Display intervention history, default last 10.

---

## 4. Non-Functional Requirements

### 4.1 Performance
| Metric | Requirement |
|--------|-------------|
| Startup time | < 5 seconds |
| Context reload | < 1 second |
| Stuck detection latency | < 30 seconds after state change |
| Guidance generation | < 90 seconds (API dependent) |

### 4.2 Reliability
- Oracle process SHALL restart automatically on crash
- Oracle SHALL handle Claude API rate limits gracefully (exponential backoff)
- Oracle SHALL continue monitoring if guidance generation fails

### 4.3 Observability
- All decisions SHALL be logged with timestamps
- Log levels: DEBUG, INFO, WARN, ERROR
- Logs written to `.devfactory/oracle/oracle.log`

### 4.4 Security
- API key read from environment only
- No secrets in guidance files
- Guidance files readable by owner only (chmod 600)

---

## 5. Data Requirements

### 5.1 Input Data
- state.json (worker status, tasks, activity)
- Product documents (mission, roadmap, tech-stack)
- Spec documents (srd, specs, tasks, orchestration)

### 5.2 Output Data
- guidance-{task-id}.md files
- interventions.json
- oracle.log
- State updates to state.json

### 5.3 Data Flow
```
state.json ─────────────► Oracle
                              │
Product Docs ───────────► Context ─► Claude API ─► Guidance
                              │                        │
Spec Docs ──────────────►     │                        │
                              │                        ▼
                              └──► state.json ◄── guidance-*.md
                                       │
                                       ▼
                              interventions.json
```

---

## 6. API Requirements

### 6.1 Internal APIs

#### OracleContext
```typescript
interface OracleContext {
  mission: string;
  roadmap: string;
  techStack: string;
  specs: SpecSummary[];
  currentState: BeastState;
  recentActivity: ActivityEntry[];
}
```

#### OracleService
```typescript
interface OracleService {
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): OracleStatus;
  intervene(taskId: string): Promise<InterventionResult>;
  getHistory(limit?: number): InterventionRecord[];
  getStats(): OracleStats;
}
```

### 6.2 Claude API Usage
- Model: `claude-opus-4-5-20251101`
- Max tokens: 4096
- System prompt: Oracle persona + context summary
- User prompt: Specific stuck situation

---

## 7. Dependencies

### 7.1 External Dependencies
- `@anthropic-ai/sdk` - Claude API client
- Node.js fs/path - File operations
- `proper-lockfile` - State file locking

### 7.2 Internal Dependencies
- StateManager - Read/update state.json
- Existing Oracle module - Base to enhance

---

## 8. Out of Scope

- Dashboard integration (Phase 2)
- Browser verification (Phase 3)
- Machine learning on interventions (Future)
- Multi-project Oracle (Future)

---

## 9. Acceptance Criteria

### Phase 1 Complete When:
- [ ] Oracle loads full project context on startup
- [ ] Oracle detects stuck workers within 2 minutes
- [ ] Oracle classifies stuck reasons correctly
- [ ] Oracle provides context-aware guidance
- [ ] Oracle can take over stuck tasks
- [ ] All interventions are tracked
- [ ] CLI commands work as specified
- [ ] Tests pass with >80% coverage

---

*This SRD defines the complete requirements. Next: Technical specifications and task breakdown.*
