# Phase 3: Verification Theater - Technical Specification

## Architecture Overview

The Verification Theater is a headed Playwright-based testing system that lets you watch Opus 4.5 click through your application, finding and fixing issues in real-time.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      VERIFICATION THEATER SYSTEM                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    VERIFICATION ORCHESTRATOR                      │   │
│  │  • Loads test scenarios for completed specs                       │   │
│  │  • Prioritizes (critical first)                                   │   │
│  │  • Manages fix → retry loop                                       │   │
│  │  • Reports results                                                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                │                                         │
│                                ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    BROWSER MANAGER (Playwright)                   │   │
│  │  • Launches headed Chromium                                       │   │
│  │  • Executes test steps                                            │   │
│  │  • Captures screenshots (2-5 fps)                                 │   │
│  │  • Monitors console/network                                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                │                                         │
│                    ┌───────────┴───────────┐                            │
│                    ▼                       ▼                            │
│  ┌─────────────────────────┐  ┌─────────────────────────┐              │
│  │    BROWSER EXPLORER     │  │     ISSUE DETECTOR      │              │
│  │    (Claude Agent)       │  │                         │              │
│  │  • Understands context  │  │  • Console errors       │              │
│  │  • Executes steps       │  │  • Network errors       │              │
│  │  • Reports thoughts     │  │  • Missing elements     │              │
│  └─────────────────────────┘  └─────────────────────────┘              │
│                                          │                              │
│                                          ▼                              │
│                              ┌─────────────────────────┐                │
│                              │      FIX ENGINE         │                │
│                              │  • Analyzes issue       │                │
│                              │  • Spawns fix subagent  │                │
│                              │  • Verifies fix         │                │
│                              └─────────────────────────┘                │
│                                                                          │
│  ════════════════════════════════════════════════════════════════════   │
│                           WebSocket Stream                               │
│  ════════════════════════════════════════════════════════════════════   │
│                                │                                         │
│                                ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      THEATER UI (React)                           │   │
│  │  ┌──────────────────────┐  ┌──────────────────────┐              │   │
│  │  │   Browser View       │  │  Scenario Steps      │              │   │
│  │  │   (screenshots)      │  │  (checklist)         │              │   │
│  │  └──────────────────────┘  └──────────────────────┘              │   │
│  │  ┌──────────────────────────────────────────────────┐            │   │
│  │  │              Thought Stream                       │            │   │
│  │  └──────────────────────────────────────────────────┘            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Module Structure

```
packages/theater/
├── src/
│   ├── index.ts                    # Public API
│   ├── orchestrator.ts             # VerificationOrchestrator
│   ├── browser/
│   │   ├── manager.ts              # BrowserManager (Playwright)
│   │   ├── screenshot-stream.ts    # Screenshot capture + WebSocket
│   │   └── page-analyzer.ts        # Understand page state
│   ├── scenarios/
│   │   ├── types.ts                # Scenario/Step interfaces
│   │   ├── loader.ts               # Load from JSON
│   │   ├── generator.ts            # Generate from spec
│   │   └── runner.ts               # Execute scenarios
│   ├── explorer/
│   │   ├── agent.ts                # BrowserExplorer Claude agent
│   │   └── prompts.ts              # Agent prompts
│   ├── issues/
│   │   ├── detector.ts             # IssueDetector
│   │   ├── classifier.ts           # Classify issue type
│   │   └── fix-engine.ts           # FixEngine
│   ├── thoughts/
│   │   ├── stream.ts               # ThoughtStream
│   │   └── formatter.ts            # Format thoughts
│   └── types.ts                    # Shared types
├── package.json
└── tsconfig.json

packages/dashboard/src/components/theater/
├── Theater.tsx                     # Main theater page
├── BrowserView.tsx                 # Screenshot display
├── ScenarioSteps.tsx               # Step checklist
├── ThoughtStreamPanel.tsx          # Thought display
├── StatusBar.tsx                   # Current action/issues
└── TheaterMiniStatus.tsx           # Mini status for dashboard
```

---

## Detailed Component Specifications

### 1. Browser Manager (`browser/manager.ts`)

**Purpose**: Manage Playwright browser instance in headed mode.

