#!/usr/bin/env node
/**
 * Example WebSocket client for testing the dashboard server
 * Run with: node example-client.js
 */

import { io } from 'socket.io-client';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';

console.log(`Connecting to dashboard server at ${SERVER_URL}...`);

const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
  console.log('Requesting initial state...');
  socket.emit('request:state');
});

socket.on('state:update', (state) => {
  console.log('\n=== State Update ===');
  console.log('Status:', state.status);
  console.log('Phase:', state.currentPhase);
  console.log('Progress:', `${state.progress.completed}/${state.progress.total} (${state.progress.percentage}%)`);
  console.log('Specs:', state.specs.length);
  console.log('Workers:', state.workers.length);
  console.log('==================\n');
});

socket.on('progress:update', (data) => {
  console.log('Progress:', data.progress.percentage + '%', '-', data.currentPhase);
});

socket.on('specs:update', (data) => {
  console.log('Specs updated:', data.specs.length, 'specs');
});

socket.on('workers:update', (data) => {
  console.log('Workers updated:', data.workers.length, 'workers');
  data.workers.forEach(w => {
    console.log(`  - ${w.name}: ${w.status} ${w.currentTask ? '(' + w.currentTask + ')' : ''}`);
  });
});

socket.on('error', (error) => {
  console.error('Error from server:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// Request logs after 2 seconds
setTimeout(() => {
  console.log('Requesting logs...');
  socket.emit('request:logs', { count: 10 });
}, 2000);

// Request metrics after 3 seconds
setTimeout(() => {
  console.log('Requesting metrics...');
  socket.emit('request:metrics');
}, 3000);

socket.on('logs:update', (data) => {
  console.log('\n=== Recent Logs ===');
  data.logs.forEach(log => {
    console.log(`[${new Date(log.timestamp).toISOString()}] ${log.level}: ${log.message}`);
  });
  console.log('===================\n');
});

socket.on('metrics:update', (data) => {
  console.log('\n=== Metrics ===');
  console.log('Tests:', `${data.metrics.testsPassed}/${data.metrics.testsRun} passed`);
  console.log('Files modified:', data.metrics.filesModified);
  console.log('Lines changed:', data.metrics.linesChanged);
  console.log('================\n');
});

// Keep alive
console.log('Client running. Press Ctrl+C to exit.');

process.on('SIGINT', () => {
  console.log('\nClosing connection...');
  socket.close();
  process.exit(0);
});
