import { useMemo } from 'react';
import styles from './OraclePanel.module.css';

interface OracleStatusProps {
  status: 'watching' | 'intervening' | 'idle';
  lastCheck?: Date;
}

export function OracleStatus({ status, lastCheck }: OracleStatusProps) {
  const statusText = useMemo(() => {
    switch (status) {
      case 'watching':
        return 'Watching the Factory';
      case 'intervening':
        return 'Taking Action';
      case 'idle':
        return 'Resting';
      default:
        return 'Unknown';
    }
  }, [status]);

  const statusClass = useMemo(() => {
    switch (status) {
      case 'watching':
        return styles.statusWatching;
      case 'intervening':
        return styles.statusIntervening;
      case 'idle':
        return styles.statusIdle;
      default:
        return '';
    }
  }, [status]);

  const timeAgo = useMemo(() => {
    if (!lastCheck) return 'Never';

    const now = new Date().getTime();
    const checkTime = new Date(lastCheck).getTime();
    const diff = now - checkTime;

    if (diff < 1000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  }, [lastCheck]);

  return (
    <div className={`${styles.statusContainer} ${statusClass}`}>
      <div className={styles.eyeContainer}>
        <svg
          className={styles.eye}
          viewBox="0 0 200 120"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Eye outline (almond shape) */}
          <ellipse
            cx="100"
            cy="60"
            rx="80"
            ry="40"
            className={styles.eyeOutline}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />

          {/* Iris (outer circle) */}
          <circle
            cx="100"
            cy="60"
            r="25"
            className={styles.iris}
            fill="currentColor"
            opacity="0.3"
          />

          {/* Pupil (inner circle) */}
          <circle
            cx="100"
            cy="60"
            r="15"
            className={styles.pupil}
            fill="currentColor"
          />

          {/* Highlight/gleam */}
          <circle
            cx="108"
            cy="52"
            r="6"
            fill="white"
            opacity="0.8"
          />

          {/* Additional glow effect for intervening state */}
          {status === 'intervening' && (
            <circle
              cx="100"
              cy="60"
              r="35"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.5"
              className={styles.glowRing}
            />
          )}
        </svg>
      </div>

      <div className={styles.statusText}>
        <div className={styles.statusMain}>{statusText}</div>
        <div className={styles.statusTime}>Last check: {timeAgo}</div>
      </div>
    </div>
  );
}