```typescript
interface BrowserManagerConfig {
  headless: boolean;  // false for visible
  slowMo: number;     // ms delay between actions
  windowSize: { width: number; height: number };
  windowPosition: { x: number; y: number };
  screenshotInterval: number;  // ms between screenshots
}

class BrowserManager {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private screenshotInterval: NodeJS.Timer | null = null;

  constructor(
    private config: BrowserManagerConfig,
    private onScreenshot: (base64: string) => void
  ) {}

  async launch(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo,
      args: [
        `--window-position=${this.config.windowPosition.x},${this.config.windowPosition.y}`,
        `--window-size=${this.config.windowSize.width},${this.config.windowSize.height}`,
      ],
    });

    this.page = await this.browser.newPage();
    this.startScreenshotStream();
  }

  private startScreenshotStream(): void {
    this.screenshotInterval = setInterval(async () => {
      if (this.page) {
        const screenshot = await this.page.screenshot({ type: 'jpeg', quality: 70 });
        this.onScreenshot(screenshot.toString('base64'));
      }
    }, this.config.screenshotInterval);
  }

  async navigate(url: string): Promise<void> {
    await this.page?.goto(url, { waitUntil: 'networkidle' });
  }

  async click(selector: string): Promise<void> {
    await this.page?.click(selector);
  }

  async type(selector: string, text: string): Promise<void> {
    await this.page?.fill(selector, text);
  }

  async waitFor(selector: string, timeout?: number): Promise<void> {
    await this.page?.waitForSelector(selector, { timeout });
  }

  async getConsoleErrors(): Promise<string[]> {
    // Collected via page.on('console')
  }

  async getNetworkErrors(): Promise<NetworkError[]> {
    // Collected via page.on('response')
  }

  async close(): Promise<void> {
    if (this.screenshotInterval) {
      clearInterval(this.screenshotInterval);
    }
    await this.browser?.close();
  }
}
```

### 2. Test Scenario Types (`scenarios/types.ts`)

```typescript
interface TestScenario {
  id: string;
  name: string;
  description: string;
  spec: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  baseUrl: string;
  preconditions: Precondition[];
  steps: TestStep[];
  postconditions: Postcondition[];
}

interface TestStep {
  id: string;
  order: number;
  action: StepAction;
  target?: string;      // Selector, URL, or text
  value?: string;       // Input value or expected value
  description: string;
  timeout?: number;     // ms
  screenshot?: boolean; // Force screenshot after step
}

type StepAction =
  | 'navigate'      // Go to URL
  | 'click'         // Click element
  | 'type'          // Type into input
  | 'clear'         // Clear input
  | 'select'        // Select dropdown option
  | 'wait'          // Wait for element
  | 'waitForNav'    // Wait for navigation
  | 'assert_text'   // Assert text content
  | 'assert_url'    // Assert current URL
  | 'assert_visible'// Assert element visible
  | 'screenshot';   // Take screenshot

interface StepResult {
  stepId: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
  screenshot?: string;
}

interface ScenarioResult {
  scenarioId: string;
  status: 'pass' | 'fail';
  steps: StepResult[];
  duration: number;
  issues: DetectedIssue[];
}
```

### 3. Scenario Runner (`scenarios/runner.ts`)

