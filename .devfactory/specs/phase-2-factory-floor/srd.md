# Phase 2: Factory Floor Dashboard - Software Requirements Document

## 1. Overview

### 1.1 Purpose
Transform the development process from an invisible terminal experience into a visual, comprehensible factory floor where non-developers can watch specs being built like cars on an assembly line.

### 1.2 Vision
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    🏭 THE DEVELOPMENT FACTORY FLOOR                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STATION 1          STATION 2          STATION 3          STATION 4        │
│  ┌─────────┐        ┌─────────┐        ┌─────────┐        ┌─────────┐      │
│  │ CHASSIS │   →    │ ENGINE  │   →    │  BODY   │   →    │ QUALITY │      │
│  │(Database)│        │(Backend)│        │(Frontend)│       │ CONTROL │      │
│  └─────────┘        └─────────┘        └─────────┘        └─────────┘      │
│       │                  │                  │                  │           │
│   Building           APIs being        Components         Tests            │
│   schema             created           rendering          running          │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                         MAIN ASSEMBLY LINE                                  │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  PARALLEL WORK STATIONS                                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                              │
│  │ Settings  │  │ Reports   │  │ Profile   │    Specs being built in      │
│  │ Spec      │  │ Spec      │  │ Spec      │    parallel, waiting to      │
│  └───────────┘  └───────────┘  └───────────┘    join the main line        │
│                                                                             │
│  WORKER STATUS                                ORACLE STATUS                 │
│  🟢 df-database: Creating users table        👁️ Watching... All nominal    │
│  🟢 df-backend: Building auth API                                          │
│  🟡 df-frontend: Waiting                                                   │
│  🟡 df-testing: Waiting                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Scope
This phase builds a browser-based real-time dashboard that visualizes the DevFactory build process using an assembly line metaphor.

---

## 2. User Stories

### US-1: As a product owner
**I want** to see my project being built visually
**So that** I understand what's happening without reading logs

### US-2: As a non-technical stakeholder
**I want** an intuitive visual metaphor (factory/assembly line)
**So that** software development makes sense to me

### US-3: As a DevFactory user
**I want** real-time updates without refreshing
**So that** I can watch progress as it happens

### US-4: As someone monitoring the build
**I want** to see worker status at a glance
**So that** I know immediately if something is wrong

### US-5: As a user watching parallel builds
**I want** to see multiple specs being built simultaneously
**So that** I understand how parallelization works

### US-6: As a user wanting details
**I want** to click on a spec/worker for more information
**So that** I can drill down when needed

---

## 3. Functional Requirements

### 3.1 Assembly Line Visualization

#### 3.1.1 Main Assembly Line
The dashboard SHALL display a horizontal assembly line showing:
- Four stations: Database → Backend → Frontend → Testing
- Current spec "car" moving through stations
- Visual indication of progress at each station
- Animation of movement between stations

#### 3.1.2 Spec as "Car"
Each spec SHALL be represented as a product moving down the line:
- Shows spec name
- Shows current layer being worked on
- Shows progress percentage
- Color-coded status (green=good, yellow=working, red=stuck)

#### 3.1.3 Parallel Work Stations
Specs that can be built in parallel SHALL be shown:
- As "off-line" stations below the main line
- Positioned vertically aligned with their dependency point
- With visual connection to where they'll join the main line
- With individual progress indicators

### 3.2 Station Details

#### 3.2.1 Database Station
Displays:
- Current migration being created
- Tables being modified
- RLS policies being added
- Progress bar

#### 3.2.2 Backend Station
Displays:
- Current API being built
- Endpoints being created
- Services being implemented
- Progress bar

#### 3.2.3 Frontend Station
Displays:
- Current component being built
- Pages being created
- UI elements being rendered
- Progress bar

#### 3.2.4 Testing Station
Displays:
- Current test being run
- Pass/fail counts
- Coverage percentage
- Progress bar

### 3.3 Worker Status Panel

#### 3.3.1 Worker Cards
Each worker SHALL have a card showing:
- Worker name (df-database, df-backend, etc.)
- Current status (working, idle, stuck, offline)
- Current task title
- Status emoji/icon
- Time in current status

#### 3.3.2 Status Colors
- 🟢 Green: Working normally
- 🟡 Yellow: Idle/waiting
- 🔴 Red: Stuck
- ⚫ Gray: Offline

### 3.4 Oracle Panel

#### 3.4.1 Oracle Status
Display Oracle status including:
- Running/stopped indicator
- Recent interventions count
- Last intervention timestamp
- Success rate

#### 3.4.2 Recent Interventions
Show last 3 interventions:
- Task that was helped
- Intervention type (guidance/takeover)
- Outcome

### 3.5 Progress Overview

#### 3.5.1 Overall Progress Bar
Large progress bar showing:
- Total tasks completed / total tasks
- Percentage complete
- Estimated time remaining (if calculable)

#### 3.5.2 Per-Spec Progress
List of all specs with:
- Spec name
- Mini progress bar
- Task count (done/total)
- Current status

