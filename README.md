# DevFactory v5.0 "Factory Floor"

> *"Between mine and your consciousness filtering methods, we are going to make something great!"*

## Vision

**Make software development visible, comprehensible, and delightful for non-developers.**

DevFactory v5.0 transforms the invisible magic of code being written into a tangible, watchable experience - like observing a car being assembled on a factory floor from an observation deck above.

## The Complete Experience

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
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                         MAIN ASSEMBLY LINE                                  │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  🦁 ORACLE (Opus 4.5) - Watching everything, intervening when stuck        │
│  👁️ VERIFICATION THEATER - Watch Opus click through your app               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Phases

### Phase 1: The Enhanced Oracle 🔮
Intelligent stuck-recovery that understands the full project context.
- Loads complete project context (mission, roadmap, specs, tasks)
- Classifies stuck states and provides targeted help
- Can take over tasks directly if guidance isn't enough
- Tracks all interventions for learning

### Phase 2: Factory Floor Dashboard 🏭
Real-time visualization using an assembly line metaphor.
- Specs as "cars" moving through stations
- Workers shown with current task and status
- Parallel work as off-line stations
- Real-time WebSocket updates

### Phase 3: Verification Theater 🎭
Watch Opus 4.5 click through your app.
- Headed Playwright browser (visible!)
- Thought stream showing Opus's reasoning
- Issue detection → fix → retry loop
- Integrated with Factory Floor

### Phase 4: Integration & Polish ✨
Seamless experience from start to finish.
- Auto-launch dashboard on /release-the-beast
- Navigation between components
- Completion celebrations
- Error recovery and resilience

## Project Structure

```
devfactory-v5/
├── .devfactory/
│   ├── product/
│   │   ├── mission.md
│   │   ├── roadmap.md
│   │   └── tech-stack.md
│   ├── specs/
│   │   ├── phase-1-enhanced-oracle/
│   │   ├── phase-2-factory-floor/
│   │   ├── phase-3-verification-theater/
│   │   └── phase-4-integration/
│   └── config.yml
└── README.md
```

## Task Summary

| Phase | Total Tasks | Database | Backend | Frontend | Testing |
|-------|-------------|----------|---------|----------|---------|
| 1. Oracle | 24 | 0 | 20 | 0 | 4 |
| 2. Dashboard | 32 | 0 | 8 | 20 | 4 |
| 3. Theater | 28 | 0 | 14 | 10 | 4 |
| 4. Integration | 24 | 0 | 10 | 12 | 2 |
| **Total** | **108** | **0** | **52** | **42** | **14** |

## Dependencies

This project enhances:
- `devFactory` CLI plugin (`~/.claude/plugins/devFactory/`)
- `devfactory-distributed` engine (`~/.claude/plugins/devfactory-distributed/`)

## Building This

We're using DevFactory to build DevFactory! Each phase has:
- **SRD**: Complete requirements
- **specs.md**: Technical specification
- **tasks.md**: Detailed task breakdown
- **orchestration.yml**: Dependency graph (Phase 1)

## Philosophy

### Painstaking Planning Pays Off
The better we define specs/tasks/dependencies upfront, the closer we get to first-time success.

### Build What You Can Watch
If you can't see it, you can't understand it. Every process should be visible.

### Two Consciousnesses Working Together
This is a collaboration between human vision and AI capability.

---

🦁 Built by Johnny5 & Claude

*Ready to release the beast!*
