# Design: Curated Study Resources (*Vem, e Segue-Me*) & Sparse Chapter Cross-References

**Date:** 2026-11-24  
**Status:** Proposed (awaiting user approval)  
**Scope:** Curated study resource links (`study_resources.json`) + curated cross-reference expansion for sparse key chapters (especially **Jacob 5** / **Jacó 5**).

---

## 1. Intent & Why

Key doctrinal chapters in the Book of Mormon — most notably **Jacob 5** (Allegory of the Olive Trees, 77 verses with `0` internal and `1` external connection today), along with **Enos**, **Mosiah 2–5**, **Alma 32 / 40–42**, **Ether 12**, and **Moroni 7 / 10** — currently have very sparse or empty connection panels in the app.  

Adding:
1. A curated layer of official Church study links (*Come, Follow Me / Vem, e Segue-Me* 2024 Book of Mormon manual, Gospel Topics, and related official scripture/manual links) for key passages, and
2. Curated internal + biblical cross-references for **Jacob 5** and other sparse doctrinal chapters

lets users both **see the doctrinal web in the diagrams** (Bridge, Sacred Ring, Threads) and **open authoritative explanatory material** in one click in Portuguese (`?lang=por`) or English (`?lang=eng`).

## 2. Goals, Non-Goals & Anti-Goals

- **Goals:**
  - Introduce `public/data/study_resources.json` as a decoupled, validated data source for curated study links.
  - Render a compact **"Deepen Study / Aprofundar Estudo"** card in the verse `study-panel` (and a compact pill/link in the `Threads` chapter header when reading a curated chapter).
  - Add curated cross-references (internal Book of Mormon + external Holy Bible/D&C) for **Jacob 5** and key sparse chapters (Jacob, Enos, Mosiah, Alma, Helaman, Ether, Moroni) with full bilingual (`note` + `notePt`) explanations.
  - Validate the new JSON and all added references in `scripts/test_dataset.js` (`npm test`) and precache `study_resources.json` in `public/sw.js`.
- **Non-Goals:**
  - Do not auto-generate generic *Come, Follow Me* links for all 239 chapters or all 6,604 verses.
  - Do not scrape or embed copyrighted manual body text inside the app — link out cleanly to `churchofjesuschrist.org` with language-aware `?lang=por` / `?lang=eng`.
- **Anti-Goals:**
  - Cluttering every verse card with generic links when no curated study resource applies.
  - Hardcoding editorial content inside `src/main.js` instead of `public/data/`.

## 3. Constraints

- 100% static client-side Vite + Vanilla JS application (hosted on Vercel + GitHub Pages with relative `./` paths).
- Bilingual parity (`en` and `pt-BR`) for all titles, summaries, notes, and Church URLs (`?lang=eng` vs `?lang=por`).
- `npm test` (`scripts/test_dataset.js`) must validate every verse ID (`1..6604`), required bilingual fields, and valid `https://www.churchofjesuschrist.org/...` URLs.

## 4. Approaches Considered

- **Approach A (Selected): Dedicated `public/data/study_resources.json` + Curated Expansion of `cross_references.json` & `external_references.json`**
  - *Trade-offs:* Adds one small static JSON (~5–10 KB) loaded in `init()`, keeps editorial study resources cleanly separated from `literary_structures.json` and `main.js`, and directly fills empty diagram arcs in Jacob 5 and other sparse chapters.
- **Approach B: Embed `studyLinks` inside `literary_structures.json` & `FEATURED_CONNECTIONS`**
  - *Trade-offs:* Avoids a new JSON file, but couples curriculum links to literary structures (leaving out non-chiastic chapters like Jacob 5 unless forced into `FEATURED_CONNECTIONS` in JS). Rejected.
- **Approach C: Full 52-week *Come, Follow Me* mapping for all 239 chapters**
  - *Trade-offs:* Covers every chapter, but conflicts with the user's choice for a curated complement on key points and requires bulk URL verification. Rejected.

## 5. Architecture & Data Design

