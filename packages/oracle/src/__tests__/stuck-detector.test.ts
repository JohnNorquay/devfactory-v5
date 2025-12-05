import { describe, it, expect, beforeEach } from 'vitest';
import { StuckDetector } from '../stuck-detector.js';
import { WorkerContext, ActivityEntry } from '../types.js';

describe('StuckDetector', () => {
  let detector: StuckDetector;

  beforeEach(() => {
    detector = new StuckDetector();
  });

  describe('detectStuck', () => {
    it('should return empty array for empty workers list', () => {
      const result = detector.detectStuck([]);
      expect(result).toEqual([]);
    });

    it('should skip offline workers', () => {
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'offline',
          currentTask: 't1',
          recentActivity: []
        }
      ];
      const result = detector.detectStuck(workers);
      expect(result).toEqual([]);
    });

    it('should skip idle workers', () => {
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'idle',
          currentTask: undefined,
          recentActivity: []
        }
      ];
      const result = detector.detectStuck(workers);
      expect(result).toEqual([]);
    });

    it('should detect explicitly stuck worker', () => {
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'stuck',
          currentTask: 't1',
          stuckDuration: 60000,
          recentActivity: []
        }
      ];
      const result = detector.detectStuck(workers);
      expect(result).toHaveLength(1);
      expect(result[0].reason).toBe('explicit_stuck');
      expect(result[0].confidence).toBe(1.0);
      expect(result[0].workerId).toBe('w1');
      expect(result[0].taskId).toBe('t1');
    });

    it('should not detect stuck for explicitly stuck worker without current task', () => {
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'stuck',
          currentTask: undefined,
          stuckDuration: 60000,
          recentActivity: []
        }
      ];
      const result = detector.detectStuck(workers);
      expect(result).toEqual([]);
    });

    it('should detect multiple stuck workers', () => {
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'stuck',
          currentTask: 't1',
          stuckDuration: 60000,
          recentActivity: []
        },
        {
          id: 'w2',
          name: 'Worker 2',
          status: 'stuck',
          currentTask: 't2',
          stuckDuration: 120000,
          recentActivity: []
        }
      ];
      const result = detector.detectStuck(workers);
      expect(result).toHaveLength(2);
    });
  });

  describe('no progress detection', () => {
    it('should detect no progress when no recent activity', () => {
      const oldTimestamp = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: oldTimestamp,
              type: 'task_start',
              message: 'Started task'
            }
          ]
        }
      ];
      const result = detector.detectStuck(workers);
      expect(result.some(i => i.reason === 'no_progress')).toBe(true);
    });

    it('should not detect no progress with recent activity', () => {
      const recentTimestamp = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: recentTimestamp,
              type: 'task_start',
              message: 'Started task'
            }
          ]
        }
      ];
      const result = detector.detectStuck(workers);
      expect(result.some(i => i.reason === 'no_progress')).toBe(false);
    });

    it('should ignore message activities when checking progress', () => {
      const recentTimestamp = new Date(Date.now() - 1 * 60 * 1000);
      const oldTimestamp = new Date(Date.now() - 10 * 60 * 1000);
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: oldTimestamp,
              type: 'task_start',
              message: 'Started task'
            },
            {
              timestamp: recentTimestamp,
              type: 'message',
              message: 'Still working...'
            }
          ]
        }
      ];
      const result = detector.detectStuck(workers);
      expect(result.some(i => i.reason === 'no_progress')).toBe(true);
    });

    it('should detect no progress with custom activity window', () => {
      const customDetector = new StuckDetector({
        activityWindowMs: 30 * 1000, // 30 seconds
        noProgressThresholdMs: 2 * 60 * 1000 // 2 minutes threshold
      });
      const oldTimestamp = new Date(Date.now() - 3 * 60 * 1000); // 3 minutes ago (exceeds threshold)
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: oldTimestamp,
              type: 'task_start',
              message: 'Started task'
            }
          ]
        }
      ];
      const result = customDetector.detectStuck(workers);
      expect(result.some(i => i.reason === 'no_progress')).toBe(true);
    });

    it('should return default confidence when no activity at all', () => {
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: []
        }
      ];
      const result = detector.detectStuck(workers);
      const noProgressIndicator = result.find(i => i.reason === 'no_progress');
      expect(noProgressIndicator).toBeDefined();
      expect(noProgressIndicator?.confidence).toBe(0.7);
    });
  });

  describe('repeated error detection', () => {
    it('should detect repeated similar errors', () => {
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: new Date(Date.now() - 5 * 60 * 1000),
              type: 'error',
              message: 'TypeError: Cannot read property "foo" at /path/file.ts:10:5'
            },
            {
              timestamp: new Date(Date.now() - 4 * 60 * 1000),
              type: 'error',
              message: 'TypeError: Cannot read property "foo" at /path/file.ts:10:5'
            },
            {
              timestamp: new Date(Date.now() - 3 * 60 * 1000),
              type: 'error',
              message: 'TypeError: Cannot read property "foo" at /path/file.ts:10:5'
            }
          ]
        }
      ];
      const result = detector.detectStuck(workers);
      const repeatedError = result.find(i => i.reason === 'repeated_errors');
      expect(repeatedError).toBeDefined();
      expect(repeatedError?.errorPattern).toBeDefined();
    });

    it('should normalize errors for comparison', () => {
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: new Date(Date.now() - 5 * 60 * 1000),
              type: 'error',
              message: 'TypeError at /app/src/file.ts:10:5'
            },
            {
              timestamp: new Date(Date.now() - 4 * 60 * 1000),
              type: 'error',
              message: 'TypeError at /app/src/other.ts:25:10'
            },
            {
              timestamp: new Date(Date.now() - 3 * 60 * 1000),
              type: 'error',
              message: 'TypeError at /app/src/another.ts:5:2'
            }
          ]
        }
      ];
      const result = detector.detectStuck(workers);
      const repeatedError = result.find(i => i.reason === 'repeated_errors');
      expect(repeatedError).toBeDefined();
    });

    it('should not detect repeated errors with different error types', () => {
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: new Date(Date.now() - 5 * 60 * 1000),
              type: 'error',
              message: 'TypeError: Cannot read property'
            },
            {
              timestamp: new Date(Date.now() - 4 * 60 * 1000),
              type: 'error',
              message: 'ReferenceError: x is not defined'
            },
            {
              timestamp: new Date(Date.now() - 3 * 60 * 1000),
              type: 'error',
              message: 'SyntaxError: Unexpected token'
            }
          ]
        }
      ];
      const result = detector.detectStuck(workers);
      const repeatedError = result.find(i => i.reason === 'repeated_errors');
      expect(repeatedError).toBeUndefined();
    });

    it('should not detect repeated errors below threshold', () => {
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: new Date(Date.now() - 5 * 60 * 1000),
              type: 'error',
              message: 'TypeError: Cannot read property "foo"'
            },
            {
              timestamp: new Date(Date.now() - 4 * 60 * 1000),
              type: 'error',
              message: 'TypeError: Cannot read property "foo"'
            }
          ]
        }
      ];
      const result = detector.detectStuck(workers);
      const repeatedError = result.find(i => i.reason === 'repeated_errors');
      expect(repeatedError).toBeUndefined();
    });

    it('should use custom repeated error threshold', () => {
      const customDetector = new StuckDetector({
        repeatedErrorThreshold: 2
      });
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: new Date(Date.now() - 5 * 60 * 1000),
              type: 'error',
              message: 'TypeError: Cannot read property "foo"'
            },
            {
              timestamp: new Date(Date.now() - 4 * 60 * 1000),
              type: 'error',
              message: 'TypeError: Cannot read property "foo"'
            }
          ]
        }
      ];
      const result = customDetector.detectStuck(workers);
      const repeatedError = result.find(i => i.reason === 'repeated_errors');
      expect(repeatedError).toBeDefined();
    });
  });

  describe('timeout detection', () => {
    it('should detect timeout when task exceeds duration', () => {
      const oldTimestamp = new Date(Date.now() - 35 * 60 * 1000); // 35 minutes ago
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: oldTimestamp,
              type: 'task_start',
              message: 'Started task'
            }
          ]
        }
      ];
      const result = detector.detectStuck(workers);
      const timeout = result.find(i => i.reason === 'timeout');
      expect(timeout).toBeDefined();
      expect(timeout?.duration).toBeGreaterThan(30 * 60 * 1000);
    });

    it('should not detect timeout before threshold', () => {
      const recentTimestamp = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: recentTimestamp,
              type: 'task_start',
              message: 'Started task'
            }
          ]
        }
      ];
      const result = detector.detectStuck(workers);
      const timeout = result.find(i => i.reason === 'timeout');
      expect(timeout).toBeUndefined();
    });

    it('should use custom timeout threshold', () => {
      const customDetector = new StuckDetector({
        taskTimeoutMs: 5 * 60 * 1000 // 5 minutes
      });
      const oldTimestamp = new Date(Date.now() - 6 * 60 * 1000); // 6 minutes ago
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: oldTimestamp,
              type: 'task_start',
              message: 'Started task'
            }
          ]
        }
      ];
      const result = customDetector.detectStuck(workers);
      const timeout = result.find(i => i.reason === 'timeout');
      expect(timeout).toBeDefined();
    });

    it('should not detect timeout without task_start activity', () => {
      const oldTimestamp = new Date(Date.now() - 35 * 60 * 1000);
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: oldTimestamp,
              type: 'error',
              message: 'Some error'
            }
          ]
        }
      ];
      const result = detector.detectStuck(workers);
      const timeout = result.find(i => i.reason === 'timeout');
      expect(timeout).toBeUndefined();
    });
  });

  describe('confidence calculation', () => {
    it('should return high confidence for long no-progress duration', () => {
      const oldTimestamp = new Date(Date.now() - 35 * 60 * 1000); // 35 minutes ago
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: oldTimestamp,
              type: 'task_start',
              message: 'Started task'
            }
          ]
        }
      ];
      const result = detector.detectStuck(workers);
      const noProgress = result.find(i => i.reason === 'no_progress');
      expect(noProgress?.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('should return lower confidence for short no-progress duration', () => {
      const oldTimestamp = new Date(Date.now() - 8 * 60 * 1000); // 8 minutes ago
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: oldTimestamp,
              type: 'task_start',
              message: 'Started task'
            }
          ]
        }
      ];
      const result = detector.detectStuck(workers);
      const noProgress = result.find(i => i.reason === 'no_progress');
      expect(noProgress?.confidence).toBeLessThan(0.85);
    });

    it('should return high confidence for many repeated errors', () => {
      const errors: ActivityEntry[] = [];
      for (let i = 0; i < 10; i++) {
        errors.push({
          timestamp: new Date(Date.now() - (10 - i) * 60 * 1000),
          type: 'error',
          message: 'TypeError: Cannot read property "foo"'
        });
      }
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: errors
        }
      ];
      const result = detector.detectStuck(workers);
      const repeatedError = result.find(i => i.reason === 'repeated_errors');
      expect(repeatedError?.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('should return high confidence for significant timeout', () => {
      const oldTimestamp = new Date(Date.now() - 65 * 60 * 1000); // 65 minutes ago (over 2x timeout)
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: oldTimestamp,
              type: 'task_start',
              message: 'Started task'
            }
          ]
        }
      ];
      const result = detector.detectStuck(workers);
      const timeout = result.find(i => i.reason === 'timeout');
      expect(timeout?.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('should return perfect confidence for explicit stuck status', () => {
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'stuck',
          currentTask: 't1',
          stuckDuration: 60000,
          recentActivity: []
        }
      ];
      const result = detector.detectStuck(workers);
      const explicit = result.find(i => i.reason === 'explicit_stuck');
      expect(explicit?.confidence).toBe(1.0);
    });
  });

  describe('edge cases', () => {
    it('should handle worker without currentTask', () => {
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: undefined,
          recentActivity: []
        }
      ];
      const result = detector.detectStuck(workers);
      expect(result).toEqual([]);
    });

    it('should handle worker with empty activity', () => {
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: []
        }
      ];
      const result = detector.detectStuck(workers);
      // Should detect no progress
      expect(result.some(i => i.reason === 'no_progress')).toBe(true);
    });

    it('should detect multiple issues for same worker', () => {
      const oldTimestamp = new Date(Date.now() - 35 * 60 * 1000);
      const errors: ActivityEntry[] = [];
      for (let i = 0; i < 5; i++) {
        errors.push({
          timestamp: new Date(Date.now() - (5 - i) * 60 * 1000),
          type: 'error',
          message: 'TypeError: Cannot read property'
        });
      }
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: oldTimestamp,
              type: 'task_start',
              message: 'Started task'
            },
            ...errors
          ]
        }
      ];
      const result = detector.detectStuck(workers);
      // Should detect both no_progress, repeated_errors, and timeout
      expect(result.length).toBeGreaterThan(1);
    });

    it('should handle workers with only message activities', () => {
      const workers: WorkerContext[] = [
        {
          id: 'w1',
          name: 'Worker 1',
          status: 'working',
          currentTask: 't1',
          recentActivity: [
            {
              timestamp: new Date(Date.now() - 1 * 60 * 1000),
              type: 'message',
              message: 'Working on it...'
            },
            {
              timestamp: new Date(),
              type: 'message',
              message: 'Still working...'
            }
          ]
        }
      ];
      const result = detector.detectStuck(workers);
      // Should detect no progress since messages don't count
      expect(result.some(i => i.reason === 'no_progress')).toBe(true);
    });
  });
});
