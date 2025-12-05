/**
 * Example usage of ContextLoader
 *
 * This file demonstrates how to use the ContextLoader class to load
 * full project context for the Oracle.
 */

import { ContextLoader } from './context-loader.js';

async function exampleUsage() {
  // Initialize the ContextLoader with the project root
  const projectRoot = process.cwd();
  const contextLoader = new ContextLoader(projectRoot);

  try {
    // Load complete Oracle context
    console.log('Loading full Oracle context...');
    const context = await contextLoader.loadContext();

    // Display loaded context
    console.log('\n=== Product Context ===');
    console.log('Mission:', context.product.mission.substring(0, 100) + '...');
    console.log('Tech Stack:', context.product.techStack.slice(0, 5).join(', '));
    console.log('Patterns:', context.product.patterns.join(', '));

    console.log('\n=== Specs ===');
    console.log(`Loaded ${context.specs.length} specs:`);
    context.specs.forEach(spec => {
      console.log(`  - ${spec.name} (${spec.tasks.length} tasks)`);
    });

    console.log('\n=== Workers ===');
    console.log(`Active workers: ${context.workers.length}`);
    context.workers.forEach(worker => {
      console.log(`  - ${worker.name}: ${worker.status}`);
      if (worker.currentTask) {
        console.log(`    Current task: ${worker.currentTask}`);
      }
      if (worker.stuckDuration) {
        console.log(`    Stuck for: ${Math.floor(worker.stuckDuration / 1000)}s`);
      }
    });

    console.log('\n=== Beast State ===');
    console.log('Status:', context.currentState.status);
    console.log('Active Spec:', context.currentState.activeSpec || 'None');
    console.log('Progress:', `${context.currentState.completedTasks}/${context.currentState.totalTasks}`);

  } catch (error) {
    console.error('Failed to load context:', error);
    process.exit(1);
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage();
}
