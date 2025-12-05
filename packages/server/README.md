# @devfactory/server

Dashboard backend server for DevFactory v5.0. Provides WebSocket connections and REST endpoints for real-time build monitoring.

## Features

- **WebSocket Server**: Real-time state updates to connected dashboards
- **REST API**: HTTP endpoints for state queries
- **State Transformation**: Reads from `.devfactory` directory and aggregates build information
- **Auto-reconnection**: Handles client disconnects and reconnects gracefully
- **Performance**: Only broadcasts updates when state changes

## API Endpoints

### REST Endpoints

- `GET /health` - Server health check
- `GET /api/state` - Full dashboard state
- `GET /api/specs` - Spec status list
- `GET /api/workers` - Worker status list
- `GET /api/metrics` - Build metrics
- `GET /api/logs?count=100` - Recent logs

### WebSocket Events

**Client → Server:**
- `request:state` - Request current state
- `request:logs` - Request logs (with optional count)
- `request:metrics` - Request metrics

**Server → Client:**
- `state:update` - Full state update
- `progress:update` - Progress change
- `specs:update` - Spec status change
- `workers:update` - Worker status change
- `logs:update` - New log entries
- `metrics:update` - Metrics update
- `error` - Error notification

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Environment Variables

- `PORT` - Server port (default: 3001)
- `PROJECT_ROOT` - Project root directory (default: cwd)

## Architecture

```
src/
├── index.ts        # Server setup and REST API
├── websocket.ts    # WebSocket connection handling
├── transformer.ts  # State transformation logic
└── types.ts        # TypeScript type definitions
```

### State Flow

1. **Beast writes state** → `.devfactory/beast/state.json`
2. **Transformer reads** → Loads and transforms state
3. **Server broadcasts** → WebSocket clients receive updates
4. **Dashboard renders** → React components display state

## Integration

The server connects to:
- **@devfactory/oracle**: Beast orchestration system
- **Dashboard UI**: WebSocket client for real-time updates
- **File System**: Reads `.devfactory` directory for state

## Development

The server uses `tsx watch` for hot-reloading during development. Changes to source files automatically restart the server.