### 3.6 Real-Time Updates

#### 3.6.1 WebSocket Connection
Dashboard SHALL:
- Connect to WebSocket server on load
- Receive state updates in real-time
- Reconnect automatically on disconnect
- Show connection status indicator

#### 3.6.2 Update Frequency
- State changes pushed immediately
- UI updates smoothly (no flicker)
- Animations for state transitions

### 3.7 Activity Feed

#### 3.7.1 Activity Timeline
Show recent activity:
- Task completions
- Worker status changes
- Oracle interventions
- Errors/stuck events
- Timestamps for each

#### 3.7.2 Feed Behavior
- Most recent at top
- Auto-scroll option
- Click to expand details
- Color-coded by type

### 3.8 Interactions

#### 3.8.1 Click Spec
Clicking a spec shows modal with:
- Full spec name and description
- All tasks with status
- Current worker assignment
- Error details if stuck

#### 3.8.2 Click Worker
Clicking a worker shows modal with:
- Worker details
- Current task full info
- Recent activity for this worker
- Option to attach to tmux session (command)

#### 3.8.3 Click Station
Clicking a station shows:
- All tasks at this layer
- Completed vs pending
- Current active task details

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Initial load: < 2 seconds
- Update latency: < 500ms from state change
- Smooth animations: 60fps
- Memory: < 100MB browser usage

### 4.2 Responsiveness
- Works on desktop (1280px+)
- Graceful degradation on tablet
- Core functionality on mobile

### 4.3 Accessibility
- Color-blind friendly palette
- Screen reader compatible
- Keyboard navigation

### 4.4 Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

---

## 5. UI/UX Requirements

### 5.1 Color Palette
```
Background: #0d1117 (dark)
Cards: #161b22
Borders: #30363d
Text Primary: #c9d1d9
Text Secondary: #8b949e
Success: #238636
Warning: #f0883e
Error: #f85149
Info: #58a6ff
Purple (Oracle): #a371f7
```

### 5.2 Typography
- Font: SF Mono / Monaco / monospace
- Header: 1.5em bold
- Body: 1em
- Small: 0.85em

### 5.3 Animations
- Assembly line movement: 0.5s ease
- Progress bar: 0.3s ease
- Card transitions: 0.2s ease
- Smooth scrolling for activity feed

### 5.4 Layout
```
┌────────────────────────────────────────────────────────────┐
│  Header: Title + Connection Status + Time                  │
├────────────────────────────────────────────────────────────┤
│  Overall Progress Bar                                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Assembly Line Visualization             │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Workers    │  │    Specs     │  │   Activity   │    │
│  │   Panel      │  │   Progress   │  │    Feed      │    │
│  │              │  │              │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
├────────────────────────────────────────────────────────────┤
│  Footer: Oracle Status + Quick Actions                     │
└────────────────────────────────────────────────────────────┘
```

---

## 6. Technical Requirements

### 6.1 Frontend Stack
- React 18 with TypeScript
- Vite for bundling
- Socket.io-client for WebSocket
- Raw SVG for assembly line graphics
- CSS modules for styling

### 6.2 Backend Enhancement
- Enhance existing dashboard/server.ts
- Add new state transformation for UI
- Add spec/task aggregation endpoints

### 6.3 State Structure for UI
```typescript
interface DashboardState {
  connection: 'connected' | 'disconnected' | 'reconnecting';

  overall: {
    totalTasks: number;
    completedTasks: number;
    percentage: number;
    status: 'idle' | 'running' | 'complete' | 'stuck';
  };

  specs: SpecUIState[];

  workers: {
    [id: string]: WorkerUIState;
  };

  oracle: OracleUIState;

  activity: ActivityEntry[];

  assemblyLine: {
    currentSpec: string | null;
    stationProgress: {
      database: number;
      backend: number;
      frontend: number;
      testing: number;
    };
  };
}
```

---

## 7. Integration Points

### 7.1 With State Manager
- Read state.json for all data
- Subscribe to changes via file watcher

### 7.2 With Oracle (Phase 1)
- Display Oracle status
- Show intervention history
- Real-time intervention alerts

### 7.3 With Verification Theater (Phase 3)
- "Open Theater" button when available
- Status of verification runs
- Link to live browser view

---

## 8. Out of Scope

- Mobile-native app
- Historical analytics
- Multi-project view
- User authentication
- Persistence of preferences

---

## 9. Acceptance Criteria

### Phase 2 Complete When:
- [ ] Assembly line visualization renders correctly
- [ ] Specs move through stations visually
- [ ] Parallel specs shown as off-line stations
- [ ] Worker status updates in real-time
- [ ] Oracle panel shows status and interventions
- [ ] Activity feed updates live
- [ ] Click interactions work (spec, worker, station)
- [ ] WebSocket connection stable with reconnect
- [ ] Animations smooth (60fps)
- [ ] Dashboard opens automatically with /release-the-beast

---

*This SRD defines the Factory Floor Dashboard. Next: Technical specs and tasks.*
