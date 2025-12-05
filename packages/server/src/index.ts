import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { DashboardStateTransformer } from './transformer.js';
import { setupWebSocket } from './websocket.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});

// Get current project root (can be overridden by env var)
const projectRoot = process.env.PROJECT_ROOT || process.cwd();
const transformer = new DashboardStateTransformer(projectRoot);

// API endpoints
app.get('/api/state', async (req, res) => {
  try {
    const state = await transformer.getState();
    res.json(state);
  } catch (error) {
    console.error('Error getting state:', error);
    res.status(500).json({
      error: 'Failed to get dashboard state',
      message: String(error),
    });
  }
});

app.get('/api/specs', async (req, res) => {
  try {
    const state = await transformer.getState();
    res.json({ specs: state.specs });
  } catch (error) {
    console.error('Error getting specs:', error);
    res.status(500).json({
      error: 'Failed to get specs',
      message: String(error),
    });
  }
});

app.get('/api/workers', async (req, res) => {
  try {
    const state = await transformer.getState();
    res.json({ workers: state.workers });
  } catch (error) {
    console.error('Error getting workers:', error);
    res.status(500).json({
      error: 'Failed to get workers',
      message: String(error),
    });
  }
});

app.get('/api/metrics', async (req, res) => {
  try {
    const state = await transformer.getState();
    res.json({ metrics: state.metrics });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      error: 'Failed to get metrics',
      message: String(error),
    });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 100;
    const state = await transformer.getState();
    res.json({ logs: state.logs.slice(-count) });
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({
      error: 'Failed to get logs',
      message: String(error),
    });
  }
});

// Set up WebSocket handling
setupWebSocket(io, projectRoot);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Dashboard server running on port ${PORT}`);
  console.log(`Project root: ${projectRoot}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`REST API: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
