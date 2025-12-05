import { useEffect, useState } from 'react';
import { Confetti } from './Confetti';
import styles from './Celebration.module.css';

interface CelebrationProps {
  show: boolean;
  onComplete?: () => void;
  message?: string;
}

export function Celebration({
  show,
  onComplete,
  message = 'Build Complete!'
}: CelebrationProps) {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setFadeOut(false);

      // Start fade out after 4 seconds
      const fadeTimeout = setTimeout(() => {
        setFadeOut(true);
      }, 4000);

      // Complete and hide after 5 seconds
      const completeTimeout = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 5000);

      return () => {
        clearTimeout(fadeTimeout);
        clearTimeout(completeTimeout);
      };
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className={`${styles.overlay} ${fadeOut ? styles.fadeOut : ''}`}>
      <Confetti />
      <div className={styles.messageContainer}>
        <div className={styles.checkmark}>
          <svg viewBox="0 0 52 52" className={styles.checkmarkSvg}>
            <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none" />
            <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
        <h2 className={styles.message}>{message}</h2>
        <p className={styles.subMessage}>Your factory is running smoothly</p>
      </div>
    </div>
  );
}
