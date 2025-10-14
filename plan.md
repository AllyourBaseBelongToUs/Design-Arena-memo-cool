# Implementation Plan (Updated October 14, 2025)

## Immediate Priorities
1. **Brand the shell**
   - Replace default Next metadata in `src/app/layout.tsx` with product-specific title/description.
   - Align global font usage: apply Geist to `body` in `globals.css` or remove redundant system font declaration.
2. **Strengthen scheduling correctness**
   - Add unit coverage in `src/lib/spacedRepetition.test.ts` for `scheduleCard`, `getDueCards`, `getUpcomingCards`, and `nextDueIn`.
   - Include edge cases (minimum ease factor, repeated `again` reviews, large intervals) to guard against regressions.
3. **Improve authoring UX**
   - Validate prompt/answer inputs with inline helper text; surface error state when fields are blank on submit instead of silently returning.
   - Allow multiline answers via `<textarea>` or auto-resize inputs; current single-line input hampers long-form content.

## Near-Term Enhancements
1. **Deck management**
   - Implement JSON import/export so users can back up or share decks; store version metadata for future migrations.
2. **Progress insights**
   - Create analytics sidebar summarizing daily reviews, accuracy by grade, and streaks using session history.
3. **Responsiveness & accessibility**
   - Audit layout below 360 px width; adjust grid breakpoints to avoid card overflow.
   - Add focus-visible styles and keyboard shortcuts (e.g., number keys) for grading buttons.

## Stretch Goals
- Explore server-side sync option (Supabase, local API route) while keeping offline-first behavior.
- Introduce spaced-repetition settings (ease adjustments, leech suspension) surfaced via modal.
- Package deck templates and onboarding checklist for first-time users.

## Dependencies & Risks
- Export/import work will need deterministic ID handling to avoid collisions.
- Additional Tailwind layers may require enabling CSS nesting/postcss updates; watch bundle size.
- Testing suite uses Vitest + jsdom; ensure utilities remain browser-safe when reusing in tests.
