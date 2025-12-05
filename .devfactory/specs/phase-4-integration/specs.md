# Phase 4: Integration & Polish - Technical Specification

## Overview

This phase ties all components together into a seamless, delightful experience. It focuses on:
- Automatic browser launch
- Navigation between components
- Error recovery and resilience
- Completion celebrations
- Help and onboarding

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    THE COMPLETE USER JOURNEY                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. User runs `/release-the-beast`                                       │
│     │                                                                    │
│     ▼                                                                    │
│  2. Browser automatically opens to Factory Floor Dashboard               │
│     │                                                                    │
│     ├─► Watch specs move through assembly line                          │
│     ├─► See workers building in real-time                               │
│     ├─► Oracle panel shows it's watching                                │
│     │                                                                    │
│  3. Click spec → Detail modal with tasks, progress                      │
│     │                                                                    │
│  4. UI spec completes → "Verify" button appears                         │
│     │                                                                    │
│     ▼                                                                    │
│  5. Click → Theater opens, watch Opus test                              │
│     │                                                                    │
│     ├─► Issue detected → Watch fix applied                              │
│     ├─► Retry → Watch scenario pass                                     │
│     │                                                                    │
│  6. All specs complete → Celebration! 🎉                                │
│     │                                                                    │
│     ▼                                                                    │
│  7. View final report with timeline, stats, issues resolved             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Module Structure

### Backend Additions

```
~/.claude/plugins/devfactory-distributed/src/
├── launch/
│   ├── browser-opener.ts       # Cross-platform browser launch
│   └── config.ts               # Launch configuration
├── recovery/
│   ├── health-monitor.ts       # Monitor all components
│   ├── server-recovery.ts      # Restart crashed servers
│   └── worker-recovery.ts      # Restart crashed workers
├── reporting/
│   ├── generator.ts            # Generate HTML report
│   ├── templates/
│   │   └── report.html         # Report template
│   └── timeline.ts             # Build event timeline
└── notifications/
    ├── desktop.ts              # Desktop notifications
    └── sounds.ts               # Sound effects
```

### Frontend Additions

```
packages/dashboard/src/
├── components/
│   ├── celebrations/
│   │   ├── ConfettiAnimation.tsx
│   │   ├── CelebrationModal.tsx
│   │   └── SpecCompleteAnimation.tsx
│   ├── errors/
│   │   ├── ReconnectingOverlay.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── StuckTaskPanel.tsx
│   ├── help/
│   │   ├── HelpPanel.tsx
│   │   ├── OnboardingTour.tsx
│   │   └── Tooltip.tsx
│   └── polish/
│       ├── SkeletonLoader.tsx
│       ├── CountUpNumber.tsx
│       └── WorkingEffects.tsx
├── hooks/
│   └── useSound.ts
└── pages/
    └── Report.tsx
```

---

## Detailed Component Specifications

### 1. Browser Opener (`launch/browser-opener.ts`)

**Purpose**: Cross-platform automatic browser launch.

```typescript
interface BrowserOpenerConfig {
  url: string;
  browser?: 'default' | 'chrome' | 'firefox' | 'safari';
  waitForReady?: boolean;
  timeout?: number;
}

class BrowserOpener {
  async open(config: BrowserOpenerConfig): Promise<void> {
    const platform = process.platform;

    // Get browser command based on platform
    const command = this.getBrowserCommand(platform, config.browser);

    // Launch browser
    await this.launch(command, config.url);

    // Wait for dashboard to be ready
    if (config.waitForReady) {
      await this.waitForDashboard(config.url, config.timeout);
    }
  }

  private getBrowserCommand(platform: string, browser?: string): string {
    const commands = {
      darwin: {
        default: 'open',
        chrome: 'open -a "Google Chrome"',
        firefox: 'open -a Firefox',
        safari: 'open -a Safari',
      },
      win32: {
        default: 'start',
        chrome: 'start chrome',
        firefox: 'start firefox',
      },
      linux: {
        default: 'xdg-open',
        chrome: 'google-chrome',
        firefox: 'firefox',
      },
    };

    return commands[platform]?.[browser || 'default'] || 'xdg-open';
  }

  private async launch(command: string, url: string): Promise<void> {
    const { exec } = await import('child_process');
    return new Promise((resolve, reject) => {
      exec(`${command} "${url}"`, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  private async waitForDashboard(url: string, timeout = 10000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const response = await fetch(`${url}/api/health`);
        if (response.ok) return;
      } catch {}
      await new Promise(r => setTimeout(r, 500));
    }
    throw new Error('Dashboard did not become ready');
  }
}
```

