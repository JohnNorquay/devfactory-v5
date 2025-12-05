import { WorkerContext, StuckIndicator, ActivityEntry } from './types.js';

export interface StuckDetectorConfig {
  noProgressThresholdMs: number;      // Default: 5 minutes
  repeatedErrorThreshold: number;      // Default: 3 same errors
  taskTimeoutMs: number;               // Default: 30 minutes
  activityWindowMs: number;            // Default: 2 minutes
}

export class StuckDetector {
  private config: StuckDetectorConfig;

  constructor(config?: Partial<StuckDetectorConfig>) {
    this.config = {
      noProgressThresholdMs: 5 * 60 * 1000,
      repeatedErrorThreshold: 3,
      taskTimeoutMs: 30 * 60 * 1000,
      activityWindowMs: 2 * 60 * 1000,
      ...config
    };
  }

  /**
   * Analyze all workers and return stuck indicators
   */
  detectStuck(workers: WorkerContext[]): StuckIndicator[] {
    const indicators: StuckIndicator[] = [];

    for (const worker of workers) {
      // Skip offline or idle workers
      if (worker.status === 'offline' || worker.status === 'idle') continue;

      // Check if worker is explicitly stuck (status === 'stuck')
      if (worker.status === 'stuck') {
        const explicitIndicator = this.createExplicitStuckIndicator(worker);
        if (explicitIndicator) indicators.push(explicitIndicator);
        continue;
      }

      // Check various stuck conditions for working workers
      const noProgress = this.checkNoProgress(worker);
      const repeatedErrors = this.checkRepeatedErrors(worker);
      const timeout = this.checkTimeout(worker);

      if (noProgress) indicators.push(noProgress);
      if (repeatedErrors) indicators.push(repeatedErrors);
      if (timeout) indicators.push(timeout);
    }

    return indicators;
  }

  /**
   * Create indicator for explicitly stuck worker
   */
  private createExplicitStuckIndicator(worker: WorkerContext): StuckIndicator | null {
    if (!worker.currentTask) return null;

    const duration = worker.stuckDuration || 0;

    return {
      workerId: worker.id,
      taskId: worker.currentTask,
      reason: 'explicit_stuck',
      duration,
      confidence: 1.0, // Worker explicitly marked as stuck
    };
  }

  /**
   * Check if worker has made no progress recently
   */
  private checkNoProgress(worker: WorkerContext): StuckIndicator | null {
    if (!worker.currentTask) return null;

    const now = Date.now();
    const recentActivityWindow = now - this.config.activityWindowMs;

    // Get meaningful activities (excluding messages)
    const meaningfulActivities = worker.recentActivity.filter(
      activity =>
        activity.type !== 'message' &&
        new Date(activity.timestamp).getTime() >= recentActivityWindow
    );

    // If no meaningful activity in the window, check the last activity time
    if (meaningfulActivities.length === 0) {
      const lastActivity = this.getLastMeaningfulActivity(worker.recentActivity);

      if (!lastActivity) {
        // No activity at all - worker might be stuck
        return {
          workerId: worker.id,
          taskId: worker.currentTask,
          reason: 'no_progress',
          duration: this.config.noProgressThresholdMs,
          confidence: 0.7,
        };
      }

      const timeSinceLastActivity = now - new Date(lastActivity.timestamp).getTime();

      if (timeSinceLastActivity >= this.config.noProgressThresholdMs) {
        return {
          workerId: worker.id,
          taskId: worker.currentTask,
          reason: 'no_progress',
          duration: timeSinceLastActivity,
          confidence: this.calculateConfidence('no_progress', timeSinceLastActivity),
        };
      }
    }

    return null;
  }

