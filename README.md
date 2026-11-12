# Book of Mormon Cross-References | Interactive Visualizer

An interactive, high-performance web visualization exploring biblical cross-references, prophecy fulfillments, quotations, and doctrinal parallels across all **15 books**, **239 chapters**, and **6,604 verses** of the Book of Mormon.

Inspired by Chris Harrison & Christoph Römhild's classic 2007 arc diagram and [trekhleb/bible-cross-references](https://github.com/trekhleb/bible-cross-references), redesigned from the ground up for modern web standards using Vanilla JavaScript, HTML5 Canvas 2D, and Swiss Modernist / Scholarly typography.

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## 📸 Screenshots

### 1. Dual Bridge View (Bible ↔ Book of Mormon)
*A bi-testamental bridge linking Old & New Testament scriptures (top rail) to the Book of Mormon (bottom rail) via glowing Bézier beams.*

![Dual Bridge View](docs/screenshots/dual-view.png)

---

### 2. Sacred Ring View (Mandala Chord Ring)
*Circumferential chord diagram inspired by sacred geometric rings, with internal cross-references criss-crossing a radiant core.*

![Sacred Radial Ring View](docs/screenshots/radial-view.png)

---

### 3. Interactive Book Zoom & Chapter Timeline
*Selecting any specific book expands the diagram to 100% width, transforming the axis into an interactive chapter-by-chapter timeline.*

![Zoomed-in Book View](docs/screenshots/zoomed-book.png)

---

## ✨ Key Features

- **Multi-Mode Visualizations:**
  - **Bridge (Bible ↔ BOM):** Dual-rail architecture revealing the harmonizing threads between biblical texts (Isaiah, Matthew, Luke, John, Psalms, Revelation) and Book of Mormon revelations.
  - **Sacred Ring:** 360-degree radial mandala with curved chord beams and real-time scripture stats in the center orb.
- **Deep Book Zoom Mode:**
  - Select any book (e.g. *2 Nephi*, *Alma*, *3 Nephi*) to zoom in with generous verse spacing.
  - Interactive chapter timeline showing proportional verse distribution.
  - Click any chapter (`Ch 1`, `Ch 2`, etc.) to jump straight to its opening verse.
  - 1-click `↺ Reset Zoom` button to return to the full 15-book canon.
- **Magnetic Snapping & Hotspots:**
  - Cursor magnetically snaps within 20px to the nearest connected verse, preventing missed clicks.
  - Glowing hotspot dots mark verses that carry significant theological connections.
- **Sequential Connection Tour:**
  - Step through hundreds of cross-references sequentially using `◀ Previous`, `Next ▶`, or `🎲 Random`.
  - Book-aware counter adapts when zoomed (e.g. `12 / 431 in 2 Nephi`).
- **Bilingual Interface (i18n):**
  - Instant 1-click toggle between **English** and **Português**.
- **Official Scripture Study Links:**
  - Direct contextual links to read every passage on [ChurchofJesusChrist.org](https://www.churchofjesuschrist.org/study/scriptures/bofm).
- **100% Static & Free to Host:**
  - Zero server requirements, 0 API dependencies, instant load times, 100% compatible with Vercel Hobby tier.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** Vanilla JavaScript (ES Modules), HTML5 Canvas 2D, Modern CSS3 with CSS custom properties.
- **Design Intelligence:** Scholarly Editorial & Swiss Modernism 2.0 system (WCAG AA 4.5:1 contrast, Cinzel & Cormorant Garamond typography, 44px touch targets).
- **Tooling:** [Vite](https://vitejs.dev/) for sub-second development HMR and optimized production bundling (< 30 kB compressed).
- **Data Engineering:**
  - `data/verses_en.json`: All 6,604 verses of the Book of Mormon with book, chapter, and text.
  - `data/books.json`: Metadata for all 15 books with chapter pagination and color palettes.
  - `data/cross_references.json`: Curated internal fulfillments, prophecies, typologies, and citations.
  - `data/external_references.json`: Canonical biblical parallels connecting to OT and NT passages.

---

## 🚀 Getting Started Locally

```bash
# 1. Clone the repository
git clone https://github.com/msantana-01/book-of-mormon-cross-references.git
cd book-of-mormon-cross-references

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Build production static bundle
npm run build
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## ☁️ Deploy to Vercel (1-Click)

This repository includes a production-ready `vercel.json` configured with caching headers and build commands.

1. Push this repository to your GitHub account.
2. Visit [vercel.com/new](https://vercel.com/new).
3. Import this repository.
4. Click **Deploy**. Vercel will deploy the static build in seconds at `*.vercel.app`.

---

## 📜 Data Sources & Legal Attribution

- **Scripture Text:** Public domain records provided by the [LDS Documentation Project / scriptures.nephi.org](https://scriptures.nephi.org/) (maintained by `@beandog`).
- **Cross-Reference Corpus:** Curated open datasets from `wordtreefoundation/bomdb` and open scripture scholarship.
- **License:** [MIT License](LICENSE) © 2026.