```typescript
class ScenarioRunner {
  constructor(
    private browser: BrowserManager,
    private thoughtStream: ThoughtStream,
    private issueDetector: IssueDetector
  ) {}

  async run(scenario: TestScenario): Promise<ScenarioResult> {
    const results: StepResult[] = [];
    const issues: DetectedIssue[] = [];

    this.thoughtStream.emit('scenario_start', scenario.name);

    // Run preconditions
    for (const pre of scenario.preconditions) {
      await this.runPrecondition(pre);
    }

    // Run steps
    for (const step of scenario.steps) {
      this.thoughtStream.emit('step_start', step.description);

      const result = await this.runStep(step);
      results.push(result);

      if (result.status === 'fail') {
        // Check for issues
        const detected = await this.issueDetector.analyze();
        issues.push(...detected);

        this.thoughtStream.emit('step_fail', result.error);
        break;  // Stop on first failure
      }

      this.thoughtStream.emit('step_pass', step.description);
    }

    return {
      scenarioId: scenario.id,
      status: results.every(r => r.status === 'pass') ? 'pass' : 'fail',
      steps: results,
      duration: this.calculateDuration(results),
      issues,
    };
  }

  private async runStep(step: TestStep): Promise<StepResult> {
    const start = Date.now();

    try {
      switch (step.action) {
        case 'navigate':
          await this.browser.navigate(step.target!);
          break;
        case 'click':
          await this.browser.click(step.target!);
          break;
        case 'type':
          await this.browser.type(step.target!, step.value!);
          break;
        case 'wait':
          await this.browser.waitFor(step.target!, step.timeout);
          break;
        case 'assert_text':
          await this.assertText(step.target!, step.value!);
          break;
        case 'assert_url':
          await this.assertUrl(step.value!);
          break;
        // ... other actions
      }

      return {
        stepId: step.id,
        status: 'pass',
        duration: Date.now() - start,
      };
    } catch (error) {
      return {
        stepId: step.id,
        status: 'fail',
        duration: Date.now() - start,
        error: error.message,
        screenshot: await this.browser.screenshot(),
      };
    }
  }
}
```

### 4. Issue Detector (`issues/detector.ts`)

```typescript
type IssueType =
  | 'console_error'
  | 'network_error'
  | 'element_missing'
  | 'assertion_failed'
  | 'timeout'
  | 'visual_regression';

interface DetectedIssue {
  id: string;
  type: IssueType;
  severity: 'critical' | 'error' | 'warning';
  message: string;
  details: Record<string, any>;
  timestamp: Date;
  screenshot?: string;
}

class IssueDetector {
  constructor(private browser: BrowserManager) {}

  async analyze(): Promise<DetectedIssue[]> {
    const issues: DetectedIssue[] = [];

    // Check console errors
    const consoleErrors = await this.browser.getConsoleErrors();
    for (const error of consoleErrors) {
      issues.push({
        id: generateId(),
        type: 'console_error',
        severity: this.classifyConsoleSeverity(error),
        message: error,
        details: { source: 'console' },
        timestamp: new Date(),
      });
    }

    // Check network errors
    const networkErrors = await this.browser.getNetworkErrors();
    for (const error of networkErrors) {
      issues.push({
        id: generateId(),
        type: 'network_error',
        severity: error.status >= 500 ? 'critical' : 'error',
        message: `${error.method} ${error.url} returned ${error.status}`,
        details: { ...error },
        timestamp: new Date(),
      });
    }

    return issues;
  }

  private classifyConsoleSeverity(error: string): 'critical' | 'error' | 'warning' {
    if (error.includes('Uncaught') || error.includes('TypeError')) {
      return 'critical';
    }
    if (error.includes('Error')) {
      return 'error';
    }
    return 'warning';
  }
}
```

### 5. Fix Engine (`issues/fix-engine.ts`)

```typescript
interface FixAttempt {
  issueId: string;
  attempt: number;
  analysis: string;
  fix: string;
  filesModified: string[];
  success: boolean;
}

class FixEngine {
  constructor(
    private claude: Anthropic,
    private thoughtStream: ThoughtStream
  ) {}

  async attemptFix(issue: DetectedIssue, context: FixContext): Promise<FixAttempt> {
    this.thoughtStream.emit('fix_start', `Analyzing: ${issue.message}`);

    // Analyze the issue
    const analysis = await this.analyzeIssue(issue, context);
    this.thoughtStream.emit('fix_analysis', analysis.summary);

    // Generate fix
    const fix = await this.generateFix(analysis);
    this.thoughtStream.emit('fix_applying', `Modifying ${fix.files.join(', ')}`);

    // Apply fix via subagent
    const result = await this.applyFix(fix);

    return {
      issueId: issue.id,
      attempt: context.attemptNumber,
      analysis: analysis.summary,
      fix: fix.description,
      filesModified: fix.files,
      success: result.success,
    };
  }

  private async analyzeIssue(issue: DetectedIssue, context: FixContext): Promise<IssueAnalysis> {
    const prompt = buildAnalysisPrompt(issue, context);

    const response = await this.claude.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    return parseAnalysisResponse(response);
  }

  private async generateFix(analysis: IssueAnalysis): Promise<FixPlan> {
    // Generate specific code changes
  }

  private async applyFix(plan: FixPlan): Promise<{ success: boolean }> {
    // Spawn subagent to make changes
    // Restart server if needed
    // Return result
  }
}
```

