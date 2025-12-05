# DevFactory v5.0 "Factory Floor" - Technology Stack

## Core Principle

We build on the existing DevFactory v4.5 foundation. We enhance, not replace.

---

## Existing Foundation (devfactory-distributed v4.5)

### Runtime
- **Node.js 18+**: JavaScript runtime
- **TypeScript 5.3+**: Type safety throughout

### Core Dependencies
```json
{
  "@anthropic-ai/sdk": "^0.71.1",    // Claude API for Oracle
  "chalk": "^4.1.2",                  // Terminal colors
  "chokidar": "^3.5.3",               // File watching
  "commander": "^11.1.0",             // CLI framework
  "express": "^4.18.2",               // HTTP server
  "proper-lockfile": "^4.1.2",        // File locking for state.json
  "socket.io": "^4.7.2",              // Real-time WebSocket
  "yaml": "^2.3.4",                   // YAML parsing
  "zod": "^4.1.13"                    // Schema validation
}
```

### Existing Components
- `src/cli.ts` - CLI entry point
- `src/orchestrator.ts` - Active orchestration loop
- `src/state-manager.ts` - State with file locking
- `src/oracle/oracle.ts` - Basic Oracle (to enhance)
- `dashboard/server.ts` - WebSocket dashboard server

---

## New Technology for v5.0

### Phase 1: Enhanced Oracle

**No new dependencies** - We enhance the existing Oracle using:
- Anthropic SDK (already installed)
- File system APIs (Node built-in)
- Existing state management

**Changes:**
- Oracle loads full project context
- Enhanced prompt engineering
- Intervention tracking in state.json

### Phase 2: Factory Floor Dashboard

**New Frontend Dependencies:**
```json
{
  "react": "^18.2.0",                 // UI framework
  "react-dom": "^18.2.0",             // React DOM rendering
  "@types/react": "^18.2.0",          // TypeScript types
  "@types/react-dom": "^18.2.0"       // TypeScript types
}
```

**Build Tools:**
```json
{
  "vite": "^5.0.0",                   // Fast bundler
  "@vitejs/plugin-react": "^4.2.0"   // React plugin for Vite
}
```

**Visualization:**
- SVG for assembly line graphics (no library - raw SVG)
- CSS animations for smooth transitions
- Canvas API for complex animations (if needed)

**Why These Choices:**
- React: Component-based, excellent for real-time updates
- Vite: Fastest build tool, great dev experience
- Raw SVG: Full control, no bloat for our specific needs

### Phase 3: Verification Theater

**New Dependencies:**
```json
{
  "playwright": "^1.40.0"             // Browser automation
}
```

**Why Playwright:**
- Best-in-class browser automation
- Supports headed mode (you can watch)
- Cross-browser support
- Excellent API

**Visualization:**
- VNC or screenshot streaming for live browser view
- WebSocket for real-time thought stream
- Reuse dashboard infrastructure

### Phase 4: Integration

**No new dependencies** - Just integration work.

---

## Project Structure

```
devfactory-v5/
├── .devfactory/              # DevFactory meta (specs for building DevFactory)
│   ├── product/
│   │   ├── mission.md
│   │   ├── roadmap.md
│   │   └── tech-stack.md
│   ├── specs/
│   │   ├── phase-1-oracle/
│   │   ├── phase-2-dashboard/
│   │   ├── phase-3-theater/
│   │   └── phase-4-integration/
│   └── beast/
│       └── state.json
│
├── packages/                  # Monorepo structure
│   ├── core/                 # Enhanced orchestrator & state
│   │   ├── src/
│   │   └── package.json
│   ├── oracle/               # Enhanced Oracle
│   │   ├── src/
│   │   └── package.json
│   ├── dashboard/            # Factory Floor Dashboard
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   └── theater/              # Verification Theater
│       ├── src/
│       └── package.json
│
├── package.json              # Root package.json (workspaces)
├── tsconfig.json             # Shared TypeScript config
└── README.md
```

**Note:** We may simplify this if monorepo adds unnecessary complexity. Start simple, refactor if needed.

---

## Integration Points

### With Existing DevFactory CLI Plugin

The CLI plugin (`~/.claude/plugins/devFactory/`) provides:
- Slash commands (/release-the-beast, etc.)
- Agent definitions
- User interface for Claude Code

v5.0 enhancements go into `devfactory-distributed` which the CLI plugin calls.

### Communication Flow

```
User → Claude Code → CLI Plugin → devfactory-distributed → State.json
                                          │
                                          ├─► Oracle (monitors, intervenes)
                                          ├─► Dashboard (visualizes)
                                          └─► Theater (verifies)
```

### State.json as Single Source of Truth

All components read from and write to `state.json` with proper locking.

---

## Development Environment

### Required
- Node.js 18+
- npm 9+
- tmux (for beast mode workers)
- Modern browser (Chrome/Firefox)

### Recommended
- VS Code with TypeScript extension
- Claude Code CLI

### Environment Variables
```bash
ANTHROPIC_API_KEY=sk-ant-...        # Required for Oracle
DEVFACTORY_DEBUG=true               # Optional verbose logging
```

---

## Testing Strategy

### Unit Tests
- Jest for core logic
- Test Oracle decision-making
- Test state transitions

### Integration Tests
- Test full flows (stuck → Oracle → unstuck)
- Test dashboard WebSocket updates
- Test verification scenarios

### E2E Tests
- Playwright for dashboard testing
- Full beast mode runs on sample project

---

## Performance Considerations

### Dashboard
- Efficient DOM updates (React reconciliation)
- Throttle WebSocket updates to 1/second max
- Lazy load historical data

### Oracle
- Cache project context (don't re-read every check)
- Debounce stuck detection
- Timeout on API calls

### State Management
- File locking prevents corruption
- Atomic writes for consistency
- Prune old activity entries

---

*This stack balances power with simplicity. We use proven tools and avoid unnecessary complexity.*
