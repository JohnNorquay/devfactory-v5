import { Intervention, OracleContext, TaskContext } from './types.js';

export interface TakeoverSession {
  id: string;
  interventionId: string;
  workerId: string;
  taskId: string;
  startedAt: Date;
  status: 'preparing' | 'executing' | 'completed' | 'failed';
  prompt: string;
  result?: string;
  error?: string;
  attempts: number;
  maxAttempts: number;
}

export interface TakeoverConfig {
  maxAttempts: number;           // Default: 3
  timeoutMs: number;             // Default: 10 minutes
  pauseWorkerDuringTakeover: boolean;  // Default: true
}

export class TakeoverManager {
  private config: TakeoverConfig;
  private activeSessions: Map<string, TakeoverSession> = new Map();

  constructor(config?: Partial<TakeoverConfig>) {
    this.config = {
      maxAttempts: 3,
      timeoutMs: 10 * 60 * 1000,
      pauseWorkerDuringTakeover: true,
      ...config
    };
  }

  /**
   * Create a new takeover session from an intervention
   */
  createSession(intervention: Intervention, context: OracleContext): TakeoverSession {
    // Validate intervention is type 'takeover'
    if (intervention.type !== 'takeover') {
      throw new Error(`Cannot create takeover session from intervention type: ${intervention.type}`);
    }

    // Generate the comprehensive takeover prompt
    const prompt = this.generateTakeoverPrompt(intervention, context);

    // Create the session
    const session: TakeoverSession = {
      id: this.generateSessionId(),
      interventionId: intervention.id,
      workerId: intervention.targetWorker,
      taskId: intervention.targetTask,
      startedAt: new Date(),
      status: 'preparing',
      prompt,
      attempts: 0,
      maxAttempts: this.config.maxAttempts
    };

    // Store in active sessions
    this.activeSessions.set(session.id, session);

    return session;
  }

  /**
   * Generate the takeover prompt with full context
   * This is where the Oracle shows its power - comprehensive project understanding
   */
  generateTakeoverPrompt(intervention: Intervention, context: OracleContext): string {
    const worker = context.workers.find(w => w.id === intervention.targetWorker);
    const task = this.findTask(intervention.targetTask, context);
    const spec = this.findSpecForTask(intervention.targetTask, context);

    const sections: string[] = [];

    // Header
    sections.push('# Oracle Takeover - Direct Intervention Required');
    sections.push('');
    sections.push('The Oracle has detected that a worker is stuck and needs direct assistance.');
    sections.push('You are now operating with full project context and authority to complete this task.');
    sections.push('');

    // Project Mission
    sections.push('## Project Mission');
    sections.push(context.product.mission);
    sections.push('');

    // Tech Stack
    sections.push('## Tech Stack');
    context.product.techStack.forEach(tech => {
      sections.push(`- ${tech}`);
    });
    sections.push('');

    // Architecture Patterns
    if (context.product.patterns.length > 0) {
      sections.push('## Architecture Patterns & Conventions');
      context.product.patterns.forEach(pattern => {
        sections.push(`- ${pattern}`);
      });
      sections.push('');
    }

    // Current Spec Context
    if (spec) {
      sections.push('## Current Specification');
      sections.push(`**Spec**: ${spec.name} (Phase: ${spec.phase})`);
      sections.push('');
      sections.push('**Acceptance Criteria**:');
      spec.acceptanceCriteria.forEach(criteria => {
        sections.push(`- ${criteria}`);
      });
      sections.push('');
    }

    // The Stuck Task
    if (task) {
      sections.push('## Task to Complete');
      sections.push(`**Task ID**: ${task.id}`);
      sections.push(`**Title**: ${task.title}`);
      sections.push(`**Status**: ${task.status}`);
      sections.push(`**Attempts**: ${task.attempts}`);
      if (task.startedAt) {
        const duration = new Date().getTime() - task.startedAt.getTime();
        sections.push(`**Duration**: ${Math.round(duration / 1000 / 60)} minutes`);
      }
      sections.push('');
    }

    // Worker's Struggle - What Went Wrong
    sections.push('## What the Worker Tried (and Why It Failed)');
    if (worker) {
      sections.push(`**Worker**: ${worker.name} (${worker.id})`);
      sections.push(`**Status**: ${worker.status}`);
      if (worker.stuckDuration) {
        sections.push(`**Stuck Duration**: ${Math.round(worker.stuckDuration / 1000 / 60)} minutes`);
      }
      sections.push('');

      if (worker.recentActivity.length > 0) {
        sections.push('**Recent Activity**:');
        worker.recentActivity.slice(-5).forEach(activity => {
          const timestamp = activity.timestamp.toISOString();
          sections.push(`- [${timestamp}] ${activity.type}: ${activity.message}`);
        });
        sections.push('');
      }
    }

    if (task?.lastError) {
      sections.push('**Last Error**:');
      sections.push('```');
      sections.push(task.lastError);
      sections.push('```');
      sections.push('');
    }

    // Intervention Reason
    sections.push('## Oracle Analysis');
    sections.push(intervention.reason);
    sections.push('');

    // Related Tasks Context
    if (spec) {
      const relatedTasks = spec.tasks.filter(t =>
        t.id !== intervention.targetTask &&
        (t.status === 'completed' || t.status === 'in_progress')
      );

      if (relatedTasks.length > 0) {
        sections.push('## Related Tasks in This Spec');
        relatedTasks.forEach(t => {
          sections.push(`- [${t.status}] ${t.title}`);
        });
        sections.push('');
      }
    }

    // Project State
    sections.push('## Overall Project State');
    sections.push(`**Status**: ${context.currentState.status}`);
    sections.push(`**Progress**: ${context.currentState.completedTasks}/${context.currentState.totalTasks} tasks`);
    if (context.currentState.activeSpec) {
      sections.push(`**Active Spec**: ${context.currentState.activeSpec}`);
    }
    sections.push('');

    // Success Criteria
    sections.push('## Success Criteria for This Takeover');
    sections.push('To complete this intervention successfully, you must:');
    sections.push('');
    sections.push('1. **Understand the Root Cause**: Identify why the worker got stuck');
    sections.push('2. **Complete the Task**: Implement the solution that satisfies the task requirements');
    sections.push('3. **Follow Patterns**: Adhere to the established architecture patterns and tech stack');
    sections.push('4. **Verify Quality**: Ensure the implementation meets the spec\'s acceptance criteria');
    sections.push('5. **Document Changes**: Provide clear explanation of what was done and why');
    sections.push('');

    // Clear Instructions
    sections.push('## Your Instructions');
    sections.push('');
    sections.push('You have full authority to:');
    sections.push('- Read any files in the codebase');
    sections.push('- Make any necessary code changes');
    sections.push('- Run tests and verify functionality');
    sections.push('- Install dependencies if needed');
    sections.push('- Modify architecture if truly necessary (with justification)');
    sections.push('');
    sections.push('**Proceed with confidence and complete this task.**');
    sections.push('');
    sections.push('Report back with:');
    sections.push('1. Root cause analysis');
    sections.push('2. Solution implemented');
    sections.push('3. Verification results');
    sections.push('4. Any follow-up recommendations');

    return sections.join('\n');
  }