  /**
   * Check for repeated error patterns
   */
  private checkRepeatedErrors(worker: WorkerContext): StuckIndicator | null {
    if (!worker.currentTask) return null;

    // Get recent error activities
    const errors = worker.recentActivity
      .filter(activity => activity.type === 'error')
      .slice(-10); // Look at last 10 errors

    if (errors.length < this.config.repeatedErrorThreshold) {
      return null;
    }

    // Group errors by similarity
    const errorGroups = this.groupSimilarErrors(errors);

    // Find the largest group
    let largestGroup: string[] = [];
    let largestGroupPattern = '';

    for (const [pattern, group] of Object.entries(errorGroups)) {
      if (group.length > largestGroup.length) {
        largestGroup = group;
        largestGroupPattern = pattern;
      }
    }

    // If we have repeated similar errors
    if (largestGroup.length >= this.config.repeatedErrorThreshold) {
      const firstError = errors.find(e =>
        this.normalizeError(e.message) === largestGroupPattern
      );
      const lastError = errors[errors.length - 1];

      const duration = firstError && lastError
        ? new Date(lastError.timestamp).getTime() - new Date(firstError.timestamp).getTime()
        : 0;

      return {
        workerId: worker.id,
        taskId: worker.currentTask,
        reason: 'repeated_errors',
        duration,
        errorPattern: largestGroupPattern,
        confidence: this.calculateConfidence('repeated_errors', largestGroup.length),
      };
    }

    return null;
  }

  /**
   * Check if task has exceeded timeout
   */
  private checkTimeout(worker: WorkerContext): StuckIndicator | null {
    if (!worker.currentTask) return null;

    // Find the task_start activity for current task
    const taskStart = worker.recentActivity.find(
      activity => activity.type === 'task_start'
    );

    if (!taskStart) {
      // No task start found, can't determine timeout
      return null;
    }

    const now = Date.now();
    const taskDuration = now - new Date(taskStart.timestamp).getTime();

    if (taskDuration >= this.config.taskTimeoutMs) {
      return {
        workerId: worker.id,
        taskId: worker.currentTask,
        reason: 'timeout',
        duration: taskDuration,
        confidence: this.calculateConfidence('timeout', taskDuration),
      };
    }

    return null;
  }

  /**
   * Get the last meaningful activity (non-message)
   */
  private getLastMeaningfulActivity(activities: ActivityEntry[]): ActivityEntry | null {
    const meaningful = activities
      .filter(a => a.type !== 'message')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return meaningful.length > 0 ? meaningful[0] : null;
  }

  /**
   * Group similar error messages
   */
  private groupSimilarErrors(errors: ActivityEntry[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};

    for (const error of errors) {
      const normalized = this.normalizeError(error.message);

      if (!groups[normalized]) {
        groups[normalized] = [];
      }

      groups[normalized].push(error.message);
    }

    return groups;
  }

  /**
   * Normalize error message for comparison
   * Removes timestamps, line numbers, file paths, and other variable parts
   */
  private normalizeError(error: string): string {
    return error
      // Remove file paths
      .replace(/\/[^\s]+\.(ts|js|tsx|jsx|py|go|java)/g, 'FILE')
      // Remove line numbers
      .replace(/:\d+:\d+/g, ':LINE')
      .replace(/line \d+/gi, 'LINE')
      // Remove timestamps
      .replace(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP')
      // Remove hex addresses
      .replace(/0x[0-9a-f]+/gi, 'ADDRESS')
      // Remove UUIDs
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 'UUID')
      // Remove numbers (but keep error codes)
      .replace(/\b\d+(?!\d*[a-zA-Z])\b/g, 'NUM')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }


  /**
   * Calculate confidence score based on indicators
   * Returns a value between 0 and 1
   */
  private calculateConfidence(
    reason: StuckIndicator['reason'],
    value: number
  ): number {
    switch (reason) {
      case 'no_progress': {
        // Confidence increases with duration
        const minutes = value / (60 * 1000);
        if (minutes >= 30) return 0.95;
        if (minutes >= 20) return 0.85;
        if (minutes >= 10) return 0.75;
        return 0.6;
      }

      case 'repeated_errors': {
        // Confidence increases with number of repetitions
        const repetitions = value;
        if (repetitions >= 10) return 0.95;
        if (repetitions >= 7) return 0.85;
        if (repetitions >= 5) return 0.75;
        return 0.65;
      }

      case 'timeout': {
        // Confidence increases with how much we've exceeded timeout
        const ratio = value / this.config.taskTimeoutMs;
        if (ratio >= 2.0) return 0.95;
        if (ratio >= 1.5) return 0.85;
        if (ratio >= 1.2) return 0.75;
        return 0.65;
      }

      case 'explicit_stuck':
        // Worker explicitly marked as stuck
        return 1.0;

      default:
        return 0.5;
    }
  }
}
