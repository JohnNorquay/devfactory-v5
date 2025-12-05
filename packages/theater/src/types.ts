export interface BrowserConfig {
  headless: boolean;
  viewport?: {
    width: number;
    height: number;
  };
  slowMo?: number;
  devtools?: boolean;
}

export interface TestStep {
  id: string;
  action: 'navigate' | 'click' | 'fill' | 'select' | 'check' | 'wait' | 'screenshot' | 'assert_text' | 'assert_visible' | 'assert_url';
  selector?: string;
  value?: string;
  url?: string;
  timeout?: number;
  description: string;
  screenshot?: boolean;
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  specId: string;
  steps: TestStep[];
  expectedOutcomes: string[];
}

export interface StepResult {
  stepId: string;
  success: boolean;
  duration: number;
  screenshot?: string;
  error?: string;
  consoleErrors?: string[];
  networkErrors?: string[];
}

export interface DetectedIssue {
  type: 'console_error' | 'network_error' | 'assertion_failed' | 'timeout';
  message: string;
  stepId?: string;
  severity: 'error' | 'warning';
  stackTrace?: string;
}

export interface ScenarioResult {
  scenarioId: string;
  success: boolean;
  steps: StepResult[];
  startedAt: Date;
  completedAt: Date;
  issues: DetectedIssue[];
}

export interface TheaterEvents {
  onStepStart?: (step: TestStep) => void;
  onStepComplete?: (result: StepResult) => void;
  onScreenshot?: (base64: string, stepId: string) => void;
  onIssueDetected?: (issue: DetectedIssue) => void;
  onThought?: (thought: string) => void;
}
