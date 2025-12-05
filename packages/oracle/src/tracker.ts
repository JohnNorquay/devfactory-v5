import { Intervention, StuckIndicator } from './types.js';
import { promises as fs } from 'fs';
import * as lockfile from 'proper-lockfile';
import { dirname } from 'path';

export interface TrackedIntervention extends Intervention {
  indicator: StuckIndicator;
  executedAt?: Date;
  completedAt?: Date;
  duration?: number;
  success?: boolean;
  notes?: string;
}

export interface InterventionStats {
  total: number;
  byType: Record<string, number>;
  byWorker: Record<string, number>;
  successRate: number;
  averageDuration: number;
  mostCommonReasons: Array<{ reason: string; count: number }>;
}

interface SerializedIntervention {
  id: string;
  type: string;
  targetWorker: string;
  targetTask: string;
  reason: string;
  prompt?: string;
  createdAt: string;
  status: string;
  result?: string;
  indicator: {
    workerId: string;
    taskId: string;
    reason: string;
    duration: number;
    errorPattern?: string;
    confidence: number;
  };
  executedAt?: string;
  completedAt?: string;
  duration?: number;
  success?: boolean;
  notes?: string;
}

export class InterventionTracker {
  private interventions: Map<string, TrackedIntervention> = new Map();
  private persistPath?: string;
  private isLoading = false;

  constructor(persistPath?: string) {
    this.persistPath = persistPath;
    if (persistPath) {
      this.loadFromDisk().catch(err => {
        console.error('Failed to load interventions from disk:', err);
      });
    }
  }

  /**
   * Track a new intervention
   */
  track(intervention: Intervention, indicator: StuckIndicator): TrackedIntervention {
    const tracked: TrackedIntervention = {
      ...intervention,
      indicator
    };
    this.interventions.set(intervention.id, tracked);
    this.persistToDisk().catch(err => {
      console.error('Failed to persist intervention:', err);
    });
    return tracked;
  }

  /**
   * Mark intervention as started
   */
  markExecuted(interventionId: string): void {
    const intervention = this.interventions.get(interventionId);
    if (intervention) {
      intervention.executedAt = new Date();
      intervention.status = 'executing';
      this.persistToDisk().catch(err => {
        console.error('Failed to persist intervention execution:', err);
      });
    }
  }

  /**
   * Mark intervention as completed
   */
  markCompleted(interventionId: string, success: boolean, notes?: string): void {
    const intervention = this.interventions.get(interventionId);
    if (intervention) {
      intervention.completedAt = new Date();
      intervention.status = success ? 'completed' : 'failed';
      intervention.success = success;
      intervention.notes = notes;
      if (intervention.executedAt) {
        intervention.duration = intervention.completedAt.getTime() - intervention.executedAt.getTime();
      }
      this.persistToDisk().catch(err => {
        console.error('Failed to persist intervention completion:', err);
      });
    }
  }

  /**
   * Get intervention by ID
   */
  get(interventionId: string): TrackedIntervention | undefined {
    return this.interventions.get(interventionId);
  }

  /**
   * Get all interventions for a worker
   */
  getForWorker(workerId: string): TrackedIntervention[] {
    return Array.from(this.interventions.values())
      .filter(i => i.targetWorker === workerId);
  }

