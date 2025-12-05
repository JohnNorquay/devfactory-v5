import { useState, useEffect, useCallback } from 'react';
import { BrowserView } from './BrowserView';
import { ScenarioSteps } from './ScenarioSteps';
import { ThoughtStreamPanel } from './ThoughtStreamPanel';
import { TheaterControls } from './TheaterControls';
import styles from './Theater.module.css';

export interface Thought {
  type: 'observation' | 'action' | 'analysis' | 'decision' | 'error';
  message: string;
  timestamp: Date;
}

export interface ScenarioStep {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface Scenario {
  id: string;
  name: string;
  steps: ScenarioStep[];
}

interface TheaterProps {
  wsUrl?: string;
  onClose?: () => void;
}

export function Theater({ wsUrl = 'ws://localhost:3001', onClose }: TheaterProps) {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => console.log('[Theater] Connected');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (e) {
        console.error('[Theater] Parse error:', e);
      }
    };
    ws.onclose = () => console.log('[Theater] Disconnected');
    setSocket(ws);
    return () => ws.close();
  }, [wsUrl]);

  const handleMessage = useCallback((data: { type: string; payload: unknown }) => {
    switch (data.type) {
      case 'screenshot':
        setScreenshot(data.payload as string);
        break;
      case 'thought':
        const t = data.payload as { type: Thought['type']; message: string; timestamp: string };
        setThoughts(prev => [...prev.slice(-99), { type: t.type, message: t.message, timestamp: new Date(t.timestamp) }]);
        break;
      case 'step_update':
        const s = data.payload as { stepIndex: number; status: ScenarioStep['status'] };
        setCurrentStep(s.stepIndex);
        setCurrentScenario(prev => {
          if (!prev) return prev;
          const newSteps = [...prev.steps];
          newSteps[s.stepIndex] = { ...newSteps[s.stepIndex], status: s.status };
          return { ...prev, steps: newSteps };
        });
        break;
      case 'scenario_loaded':
        setCurrentScenario(data.payload as Scenario);
        setCurrentStep(0);
        break;
      case 'status':
        const st = data.payload as { isRunning: boolean; isPaused: boolean };
        setIsRunning(st.isRunning);
        setIsPaused(st.isPaused);
        break;
    }
  }, []);

  const handleStart = useCallback(() => {
    socket?.send(JSON.stringify({ type: 'start', payload: { speed } }));
    setIsRunning(true);
    setIsPaused(false);
  }, [socket, speed]);

  const handleStop = useCallback(() => {
    socket?.send(JSON.stringify({ type: 'stop' }));
    setIsRunning(false);
    setIsPaused(false);
  }, [socket]);

  const handlePause = useCallback(() => {
    socket?.send(JSON.stringify({ type: isPaused ? 'resume' : 'pause' }));
    setIsPaused(!isPaused);
  }, [socket, isPaused]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    socket?.send(JSON.stringify({ type: 'speed', payload: newSpeed }));
  }, [socket]);

  const handleScenarioSelect = useCallback((scenarioId: string) => {
    socket?.send(JSON.stringify({ type: 'load_scenario', payload: scenarioId }));
  }, [socket]);

  return (
    <div className={styles.theater}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>🎭</span>
          <h1>Verification Theater</h1>
        </div>
        <button className={styles.closeButton} onClick={onClose}>← Back to Dashboard</button>
      </header>
      <div className={styles.content}>
        <div className={styles.mainView}>
          <BrowserView screenshot={screenshot} />
          <TheaterControls
            isRunning={isRunning}
            isPaused={isPaused}
            playbackSpeed={speed}
            scenarios={[]}
            selectedScenario={currentScenario?.id || null}
            onStart={handleStart}
            onStop={handleStop}
            onPause={handlePause}
            onSpeedChange={handleSpeedChange}
            onScenarioSelect={handleScenarioSelect}
          />
        </div>
        <aside className={styles.sidebar}>
          <ScenarioSteps scenario={currentScenario} currentStep={currentStep} />
          <ThoughtStreamPanel thoughts={thoughts} />
        </aside>
      </div>
    </div>
  );
}
