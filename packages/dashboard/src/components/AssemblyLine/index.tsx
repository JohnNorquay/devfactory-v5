import { useMemo } from 'react';
import { Station } from './Station';
import { SpecCar } from './SpecCar';
import { Connections } from './Connections';
import type { AssemblyLineState, SpecUIState } from '../../types/dashboard';
import styles from './AssemblyLine.module.css';

interface AssemblyLineProps {
  stations: AssemblyLineState['stations'];
  specs: SpecUIState[];
  onSpecClick?: (specId: string) => void;
  onStationClick?: (stationId: string) => void;
}

export function AssemblyLine({
  stations,
  specs,
  onSpecClick,
  onStationClick
}: AssemblyLineProps) {
  // Map specs to their positions based on station assignments
  const specPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();

    specs.forEach(spec => {
      if (spec.position) {
        positions.set(spec.id, spec.position);
      }
    });

    return positions;
  }, [specs]);

  // Calculate connections between stations
  const connections = useMemo(() => {
    const conns = [];
    for (let i = 0; i < stations.length - 1; i++) {
      conns.push({
        from: stations[i],
        to: stations[i + 1],
        active: stations[i].status === 'active' || stations[i + 1].status === 'active'
      });
    }
    return conns;
  }, [stations]);

  return (
    <div className={styles.assemblyLineContainer}>
      <svg
        className={styles.assemblyLineSvg}
        viewBox="0 0 900 400"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background grid pattern */}
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
          </pattern>

          {/* Glow filters for active elements */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid background */}
        <rect width="900" height="400" fill="url(#grid)" />

        {/* Connection lines between stations */}
        <Connections connections={connections} />

        {/* Stations */}
        <g className={styles.stationsGroup}>
          {stations.map(station => (
            <Station
              key={station.id}
              station={station}
              onClick={() => onStationClick?.(station.id)}
            />
          ))}
        </g>

        {/* Spec cars moving through the line */}
        <g className={styles.carsGroup}>
          {specs.map(spec => {
            const position = specPositions.get(spec.id) || { x: 50, y: 200 };
            return (
              <SpecCar
                key={spec.id}
                spec={spec}
                position={position}
                onClick={() => onSpecClick?.(spec.id)}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
