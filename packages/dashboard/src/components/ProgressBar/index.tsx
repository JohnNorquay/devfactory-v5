import type { OverallProgress } from '../../types/dashboard';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  progress: OverallProgress;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const { percentage, completedTasks, totalTasks, status } = progress;

  // Determine status badge styling
  const getStatusClass = () => {
    switch (status) {
      case 'running':
        return styles.statusRunning;
      case 'completed':
        return styles.statusCompleted;
      case 'failed':
        return styles.statusFailed;
      case 'paused':
        return styles.statusPaused;
      default:
        return styles.statusIdle;
    }
  };

  // Format status text
  const getStatusText = () => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'paused':
        return 'Paused';
      default:
        return 'Idle';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.percentageText}>
          {Math.round(percentage)}%
        </div>
        <div className={`${styles.statusBadge} ${getStatusClass()}`}>
          {getStatusText()}
        </div>
      </div>

      <div className={styles.progressBarContainer}>
        <div
          className={`${styles.progressFill} ${
            status === 'running' ? styles.fillAnimated : ''
          }`}
          style={{ width: `${percentage}%` }}
        >
          {status === 'running' && <div className={styles.shimmer} />}
        </div>
      </div>

      <div className={styles.taskCount}>
        {completedTasks} / {totalTasks} tasks
      </div>
    </div>
  );
}
