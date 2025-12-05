import { StuckIndicator, Intervention, OracleContext, WorkerContext, TaskContext } from './types.js';

export interface InterventionStrategy {
  name: string;
  canHandle: (indicator: StuckIndicator, context: OracleContext) => boolean;
  priority: number;
  createIntervention: (indicator: StuckIndicator, context: OracleContext) => Intervention;
}

export class InterventionEngine {
  private strategies: InterventionStrategy[] = [];

  constructor() {
    this.registerDefaultStrategies();
  }

  /**
   * Register a new intervention strategy
   * Strategies are sorted by priority (higher priority first)
   */
  registerStrategy(strategy: InterventionStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Determine best intervention for a stuck indicator
   * Returns the first strategy that can handle the situation
   */
  determineIntervention(indicator: StuckIndicator, context: OracleContext): Intervention | null {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(indicator, context)) {
        return strategy.createIntervention(indicator, context);
      }
    }
    return null;
  }

  /**
   * Register default intervention strategies
   * Priority order: Takeover (30) > Reassign (20) > Guidance (10) > Skip (5)
   */
  private registerDefaultStrategies(): void {
    // Strategy 1: Guidance - provide hints for minor issues
    this.registerStrategy({
      name: 'guidance',
      priority: 10,
      canHandle: (indicator) => indicator.confidence < 0.7 && indicator.reason === 'no_progress',
      createIntervention: (indicator, context) => this.createGuidanceIntervention(indicator, context)
    });

    // Strategy 2: Takeover - Oracle takes control for complex issues
    this.registerStrategy({
      name: 'takeover',
      priority: 30,
      canHandle: (indicator) => indicator.confidence >= 0.8 && indicator.duration > 10 * 60 * 1000,
      createIntervention: (indicator, context) => this.createTakeoverIntervention(indicator, context)
    });

    // Strategy 3: Reassign - move task to different worker
    this.registerStrategy({
      name: 'reassign',
      priority: 20,
      canHandle: (indicator, context) => {
        // Can reassign if there's an idle worker of the same type
        return this.hasAvailableWorker(indicator, context);
      },
      createIntervention: (indicator, context) => this.createReassignIntervention(indicator, context)
    });

    // Strategy 4: Skip - skip problematic task and continue
    this.registerStrategy({
      name: 'skip',
      priority: 5,
      canHandle: (indicator) => indicator.reason === 'timeout' && indicator.duration > 60 * 60 * 1000,
      createIntervention: (indicator, context) => this.createSkipIntervention(indicator, context)
    });
  }

  /**
   * Create a guidance intervention with helpful hints
   */
  private createGuidanceIntervention(indicator: StuckIndicator, context: OracleContext): Intervention {
    const task = this.findTask(indicator.taskId, context);
    const worker = this.findWorker(indicator.workerId, context);

    const prompt = this.buildGuidancePrompt(indicator, task, worker, context);

    return {
      id: this.generateId(),
      type: 'guidance',
      targetWorker: indicator.workerId,
      targetTask: indicator.taskId,
      reason: `Worker appears stuck with ${indicator.reason}. Providing guidance to help progress.`,
      prompt,
      createdAt: new Date(),
      status: 'pending'
    };
  }

  /**
   * Create a takeover intervention where Oracle assumes control
   */
  private createTakeoverIntervention(indicator: StuckIndicator, context: OracleContext): Intervention {
    const task = this.findTask(indicator.taskId, context);
    const worker = this.findWorker(indicator.workerId, context);

    const prompt = this.buildTakeoverPrompt(indicator, task, worker, context);

    return {
      id: this.generateId(),
      type: 'takeover',
      targetWorker: indicator.workerId,
      targetTask: indicator.taskId,
      reason: `Worker stuck for ${Math.round(indicator.duration / 60000)} minutes with high confidence (${indicator.confidence}). Oracle taking over task completion.`,
      prompt,
      createdAt: new Date(),
      status: 'pending'
    };
  }

  /**
   * Create a reassignment intervention to move task to available worker
   */
  private createReassignIntervention(indicator: StuckIndicator, context: OracleContext): Intervention {
    const availableWorker = this.findAvailableWorker(indicator, context);
    const task = this.findTask(indicator.taskId, context);

    return {
      id: this.generateId(),
      type: 'reassign',
      targetWorker: availableWorker?.id || 'unknown',
      targetTask: indicator.taskId,
      reason: `Reassigning task from stuck worker ${indicator.workerId} to available worker ${availableWorker?.name || 'TBD'}. Original issue: ${indicator.reason}.`,
      prompt: this.buildReassignPrompt(indicator, task, availableWorker, context),
      createdAt: new Date(),
      status: 'pending'
    };
  }

  /**
   * Create a skip intervention to bypass problematic task
   */
  private createSkipIntervention(indicator: StuckIndicator, _context: OracleContext): Intervention {
    return {
      id: this.generateId(),
      type: 'skip',
      targetWorker: indicator.workerId,
      targetTask: indicator.taskId,
      reason: `Task has timed out after ${Math.round(indicator.duration / 60000)} minutes. Skipping to prevent blocking other tasks. Issue: ${indicator.reason}${indicator.errorPattern ? ` (${indicator.errorPattern})` : ''}.`,
      createdAt: new Date(),
      status: 'pending'
    };
  }

  /**
   * Build a context-aware guidance prompt
   */
  private buildGuidancePrompt(
    indicator: StuckIndicator,
    task: TaskContext | null,
    _worker: WorkerContext | null,
    context: OracleContext
  ): string {
    const lines: string[] = [];

    lines.push('# Oracle Guidance');
    lines.push('');
    lines.push('## Current Situation');
    lines.push(`You are working on: ${task?.title || 'Unknown task'}`);
    lines.push(`Status: Stuck (${indicator.reason})`);
    lines.push(`Duration: ${Math.round(indicator.duration / 60000)} minutes`);
    lines.push('');

    if (indicator.errorPattern) {
      lines.push('## Error Pattern Detected');
      lines.push(indicator.errorPattern);
      lines.push('');
    }

    if (task?.lastError) {
      lines.push('## Last Error');
      lines.push(task.lastError);
      lines.push('');
    }

    lines.push('## Project Context');
    lines.push(`Mission: ${context.product.mission}`);
    lines.push(`Tech Stack: ${context.product.techStack.join(', ')}`);
    lines.push('');

    lines.push('## Suggested Actions');
    lines.push('');

    // Provide specific guidance based on reason
    switch (indicator.reason) {
      case 'no_progress':
        lines.push('1. Review the task requirements and ensure you understand what needs to be done');
        lines.push('2. Check if there are any missing dependencies or prerequisite tasks');
        lines.push('3. Break down the task into smaller, manageable steps');
        lines.push('4. Verify that your approach aligns with the project patterns');
        break;

      case 'repeated_errors':
        lines.push('1. Analyze the error pattern - is it the same error repeating?');
        lines.push('2. Try a different approach instead of repeating the same action');
        lines.push('3. Check if the error indicates a missing dependency or configuration');
        lines.push('4. Consult the tech stack documentation for guidance');
        break;

      case 'timeout':
        lines.push('1. The task may be too large - consider breaking it into smaller pieces');
        lines.push('2. Check if you are waiting for external resources that are unavailable');
        lines.push('3. Review your implementation approach for efficiency');
        lines.push('4. Consider whether this task should be reassigned or escalated');
        break;

      case 'explicit_stuck':
        lines.push('1. Review why you marked yourself as stuck');
        lines.push('2. Check the task acceptance criteria for clarity');
        lines.push('3. Look at similar completed tasks for reference');
        lines.push('4. Consider reaching out to the Oracle for takeover if truly blocked');
        break;
    }

    lines.push('');
    lines.push('## Available Resources');
    if (context.product.patterns.length > 0) {
      lines.push('Project patterns you should follow:');
      context.product.patterns.forEach(pattern => {
        lines.push(`- ${pattern}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Build a takeover prompt with full context
   */
  private buildTakeoverPrompt(
    indicator: StuckIndicator,
    task: TaskContext | null,
    worker: WorkerContext | null,
    context: OracleContext
  ): string {
    const lines: string[] = [];

    lines.push('# Oracle Takeover Mission');
    lines.push('');
    lines.push('You are the Oracle, assuming control of a stuck task.');
    lines.push('');

    lines.push('## Project Mission');
    lines.push(context.product.mission);
    lines.push('');

    lines.push('## Tech Stack');
    lines.push(context.product.techStack.join(', '));
    lines.push('');

    lines.push('## Task to Complete');
    lines.push(`ID: ${task?.id || indicator.taskId}`);
    lines.push(`Title: ${task?.title || 'Unknown'}`);
    lines.push(`Status: ${task?.status || 'unknown'}`);
    lines.push(`Attempts: ${task?.attempts || 0}`);
    lines.push('');

    if (task?.lastError) {
      lines.push('## Previous Error');
      lines.push(task.lastError);
      lines.push('');
    }

    if (indicator.errorPattern) {
      lines.push('## Error Pattern');
      lines.push(indicator.errorPattern);
      lines.push('');
    }

    lines.push('## Context from Stuck Worker');
    lines.push(`Worker was stuck for: ${Math.round(indicator.duration / 60000)} minutes`);
    lines.push(`Reason: ${indicator.reason}`);
    lines.push(`Confidence: ${Math.round(indicator.confidence * 100)}%`);
    lines.push('');

    if (worker?.recentActivity && worker.recentActivity.length > 0) {
      lines.push('## Recent Worker Activity');
      worker.recentActivity.slice(-5).forEach(activity => {
        lines.push(`- [${activity.type}] ${activity.message}`);
      });
      lines.push('');
    }

    lines.push('## Project Patterns to Follow');
    context.product.patterns.forEach(pattern => {
      lines.push(`- ${pattern}`);
    });
    lines.push('');

    lines.push('## Your Mission');
    lines.push('1. Analyze the task requirements and previous attempts');
    lines.push('2. Implement a complete solution following project patterns');
    lines.push('3. Verify your implementation meets acceptance criteria');
    lines.push('4. Document any important decisions or changes');
    lines.push('');
    lines.push('Complete this task fully and mark it as done.');

    return lines.join('\n');
  }

  /**
   * Build a reassignment prompt for new worker
   */
  private buildReassignPrompt(
    indicator: StuckIndicator,
    task: TaskContext | null,
    newWorker: WorkerContext | null,
    context: OracleContext
  ): string {
    const lines: string[] = [];

    lines.push('# Task Reassignment Notice');
    lines.push('');
    lines.push(`You (${newWorker?.name || 'Worker'}) are being assigned a task that another worker was unable to complete.`);
    lines.push('');

    lines.push('## Task Details');
    lines.push(`ID: ${task?.id || indicator.taskId}`);
    lines.push(`Title: ${task?.title || 'Unknown'}`);
    lines.push(`Previous attempts: ${task?.attempts || 0}`);
    lines.push('');

    lines.push('## Why Reassigned');
    lines.push(`Previous worker: ${indicator.workerId}`);
    lines.push(`Issue: ${indicator.reason}`);
    lines.push(`Stuck duration: ${Math.round(indicator.duration / 60000)} minutes`);
    lines.push('');

    if (task?.lastError) {
      lines.push('## Previous Error');
      lines.push(task.lastError);
      lines.push('');
      lines.push('Learn from this error and try a different approach.');
      lines.push('');
    }

    lines.push('## Fresh Start Guidelines');
    lines.push('1. Review the task requirements with fresh eyes');
    lines.push('2. Do not repeat the approach that led to the previous failure');
    lines.push('3. Follow project patterns and tech stack guidelines');
    lines.push('4. If you encounter similar issues, escalate immediately');
    lines.push('');

    lines.push('## Project Context');
    lines.push(`Mission: ${context.product.mission}`);
    lines.push(`Tech Stack: ${context.product.techStack.join(', ')}`);

    return lines.join('\n');
  }

  /**
   * Check if there's an available worker that can handle the task
   */
  private hasAvailableWorker(indicator: StuckIndicator, context: OracleContext): boolean {
    return this.findAvailableWorker(indicator, context) !== null;
  }

  /**
   * Find an available worker for reassignment
   */
  private findAvailableWorker(indicator: StuckIndicator, context: OracleContext): WorkerContext | null {
    // Find idle workers that are not the stuck worker
    const availableWorkers = context.workers.filter(
      w => w.status === 'idle' && w.id !== indicator.workerId
    );

    // Return first available worker, or null if none
    return availableWorkers.length > 0 ? availableWorkers[0] : null;
  }

  /**
   * Find a task by ID in the context
   */
  private findTask(taskId: string, context: OracleContext): TaskContext | null {
    for (const spec of context.specs) {
      const task = spec.tasks.find(t => t.id === taskId);
      if (task) {
        return task;
      }
    }
    return null;
  }

  /**
   * Find a worker by ID in the context
   */
  private findWorker(workerId: string, context: OracleContext): WorkerContext | null {
    return context.workers.find(w => w.id === workerId) || null;
  }

  /**
   * Generate a unique intervention ID
   */
  private generateId(): string {
    return `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
