import type { OracleUIState } from '../../types/dashboard';
import { OracleStatus } from './OracleStatus';
import { InterventionList } from './InterventionList';
import styles from './OraclePanel.module.css';

interface OraclePanelProps {
  oracle: OracleUIState;
}

export function OraclePanel({ oracle }: OraclePanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Oracle</h2>
        <div className={styles.subtitle}>All-Seeing Eye of the Factory</div>
      </div>

      <OracleStatus
        status={oracle.status}
        lastCheck={oracle.lastCheck}
      />

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{oracle.activeInterventions}</div>
          <div className={styles.statLabel}>Active</div>
        </div>
        <div className={styles.statDivider}>/</div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{oracle.totalInterventions}</div>
          <div className={styles.statLabel}>Total</div>
        </div>
      </div>

      <div className={styles.interventionsSection}>
        <h3 className={styles.sectionTitle}>Recent Interventions</h3>
        <InterventionList interventions={oracle.recentInterventions} />
      </div>
    </div>
  );
}
