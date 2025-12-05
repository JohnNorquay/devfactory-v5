import { useDashboardState } from '../../hooks/useDashboardState';
import { useAssemblyLine } from '../../hooks/useAssemblyLine';
import { Header } from '../Header';
import { ProgressBar } from '../ProgressBar';
import { AssemblyLine } from '../AssemblyLine';
import { WorkerPanel } from '../WorkerPanel';
import { OraclePanel } from '../OraclePanel';
import { ActivityFeed } from '../ActivityFeed';
import styles from './Dashboard.module.css';

interface DashboardProps {
  wsUrl?: string;
}

export function Dashboard({ wsUrl = 'http://localhost:3001' }: DashboardProps) {
  const { state, isConnected, isReconnecting } = useDashboardState(wsUrl);
  const { assemblyLine } = useAssemblyLine(state);

  return (
    <div className={styles.dashboard}>
      {/* Header with connection status and overall status */}
      <Header
        title="DevFactory v5"
        connectionStatus={state.connection}
      />

      {/* Progress bar showing overall completion */}
      <ProgressBar progress={state.overall} />

      {/* Main content area */}
      <div className={styles.dashboardContent}>
        {/* Assembly line visualization (center, takes most space) */}
        <section className={styles.assemblySection}>
          <div className={styles.sectionTitle}>Assembly Line</div>
          <AssemblyLine
            stations={assemblyLine.stations}
            specs={state.specs}
          />
        </section>

        {/* Worker and Oracle panels (side by side) */}
        <div className={styles.panelsRow}>
          <section className={styles.workerSection}>
            <div className={styles.sectionTitle}>Workers</div>
            <WorkerPanel workers={state.workers} />
          </section>

          <section className={styles.oracleSection}>
            <div className={styles.sectionTitle}>Oracle</div>
            <OraclePanel oracle={state.oracle} />
          </section>
        </div>

        {/* Activity feed (bottom) */}
        <section className={styles.activitySection}>
          <div className={styles.sectionTitle}>Activity Feed</div>
          <ActivityFeed activities={state.activity} />
        </section>
      </div>

      {/* Disconnected overlay */}
      {!isConnected && !isReconnecting && (
        <div className={styles.disconnectedOverlay}>
          <div className={styles.disconnectedMessage}>
            <div className={styles.disconnectedIcon}>⚠️</div>
            <h2>Disconnected from Server</h2>
            <p>Attempting to reconnect...</p>
          </div>
        </div>
      )}
    </div>
  );
}
