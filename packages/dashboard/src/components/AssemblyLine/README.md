# AssemblyLine Component

The centerpiece visualization of the DevFactory v5 Factory Floor Dashboard - an animated factory assembly line showing specs as "cars" moving through work stations.

## Overview

The AssemblyLine component renders a visual representation of the build process as a factory assembly line:

- **Stations**: Work stations (Database, Backend, Frontend, Testing) where specs are processed
- **Spec Cars**: Visual representations of specs moving through the assembly line
- **Connections**: Animated connector lines showing the flow between stations
- **Real-time Updates**: Smooth animations as specs progress through stations

## Components

### AssemblyLine (Main Container)
**File**: `index.tsx`

The main container component that orchestrates the entire visualization.

```typescript
import { AssemblyLine } from './components/AssemblyLine';

<AssemblyLine
  stations={dashboardState.assemblyLine.stations}
  specs={dashboardState.specs}
  onSpecClick={(specId) => console.log('Clicked spec:', specId)}
  onStationClick={(stationId) => console.log('Clicked station:', stationId)}
/>
```

**Props**:
- `stations`: Array of Station objects from AssemblyLineState
- `specs`: Array of SpecUIState objects
- `onSpecClick?`: Optional callback when a spec car is clicked
- `onStationClick?`: Optional callback when a station is clicked

### Station
**File**: `Station.tsx`

Renders individual work stations on the assembly line.

**Features**:
- Icon-based type identification (database/backend/frontend/testing)
- Color-coded borders (purple/blue/green/orange)
- Worker count badge
- Active state with pulsing animation
- Status indicator bar

### SpecCar
**File**: `SpecCar.tsx`

Renders spec "cars" that move through the assembly line.

**Features**:
- Abbreviated spec name display
- Progress bar showing completion percentage
- Color-coded by status (queued/active/completed/failed)
- Smooth position transitions using CSS transforms
- Active indicator (pulsing dot)
- Decorative wheels

### Connections
**File**: `Connections.tsx`

Renders curved connector lines between stations.

**Features**:
- Curved bezier paths for visual appeal
- Active state highlighting
- Animated flow dots when connection is active
- Direction arrows showing flow direction

## Styling

**File**: `AssemblyLine.module.css`

The component uses CSS modules with a dark theme:

### Color Scheme
- Background: `#1a1a2e`
- Borders: `#2a2a4e`
- Station colors:
  - Database: `#8b5cf6` (purple)
  - Backend: `#3b82f6` (blue)
  - Frontend: `#22c55e` (green)
  - Testing: `#f59e0b` (orange)

### Animations
- **Station Pulse**: Active stations pulse their borders
- **Car Glow**: Active spec cars glow and pulse
- **Progress Shimmer**: Progress bars shimmer during active work
- **Flow Dots**: Animated dots travel along connections
- **Smooth Transitions**: 0.8s cubic-bezier transitions for car movement

## Visual Layout

```
[Database] -----> [Backend] -----> [Frontend] -----> [Testing]
    |                |                 |                 |
  [Car1]          [Car2]            [Car3]           [Car4]
```

The SVG viewport is 900x400 pixels with:
- Grid pattern background
- Stations positioned horizontally
- Spec cars positioned at or between stations
- Connection lines with flow animations

## Usage Example

```typescript
import { AssemblyLine } from './components/AssemblyLine';
import type { AssemblyLineState, SpecUIState } from './types/dashboard';

function Dashboard() {
  const stations: AssemblyLineState['stations'] = [
    {
      id: 'db',
      type: 'database',
      name: 'Database',
      status: 'active',
      position: { x: 100, y: 200 },
      workersAssigned: ['worker-1']
    },
    // ... more stations
  ];

  const specs: SpecUIState[] = [
    {
      id: 'spec-1',
      name: 'User Authentication',
      phase: 'backend',
      status: 'active',
      progress: 45,
      totalTasks: 10,
      completedTasks: 4,
      assignedWorkers: ['worker-1'],
      position: { x: 100, y: 200 }
    },
    // ... more specs
  ];

  return (
    <AssemblyLine
      stations={stations}
      specs={specs}
      onSpecClick={(id) => console.log('Spec clicked:', id)}
      onStationClick={(id) => console.log('Station clicked:', id)}
    />
  );
}
```

## Performance Considerations

- Uses GPU acceleration (`transform: translateZ(0)`) for smooth animations
- CSS transitions instead of JavaScript animations
- SVG with `preserveAspectRatio` for responsive scaling
- `useMemo` for expensive calculations
- Minimal re-renders through proper prop management

## Accessibility

- Click handlers for keyboard navigation
- Focus states with visible outlines
- Semantic SVG structure with proper grouping
- Cursor indicators for interactive elements

## Future Enhancements

- [ ] Zoom and pan controls
- [ ] Detailed tooltips on hover
- [ ] Click-and-drag to rearrange stations
- [ ] Export as image/SVG
- [ ] Multiple assembly lines for different build groups
- [ ] Historical playback of spec progression
