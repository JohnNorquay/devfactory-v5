import { ContextLoader } from './context-loader.js';
import { StuckDetector, StuckDetectorConfig } from './stuck-detector.js';
import { InterventionEngine } from './intervention.js';
import { TakeoverManager, TakeoverConfig } from './takeover.js';
import { InterventionTracker } from './tracker.js';
import { OracleContext, StuckIndicator, Intervention } from './types.js';

export interface OracleConfig {
  projectRoot: string;
  pollIntervalMs: number;           // Default: 30 seconds
  stuckDetector?: Partial<StuckDetectorConfig>;
  takeover?: Partial<TakeoverConfig>;
  persistPath?: string;             // Path for tracker persistence
}

export interface OracleEvents {
  onContextLoaded?: (context: OracleContext) => void;
  onStuckDetected?: (indicators: StuckIndicator[]) => void;
  onInterventionCreated?: (intervention: Intervention) => void;
  onInterventionCompleted?: (intervention: Intervention, success: boolean) => void;
  onError?: (error: Error) => void;
}

/**
 * Oracle is the main orchestrator for enhanced Beast Mode.
 * It monitors workers, detects stuck situations, and orchestrates interventions.
 */
export class Oracle {
  private config: OracleConfig;
  private events: OracleEvents;

  private contextLoader: ContextLoader;
  private stuckDetector: StuckDetector;
  private interventionEngine: InterventionEngine;
  private takeoverManager: TakeoverManager;
  private tracker: InterventionTracker;

  private context?: OracleContext;
  private isRunning: boolean = false;
  private pollTimer?: NodeJS.Timeout;

  constructor(config: OracleConfig, events?: OracleEvents) {
    this.config = config;
    this.events = events || {};

    // Initialize components
    this.contextLoader = new ContextLoader(config.projectRoot);
    this.stuckDetector = new StuckDetector(config.stuckDetector);
    this.interventionEngine = new InterventionEngine();
    this.takeoverManager = new TakeoverManager(config.takeover);
    this.tracker = new InterventionTracker(config.persistPath);
  }

  /**
   * Start the Oracle monitoring loop
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('[Oracle] Starting monitoring...');
    await this.runCycle();

    this.pollTimer = setInterval(() => {
      this.runCycle().catch(err => {
        this.events.onError?.(err);
      });
    }, this.config.pollIntervalMs);
  }

  /**
   * Stop the Oracle
   */
  stop(): void {
    this.isRunning = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
    console.log('[Oracle] Stopped monitoring');
  }

  /**
   * Run a single monitoring cycle
   */
  async runCycle(): Promise<void> {
    try {
      // 1. Load current context
      this.context = await this.contextLoader.loadContext();
      this.events.onContextLoaded?.(this.context);

      // 2. Detect stuck workers
      const stuckIndicators = this.stuckDetector.detectStuck(this.context.workers);
      if (stuckIndicators.length > 0) {
        console.log(`[Oracle] Detected ${stuckIndicators.length} stuck indicators`);
        this.events.onStuckDetected?.(stuckIndicators);

        // 3. Determine and execute interventions
        for (const indicator of stuckIndicators) {
          await this.handleStuckWorker(indicator);
        }
      }

      // 4. Check active takeovers
      await this.checkActiveTakeovers();

      // 5. Cleanup old sessions
      this.takeoverManager.cleanupSessions();

    } catch (error) {
      console.error('[Oracle] Error in monitoring cycle:', error);
      this.events.onError?.(error as Error);
    }
  }

  /**
   * Handle a stuck worker
   */
  private async handleStuckWorker(indicator: StuckIndicator): Promise<void> {
    if (!this.context) return;

    // Check if we already have an active intervention for this worker/task
    const existing = this.tracker.getForWorker(indicator.workerId)
      .find(i => i.targetTask === indicator.taskId && i.status !== 'completed' && i.status !== 'failed');

    if (existing) {
      console.log(`[Oracle] Already handling ${indicator.workerId}/${indicator.taskId}`);
      return;
    }

    // Determine intervention
    const intervention = this.interventionEngine.determineIntervention(indicator, this.context);
    if (!intervention) {
      console.log(`[Oracle] No intervention strategy for ${indicator.reason}`);
      return;
    }

    // Track the intervention
    this.tracker.track(intervention, indicator);
    this.events.onInterventionCreated?.(intervention);

    console.log(`[Oracle] Created ${intervention.type} intervention for ${indicator.workerId}`);

    // Execute based on type
    if (intervention.type === 'takeover') {
      try {
        const session = this.takeoverManager.createSession(intervention, this.context);
        console.log(`[Oracle] Created takeover session ${session.id}`);
      } catch (error) {
        console.error(`[Oracle] Failed to create takeover session:`, error);
        this.tracker.markCompleted(intervention.id, false, (error as Error).message);
        return;
      }
    }

    // Mark as executing
    this.tracker.markExecuted(intervention.id);
  }

  /**
   * Check and process active takeovers
   */
  private async checkActiveTakeovers(): Promise<void> {
    const sessions = this.takeoverManager.getActiveSessions();
    for (const session of sessions) {
      if (session.status === 'preparing') {
        try {
          // Execute the takeover
          await this.takeoverManager.executeTakeover(session.id);
        } catch (error) {
          console.error(`[Oracle] Failed to execute takeover ${session.id}:`, error);
          this.takeoverManager.failSession(session.id, (error as Error).message);

          // Mark intervention as failed
          this.tracker.markCompleted(session.interventionId, false, (error as Error).message);

          // Get the intervention for the event
          const intervention = this.tracker.get(session.interventionId);
          if (intervention) {
            this.events.onInterventionCompleted?.(intervention, false);
          }
        }
      }
    }
  }

  /**
   * Get current context (for external queries)
   */
  getContext(): OracleContext | undefined {
    return this.context;
  }

  /**
   * Get intervention stats
   */
  getStats() {
    return this.tracker.getStats();
  }

  /**
   * Get recent interventions
   */
  getRecentInterventions(limit?: number) {
    return this.tracker.getRecent(limit);
  }

  /**
   * Force a context reload
   */
  async refreshContext(): Promise<OracleContext> {
    this.context = await this.contextLoader.loadContext();
    return this.context;
  }

  /**
   * Check if Oracle is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get active takeover sessions
   */
  getActiveTakeovers() {
    return this.takeoverManager.getActiveSessions();
  }

  /**
   * Manually complete a takeover session
   */
  completeTakeover(sessionId: string, success: boolean, result?: string): void {
    const sessions = this.takeoverManager.getActiveSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error(`Takeover session ${sessionId} not found`);
    }

    if (success) {
      this.takeoverManager.completeSession(sessionId, result || 'Task completed successfully');
    } else {
      this.takeoverManager.failSession(sessionId, result || 'Task failed');
    }

    this.tracker.markCompleted(session.interventionId, success, result);

    // Get the intervention for the event
    const intervention = this.tracker.get(session.interventionId);
    if (intervention) {
      this.events.onInterventionCompleted?.(intervention, success);
    }
  }

  /**
   * Clean up old completed sessions
   */
  pruneOldSessions(): void {
    this.takeoverManager.cleanupSessions();
  }
}
