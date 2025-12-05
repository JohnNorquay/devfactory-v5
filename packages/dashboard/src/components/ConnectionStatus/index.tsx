import { useEffect, useState } from 'react';
import styles from './ConnectionStatus.module.css';

interface ConnectionStatusProps {
  isConnected: boolean;
  onRetry?: () => void;
  reconnecting?: boolean;
}

export function ConnectionStatus({
  isConnected,
  onRetry,
  reconnecting = false,
}: ConnectionStatusProps) {
  const [show, setShow] = useState(!isConnected);

  useEffect(() => {
    if (!isConnected) {
      setShow(true);
    } else {
      // Delay hiding to show "Connected" message
      const timeout = setTimeout(() => {
        setShow(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isConnected]);

  if (!show) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        {isConnected ? (
          // Reconnected state
          <>
            <div className={styles.iconContainer}>
              <svg
                className={styles.successIcon}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className={styles.title}>Back Online</h2>
            <p className={styles.message}>Connection restored successfully</p>
          </>
        ) : reconnecting ? (
          // Reconnecting state
          <>
            <div className={styles.iconContainer}>
              <div className={styles.spinner} />
            </div>
            <h2 className={styles.title}>Reconnecting...</h2>
            <p className={styles.message}>
              Attempting to restore connection to the factory
            </p>
          </>
        ) : (
          // Disconnected state
          <>
            <div className={styles.iconContainer}>
              <svg
                className={styles.errorIcon}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                />
              </svg>
            </div>
            <h2 className={styles.title}>Connection Lost</h2>
            <p className={styles.message}>
              Unable to connect to the factory. Check your internet connection.
            </p>
            {onRetry && (
              <button onClick={onRetry} className={styles.retryButton}>
                <svg
                  className={styles.buttonIcon}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Retry Connection
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
