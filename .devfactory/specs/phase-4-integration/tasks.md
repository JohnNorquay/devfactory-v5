# Phase 4: Integration & Polish - Tasks

## Overview
Total tasks: 24
Layers: Database (0), Backend (10), Frontend (12), Testing (2)

---

## Backend Layer

### Automatic Launch

- [ ] 1.1 Add browser auto-launch to release-the-beast command
- [ ] 1.2 Implement cross-platform browser opening (Windows/WSL, Mac, Linux)
- [ ] 1.3 Add configuration for auto-open, browser choice, port

### Error Recovery

- [ ] 2.1 Implement dashboard server health check in orchestrator
- [ ] 2.2 Add automatic server restart on crash
- [ ] 2.3 Implement worker session recovery (detect dead, restart)
- [ ] 2.4 Add Oracle auto-restart on failure

### Reporting

- [ ] 3.1 Create ReportGenerator class
- [ ] 3.2 Implement HTML report template with timeline
- [ ] 3.3 Add per-spec breakdown to report
- [ ] 3.4 Implement `devfactory report` CLI command

### Notifications

- [ ] 4.1 Implement desktop notification system (node-notifier or native)
- [ ] 4.2 Add notification events for key milestones

---

## Frontend Layer

### Navigation Polish

- [ ] 5.1 Implement smooth spec modal open/close animations
- [ ] 5.2 Add "Open Verification" button to spec detail when applicable
- [ ] 5.3 Create "Back to Dashboard" button in Theater
- [ ] 5.4 Implement URL routing for deep links (dashboard, theater/:spec)

### Completion Celebrations

- [ ] 6.1 Create ConfettiAnimation component
- [ ] 6.2 Create CelebrationModal for build complete
- [ ] 6.3 Add spec completion animation on assembly line
- [ ] 6.4 Implement sound effects (optional, configurable)

### Error States

- [ ] 7.1 Create ReconnectingOverlay component
- [ ] 7.2 Implement graceful error boundaries
- [ ] 7.3 Create StuckTaskPanel showing Oracle interventions

### Polish

- [ ] 8.1 Add skeleton loaders for initial load
- [ ] 8.2 Improve assembly line animations (working effects, sparks)
- [ ] 8.3 Add progress number count-up animation
- [ ] 8.4 Polish all micro-interactions

### Help & Onboarding

- [ ] 9.1 Create HelpPanel component with section explanations
- [ ] 9.2 Create OnboardingTour for first-time users
- [ ] 9.3 Add tooltips to all status indicators
- [ ] 9.4 Create "What's this?" hover hints

---

## Testing Layer

- [ ] 10.1 Create E2E test for full flow (beast → dashboard → verification → report)
- [ ] 10.2 Create resilience tests (crash recovery scenarios)

---

## Task Dependencies

```
Backend:
1.1 → 1.2 → 1.3 (Auto launch)
2.1 → 2.2 → 2.3 → 2.4 (Recovery)
3.1 → 3.2 → 3.3 → 3.4 (Reporting)
4.1 → 4.2 (Notifications)

Frontend (requires Phase 2 + 3):
5.1 → 5.2 → 5.3 → 5.4 (Navigation)
6.1 → 6.2 → 6.3 → 6.4 (Celebrations)
7.1 → 7.2 → 7.3 (Errors)
8.1 → 8.2 → 8.3 → 8.4 (Polish)
9.1 → 9.2 → 9.3 → 9.4 (Help)

Testing (after all else):
10.1 → 10.2
```

---

## Verification Criteria

### Auto Launch (1.x)
- Browser opens on command
- Works on all platforms
- Configuration respected

### Recovery (2.x)
- Server restarts after kill
- Workers restart after crash
- No data loss

### Reporting (3.x)
- Report generates correctly
- HTML renders properly
- All data included

### Notifications (4.x)
- Desktop notifications appear
- Sound plays if enabled

### Navigation (5.x)
- All navigation paths work
- Animations smooth
- URLs work for sharing

### Celebrations (6.x)
- Confetti displays
- Modal shows on completion
- Sounds play correctly

### Errors (7.x)
- Reconnecting overlay shows
- Errors handled gracefully
- Stuck panel displays

### Polish (8.x)
- No loading flashes
- Animations at 60fps
- Professional feel

### Help (9.x)
- Tour works for new users
- Tooltips informative
- Help panel comprehensive

### Tests (10.x)
- Full flow passes
- Recovery tested

---

## Notes

- This phase depends on all previous phases being complete
- Focus is on user experience and reliability
- No new major features, just integration and polish
- Celebration effects should be tasteful, not overwhelming
