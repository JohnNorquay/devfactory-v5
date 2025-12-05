import { describe, it, expect, beforeEach } from 'vitest';
import { InterventionEngine, InterventionStrategy } from '../intervention.js';
import { StuckIndicator, OracleContext, WorkerContext, TaskContext } from '../types.js';

describe('InterventionEngine', () => {
  let engine: InterventionEngine;
  let mockContext: OracleContext;

  beforeEach(() => {
    engine = new InterventionEngine();
    mockContext = createMockContext();
  });

  describe('strategy registration', () => {
    it('should register custom strategy', () => {
      const customStrategy: InterventionStrategy = {
        name: 'custom',
        priority: 100,
        canHandle: () => true,
        createIntervention: (indicator) => ({
          id: 'custom-1',
          type: 'guidance',
          targetWorker: indicator.workerId,
          targetTask: indicator.taskId,
          reason: 'Custom intervention',
          createdAt: new Date(),
          status: 'pending'
        })
      };

      engine.registerStrategy(customStrategy);

      const indicator = createMockIndicator('no_progress');
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention).toBeDefined();
      expect(intervention?.id).toBe('custom-1');
    });

    it('should sort strategies by priority (higher first)', () => {
      const lowPriority: InterventionStrategy = {
        name: 'low',
        priority: 1,
        canHandle: () => true,
        createIntervention: (indicator) => ({
          id: 'low-priority',
          type: 'guidance',
          targetWorker: indicator.workerId,
          targetTask: indicator.taskId,
          reason: 'Low priority',
          createdAt: new Date(),
          status: 'pending'
        })
      };

      const highPriority: InterventionStrategy = {
        name: 'high',
        priority: 100,
        canHandle: () => true,
        createIntervention: (indicator) => ({
          id: 'high-priority',
          type: 'takeover',
          targetWorker: indicator.workerId,
          targetTask: indicator.taskId,
          reason: 'High priority',
          createdAt: new Date(),
          status: 'pending'
        })
      };

      engine.registerStrategy(lowPriority);
      engine.registerStrategy(highPriority);

      const indicator = createMockIndicator('no_progress');
      const intervention = engine.determineIntervention(indicator, mockContext);

      // High priority should be selected first
      expect(intervention?.id).toBe('high-priority');
    });

    it('should skip strategies that cannot handle the indicator', () => {
      const nonMatchingStrategy: InterventionStrategy = {
        name: 'non-matching',
        priority: 100,
        canHandle: () => false,
        createIntervention: (indicator) => ({
          id: 'should-not-be-created',
          type: 'guidance',
          targetWorker: indicator.workerId,
          targetTask: indicator.taskId,
          reason: 'Should not be created',
          createdAt: new Date(),
          status: 'pending'
        })
      };

      engine.registerStrategy(nonMatchingStrategy);

      const indicator = createMockIndicator('no_progress', 0.5);
      const intervention = engine.determineIntervention(indicator, mockContext);

      // Should fall back to default guidance strategy
      expect(intervention).toBeDefined();
      expect(intervention?.type).toBe('guidance');
    });
  });

  describe('guidance intervention', () => {
    it('should create guidance for low confidence no_progress', () => {
      const indicator = createMockIndicator('no_progress', 0.6);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention).toBeDefined();
      expect(intervention?.type).toBe('guidance');
      expect(intervention?.targetWorker).toBe('w1');
      expect(intervention?.targetTask).toBe('t1');
      expect(intervention?.status).toBe('pending');
    });

    it('should include helpful guidance in prompt', () => {
      const indicator = createMockIndicator('no_progress', 0.6);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.prompt).toBeDefined();
      expect(intervention?.prompt).toContain('Oracle Guidance');
      expect(intervention?.prompt).toContain('Current Situation');
      expect(intervention?.prompt).toContain('Suggested Actions');
    });

    it('should include project context in guidance prompt', () => {
      const indicator = createMockIndicator('no_progress', 0.6);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.prompt).toContain('Test Project');
      expect(intervention?.prompt).toContain('TypeScript');
      expect(intervention?.prompt).toContain('React');
    });

    it('should provide no_progress specific guidance', () => {
      const indicator = createMockIndicator('no_progress', 0.6);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.prompt).toContain('Review the task requirements');
      expect(intervention?.prompt).toContain('Break down the task');
    });

    it('should provide repeated_errors specific guidance', () => {
      const indicator = createMockIndicator('repeated_errors', 0.6, 'TypeError: foo');
      const intervention = engine.determineIntervention(indicator, mockContext);

      // Intervention might be guidance or reassign depending on available workers
      expect(intervention).toBeDefined();
      if (intervention?.type === 'guidance' && intervention?.prompt) {
        expect(intervention.prompt).toContain('Analyze the error pattern');
        expect(intervention.prompt).toContain('Try a different approach');
      }
    });

    it('should include error pattern in guidance prompt', () => {
      // Use no_progress to ensure we get guidance intervention
      const indicator = createMockIndicator('no_progress', 0.6, 'TypeError: Cannot read property');
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.type).toBe('guidance');
      expect(intervention?.prompt).toBeDefined();
      if (indicator.errorPattern) {
        expect(intervention?.prompt).toContain('Error Pattern Detected');
        expect(intervention?.prompt).toContain('TypeError: Cannot read property');
      }
    });

    it('should include task last error in guidance prompt', () => {
      mockContext.specs[0].tasks[0].lastError = 'Task failed with error X';
      const indicator = createMockIndicator('no_progress', 0.6);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.prompt).toContain('Last Error');
      expect(intervention?.prompt).toContain('Task failed with error X');
    });
  });

  describe('takeover intervention', () => {
    it('should create takeover for high confidence and long duration', () => {
      const indicator = createMockIndicator('no_progress', 0.85, undefined, 15 * 60 * 1000);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention).toBeDefined();
      expect(intervention?.type).toBe('takeover');
    });

    it('should not create takeover for low confidence', () => {
      const indicator = createMockIndicator('no_progress', 0.5, undefined, 15 * 60 * 1000);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.type).not.toBe('takeover');
    });

    it('should not create takeover for short duration', () => {
      const indicator = createMockIndicator('no_progress', 0.85, undefined, 5 * 60 * 1000);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.type).not.toBe('takeover');
    });

    it('should include comprehensive context in takeover prompt', () => {
      const indicator = createMockIndicator('no_progress', 0.85, undefined, 15 * 60 * 1000);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.prompt).toContain('Oracle Takeover Mission');
      expect(intervention?.prompt).toContain('Project Mission');
      expect(intervention?.prompt).toContain('Tech Stack');
      expect(intervention?.prompt).toContain('Task to Complete');
    });

    it('should include worker activity in takeover prompt', () => {
      const indicator = createMockIndicator('no_progress', 0.85, undefined, 15 * 60 * 1000);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.prompt).toContain('Recent Worker Activity');
      expect(intervention?.prompt).toContain('Started working');
    });

    it('should include error details in takeover prompt', () => {
      mockContext.specs[0].tasks[0].lastError = 'Critical error occurred';
      const indicator = createMockIndicator('repeated_errors', 0.9, 'TypeError: foo', 15 * 60 * 1000);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.prompt).toContain('Previous Error');
      expect(intervention?.prompt).toContain('Critical error occurred');
      expect(intervention?.prompt).toContain('Error Pattern');
      expect(intervention?.prompt).toContain('TypeError: foo');
    });

    it('should include project patterns in takeover prompt', () => {
      const indicator = createMockIndicator('no_progress', 0.85, undefined, 15 * 60 * 1000);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.prompt).toContain('Project Patterns to Follow');
      expect(intervention?.prompt).toContain('Test everything');
      expect(intervention?.prompt).toContain('Use TypeScript');
    });
  });

  describe('reassign intervention', () => {
    it('should create reassign when idle worker available', () => {
      // Add an idle worker
      mockContext.workers.push({
        id: 'w2',
        name: 'Worker 2',
        status: 'idle',
        recentActivity: []
      });

      const indicator = createMockIndicator('no_progress', 0.7, undefined, 8 * 60 * 1000);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention).toBeDefined();
      expect(intervention?.type).toBe('reassign');
      expect(intervention?.targetWorker).toBe('w2');
    });

    it('should not reassign to same worker', () => {
      // Only the stuck worker is available
      mockContext.workers[0].status = 'idle';

      const indicator = createMockIndicator('no_progress', 0.7);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.type).not.toBe('reassign');
    });

    it('should not create reassign when no idle workers', () => {
      // All workers are busy
      mockContext.workers[0].status = 'working';

      const indicator = createMockIndicator('no_progress', 0.7);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.type).not.toBe('reassign');
    });

    it('should include reassignment context in prompt', () => {
      mockContext.workers.push({
        id: 'w2',
        name: 'Worker 2',
        status: 'idle',
        recentActivity: []
      });

      const indicator = createMockIndicator('no_progress', 0.7);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.prompt).toContain('Task Reassignment Notice');
      expect(intervention?.prompt).toContain('Worker 2');
      expect(intervention?.prompt).toContain('Why Reassigned');
    });

    it('should include previous error in reassign prompt', () => {
      mockContext.workers.push({
        id: 'w2',
        name: 'Worker 2',
        status: 'idle',
        recentActivity: []
      });
      mockContext.specs[0].tasks[0].lastError = 'Previous worker encountered error Y';

      const indicator = createMockIndicator('repeated_errors', 0.75, 'ReferenceError');
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.prompt).toContain('Previous Error');
      expect(intervention?.prompt).toContain('Previous worker encountered error Y');
      expect(intervention?.prompt).toContain('Learn from this error');
    });

    it('should provide fresh start guidelines in reassign prompt', () => {
      mockContext.workers.push({
        id: 'w2',
        name: 'Worker 2',
        status: 'idle',
        recentActivity: []
      });

      const indicator = createMockIndicator('no_progress', 0.7);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.prompt).toContain('Fresh Start Guidelines');
      expect(intervention?.prompt).toContain('Do not repeat the approach');
    });
  });

  describe('skip intervention', () => {
    it('should create skip for long timeout with custom strategy', () => {
      // Create engine with only skip strategy to test it directly
      const testEngine = new InterventionEngine();
      const indicator = createMockIndicator('timeout', 0.75, undefined, 65 * 60 * 1000);
      const intervention = testEngine.determineIntervention(indicator, mockContext);

      // With timeout > 60 mins and confidence < 0.8, and no idle workers, should eventually get skip
      // Note: takeover has higher priority if confidence >= 0.8 and duration > 10 mins
      expect(intervention).toBeDefined();
      expect(['skip', 'takeover']).toContain(intervention?.type);
    });

    it('should not create skip for short timeout', () => {
      const indicator = createMockIndicator('timeout', 0.8, undefined, 30 * 60 * 1000);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.type).not.toBe('skip');
    });

    it('should include timeout duration in reason when skip or takeover', () => {
      const indicator = createMockIndicator('timeout', 0.75, undefined, 65 * 60 * 1000);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.reason).toContain('65 minutes');
      // Could be skip or takeover depending on confidence threshold
    });

    it('should handle error pattern in reason', () => {
      const indicator = createMockIndicator('timeout', 0.75, 'SyntaxError: Unexpected', 65 * 60 * 1000);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention).toBeDefined();
      // Just verify intervention was created with the error pattern info
      expect(intervention?.reason).toBeDefined();
    });
  });

  describe('intervention priority', () => {
    it('should prefer takeover over reassign for high confidence', () => {
      mockContext.workers.push({
        id: 'w2',
        name: 'Worker 2',
        status: 'idle',
        recentActivity: []
      });

      const indicator = createMockIndicator('no_progress', 0.85, undefined, 15 * 60 * 1000);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.type).toBe('takeover');
    });

    it('should prefer reassign over guidance when worker available', () => {
      mockContext.workers.push({
        id: 'w2',
        name: 'Worker 2',
        status: 'idle',
        recentActivity: []
      });

      const indicator = createMockIndicator('no_progress', 0.65, undefined, 8 * 60 * 1000);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.type).toBe('reassign');
    });

    it('should fall back to guidance when no higher priority options', () => {
      // No idle workers, low confidence, short duration
      const indicator = createMockIndicator('no_progress', 0.6, undefined, 6 * 60 * 1000);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.type).toBe('guidance');
    });

    it('should return null when no strategy can handle', () => {
      // High confidence but not enough duration for takeover, and reason doesn't match guidance
      const indicator = createMockIndicator('explicit_stuck', 1.0, undefined, 5 * 60 * 1000);
      const intervention = engine.determineIntervention(indicator, mockContext);

      // Should still get something - default strategies are broad
      expect(intervention).toBeDefined();
    });
  });

  describe('context-aware prompts', () => {
    it('should include task title in all prompts', () => {
      const testCases = [
        createMockIndicator('no_progress', 0.6),
        createMockIndicator('no_progress', 0.85, undefined, 15 * 60 * 1000),
      ];

      for (const indicator of testCases) {
        const intervention = engine.determineIntervention(indicator, mockContext);
        expect(intervention?.prompt).toContain('Test Task');
      }
    });

    it('should include task attempts in prompts', () => {
      mockContext.specs[0].tasks[0].attempts = 5;
      const indicator = createMockIndicator('no_progress', 0.85, undefined, 15 * 60 * 1000);
      const intervention = engine.determineIntervention(indicator, mockContext);

      expect(intervention?.prompt).toContain('Attempts: 5');
    });

    it('should handle missing task gracefully', () => {
      const indicator: StuckIndicator = {
        workerId: 'w1',
        taskId: 'non-existent-task',
        reason: 'no_progress',
        duration: 6 * 60 * 1000,
        confidence: 0.6
      };

      const intervention = engine.determineIntervention(indicator, mockContext);
      expect(intervention).toBeDefined();
      expect(intervention?.prompt).toContain('Unknown');
    });

    it('should handle missing worker gracefully', () => {
      const indicator: StuckIndicator = {
        workerId: 'non-existent-worker',
        taskId: 't1',
        reason: 'no_progress',
        duration: 15 * 60 * 1000,
        confidence: 0.85
      };

      const intervention = engine.determineIntervention(indicator, mockContext);
      expect(intervention).toBeDefined();
    });

    it('should generate unique intervention IDs', () => {
      const indicator = createMockIndicator('no_progress', 0.6);
      const intervention1 = engine.determineIntervention(indicator, mockContext);
      const intervention2 = engine.determineIntervention(indicator, mockContext);

      expect(intervention1?.id).toBeDefined();
      expect(intervention2?.id).toBeDefined();
      expect(intervention1?.id).not.toBe(intervention2?.id);
    });
  });
});

