import type { WorkerUIState } from '../../types/dashboard';
import styles from './WorkerPanel.module.css';

interface WorkerCardProps {
  worker: WorkerUIState;
  onClick?: () => void;
}

/**
 * Get worker avatar initials based on display name
 */
function getWorkerInitials(displayName: string): string {
  const nameMap: Record<string, string> = {
    'Database Coordinator': 'DB',
    'Backend Coordinator': 'BE',
    'Frontend Coordinator': 'FE',
    'Testing Coordinator': 'TE',
  };

  return nameMap[displayName] || displayName.substring(0, 2).toUpperCase();
}

/**
 * Format stuck duration into human-readable string
 */
function formatStuckDuration(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 min';
  return `${minutes} min`;
}

export function WorkerCard({ worker, onClick }: WorkerCardProps) {
  const initials = getWorkerInitials(worker.displayName);
  const isClickable = onClick !== undefined;

  return (
    <div
      className={`${styles.workerCard} ${styles[`status-${worker.status}`]} ${
        isClickable ? styles.clickable : ''
      }`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {/* Worker Avatar */}
      <div className={`${styles.avatar} ${styles[`avatar-${worker.status}`]}`}>
        <span className={styles.initials}>{initials}</span>
      </div>

      {/* Worker Info */}
      <div className={styles.workerInfo}>
        <div className={styles.header}>
          <h3 className={styles.workerName}>{worker.displayName}</h3>
          <span className={`${styles.statusBadge} ${styles[`badge-${worker.status}`]}`}>
            {worker.status}
          </span>
        </div>

        {/* Current Task */}
        {worker.currentTask && (
          <p className={styles.currentTask} title={worker.currentTask}>
            {worker.currentTask}
          </p>
        )}

        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Completed</span>
            <span className={styles.statValue}>{worker.tasksCompleted}</span>
          </div>

          {/* Stuck Duration */}
          {worker.status === 'stuck' && worker.stuckDuration && (
            <div className={`${styles.stat} ${styles.stuckIndicator}`}>
              <span className={styles.stuckLabel}>
                Stuck for {formatStuckDuration(worker.stuckDuration)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
