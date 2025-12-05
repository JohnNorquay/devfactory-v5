# Phase 2: Factory Floor Dashboard - Technical Specification

## Architecture Overview

The Factory Floor Dashboard is a React-based real-time visualization that connects to the DevFactory backend via WebSocket for live updates.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React App)                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    App Shell                                     │   │
│  │  ┌───────────┐ ┌───────────────────────────────────────────┐   │   │
│  │  │  Header   │ │          Assembly Line (SVG)              │   │   │
│  │  └───────────┘ └───────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │                   Progress Bar                          │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │   │
│  │  │  Workers  │ │   Specs   │ │  Oracle   │ │ Activity  │       │   │
│  │  │   Panel   │ │  Progress │ │   Panel   │ │   Feed    │       │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │   │
│  │  ┌───────────────────────────────────────────────────────┐     │   │
│  │  │                     Footer                            │     │   │
│  │  └───────────────────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                │                                        │
│                         WebSocket Connection                            │
│                                │                                        │
└────────────────────────────────│────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXPRESS + SOCKET.IO SERVER                            │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │ State       │───►│ Transformer │───►│ WebSocket   │                 │
│  │ Watcher     │    │             │    │ Emitter     │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
│         │                                                               │
│         ▼                                                               │
│  .devfactory/beast/state.json                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Module Structure

### Backend Enhancement

```
~/.claude/plugins/devfactory-distributed/
├── src/
│   └── dashboard/
│       ├── server.ts         # ENHANCE: Add new endpoints, events
│       ├── transformer.ts    # NEW: State → UI state transformer
│       └── types.ts          # NEW: Dashboard-specific types
└── dashboard/
    └── server.ts             # EXISTING: Move/enhance
```

### Frontend Application

```
packages/dashboard/
├── public/
│   └── index.html
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   └── useDashboardState.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Grid.tsx
│   │   ├── assembly-line/
│   │   │   ├── AssemblyLine.tsx
│   │   │   ├── Station.tsx
│   │   │   ├── SpecCar.tsx
│   │   │   ├── Connector.tsx
│   │   │   └── ParallelStation.tsx
│   │   ├── progress/
│   │   │   ├── OverallProgressBar.tsx
│   │   │   ├── SpecProgressList.tsx
│   │   │   └── SpecProgressItem.tsx
│   │   ├── workers/
│   │   │   ├── WorkerPanel.tsx
│   │   │   ├── WorkerCard.tsx
│   │   │   └── WorkerDetailModal.tsx
│   │   ├── oracle/
│   │   │   ├── OraclePanel.tsx
│   │   │   ├── OracleStatusIndicator.tsx
│   │   │   └── RecentInterventionsList.tsx
│   │   ├── activity/
│   │   │   ├── ActivityFeed.tsx
│   │   │   └── ActivityItem.tsx
│   │   └── modals/
│   │       ├── Modal.tsx
│   │       ├── SpecDetailModal.tsx
│   │       └── StationDetailModal.tsx
│   ├── types/
│   │   └── dashboard.ts
│   └── theme/
│       └── constants.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

---

## Detailed Component Specifications

### 1. Backend: State Transformer (`transformer.ts`)

**Purpose**: Convert raw state.json into UI-friendly structure.

```typescript
interface RawState {
  version: string;
  status: string;
  orchestrator: { ... };
  workers: { ... };
  tasks: { ... };
  queues: { ... };
  activity: ActivityEntry[];
}

interface DashboardState {
  connection: 'connected' | 'disconnected' | 'reconnecting';

  overall: {
    totalTasks: number;
    completedTasks: number;
    percentage: number;
    status: 'idle' | 'running' | 'complete' | 'stuck';
    elapsedTime: number;
  };

  specs: SpecUIState[];

  workers: Record<string, WorkerUIState>;

  oracle: OracleUIState;

  activity: ActivityEntry[];

  assemblyLine: {
    activeSpec: string | null;
    stations: {
      database: StationState;
      backend: StationState;
      frontend: StationState;
      testing: StationState;
    };
    parallelSpecs: ParallelSpecState[];
  };
}

interface SpecUIState {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'complete' | 'stuck';
  progress: number;
  currentLayer: string | null;
  tasks: { total: number; completed: number };
  hasUI: boolean;  // For verification theater button
}

interface WorkerUIState {
  id: string;
  name: string;
  status: 'working' | 'verifying' | 'idle' | 'stuck' | 'offline';
  currentTask: string | null;
  currentTaskTitle: string | null;
  statusDuration: number;  // ms in current status
}

