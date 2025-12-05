import type { Station as StationType } from '../../types/dashboard';
import styles from './AssemblyLine.module.css';

interface StationProps {
  station: StationType;
  onClick?: () => void;
}

// Station type to icon mapping
const STATION_ICONS: Record<StationType['type'], string> = {
  database: '🗄️',
  backend: '⚙️',
  frontend: '🎨',
  testing: '🧪'
};

// Station type to color mapping
const STATION_COLORS: Record<StationType['type'], string> = {
  database: '#8b5cf6', // purple
  backend: '#3b82f6',  // blue
  frontend: '#22c55e', // green
  testing: '#f59e0b'   // orange
};

export function Station({ station, onClick }: StationProps) {
  const { type, name, status, position, workersAssigned } = station;
  const color = STATION_COLORS[type];
  const icon = STATION_ICONS[type];
  const isActive = status === 'active' || status === 'busy';

  return (
    <g
      className={`${styles.station} ${isActive ? styles.stationActive : ''}`}
      transform={`translate(${position.x}, ${position.y})`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Station container - rounded rectangle */}
      <rect
        x="-50"
        y="-40"
        width="100"
        height="80"
        rx="8"
        ry="8"
        fill="#1a1a2e"
        stroke={color}
        strokeWidth={isActive ? '3' : '2'}
        className={isActive ? styles.stationBoxActive : styles.stationBox}
        filter={isActive ? 'url(#glow)' : undefined}
      />

      {/* Icon background circle */}
      <circle
        cx="0"
        cy="-15"
        r="12"
        fill={color}
        opacity="0.2"
      />

      {/* Icon text */}
      <text
        x="0"
        y="-15"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="16"
      >
        {icon}
      </text>

      {/* Station name */}
      <text
        x="0"
        y="10"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="12"
        fontWeight="600"
      >
        {name}
      </text>

      {/* Worker count badge */}
      {workersAssigned.length > 0 && (
        <>
          <circle
            cx="35"
            cy="-30"
            r="10"
            fill={color}
            className={styles.workerBadge}
          />
          <text
            x="35"
            y="-30"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            fontSize="10"
            fontWeight="700"
          >
            {workersAssigned.length}
          </text>
        </>
      )}

      {/* Status indicator bar at bottom */}
      <rect
        x="-40"
        y="25"
        width="80"
        height="4"
        rx="2"
        ry="2"
        fill={isActive ? color : '#2a2a4e'}
        className={isActive ? styles.statusBarActive : ''}
      />
    </g>
  );
}
