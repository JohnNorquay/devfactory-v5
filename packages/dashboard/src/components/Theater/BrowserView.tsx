import styles from './Theater.module.css';

interface BrowserViewProps {
  screenshot: string | null;
}

export function BrowserView({ screenshot }: BrowserViewProps) {
  return (
    <div className={styles.browserView}>
      {screenshot ? (
        <img src={`data:image/png;base64,${screenshot}`} alt="Browser view" className={styles.browserImage} />
      ) : (
        <div className={styles.browserEmpty}>
          <div className={styles.emptyIcon}>🖥️</div>
          <p>Waiting for browser...</p>
          <span className={styles.emptyHint}>Start a verification scenario to see the browser</span>
        </div>
      )}
    </div>
  );
}
