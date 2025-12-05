/**
 * WebSocket Connection Hook
 * Manages socket.io connection with auto-reconnection and event handling
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { WebSocketEvent } from '../types/websocket.js';

export interface UseWebSocketOptions {
  url: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  lastEvent: WebSocketEvent | null;
  connect: () => void;
  disconnect: () => void;
  send: (event: string, data: unknown) => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    const socket = io(url, {
      reconnection: true,
      reconnectionAttempts: reconnectAttempts,
      reconnectionDelay: reconnectDelay,
      autoConnect: false,
    });

    // Connection events
    socket.on('connect', () => {
      console.log('[WebSocket] Connected to', url);
      setIsConnected(true);
      setIsReconnecting(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log('[WebSocket] Reconnection attempt', attempt);
      setIsReconnecting(true);
    });

    socket.on('reconnect', (attempt) => {
      console.log('[WebSocket] Reconnected after', attempt, 'attempts');
      setIsReconnecting(false);
      setIsConnected(true);
    });

    socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed after', reconnectAttempts, 'attempts');
      setIsReconnecting(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      setIsReconnecting(true);
    });

    // Listen for all dashboard events
    socket.onAny((eventName: string, data: unknown) => {
      if (eventName.startsWith('connect') || eventName.startsWith('disconnect') || eventName.startsWith('reconnect')) {
        return; // Skip connection events, they're handled above
      }

      // All events should match WebSocketEvent type structure
      const event = data as WebSocketEvent;
      setLastEvent(event);
    });

    socketRef.current = socket;
    socket.connect();
  }, [url, reconnectAttempts, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('[WebSocket] Disconnecting...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsReconnecting(false);
    }
  }, []);

  const send = useCallback((event: string, data: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('[WebSocket] Cannot send event, not connected:', event);
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    isReconnecting,
    lastEvent,
    connect,
    disconnect,
    send,
  };
}
