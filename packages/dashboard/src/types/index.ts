/**
 * DevFactory v5 Factory Floor Dashboard - Type Definitions
 *
 * This module exports all TypeScript interfaces and types used throughout
 * the dashboard application.
 */

// Dashboard state types
export type {
  DashboardState,
  OverallProgress,
  SpecUIState,
  WorkerUIState,
  OracleUIState,
  InterventionSummary,
  ActivityEntry,
  AssemblyLineState,
  Station,
  SpecCar,
  Connection,
} from './dashboard';

// WebSocket event types
export type {
  WebSocketEvent,
} from './websocket';
