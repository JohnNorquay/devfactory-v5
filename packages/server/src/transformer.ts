import { readFile, access } from 'fs/promises';
import { join } from 'path';
import type { DashboardState, BeastState, SpecStatus, WorkerStatus, BuildMetrics } from './types.js';

/**
 * Transforms raw Beast state into DashboardState
 * Reads from .devfactory directory and aggregates information
 */
export class DashboardStateTransformer {
  private projectRoot: string;
  private devFactoryDir: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.devFactoryDir = join(projectRoot, '.devfactory');
  }

  async getState(): Promise<DashboardState> {
    try {
      const beastState = await this.loadBeastState();
      const specs = await this.transformSpecs(beastState);
      const workers = await this.getWorkerStatus(beastState);
      const metrics = await this.calculateMetrics(beastState);
      const logs = await this.loadRecentLogs();

      return {
        status: this.mapStatus(beastState.status),
        currentPhase: this.determinePhase(beastState),
        progress: this.calculateProgress(specs),
        specs,
        workers,
        metrics,
        logs,
      };
    } catch (error) {
      console.error('Error transforming state:', error);
      return this.getDefaultState();
    }
  }

  private async loadBeastState(): Promise<BeastState> {
    const statePath = join(this.devFactoryDir, 'beast', 'state.json');

    try {
      await access(statePath);
      const content = await readFile(statePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load beast state: ${error}`);
    }
  }

  private async transformSpecs(beastState: BeastState): Promise<SpecStatus[]> {
    return beastState.specs.map(spec => ({
      id: spec.id,
      title: this.extractTitle(spec.path),
      status: this.mapSpecStatus(spec.status),
      progress: spec.progress || 0,
      startTime: undefined, // TODO: Add to beast state
      endTime: undefined,
      estimatedDuration: undefined,
    }));
  }

  private async getWorkerStatus(beastState: BeastState): Promise<WorkerStatus[]> {
    // TODO: Implement actual worker tracking
    // For now, simulate based on active specs
    const activeSpecs = beastState.specs.filter(s => s.status === 'in-progress');

    return activeSpecs.map((spec, index) => ({
      id: `worker-${index + 1}`,
      name: `Worker ${index + 1}`,
      status: 'busy',
      currentTask: spec.id,
      tasksCompleted: 0,
      startTime: Date.now(),
    }));
  }

  private async calculateMetrics(beastState: BeastState): Promise<BuildMetrics> {
    return {
      totalDuration: beastState.endTime ? beastState.endTime - beastState.startTime : undefined,
      testsRun: beastState.metrics?.testsRun || 0,
      testsPassed: beastState.metrics?.testsPassed || 0,
      testsFailed: beastState.metrics?.testsFailed || 0,
      filesModified: beastState.metrics?.filesModified || 0,
      linesChanged: beastState.metrics?.linesChanged || 0,
    };
  }

  private async loadRecentLogs(): Promise<Array<{ timestamp: number; level: 'info' | 'warn' | 'error' | 'success'; message: string; source?: string }>> {
    const logsPath = join(this.devFactoryDir, 'beast', 'logs.json');

    try {
      await access(logsPath);
      const content = await readFile(logsPath, 'utf-8');
      const logs = JSON.parse(content);
      return logs.slice(-100); // Return last 100 logs
    } catch {
      return [];
    }
  }

  private mapStatus(status: string): 'idle' | 'planning' | 'building' | 'testing' | 'error' {
    const statusMap: Record<string, DashboardState['status']> = {
      idle: 'idle',
      planning: 'planning',
      building: 'building',
      testing: 'testing',
      error: 'error',
      executing: 'building',
      validating: 'testing',
    };

    return statusMap[status.toLowerCase()] || 'idle';
  }

  private mapSpecStatus(status: string): SpecStatus['status'] {
    const statusMap: Record<string, SpecStatus['status']> = {
      pending: 'pending',
      'in-progress': 'in-progress',
      completed: 'completed',
      failed: 'failed',
      executing: 'in-progress',
    };

    return statusMap[status.toLowerCase()] || 'pending';
  }

  private determinePhase(beastState: BeastState): string {
    if (beastState.currentSpec) {
      return `Building: ${beastState.currentSpec}`;
    }

    return beastState.status.charAt(0).toUpperCase() + beastState.status.slice(1);
  }

  private calculateProgress(specs: SpecStatus[]): { completed: number; total: number; percentage: number } {
    const total = specs.length;
    const completed = specs.filter(s => s.status === 'completed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }

  private extractTitle(specPath: string): string {
    // Extract filename without extension
    const filename = specPath.split('/').pop() || specPath;
    return filename.replace(/\.(md|json)$/, '').replace(/-/g, ' ');
  }

  private getDefaultState(): DashboardState {
    return {
      status: 'idle',
      currentPhase: 'Ready',
      progress: { completed: 0, total: 0, percentage: 0 },
      specs: [],
      workers: [],
      metrics: {
        testsRun: 0,
        testsPassed: 0,
        testsFailed: 0,
        filesModified: 0,
        linesChanged: 0,
      },
      logs: [],
    };
  }
}
