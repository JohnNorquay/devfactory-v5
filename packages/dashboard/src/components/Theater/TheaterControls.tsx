import { Scenario } from './index';
import styles from './Theater.module.css';

interface TheaterControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  playbackSpeed: number;
  scenarios: Scenario[];
  selectedScenario: string | null;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onSpeedChange: (speed: number) => void;
  onScenarioSelect: (scenarioId: string) => void;
}

const SPEED_OPTIONS = [0.5, 1, 1.5, 2];

const MOCK_SCENARIOS = [
  { id: 'scenario-1', name: 'User Login Flow' },
  { id: 'scenario-2', name: 'Checkout Process' },
  { id: 'scenario-3', name: 'Product Search' },
  { id: 'scenario-4', name: 'Form Validation' },
];

export function TheaterControls({
  isRunning,
  isPaused,
  playbackSpeed,
  scenarios,
  selectedScenario,
  onStart,
  onStop,
  onPause,
  onSpeedChange,
  onScenarioSelect,
}: TheaterControlsProps) {
  const handleScenarioChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const scenarioId = event.target.value;
    if (scenarioId) {
      onScenarioSelect(scenarioId);
    }
  };

  return (
    <div className={styles.theaterControls}>
      <div className={styles.controlsSection}>
        <div className={styles.controlsLabel}>Scenario</div>
        <select
          className={styles.scenarioSelect}
          value={selectedScenario || ''}
          onChange={handleScenarioChange}
          disabled={isRunning}
        >
          <option value="">Select a scenario...</option>
          {scenarios.length === 0 && MOCK_SCENARIOS.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
            </option>
          ))}
          {scenarios.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.controlsSection}>
        <div className={styles.controlsLabel}>Playback</div>
        <div className={styles.playbackControls}>
          {!isRunning ? (
            <button
              className={`${styles.controlButton} ${styles.startButton}`}
              onClick={onStart}
              disabled={!selectedScenario}
              title="Start verification"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 5V19L19 12L8 5Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Start</span>
            </button>
          ) : (
            <>
              <button
                className={`${styles.controlButton} ${styles.pauseButton}`}
                onClick={onPause}
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 5V19L19 12L8 5Z"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="6" y="5" width="4" height="14" fill="currentColor" />
                    <rect x="14" y="5" width="4" height="14" fill="currentColor" />
                  </svg>
                )}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              <button
                className={`${styles.controlButton} ${styles.stopButton}`}
                onClick={onStop}
                title="Stop verification"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="6"
                    y="6"
                    width="12"
                    height="12"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Stop</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles.controlsSection}>
        <div className={styles.controlsLabel}>Speed</div>
        <div className={styles.speedControls}>
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              className={`${styles.speedButton} ${
                playbackSpeed === speed ? styles.speedButtonActive : ''
              }`}
              onClick={() => onSpeedChange(speed)}
              disabled={!isRunning && !selectedScenario}
              title={`${speed}x speed`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      <div className={styles.statusIndicator}>
        <div className={`${styles.statusDot} ${isRunning ? styles.statusDotRunning : ''}`} />
        <span className={styles.statusText}>
          {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Idle'}
        </span>
      </div>
    </div>
  );
}
