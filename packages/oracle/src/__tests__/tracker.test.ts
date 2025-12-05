import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InterventionTracker, TrackedIntervention } from '../tracker.js';
import { Intervention, StuckIndicator } from '../types.js';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('InterventionTracker', () => {
  let tracker: InterventionTracker;
  let testPersistPath: string;

  beforeEach(() => {
    tracker = new InterventionTracker();
    // Create unique test file path
    testPersistPath = join(tmpdir(), `test-interventions-${Date.now()}-${Math.random()}.json`);
  });

  afterEach(async () => {
    // Clean up test file
    try {
      await fs.unlink(testPersistPath);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  describe('track', () => {
    it('should track a new intervention', () => {
      const intervention = createMockIntervention('int-1');
      const indicator = createMockIndicator();

      const tracked = tracker.track(intervention, indicator);

      expect(tracked).toBeDefined();
      expect(tracked.id).toBe('int-1');
      expect(tracked.indicator).toEqual(indicator);
      expect(tracked.status).toBe('pending');
    });

    it('should store tracked intervention', () => {
      const intervention = createMockIntervention('int-1');
      const indicator = createMockIndicator();

      tracker.track(intervention, indicator);
      const retrieved = tracker.get('int-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('int-1');
    });

    it('should track multiple interventions', () => {
      const intervention1 = createMockIntervention('int-1');
      const intervention2 = createMockIntervention('int-2');
      const indicator = createMockIndicator();

      tracker.track(intervention1, indicator);
      tracker.track(intervention2, indicator);

      expect(tracker.get('int-1')).toBeDefined();
      expect(tracker.get('int-2')).toBeDefined();
    });
  });

  describe('markExecuted', () => {
    it('should mark intervention as executed', () => {
      const intervention = createMockIntervention('int-1');
      const indicator = createMockIndicator();

      tracker.track(intervention, indicator);
      tracker.markExecuted('int-1');

      const tracked = tracker.get('int-1');
      expect(tracked?.status).toBe('executing');
      expect(tracked?.executedAt).toBeDefined();
      expect(tracked?.executedAt).toBeInstanceOf(Date);
    });

    it('should not throw for non-existent intervention', () => {
      expect(() => tracker.markExecuted('non-existent')).not.toThrow();
    });

    it('should update existing intervention', () => {
      const intervention = createMockIntervention('int-1');
      const indicator = createMockIndicator();

      tracker.track(intervention, indicator);
      const beforeExecution = tracker.get('int-1');
      expect(beforeExecution?.executedAt).toBeUndefined();

      tracker.markExecuted('int-1');
      const afterExecution = tracker.get('int-1');

      expect(afterExecution?.executedAt).toBeDefined();
      expect(afterExecution?.status).toBe('executing');
    });
  });

  describe('markCompleted', () => {
    it('should mark intervention as completed successfully', () => {
      const intervention = createMockIntervention('int-1');
      const indicator = createMockIndicator();

      tracker.track(intervention, indicator);
      tracker.markExecuted('int-1');
      tracker.markCompleted('int-1', true, 'All good');

      const tracked = tracker.get('int-1');
      expect(tracked?.status).toBe('completed');
      expect(tracked?.completedAt).toBeDefined();
      expect(tracked?.success).toBe(true);
      expect(tracked?.notes).toBe('All good');
    });

    it('should mark intervention as failed', () => {
      const intervention = createMockIntervention('int-1');
      const indicator = createMockIndicator();

      tracker.track(intervention, indicator);
      tracker.markExecuted('int-1');
      tracker.markCompleted('int-1', false, 'Failed due to error');

      const tracked = tracker.get('int-1');
      expect(tracked?.status).toBe('failed');
      expect(tracked?.success).toBe(false);
      expect(tracked?.notes).toBe('Failed due to error');
    });

    it('should calculate duration when executed', async () => {
      const intervention = createMockIntervention('int-1');
      const indicator = createMockIndicator();

      tracker.track(intervention, indicator);
      tracker.markExecuted('int-1');

      // Wait a bit to have measurable duration
      await new Promise(resolve => setTimeout(resolve, 100));

      tracker.markCompleted('int-1', true);
      const tracked = tracker.get('int-1');
      expect(tracked?.duration).toBeDefined();
      expect(tracked?.duration).toBeGreaterThan(0);
    });

    it('should not calculate duration if not executed', () => {
      const intervention = createMockIntervention('int-1');
      const indicator = createMockIndicator();

      tracker.track(intervention, indicator);
      tracker.markCompleted('int-1', true);

      const tracked = tracker.get('int-1');
      expect(tracked?.duration).toBeUndefined();
    });

    it('should not throw for non-existent intervention', () => {
      expect(() => tracker.markCompleted('non-existent', true)).not.toThrow();
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent intervention', () => {
      const result = tracker.get('non-existent');
      expect(result).toBeUndefined();
    });

    it('should return tracked intervention', () => {
      const intervention = createMockIntervention('int-1');
      const indicator = createMockIndicator();

      tracker.track(intervention, indicator);
      const result = tracker.get('int-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('int-1');
    });
  });

  describe('getForWorker', () => {
    it('should return all interventions for a worker', () => {
      const intervention1 = createMockIntervention('int-1', 'w1');
      const intervention2 = createMockIntervention('int-2', 'w1');
      const intervention3 = createMockIntervention('int-3', 'w2');
      const indicator = createMockIndicator();

      tracker.track(intervention1, indicator);
      tracker.track(intervention2, indicator);
      tracker.track(intervention3, indicator);

      const w1Interventions = tracker.getForWorker('w1');
      expect(w1Interventions).toHaveLength(2);
      expect(w1Interventions.every(i => i.targetWorker === 'w1')).toBe(true);
    });

    it('should return empty array for worker with no interventions', () => {
      const result = tracker.getForWorker('w-unknown');
      expect(result).toEqual([]);
    });

    it('should return empty array when no interventions tracked', () => {
      const result = tracker.getForWorker('w1');
      expect(result).toEqual([]);
    });
  });

  describe('getRecent', () => {
    it('should return recent interventions sorted by creation date', () => {
      const indicator = createMockIndicator();

      const intervention1 = createMockIntervention('int-1');
      intervention1.createdAt = new Date(Date.now() - 3 * 60 * 1000);

      const intervention2 = createMockIntervention('int-2');
      intervention2.createdAt = new Date(Date.now() - 2 * 60 * 1000);

      const intervention3 = createMockIntervention('int-3');
      intervention3.createdAt = new Date(Date.now() - 1 * 60 * 1000);

      tracker.track(intervention1, indicator);
      tracker.track(intervention2, indicator);
      tracker.track(intervention3, indicator);

      const recent = tracker.getRecent(10);
      expect(recent).toHaveLength(3);
      expect(recent[0].id).toBe('int-3'); // Most recent first
      expect(recent[1].id).toBe('int-2');
      expect(recent[2].id).toBe('int-1');
    });

    it('should limit results to specified count', () => {
      const indicator = createMockIndicator();

      for (let i = 0; i < 15; i++) {
        const intervention = createMockIntervention(`int-${i}`);
        tracker.track(intervention, indicator);
      }

      const recent = tracker.getRecent(5);
      expect(recent).toHaveLength(5);
    });

    it('should default to 10 results', () => {
      const indicator = createMockIndicator();

      for (let i = 0; i < 20; i++) {
        const intervention = createMockIntervention(`int-${i}`);
        tracker.track(intervention, indicator);
      }

      const recent = tracker.getRecent();
      expect(recent).toHaveLength(10);
    });

    it('should return empty array when no interventions', () => {
      const recent = tracker.getRecent();
      expect(recent).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return zero stats for empty tracker', () => {
      const stats = tracker.getStats();

      expect(stats.total).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.byType).toEqual({});
      expect(stats.byWorker).toEqual({});
      expect(stats.mostCommonReasons).toEqual([]);
    });

    it('should calculate total interventions', () => {
      const indicator = createMockIndicator();

      for (let i = 0; i < 5; i++) {
        tracker.track(createMockIntervention(`int-${i}`), indicator);
      }

      const stats = tracker.getStats();
      expect(stats.total).toBe(5);
    });

    it('should calculate interventions by type', () => {
      const indicator = createMockIndicator();

      tracker.track(createMockIntervention('int-1', 'w1', 'guidance'), indicator);
      tracker.track(createMockIntervention('int-2', 'w1', 'guidance'), indicator);
      tracker.track(createMockIntervention('int-3', 'w1', 'takeover'), indicator);
      tracker.track(createMockIntervention('int-4', 'w1', 'reassign'), indicator);

      const stats = tracker.getStats();
      expect(stats.byType.guidance).toBe(2);
      expect(stats.byType.takeover).toBe(1);
      expect(stats.byType.reassign).toBe(1);
    });

    it('should calculate interventions by worker', () => {
      const indicator = createMockIndicator();

      tracker.track(createMockIntervention('int-1', 'w1'), indicator);
      tracker.track(createMockIntervention('int-2', 'w1'), indicator);
      tracker.track(createMockIntervention('int-3', 'w2'), indicator);

      const stats = tracker.getStats();
      expect(stats.byWorker.w1).toBe(2);
      expect(stats.byWorker.w2).toBe(1);
    });

    it('should calculate success rate', () => {
      const indicator = createMockIndicator();

      tracker.track(createMockIntervention('int-1'), indicator);
      tracker.track(createMockIntervention('int-2'), indicator);
      tracker.track(createMockIntervention('int-3'), indicator);
      tracker.track(createMockIntervention('int-4'), indicator);

      tracker.markExecuted('int-1');
      tracker.markCompleted('int-1', true);

      tracker.markExecuted('int-2');
      tracker.markCompleted('int-2', true);

      tracker.markExecuted('int-3');
      tracker.markCompleted('int-3', false);

      // int-4 not completed

      const stats = tracker.getStats();
      expect(stats.successRate).toBeCloseTo(2 / 3); // 2 successful out of 3 completed
    });

    it('should calculate average duration', () => {
      const indicator = createMockIndicator();

      tracker.track(createMockIntervention('int-1'), indicator);
      tracker.track(createMockIntervention('int-2'), indicator);

      const tracked1 = tracker.get('int-1')!;
      tracked1.executedAt = new Date(Date.now() - 1000);
      tracked1.completedAt = new Date();
      tracked1.duration = 1000;

      const tracked2 = tracker.get('int-2')!;
      tracked2.executedAt = new Date(Date.now() - 3000);
      tracked2.completedAt = new Date();
      tracked2.duration = 3000;

      const stats = tracker.getStats();
      expect(stats.averageDuration).toBe(2000); // (1000 + 3000) / 2
    });

    it('should list most common reasons sorted by count', () => {
      const indicator1 = createMockIndicator('no_progress');
      const indicator2 = createMockIndicator('no_progress');
      const indicator3 = createMockIndicator('repeated_errors');
      const indicator4 = createMockIndicator('timeout');
      const indicator5 = createMockIndicator('timeout');
      const indicator6 = createMockIndicator('timeout');

      tracker.track(createMockIntervention('int-1'), indicator1);
      tracker.track(createMockIntervention('int-2'), indicator2);
      tracker.track(createMockIntervention('int-3'), indicator3);
      tracker.track(createMockIntervention('int-4'), indicator4);
      tracker.track(createMockIntervention('int-5'), indicator5);
      tracker.track(createMockIntervention('int-6'), indicator6);

      const stats = tracker.getStats();
      expect(stats.mostCommonReasons).toHaveLength(3);
      expect(stats.mostCommonReasons[0].reason).toBe('timeout');
      expect(stats.mostCommonReasons[0].count).toBe(3);
      expect(stats.mostCommonReasons[1].reason).toBe('no_progress');
      expect(stats.mostCommonReasons[1].count).toBe(2);
    });
  });

  describe('cleanup', () => {
    it('should remove old interventions', () => {
      const indicator = createMockIndicator();

      const oldIntervention = createMockIntervention('int-old');
      oldIntervention.createdAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

      const recentIntervention = createMockIntervention('int-recent');
      recentIntervention.createdAt = new Date();

      tracker.track(oldIntervention, indicator);
      tracker.track(recentIntervention, indicator);

      const removed = tracker.cleanup(7); // Remove interventions older than 7 days

      expect(removed).toBe(1);
      expect(tracker.get('int-old')).toBeUndefined();
      expect(tracker.get('int-recent')).toBeDefined();
    });

    it('should not remove recent interventions', () => {
      const indicator = createMockIndicator();

      const intervention = createMockIntervention('int-1');
      intervention.createdAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

      tracker.track(intervention, indicator);
      const removed = tracker.cleanup(7);

      expect(removed).toBe(0);
      expect(tracker.get('int-1')).toBeDefined();
    });

    it('should use custom max age', () => {
      const indicator = createMockIndicator();

      const intervention = createMockIntervention('int-1');
      intervention.createdAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

      tracker.track(intervention, indicator);
      const removed = tracker.cleanup(1); // Remove interventions older than 1 day

      expect(removed).toBe(1);
      expect(tracker.get('int-1')).toBeUndefined();
    });

    it('should return zero when nothing to cleanup', () => {
      const removed = tracker.cleanup(7);
      expect(removed).toBe(0);
    });
  });

  describe('persistence', () => {
    it('should track interventions without persistence path', () => {
      // Test basic tracking without persistence
      const nonPersistTracker = new InterventionTracker();
      const intervention = createMockIntervention('int-1');
      const indicator = createMockIndicator();

      nonPersistTracker.track(intervention, indicator);
      const tracked = nonPersistTracker.get('int-1');

      expect(tracked).toBeDefined();
      expect(tracked?.id).toBe('int-1');
    });

    it('should accept persistence path in constructor', () => {
      // Just verify constructor doesn't throw with persist path
      expect(() => new InterventionTracker(testPersistPath)).not.toThrow();
    });

    it('should handle missing persist file gracefully', () => {
      const nonExistentPath = join(tmpdir(), 'non-existent-file.json');

      // Should not throw
      expect(() => new InterventionTracker(nonExistentPath)).not.toThrow();
    });

    it('should continue working after persistence errors', () => {
      // Use invalid path that will fail to write
      const invalidPath = '/invalid/path/that/does/not/exist/interventions.json';
      const errorTracker = new InterventionTracker(invalidPath);
      const intervention = createMockIntervention('int-1');
      const indicator = createMockIndicator();

      // Should not throw, just log error
      expect(() => errorTracker.track(intervention, indicator)).not.toThrow();

      // Should still track in memory
      expect(errorTracker.get('int-1')).toBeDefined();
    });

    it('should handle concurrent operations gracefully', () => {
      const tracker = new InterventionTracker();
      const indicator = createMockIndicator();

      // Create multiple interventions quickly
      for (let i = 0; i < 10; i++) {
        tracker.track(createMockIntervention(`int-${i}`), indicator);
      }

      // All should be tracked in memory
      const stats = tracker.getStats();
      expect(stats.total).toBe(10);
    });
  });

  describe('error handling', () => {
    it('should handle invalid persist path gracefully', () => {
      // Path that will fail to write
      const invalidPath = '/invalid/path/that/does/not/exist/interventions.json';

      // Should not throw during construction
      expect(() => new InterventionTracker(invalidPath)).not.toThrow();
    });

    it('should continue working without persistence on write error', async () => {
      const invalidPath = '/invalid/path/interventions.json';
      const errorTracker = new InterventionTracker(invalidPath);
      const intervention = createMockIntervention('int-1');
      const indicator = createMockIndicator();

      // Should not throw, just log error
      expect(() => errorTracker.track(intervention, indicator)).not.toThrow();

      // Should still track in memory
      expect(errorTracker.get('int-1')).toBeDefined();
    });
  });
});

// Helper functions
function createMockIntervention(
  id: string,
  targetWorker: string = 'w1',
  type: Intervention['type'] = 'guidance'
): Intervention {
  return {
    id,
    type,
    targetWorker,
    targetTask: 't1',
    reason: 'Test intervention',
    prompt: 'Test prompt',
    createdAt: new Date(),
    status: 'pending'
  };
}

function createMockIndicator(reason: StuckIndicator['reason'] = 'no_progress'): StuckIndicator {
  return {
    workerId: 'w1',
    taskId: 't1',
    reason,
    duration: 6 * 60 * 1000,
    confidence: 0.7
  };
}