### 6. Thought Stream (`thoughts/stream.ts`)

```typescript
interface ThoughtEntry {
  timestamp: Date;
  type: ThoughtType;
  message: string;
  emoji: string;
}

type ThoughtType =
  | 'scenario_start'
  | 'step_start'
  | 'step_pass'
  | 'step_fail'
  | 'fix_start'
  | 'fix_analysis'
  | 'fix_applying'
  | 'fix_complete'
  | 'observation'
  | 'decision';

class ThoughtStream {
  private entries: ThoughtEntry[] = [];
  private listeners: ((entry: ThoughtEntry) => void)[] = [];

  emit(type: ThoughtType, message: string): void {
    const entry: ThoughtEntry = {
      timestamp: new Date(),
      type,
      message,
      emoji: this.getEmoji(type),
    };

    this.entries.push(entry);
    this.listeners.forEach(l => l(entry));
  }

  subscribe(listener: (entry: ThoughtEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private getEmoji(type: ThoughtType): string {
    const emojis: Record<ThoughtType, string> = {
      scenario_start: '🎬',
      step_start: '👁️',
      step_pass: '✅',
      step_fail: '❌',
      fix_start: '🔧',
      fix_analysis: '🔍',
      fix_applying: '⚙️',
      fix_complete: '✨',
      observation: '💭',
      decision: '🧠',
    };
    return emojis[type];
  }

  format(entry: ThoughtEntry): string {
    const time = entry.timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return `[${time}] ${entry.emoji} ${entry.message}`;
  }
}
```

### 7. Verification Orchestrator (`orchestrator.ts`)

```typescript
interface VerificationConfig {
  maxFixAttempts: number;
  fixTimeout: number;
  screenshotFps: number;
}

class VerificationOrchestrator {
  private state: VerificationState = { status: 'idle' };

  constructor(
    private browser: BrowserManager,
    private scenarioRunner: ScenarioRunner,
    private fixEngine: FixEngine,
    private thoughtStream: ThoughtStream,
    private config: VerificationConfig
  ) {}

  async verifySpec(specId: string): Promise<VerificationReport> {
    this.state = { status: 'running', currentSpec: specId };

    // Load scenarios for spec
    const scenarios = await this.loadScenarios(specId);

    // Sort by priority (critical first)
    scenarios.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const results: ScenarioResult[] = [];

    for (const scenario of scenarios) {
      const result = await this.runWithRetry(scenario);
      results.push(result);
    }

    this.state = { status: 'complete' };

    return this.generateReport(specId, results);
  }

  private async runWithRetry(scenario: TestScenario): Promise<ScenarioResult> {
    let result = await this.scenarioRunner.run(scenario);
    let attempt = 1;

    while (result.status === 'fail' && attempt < this.config.maxFixAttempts) {
      this.thoughtStream.emit('decision', `Attempt ${attempt} failed, trying fix...`);

      // Attempt fix
      for (const issue of result.issues) {
        const fixAttempt = await this.fixEngine.attemptFix(issue, {
          scenario,
          attemptNumber: attempt,
        });

        if (!fixAttempt.success) {
          continue;  // Try next issue or give up
        }
      }

      // Retry scenario
      result = await this.scenarioRunner.run(scenario);
      attempt++;
    }

    return result;
  }
}
```

### 8. Theater UI Components

#### BrowserView (`BrowserView.tsx`)
```typescript
interface BrowserViewProps {
  screenshot: string | null;  // base64
  cursorPosition?: { x: number; y: number };
  highlightElement?: string;
}

function BrowserView({ screenshot, cursorPosition, highlightElement }: BrowserViewProps) {
  return (
    <div className={styles.browserView}>
      {screenshot ? (
        <img
          src={`data:image/jpeg;base64,${screenshot}`}
          alt="Browser view"
          className={styles.screenshot}
        />
      ) : (
        <div className={styles.placeholder}>
          Waiting for browser...
        </div>
      )}

      {cursorPosition && (
        <div
          className={styles.cursor}
          style={{ left: cursorPosition.x, top: cursorPosition.y }}
        >
          🖱️
        </div>
      )}
    </div>
  );
}
```

