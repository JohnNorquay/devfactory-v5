# Phase 1: Enhanced Oracle - Requirements

## Overview

The Oracle is an Opus 4.5 instance that watches over the entire DevFactory build process. Unlike the basic Oracle in v4.1 (which just provided generic guidance), the Enhanced Oracle:

1. **Knows Everything**: Loads complete project context (mission, roadmap, specs, tasks, dependencies)
2. **Understands Goals**: Can reason about WHY we're building what we're building
3. **Intervenes Intelligently**: Provides targeted help based on full context
4. **Can Take Over**: If guidance isn't enough, Oracle can complete tasks directly
5. **Learns**: Tracks all interventions for pattern recognition

---

## Functional Requirements

### FR-1: Full Context Loading

**Description**: Oracle loads and maintains awareness of the complete project context.

**Details**:
- Load on startup:
  - `.devfactory/product/mission.md`
  - `.devfactory/product/roadmap.md`
  - `.devfactory/product/tech-stack.md`
  - All specs from `.devfactory/specs/*/`
  - Current state from `.devfactory/beast/state.json`
- Refresh context when state.json changes
- Cache context efficiently (don't re-read unchanged files)

**Acceptance Criteria**:
- [ ] Oracle can summarize the project mission when asked
- [ ] Oracle knows all specs and their current status
- [ ] Oracle understands task dependencies
- [ ] Context refresh takes < 1 second

### FR-2: Intelligent Stuck Detection

**Description**: Detect when workers are stuck and classify the stuck state.

**Details**:
- Monitor state.json for worker status changes
- Stuck indicators:
  - Status is "stuck" (explicit)
  - Status is "in_progress" for > configurable threshold (implicit)
  - Status is "verifying" for > threshold with repeated failures
  - Worker heartbeat missing for > threshold
- Classify stuck reason:
  - Technical error (code issue)
  - Missing dependency (waiting on another task)
  - Environment issue (missing config, API key, etc.)
  - Unclear requirements (needs human input)
  - Infinite loop (same error repeating)

**Acceptance Criteria**:
- [ ] Detects explicit "stuck" status within 30 seconds
- [ ] Detects implicit stuck (timeout) within configured threshold + 30s
- [ ] Classifies stuck reason correctly in >80% of cases
- [ ] No false positives (healthy workers not flagged)

### FR-3: Context-Aware Intervention

**Description**: When a worker is stuck, provide targeted guidance using full project context.

**Details**:
- Gather intervention context:
  - Worker's current task details
  - Task's spec and requirements
  - Related tasks (dependencies, dependents)
  - Recent worker activity/output
  - Previous interventions for this task (if any)
- Generate guidance:
  - Analyze root cause
  - Propose specific solution
  - Include code snippets if needed
  - Determine if human escalation needed
- Deliver guidance:
  - Write to `.devfactory/oracle/guidance-{task-id}.md`
  - Update state.json with guidance status
  - Optionally send to worker via tmux

**Acceptance Criteria**:
- [ ] Guidance references relevant spec requirements
- [ ] Guidance includes specific file paths when applicable
- [ ] Code snippets are syntactically correct
- [ ] Escalation recommendations are appropriate

### FR-4: Direct Task Takeover

**Description**: Oracle can take over a task directly if guidance isn't sufficient.

**Details**:
- Takeover triggers:
  - Worker still stuck after 2 guidance attempts
  - Worker requests Oracle takeover
  - Task is critical and blocking others
- Takeover process:
  - Oracle spawns a subagent for the task
  - Subagent has full project context
  - Work is done in Oracle's session (visible in df-oracle tmux)
  - On completion, update state.json and tasks.md
- Safeguards:
  - Max concurrent takeovers: 1
  - Takeover timeout: 30 minutes
  - Escalate to human if takeover fails

**Acceptance Criteria**:
- [ ] Oracle can successfully complete simple stuck tasks
- [ ] Takeover doesn't interfere with other workers
- [ ] State is properly updated after takeover
- [ ] Failed takeovers escalate appropriately

### FR-5: Intervention Tracking

**Description**: Track all Oracle interventions for learning and debugging.

**Details**:
- Track per intervention:
  - Timestamp
  - Task ID
  - Worker
  - Stuck classification
  - Intervention type (guidance/takeover)
  - Guidance content (summarized)
  - Outcome (success/failure/escalated)
  - Time to resolution
- Storage:
  - `.devfactory/oracle/interventions.json`
  - Keep last 100 interventions
- Reporting:
  - `devfactory oracle-stats` command
  - Success rate, common issues, average resolution time

**Acceptance Criteria**:
- [ ] All interventions logged with required fields
- [ ] Stats command shows meaningful metrics
- [ ] Old interventions pruned automatically
- [ ] No PII or sensitive data logged

### FR-6: Oracle CLI Commands

**Description**: CLI commands for Oracle control and monitoring.

**Details**:
- `devfactory oracle start` - Start Oracle monitoring
- `devfactory oracle stop` - Stop Oracle monitoring
- `devfactory oracle status` - Show Oracle status and stats
- `devfactory oracle intervene <task-id>` - Manual intervention
- `devfactory oracle history` - Show recent interventions

**Acceptance Criteria**:
- [ ] All commands implemented and documented
- [ ] Commands handle errors gracefully
- [ ] Status shows real-time information

---

## Non-Functional Requirements

### NFR-1: Performance
- Context loading: < 5 seconds for project with 10 specs
- Stuck detection latency: < 30 seconds
- Guidance generation: < 60 seconds (depends on Claude API)

### NFR-2: Reliability
- Oracle should run continuously without crashing
- Graceful handling of API rate limits
- Recovery from temporary failures

### NFR-3: Observability
- Clear logging of all decisions
- Timestamps on all actions
- Error messages that explain what went wrong

### NFR-4: Security
- API key not logged
- No sensitive data in guidance files
- Proper file permissions on Oracle directory

---

## Integration Points

### With State Manager
- Read worker status
- Update guidance status
- Mark tasks as taken over

### With Orchestrator
- Coordinate on task assignment during takeover
- Report worker health issues

### With Dashboard (Phase 2)
- Send intervention events via WebSocket
- Provide Oracle status for display

### With Workers
- Write guidance files workers can read
- Optionally send direct messages via tmux

---

## Open Questions

1. **Tmux Communication**: Should Oracle send messages directly to worker tmux sessions, or only write guidance files?
   - *Proposed*: Start with files, add tmux messaging as enhancement

2. **Takeover Scope**: Should takeovers be limited to specific task types?
   - *Proposed*: No limits, but track success rate by type

3. **Human Escalation**: How should human escalation be surfaced?
   - *Proposed*: Write to guidance file with `ESCALATE: true`, dashboard shows alert

---

## Existing Code to Enhance

Located in: `~/.claude/plugins/devfactory-distributed/src/oracle/oracle.ts`

Current capabilities:
- Basic stuck detection (status = "stuck")
- Generic guidance generation
- Guidance file writing

What needs enhancement:
- Full context loading (currently minimal)
- Stuck classification (currently none)
- Intervention tracking (currently basic)
- Takeover capability (not implemented)
- CLI commands (start only)

---

*This spec defines what we need. The next step is creating the SRD and tasks.md.*