  /**
   * Get recent interventions
   */
  getRecent(limit: number = 10): TrackedIntervention[] {
    return Array.from(this.interventions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get statistics about interventions
   */
  getStats(): InterventionStats {
    const all = Array.from(this.interventions.values());
    const completed = all.filter(i => i.completedAt);
    const successful = completed.filter(i => i.success);

    // Calculate stats
    const byType: Record<string, number> = {};
    const byWorker: Record<string, number> = {};
    const reasonCounts: Record<string, number> = {};

    for (const i of all) {
      byType[i.type] = (byType[i.type] || 0) + 1;
      byWorker[i.targetWorker] = (byWorker[i.targetWorker] || 0) + 1;
      reasonCounts[i.indicator.reason] = (reasonCounts[i.indicator.reason] || 0) + 1;
    }

    const mostCommonReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    const totalDuration = completed
      .filter(i => i.duration)
      .reduce((sum, i) => sum + (i.duration || 0), 0);

    return {
      total: all.length,
      byType,
      byWorker,
      successRate: completed.length > 0 ? successful.length / completed.length : 0,
      averageDuration: completed.length > 0 ? totalDuration / completed.length : 0,
      mostCommonReasons
    };
  }

  /**
   * Clear old interventions (older than N days)
   */
  cleanup(maxAgeDays: number = 7): number {
    const cutoff = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
    let removed = 0;
    for (const [id, intervention] of this.interventions) {
      if (intervention.createdAt.getTime() < cutoff) {
        this.interventions.delete(id);
        removed++;
      }
    }
    if (removed > 0) {
      this.persistToDisk().catch(err => {
        console.error('Failed to persist after cleanup:', err);
      });
    }
    return removed;
  }

  /**
   * Persist to disk with file locking for concurrent access safety
   */
  private async persistToDisk(): Promise<void> {
    if (!this.persistPath || this.isLoading) return;

    try {
      // Ensure directory exists
      await fs.mkdir(dirname(this.persistPath), { recursive: true });

      // Serialize interventions
      const serialized: SerializedIntervention[] = Array.from(this.interventions.values()).map(i => ({
        id: i.id,
        type: i.type,
        targetWorker: i.targetWorker,
        targetTask: i.targetTask,
        reason: i.reason,
        prompt: i.prompt,
        createdAt: i.createdAt.toISOString(),
        status: i.status,
        result: i.result,
        indicator: {
          workerId: i.indicator.workerId,
          taskId: i.indicator.taskId,
          reason: i.indicator.reason,
          duration: i.indicator.duration,
          errorPattern: i.indicator.errorPattern,
          confidence: i.indicator.confidence
        },
        executedAt: i.executedAt?.toISOString(),
        completedAt: i.completedAt?.toISOString(),
        duration: i.duration,
        success: i.success,
        notes: i.notes
      }));

      const data = JSON.stringify(serialized, null, 2);

      // Check if file exists first
      try {
        await fs.access(this.persistPath);
      } catch {
        // File doesn't exist, write without lock
        await fs.writeFile(this.persistPath, data, 'utf-8');
        return;
      }

      // File exists, use lock
      let release: (() => Promise<void>) | null = null;
      try {
        release = await lockfile.lock(this.persistPath, {
          retries: {
            retries: 5,
            minTimeout: 100,
            maxTimeout: 500
          },
          stale: 10000
        });

        await fs.writeFile(this.persistPath, data, 'utf-8');
      } finally {
        if (release) {
          await release();
        }
      }
    } catch (err) {
      // If lockfile fails, try without lock (better than nothing)
      if (err && typeof err === 'object' && 'code' in err && err.code === 'ELOCKED') {
        console.warn('Could not acquire lock, writing without lock');
        const serialized: SerializedIntervention[] = Array.from(this.interventions.values()).map(i => ({
          id: i.id,
          type: i.type,
          targetWorker: i.targetWorker,
          targetTask: i.targetTask,
          reason: i.reason,
          prompt: i.prompt,
          createdAt: i.createdAt.toISOString(),
          status: i.status,
          result: i.result,
          indicator: {
            workerId: i.indicator.workerId,
            taskId: i.indicator.taskId,
            reason: i.indicator.reason,
            duration: i.indicator.duration,
            errorPattern: i.indicator.errorPattern,
            confidence: i.indicator.confidence
          },
          executedAt: i.executedAt?.toISOString(),
          completedAt: i.completedAt?.toISOString(),
          duration: i.duration,
          success: i.success,
          notes: i.notes
        }));
        await fs.writeFile(this.persistPath, JSON.stringify(serialized, null, 2), 'utf-8');
      } else {
        throw err;
      }
    }
  }

  /**
   * Load from disk, handling missing file gracefully
   */
  private async loadFromDisk(): Promise<void> {
    if (!this.persistPath) return;

    this.isLoading = true;
    try {
      // Check if file exists
      try {
        await fs.access(this.persistPath);
      } catch {
        // File doesn't exist, nothing to load
        this.isLoading = false;
        return;
      }

      // Try to acquire lock
      let release: (() => Promise<void>) | null = null;
      let data: string;

      try {
        release = await lockfile.lock(this.persistPath, {
          retries: {
            retries: 3,
            minTimeout: 100,
            maxTimeout: 500
          },
          stale: 10000
        });

        data = await fs.readFile(this.persistPath, 'utf-8');
      } catch (err) {
        // If lock fails, try reading without lock
        if (err && typeof err === 'object' && 'code' in err && err.code === 'ELOCKED') {
          console.warn('Could not acquire lock for reading, reading without lock');
          data = await fs.readFile(this.persistPath, 'utf-8');
        } else {
          throw err;
        }
      } finally {
        if (release) {
          await release();
        }
      }

      // Parse and deserialize
      if (data.trim()) {
        const serialized: SerializedIntervention[] = JSON.parse(data);
        this.interventions.clear();

        for (const s of serialized) {
          const intervention: TrackedIntervention = {
            id: s.id,
            type: s.type as Intervention['type'],
            targetWorker: s.targetWorker,
            targetTask: s.targetTask,
            reason: s.reason,
            prompt: s.prompt,
            createdAt: new Date(s.createdAt),
            status: s.status as Intervention['status'],
            result: s.result,
            indicator: {
              workerId: s.indicator.workerId,
              taskId: s.indicator.taskId,
              reason: s.indicator.reason as StuckIndicator['reason'],
              duration: s.indicator.duration,
              errorPattern: s.indicator.errorPattern,
              confidence: s.indicator.confidence
            },
            executedAt: s.executedAt ? new Date(s.executedAt) : undefined,
            completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
            duration: s.duration,
            success: s.success,
            notes: s.notes
          };
          this.interventions.set(intervention.id, intervention);
        }
      }
    } catch (err) {
      console.error('Failed to load interventions from disk:', err);
      // Don't throw - gracefully handle corruption
    } finally {
      this.isLoading = false;
    }
  }
}
