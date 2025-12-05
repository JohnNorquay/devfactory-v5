import { useRef, useEffect } from 'react';
import type { ActivityEntry } from '../../types/dashboard';
import { ActivityItem } from './ActivityItem';
import styles from './ActivityFeed.module.css';

interface ActivityFeedProps {
  activities: ActivityEntry[];
  maxItems?: number;
  autoScroll?: boolean;
}

export function ActivityFeed({ activities, maxItems = 50, autoScroll = true }: ActivityFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const prevActivityCountRef = useRef(activities.length);

  // Auto-scroll to bottom when new items arrive
  useEffect(() => {
    if (!autoScroll || !feedRef.current) return;

    // Only scroll if new items were added
    if (activities.length > prevActivityCountRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }

    prevActivityCountRef.current = activities.length;
  }, [activities, autoScroll]);

  // Limit to maxItems, showing most recent
  const displayedActivities = activities.slice(-maxItems);

  return (
    <div className={styles.feedContainer} ref={feedRef}>
      <div className={styles.feedContent}>
        {displayedActivities.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No activity yet. Waiting for system events...</p>
          </div>
        ) : (
          displayedActivities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        )}
      </div>
    </div>
  );
}
