// Oracle module - Context-aware orchestration for DevFactory Beast Mode
// This module provides real-time monitoring, stuck detection, and intervention
// for AI workers during Beast Mode execution.

export * from './types.js';
export * from './stuck-detector.js';
export * from './tracker.js';
export * from './takeover.js';
export * from './intervention.js';
export { ContextLoader } from './context-loader.js';
export { Oracle } from './oracle.js';
export type { OracleConfig, OracleEvents } from './oracle.js';

// Default export
export { Oracle as default } from './oracle.js';
