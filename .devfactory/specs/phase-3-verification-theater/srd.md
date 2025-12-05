# Phase 3: Verification Theater - Software Requirements Document

## 1. Overview

### 1.1 Purpose
Create the "wow" moment - a visible browser where you watch Opus 4.5 click through your application, finding issues, fixing them, and verifying the fixes. Like watching quality control at the end of the assembly line.

### 1.2 Vision
```
┌─────────────────────────────────────────────────────────────┐
│  🎭 VERIFICATION THEATER - Auth Spec         [Recording]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │              [LIVE BROWSER VIEW]                    │   │
│  │                                                     │   │
│  │     🖱️ Opus is clicking "Login" button...          │   │
│  │                                                     │   │
│  │              ┌──────────────────┐                   │   │
│  │              │    Login Form    │                   │   │
│  │              │  ┌────────────┐  │                   │   │
│  │              │  │ [email]    │  │                   │   │
│  │              │  └────────────┘  │                   │   │
│  │              │  ┌────────────┐  │                   │   │
│  │              │  │ [password] │  │                   │   │
│  │              │  └────────────┘  │                   │   │
│  │              │  [  Login  ] ←── 🖱️                  │   │
│  │              └──────────────────┘                   │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  SCENARIO: User Login Flow                    [3/7 steps]   │
│  ├── ✓ Navigate to /login                                   │
│  ├── ✓ Enter email                                          │
│  ├── ✓ Enter password                                       │
│  ├── ● Click submit  ←── CURRENT                            │
│  ├── ○ Verify redirect to /dashboard                        │
│  ├── ○ Check welcome message                                │
│  └── ○ Verify user data loaded                              │
│                                                             │
│  OPUS THOUGHTS ─────────────────────────────────────────    │
│  "Clicking the login button. Expecting a redirect to        │
│   /dashboard within 2 seconds. Will verify the welcome      │
│   message contains the user's name."                        │
│                                                             │
│  ❌ ISSUE DETECTED: 401 Unauthorized                        │
│  🔧 ANALYZING: Checking auth endpoint...                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Scope
This phase adds:
- Headed Playwright browser (visible, not headless)
- Verification orchestrator agent
- Browser explorer agent for clicking
- Thought stream showing Opus's reasoning
- Issue detection → fix → verify loop
- Theater UI integrated with Factory Floor

---

## 2. User Stories

### US-1: As a product owner
**I want** to watch AI test my application
**So that** I can see it actually works from a user's perspective

### US-2: As a non-developer
**I want** to see the browser clicking through screens
**So that** I understand what's being verified

### US-3: As someone watching verification
**I want** to see what the AI is thinking
**So that** I understand its decision-making

### US-4: As a user who sees an issue detected
**I want** to watch the AI fix it
**So that** I can see the problem-solving process

### US-5: As a user wanting details
**I want** to see the full test scenario
**So that** I know what's being tested and what's left

---

## 3. Functional Requirements

### 3.1 Headed Browser

#### 3.1.1 Browser Launch
The system SHALL:
- Launch Chromium in headed (visible) mode
- Position browser window at specified coordinates
- Size browser window appropriately (1280x800 default)
- Keep browser visible throughout verification

#### 3.1.2 Browser Display
Options for displaying the browser:
- Direct: Open actual browser window on user's desktop
- VNC: Stream via VNC for remote/dashboard viewing
- Screenshots: Rapid screenshots displayed in UI

#### 3.1.3 Browser Control
The system SHALL:
- Navigate to URLs
- Click elements (by selector, text, position)
- Type into inputs
- Wait for elements/navigation
- Handle popups and dialogs
- Take screenshots at key moments

### 3.2 Test Scenario System

#### 3.2.1 Scenario Structure
```typescript
interface TestScenario {
  id: string;
  name: string;
  description: string;
  spec: string;  // Which spec this verifies
  priority: 'critical' | 'high' | 'medium' | 'low';
  preconditions: string[];
  steps: TestStep[];
  postconditions: string[];
}

interface TestStep {
  id: string;
  action: 'navigate' | 'click' | 'type' | 'wait' | 'assert' | 'screenshot';
  target?: string;  // Selector or URL
  value?: string;   // Text to type or assertion
  description: string;
  timeout?: number;
}
```

#### 3.2.2 Scenario Generation
The system SHALL:
- Generate scenarios from spec acceptance criteria
- Allow manual scenario definition
- Support scenario templates for common flows

#### 3.2.3 Scenario Execution
The system SHALL:
- Execute steps sequentially
- Wait for each step to complete
- Capture result (pass/fail) for each step
- Stop on first failure (for debugging)
- Continue to completion (for full report)

### 3.3 Verification Orchestrator

#### 3.3.1 Orchestrator Responsibilities
- Load test scenarios for completed specs
- Prioritize scenarios (critical first)
- Launch browser and scenario runner
- Monitor progress
- Handle failures (trigger fix, retry)
- Report results

#### 3.3.2 Verification Trigger
Verification starts when:
- A spec with UI components is marked complete
- Manual trigger via command/dashboard
- All specs complete (final verification)

#### 3.3.3 Verification Loop
```
FOR each scenario:
  1. Run scenario
  2. IF pass: Record success, continue
  3. IF fail:
     a. Capture error details
     b. Spawn fix agent
     c. Wait for fix
     d. Retry scenario (max 3 times)
  4. IF still failing: Mark as needs-human, continue