#### ScenarioSteps (`ScenarioSteps.tsx`)
```typescript
interface ScenarioStepsProps {
  scenario: TestScenario | null;
  currentStep: number;
  results: StepResult[];
}

function ScenarioSteps({ scenario, currentStep, results }: ScenarioStepsProps) {
  if (!scenario) return null;

  return (
    <div className={styles.scenarioSteps}>
      <h3>{scenario.name}</h3>
      <div className={styles.stepList}>
        {scenario.steps.map((step, i) => {
          const result = results[i];
          const isCurrent = i === currentStep;

          return (
            <div
              key={step.id}
              className={cn(
                styles.step,
                result?.status === 'pass' && styles.pass,
                result?.status === 'fail' && styles.fail,
                isCurrent && styles.current
              )}
            >
              <span className={styles.icon}>
                {result?.status === 'pass' ? '✓' :
                 result?.status === 'fail' ? '✗' :
                 isCurrent ? '●' : '○'}
              </span>
              <span className={styles.description}>{step.description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

#### ThoughtStreamPanel (`ThoughtStreamPanel.tsx`)
```typescript
interface ThoughtStreamPanelProps {
  entries: ThoughtEntry[];
  maxHeight?: number;
}

function ThoughtStreamPanel({ entries, maxHeight = 200 }: ThoughtStreamPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div
      ref={containerRef}
      className={styles.thoughtStream}
      style={{ maxHeight }}
    >
      {entries.map((entry, i) => (
        <div key={i} className={cn(styles.thought, styles[entry.type])}>
          <span className={styles.time}>
            {entry.timestamp.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
          <span className={styles.emoji}>{entry.emoji}</span>
          <span className={styles.message}>{entry.message}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## WebSocket Events (Theater-specific)

```typescript
interface TheaterServerEvents {
  'theater:screenshot': (base64: string) => void;
  'theater:thought': (entry: ThoughtEntry) => void;
  'theater:step_update': (stepId: string, result: StepResult) => void;
  'theater:scenario_start': (scenario: TestScenario) => void;
  'theater:scenario_complete': (result: ScenarioResult) => void;
  'theater:issue_detected': (issue: DetectedIssue) => void;
  'theater:fix_attempt': (attempt: FixAttempt) => void;
}

interface TheaterClientEvents {
  'theater:start': (specId: string) => void;
  'theater:stop': () => void;
  'theater:pause': () => void;
  'theater:resume': () => void;
}
```

---

## Test Scenario File Format

```json
{
  "id": "auth-login-success",
  "name": "Successful User Login",
  "description": "Verify that a user can log in with valid credentials",
  "spec": "user-authentication",
  "priority": "critical",
  "baseUrl": "http://localhost:3000",
  "preconditions": [
    { "type": "seed_user", "email": "test@example.com", "password": "password123" }
  ],
  "steps": [
    { "id": "1", "order": 1, "action": "navigate", "target": "/login", "description": "Navigate to login page" },
    { "id": "2", "order": 2, "action": "wait", "target": "[name='email']", "description": "Wait for email input" },
    { "id": "3", "order": 3, "action": "type", "target": "[name='email']", "value": "test@example.com", "description": "Enter email" },
    { "id": "4", "order": 4, "action": "type", "target": "[name='password']", "value": "password123", "description": "Enter password" },
    { "id": "5", "order": 5, "action": "click", "target": "button[type='submit']", "description": "Click login button" },
    { "id": "6", "order": 6, "action": "waitForNav", "timeout": 5000, "description": "Wait for redirect" },
    { "id": "7", "order": 7, "action": "assert_url", "value": "/dashboard", "description": "Verify redirect to dashboard" }
  ],
  "postconditions": [
    { "type": "cleanup_user", "email": "test@example.com" }
  ]
}
```

---

## Integration with Factory Floor

1. **TheaterMiniStatus**: Shows in dashboard when verification available
2. **"View Verification" button**: Opens theater in new tab/overlay
3. **Status sync**: Theater state reflected in dashboard
4. **Issue alerts**: Dashboard shows notification on issues

---

*This spec defines the Verification Theater - watch Opus test your app!*
