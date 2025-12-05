/**
 * Assembly Line Visualization Hook
 * Transforms dashboard state into assembly line visualization data
 */

import { useMemo } from 'react';
import type {
  DashboardState,
  Station,
  SpecCar,
  Connection,
  AssemblyLineState,
  SpecUIState,
} from '../types/dashboard.js';

// Define station positions for the assembly line layout (left to right flow)
const STATION_POSITIONS: Record<Station['type'], { x: number; y: number }> = {
  database: { x: 100, y: 200 },
  backend: { x: 350, y: 200 },
  frontend: { x: 600, y: 200 },
  testing: { x: 850, y: 200 },
};

// Station sequence order
const STATION_SEQUENCE: Station['type'][] = ['database', 'backend', 'frontend', 'testing'];

const STATION_NAMES: Record<Station['type'], string> = {
  database: 'Database',
  backend: 'Backend',
  frontend: 'Frontend',
  testing: 'Testing',
};

/**
 * Calculate which station a spec is currently at based on its phase/progress
 */
function getStationForSpec(spec: SpecUIState): Station['type'] {
  const phase = spec.phase.toLowerCase();

  if (phase.includes('database') || phase.includes('db')) {
    return 'database';
  } else if (phase.includes('backend') || phase.includes('api')) {
    return 'backend';
  } else if (phase.includes('frontend') || phase.includes('ui')) {
    return 'frontend';
  } else if (phase.includes('test')) {
    return 'testing';
  }

  // Default: use progress percentage to determine station
  const progress = spec.progress;
  if (progress < 25) return 'database';
  if (progress < 50) return 'backend';
  if (progress < 75) return 'frontend';
  return 'testing';
}

/**
 * Calculate car position based on spec progress within a station
 */
function getCarPosition(
  spec: SpecUIState,
  currentStation: Station['type'],
  nextStation: Station['type'] | null
): { x: number; y: number } {
  const currentPos = STATION_POSITIONS[currentStation];

  if (!nextStation || spec.progress >= 100) {
    // Stay at current station
    return currentPos;
  }

  const nextPos = STATION_POSITIONS[nextStation];

  // Calculate progress within current phase (0-100)
  const stationIndex = STATION_SEQUENCE.indexOf(currentStation);
  const progressPerStation = 100 / STATION_SEQUENCE.length;
  const stationStartProgress = stationIndex * progressPerStation;
  const stationEndProgress = (stationIndex + 1) * progressPerStation;

  const stationProgress = Math.max(
    0,
    Math.min(100, ((spec.progress - stationStartProgress) / (stationEndProgress - stationStartProgress)) * 100)
  );

  // Interpolate position between current and next station
  const t = stationProgress / 100;
  return {
    x: currentPos.x + (nextPos.x - currentPos.x) * t,
    y: currentPos.y + (nextPos.y - currentPos.y) * t,
  };
}

export interface UseAssemblyLineReturn {
  assemblyLine: AssemblyLineState;
}

export function useAssemblyLine(state: DashboardState): UseAssemblyLineReturn {
  const assemblyLine = useMemo(() => {
    // Create stations
    const stations: Station[] = STATION_SEQUENCE.map((type) => {
      const workersAtStation = Object.values(state.workers).filter((worker) => {
        if (!worker.currentSpec) return false;
        const spec = state.specs.find((s) => s.id === worker.currentSpec);
        return spec && getStationForSpec(spec) === type;
      });

      const specsAtStation = state.specs.filter(
        (spec) => spec.status === 'active' && getStationForSpec(spec) === type
      );

      let status: Station['status'] = 'idle';
      if (specsAtStation.length > 0) {
        status = specsAtStation.length > 1 ? 'busy' : 'active';
      }

      return {
        id: type,
        type,
        name: STATION_NAMES[type],
        status,
        position: STATION_POSITIONS[type],
        workersAssigned: workersAtStation.map((w) => w.id),
      };
    });

    // Create spec cars for active and queued specs
    const activeCars: SpecCar[] = state.specs
      .filter((spec) => spec.status === 'active' || spec.status === 'queued')
      .map((spec) => {
        const currentStation = getStationForSpec(spec);
        const currentStationIndex = STATION_SEQUENCE.indexOf(currentStation);
        const nextStation =
          currentStationIndex < STATION_SEQUENCE.length - 1
            ? STATION_SEQUENCE[currentStationIndex + 1]
            : null;

        const position = spec.position || getCarPosition(spec, currentStation, nextStation);

        let carStatus: SpecCar['status'] = 'at_station';
        if (spec.status === 'queued') {
          carStatus = 'at_station';
        } else if (spec.progress < 100 && spec.progress % 25 > 10) {
          carStatus = 'moving';
        }

        // Calculate progress through current station
        const stationIndex = STATION_SEQUENCE.indexOf(currentStation);
        const progressPerStation = 100 / STATION_SEQUENCE.length;
        const stationStartProgress = stationIndex * progressPerStation;
        const stationEndProgress = (stationIndex + 1) * progressPerStation;
        const stationProgress = Math.max(
          0,
          Math.min(
            100,
            ((spec.progress - stationStartProgress) / (stationEndProgress - stationStartProgress)) * 100
          )
        );

        return {
          specId: spec.id,
          position,
          currentStation,
          progress: stationProgress,
          status: carStatus,
        };
      });

    // Create connections between stations
    const connections: Connection[] = [];
    for (let i = 0; i < STATION_SEQUENCE.length - 1; i++) {
      const from = STATION_SEQUENCE[i];
      const to = STATION_SEQUENCE[i + 1];

      // Connection is active if any car is moving between these stations
      const isActive = activeCars.some((car) => {
        return (
          car.currentStation === from &&
          car.status === 'moving' &&
          car.progress > 50
        );
      });

      connections.push({
        from,
        to,
        active: isActive,
      });
    }

    return {
      stations,
      activeCars,
      connections,
    };
  }, [state.specs, state.workers]);

  return { assemblyLine };
}
