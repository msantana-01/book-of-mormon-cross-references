# Design: Study Trail (Breadcrumb Research History)

**Date:** 2026-11-26  
**Size:** Small change  
**Status:** Proposed (awaiting user approval)

## 1. Intent & Why
When researching cross-references in sequence (`Alma 32:21 → Ether 12:6 → Moroni 7:45`), `selectVerse()` currently overwrites the active verse, causing researchers to lose where they started. A visible, non-destructive Study Trail lets users see their research path and step back or forward at any time.

## 2. Goals & Non-Goals
- **Goals:** Track visited verses in a non-destructive history list (`studyTrail` + `trailIndex`) persisted in `sessionStorage`, rendered as a compact breadcrumb bar at the top of `#studyPanel` once 2+ verses have been visited.
- **Non-Goals:** No URL encoding (`?trail=...`), no cross-day `localStorage` persistence, and no modification to `public/data/*.json`.

## 3. Approach Selected
- **Approach A (Non-destructive cursor + `sessionStorage`):** Stepping back (`← Back` or clicking an earlier chip) moves `trailIndex` without deleting forward steps; navigating to a new verse from an earlier position truncates only the obsolete forward branch and appends the new verse. Capped at 20 items, bilingual (`en` / `pt`), and mobile-friendly (`44px` touch targets, hidden horizontal scrollbar).
- **Alternatives rejected:** Approach B (destructive stack that drops forward steps on back click); Approach C (`localStorage` + URL-encoded trail).

## 4. Implementation Touchpoints
- `index.html`: Add `#studyTrailBar` container inside `#studyPanel` above `.panel-header` (`display: none` by default).
- `src/i18n.js`: Add `studyTrailLabel`, `studyTrailBack`, `studyTrailClear` in `en` and `pt`.
- `src/main.js`: Manage `studyTrail`, `trailIndex`, `sessionStorage` sync, `pushToStudyTrail()`, `jumpToTrailIndex()`, and `renderStudyTrail()`. Guard `selectVerse()` with `{ fromTrail: true }` when jumping via the trail so it does not re-push.
- `src/style.css`: Style `.study-trail-bar`, `.study-trail-chip` (active + forward-dimmed states), `.study-trail-btn`, and mobile horizontal scroll (`scrollbar-width: none`, `min-height: 44px`).