interface StationState {
  status: 'idle' | 'working' | 'complete';
  progress: number;
  currentTask: string | null;
  tasksCompleted: number;
  tasksTotal: number;
}

// Transformer function
function transformState(raw: RawState): DashboardState {
  // Calculate overall progress
  // Group tasks by spec
  // Determine assembly line positions
  // Format activity entries
  // Return dashboard state
}
```

### 2. Backend: WebSocket Events

**Enhanced Events**:
```typescript
// Emitted events (server → client)
interface ServerEvents {
  'state': (state: DashboardState) => void;
  'spec_update': (spec: SpecUIState) => void;
  'worker_update': (worker: WorkerUIState) => void;
  'oracle_update': (oracle: OracleUIState) => void;
  'activity': (entry: ActivityEntry) => void;
  'task_complete': (taskId: string, specId: string) => void;
  'spec_complete': (specId: string) => void;
  'build_complete': () => void;
}

// Received events (client → server)
interface ClientEvents {
  'subscribe': () => void;
  'get_spec_detail': (specId: string) => void;
  'get_worker_detail': (workerId: string) => void;
}
```

### 3. Frontend: Theme Constants (`theme/constants.ts`)

```typescript
export const colors = {
  // Background
  bg: {
    primary: '#0d1117',
    secondary: '#161b22',
    tertiary: '#21262d',
  },

  // Borders
  border: {
    primary: '#30363d',
    secondary: '#484f58',
  },

  // Text
  text: {
    primary: '#c9d1d9',
    secondary: '#8b949e',
    muted: '#6e7681',
  },

  // Status
  status: {
    success: '#238636',
    successBg: '#2ea043',
    warning: '#f0883e',
    error: '#f85149',
    info: '#58a6ff',
    purple: '#a371f7',
  },

  // Assembly line
  station: {
    idle: '#484f58',
    working: '#f0883e',
    complete: '#238636',
  },
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};

export const typography = {
  fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', monospace",
  sizes: {
    xs: '0.75rem',
    sm: '0.85rem',
    base: '1rem',
    lg: '1.25rem',
    xl: '1.5rem',
    '2xl': '2rem',
  },
};

export const animation = {
  fast: '0.15s ease',
  normal: '0.3s ease',
  slow: '0.5s ease',
};
```

### 4. Frontend: useWebSocket Hook

```typescript
interface UseWebSocketOptions {
  url: string;
  onState?: (state: DashboardState) => void;
  onActivity?: (entry: ActivityEntry) => void;
  reconnectInterval?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  subscribe: () => void;
  getSpecDetail: (specId: string) => void;
}

function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    const newSocket = io(options.url, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => setConnectionStatus('connected'));
    newSocket.on('disconnect', () => setConnectionStatus('disconnected'));
    newSocket.on('reconnecting', () => setConnectionStatus('reconnecting'));

    newSocket.on('state', options.onState);
    newSocket.on('activity', options.onActivity);

    setSocket(newSocket);

    return () => newSocket.close();
  }, [options.url]);

  // ... return methods
}
```

### 5. Frontend: Assembly Line Component

```typescript
interface AssemblyLineProps {
  stations: Record<string, StationState>;
  activeSpec: string | null;
  parallelSpecs: ParallelSpecState[];
}

function AssemblyLine({ stations, activeSpec, parallelSpecs }: AssemblyLineProps) {
  return (
    <svg viewBox="0 0 1200 400" className={styles.assemblyLine}>
      {/* Main line */}
      <line x1="50" y1="100" x2="1150" y2="100" className={styles.mainLine} />

      {/* Stations */}
      <Station name="Database" x={150} y={100} state={stations.database} />
      <Station name="Backend" x={450} y={100} state={stations.backend} />
      <Station name="Frontend" x={750} y={100} state={stations.frontend} />
      <Station name="Testing" x={1050} y={100} state={stations.testing} />

      {/* Connectors */}
      <Connector from={{x: 200, y: 100}} to={{x: 400, y: 100}} />
      <Connector from={{x: 500, y: 100}} to={{x: 700, y: 100}} />
      <Connector from={{x: 800, y: 100}} to={{x: 1000, y: 100}} />

      {/* Active spec "car" */}
      {activeSpec && (
        <SpecCar
          spec={activeSpec}
          position={calculatePosition(stations)}
        />
      )}

      {/* Parallel work stations */}
      {parallelSpecs.map((spec, i) => (
        <ParallelStation
          key={spec.id}
          spec={spec}
          y={200 + i * 80}
          joinX={spec.joinPoint}
        />
      ))}
    </svg>
  );
}
```

### 6. Frontend: Station Component

```typescript
interface StationProps {
  name: string;
  x: number;
  y: number;
  state: StationState;
  onClick?: () => void;
}

