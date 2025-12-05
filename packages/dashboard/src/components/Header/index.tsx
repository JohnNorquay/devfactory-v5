import { useEffect, useState } from 'react';
import styles from './Header.module.css';

interface HeaderProps {
  title?: string;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  onOpenTheater?: () => void;
}

export function Header({
  title = 'DevFactory',
  connectionStatus,
  onOpenTheater,
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getConnectionClass = () => {
    switch (connectionStatus) {
      case 'connected':
        return styles.statusConnected;
      case 'disconnected':
        return styles.statusDisconnected;
      case 'reconnecting':
        return styles.statusReconnecting;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'reconnecting':
        return 'Reconnecting...';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚙️</span>
          <h1 className={styles.title}>{title}</h1>
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.connectionStatus}>
          <div className={`${styles.statusDot} ${getConnectionClass()}`} />
          <span className={styles.statusText}>{getConnectionText()}</span>
        </div>

        {onOpenTheater && (
          <button
            className={styles.theaterButton}
            onClick={onOpenTheater}
            title="Open Theater View (Phase 3)"
          >
            <span className={styles.theaterIcon}>🎭</span>
            Theater
          </button>
        )}

        <div className={styles.time}>{formatTime(currentTime)}</div>
      </div>
    </header>
  );
}
