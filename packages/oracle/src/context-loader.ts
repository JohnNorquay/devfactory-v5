import { promises as fs } from 'fs';
import { join } from 'path';
import { load } from 'js-yaml';
import {
  OracleContext,
  ProductContext,
  SpecContext,
  WorkerContext,
  BeastState,
  TaskContext,
  ActivityEntry,
} from './types.js';

interface OrchestrationYaml {
  version?: string;
  spec?: string;
  generated?: string;
  summary?: {
    total_tasks?: number;
    layers?: Record<string, number>;
  };
  tasks?: Array<{
    id: string;
    title: string;
    layer?: string;
    depends_on?: string[];
    parallel_batch?: number;
  }>;
}

interface StateJson {
  status?: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  activeSpec?: string;
  startedAt?: string;
  totalTasks?: number;
  completedTasks?: number;
  workers?: Array<{
    id: string;
    name: string;
    status: 'idle' | 'working' | 'stuck' | 'offline';
    currentTask?: string;
    lastHeartbeat?: string;
    activity?: Array<{
      timestamp: string;
      type: 'task_start' | 'task_complete' | 'error' | 'intervention' | 'message';
      message: string;
      metadata?: Record<string, unknown>;
    }>;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    assignedWorker?: string;
    startedAt?: string;
    completedAt?: string;
    attempts?: number;
    lastError?: string;
  }>;
}

/**
 * ContextLoader is responsible for loading full project context for the Oracle.
 * It reads from .devfactory/ directory structure and provides comprehensive
 * understanding of the project mission, specs, workers, and current state.
 */
export class ContextLoader {
  private devfactoryPath: string;

  constructor(projectRoot: string) {
    this.devfactoryPath = join(projectRoot, '.devfactory');
  }

  /**
   * Load complete Oracle context including product, specs, workers, and current state.
   * This is the main entry point for context loading.
   */
  async loadContext(): Promise<OracleContext> {
    console.log('[ContextLoader] Loading full project context...');

    const [product, specs, workers, currentState] = await Promise.all([
      this.loadProductContext(),
      this.loadSpecContexts(),
      this.loadWorkerContexts(),
      this.loadBeastState(),
    ]);

    console.log(
      `[ContextLoader] Context loaded: ${specs.length} specs, ${workers.length} workers`
    );

    return { product, specs, workers, currentState };
  }

  /**
   * Load product mission, tech stack, and patterns from .devfactory/product/
   */
  async loadProductContext(): Promise<ProductContext> {
    console.log('[ContextLoader] Loading product context...');

    const productPath = join(this.devfactoryPath, 'product');

    // Load mission.md
    const missionPath = join(productPath, 'mission.md');
    let mission = '';
    try {
      mission = await this.loadMarkdown(missionPath);
    } catch (error) {
      console.warn('[ContextLoader] mission.md not found, using default');
      mission = 'No mission statement available.';
    }

    // Load tech-stack.md
    const techStackPath = join(productPath, 'tech-stack.md');
    let techStackContent = '';
    try {
      techStackContent = await this.loadMarkdown(techStackPath);
    } catch (error) {
      console.warn('[ContextLoader] tech-stack.md not found, using default');
    }

    // Extract tech stack items from markdown (simple parsing)
    const techStack = this.extractTechStack(techStackContent);

    // Extract patterns from existing code or documentation
    const patterns = this.extractPatterns(mission, techStackContent);

    console.log(
      `[ContextLoader] Product context loaded: ${techStack.length} technologies, ${patterns.length} patterns`
    );

    return { mission, techStack, patterns };
  }

