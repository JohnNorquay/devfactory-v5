import type { WorkerUIState } from '../../types/dashboard';
import { WorkerCard } from './WorkerCard';
import styles from './WorkerPanel.module.css';

interface WorkerPanelProps {
  workers: Record<string, WorkerUIState>;
  onWorkerClick?: (workerId: string) => void;
}

/**
 * Get sort priority for worker status
 * Lower number = higher priority (shows first)
 */
function getStatusPriority(status: WorkerUIState['status']): number {
  const priorityMap = {
    stuck: 0,
    working: 1,
    idle: 2,
    offline: 3,
  };
  return priorityMap[status];
}

/**
 * Sort workers by status priority
 */
function sortWorkers(workers: WorkerUIState[]): WorkerUIState[] {
  return [...workers].sort((a, b) => {
    const priorityDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
    if (priorityDiff !== 0) return priorityDiff;

    // If same priority, sort by display name
    return a.displayName.localeCompare(b.displayName);
  });
}

export function WorkerPanel({ workers, onWorkerClick }: WorkerPanelProps) {
  // Convert workers record to array
  const workerArray = Object.values(workers);

  // Sort workers by status priority
  const sortedWorkers = sortWorkers(workerArray);

  // Handle empty state
  if (sortedWorkers.length === 0) {
    return (
      <div className={styles.workerPanel}>
        <div className={styles.emptyState}>
          <p>No workers available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.workerPanel}>
      <div className={styles.workerGrid}>
        {sortedWorkers.map((worker) => (
          <WorkerCard
            key={worker.id}
            worker={worker}
            onClick={onWorkerClick ? () => onWorkerClick(worker.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