```

### 3.4 Browser Explorer Agent

#### 3.4.1 Agent Capabilities
The explorer agent SHALL:
- Understand page context (what it's looking at)
- Execute test steps
- Identify elements to interact with
- Recognize errors and unexpected states
- Take intelligent screenshots

#### 3.4.2 Exploratory Mode
Beyond scripted tests:
- Click through navigation
- Check all links work
- Verify responsive behavior
- Find obvious UI bugs

#### 3.4.3 Error Recognition
The agent SHALL detect:
- Console errors
- Network errors (4xx, 5xx)
- Visual regressions (if baseline exists)
- Missing elements
- Unexpected text/state

### 3.5 Issue Detection & Fixing

#### 3.5.1 Issue Classification
```typescript
type IssueType =
  | 'console_error'      // JS error in console
  | 'network_error'      // API returned error
  | 'element_missing'    // Expected element not found
  | 'assertion_failed'   // Value didn't match expected
  | 'timeout'            // Action didn't complete
  | 'visual_regression'; // UI looks wrong
```

#### 3.5.2 Fix Process
1. Classify issue
2. Gather context (console logs, network, DOM state)
3. Analyze with Claude (determine root cause)
4. Implement fix (modify source code)
5. Restart relevant server if needed
6. Retry verification

#### 3.5.3 Fix Limits
- Max 3 fix attempts per scenario
- Max 30 minutes per fix
- Escalate if fix not working

### 3.6 Thought Stream

#### 3.6.1 What is Displayed
Show Opus's reasoning:
- What it's about to do
- What it expects to happen
- What it observes
- Decisions being made

#### 3.6.2 Format
```
[10:45:23] 🧠 Looking for login form at /login
[10:45:24] 👁️ Found form with email and password fields
[10:45:25] ⌨️ Typing test@example.com into email field
[10:45:26] ⌨️ Typing password into password field
[10:45:27] 🖱️ Clicking "Login" button
[10:45:28] ⏳ Waiting for redirect to /dashboard...
[10:45:30] ❌ Unexpected: Got 401 Unauthorized
[10:45:31] 🔍 Analyzing: Checking auth endpoint response...
```

#### 3.6.3 Integration
- Stream to Theater UI via WebSocket
- Store in verification log
- Include in final report

### 3.7 Theater UI

#### 3.7.1 Layout
```
┌────────────────────────────────────────────────────────────┐
│  Theater Header: Spec Name + Recording Status              │
├─────────────────────────────────────────────┬──────────────┤
│                                             │   Scenario   │
│          Browser View                       │    Steps     │
│          (screenshot stream)                │   Checklist  │
│                                             │              │
├─────────────────────────────────────────────┴──────────────┤
│                   Thought Stream                            │
├────────────────────────────────────────────────────────────┤
│  Status Bar: Current Action + Issue Status (if any)        │
└────────────────────────────────────────────────────────────┘
```

#### 3.7.2 Browser View
- Real-time screenshot stream (2-5 fps)
- Cursor position overlay
- Highlight on clicked elements
- Full-size on click

#### 3.7.3 Integration with Factory Floor
- "Open Theater" button in dashboard
- Mini status in Factory Floor
- Notification on issues detected

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Screenshot capture: < 100ms
- Stream latency: < 500ms
- Step execution: No artificial slowdown

### 4.2 Reliability
- Browser crash recovery
- Fix timeout handling
- Graceful degradation if verification unavailable

### 4.3 Recording
- Option to record verification session
- Video output (mp4/webm)
- Screenshots at each step

---

## 5. Technical Requirements

### 5.1 Playwright Configuration
```typescript
const browser = await chromium.launch({
  headless: false,        // Visible!
  slowMo: 100,           // Slight slowdown for visibility
  args: [
    '--window-position=100,100',
    '--window-size=1280,800'
  ]
});
```

### 5.2 Screenshot Streaming
- Use Playwright's screenshot API
- Base64 encode for WebSocket transmission
- Client displays as updating image
- 2-5 frames per second

### 5.3 State Tracking
```typescript
interface VerificationState {
  status: 'idle' | 'running' | 'fixing' | 'complete';
  currentScenario: string | null;
  currentStep: number;
  results: ScenarioResult[];
  issues: DetectedIssue[];
  thoughtStream: ThoughtEntry[];
}
```

---

## 6. Acceptance Criteria

### Phase 3 Complete When:
- [ ] Headed browser launches and is visible
- [ ] Test scenarios execute with visual feedback
- [ ] Thought stream shows Opus's reasoning
- [ ] Issues detected trigger fix attempts
- [ ] Fix → retry loop works
- [ ] Theater UI displays browser view
- [ ] Step checklist updates in real-time
- [ ] Integration with Factory Floor works
- [ ] Recording option available

---

*This SRD defines the Verification Theater. The "wow" moment of watching AI test your app.*