### 2. Health Monitor (`recovery/health-monitor.ts`)

```typescript
interface ComponentHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  lastHealthy: Date;
  errorCount: number;
}

class HealthMonitor {
  private components: Map<string, ComponentHealth> = new Map();
  private checkInterval: NodeJS.Timer | null = null;

  constructor(
    private onUnhealthy: (component: string) => void,
    private config: { checkInterval: number; unhealthyThreshold: number }
  ) {}

  start(): void {
    this.checkInterval = setInterval(() => this.checkAll(), this.config.checkInterval);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  private async checkAll(): Promise<void> {
    await Promise.all([
      this.checkDashboardServer(),
      this.checkOracle(),
      this.checkWorkers(),
    ]);
  }

  private async checkDashboardServer(): Promise<void> {
    const name = 'dashboard';
    try {
      const response = await fetch('http://localhost:5555/api/health');
      this.markHealthy(name);
    } catch {
      this.markUnhealthy(name);
    }
  }

  private async checkOracle(): Promise<void> {
    // Check oracle process is running
    // Check last activity timestamp
  }

  private async checkWorkers(): Promise<void> {
    // Check each tmux session exists
    // Check heartbeat timestamps in state.json
  }

  private markHealthy(name: string): void {
    const current = this.components.get(name) || this.createComponent(name);
    current.status = 'healthy';
    current.lastHealthy = new Date();
    current.lastCheck = new Date();
    current.errorCount = 0;
    this.components.set(name, current);
  }

  private markUnhealthy(name: string): void {
    const current = this.components.get(name) || this.createComponent(name);
    current.status = 'unhealthy';
    current.lastCheck = new Date();
    current.errorCount++;

    if (current.errorCount >= this.config.unhealthyThreshold) {
      this.onUnhealthy(name);
    }

    this.components.set(name, current);
  }
}
```

### 3. Report Generator (`reporting/generator.ts`)

```typescript
interface ReportData {
  project: string;
  startTime: Date;
  endTime: Date;
  duration: number;

  specs: SpecReport[];
  workers: WorkerReport[];
  oracle: OracleReport;

  timeline: TimelineEvent[];

  summary: {
    totalTasks: number;
    completedTasks: number;
    stuckTasks: number;
    oracleInterventions: number;
    verificationPassed: number;
    verificationFailed: number;
  };
}

class ReportGenerator {
  async generate(data: ReportData): Promise<string> {
    const template = await this.loadTemplate();

    const html = template
      .replace('{{PROJECT_NAME}}', data.project)
      .replace('{{DURATION}}', this.formatDuration(data.duration))
      .replace('{{START_TIME}}', data.startTime.toLocaleString())
      .replace('{{END_TIME}}', data.endTime.toLocaleString())
      .replace('{{SPECS_HTML}}', this.renderSpecs(data.specs))
      .replace('{{TIMELINE_HTML}}', this.renderTimeline(data.timeline))
      .replace('{{SUMMARY_HTML}}', this.renderSummary(data.summary))
      .replace('{{ORACLE_HTML}}', this.renderOracle(data.oracle));

    return html;
  }

  async save(html: string, path: string): Promise<void> {
    await fs.writeFile(path, html);
  }

  private renderTimeline(events: TimelineEvent[]): string {
    return events.map(event => `
      <div class="timeline-event ${event.type}">
        <div class="time">${this.formatTime(event.timestamp)}</div>
        <div class="icon">${this.getEventIcon(event.type)}</div>
        <div class="content">
          <div class="title">${event.title}</div>
          <div class="description">${event.description}</div>
        </div>
      </div>
    `).join('\n');
  }

  private renderSpecs(specs: SpecReport[]): string {
    return specs.map(spec => `
      <div class="spec-card ${spec.status}">
        <h3>${spec.name}</h3>
        <div class="progress">
          <div class="bar" style="width: ${spec.progress}%"></div>
        </div>
        <div class="stats">
          <span>Tasks: ${spec.completedTasks}/${spec.totalTasks}</span>
          <span>Duration: ${this.formatDuration(spec.duration)}</span>
        </div>
        ${spec.issues.length > 0 ? `
          <div class="issues">
            <h4>Issues Resolved</h4>
            ${spec.issues.map(i => `<div class="issue">${i}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('\n');
  }
}
```

### 4. Desktop Notifications (`notifications/desktop.ts`)

```typescript
interface NotificationConfig {
  enabled: boolean;
  sound: boolean;
  soundVolume: number;
}