### 5.1 `public/data/study_resources.json`
Each entry targets a book/chapter (and optional verse range) so it activates both when inspecting any verse in that passage and when reading that chapter in `Threads`:

```json
[
  {
    "id": "jacob-5-olive-tree",
    "book": "Jacob",
    "chapter": 5,
    "verseStart": 1,
    "verseEnd": 77,
    "titleEn": "Allegory of the Olive Trees",
    "titlePt": "Alegoria das Oliveiras",
    "summaryEn": "Come, Follow Me (Jacob 5–7): How the Lord labors alongside His servants to nourish, gather, and redeem Israel.",
    "summaryPt": "Vem, e Segue-Me (Jacó 5–7): Como o Senhor trabalha com Seus servos para nutrir, coligar e redimir Israel.",
    "links": [
      {
        "labelEn": "Come, Follow Me: Jacob 5–7",
        "labelPt": "Vem, e Segue-Me: Jacó 5–7",
        "type": "manual",
        "urlBase": "https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-book-of-mormon-2024/15"
      }
    ]
  }
]
```
*(Exact lesson numbers/URLs for each curated Come, Follow Me 2024 outline will be verified against `churchofjesuschrist.org` during implementation.)*

- Language parameter (`?lang=por` when `getLang() === "pt"`, `?lang=eng` otherwise) is appended dynamically at render time, matching `getChurchStudyUrl()`.

### 5.2 Curated Cross-References Expansion
- **Jacob 5 (Allegory of the Olive Trees):**
  - *Internal (`cross_references.json`):* Connect key verses in Jacob 5 to `1 Nephi 10:12-14` (natural vs. wild olive tree), `1 Nephi 15:12-18` (grafting & restoration of Israel), `Jacob 6:1-7` (Zenos's allegory applied by Jacob), `2 Nephi 29:1-2`, `3 Nephi 21:1-7`.
  - *External (`external_references.json` + `external_verses.json`):* `Isaiah 5:1-7` (vineyard of the Lord), `Romans 11:17-24` (wild olive branch grafted in), `Jeremiah 11:16` (green olive tree), `D&C 101:43-62` (parable of the vineyard and nobleman).
- **Other Sparse Key Chapters (Targeted Batch):**
  - `Enos 1` (prayer/wrestling with God ↔ `Genesis 32:24-30`, `Alma 36:18-20`)
  - `Mosiah 2–5` (King Benjamin's covenant ↔ `1 Samuel 12`, `Acts 4:12`)
  - `Alma 32` (seed of faith ↔ `Matthew 13:31-32`, `Hebrews 11:1`)
  - `Alma 40–42` (resurrection & justice/mercy ↔ `1 Corinthians 15:42-54`, `Romans 3:23-26`)
  - `Ether 12` (faith & weakness made strong ↔ `Hebrews 11:1-6`, `2 Corinthians 12:9`)
  - `Moroni 7` & `Moroni 10` (charity & Spirit's gifts ↔ `1 Corinthians 13`, `1 Corinthians 12:4-11`, `James 1:5`)

### 5.3 UI Integration (`index.html`, `src/main.js`, `src/style.css`, `src/i18n.js`)
- **Study Panel (`#studyResourcesBox`):** Placed right below `#literaryStructureBox` (or alongside it), hidden when no `study_resources.json` entry matches the selected verse. Displays the curated title, bilingual summary, and 1–2 clickable resource buttons (`min-height: 44px` for mobile touch ergonomics) opening in a new tab.
- **Threads Chapter Header:** When `threadsCurrentBookId` + `threadsCurrentChapter` matches a curated entry, render a subtle pill link (`📖 Vem, e Segue-Me ↗`) in `.threads-chapter-header`.

### 5.4 Testing & Service Worker
- Update `scripts/test_dataset.js` to validate `study_resources.json` (valid book name, chapter/verse bounds, `titleEn`/`titlePt`, `summaryEn`/`summaryPt`, non-empty `links` with `https://www.churchofjesuschrist.org/`).
- Add `./data/study_resources.json` to `STATIC_PRECACHE` in `public/sw.js` and bump `CACHE_NAME` to `bom-crossref-v4`.
