# Design: Coverage Batch 1 (Jarom, Omni, Words of Mormon, 4 Nephi)

**Date:** 2026-11-26  
**Size:** Small data + resource batch  
**Status:** Approved (Approach A, least-work-first batch order)

## 1. Intent & Why
Jarom (15v), Omni (30v), Words of Mormon (18v), and 4 Nephi (49v) currently have `0` internal cross-references and only `1–2` external references each. Filling these four 1-chapter books eliminates empty books in the visualization before tackling medium and large books.

## 2. Scope & Deliverables
- **`public/data/cross_references.json`:** Add curated internal Book of Mormon connections across Jarom, Omni, Words of Mormon, and 4 Nephi (all with bilingual `note` + `notePt`).
- **`public/data/external_references.json` & `public/data/external_verses.json`:** Add parallel Holy Bible passages (`Galatians 3:24`, `Hebrews 10:1`, `Psalm 127:1`, `Psalm 133:1`, `Acts 2:44`, `Acts 4:32`, `John 17:21`) with bilingual notes and EN+PT scripture text.
- **`public/data/study_resources.json`:** Add curated *Come, Follow Me 2024* lessons for `Jarom 1`, `Omni 1`, `Words of Mormon 1` (`/16`), and `4 Nephi 1` (`/43`).
- **Validation:** Verified with `npm test` (`scripts/test_dataset.js`), `npm run build`, and live browser inspection.