function Station({ name, x, y, state, onClick }: StationProps) {
  const color = getStationColor(state.status);

  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} className={styles.station}>
      {/* Station base */}
      <rect
        x={-40} y={-40}
        width={80} height={80}
        rx={8}
        fill={color}
        className={state.status === 'working' ? styles.working : ''}
      />

      {/* Station icon */}
      <StationIcon type={name.toLowerCase()} />

      {/* Station name */}
      <text y={60} textAnchor="middle" className={styles.stationName}>
        {name}
      </text>

      {/* Progress indicator */}
      {state.status === 'working' && (
        <ProgressRing
          progress={state.progress}
          radius={35}
        />
      )}

      {/* Task count */}
      <text y={80} textAnchor="middle" className={styles.taskCount}>
        {state.tasksCompleted}/{state.tasksTotal}
      </text>
    </g>
  );
}
```

### 7. Frontend: Worker Card Component

```typescript
interface WorkerCardProps {
  worker: WorkerUIState;
  onClick: () => void;
}

function WorkerCard({ worker, onClick }: WorkerCardProps) {
  const statusEmoji = {
    working: '🔨',
    verifying: '🔍',
    idle: '😴',
    stuck: '🚨',
    offline: '💀',
  };

  return (
    <div
      className={cn(styles.workerCard, styles[worker.status])}
      onClick={onClick}
    >
      <div className={styles.icon}>{statusEmoji[worker.status]}</div>
      <div className={styles.info}>
        <div className={styles.name}>{worker.name}</div>
        <div className={styles.status}>{worker.status}</div>
        {worker.currentTaskTitle && (
          <div className={styles.task}>{worker.currentTaskTitle}</div>
        )}
      </div>
      <div className={styles.duration}>
        {formatDuration(worker.statusDuration)}
      </div>
    </div>
  );
}
```

### 8. Frontend: Activity Feed Component

```typescript
interface ActivityFeedProps {
  entries: ActivityEntry[];
  maxHeight?: number;
}

function ActivityFeed({ entries, maxHeight = 300 }: ActivityFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  return (
    <div
      ref={feedRef}
      className={styles.activityFeed}
      style={{ maxHeight }}
      onScroll={handleScroll}
    >
      {entries.map((entry, i) => (
        <ActivityItem key={entry.timestamp + i} entry={entry} />
      ))}
    </div>
  );
}

function ActivityItem({ entry }: { entry: ActivityEntry }) {
  const typeColors = {
    task_complete: 'success',
    spec_complete: 'info',
    worker_update: 'default',
    oracle_intervention: 'purple',
    error: 'error',
  };

  return (
    <div className={cn(styles.activityItem, styles[typeColors[entry.type]])}>
      <span className={styles.time}>
        {formatTime(entry.timestamp)}
      </span>
      <span className={styles.message}>{entry.message}</span>
    </div>
  );
}
```

---

## API Endpoints

### GET /api/state
Returns current dashboard state.

### GET /api/specs
Returns list of all specs with progress.

### GET /api/specs/:id
Returns detailed spec information.

### GET /api/workers/:id
Returns detailed worker information.

### GET /api/oracle
Returns Oracle status and recent interventions.

---

## WebSocket Protocol

### Connection
```javascript
const socket = io('http://localhost:5555');
socket.emit('subscribe');
```

### State Updates
```javascript
socket.on('state', (state: DashboardState) => {
  // Full state update
});

socket.on('activity', (entry: ActivityEntry) => {
  // Single activity entry (for incremental updates)
});
```

---

## CSS Architecture

Using CSS Modules with the following structure:
- `components/[Component].module.css` - Component-specific styles
- `theme/variables.css` - CSS custom properties from theme constants
- `theme/global.css` - Reset and global styles

---

## Testing Strategy

### Unit Tests (Vitest)
- State transformer functions
- Utility functions (formatTime, formatDuration)
- Custom hooks (with testing-library/react-hooks)

### Component Tests (Vitest + Testing Library)
- AssemblyLine rendering
- WorkerCard status display
- Modal open/close behavior

### E2E Tests (Playwright)
- Dashboard loads correctly
- WebSocket connects and updates
- Click interactions work

---

## Performance Considerations

1. **State Updates**: Debounce rapid state changes (max 2 updates/second)
2. **Animation**: Use CSS transforms and opacity for GPU acceleration
3. **Memory**: Limit activity feed to last 100 entries
4. **Render**: Use React.memo for pure components

---

*This spec defines the technical implementation for the Factory Floor Dashboard.*
