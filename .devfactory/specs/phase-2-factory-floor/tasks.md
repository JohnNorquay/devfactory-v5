# Phase 2: Factory Floor Dashboard - Tasks

## Overview
Total tasks: 32
Layers: Database (0), Backend (8), Frontend (20), Testing (4)

---

## Backend Layer

### Server Enhancements

- [ ] 1.1 Add dashboard state transformer to convert raw state to UI-friendly format
- [ ] 1.2 Create spec aggregation endpoint (/api/specs with progress)
- [ ] 1.3 Create worker details endpoint (/api/workers/:id)
- [ ] 1.4 Add Oracle status endpoint (/api/oracle)
- [ ] 1.5 Enhance WebSocket to emit typed events (spec_update, worker_update, etc.)
- [ ] 1.6 Add activity event buffering and batching
- [ ] 1.7 Implement connection health check endpoint
- [ ] 1.8 Add CORS configuration for local development

---

## Frontend Layer

### Project Setup

- [ ] 2.1 Initialize React + TypeScript project with Vite in packages/dashboard
- [ ] 2.2 Configure TypeScript, ESLint, CSS modules
- [ ] 2.3 Set up Socket.io-client connection with auto-reconnect
- [ ] 2.4 Create theme constants (colors, fonts, spacing)
- [ ] 2.5 Create shared TypeScript interfaces for dashboard state

### Core Layout

- [ ] 3.1 Create App shell with header, main, footer layout
- [ ] 3.2 Create Header component (title, connection status, time)
- [ ] 3.3 Create Footer component (Oracle status summary, quick actions)
- [ ] 3.4 Create responsive grid layout for panels

### Assembly Line Visualization

- [ ] 4.1 Create AssemblyLine container component
- [ ] 4.2 Create Station component (database, backend, frontend, testing)
- [ ] 4.3 Create SpecCar component (the "car" moving through stations)
- [ ] 4.4 Create connector lines between stations (SVG)
- [ ] 4.5 Implement station progress indicators
- [ ] 4.6 Implement car movement animation between stations
- [ ] 4.7 Create ParallelStation component for off-line specs
- [ ] 4.8 Implement parallel spec positioning logic

### Progress Components

- [ ] 5.1 Create OverallProgressBar component
- [ ] 5.2 Create SpecProgressList component
- [ ] 5.3 Create SpecProgressItem with mini progress bar
- [ ] 5.4 Implement percentage calculations and display

### Worker Panel

- [ ] 6.1 Create WorkerPanel container
- [ ] 6.2 Create WorkerCard component
- [ ] 6.3 Implement worker status styling (colors, icons)
- [ ] 6.4 Add worker click handler for modal
- [ ] 6.5 Create WorkerDetailModal component

### Oracle Panel

- [ ] 7.1 Create OraclePanel component
- [ ] 7.2 Create OracleStatusIndicator (running/stopped)
- [ ] 7.3 Create RecentInterventionsList component
- [ ] 7.4 Create InterventionItem component

### Activity Feed

- [ ] 8.1 Create ActivityFeed container with scroll
- [ ] 8.2 Create ActivityItem component (color-coded by type)
- [ ] 8.3 Implement auto-scroll to bottom (with user override)
- [ ] 8.4 Add timestamp formatting

### Modals & Interactions

- [ ] 9.1 Create Modal wrapper component
- [ ] 9.2 Create SpecDetailModal component
- [ ] 9.3 Create StationDetailModal component
- [ ] 9.4 Implement click handlers for all interactive elements

### State Management

- [ ] 10.1 Create useWebSocket hook for connection management
- [ ] 10.2 Create useDashboardState hook for state management
- [ ] 10.3 Implement state updates from WebSocket events
- [ ] 10.4 Add connection status handling (connected, disconnected, reconnecting)

---

## Testing Layer

- [ ] 11.1 Create unit tests for state transformation functions
- [ ] 11.2 Create component tests for AssemblyLine
- [ ] 11.3 Create component tests for WorkerCard
- [ ] 11.4 Create E2E test for dashboard with mock WebSocket

---

## Task Dependencies

```
Backend:
1.1 → 1.2, 1.3, 1.4 (parallel) → 1.5 → 1.6 → 1.7 → 1.8

Frontend Setup:
2.1 → 2.2 → 2.3 → 2.4 → 2.5

Frontend depends on Backend 1.1 being complete for state shape

Layout (after 2.5):
3.1 → 3.2, 3.3 (parallel) → 3.4

Assembly Line (after 3.4):
4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7 → 4.8

Progress (after 3.4):
5.1 → 5.2 → 5.3 → 5.4

Workers (after 3.4):
6.1 → 6.2 → 6.3 → 6.4 → 6.5

Oracle (after 3.4):
7.1 → 7.2 → 7.3 → 7.4

Activity (after 3.4):
8.1 → 8.2 → 8.3 → 8.4

Modals (after panels):
9.1 → 9.2, 9.3 (parallel) → 9.4

State (can start with 2.3):
10.1 → 10.2 → 10.3 → 10.4

Testing (after implementation):
11.1 → 11.2, 11.3 (parallel) → 11.4
```

---

## Verification Criteria Per Task

### Backend (1.x)
- Endpoint returns correct JSON structure
- WebSocket events emit properly
- No errors in server logs

### Frontend Setup (2.x)
- `npm run dev` starts without errors
- TypeScript compiles without errors
- Lint passes

### Layout (3.x)
- Components render without errors
- Responsive at different widths
- Semantic HTML structure

### Assembly Line (4.x)
- Stations render in correct order
- Cars show spec information
- Animations smooth (60fps)
- Parallel specs positioned correctly

### Progress (5.x)
- Percentages calculate correctly
- Progress bars animate smoothly
- List shows all specs

### Workers (6.x)
- All workers displayed
- Status colors correct
- Click opens modal

### Oracle (7.x)
- Shows running/stopped correctly
- Lists recent interventions
- Updates in real-time

### Activity (8.x)
- Shows recent events
- Auto-scrolls (when enabled)
- Color coding correct

### Modals (9.x)
- Open/close cleanly
- Show correct data
- Keyboard accessible (Esc to close)

### State (10.x)
- WebSocket connects reliably
- State updates correctly
- Reconnects on disconnect

### Tests (11.x)
- All tests pass
- Good coverage of critical paths

---

## Notes

- Backend tasks enhance existing `dashboard/server.ts`
- Frontend is a new React app in `packages/dashboard/`
- Testing uses Vitest for unit/component, Playwright for E2E
- Assembly line uses raw SVG (no external charting library)
