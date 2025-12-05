# DevFactory v5.0 "Factory Floor" - Roadmap

## Release Strategy

We build this incrementally, with each phase delivering working functionality that enhances the previous.

---

## Phase 1: The Enhanced Oracle

**Objective**: Intelligent stuck-recovery that understands the full project context

### What We're Building
- Oracle loads complete project context (mission, roadmap, all specs, all tasks)
- Monitors workers for stuck states with configurable thresholds
- Provides targeted, context-aware assistance (not generic nudges)
- Can take over tasks if needed
- All interventions logged for learning

### Why This First
Before we make the system visible, we need it to be reliable. The Oracle ensures workers don't stay stuck, which is foundational for everything else.

### Success Criteria
- Oracle detects stuck state within 2 minutes
- Oracle interventions successfully unstick workers >70% of the time
- Full project context loaded and used in analysis
- Intervention history tracked

---

## Phase 2: Factory Floor Dashboard

**Objective**: Real-time visualization of the build process using assembly line metaphor

### What We're Building
- Browser-based real-time dashboard
- Assembly line visualization with specs as stations
- Parallel work shown as off-line stations
- Worker status cards showing current task
- Progress tracking per spec and overall
- Integration with existing WebSocket infrastructure

### Why Second
With the Oracle ensuring reliability, we can now make the process visible. This is the "observation deck" for the factory floor.

### Success Criteria
- Dashboard opens automatically with /release-the-beast
- Real-time updates via WebSocket
- Clear visual metaphor (assembly line)
- Parallel work clearly shown
- Non-developer can understand what's happening

---

## Phase 3: Verification Theater

**Objective**: Watch Opus 4.5 click through your app, finding and fixing issues

### What We're Building
- Headed Playwright browser (visible, not headless)
- Verification orchestrator that manages test scenarios
- Browser explorer agent that clicks through the app
- Thought stream showing Opus's reasoning
- Issue detection, fix, retry loop
- Theater UI integrated with Factory Floor

### Why Third
Once we have visibility into the build process, we extend visibility into verification. This is the "quality control station" at the end of the line.

### Success Criteria
- Visible browser window showing Opus clicking
- Real-time thought stream
- Issues detected trigger automatic fix attempts
- Integrates with Factory Floor dashboard
- Genuinely enjoyable to watch

---

## Phase 4: Integration & Polish

**Objective**: Seamless experience from planning to completion

### What We're Building
- /release-the-beast opens Factory Floor automatically
- Click-through navigation (spec → detail → verification)
- Oracle visibility in dashboard
- Completion celebrations
- Error recovery and resilience
- Documentation and onboarding

### Why Last
This ties everything together into a cohesive experience. Polish comes after core functionality works.

### Success Criteria
- End-to-end flow works without manual intervention
- Intuitive navigation
- Delightful experience
- System recovers gracefully from errors

---

## Future Vision (Beyond v5.0)

### v5.1: Learning Oracle
- Oracle learns from past interventions
- Pattern recognition for common issues
- Proactive suggestions

### v5.2: Multi-Project Factory
- Dashboard shows multiple projects
- Cross-project worker allocation
- Portfolio-level visibility

### v5.3: Cloud Deployment
- Host on Vercel
- Shareable dashboards
- Collaborative viewing

---

## Dependencies

```
Phase 1 (Oracle)
    │
    └──► Phase 2 (Factory Floor)
              │
              └──► Phase 3 (Verification Theater)
                        │
                        └──► Phase 4 (Integration)
```

Each phase builds on the previous. We don't skip ahead.

---

## Timeline Philosophy

We don't estimate time. We estimate scope and quality.

Each phase is done when:
1. All success criteria are met
2. Code is tested and working
3. Experience is smooth
4. We're proud of it

---

*Built with the DevFactory system, for the DevFactory system.*
