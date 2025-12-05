import type { SpecUIState } from '../../types/dashboard';
import styles from './AssemblyLine.module.css';

interface SpecCarProps {
  spec: SpecUIState;
  position: { x: number; y: number };
  onClick?: () => void;
}

// Abbreviate long spec names
function abbreviateSpecName(name: string, maxLength: number = 12): string {
  if (name.length <= maxLength) return name;

  // Try to abbreviate intelligently
  const words = name.split(/[-_\s]/);
  if (words.length > 1) {
    return words.map(w => w.charAt(0).toUpperCase()).join('');
  }

  return name.substring(0, maxLength - 2) + '..';
}

// Get color based on spec status
function getSpecColor(status: SpecUIState['status']): string {
  switch (status) {
    case 'queued':
      return '#6b7280'; // gray
    case 'active':
      return '#3b82f6'; // blue
    case 'completed':
      return '#22c55e'; // green
    case 'failed':
      return '#ef4444'; // red
    default:
      return '#6b7280';
  }
}

export function SpecCar({ spec, position, onClick }: SpecCarProps) {
  const { name, status, progress } = spec;
  const color = getSpecColor(status);
  const isActive = status === 'active';
  const abbreviatedName = abbreviateSpecName(name);

  return (
    <g
      className={`${styles.specCar} ${isActive ? styles.specCarActive : ''}`}
      transform={`translate(${position.x}, ${position.y})`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Car body - rounded rectangle */}
      <rect
        x="-35"
        y="-20"
        width="70"
        height="40"
        rx="6"
        ry="6"
        fill="#2a2a4e"
        stroke={color}
        strokeWidth={isActive ? '2.5' : '2'}
        className={isActive ? styles.carBodyActive : styles.carBody}
        filter={isActive ? 'url(#strongGlow)' : undefined}
      />

      {/* Progress bar background */}
      <rect
        x="-30"
        y="8"
        width="60"
        height="6"
        rx="3"
        ry="3"
        fill="#1a1a2e"
      />

      {/* Progress bar fill */}
      <rect
        x="-30"
        y="8"
        width={Math.max(0, (progress / 100) * 60)}
        height="6"
        rx="3"
        ry="3"
        fill={color}
        className={isActive ? styles.progressBarActive : ''}
      />

      {/* Spec name */}
      <text
        x="0"
        y="-5"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="10"
        fontWeight="600"
      >
        {abbreviatedName}
      </text>

      {/* Progress percentage */}
      {status !== 'queued' && (
        <text
          x="0"
          y="6"
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="8"
        >
          {Math.round(progress)}%
        </text>
      )}

      {/* Active indicator - pulsing dot */}
      {isActive && (
        <circle
          cx="30"
          cy="-15"
          r="3"
          fill={color}
          className={styles.activeDot}
        />
      )}

      {/* Wheels (decorative) */}
      <circle
        cx="-20"
        cy="18"
        r="4"
        fill={color}
        opacity="0.6"
      />
      <circle
        cx="20"
        cy="18"
        r="4"
        fill={color}
        opacity="0.6"
      />
    </g>
  );
}