  /**
   * Load all spec contexts from .devfactory/specs/
   */
  async loadSpecContexts(): Promise<SpecContext[]> {
    console.log('[ContextLoader] Loading spec contexts...');

    const specsPath = join(this.devfactoryPath, 'specs');

    // Check if specs directory exists
    try {
      await fs.access(specsPath);
    } catch (error) {
      console.warn('[ContextLoader] specs/ directory not found, returning empty array');
      return [];
    }

    // Read all spec directories
    const specDirs = await fs.readdir(specsPath, { withFileTypes: true });
    const specs: SpecContext[] = [];

    for (const dir of specDirs) {
      if (!dir.isDirectory()) continue;

      const specPath = join(specsPath, dir.name);
      const spec = await this.loadSpec(specPath, dir.name);
      if (spec) {
        specs.push(spec);
      }
    }

    console.log(`[ContextLoader] Loaded ${specs.length} spec contexts`);
    return specs;
  }

  /**
   * Load a single spec from its directory
   */
  private async loadSpec(specPath: string, specName: string): Promise<SpecContext | null> {
    try {
      // Load orchestration.yml
      const orchestrationPath = join(specPath, 'orchestration.yml');
      const orchestration = await this.loadYaml<OrchestrationYaml>(orchestrationPath);

      // Load tasks.md to parse acceptance criteria
      const tasksPath = join(specPath, 'tasks.md');
      let tasksContent = '';
      try {
        tasksContent = await this.loadMarkdown(tasksPath);
      } catch (error) {
        console.warn(`[ContextLoader] tasks.md not found for spec ${specName}`);
      }

      // Parse tasks from orchestration.yml
      const tasks: TaskContext[] = [];
      if (orchestration?.tasks) {
        for (const task of orchestration.tasks) {
          tasks.push({
            id: task.id,
            title: task.title,
            status: 'pending',
            attempts: 0,
          });
        }
      }

      // Extract acceptance criteria from tasks or srd
      const acceptanceCriteria = this.extractAcceptanceCriteria(tasksContent);

      // Extract phase from spec name (e.g., "phase-1-enhanced-oracle" -> "phase-1")
      const phase = specName.match(/^phase-\d+/)?.[0] || 'unknown';

      return {
        id: orchestration?.spec || specName,
        name: specName,
        phase,
        tasks,
        acceptanceCriteria,
      };
    } catch (error) {
      console.warn(`[ContextLoader] Failed to load spec ${specName}:`, error);
      return null;
    }
  }

  /**
   * Load worker contexts from beast state and tmux sessions
   */
  async loadWorkerContexts(): Promise<WorkerContext[]> {
    console.log('[ContextLoader] Loading worker contexts...');

    const state = await this.loadStateJson();

    if (!state?.workers) {
      console.warn('[ContextLoader] No workers found in state.json');
      return [];
    }

    const workers: WorkerContext[] = [];

    for (const worker of state.workers) {
      // Calculate stuck duration if worker is stuck
      let stuckDuration: number | undefined;
      if (worker.status === 'stuck' && worker.lastHeartbeat) {
        const lastHeartbeat = new Date(worker.lastHeartbeat);
        const now = new Date();
        stuckDuration = now.getTime() - lastHeartbeat.getTime();
      }

      // Convert activity entries
      const recentActivity: ActivityEntry[] = [];
      if (worker.activity) {
        for (const activity of worker.activity.slice(-10)) {
          // Keep last 10
          recentActivity.push({
            timestamp: new Date(activity.timestamp),
            type: activity.type,
            message: activity.message,
            metadata: activity.metadata,
          });
        }
      }

      workers.push({
        id: worker.id,
        name: worker.name,
        status: worker.status,
        currentTask: worker.currentTask,
        recentActivity,
        stuckDuration,
      });
    }

    console.log(`[ContextLoader] Loaded ${workers.length} worker contexts`);
    return workers;
  }

  /**
   * Load current beast state from .devfactory/beast/state.json
   */
  async loadBeastState(): Promise<BeastState> {
    console.log('[ContextLoader] Loading beast state...');

    const state = await this.loadStateJson();

    const beastState: BeastState = {
      status: state?.status || 'idle',
      activeSpec: state?.activeSpec,
      startedAt: state?.startedAt ? new Date(state.startedAt) : undefined,
      totalTasks: state?.totalTasks || 0,
      completedTasks: state?.completedTasks || 0,
    };

    console.log(`[ContextLoader] Beast state loaded: ${beastState.status}`);
    return beastState;
  }