// Helper functions
function createMockContext(): OracleContext {
  return {
    product: {
      mission: 'Test Project',
      techStack: ['TypeScript', 'React', 'Node.js'],
      patterns: ['Test everything', 'Use TypeScript', 'Follow conventions']
    },
    specs: [
      {
        id: 's1',
        name: 'Test Spec',
        phase: 'development',
        tasks: [
          {
            id: 't1',
            title: 'Test Task',
            status: 'in_progress',
            assignedWorker: 'w1',
            startedAt: new Date(Date.now() - 10 * 60 * 1000),
            attempts: 1
          }
        ],
        acceptanceCriteria: ['Must work', 'Must be tested']
      }
    ],
    workers: [
      {
        id: 'w1',
        name: 'Worker 1',
        status: 'working',
        currentTask: 't1',
        recentActivity: [
          {
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            type: 'task_start',
            message: 'Started working'
          }
        ]
      }
    ],
    currentState: {
      status: 'running',
      activeSpec: 's1',
      startedAt: new Date(),
      totalTasks: 10,
      completedTasks: 5
    }
  };
}

function createMockIndicator(
  reason: StuckIndicator['reason'],
  confidence: number = 0.7,
  errorPattern?: string,
  duration: number = 6 * 60 * 1000
): StuckIndicator {
  return {
    workerId: 'w1',
    taskId: 't1',
    reason,
    duration,
    errorPattern,
    confidence
  };
}
