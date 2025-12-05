# Phase 1: Enhanced Oracle - Tasks

## Overview
Total tasks: 24
Estimated implementation: Database (0), Backend (20), Frontend (0), Testing (4)

---

## Backend Layer

### Core Infrastructure

- [ ] 1.1 Create types.ts with all Oracle TypeScript interfaces
- [ ] 1.2 Create OracleConfig interface with defaults and validation
- [ ] 1.3 Set up Oracle module directory structure in devfactory-distributed

### Context Loader

- [ ] 2.1 Implement ContextLoader class with constructor and file path resolution
- [ ] 2.2 Implement loadProductDocs() - load mission, roadmap, tech-stack
- [ ] 2.3 Implement loadSpecs() - load all spec directories with srd, specs, tasks
- [ ] 2.4 Implement caching with file modification time tracking
- [ ] 2.5 Implement refresh() - detect changed files and reload only those
- [ ] 2.6 Implement getSummary() - generate condensed context for API calls
- [ ] 2.7 Implement getTaskContext() - get detailed context for specific task

### Stuck Detector

- [ ] 3.1 Implement StuckDetector class with state manager integration
- [ ] 3.2 Implement detectExplicitStuck() - find workers with status="stuck"
- [ ] 3.3 Implement detectImplicitStuck() - find workers past threshold
- [ ] 3.4 Implement detectHeartbeatMissing() - find workers without updates
- [ ] 3.5 Implement classifyStuck() - analyze and classify stuck reason
- [ ] 3.6 Implement confidence scoring for stuck classification

### Intervention Engine

- [ ] 4.1 Implement InterventionEngine class with Claude client
- [ ] 4.2 Create prompts.ts with ORACLE_SYSTEM_PROMPT
- [ ] 4.3 Implement buildGuidancePrompt() function
- [ ] 4.4 Implement decideStrategy() - choose guidance/takeover/escalate
- [ ] 4.5 Implement provideGuidance() - generate and write guidance file
- [ ] 4.6 Implement parseGuidanceResponse() - extract structured data from Claude
- [ ] 4.7 Implement escalate() - handle human escalation cases

### Takeover Manager

- [ ] 5.1 Implement TakeoverManager class with concurrency control
- [ ] 5.2 Implement buildTakeoverPrompt() function
- [ ] 5.3 Implement takeover() - spawn subagent to complete task
- [ ] 5.4 Implement takeover state management (oracle_takeover status)
- [ ] 5.5 Implement takeover completion - update state and checkbox

### Intervention Tracker

- [ ] 6.1 Implement InterventionTracker class with file persistence
- [ ] 6.2 Implement record() - add new intervention with ID and timestamp
- [ ] 6.3 Implement updateOutcome() - mark intervention result
- [ ] 6.4 Implement getStats() - calculate success rate, avg time, etc.
- [ ] 6.5 Implement prune() - keep only last 100 interventions

### Main Oracle Class

- [ ] 7.1 Refactor existing oracle.ts to use new components
- [ ] 7.2 Implement start() with context loading and loop initialization
- [ ] 7.3 Implement check() - the main monitoring loop body
- [ ] 7.4 Implement stop() with cleanup
- [ ] 7.5 Implement getStatus() for CLI reporting
- [ ] 7.6 Implement manualIntervene() for CLI command

### CLI Commands

- [ ] 8.1 Update cli.ts to import enhanced Oracle
- [ ] 8.2 Implement `oracle start` command with --verbose flag
- [ ] 8.3 Implement `oracle stop` command
- [ ] 8.4 Implement `oracle status` command with formatted output
- [ ] 8.5 Implement `oracle intervene <task-id>` command
- [ ] 8.6 Implement `oracle history` command with --limit option

---

## Testing Layer

- [ ] 9.1 Create unit tests for ContextLoader
- [ ] 9.2 Create unit tests for StuckDetector classification
- [ ] 9.3 Create unit tests for InterventionTracker
- [ ] 9.4 Create integration test for full intervention flow

---

## Task Dependencies

```
1.1 → 1.2 → 1.3 (sequential - foundation)
       ↓
2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7 (Context Loader)
       ↓
3.1 → 3.2, 3.3, 3.4 (parallel) → 3.5 → 3.6 (Stuck Detector)
       ↓
4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7 (Intervention Engine)
       ↓
5.1 → 5.2 → 5.3 → 5.4 → 5.5 (Takeover Manager)
       ↓
6.1 → 6.2 → 6.3 → 6.4 → 6.5 (Tracker)
       ↓
7.1 → 7.2 → 7.3 → 7.4 → 7.5 → 7.6 (Main Class)
       ↓
8.1 → 8.2, 8.3, 8.4, 8.5, 8.6 (CLI - parallel after 8.1)
       ↓
9.1, 9.2, 9.3 (parallel) → 9.4 (Testing)
```

---

## Verification Criteria Per Task

### Types & Config (1.x)
- TypeScript compiles without errors
- Interfaces match SRD definitions

### Context Loader (2.x)
- Can load sample product docs
- Can load sample specs
- Caching prevents re-reads
- Summary fits in token limit

### Stuck Detector (3.x)
- Detects explicit stuck status
- Detects implicit stuck (timeout)
- Classification matches test cases

### Intervention Engine (4.x)
- Generates valid prompts
- Parses Claude responses correctly
- Writes guidance files in correct format

### Takeover Manager (5.x)
- Blocks concurrent takeovers
- Updates state correctly
- Handles timeout gracefully

### Tracker (6.x)
- Records persist to file
- Stats calculate correctly
- Pruning works at 100 limit

### Main Oracle (7.x)
- Starts and stops cleanly
- Loop executes at interval
- Status reports accurately

### CLI (8.x)
- Commands execute without error
- Output is formatted correctly
- Errors handled gracefully

### Tests (9.x)
- All tests pass
- Coverage > 80%

---

## Notes

- All backend tasks work in `~/.claude/plugins/devfactory-distributed/src/oracle/`
- No database or frontend tasks in this phase
- Testing tasks can run in parallel with late backend tasks
- Each task should take 15-30 minutes for a focused subagent