class DesktopNotifier {
  constructor(private config: NotificationConfig) {}

  async notify(title: string, body: string, type: 'info' | 'success' | 'warning' | 'error'): Promise<void> {
    if (!this.config.enabled) return;

    // Use node-notifier for cross-platform support
    const notifier = await import('node-notifier');

    notifier.notify({
      title,
      message: body,
      icon: this.getIcon(type),
      sound: this.config.sound,
    });
  }

  async specComplete(specName: string): Promise<void> {
    await this.notify(
      'Spec Complete! 🎉',
      `${specName} has been built successfully`,
      'success'
    );
  }

  async issueDetected(specName: string, issue: string): Promise<void> {
    await this.notify(
      'Issue Detected ⚠️',
      `${specName}: ${issue}`,
      'warning'
    );
  }

  async buildComplete(project: string): Promise<void> {
    await this.notify(
      'Build Complete! 🦁',
      `${project} has been fully built and verified`,
      'success'
    );
  }
}
```

### 5. Confetti Animation (`celebrations/ConfettiAnimation.tsx`)

```typescript
interface ConfettiConfig {
  particleCount: number;
  spread: number;
  duration: number;
  colors: string[];
}

function ConfettiAnimation({ trigger, config }: { trigger: boolean; config?: Partial<ConfettiConfig> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const defaultConfig: ConfettiConfig = {
    particleCount: 100,
    spread: 70,
    duration: 3000,
    colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
    ...config,
  };

  useEffect(() => {
    if (!trigger || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const particles: Particle[] = [];

    // Create particles
    for (let i = 0; i < defaultConfig.particleCount; i++) {
      particles.push(createParticle(canvas.width / 2, canvas.height / 2, defaultConfig));
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.01;

        if (p.opacity > 0) {
          drawParticle(ctx, p);
        }
      });

      if (particles.some(p => p.opacity > 0)) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.confetti}
      width={window.innerWidth}
      height={window.innerHeight}
    />
  );
}
```

### 6. Celebration Modal (`celebrations/CelebrationModal.tsx`)

```typescript
interface CelebrationModalProps {
  isOpen: boolean;
  projectName: string;
  stats: {
    totalTasks: number;
    duration: number;
    specsCompleted: number;
    issuesFixed: number;
  };
  onViewReport: () => void;
  onClose: () => void;
}

function CelebrationModal({ isOpen, projectName, stats, onViewReport, onClose }: CelebrationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className={styles.celebration}>
      <ConfettiAnimation trigger={isOpen} />

      <div className={styles.content}>
        <div className={styles.emoji}>🎉</div>
        <h1>Build Complete!</h1>
        <p className={styles.project}>{projectName}</p>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <CountUpNumber value={stats.totalTasks} duration={1000} />
            <span>Tasks Completed</span>
          </div>
          <div className={styles.stat}>
            <CountUpNumber value={stats.specsCompleted} duration={1000} />
            <span>Specs Built</span>
          </div>
          <div className={styles.stat}>
            <span>{formatDuration(stats.duration)}</span>
            <span>Total Time</span>
          </div>
          <div className={styles.stat}>
            <CountUpNumber value={stats.issuesFixed} duration={1000} />
            <span>Issues Fixed</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={onViewReport} className={styles.primary}>
            View Full Report
          </button>
          <button onClick={onClose} className={styles.secondary}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

### 7. Reconnecting Overlay (`errors/ReconnectingOverlay.tsx`)

```typescript
interface ReconnectingOverlayProps {
  status: 'connected' | 'disconnected' | 'reconnecting';
  attemptCount: number;
  onRetry: () => void;
}

function ReconnectingOverlay({ status, attemptCount, onRetry }: ReconnectingOverlayProps) {
  if (status === 'connected') return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        {status === 'reconnecting' ? (
          <>
            <div className={styles.spinner} />
            <h2>Reconnecting...</h2>
            <p>Attempt {attemptCount}</p>
          </>
        ) : (
          <>
            <div className={styles.icon}>⚠️</div>
            <h2>Connection Lost</h2>
            <p>Unable to connect to DevFactory server</p>
            <button onClick={onRetry} className={styles.retry}>
              Retry Connection
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

### 8. Onboarding Tour (`help/OnboardingTour.tsx`)

```typescript
interface TourStep {
  target: string;  // CSS selector
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: '.assembly-line',
    title: 'Assembly Line',
    content: 'Watch your specs move through the build process, just like a car on a factory floor.',
    position: 'bottom',
  },
  {
    target: '.worker-panel',
    title: 'Workers',
    content: 'Each worker handles a different layer: database, backend, frontend, or testing.',
    position: 'left',
  },
  {
    target: '.oracle-panel',
    title: 'The Oracle',
    content: 'Opus 4.5 watches everything. If a worker gets stuck, the Oracle helps.',
    position: 'left',
  },
  {
    target: '.activity-feed',
    title: 'Activity Feed',
    content: 'See everything happening in real-time.',
    position: 'top',
  },
];

function OnboardingTour({ isOpen, onComplete }: { isOpen: boolean; onComplete: () => void }) {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const currentStep = tourSteps[step];
  const targetElement = document.querySelector(currentStep.target);
  const rect = targetElement?.getBoundingClientRect();

  return (
    <>
      <div className={styles.backdrop} />
      <div
        className={styles.spotlight}
        style={{
          top: rect?.top,
          left: rect?.left,
          width: rect?.width,
          height: rect?.height,
        }}
      />
      <div
        className={cn(styles.tooltip, styles[currentStep.position])}
        style={calculateTooltipPosition(rect, currentStep.position)}
      >
        <h3>{currentStep.title}</h3>
        <p>{currentStep.content}</p>
        <div className={styles.navigation}>
          <span>{step + 1} / {tourSteps.length}</span>
          {step < tourSteps.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}>Next</button>
          ) : (
            <button onClick={onComplete}>Done</button>
          )}
        </div>
      </div>
    </>
  );
}
```

### 9. Count Up Number Animation (`polish/CountUpNumber.tsx`)

```typescript
interface CountUpNumberProps {
  value: number;
  duration: number;  // ms
  prefix?: string;
  suffix?: string;
}

