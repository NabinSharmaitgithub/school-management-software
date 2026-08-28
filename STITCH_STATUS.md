# Stitch — School Management Glassmorphism

**Status: Stitch project DELETED (2026-08-28).** The Stitch MCP server kept timing out / dropping the socket on every `generate_screen_from_text` call, and screens were not persisting (verified 2.1 wasn't created across 3 attempts). The `School Management System - Glassmorphism` project (`projects/5364275557773943101`) was removed by user request.

**Design systems / screens are gone.** If re-created later, the design system is documented below for reference.

## Prior Design System (for recreation)
- Design System: `assets/4004594699595954264` — Glassmorphism School (Inter, #6366F1, VIBRANT, ROUND_TWELVE, LIGHT)
- Full `designMd` (colors, typography, components) preserved in historical git history.
- Previously exported (now lost): 1.1 Login (`aa2b42ec...`), 1.2 Forgot/Reset (`d2a35f...`/`88a0f9...`), 1.3 ×4 dashboards (`dfdd5f7a...` Admin, `03f190...` Teacher, `9f42c7...` Student, `dab783...` Parent).

## Local Screens (source of truth now)
All 46 screens exist as **glassmorphism HTML** in `/screens/*.html` (Tailwind glass tokens: rgba 12%, blur 24px, border white/20, rounded 24px, Inter, indigo/violet/teal). These match the design system and are the working UI.

- `screens/index.html` — grid preview of all screens.
- They interface with Firebase (now default backend): Firestore collections `classes`, `students`, `subjects`, `marks`.

## Design System Prompt (reusable if Stitch is re-enabled)
Essence: frosted-glass cards (rgba white 12%), backdrop-blur 20-40px, 1px translucent border rgba white 20%, rounded 24px; ambient indigo/violet/teal blurred blobs; primary #6366F1–#8B5CF6, teal success, amber warn, rose error, slate text; Inter; desktop-first responsive; fixed glass sidebar nav + top bar with search/bell/profile; pill glass buttons, glass modals, glass tables with translucent row tints; gradient charts in glass; WCAG AA contrast. (Full 312-line prompts in `STITCH_PROMPTS.md`.)

## Next
`STITCH_PROMPTS.md` still holds all 32 screen prompts for regenerating in Stitch when the MCP integration is stable. For now build from the `/screens/*.html` placeholders → Next.js components.
