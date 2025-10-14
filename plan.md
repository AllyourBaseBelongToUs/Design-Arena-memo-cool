# Product Delivery Plan — Revision October 14, 2025

## Roadmap at a Glance
| Horizon | Workstream | Desired Outcome | Target Date | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Sprint 0 | Experience polish | Branded shell with coherent typography | Oct 21, 2025 | ⚪ Not started | No design sign-off required; copy pending. |
| Sprint 0 | Quality guardrails | Regression-safe scheduling algorithm backed by tests | Oct 24, 2025 | ⚪ Not started | Needs Vitest harness + sample fixtures. |
| Sprint 1 | Authoring UX | Low-friction card creation with validation + multiline support | Oct 31, 2025 | ⚪ Not started | Requires minor UI redesign. |
| Sprint 2 | Deck ops | Import/export pipeline with version stamp | Nov 14, 2025 | ◐ In discovery | Define file schema + error states. |
| Sprint 2 | Insights | Lightweight review analytics (daily graph + accuracy) | Nov 21, 2025 | ⚪ Not started | Depends on event logging. |

Legend: ⚪ Not started · ◐ In discovery · ◑ In progress · ✅ Complete

## Immediate Workstream Briefs (Sprint 0)
1. **Brand & Layout Cohesion**
   - **Tasks:** Update `src/app/layout.tsx` metadata, align `globals.css` to use Geist tokens, audit header copy for consistency.
   - **Success criteria:** Browser title/description reflect product voice; no conflicting font declarations; lighthouse branding score > 90.
   - **Dependencies:** Copy approval from product; verify Tailwind config covers new tokens.
2. **Scheduling Guardrails**
   - **Tasks:** Create `src/lib/spacedRepetition.test.ts` with cases for `scheduleCard`, `getDueCards`, `getUpcomingCards`, `nextDueIn`.
   - **Success criteria:** Tests cover minimum ease factor, repeated `again`, large intervals, chronological sorting; `npm run test` green in CI.
   - **Dependencies:** Potential Vitest config tweak for JSX/TS paths; sample deck fixtures.
3. **Authoring UX Enhancements**
   - **Tasks:** Add inline validation messaging, convert answer prompt to textarea with auto-resize, ensure image errors persist until resolved.
   - **Success criteria:** Form prevents empty submissions with visible feedback; multiline answers render without layout shift; a11y check passes for screen reader labels.

## Near-Term Initiatives (Next 4–6 Weeks)
- **Deck Management Backbone:** Define file schema, surface import/export CTA near card list, add confirmation modals, and log version metadata for migrations.
- **Progress Insights Panel:** Capture per-review events into lightweight log (localStorage), render 7-day sparkline, accuracy breakdown by grade, and streak counter.
- **Responsive & Accessibility Audit:** Adjust CSS grid breakpoints for ≤360 px, add `focus-visible` styles, integrate keyboard shortcuts (1–4 for grading), ensure color contrast AA.

## Discovery / Stretch Goals
- Evaluate optional sync targets (Supabase or local API route) while retaining offline-first behavior.
- Introduce configurable spaced repetition knobs (ease adjustments, leech suspension rules) exposed in a settings modal.
- Curate onboarding deck templates and checklist to guide first-time users through adding custom content.

## KPIs & Instrumentation
- **Activation:** % of new sessions creating ≥3 custom cards.
- **Retention:** Rolling 7-day review streak count per user.
- **Quality:** Automated test coverage for scheduling utilities ≥85%.
- **Performance:** Time-to-interactive under 2.0s on mobile (Lighthouse).
- Logging roadmap: extend local analytics to optionally sync when backend arrives.

## Risks & Mitigations
- **ID collisions on import/export:** Include UUID v4 + timestamp namespace; validate before insert.
- **Test environment drift:** Standardize on Vitest + jsdom; add npm script alias and document setup in README.
- **UI regressions on small screens:** Pair code changes with responsive snapshot tests (e.g., percy/playwright) once budget allows.

## Open Questions
- Should branded metadata match marketing site naming (“Design Arena Trainer” vs. “Spaced App”)?
- Is there a requirement to hide answers by default in the library (privacy mode vs. quick review)?
- Do we anticipate sharing decks publicly (needs moderation pipeline)?