function CountUpNumber({ value, duration, prefix = '', suffix = '' }: CountUpNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const start = 0;
    const end = value;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quad
      const eased = 1 - Math.pow(1 - progress, 2);

      setDisplayValue(Math.round(start + (end - start) * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [value, duration]);

  return (
    <span className={styles.countUp}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}
```

---

## Integration Flows

### Auto-Launch Flow
```
1. User: /release-the-beast
2. CLI: Start orchestrator
3. CLI: Start dashboard server
4. CLI: Wait for server ready (health check)
5. CLI: Open browser to http://localhost:5555
6. Dashboard: Show loading state
7. Dashboard: Connect WebSocket
8. Dashboard: Render factory floor
```

### Navigation Flow
```
Dashboard
├── Click Spec → SpecDetailModal
│   ├── View tasks
│   ├── View progress
│   └── Click "Verify" → Open Theater
│
├── Click Worker → WorkerDetailModal
│   ├── View current task
│   ├── View recent activity
│   └── Copy tmux attach command
│
├── Click Station → StationDetailModal
│   ├── View layer tasks
│   └── View completion status
│
└── Theater
    ├── Watch browser
    ├── See thoughts
    ├── Track steps
    └── Click "Back" → Dashboard
```

### Recovery Flow
```
Component Crash Detected
├── Dashboard Server
│   ├── Health monitor detects
│   ├── Orchestrator restarts server
│   └── Clients auto-reconnect
│
├── Worker (tmux)
│   ├── Heartbeat missing
│   ├── Orchestrator detects
│   ├── Recreate tmux session
│   ├── Bootstrap worker
│   └── Reassign current task
│
└── Oracle
    ├── Process missing
    ├── Orchestrator restarts
    └── Context reloads
```

---

## Configuration

```yaml
# config.yml additions
integration:
  autoOpenBrowser: true
  browser: 'default'
  dashboardPort: 5555

recovery:
  healthCheckInterval: 30000
  unhealthyThreshold: 3
  autoRestart: true

notifications:
  desktop: true
  sound: true
  soundVolume: 0.5

celebrations:
  confetti: true
  sounds: true
  duration: 5000

onboarding:
  showOnFirstRun: true
```

---

## Testing Strategy

### E2E Full Flow Test
1. Start fresh project
2. Create spec
3. Run `/release-the-beast`
4. Verify browser opens
5. Verify dashboard loads
6. Wait for build complete
7. Verify celebration shows
8. Verify report generates

### Recovery Tests
1. Kill dashboard server → verify restart
2. Kill worker session → verify restart
3. Disconnect WebSocket → verify reconnect

---

*This spec defines the integration and polish that makes DevFactory delightful.*
