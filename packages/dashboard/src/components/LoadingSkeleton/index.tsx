import styles from './LoadingSkeleton.module.css';

export function AssemblyLineSkeleton() {
  return (
    <div className={styles.assemblyLine}>
      <div className={styles.stationGrid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.station}>
            <div className={`${styles.skeleton} ${styles.stationIcon}`} />
            <div className={`${styles.skeleton} ${styles.stationTitle}`} />
            <div className={`${styles.skeleton} ${styles.stationStatus}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkerCardSkeleton() {
  return (
    <div className={styles.workerCard}>
      <div className={styles.workerHeader}>
        <div className={`${styles.skeleton} ${styles.workerAvatar}`} />
        <div className={styles.workerInfo}>
          <div className={`${styles.skeleton} ${styles.workerName}`} />
          <div className={`${styles.skeleton} ${styles.workerRole}`} />
        </div>
      </div>
      <div className={styles.workerStats}>
        <div className={`${styles.skeleton} ${styles.statBar}`} />
        <div className={`${styles.skeleton} ${styles.statBar}`} />
      </div>
    </div>
  );
}

export function WorkerPanelSkeleton() {
  return (
    <div className={styles.workerPanel}>
      <div className={`${styles.skeleton} ${styles.panelTitle}`} />
      <div className={styles.workerList}>
        {[1, 2, 3].map((i) => (
          <WorkerCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <div className={styles.activityFeed}>
      <div className={`${styles.skeleton} ${styles.feedTitle}`} />
      <div className={styles.activityList}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={styles.activityItem}>
            <div className={`${styles.skeleton} ${styles.activityIcon}`} />
            <div className={styles.activityContent}>
              <div className={`${styles.skeleton} ${styles.activityText}`} />
              <div className={`${styles.skeleton} ${styles.activityTime}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={`${styles.skeleton} ${styles.headerTitle}`} />
        <div className={`${styles.skeleton} ${styles.headerButton}`} />
      </div>
      <AssemblyLineSkeleton />
      <div className={styles.panels}>
        <WorkerPanelSkeleton />
        <ActivityFeedSkeleton />
      </div>
    </div>
  );
}