  /**
   * Load and parse state.json from .devfactory/beast/
   */
  private async loadStateJson(): Promise<StateJson | null> {
    const statePath = join(this.devfactoryPath, 'beast', 'state.json');

    try {
      const content = await fs.readFile(statePath, 'utf-8');
      return JSON.parse(content) as StateJson;
    } catch (error) {
      console.warn('[ContextLoader] state.json not found or invalid, using defaults');
      return null;
    }
  }

  /**
   * Helper to read and parse YAML files
   */
  private async loadYaml<T>(filePath: string): Promise<T | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return load(content) as T;
    } catch (error) {
      console.warn(`[ContextLoader] Failed to load YAML file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Helper to read markdown files
   */
  private async loadMarkdown(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read markdown file ${filePath}: ${error}`);
    }
  }

  /**
   * Extract tech stack items from markdown content
   */
  private extractTechStack(techStackContent: string): string[] {
    if (!techStackContent) return [];

    const techStack: string[] = [];

    // Look for dependency blocks in markdown (e.g., package.json snippets)
    const dependencyRegex = /"([^"]+)":\s*"\^?[\d.]+"/g;
    const dependencyMatches = Array.from(techStackContent.matchAll(dependencyRegex));

    for (const match of dependencyMatches) {
      if (match[1]) {
        techStack.push(match[1]);
      }
    }

    // Also extract from bullet points or lists
    const bulletRegex = /[-*]\s+\*\*([^*]+)\*\*/g;
    const bulletMatches = Array.from(techStackContent.matchAll(bulletRegex));
    for (const match of bulletMatches) {
      if (match[1]) {
        const tech = match[1].trim();
        if (!techStack.includes(tech)) {
          techStack.push(tech);
        }
      }
    }

    return Array.from(new Set(techStack)); // Remove duplicates
  }

  /**
   * Extract patterns from mission and tech stack content
   */
  private extractPatterns(mission: string, techStackContent: string): string[] {
    const patterns: string[] = [];

    // Extract from "Core Principles" section
    const principlesMatch = mission.match(
      /## Core Principles([\s\S]*?)(?=##|$)/
    );
    if (principlesMatch) {
      const principlesSection = principlesMatch[1];
      const principleRegex = /### \d+\. ([^\n]+)/g;
      const principleMatches = Array.from(principlesSection.matchAll(principleRegex));
      for (const match of principleMatches) {
        if (match[1]) {
          patterns.push(match[1].trim());
        }
      }
    }

    // Extract from tech stack structure patterns
    const structureMatch = techStackContent.match(
      /## Project Structure([\s\S]*?)(?=##|$)/
    );
    if (structureMatch) {
      patterns.push('Monorepo structure with packages');
    }

    // Add TypeScript and ESM patterns if found
    if (techStackContent.includes('TypeScript')) {
      patterns.push('TypeScript for type safety');
    }
    if (techStackContent.includes('"type": "module"')) {
      patterns.push('ESM modules with .js extensions');
    }

    return patterns;
  }

  /**
   * Extract acceptance criteria from tasks markdown
   */
  private extractAcceptanceCriteria(tasksContent: string): string[] {
    const criteria: string[] = [];

    // Look for "Verification Criteria" section
    const verificationMatch = tasksContent.match(
      /## Verification Criteria([\s\S]*?)(?=##|$)/
    );

    if (verificationMatch) {
      const verificationSection = verificationMatch[1];
      const criteriaRegex = /[-*]\s+([^\n]+)/g;
      const criteriaMatches = Array.from(verificationSection.matchAll(criteriaRegex));
      for (const match of criteriaMatches) {
        if (match[1]) {
          criteria.push(match[1].trim());
        }
      }
    }

    return criteria;
  }
}
