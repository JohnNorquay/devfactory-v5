import { useMemo } from 'react';
import type { InterventionSummary } from '../../types/dashboard';
import styles from './OraclePanel.module.css';

interface InterventionListProps {
  interventions: InterventionSummary[];
}

export function InterventionList({ interventions }: InterventionListProps) {
  if (interventions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>👁️</div>
        <div className={styles.emptyText}>No interventions yet</div>
        <div className={styles.emptySubtext}>The Oracle watches and waits...</div>
      </div>
    );
  }

  return (
    <div className={styles.interventionList}>
      {interventions.map((intervention) => (
        <InterventionItem key={intervention.id} intervention={intervention} />
      ))}
    </div>
  );
}

interface InterventionItemProps {
  intervention: InterventionSummary;
}

function InterventionItem({ intervention }: InterventionItemProps) {
  const { icon, label, colorClass } = useInterventionTypeInfo(intervention.type);
  const timeAgo = useTimeAgo(intervention.createdAt);
  const statusClass = useStatusClass(intervention.status);

  return (
    <div className={`${styles.interventionItem} ${statusClass}`}>
      <div className={`${styles.interventionIcon} ${colorClass}`}>
        {icon}
      </div>

      <div className={styles.interventionContent}>
        <div className={styles.interventionHeader}>
          <span className={styles.interventionType}>{label}</span>
          <span className={styles.interventionTarget}>{intervention.targetWorker}</span>
        </div>

        <div className={styles.interventionReason}>
          {truncateReason(intervention.reason)}
        </div>

        <div className={styles.interventionFooter}>
          <span className={`${styles.interventionStatus} ${statusClass}`}>
            {intervention.status}
          </span>
          <span className={styles.interventionTime}>{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}

function useInterventionTypeInfo(type: InterventionSummary['type']) {
  return useMemo(() => {
    switch (type) {
      case 'guidance':
        return {
          icon: '💡',
          label: 'Guidance',
          colorClass: styles.typeGuidance,
        };
      case 'takeover':
        return {
          icon: '✋',
          label: 'Takeover',
          colorClass: styles.typeTakeover,
        };
      case 'reassign':
        return {
          icon: '↔️',
          label: 'Reassign',
          colorClass: styles.typeReassign,
        };
      case 'skip':
        return {
          icon: '⏭️',
          label: 'Skip',
          colorClass: styles.typeSkip,
        };
      default:
        return {
          icon: '❓',
          label: 'Unknown',
          colorClass: '',
        };
    }
  }, [type]);
}

function useStatusClass(status: InterventionSummary['status']) {
  return useMemo(() => {
    switch (status) {
      case 'pending':
        return styles.statusPending;
      case 'executing':
        return styles.statusExecuting;
      case 'completed':
        return styles.statusCompleted;
      case 'failed':
        return styles.statusFailed;
      default:
        return '';
    }
  }, [status]);
}

function useTimeAgo(date: Date) {
  return useMemo(() => {
    const now = new Date().getTime();
    const then = new Date(date).getTime();
    const diff = now - then;

    if (diff < 1000) return 'just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }, [date]);
}

function truncateReason(reason: string, maxLength: number = 80): string {
  if (reason.length <= maxLength) return reason;
  return `${reason.slice(0, maxLength)}...`;
}
