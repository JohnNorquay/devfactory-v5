import { Server, Socket } from 'socket.io';
import { DashboardStateTransformer } from './transformer.js';
import type { DashboardState } from './types.js';

const UPDATE_INTERVAL = 1000; // Update every 1 second
const CLIENT_TIMEOUT = 30000; // 30 seconds

export function setupWebSocket(io: Server, projectRoot: string = process.cwd()) {
  const transformer = new DashboardStateTransformer(projectRoot);
  let updateTimer: NodeJS.Timeout | null = null;
  let currentState: DashboardState | null = null;

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Send initial state immediately
    sendStateToClient(socket);

    // Handle client requests
    socket.on('request:state', async () => {
      await sendStateToClient(socket);
    });

    socket.on('request:logs', async ({ count = 100 }) => {
      // Send filtered logs
      if (currentState) {
        socket.emit('logs:update', {
          logs: currentState.logs.slice(-count),
        });
      }
    });

    socket.on('request:metrics', async () => {
      if (currentState) {
        socket.emit('metrics:update', {
          metrics: currentState.metrics,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Set up connection timeout
    const timeout = setTimeout(() => {
      if (socket.connected) {
        console.log('Client timeout:', socket.id);
        socket.disconnect();
      }
    }, CLIENT_TIMEOUT);

    socket.on('disconnect', () => {
      clearTimeout(timeout);
    });
  });

  // Broadcast state updates to all connected clients
  async function broadcastState() {
    try {
      const newState = await transformer.getState();

      // Only broadcast if state has changed
      if (JSON.stringify(newState) !== JSON.stringify(currentState)) {
        currentState = newState;
        io.emit('state:update', newState);

        // Also emit specific events for different parts of state
        io.emit('progress:update', {
          progress: newState.progress,
          currentPhase: newState.currentPhase,
        });

        io.emit('specs:update', {
          specs: newState.specs,
        });

        io.emit('workers:update', {
          workers: newState.workers,
        });
      }
    } catch (error) {
      console.error('Error broadcasting state:', error);
      io.emit('error', {
        message: 'Failed to update state',
        error: String(error),
      });
    }
  }

  async function sendStateToClient(socket: Socket) {
    try {
      const state = await transformer.getState();
      currentState = state;
      socket.emit('state:update', state);
    } catch (error) {
      console.error('Error sending state to client:', error);
      socket.emit('error', {
        message: 'Failed to load state',
        error: String(error),
      });
    }
  }

  // Start periodic updates
  function startUpdates() {
    if (updateTimer) return;

    updateTimer = setInterval(async () => {
      if (io.engine.clientsCount > 0) {
        await broadcastState();
      }
    }, UPDATE_INTERVAL);
  }

  function stopUpdates() {
    if (updateTimer) {
      clearInterval(updateTimer);
      updateTimer = null;
    }
  }

  // Monitor connections
  io.on('connection', () => {
    if (io.engine.clientsCount > 0) {
      startUpdates();
    }
  });

  io.on('disconnect', () => {
    if (io.engine.clientsCount === 0) {
      stopUpdates();
    }
  });

  // Cleanup function
  return () => {
    stopUpdates();
    io.close();
  };
}
