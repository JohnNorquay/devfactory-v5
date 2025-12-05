import { useEffect, useState } from 'react';
import styles from './Celebration.module.css';

interface ConfettiPiece {
  id: number;
  left: number;
  backgroundColor: string;
  animationDuration: number;
  animationDelay: number;
  size: number;
}

const COLORS = [
  '#10b981', // green
  '#fbbf24', // gold
  '#3b82f6', // blue
  '#f59e0b', // orange
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    // Generate 50 confetti pieces
    const confettiPieces: ConfettiPiece[] = [];
    for (let i = 0; i < 50; i++) {
      confettiPieces.push({
        id: i,
        left: Math.random() * 100, // 0-100%
        backgroundColor: COLORS[Math.floor(Math.random() * COLORS.length)],
        animationDuration: 2 + Math.random() * 3, // 2-5 seconds
        animationDelay: Math.random() * 0.5, // 0-0.5s delay
        size: 8 + Math.random() * 8, // 8-16px
      });
    }
    setPieces(confettiPieces);

    // Clean up after animation completes
    const timeout = setTimeout(() => {
      setPieces([]);
    }, 6000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className={styles.confettiPiece}
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.backgroundColor,
            animationDuration: `${piece.animationDuration}s`,
            animationDelay: `${piece.animationDelay}s`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
          }}
        />
      ))}
    </>
  );
}
