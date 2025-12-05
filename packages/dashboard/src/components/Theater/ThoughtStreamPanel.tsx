import { useEffect, useRef } from 'react';
import { Thought } from './index';
import styles from './Theater.module.css';

interface ThoughtStreamPanelProps {
  thoughts: Thought[];
}

export function ThoughtStreamPanel({ thoughts }: ThoughtStreamPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest thought
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts]);

  const getThoughtIcon = (type: Thought['type']) => {
    switch (type) {
      case 'observation':
        return '👁️';
      case 'action':
        return '⚡';
      case 'analysis':
        return '🧠';
      case 'decision':
        return '💡';
      case 'error':
        return '❌';
      default:
        return '💭';
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  return (
    <div className={styles.thoughtStream}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Oracle Thoughts</h3>
        <div className={styles.thoughtCount}>{thoughts.length} thoughts</div>
      </div>

      <div className={styles.thoughtsList} ref={scrollRef}>
        {thoughts.length === 0 ? (
          <div className={styles.emptyThoughts}>
            <div className={styles.emptyThoughtsIcon}>🧠</div>
            <div className={styles.emptyThoughtsText}>No thoughts yet</div>
            <div className={styles.emptyThoughtsSubtext}>
              Oracle thoughts will appear here as the verification runs
            </div>
          </div>
        ) : (
          thoughts.map((thought, index) => (
            <div
              key={index}
              className={`${styles.thoughtItem} ${styles[`thoughtType${thought.type.charAt(0).toUpperCase() + thought.type.slice(1)}`]}`}
            >
              <div className={styles.thoughtHeader}>
                <span className={styles.thoughtIcon}>{getThoughtIcon(thought.type)}</span>
                <span className={styles.thoughtType}>
                  {thought.type.charAt(0).toUpperCase() + thought.type.slice(1)}
                </span>
                <span className={styles.thoughtTime}>{formatTime(thought.timestamp)}</span>
              </div>
              <div className={styles.thoughtMessage}>{thought.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
