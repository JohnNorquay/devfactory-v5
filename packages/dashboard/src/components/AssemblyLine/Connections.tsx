import type { Station } from '../../types/dashboard';
import styles from './AssemblyLine.module.css';

interface Connection {
  from: Station;
  to: Station;
  active: boolean;
}

interface ConnectionsProps {
  connections: Connection[];
}

/**
 * Generate a curved path between two points
 * Uses quadratic bezier curve for smooth, angled connections
 */
function generatePath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): string {
  // Calculate control point for curve
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;

  // Offset control point to create a gentle curve
  const offsetY = -20; // Curve upward slightly

  return `M ${fromX} ${fromY} Q ${midX} ${midY + offsetY} ${toX} ${toY}`;
}

export function Connections({ connections }: ConnectionsProps) {
  return (
    <g className={styles.connections}>
      {connections.map((connection, index) => {
        const { from, to, active } = connection;

        // Start from right edge of 'from' station
        const fromX = from.position.x + 50;
        const fromY = from.position.y;

        // End at left edge of 'to' station
        const toX = to.position.x - 50;
        const toY = to.position.y;

        const path = generatePath(fromX, fromY, toX, toY);

        return (
          <g key={`${from.id}-${to.id}-${index}`}>
            {/* Background line (thicker, darker) */}
            <path
              d={path}
              fill="none"
              stroke="#2a2a4e"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Foreground line (colored when active) */}
            <path
              d={path}
              fill="none"
              stroke={active ? '#3b82f6' : '#2a2a4e'}
              strokeWidth="2"
              strokeLinecap="round"
              className={active ? styles.connectionActive : ''}
              opacity={active ? 1 : 0.6}
            />

            {/* Animated flow dots when active */}
            {active && (
              <>
                <circle r="3" fill="#60a5fa" className={styles.flowDot1}>
                  <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    path={path}
                  />
                </circle>
                <circle r="3" fill="#60a5fa" className={styles.flowDot2}>
                  <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    path={path}
                    begin="1s"
                  />
                </circle>
                <circle r="3" fill="#60a5fa" className={styles.flowDot3}>
                  <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    path={path}
                    begin="2s"
                  />
                </circle>
              </>
            )}

            {/* Direction arrow at end */}
            <polygon
              points={`${toX - 10},${toY - 6} ${toX},${toY} ${toX - 10},${toY + 6}`}
              fill={active ? '#3b82f6' : '#2a2a4e'}
              opacity={active ? 1 : 0.6}
            />
          </g>
        );
      })}
    </g>
  );
}
