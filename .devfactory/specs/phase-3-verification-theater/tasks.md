# Phase 3: Verification Theater - Tasks

## Overview
Total tasks: 28
Layers: Database (0), Backend (14), Frontend (10), Testing (4)

---

## Backend Layer

### Playwright Infrastructure

- [ ] 1.1 Create packages/theater directory with TypeScript setup
- [ ] 1.2 Install Playwright and configure for headed mode
- [ ] 1.3 Create BrowserManager class (launch, close, recover)
- [ ] 1.4 Implement screenshot capture with base64 encoding
- [ ] 1.5 Create WebSocket stream for screenshots (2-5 fps)

### Test Scenario System

- [ ] 2.1 Define TestScenario and TestStep TypeScript interfaces
- [ ] 2.2 Create ScenarioLoader - load from JSON files
- [ ] 2.3 Create ScenarioGenerator - generate from spec acceptance criteria
- [ ] 2.4 Create ScenarioRunner - execute steps with Playwright
- [ ] 2.5 Implement step action handlers (navigate, click, type, wait, assert)

### Verification Orchestrator

- [ ] 3.1 Create VerificationOrchestrator class
- [ ] 3.2 Implement scenario prioritization (critical first)
- [ ] 3.3 Implement verification loop (run → check → fix → retry)
- [ ] 3.4 Create verification state management
- [ ] 3.5 Add WebSocket events for verification status

### Browser Explorer Agent

- [ ] 4.1 Create BrowserExplorer agent definition
- [ ] 4.2 Implement page context analysis (understand current page)
- [ ] 4.3 Implement element finder (by text, role, selector)
- [ ] 4.4 Create exploratory mode (click through app)

### Issue Detection & Fixing

- [ ] 5.1 Create IssueDetector - analyze page state for problems
- [ ] 5.2 Implement console error capture and classification
- [ ] 5.3 Implement network error detection (4xx, 5xx responses)
- [ ] 5.4 Create FixEngine - spawn fix subagent with context
- [ ] 5.5 Implement fix retry logic (max 3 attempts)

### Thought Stream

- [ ] 6.1 Create ThoughtStream class
- [ ] 6.2 Implement thought formatting (emoji + timestamp + message)
- [ ] 6.3 Add WebSocket emission for thoughts
- [ ] 6.4 Create thought log persistence

---

## Frontend Layer

### Theater UI

- [ ] 7.1 Create Theater page component
- [ ] 7.2 Create BrowserView component (screenshot display)
- [ ] 7.3 Implement cursor overlay on browser view
- [ ] 7.4 Create ScenarioSteps component (checklist)
- [ ] 7.5 Create ThoughtStreamPanel component
- [ ] 7.6 Create StatusBar component (current action, issues)

### Integration

- [ ] 8.1 Add "Open Theater" button to Factory Floor dashboard
- [ ] 8.2 Create TheaterMiniStatus component for dashboard
- [ ] 8.3 Connect Theater to WebSocket for live updates
- [ ] 8.4 Implement theater open/close coordination with dashboard

---

## Testing Layer

- [ ] 9.1 Create unit tests for ScenarioRunner
- [ ] 9.2 Create unit tests for IssueDetector
- [ ] 9.3 Create integration test for full verification flow (mock browser)
- [ ] 9.4 Create E2E test for Theater UI

---

## Task Dependencies

```
Backend:
1.1 → 1.2 → 1.3 → 1.4 → 1.5 (Playwright setup)
     ↓
2.1 → 2.2 → 2.3 → 2.4 → 2.5 (Scenarios, parallel with 1.x after 1.2)
     ↓
3.1 → 3.2 → 3.3 → 3.4 → 3.5 (Orchestrator, after 2.4)
     ↓
4.1 → 4.2 → 4.3 → 4.4 (Explorer, after 1.3)
     ↓
5.1 → 5.2 → 5.3 → 5.4 → 5.5 (Issues, after 4.2)
     ↓
6.1 → 6.2 → 6.3 → 6.4 (Thoughts, can start after 3.1)

Frontend (requires Phase 2 dashboard):
7.1 → 7.2 → 7.3 → 7.4 → 7.5 → 7.6 (Theater UI)
     ↓
8.1 → 8.2 → 8.3 → 8.4 (Integration)

Testing (after implementation):
9.1, 9.2 (parallel) → 9.3 → 9.4
```

---

## Verification Criteria Per Task

### Playwright (1.x)
- Browser launches in headed mode
- Screenshots capture correctly
- Stream delivers 2+ fps

### Scenarios (2.x)
- Scenarios load from JSON
- Steps execute in Playwright
- Results capture pass/fail

### Orchestrator (3.x)
- Runs scenarios in priority order
- Triggers fix on failure
- Retries work correctly

### Explorer (4.x)
- Can analyze page context
- Finds elements reliably
- Exploratory mode navigates successfully

### Issues (5.x)
- Console errors captured
- Network errors detected
- Fixes spawn correctly

### Thoughts (6.x)
- Thoughts format correctly
- Stream to UI works
- Persisted to log

### Theater UI (7.x)
- Browser view renders screenshots
- Steps update in real-time
- Thoughts display correctly

### Integration (8.x)
- Button opens theater
- Mini status works
- WebSocket stable

### Tests (9.x)
- All pass
- Good coverage

---

## Notes

- This phase depends on Phase 2 dashboard being complete
- Playwright headed mode may not work in all environments (CI needs Xvfb)
- Screenshot streaming is the simplest approach for browser view
- VNC streaming is an enhancement if screenshot fps is too low
