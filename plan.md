# Execution Backlog — October 14, 2025

## Sprint 0 (Oct 14 – 21): In Flight

### Card Library Privacy
- [x] Document desired privacy behavior (global toggle defaults to hidden, per-card reveal allowed).
- [x] Implement global “Show answers” toggle in `src/app/page.tsx` with localStorage persistence.
- [x] When hidden, replace answer text with placeholder state and lock icon for clarity.
- [x] Add per-card “Reveal once” control that respects the global hidden default.
- [ ] Verify layout at 320 px width and dark mode for new controls.

### App Shell Polish (No renaming)
- [ ] Update `src/app/layout.tsx` metadata (title/description) while keeping the product name “Spaced Repetition Trainer”.
- [ ] Remove redundant system font declaration in `src/app/globals.css`; ensure Geist fonts cascade properly.
- [ ] Manual QA pass on header copy and Lighthouse quick check for branding/accessibility regressions.

### Scheduling Safeguards
- [ ] Set up Vitest environment for library utilities (alias + jsdom config).
- [ ] Add tests for `scheduleCard` covering `again`, `hard`, `good`, `easy`, and minimum ease factor.
- [ ] Add tests for `getDueCards`/`getUpcomingCards` ordering and tie-breaking by creation time.
- [ ] Add tests for `nextDueIn` edge cases (due now, <1 min, multi-day).
- [ ] Update `README.md` with testing instructions and expected command output.

## Sprint 1 (Oct 22 – Nov 4): Queued

### Deck Management (Private Use Only)
- [ ] Define JSON schema for export (card fields + version stamp).
- [ ] Implement export action (download JSON) with confirmation toast.
- [ ] Implement import flow with validation, duplicate ID handling, and rollback on parse errors.
- [ ] Add unit coverage for import/export helpers.

### Authoring UX Enhancements
- [ ] Add inline validation helpers for prompt/answer and preserve error state after submit attempts.
- [ ] Improve textarea UX (auto-resize or character guidance) for long-form answers.
- [ ] Persist image upload errors until resolved; add retry guidance.

## Sprint 2 (Nov 5 – 21): Future

### Insights & Analytics
- [ ] Capture per-review events into lightweight local log (date, grade, interval delta).
- [ ] Render 7-day review count sparkline and grade distribution in dashboard sidebar.
- [ ] Track session streak counter and surface daily streak chip in header.

### Responsive & Accessibility Audit
- [ ] Audit small-screen breakpoints, adjust grid templates, and add snapshot notes.
- [ ] Introduce `focus-visible` styles and keyboard shortcuts (1–4) for grading buttons.
- [ ] Validate color contrast AA across new components.

## Deferred Upgrades
- Public deck sharing and moderation pipeline (documented but explicitly out of current scope).
- Optional sync (e.g., Supabase) once offline-first behavior is solidified.

## Metrics & Observability Targets
- **Activation:** % of sessions adding ≥3 custom cards.
- **Review cadence:** Average reviews completed per active day (from local log).
- **Quality:** ≥85 % automated coverage on scheduling utilities.
- **Performance:** Mobile time-to-interactive < 2 s (Lighthouse sample runs).

## Open Questions
- Do we need quick actions to bulk-hide answers or archive cards from the library view?
- Should privacy toggles sync across devices (if/when sync lands) or remain device-local?