  /**
   * Execute the takeover (placeholder - actual Claude API call would go here)
   */
  async executeTakeover(sessionId: string): Promise<TakeoverSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Update session status
    session.status = 'executing';
    session.attempts += 1;

    // In production, this would:
    // 1. Call Claude API with the comprehensive prompt
    // 2. Stream the response back
    // 3. Allow Claude to use tools (file read/write, bash, etc.)
    // 4. Capture the final result

    // For now, we just mark it as executing
    // The actual execution happens externally via Claude API

    return session;
  }

  /**
   * Mark takeover as completed
   */
  completeSession(sessionId: string, result: string): TakeoverSession {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'completed';
    session.result = result;

    return session;
  }

  /**
   * Mark takeover as failed
   */
  failSession(sessionId: string, error: string): TakeoverSession {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'failed';
    session.error = error;

    // Check if we should retry
    if (session.attempts < session.maxAttempts) {
      // Session can be retried - keep it in preparing state
      session.status = 'preparing';
    }

    return session;
  }

  /**
   * Get active session for a worker
   */
  getSessionForWorker(workerId: string): TakeoverSession | undefined {
    for (const session of this.activeSessions.values()) {
      if (session.workerId === workerId &&
          (session.status === 'preparing' || session.status === 'executing')) {
        return session;
      }
    }
    return undefined;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): TakeoverSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Clean up completed sessions
   */
  cleanupSessions(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const [sessionId, session] of this.activeSessions.entries()) {
      // Remove completed/failed sessions older than 1 hour
      if ((session.status === 'completed' || session.status === 'failed') &&
          session.startedAt < oneHourAgo) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `takeover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Find a task by ID across all specs
   */
  private findTask(taskId: string, context: OracleContext): TaskContext | undefined {
    for (const spec of context.specs) {
      const task = spec.tasks.find(t => t.id === taskId);
      if (task) return task;
    }
    return undefined;
  }

  /**
   * Find the spec that contains a given task
   */
  private findSpecForTask(taskId: string, context: OracleContext) {
    return context.specs.find(spec =>
      spec.tasks.some(t => t.id === taskId)
    );
  }
}
