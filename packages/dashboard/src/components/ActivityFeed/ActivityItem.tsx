import type { ActivityEntry } from '../../types/dashboard';
import styles from './ActivityFeed.module.css';

interface ActivityItemProps {
  activity: ActivityEntry;
}

// Format timestamp as either "HH:MM:SS" or "X min ago"
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  } else {
    // Format as HH:MM:SS
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
}

// Get icon based on activity type
function getTypeIcon(type: ActivityEntry['type']): string {
  switch (type) {
    case 'task_start':
      return '▶';
    case 'task_complete':
      return '✓';
    case 'error':
      return '✕';
    case 'intervention':
      return '⚡';
    case 'spec_complete':
      return '★';
    case 'message':
      return '•';
    default:
      return '•';
  }
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const severity = activity.severity || 'info';
  const icon = getTypeIcon(activity.type);
  const timestamp = formatTimestamp(activity.timestamp);

  return (
    <div className={`${styles.activityItem} ${styles[`severity-${severity}`]}`}>
      <div className={styles.timestamp}>{timestamp}</div>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.message}>{activity.message}</div>
      {activity.workerId && (
        <div className={styles.workerBadge}>{activity.workerId}</div>
      )}
    </div>
  );
}
